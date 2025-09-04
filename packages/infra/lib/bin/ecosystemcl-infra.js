#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const compute_stack_1 = require("../lib/compute-stack");
const api_stack_1 = require("../lib/api-stack");
const storage_stack_1 = require("../lib/storage-stack");
const opensearch_stack_1 = require("../lib/opensearch-stack");
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
const storageStack = new storage_stack_1.StorageStack(app, 'EcosystemCL-StorageStack', {
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
// OpenSearch Serverless Stack - Vector search for Helix patterns
const openSearchStack = new opensearch_stack_1.OpenSearchStack(app, 'EcosystemCL-OpenSearchStack', {
    ...stackProps,
    stackName: 'EcosystemCL-OpenSearch',
    description: 'OpenSearch Serverless for Helix vector search (2 OCU dev / 4 OCU prod)',
});
// Compute Stack - ECS Fargate, SQS, Step Functions
const computeStack = new compute_stack_1.ComputeStack(app, 'EcosystemCL-ComputeStack', {
    ...stackProps,
    stackName: 'EcosystemCL-Compute',
    description: 'Serverless compute layer - ECS Fargate, SQS, Step Functions',
    artifactsBucket: storageStack.artifactsBucket,
    patternTableName: 'HelixPatternEntries',
});
// API Stack - API Gateway, Lambda functions, Cognito
const apiStack = new api_stack_1.ApiStack(app, 'EcosystemCL-ApiStack', {
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
computeStack.addDependency(openSearchStack); // CDC Lambda needs OpenSearch endpoint
apiStack.addDependency(computeStack);
apiStack.addDependency(openSearchStack); // API Lambdas need OpenSearch endpoint
// Export OpenSearch endpoint for Lambda environment variables
process.env.OPENSEARCH_ENDPOINT = openSearchStack.collectionEndpoint;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNvc3lzdGVtY2wtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9iaW4vZWNvc3lzdGVtY2wtaW5mcmEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBRW5DLHdEQUFvRDtBQUNwRCxnREFBNEM7QUFDNUMsd0RBQW9EO0FBQ3BELDhEQUEwRDtBQUkxRDs7Ozs7Ozs7Ozs7R0FXRztBQUVILE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLGtEQUFrRDtBQUNsRCxNQUFNLEdBQUcsR0FBRztJQUNWLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtJQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxXQUFXO0NBQ3RELENBQUM7QUFFRixNQUFNLFVBQVUsR0FBRztJQUNqQixHQUFHO0lBQ0gsU0FBUyxFQUFFLEVBQUU7SUFDYixXQUFXLEVBQUUsRUFBRTtJQUNmLElBQUksRUFBRTtRQUNKLE9BQU8sRUFBRSxnQkFBZ0I7UUFDekIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLFlBQVk7UUFDcEQsU0FBUyxFQUFFLFNBQVM7UUFDcEIsWUFBWSxFQUFFLFlBQVk7S0FDM0I7Q0FDRixDQUFDO0FBRUYsa0VBQWtFO0FBQ2xFLE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVksQ0FBQyxHQUFHLEVBQUUsMEJBQTBCLEVBQUU7SUFDckUsR0FBRyxVQUFVO0lBQ2IsU0FBUyxFQUFFLHFCQUFxQjtJQUNoQyxXQUFXLEVBQUUsd0RBQXdEO0NBQ3RFLENBQUMsQ0FBQztBQUVILDJEQUEyRDtBQUMzRCw4RUFBOEU7QUFDOUUsbUJBQW1CO0FBQ25CLHVDQUF1QztBQUN2QyxrRkFBa0Y7QUFDbEYsTUFBTTtBQUVOLGlFQUFpRTtBQUNqRSxNQUFNLGVBQWUsR0FBRyxJQUFJLGtDQUFlLENBQUMsR0FBRyxFQUFFLDZCQUE2QixFQUFFO0lBQzlFLEdBQUcsVUFBVTtJQUNiLFNBQVMsRUFBRSx3QkFBd0I7SUFDbkMsV0FBVyxFQUFFLHdFQUF3RTtDQUN0RixDQUFDLENBQUM7QUFFSCxtREFBbUQ7QUFDbkQsTUFBTSxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSwwQkFBMEIsRUFBRTtJQUNyRSxHQUFHLFVBQVU7SUFDYixTQUFTLEVBQUUscUJBQXFCO0lBQ2hDLFdBQVcsRUFBRSw2REFBNkQ7SUFDMUUsZUFBZSxFQUFFLFlBQVksQ0FBQyxlQUFlO0lBQzdDLGdCQUFnQixFQUFFLHFCQUFxQjtDQUN4QyxDQUFDLENBQUM7QUFFSCxxREFBcUQ7QUFDckQsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxzQkFBc0IsRUFBRTtJQUN6RCxHQUFHLFVBQVU7SUFDYixTQUFTLEVBQUUsaUJBQWlCO0lBQzVCLFdBQVcsRUFBRSx5REFBeUQ7SUFDdEUsZ0JBQWdCLEVBQUUscUJBQXFCO0lBQ3ZDLGtCQUFrQixFQUFFLGlCQUFpQjtJQUNyQyxTQUFTLEVBQUUsWUFBWSxDQUFDLFNBQVM7SUFDakMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUksRUFBRTtDQUNuRCxDQUFDLENBQUM7QUFFSCx5QkFBeUI7QUFDekIsWUFBWSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN6QyxZQUFZLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsdUNBQXVDO0FBQ3BGLFFBQVEsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDckMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLHVDQUF1QztBQUVoRiw4REFBOEQ7QUFDOUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsR0FBRyxlQUFlLENBQUMsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgRGF0YWJhc2VTdGFjayB9IGZyb20gJy4uL2xpYi9kYXRhYmFzZS1zdGFjayc7XG5pbXBvcnQgeyBDb21wdXRlU3RhY2sgfSBmcm9tICcuLi9saWIvY29tcHV0ZS1zdGFjayc7XG5pbXBvcnQgeyBBcGlTdGFjayB9IGZyb20gJy4uL2xpYi9hcGktc3RhY2snO1xuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSAnLi4vbGliL3N0b3JhZ2Utc3RhY2snO1xuaW1wb3J0IHsgT3BlblNlYXJjaFN0YWNrIH0gZnJvbSAnLi4vbGliL29wZW5zZWFyY2gtc3RhY2snO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuXG4vKipcbiAqIEVDT1NZU1RFTUNMLkFJIEluZnJhc3RydWN0dXJlIEJvb3RzdHJhcFxuICogXG4gKiBUaGlzIGlzIHRoZSBwcmltYXJ5IENESyBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIDEwMCUgQVdTLW5hdGl2ZSBhcmNoaXRlY3R1cmUuXG4gKiBBbGwgc3RhY2tzIGFyZSBkZXBsb3llZCBpbiBkZXBlbmRlbmN5IG9yZGVyIHRvIGVuc3VyZSBwcm9wZXIgcmVzb3VyY2UgcHJvdmlzaW9uaW5nLlxuICogXG4gKiBTdGFjayBEZXBlbmRlbmNpZXM6XG4gKiAxLiBTdG9yYWdlU3RhY2sgKFMzLCBubyBkZXBlbmRlbmNpZXMpXG4gKiAyLiBEYXRhYmFzZVN0YWNrIChEeW5hbW9EQiwgRWxhc3RpQ2FjaGUsIE9wZW5TZWFyY2gpXG4gKiAzLiBDb21wdXRlU3RhY2sgKEVDUyBGYXJnYXRlLCBTUVMsIFN0ZXAgRnVuY3Rpb25zKVxuICogNC4gQXBpU3RhY2sgKEFQSSBHYXRld2F5LCBMYW1iZGEsIENvZ25pdG8pXG4gKi9cblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8gRW52aXJvbm1lbnQgY29uZmlndXJhdGlvbiAtIHByb2R1Y3Rpb24gZGVmYXVsdHNcbmNvbnN0IGVudiA9IHtcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgJ3VzLWVhc3QtMScsXG59O1xuXG5jb25zdCBzdGFja1Byb3BzID0ge1xuICBlbnYsXG4gIHN0YWNrTmFtZTogJycsXG4gIGRlc2NyaXB0aW9uOiAnJyxcbiAgdGFnczoge1xuICAgIFByb2plY3Q6ICdFQ09TWVNURU1DTC5BSScsXG4gICAgRW52aXJvbm1lbnQ6IHByb2Nlc3MuZW52LkVOVklST05NRU5UIHx8ICdwcm9kdWN0aW9uJyxcbiAgICBNYW5hZ2VkQnk6ICdBV1MtQ0RLJyxcbiAgICBBcmNoaXRlY3R1cmU6ICdTZXJ2ZXJsZXNzJyxcbiAgfSxcbn07XG5cbi8vIFN0b3JhZ2UgU3RhY2sgLSBTMyBidWNrZXRzIGZvciBhcnRpZmFjdHMgYW5kIGxhcmdlIGZpbGUgc3RvcmFnZVxuY29uc3Qgc3RvcmFnZVN0YWNrID0gbmV3IFN0b3JhZ2VTdGFjayhhcHAsICdFY29zeXN0ZW1DTC1TdG9yYWdlU3RhY2snLCB7XG4gIC4uLnN0YWNrUHJvcHMsXG4gIHN0YWNrTmFtZTogJ0Vjb3N5c3RlbUNMLVN0b3JhZ2UnLFxuICBkZXNjcmlwdGlvbjogJ1MzIGJ1Y2tldHMgZm9yIGFydGlmYWN0cywgZW1iZWRkaW5ncywgYW5kIHVzZXIgY29udGVudCcsXG59KTtcblxuLy8gT3B0aW9uYWwgRGF0YWJhc2UgU3RhY2sgLSBtYW5hZ2VkIHNlcGFyYXRlbHkgd2hlbiBuZWVkZWRcbi8vIGNvbnN0IGRhdGFiYXNlU3RhY2sgPSBuZXcgRGF0YWJhc2VTdGFjayhhcHAsICdFY29zeXN0ZW1DTC1EYXRhYmFzZVN0YWNrJywge1xuLy8gICAuLi5zdGFja1Byb3BzLFxuLy8gICBzdGFja05hbWU6ICdFY29zeXN0ZW1DTC1EYXRhYmFzZScsXG4vLyAgIGRlc2NyaXB0aW9uOiAnUHJpbWFyeSBkYXRhIGxheWVyIC0gRHluYW1vREIsIEVsYXN0aUNhY2hlLCBPcGVuU2VhcmNoL0F1cm9yYScsXG4vLyB9KTtcblxuLy8gT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIFN0YWNrIC0gVmVjdG9yIHNlYXJjaCBmb3IgSGVsaXggcGF0dGVybnNcbmNvbnN0IG9wZW5TZWFyY2hTdGFjayA9IG5ldyBPcGVuU2VhcmNoU3RhY2soYXBwLCAnRWNvc3lzdGVtQ0wtT3BlblNlYXJjaFN0YWNrJywge1xuICAuLi5zdGFja1Byb3BzLFxuICBzdGFja05hbWU6ICdFY29zeXN0ZW1DTC1PcGVuU2VhcmNoJyxcbiAgZGVzY3JpcHRpb246ICdPcGVuU2VhcmNoIFNlcnZlcmxlc3MgZm9yIEhlbGl4IHZlY3RvciBzZWFyY2ggKDIgT0NVIGRldiAvIDQgT0NVIHByb2QpJyxcbn0pO1xuXG4vLyBDb21wdXRlIFN0YWNrIC0gRUNTIEZhcmdhdGUsIFNRUywgU3RlcCBGdW5jdGlvbnNcbmNvbnN0IGNvbXB1dGVTdGFjayA9IG5ldyBDb21wdXRlU3RhY2soYXBwLCAnRWNvc3lzdGVtQ0wtQ29tcHV0ZVN0YWNrJywge1xuICAuLi5zdGFja1Byb3BzLFxuICBzdGFja05hbWU6ICdFY29zeXN0ZW1DTC1Db21wdXRlJyxcbiAgZGVzY3JpcHRpb246ICdTZXJ2ZXJsZXNzIGNvbXB1dGUgbGF5ZXIgLSBFQ1MgRmFyZ2F0ZSwgU1FTLCBTdGVwIEZ1bmN0aW9ucycsXG4gIGFydGlmYWN0c0J1Y2tldDogc3RvcmFnZVN0YWNrLmFydGlmYWN0c0J1Y2tldCxcbiAgcGF0dGVyblRhYmxlTmFtZTogJ0hlbGl4UGF0dGVybkVudHJpZXMnLFxufSk7XG5cbi8vIEFQSSBTdGFjayAtIEFQSSBHYXRld2F5LCBMYW1iZGEgZnVuY3Rpb25zLCBDb2duaXRvXG5jb25zdCBhcGlTdGFjayA9IG5ldyBBcGlTdGFjayhhcHAsICdFY29zeXN0ZW1DTC1BcGlTdGFjaycsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgc3RhY2tOYW1lOiAnRWNvc3lzdGVtQ0wtQVBJJyxcbiAgZGVzY3JpcHRpb246ICdBUEkgbGF5ZXIgLSBBUEkgR2F0ZXdheSwgTGFtYmRhLCBDb2duaXRvIGF1dGhlbnRpY2F0aW9uJyxcbiAgcGF0dGVyblRhYmxlTmFtZTogJ0hlbGl4UGF0dGVybkVudHJpZXMnLFxuICB3b3Jrc3BhY2VUYWJsZU5hbWU6ICdXb3Jrc3BhY2VTdGF0ZXMnLFxuICB0YXNrUXVldWU6IGNvbXB1dGVTdGFjay50YXNrUXVldWUsXG4gIHVzZXJQb29sSWQ6IHByb2Nlc3MuZW52LkNPR05JVE9fVVNFUl9QT09MX0lEIHx8ICcnLFxufSk7XG5cbi8vIEFkZCBzdGFjayBkZXBlbmRlbmNpZXNcbmNvbXB1dGVTdGFjay5hZGREZXBlbmRlbmN5KHN0b3JhZ2VTdGFjayk7XG5jb21wdXRlU3RhY2suYWRkRGVwZW5kZW5jeShvcGVuU2VhcmNoU3RhY2spOyAvLyBDREMgTGFtYmRhIG5lZWRzIE9wZW5TZWFyY2ggZW5kcG9pbnRcbmFwaVN0YWNrLmFkZERlcGVuZGVuY3koY29tcHV0ZVN0YWNrKTtcbmFwaVN0YWNrLmFkZERlcGVuZGVuY3kob3BlblNlYXJjaFN0YWNrKTsgLy8gQVBJIExhbWJkYXMgbmVlZCBPcGVuU2VhcmNoIGVuZHBvaW50XG5cbi8vIEV4cG9ydCBPcGVuU2VhcmNoIGVuZHBvaW50IGZvciBMYW1iZGEgZW52aXJvbm1lbnQgdmFyaWFibGVzXG5wcm9jZXNzLmVudi5PUEVOU0VBUkNIX0VORFBPSU5UID0gb3BlblNlYXJjaFN0YWNrLmNvbGxlY3Rpb25FbmRwb2ludDtcbiJdfQ==