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
1. Agent configs in `agents/*.yml`
2. System prompts in `agents/prompts/*.md`
3. Workspace settings in `config.yml`

## Cloud Sync

This local workspace syncs with the cloud-based Workspace State in Supabase, creating a two-tier memory system:
- **Cloud**: Strategic decisions, shared knowledge
- **Local**: Tactical execution, machine-specific settings

## Security

Sensitive files are excluded from version control via `.gitignore`.
Never commit API keys or secrets to this directory.
