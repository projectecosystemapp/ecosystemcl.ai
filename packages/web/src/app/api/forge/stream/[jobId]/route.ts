import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Server-Sent Events for real-time job output streaming
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

  const { jobId } = await context.params;

    // 2. Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // 3. Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    });

    // 4. Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial connection event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'connected', 
            jobId, 
            status: job.status 
          })}\n\n`)
        );

        // Subscribe to job_logs changes using Supabase Realtime
        const channel = supabase
          .channel(`job-logs-${jobId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'job_logs',
              filter: `job_id=eq.${jobId}`,
            },
            (payload) => {
              // Send new log entry as SSE
              const log = payload.new;
              
              let eventData = {
                type: 'log',
                timestamp: log.timestamp || log.created_at,
                message: log.message,
              };

              // Handle structured log blocks
              if (log.is_structured && log.block_type === 'LOG_BLOCK') {
                eventData = {
                  type: 'LOG_BLOCK',
                  block: log.block_data,
                  agentName: job.args?.agentName || 'Agent',
                };
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`)
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'jobs',
              filter: `id=eq.${jobId}`,
            },
            (payload) => {
              // Send job status updates
              const updatedJob = payload.new;
              
              const statusEvent = {
                type: 'status',
                status: updatedJob.status,
                error: updatedJob.error,
                result: updatedJob.result,
                completedAt: updatedJob.completed_at,
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(statusEvent)}\n\n`)
              );

              // Close stream if job is completed or failed
              if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
                setTimeout(() => {
                  channel.unsubscribe();
                  controller.close();
                }, 1000);
              }
            }
          )
          .subscribe();

        // Send existing logs if job is already running
        if (job.status === 'running' || job.status === 'completed') {
          const { data: existingLogs, error: logsError } = await supabase
            .from("job_logs")
            .select("*")
            .eq("job_id", jobId)
            .order("created_at", { ascending: true });

          if (!logsError && existingLogs) {
            for (const log of existingLogs) {
              if (log.is_structured && log.block_type === 'LOG_BLOCK') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'LOG_BLOCK',
                    block: log.block_data,
                    agentName: job.args?.agentName || 'Agent',
                  })}\n\n`)
                );
              } else {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'log',
                    timestamp: log.timestamp || log.created_at,
                    message: log.message,
                  })}\n\n`)
                );
              }
            }
          }
        }

        // Heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`:heartbeat\n\n`));
          } catch (e) {
            // Stream closed, clean up
            clearInterval(heartbeat);
            channel.unsubscribe();
          }
        }, 30000); // 30 seconds

        // Clean up on abort
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          channel.unsubscribe();
          controller.close();
        });
      },
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error("[Stream API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}