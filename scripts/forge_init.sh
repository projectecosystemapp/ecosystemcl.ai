#!/bin/bash

# ==============================================================================
# ECOSYSTEMCL.AI Project Initializer
#
# This script sets up the local agent workspace (.forge_workspace) in the
# current directory, making it an ECOSYSTEMCL.AI-aware project. This workspace is
# the "local memory" for the AI agents, containing their configurations,
# prompts, logs, and artifacts.
# ==============================================================================

# --- Configuration ---
FORGE_DIR=".forge_workspace"
AGENTS_DIR="$FORGE_DIR/agents"
PROMPTS_DIR="$AGENTS_DIR/prompts"
LOGS_DIR="$FORGE_DIR/logs"
ARTIFACTS_DIR="$FORGE_DIR/artifacts"
CACHE_DIR="$FORGE_DIR/cache"
EMBEDDINGS_DIR="$FORGE_DIR/embeddings"
STATE_DIR="$FORGE_DIR/state"

# --- Helper for colored output ---
c_green=$(tput setaf 2)
c_yellow=$(tput setaf 3)
c_blue=$(tput setaf 4)
c_red=$(tput setaf 1)
c_cyan=$(tput setaf 6)
c_reset=$(tput sgr0)

echo "${c_blue}═══════════════════════════════════════════════════════════${c_reset}"
echo "${c_blue}       ECOSYSTEMCL.AI Local Agent Workspace Initializer${c_reset}"
echo "${c_blue}═══════════════════════════════════════════════════════════${c_reset}"
echo ""

# --- Check if workspace already exists ---
if [ -d "$FORGE_DIR" ]; then
  echo "${c_yellow}⚠️  Workspace '$FORGE_DIR' already exists.${c_reset}"
  echo -n "Would you like to reinitialize? This will preserve existing configs (y/n): "
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "${c_red}Initialization cancelled.${c_reset}"
    exit 1
  fi
  echo "${c_yellow}Preserving existing configurations...${c_reset}"
fi

# --- Create directory structure ---
echo "${c_cyan}📁 Creating directory structure...${c_reset}"
mkdir -p "$FORGE_DIR"
mkdir -p "$AGENTS_DIR"
mkdir -p "$PROMPTS_DIR"
mkdir -p "$LOGS_DIR"
mkdir -p "$ARTIFACTS_DIR"
mkdir -p "$CACHE_DIR"
mkdir -p "$EMBEDDINGS_DIR"
mkdir -p "$STATE_DIR"

# --- Create .gitignore for the workspace ---
echo "${c_cyan}🔒 Creating .gitignore to protect local files...${c_reset}"
cat << EOF > "$FORGE_DIR/.gitignore"
# Ignore all log files
logs/*
!logs/.gitkeep

# Ignore all generated artifacts
artifacts/*
!artifacts/.gitkeep

# Ignore all cache files
cache/*
!cache/.gitkeep

# Ignore embeddings (can be large)
embeddings/*
!embeddings/.gitkeep

# Ignore local state snapshots
state/*.snapshot
state/*.backup

# Ignore user-specific secrets
*.local.yml
*.secret
.env.local

# Ignore temporary files
*.tmp
*.swp
*.swo
*~

# Ignore API keys
api_keys.json
EOF

# --- Create workspace configuration ---
echo "${c_cyan}⚙️  Creating workspace configuration...${c_reset}"
cat << EOF > "$FORGE_DIR/config.yml"
# ECOSYSTEMCL.AI Workspace Configuration
# This file defines the local workspace settings for this project

version: "1.0.0"
project_name: "$(basename "$PWD")"
initialized_at: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Agent execution settings
execution:
  timeout: 900000  # 15 minutes default
  max_retries: 3
  parallel_agents: 4

# Memory settings
memory:
  cache_ttl: 86400  # 24 hours
  max_log_size: 104857600  # 100MB
  state_snapshots: 10  # Keep last 10 state snapshots

# Security settings
security:
  sandbox_mode: true
  allow_network: true
  allow_file_write: true
  restricted_paths:
    - "/etc"
    - "/sys"
    - "/proc"
    - "~/.ssh"

# Integration settings
integrations:
  github:
    enabled: true
    auto_commit: false
  supabase:
    sync_state: true
    sync_interval: 300  # 5 minutes
EOF

# --- Create default agent prompt files ---
echo "${c_cyan}📝 Generating system prompts for core agents...${c_reset}"

# Orchestrator Prompt
cat << 'EOF' > "$PROMPTS_DIR/orchestrator.md"
# The Orchestrator

You are an expert AI software architect and project manager known as **The Orchestrator**.

## Primary Function
Analyze high-level goals and decompose them into precise, logical, and efficient multi-step plans that can be executed by specialized agents.

## Available Agents
- **DatabaseArchitect**: Schema design, migrations, data modeling
- **CodeGenerator**: Implementation of features and components
- **CodeReviewer**: Security audits, code quality, best practices
- **SecurityAuditor**: Vulnerability scanning, compliance checks
- **TestWriter**: Unit, integration, and E2E test creation
- **DocumentationWriter**: API docs, README files, inline comments

## Decision Process

### 1. Goal Analysis
- Deeply understand the user's intent and success criteria
- Identify technical and business constraints
- Determine the scope and complexity

### 2. State Consultation
- Read the entire Workspace State to understand:
  - Project architecture and tech stack
  - Previous decisions and their rationale
  - Known issues and technical debt
  - Team conventions and standards

### 3. Agent Collaboration Simulation
- Mentally simulate a discussion between required agents
- Identify dependencies and potential conflicts
- Determine optimal execution order
- Plan for rollback scenarios

### 4. Plan Formulation
Output a structured plan with:
```json
{
  "steps": [
    {
      "id": "step-1",
      "agent": "DatabaseArchitect",
      "prompt": "Design schema for user authentication",
      "dependencies": [],
      "estimated_duration": 120,
      "rollback_strategy": "Drop created tables"
    }
  ],
  "consensus_points": ["After step 3", "Before deployment"],
  "success_criteria": ["All tests pass", "Security audit clean"]
}
```

### 5. State Updates
Propose updates to the Workspace State based on decisions made.

## Guardrails
- Never skip security considerations
- Always include testing steps
- Consider rollback for every change
- Document architectural decisions
EOF

# CodeGenerator Prompt
cat << 'EOF' > "$PROMPTS_DIR/code_generator.md"
# The Code Generator

You are an expert AI Code Generator specializing in writing clean, efficient, and production-ready code.

## Core Principles
1. **Correctness**: Code must work as specified
2. **Security**: Follow OWASP guidelines, never expose secrets
3. **Performance**: Optimize for the use case
4. **Maintainability**: Clear naming, proper structure
5. **Testability**: Design for easy testing

## Rules

### Workspace Compliance
- Strictly follow coding standards from Workspace State
- Use approved libraries and frameworks only
- Match existing code style and patterns
- Respect architectural decisions

### Code Quality
- Write self-documenting code
- Add comments only for complex logic
- Include proper error handling
- Implement logging with correlation IDs
- Use TypeScript/type hints when applicable

### Output Format
```typescript
// Complete, runnable code file
import { necessary } from 'dependencies';

export class Implementation {
  // Full implementation, no placeholders
}
```

## Security Checklist
- [ ] Input validation implemented
- [ ] SQL injection prevented
- [ ] XSS protection in place
- [ ] Authentication verified
- [ ] Authorization checked
- [ ] Secrets in environment variables
- [ ] Error messages don't leak info
EOF

# Security Auditor Prompt
cat << 'EOF' > "$PROMPTS_DIR/security_auditor.md"
# The Security Auditor

You are a senior security engineer performing autonomous security audits.

## Audit Framework

### 1. Vulnerability Classes (with CWE IDs)
- **Injection** (CWE-89, CWE-78): SQL, NoSQL, OS Command
- **Broken Authentication** (CWE-287): Session management, passwords
- **Sensitive Data Exposure** (CWE-200): Encryption, data leaks
- **XXE** (CWE-611): XML External Entity attacks
- **Broken Access Control** (CWE-285): Authorization flaws
- **Security Misconfiguration** (CWE-16): Default configs, verbose errors
- **XSS** (CWE-79): Reflected, Stored, DOM-based
- **Insecure Deserialization** (CWE-502): Object injection
- **Using Components with Known Vulnerabilities** (CWE-1035)
- **Insufficient Logging** (CWE-778): Audit trail gaps

### 2. Compliance Standards
- OWASP Top 10 2021
- CWE Top 25
- PCI DSS v4.0 (for payment systems)
- GDPR (for EU data)
- SOC 2 Type II

### 3. Output Format
Every finding must be documented as:
```yaml
finding:
  severity: CRITICAL|HIGH|MEDIUM|LOW
  cwe_id: CWE-XXX
  location: file:line
  description: Clear explanation
  impact: Business impact if exploited
  remediation: Specific fix instructions
  references: [OWASP guide, etc]
```

## Mandatory Checks
1. Lambda Function URLs are PROHIBITED
2. Secrets must use AWS Secrets Manager
3. All webhooks must verify signatures
4. User input must be validated
5. IAM roles must follow least privilege
6. Correlation IDs must be present
EOF

# Test Writer Prompt
cat << 'EOF' > "$PROMPTS_DIR/test_writer.md"
# The Test Writer

You are an expert test engineer specializing in comprehensive test coverage.

## Testing Philosophy
- Tests are documentation
- Tests prevent regressions
- Tests enable refactoring
- Tests validate requirements

## Test Types

### 1. Unit Tests
- Test individual functions/methods
- Mock all dependencies
- Cover edge cases
- Aim for 80%+ coverage

### 2. Integration Tests
- Test component interactions
- Use real dependencies when possible
- Verify data flow
- Test error propagation

### 3. E2E Tests
- Test user journeys
- Verify business requirements
- Test across system boundaries
- Include performance metrics

## Test Structure
```typescript
describe('Component/Feature', () => {
  describe('Scenario', () => {
    it('should behave correctly when...', () => {
      // Arrange
      const input = setupTestData();
      
      // Act
      const result = executeFunction(input);
      
      // Assert
      expect(result).toMatchExpectation();
    });
  });
});
```

## Security Test Requirements
- Command injection prevention
- Input validation
- Authentication/Authorization
- Rate limiting
- Error handling
- Resource limits
EOF

# --- Create agent configuration files ---
echo "${c_cyan}⚙️  Generating agent configurations...${c_reset}"

# Create configurations for each agent
agents=("orchestrator" "code_generator" "security_auditor" "test_writer" "database_architect" "code_reviewer")
models=("claude-3-opus-20240229" "gpt-4o" "claude-3-opus-20240229" "gpt-4o" "claude-3-sonnet-20240229" "claude-3-opus-20240229")
descriptions=(
  "Analyzes goals and creates multi-step execution plans"
  "Writes production-ready code following project standards"
  "Performs security audits and compliance checks"
  "Creates comprehensive test suites"
  "Designs database schemas and data models"
  "Reviews code for quality, security, and best practices"
)

for i in "${!agents[@]}"; do
  agent="${agents[$i]}"
  model="${models[$i]}"
  desc="${descriptions[$i]}"
  
  # Skip if config already exists (preserve user customizations)
  if [ -f "$AGENTS_DIR/${agent}.yml" ]; then
    echo "  Preserving existing config for ${agent}"
    continue
  fi
  
  cat << EOF > "$AGENTS_DIR/${agent}.yml"
# ${agent}.yml - Generated by forge_init.sh
name: "${agent}"
description: "${desc}"
model_id: "${model}"
prompt_file: "prompts/${agent}.md"
capabilities:
  - read_file
  - write_file
  - search_codebase
  - run_tests
temperature: 0.7
max_tokens: 8192
timeout: 600000
retry_on_error: true
EOF
done

# --- Create default Gemini agent ---
echo "${c_cyan}--> Generating default configuration for Google Gemini...${c_reset}"
cat << EOF > "$AGENTS_DIR/gemini_generator.yml"
# gemini_generator.yml - A powerful free-tier agent.
# Uses the Google Gemini model family.
# Requires connecting your Google account with 'forge connect google'.
name: "GeminiCodeGenerator"
description: "Writes code using the Google Gemini 1.5 Pro model."
provider: "google"
model_id: "gemini-1.5-pro-latest"
auth_method: "oauth" # System knows to use the connected Google account
prompt_file: "prompts/code_generator.md" # Can reuse the same prompt template
EOF

# --- Create project state file ---
echo "${c_cyan}💾 Initializing project state...${c_reset}"
cat << EOF > "$STATE_DIR/current.json"
{
  "version": "1.0.0",
  "initialized_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "project": {
    "name": "$(basename "$PWD")",
    "path": "$PWD",
    "type": "unknown",
    "languages": [],
    "frameworks": []
  },
  "architecture": {
    "patterns": [],
    "principles": [],
    "constraints": []
  },
  "standards": {
    "code_style": {},
    "testing": {
      "coverage_threshold": 80,
      "required_types": ["unit", "integration"]
    },
    "security": {
      "owasp_compliance": true,
      "secrets_management": "environment_variables"
    }
  },
  "history": [],
  "decisions": [],
  "learned_patterns": []
}
EOF

# --- Create session tracker ---
echo "${c_cyan}📊 Setting up session tracking...${c_reset}"
cat << EOF > "$LOGS_DIR/sessions.json"
{
  "sessions": [],
  "active_session": null,
  "total_executions": 0,
  "last_execution": null
}
EOF

# --- Create placeholder files ---
touch "$LOGS_DIR/.gitkeep"
touch "$ARTIFACTS_DIR/.gitkeep"
touch "$CACHE_DIR/.gitkeep"
touch "$EMBEDDINGS_DIR/.gitkeep"

# --- Create README for the workspace ---
cat << EOF > "$FORGE_DIR/README.md"
# ECOSYSTEMCL.AI Local Workspace

This directory contains the local configuration and state for the ECOSYSTEMCL.AI multi-agent system.

## Directory Structure

- **agents/**: Agent configurations and system prompts
- **logs/**: Execution logs and audit trails
- **artifacts/**: Generated code and documents
- **cache/**: Temporary cache files
- **embeddings/**: Vector embeddings of the codebase
- **state/**: Project state and decision history

## Customization

You can customize agent behavior by editing:
1. Agent configs in \`agents/*.yml\`
2. System prompts in \`agents/prompts/*.md\`
3. Workspace settings in \`config.yml\`

## Cloud Sync

This local workspace syncs with the cloud-based Workspace State in Supabase, creating a two-tier memory system:
- **Cloud**: Strategic decisions, shared knowledge
- **Local**: Tactical execution, machine-specific settings

## Security

Sensitive files are excluded from version control via \`.gitignore\`.
Never commit API keys or secrets to this directory.
EOF

# --- Final success message ---
echo ""
echo "${c_green}═══════════════════════════════════════════════════════════${c_reset}"
echo "${c_green}✅ ECOSYSTEMCL.AI Local Workspace successfully initialized!${c_reset}"
echo "${c_green}═══════════════════════════════════════════════════════════${c_reset}"
echo ""
echo "${c_cyan}📁 Created in:${c_reset} $PWD/$FORGE_DIR"
echo ""
echo "${c_yellow}Next steps:${c_reset}"
echo "  1. Review and customize agent configs in ${c_cyan}$AGENTS_DIR/${c_reset}"
echo "  2. Modify system prompts in ${c_cyan}$PROMPTS_DIR/${c_reset}"
echo "  3. Connect to cloud workspace: ${c_cyan}forge connect${c_reset}"
echo "  4. Run your first plan: ${c_cyan}forge plan \"Your goal here\"${c_reset}"
echo ""
echo "${c_blue}The agents now have their local memory initialized.${c_reset}"
echo "${c_blue}They're ready to learn and evolve with your project!${c_reset}"
