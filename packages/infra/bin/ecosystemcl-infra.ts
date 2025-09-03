#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ComputeStack } from '../lib/compute-stack';
import { ApiStack } from '../lib/api-stack';
import { StorageStack } from '../lib/storage-stack';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';

/**
 * ECOSYSTEMCL.AI Infrastructure Bootstrap
 * 
 * This is the primary CDK application entry point for the 100% AWS-native architecture.
 * All stacks are deployed in dependency order to ensure proper resource provisioning.
 * 
 * Stack Dependencies:
 * 1. StorageStack (S3, no dependencies)
 * 2. DatabaseStack (DynamoDB, ElastiCache, OpenSearch)
 * 3. ComputeStack (ECS Fargate, SQS, Step Functions)
 * 4. ApiStack (API Gateway, Lambda, Cognito)
 */

const app = new cdk.App();

// Environment configuration - production defaults
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const stackProps = {
  env,
  stackName: '',
  description: '',
  tags: {
    Project: 'ECOSYSTEMCL.AI',
    Environment: process.env.ENVIRONMENT || 'production',
    ManagedBy: 'AWS-CDK',
    Architecture: 'Serverless',
  },
};

// Storage Stack - S3 buckets for artifacts and large file storage
const storageStack = new StorageStack(app, 'EcosystemCL-StorageStack', {
  ...stackProps,
  stackName: 'EcosystemCL-Storage',
  description: 'S3 buckets for artifacts, embeddings, and user content',
});

// Optional Database Stack - managed separately when needed
// const databaseStack = new DatabaseStack(app, 'EcosystemCL-DatabaseStack', {
//   ...stackProps,
//   stackName: 'EcosystemCL-Database',
//   description: 'Primary data layer - DynamoDB, ElastiCache, OpenSearch/Aurora',
// });

// Compute Stack - ECS Fargate, SQS, Step Functions
const computeStack = new ComputeStack(app, 'EcosystemCL-ComputeStack', {
  ...stackProps,
  stackName: 'EcosystemCL-Compute',
  description: 'Serverless compute layer - ECS Fargate, SQS, Step Functions',
  artifactsBucket: storageStack.artifactsBucket,
  patternTableName: 'HelixPatternEntries',
});

// API Stack - API Gateway, Lambda functions, Cognito
const apiStack = new ApiStack(app, 'EcosystemCL-ApiStack', {
  ...stackProps,
  stackName: 'EcosystemCL-API',
  description: 'API layer - API Gateway, Lambda, Cognito authentication',
  patternTableName: 'HelixPatternEntries',
  workspaceTableName: 'WorkspaceStates',
  taskQueue: computeStack.taskQueue,
  userPoolId: process.env.COGNITO_USER_POOL_ID || '',
});

// Add stack dependencies
computeStack.addDependency(storageStack);
apiStack.addDependency(computeStack);
