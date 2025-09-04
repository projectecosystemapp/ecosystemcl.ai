# ECOSYSTEMCL.AI Copilot Instructions

Welcome, agent. This document provides the essential knowledge to be productive in the ECOSYSTEMCL.AI codebase. This is a `pnpm` monorepo containing a web app, a CLI, and backend workers for a multi-agent AI development platform.

## 1. Core Architecture: Cloud vs. Local

There are two distinct execution models. Understanding which you're working in is critical.

### a. Cloud Architecture (AWS Native)

This is the production environment, defined entirely in `amplify/backend.ts` using AWS CDK.

- **Entrypoint**: An API Gateway (`ecosystem-api`) receives requests (e.g., to `/plans/execute`).
- **Orchestration**: A central AWS Lambda function (`ecosystem-orchestrator`) runs the agentic logic. The code for this lambda comes from the `packages/worker` project.
- **Job Management**: The orchestrator pushes jobs to an SQS queue (`ecosystem-agent-jobs`).
- **State & Memory**: The "Cloud Brain" uses DynamoDB tables to store agent state, workspace data, and plan execution history. See `AgentStateTable`, `WorkspaceTable`, and `PlanExecutionTable` in `amplify/backend.ts`.
- **AI Models**: The system invokes foundation models (e.g., Claude) via AWS Bedrock. Permissions are managed by IAM roles.

**Key File**: `amplify/backend.ts` is the source of truth for all backend infrastructure. To understand data flows, service boundaries, or add new infrastructure, start here.

### b. Local Architecture (CLI-driven)

This is for local development and auditing, orchestrated by the `packages/cli` tool.

- **Entrypoint**: The user runs a command like `ecosystemcli plan "..."`.
- **Orchestration**: `packages/cli/src/pipeline.js` defines the `AuditPipeline`.
- **Parallelism**: This pipeline uses a unique pattern: it creates a `git worktree` for each parallel task. This isolates file system changes for each agent, which are later merged. This is crucial for running agents on a local codebase without conflicts.
- **Session Management**: The CLI maintains session state and checkpoints in the `.forge/sessions` directory to allow for resuming failed or long-running tasks.

**Key File**: `packages/cli/src/pipeline.js` explains the entire local execution flow, from task decomposition to worktree management and result integration.

## 2. Key Components & Data Flow

- `packages/web`: The Next.js frontend. The most important logic is in `packages/web/src/lib`.
  - `lib/mcp-server.ts`: Defines the `MCPServer` (Master Control Program). This class orchestrates the `PlannerAgent` and `CriticAgent` to generate and evaluate multi-step plans before execution. This is the high-level "thinking" process of the system.
- `packages/worker`: The background job processor for the cloud environment.
  - `src/index.ts`: Configures the BullMQ worker to listen to the Redis queue.
  - `src/processor.ts`: Contains the logic to process a single job. This is where an individual agent's task is executed in the cloud.
- `packages/cli`: The command-line interface.
  - `src/agentDispatcher.js`: Handles the invocation of individual agents.
  - `agents/*.yaml`: Declarative definitions for different specialized agents.

## 3. Developer Workflows & Conventions

- **Setup**: This is a `pnpm` workspace. Run `pnpm install` in the root.
- **Making Backend Changes**:
  1. Modify the CDK constructs in `amplify/backend.ts`.
  2. Deploy by running an Amplify push command, which will provision the resources in AWS.
- **Running Local Agent Tasks**:
  - Use the CLI: `ecosystemcli plan "your task"`.
  - Be aware this will create `git worktree` directories in the parent folder (`../worktree-*`). This is expected.
- **Testing**: The web package uses `vitest`. Run tests within `packages/web` via `pnpm test`.

## 4. Critical Patterns

- **Infrastructure as Code**: All AWS resources are defined in `amplify/backend.ts`. Do not create resources manually in the AWS console.
- **Agent Planning**: Before execution, a plan is generated and evaluated by a `PlannerAgent` and `CriticAgent` (`packages/web/src/lib/mcp-server.ts`). This deliberation phase is a core concept.
- **Local Parallel Execution**: When modifying the CLI, respect the `git worktree` pattern in `pipeline.js` for running agents in parallel. This prevents race conditions when modifying local files.

## 5. Operational Recovery (OpenSearch + CDC)

For urgent recovery in dev/prod:
- Run `scripts/emergency-recovery.sh` to (a) create/update the OpenSearch index using `scripts/opensearch/index-mapping.json`, (b) start DLQ → source re-drive, and (c) canary-invoke the CDC Lambda.
- Validate with `scripts/validate-recovery.sh` (checks index reachability, DLQ empty, and CDC logs clean).
- See `docs/operations/emergency-recovery.md` for env vars and troubleshooting.

## 6. Roadmap: Community Agent Marketplace (Phased)

- Phase 1 (Backend foundation): Add `CommunityAgentsTable` (DynamoDB) and `AgentConfigsBucket` (S3) in `amplify/backend.ts`.
- Phase 2 (Publishing flow): Implement `ecosystemcli agent publish` (packages/cli) and `/marketplace/publish` + `PublishAgentLambda` (packages/worker).
- Phase 3 (Consumption flow): Extend `MCPServer` to use community agents, add Marketplace UI (packages/web), and `ecosystemcli config pull` to sync into `.eco_workspace/community/`.
## 5. The Community Agent Marketplace (Vision)

The next major evolution is to build a "GitHub for AI Agents." This will transform the platform into a self-expanding ecosystem.

### a. The Vision

- **Core Idea**: Any user can create, share, and monetize specialized agents.
- **Consumers**: Discover and "install" community agents from a marketplace in the web app. An `ecosystemcli config pull` command syncs the agents to the local workspace.
- **Creators**: Publish agents using `ecosystemcli agent publish`. They can set monetization rules (Free, Tier-Gated, or Credit-Based Revenue Share).

### b. Marketplace Architecture

- **Agent Registry**: A new DynamoDB table (`CommunityAgentsTable`) will store agent metadata (author, version, popularity, monetization rules).
- **Agent Storage**: A new S3 bucket (`AgentConfigsBucket`) will store the agent definition files (`agent.yaml`, `prompt.md`).
- **Publishing API**: A new API Gateway endpoint (`POST /marketplace/publish`) will trigger a Lambda (`PublishAgentLambda`) to handle validation and publishing logic.
- **Monetization Engine**: A transactional system will manage credit transfers between agent consumers and creators.

### c. Implementation Flow

1.  **Phase 1: Backend Foundation (in `amplify/backend.ts`)**:
    - Define the `CommunityAgentsTable` (DynamoDB) and `AgentConfigsBucket` (S3).
2.  **Phase 2: Publishing Flow (in `packages/cli` and `packages/worker`)**:
    - Implement the `ecosystemcli agent publish` command.
    - Create the `PublishAgentLambda` and the `/marketplace/publish` API endpoint.
3.  **Phase 3: Consumption Flow (in `packages/web` and `packages/cli`)**:
    - Enhance the `MCPServer` to query for and use community agents.
    - Build the marketplace UI for discovery and installation.
    - Implement `ecosystemcli config pull` to sync agents locally into `.eco_workspace/community/`.
