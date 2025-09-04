#!/bin/bash

# Script to configure environment variables from Terraform outputs
# This should be run from the terraform directory

echo "🚀 ECOSYSTEMCL.AI - Environment Configuration Script"
echo "=================================================="

# Check if we're in terraform directory or can find it
if [ ! -f "outputs.tf" ]; then
    if [ -d "terraform" ]; then
        cd terraform
    else
        echo "❌ Error: Cannot find terraform directory with outputs.tf"
        echo "   Please run this script from the terraform directory or the project root"
        exit 1
    fi
fi

echo "📍 Working directory: $(pwd)"

# Check if terraform state exists
if [ ! -f "terraform.tfstate" ]; then
    echo "⚠️  Warning: No terraform.tfstate found"
    echo "   Make sure you have deployed your infrastructure with 'terraform apply'"
    echo ""
    echo "📋 Expected Terraform outputs:"
    echo "   - cognito_user_pool_id"
    echo "   - cognito_user_pool_client_id" 
    echo "   - api_gateway_url"
    echo "   - s3_bucket_name"
    echo "   - region"
    echo ""
    echo "💡 After running 'terraform apply', run this script again to generate .env configuration"
    exit 1
fi

echo "✅ Terraform state found, extracting outputs..."

# Get terraform outputs
USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null)
USER_POOL_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id 2>/dev/null)
API_GATEWAY_URL=$(terraform output -raw api_gateway_url 2>/dev/null)
S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null)
REGION=$(terraform output -raw region 2>/dev/null)

# Check if we got the required outputs
if [ -z "$USER_POOL_ID" ] || [ -z "$USER_POOL_CLIENT_ID" ]; then
    echo "❌ Error: Missing required Cognito outputs from Terraform"
    echo "   Ensure your terraform configuration includes the auth module outputs"
    exit 1
fi

# Generate the identity pool ID (this needs to be created if missing from outputs)
if [ -z "$IDENTITY_POOL_ID" ]; then
    echo "⚠️  Note: Identity Pool ID not found in outputs. You may need to add this to your Terraform configuration."
    IDENTITY_POOL_ID="${REGION}:00000000-0000-0000-0000-000000000000"
fi

# Create .env.local file for Next.js
ENV_FILE="../packages/web/.env.local"
echo "📝 Creating environment configuration: $ENV_FILE"

cat > "$ENV_FILE" << EOF
# AWS Configuration from Terraform
# Generated on $(date)

# Cognito Configuration
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_IDENTITY_POOL_ID=$IDENTITY_POOL_ID

# API Gateway
NEXT_PUBLIC_API_GATEWAY_URL=$API_GATEWAY_URL

# S3 Storage
NEXT_PUBLIC_S3_BUCKET_NAME=$S3_BUCKET_NAME

# AWS Region
NEXT_PUBLIC_AWS_REGION=$REGION
EOF

echo "✅ Environment configuration created successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "   User Pool ID: $USER_POOL_ID"
echo "   Client ID: $USER_POOL_CLIENT_ID"
echo "   Region: $REGION"
echo "   API Gateway: $API_GATEWAY_URL"
echo "   S3 Bucket: $S3_BUCKET_NAME"
echo ""
echo "🔧 Next Steps:"
echo "   1. Review the generated .env.local file"
echo "   2. Build and test your Next.js application"
echo "   3. Verify authentication works with the Cognito configuration"
echo ""
echo "🚀 Ready to deploy! Your app now uses Terraform-managed infrastructure."