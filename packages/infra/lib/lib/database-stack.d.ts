import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
/**
 * Database Stack for ECOSYSTEMCL.AI
 *
 * Hybrid deployment strategy:
 * - IMPORTS existing DynamoDB tables and Cognito User Pool
 * - CREATES new ElastiCache and OpenSearch infrastructure
 *
 * This approach preserves production data while transitioning to CDK management
 */
export declare class DatabaseStack extends cdk.Stack {
    readonly helixPatternTableName: string;
    readonly workspaceStateTableName: string;
    readonly agentProfileTableName: string;
    readonly subscriptionTableName: string;
    readonly userPoolId: string;
    readonly redisClusterEndpoint: string;
    readonly openSearchEndpoint: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
