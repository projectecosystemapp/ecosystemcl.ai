#!/bin/bash

# ECOSYSTEMCL.AI Database Stack Deployment Script
# Execute from: /Users/ryleebenson/Desktop/forge-standalone/packages/infra

set -e  # Exit on error
set -o pipefail  # Pipe failures cause script exit

# Configuration
REGION="us-west-2"
STACK_NAME="EcosystemCL-Database"
COGNITO_USER_POOL_ID="us-west-2_F5eg8nTgU"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== ECOSYSTEMCL.AI Database Stack Deployment ===${NC}"
echo "Region: $REGION"
echo "Stack: $STACK_NAME"
echo "Cognito Pool: $COGNITO_USER_POOL_ID"
echo ""

# Step 1: Delete existing failed stack
echo -e "${YELLOW}Step 1: Deleting failed stack (if exists)...${NC}"
aws cloudformation delete-stack \
    --stack-name $STACK_NAME \
    --region $REGION 2>/dev/null || echo "Stack not found or already deleted"

# Wait for deletion (max 5 minutes)
echo "Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete \
    --stack-name $STACK_NAME \
    --region $REGION \
    --no-cli-pager 2>/dev/null || echo "Stack deletion confirmed"

echo -e "${GREEN}✓ Stack deletion complete${NC}"
echo ""

# Step 2: Export environment variable
echo -e "${YELLOW}Step 2: Setting environment variables...${NC}"
export COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
echo -e "${GREEN}✓ COGNITO_USER_POOL_ID set${NC}"
echo ""

# Step 3: Build TypeScript
echo -e "${YELLOW}Step 3: Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 4: Synthesize CDK
echo -e "${YELLOW}Step 4: Synthesizing CloudFormation template...${NC}"
npx cdk synth EcosystemCL-DatabaseStack --quiet
echo -e "${GREEN}✓ Synthesis complete${NC}"
echo ""

# Step 5: Deploy Database Stack
echo -e "${YELLOW}Step 5: Deploying Database Stack...${NC}"
echo "This will create:"
echo "  • ElastiCache Redis cluster (cache.t3.micro)"
echo "  • OpenSearch domain (t3.small.search)"
echo "  • VPC with isolated subnets"
echo "  • Import existing DynamoDB tables and Cognito User Pool"
echo ""

npx cdk deploy EcosystemCL-DatabaseStack \
    --require-approval never \
    --context cognito-user-pool-id=$COGNITO_USER_POOL_ID

# Step 6: Verify deployment
echo ""
echo -e "${YELLOW}Step 6: Verifying deployment...${NC}"

# Check stack status
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name EcosystemCL-Database \
    --query 'Stacks[0].StackStatus' \
    --output text \
    --region $REGION)

if [ "$STACK_STATUS" == "CREATE_COMPLETE" ]; then
    echo -e "${GREEN}✓ Stack deployment successful!${NC}"
    
    # Get outputs
    echo ""
    echo -e "${GREEN}Stack Outputs:${NC}"
    aws cloudformation describe-stacks \
        --stack-name EcosystemCL-Database \
        --query 'Stacks[0].Outputs[*].[OutputKey, OutputValue]' \
        --output table \
        --region $REGION
        
    # Check ElastiCache status
    echo ""
    echo -e "${GREEN}ElastiCache Status:${NC}"
    aws elasticache describe-cache-clusters \
        --cache-cluster-id ecosystemcl-cache \
        --query 'CacheClusters[0].CacheClusterStatus' \
        --output text \
        --region $REGION
        
    # Check OpenSearch status (will be "Processing" initially)
    echo ""
    echo -e "${GREEN}OpenSearch Status:${NC}"
    aws opensearch describe-domain \
        --domain-name ecosystemcl-vectors \
        --query 'DomainStatus.Processing' \
        --output text \
        --region $REGION || echo "OpenSearch domain is still being created (10-15 minutes)"
        
else
    echo -e "${RED}✗ Stack deployment failed with status: $STACK_STATUS${NC}"
    echo "Check CloudFormation console for error details"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Next Steps:"
echo "1. Monitor OpenSearch creation (10-15 minutes): aws opensearch describe-domain --domain-name ecosystemcl-vectors"
echo "2. Update API and Compute stacks if needed"
echo "3. Begin populating Helix patterns database"
