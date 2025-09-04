import { createClient, RedisClientType } from 'redis';
import { LRUCache } from 'lru-cache';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

/**
 * CacheService - Multi-tier caching implementation for Helix
 * 
 * Tier Architecture:
 * - L1: In-memory LRU cache (100 entries, 5-min TTL)
 * - L2: ElastiCache Redis (24-hour TTL)
 * 
 * Features:
 * - Write-through cache invalidation
 * - Cache warming on-demand
 * - CloudWatch metrics for cache performance
 * - Automatic failover to lower tiers
 */

export interface CacheOptions {
  ttl?: number; // TTL in seconds
  tier?: 'L1' | 'L2' | 'ALL';
}

export class CacheService {
  private l1Cache: LRUCache<string, any>;
  private redisClient: RedisClientType | null = null;
  private cloudWatchClient: CloudWatchClient;
  private readonly defaultTTL = 86400; // 24 hours
  private isRedisConnected = false;
  
  constructor(
    private readonly redisEndpoint?: string,
    private readonly redisPort: number = 6379,
    region: string = process.env.AWS_REGION || 'us-west-2'
  ) {
    // Initialize L1 cache
    this.l1Cache = new LRUCache<string, any>({
      max: 100,
      ttl: 1000 * 60 * 5, // 5 minutes
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      fetchMethod: async (key: string) => {
        // Fetch from L2 if not in L1
        return this.getFromRedis(key);
      },
    });
    
    // Initialize CloudWatch client
    this.cloudWatchClient = new CloudWatchClient({ region });
    
    // Initialize Redis connection if endpoint provided
    if (this.redisEndpoint) {
      this.initializeRedis();
    }
  }
  
  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        socket: {
          host: this.redisEndpoint,
          port: this.redisPort,
          reconnectStrategy: (retries: number) => {
            if (retries > 5) {
              console.error('Redis connection failed after 5 retries');
              this.isRedisConnected = false;
              return null; // Stop retrying
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });
      
      // Error handling
      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isRedisConnected = false;
        this.recordMetric('RedisConnectionError', 1);
      });
      
      this.redisClient.on('connect', () => {
        console.log('Redis Client Connected');
        this.isRedisConnected = true;
        this.recordMetric('RedisConnectionSuccess', 1);
      });
      
      this.redisClient.on('reconnecting', () => {
        console.log('Redis Client Reconnecting');
        this.isRedisConnected = false;
      });
      
      await this.redisClient.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isRedisConnected = false;
    }
  }
  
  /**
   * Get value from cache
   */
  async get(key: string, options: CacheOptions = {}): Promise<any> {
    const startTime = Date.now();
    const tier = options.tier || 'ALL';
    
    // Try L1 first
    if (tier === 'L1' || tier === 'ALL') {
      const l1Value = this.l1Cache.get(key);
      if (l1Value !== undefined) {
        await this.recordMetric('L1CacheHit', 1);
        await this.recordMetric('CacheGetLatency', Date.now() - startTime);
        return l1Value;
      }
    }
    
    // Try L2 (Redis)
    if ((tier === 'L2' || tier === 'ALL') && this.isRedisConnected) {
      const l2Value = await this.getFromRedis(key);
      if (l2Value !== undefined) {
        // Populate L1 on L2 hit
        if (tier === 'ALL') {
          this.l1Cache.set(key, l2Value);
        }
        await this.recordMetric('L2CacheHit', 1);
        await this.recordMetric('CacheGetLatency', Date.now() - startTime);
        return l2Value;
      }
    }
    
    // Cache miss
    await this.recordMetric('CacheMiss', 1);
    await this.recordMetric('CacheGetLatency', Date.now() - startTime);
    return undefined;
  }
  
  /**
   * Set value in cache (write-through)
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const startTime = Date.now();
    const tier = options.tier || 'ALL';
    const ttl = options.ttl || this.defaultTTL;
    
    // Set in L1
    if (tier === 'L1' || tier === 'ALL') {
      this.l1Cache.set(key, value, {
        ttl: Math.min(ttl * 1000, 300000), // Max 5 minutes for L1
      });
    }
    
    // Set in L2 (Redis)
    if ((tier === 'L2' || tier === 'ALL') && this.isRedisConnected) {
      await this.setInRedis(key, value, ttl);
    }
    
    await this.recordMetric('CacheSetLatency', Date.now() - startTime);
  }
  
  /**
   * Delete from cache (invalidation)
   */
  async delete(key: string): Promise<void> {
    // Delete from L1
    this.l1Cache.delete(key);
    
    // Delete from L2
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
        await this.recordMetric('CacheInvalidation', 1);
      } catch (error) {
        console.error('Failed to delete from Redis:', error);
      }
    }
  }
  
  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    // Clear L1
    this.l1Cache.clear();
    
    // Clear L2
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.flushDb();
        await this.recordMetric('CacheCleared', 1);
      } catch (error) {
        console.error('Failed to clear Redis:', error);
      }
    }
  }
  
  /**
   * Batch get from cache
   */
  async mget(keys: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const missingKeys: string[] = [];
    
    // Check L1 first
    for (const key of keys) {
      const value = this.l1Cache.get(key);
      if (value !== undefined) {
        results.set(key, value);
      } else {
        missingKeys.push(key);
      }
    }
    
    // Check L2 for missing keys
    if (missingKeys.length > 0 && this.isRedisConnected && this.redisClient) {
      try {
        const redisValues = await this.redisClient.mGet(missingKeys);
        
        for (let i = 0; i < missingKeys.length; i++) {
          const value = redisValues[i];
          if (value) {
            const parsed = JSON.parse(value);
            results.set(missingKeys[i], parsed);
            // Populate L1
            this.l1Cache.set(missingKeys[i], parsed);
          }
        }
      } catch (error) {
        console.error('Failed to batch get from Redis:', error);
      }
    }
    
    return results;
  }
  
  /**
   * Batch set in cache
   */
  async mset(entries: Map<string, any>, ttl?: number): Promise<void> {
    const effectiveTTL = ttl || this.defaultTTL;
    
    // Set in L1
    for (const [key, value] of entries) {
      this.l1Cache.set(key, value, {
        ttl: Math.min(effectiveTTL * 1000, 300000),
      });
    }
    
    // Set in L2
    if (this.isRedisConnected && this.redisClient) {
      try {
        const pipeline = this.redisClient.multi();
        
        for (const [key, value] of entries) {
          pipeline.setEx(key, effectiveTTL, JSON.stringify(value));
        }
        
        await pipeline.exec();
        await this.recordMetric('CacheBatchSet', entries.size);
      } catch (error) {
        console.error('Failed to batch set in Redis:', error);
      }
    }
  }
  
  /**
   * Warm cache with preloaded data
   */
  async warmCache(data: Map<string, any>, ttl?: number): Promise<void> {
    const startTime = Date.now();
    
    await this.mset(data, ttl);
    
    await this.recordMetric('CacheWarmingItems', data.size);
    await this.recordMetric('CacheWarmingLatency', Date.now() - startTime);
    
    console.log(`Cache warmed with ${data.size} items`);
  }
  
  /**
   * Get from Redis
   */
  private async getFromRedis(key: string): Promise<any> {
    if (!this.isRedisConnected || !this.redisClient) {
      return undefined;
    }
    
    try {
      const value = await this.redisClient.get(key);
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Failed to get from Redis:', error);
    }
    
    return undefined;
  }
  
  /**
   * Set in Redis
   */
  private async setInRedis(key: string, value: any, ttl: number): Promise<void> {
    if (!this.isRedisConnected || !this.redisClient) {
      return;
    }
    
    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set in Redis:', error);
    }
  }
  
  /**
   * Record CloudWatch metric
   */
  private async recordMetric(metricName: string, value: number): Promise<void> {
    try {
      await this.cloudWatchClient.send(
        new PutMetricDataCommand({
          Namespace: 'ECOSYSTEMCL/Cache',
          MetricData: [
            {
              MetricName: metricName,
              Value: value,
              Unit: metricName.includes('Latency') ? 'Milliseconds' : 'Count',
              Timestamp: new Date(),
            },
          ],
        })
      );
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): any {
    return {
      l1: {
        size: this.l1Cache.size,
        maxSize: this.l1Cache.max,
        hitRate: this.l1Cache.size / this.l1Cache.max,
      },
      l2: {
        connected: this.isRedisConnected,
        endpoint: this.redisEndpoint,
      },
    };
  }
  
  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.isRedisConnected = false;
    }
  }
}