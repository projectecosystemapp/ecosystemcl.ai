import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { TokenEconomistAgent } from "@/lib/token-economist";
import { MCPServer } from "@/lib/mcp-server";
import { SocraticPreprocessor } from "@/lib/socratic-preprocessor";
import { calculateBidPower } from "@/lib/bidding";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function POST(request: NextRequest) {
  try {
    // Try CLI token authentication first, then fall back to Clerk
    let userId: string | null = null;
    
    const cliAuth = await authenticateRequest(request);
    if (cliAuth) {
      userId = cliAuth.userId;
    } else {
      const clerkAuth = await auth();
      userId = clerkAuth.userId;
    }
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { goal, workspaceId, executionMode = 'mcp', budget = 0, autoRefine = false } = body;

    if (!goal) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    // Step 0: Socratic Pre-Processor (strategic partner)
    const pre = new SocraticPreprocessor();
    const preResult = await pre.analyze(userId, goal);
    if (!preResult.accepted && !autoRefine) {
      return NextResponse.json({
        success: false,
        requiresUserDecision: true,
        message: 'A potentially superior goal was identified. Confirm to proceed with refinement or set autoRefine=true.',
        preprocessor: preResult
      }, { status: 202 });
    }
    const finalGoal = preResult.proposedGoal && (autoRefine) ? preResult.proposedGoal : goal;

    // Step 1: Token Economist Analysis
    console.log(`[MCP] Starting Token Economist analysis for user ${userId}`);
    const tokenEconomist = new TokenEconomistAgent();
    const constraints = await tokenEconomist.analyzeAndConstrain(finalGoal, userId);
    const directive = await tokenEconomist.generateDirective(constraints, finalGoal);

    console.log(`[MCP] Generated constraints:`, {
      maxCredits: constraints.maxCredits,
      preferredModels: constraints.preferredModels,
      cachingStrategy: constraints.cachingStrategy
    });

    // Step 2: Get workspace state
    const workspaceState = workspaceId ? await getWorkspaceState(workspaceId) : {};

    // Step 3: MCP Plan Generation
    console.log(`[MCP] Generating execution plans`);
    const mcpServer = new MCPServer();
    const plans = await mcpServer.generatePlans(finalGoal, workspaceState, constraints);

    if (plans.length === 0) {
      return NextResponse.json({
        error: "No viable execution plans could be generated",
        constraints,
        directive
      }, { status: 400 });
    }

    // Step 4: Select best plan (highest confidence)
    const selectedPlan = plans[0];
    console.log(`[MCP] Selected plan: ${selectedPlan.id} (confidence: ${selectedPlan.confidence})`);

    // Step 5: Store plan in database
    const { data: storedPlan, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        goal: finalGoal,
        plan_type: selectedPlan.id.includes('fast') ? 'fast' : 
                   selectedPlan.id.includes('thorough') ? 'thorough' : 'novel',
        estimated_cost: selectedPlan.estimatedCost,
        estimated_time: selectedPlan.estimatedTime,
        risk_score: selectedPlan.riskScore,
        confidence_score: selectedPlan.confidence,
        constraints: constraints,
        status: 'approved'
      })
      .select()
      .single();

    if (planError) {
      console.error('[MCP] Failed to store plan:', planError);
      return NextResponse.json({
        error: "Failed to store execution plan",
        details: planError.message
      }, { status: 500 });
    }

    // Step 6: Store plan steps
    for (const step of selectedPlan.steps) {
      await supabase.from('plan_steps').insert({
        plan_id: storedPlan.id,
        step_order: selectedPlan.steps.indexOf(step),
        agent_id: step.agentId,
        task: step.task,
        dependencies: step.dependencies,
        auth_config_id: step.authConfigId,
        estimated_credits: step.estimatedCredits,
        allowed_tools: step.tools,
        status: 'pending'
      });
    }

    // Step 7: Execute plan
    if (executionMode === 'immediate') {
      await mcpServer.executePlan(storedPlan.id, userId);
    }

    console.log(`[MCP] Plan ${storedPlan.id} created and ${executionMode === 'immediate' ? 'executing' : 'queued'}`);

    return NextResponse.json({
      success: true,
      plan: {
        id: storedPlan.id,
        goal: finalGoal,
        type: storedPlan.plan_type,
        estimatedCost: storedPlan.estimated_cost,
        estimatedTime: storedPlan.estimated_time,
        confidence: storedPlan.confidence_score,
        riskScore: storedPlan.risk_score,
        steps: selectedPlan.steps.length,
        status: storedPlan.status
      },
      constraints: {
        maxCredits: constraints.maxCredits,
        preferredModels: constraints.preferredModels,
        cachingStrategy: constraints.cachingStrategy
      },
      alternatives: plans.slice(1).map(p => ({
        id: p.id,
        type: p.id.includes('fast') ? 'fast' : p.id.includes('thorough') ? 'thorough' : 'novel',
        estimatedCost: p.estimatedCost,
        estimatedTime: p.estimatedTime,
        confidence: p.confidence,
        riskScore: p.riskScore
      })),
      streaming: {
        url: `/api/forge/plans/${storedPlan.id}/stream`,
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream'
        }
      },
      bidPower: calculateBidPower({ tier: 'premium', allocatedCredits: budget, currentLoadFactor: 0.5 }),
      message: "Execution plan generated successfully. MCP is coordinating agent deployment."
    });

  } catch (error: any) {
    console.error("[MCP] Unexpected error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error.message
    }, { status: 500 });
  }
}

async function getWorkspaceState(workspaceId: string) {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select(`
      *,
      jobs!inner(status, command, completed_at)
    `)
    .eq('id', workspaceId)
    .single();

  if (!workspace) return {};

  const recentJobs = workspace.jobs
    .filter((job: any) => job.status === 'completed')
    .slice(-10);

  return {
    workspaceId,
    recentActivity: recentJobs,
    lastActivity: recentJobs[0]?.completed_at,
    commonPatterns: extractCommonPatterns(recentJobs)
  };
}

function extractCommonPatterns(jobs: any[]) {
  const commands = jobs.map(job => job.command);
  const patterns: Record<string, number> = {};
  
  commands.forEach(cmd => {
    patterns[cmd] = (patterns[cmd] || 0) + 1;
  });
  
  return Object.entries(patterns)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([pattern, count]) => ({ pattern, count }));
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      // Return user's recent plans
      const { data: plans, error } = await supabase
        .from('plans')
        .select(`
          *,
          plan_steps(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
      }

      return NextResponse.json({ plans });
    }

    // Return specific plan details
    const { data: plan, error } = await supabase
      .from('plans')
      .select(`
        *,
        plan_steps(*),
        jobs(*)
      `)
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (error || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ plan });

  } catch (error: any) {
    console.error("[MCP] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
