"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processForgeJob = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const lib_1 = require("./lib");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const stream_1 = require("stream");
const generative_ai_1 = require("@google/generative-ai");
const js_yaml_1 = __importDefault(require("js-yaml"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const docker = new dockerode_1.default();
// Parse Docker stream output
function parseDockerStream(buffer) {
    // Docker stream format includes 8-byte header
    // We need to skip it and extract the actual message
    let output = '';
    let offset = 0;
    while (offset < buffer.length) {
        // Skip the header (8 bytes)
        const header = buffer.slice(offset, offset + 8);
        if (header.length < 8)
            break;
        const size = header.readUInt32BE(4);
        const payload = buffer.slice(offset + 8, offset + 8 + size);
        output += payload.toString('utf8');
        offset += 8 + size;
    }
    return output;
}
// Process structured LOG BLOCKS from ECOSYSTEMCL.AI output
function parseLogBlock(message) {
    const logBlockRegex = /\[LOG BLOCK\]([\s\S]*?)\[END LOG BLOCK\]/;
    const match = message.match(logBlockRegex);
    if (!match) {
        return { isStructured: false };
    }
    const blockContent = match[1];
    const lines = blockContent.split('\n').filter(l => l.trim());
    // Parse structured fields
    const structured = {};
    let currentField = null;
    for (const line of lines) {
        const fieldMatch = line.match(/^(Thinking|Reasoning|Reference|Action|Result):\s*(.*)/);
        if (fieldMatch) {
            currentField = fieldMatch[1].toLowerCase();
            structured[currentField] = fieldMatch[2];
        }
        else if (currentField) {
            structured[currentField] += '\n' + line;
        }
    }
    return {
        isStructured: true,
        blockType: 'log_block',
        content: structured
    };
}
async function decryptUserApiKey(userId, service) {
    // In a real implementation, this would fetch and decrypt the key from Supabase Vault
    console.log(`[Worker] Decrypting API key for user ${userId} and service ${service}`);
    const { data, error } = await lib_1.supabase
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
async function adaptGoogleStreamToReadableStream(googleStream) {
    const readable = new stream_1.Readable({
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
async function processForgeJob(job) {
    const jobId = job.data.jobId;
    if (!jobId) {
        console.error('[Processor] Job ID is missing');
        throw new Error('Job ID is missing');
    }
    console.log(`[Processor] Starting job ${jobId}`);
    try {
        // 1. Update status to preparing
        await (0, lib_1.updateJobStatus)(jobId, 'preparing');
        await (0, lib_1.addJobLog)(jobId, 'system', 'Worker picked up job. Preparing execution environment...');
        // 2. Fetch job details
        const { data: jobDetails, error: fetchError } = await lib_1.supabase
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
        const agentsDir = path_1.default.resolve(__dirname, '../../cli/agents');
        const agentConfigFile = path_1.default.join(agentsDir, `${agentName}.yml`);
        const agentConfig = js_yaml_1.default.load(await promises_1.default.readFile(agentConfigFile, 'utf8'));
        let aiResponseStream;
        const agentProvider = agentConfig.provider; // e.g., 'openai', 'claude', 'google'
        if (agentProvider === 'google') {
            // --- EXECUTE WITH GOOGLE GEMINI ---
            console.log('[Worker] Using user-provided Google OAuth token for Gemini.');
            await (0, lib_1.addJobLog)(jobId, 'system', 'Initializing Google Gemini...');
            // 1. Decrypt the user's Google OAuth access_token from Supabase Vault.
            const decryptedAuthToken = await decryptUserApiKey(userId, 'google');
            // 2. Initialize the Google AI Client.
            const genAI = new generative_ai_1.GoogleGenerativeAI(decryptedAuthToken);
            // 3. Get the specific Gemini model and make the streaming call.
            const model = genAI.getGenerativeModel({ model: agentConfig.model_id || "gemini-1.5-pro-latest" });
            const result = await model.generateContentStream(taskPrompt); // Using taskPrompt as user prompt
            // 4. We now have a stream to send back.
            aiResponseStream = await adaptGoogleStreamToReadableStream(result.stream);
            await (0, lib_1.addJobLog)(jobId, 'system', 'Streaming response from Gemini...');
        }
        else {
            // Existing logic for other providers or local execution can go here
            // For now, we'll just throw an error if it's not google
            throw new Error(`Unsupported provider: ${agentProvider}`);
        }
        // Stream the response back
        aiResponseStream.on('data', (chunk) => {
            (0, lib_1.addJobLog)(jobId, 'stdout', chunk.toString());
        });
        await new Promise((resolve, reject) => {
            aiResponseStream.on('end', async () => {
                await (0, lib_1.addJobLog)(jobId, 'system', 'Job completed successfully');
                await (0, lib_1.updateJobStatus)(jobId, 'completed');
                console.log(`[Processor] Job ${jobId} completed successfully`);
                resolve();
            });
            aiResponseStream.on('error', async (error) => {
                console.error(`[Processor] Stream error for job ${jobId}:`, error);
                await (0, lib_1.addJobLog)(jobId, 'stderr', `Stream error: ${error.message}`);
                await (0, lib_1.updateJobStatus)(jobId, 'failed', {
                    error_message: error.message,
                });
                reject(error);
            });
        });
    }
    catch (error) {
        console.error(`[Processor] Job ${jobId} failed:`, error);
        await (0, lib_1.addJobLog)(jobId, 'stderr', `Job failed: ${error.message}`);
        await (0, lib_1.updateJobStatus)(jobId, 'failed', {
            error_message: error.message,
            exit_code: -1
        });
        throw error; // Re-throw for BullMQ retry logic
    }
}
exports.processForgeJob = processForgeJob;
