# ECOSYSTEMCL.AI CLI

**An Autonomous Multi-Agent Orchestrator for High-Performance Engineering Teams**

ECOSYSTEMCL.AI is a command-line tool that acts as a foreman for a team of specialized AI agents, enabling them to perform complex, long-running software engineering tasks with full autonomy and traceability. It leverages Git-native parallelization and a resilient, observable architecture to automate codebase audits, feature implementation, and legacy modernization.

## Core Concepts

**High-Autonomy Orchestration**: Give ECOSYSTEMCL.AI a high-level objective, and it decomposes the task, dispatches the right agents, and integrates their work into a single, clean pull request.

**Parallel Execution Engine**: ECOSYSTEMCL.AI uses `git worktree` to create isolated environments for each agent, allowing multiple specialists to work on the codebase simultaneously without conflict.

**Resilient & Observable**: With real-time structured logging, you can see every step of an agent's thought process. Session checkpointing and resumability mean that even long-running tasks can survive timeouts and interruptions.

**Extensible Agent System**: Define and customize your own team of specialist agents using simple YAML configuration files.

## Features

- **`forge audit`**: Run a fully autonomous, parallel codebase audit. Agents can fix linting errors, perform deep logic analysis, scan for security vulnerabilities, and check for migration debt simultaneously.

- **`forge task`**: Execute a feature development task using a Spec-Driven workflow. The orchestrator coordinates planning, TDD implementation, and code review agents.

- **`forge migrate`**: A specialized pipeline for modernizing legacy code, such as migrating Lambda Function URLs to AppSync.

- **`forge sessions`**: A dedicated command to view, manage, and resume previous audit or task sessions.

## Getting Started

### Installation

```bash
# Clone the repository
git clone <your-new-repo-url>/forge.git
cd forge

# Install dependencies
npm install

# Make the CLI globally available
npm link
```

You can now run `forge` from any directory.

## Usage

### Run a full, autonomous audit

```bash
forge audit --mode=autonomous --fix-lint --analyze-logic --security-scan
```

### Implement a new feature

```bash
forge task "Implement a new GraphQL mutation to update a user's profile picture"
```

### List and manage sessions

```bash
forge sessions --list
forge sessions --details <session-id>
```

## Agent Configuration

Specialist agents are defined in YAML files within the `/agents` directory. You can edit these prompts or add new agents to customize FORGE's capabilities. Each agent's configuration defines its persona, objectives, available tools, and critical guardrails.

### Example Agent Configuration

```yaml
name: critical-code-reviewer
description: Security-focused code review with structured, auditable logging
system_prompt: |
  You are a senior security engineer performing autonomous code review.
  Your analysis must be transparent, traceable, and defensible.
objectives:
  - Identify vulnerabilities with specific CWE/CVE references
  - Provide actionable remediation steps
  - Ensure architectural compliance
output_format: structured_log_blocks
```

## Architecture

FORGE operates on three core principles:

1. **Git-Native Operations**: All work happens in git worktrees, ensuring clean isolation and easy rollback
2. **Structured Logging**: Every agent action follows the LOG BLOCK format with Thinking, Reasoning, Reference, Action, and Result
3. **Resilient Execution**: Session checkpointing allows resumption from any failure point

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with Claude 3 Opus and powered by the belief that AI agents should be autonomous, observable, and trustworthy.
