# ECOSYSTEMCL.AI Complete Developer Setup Guide

## 🎯 Overview

This guide provides step-by-step instructions for developers to set up the ECOSYSTEMCL.AI multi-agent development platform locally and deploy to AWS. It leverages existing AWS infrastructure and environment variables to streamline the setup process.

## 📋 Prerequisites

### Required Software
- **Node.js** >= 18.0.0 (LTS recommended)
- **pnpm** >= 8.0.0 (package manager)
- **Git** >= 2.0.0
- **AWS CLI** >= 2.0.0
- **Docker** >= 20.0.0 (for local testing)
- **Terraform** >= 1.0.0 (for infrastructure)

### Required Accounts
- **AWS Account** with admin access
- **GitHub Account** (for repository access)
- **OpenAI API Account** (for AI models)
- **Anthropic API Account** (for Claude models)

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone and install
git clone https://github.com/projectecosystemapp/ecosystemcl.ai.git
cd ecosystemcl.ai
pnpm install

# 2. Configure AWS
aws configure  # Enter your AWS credentials

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Start development
pnpm dev
```

## 📁 Project Structure

```
forge-standalone/
├── packages/
│   ├── cli/           # Command-line interface
│   ├── web/           # Next.js web interface  
│   └── worker/        # Background job processor
├── terraform/         # AWS infrastructure
├── aws/              # CloudFormation templates
├── scripts/          # Setup and deployment scripts
└── docs/             # Documentation
```

## 🔧 Detailed Setup Process

### Step 1: Repository Setup

```bash
# Clone the repository
git clone https://github.com/projectecosystemapp/ecosystemcl.ai.git
cd ecosystemcl.ai

# Install dependencies for all packages
pnpm install

# Verify installation
pnpm --filter cli build
pnpm --filter web build
pnpm --filter worker build
```

### Step 2: AWS Configuration

#### Configure AWS CLI
```bash
# Install AWS CLI (if not already installed)
# macOS: brew install awscli
# Windows: Download from AWS website
# Linux: sudo apt install awscli

# Configure your credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]  
# Default region name: us-west-2
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

#### Set Up AWS Parameters (Leveraging Existing Infrastructure)

The project includes a script to discover and configure existing AWS resources:

```bash
# Run the AWS parameter setup script
chmod +x scripts/setup-aws-parameters.sh
./scripts/setup-aws-parameters.sh

# This script will:
# - Discover existing Cognito pools
# - Find DynamoDB tables
# - Locate S3 buckets
# - Configure SQS queues
# - Set up ECR repositories
# - Create SSM parameters
```

#### Manual Parameter Configuration

After running the script, set these secure parameters manually:

```bash
# AI Model API Keys
aws ssm put-parameter \
  --name /ecosystemcl/openai/api_key \
  --value 'your_openai_api_key' \
  --type SecureString \
  --region us-west-2

aws ssm put-parameter \
  --name /ecosystemcl/anthropic/api_key \
  --value 'your_anthropic_api_key' \
  --type SecureString \
  --region us-west-2

# GitHub Integration (optional)
aws ssm put-parameter \
  --name /ecosystemcl/github/token \
  --value 'your_github_personal_access_token' \
  --type SecureString \
  --region us-west-2

# JWT Secret for authentication
aws ssm put-parameter \
  --name /ecosystemcl/jwt/secret \
  --value 'your_jwt_secret_here' \
  --type SecureString \
  --region us-west-2
```

### Step 3: Environment Variables

#### Root Environment (.env)
```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

Add these values to your `.env`:
```bash
# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# API Keys for AI Models
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Database URL (will be configured with Terraform)
DATABASE_URL=postgresql://user:password@localhost:5432/ecosystemcl

# Redis Configuration
REDIS_URL=redis://localhost:6379

# GitHub Configuration (optional)
GITHUB_TOKEN=your-github-token
GITHUB_CLIENT_ID=your-github-oauth-app-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-secret

# JWT Secret
JWT_SECRET=your-jwt-secret-here
```

#### Web Package Environment (packages/web/.env.local)
```bash
# Navigate to web package
cd packages/web

# Copy environment template
cp .env.example .env.local

# Edit with your specific values
nano .env.local
```

### Step 4: Infrastructure Deployment

#### Option A: Using Terraform (Recommended)

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file=environments/dev.tfvars

# Deploy infrastructure  
terraform apply -var-file=environments/dev.tfvars

# Get outputs for configuration
terraform output

# Example output:
# cognito_user_pool_id = "us-west-2_ABC123DEF"
# cognito_user_pool_client_id = "1a2b3c4d5e6f7g8h9i0j"
# api_gateway_url = "https://abc123.execute-api.us-west-2.amazonaws.com/dev"
# s3_bucket_name = "ecosystemcl-dev-storage-abc123"
```

#### Option B: Using CloudFormation

```bash
# Deploy using the provided script
cd aws
chmod +x deploy.sh
./deploy.sh dev

# Monitor deployment
aws cloudformation describe-stacks --stack-name ecosystemcl-dev
```

### Step 5: Configure Web Application

Update `packages/web/src/config.ts` with your Terraform outputs:

```typescript
const terraformOutputs = {
  region: "us-west-2",
  cognito_user_pool_id: "us-west-2_ABC123DEF",        // From terraform output
  cognito_user_pool_client_id: "1a2b3c4d5e6f7g8h9i0j", // From terraform output
  api_gateway_url: "https://abc123.execute-api.us-west-2.amazonaws.com/dev", // From terraform output
  s3_bucket_name: "ecosystemcl-dev-storage-abc123",    // From terraform output
};
```

### Step 6: Database Setup

#### Local Development (PostgreSQL)
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql

# Create database
createdb ecosystemcl

# Update your .env with local database URL
DATABASE_URL=postgresql://username:password@localhost:5432/ecosystemcl
```

#### Production (AWS RDS)
The Terraform configuration creates an RDS instance. Update your environment with the RDS endpoint from Terraform outputs.

### Step 7: Start Development

```bash
# Start all services in development mode
pnpm dev

# This starts:
# - Web interface at http://localhost:3000
# - API services
# - Worker processes
```

#### Start Individual Services

```bash
# Web interface only
pnpm --filter web dev

# CLI development
pnpm --filter cli dev

# Worker services
pnpm --filter worker dev
```

## 🧪 Testing the Setup

### Verify CLI
```bash
# Test CLI installation
./packages/cli/bin/ecosystemcli --version

# Test authentication
./packages/cli/bin/ecosystemcli auth login

# Create a test plan
./packages/cli/bin/ecosystemcli plan "Create a simple React component"
```

### Verify Web Interface
1. Open http://localhost:3000
2. Click "Sign Up" to create an account
3. Verify authentication flow works
4. Test dashboard functionality

### Verify API Integration
```bash
# Test API connectivity
curl -X GET "https://your-api-gateway-url/dev/health"

# Test with authentication
curl -X POST "https://your-api-gateway-url/dev/forge" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, test"}'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check Cognito configuration
aws cognito-idp list-user-pools --max-results 10

# Verify environment variables
echo $AWS_REGION
echo $OPENAI_API_KEY
```

#### 2. Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules packages/*/node_modules
pnpm install

# Clear build cache
rm -rf packages/*/.next packages/*/.turbo
pnpm build
```

#### 3. Database Connection Issues
```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check database permissions
psql $DATABASE_URL -c "\\dt"
```

#### 4. AWS Resource Access
```bash
# Check IAM permissions
aws iam get-user

# Verify SSM parameters
aws ssm get-parameters-by-path --path "/ecosystemcl/" --recursive

# Test S3 access
aws s3 ls s3://your-bucket-name
```

### Debug Mode

Enable debug logging:
```bash
# Set debug environment
export DEBUG=ecosystemcl:*
export LOG_LEVEL=debug

# Run with verbose logging
pnpm dev --verbose
```

### Health Checks

```bash
# Check all services
curl http://localhost:3000/api/health

# Check specific components
curl http://localhost:3000/api/health/database
curl http://localhost:3000/api/health/redis
curl http://localhost:3000/api/health/aws
```

## 📊 Development Workflow

### Daily Development
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
pnpm install

# Start development servers
pnpm dev

# Run tests
pnpm test

# Check code quality
pnpm lint
pnpm type-check
```

### Testing Changes
```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Test CLI functionality
./packages/cli/bin/ecosystemcli plan "Test prompt"

# Test web interface manually
open http://localhost:3000
```

### Deployment Pipeline
```bash
# Run full test suite
pnpm test:all

# Build all packages
pnpm build

# Deploy to staging
terraform apply -var-file=environments/staging.tfvars

# Deploy to production
terraform apply -var-file=environments/prod.tfvars
```

## 🌐 Production Deployment

### Staging Environment
```bash
# Deploy to staging
cd terraform
terraform workspace select staging
terraform apply -var-file=environments/staging.tfvars

# Test staging deployment
curl https://staging-api.ecosystemcl.ai/health
```

### Production Environment
```bash
# Deploy to production
cd terraform
terraform workspace select production
terraform apply -var-file=environments/prod.tfvars

# Verify production deployment
curl https://api.ecosystemcl.ai/health
```

## 📈 Monitoring and Observability

### AWS CloudWatch
- **Logs**: All application logs are sent to CloudWatch
- **Metrics**: Custom metrics for job processing
- **Alarms**: Automated alerts for failures

### Application Metrics
```bash
# View current metrics
aws cloudwatch get-metric-statistics \
  --namespace "ECOSYSTEMCL" \
  --metric-name "JobsProcessed" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Performance Monitoring
- **Response Times**: API gateway metrics
- **Error Rates**: Application error tracking
- **Resource Usage**: ECS task metrics

## 🔒 Security Best Practices

### API Keys and Secrets
- Store in AWS Systems Manager Parameter Store
- Use IAM roles instead of access keys where possible
- Rotate secrets regularly
- Never commit secrets to git

### Network Security
- Use VPC with private subnets
- Enable VPC Flow Logs
- Configure Security Groups properly
- Use WAF for API protection

### Authentication
- Implement proper JWT validation
- Use Cognito for user management
- Enable MFA for admin accounts
- Regular security audits

## 📚 Additional Resources

### Documentation
- [Architecture Overview](./ARCHITECTURE.md)
- [Production Guide](./PRODUCTION_GUIDE.md)
- [Agent Configuration](./AGENTS.md)
- [API Documentation](./docs/api.md)

### External References
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)

### Community
- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Community questions and answers
- **Discord**: Real-time chat with other developers

## 💰 Cost Estimation

### Development Environment
- **AWS Free Tier**: $0/month (first 12 months)
- **Cognito**: $0-5/month (50,000 MAU free)
- **DynamoDB**: $0-10/month (25GB free)
- **Lambda**: $0-5/month (1M requests free)
- **S3**: $0-2/month (5GB free)
- **Total**: $0-22/month

### Production Environment
- **ECS Fargate**: $50-200/month
- **RDS**: $30-100/month
- **ElastiCache**: $20-50/month
- **API Gateway**: $10-30/month
- **CloudWatch**: $5-20/month
- **Total**: $115-400/month

### Cost Optimization Tips
- Use spot instances for non-critical workloads
- Set up billing alerts
- Regular cost review and optimization
- Implement auto-scaling policies

## ✅ Success Checklist

- [ ] Repository cloned and dependencies installed
- [ ] AWS CLI configured with valid credentials
- [ ] Environment variables configured
- [ ] Infrastructure deployed via Terraform
- [ ] Web application running locally
- [ ] CLI tool functional
- [ ] Authentication working
- [ ] API integration tested
- [ ] Database connectivity verified
- [ ] Monitoring and logging configured

## 🆘 Getting Help

### If you encounter issues:

1. **Check this guide** - Review the troubleshooting section
2. **Search existing issues** - Check GitHub issues for similar problems
3. **Enable debug logging** - Set `DEBUG=ecosystemcl:*` for verbose output
4. **Verify AWS resources** - Ensure all infrastructure is deployed correctly
5. **Check service status** - Verify all dependencies are running
6. **Create an issue** - Provide detailed error messages and steps to reproduce

### Support Channels
- **GitHub Issues**: Technical problems and bug reports
- **GitHub Discussions**: Questions and community help
- **Documentation**: In-depth guides and API references

---

**🎉 Congratulations!** You now have a fully functional ECOSYSTEMCL.AI development environment. Start building autonomous AI agent workflows and deploy them to production with confidence.

Remember to star ⭐ the repository if this guide helped you!
