# ECOSYSTEMCL.AI Development Charter

## Core Architectural Mandates

### AWS-Native First
- All infrastructure must use AWS CDK TypeScript
- Serverless-first: Lambda, ECS Fargate, API Gateway
- Data layer: DynamoDB + OpenSearch Serverless + S3
- AI/ML: Amazon Bedrock (Claude, Titan embeddings)

### The Three Laws
1. **Query-First**: All patterns must exist in Helix Knowledge Base before use
2. **Zero Inference**: Agents cannot assume context not explicitly provided
3. **Self-Documentation**: Every pattern must include intent, context, and anti-patterns

## Agent Interaction Protocols

### Prompt Engineering Standards
- Always assign specific roles to agents
- Use Chain of Thought for complex reasoning
- Provide concrete examples and constraints
- Specify output format explicitly

### Multi-Agent Workflows
1. **Specify**: SocraticDialogueAgent clarifies requirements
2. **Plan**: MCP generates and evaluates multiple approaches
3. **Tasks**: Executor breaks plan into discrete jobs
4. **Implement**: Specialized agents execute with Helix patterns

### Context Management
- Maintain project context in .eco_workspace/
- Use ECO_CHARTER.md as primary reference
- Break large tasks into focused sub-tasks
- Leverage Helix Knowledge Base for consistency

## Quality Gates

### Code Review Protocol
- All changes reviewed by CodeReviewer agent
- Must align with architectural mandates
- Security scan via SecurityAuditor agent
- Performance validation required

### Pattern Creation Process
- Extract from working implementations only
- Include success metrics and usage context
- Validate against anti-patterns
- Store in HelixPatternEntries with embeddings

## Custom Commands

### Project-Specific Workflows
```bash
eco run-command deploy-stack --env production
eco run-command create-agent --type database-expert
eco run-command audit-security --scope api-layer
```

## Success Metrics

- Sub-100ms Helix pattern retrieval
- 95%+ agent task success rate
- Zero manual infrastructure deployment
- Complete audit trail for all changes