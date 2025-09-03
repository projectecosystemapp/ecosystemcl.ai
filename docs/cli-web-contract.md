# ECOSYSTEMCL.AI CLI ↔ Web UI Contract

This document defines the precise integration contract between the ECOSYSTEMCL.AI CLI ("cockpit") and the Web UI ("mission control"). It is aligned with the current code in this repo and calls out gaps to close for a seamless experience.

## Shared Concepts

- `access_token`: Short‑lived bearer used for API auth.
- `refresh_token`: Long‑lived token to mint new access tokens.
- Local credentials file: `~/.forge/credentials.json` (0600). Fields: `access_token`, `refresh_token`, `expires_at`, `user_id`, `user_email?`, `connected_services?`.
- Workspace folder: `.forge_workspace/` with agent YAML/Markdown configs.
- Job: Unit of execution processed by workers; streams logs via SSE.
- Plan: Higher‑level orchestration (MCP). A plan is composed of plan steps; each step is executed as one or more jobs.

---

## 1) Onboarding & Authentication

CLI command: `forge login`

Flow and endpoints:
- CLI displays device code and opens browser: `GET /device-auth?code={DEVICE_CODE}&state={STATE}` (Web UI page).
- Web UI registers the code (client call): `GET /api/device-auth/authorize?code={DEVICE_CODE}&state={STATE}`.
- CLI polls: `POST /api/device-auth/poll` with body:
  - Request: `{ device_code: string, state: string }`
  - Response (200): `{ status: 'pending' | 'authorized' | 'expired', credentials? }`
  - On `authorized`, `credentials` contains: `{ access_token, refresh_token, expires_at, user_id, user_email? }`.
- Web UI authorizes via page action: `POST /api/device-auth/authorize`
  - Request: `{ device_code, state, user_id, user_email? }`
  - Effect: Generates tokens, upserts `user_agent_configs`, marks device code authorized.

Required behaviors:
- CLI saves tokens to `~/.forge/credentials.json` with mode 0600.
- All subsequent API calls include `Authorization: Bearer {access_token}`.
- Expiration handling: If an API returns 401 with error_code `TOKEN_EXPIRED`, CLI calls refresh and retries original request once.

Refresh & logout (gap to implement):
- POST `/api/auth/refresh` (server):
  - Request: `{ refresh_token: string }`
  - Response: `{ access_token: string, expires_at: string, refresh_token?: string, user_id: string, user_email?: string }`
- POST `/api/auth/logout` (server):
  - Request: `{ refresh_token: string }`
  - Effect: Invalidates refresh token in DB. CLI also deletes local credentials.

CLI commands:
- `forge status`: Reads local credentials and shows user and connected services.
- `forge logout`: Deletes local credentials and calls `/api/auth/logout`.

---

## 2) Core Execution (Action & Visualization)

Two primary modes exist today:
- Agent execution (single agent): `POST /api/forge/agent/execute`
- Plan generation/execution (MCP): `POST /api/forge/execute` (v2)

Agent execution (current):
- Endpoint: `POST /api/forge/agent/execute`
  - Request:
    ```json
    {
      "agentName": "tdd-implementer",
      "taskPrompt": "Refactor auth to use passkeys",
      "context": { "files": ["src/auth/*"], "workingDirectory": "." },
      "authMethod": "platform" | "byok",
      "modelProvider"?: "openai" | "claude" | "together" | "groq",
      "modelName"?: string,
      "streaming"?: true,
      "priority"?: number,
      "timeout"?: number
    }
    ```
  - Response (200):
    ```json
    {
      "success": true,
      "job": { "id": "<uuid>", "status": "queued", "agentName": "...", "queuedAt": "..." },
      "streaming": { "url": "/api/forge/stream/<jobId>", "protocol": "sse" }
    }
    ```

Plan generation/execution (MCP, v2):
- Endpoint: `POST /api/forge/execute` (v2 handler)
  - Request: `{ goal: string, workspaceId?: string, executionMode?: 'mcp' | 'immediate' }`
  - Response (200): `{ success, plan: { id, type, estimatedCost, estimatedTime, confidence, riskScore, status }, websocketUrl: "/api/forge/stream/<plan_or_job_id>", constraints, alternatives }`

Streaming (SSE):
- Endpoint: `GET /api/forge/stream/[jobId]`
  - Auth: bearer token
  - Events (data payload):
    - `{ "type": "connected", "jobId": "...", "status": "running|queued|..." }`
    - `{ "type": "log", "timestamp": "...", "message": "..." }`
    - `{ "type": "LOG_BLOCK", "block": { thinking, reasoning, reference, action, result, number, timestamp }, "agentName": "..." }`
    - `{ "type": "status", "status": "running|completed|failed|cancelled", "error"?: "...", "result"?: any, "completedAt"?: "..." }`
  - Heartbeat: `:heartbeat` comment every 30s.

Important alignment to close:
- The v2 `websocketUrl` currently returns a plan id, but the stream route expects a job id. Choose one of:
  1) Return job IDs for step streams; or
  2) Add `GET /api/forge/stream/plans/[planId]` that multiplexes all step/job events for a plan.

CLI behaviors:
- `forge plan "<goal>"` (to be added): calls `POST /api/forge/execute` (v2). Default attaches to SSE and prints logs. Returns `plan_id`.
- `forge plan --no-stream` or `--detach`: submits, prints `plan_id`, exits 0.
- `forge open <plan_or_job_id>`: opens Web UI detail page.
- Ctrl+C: CLI traps SIGINT and POSTs cancellation.

Cancellation (gap to implement):
- POST `/api/forge/cancel` with `{ planId?: string, jobId?: string }` → marks `plans` and/or `jobs` as `cancelled` and signals workers.

Web UI:
- Subscribes to Supabase Realtime on `plans`, `plan_steps`, `jobs`, and `job_logs` filtered by Clerk `user_id`.
- Renders step status transitions instantly; matches CLI stream output.

---

## 3) Configuration Management (Workspace Sync)

Source of truth: local `.forge_workspace/` in the project repo. Cloud holds synchronized snapshots.

Endpoints (to add):
- `GET /api/workspace/config?workspaceId=...`
  - Response: `{ snapshot: { files: { "path/relative.yml": "<contents>", ... } }, last_push_at: iso, etag: string }`
- `POST /api/workspace/config`
  - Request: `{ workspaceId, snapshot: { files: { path: contents } }, last_push_at?: iso, etag?: string }`
  - Response:
    - 200: `{ status: 'ok', last_push_at, etag }`
    - 409: `{ status: 'conflict', message, conflicted: ["relative/path.yml", ...], server_last_push_at, server_etag }`

Database (to add):
- `workspaces.local_config_snapshot JSONB` — full snapshot
- `workspaces.config_last_push_at TIMESTAMPTZ`
- `workspaces.config_etag TEXT`

CLI commands (to add):
- `forge config push` → reads `.forge_workspace/**/*.{yml,yaml,md}` and POSTs snapshot.
- `forge config pull` → fetches snapshot and writes to `.forge_workspace`.
- Conflict handling: If a local file mtime > `config_last_push_at` and server has newer snapshot, warn:
  - `Your local 'code_generator.yml' has unsynced changes. Run 'forge config push' first or use '--force' to overwrite.`
- `--force` overwrites local files.

---

## Error Model

- 400: `{ error: '...', error_code?: 'BAD_REQUEST' }`
- 401: `{ error: 'Unauthorized', error_code: 'TOKEN_EXPIRED' | 'UNAUTHORIZED' }`
- 403: `{ error: 'Forbidden', error_code: 'FORBIDDEN' }`
- 404: `{ error: 'Not found', error_code: 'NOT_FOUND' }`
- 409: `{ error: 'Conflict', error_code: 'CONFLICT' }`
- 422: `{ error: 'Unprocessable', error_code: 'VALIDATION_FAILED', details?: any }`
- 5xx: `{ error: 'Internal server error', error_code?: 'INTERNAL' }`

CLI must on 401 TOKEN_EXPIRED:
1) POST `/api/auth/refresh`,
2) retry original request once,
3) if still failing, prompt `forge login`.

---

## URLs (Web UI)

- Device auth: `/device-auth?code={DEVICE_CODE}&state={STATE}`
- Agent job detail: `/dashboard/jobs/{jobId}`
- Plan detail: `/dashboard/plans/{planId}`
- `forge open <id>` builds the correct URL by pattern or probing `/api/resolve?id=<id>` (optional endpoint to add) to learn the entity type.

---

## Security Notes

- Enforce RLS on `plans`, `plan_steps`, `jobs`, `job_logs`, `workspaces`.
- Store tokens encrypted at rest; never leak secrets via SSE logs.
- `.forge/credentials.json` must be `0600`; warn if otherwise.
- Rate limit device‑auth polling: 1 req/3–5s; expire codes after 5 minutes.

---

## Gaps To Close (Action Items)

1) Add `/api/auth/refresh` + `/api/auth/logout` endpoints and wire to `user_agent_configs`.
2) Align streaming identifiers:
   - Either return jobId in v2 `websocketUrl`, or add plan‑level SSE endpoint.
3) Add cancellation endpoint `/api/forge/cancel` and worker signaling.
4) Add workspace config sync endpoints + DB columns (`local_config_snapshot`, `config_last_push_at`, `config_etag`).
5) Add CLI commands: `forge plan`, `forge open <id>`, `forge config push/pull` with conflict detection.

This contract enables frictionless handoff between CLI and Web UI while keeping a single source of truth synchronized in real time.
