import { DynamoDBStreamHandler, DynamoDBRecord, AttributeValue } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { VectorStoreService, PatternDocument } from '../services/VectorStoreService';
import CircuitBreaker from 'opossum';

/**
 * CDC Lambda for DynamoDB Streams to OpenSearch Pipeline
 * 
 * Features:
 * - Batch processing of 50 records from DynamoDB Streams
 * - Version-based idempotency
 * - Partial failure handling with DLQ
 * - Circuit breaker for Bedrock/OpenSearch failures
 * - S3 versioning for pattern history
 * - CloudWatch metrics and alarms
 * 
 * Configuration:
 * - Reserved concurrency: 5
 * - Timeout: 5 minutes
 * - Memory: 1024 MB
 */

interface HelixPattern {
  patternId: string;
  version: number;
  content: string;
  keywords: string[];
  context: Record<string, any>;
  projectId: string;
  agentType: string;
  successRate: number;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

// Environment configuration
const config = {
  region: process.env.AWS_REGION || 'us-west-2',
  openSearchEndpoint: process.env.OPENSEARCH_ENDPOINT!,
  dlqUrl: process.env.DLQ_URL!,
  versionBucket: process.env.VERSION_BUCKET || 'helix-pattern-versions',
  maxRetries: 3,
  circuitBreakerThreshold: 0.5,
  circuitBreakerTimeout: 30000, // 30 seconds
};

// Initialize AWS clients
const s3Client = new S3Client({ region: config.region });
const sqsClient = new SQSClient({ region: config.region });
const cloudWatchClient = new CloudWatchClient({ region: config.region });

// Initialize VectorStore service with circuit breaker
const vectorStoreService = new VectorStoreService(config.openSearchEndpoint, config.region);

// Circuit breaker for OpenSearch operations
const openSearchCircuitBreaker = new CircuitBreaker(
  async (patterns: PatternDocument[]) => {
    return await vectorStoreService.indexPatternsBatch(patterns);
  },
  {
    timeout: config.circuitBreakerTimeout,
    errorThresholdPercentage: config.circuitBreakerThreshold * 100,
    resetTimeout: 30000,
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    name: 'openSearchIndexing',
  }
);

// Circuit breaker event handlers
openSearchCircuitBreaker.on('open', () => {
  console.error('Circuit breaker opened - OpenSearch is experiencing failures');
  recordMetric('CircuitBreakerOpen', 1);
});

openSearchCircuitBreaker.on('halfOpen', () => {
  console.log('Circuit breaker half-open - testing OpenSearch availability');
});

/**
 * Main Lambda handler for DynamoDB Stream events
 */
export const handler: DynamoDBStreamHandler = async (event) => {
  const startTime = Date.now();
  const results = {
    processed: 0,
    failed: 0,
    versioned: 0,
    dlqSent: 0,
  };

  console.log(`Processing ${event.Records.length} DynamoDB stream records`);

  // Group records by operation type
  const insertRecords: DynamoDBRecord[] = [];
  const modifyRecords: DynamoDBRecord[] = [];
  const removeRecords: DynamoDBRecord[] = [];

  for (const record of event.Records) {
    switch (record.eventName) {
      case 'INSERT':
        insertRecords.push(record);
        break;
      case 'MODIFY':
        modifyRecords.push(record);
        break;
      case 'REMOVE':
        removeRecords.push(record);
        break;
    }
  }

  // Process inserts and modifications in parallel
  const [insertResults, modifyResults, removeResults] = await Promise.all([
    processInserts(insertRecords),
    processModifications(modifyRecords),
    processRemovals(removeRecords),
  ]);

  // Aggregate results
  results.processed = insertResults.processed + modifyResults.processed + removeResults.processed;
  results.failed = insertResults.failed + modifyResults.failed + removeResults.failed;
  results.versioned = modifyResults.versioned;
  results.dlqSent = insertResults.dlqSent + modifyResults.dlqSent + removeResults.dlqSent;

  // Record metrics
  await recordMetric('ProcessedRecords', results.processed);
  await recordMetric('FailedRecords', results.failed);
  await recordMetric('VersionedPatterns', results.versioned);
  await recordMetric('DLQMessages', results.dlqSent);
  await recordMetric('ProcessingLatency', Date.now() - startTime);

  console.log('CDC processing complete:', results);

  // Throw error if all records failed (triggers Lambda retry)
  if (results.failed > 0 && results.processed === 0) {
    throw new Error('All records failed processing');
  }
};

/**
 * Process INSERT records
 */
async function processInserts(records: DynamoDBRecord[]): Promise<any> {
  if (records.length === 0) return { processed: 0, failed: 0, dlqSent: 0 };

  const patterns: PatternDocument[] = [];
  const failedRecords: DynamoDBRecord[] = [];

  for (const record of records) {
    try {
      if (!record.dynamodb?.NewImage) continue;

      const pattern = unmarshallPattern(record.dynamodb.NewImage);
      patterns.push(pattern);
    } catch (error) {
      console.error('Failed to unmarshall INSERT record:', error);
      failedRecords.push(record);
    }
  }

  // Batch index patterns with circuit breaker
  if (patterns.length > 0) {
    try {
      if (openSearchCircuitBreaker.opened) {
        // Circuit is open, send all to DLQ
        console.log('Circuit breaker open - sending patterns to DLQ');
        await sendToDLQ(records, 'Circuit breaker open');
        return { 
          processed: 0, 
          failed: patterns.length, 
          dlqSent: patterns.length 
        };
      }

      await openSearchCircuitBreaker.fire(patterns);
      
      return { 
        processed: patterns.length, 
        failed: failedRecords.length, 
        dlqSent: 0 
      };
    } catch (error) {
      console.error('Failed to index patterns:', error);
      
      // Send failed records to DLQ
      await sendToDLQ(records, error.message);
      
      return { 
        processed: 0, 
        failed: patterns.length, 
        dlqSent: patterns.length 
      };
    }
  }

  // Send individual failed records to DLQ
  if (failedRecords.length > 0) {
    await sendToDLQ(failedRecords, 'Failed to unmarshall');
  }

  return { 
    processed: patterns.length, 
    failed: failedRecords.length, 
    dlqSent: failedRecords.length 
  };
}

/**
 * Process MODIFY records with versioning
 */
async function processModifications(records: DynamoDBRecord[]): Promise<any> {
  if (records.length === 0) return { processed: 0, failed: 0, versioned: 0, dlqSent: 0 };

  const patterns: PatternDocument[] = [];
  const versioningTasks: Promise<void>[] = [];
  const failedRecords: DynamoDBRecord[] = [];

  for (const record of records) {
    try {
      if (!record.dynamodb?.NewImage || !record.dynamodb?.OldImage) continue;

      const newPattern = unmarshallPattern(record.dynamodb.NewImage);
      const oldPattern = unmarshallPattern(record.dynamodb.OldImage);

      // Version check for idempotency
      if (newPattern.version <= oldPattern.version) {
        console.log(`Skipping pattern ${newPattern.patternId} - version not newer`);
        continue;
      }

      patterns.push(newPattern);

      // Archive old version to S3
      versioningTasks.push(
        archivePatternVersion(oldPattern, record.eventID || '')
      );
    } catch (error) {
      console.error('Failed to process MODIFY record:', error);
      failedRecords.push(record);
    }
  }

  // Execute versioning in parallel
  const versioningResults = await Promise.allSettled(versioningTasks);
  const versionedCount = versioningResults.filter(r => r.status === 'fulfilled').length;

  // Index updated patterns
  if (patterns.length > 0) {
    try {
      if (openSearchCircuitBreaker.opened) {
        console.log('Circuit breaker open - sending patterns to DLQ');
        await sendToDLQ(records, 'Circuit breaker open');
        return { 
          processed: 0, 
          failed: patterns.length, 
          versioned: versionedCount, 
          dlqSent: patterns.length 
        };
      }

      await openSearchCircuitBreaker.fire(patterns);
      
      return { 
        processed: patterns.length, 
        failed: failedRecords.length, 
        versioned: versionedCount, 
        dlqSent: 0 
      };
    } catch (error) {
      console.error('Failed to index modified patterns:', error);
      await sendToDLQ(records, error.message);
      
      return { 
        processed: 0, 
        failed: patterns.length, 
        versioned: versionedCount, 
        dlqSent: patterns.length 
      };
    }
  }

  if (failedRecords.length > 0) {
    await sendToDLQ(failedRecords, 'Failed to process modification');
  }

  return { 
    processed: patterns.length, 
    failed: failedRecords.length, 
    versioned: versionedCount, 
    dlqSent: failedRecords.length 
  };
}

/**
 * Process REMOVE records
 */
async function processRemovals(records: DynamoDBRecord[]): Promise<any> {
  if (records.length === 0) return { processed: 0, failed: 0, dlqSent: 0 };

  const deleteTasks: Promise<void>[] = [];
  const failedRecords: DynamoDBRecord[] = [];

  for (const record of records) {
    try {
      if (!record.dynamodb?.OldImage) continue;

      const pattern = unmarshallPattern(record.dynamodb.OldImage);
      
      // Archive before deletion
      await archivePatternVersion(pattern, `${record.eventID}-deleted`);
      
      // Delete from OpenSearch
      deleteTasks.push(vectorStoreService.deletePattern(pattern.patternId));
    } catch (error) {
      console.error('Failed to process REMOVE record:', error);
      failedRecords.push(record);
    }
  }

  // Execute deletions
  const deleteResults = await Promise.allSettled(deleteTasks);
  const successCount = deleteResults.filter(r => r.status === 'fulfilled').length;
  const failedCount = deleteResults.filter(r => r.status === 'rejected').length;

  if (failedRecords.length > 0) {
    await sendToDLQ(failedRecords, 'Failed to process removal');
  }

  return { 
    processed: successCount, 
    failed: failedCount + failedRecords.length, 
    dlqSent: failedRecords.length 
  };
}

/**
 * Unmarshall DynamoDB record to PatternDocument
 */
function unmarshallPattern(item: { [key: string]: AttributeValue }): PatternDocument {
  return {
    patternId: item.patternId?.S || '',
    version: parseInt(item.version?.N || '0'),
    embedding: item.embedding?.L?.map(v => parseFloat(v.N || '0')) || [],
    content: item.content?.S || '',
    keywords: item.keywords?.SS || [],
    context: item.context ? JSON.parse(item.context.S || '{}') : {},
    projectId: item.projectId?.S || '',
    agentType: item.agentType?.S || '',
    successRate: parseFloat(item.successRate?.N || '0'),
    usageCount: parseInt(item.usageCount?.N || '0'),
    lastUsed: item.lastUsed?.S || new Date().toISOString(),
    createdAt: item.createdAt?.S || new Date().toISOString(),
    updatedAt: item.updatedAt?.S || new Date().toISOString(),
  };
}

/**
 * Archive pattern version to S3
 */
async function archivePatternVersion(
  pattern: PatternDocument,
  eventId: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `patterns/${pattern.patternId}/versions/${timestamp}-${eventId}.json`;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: config.versionBucket,
      Key: key,
      Body: JSON.stringify(pattern, null, 2),
      ContentType: 'application/json',
      Metadata: {
        patternId: pattern.patternId,
        version: pattern.version.toString(),
        eventId,
      },
    }));

    console.log(`Archived pattern version: ${key}`);
  } catch (error) {
    console.error('Failed to archive pattern version:', error);
    throw error;
  }
}

/**
 * Send failed records to DLQ
 */
async function sendToDLQ(
  records: DynamoDBRecord[],
  reason: string
): Promise<void> {
  const messages = records.map(record => ({
    Id: record.eventID || crypto.randomUUID(),
    MessageBody: JSON.stringify({
      record,
      reason,
      timestamp: new Date().toISOString(),
      retryCount: parseInt(record.userIdentity?.principalId || '0') + 1,
    }),
    MessageAttributes: {
      EventName: {
        DataType: 'String',
        StringValue: record.eventName || 'UNKNOWN',
      },
      Reason: {
        DataType: 'String',
        StringValue: reason,
      },
    },
  }));

  // Send in batches of 10 (SQS limit)
  for (let i = 0; i < messages.length; i += 10) {
    const batch = messages.slice(i, i + 10);
    
    try {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: config.dlqUrl,
        MessageBody: JSON.stringify(batch),
      }));
      
      console.log(`Sent ${batch.length} records to DLQ`);
    } catch (error) {
      console.error('Failed to send to DLQ:', error);
    }
  }
}

/**
 * Record CloudWatch metric
 */
async function recordMetric(
  metricName: string,
  value: number
): Promise<void> {
  try {
    await cloudWatchClient.send(new PutMetricDataCommand({
      Namespace: 'ECOSYSTEMCL/CDC',
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: metricName.includes('Latency') ? 'Milliseconds' : 'Count',
          Timestamp: new Date(),
        },
      ],
    }));
  } catch (error) {
    console.error(`Failed to record metric ${metricName}:`, error);
  }
}