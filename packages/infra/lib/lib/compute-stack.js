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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2NvbXB1dGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLCtEQUFpRDtBQUNqRCw0RUFBOEQ7QUFDOUQseUZBQTJFO0FBQzNFLHVFQUF5RDtBQUN6RCxzRkFBd0U7QUFDeEUseURBQTJDO0FBQzNDLDZFQUErRDtBQUMvRCx3RkFBMEU7QUFDMUUsdURBQXlDO0FBQ3pDLG1FQUFxRDtBQUNyRCwrRUFBaUU7QUFRakU7Ozs7R0FJRztBQUNILE1BQWEsWUFBYSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBUXpDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBd0I7UUFDaEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNENBQTRDO1FBQzVDLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQzFELElBQUksRUFDSiwyQkFBMkIsRUFDM0Isa0JBQWtCLENBQ25CLENBQUM7UUFFRixzQkFBc0I7UUFDdEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDMUMsT0FBTyxFQUFFLHdCQUF3QjtZQUNqQyxNQUFNLEVBQUUsQ0FBQztZQUNULFdBQVcsRUFBRSxDQUFDLEVBQUUsbUNBQW1DO1lBQ25ELG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNsQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVB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LGdDQUFnQztZQUM3QyxVQUFVLEVBQUUsc0JBQXNCO1NBQ25DLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZURCxvQ0F1VEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWNzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3MnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbGFtYmRhTm9kZWpzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtbm9kZWpzJztcbmltcG9ydCAqIGFzIGxhbWJkYUV2ZW50U291cmNlcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLWV2ZW50LXNvdXJjZXMnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoQWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCAqIGFzIHN0ZXBmdW5jdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXN0ZXBmdW5jdGlvbnMnO1xuaW1wb3J0ICogYXMgc3RlcGZ1bmN0aW9uc1Rhc2tzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zdGVwZnVuY3Rpb25zLXRhc2tzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlY3JldHNtYW5hZ2VyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgQ29tcHV0ZVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGFydGlmYWN0c0J1Y2tldDogczMuQnVja2V0O1xuICBwYXR0ZXJuVGFibGVOYW1lOiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ29tcHV0ZSBTdGFjayBmb3IgRUNPU1lTVEVNQ0wuQUlcbiAqIFxuICogU2VydmVybGVzcyBjb21wdXRlIG9yY2hlc3RyYXRpb24gdXNpbmcgRUNTIEZhcmdhdGUsIFNRUywgYW5kIFN0ZXAgRnVuY3Rpb25zLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcHV0ZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGVjc0NsdXN0ZXI6IGVjcy5DbHVzdGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgdGFza1F1ZXVlOiBzcXMuUXVldWU7XG4gIHB1YmxpYyByZWFkb25seSBkZWFkTGV0dGVyUXVldWU6IHNxcy5RdWV1ZTtcbiAgcHVibGljIHJlYWRvbmx5IGNkY0RlYWRMZXR0ZXJRdWV1ZTogc3FzLlF1ZXVlO1xuICBwdWJsaWMgcmVhZG9ubHkgY2RjUHJvY2Vzc29yOiBsYW1iZGEuRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBvcmNoZXN0cmF0aW9uU3RhdGVNYWNoaW5lOiBzdGVwZnVuY3Rpb25zLlN0YXRlTWFjaGluZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQ29tcHV0ZVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFJlZmVyZW5jZSB0aGUgVGVzdGNvbnRhaW5lcnMgQ2xvdWQgc2VjcmV0XG4gICAgY29uc3QgdGNDbG91ZFNlY3JldCA9IHNlY3JldHNtYW5hZ2VyLlNlY3JldC5mcm9tU2VjcmV0TmFtZVYyKFxuICAgICAgdGhpcywgXG4gICAgICAnVGVzdGNvbnRhaW5lcnNDbG91ZFNlY3JldCcsXG4gICAgICAncHJvZC90Y2Nsb3VkY29kZSdcbiAgICApO1xuXG4gICAgLy8gVlBDIGZvciBFQ1MgRmFyZ2F0ZVxuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdDb21wdXRlVlBDJywge1xuICAgICAgdnBjTmFtZTogJ0Vjb3N5c3RlbUNMLUNvbXB1dGVWUEMnLFxuICAgICAgbWF4QXpzOiAyLFxuICAgICAgbmF0R2F0ZXdheXM6IDEsIC8vIFNpbmdsZSBOQVQgZm9yIGNvc3Qgb3B0aW1pemF0aW9uXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ1B1YmxpYycsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQcml2YXRlJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEVDUyBDbHVzdGVyXG4gICAgdGhpcy5lY3NDbHVzdGVyID0gbmV3IGVjcy5DbHVzdGVyKHRoaXMsICdFQ1NDbHVzdGVyJywge1xuICAgICAgY2x1c3Rlck5hbWU6ICdlY29zeXN0ZW1jbC1hZ2VudHMnLFxuICAgICAgdnBjLFxuICAgICAgY29udGFpbmVySW5zaWdodHM6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBEZWFkIExldHRlciBRdWV1ZSBmb3IgZmFpbGVkIHRhc2tzXG4gICAgdGhpcy5kZWFkTGV0dGVyUXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdEZWFkTGV0dGVyUXVldWUnLCB7XG4gICAgICBxdWV1ZU5hbWU6ICdlY29zeXN0ZW1jbC1kbHEnLFxuICAgICAgcmV0ZW50aW9uUGVyaW9kOiBjZGsuRHVyYXRpb24uZGF5cygxNCksXG4gICAgICBlbmNyeXB0aW9uOiBzcXMuUXVldWVFbmNyeXB0aW9uLktNU19NQU5BR0VELFxuICAgIH0pO1xuXG4gICAgLy8gUHJpbWFyeSBUYXNrIFF1ZXVlIHdpdGggRExRXG4gICAgdGhpcy50YXNrUXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdUYXNrUXVldWUnLCB7XG4gICAgICBxdWV1ZU5hbWU6ICdlY29zeXN0ZW1jbC10YXNrcycsXG4gICAgICB2aXNpYmlsaXR5VGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMTUpLFxuICAgICAgcmV0ZW50aW9uUGVyaW9kOiBjZGsuRHVyYXRpb24uZGF5cyg0KSxcbiAgICAgIGRlYWRMZXR0ZXJRdWV1ZToge1xuICAgICAgICBtYXhSZWNlaXZlQ291bnQ6IDMsXG4gICAgICAgIHF1ZXVlOiB0aGlzLmRlYWRMZXR0ZXJRdWV1ZSxcbiAgICAgIH0sXG4gICAgICBlbmNyeXB0aW9uOiBzcXMuUXVldWVFbmNyeXB0aW9uLktNU19NQU5BR0VELFxuICAgIH0pO1xuXG4gICAgLy8gVGFzayBFeGVjdXRpb24gUm9sZSBmb3IgRmFyZ2F0ZVxuICAgIGNvbnN0IHRhc2tFeGVjdXRpb25Sb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdUYXNrRXhlY3V0aW9uUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlY3MtdGFza3MuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FtYXpvbkVDU1Rhc2tFeGVjdXRpb25Sb2xlUG9saWN5JyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gVGFzayBSb2xlIGZvciBhcHBsaWNhdGlvbi1sZXZlbCBwZXJtaXNzaW9uc1xuICAgIGNvbnN0IHRhc2tSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdUYXNrUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlY3MtdGFza3MuYW1hem9uYXdzLmNvbScpLFxuICAgIH0pO1xuXG4gICAgLy8gSW1wb3J0IHJlZmVyZW5jZWQgcmVzb3VyY2VzIGJ5IG5hbWUgd2l0aCBzdHJlYW0gQVJOXG4gICAgY29uc3QgcGF0dGVyblRhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlQXR0cmlidXRlcyh0aGlzLCAnUGF0dGVyblRhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiBwcm9wcy5wYXR0ZXJuVGFibGVOYW1lLFxuICAgICAgdGFibGVTdHJlYW1Bcm46ICdhcm46YXdzOmR5bmFtb2RiOnVzLXdlc3QtMjoyMTk4OTUyNDMwNzM6dGFibGUvSGVsaXhQYXR0ZXJuRW50cmllcy9zdHJlYW0vMjAyNS0wOS0wM1QyMzowMDoxNC4yNjUnLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnMgdG8gYWNjZXNzIHJlc291cmNlc1xuICAgIHByb3BzLmFydGlmYWN0c0J1Y2tldC5ncmFudFJlYWRXcml0ZSh0YXNrUm9sZSk7XG4gICAgcGF0dGVyblRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh0YXNrUm9sZSk7XG4gICAgdGhpcy50YXNrUXVldWUuZ3JhbnRDb25zdW1lTWVzc2FnZXModGFza1JvbGUpO1xuICAgIHRoaXMudGFza1F1ZXVlLmdyYW50U2VuZE1lc3NhZ2VzKHRhc2tSb2xlKTtcbiAgICBcbiAgICAvLyBHcmFudCBhY2Nlc3MgdG8gVGVzdGNvbnRhaW5lcnMgQ2xvdWQgc2VjcmV0XG4gICAgdGNDbG91ZFNlY3JldC5ncmFudFJlYWQodGFza1JvbGUpO1xuXG4gICAgLy8gR3JhbnQgQmVkcm9jayBhY2Nlc3MgZm9yIEFJIG1vZGVsIGludm9jYXRpb25zXG4gICAgdGFza1JvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbCcsXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsV2l0aFJlc3BvbnNlU3RyZWFtJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEJhc2UgVGFzayBEZWZpbml0aW9uIGZvciBBZ2VudCBDb250YWluZXJzXG4gICAgY29uc3QgdGFza0RlZmluaXRpb24gPSBuZXcgZWNzLkZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCAnQWdlbnRUYXNrRGVmaW5pdGlvbicsIHtcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAyMDQ4LFxuICAgICAgY3B1OiAxMDI0LFxuICAgICAgZXhlY3V0aW9uUm9sZTogdGFza0V4ZWN1dGlvblJvbGUsXG4gICAgICB0YXNrUm9sZSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBhIGRlZmF1bHQgZXNzZW50aWFsIGNvbnRhaW5lciBzbyB0YXNrcyBjYW4gcnVuXG4gICAgdGFza0RlZmluaXRpb24uYWRkQ29udGFpbmVyKCdBZ2VudENvbnRhaW5lcicsIHtcbiAgICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KCdwdWJsaWMuZWNyLmF3cy9kb2NrZXIvbGlicmFyeS9ub2RlOjIwLWFscGluZScpLFxuICAgICAgZXNzZW50aWFsOiB0cnVlLFxuICAgICAgbG9nZ2luZzogZWNzLkxvZ0RyaXZlcnMuYXdzTG9ncyh7IHN0cmVhbVByZWZpeDogJ2Vjb3N5c3RlbWNsLWFnZW50JyB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBU0tfUVVFVUVfVVJMOiB0aGlzLnRhc2tRdWV1ZS5xdWV1ZVVybCxcbiAgICAgICAgUEFUVEVSTl9UQUJMRV9OQU1FOiBwYXR0ZXJuVGFibGUudGFibGVOYW1lLFxuICAgICAgICBUQ0NMT1VEX1NFQ1JFVF9BUk46IHRjQ2xvdWRTZWNyZXQuc2VjcmV0QXJuLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFN0ZXAgRnVuY3Rpb25zIFN0YXRlIE1hY2hpbmUgZm9yIFByb2plY3QgQXRsYXMgcGlwZWxpbmVcbiAgICBjb25zdCBwcm9qZWN0QXRsYXNTdGF0ZU1hY2hpbmUgPSBuZXcgc3RlcGZ1bmN0aW9ucy5TdGF0ZU1hY2hpbmUodGhpcywgJ1Byb2plY3RBdGxhc1N0YXRlTWFjaGluZScsIHtcbiAgICAgIHN0YXRlTWFjaGluZU5hbWU6ICdQcm9qZWN0QXRsYXMtUGlwZWxpbmUnLFxuICAgICAgZGVmaW5pdGlvbkJvZHk6IHN0ZXBmdW5jdGlvbnMuRGVmaW5pdGlvbkJvZHkuZnJvbUNoYWluYWJsZShcbiAgICAgICAgbmV3IHN0ZXBmdW5jdGlvbnMuUGFyYWxsZWwodGhpcywgJ1Byb2Nlc3NpbmdTdGFnZXMnKVxuICAgICAgICAgIC5icmFuY2goXG4gICAgICAgICAgICBuZXcgc3RlcGZ1bmN0aW9uc1Rhc2tzLkVjc1J1blRhc2sodGhpcywgJ1NvdXJjZUNvZGVBbmFseXplcicsIHtcbiAgICAgICAgICAgICAgY2x1c3RlcjogdGhpcy5lY3NDbHVzdGVyLFxuICAgICAgICAgICAgICB0YXNrRGVmaW5pdGlvbixcbiAgICAgICAgICAgICAgbGF1bmNoVGFyZ2V0OiBuZXcgc3RlcGZ1bmN0aW9uc1Rhc2tzLkVjc0ZhcmdhdGVMYXVuY2hUYXJnZXQoe1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtVmVyc2lvbjogZWNzLkZhcmdhdGVQbGF0Zm9ybVZlcnNpb24uTEFURVNULFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgY29udGFpbmVyT3ZlcnJpZGVzOiBbe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRlZmluaXRpb246IHRhc2tEZWZpbml0aW9uLmRlZmF1bHRDb250YWluZXIhLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiBbXG4gICAgICAgICAgICAgICAgICB7IG5hbWU6ICdBR0VOVF9UWVBFJywgdmFsdWU6ICdTb3VyY2VDb2RlQW5hbHl6ZXInIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgICAubmV4dChcbiAgICAgICAgICAgIG5ldyBzdGVwZnVuY3Rpb25zVGFza3MuRWNzUnVuVGFzayh0aGlzLCAnRW1iZWRkaW5nQWdlbnQnLCB7XG4gICAgICAgICAgICAgIGNsdXN0ZXI6IHRoaXMuZWNzQ2x1c3RlcixcbiAgICAgICAgICAgICAgdGFza0RlZmluaXRpb24sXG4gICAgICAgICAgICAgIGxhdW5jaFRhcmdldDogbmV3IHN0ZXBmdW5jdGlvbnNUYXNrcy5FY3NGYXJnYXRlTGF1bmNoVGFyZ2V0KHtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybVZlcnNpb246IGVjcy5GYXJnYXRlUGxhdGZvcm1WZXJzaW9uLkxBVEVTVCxcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICAgICAgICBjb250YWluZXJEZWZpbml0aW9uOiB0YXNrRGVmaW5pdGlvbi5kZWZhdWx0Q29udGFpbmVyISxcbiAgICAgICAgICAgICAgICBlbnZpcm9ubWVudDogW1xuICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnQUdFTlRfVFlQRScsIHZhbHVlOiAnRW1iZWRkaW5nQWdlbnQnIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgICAubmV4dChcbiAgICAgICAgICAgIG5ldyBzdGVwZnVuY3Rpb25zVGFza3MuRWNzUnVuVGFzayh0aGlzLCAnUGF0dGVyblN5bnRoZXNpemVyJywge1xuICAgICAgICAgICAgICBjbHVzdGVyOiB0aGlzLmVjc0NsdXN0ZXIsXG4gICAgICAgICAgICAgIHRhc2tEZWZpbml0aW9uLFxuICAgICAgICAgICAgICBsYXVuY2hUYXJnZXQ6IG5ldyBzdGVwZnVuY3Rpb25zVGFza3MuRWNzRmFyZ2F0ZUxhdW5jaFRhcmdldCh7XG4gICAgICAgICAgICAgICAgcGxhdGZvcm1WZXJzaW9uOiBlY3MuRmFyZ2F0ZVBsYXRmb3JtVmVyc2lvbi5MQVRFU1QsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBjb250YWluZXJPdmVycmlkZXM6IFt7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGVmaW5pdGlvbjogdGFza0RlZmluaXRpb24uZGVmYXVsdENvbnRhaW5lciEsXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6IFtcbiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ0FHRU5UX1RZUEUnLCB2YWx1ZTogJ1BhdHRlcm5TeW50aGVzaXplcicgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKVxuICAgICAgKSxcbiAgICAgIHRyYWNpbmdFbmFibGVkOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5vcmNoZXN0cmF0aW9uU3RhdGVNYWNoaW5lID0gcHJvamVjdEF0bGFzU3RhdGVNYWNoaW5lO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQ0RDIExBTUJEQSBGT1IgRFlOQU1PREIgU1RSRUFNU1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLy8gQ3JlYXRlIFMzIGJ1Y2tldCBmb3IgcGF0dGVybiB2ZXJzaW9uaW5nXG4gICAgY29uc3QgdmVyc2lvbkJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1BhdHRlcm5WZXJzaW9uQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYGVjb3N5c3RlbWNsLXBhdHRlcm4tdmVyc2lvbnMtJHt0aGlzLmFjY291bnR9YCxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbe1xuICAgICAgICBpZDogJ0RlbGV0ZU9sZFZlcnNpb25zJyxcbiAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cyg5MCksXG4gICAgICB9XSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICB9KTtcblxuICAgIC8vIENEQyBEZWFkIExldHRlciBRdWV1ZVxuICAgIHRoaXMuY2RjRGVhZExldHRlclF1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnQ0RDRGVhZExldHRlclF1ZXVlJywge1xuICAgICAgcXVldWVOYW1lOiAnZWNvc3lzdGVtY2wtY2RjLWRscScsXG4gICAgICByZXRlbnRpb25QZXJpb2Q6IGNkay5EdXJhdGlvbi5kYXlzKDE0KSxcbiAgICAgIGVuY3J5cHRpb246IHNxcy5RdWV1ZUVuY3J5cHRpb24uS01TX01BTkFHRUQsXG4gICAgfSk7XG5cbiAgICAvLyBTTlMgVG9waWMgZm9yIERMUSBBbGFybXNcbiAgICBjb25zdCBhbGFybVRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQ0RDQWxhcm1Ub3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogJ2Vjb3N5c3RlbWNsLWNkYy1hbGFybXMnLFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBBbGFybSBmb3IgRExRXG4gICAgbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0NEQ0RMUUFsYXJtJywge1xuICAgICAgbWV0cmljOiB0aGlzLmNkY0RlYWRMZXR0ZXJRdWV1ZS5tZXRyaWNBcHByb3hpbWF0ZU51bWJlck9mTWVzc2FnZXNWaXNpYmxlKCksXG4gICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5OT1RfQlJFQUNISU5HLFxuICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0NEQyBEZWFkIExldHRlciBRdWV1ZSBoYXMgbWVzc2FnZXMnLFxuICAgIH0pLmFkZEFsYXJtQWN0aW9uKG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24oYWxhcm1Ub3BpYykpO1xuXG4gICAgLy8gQ0RDIFByb2Nlc3NvciBMYW1iZGFcbiAgICB0aGlzLmNkY1Byb2Nlc3NvciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NEQ1Byb2Nlc3NvcicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ2Vjb3N5c3RlbWNsLWNkYy1wcm9jZXNzb3InLFxuICAgICAgZW50cnk6ICcuLi93b3JrZXIvc3JjL2xhbWJkYXMvY2RjUHJvY2Vzc29yLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgYXJjaGl0ZWN0dXJlOiBsYW1iZGEuQXJjaGl0ZWN0dXJlLkFSTV82NCxcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIC8vIHJlc2VydmVkQ29uY3VycmVudEV4ZWN1dGlvbnM6IDUsIC8vIFJlbW92ZWQgZHVlIHRvIGFjY291bnQgbGltaXRzXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBPUEVOU0VBUkNIX0VORFBPSU5UOiBwcm9jZXNzLmVudi5PUEVOU0VBUkNIX0VORFBPSU5UIHx8ICcnLFxuICAgICAgICBETFFfVVJMOiB0aGlzLmNkY0RlYWRMZXR0ZXJRdWV1ZS5xdWV1ZVVybCxcbiAgICAgICAgVkVSU0lPTl9CVUNLRVQ6IHZlcnNpb25CdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgVENDTE9VRF9TRUNSRVRfQVJOOiB0Y0Nsb3VkU2VjcmV0LnNlY3JldEFybixcbiAgICAgICAgTk9ERV9PUFRJT05TOiAnLS1lbmFibGUtc291cmNlLW1hcHMnLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIG1pbmlmeTogZmFsc2UsIC8vIEtlZXAgZmFsc2UgZm9yIGRlYnVnZ2luZ1xuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICAgIGZvcmNlRG9ja2VyQnVuZGxpbmc6IHRydWUsXG4gICAgICB9LFxuICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnMgdG8gQ0RDIExhbWJkYVxuICAgIHBhdHRlcm5UYWJsZS5ncmFudFN0cmVhbVJlYWQodGhpcy5jZGNQcm9jZXNzb3IpO1xuICAgIHZlcnNpb25CdWNrZXQuZ3JhbnRXcml0ZSh0aGlzLmNkY1Byb2Nlc3Nvcik7XG4gICAgdGhpcy5jZGNEZWFkTGV0dGVyUXVldWUuZ3JhbnRTZW5kTWVzc2FnZXModGhpcy5jZGNQcm9jZXNzb3IpO1xuICAgIFxuICAgIC8vIEdyYW50IGFjY2VzcyB0byBUZXN0Y29udGFpbmVycyBDbG91ZCBzZWNyZXRcbiAgICB0Y0Nsb3VkU2VjcmV0LmdyYW50UmVhZCh0aGlzLmNkY1Byb2Nlc3Nvcik7XG5cbiAgICAvLyBHcmFudCBDbG91ZFdhdGNoIG1ldHJpY3MgcGVybWlzc2lvbnNcbiAgICB0aGlzLmNkY1Byb2Nlc3Nvci5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnY2xvdWR3YXRjaDpQdXRNZXRyaWNEYXRhJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEdyYW50IEJlZHJvY2sgYWNjZXNzIGZvciBlbWJlZGRpbmdzXG4gICAgdGhpcy5jZGNQcm9jZXNzb3IuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWwnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gQWRkIER5bmFtb0RCIFN0cmVhbSBldmVudCBzb3VyY2UgbWFwcGluZ1xuICAgIC8vIENvbmZpZ3VyZSBDREMgTGFtYmRhIHRvIHByb2Nlc3MgSGVsaXhQYXR0ZXJuRW50cmllcyB0YWJsZSBzdHJlYW0gZXZlbnRzXG4gICAgdGhpcy5jZGNQcm9jZXNzb3IuYWRkRXZlbnRTb3VyY2UoXG4gICAgICBuZXcgbGFtYmRhRXZlbnRTb3VyY2VzLkR5bmFtb0V2ZW50U291cmNlKHBhdHRlcm5UYWJsZSwge1xuICAgICAgICBzdGFydGluZ1Bvc2l0aW9uOiBsYW1iZGEuU3RhcnRpbmdQb3NpdGlvbi5UUklNX0hPUklaT04sXG4gICAgICAgIGJhdGNoU2l6ZTogNTAsXG4gICAgICAgIG1heEJhdGNoaW5nV2luZG93OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg1KSxcbiAgICAgICAgYmlzZWN0QmF0Y2hPbkVycm9yOiB0cnVlLFxuICAgICAgICByZXRyeUF0dGVtcHRzOiAzLFxuICAgICAgICBwYXJhbGxlbGl6YXRpb25GYWN0b3I6IDEsXG4gICAgICAgIHJlcG9ydEJhdGNoSXRlbUZhaWx1cmVzOiB0cnVlLFxuICAgICAgICBvbkZhaWx1cmU6IG5ldyBsYW1iZGFFdmVudFNvdXJjZXMuU3FzRGxxKHRoaXMuY2RjRGVhZExldHRlclF1ZXVlKSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIENsb3VkRm9ybWF0aW9uIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVGFza1F1ZXVlVXJsJywge1xuICAgICAgdmFsdWU6IHRoaXMudGFza1F1ZXVlLnF1ZXVlVXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdTUVMgUXVldWUgVVJMIGZvciB0YXNrIHN1Ym1pc3Npb24nLFxuICAgICAgZXhwb3J0TmFtZTogJ1Rhc2tRdWV1ZVVybCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3RhdGVNYWNoaW5lQXJuJywge1xuICAgICAgdmFsdWU6IHByb2plY3RBdGxhc1N0YXRlTWFjaGluZS5zdGF0ZU1hY2hpbmVBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ1N0ZXAgRnVuY3Rpb25zIFN0YXRlIE1hY2hpbmUgQVJOJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdQcm9qZWN0QXRsYXNTdGF0ZU1hY2hpbmVBcm4nLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NEQ1Byb2Nlc3NvckFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmNkY1Byb2Nlc3Nvci5mdW5jdGlvbkFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ0RDIFByb2Nlc3NvciBMYW1iZGEgQVJOJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdDRENQcm9jZXNzb3JBcm4nLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NEQ0RMUVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmNkY0RlYWRMZXR0ZXJRdWV1ZS5xdWV1ZVVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ0RDIERlYWQgTGV0dGVyIFF1ZXVlIFVSTCcsXG4gICAgICBleHBvcnROYW1lOiAnQ0RDRExRVXJsJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdWZXJzaW9uQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiB2ZXJzaW9uQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1BhdHRlcm4gVmVyc2lvbiBTMyBCdWNrZXQgTmFtZScsXG4gICAgICBleHBvcnROYW1lOiAnUGF0dGVyblZlcnNpb25CdWNrZXQnLFxuICAgIH0pO1xuICB9XG59XG4iXX0=