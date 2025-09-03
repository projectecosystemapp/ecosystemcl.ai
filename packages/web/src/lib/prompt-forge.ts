import { supabase } from './supabase';

export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  agentId: string;
  template: string;
  variables: string[];
  metadata: {
    description: string;
    author: string;
    createdAt: string;
    performance: {
      avgTokens: number;
      successRate: number;
      avgCost: number;
    };
  };
  isActive: boolean;
}

export class PromptForge {
  private cache = new Map<string, PromptTemplate>();

  async getPromptTemplate(agentId: string, version?: string): Promise<PromptTemplate> {
    const cacheKey = `${agentId}:${version || 'latest'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return this.getDefaultPrompt(agentId);
    }

    const template: PromptTemplate = {
      id: data.id,
      name: data.name,
      version: data.version,
      agentId: data.agent_id,
      template: data.template,
      variables: data.variables || [],
      metadata: data.metadata || {},
      isActive: data.is_active
    };

    this.cache.set(cacheKey, template);
    return template;
  }

  async renderPrompt(agentId: string, variables: Record<string, any>): Promise<string> {
    const template = await this.getPromptTemplate(agentId);
    
    let rendered = template.template;
    
    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return rendered;
  }

  async updatePromptPerformance(
    templateId: string, 
    metrics: { tokens: number; success: boolean; cost: number }
  ): Promise<void> {
    // Update performance metrics for A/B testing
    await supabase.rpc('update_prompt_performance', {
      template_id: templateId,
      tokens: metrics.tokens,
      success: metrics.success,
      cost: metrics.cost
    });
  }

  private getDefaultPrompt(agentId: string): PromptTemplate {
    const defaultPrompts: Record<string, PromptTemplate> = {
      'research-agent': {
        id: 'default-research',
        name: 'Research Agent Default',
        version: '1.0.0',
        agentId: 'research-agent',
        template: `You are a world-class research assistant. Your sole purpose is to use the web_search tool to find the most accurate, up-to-date information to answer queries.

CRITICAL RULES:
1. ALWAYS use the web_search tool for any question about current events, latest versions, or recent developments
2. Provide citations and URLs for all claims
3. If information conflicts between sources, mention the discrepancy
4. Summarize findings clearly and concisely

Task: {{task}}
Context: {{context}}

Use the web_search tool to research this thoroughly.`,
        variables: ['task', 'context'],
        metadata: {
          description: 'Default research agent prompt with web search emphasis',
          author: 'ECOSYSTEMCL.AI System',
          createdAt: new Date().toISOString(),
          performance: { avgTokens: 500, successRate: 0.85, avgCost: 25 }
        },
        isActive: true
      },

      'code-generator': {
        id: 'default-codegen',
        name: 'Code Generator Default',
        version: '1.0.0',
        agentId: 'code-generator',
        template: `You are an expert software engineer. Write production-ready code that follows best practices.

REQUIREMENTS:
- Write clean, readable, well-documented code
- Include proper error handling
- Follow the language's conventions and style guides
- Add inline comments for complex logic
- Use the file_write tool to create files

Task: {{task}}
Context: {{context}}
Language: {{language}}
Framework: {{framework}}

Generate the code and write it to appropriate files.`,
        variables: ['task', 'context', 'language', 'framework'],
        metadata: {
          description: 'Default code generation prompt with best practices',
          author: 'ECOSYSTEMCL.AI System',
          createdAt: new Date().toISOString(),
          performance: { avgTokens: 800, successRate: 0.92, avgCost: 40 }
        },
        isActive: true
      },

      'token-economist': {
        id: 'default-economist',
        name: 'Token Economist Default',
        version: '1.0.0',
        agentId: 'token-economist',
        template: `You are the Token Economist. Your job is to analyze the user's goal and generate strict cost constraints for the MCP.

ANALYSIS FRAMEWORK:
1. Assess goal complexity (simple/moderate/complex)
2. Check user's credit balance and tier
3. Review historical costs for similar tasks
4. Generate specific model restrictions and budget limits

User Goal: {{goal}}
User Tier: {{tier}}
Credits Remaining: {{credits}}
Historical Average: {{historical_cost}}

Output a detailed directive with:
- Maximum credit budget
- Preferred models (cheapest first)
- Forbidden models
- Caching strategy
- Parallelism limits`,
        variables: ['goal', 'tier', 'credits', 'historical_cost'],
        metadata: {
          description: 'Token economist prompt for cost optimization',
          author: 'ECOSYSTEMCL.AI System',
          createdAt: new Date().toISOString(),
          performance: { avgTokens: 300, successRate: 0.95, avgCost: 15 }
        },
        isActive: true
      },

      'mcp-planner': {
        id: 'default-planner',
        name: 'MCP Planner Default',
        version: '1.0.0',
        agentId: 'mcp-planner',
        template: `You are the Master Control Program Planner. Generate multiple execution plans for the given goal.

PLANNING PRINCIPLES:
1. Create 3 different approaches: Fast, Thorough, Novel
2. Break complex goals into discrete, manageable steps
3. Define clear dependencies between steps
4. Estimate credits and time for each step
5. Consider available agents and their capabilities

Goal: {{goal}}
Constraints: {{constraints}}
Available Agents: {{agents}}
Workspace State: {{workspace_state}}

Generate 3 plans with different trade-offs:
- Plan A: Minimize time and cost
- Plan B: Maximize quality and thoroughness  
- Plan C: Try innovative approaches

For each plan, specify:
- Step sequence with dependencies
- Agent assignments
- Estimated credits per step
- Risk assessment`,
        variables: ['goal', 'constraints', 'agents', 'workspace_state'],
        metadata: {
          description: 'MCP planner prompt for multi-plan generation',
          author: 'ECOSYSTEMCL.AI System',
          createdAt: new Date().toISOString(),
          performance: { avgTokens: 1200, successRate: 0.88, avgCost: 60 }
        },
        isActive: true
      },

      'mcp-critic': {
        id: 'default-critic',
        name: 'MCP Critic Default',
        version: '1.0.0',
        agentId: 'mcp-critic',
        template: `You are the Master Control Program Critic. Evaluate execution plans for feasibility, cost-effectiveness, and risk.

EVALUATION CRITERIA:
1. Feasibility: Can this plan actually work?
2. Cost Efficiency: Is this the most cost-effective approach?
3. Risk Assessment: What could go wrong?
4. Dependency Analysis: Are there circular dependencies or bottlenecks?
5. Resource Utilization: Does this make good use of available agents?

Plan to Evaluate: {{plan}}
Constraints: {{constraints}}
User Context: {{user_context}}

Provide:
- Overall confidence score (0-1)
- Risk score (0-1)
- Specific issues identified
- Recommended modifications
- Alternative suggestions if plan is poor`,
        variables: ['plan', 'constraints', 'user_context'],
        metadata: {
          description: 'MCP critic prompt for plan evaluation',
          author: 'ECOSYSTEMCL.AI System',
          createdAt: new Date().toISOString(),
          performance: { avgTokens: 600, successRate: 0.91, avgCost: 30 }
        },
        isActive: true
      }
      ,
      'monitoring-agent': {
        id: 'default-monitor',
        name: 'Monitoring Agent Default',
        version: '1.0.0',
        agentId: 'monitoring-agent',
        template: `You are a MonitoringAgent. Your responsibility is to subscribe to logs/metrics for newly deployed resources and detect anomalies.

DUTIES:
- Subscribe to provider logs (CloudWatch, Sentry) for target resources
- Detect spikes in 5xx errors or latency anomalies
- Summarize incidents with timeframe, frequency, and suspected component
- Escalate to DebuggingAgent with minimal, relevant context

Target Resource: {{resource}}
Signals of Interest: {{signals}}
Escalation Threshold: {{threshold}}
`,
        variables: ['resource', 'signals', 'threshold'],
        metadata: {
          description: 'Monitors logs/metrics and triggers diagnosis',
          author: 'ECOSYSTEMCL.AI System',
          createdAt: new Date().toISOString(),
          performance: { avgTokens: 200, successRate: 0.9, avgCost: 5 }
        },
        isActive: true
      },
      'debugging-agent': {
        id: 'default-debugger',
        name: 'Debugging Agent Default',
        version: '1.0.0',
        agentId: 'debugging-agent',
        template: `You are a DebuggingAgent. Given incident context and logs, locate the probable cause and propose a minimal, safe fix plan.

INPUTS:
- Incident Summary: {{incident}}
- Logs/Stack Trace: {{logs}}
- Workspace State: {{workspace_state}}

OUTPUT:
- Root cause hypothesis
- Minimal patch steps
- Test to reproduce and verify
- Risk assessment and rollout plan
`,
        variables: ['incident', 'logs', 'workspace_state'],
        metadata: {
          description: 'Diagnoses incidents and proposes patch plans',
          author: 'ECOSYSTEMCL.AI System',
          createdAt: new Date().toISOString(),
          performance: { avgTokens: 600, successRate: 0.85, avgCost: 25 }
        },
        isActive: true
      }
    };

    return defaultPrompts[agentId] || defaultPrompts['code-generator'];
  }

  async createPromptTemplate(template: Omit<PromptTemplate, 'id'>): Promise<string> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        name: template.name,
        version: template.version,
        agent_id: template.agentId,
        template: template.template,
        variables: template.variables,
        metadata: template.metadata,
        is_active: template.isActive
      })
      .select('id')
      .single();

    if (error) throw error;
    
    // Clear cache for this agent
    const cacheKeys = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${template.agentId}:`)
    );
    cacheKeys.forEach(key => this.cache.delete(key));

    return data.id;
  }

  async activatePromptVersion(agentId: string, version: string): Promise<void> {
    // Deactivate all versions for this agent
    await supabase
      .from('prompt_templates')
      .update({ is_active: false })
      .eq('agent_id', agentId);

    // Activate the specified version
    await supabase
      .from('prompt_templates')
      .update({ is_active: true })
      .eq('agent_id', agentId)
      .eq('version', version);

    // Clear cache
    const cacheKeys = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${agentId}:`)
    );
    cacheKeys.forEach(key => this.cache.delete(key));
  }
}
