import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
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
  public readonly cdcDeadLetterQueue: sqs.Queue;
  public readonly cdcProcessor: lambda.Function;
  public readonly orchestrationStateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Reference the Testcontainers Cloud secret
    const tcCloudSecret = secretsmanager.Secret.fromSecretNameV2(
      this, 
      'TestcontainersCloudSecret',
      'prod/tccloudcode'
    );

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

    // Import referenced resources by name with stream ARN
    const patternTable = dynamodb.Table.fromTableAttributes(this, 'PatternTable', {
      tableName: props.patternTableName,
      tableStreamArn: 'arn:aws:dynamodb:us-west-2:219895243073:table/HelixPatternEntries/stream/2025-09-03T23:00:14.265',
    });

    // Grant permissions to access resources
    props.artifactsBucket.grantReadWrite(taskRole);
    patternTable.grantReadWriteData(taskRole);
    this.taskQueue.grantConsumeMessages(taskRole);
    this.taskQueue.grantSendMessages(taskRole);
    
    // Grant access to Testcontainers Cloud secret
    tcCloudSecret.grantRead(taskRole);

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
        TCCLOUD_SECRET_ARN: tcCloudSecret.secretArn,
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

    // =====================================================================
    // CDC LAMBDA FOR DYNAMODB STREAMS
    // =====================================================================

    // Create S3 bucket for pattern versioning
    const versionBucket = new s3.Bucket(this, 'PatternVersionBucket', {
      bucketName: `ecosystemcl-pattern-versions-${this.account}`,
      versioned: true,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(90),
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CDC Dead Letter Queue
    this.cdcDeadLetterQueue = new sqs.Queue(this, 'CDCDeadLetterQueue', {
      queueName: 'ecosystemcl-cdc-dlq',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // SNS Topic for DLQ Alarms
    const alarmTopic = new sns.Topic(this, 'CDCAlarmTopic', {
      topicName: 'ecosystemcl-cdc-alarms',
    });

    // CloudWatch Alarm for DLQ
    new cloudwatch.Alarm(this, 'CDCDLQAlarm', {
      metric: this.cdcDeadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'CDC Dead Letter Queue has messages',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // CDC Processor Lambda
    this.cdcProcessor = new lambdaNodejs.NodejsFunction(this, 'CDCProcessor', {
      functionName: 'ecosystemcl-cdc-processor',
      entry: '../worker/src/lambdas/cdcProcessor.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      timeout: cdk.Duration.minutes(5),
      // reservedConcurrentExecutions: 5, // Removed due to account limits
      environment: {
        OPENSEARCH_ENDPOINT: process.env.OPENSEARCH_ENDPOINT || '',
        DLQ_URL: this.cdcDeadLetterQueue.queueUrl,
        VERSION_BUCKET: versionBucket.bucketName,
        TCCLOUD_SECRET_ARN: tcCloudSecret.secretArn,
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: false, // Keep false for debugging
        sourceMap: true,
        forceDockerBundling: true,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant permissions to CDC Lambda
    patternTable.grantStreamRead(this.cdcProcessor);
    versionBucket.grantWrite(this.cdcProcessor);
    this.cdcDeadLetterQueue.grantSendMessages(this.cdcProcessor);
    
    // Grant access to Testcontainers Cloud secret
    tcCloudSecret.grantRead(this.cdcProcessor);

    // Grant CloudWatch metrics permissions
    this.cdcProcessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
      ],
      resources: ['*'],
    }));

    // Grant Bedrock access for embeddings
    this.cdcProcessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
      ],
      resources: ['*'],
    }));

    // Add DynamoDB Stream event source mapping
    // Configure CDC Lambda to process HelixPatternEntries table stream events
    this.cdcProcessor.addEventSource(
      new lambdaEventSources.DynamoEventSource(patternTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 50,
        maxBatchingWindow: cdk.Duration.seconds(5),
        bisectBatchOnError: true,
        retryAttempts: 3,
        parallelizationFactor: 1,
        reportBatchItemFailures: true,
        onFailure: new lambdaEventSources.SqsDlq(this.cdcDeadLetterQueue),
      })
    );

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

    new cdk.CfnOutput(this, 'CDCProcessorArn', {
      value: this.cdcProcessor.functionArn,
      description: 'CDC Processor Lambda ARN',
      exportName: 'CDCProcessorArn',
    });

    new cdk.CfnOutput(this, 'CDCDLQUrl', {
      value: this.cdcDeadLetterQueue.queueUrl,
      description: 'CDC Dead Letter Queue URL',
      exportName: 'CDCDLQUrl',
    });

    new cdk.CfnOutput(this, 'VersionBucketName', {
      value: versionBucket.bucketName,
      description: 'Pattern Version S3 Bucket Name',
      exportName: 'PatternVersionBucket',
    });
  }
}
