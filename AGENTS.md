# Repository Guidelines

## Project Structure & Module Organization
- `packages/web` (Next.js app): UI and routes; `src/` for pages/components; `public/` assets.
- `packages/worker` (Node/TS): background jobs and integrations; tests under `src/tests`.
- `packages/infra` (AWS CDK): IaC stacks; entry in `lib/`; CDK config in `cdk.json`.
- `packages/cli` (Node/JS): developer CLI; binary at `bin/ecosystemcli`.
- Root `scripts/`: ops utilities (e.g., `emergency-recovery.sh`, OpenSearch helpers).
- Root `docs/`, `.env.example`, `amplify/`: docs and environment/config scaffolding.

## Build, Test, and Development Commands
- Install: `pnpm install` (workspace-aware).
- Dev (web): `pnpm --filter web dev` or `pnpm dev` (from root).
- Build all: `pnpm build` (filters `./packages/*`).
- Lint all: `pnpm lint` (workspace filter).
- Worker: `pnpm -F @ecosystemcl/worker dev | build | test | test:coverage`.
- Infra (CDK): `pnpm -F @ecosystemcl/infra synth | diff | deploy | destroy`.
- CLI: `pnpm -F ecosystem-cli test | lint` and `npm link` in `packages/cli` to install globally.

## Coding Style & Naming Conventions
- Languages: TypeScript (web, worker, infra), JavaScript (cli).
- Linting: ESLint (Next.js config in web). Run `pnpm lint` before PRs.
- Indentation: 2 spaces; filenames: kebab-case; React components: `PascalCase`.
- Variables/functions: `camelCase`; constants: `SCREAMING_SNAKE_CASE`.

## Testing Guidelines
- Frameworks: Vitest (web, worker), Jest (cli, infra, some worker tests).
- Naming: co-locate as `*.test.ts(x)` near source or under `src/tests`.
- Commands: `pnpm -F web test`, `pnpm -F @ecosystemcl/worker test:unit`, `test:e2e`, `test:coverage`.
- Coverage: start at ≥60% and progressively enforce 80% (see CI thresholds).

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits seen in history (`feat:`, `fix:`, `docs:`, `chore:`). Prefer small, focused changes.
- PRs: clear description, link issues, list scope/changes, include screenshots for UI, and note env/infra impacts.
- Quality gates: CI green, `pnpm build` + `pnpm lint` clean, tests passing for affected packages.

## Security & Configuration Tips
- Never commit secrets; use `.env.local` files (see root `.env.example`).
- AWS: least-privilege IAM; validate infra changes with `cdk diff` before `deploy`.
- Operational checks: use `scripts/emergency-recovery.sh` and `scripts/validate-recovery.sh` for recovery workflows.
