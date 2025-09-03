import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  artifactsBucket: s3.Bucket;
  patternTableName: string;
}

/**
 * Compute Stack for ECOSYSTEMCL.AI
 * 
 * Serverless compute orchestration using ECS Fargate, SQS, and Step Functions.
 */
export class ComputeStack extends cdk.Stack {
  public readonly ecsCluster: ecs.Cluster;
  public readonly taskQueue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;
  public readonly orchestrationStateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // VPC for ECS Fargate
    const vpc = new ec2.Vpc(this, 'ComputeVPC', {
      vpcName: 'EcosystemCL-ComputeVPC',
      maxAzs: 2,
      natGateways: 1, // Single NAT for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ECS Cluster
    this.ecsCluster = new ecs.Cluster(this, 'ECSCluster', {
      clusterName: 'ecosystemcl-agents',
      vpc,
      containerInsights: true,
    });

    // Dead Letter Queue for failed tasks
    this.deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: 'ecosystemcl-dlq',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Primary Task Queue with DLQ
    this.taskQueue = new sqs.Queue(this, 'TaskQueue', {
      queueName: 'ecosystemcl-tasks',
      visibilityTimeout: cdk.Duration.minutes(15),
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.deadLetterQueue,
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Task Execution Role for Fargate
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Task Role for application-level permissions
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Import referenced resources by name
    const patternTable = dynamodb.Table.fromTableName(this, 'PatternTable', props.patternTableName);

    // Grant permissions to access resources
    props.artifactsBucket.grantReadWrite(taskRole);
    patternTable.grantReadWriteData(taskRole);
    this.taskQueue.grantConsumeMessages(taskRole);
    this.taskQueue.grantSendMessages(taskRole);

    // Grant Bedrock access for AI model invocations
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'],
    }));

    // Base Task Definition for Agent Containers
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'AgentTaskDefinition', {
      memoryLimitMiB: 2048,
      cpu: 1024,
      executionRole: taskExecutionRole,
      taskRole,
    });

    // Add a default essential container so tasks can run
    taskDefinition.addContainer('AgentContainer', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:20-alpine'),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'ecosystemcl-agent' }),
      environment: {
        TASK_QUEUE_URL: this.taskQueue.queueUrl,
        PATTERN_TABLE_NAME: patternTable.tableName,
      },
    });

    // Step Functions State Machine for Project Atlas pipeline
    const projectAtlasStateMachine = new stepfunctions.StateMachine(this, 'ProjectAtlasStateMachine', {
      stateMachineName: 'ProjectAtlas-Pipeline',
      definitionBody: stepfunctions.DefinitionBody.fromChainable(
        new stepfunctions.Parallel(this, 'ProcessingStages')
          .branch(
            new stepfunctionsTasks.EcsRunTask(this, 'SourceCodeAnalyzer', {
              cluster: this.ecsCluster,
              taskDefinition,
              launchTarget: new stepfunctionsTasks.EcsFargateLaunchTarget({
                platformVersion: ecs.FargatePlatformVersion.LATEST,
              }),
              containerOverrides: [{
                containerDefinition: taskDefinition.defaultContainer!,
                environment: [
                  { name: 'AGENT_TYPE', value: 'SourceCodeAnalyzer' },
                ],
              }],
            })
          )
          .next(
            new stepfunctionsTasks.EcsRunTask(this, 'EmbeddingAgent', {
              cluster: this.ecsCluster,
              taskDefinition,
              launchTarget: new stepfunctionsTasks.EcsFargateLaunchTarget({
                platformVersion: ecs.FargatePlatformVersion.LATEST,
              }),
              containerOverrides: [{
                containerDefinition: taskDefinition.defaultContainer!,
                environment: [
                  { name: 'AGENT_TYPE', value: 'EmbeddingAgent' },
                ],
              }],
            })
          )
          .next(
            new stepfunctionsTasks.EcsRunTask(this, 'PatternSynthesizer', {
              cluster: this.ecsCluster,
              taskDefinition,
              launchTarget: new stepfunctionsTasks.EcsFargateLaunchTarget({
                platformVersion: ecs.FargatePlatformVersion.LATEST,
              }),
              containerOverrides: [{
                containerDefinition: taskDefinition.defaultContainer!,
                environment: [
                  { name: 'AGENT_TYPE', value: 'PatternSynthesizer' },
                ],
              }],
            })
          )
      ),
      tracingEnabled: true,
    });

    this.orchestrationStateMachine = projectAtlasStateMachine;

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'TaskQueueUrl', {
      value: this.taskQueue.queueUrl,
      description: 'SQS Queue URL for task submission',
      exportName: 'TaskQueueUrl',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: projectAtlasStateMachine.stateMachineArn,
      description: 'Step Functions State Machine ARN',
      exportName: 'ProjectAtlasStateMachineArn',
    });
  }
}
