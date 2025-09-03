import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

const region = process.env.AWS_REGION || 'us-east-1';

export const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region })
);

export const sqsClient = new SQSClient({ region });

export const bedrockClient = new BedrockRuntimeClient({ region });