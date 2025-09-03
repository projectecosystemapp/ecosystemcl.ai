import { supabase } from './supabase';

export interface Plan {
  id: string;
  steps: PlanStep[];
  estimatedCost: number;
  estimatedTime: number;
  riskScore: number;
  confidence: number;
}

export interface PlanStep {
  id: string;
  agentId: string;
  task: string;
  dependencies: string[];
  authConfigId?: string;
  estimatedCredits: number;
  tools: string[];
}

export class MCPServer {
  async generatePlans(goal: string, workspaceState: any, constraints: any): Promise<Plan[]> {
    const planner = new PlannerAgent();
    const plans = await planner.generateMultiplePlans(goal, workspaceState, constraints);
    
    const critic = new CriticAgent();
    const scoredPlans = await Promise.all(
      plans.map(plan => critic.evaluatePlan(plan, constraints))
    );
    
    return scoredPlans.sort((a, b) => b.confidence - a.confidence);
  }

  async executePlan(planId: string, userId: string): Promise<void> {
    const executor = new ExecutorAgent();
    await executor.dispatchPlan(planId, userId);
  }
}

class PlannerAgent {
  async generateMultiplePlans(goal: string, workspaceState: any, constraints: any): Promise<Plan[]> {
    // Generate 3 different approaches
    const fastPlan = await this.generateFastPlan(goal, constraints);
    const thoroughPlan = await this.generateThoroughPlan(goal, constraints);
    const novelPlan = await this.generateNovelPlan(goal, constraints);
    
    return [fastPlan, thoroughPlan, novelPlan];
  }

  private async generateFastPlan(goal: string, constraints: any): Promise<Plan> {
    // Prioritize speed and minimal steps
    return {
      id: `fast-${Date.now()}`,
      steps: await this.optimizeForSpeed(goal),
      estimatedCost: 1000,
      estimatedTime: 300, // 5 minutes
      riskScore: 0.3,
      confidence: 0.8
    };
  }

  private async generateThoroughPlan(goal: string, constraints: any): Promise<Plan> {
    // Prioritize quality and comprehensive testing
    return {
      id: `thorough-${Date.now()}`,
      steps: await this.optimizeForQuality(goal),
      estimatedCost: 3000,
      estimatedTime: 900, // 15 minutes
      riskScore: 0.1,
      confidence: 0.9
    };
  }

  private async generateNovelPlan(goal: string, constraints: any): Promise<Plan> {
    // Try innovative approaches
    return {
      id: `novel-${Date.now()}`,
      steps: await this.optimizeForInnovation(goal),
      estimatedCost: 2000,
      estimatedTime: 600, // 10 minutes
      riskScore: 0.5,
      confidence: 0.7
    };
  }

  private async optimizeForSpeed(goal: string): Promise<PlanStep[]> {
    return [
      {
        id: 'research-1',
        agentId: 'research-agent',
        task: `Research: ${goal}`,
        dependencies: [],
        estimatedCredits: 50,
        tools: ['web_search']
      },
      {
        id: 'code-1',
        agentId: 'code-generator',
        task: `Generate code for: ${goal}`,
        dependencies: ['research-1'],
        estimatedCredits: 200,
        tools: ['file_write']
      }
    ];
  }

  private async optimizeForQuality(goal: string): Promise<PlanStep[]> {
    return [
      {
        id: 'research-1',
        agentId: 'research-agent',
        task: `Research: ${goal}`,
        dependencies: [],
        estimatedCredits: 50,
        tools: ['web_search']
      },
      {
        id: 'code-1',
        agentId: 'code-generator',
        task: `Generate code for: ${goal}`,
        dependencies: ['research-1'],
        estimatedCredits: 300,
        tools: ['file_write']
      },
      {
        id: 'test-1',
        agentId: 'test-writer',
        task: 'Write comprehensive tests',
        dependencies: ['code-1'],
        estimatedCredits: 150,
        tools: ['file_write']
      },
      {
        id: 'security-1',
        agentId: 'security-auditor',
        task: 'Security audit',
        dependencies: ['code-1'],
        estimatedCredits: 200,
        tools: ['file_read']
      }
    ];
  }

  private async optimizeForInnovation(goal: string): Promise<PlanStep[]> {
    return [
      {
        id: 'research-1',
        agentId: 'research-agent',
        task: `Research latest approaches: ${goal}`,
        dependencies: [],
        estimatedCredits: 100,
        tools: ['web_search']
      },
      {
        id: 'architect-1',
        agentId: 'ui-architect',
        task: 'Design innovative architecture',
        dependencies: ['research-1'],
        estimatedCredits: 250,
        tools: ['file_write']
      },
      {
        id: 'code-1',
        agentId: 'code-generator',
        task: 'Implement innovative solution',
        dependencies: ['architect-1'],
        estimatedCredits: 300,
        tools: ['file_write']
      }
    ];
  }
}

class CriticAgent {
  async evaluatePlan(plan: Plan, constraints: any): Promise<Plan> {
    const riskFactors = this.assessRiskFactors(plan);
    const costEfficiency = this.assessCostEfficiency(plan, constraints);
    const feasibility = this.assessFeasibility(plan);
    
    const adjustedPlan = { ...plan };
    adjustedPlan.riskScore = riskFactors;
    adjustedPlan.confidence = (costEfficiency + feasibility) / 2;
    
    return adjustedPlan;
  }

  private assessRiskFactors(plan: Plan): number {
    let risk = 0;
    
    // Complex dependency chains increase risk
    const maxDependencies = Math.max(...plan.steps.map(s => s.dependencies.length));
    risk += maxDependencies * 0.1;
    
    // High-cost steps increase risk
    const avgCost = plan.estimatedCost / plan.steps.length;
    if (avgCost > 200) risk += 0.2;
    
    // Novel agents increase risk
    const novelAgents = plan.steps.filter(s => 
      ['ui-architect', 'performance-optimizer'].includes(s.agentId)
    ).length;
    risk += novelAgents * 0.15;
    
    return Math.min(risk, 1.0);
  }

  private assessCostEfficiency(plan: Plan, constraints: any): number {
    if (!constraints.maxCredits) return 0.8;
    
    const efficiency = 1 - (plan.estimatedCost / constraints.maxCredits);
    return Math.max(0, Math.min(1, efficiency));
  }

  private assessFeasibility(plan: Plan): number {
    // Check for circular dependencies
    const hasCycles = this.detectCycles(plan.steps);
    if (hasCycles) return 0.1;
    
    // Check for reasonable step count
    if (plan.steps.length > 10) return 0.6;
    if (plan.steps.length < 2) return 0.7;
    
    return 0.9;
  }

  private detectCycles(steps: PlanStep[]): boolean {
    // Simple cycle detection - in production would use proper graph algorithms
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const step of steps) {
      if (this.hasCycleDFS(step, steps, visited, recursionStack)) {
        return true;
      }
    }
    return false;
  }

  private hasCycleDFS(step: PlanStep, allSteps: PlanStep[], visited: Set<string>, recursionStack: Set<string>): boolean {
    visited.add(step.id);
    recursionStack.add(step.id);
    
    for (const depId of step.dependencies) {
      const depStep = allSteps.find(s => s.id === depId);
      if (!depStep) continue;
      
      if (!visited.has(depId)) {
        if (this.hasCycleDFS(depStep, allSteps, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(depId)) {
        return true;
      }
    }
    
    recursionStack.delete(step.id);
    return false;
  }
}

class ExecutorAgent {
  async dispatchPlan(planId: string, userId: string): Promise<void> {
    const { data: plan } = await supabase
      .from('plans')
      .select('*, plan_steps(*)')
      .eq('id', planId)
      .single();
    
    if (!plan) throw new Error('Plan not found');
    
    // Create jobs for each step
    for (const step of plan.plan_steps) {
      await supabase.from('jobs').insert({
        user_id: userId,
        plan_id: planId,
        step_id: step.id,
        agent_id: step.agent_id,
        command: step.task,
        auth_config_id: step.auth_config_id,
        estimated_credits: step.estimated_credits,
        status: 'queued',
        dependencies: step.dependencies
      });
    }
  }
}