export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  credits: number;
  storage: number; // GB
  agents: string[];
  features: string[];
  limits: {
    parallelJobs: number;
    queuePriority: number;
    customAgents: number;
    teamMembers: number;
  };
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 0,
    credits: 10000,
    storage: 1,
    agents: ['orchestrator', 'code-generator', 'test-writer'],
    features: [
      'Basic agents',
      'Community support',
      'Public workspaces',
      'Standard queue'
    ],
    limits: {
      parallelJobs: 1,
      queuePriority: 0,
      customAgents: 0,
      teamMembers: 1
    }
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    credits: 1000000,
    storage: 50,
    agents: [
      'orchestrator', 'code-generator', 'test-writer', 'security-auditor',
      'ui-architect', 'database-expert', 'api-designer', 'performance-optimizer',
      'code-reviewer', 'documentation-writer', 'refactoring-specialist', 'bug-hunter'
    ],
    features: [
      'All 12 agents',
      'Priority support',
      'Private workspaces',
      'Priority queue',
      'Advanced analytics',
      'Custom agent templates'
    ],
    limits: {
      parallelJobs: 5,
      queuePriority: 1,
      customAgents: 3,
      teamMembers: 1
    }
  },
  
  team: {
    id: 'team',
    name: 'Team',
    price: 149,
    credits: 5000000,
    storage: 500,
    agents: [
      'orchestrator', 'code-generator', 'test-writer', 'security-auditor',
      'ui-architect', 'database-expert', 'api-designer', 'performance-optimizer',
      'code-reviewer', 'documentation-writer', 'refactoring-specialist', 'bug-hunter',
      'devops-manager', 'mobile-specialist', 'integration-tester', 'deployment-manager'
    ],
    features: [
      'All agents + team agents',
      'Team collaboration',
      'Shared workspaces',
      'High priority queue',
      'Team analytics',
      'Custom workflows',
      'Slack integration',
      'Advanced permissions'
    ],
    limits: {
      parallelJobs: 15,
      queuePriority: 2,
      customAgents: 10,
      teamMembers: 10
    }
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1, // Custom pricing
    credits: -1, // Unlimited
    storage: -1, // Unlimited
    agents: ['*'], // All agents
    features: [
      'Unlimited everything',
      'AWS Bedrock native',
      'Dedicated infrastructure',
      'Custom SLA',
      '24/7 dedicated support',
      'Custom agent development',
      'On-premise deployment',
      'Advanced security',
      'Audit logs',
      'SSO integration'
    ],
    limits: {
      parallelJobs: -1, // Unlimited
      queuePriority: 3,
      customAgents: -1, // Unlimited
      teamMembers: -1 // Unlimited
    }
  }
};

export const AGENT_CREDIT_COSTS = {
  // Core agents (Free tier)
  'orchestrator': 10,
  'code-generator': 50,
  'test-writer': 30,
  
  // Pro agents
  'security-auditor': 100,
  'ui-architect': 75,
  'database-expert': 60,
  'api-designer': 80,
  'performance-optimizer': 120,
  'code-reviewer': 40,
  'documentation-writer': 25,
  'refactoring-specialist': 65,
  'bug-hunter': 85,
  
  // Team agents
  'devops-manager': 150,
  'mobile-specialist': 200,
  'integration-tester': 90,
  'deployment-manager': 180,
  
  // Enterprise agents
  'data-scientist': 300,
  'blockchain-developer': 400,
  'ml-engineer': 350,
  'cloud-architect': 250,
  'compliance-auditor': 200,
  'custom-agent': 100 // Base cost for custom agents
};

export function getUserTier(userId: string): Promise<SubscriptionTier> {
  // This would fetch from your database
  // For now, return starter tier
  return Promise.resolve(SUBSCRIPTION_TIERS.starter);
}

export function canUserAccessAgent(userTier: SubscriptionTier, agentId: string): boolean {
  if (userTier.agents.includes('*')) return true;
  return userTier.agents.includes(agentId);
}

export function calculateJobCost(agentId: string, inputTokens: number, outputTokens: number): number {
  const baseCost = AGENT_CREDIT_COSTS[agentId] || 50;
  const tokenCost = Math.ceil((inputTokens + outputTokens) / 1000) * 2; // 2 credits per 1K tokens
  return baseCost + tokenCost;
}