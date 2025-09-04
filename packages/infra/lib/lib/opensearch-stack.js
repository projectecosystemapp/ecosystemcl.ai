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
exports.OpenSearchStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const opensearchserverless = __importStar(require("aws-cdk-lib/aws-opensearchserverless"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
/**
 * OpenSearch Serverless Stack for ECOSYSTEMCL.AI Helix Knowledge Base
 *
 * Configuration:
 * - Development: 2 OCU (1 indexing, 1 search)
 * - Production: 4 OCU (2 indexing, 2 search)
 * - Time-based scaling via EventBridge Scheduler
 * - Vector search optimized for 1536-dimension embeddings
 */
class OpenSearchStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.collectionName = 'helix-patterns';
        const environment = process.env.CDK_ENVIRONMENT || 'dev';
        const isDev = environment === 'dev';
        // =====================================================================
        // ENCRYPTION POLICY - Required for OpenSearch Serverless
        // =====================================================================
        const encryptionPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'HelixEncryptionPolicy', {
            name: 'helix-encryption-policy',
            type: 'encryption',
            policy: JSON.stringify({
                Rules: [
                    {
                        Resource: [`collection/${this.collectionName}`],
                        ResourceType: 'collection'
                    }
                ],
                AWSOwnedKey: true
            })
        });
        // =====================================================================
        // NETWORK POLICY - Public access (secured by data policy)
        // =====================================================================
        const networkPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'HelixNetworkPolicy', {
            name: 'helix-network-policy',
            type: 'network',
            policy: JSON.stringify([
                {
                    Rules: [
                        {
                            Resource: [`collection/${this.collectionName}`],
                            ResourceType: 'collection'
                        },
                        {
                            Resource: [`collection/${this.collectionName}`],
                            ResourceType: 'dashboard'
                        }
                    ],
                    AllowFromPublic: true
                }
            ])
        });
        // =====================================================================
        // DATA ACCESS POLICY - IAM Role-based access
        // =====================================================================
        // Create IAM role for data access
        const dataAccessRole = new iam.Role(this, 'HelixDataAccessRole', {
            assumedBy: new iam.CompositePrincipal(new iam.ServicePrincipal('lambda.amazonaws.com'), new iam.AccountPrincipal(this.account)),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
            ]
        });
        const dataPolicy = new opensearchserverless.CfnAccessPolicy(this, 'HelixDataPolicy', {
            name: 'helix-data-policy',
            type: 'data',
            policy: JSON.stringify([
                {
                    Rules: [
                        {
                            Resource: [`collection/${this.collectionName}`],
                            Permission: [
                                'aoss:CreateCollectionItems',
                                'aoss:UpdateCollectionItems',
                                'aoss:DescribeCollectionItems'
                            ],
                            ResourceType: 'collection'
                        },
                        {
                            Resource: [`index/${this.collectionName}/*`],
                            Permission: [
                                'aoss:CreateIndex',
                                'aoss:UpdateIndex',
                                'aoss:DescribeIndex',
                                'aoss:ReadDocument',
                                'aoss:WriteDocument'
                            ],
                            ResourceType: 'index'
                        }
                    ],
                    Principal: [
                        dataAccessRole.roleArn,
                        `arn:aws:iam::${this.account}:root` // Allow account root for admin access
                    ]
                }
            ])
        });
        // =====================================================================
        // OPENSEARCH SERVERLESS COLLECTION
        // =====================================================================
        const collection = new opensearchserverless.CfnCollection(this, 'HelixCollection', {
            name: this.collectionName,
            type: 'VECTORSEARCH',
            description: 'ECOSYSTEMCL.AI Helix Pattern Knowledge Base - Vector Search Collection'
        });
        // Ensure policies are created before collection
        collection.addDependency(encryptionPolicy);
        collection.addDependency(networkPolicy);
        collection.addDependency(dataPolicy);
        this.collectionEndpoint = collection.attrCollectionEndpoint;
        this.collectionArn = collection.attrArn;
        // =====================================================================
        // OCU SCALING LAMBDA - Time-based scaling
        // =====================================================================
        const scalingLambda = new lambdaNodejs.NodejsFunction(this, 'OCUScalingFunction', {
            functionName: 'helix-ocu-scaling',
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'handler',
            code: lambda.Code.fromInline(`
        const { UpdateCollectionCommand, OpenSearchServerlessClient } = require('@aws-sdk/client-opensearchserverless');
        
        exports.handler = async (event) => {
          const client = new OpenSearchServerlessClient({ region: process.env.AWS_REGION });
          const { action } = event;
          
          // Determine OCU settings based on action
          const ocuConfig = action === 'scale-up' 
            ? { indexingOCU: ${isDev ? 1 : 2}, searchOCU: ${isDev ? 1 : 2} }
            : { indexingOCU: 1, searchOCU: 1 }; // Minimum OCU during off-hours
          
          try {
            // Note: OCU scaling API may not be available immediately
            // This is a placeholder for when the API becomes available
            console.log('OCU scaling configuration:', ocuConfig);
            
            // For now, just log the intended action
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'OCU scaling logged',
                config: ocuConfig 
              })
            };
          } catch (error) {
            console.error('OCU scaling error:', error);
            throw error;
          }
        };
      `),
            environment: {
                COLLECTION_NAME: this.collectionName,
                ENVIRONMENT: environment
            }
        });
        // Grant permissions to scaling Lambda
        scalingLambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'aoss:UpdateCollection',
                'aoss:DescribeCollection'
            ],
            resources: [collection.attrArn]
        }));
        // =====================================================================
        // EVENTBRIDGE SCHEDULER - Business hours scaling
        // =====================================================================
        // Scale up at 6 AM UTC (business hours start)
        new events.Rule(this, 'ScaleUpRule', {
            schedule: events.Schedule.cron({
                minute: '0',
                hour: '6',
                weekDay: 'MON-FRI'
            }),
            targets: [new targets.LambdaFunction(scalingLambda, {
                    event: events.RuleTargetInput.fromObject({ action: 'scale-up' })
                })]
        });
        // Scale down at 8 PM UTC (business hours end)
        new events.Rule(this, 'ScaleDownRule', {
            schedule: events.Schedule.cron({
                minute: '0',
                hour: '20',
                weekDay: 'MON-FRI'
            }),
            targets: [new targets.LambdaFunction(scalingLambda, {
                    event: events.RuleTargetInput.fromObject({ action: 'scale-down' })
                })]
        });
        // =====================================================================
        // CLOUDFORMATION OUTPUTS
        // =====================================================================
        new cdk.CfnOutput(this, 'CollectionEndpoint', {
            value: this.collectionEndpoint,
            description: 'OpenSearch Serverless Collection Endpoint',
            exportName: 'HelixCollectionEndpoint'
        });
        new cdk.CfnOutput(this, 'CollectionArn', {
            value: this.collectionArn,
            description: 'OpenSearch Serverless Collection ARN',
            exportName: 'HelixCollectionArn'
        });
        new cdk.CfnOutput(this, 'DataAccessRoleArn', {
            value: dataAccessRole.roleArn,
            description: 'IAM Role for OpenSearch data access',
            exportName: 'HelixDataAccessRoleArn'
        });
        new cdk.CfnOutput(this, 'EstimatedMonthlyCost', {
            value: isDev ? '$350' : '$700',
            description: `Estimated monthly cost (${environment} environment)`,
            exportName: 'HelixEstimatedCost'
        });
    }
}
exports.OpenSearchStack = OpenSearchStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbnNlYXJjaC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL29wZW5zZWFyY2gtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLDJGQUE2RTtBQUM3RSwrREFBaUQ7QUFDakQsd0VBQTBEO0FBQzFELCtEQUFpRDtBQUNqRCw0RUFBOEQ7QUFHOUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFhLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFLNUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUhWLG1CQUFjLEdBQVcsZ0JBQWdCLENBQUM7UUFLeEQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksS0FBSyxDQUFDO1FBQ3pELE1BQU0sS0FBSyxHQUFHLFdBQVcsS0FBSyxLQUFLLENBQUM7UUFFcEMsd0VBQXdFO1FBQ3hFLHlEQUF5RDtRQUN6RCx3RUFBd0U7UUFFeEUsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUNqRyxJQUFJLEVBQUUseUJBQXlCO1lBQy9CLElBQUksRUFBRSxZQUFZO1lBQ2xCLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNyQixLQUFLLEVBQUU7b0JBQ0w7d0JBQ0UsUUFBUSxFQUFFLENBQUMsY0FBYyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQy9DLFlBQVksRUFBRSxZQUFZO3FCQUMzQjtpQkFDRjtnQkFDRCxXQUFXLEVBQUUsSUFBSTthQUNsQixDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgsd0VBQXdFO1FBQ3hFLDBEQUEwRDtRQUMxRCx3RUFBd0U7UUFFeEUs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QUFFO1lBQzNDLEtBQUssRUFBRSxjQUFjLENBQUMsT0FBTztZQUM3QixXQUFXLEVBQUUscUNBQXFDO1lBQ2xELFVBQVUsRUFBRSx3QkFBd0I7U0FDckMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUM5QyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU07WUFDOUIsV0FBVyxFQUFFLDJCQUEyQixXQUFXLGVBQWU7WUFDbEUsVUFBVSxFQUFFLG9CQUFvQjtTQUNqQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF4T0QsMENBd09DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIG9wZW5zZWFyY2hzZXJ2ZXJsZXNzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1vcGVuc2VhcmNoc2VydmVybGVzcyc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBsYW1iZGFOb2RlanMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8qKlxuICogT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIFN0YWNrIGZvciBFQ09TWVNURU1DTC5BSSBIZWxpeCBLbm93bGVkZ2UgQmFzZVxuICogXG4gKiBDb25maWd1cmF0aW9uOlxuICogLSBEZXZlbG9wbWVudDogMiBPQ1UgKDEgaW5kZXhpbmcsIDEgc2VhcmNoKSBcbiAqIC0gUHJvZHVjdGlvbjogNCBPQ1UgKDIgaW5kZXhpbmcsIDIgc2VhcmNoKVxuICogLSBUaW1lLWJhc2VkIHNjYWxpbmcgdmlhIEV2ZW50QnJpZGdlIFNjaGVkdWxlclxuICogLSBWZWN0b3Igc2VhcmNoIG9wdGltaXplZCBmb3IgMTUzNi1kaW1lbnNpb24gZW1iZWRkaW5nc1xuICovXG5leHBvcnQgY2xhc3MgT3BlblNlYXJjaFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGNvbGxlY3Rpb25FbmRwb2ludDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgY29sbGVjdGlvbkFybjogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgY29sbGVjdGlvbk5hbWU6IHN0cmluZyA9ICdoZWxpeC1wYXR0ZXJucyc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnQgPSBwcm9jZXNzLmVudi5DREtfRU5WSVJPTk1FTlQgfHwgJ2Rldic7XG4gICAgY29uc3QgaXNEZXYgPSBlbnZpcm9ubWVudCA9PT0gJ2Rldic7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBFTkNSWVBUSU9OIFBPTElDWSAtIFJlcXVpcmVkIGZvciBPcGVuU2VhcmNoIFNlcnZlcmxlc3NcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICBjb25zdCBlbmNyeXB0aW9uUG9saWN5ID0gbmV3IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmblNlY3VyaXR5UG9saWN5KHRoaXMsICdIZWxpeEVuY3J5cHRpb25Qb2xpY3knLCB7XG4gICAgICBuYW1lOiAnaGVsaXgtZW5jcnlwdGlvbi1wb2xpY3knLFxuICAgICAgdHlwZTogJ2VuY3J5cHRpb24nLFxuICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIFJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgUmVzb3VyY2U6IFtgY29sbGVjdGlvbi8ke3RoaXMuY29sbGVjdGlvbk5hbWV9YF0sXG4gICAgICAgICAgICBSZXNvdXJjZVR5cGU6ICdjb2xsZWN0aW9uJ1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgQVdTT3duZWRLZXk6IHRydWVcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBORVRXT1JLIFBPTElDWSAtIFB1YmxpYyBhY2Nlc3MgKHNlY3VyZWQgYnkgZGF0YSBwb2xpY3kpXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgY29uc3QgbmV0d29ya1BvbGljeSA9IG5ldyBvcGVuc2VhcmNoc2VydmVybGVzcy5DZm5TZWN1cml0eVBvbGljeSh0aGlzLCAnSGVsaXhOZXR3b3JrUG9saWN5Jywge1xuICAgICAgbmFtZTogJ2hlbGl4LW5ldHdvcmstcG9saWN5JyxcbiAgICAgIHR5cGU6ICduZXR3b3JrJyxcbiAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICB7XG4gICAgICAgICAgUnVsZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFtgY29sbGVjdGlvbi8ke3RoaXMuY29sbGVjdGlvbk5hbWV9YF0sXG4gICAgICAgICAgICAgIFJlc291cmNlVHlwZTogJ2NvbGxlY3Rpb24nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBSZXNvdXJjZTogW2Bjb2xsZWN0aW9uLyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2VUeXBlOiAnZGFzaGJvYXJkJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF0sXG4gICAgICAgICAgQWxsb3dGcm9tUHVibGljOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIF0pXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBEQVRBIEFDQ0VTUyBQT0xJQ1kgLSBJQU0gUm9sZS1iYXNlZCBhY2Nlc3NcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvLyBDcmVhdGUgSUFNIHJvbGUgZm9yIGRhdGEgYWNjZXNzXG4gICAgY29uc3QgZGF0YUFjY2Vzc1JvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0hlbGl4RGF0YUFjY2Vzc1JvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uQ29tcG9zaXRlUHJpbmNpcGFsKFxuICAgICAgICBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICAgIG5ldyBpYW0uQWNjb3VudFByaW5jaXBhbCh0aGlzLmFjY291bnQpXG4gICAgICApLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpXG4gICAgICBdXG4gICAgfSk7XG5cbiAgICBjb25zdCBkYXRhUG9saWN5ID0gbmV3IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmbkFjY2Vzc1BvbGljeSh0aGlzLCAnSGVsaXhEYXRhUG9saWN5Jywge1xuICAgICAgbmFtZTogJ2hlbGl4LWRhdGEtcG9saWN5JyxcbiAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICB7XG4gICAgICAgICAgUnVsZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFtgY29sbGVjdGlvbi8ke3RoaXMuY29sbGVjdGlvbk5hbWV9YF0sXG4gICAgICAgICAgICAgIFBlcm1pc3Npb246IFtcbiAgICAgICAgICAgICAgICAnYW9zczpDcmVhdGVDb2xsZWN0aW9uSXRlbXMnLFxuICAgICAgICAgICAgICAgICdhb3NzOlVwZGF0ZUNvbGxlY3Rpb25JdGVtcycsXG4gICAgICAgICAgICAgICAgJ2Fvc3M6RGVzY3JpYmVDb2xsZWN0aW9uSXRlbXMnXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlVHlwZTogJ2NvbGxlY3Rpb24nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBSZXNvdXJjZTogW2BpbmRleC8ke3RoaXMuY29sbGVjdGlvbk5hbWV9LypgXSxcbiAgICAgICAgICAgICAgUGVybWlzc2lvbjogW1xuICAgICAgICAgICAgICAgICdhb3NzOkNyZWF0ZUluZGV4JyxcbiAgICAgICAgICAgICAgICAnYW9zczpVcGRhdGVJbmRleCcsXG4gICAgICAgICAgICAgICAgJ2Fvc3M6RGVzY3JpYmVJbmRleCcsXG4gICAgICAgICAgICAgICAgJ2Fvc3M6UmVhZERvY3VtZW50JyxcbiAgICAgICAgICAgICAgICAnYW9zczpXcml0ZURvY3VtZW50J1xuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZVR5cGU6ICdpbmRleCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdLFxuICAgICAgICAgIFByaW5jaXBhbDogW1xuICAgICAgICAgICAgZGF0YUFjY2Vzc1JvbGUucm9sZUFybixcbiAgICAgICAgICAgIGBhcm46YXdzOmlhbTo6JHt0aGlzLmFjY291bnR9OnJvb3RgIC8vIEFsbG93IGFjY291bnQgcm9vdCBmb3IgYWRtaW4gYWNjZXNzXG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBdKVxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gT1BFTlNFQVJDSCBTRVJWRVJMRVNTIENPTExFQ1RJT05cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gbmV3IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmbkNvbGxlY3Rpb24odGhpcywgJ0hlbGl4Q29sbGVjdGlvbicsIHtcbiAgICAgIG5hbWU6IHRoaXMuY29sbGVjdGlvbk5hbWUsXG4gICAgICB0eXBlOiAnVkVDVE9SU0VBUkNIJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRUNPU1lTVEVNQ0wuQUkgSGVsaXggUGF0dGVybiBLbm93bGVkZ2UgQmFzZSAtIFZlY3RvciBTZWFyY2ggQ29sbGVjdGlvbidcbiAgICB9KTtcblxuICAgIC8vIEVuc3VyZSBwb2xpY2llcyBhcmUgY3JlYXRlZCBiZWZvcmUgY29sbGVjdGlvblxuICAgIGNvbGxlY3Rpb24uYWRkRGVwZW5kZW5jeShlbmNyeXB0aW9uUG9saWN5KTtcbiAgICBjb2xsZWN0aW9uLmFkZERlcGVuZGVuY3kobmV0d29ya1BvbGljeSk7XG4gICAgY29sbGVjdGlvbi5hZGREZXBlbmRlbmN5KGRhdGFQb2xpY3kpO1xuXG4gICAgdGhpcy5jb2xsZWN0aW9uRW5kcG9pbnQgPSBjb2xsZWN0aW9uLmF0dHJDb2xsZWN0aW9uRW5kcG9pbnQ7XG4gICAgdGhpcy5jb2xsZWN0aW9uQXJuID0gY29sbGVjdGlvbi5hdHRyQXJuO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gT0NVIFNDQUxJTkcgTEFNQkRBIC0gVGltZS1iYXNlZCBzY2FsaW5nXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgY29uc3Qgc2NhbGluZ0xhbWJkYSA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ09DVVNjYWxpbmdGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ2hlbGl4LW9jdS1zY2FsaW5nJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXG4gICAgICAgIGNvbnN0IHsgVXBkYXRlQ29sbGVjdGlvbkNvbW1hbmQsIE9wZW5TZWFyY2hTZXJ2ZXJsZXNzQ2xpZW50IH0gPSByZXF1aXJlKCdAYXdzLXNkay9jbGllbnQtb3BlbnNlYXJjaHNlcnZlcmxlc3MnKTtcbiAgICAgICAgXG4gICAgICAgIGV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNsaWVudCA9IG5ldyBPcGVuU2VhcmNoU2VydmVybGVzc0NsaWVudCh7IHJlZ2lvbjogcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTiB9KTtcbiAgICAgICAgICBjb25zdCB7IGFjdGlvbiB9ID0gZXZlbnQ7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gRGV0ZXJtaW5lIE9DVSBzZXR0aW5ncyBiYXNlZCBvbiBhY3Rpb25cbiAgICAgICAgICBjb25zdCBvY3VDb25maWcgPSBhY3Rpb24gPT09ICdzY2FsZS11cCcgXG4gICAgICAgICAgICA/IHsgaW5kZXhpbmdPQ1U6ICR7aXNEZXYgPyAxIDogMn0sIHNlYXJjaE9DVTogJHtpc0RldiA/IDEgOiAyfSB9XG4gICAgICAgICAgICA6IHsgaW5kZXhpbmdPQ1U6IDEsIHNlYXJjaE9DVTogMSB9OyAvLyBNaW5pbXVtIE9DVSBkdXJpbmcgb2ZmLWhvdXJzXG4gICAgICAgICAgXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIE5vdGU6IE9DVSBzY2FsaW5nIEFQSSBtYXkgbm90IGJlIGF2YWlsYWJsZSBpbW1lZGlhdGVseVxuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciB3aGVuIHRoZSBBUEkgYmVjb21lcyBhdmFpbGFibGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdPQ1Ugc2NhbGluZyBjb25maWd1cmF0aW9uOicsIG9jdUNvbmZpZyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEZvciBub3csIGp1c3QgbG9nIHRoZSBpbnRlbmRlZCBhY3Rpb25cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnT0NVIHNjYWxpbmcgbG9nZ2VkJyxcbiAgICAgICAgICAgICAgICBjb25maWc6IG9jdUNvbmZpZyBcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ09DVSBzY2FsaW5nIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQ09MTEVDVElPTl9OQU1FOiB0aGlzLmNvbGxlY3Rpb25OYW1lLFxuICAgICAgICBFTlZJUk9OTUVOVDogZW52aXJvbm1lbnRcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIHRvIHNjYWxpbmcgTGFtYmRhXG4gICAgc2NhbGluZ0xhbWJkYS5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYW9zczpVcGRhdGVDb2xsZWN0aW9uJyxcbiAgICAgICAgJ2Fvc3M6RGVzY3JpYmVDb2xsZWN0aW9uJ1xuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW2NvbGxlY3Rpb24uYXR0ckFybl1cbiAgICB9KSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBFVkVOVEJSSURHRSBTQ0hFRFVMRVIgLSBCdXNpbmVzcyBob3VycyBzY2FsaW5nXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLy8gU2NhbGUgdXAgYXQgNiBBTSBVVEMgKGJ1c2luZXNzIGhvdXJzIHN0YXJ0KVxuICAgIG5ldyBldmVudHMuUnVsZSh0aGlzLCAnU2NhbGVVcFJ1bGUnLCB7XG4gICAgICBzY2hlZHVsZTogZXZlbnRzLlNjaGVkdWxlLmNyb24oeyBcbiAgICAgICAgbWludXRlOiAnMCcsIFxuICAgICAgICBob3VyOiAnNicsXG4gICAgICAgIHdlZWtEYXk6ICdNT04tRlJJJ1xuICAgICAgfSksXG4gICAgICB0YXJnZXRzOiBbbmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24oc2NhbGluZ0xhbWJkYSwge1xuICAgICAgICBldmVudDogZXZlbnRzLlJ1bGVUYXJnZXRJbnB1dC5mcm9tT2JqZWN0KHsgYWN0aW9uOiAnc2NhbGUtdXAnIH0pXG4gICAgICB9KV1cbiAgICB9KTtcblxuICAgIC8vIFNjYWxlIGRvd24gYXQgOCBQTSBVVEMgKGJ1c2luZXNzIGhvdXJzIGVuZClcbiAgICBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ1NjYWxlRG93blJ1bGUnLCB7XG4gICAgICBzY2hlZHVsZTogZXZlbnRzLlNjaGVkdWxlLmNyb24oeyBcbiAgICAgICAgbWludXRlOiAnMCcsIFxuICAgICAgICBob3VyOiAnMjAnLFxuICAgICAgICB3ZWVrRGF5OiAnTU9OLUZSSSdcbiAgICAgIH0pLFxuICAgICAgdGFyZ2V0czogW25ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKHNjYWxpbmdMYW1iZGEsIHtcbiAgICAgICAgZXZlbnQ6IGV2ZW50cy5SdWxlVGFyZ2V0SW5wdXQuZnJvbU9iamVjdCh7IGFjdGlvbjogJ3NjYWxlLWRvd24nIH0pXG4gICAgICB9KV1cbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIENMT1VERk9STUFUSU9OIE9VVFBVVFNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ29sbGVjdGlvbkVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IHRoaXMuY29sbGVjdGlvbkVuZHBvaW50LFxuICAgICAgZGVzY3JpcHRpb246ICdPcGVuU2VhcmNoIFNlcnZlcmxlc3MgQ29sbGVjdGlvbiBFbmRwb2ludCcsXG4gICAgICBleHBvcnROYW1lOiAnSGVsaXhDb2xsZWN0aW9uRW5kcG9pbnQnXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ29sbGVjdGlvbkFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmNvbGxlY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ09wZW5TZWFyY2ggU2VydmVybGVzcyBDb2xsZWN0aW9uIEFSTicsXG4gICAgICBleHBvcnROYW1lOiAnSGVsaXhDb2xsZWN0aW9uQXJuJ1xuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RhdGFBY2Nlc3NSb2xlQXJuJywge1xuICAgICAgdmFsdWU6IGRhdGFBY2Nlc3NSb2xlLnJvbGVBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0lBTSBSb2xlIGZvciBPcGVuU2VhcmNoIGRhdGEgYWNjZXNzJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdIZWxpeERhdGFBY2Nlc3NSb2xlQXJuJ1xuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0VzdGltYXRlZE1vbnRobHlDb3N0Jywge1xuICAgICAgdmFsdWU6IGlzRGV2ID8gJyQzNTAnIDogJyQ3MDAnLFxuICAgICAgZGVzY3JpcHRpb246IGBFc3RpbWF0ZWQgbW9udGhseSBjb3N0ICgke2Vudmlyb25tZW50fSBlbnZpcm9ubWVudClgLFxuICAgICAgZXhwb3J0TmFtZTogJ0hlbGl4RXN0aW1hdGVkQ29zdCdcbiAgICB9KTtcbiAgfVxufSJdfQ==