import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
/**
 * OpenSearch Serverless Stack for ECOSYSTEMCL.AI Helix Knowledge Base
 *
 * Configuration:
 * - Development: 2 OCU (1 indexing, 1 search)
 * - Production: 4 OCU (2 indexing, 2 search)
 * - Time-based scaling via EventBridge Scheduler
 * - Vector search optimized for 1536-dimension embeddings
 */
export declare class OpenSearchStack extends cdk.Stack {
    readonly collectionEndpoint: string;
    readonly collectionArn: string;
    readonly collectionName: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
