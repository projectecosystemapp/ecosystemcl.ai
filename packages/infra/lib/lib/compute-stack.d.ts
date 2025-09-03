import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as s3 from 'aws-cdk-lib/aws-s3';
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
export declare class ComputeStack extends cdk.Stack {
    readonly ecsCluster: ecs.Cluster;
    readonly taskQueue: sqs.Queue;
    readonly deadLetterQueue: sqs.Queue;
    readonly orchestrationStateMachine: stepfunctions.StateMachine;
    constructor(scope: Construct, id: string, props: ComputeStackProps);
}
export {};
