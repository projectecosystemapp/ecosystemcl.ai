# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ECOSYSTEMCL.AI is a multi-agent AI development platform built as a pnpm monorepo with AWS Amplify Gen 2 backend. The platform orchestrates specialized AI agents for autonomous development tasks with persistent memory and parallel execution capabilities.

## Essential Commands

### Development
```bash
# Install dependencies (uses pnpm workspace)
pnpm install

# Run web app locally
pnpm dev  # or pnpm --filter web dev

# Build all packages
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint

# Run tests
pnpm test
pnpm test:coverage  # for coverage report
```

### Amplify Backend
```bash
# Generate Amplify client code
npx ampx generate --branch main

# Deploy backend (from packages/web)
cd packages/web && npx ampx sandbox  # for development
cd packages/web && npx ampx push      # for production
```

### Git Hooks
Pre-commit hooks are configured via Husky. They run automatically on commit.

## Architecture

### Monorepo Structure
- `packages/web/` - Next.js 15 frontend with Amplify UI components
- `packages/infra/` - AWS CDK infrastructure definitions
- `packages/web/amplify/` - Amplify Gen 2 backend configuration
  - `backend.ts` - Main backend definition with auth, data, and Lambda functions
  - `data/resource.ts` - GraphQL data schema with models for UserProfile, Workspace, Plan, ApiKey, and SubscriptionEvent
  - `functions/` - Lambda functions for forge-execute, post-confirmation, and whop-webhook

### Key Backend Components
1. **Authentication**: AWS Cognito with post-confirmation Lambda for user provisioning
2. **Data Layer**: DynamoDB via Amplify Data with owner-based authorization
3. **Subscription Management**: Whop.com webhook integration for payment processing
4. **Lambda Functions**:
   - `forge-execute`: Main task execution handler
   - `post-confirmation`: User provisioning after signup
   - `whop-webhook`: Handles subscription events from Whop

### Frontend Architecture
- Next.js 15 with App Router
- AWS Amplify UI components for auth
- Tailwind CSS v4 for styling
- Testing with Vitest and React Testing Library

## Working with the Codebase

### Data Models
The platform uses Amplify Data (GraphQL) with these main models:
- `UserProfile`: User subscription and credit management
- `Workspace`: Project organization containers
- `Plan`: Task execution tracking
- `ApiKey`: Encrypted API key storage
- `SubscriptionEvent`: Audit trail for subscription changes

### Authentication Flow
1. User signs up via Amplify Auth (Cognito)
2. Post-confirmation Lambda creates UserProfile
3. Whop webhook updates subscription status
4. Frontend checks auth state and subscription tier

### Testing Strategy
- Unit tests with Vitest for components and utilities
- Coverage threshold enforcement
- Test files alongside source files (`.test.ts` or `.spec.ts`)

## CI/CD Pipeline

GitHub Actions workflows handle:
- **CI**: Runs on PRs - lint, type-check, test for all packages
- **Deploy**: Production deployment via AWS Amplify
- **CodeQL**: Security analysis
- **Secrets Sync**: AWS Systems Manager parameter synchronization

## Important Context from Existing Documentation

### Multi-Agent System Design
The platform implements a Master Control Program (MCP) that orchestrates specialized agents. Each agent has specific capabilities and the system maintains both local (.eco_workspace) and cloud-based memory for context persistence.

### Local vs Cloud Execution
- **Cloud**: Production environment using AWS Lambda, SQS, and DynamoDB
- **Local**: CLI-driven development using git worktrees for parallel agent execution

### Community Agent Marketplace (Planned)
Future feature to allow users to create, share, and monetize custom agents with a registry in DynamoDB and storage in S3.

## Security Considerations
- API keys are encrypted before storage
- Whop webhooks are verified using secret signatures
- All data access uses owner-based authorization
- Sensitive operations require subscription tier checks