import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import { Construct } from 'constructs';
/**
 * Database Stack for ECOSYSTEMCL.AI
 *
 * Implements the primary data layer using AWS-native serverless services:
 * - DynamoDB for structured data (patterns, workspace states, subscriptions)
 * - ElastiCache Redis for high-speed caching and rate limiting
 * - OpenSearch for semantic vector search and embeddings
 * - Cognito for identity management
 */
export declare class DatabaseStack extends cdk.Stack {
    readonly helixPatternTable: dynamodb.Table;
    readonly workspaceStateTable: dynamodb.Table;
    readonly agentProfileTable: dynamodb.Table;
    readonly subscriptionTable: dynamodb.Table;
    readonly userPool: cognito.UserPool;
    readonly redisCluster: elasticache.CfnCacheCluster;
    readonly openSearchDomain: opensearch.Domain;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
