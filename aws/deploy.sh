#!/bin/bash

# ECOSYSTEMCL.AI AWS Deployment Script
set -e

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="forge-worker"
STACK_NAME="${ENVIRONMENT}-ecosystemclai-infrastructure"

echo "🚀 Deploying ECOSYSTEMCL.AI to AWS (Environment: $ENVIRONMENT)"

# Create ECR repository
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Build and push Docker image
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

cd ../packages/worker
docker build -f Dockerfile.production -t $ECR_REPOSITORY:latest .
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

cd ../../aws

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file cloudformation-template.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides Environment=$ENVIRONMENT DatabasePassword=$(openssl rand -base64 32) \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION

echo "✅ Deployment complete!"
