#!/bin/bash

# AWS Systems Manager Parameter Store Configuration
# Creates all required parameters for ECOSYSTEMCL.AI platform

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-west-2}"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo "🔧 Configuring AWS Systems Manager Parameters"
echo "============================================="
echo "Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# Function to create or update parameter
create_parameter() {
    local name=$1
    local value=$2
    local type=${3:-String}
    local description=${4:-""}
    
    if aws ssm put-parameter \
        --name "$name" \
        --value "$value" \
        --type "$type" \
        --description "$description" \
        --overwrite \
        --region "$AWS_REGION" 2>/dev/null; then
        echo "✅ Created/Updated: $name"
    else
        echo "⚠️ Failed to create: $name"
    fi
}

# GitHub Configuration
echo "📦 GitHub Configuration..."
create_parameter "/ecosystemcl/github/repo" "projectecosystemapp/ecosystemcl.ai" "String" "GitHub repository"
create_parameter "/ecosystemcl/github/branch" "main" "String" "Default branch"
create_parameter "/ecosystemcl/github/owner" "projectecosystemapp" "String" "GitHub organization"

# Environment Configuration
echo "🌍 Environment Configuration..."
create_parameter "/ecosystemcl/environment" "$ENVIRONMENT" "String" "Deployment environment"
create_parameter "/ecosystemcl/region" "$AWS_REGION" "String" "AWS region"

# Get existing AWS resource IDs
echo "🔍 Discovering AWS Resources..."

# Cognito User Pool
COGNITO_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 \
    --query "UserPools[?Name=='ecosystemcl-auth'].Id | [0]" \
    --output text --region "$AWS_REGION" 2>/dev/null || echo "")

if [ -n "$COGNITO_POOL_ID" ]; then
    create_parameter "/ecosystemcl/cognito/user_pool_id" "$COGNITO_POOL_ID" "String" "Cognito User Pool ID"
    
    # Get Client ID
    CLIENT_ID=$(aws cognito-idp list-user-pool-clients \
        --user-pool-id "$COGNITO_POOL_ID" \
        --query "UserPoolClients[0].ClientId" \
        --output text --region "$AWS_REGION" 2>/dev/null || echo "")
    
    if [ -n "$CLIENT_ID" ]; then
        create_parameter "/ecosystemcl/cognito/client_id" "$CLIENT_ID" "String" "Cognito Client ID"
    fi
fi

# DynamoDB Tables
echo "📊 DynamoDB Configuration..."
PATTERN_TABLE=$(aws dynamodb list-tables --query "TableNames[?contains(@,'Pattern')] | [0]" --output text --region "$AWS_REGION" 2>/dev/null || echo "HelixPatternEntries")
WORKSPACE_TABLE=$(aws dynamodb list-tables --query "TableNames[?contains(@,'Workspace')] | [0]" --output text --region "$AWS_REGION" 2>/dev/null || echo "WorkspaceStates")

create_parameter "/ecosystemcl/dynamodb/pattern_table" "$PATTERN_TABLE" "String" "Pattern table name"
create_parameter "/ecosystemcl/dynamodb/workspace_table" "$WORKSPACE_TABLE" "String" "Workspace table name"

# S3 Buckets
echo "🪣 S3 Configuration..."
ARTIFACTS_BUCKET=$(aws s3 ls | grep ecosystemcl | grep artifacts | awk '{print $3}' | head -1 || echo "")
if [ -n "$ARTIFACTS_BUCKET" ]; then
    create_parameter "/ecosystemcl/s3/artifacts_bucket" "$ARTIFACTS_BUCKET" "String" "Artifacts S3 bucket"
fi

# SQS Queues
echo "📬 SQS Configuration..."
TASK_QUEUE=$(aws sqs list-queues --queue-name-prefix "ecosystemcl-task" \
    --query "QueueUrls[0]" --output text --region "$AWS_REGION" 2>/dev/null || echo "")
if [ -n "$TASK_QUEUE" ]; then
    create_parameter "/ecosystemcl/sqs/task_queue_url" "$TASK_QUEUE" "String" "Task queue URL"
fi

# ECR Repository
echo "🐳 ECR Configuration..."
ECR_URI=$(aws ecr describe-repositories --repository-names ecosystemcl-worker \
    --query "repositories[0].repositoryUri" --output text --region "$AWS_REGION" 2>/dev/null || echo "")
if [ -n "$ECR_URI" ]; then
    create_parameter "/ecosystemcl/ecr/repository_uri" "$ECR_URI" "String" "ECR repository URI"
fi

# OpenSearch
echo "🔍 OpenSearch Configuration..."
OPENSEARCH_ENDPOINT=$(aws opensearchserverless list-collections \
    --query "collectionSummaries[?name=='ecosystemcl-helix'].endpoint | [0]" \
    --output text --region "$AWS_REGION" 2>/dev/null || echo "")
if [ -n "$OPENSEARCH_ENDPOINT" ]; then
    create_parameter "/ecosystemcl/opensearch/endpoint" "$OPENSEARCH_ENDPOINT" "String" "OpenSearch endpoint"
fi

# Amplify
echo "📱 Amplify Configuration..."
AMPLIFY_APP_ID=$(aws amplify list-apps --query "apps[?name=='ecosystemcl'].appId | [0]" \
    --output text --region "$AWS_REGION" 2>/dev/null || echo "")
if [ -n "$AMPLIFY_APP_ID" ]; then
    create_parameter "/ecosystemcl/amplify/app_id" "$AMPLIFY_APP_ID" "String" "Amplify App ID"
fi

# Secure Parameters (require manual input)
echo ""
echo "🔐 Secure Parameters (Manual Action Required):"
echo "=============================================="
echo ""
echo "The following parameters need to be set manually with your actual values:"
echo ""
echo "aws ssm put-parameter \\"
echo "  --name /ecosystemcl/whop/api_key \\"
echo "  --value 'YOUR_WHOP_API_KEY' \\"
echo "  --type SecureString \\"
echo "  --region $AWS_REGION"
echo ""
echo "aws ssm put-parameter \\"
echo "  --name /ecosystemcl/whop/webhook_secret \\"
echo "  --value 'YOUR_WHOP_WEBHOOK_SECRET' \\"
echo "  --type SecureString \\"
echo "  --region $AWS_REGION"
echo ""
echo "aws ssm put-parameter \\"
echo "  --name /ecosystemcl/jwt/secret \\"
echo "  --value 'YOUR_JWT_SECRET' \\"
echo "  --type SecureString \\"
echo "  --region $AWS_REGION"
echo ""

# Verify parameters
echo "📋 Parameter Summary:"
echo "====================="
aws ssm describe-parameters \
    --parameter-filters "Key=Name,Option=BeginsWith,Values=/ecosystemcl/" \
    --query "Parameters[].Name" \
    --output table \
    --region "$AWS_REGION"

echo ""
echo "✅ AWS Systems Manager configuration complete!"
echo ""
echo "Next steps:"
echo "1. Set the secure parameters listed above"
echo "2. Run the GitHub secrets sync workflow to propagate to GitHub"
echo "3. Verify all parameters are correctly set"
