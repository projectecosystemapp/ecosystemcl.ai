import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const planId = params.planId;

    // Verify the plan belongs to the user
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Set up SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          plan: {
            id: plan.id,
            goal: plan.goal,
            status: plan.status,
            type: plan.plan_type
          }
        })}\n\n`));

        // Set up real-time subscription for plan updates
        const channel = supabase
          .channel(`plan-${planId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'plan_steps',
              filter: `plan_id=eq.${planId}`
            },
            (payload) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'step_update',
                step: payload.new
              })}\n\n`));
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'jobs',
              filter: `plan_id=eq.${planId}`
            },
            (payload) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'job_update',
                job: payload.new
              })}\n\n`));
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'plans',
              filter: `id=eq.${planId}`
            },
            (payload) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'plan_update',
                plan: payload.new
              })}\n\n`));

              // If plan is completed or failed, close the stream
              if (payload.new.status === 'completed' || payload.new.status === 'failed') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'complete',
                  status: payload.new.status,
                  message: payload.new.status === 'completed' 
                    ? 'Plan execution completed successfully'
                    : 'Plan execution failed'
                })}\n\n`));
                
                setTimeout(() => {
                  controller.close();
                  channel.unsubscribe();
                }, 1000);
              }
            }
          )
          .subscribe();

        // Send current state of all steps
        const { data: steps } = await supabase
          .from('plan_steps')
          .select('*')
          .eq('plan_id', planId)
          .order('step_order', { ascending: true });

        if (steps) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'initial_state',
            steps: steps
          })}\n\n`));
        }

        // Keep connection alive with periodic pings
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch (e) {
            clearInterval(pingInterval);
          }
        }, 30000);

        // Clean up on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval);
          channel.unsubscribe();
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: any) {
    console.error('[SSE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}