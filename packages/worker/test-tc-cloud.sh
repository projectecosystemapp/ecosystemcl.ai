#!/bin/bash

echo "Testing Testcontainers Cloud Integration"
echo "========================================="

# Set environment variables for testing
export AWS_REGION=${AWS_REGION:-us-east-1}
export TCCLOUD_SECRET_ARN="arn:aws:secretsmanager:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):secret:prod/tccloudcode"

echo "AWS Region: $AWS_REGION"
echo "Secret ARN: $TCCLOUD_SECRET_ARN"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

# Run the Testcontainers example test
echo ""
echo "Running Testcontainers Cloud test..."
npm run test:tc

echo ""
echo "Test complete!"