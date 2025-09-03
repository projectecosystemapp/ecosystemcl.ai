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
apiStack.addDependency(computeStack);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNvc3lzdGVtY2wtaW5mcmEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9iaW4vZWNvc3lzdGVtY2wtaW5mcmEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBRW5DLHdEQUFvRDtBQUNwRCxnREFBNEM7QUFDNUMsd0RBQW9EO0FBSXBEOzs7Ozs7Ozs7OztHQVdHO0FBRUgsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsa0RBQWtEO0FBQ2xELE1BQU0sR0FBRyxHQUFHO0lBQ1YsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO0lBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLFdBQVc7Q0FDdEQsQ0FBQztBQUVGLE1BQU0sVUFBVSxHQUFHO0lBQ2pCLEdBQUc7SUFDSCxTQUFTLEVBQUUsRUFBRTtJQUNiLFdBQVcsRUFBRSxFQUFFO0lBQ2YsSUFBSSxFQUFFO1FBQ0osT0FBTyxFQUFFLGdCQUFnQjtRQUN6QixXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksWUFBWTtRQUNwRCxTQUFTLEVBQUUsU0FBUztRQUNwQixZQUFZLEVBQUUsWUFBWTtLQUMzQjtDQUNGLENBQUM7QUFFRixrRUFBa0U7QUFDbEUsTUFBTSxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSwwQkFBMEIsRUFBRTtJQUNyRSxHQUFHLFVBQVU7SUFDYixTQUFTLEVBQUUscUJBQXFCO0lBQ2hDLFdBQVcsRUFBRSx3REFBd0Q7Q0FDdEUsQ0FBQyxDQUFDO0FBRUgsMkRBQTJEO0FBQzNELDhFQUE4RTtBQUM5RSxtQkFBbUI7QUFDbkIsdUNBQXVDO0FBQ3ZDLGtGQUFrRjtBQUNsRixNQUFNO0FBRU4sbURBQW1EO0FBQ25ELE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVksQ0FBQyxHQUFHLEVBQUUsMEJBQTBCLEVBQUU7SUFDckUsR0FBRyxVQUFVO0lBQ2IsU0FBUyxFQUFFLHFCQUFxQjtJQUNoQyxXQUFXLEVBQUUsNkRBQTZEO0lBQzFFLGVBQWUsRUFBRSxZQUFZLENBQUMsZUFBZTtJQUM3QyxnQkFBZ0IsRUFBRSxxQkFBcUI7Q0FDeEMsQ0FBQyxDQUFDO0FBRUgscURBQXFEO0FBQ3JELE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxHQUFHLEVBQUUsc0JBQXNCLEVBQUU7SUFDekQsR0FBRyxVQUFVO0lBQ2IsU0FBUyxFQUFFLGlCQUFpQjtJQUM1QixXQUFXLEVBQUUseURBQXlEO0lBQ3RFLGdCQUFnQixFQUFFLHFCQUFxQjtJQUN2QyxrQkFBa0IsRUFBRSxpQkFBaUI7SUFDckMsU0FBUyxFQUFFLFlBQVksQ0FBQyxTQUFTO0lBQ2pDLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLEVBQUU7Q0FDbkQsQ0FBQyxDQUFDO0FBRUgseUJBQXlCO0FBQ3pCLFlBQVksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDekMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBEYXRhYmFzZVN0YWNrIH0gZnJvbSAnLi4vbGliL2RhdGFiYXNlLXN0YWNrJztcbmltcG9ydCB7IENvbXB1dGVTdGFjayB9IGZyb20gJy4uL2xpYi9jb21wdXRlLXN0YWNrJztcbmltcG9ydCB7IEFwaVN0YWNrIH0gZnJvbSAnLi4vbGliL2FwaS1zdGFjayc7XG5pbXBvcnQgeyBTdG9yYWdlU3RhY2sgfSBmcm9tICcuLi9saWIvc3RvcmFnZS1zdGFjayc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XG5cbi8qKlxuICogRUNPU1lTVEVNQ0wuQUkgSW5mcmFzdHJ1Y3R1cmUgQm9vdHN0cmFwXG4gKiBcbiAqIFRoaXMgaXMgdGhlIHByaW1hcnkgQ0RLIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgMTAwJSBBV1MtbmF0aXZlIGFyY2hpdGVjdHVyZS5cbiAqIEFsbCBzdGFja3MgYXJlIGRlcGxveWVkIGluIGRlcGVuZGVuY3kgb3JkZXIgdG8gZW5zdXJlIHByb3BlciByZXNvdXJjZSBwcm92aXNpb25pbmcuXG4gKiBcbiAqIFN0YWNrIERlcGVuZGVuY2llczpcbiAqIDEuIFN0b3JhZ2VTdGFjayAoUzMsIG5vIGRlcGVuZGVuY2llcylcbiAqIDIuIERhdGFiYXNlU3RhY2sgKER5bmFtb0RCLCBFbGFzdGlDYWNoZSwgT3BlblNlYXJjaClcbiAqIDMuIENvbXB1dGVTdGFjayAoRUNTIEZhcmdhdGUsIFNRUywgU3RlcCBGdW5jdGlvbnMpXG4gKiA0LiBBcGlTdGFjayAoQVBJIEdhdGV3YXksIExhbWJkYSwgQ29nbml0bylcbiAqL1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG4vLyBFbnZpcm9ubWVudCBjb25maWd1cmF0aW9uIC0gcHJvZHVjdGlvbiBkZWZhdWx0c1xuY29uc3QgZW52ID0ge1xuICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAndXMtZWFzdC0xJyxcbn07XG5cbmNvbnN0IHN0YWNrUHJvcHMgPSB7XG4gIGVudixcbiAgc3RhY2tOYW1lOiAnJyxcbiAgZGVzY3JpcHRpb246ICcnLFxuICB0YWdzOiB7XG4gICAgUHJvamVjdDogJ0VDT1NZU1RFTUNMLkFJJyxcbiAgICBFbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlQgfHwgJ3Byb2R1Y3Rpb24nLFxuICAgIE1hbmFnZWRCeTogJ0FXUy1DREsnLFxuICAgIEFyY2hpdGVjdHVyZTogJ1NlcnZlcmxlc3MnLFxuICB9LFxufTtcblxuLy8gU3RvcmFnZSBTdGFjayAtIFMzIGJ1Y2tldHMgZm9yIGFydGlmYWN0cyBhbmQgbGFyZ2UgZmlsZSBzdG9yYWdlXG5jb25zdCBzdG9yYWdlU3RhY2sgPSBuZXcgU3RvcmFnZVN0YWNrKGFwcCwgJ0Vjb3N5c3RlbUNMLVN0b3JhZ2VTdGFjaycsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgc3RhY2tOYW1lOiAnRWNvc3lzdGVtQ0wtU3RvcmFnZScsXG4gIGRlc2NyaXB0aW9uOiAnUzMgYnVja2V0cyBmb3IgYXJ0aWZhY3RzLCBlbWJlZGRpbmdzLCBhbmQgdXNlciBjb250ZW50Jyxcbn0pO1xuXG4vLyBPcHRpb25hbCBEYXRhYmFzZSBTdGFjayAtIG1hbmFnZWQgc2VwYXJhdGVseSB3aGVuIG5lZWRlZFxuLy8gY29uc3QgZGF0YWJhc2VTdGFjayA9IG5ldyBEYXRhYmFzZVN0YWNrKGFwcCwgJ0Vjb3N5c3RlbUNMLURhdGFiYXNlU3RhY2snLCB7XG4vLyAgIC4uLnN0YWNrUHJvcHMsXG4vLyAgIHN0YWNrTmFtZTogJ0Vjb3N5c3RlbUNMLURhdGFiYXNlJyxcbi8vICAgZGVzY3JpcHRpb246ICdQcmltYXJ5IGRhdGEgbGF5ZXIgLSBEeW5hbW9EQiwgRWxhc3RpQ2FjaGUsIE9wZW5TZWFyY2gvQXVyb3JhJyxcbi8vIH0pO1xuXG4vLyBDb21wdXRlIFN0YWNrIC0gRUNTIEZhcmdhdGUsIFNRUywgU3RlcCBGdW5jdGlvbnNcbmNvbnN0IGNvbXB1dGVTdGFjayA9IG5ldyBDb21wdXRlU3RhY2soYXBwLCAnRWNvc3lzdGVtQ0wtQ29tcHV0ZVN0YWNrJywge1xuICAuLi5zdGFja1Byb3BzLFxuICBzdGFja05hbWU6ICdFY29zeXN0ZW1DTC1Db21wdXRlJyxcbiAgZGVzY3JpcHRpb246ICdTZXJ2ZXJsZXNzIGNvbXB1dGUgbGF5ZXIgLSBFQ1MgRmFyZ2F0ZSwgU1FTLCBTdGVwIEZ1bmN0aW9ucycsXG4gIGFydGlmYWN0c0J1Y2tldDogc3RvcmFnZVN0YWNrLmFydGlmYWN0c0J1Y2tldCxcbiAgcGF0dGVyblRhYmxlTmFtZTogJ0hlbGl4UGF0dGVybkVudHJpZXMnLFxufSk7XG5cbi8vIEFQSSBTdGFjayAtIEFQSSBHYXRld2F5LCBMYW1iZGEgZnVuY3Rpb25zLCBDb2duaXRvXG5jb25zdCBhcGlTdGFjayA9IG5ldyBBcGlTdGFjayhhcHAsICdFY29zeXN0ZW1DTC1BcGlTdGFjaycsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgc3RhY2tOYW1lOiAnRWNvc3lzdGVtQ0wtQVBJJyxcbiAgZGVzY3JpcHRpb246ICdBUEkgbGF5ZXIgLSBBUEkgR2F0ZXdheSwgTGFtYmRhLCBDb2duaXRvIGF1dGhlbnRpY2F0aW9uJyxcbiAgcGF0dGVyblRhYmxlTmFtZTogJ0hlbGl4UGF0dGVybkVudHJpZXMnLFxuICB3b3Jrc3BhY2VUYWJsZU5hbWU6ICdXb3Jrc3BhY2VTdGF0ZXMnLFxuICB0YXNrUXVldWU6IGNvbXB1dGVTdGFjay50YXNrUXVldWUsXG4gIHVzZXJQb29sSWQ6IHByb2Nlc3MuZW52LkNPR05JVE9fVVNFUl9QT09MX0lEIHx8ICcnLFxufSk7XG5cbi8vIEFkZCBzdGFjayBkZXBlbmRlbmNpZXNcbmNvbXB1dGVTdGFjay5hZGREZXBlbmRlbmN5KHN0b3JhZ2VTdGFjayk7XG5hcGlTdGFjay5hZGREZXBlbmRlbmN5KGNvbXB1dGVTdGFjayk7XG4iXX0=