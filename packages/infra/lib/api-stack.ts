import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  patternTableName: string;
  workspaceTableName: string;
  taskQueue: sqs.Queue;
  userPoolId: string;
}

/**
 * API Stack for ECOSYSTEMCL.AI
 * 
 * Serverless API layer using API Gateway and Lambda functions.
 * Implements JWT-based authentication via Cognito and IAM authorization.
 */
export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly helixLookupFunction: lambda.Function;
  public readonly plannerFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
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
        PATTERN_TABLE_NAME: patternTable.tableName,
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
        PATTERN_TABLE_NAME: patternTable.tableName,
        WORKSPACE_TABLE_NAME: workspaceTable.tableName,
        TASK_QUEUE_URL: props.taskQueue.queueUrl,
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
    
    patternLookupResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.helixLookupFunction),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /planning - MCP Orchestration Endpoints
    const planningResource = this.api.root.addResource('planning');
    const createPlanResource = planningResource.addResource('create');
    
    createPlanResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.plannerFunction),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /health - Health Check (No Auth)
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
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
      }),
      {
        methodResponses: [{ statusCode: '200' }],
      }
    );

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
