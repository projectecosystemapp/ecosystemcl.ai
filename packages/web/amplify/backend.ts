import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { myFirstFunction } from './my-first-function/resource';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Stack } from 'aws-cdk-lib';

/**
 * ECOSYSTEMCL.AI - Fully AWS-Native Backend Configuration
 * This configures all AWS services needed for the autonomous agent platform
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  myFirstFunction,
});

// Get the underlying CDK stack
const backendStack = Stack.of(backend.auth.resources);

// 1. DynamoDB Tables for Agent State and Sessions
const agentStateTable = new dynamodb.Table(backendStack, 'AgentStateTable', {
  tableName: 'ecosystem-agent-state',
  partitionKey: {
    name: 'agentId',
    type: dynamodb.AttributeType.STRING,
  },
  sortKey: {
    name: 'timestamp',
    type: dynamodb.AttributeType.NUMBER,
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
});

const workspaceTable = new dynamodb.Table(backendStack, 'WorkspaceTable', {
  tableName: 'ecosystem-workspaces',
  partitionKey: {
    name: 'workspaceId',
    type: dynamodb.AttributeType.STRING,
  },
  sortKey: {
    name: 'userId',
    type: dynamodb.AttributeType.STRING,
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  globalSecondaryIndexes: [
    {
      indexName: 'UserIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    },
  ],
});

const planExecutionTable = new dynamodb.Table(backendStack, 'PlanExecutionTable', {
  tableName: 'ecosystem-plan-executions',
  partitionKey: {
    name: 'planId',
    type: dynamodb.AttributeType.STRING,
  },
  sortKey: {
    name: 'stepNumber',
    type: dynamodb.AttributeType.NUMBER,
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
});

// 2. SQS Queues for Agent Job Processing
const agentJobQueue = new sqs.Queue(backendStack, 'AgentJobQueue', {
  queueName: 'ecosystem-agent-jobs',
  visibilityTimeout: { seconds: 300 }, // 5 minutes for long-running agents
  messageRetentionPeriod: { days: 14 },
  deadLetterQueue: {
    queue: new sqs.Queue(backendStack, 'AgentJobDLQ', {
      queueName: 'ecosystem-agent-jobs-dlq',
    }),
    maxReceiveCount: 3,
  },
});

const priorityJobQueue = new sqs.Queue(backendStack, 'PriorityJobQueue', {
  queueName: 'ecosystem-priority-jobs',
  visibilityTimeout: { seconds: 60 },
  fifo: true,
  deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
});

// 3. Lambda Functions for Agent Orchestration
const orchestratorFunction = new lambda.Function(backendStack, 'OrchestratorFunction', {
  functionName: 'ecosystem-orchestrator',
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('packages/worker/dist'),
  timeout: { minutes: 15 },
  memorySize: 3008,
  environment: {
    AGENT_STATE_TABLE: agentStateTable.tableName,
    WORKSPACE_TABLE: workspaceTable.tableName,
    PLAN_EXECUTION_TABLE: planExecutionTable.tableName,
    JOB_QUEUE_URL: agentJobQueue.queueUrl,
    PRIORITY_QUEUE_URL: priorityJobQueue.queueUrl,
    BEDROCK_REGION: 'us-east-1',
  },
});

// Grant permissions to Lambda
agentStateTable.grantReadWriteData(orchestratorFunction);
workspaceTable.grantReadWriteData(orchestratorFunction);
planExecutionTable.grantReadWriteData(orchestratorFunction);
agentJobQueue.grantSendMessages(orchestratorFunction);
agentJobQueue.grantConsumeMessages(orchestratorFunction);
priorityJobQueue.grantSendMessages(orchestratorFunction);

// 4. IAM Role for Bedrock Access (Claude, etc.)
const bedrockExecutionRole = new iam.Role(backendStack, 'BedrockExecutionRole', {
  roleName: 'ecosystem-bedrock-execution',
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  inlinePolicies: {
    BedrockAccess: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'bedrock:InvokeModel',
            'bedrock:InvokeModelWithResponseStream',
          ],
          resources: [
            'arn:aws:bedrock:*::foundation-model/anthropic.claude-*',
            'arn:aws:bedrock:*::foundation-model/meta.llama*',
            'arn:aws:bedrock:*::foundation-model/amazon.titan-*',
          ],
        }),
      ],
    }),
  },
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
});

orchestratorFunction.role?.attachInlinePolicy(
  new iam.Policy(backendStack, 'BedrockPolicy', {
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'],
      }),
    ],
  })
);

// 5. API Gateway for REST endpoints
const api = new apigateway.RestApi(backendStack, 'EcosystemAPI', {
  restApiName: 'ecosystem-api',
  description: 'ECOSYSTEMCL.AI Agent Orchestration API',
  deployOptions: {
    stageName: 'prod',
    tracingEnabled: true,
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
  },
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
  },
});

// API Resources
const plans = api.root.addResource('plans');
const execute = plans.addResource('execute');
execute.addMethod('POST', new apigateway.LambdaIntegration(orchestratorFunction));

const agents = api.root.addResource('agents');
const dispatch = agents.addResource('dispatch');
dispatch.addMethod('POST', new apigateway.LambdaIntegration(orchestratorFunction));

// 6. EventBridge for Agent Event Processing
const eventBus = new events.EventBus(backendStack, 'AgentEventBus', {
  eventBusName: 'ecosystem-agent-events',
});

const agentCompletionRule = new events.Rule(backendStack, 'AgentCompletionRule', {
  eventBus: eventBus,
  eventPattern: {
    source: ['ecosystem.agents'],
    detailType: ['Agent Execution Complete'],
  },
  targets: [new targets.LambdaFunction(orchestratorFunction)],
});

// 7. Step Functions for Complex Workflows (Optional)
// This would be added for more complex agent orchestration patterns

// Export important values
backend.addOutput({
  storage: {
    aws_region: backendStack.region,
    bucket_name: backend.storage.resources.bucket.bucketName,
  },
  custom: {
    API_ENDPOINT: api.url,
    ORCHESTRATOR_FUNCTION_ARN: orchestratorFunction.functionArn,
    AGENT_JOB_QUEUE_URL: agentJobQueue.queueUrl,
    AGENT_STATE_TABLE: agentStateTable.tableName,
    WORKSPACE_TABLE: workspaceTable.tableName,
    PLAN_EXECUTION_TABLE: planExecutionTable.tableName,
  },
});