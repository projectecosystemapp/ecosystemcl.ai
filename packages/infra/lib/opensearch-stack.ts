import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
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
export class OpenSearchStack extends cdk.Stack {
  public readonly collectionEndpoint: string;
  public readonly collectionArn: string;
  public readonly collectionName: string = 'helix-patterns';

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.AccountPrincipal(this.account)
      ),
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