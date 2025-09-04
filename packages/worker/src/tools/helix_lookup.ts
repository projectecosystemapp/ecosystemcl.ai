import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { VectorStoreService, SearchOptions } from '../services/VectorStoreService';
import { CacheService } from '../services/CacheService';

/**
 * Helix Lookup Production Implementation
 * 
 * Query hierarchy:
 * 1. L1 Cache (in-memory)
 * 2. L2 Cache (Redis)
 * 3. L3 OpenSearch (semantic)
 * 4. L4 DynamoDB (source of truth)
 * 
 * Features:
 * - Sub-100ms P95 latency target
 * - Hybrid semantic + keyword search
 * - Version-based consistency
 * - CloudWatch metrics
 */

interface HelixLookupRequest {
  intent: string;
  projectId?: string;
  agentType?: string;
  maxResults?: number;
  hybridMode?: boolean;
  semanticWeight?: number;
  keywordWeight?: number;
}

interface HelixPattern {
  patternId: string;
  content: string;
  context: Record<string, any>;
  keywords: string[];
  successRate: number;
  usageCount: number;
  version: number;
  projectId?: string;
  agentType?: string;
}

interface HelixLookupResponse {
  patterns: HelixPattern[];
  source: 'cache' | 'opensearch' | 'dynamodb';
  latency: number;
  queryId: string;
}

// Environment configuration
const config = {
  region: process.env.AWS_REGION || 'us-west-2',
  tableName: process.env.HELIX_TABLE_NAME || 'HelixPatternEntries',
  openSearchEndpoint: process.env.OPENSEARCH_ENDPOINT!,
  redisEndpoint: process.env.REDIS_ENDPOINT,
  maxResults: 10,
};

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: config.region });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cloudWatchClient = new CloudWatchClient({ region: config.region });

// Initialize services
const vectorStoreService = new VectorStoreService(config.openSearchEndpoint, config.region);
const cacheService = new CacheService(config.redisEndpoint, 6379, config.region);

/**
 * Main Lambda handler for Helix pattern lookup
 */
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const startTime = Date.now();
  const queryId = event.requestContext.requestId || crypto.randomUUID();
  
  try {
    // Parse request
    const request = parseRequest(event);
    
    // Generate cache key
    const cacheKey = generateCacheKey(request);
    
    // Try cache first (L1 + L2)
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      const latency = Date.now() - startTime;
      await recordMetric('CacheHit', 1);
      await recordMetric('LookupLatency', latency);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Query-Id': queryId,
          'X-Cache-Hit': 'true',
        },
        body: JSON.stringify({
          patterns: cachedResult,
          source: 'cache',
          latency,
          queryId,
        } as HelixLookupResponse),
      };
    }
    
    // Search in OpenSearch (L3)
    const searchOptions: SearchOptions = {
      hybridMode: request.hybridMode ?? true,
      semanticWeight: request.semanticWeight ?? 0.7,
      keywordWeight: request.keywordWeight ?? 0.3,
      maxResults: request.maxResults ?? config.maxResults,
      minScore: 0.5,
      projectFilter: request.projectId,
      agentFilter: request.agentType,
    };
    
    const searchResults = await vectorStoreService.search(
      request.intent,
      searchOptions
    );
    
    if (searchResults.length > 0) {
      // Convert search results to patterns
      const patterns: HelixPattern[] = [];
      
      // Batch fetch full pattern details from DynamoDB
      const patternIds = searchResults.map(r => r.patternId);
      const fullPatterns = await batchGetPatterns(patternIds);
      
      for (const result of searchResults) {
        const fullPattern = fullPatterns.get(result.patternId);
        if (fullPattern) {
          patterns.push(fullPattern);
        }
      }
      
      // Cache the results
      await cacheService.set(cacheKey, patterns, { ttl: 3600 }); // 1 hour TTL
      
      const latency = Date.now() - startTime;
      await recordMetric('OpenSearchHit', 1);
      await recordMetric('LookupLatency', latency);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Query-Id': queryId,
          'X-Cache-Hit': 'false' as string,
        },
        body: JSON.stringify({
          patterns,
          source: 'opensearch',
          latency,
          queryId,
        } as HelixLookupResponse),
      };
    }
    
    // Fallback to DynamoDB keyword search (L4)
    const dynamoPatterns = await searchDynamoDB(request);
    
    // Cache if found
    if (dynamoPatterns.length > 0) {
      await cacheService.set(cacheKey, dynamoPatterns, { ttl: 3600 });
      
      // Index in OpenSearch for future searches
      await indexPatternsAsync(dynamoPatterns);
    }
    
    const latency = Date.now() - startTime;
    await recordMetric('DynamoDBFallback', 1);
    await recordMetric('LookupLatency', latency);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Query-Id': queryId,
        'X-Cache-Hit': 'false',
      },
      body: JSON.stringify({
        patterns: dynamoPatterns,
        source: 'dynamodb',
        latency,
        queryId,
      } as HelixLookupResponse),
    };
    
  } catch (error) {
    console.error('Helix lookup error:', error);
    await recordMetric('LookupError', 1);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Query-Id': queryId,
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        queryId,
      }),
    };
  }
};

/**
 * Parse and validate request
 */
function parseRequest(event: APIGatewayProxyEvent): HelixLookupRequest {
  let request: HelixLookupRequest;
  
  if (event.body) {
    request = JSON.parse(event.body);
  } else if (event.queryStringParameters) {
    request = {
      intent: event.queryStringParameters.intent || '',
      projectId: event.queryStringParameters.projectId,
      agentType: event.queryStringParameters.agentType,
      maxResults: event.queryStringParameters.maxResults 
        ? parseInt(event.queryStringParameters.maxResults) 
        : undefined,
    };
  } else {
    throw new Error('No request body or query parameters provided');
  }
  
  if (!request.intent) {
    throw new Error('Intent is required');
  }
  
  return request;
}

/**
 * Generate cache key
 */
function generateCacheKey(request: HelixLookupRequest): string {
  const parts = [
    'helix',
    request.intent.toLowerCase().replace(/\s+/g, '_'),
    request.projectId || 'all',
    request.agentType || 'all',
    request.maxResults?.toString() || '10',
  ];
  
  return parts.join(':');
}

/**
 * Batch get patterns from DynamoDB
 */
async function batchGetPatterns(patternIds: string[]): Promise<Map<string, HelixPattern>> {
  const patterns = new Map<string, HelixPattern>();
  
  // DynamoDB BatchGetItem has a limit of 100 items
  const chunks = [];
  for (let i = 0; i < patternIds.length; i += 100) {
    chunks.push(patternIds.slice(i, i + 100));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (patternId) => {
      const command = new GetCommand({
        TableName: config.tableName,
        Key: { patternId },
      });
      
      try {
        const response = await docClient.send(command);
        if (response.Item) {
          patterns.set(patternId, response.Item as HelixPattern);
        }
      } catch (error) {
        console.error(`Failed to get pattern ${patternId}:`, error);
      }
    });
    
    await Promise.all(promises);
  }
  
  return patterns;
}

/**
 * Search patterns in DynamoDB using GSI
 */
async function searchDynamoDB(request: HelixLookupRequest): Promise<HelixPattern[]> {
  const patterns: HelixPattern[] = [];
  
  // Query by keywords using GSI
  const keywords = request.intent.toLowerCase().split(/\s+/);
  
  for (const keyword of keywords) {
    const command = new QueryCommand({
      TableName: config.tableName,
      IndexName: 'KeywordIndex',
      KeyConditionExpression: 'keyword = :keyword',
      FilterExpression: request.projectId 
        ? 'projectId = :projectId' 
        : undefined,
      ExpressionAttributeValues: {
        ':keyword': keyword,
        ...(request.projectId && { ':projectId': request.projectId }),
      },
      Limit: request.maxResults || config.maxResults,
    });
    
    try {
      const response = await docClient.send(command);
      if (response.Items) {
        for (const item of response.Items) {
          patterns.push(item as HelixPattern);
        }
      }
    } catch (error) {
      console.error(`Failed to query keyword ${keyword}:`, error);
    }
  }
  
  // Deduplicate and sort by relevance
  const uniquePatterns = Array.from(
    new Map(patterns.map(p => [p.patternId, p])).values()
  );
  
  // Sort by success rate and usage count
  uniquePatterns.sort((a, b) => {
    const scoreA = a.successRate * 0.7 + Math.min(a.usageCount / 100, 1) * 0.3;
    const scoreB = b.successRate * 0.7 + Math.min(b.usageCount / 100, 1) * 0.3;
    return scoreB - scoreA;
  });
  
  return uniquePatterns.slice(0, request.maxResults || config.maxResults);
}

/**
 * Index patterns in OpenSearch asynchronously
 */
async function indexPatternsAsync(patterns: HelixPattern[]): Promise<void> {
  // Fire and forget - don't wait for indexing
  setImmediate(async () => {
    try {
      const documents = patterns.map(p => ({
        patternId: p.patternId,
        version: p.version,
        embedding: [], // Will be generated by VectorStoreService
        content: p.content,
        keywords: p.keywords,
        context: p.context,
        projectId: p.projectId || '',
        agentType: p.agentType || '',
        successRate: p.successRate,
        usageCount: p.usageCount,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      await vectorStoreService.indexPatternsBatch(documents);
      console.log(`Indexed ${patterns.length} patterns in OpenSearch`);
    } catch (error) {
      console.error('Failed to index patterns:', error);
    }
  });
}

/**
 * Record CloudWatch metric
 */
async function recordMetric(metricName: string, value: number): Promise<void> {
  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ECOSYSTEMCL/Helix',
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
    console.error(`Failed to record metric ${metricName}:`, error);
  }
}

