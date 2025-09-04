import { describe, test, expect } from 'vitest';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { handler } from '../../lambdas/cdcProcessor';

// Note: Requires LocalStack (see docker-compose.test.yml) or compatible endpoints
// Start: docker-compose -f ../../../../docker-compose.test.yml up -d

describe('CDC Pipeline Integration', () => {
  const dynamoClient = new DynamoDBClient({
    region: 'us-east-1',
    endpoint: process.env.DYNAMO_ENDPOINT || 'http://localhost:4566',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  });

  const sqsClient = new SQSClient({
    region: 'us-east-1',
    endpoint: process.env.SQS_ENDPOINT || 'http://localhost:4566',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  });

  test('processes DynamoDB stream INSERT without DLQ failures', async () => {
    const streamEvent: any = {
      Records: [
        {
          eventName: 'INSERT',
          dynamodb: {
            NewImage: {
              patternId: { S: 'test-pattern-001' },
              content: { S: 'CREATE TABLE with CDK' },
            },
          },
        },
      ],
    };

    const result = await handler(streamEvent);
    expect(result?.batchItemFailures ?? []).toHaveLength(0);

    // Verify DLQ is empty (example queue URL; adapt as needed for env)
    const dlqUrl = process.env.DLQ_URL || 'http://localhost:4566/000000000000/ecosystemcl-cdc-dlq';
    const dlqMessages = await sqsClient.send(
      new ReceiveMessageCommand({ QueueUrl: dlqUrl, MaxNumberOfMessages: 1 })
    );
    expect(dlqMessages.Messages).toBeUndefined();
  });
});
