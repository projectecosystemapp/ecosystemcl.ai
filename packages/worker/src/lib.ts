import { createClient } from '@supabase/supabase-js';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'REDIS_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Supabase client with service role for admin access
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Redis connection for BullMQ
export const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`[Redis] Reconnecting... attempt ${times}`);
    return delay;
  }
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

// Helper to update job status
export async function updateJobStatus(
  jobId: string, 
  status: 'preparing' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout',
  additionalData?: Record<string, any>
) {
  const updateData: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (status === 'running' || status === 'preparing') {
    updateData.started_at = updateData.started_at || new Date().toISOString();
  }
  
  if (status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'timeout') {
    updateData.completed_at = new Date().toISOString();
  }
  
  if (additionalData) {
    Object.assign(updateData, additionalData);
  }
  
  const { error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId);
    
  if (error) {
    console.error(`[Supabase] Failed to update job ${jobId} status:`, error);
    throw error;
  }
  
  console.log(`[Job ${jobId}] Status updated to: ${status}`);
}

// Helper to add log entries
export async function addJobLog(
  jobId: string,
  logType: 'stdout' | 'stderr' | 'system',
  message: string,
  structured?: {
    isStructured: boolean;
    blockType?: string;
    blockContent?: any;
  }
) {
  const logEntry: any = {
    job_id: jobId,
    log_type: logType,
    message: message.substring(0, 65535), // Truncate if too long
    timestamp: new Date().toISOString()
  };
  
  if (structured) {
    logEntry.is_structured = structured.isStructured;
    logEntry.block_type = structured.blockType;
    logEntry.block_content = structured.blockContent;
  }
  
  const { error } = await supabase
    .from('job_logs')
    .insert(logEntry);
    
  if (error) {
    console.error(`[Supabase] Failed to add log for job ${jobId}:`, error);
    // Don't throw here - logging failures shouldn't stop job execution
  }
}