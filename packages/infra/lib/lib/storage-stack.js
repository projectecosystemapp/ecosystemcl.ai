"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
/**
 * Storage Stack for ECOSYSTEMCL.AI
 *
 * Manages all S3 buckets for artifact storage, file uploads, and embeddings.
 */
class StorageStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.StorageStack = StorageStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3N0b3JhZ2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBR3pDOzs7O0dBSUc7QUFDSCxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUt6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLG9EQUFvRDtRQUNwRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDNUQsVUFBVSxFQUFFLHlCQUF5QixHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtZQUN6RCxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsU0FBUyxFQUFFLElBQUk7WUFDZixjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsRUFBRSxFQUFFLHFCQUFxQjtvQkFDekIsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2lCQUNuRDthQUNGO1lBQ0QsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtTQUN4QyxDQUFDLENBQUM7UUFFSCx1Q0FBdUM7UUFDdkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDOUQsVUFBVSxFQUFFLDBCQUEwQixHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtZQUMxRCxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtTQUN4QyxDQUFDLENBQUM7UUFFSCxzQkFBc0I7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDaEUsVUFBVSxFQUFFLDRCQUE0QixHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtZQUM1RCxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsSUFBSSxFQUFFO2dCQUNKO29CQUNFLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO29CQUN4RCxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ3JCLGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDckIsTUFBTSxFQUFFLElBQUk7aUJBQ2I7YUFDRjtZQUNELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07U0FDeEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBNUNELG9DQTRDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8qKlxuICogU3RvcmFnZSBTdGFjayBmb3IgRUNPU1lTVEVNQ0wuQUlcbiAqIFxuICogTWFuYWdlcyBhbGwgUzMgYnVja2V0cyBmb3IgYXJ0aWZhY3Qgc3RvcmFnZSwgZmlsZSB1cGxvYWRzLCBhbmQgZW1iZWRkaW5ncy5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b3JhZ2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBhcnRpZmFjdHNCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IGVtYmVkZGluZ3NCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJDb250ZW50QnVja2V0OiBzMy5CdWNrZXQ7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQXJ0aWZhY3RzIGJ1Y2tldCBmb3IgZ2VuZXJhdGVkIGNvZGUgYW5kIGRvY3VtZW50c1xuICAgIHRoaXMuYXJ0aWZhY3RzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnQXJ0aWZhY3RzQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYGVjb3N5c3RlbWNsLWFydGlmYWN0cy0ke2Nkay5Bd3MuQUNDT1VOVF9JRH1gLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZGVsZXRlLW9sZC12ZXJzaW9ucycsXG4gICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cygzMCksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgLy8gRW1iZWRkaW5ncyBidWNrZXQgZm9yIHZlY3RvciBzdG9yYWdlXG4gICAgdGhpcy5lbWJlZGRpbmdzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnRW1iZWRkaW5nc0J1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBlY29zeXN0ZW1jbC1lbWJlZGRpbmdzLSR7Y2RrLkF3cy5BQ0NPVU5UX0lEfWAsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIGNvbnRlbnQgYnVja2V0XG4gICAgdGhpcy51c2VyQ29udGVudEJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1VzZXJDb250ZW50QnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYGVjb3N5c3RlbWNsLXVzZXItY29udGVudC0ke2Nkay5Bd3MuQUNDT1VOVF9JRH1gLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgY29yczogW1xuICAgICAgICB7XG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtzMy5IdHRwTWV0aG9kcy5HRVQsIHMzLkh0dHBNZXRob2RzLlBVVF0sXG4gICAgICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnKiddLFxuICAgICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgICAgICBtYXhBZ2U6IDMwMDAsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuICB9XG59XG4iXX0=