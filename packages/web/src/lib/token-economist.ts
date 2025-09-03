import { supabase } from './supabase';

export interface CostConstraints {
  maxCredits: number;
  preferredModels: string[];
  forbiddenModels: string[];
  cachingStrategy: 'aggressive' | 'moderate' | 'minimal';
  parallelismLevel: number;
}

export class TokenEconomistAgent {
  async analyzeAndConstrain(goal: string, userId: string): Promise<CostConstraints> {
    // Get user's current credit balance and tier
    const userProfile = await this.getUserProfile(userId);
    const goalComplexity = await this.assessGoalComplexity(goal);
    const historicalCosts = await this.getHistoricalCosts(userId, goal);
    
    return this.generateConstraints(userProfile, goalComplexity, historicalCosts);
  }

  private async getUserProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('credits_remaining, subscription_tier, monthly_usage')
      .eq('user_id', userId)
      .single();
    
    return data;
  }

  private async assessGoalComplexity(goal: string): Promise<'simple' | 'moderate' | 'complex'> {
    const complexityKeywords = {
      simple: ['fix', 'update', 'change', 'modify', 'refactor'],
      moderate: ['build', 'create', 'implement', 'add', 'integrate'],
      complex: ['design', 'architect', 'migrate', 'optimize', 'deploy']
    };

    const goalLower = goal.toLowerCase();
    
    if (complexityKeywords.complex.some(keyword => goalLower.includes(keyword))) {
      return 'complex';
    }
    if (complexityKeywords.moderate.some(keyword => goalLower.includes(keyword))) {
      return 'moderate';
    }
    return 'simple';
  }

  private async getHistoricalCosts(userId: string, goal: string) {
    const { data } = await supabase
      .from('jobs')
      .select('credits_used, command')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(10);
    
    const similarJobs = data?.filter(job => 
      this.calculateSimilarity(job.command, goal) > 0.7
    ) || [];
    
    const avgCost = similarJobs.length > 0 
      ? similarJobs.reduce((sum, job) => sum + job.credits_used, 0) / similarJobs.length
      : null;
    
    return { avgCost, sampleSize: similarJobs.length };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity - in production use proper NLP
    const words1 = new Set(text1.toLowerCase().split(' '));
    const words2 = new Set(text2.toLowerCase().split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private generateConstraints(
    userProfile: any, 
    complexity: string, 
    historical: any
  ): CostConstraints {
    const baseConstraints = this.getBaseConstraints(userProfile.subscription_tier);
    
    // Adjust based on remaining credits
    const creditRatio = userProfile.credits_remaining / this.getMonthlyAllowance(userProfile.subscription_tier);
    
    if (creditRatio < 0.1) {
      // User is low on credits - be very conservative
      return {
        ...baseConstraints,
        maxCredits: Math.min(baseConstraints.maxCredits, userProfile.credits_remaining * 0.5),
        preferredModels: ['claude-3-haiku', 'gpt-3.5-turbo'],
        forbiddenModels: ['claude-3-opus', 'gpt-4'],
        cachingStrategy: 'aggressive',
        parallelismLevel: 1
      };
    }
    
    if (creditRatio < 0.3) {
      // User is moderately low - be conservative
      return {
        ...baseConstraints,
        maxCredits: Math.min(baseConstraints.maxCredits, userProfile.credits_remaining * 0.2),
        preferredModels: ['claude-3-sonnet', 'gpt-4o-mini'],
        forbiddenModels: ['claude-3-opus'],
        cachingStrategy: 'aggressive',
        parallelismLevel: 2
      };
    }
    
    // User has plenty of credits - optimize for quality
    const complexityMultiplier = {
      simple: 0.5,
      moderate: 1.0,
      complex: 2.0
    }[complexity];
    
    return {
      ...baseConstraints,
      maxCredits: baseConstraints.maxCredits * complexityMultiplier,
      preferredModels: complexity === 'complex' 
        ? ['claude-3-opus', 'gpt-4'] 
        : ['claude-3-sonnet', 'gpt-4o'],
      forbiddenModels: [],
      cachingStrategy: 'moderate',
      parallelismLevel: complexity === 'complex' ? 3 : 5
    };
  }

  private getBaseConstraints(tier: string): CostConstraints {
    const tierConstraints = {
      starter: {
        maxCredits: 1000,
        preferredModels: ['claude-3-haiku'],
        forbiddenModels: ['claude-3-opus', 'gpt-4'],
        cachingStrategy: 'aggressive' as const,
        parallelismLevel: 1
      },
      pro: {
        maxCredits: 10000,
        preferredModels: ['claude-3-sonnet', 'gpt-4o'],
        forbiddenModels: [],
        cachingStrategy: 'moderate' as const,
        parallelismLevel: 3
      },
      team: {
        maxCredits: 50000,
        preferredModels: ['claude-3-opus', 'gpt-4'],
        forbiddenModels: [],
        cachingStrategy: 'moderate' as const,
        parallelismLevel: 5
      },
      enterprise: {
        maxCredits: 100000,
        preferredModels: ['claude-3-opus', 'gpt-4'],
        forbiddenModels: [],
        cachingStrategy: 'minimal' as const,
        parallelismLevel: 10
      }
    };
    
    return tierConstraints[tier] || tierConstraints.starter;
  }

  private getMonthlyAllowance(tier: string): number {
    const allowances = {
      starter: 10000,
      pro: 1000000,
      team: 5000000,
      enterprise: 10000000
    };
    
    return allowances[tier] || allowances.starter;
  }

  async generateDirective(constraints: CostConstraints, goal: string): Promise<string> {
    return `
DIRECTIVE FOR MCP PLANNER:

Goal: ${goal}
Budget Constraint: Maximum ${constraints.maxCredits.toLocaleString()} credits for entire operation.

MODEL RESTRICTIONS:
- Preferred Models: ${constraints.preferredModels.join(', ')}
- Forbidden Models: ${constraints.forbiddenModels.join(', ')}
- Caching Strategy: ${constraints.cachingStrategy}
- Max Parallel Jobs: ${constraints.parallelismLevel}

OPTIMIZATION RULES:
1. ALWAYS check cache before creating new jobs
2. Use ResearchAgent with free web-enabled models for information gathering
3. Batch similar operations to maximize efficiency
4. Prefer incremental approaches over monolithic solutions
5. If budget is exceeded, generate alternative lower-cost plan

COST MONITORING:
- Track credits in real-time during execution
- Halt execution if 90% of budget is consumed
- Generate cost report with breakdown by agent and model
    `.trim();
  }
}