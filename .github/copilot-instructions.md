# ECOSYSTEMCL.AI Copilot Instructions

**ALWAYS FOLLOW THESE INSTRUCTIONS FIRST** and only fallback to additional search and context gathering if the information in these instructions is incomplete or found to be in error.

This is a `pnpm` monorepo containing a web app (Next.js), CLI tool (Node.js), and backend workers for a multi-agent AI development platform.

## Bootstrap and Setup Commands

Run these commands in the repository root (`/home/runner/work/ecosystemcl.ai/ecosystemcl.ai`):

```bash
# Install pnpm globally if not available
npm install -g pnpm@10.15.1

# Install all dependencies (takes ~18 seconds)
# NEVER CANCEL: Set timeout to 60+ seconds
pnpm install
```

## Working Commands (Validated)

### Development Server
```bash
# Start web development server (Next.js)
# NEVER CANCEL: Takes ~1.4 seconds to start, set timeout to 30+ seconds
pnpm dev
# Serves at http://localhost:3000
```

### CLI Tool
```bash
# Make CLI globally available
cd packages/cli && npm link

# Test CLI functionality (works without authentication for some commands)
ecosystemcli --help
ecosystemcli status      # Shows authentication status
ecosystemcli agents     # Lists available specialist agents (works without auth)
ecosystemcli init --help # Shows workspace initialization help
```

## Commands That Currently Fail (Known Issues)

### Build Commands - DO NOT USE
```bash
# These commands FAIL and should NOT be used:
pnpm build              # Fails: amplify config missing + 41 TypeScript errors in worker
pnpm -F web build       # Fails: missing @clerk/nextjs and amplify configuration  
pnpm -F worker build    # Fails: 41 TypeScript compilation errors
```

**Why builds fail:**
- Worker package: 41 TypeScript errors including missing dependencies (@aws-sdk/client-lambda, @types/opossum, nock)
- Web package: Missing Amplify configuration, @clerk/nextjs dependency issues
- Amplify generation requires specific parameters not configured

### Test Commands - DO NOT USE
```bash
# These test commands FAIL and should NOT be used:
pnpm test               # Fails: missing @vitejs/plugin-react and configuration issues
pnpm -F web test        # Fails: vitest config cannot find @vitejs/plugin-react
pnpm -F cli test        # Fails: no tests found (returns exit code 1)
```

### Lint Commands - PARTIALLY WORK
```bash
# Web linting works but has 4097 problems (289 errors, 3808 warnings)
pnpm -F web lint        # Runs but shows many issues - use --fix for some fixes

# CLI linting fails - no ESLint config
pnpm -F cli lint        # Fails: no configuration file found
```

## Validation Scenarios

### ALWAYS test basic web functionality after making changes:
1. Start development server: `pnpm dev`
2. Verify server starts at http://localhost:3000 in ~1.4 seconds
3. **Expected**: Server starts but shows Next.js build error due to missing AWS Amplify adapter configuration (this is normal)
4. Test CLI help command: `ecosystemcli --help`
5. List available agents: `ecosystemcli agents` (works without authentication)
6. Check authentication status: `ecosystemcli status`

### NEVER CANCEL Commands and Timeouts:
- `pnpm install`: Set timeout to 60+ seconds (typically takes 18 seconds)
- `pnpm dev`: Set timeout to 30+ seconds (typically takes 1.4 seconds)
- Any build attempts: Set timeout to 120+ seconds (but expect failures)

## Project Structure

### packages/web (Next.js Frontend)
- **Status**: Development server works, build fails
- **Key files**: 
  - `src/lib/mcp-server.ts`: Master Control Program orchestration
  - `src/app/`: Next.js app router pages
- **Issues**: Missing Amplify configuration, Clerk authentication setup

### packages/worker (TypeScript Backend)
- **Status**: Multiple TypeScript compilation errors
- **Key files**:
  - `src/index.ts`: BullMQ worker configuration  
  - `src/processor.ts`: Job processing logic
- **Issues**: 41 TypeScript errors, missing AWS SDK dependencies

### packages/cli (Node.js CLI)
- **Status**: Functional but requires authentication
- **Key files**:
  - `bin/ecosystemcli`: CLI entry point
  - `src/pipeline.js`: Audit pipeline with git worktree pattern
- **Issues**: No tests, missing ESLint configuration

## Critical Development Patterns

### Infrastructure as Code
- All AWS resources defined in `amplify/backend.ts` (if it exists)
- Do not create resources manually in AWS console

### Git Worktree Pattern
- CLI creates `git worktree` directories for parallel agent execution
- Expect `../worktree-*` directories when running CLI commands
- This isolates file system changes per agent

### Authentication Required
- CLI commands that modify code require authentication: `ecosystemcli login`
- Some commands work without authentication: `ecosystemcli agents`, `ecosystemcli --help`, `ecosystemcl init --help`
- Status shows: "Not authenticated" until login completed

## Emergency Recovery Scripts
```bash
# For production issues (if scripts exist):
./scripts/emergency-recovery.sh
./scripts/validate-recovery.sh
```

## Common Development Workflow

1. **Start fresh development session:**
   ```bash
   pnpm install  # 18 seconds, timeout 60s
   pnpm dev      # 1.4 seconds, timeout 30s
   ```

3. **Test CLI functionality:**
   ```bash
   cd packages/cli && npm link
   ecosystemcli --help     # Works
   ecosystemcli agents     # Lists 7 specialist agents
   ecosystemcli init --help # Shows workspace options
   ```

3. **DO NOT attempt to build or test** - these commands are currently broken

4. **Always manually verify web server starts** at http://localhost:3000 (expect Amplify configuration error - this is normal)

## Repository State Summary

✅ **Working**: pnpm install, web dev server, CLI help/status  
❌ **Broken**: build commands, test suites, linting (partially)  
⚠️  **Requires Setup**: authentication, Amplify configuration, missing dependencies

When working in this codebase, focus on development server functionality and CLI behavior. Avoid build/test commands until the underlying TypeScript and configuration issues are resolved.
