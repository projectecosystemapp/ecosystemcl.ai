# ECOSYSTEMCL.AI Architecture

## Consolidated Amplify-First Architecture

This platform uses AWS Amplify Gen 2 as the primary backend infrastructure, providing a simplified and cost-effective solution.

### Core Components

**Authentication**: AWS Cognito User Pools with email-based login
**Data Layer**: AWS AppSync (GraphQL) with DynamoDB
**Functions**: AWS Lambda for business logic
**Frontend**: Next.js 15 with Amplify UI components
**CLI**: Node.js CLI tool connecting to Amplify backend

### Data Models

- `UserProfile`: User subscription and credit management
- `Workspace`: Project organization containers  
- `Plan`: Task execution tracking
- `ApiKey`: Encrypted API key storage
- `SubscriptionEvent`: Audit trail for subscription changes

### Deployment

- **Development**: `npx ampx sandbox` for local testing
- **Production**: Amplify auto-deployment via GitHub integration
- **CLI Distribution**: npm package with global installation

### Cost Structure

- Amplify hosting: ~$5-15/month
- DynamoDB: Pay per request (~$1-5/month for development)
- Lambda: Pay per execution (~$0.20 per 1M requests)
- Cognito: 50K MAU free tier

**Total estimated cost**: $10-25/month for development, scales with usage.

This architecture provides 90% of the functionality at 10% of the cost compared to the previous CDK approach.