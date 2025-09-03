import { Worker, Queue, QueueEvents } from 'bullmq';
import { redisConnection } from './lib';
import { processForgeJob } from './processor';

const QUEUE_NAME = 'forge-jobs';
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

console.log(`[Worker ${WORKER_ID}] Starting ECOSYSTEMCL.AI worker service...`);

// Create the worker that processes jobs
const worker = new Worker(
  QUEUE_NAME,
  processForgeJob,
  {
    connection: redisConnection.duplicate(),
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
  }
);

// Create queue events listener for monitoring
const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisConnection.duplicate(),
});

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
const shutdown = async (signal: string) => {
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
  
  http.createServer((req: any, res: any) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        workerId: WORKER_ID,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  }).listen(port, () => {
    console.log(`[Worker ${WORKER_ID}] Health check server listening on port ${port}`);
  });
}

// Export for testing
export { worker, queueEvents };
