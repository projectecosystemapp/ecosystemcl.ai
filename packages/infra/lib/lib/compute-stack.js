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
const stepfunctions = __importStar(require("aws-cdk-lib/aws-stepfunctions"));
const stepfunctionsTasks = __importStar(require("aws-cdk-lib/aws-stepfunctions-tasks"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
/**
 * Compute Stack for ECOSYSTEMCL.AI
 *
 * Serverless compute orchestration using ECS Fargate, SQS, and Step Functions.
 */
class ComputeStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.ComputeStack = ComputeStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2NvbXB1dGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLDZFQUErRDtBQUMvRCx3RkFBMEU7QUFFMUUsbUVBQXFEO0FBUXJEOzs7O0dBSUc7QUFDSCxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQU16QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHNCQUFzQjtRQUN0QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUMxQyxPQUFPLEVBQUUsd0JBQXdCO1lBQ2pDLE1BQU0sRUFBRSxDQUFDO1lBQ1QsV0FBVyxFQUFFLENBQUMsRUFBRSxtQ0FBbUM7WUFDbkQsbUJBQW1CLEVBQUU7Z0JBQ25CO29CQUNFLFFBQVEsRUFBRSxFQUFFO29CQUNaLElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07aUJBQ2xDO2dCQUNEO29CQUNFLFFBQVEsRUFBRSxFQUFFO29CQUNaLElBQUksRUFBRSxTQUFTO29CQUNmLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtpQkFDL0M7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILGNBQWM7UUFDZCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BELFdBQVcsRUFBRSxvQkFBb0I7WUFDakMsR0FBRztZQUNILGlCQUFpQixFQUFFLElB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ekMsS0FBSyxFQUFFLHdCQUF3QixDQUFDLGVBQWU7WUFDL0MsV0FBVyxFQUFFLGtDQUFrQztZQUMvQyxVQUFVLEVBQUUsNkJBQTZCO1NBQzFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTlLRCxvQ0E4S0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWNzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3MnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0ICogYXMgc3RlcGZ1bmN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3RlcGZ1bmN0aW9ucyc7XG5pbXBvcnQgKiBhcyBzdGVwZnVuY3Rpb25zVGFza3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLXN0ZXBmdW5jdGlvbnMtdGFza3MnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuaW50ZXJmYWNlIENvbXB1dGVTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBhcnRpZmFjdHNCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcGF0dGVyblRhYmxlTmFtZTogc3RyaW5nO1xufVxuXG4vKipcbiAqIENvbXB1dGUgU3RhY2sgZm9yIEVDT1NZU1RFTUNMLkFJXG4gKiBcbiAqIFNlcnZlcmxlc3MgY29tcHV0ZSBvcmNoZXN0cmF0aW9uIHVzaW5nIEVDUyBGYXJnYXRlLCBTUVMsIGFuZCBTdGVwIEZ1bmN0aW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXB1dGVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBlY3NDbHVzdGVyOiBlY3MuQ2x1c3RlcjtcbiAgcHVibGljIHJlYWRvbmx5IHRhc2tRdWV1ZTogc3FzLlF1ZXVlO1xuICBwdWJsaWMgcmVhZG9ubHkgZGVhZExldHRlclF1ZXVlOiBzcXMuUXVldWU7XG4gIHB1YmxpYyByZWFkb25seSBvcmNoZXN0cmF0aW9uU3RhdGVNYWNoaW5lOiBzdGVwZnVuY3Rpb25zLlN0YXRlTWFjaGluZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQ29tcHV0ZVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFZQQyBmb3IgRUNTIEZhcmdhdGVcbiAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnQ29tcHV0ZVZQQycsIHtcbiAgICAgIHZwY05hbWU6ICdFY29zeXN0ZW1DTC1Db21wdXRlVlBDJyxcbiAgICAgIG1heEF6czogMixcbiAgICAgIG5hdEdhdGV3YXlzOiAxLCAvLyBTaW5nbGUgTkFUIGZvciBjb3N0IG9wdGltaXphdGlvblxuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQdWJsaWMnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICBuYW1lOiAnUHJpdmF0ZScsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBFQ1MgQ2x1c3RlclxuICAgIHRoaXMuZWNzQ2x1c3RlciA9IG5ldyBlY3MuQ2x1c3Rlcih0aGlzLCAnRUNTQ2x1c3RlcicsIHtcbiAgICAgIGNsdXN0ZXJOYW1lOiAnZWNvc3lzdGVtY2wtYWdlbnRzJyxcbiAgICAgIHZwYyxcbiAgICAgIGNvbnRhaW5lckluc2lnaHRzOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gRGVhZCBMZXR0ZXIgUXVldWUgZm9yIGZhaWxlZCB0YXNrc1xuICAgIHRoaXMuZGVhZExldHRlclF1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnRGVhZExldHRlclF1ZXVlJywge1xuICAgICAgcXVldWVOYW1lOiAnZWNvc3lzdGVtY2wtZGxxJyxcbiAgICAgIHJldGVudGlvblBlcmlvZDogY2RrLkR1cmF0aW9uLmRheXMoMTQpLFxuICAgICAgZW5jcnlwdGlvbjogc3FzLlF1ZXVlRW5jcnlwdGlvbi5LTVNfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vIFByaW1hcnkgVGFzayBRdWV1ZSB3aXRoIERMUVxuICAgIHRoaXMudGFza1F1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnVGFza1F1ZXVlJywge1xuICAgICAgcXVldWVOYW1lOiAnZWNvc3lzdGVtY2wtdGFza3MnLFxuICAgICAgdmlzaWJpbGl0eVRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDE1KSxcbiAgICAgIHJldGVudGlvblBlcmlvZDogY2RrLkR1cmF0aW9uLmRheXMoNCksXG4gICAgICBkZWFkTGV0dGVyUXVldWU6IHtcbiAgICAgICAgbWF4UmVjZWl2ZUNvdW50OiAzLFxuICAgICAgICBxdWV1ZTogdGhpcy5kZWFkTGV0dGVyUXVldWUsXG4gICAgICB9LFxuICAgICAgZW5jcnlwdGlvbjogc3FzLlF1ZXVlRW5jcnlwdGlvbi5LTVNfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vIFRhc2sgRXhlY3V0aW9uIFJvbGUgZm9yIEZhcmdhdGVcbiAgICBjb25zdCB0YXNrRXhlY3V0aW9uUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnVGFza0V4ZWN1dGlvblJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWNzLXRhc2tzLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BbWF6b25FQ1NUYXNrRXhlY3V0aW9uUm9sZVBvbGljeScpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFRhc2sgUm9sZSBmb3IgYXBwbGljYXRpb24tbGV2ZWwgcGVybWlzc2lvbnNcbiAgICBjb25zdCB0YXNrUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnVGFza1JvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWNzLXRhc2tzLmFtYXpvbmF3cy5jb20nKSxcbiAgICB9KTtcblxuICAgIC8vIEltcG9ydCByZWZlcmVuY2VkIHJlc291cmNlcyBieSBuYW1lXG4gICAgY29uc3QgcGF0dGVyblRhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZSh0aGlzLCAnUGF0dGVyblRhYmxlJywgcHJvcHMucGF0dGVyblRhYmxlTmFtZSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9ucyB0byBhY2Nlc3MgcmVzb3VyY2VzXG4gICAgcHJvcHMuYXJ0aWZhY3RzQnVja2V0LmdyYW50UmVhZFdyaXRlKHRhc2tSb2xlKTtcbiAgICBwYXR0ZXJuVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRhc2tSb2xlKTtcbiAgICB0aGlzLnRhc2tRdWV1ZS5ncmFudENvbnN1bWVNZXNzYWdlcyh0YXNrUm9sZSk7XG4gICAgdGhpcy50YXNrUXVldWUuZ3JhbnRTZW5kTWVzc2FnZXModGFza1JvbGUpO1xuXG4gICAgLy8gR3JhbnQgQmVkcm9jayBhY2Nlc3MgZm9yIEFJIG1vZGVsIGludm9jYXRpb25zXG4gICAgdGFza1JvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbCcsXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsV2l0aFJlc3BvbnNlU3RyZWFtJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEJhc2UgVGFzayBEZWZpbml0aW9uIGZvciBBZ2VudCBDb250YWluZXJzXG4gICAgY29uc3QgdGFza0RlZmluaXRpb24gPSBuZXcgZWNzLkZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCAnQWdlbnRUYXNrRGVmaW5pdGlvbicsIHtcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAyMDQ4LFxuICAgICAgY3B1OiAxMDI0LFxuICAgICAgZXhlY3V0aW9uUm9sZTogdGFza0V4ZWN1dGlvblJvbGUsXG4gICAgICB0YXNrUm9sZSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBhIGRlZmF1bHQgZXNzZW50aWFsIGNvbnRhaW5lciBzbyB0YXNrcyBjYW4gcnVuXG4gICAgdGFza0RlZmluaXRpb24uYWRkQ29udGFpbmVyKCdBZ2VudENvbnRhaW5lcicsIHtcbiAgICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KCdwdWJsaWMuZWNyLmF3cy9kb2NrZXIvbGlicmFyeS9ub2RlOjIwLWFscGluZScpLFxuICAgICAgZXNzZW50aWFsOiB0cnVlLFxuICAgICAgbG9nZ2luZzogZWNzLkxvZ0RyaXZlcnMuYXdzTG9ncyh7IHN0cmVhbVByZWZpeDogJ2Vjb3N5c3RlbWNsLWFnZW50JyB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBU0tfUVVFVUVfVVJMOiB0aGlzLnRhc2tRdWV1ZS5xdWV1ZVVybCxcbiAgICAgICAgUEFUVEVSTl9UQUJMRV9OQU1FOiBwYXR0ZXJuVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFN0ZXAgRnVuY3Rpb25zIFN0YXRlIE1hY2hpbmUgZm9yIFByb2plY3QgQXRsYXMgcGlwZWxpbmVcbiAgICBjb25zdCBwcm9qZWN0QXRsYXNTdGF0ZU1hY2hpbmUgPSBuZXcgc3RlcGZ1bmN0aW9ucy5TdGF0ZU1hY2hpbmUodGhpcywgJ1Byb2plY3RBdGxhc1N0YXRlTWFjaGluZScsIHtcbiAgICAgIHN0YXRlTWFjaGluZU5hbWU6ICdQcm9qZWN0QXRsYXMtUGlwZWxpbmUnLFxuICAgICAgZGVmaW5pdGlvbkJvZHk6IHN0ZXBmdW5jdGlvbnMuRGVmaW5pdGlvbkJvZHkuZnJvbUNoYWluYWJsZShcbiAgICAgICAgbmV3IHN0ZXBmdW5jdGlvbnMuUGFyYWxsZWwodGhpcywgJ1Byb2Nlc3NpbmdTdGFnZXMnKVxuICAgICAgICAgIC5icmFuY2goXG4gICAgICAgICAgICBuZXcgc3RlcGZ1bmN0aW9uc1Rhc2tzLkVjc1J1blRhc2sodGhpcywgJ1NvdXJjZUNvZGVBbmFseXplcicsIHtcbiAgICAgICAgICAgICAgY2x1c3RlcjogdGhpcy5lY3NDbHVzdGVyLFxuICAgICAgICAgICAgICB0YXNrRGVmaW5pdGlvbixcbiAgICAgICAgICAgICAgbGF1bmNoVGFyZ2V0OiBuZXcgc3RlcGZ1bmN0aW9uc1Rhc2tzLkVjc0ZhcmdhdGVMYXVuY2hUYXJnZXQoe1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtVmVyc2lvbjogZWNzLkZhcmdhdGVQbGF0Zm9ybVZlcnNpb24uTEFURVNULFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgY29udGFpbmVyT3ZlcnJpZGVzOiBbe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRlZmluaXRpb246IHRhc2tEZWZpbml0aW9uLmRlZmF1bHRDb250YWluZXIhLFxuICAgICAgICAgICAgICAgIGVudmlyb25tZW50OiBbXG4gICAgICAgICAgICAgICAgICB7IG5hbWU6ICdBR0VOVF9UWVBFJywgdmFsdWU6ICdTb3VyY2VDb2RlQW5hbHl6ZXInIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgICAubmV4dChcbiAgICAgICAgICAgIG5ldyBzdGVwZnVuY3Rpb25zVGFza3MuRWNzUnVuVGFzayh0aGlzLCAnRW1iZWRkaW5nQWdlbnQnLCB7XG4gICAgICAgICAgICAgIGNsdXN0ZXI6IHRoaXMuZWNzQ2x1c3RlcixcbiAgICAgICAgICAgICAgdGFza0RlZmluaXRpb24sXG4gICAgICAgICAgICAgIGxhdW5jaFRhcmdldDogbmV3IHN0ZXBmdW5jdGlvbnNUYXNrcy5FY3NGYXJnYXRlTGF1bmNoVGFyZ2V0KHtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybVZlcnNpb246IGVjcy5GYXJnYXRlUGxhdGZvcm1WZXJzaW9uLkxBVEVTVCxcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICAgICAgICBjb250YWluZXJEZWZpbml0aW9uOiB0YXNrRGVmaW5pdGlvbi5kZWZhdWx0Q29udGFpbmVyISxcbiAgICAgICAgICAgICAgICBlbnZpcm9ubWVudDogW1xuICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnQUdFTlRfVFlQRScsIHZhbHVlOiAnRW1iZWRkaW5nQWdlbnQnIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgICAubmV4dChcbiAgICAgICAgICAgIG5ldyBzdGVwZnVuY3Rpb25zVGFza3MuRWNzUnVuVGFzayh0aGlzLCAnUGF0dGVyblN5bnRoZXNpemVyJywge1xuICAgICAgICAgICAgICBjbHVzdGVyOiB0aGlzLmVjc0NsdXN0ZXIsXG4gICAgICAgICAgICAgIHRhc2tEZWZpbml0aW9uLFxuICAgICAgICAgICAgICBsYXVuY2hUYXJnZXQ6IG5ldyBzdGVwZnVuY3Rpb25zVGFza3MuRWNzRmFyZ2F0ZUxhdW5jaFRhcmdldCh7XG4gICAgICAgICAgICAgICAgcGxhdGZvcm1WZXJzaW9uOiBlY3MuRmFyZ2F0ZVBsYXRmb3JtVmVyc2lvbi5MQVRFU1QsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBjb250YWluZXJPdmVycmlkZXM6IFt7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGVmaW5pdGlvbjogdGFza0RlZmluaXRpb24uZGVmYXVsdENvbnRhaW5lciEsXG4gICAgICAgICAgICAgICAgZW52aXJvbm1lbnQ6IFtcbiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ0FHRU5UX1RZUEUnLCB2YWx1ZTogJ1BhdHRlcm5TeW50aGVzaXplcicgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKVxuICAgICAgKSxcbiAgICAgIHRyYWNpbmdFbmFibGVkOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5vcmNoZXN0cmF0aW9uU3RhdGVNYWNoaW5lID0gcHJvamVjdEF0bGFzU3RhdGVNYWNoaW5lO1xuXG4gICAgLy8gQ2xvdWRGb3JtYXRpb24gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdUYXNrUXVldWVVcmwnLCB7XG4gICAgICB2YWx1ZTogdGhpcy50YXNrUXVldWUucXVldWVVcmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NRUyBRdWV1ZSBVUkwgZm9yIHRhc2sgc3VibWlzc2lvbicsXG4gICAgICBleHBvcnROYW1lOiAnVGFza1F1ZXVlVXJsJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTdGF0ZU1hY2hpbmVBcm4nLCB7XG4gICAgICB2YWx1ZTogcHJvamVjdEF0bGFzU3RhdGVNYWNoaW5lLnN0YXRlTWFjaGluZUFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3RlcCBGdW5jdGlvbnMgU3RhdGUgTWFjaGluZSBBUk4nLFxuICAgICAgZXhwb3J0TmFtZTogJ1Byb2plY3RBdGxhc1N0YXRlTWFjaGluZUFybicsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==