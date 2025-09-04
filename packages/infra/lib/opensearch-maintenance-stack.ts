import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface OpenSearchMaintenanceStackProps extends cdk.StackProps {
  opensearchEndpoint: string;
  collectionArn: string;
}

export class OpenSearchMaintenanceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OpenSearchMaintenanceStackProps) {
    super(scope, id, props);

    // Index Creator Lambda - One-time use
    const indexCreator = new lambdaNodejs.NodejsFunction(this, 'IndexCreator', {
      functionName: 'ecosystemcl-opensearch-index-creator',
      entry: '../worker/src/lambdas/opensearchIndexCreator.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        OPENSEARCH_ENDPOINT: props.opensearchEndpoint,
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: true,
      },
    });

    // Grant OpenSearch permissions
    indexCreator.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'aoss:APIAccessAll',
      ],
      resources: [props.collectionArn],
    }));

    // DLQ Reprocessor Lambda
    const dlqReprocessor = new lambdaNodejs.NodejsFunction(this, 'DLQReprocessor', {
      functionName: 'ecosystemcl-dlq-reprocessor',
      entry: '../worker/src/lambdas/dlqReprocessor.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      timeout: cdk.Duration.minutes(5),
      environment: {
        DLQ_URL: 'https://sqs.us-west-2.amazonaws.com/219895243073/ecosystemcl-cdc-dlq',
        CDC_FUNCTION_NAME: 'ecosystemcl-cdc-processor',
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: true,
      },
    });

    // Grant permissions for DLQ reprocessing
    dlqReprocessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueAttributes',
      ],
      resources: ['arn:aws:sqs:us-west-2:219895243073:ecosystemcl-cdc-dlq'],
    }));

    dlqReprocessor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lambda:InvokeFunction',
      ],
      resources: ['arn:aws:lambda:us-west-2:219895243073:function:ecosystemcl-cdc-processor'],
    }));

    // Circuit Breaker Reset Lambda
    const circuitBreakerReset = new lambdaNodejs.NodejsFunction(this, 'CircuitBreakerReset', {
      functionName: 'ecosystemcl-circuit-breaker-reset',
      entry: '../worker/src/lambdas/circuitBreakerReset.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        CDC_FUNCTION_NAME: 'ecosystemcl-cdc-processor',
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: false,
        sourceMap: true,
      },
    });

    circuitBreakerReset.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lambda:UpdateFunctionConfiguration',
      ],
      resources: ['arn:aws:lambda:us-west-2:219895243073:function:ecosystemcl-cdc-processor'],
    }));

    // Outputs
    new cdk.CfnOutput(this, 'IndexCreatorArn', {
      value: indexCreator.functionArn,
      description: 'OpenSearch Index Creator Lambda ARN',
    });

    new cdk.CfnOutput(this, 'DLQReprocessorArn', {
      value: dlqReprocessor.functionArn,
      description: 'DLQ Reprocessor Lambda ARN',
    });

    new cdk.CfnOutput(this, 'CircuitBreakerResetArn', {
      value: circuitBreakerReset.functionArn,
      description: 'Circuit Breaker Reset Lambda ARN',
    });
  }
}
