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
exports.ComputeStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const lambdaEventSources = __importStar(require("aws-cdk-lib/aws-lambda-event-sources"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const cloudwatchActions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const stepfunctions = __importStar(require("aws-cdk-lib/aws-stepfunctions"));
const stepfunctionsTasks = __importStar(require("aws-cdk-lib/aws-stepfunctions-tasks"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
/**
 * Compute Stack for ECOSYSTEMCL.AI
 *
 * Serverless compute orchestration using ECS Fargate, SQS, and Step Functions.
 */
class ComputeStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Reference the Testcontainers Cloud secret
        const tcCloudSecret = secretsmanager.Secret.fromSecretNameV2(this, 'TestcontainersCloudSecret', 'prod/tccloudcode');
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
            definitionBody: stepfunctions.DefinitionBody.fromChainable(new stepfunctions.Parallel(this, 'ProcessingStages')
                .branch(new stepfunctionsTasks.EcsRunTask(this, 'SourceCodeAnalyzer', {
                cluster: this.ecsCluster,
                taskDefinition,
                launchTarget: new stepfunctionsTasks.EcsFargateLaunchTarget({
                    platformVersion: ecs.FargatePlatformVersion.LATEST,
                }),
                containerOverrides: [{
                        containerDefinition: taskDefinition.defaultContainer,
                        environment: [
                            { name: 'AGENT_TYPE', value: 'SourceCodeAnalyzer' },
                        ],
                    }],
            }))
                .next(new stepfunctionsTasks.EcsRunTask(this, 'EmbeddingAgent', {
                cluster: this.ecsCluster,
                taskDefinition,
                launchTarget: new stepfunctionsTasks.EcsFargateLaunchTarget({
                    platformVersion: ecs.FargatePlatformVersion.LATEST,
                }),
                containerOverrides: [{
                        containerDefinition: taskDefinition.defaultContainer,
                        environment: [
                            { name: 'AGENT_TYPE', value: 'EmbeddingAgent' },
                        ],
                    }],
            }))
                .next(new stepfunctionsTasks.EcsRunTask(this, 'PatternSynthesizer', {
                cluster: this.ecsCluster,
                taskDefinition,
                launchTarget: new stepfunctionsTasks.EcsFargateLaunchTarget({
                    platformVersion: ecs.FargatePlatformVersion.LATEST,
                }),
                containerOverrides: [{
                        containerDefinition: taskDefinition.defaultContainer,
                        environment: [
                            { name: 'AGENT_TYPE', value: 'PatternSynthesizer' },
                        ],
                    }],
            }))),
            tracingEnabled: true,
        });
        this.orchestrationStateMachine = projectAtlasStateMachine;
        // =====================================================================
        // CDC LAMBDA FOR DYNAMODB STREAMS
        // =====================================================================
        // Create S3 bucket for pattern versioning
        const versionBucket = new s3.Bucket(this, 'PatternVersionBucket', {
            bucketName: 'ecosystemcl-pattern-versions',
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
            reservedConcurrentExecutions: 5,
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
        this.cdcProcessor.addEventSource(new lambdaEventSources.DynamoEventSource(patternTable, {
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
            batchSize: 50,
            maxBatchingWindow: cdk.Duration.seconds(5),
            bisectBatchOnError: true,
            retryAttempts: 3,
            parallelizationFactor: 1,
            reportBatchItemFailures: true,
            onFailure: new lambdaEventSources.SqsDlq(this.cdcDeadLetterQueue),
        }));
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
exports.ComputeStack = ComputeStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2NvbXB1dGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLCtEQUFpRDtBQUNqRCw0RUFBOEQ7QUFDOUQseUZBQTJFO0FBQzNFLHVFQUF5RDtBQUN6RCxzRkFBd0U7QUFDeEUseURBQTJDO0FBQzNDLDZFQUErRDtBQUMvRCx3RkFBMEU7QUFDMUUsdURBQXlDO0FBQ3pDLG1FQUFxRDtBQUNyRCwrRUFBaUU7QUFRakU7Ozs7R0FJRztBQUNILE1BQWEsWUFBYSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBUXpDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBd0I7UUFDaEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNENBQTRDO1FBQzVDLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQzFELElBQUksRUFDSiwyQkFBMkIsRUFDM0Isa0JBQWtCLENBQ25CLENBQUM7UUFFRixzQkFBc0I7UUFDdEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDMUMsT0FBTyxFQUFFLHdCQUF3QjtZQUNqQyxNQUFNLEVBQUUsQ0FBQztZQUNULFdBQVcsRUFBRSxDQUFDLEVBQUUsbUNBQW1DO1lBQ25ELG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNsQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVB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O0NBQ0Y7QUFwVEQsb0NBb1RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGVjcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNzJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGxhbWJkYU5vZGVqcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgKiBhcyBsYW1iZGFFdmVudFNvdXJjZXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ldmVudC1zb3VyY2VzJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaEFjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gtYWN0aW9ucyc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQgKiBhcyBzdGVwZnVuY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zdGVwZnVuY3Rpb25zJztcbmltcG9ydCAqIGFzIHN0ZXBmdW5jdGlvbnNUYXNrcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3RlcGZ1bmN0aW9ucy10YXNrcyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHNlY3JldHNtYW5hZ2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zZWNyZXRzbWFuYWdlcic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuaW50ZXJmYWNlIENvbXB1dGVTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBhcnRpZmFjdHNCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcGF0dGVyblRhYmxlTmFtZTogc3RyaW5nO1xufVxuXG4vKipcbiAqIENvbXB1dGUgU3RhY2sgZm9yIEVDT1NZU1RFTUNMLkFJXG4gKiBcbiAqIFNlcnZlcmxlc3MgY29tcHV0ZSBvcmNoZXN0cmF0aW9uIHVzaW5nIEVDUyBGYXJnYXRlLCBTUVMsIGFuZCBTdGVwIEZ1bmN0aW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXB1dGVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBlY3NDbHVzdGVyOiBlY3MuQ2x1c3RlcjtcbiAgcHVibGljIHJlYWRvbmx5IHRhc2tRdWV1ZTogc3FzLlF1ZXVlO1xuICBwdWJsaWMgcmVhZG9ubHkgZGVhZExldHRlclF1ZXVlOiBzcXMuUXVldWU7XG4gIHB1YmxpYyByZWFkb25seSBjZGNEZWFkTGV0dGVyUXVldWU6IHNxcy5RdWV1ZTtcbiAgcHVibGljIHJlYWRvbmx5IGNkY1Byb2Nlc3NvcjogbGFtYmRhLkZ1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgb3JjaGVzdHJhdGlvblN0YXRlTWFjaGluZTogc3RlcGZ1bmN0aW9ucy5TdGF0ZU1hY2hpbmU7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENvbXB1dGVTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBSZWZlcmVuY2UgdGhlIFRlc3Rjb250YWluZXJzIENsb3VkIHNlY3JldFxuICAgIGNvbnN0IHRjQ2xvdWRTZWNyZXQgPSBzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldE5hbWVWMihcbiAgICAgIHRoaXMsIFxuICAgICAgJ1Rlc3Rjb250YWluZXJzQ2xvdWRTZWNyZXQnLFxuICAgICAgJ3Byb2QvdGNjbG91ZGNvZGUnXG4gICAgKTtcblxuICAgIC8vIFZQQyBmb3IgRUNTIEZhcmdhdGVcbiAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnQ29tcHV0ZVZQQycsIHtcbiAgICAgIHZwY05hbWU6ICdFY29zeXN0ZW1DTC1Db21wdXRlVlBDJyxcbiAgICAgIG1heEF6czogMixcbiAgICAgIG5hdEdhdGV3YXlzOiAxLCAvLyBTaW5nbGUgTkFUIGZvciBjb3N0IG9wdGltaXphdGlvblxuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQdWJsaWMnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICBuYW1lOiAnUHJpdmF0ZScsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBFQ1MgQ2x1c3RlclxuICAgIHRoaXMuZWNzQ2x1c3RlciA9IG5ldyBlY3MuQ2x1c3Rlcih0aGlzLCAnRUNTQ2x1c3RlcicsIHtcbiAgICAgIGNsdXN0ZXJOYW1lOiAnZWNvc3lzdGVtY2wtYWdlbnRzJyxcbiAgICAgIHZwYyxcbiAgICAgIGNvbnRhaW5lckluc2lnaHRzOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gRGVhZCBMZXR0ZXIgUXVldWUgZm9yIGZhaWxlZCB0YXNrc1xuICAgIHRoaXMuZGVhZExldHRlclF1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnRGVhZExldHRlclF1ZXVlJywge1xuICAgICAgcXVldWVOYW1lOiAnZWNvc3lzdGVtY2wtZGxxJyxcbiAgICAgIHJldGVudGlvblBlcmlvZDogY2RrLkR1cmF0aW9uLmRheXMoMTQpLFxuICAgICAgZW5jcnlwdGlvbjogc3FzLlF1ZXVlRW5jcnlwdGlvbi5LTVNfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vIFByaW1hcnkgVGFzayBRdWV1ZSB3aXRoIERMUVxuICAgIHRoaXMudGFza1F1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnVGFza1F1ZXVlJywge1xuICAgICAgcXVldWVOYW1lOiAnZWNvc3lzdGVtY2wtdGFza3MnLFxuICAgICAgdmlzaWJpbGl0eVRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDE1KSxcbiAgICAgIHJldGVudGlvblBlcmlvZDogY2RrLkR1cmF0aW9uLmRheXMoNCksXG4gICAgICBkZWFkTGV0dGVyUXVldWU6IHtcbiAgICAgICAgbWF4UmVjZWl2ZUNvdW50OiAzLFxuICAgICAgICBxdWV1ZTogdGhpcy5kZWFkTGV0dGVyUXVldWUsXG4gICAgICB9LFxuICAgICAgZW5jcnlwdGlvbjogc3FzLlF1ZXVlRW5jcnlwdGlvbi5LTVNfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vIFRhc2sgRXhlY3V0aW9uIFJvbGUgZm9yIEZhcmdhdGVcbiAgICBjb25zdCB0YXNrRXhlY3V0aW9uUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnVGFza0V4ZWN1dGlvblJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWNzLXRhc2tzLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BbWF6b25FQ1NUYXNrRXhlY3V0aW9uUm9sZVBvbGljeScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFRhc2sgUm9sZSBmb3IgYXBwbGljYXRpb24tbGV2ZWwgcGVybWlzc2lvbnNcbiAgICBjb25zdCB0YXNrUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnVGFza1JvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWNzLXRhc2tzLmFtYXpvbmF3cy5jb20nKSxcbiAgICB9KTtcblxuICAgIC8vIEltcG9ydCByZWZlcmVuY2VkIHJlc291cmNlcyBieSBuYW1lXG4gICAgY29uc3QgcGF0dGVyblRhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZSh0aGlzLCAnUGF0dGVyblRhYmxlJywgcHJvcHMucGF0dGVyblRhYmxlTmFtZSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9ucyB0byBhY2Nlc3MgcmVzb3VyY2VzXG4gICAgcHJvcHMuYXJ0aWZhY3RzQnVja2V0LmdyYW50UmVhZFdyaXRlKHRhc2tSb2xlKTtcbiAgICBwYXR0ZXJuVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRhc2tSb2xlKTtcbiAgICB0aGlzLnRhc2tRdWV1ZS5ncmFudENvbnN1bWVNZXNzYWdlcyh0YXNrUm9sZSk7XG4gICAgdGhpcy50YXNrUXVldWUuZ3JhbnRTZW5kTWVzc2FnZXModGFza1JvbGUpO1xuICAgIFxuICAgIC8vIEdyYW50IGFjY2VzcyB0byBUZXN0Y29udGFpbmVycyBDbG91ZCBzZWNyZXRcbiAgICB0Y0Nsb3VkU2VjcmV0LmdyYW50UmVhZCh0YXNrUm9sZSk7XG5cbiAgICAvLyBHcmFudCBCZWRyb2NrIGFjY2VzcyBmb3IgQUkgbW9kZWwgaW52b2NhdGlvbnNcbiAgICB0YXNrUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW0nLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gQmFzZSBUYXNrIERlZmluaXRpb24gZm9yIEFnZW50IENvbnRhaW5lcnNcbiAgICBjb25zdCB0YXNrRGVmaW5pdGlvbiA9IG5ldyBlY3MuRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsICdBZ2VudFRhc2tEZWZpbml0aW9uJywge1xuICAgICAgbWVtb3J5TGltaXRNaUI6IDIwNDgsXG4gICAgICBjcHU6IDEwMjQsXG4gICAgICBleGVjdXRpb25Sb2xlOiB0YXNrRXhlY3V0aW9uUm9sZSxcbiAgICAgIHRhc2tSb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGEgZGVmYXVsdCBlc3NlbnRpYWwgY29udGFpbmVyIHNvIHRhc2tzIGNhbiBydW5cbiAgICB0YXNrRGVmaW5pdGlvbi5hZGRDb250YWluZXIoJ0FnZW50Q29udGFpbmVyJywge1xuICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tUmVnaXN0cnkoJ3B1YmxpYy5lY3IuYXdzL2RvY2tlci9saWJyYXJ5L25vZGU6MjAtYWxwaW5lJyksXG4gICAgICBlc3NlbnRpYWw6IHRydWUsXG4gICAgICBsb2dnaW5nOiBlY3MuTG9nRHJpdmVycy5hd3NMb2dzKHsgc3RyZWFtUHJlZml4OiAnZWNvc3lzdGVtY2wtYWdlbnQnIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFTS19RVUVVRV9VUkw6IHRoaXMudGFza1F1ZXVlLnF1ZXVlVXJsLFxuICAgICAgICBQQVRURVJOX1RBQkxFX05BTUU6IHBhdHRlcm5UYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFRDQ0xPVURfU0VDUkVUX0FSTjogdGNDbG91ZFNlY3JldC5zZWNyZXRBcm4sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gU3RlcCBGdW5jdGlvbnMgU3RhdGUgTWFjaGluZSBmb3IgUHJvamVjdCBBdGxhcyBwaXBlbGluZVxuICAgIGNvbnN0IHByb2plY3RBdGxhc1N0YXRlTWFjaGluZSA9IG5ldyBzdGVwZnVuY3Rpb25zLlN0YXRlTWFjaGluZSh0aGlzLCAnUHJvamVjdEF0bGFzU3RhdGVNYWNoaW5lJywge1xuICAgICAgc3RhdGVNYWNoaW5lTmFtZTogJ1Byb2plY3RBdGxhcy1QaXBlbGluZScsXG4gICAgICBkZWZpbml0aW9uQm9keTogc3RlcGZ1bmN0aW9ucy5EZWZpbml0aW9uQm9keS5mcm9tQ2hhaW5hYmxlKFxuICAgICAgICBuZXcgc3RlcGZ1bmN0aW9ucy5QYXJhbGxlbCh0aGlzLCAnUHJvY2Vzc2luZ1N0YWdlcycpXG4gICAgICAgICAgLmJyYW5jaChcbiAgICAgICAgICAgIG5ldyBzdGVwZnVuY3Rpb25zVGFza3MuRWNzUnVuVGFzayh0aGlzLCAnU291cmNlQ29kZUFuYWx5emVyJywge1xuICAgICAgICAgICAgICBjbHVzdGVyOiB0aGlzLmVjc0NsdXN0ZXIsXG4gICAgICAgICAgICAgIHRhc2tEZWZpbml0aW9uLFxuICAgICAgICAgICAgICBsYXVuY2hUYXJnZXQ6IG5ldyBzdGVwZnVuY3Rpb25zVGFza3MuRWNzRmFyZ2F0ZUxhdW5jaFRhcmdldCh7XG4gICAgICAgICAgICAgICAgcGxhdGZvcm1WZXJzaW9uOiBlY3MuRmFyZ2F0ZVBsYXRmb3JtVmVyc2lvbi5MQVRFU1QsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBjb250YWluZXJPdmVycmlkZXM6IFt7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGVmaW5pdGlvbjogdGFza0RlZmluaXRpb24uZGVmYXVsdENvbnRhaW5lciEsXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6IFtcbiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ0FHRU5UX1RZUEUnLCB2YWx1ZTogJ1NvdXJjZUNvZGVBbmFseXplcicgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKVxuICAgICAgICAgIC5uZXh0KFxuICAgICAgICAgICAgbmV3IHN0ZXBmdW5jdGlvbnNUYXNrcy5FY3NSdW5UYXNrKHRoaXMsICdFbWJlZGRpbmdBZ2VudCcsIHtcbiAgICAgICAgICAgICAgY2x1c3RlcjogdGhpcy5lY3NDbHVzdGVyLFxuICAgICAgICAgICAgICB0YXNrRGVmaW5pdGlvbixcbiAgICAgICAgICAgICAgbGF1bmNoVGFyZ2V0OiBuZXcgc3RlcGZ1bmN0aW9uc1Rhc2tzLkVjc0ZhcmdhdGVMYXVuY2hUYXJnZXQoe1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtVmVyc2lvbjogZWNzLkZhcmdhdGVQbGF0Zm9ybVZlcnNpb24uTEFURVNULFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgY29udGFpbmVyT3ZlcnJpZGVzOiBbe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRlZmluaXRpb246IHRhc2tEZWZpbml0aW9uLmRlZmF1bHRDb250YWluZXIhLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiBbXG4gICAgICAgICAgICAgICAgICB7IG5hbWU6ICdBR0VOVF9UWVBFJywgdmFsdWU6ICdFbWJlZGRpbmdBZ2VudCcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKVxuICAgICAgICAgIC5uZXh0KFxuICAgICAgICAgICAgbmV3IHN0ZXBmdW5jdGlvbnNUYXNrcy5FY3NSdW5UYXNrKHRoaXMsICdQYXR0ZXJuU3ludGhlc2l6ZXInLCB7XG4gICAgICAgICAgICAgIGNsdXN0ZXI6IHRoaXMuZWNzQ2x1c3RlcixcbiAgICAgICAgICAgICAgdGFza0RlZmluaXRpb24sXG4gICAgICAgICAgICAgIGxhdW5jaFRhcmdldDogbmV3IHN0ZXBmdW5jdGlvbnNUYXNrcy5FY3NGYXJnYXRlTGF1bmNoVGFyZ2V0KHtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybVZlcnNpb246IGVjcy5GYXJnYXRlUGxhdGZvcm1WZXJzaW9uLkxBVEVTVCxcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICAgICAgICBjb250YWluZXJEZWZpbml0aW9uOiB0YXNrRGVmaW5pdGlvbi5kZWZhdWx0Q29udGFpbmVyISxcbiAgICAgICAgICAgICAgICBlbnZpcm9ubWVudDogW1xuICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnQUdFTlRfVFlQRScsIHZhbHVlOiAnUGF0dGVyblN5bnRoZXNpemVyJyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApXG4gICAgICApLFxuICAgICAgdHJhY2luZ0VuYWJsZWQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICB0aGlzLm9yY2hlc3RyYXRpb25TdGF0ZU1hY2hpbmUgPSBwcm9qZWN0QXRsYXNTdGF0ZU1hY2hpbmU7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBDREMgTEFNQkRBIEZPUiBEWU5BTU9EQiBTVFJFQU1TXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvLyBDcmVhdGUgUzMgYnVja2V0IGZvciBwYXR0ZXJuIHZlcnNpb25pbmdcbiAgICBjb25zdCB2ZXJzaW9uQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnUGF0dGVyblZlcnNpb25CdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiAnZWNvc3lzdGVtY2wtcGF0dGVybi12ZXJzaW9ucycsXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICBsaWZlY3ljbGVSdWxlczogW3tcbiAgICAgICAgaWQ6ICdEZWxldGVPbGRWZXJzaW9ucycsXG4gICAgICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoOTApLFxuICAgICAgfV0sXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgfSk7XG5cbiAgICAvLyBDREMgRGVhZCBMZXR0ZXIgUXVldWVcbiAgICB0aGlzLmNkY0RlYWRMZXR0ZXJRdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ0NEQ0RlYWRMZXR0ZXJRdWV1ZScsIHtcbiAgICAgIHF1ZXVlTmFtZTogJ2Vjb3N5c3RlbWNsLWNkYy1kbHEnLFxuICAgICAgcmV0ZW50aW9uUGVyaW9kOiBjZGsuRHVyYXRpb24uZGF5cygxNCksXG4gICAgICBlbmNyeXB0aW9uOiBzcXMuUXVldWVFbmNyeXB0aW9uLktNU19NQU5BR0VELFxuICAgIH0pO1xuXG4gICAgLy8gU05TIFRvcGljIGZvciBETFEgQWxhcm1zXG4gICAgY29uc3QgYWxhcm1Ub3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ0NEQ0FsYXJtVG9waWMnLCB7XG4gICAgICB0b3BpY05hbWU6ICdlY29zeXN0ZW1jbC1jZGMtYWxhcm1zJyxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkV2F0Y2ggQWxhcm0gZm9yIERMUVxuICAgIG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdDRENETFFBbGFybScsIHtcbiAgICAgIG1ldHJpYzogdGhpcy5jZGNEZWFkTGV0dGVyUXVldWUubWV0cmljQXBwcm94aW1hdGVOdW1iZXJPZk1lc3NhZ2VzVmlzaWJsZSgpLFxuICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdDREMgRGVhZCBMZXR0ZXIgUXVldWUgaGFzIG1lc3NhZ2VzJyxcbiAgICB9KS5hZGRBbGFybUFjdGlvbihuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKGFsYXJtVG9waWMpKTtcblxuICAgIC8vIENEQyBQcm9jZXNzb3IgTGFtYmRhXG4gICAgdGhpcy5jZGNQcm9jZXNzb3IgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdDRENQcm9jZXNzb3InLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdlY29zeXN0ZW1jbC1jZGMtcHJvY2Vzc29yJyxcbiAgICAgIGVudHJ5OiAnLi4vd29ya2VyL3NyYy9sYW1iZGFzL2NkY1Byb2Nlc3Nvci50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGFyY2hpdGVjdHVyZTogbGFtYmRhLkFyY2hpdGVjdHVyZS5BUk1fNjQsXG4gICAgICBtZW1vcnlTaXplOiAxMDI0LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICByZXNlcnZlZENvbmN1cnJlbnRFeGVjdXRpb25zOiA1LFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgT1BFTlNFQVJDSF9FTkRQT0lOVDogcHJvY2Vzcy5lbnYuT1BFTlNFQVJDSF9FTkRQT0lOVCB8fCAnJyxcbiAgICAgICAgRExRX1VSTDogdGhpcy5jZGNEZWFkTGV0dGVyUXVldWUucXVldWVVcmwsXG4gICAgICAgIFZFUlNJT05fQlVDS0VUOiB2ZXJzaW9uQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgIFRDQ0xPVURfU0VDUkVUX0FSTjogdGNDbG91ZFNlY3JldC5zZWNyZXRBcm4sXG4gICAgICAgIE5PREVfT1BUSU9OUzogJy0tZW5hYmxlLXNvdXJjZS1tYXBzJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBtaW5pZnk6IGZhbHNlLCAvLyBLZWVwIGZhbHNlIGZvciBkZWJ1Z2dpbmdcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBmb3JjZURvY2tlckJ1bmRsaW5nOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIHRvIENEQyBMYW1iZGFcbiAgICBwYXR0ZXJuVGFibGUuZ3JhbnRTdHJlYW1SZWFkKHRoaXMuY2RjUHJvY2Vzc29yKTtcbiAgICB2ZXJzaW9uQnVja2V0LmdyYW50V3JpdGUodGhpcy5jZGNQcm9jZXNzb3IpO1xuICAgIHRoaXMuY2RjRGVhZExldHRlclF1ZXVlLmdyYW50U2VuZE1lc3NhZ2VzKHRoaXMuY2RjUHJvY2Vzc29yKTtcbiAgICBcbiAgICAvLyBHcmFudCBhY2Nlc3MgdG8gVGVzdGNvbnRhaW5lcnMgQ2xvdWQgc2VjcmV0XG4gICAgdGNDbG91ZFNlY3JldC5ncmFudFJlYWQodGhpcy5jZGNQcm9jZXNzb3IpO1xuXG4gICAgLy8gR3JhbnQgQ2xvdWRXYXRjaCBtZXRyaWNzIHBlcm1pc3Npb25zXG4gICAgdGhpcy5jZGNQcm9jZXNzb3IuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2Nsb3Vkd2F0Y2g6UHV0TWV0cmljRGF0YScsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBHcmFudCBCZWRyb2NrIGFjY2VzcyBmb3IgZW1iZWRkaW5nc1xuICAgIHRoaXMuY2RjUHJvY2Vzc29yLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEFkZCBEeW5hbW9EQiBTdHJlYW0gZXZlbnQgc291cmNlIG1hcHBpbmdcbiAgICAvLyBDb25maWd1cmUgQ0RDIExhbWJkYSB0byBwcm9jZXNzIEhlbGl4UGF0dGVybkVudHJpZXMgdGFibGUgc3RyZWFtIGV2ZW50c1xuICAgIHRoaXMuY2RjUHJvY2Vzc29yLmFkZEV2ZW50U291cmNlKFxuICAgICAgbmV3IGxhbWJkYUV2ZW50U291cmNlcy5EeW5hbW9FdmVudFNvdXJjZShwYXR0ZXJuVGFibGUsIHtcbiAgICAgICAgc3RhcnRpbmdQb3NpdGlvbjogbGFtYmRhLlN0YXJ0aW5nUG9zaXRpb24uVFJJTV9IT1JJWk9OLFxuICAgICAgICBiYXRjaFNpemU6IDUwLFxuICAgICAgICBtYXhCYXRjaGluZ1dpbmRvdzogY2RrLkR1cmF0aW9uLnNlY29uZHMoNSksXG4gICAgICAgIGJpc2VjdEJhdGNoT25FcnJvcjogdHJ1ZSxcbiAgICAgICAgcmV0cnlBdHRlbXB0czogMyxcbiAgICAgICAgcGFyYWxsZWxpemF0aW9uRmFjdG9yOiAxLFxuICAgICAgICByZXBvcnRCYXRjaEl0ZW1GYWlsdXJlczogdHJ1ZSxcbiAgICAgICAgb25GYWlsdXJlOiBuZXcgbGFtYmRhRXZlbnRTb3VyY2VzLlNxc0RscSh0aGlzLmNkY0RlYWRMZXR0ZXJRdWV1ZSksXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBDbG91ZEZvcm1hdGlvbiBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1Rhc2tRdWV1ZVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnRhc2tRdWV1ZS5xdWV1ZVVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU1FTIFF1ZXVlIFVSTCBmb3IgdGFzayBzdWJtaXNzaW9uJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdUYXNrUXVldWVVcmwnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1N0YXRlTWFjaGluZUFybicsIHtcbiAgICAgIHZhbHVlOiBwcm9qZWN0QXRsYXNTdGF0ZU1hY2hpbmUuc3RhdGVNYWNoaW5lQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdTdGVwIEZ1bmN0aW9ucyBTdGF0ZSBNYWNoaW5lIEFSTicsXG4gICAgICBleHBvcnROYW1lOiAnUHJvamVjdEF0bGFzU3RhdGVNYWNoaW5lQXJuJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDRENQcm9jZXNzb3JBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5jZGNQcm9jZXNzb3IuZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0NEQyBQcm9jZXNzb3IgTGFtYmRhIEFSTicsXG4gICAgICBleHBvcnROYW1lOiAnQ0RDUHJvY2Vzc29yQXJuJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDRENETFFVcmwnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5jZGNEZWFkTGV0dGVyUXVldWUucXVldWVVcmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NEQyBEZWFkIExldHRlciBRdWV1ZSBVUkwnLFxuICAgICAgZXhwb3J0TmFtZTogJ0NEQ0RMUVVybCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVmVyc2lvbkJ1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdmVyc2lvbkJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdQYXR0ZXJuIFZlcnNpb24gUzMgQnVja2V0IE5hbWUnLFxuICAgICAgZXhwb3J0TmFtZTogJ1BhdHRlcm5WZXJzaW9uQnVja2V0JyxcbiAgICB9KTtcbiAgfVxufVxuIl19