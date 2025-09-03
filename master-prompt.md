### Master Prompt: Operation Secure Handshake

Goal:
Implement the complete, end-to-end, production-grade Device Code + OAuth authentication flow for the ECOSYSTEMCL.AI CLI. The final implementation must be secure, robust, and fully deployed on AWS infrastructure.

System Context:

  * Web Framework: Next.js
  * Primary Database & Auth Provider: Supabase with Clerk integration.
  * Target Cloud: AWS. You have native access to provision resources.
  * Local Interface: The `forge` CLI.

Acceptance Criteria (Definition of Done):

1.  A developer can run `forge login` from any machine.
2.  The command successfully guides them through a browser-based authentication and authorization flow.
3.  Upon success, a `~/.forge/credentials.json` file is created with secure permissions, containing a valid access and refresh token.
4.  Subsequent CLI commands (e.g., `forge status`) use this token to make authenticated API calls.
5.  The entire backend infrastructure for this flow is provisioned on AWS using Infrastructure as Code.

Execution Plan (Chain of Thought for the MCP):

This plan is to be executed by the ECOSYSTEMCL.AI Master Control Program. You will deliberate on the optimal path and dispatch specialized agents for each phase.

Phase 1: Research & Architectural Validation

  * Agent: ResearchAgent
  * Task:
    1.  Perform a web search for the absolute latest, production-grade implementation patterns for the OAuth 2.0 Device Authorization Grant flow.
    2.  Search the latest official documentation for Clerk, Supabase, and AWS Lambda for best practices on managing and verifying JWTs in a serverless environment.
    3.  Analyze the results and produce an updated architectural diagram and data flow specification. This document will serve as the blueprint for all subsequent agents.
  * Constraint: Prioritize the use of free, web-enabled models (Gemini) for this research phase.

Phase 2: Infrastructure Provisioning

  * Agent: AWSSpecialist
  * Task:
    1.  Based on the blueprint from Phase 1, design the necessary AWS infrastructure.
    2.  Your design must use Amazon API Gateway to create the required endpoints (`/device-auth/authorize`, `/device-auth/poll`, `/auth/refresh`).
    3.  Each endpoint should trigger a dedicated AWS Lambda function.
    4.  Generate a complete AWS SAM (Serverless Application Model) `template.yaml` file that defines this infrastructure. The file must be fully deployable.
    5.  The Lambda functions must have a secure IAM role with the minimum necessary permissions (e.g., secrets access, database access).

Phase 3: Backend Logic Implementation

  * Agent: CodeGenerator (Specializing in Backend TypeScript)
  * Task:
    1.  Read the architectural blueprint from Phase 1 and the SAM template from Phase 2.
    2.  Write the complete TypeScript source code for the three Lambda functions defined in the SAM template:
          * `authorizeHandler`: Logic to link a device code to an authenticated Clerk user session.
          * `pollHandler`: Logic to check the authorization status of a device code and return tokens upon success.
          * `refreshHandler`: Logic to validate a refresh token and issue a new access token.
    3.  The code must securely interact with Supabase to store and retrieve tokens. All secrets (e.g., JWT signing key) must be fetched from AWS Secrets Manager.

Phase 4: CLI Implementation

  * Agent: CodeGenerator (Specializing in CLI TypeScript)
  * Task:
    1.  Refactor the existing `packages/cli/src/auth.js` and the `forge login` command.
    2.  Implement the logic to generate the device code, open the browser, and start polling the new API Gateway endpoint.
    3.  Implement the logic to securely store the received tokens in `~/.forge/credentials.json`.
    4.  Implement the auto-refresh mechanism that uses the `/auth/refresh` endpoint when a `TOKEN_EXPIRED` error is received.

Phase 5: Deployment & Verification

  * Agent: DevOpsManager
  * Task:
    1.  Delegate Sub-Plan: Call the MCP to create a sub-plan to "Build and package all artifacts." This will involve running `pnpm build` on the backend and CLI code.
    2.  Execute Deployment: Use the AWS CLI to execute the `sam deploy` command using the `template.yaml` file from Phase 2 and the packaged code from the sub-plan.
    3.  Run Integration Test: After deployment, execute a scripted integration test:
          * Run the newly built `forge login` command.
          * Programmatically simulate the browser authorization step by calling the API Gateway endpoint directly.
          * Verify that the CLI successfully receives the token.
          * Run `forge status` and verify it shows an authenticated state.
    4.  If all steps succeed, mark the entire plan as complete.

How To Run

Save this file and run:

```
forge plan --prompt-file="./master-prompt.md" --workspace="ECOSYSTEMCLAI_PLATFORM_V2"
```
