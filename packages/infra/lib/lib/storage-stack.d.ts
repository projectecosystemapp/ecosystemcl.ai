import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
/**
 * Storage Stack for ECOSYSTEMCL.AI
 *
 * Manages all S3 buckets for artifact storage, file uploads, and embeddings.
 */
export declare class StorageStack extends cdk.Stack {
    readonly artifactsBucket: s3.Bucket;
    readonly embeddingsBucket: s3.Bucket;
    readonly userContentBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
