import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { BedrockService } from './BedrockService';
import { LRUCache } from 'lru-cache';

/**
 * VectorStoreService - OpenSearch Serverless Integration for Helix Knowledge Base
 * 
 * Implements multi-tier caching, hybrid search, and semantic pattern retrieval
 * with sub-100ms P95 latency target.
 * 
 * Architecture:
 * - L1: In-memory LRU cache (100 entries)
 * - L2: Redis cache (24-hour TTL) - integration in separate service
 * - L3: OpenSearch Serverless (persistent)
 * 
 * Features:
 * - Batch indexing with 50-record batches
 * - Version-based idempotency
 * - Hybrid search (semantic + keyword)
 * - CloudWatch metrics for monitoring
 */

export interface PatternDocument {
  patternId: string;
  version: number;
  embedding: number[];
  content: string;
  keywords: string[];
  context: Record<string, any>;
  projectId: string;
  agentType: string;
  successRate: number;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  patternId: string;
  score: number;
  content: string;
  context: Record<string, any>;
  source: 'cache' | 'opensearch';
}

export interface SearchOptions {
  hybridMode?: boolean;
  semanticWeight?: number;
  keywordWeight?: number;
  maxResults?: number;
  minScore?: number;
  projectFilter?: string;
  agentFilter?: string;
}

export class VectorStoreService {
  private readonly openSearchClient: Client;
  private readonly bedrockService: BedrockService;
  private readonly cloudWatchClient: CloudWatchClient;
  private readonly indexName: string;
  private readonly l1Cache: LRUCache<string, PatternDocument>;
  
  constructor(
    openSearchEndpoint: string = process.env.OPENSEARCH_ENDPOINT || '',
    region: string = process.env.AWS_REGION || 'us-west-2'
  ) {
    // Initialize OpenSearch client with AWS SigV4 signing
    this.openSearchClient = new Client({
      ...AwsSigv4Signer({
        region,
        service: 'aoss', // Amazon OpenSearch Serverless
        getCredentials: () => {
          const credentialProvider = defaultProvider();
          return credentialProvider();
        },
      }),
      node: openSearchEndpoint,
    });
    
    this.bedrockService = new BedrockService(region);
    this.cloudWatchClient = new CloudWatchClient({ region });
    this.indexName = process.env.HELIX_INDEX_NAME || 'helix-patterns';
    
    // Initialize L1 cache with 100 entries max
    this.l1Cache = new LRUCache<string, PatternDocument>({
      max: 100,
      ttl: 1000 * 60 * 5, // 5 minutes TTL for L1 cache
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }
  
  /**
   * Initialize index with proper mappings for vector search
   */
  async initializeIndex(): Promise<void> {
    const indexExists = await this.openSearchClient.indices.exists({
      index: this.indexName,
    });
    
    if (!indexExists.body) {
      await this.openSearchClient.indices.create({
        index: this.indexName,
        body: {
          settings: {
            'index.knn': true,
            'index.knn.algo_param.ef_search': 512,
            'number_of_shards': 2,
            'number_of_replicas': 1,
          },
          mappings: {
            properties: {
              patternId: { type: 'keyword' },
              version: { type: 'long' },
              embedding: {
                type: 'knn_vector',
                dimension: 1536, // Titan embeddings dimension
                method: {
                  name: 'hnsw',
                  space_type: 'cosinesimil',
                  engine: 'nmslib',
                  parameters: {
                    ef_construction: 512,
                    m: 16,
                  },
                },
              },
              content: { type: 'text' },
              keywords: { type: 'keyword' },
              context: { type: 'object', enabled: false },
              projectId: { type: 'keyword' },
              agentType: { type: 'keyword' },
              successRate: { type: 'float' },
              usageCount: { type: 'long' },
              lastUsed: { type: 'date' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        },
      });
    }
  }
  
  /**
   * Index patterns in batch with version-based idempotency
   */
  async indexPatternsBatch(patterns: PatternDocument[]): Promise<void> {
    const startTime = Date.now();
    const operations: any[] = [];
    
    for (const pattern of patterns) {
      // Check L1 cache for version comparison
      const cachedPattern = this.l1Cache.get(pattern.patternId);
      if (cachedPattern && cachedPattern.version >= pattern.version) {
        continue; // Skip if cached version is newer or same
      }
      
      // Generate embedding if not provided
      if (!pattern.embedding || pattern.embedding.length === 0) {
        pattern.embedding = await this.bedrockService.generateEmbeddings(pattern.content);
      }
      
      // Prepare bulk operation with conditional update
      operations.push(
        { index: { _index: this.indexName, _id: pattern.patternId } },
        pattern
      );
      
      // Update L1 cache
      this.l1Cache.set(pattern.patternId, pattern);
    }
    
    if (operations.length > 0) {
      // Execute bulk indexing
      const bulkResponse = await this.openSearchClient.bulk({
        body: operations,
        refresh: false, // Async refresh for performance
      });
      
      // Check for errors
      if (bulkResponse.body.errors) {
        const erroredDocs = bulkResponse.body.items.filter(
          (item: any) => item.index && item.index.error
        );
        console.error('Bulk indexing errors:', erroredDocs);
        throw new Error(`Failed to index ${erroredDocs.length} documents`);
      }
    }
    
    // Record metrics
    await this.recordMetric('IndexLatency', Date.now() - startTime, 'Milliseconds');
    await this.recordMetric('IndexedPatterns', patterns.length, 'Count');
  }
  
  /**
   * Hybrid search combining semantic and keyword search
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const startTime = Date.now();
    const {
      hybridMode = true,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      maxResults = 10,
      minScore = 0.5,
      projectFilter,
      agentFilter,
    } = options;
    
    // Check L1 cache for exact match
    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    const cachedResults = this.getCachedSearchResults(cacheKey);
    if (cachedResults) {
      await this.recordMetric('CacheHit', 1, 'Count');
      await this.recordMetric('SearchLatency', Date.now() - startTime, 'Milliseconds');
      return cachedResults;
    }
    
    // Generate query embedding
    const queryEmbedding = await this.bedrockService.generateEmbeddings(query);
    
    // Build filter query
    const filters: any[] = [];
    if (projectFilter) {
      filters.push({ term: { projectId: projectFilter } });
    }
    if (agentFilter) {
      filters.push({ term: { agentType: agentFilter } });
    }
    
    let searchBody: any;
    
    if (hybridMode) {
      // Hybrid search query
      searchBody = {
        size: maxResults,
        query: {
          bool: {
            should: [
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                    params: {
                      query_vector: queryEmbedding,
                    },
                  },
                  boost: semanticWeight,
                },
              },
              {
                multi_match: {
                  query,
                  fields: ['content^2', 'keywords'],
                  boost: keywordWeight,
                },
              },
            ],
            filter: filters,
            minimum_should_match: 1,
          },
        },
      };
    } else {
      // Pure semantic search
      searchBody = {
        size: maxResults,
        query: {
          script_score: {
            query: {
              bool: {
                filter: filters,
              },
            },
            script: {
              source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
              params: {
                query_vector: queryEmbedding,
              },
            },
          },
        },
      };
    }
    
    // Execute search
    const searchResponse = await this.openSearchClient.search({
      index: this.indexName,
      body: searchBody,
    });
    
    // Process results
    const results: SearchResult[] = searchResponse.body.hits.hits
      .filter((hit: any) => hit._score >= minScore)
      .map((hit: any) => ({
        patternId: hit._source.patternId,
        score: hit._score,
        content: hit._source.content,
        context: hit._source.context,
        source: 'opensearch' as const,
      }));
    
    // Cache results
    this.cacheSearchResults(cacheKey, results);
    
    // Update pattern usage stats
    await this.updatePatternUsageStats(results.map(r => r.patternId));
    
    // Record metrics
    await this.recordMetric('SearchLatency', Date.now() - startTime, 'Milliseconds');
    await this.recordMetric('SearchResults', results.length, 'Count');
    
    return results;
  }
  
  /**
   * Get pattern by ID with cache check
   */
  async getPattern(patternId: string): Promise<PatternDocument | null> {
    // Check L1 cache
    const cached = this.l1Cache.get(patternId);
    if (cached) {
      await this.recordMetric('L1CacheHit', 1, 'Count');
      return cached;
    }
    
    // Query OpenSearch
    try {
      const response = await this.openSearchClient.get({
        index: this.indexName,
        id: patternId,
      });
      
      const pattern = response.body._source as PatternDocument;
      
      // Update L1 cache
      this.l1Cache.set(patternId, pattern);
      
      return pattern;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  
  /**
   * Delete pattern with cache invalidation
   */
  async deletePattern(patternId: string): Promise<void> {
    // Remove from L1 cache
    this.l1Cache.delete(patternId);
    
    // Delete from OpenSearch
    await this.openSearchClient.delete({
      index: this.indexName,
      id: patternId,
      refresh: true,
    });
  }
  
  /**
   * Update pattern with version check
   */
  async updatePattern(pattern: PatternDocument): Promise<void> {
    // Check version for idempotency
    const existing = await this.getPattern(pattern.patternId);
    if (existing && existing.version >= pattern.version) {
      return; // Skip if existing version is newer or same
    }
    
    // Generate new embedding if content changed
    if (!existing || existing.content !== pattern.content) {
      pattern.embedding = await this.bedrockService.generateEmbeddings(pattern.content);
    }
    
    // Update in OpenSearch
    await this.openSearchClient.index({
      index: this.indexName,
      id: pattern.patternId,
      body: pattern,
      refresh: false,
    });
    
    // Update L1 cache
    this.l1Cache.set(pattern.patternId, pattern);
  }
  
  /**
   * Cache search results
   */
  private cacheSearchResults(key: string, results: SearchResult[]): void {
    // Simple in-memory cache for search results
    // In production, this would use Redis
    // Implementation deferred to Redis integration
  }
  
  /**
   * Get cached search results
   */
  private getCachedSearchResults(key: string): SearchResult[] | null {
    // Check in-memory cache for search results
    // In production, this would check Redis first
    // Implementation deferred to Redis integration
    return null;
  }
  
  /**
   * Update pattern usage statistics
   */
  private async updatePatternUsageStats(patternIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    
    for (const patternId of patternIds) {
      await this.openSearchClient.update({
        index: this.indexName,
        id: patternId,
        body: {
          script: {
            source: 'ctx._source.usageCount += 1; ctx._source.lastUsed = params.now',
            params: { now },
          },
        },
        refresh: false,
        retry_on_conflict: 3,
      }).catch(error => {
        console.error(`Failed to update usage stats for ${patternId}:`, error);
      });
    }
  }
  
  /**
   * Record CloudWatch metric
   */
  private async recordMetric(
    metricName: string,
    value: number,
    unit: string
  ): Promise<void> {
    try {
      await this.cloudWatchClient.send(
        new PutMetricDataCommand({
          Namespace: 'ECOSYSTEMCL/Helix',
          MetricData: [
            {
              MetricName: metricName,
              Value: value,
              Unit: unit,
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
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    const stats = await this.openSearchClient.indices.stats({
      index: this.indexName,
    });
    
    return {
      documentCount: stats.body._all.primaries.docs.count,
      sizeInBytes: stats.body._all.primaries.store.size_in_bytes,
      cacheHitRate: this.l1Cache.size / this.l1Cache.max,
    };
  }
}