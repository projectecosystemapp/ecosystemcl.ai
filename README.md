# ECOSYSTEMCL.AI - Multi-Agent Development Platform

The world's most advanced multi-agent development platform. Deploy autonomous AI teams that code, test, review, and deploy - all while you sleep.

## 🚀 Features

- **12+ Specialized Agents** - From code generation to security auditing
- **AWS Native Integration** - Bedrock, ECS, S3, and more
- **Intelligent Caching** - 60% cost savings through smart optimization
- **Parallel Execution** - Run multiple agents simultaneously
- **Credit System** - Pay only for what you use
- **Team Collaboration** - Shared workspaces and real-time monitoring

## 📦 Installation

### Quick Install (Recommended)
```bash
curl -fsSL https://ecosystemcl.ai/install.sh | bash
```

### Manual Download
- [macOS (Intel)](https://ecosystemcl.ai/download?platform=darwin&arch=x64)
- [macOS (Apple Silicon)](https://ecosystemcl.ai/download?platform=darwin&arch=arm64)
- [Windows x64](https://ecosystemcl.ai/download?platform=win32&arch=x64)
- [Linux x64](https://ecosystemcl.ai/download?platform=linux&arch=x64)

### Web Application
Visit [ecosystemcl.ai](https://ecosystemcl.ai) to use the browser-based interface.

## 🎯 Quick Start

1. **Authenticate**
   ```bash
   ecosystemcli login
   ```

2. **Run Your First Task**
   ```bash
   ecosystemcli plan "Build a React dashboard with authentication"
   ```

3. **Watch the Magic**
   ```
   🤖 Orchestrator: Analyzing requirements...
   🏗️  Architect: Designing component structure...
   ⚡ CodeGen: Implementing components...
   🧪 TestWriter: Creating test suites...
   🔍 Reviewer: Security audit complete...
   ✅ Task completed in 3.2 minutes
   ```

## 💰 Pricing

| Plan | Price | Credits | Agents | Storage |
|------|-------|---------|--------|---------|
| **Starter** | Free | 10K/month | 3 basic | 1GB |
| **Pro** | $49/month | 1M/month | All 12 | 50GB |
| **Team** | $149/month | 5M/month | All + custom | 500GB |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited |

## 🤖 Available Agents

### Core Agents (Free)
- **Orchestrator** - Task planning and coordination
- **Code Generator** - Production-ready code in any language
- **Test Writer** - Comprehensive test suites

### Pro Agents
- **Security Auditor** - Vulnerability scanning
- **UI Architect** - Beautiful, responsive interfaces
- **Database Expert** - Query optimization and schema design
- **API Designer** - RESTful APIs with documentation
- **Performance Optimizer** - Speed and efficiency improvements

### Team Agents
- **DevOps Manager** - CI/CD and deployments
- **Mobile Specialist** - Native and cross-platform apps
- **Integration Tester** - End-to-end testing
- **Deployment Manager** - Production deployments

### Enterprise Agents
- **Data Scientist** - ML models and analytics
- **Blockchain Developer** - Smart contracts and DeFi
- **Cloud Architect** - Scalable infrastructure
- **Compliance Auditor** - Regulatory compliance

## 🏗️ Architecture

### Local Development
```
CLI → Local Agents → Your Codebase
```

### Cloud Production
```
Web App → SQS Queue → ECS Fargate → AWS Bedrock
                   ↓
              S3 Artifacts ← Redis Cache
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
FORGE_API_KEY=your_api_key
FORGE_WORKSPACE=your_workspace_id

# Optional
FORGE_MODEL=claude-3-opus  # Default model
FORGE_TIMEOUT=900         # 15 minutes
FORGE_PARALLEL=4          # Parallel agents
```

### Agent Configuration
```yaml
# .forge/agents/custom-agent.yml
name: "custom-agent"
description: "Your custom agent"
model_id: "claude-3-sonnet"
temperature: 0.7
max_tokens: 8192
capabilities:
  - read_file
  - write_file
  - run_command
```

## 🚀 Deployment

### AWS Production Setup
```bash
# Deploy infrastructure
cd aws
./deploy.sh production

# Update environment variables
export DATABASE_URL=postgresql://...
export REDIS_URL=redis://...
export AWS_REGION=us-east-1

# Deploy web app
vercel --prod
```

### Docker
```bash
docker run -d \
  -e FORGE_API_KEY=your_key \
  -v $(pwd):/workspace \
  forgeai/cli:latest
```

## 📊 Monitoring

### Real-time Dashboard
- Job status and progress
- Credit usage tracking
- Agent performance metrics
- Team collaboration

### CLI Monitoring
```bash
forge status              # Current jobs
forge logs <job-id>       # Job logs
forge usage              # Credit usage
forge agents list        # Available agents
```

## 🔐 Security

- **VPC Isolation** - Private subnets and security groups
- **IAM Roles** - Least privilege access
- **Encryption** - At rest and in transit
- **Audit Logs** - Complete activity tracking
- **SOC2 Compliance** - Enterprise security standards

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Setup
```bash
git clone https://github.com/forge-ai/forge-standalone
cd forge-standalone
pnpm install
pnpm dev
```

## 📚 Documentation

- [Getting Started](https://docs.ecosystemcl.ai/getting-started)
- [Agent Development](https://docs.ecosystemcl.ai/agents)
- [API Reference](https://docs.ecosystemcl.ai/api)
- [AWS Integration](https://docs.ecosystemcl.ai/aws)
- [Troubleshooting](https://docs.ecosystemcl.ai/troubleshooting)

## 💬 Support

- **Community**: [Discord](https://discord.gg/ecosystemcl-ai)
- **Issues**: [GitHub Issues](https://github.com/ecosystemcl-ai/forge-standalone/issues)
- **Email**: support@ecosystemcl.ai
- **Enterprise**: enterprise@ecosystemcl.ai

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by the ECOSYSTEMCL.AI team**

[Website](https://ecosystemcl.ai) • [Documentation](https://docs.ecosystemcl.ai) • [Discord](https://discord.gg/ecosystemcl-ai) • [Twitter](https://twitter.com/ecosystemcl_ai)

## 🛠️ Operations: Emergency Recovery

If OpenSearch indexing or the CDC pipeline is degraded, run:

```bash
./scripts/emergency-recovery.sh
./scripts/validate-recovery.sh
```

See `docs/operations/emergency-recovery.md` for details.
