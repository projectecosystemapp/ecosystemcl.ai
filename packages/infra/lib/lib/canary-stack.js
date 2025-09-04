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
exports.CanaryStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
const acm = __importStar(require("aws-cdk-lib/aws-certificatemanager"));
const targets = __importStar(require("aws-cdk-lib/aws-route53-targets"));
class CanaryStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.CanaryStack = CanaryStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuYXJ5LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vY2FuYXJ5LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVFQUF5RDtBQUN6RCwrREFBaUQ7QUFDakQsaUVBQW1EO0FBQ25ELHdFQUEwRDtBQUMxRCx5RUFBMkQ7QUFHM0QsTUFBYSxXQUFZLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDeEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixrQkFBa0I7UUFDbEIsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNqRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7T0FjNUIsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILGNBQWM7UUFDZCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNwRCxXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLFdBQVcsRUFBRSwwQ0FBMEM7U0FDeEQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxXQUFXLEdBQUcsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDckUsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXZDLGtDQUFrQztRQUNsQyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDakYsWUFBWSxFQUFFLHVCQUF1QjtZQUNyQyxRQUFRLEVBQUUsbUJBQW1CO1NBQzlCLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ2pFLFVBQVUsRUFBRSwwQkFBMEI7WUFDdEMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO1NBQzFELENBQUMsQ0FBQztRQUVILGdCQUFnQjtRQUNoQixNQUFNLE1BQU0sR0FBRyxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUM3RCxVQUFVLEVBQUUsMEJBQTBCO1lBQ3RDLFdBQVcsRUFBRSxXQUFXO1NBQ3pCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUvQixvQkFBb0I7UUFDcEIsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDekMsSUFBSSxFQUFFLFVBQVU7WUFDaEIsVUFBVSxFQUFFLFFBQVE7WUFDcEIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzdFLENBQUMsQ0FBQztRQUVILFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxrQ0FBa0M7WUFDekMsV0FBVyxFQUFFLDBCQUEwQjtTQUN4QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRztZQUNkLFdBQVcsRUFBRSw2QkFBNkI7U0FDM0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBeEVELGtDQXdFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMnO1xuaW1wb3J0ICogYXMgYWNtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1My10YXJnZXRzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgY2xhc3MgQ2FuYXJ5U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBjYW5hcnlGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NhbmFyeUZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ0VDT1NZU1RFTS5BSSBDYW5hcnkgaXMgYWxpdmUnLFxuICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgYCksXG4gICAgfSk7XG5cbiAgICAvLyBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0NhbmFyeUFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnQ2FuYXJ5IFRlc3QgQVBJJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUHJvamVjdCBDYW5hcnkgZnVsbCBzeXN0ZW0gdGVzdCBlbmRwb2ludCcsXG4gICAgfSk7XG5cbiAgICBjb25zdCBpbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNhbmFyeUZ1bmN0aW9uKTtcbiAgICBhcGkucm9vdC5hZGRNZXRob2QoJ0dFVCcsIGludGVncmF0aW9uKTtcblxuICAgIC8vIFJvdXRlIDUzIGhvc3RlZCB6b25lIChleGlzdGluZylcbiAgICBjb25zdCBob3N0ZWRab25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Ib3N0ZWRab25lQXR0cmlidXRlcyh0aGlzLCAnSG9zdGVkWm9uZScsIHtcbiAgICAgIGhvc3RlZFpvbmVJZDogJ1owNTc4NjM4MUdGQlo5VzM4U0pEUicsXG4gICAgICB6b25lTmFtZTogJ2Vjb3N5c3RlbS1hcHAuY29tJyxcbiAgICB9KTtcblxuICAgIC8vIEFDTSBDZXJ0aWZpY2F0ZVxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IGFjbS5DZXJ0aWZpY2F0ZSh0aGlzLCAnQ2FuYXJ5Q2VydGlmaWNhdGUnLCB7XG4gICAgICBkb21haW5OYW1lOiAnY2FuYXJ5LmVjb3N5c3RlbS1hcHAuY29tJyxcbiAgICAgIHZhbGlkYXRpb246IGFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucyhob3N0ZWRab25lKSxcbiAgICB9KTtcblxuICAgIC8vIEN1c3RvbSBkb21haW5cbiAgICBjb25zdCBkb21haW4gPSBuZXcgYXBpZ2F0ZXdheS5Eb21haW5OYW1lKHRoaXMsICdDYW5hcnlEb21haW4nLCB7XG4gICAgICBkb21haW5OYW1lOiAnY2FuYXJ5LmVjb3N5c3RlbS1hcHAuY29tJyxcbiAgICAgIGNlcnRpZmljYXRlOiBjZXJ0aWZpY2F0ZSxcbiAgICB9KTtcblxuICAgIGRvbWFpbi5hZGRCYXNlUGF0aE1hcHBpbmcoYXBpKTtcblxuICAgIC8vIFJvdXRlIDUzIEEgcmVjb3JkXG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCAnQ2FuYXJ5QVJlY29yZCcsIHtcbiAgICAgIHpvbmU6IGhvc3RlZFpvbmUsXG4gICAgICByZWNvcmROYW1lOiAnY2FuYXJ5JyxcbiAgICAgIHRhcmdldDogcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyB0YXJnZXRzLkFwaUdhdGV3YXlEb21haW4oZG9tYWluKSksXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NhbmFyeUVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IGBodHRwczovL2NhbmFyeS5lY29zeXN0ZW0tYXBwLmNvbWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NhbmFyeSB0ZXN0IGVuZHBvaW50IFVSTCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpR2F0ZXdheUVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdCBBUEkgR2F0ZXdheSBlbmRwb2ludCcsXG4gICAgfSk7XG4gIH1cbn0iXX0=