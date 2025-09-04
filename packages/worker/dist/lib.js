"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addJobLog = exports.updateJobStatus = exports.redisConnection = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv.config({ path: path_1.default.join(__dirname, '../.env.local') });
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
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
// Redis connection for BullMQ
exports.redisConnection = new ioredis_1.default(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`[Redis] Reconnecting... attempt ${times}`);
        return delay;
    }
});
exports.redisConnection.on('connect', () => {
    console.log('[Redis] Connected successfully');
});
exports.redisConnection.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
});
// Helper to update job status
async function updateJobStatus(jobId, status, additionalData) {
    const updateData = {
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
    const { error } = await exports.supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);
    if (error) {
        console.error(`[Supabase] Failed to update job ${jobId} status:`, error);
        throw error;
    }
    console.log(`[Job ${jobId}] Status updated to: ${status}`);
}
exports.updateJobStatus = updateJobStatus;
// Helper to add log entries
async function addJobLog(jobId, logType, message, structured) {
    const logEntry = {
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
    const { error } = await exports.supabase
        .from('job_logs')
        .insert(logEntry);
    if (error) {
        console.error(`[Supabase] Failed to add log for job ${jobId}:`, error);
        // Don't throw here - logging failures shouldn't stop job execution
    }
}
exports.addJobLog = addJobLog;
