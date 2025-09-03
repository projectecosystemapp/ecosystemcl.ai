import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { calculateBidPower, bidPowerToQueuePriority } from '@/lib/bidding';

// Initialize BullMQ connection
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const agentQueue = new Queue('agent-jobs', {
  connection: redisConnection,
});

interface AgentExecutionRequest {
  agentName: string;
  taskPrompt: string;
  context?: {
    files?: string[];
    workingDirectory?: string;
    sessionId?: string;
  };
  authMethod: 'platform' | 'byok'; // Platform-hosted or Bring Your Own Key
  modelProvider?: 'openai' | 'claude' | 'together' | 'groq';
  modelName?: string;
  streaming?: boolean;
  priority?: number;
  timeout?: number;
  budget?: number;
}

export async function POST(request: Request) {
  try {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please login with 'forge auth' from CLI" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: AgentExecutionRequest = await request.json();
    const { 
      agentName, 
      taskPrompt, 
      context,
      authMethod = 'platform',
      modelProvider,
      modelName,
      streaming = true,
      priority = 0,
      timeout = 900,
      budget = 0
    } = body;

    // 3. Validate required fields
    if (!agentName || !taskPrompt) {
      return NextResponse.json(
        { error: "Missing required fields: agentName and taskPrompt" },
        { status: 400 }
      );
    }

  // 4. Check user's tier and credits
  let { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("tier, credits, api_keys")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile) {
      // Create default profile if doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          tier: "free",
          credits: 1000, // Initial free credits
          api_keys: {}
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }
      userProfile = newProfile;
    }

    // 5. Validate auth method and available resources
    if (authMethod === 'platform') {
      // Check if user has enough credits
      if (userProfile?.credits <= 0) {
        return NextResponse.json(
          { error: "Insufficient credits. Please upgrade your plan or add credits." },
          { status: 402 }
        );
      }
    } else if (authMethod === 'byok') {
      // Check if user has API keys configured
      if (!userProfile?.api_keys || Object.keys(userProfile.api_keys).length === 0) {
        return NextResponse.json(
          { error: "No API keys configured. Please add your API keys in settings." },
          { status: 400 }
        );
      }
    }

    // 6. Get service connections for the user
    const { data: connections, error: connError } = await supabase
      .from("service_connections")
      .select("service, encrypted_credentials, is_active")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (connError) {
      console.error("[Agent API] Failed to fetch connections:", connError);
    }

    // 7. Compute bid power and create job record
    const userTier = (userProfile?.tier || 'free') as 'free' | 'premium' | 'enterprise';
    const bidPower = calculateBidPower({ tier: userTier, allocatedCredits: budget, currentLoadFactor: 0.5 });

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        command: 'agent',
        args: {
          agentName,
          taskPrompt,
          context,
          authMethod,
          modelProvider: modelProvider || (authMethod === 'platform' ? 'together' : 'claude'),
          modelName: modelName || (authMethod === 'platform' ? 'meta-llama/Llama-3.3-70B-Instruct-Turbo' : 'claude-opus-4-1-20250805'),
        },
        description: `Execute ${agentName} agent`,
        status: "queued",
        priority: priority ?? bidPowerToQueuePriority(bidPower),
        bid_power: bidPower,
        timeout_seconds: timeout,
        metadata: {
          request_ip: request.headers.get("x-forwarded-for"),
          user_agent: request.headers.get("user-agent"),
          auth_method: authMethod,
          service_connections: connections?.map(c => c.service) || [],
          streaming_enabled: streaming,
          budget,
          bid_power: bidPower,
        },
      })
      .select()
      .single();

    if (jobError) {
      console.error("[Agent API] Failed to create job:", jobError);
      return NextResponse.json(
        { error: "Failed to queue agent job", details: jobError.message },
        { status: 500 }
      );
    }

    // 8. Queue the job for processing
    await agentQueue.add('execute-agent', 
      { 
        jobId: job.id,
        userId,
        agentConfig: {
          name: agentName,
          taskPrompt,
          context,
          authMethod,
          modelProvider: modelProvider || (authMethod === 'platform' ? 'together' : 'claude'),
          modelName: modelName || (authMethod === 'platform' ? 'meta-llama/Llama-3.3-70B-Instruct-Turbo' : 'claude-opus-4-1-20250805'),
        },
        connections: connections || [],
      },
      {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        priority: priority ?? bidPowerToQueuePriority(bidPower),
      }
    );
    
    console.log(`[Agent API] Job ${job.id} queued for user ${userId}, agent: ${agentName}`);

    // 9. Deduct credits if using platform auth (will be refunded if job fails)
    if (authMethod === 'platform' && userProfile) {
      const newCredits = Math.max((userProfile.credits ?? 0) - 10, 0);
      await supabase
        .from("user_profiles")
        .update({ 
          credits: newCredits
        })
        .eq("user_id", userId);
    }

    // 10. Return job details with streaming endpoint
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        agentName,
        taskPrompt,
        queuedAt: job.queued_at,
      },
      streaming: streaming ? {
        url: `/api/forge/stream/${job.id}`,
        protocol: 'sse', // Server-Sent Events
      } : null,
      bidPower,
      message: streaming 
        ? "Agent job queued. Connect to streaming endpoint for real-time output."
        : "Agent job queued. Poll the status endpoint for updates.",
    });

  } catch (error) {
    console.error("[Agent API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Check agent job status and retrieve logs
export async function GET(request: Request) {
  try {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const includeLogBlocks = searchParams.get("blocks") === "true";

    if (!jobId) {
      // Return list of recent agent jobs
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", userId)
        .eq("command", "agent")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch agent jobs" },
          { status: 500 }
        );
      }

      return NextResponse.json({ jobs });
    }

    // Return specific job details with logs
  const query = supabase
      .from("jobs")
      .select(`
        *,
        job_logs (
          id,
          log_type,
          message,
          is_structured,
          block_type,
          block_data,
          timestamp,
          created_at
        )
      `)
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    const { data: job, error } = await query;

    if (error || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Parse structured log blocks if requested
    if (includeLogBlocks && job.job_logs) {
      const logBlocks = (job.job_logs as any[])
        .filter((log: any) => log.is_structured && log.block_type === 'LOG_BLOCK')
        .map((log: any) => ({
          ...log.block_data,
          timestamp: log.timestamp,
        }))
        .sort((a: any, b: any) => a.number - b.number);

      return NextResponse.json({ 
        job: {
          ...job,
          logBlocks,
        }
      });
    }

    return NextResponse.json({ job });

  } catch (error) {
    console.error("[Agent API] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Cancel an agent job
export async function DELETE(request: Request) {
  try {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID required" },
        { status: 400 }
      );
    }

    // Verify ownership and cancel
    const { data: job, error } = await supabase
      .from("jobs")
      .update({ 
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("user_id", userId)
      .eq("status", "queued")
      .select()
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: "Job not found or already processed" },
        { status: 404 }
      );
    }

    // Refund credits if platform auth was used
    if (job.metadata?.auth_method === 'platform') {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("credits")
        .eq("user_id", userId)
        .single();

      const currentCredits = profile?.credits ?? 0;
      await supabase
        .from("user_profiles")
        .update({ credits: currentCredits + 10 })
        .eq("user_id", userId);
    }

    return NextResponse.json({ 
      success: true,
      message: "Job cancelled successfully",
      job,
    });

  } catch (error) {
    console.error("[Agent API] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
