import { Job } from 'bullmq';
import Docker from 'dockerode';
import { supabase, updateJobStatus, addJobLog } from './lib';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { Readable } from 'stream';
import { GoogleGenerativeAI } from '@google/generative-ai';
import yaml from 'js-yaml';

const execAsync = promisify(exec);
const docker = new Docker();

// Parse Docker stream output
function parseDockerStream(buffer: Buffer): string {
  // Docker stream format includes 8-byte header
  // We need to skip it and extract the actual message
  let output = '';
  let offset = 0;
  
  while (offset < buffer.length) {
    // Skip the header (8 bytes)
    const header = buffer.slice(offset, offset + 8);
    if (header.length < 8) break;
    
    const size = header.readUInt32BE(4);
    const payload = buffer.slice(offset + 8, offset + 8 + size);
    output += payload.toString('utf8');
    offset += 8 + size;
  }
  
  return output;
}

// Process structured LOG BLOCKS from ECOSYSTEMCL.AI output
function parseLogBlock(message: string): { isStructured: boolean; blockType?: string; content?: any } {
  const logBlockRegex = /\[LOG BLOCK\]([\s\S]*?)\[END LOG BLOCK\]/;
  const match = message.match(logBlockRegex);
  
  if (!match) {
    return { isStructured: false };
  }
  
  const blockContent = match[1];
  const lines = blockContent.split('\n').filter(l => l.trim());
  
  // Parse structured fields
  const structured: any = {};
  let currentField: string | null = null;
  
  for (const line of lines) {
    const fieldMatch = line.match(/^(Thinking|Reasoning|Reference|Action|Result):\s*(.*)/);
    if (fieldMatch) {
      currentField = fieldMatch[1].toLowerCase();
      structured[currentField] = fieldMatch[2];
    } else if (currentField) {
      structured[currentField] += '\n' + line;
    }
  }
  
  return {
    isStructured: true,
    blockType: 'log_block',
    content: structured
  };
}

async function decryptUserApiKey(userId: string, service: string): Promise<string> {
  // In a real implementation, this would fetch and decrypt the key from Supabase Vault
  console.log(`[Worker] Decrypting API key for user ${userId} and service ${service}`);
  const { data, error } = await supabase
    .from('user_service_connections')
    .select('access_token')
    .eq('user_id', userId)
    .eq('service', service)
    .single();

  if (error || !data) {
    throw new Error(`No connection found for service ${service}`);
  }

  return data.access_token;
}

async function adaptGoogleStreamToReadableStream(googleStream: AsyncGenerator<any, any, any>): Promise<Readable> {
  const readable = new Readable({
    async read() {
      // This function is called when the stream is ready to pull more data.
    }
  });

  (async () => {
    for await (const chunk of googleStream) {
      const text = chunk.text();
      if (text) {
        readable.push(text);
      }
    }
    readable.push(null); // Signal the end of the stream
  })();

  return readable;
}

export async function processForgeJob(job: Job) {
  const jobId = job.data.jobId;
  if (!jobId) {
    console.error('[Processor] Job ID is missing');
    throw new Error('Job ID is missing');
  }
  console.log(`[Processor] Starting job ${jobId}`);
  
  try {
    // 1. Update status to preparing
    await updateJobStatus(jobId, 'preparing');
    await addJobLog(jobId, 'system', 'Worker picked up job. Preparing execution environment...');
    
    // 2. Fetch job details
    const { data: jobDetails, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (fetchError || !jobDetails) {
      throw new Error(`Failed to fetch job details: ${fetchError?.message}`);
    }

    const { agentName, taskPrompt, context, user_id: userId } = jobDetails;

    if (!agentName || !taskPrompt || !userId) {
      throw new Error('Job details are incomplete (missing agentName, taskPrompt, or userId)');
    }

    // Load agent configuration
    const agentsDir = path.resolve(__dirname, '../../cli/agents');
    const agentConfigFile = path.join(agentsDir, `${agentName}.yml`);
    const agentConfig = yaml.load(await fs.readFile(agentConfigFile, 'utf8')) as any;

    let aiResponseStream: Readable;
    const agentProvider = agentConfig.provider; // e.g., 'openai', 'claude', 'google'

    if (agentProvider === 'google') {
      // --- EXECUTE WITH GOOGLE GEMINI ---
      console.log('[Worker] Using user-provided Google OAuth token for Gemini.');
      await addJobLog(jobId, 'system', 'Initializing Google Gemini...');

      // 1. Decrypt the user's Google OAuth access_token from Supabase Vault.
      const decryptedAuthToken = await decryptUserApiKey(userId, 'google');

      // 2. Initialize the Google AI Client.
      const genAI = new GoogleGenerativeAI(decryptedAuthToken);

      // 3. Get the specific Gemini model and make the streaming call.
      const model = genAI.getGenerativeModel({ model: agentConfig.model_id || "gemini-1.5-pro-latest" });
      const result = await model.generateContentStream(taskPrompt); // Using taskPrompt as user prompt

      // 4. We now have a stream to send back.
      aiResponseStream = await adaptGoogleStreamToReadableStream(result.stream);
      
      await addJobLog(jobId, 'system', 'Streaming response from Gemini...');

    } else {
        // Existing logic for other providers or local execution can go here
        // For now, we'll just throw an error if it's not google
        throw new Error(`Unsupported provider: ${agentProvider}`);
    }

    // Stream the response back
    aiResponseStream.on('data', (chunk) => {
        addJobLog(jobId, 'stdout', chunk.toString());
    });

    await new Promise<void>((resolve, reject) => {
      aiResponseStream.on('end', async () => {
          await addJobLog(jobId, 'system', 'Job completed successfully');
          await updateJobStatus(jobId, 'completed');
          console.log(`[Processor] Job ${jobId} completed successfully`);
          resolve();
      });

      aiResponseStream.on('error', async (error) => {
          console.error(`[Processor] Stream error for job ${jobId}:`, error);
          await addJobLog(jobId, 'stderr', `Stream error: ${error.message}`);
          await updateJobStatus(jobId, 'failed', {
            error_message: error.message,
          });
          reject(error);
      });
    });

  } catch (error: any) {
    console.error(`[Processor] Job ${jobId} failed:`, error);
    
    await addJobLog(jobId, 'stderr', `Job failed: ${error.message}`);
    await updateJobStatus(jobId, 'failed', {
      error_message: error.message,
      exit_code: -1
    });
    
    throw error; // Re-throw for BullMQ retry logic
  }
}
