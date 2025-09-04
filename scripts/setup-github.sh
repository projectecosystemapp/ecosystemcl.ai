#!/bin/bash

# ECOSYSTEMCL.AI GitHub Repository Configuration Script
# Configures all necessary GitHub settings, secrets, and integrations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GITHUB_OWNER="projectecosystemapp"
GITHUB_REPO="ecosystemcl.ai"
AWS_REGION="us-west-2"

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check GitHub CLI
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI not found. Install with: brew install gh${NC}"
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found. Install with: brew install awscli${NC}"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq not found. Install with: brew install jq${NC}"
        exit 1
    fi
    
    # Check GitHub authentication
    if ! gh auth status &> /dev/null; then
        echo -e "${YELLOW}⚠️ Not authenticated with GitHub. Running: gh auth login${NC}"
        gh auth login
    fi
    
    echo -e "${GREEN}✅ Prerequisites satisfied${NC}"
}

# Configure repository settings
configure_repository() {
    echo "⚙️ Configuring repository settings..."
    
    # Enable required features
    gh api repos/$GITHUB_OWNER/$GITHUB_REPO \
        --method PATCH \
        --field has_issues=true \
        --field has_wiki=false \
        --field has_downloads=false \
        --field allow_squash_merge=true \
        --field allow_merge_commit=false \
        --field allow_rebase_merge=false \
        --field delete_branch_on_merge=true \
        --field allow_auto_merge=true \
        --field allow_update_branch=true
    
    echo -e "${GREEN}✅ Repository settings configured${NC}"
}

# Setup branch protection
setup_branch_protection() {
    echo "🛡️ Setting up branch protection rules..."
    
    # Main branch protection
    gh api repos/$GITHUB_OWNER/$GITHUB_REPO/branches/main/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["CodeQL Analysis","Build and Test","Validate CDK Infrastructure"]}' \
        --field enforce_admins=false \
        --field required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field required_linear_history=false \
        --field allow_force_pushes=false
    
    echo -e "${GREEN}✅ Branch protection configured${NC}"
}

# Create GitHub secrets
create_github_secrets() {
    echo "🔐 Creating GitHub secrets..."
    
    # Get AWS Account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # List of secrets to create
    declare -A SECRETS=(
        ["AWS_ACCOUNT_ID"]="$AWS_ACCOUNT_ID"
        ["AWS_REGION"]="$AWS_REGION"
    )
    
    for SECRET_NAME in "${!SECRETS[@]}"; do
        SECRET_VALUE="${SECRETS[$SECRET_NAME]}"
        
        if [ -n "$SECRET_VALUE" ]; then
            echo "Setting secret: $SECRET_NAME"
            echo "$SECRET_VALUE" | gh secret set "$SECRET_NAME" --repo="$GITHUB_OWNER/$GITHUB_REPO"
        fi
    done
    
    echo -e "${YELLOW}⚠️ Manual Action Required:${NC}"
    echo "1. Add WHOP_SECRET_API_KEY from Amplify Console"
    echo "2. Add COGNITO_USER_POOL_ID after CDK deployment"
    echo "3. Add AMPLIFY_APP_ID from Amplify Console"
    
    echo -e "${GREEN}✅ Basic secrets configured${NC}"
}

# Setup webhooks
setup_webhooks() {
    echo "🪝 Setting up webhooks..."
    
    # Check if Amplify webhook exists
    EXISTING_WEBHOOKS=$(gh api repos/$GITHUB_OWNER/$GITHUB_REPO/hooks --jq '.[].config.url' | grep -c "amplify" || true)
    
    if [ "$EXISTING_WEBHOOKS" -eq 0 ]; then
        echo -e "${YELLOW}⚠️ Amplify webhook not found. Add via Amplify Console${NC}"
    else
        echo -e "${GREEN}✅ Amplify webhook already configured${NC}"
    fi
}

# Enable GitHub Apps and integrations
enable_integrations() {
    echo "🔌 Enabling GitHub integrations..."
    
    # Enable Dependabot
    gh api repos/$GITHUB_OWNER/$GITHUB_REPO/vulnerability-alerts --method PUT
    
    # Create .github/dependabot.yml
    cat > .github/dependabot.yml <<EOF
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    
  - package-ecosystem: "npm"
    directory: "/packages/web"
    schedule:
      interval: "weekly"
    
  - package-ecosystem: "npm"
    directory: "/packages/worker"
    schedule:
      interval: "weekly"
    
  - package-ecosystem: "npm"
    directory: "/packages/infra"
    schedule:
      interval: "weekly"
    
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
EOF
    
    echo -e "${GREEN}✅ GitHub integrations enabled${NC}"
}

# Create issue templates
create_issue_templates() {
    echo "📝 Creating issue templates..."
    
    mkdir -p .github/ISSUE_TEMPLATE
    
    # Bug report template
    cat > .github/ISSUE_TEMPLATE/bug_report.md <<EOF
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug, needs-triage'
assignees: ''
---

## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- **Browser**: [e.g. Chrome 120]
- **OS**: [e.g. macOS 14.2]
- **Node Version**: [e.g. 20.10.0]
- **Package Version**: [e.g. 1.0.0]

## Additional Context
Add any other context, screenshots, or logs here.
EOF
    
    # Feature request template
    cat > .github/ISSUE_TEMPLATE/feature_request.md <<EOF
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: 'enhancement, needs-triage'
assignees: ''
---

## Feature Description
A clear and concise description of the feature.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How would you implement this feature?

## Alternatives Considered
What alternatives have you considered?

## Additional Context
Add any other context or screenshots here.
EOF
    
    echo -e "${GREEN}✅ Issue templates created${NC}"
}

# Create PR template
create_pr_template() {
    echo "📋 Creating PR template..."
    
    cat > .github/pull_request_template.md <<EOF
## Description
Brief description of changes in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass locally
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance benchmarks acceptable

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated if needed
- [ ] No new warnings introduced
- [ ] Dependent changes merged

## Related Issues
Closes #(issue number)

## Screenshots (if applicable)
Add screenshots to help explain your changes.
EOF
    
    echo -e "${GREEN}✅ PR template created${NC}"
}

# Main execution
main() {
    echo "🚀 ECOSYSTEMCL.AI GitHub Repository Configuration"
    echo "================================================="
    echo ""
    
    check_prerequisites
    configure_repository
    setup_branch_protection
    create_github_secrets
    setup_webhooks
    enable_integrations
    create_issue_templates
    create_pr_template
    
    echo ""
    echo -e "${GREEN}✅ GitHub repository configuration complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run the AWS OIDC setup workflow: gh workflow run aws-oidc-setup.yml"
    echo "2. Add remaining secrets from AWS/Amplify Console"
    echo "3. Run secrets sync workflow: gh workflow run secrets-sync.yml"
    echo "4. Commit and push the generated templates"
    echo "5. Trigger initial deployment: gh workflow run deploy.yml"
}

# Run main function
main "$@"
