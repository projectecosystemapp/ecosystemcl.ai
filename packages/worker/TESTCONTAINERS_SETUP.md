# Testcontainers Cloud Setup for ECOSYSTEMCL.AI

## Overview
This package is configured to use Testcontainers Cloud for running containerized tests. The integration automatically retrieves credentials from AWS Secrets Manager.

## Prerequisites

1. **AWS Credentials**: Ensure your AWS credentials are configured
2. **Secret Stored**: The Testcontainers Cloud API key is stored in AWS Secrets Manager as `prod/tccloudcode`
3. **Docker**: Local Docker daemon should be running as a fallback

## Configuration

### Automatic Setup (Recommended)
The test suite automatically retrieves the Testcontainers Cloud token from AWS Secrets Manager when running tests.

### Manual Setup (Alternative)
If you prefer to set the token manually:
```bash
export TC_CLOUD_TOKEN="your-testcontainers-cloud-token"
```

## Running Tests

### Run All Tests with Testcontainers Cloud
```bash
npm test
```

### Run Specific Testcontainers Example
```bash
npm run test:tc
```

### Quick Test Script
```bash
./test-tc-cloud.sh
```

## How It Works

1. **SecretsService**: Retrieves the API key from AWS Secrets Manager
2. **TestcontainersCloudService**: Configures environment variables for Testcontainers
3. **Jest Global Setup**: Automatically initializes Testcontainers Cloud before tests
4. **Fallback**: If TC Cloud is unavailable, tests fall back to local Docker

## Environment Variables

- `TCCLOUD_SECRET_ARN`: ARN of the secret in AWS Secrets Manager (set automatically in CDK)
- `TC_CLOUD_TOKEN`: Testcontainers Cloud API token (set automatically from secret)
- `AWS_REGION`: AWS region for Secrets Manager (defaults to us-east-1)

## Troubleshooting

### Tests Not Using Testcontainers Cloud
1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify secret exists: `aws secretsmanager get-secret-value --secret-id prod/tccloudcode`
3. Check logs for initialization messages

### Permission Denied
Ensure your IAM role/user has permission to read the secret:
```json
{
  "Effect": "Allow",
  "Action": "secretsmanager:GetSecretValue",
  "Resource": "arn:aws:secretsmanager:*:*:secret:prod/tccloudcode*"
}
```

### Container Startup Timeout
The Jest configuration sets a 2-minute timeout for tests. If containers are taking longer to start, you can increase it in `jest.config.js`.

## Benefits of Testcontainers Cloud

- **Consistent Environment**: Tests run in the same cloud environment regardless of local setup
- **No Local Docker Required**: Tests can run on machines without Docker installed
- **Parallel Execution**: Multiple test suites can run simultaneously without port conflicts
- **Resource Optimization**: Cloud handles container lifecycle and cleanup

## CDK Integration

The CDK stacks automatically grant Lambda functions and ECS tasks permission to read the Testcontainers Cloud secret. See `packages/infra/lib/compute-stack.ts` for implementation details.