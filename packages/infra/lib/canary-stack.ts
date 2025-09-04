import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export class CanaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function
    const canaryFunction = new lambda.Function(this, 'CanaryFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              message: 'ECOSYSTEM.AI Canary is alive',
              timestamp: new Date().toISOString()
            })
          };
        };
      `),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'CanaryApi', {
      restApiName: 'Canary Test API',
      description: 'Project Canary full system test endpoint',
    });

    const integration = new apigateway.LambdaIntegration(canaryFunction);
    api.root.addMethod('GET', integration);

    // Route 53 hosted zone (existing)
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: 'Z05786381GFBZ9W38SJDR',
      zoneName: 'ecosystem-app.com',
    });

    // ACM Certificate
    const certificate = new acm.Certificate(this, 'CanaryCertificate', {
      domainName: 'canary.ecosystem-app.com',
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Custom domain
    const domain = new apigateway.DomainName(this, 'CanaryDomain', {
      domainName: 'canary.ecosystem-app.com',
      certificate: certificate,
    });

    domain.addBasePathMapping(api);

    // Route 53 A record
    new route53.ARecord(this, 'CanaryARecord', {
      zone: hostedZone,
      recordName: 'canary',
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(domain)),
    });

    // Outputs
    new cdk.CfnOutput(this, 'CanaryEndpoint', {
      value: `https://canary.ecosystem-app.com`,
      description: 'Canary test endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: api.url,
      description: 'Direct API Gateway endpoint',
    });
  }
}