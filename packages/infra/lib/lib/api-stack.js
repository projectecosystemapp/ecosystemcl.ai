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
exports.ApiStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
/**
 * API Stack for ECOSYSTEMCL.AI
 *
 * Serverless API layer using API Gateway and Lambda functions.
 * Implements JWT-based authentication via Cognito and IAM authorization.
 */
class ApiStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Import referenced resources by name/ID
        const patternTable = dynamodb.Table.fromTableName(this, 'PatternTable', props.patternTableName);
        const workspaceTable = dynamodb.Table.fromTableName(this, 'WorkspaceTable', props.workspaceTableName);
        const userPool = cognito.UserPool.fromUserPoolId(this, 'UserPool', props.userPoolId);
        // =====================================================================
        // API GATEWAY - REST API Configuration
        // =====================================================================
        this.api = new apigateway.RestApi(this, 'EcosystemAPI', {
            restApiName: 'ecosystemcl-api',
            description: 'ECOSYSTEMCL.AI Platform API',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                ],
            },
            deployOptions: {
                stageName: 'v1',
                tracingEnabled: true,
                metricsEnabled: false,
                loggingLevel: apigateway.MethodLoggingLevel.OFF,
                dataTraceEnabled: false,
                throttlingBurstLimit: 1000,
                throttlingRateLimit: 500,
            },
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },
        });
        // =====================================================================
        // COGNITO AUTHORIZER - JWT Validation
        // =====================================================================
        const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'UserPoolAuthorizer', {
            cognitoUserPools: [userPool],
            authorizerName: 'CognitoAuthorizer',
            identitySource: 'method.request.header.Authorization',
        });
        // =====================================================================
        // LAMBDA FUNCTIONS - Core API Handlers
        // =====================================================================
        // Helix Lookup Function - Pattern Query Service
        this.helixLookupFunction = new lambdaNodejs.NodejsFunction(this, 'HelixLookupFunction', {
            functionName: 'ecosystemcl-helix-lookup',
            entry: '../worker/src/tools/helix_lookup.ts',
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            architecture: lambda.Architecture.ARM_64, // Cost optimization
            memorySize: 512,
            timeout: cdk.Duration.seconds(10),
            environment: {
                HELIX_TABLE_NAME: patternTable.tableName,
                OPENSEARCH_ENDPOINT: process.env.OPENSEARCH_ENDPOINT || '',
                REDIS_ENDPOINT: process.env.REDIS_ENDPOINT || '',
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                externalModules: ['@aws-sdk/*'],
                minify: true,
                sourceMap: true,
                forceDockerBundling: true,
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        // Grant DynamoDB permissions
        patternTable.grantReadData(this.helixLookupFunction);
        // Planner Function - MCP Orchestrator
        this.plannerFunction = new lambdaNodejs.NodejsFunction(this, 'PlannerFunction', {
            functionName: 'ecosystemcl-planner',
            entry: '../worker/src/orchestration/planner.ts',
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            architecture: lambda.Architecture.ARM_64,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(30),
            environment: {
                HELIX_TABLE_NAME: patternTable.tableName,
                WORKSPACE_TABLE_NAME: workspaceTable.tableName,
                TASK_QUEUE_URL: props.taskQueue.queueUrl,
                OPENSEARCH_ENDPOINT: process.env.OPENSEARCH_ENDPOINT || '',
                REDIS_ENDPOINT: process.env.REDIS_ENDPOINT || '',
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                externalModules: ['@aws-sdk/*'],
                minify: true,
                sourceMap: true,
                forceDockerBundling: true,
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        // Grant permissions
        patternTable.grantReadData(this.plannerFunction);
        workspaceTable.grantReadWriteData(this.plannerFunction);
        props.taskQueue.grantSendMessages(this.plannerFunction);
        // Grant Bedrock access for AI planning
        this.plannerFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
            ],
            resources: ['*'],
        }));
        // =====================================================================
        // API ROUTES - RESTful Endpoints
        // =====================================================================
        // /patterns - Helix Pattern Endpoints
        const patternsResource = this.api.root.addResource('patterns');
        const patternLookupResource = patternsResource.addResource('lookup');
        patternLookupResource.addMethod('POST', new apigateway.LambdaIntegration(this.helixLookupFunction), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // /planning - MCP Orchestration Endpoints
        const planningResource = this.api.root.addResource('planning');
        const createPlanResource = planningResource.addResource('create');
        createPlanResource.addMethod('POST', new apigateway.LambdaIntegration(this.plannerFunction), {
            authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // /health - Health Check (No Auth)
        const healthResource = this.api.root.addResource('health');
        healthResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [{
                    statusCode: '200',
                    responseTemplates: {
                        'application/json': JSON.stringify({
                            status: 'healthy',
                            service: 'ECOSYSTEMCL.AI',
                            timestamp: new Date().toISOString(),
                        }),
                    },
                }],
            requestTemplates: {
                'application/json': JSON.stringify({ statusCode: 200 }),
            },
        }), {
            methodResponses: [{ statusCode: '200' }],
        });
        // =====================================================================
        // REQUEST VALIDATORS
        // =====================================================================
        new apigateway.RequestValidator(this, 'RequestValidator', {
            restApi: this.api,
            requestValidatorName: 'ValidateBody',
            validateRequestBody: true,
            validateRequestParameters: false,
        });
        // =====================================================================
        // CLOUDFORMATION OUTPUTS
        // =====================================================================
        new cdk.CfnOutput(this, 'ApiEndpoint', {
            value: this.api.url,
            description: 'API Gateway endpoint URL',
            exportName: 'EcosystemCLApiEndpoint',
        });
        new cdk.CfnOutput(this, 'HelixLookupFunctionArn', {
            value: this.helixLookupFunction.functionArn,
            description: 'Helix Lookup Lambda function ARN',
            exportName: 'HelixLookupFunctionArn',
        });
        new cdk.CfnOutput(this, 'PlannerFunctionArn', {
            value: this.plannerFunction.functionArn,
            description: 'Planner Lambda function ARN',
            exportName: 'PlannerFunctionArn',
        });
    }
}
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVFQUF5RDtBQUN6RCwrREFBaUQ7QUFDakQsNEVBQThEO0FBQzlELHlEQUEyQztBQUMzQyxpRUFBbUQ7QUFDbkQsbUVBQXFEO0FBV3JEOzs7OztHQUtHO0FBQ0gsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFLckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix5Q0FBeUM7UUFDekMsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNoRyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDdEcsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFckYsd0VBQXdFO1FBQ3hFLHVDQUF1QztRQUN2Qyx3RUFBd0U7UUFFeEUsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0RCxXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLFdBQVcsRUFBRSw2QkFBNkI7WUFDMUMsMkJBQTJCLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRSxV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b250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGxhbWJkYU5vZGVqcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBzcXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNxcyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuaW50ZXJmYWNlIEFwaVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHBhdHRlcm5UYWJsZU5hbWU6IHN0cmluZztcbiAgd29ya3NwYWNlVGFibGVOYW1lOiBzdHJpbmc7XG4gIHRhc2tRdWV1ZTogc3FzLlF1ZXVlO1xuICB1c2VyUG9vbElkOiBzdHJpbmc7XG59XG5cbi8qKlxuICogQVBJIFN0YWNrIGZvciBFQ09TWVNURU1DTC5BSVxuICogXG4gKiBTZXJ2ZXJsZXNzIEFQSSBsYXllciB1c2luZyBBUEkgR2F0ZXdheSBhbmQgTGFtYmRhIGZ1bmN0aW9ucy5cbiAqIEltcGxlbWVudHMgSldULWJhc2VkIGF1dGhlbnRpY2F0aW9uIHZpYSBDb2duaXRvIGFuZCBJQU0gYXV0aG9yaXphdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFwaVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGFwaTogYXBpZ2F0ZXdheS5SZXN0QXBpO1xuICBwdWJsaWMgcmVhZG9ubHkgaGVsaXhMb29rdXBGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgcGxhbm5lckZ1bmN0aW9uOiBsYW1iZGEuRnVuY3Rpb247XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFwaVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIEltcG9ydCByZWZlcmVuY2VkIHJlc291cmNlcyBieSBuYW1lL0lEXG4gICAgY29uc3QgcGF0dGVyblRhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZSh0aGlzLCAnUGF0dGVyblRhYmxlJywgcHJvcHMucGF0dGVyblRhYmxlTmFtZSk7XG4gICAgY29uc3Qgd29ya3NwYWNlVGFibGUgPSBkeW5hbW9kYi5UYWJsZS5mcm9tVGFibGVOYW1lKHRoaXMsICdXb3Jrc3BhY2VUYWJsZScsIHByb3BzLndvcmtzcGFjZVRhYmxlTmFtZSk7XG4gICAgY29uc3QgdXNlclBvb2wgPSBjb2duaXRvLlVzZXJQb29sLmZyb21Vc2VyUG9vbElkKHRoaXMsICdVc2VyUG9vbCcsIHByb3BzLnVzZXJQb29sSWQpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQVBJIEdBVEVXQVkgLSBSRVNUIEFQSSBDb25maWd1cmF0aW9uXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgdGhpcy5hcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdFY29zeXN0ZW1BUEknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ2Vjb3N5c3RlbWNsLWFwaScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0VDT1NZU1RFTUNMLkFJIFBsYXRmb3JtIEFQSScsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nLFxuICAgICAgICAgICdYLUFwaS1LZXknLFxuICAgICAgICAgICdYLUFtei1TZWN1cml0eS1Ub2tlbicsXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6ICd2MScsXG4gICAgICAgIHRyYWNpbmdFbmFibGVkOiB0cnVlLFxuICAgICAgICBtZXRyaWNzRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuT0ZGLFxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDEwMDAsXG4gICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IDUwMCxcbiAgICAgIH0sXG4gICAgICBlbmRwb2ludENvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgdHlwZXM6IFthcGlnYXRld2F5LkVuZHBvaW50VHlwZS5SRUdJT05BTF0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQ09HTklUTyBBVVRIT1JJWkVSIC0gSldUIFZhbGlkYXRpb25cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICBjb25zdCBhdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ1VzZXJQb29sQXV0aG9yaXplcicsIHtcbiAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFt1c2VyUG9vbF0sXG4gICAgICBhdXRob3JpemVyTmFtZTogJ0NvZ25pdG9BdXRob3JpemVyJyxcbiAgICAgIGlkZW50aXR5U291cmNlOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkF1dGhvcml6YXRpb24nLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gTEFNQkRBIEZVTkNUSU9OUyAtIENvcmUgQVBJIEhhbmRsZXJzXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLy8gSGVsaXggTG9va3VwIEZ1bmN0aW9uIC0gUGF0dGVybiBRdWVyeSBTZXJ2aWNlXG4gICAgdGhpcy5oZWxpeExvb2t1cEZ1bmN0aW9uID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnSGVsaXhMb29rdXBGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ2Vjb3N5c3RlbWNsLWhlbGl4LWxvb2t1cCcsXG4gICAgICBlbnRyeTogJy4uL3dvcmtlci9zcmMvdG9vbHMvaGVsaXhfbG9va3VwLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgYXJjaGl0ZWN0dXJlOiBsYW1iZGEuQXJjaGl0ZWN0dXJlLkFSTV82NCwgLy8gQ29zdCBvcHRpbWl6YXRpb25cbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEhFTElYX1RBQkxFX05BTUU6IHBhdHRlcm5UYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIE9QRU5TRUFSQ0hfRU5EUE9JTlQ6IHByb2Nlc3MuZW52Lk9QRU5TRUFSQ0hfRU5EUE9JTlQgfHwgJycsXG4gICAgICAgIFJFRElTX0VORFBPSU5UOiBwcm9jZXNzLmVudi5SRURJU19FTkRQT0lOVCB8fCAnJyxcbiAgICAgICAgTk9ERV9PUFRJT05TOiAnLS1lbmFibGUtc291cmNlLW1hcHMnLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IER5bmFtb0RCIHBlcm1pc3Npb25zXG4gICAgcGF0dGVyblRhYmxlLmdyYW50UmVhZERhdGEodGhpcy5oZWxpeExvb2t1cEZ1bmN0aW9uKTtcblxuICAgIC8vIFBsYW5uZXIgRnVuY3Rpb24gLSBNQ1AgT3JjaGVzdHJhdG9yXG4gICAgdGhpcy5wbGFubmVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdQbGFubmVyRnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdlY29zeXN0ZW1jbC1wbGFubmVyJyxcbiAgICAgIGVudHJ5OiAnLi4vd29ya2VyL3NyYy9vcmNoZXN0cmF0aW9uL3BsYW5uZXIudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBhcmNoaXRlY3R1cmU6IGxhbWJkYS5BcmNoaXRlY3R1cmUuQVJNXzY0LFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEhFTElYX1RBQkxFX05BTUU6IHBhdHRlcm5UYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFdPUktTUEFDRV9UQUJMRV9OQU1FOiB3b3Jrc3BhY2VUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFRBU0tfUVVFVUVfVVJMOiBwcm9wcy50YXNrUXVldWUucXVldWVVcmwsXG4gICAgICAgIE9QRU5TRUFSQ0hfRU5EUE9JTlQ6IHByb2Nlc3MuZW52Lk9QRU5TRUFSQ0hfRU5EUE9JTlQgfHwgJycsXG4gICAgICAgIFJFRElTX0VORFBPSU5UOiBwcm9jZXNzLmVudi5SRURJU19FTkRQT0lOVCB8fCAnJyxcbiAgICAgICAgTk9ERV9PUFRJT05TOiAnLS1lbmFibGUtc291cmNlLW1hcHMnLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgcGF0dGVyblRhYmxlLmdyYW50UmVhZERhdGEodGhpcy5wbGFubmVyRnVuY3Rpb24pO1xuICAgIHdvcmtzcGFjZVRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0aGlzLnBsYW5uZXJGdW5jdGlvbik7XG4gICAgcHJvcHMudGFza1F1ZXVlLmdyYW50U2VuZE1lc3NhZ2VzKHRoaXMucGxhbm5lckZ1bmN0aW9uKTtcblxuICAgIC8vIEdyYW50IEJlZHJvY2sgYWNjZXNzIGZvciBBSSBwbGFubmluZ1xuICAgIHRoaXMucGxhbm5lckZ1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW0nLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQVBJIFJPVVRFUyAtIFJFU1RmdWwgRW5kcG9pbnRzXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLy8gL3BhdHRlcm5zIC0gSGVsaXggUGF0dGVybiBFbmRwb2ludHNcbiAgICBjb25zdCBwYXR0ZXJuc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncGF0dGVybnMnKTtcbiAgICBjb25zdCBwYXR0ZXJuTG9va3VwUmVzb3VyY2UgPSBwYXR0ZXJuc1Jlc291cmNlLmFkZFJlc291cmNlKCdsb29rdXAnKTtcbiAgICBcbiAgICBwYXR0ZXJuTG9va3VwUmVzb3VyY2UuYWRkTWV0aG9kKFxuICAgICAgJ1BPU1QnLFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5oZWxpeExvb2t1cEZ1bmN0aW9uKSxcbiAgICAgIHtcbiAgICAgICAgYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gL3BsYW5uaW5nIC0gTUNQIE9yY2hlc3RyYXRpb24gRW5kcG9pbnRzXG4gICAgY29uc3QgcGxhbm5pbmdSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3BsYW5uaW5nJyk7XG4gICAgY29uc3QgY3JlYXRlUGxhblJlc291cmNlID0gcGxhbm5pbmdSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY3JlYXRlJyk7XG4gICAgXG4gICAgY3JlYXRlUGxhblJlc291cmNlLmFkZE1ldGhvZChcbiAgICAgICdQT1NUJyxcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMucGxhbm5lckZ1bmN0aW9uKSxcbiAgICAgIHtcbiAgICAgICAgYXV0aG9yaXplcixcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gL2hlYWx0aCAtIEhlYWx0aCBDaGVjayAoTm8gQXV0aClcbiAgICBjb25zdCBoZWFsdGhSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2hlYWx0aCcpO1xuICAgIGhlYWx0aFJlc291cmNlLmFkZE1ldGhvZChcbiAgICAgICdHRVQnLFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTW9ja0ludGVncmF0aW9uKHtcbiAgICAgICAgaW50ZWdyYXRpb25SZXNwb25zZXM6IFt7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgICAgcmVzcG9uc2VUZW1wbGF0ZXM6IHtcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBzdGF0dXM6ICdoZWFsdGh5JyxcbiAgICAgICAgICAgICAgc2VydmljZTogJ0VDT1NZU1RFTUNMLkFJJyxcbiAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9LFxuICAgICAgICB9XSxcbiAgICAgICAgcmVxdWVzdFRlbXBsYXRlczoge1xuICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXNDb2RlOiAyMDAgfSksXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbeyBzdGF0dXNDb2RlOiAnMjAwJyB9XSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gUkVRVUVTVCBWQUxJREFUT1JTXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcih0aGlzLCAnUmVxdWVzdFZhbGlkYXRvcicsIHtcbiAgICAgIHJlc3RBcGk6IHRoaXMuYXBpLFxuICAgICAgcmVxdWVzdFZhbGlkYXRvck5hbWU6ICdWYWxpZGF0ZUJvZHknLFxuICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcbiAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQ0xPVURGT1JNQVRJT04gT1VUUFVUU1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IGVuZHBvaW50IFVSTCcsXG4gICAgICBleHBvcnROYW1lOiAnRWNvc3lzdGVtQ0xBcGlFbmRwb2ludCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSGVsaXhMb29rdXBGdW5jdGlvbkFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmhlbGl4TG9va3VwRnVuY3Rpb24uZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0hlbGl4IExvb2t1cCBMYW1iZGEgZnVuY3Rpb24gQVJOJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdIZWxpeExvb2t1cEZ1bmN0aW9uQXJuJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQbGFubmVyRnVuY3Rpb25Bcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5wbGFubmVyRnVuY3Rpb24uZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ1BsYW5uZXIgTGFtYmRhIGZ1bmN0aW9uIEFSTicsXG4gICAgICBleHBvcnROYW1lOiAnUGxhbm5lckZ1bmN0aW9uQXJuJyxcbiAgICB9KTtcbiAgfVxufVxuIl19