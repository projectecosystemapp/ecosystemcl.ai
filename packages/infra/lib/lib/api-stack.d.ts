import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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
export declare class ApiStack extends cdk.Stack {
    readonly api: apigateway.RestApi;
    readonly helixLookupFunction: lambda.Function;
    readonly plannerFunction: lambda.Function;
    constructor(scope: Construct, id: string, props: ApiStackProps);
}
export {};
