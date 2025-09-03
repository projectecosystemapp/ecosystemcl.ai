"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueEvents = exports.worker = void 0;
const bullmq_1 = require("bullmq");
const lib_1 = require("./lib");
const processor_1 = require("./processor");
const QUEUE_NAME = 'forge-jobs';
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;
console.log(`[Worker ${WORKER_ID}] Starting FORGE worker service...`);
// Create the worker that processes jobs
const worker = new bullmq_1.Worker(QUEUE_NAME, processor_1.processForgeJob, {
    connection: lib_1.redisConnection.duplicate(),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
    limiter: {
        max: 10,
        duration: 60000, // Max 10 jobs per minute
    },
    removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 100, // Keep max 100 completed jobs
    },
    removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
    },
});
exports.worker = worker;
// Create queue events listener for monitoring
const queueEvents = new bullmq_1.QueueEvents(QUEUE_NAME, {
    connection: lib_1.redisConnection.duplicate(),
});
exports.queueEvents = queueEvents;
// Worker event handlers
worker.on('ready', () => {
    console.log(`[Worker ${WORKER_ID}] Ready and waiting for jobs...`);
});
worker.on('active', (job) => {
    console.log(`[Worker ${WORKER_ID}] Job ${job.id} started - ${job.data.jobId}`);
});
worker.on('completed', (job) => {
    console.log(`[Worker ${WORKER_ID}] Job ${job.id} completed - ${job.data.jobId}`);
});
worker.on('failed', (job, err) => {
    console.error(`[Worker ${WORKER_ID}] Job ${job?.id} failed:`, err.message);
});
worker.on('error', (err) => {
    console.error(`[Worker ${WORKER_ID}] Worker error:`, err);
});
// Queue event handlers
queueEvents.on('waiting', ({ jobId }) => {
    console.log(`[Queue] Job ${jobId} is waiting`);
});
queueEvents.on('active', ({ jobId, prev }) => {
    console.log(`[Queue] Job ${jobId} moved from ${prev} to active`);
});
queueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`[Queue] Job ${jobId} completed`);
});
queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[Queue] Job ${jobId} failed: ${failedReason}`);
});
// Graceful shutdown
const shutdown = async (signal) => {
    console.log(`[Worker ${WORKER_ID}] Received ${signal}, shutting down gracefully...`);
    await worker.close();
    await queueEvents.close();
    console.log(`[Worker ${WORKER_ID}] Shutdown complete`);
    process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Health check endpoint (optional - for production monitoring)
if (process.env.HEALTH_CHECK_PORT) {
    const http = require('http');
    const port = parseInt(process.env.HEALTH_CHECK_PORT);
    http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                workerId: WORKER_ID,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
            }));
        }
        else {
            res.writeHead(404);
            res.end();
        }
    }).listen(port, () => {
        console.log(`[Worker ${WORKER_ID}] Health check server listening on port ${port}`);
    });
}
