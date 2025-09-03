import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const body = await request.json();
  const { resourceArn, logsGroupName, provider = 'aws', metadata = {} } = body || {};
  if (!resourceArn) {
    return NextResponse.json({ error: 'resourceArn is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('monitoring_subscriptions')
    .insert({ user_id: userId, resource_arn: resourceArn, logs_group_name: logsGroupName, provider, metadata })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, subscription: data });
}

