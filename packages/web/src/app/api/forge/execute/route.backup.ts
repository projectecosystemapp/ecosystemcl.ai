import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Initialize BullMQ connection
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const forgeQueue = new Queue('forge-jobs', {
  connection: redisConnection,
});

// Professional job queue API - no direct execution
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const { command, args, workspaceId, description } = body;

    if (!command) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    // Validate command whitelist
    const allowedCommands = ["audit", "task", "migrate", "sessions", "agents"];
    if (!allowedCommands.includes(command)) {
      return NextResponse.json(
        { error: `Invalid command. Allowed: ${allowedCommands.join(", ")}` },
        { status: 400 }
      );
    }

    // 3. Verify workspace ownership
    if (workspaceId) {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("id", workspaceId)
        .eq("user_id", userId)
        .single();

      if (workspaceError || !workspace) {
        return NextResponse.json(
          { error: "Invalid workspace" },
          { status: 403 }
        );
      }
    }

    // 4. Create job in queue (NOT execute it)
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        workspace_id: workspaceId || null,
        command,
        args: args || {},
        description: description || `Execute forge ${command}`,
        status: "queued",
        priority: body.priority || 0,
        timeout_seconds: body.timeout || 300,
        metadata: {
          request_ip: request.headers.get("x-forwarded-for"),
          user_agent: request.headers.get("user-agent"),
        },
      })
      .select()
      .single();

    if (jobError) {
      console.error("[API] Failed to create job:", jobError);
      return NextResponse.json(
        { error: "Failed to queue job", details: jobError.message },
        { status: 500 }
      );
    }

    // 5. Trigger worker by adding job to BullMQ
    await forgeQueue.add('execute-forge-command', 
      { jobId: job.id },
      {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
    
    console.log(`[API] Job ${job.id} queued for user ${userId}`);

    // 6. Return job details for polling/WebSocket connection
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        command: job.command,
        args: job.args,
        queuedAt: job.queued_at,
      },
      message: "Job queued successfully. Connect to WebSocket for real-time updates.",
      websocketUrl: `/api/forge/stream/${job.id}`, // Future WebSocket endpoint
    });

  } catch (error: any) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Check job status
export async function GET(request: Request) {
  try {
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
      // Return list of user's jobs
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch jobs" },
          { status: 500 }
        );
      }

      return NextResponse.json({ jobs });
    }

    // Return specific job details
    const { data: job, error } = await supabase
      .from("jobs")
      .select(`
        *,
        job_logs (
          log_type,
          message,
          is_structured,
          block_type,
          timestamp
        )
      `)
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });

  } catch (error: any) {
    console.error("[API] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}