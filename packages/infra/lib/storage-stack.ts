import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Storage Stack for ECOSYSTEMCL.AI
 * 
 * Manages all S3 buckets for artifact storage, file uploads, and embeddings.
 */
export class StorageStack extends cdk.Stack {
  public readonly artifactsBucket: s3.Bucket;
  public readonly embeddingsBucket: s3.Bucket;
  public readonly userContentBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Artifacts bucket for generated code and documents
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `ecosystemcl-artifacts-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Embeddings bucket for vector storage
    this.embeddingsBucket = new s3.Bucket(this, 'EmbeddingsBucket', {
      bucketName: `ecosystemcl-embeddings-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // User content bucket
    this.userContentBucket = new s3.Bucket(this, 'UserContentBucket', {
      bucketName: `ecosystemcl-user-content-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
