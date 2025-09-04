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
exports.OpenSearchMaintenanceStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class OpenSearchMaintenanceStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.OpenSearchMaintenanceStack = OpenSearchMaintenanceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbnNlYXJjaC1tYWludGVuYW5jZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL29wZW5zZWFyY2gtbWFpbnRlbmFuY2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsK0RBQWlEO0FBQ2pELDRFQUE4RDtBQUM5RCx5REFBMkM7QUFRM0MsTUFBYSwwQkFBMkIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN2RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNDO1FBQzlFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHNDQUFzQztRQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN6RSxZQUFZLEVBQUUsc0NBQXNDO1lBQ3BELEtBQUssRUFBRSxpREFBaUQ7WUFDeEQsT0FBTyxFQUFFLFNBQVM7WUFDbEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNO1lBQ3hDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxXQUFXLEVBQUU7Z0JBQ1gsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLGtCQUFrQjtnQkFDN0MsWUFBWSxFQUFFLHNCQUFzQjthQUNyQztZQUNELFFBQVEsRUFBRTtnQkFDUixlQUFlLEVBQUUsQ0FBQyxZQUFZLENBQUM7Z0JBQy9CLE1BQU0sRUFBRSxLQUFLO2dCQUNiLFNBQVMsRUFBRSxJQUFJO2FBQ2hCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsK0JBQStCO1FBQy9CLFlBQVksQ0FBQyxlQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxD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QVksQ0FBQyxXQUFXO1lBQy9CLFdBQVcsRUFBRSxxQ0FBcUM7U0FDbkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsY0FBYyxDQUFDLFdBQVc7WUFDakMsV0FBVyxFQUFFLDRCQUE0QjtTQUMxQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHdCQUF3QixFQUFFO1lBQ2hELEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxXQUFXO1lBQ3RDLFdBQVcsRUFBRSxrQ0FBa0M7U0FDaEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBckhELGdFQXFIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBsYW1iZGFOb2RlanMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmludGVyZmFjZSBPcGVuU2VhcmNoTWFpbnRlbmFuY2VTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBvcGVuc2VhcmNoRW5kcG9pbnQ6IHN0cmluZztcbiAgY29sbGVjdGlvbkFybjogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgT3BlblNlYXJjaE1haW50ZW5hbmNlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogT3BlblNlYXJjaE1haW50ZW5hbmNlU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gSW5kZXggQ3JlYXRvciBMYW1iZGEgLSBPbmUtdGltZSB1c2VcbiAgICBjb25zdCBpbmRleENyZWF0b3IgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdJbmRleENyZWF0b3InLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdlY29zeXN0ZW1jbC1vcGVuc2VhcmNoLWluZGV4LWNyZWF0b3InLFxuICAgICAgZW50cnk6ICcuLi93b3JrZXIvc3JjL2xhbWJkYXMvb3BlbnNlYXJjaEluZGV4Q3JlYXRvci50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGFyY2hpdGVjdHVyZTogbGFtYmRhLkFyY2hpdGVjdHVyZS5BUk1fNjQsXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBPUEVOU0VBUkNIX0VORFBPSU5UOiBwcm9wcy5vcGVuc2VhcmNoRW5kcG9pbnQsXG4gICAgICAgIE5PREVfT1BUSU9OUzogJy0tZW5hYmxlLXNvdXJjZS1tYXBzJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBtaW5pZnk6IGZhbHNlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgT3BlblNlYXJjaCBwZXJtaXNzaW9uc1xuICAgIGluZGV4Q3JlYXRvci5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYW9zczpBUElBY2Nlc3NBbGwnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW3Byb3BzLmNvbGxlY3Rpb25Bcm5dLFxuICAgIH0pKTtcblxuICAgIC8vIERMUSBSZXByb2Nlc3NvciBMYW1iZGFcbiAgICBjb25zdCBkbHFSZXByb2Nlc3NvciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0RMUVJlcHJvY2Vzc29yJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnZWNvc3lzdGVtY2wtZGxxLXJlcHJvY2Vzc29yJyxcbiAgICAgIGVudHJ5OiAnLi4vd29ya2VyL3NyYy9sYW1iZGFzL2RscVJlcHJvY2Vzc29yLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgYXJjaGl0ZWN0dXJlOiBsYW1iZGEuQXJjaGl0ZWN0dXJlLkFSTV82NCxcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERMUV9VUkw6ICdodHRwczovL3Nxcy51cy13ZXN0LTIuYW1hem9uYXdzLmNvbS8yMTk4OTUyNDMwNzMvZWNvc3lzdGVtY2wtY2RjLWRscScsXG4gICAgICAgIENEQ19GVU5DVElPTl9OQU1FOiAnZWNvc3lzdGVtY2wtY2RjLXByb2Nlc3NvcicsXG4gICAgICAgIE5PREVfT1BUSU9OUzogJy0tZW5hYmxlLXNvdXJjZS1tYXBzJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGluZzoge1xuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFsnQGF3cy1zZGsvKiddLFxuICAgICAgICBtaW5pZnk6IGZhbHNlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnMgZm9yIERMUSByZXByb2Nlc3NpbmdcbiAgICBkbHFSZXByb2Nlc3Nvci5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnc3FzOlJlY2VpdmVNZXNzYWdlJyxcbiAgICAgICAgJ3NxczpEZWxldGVNZXNzYWdlJyxcbiAgICAgICAgJ3NxczpHZXRRdWV1ZUF0dHJpYnV0ZXMnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWydhcm46YXdzOnNxczp1cy13ZXN0LTI6MjE5ODk1MjQzMDczOmVjb3N5c3RlbWNsLWNkYy1kbHEnXSxcbiAgICB9KSk7XG5cbiAgICBkbHFSZXByb2Nlc3Nvci5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnbGFtYmRhOkludm9rZUZ1bmN0aW9uJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnYXJuOmF3czpsYW1iZGE6dXMtd2VzdC0yOjIxOTg5NTI0MzA3MzpmdW5jdGlvbjplY29zeXN0ZW1jbC1jZGMtcHJvY2Vzc29yJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gQ2lyY3VpdCBCcmVha2VyIFJlc2V0IExhbWJkYVxuICAgIGNvbnN0IGNpcmN1aXRCcmVha2VyUmVzZXQgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdDaXJjdWl0QnJlYWtlclJlc2V0Jywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnZWNvc3lzdGVtY2wtY2lyY3VpdC1icmVha2VyLXJlc2V0JyxcbiAgICAgIGVudHJ5OiAnLi4vd29ya2VyL3NyYy9sYW1iZGFzL2NpcmN1aXRCcmVha2VyUmVzZXQudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBhcmNoaXRlY3R1cmU6IGxhbWJkYS5BcmNoaXRlY3R1cmUuQVJNXzY0LFxuICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQ0RDX0ZVTkNUSU9OX05BTUU6ICdlY29zeXN0ZW1jbC1jZGMtcHJvY2Vzc29yJyxcbiAgICAgICAgTk9ERV9PUFRJT05TOiAnLS1lbmFibGUtc291cmNlLW1hcHMnLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydAYXdzLXNkay8qJ10sXG4gICAgICAgIG1pbmlmeTogZmFsc2UsXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjaXJjdWl0QnJlYWtlclJlc2V0LmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdsYW1iZGE6VXBkYXRlRnVuY3Rpb25Db25maWd1cmF0aW9uJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnYXJuOmF3czpsYW1iZGE6dXMtd2VzdC0yOjIxOTg5NTI0MzA3MzpmdW5jdGlvbjplY29zeXN0ZW1jbC1jZGMtcHJvY2Vzc29yJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdJbmRleENyZWF0b3JBcm4nLCB7XG4gICAgICB2YWx1ZTogaW5kZXhDcmVhdG9yLmZ1bmN0aW9uQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdPcGVuU2VhcmNoIEluZGV4IENyZWF0b3IgTGFtYmRhIEFSTicsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRExRUmVwcm9jZXNzb3JBcm4nLCB7XG4gICAgICB2YWx1ZTogZGxxUmVwcm9jZXNzb3IuZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0RMUSBSZXByb2Nlc3NvciBMYW1iZGEgQVJOJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDaXJjdWl0QnJlYWtlclJlc2V0QXJuJywge1xuICAgICAgdmFsdWU6IGNpcmN1aXRCcmVha2VyUmVzZXQuZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0NpcmN1aXQgQnJlYWtlciBSZXNldCBMYW1iZGEgQVJOJyxcbiAgICB9KTtcbiAgfVxufVxuIl19