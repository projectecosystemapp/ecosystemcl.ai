import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { JobDAO } from '../services/JobDAO';
import { QueueService } from '../services/QueueService';
import { BedrockService } from '../services/BedrockService';
import { Readable } from 'stream';

/**
 * End-to-End Test Harness for AWS-Native Architecture
 * Validates composition and integration of JobDAO, QueueService, and BedrockService
 * 
 * Test Scenario: Complete job lifecycle simulation
 * 1. Create job in DynamoDB
 * 2. Queue job in SQS
 * 3. Process job with Bedrock AI
 * 4. Update job status with results
 */

const ddbMock = mockClient(DynamoDBDocumentClient);
const sqsMock = mockClient(SQSClient);
const bedrockMock = mockClient(BedrockRuntimeClient);

describe('AWS-Native E2E Integration', () => {
  let jobDAO: JobDAO;
  let queueService: QueueService;
  let bedrockService: BedrockService;

  beforeEach(() => {
    // Reset all mocks
    ddbMock.reset();
    sqsMock.reset();
    bedrockMock.reset();

    // Configure environment
    process.env.JOBS_TABLE_NAME = 'Jobs';
    process.env.TASK_QUEUE_URL = 'https://sqs.us-west-2.amazonaws.com/123456789/ecosystemcl-tasks';
    process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229';
    process.env.AWS_REGION = 'us-west-2';

    // Initialize services
    jobDAO = new JobDAO();
    queueService = new QueueService();
    bedrockService = new BedrockService();
  });

  describe('Full Job Lifecycle Simulation', () => {
    it('should orchestrate complete job processing flow', async () => {
      // Test data
      const jobData = {
        jobId: 'e2e-test-job-001',
        userId: 'e2e-user-123',
        agentName: 'CodeGenerator',
        taskPrompt: 'Generate a TypeScript function to calculate fibonacci',
        context: {
          language: 'typescript',
          style: 'functional'
        },
        status: 'pending' as const
      };

      const aiResponse = `\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\``;

      // Step 1: Create Job in DynamoDB
      console.log('Step 1: Creating job in DynamoDB...');
      
      ddbMock.on(PutCommand).resolves({});
      
      await jobDAO.createJob(jobData);
      
      // Verify DynamoDB PutCommand
      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls).toHaveLength(1);
      expect(putCalls[0].args[0].input).toMatchObject({
        TableName: 'Jobs',
        Item: expect.objectContaining({
          jobId: jobData.jobId,
          userId: jobData.userId,
          status: 'pending',
          createdAt: expect.any(String)
        })
      });

      // Step 2: Queue Job in SQS
      console.log('Step 2: Queueing job in SQS...');
      
      sqsMock.on(SendMessageCommand).resolves({
        MessageId: 'sqs-msg-001',
        MD5OfMessageBody: 'abc123'
      });

      const queueMessage = {
        jobId: jobData.jobId,
        userId: jobData.userId,
        agentName: jobData.agentName,
        priority: 7,
        bidPower: 100
      };

      const messageId = await queueService.sendMessage(queueMessage);
      
      // Verify SQS SendMessageCommand
      const sqsCalls = sqsMock.commandCalls(SendMessageCommand);
      expect(sqsCalls).toHaveLength(1);
      expect(sqsCalls[0].args[0].input).toMatchObject({
        QueueUrl: process.env.TASK_QUEUE_URL,
        MessageBody: JSON.stringify(queueMessage),
        MessageAttributes: expect.objectContaining({
          userId: { DataType: 'String', StringValue: jobData.userId },
          agentName: { DataType: 'String', StringValue: jobData.agentName }
        })
      });
      expect(messageId).toBe('sqs-msg-001');

      // Step 3: Update Job Status to Running
      console.log('Step 3: Updating job status to running...');
      
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          jobId: jobData.jobId,
          status: 'running',
          startedAt: new Date().toISOString()
        }
      });

      await jobDAO.updateJobStatus(jobData.jobId, 'running', {
        startedAt: new Date().toISOString()
      });

      // Verify first UpdateCommand
      let updateCalls = ddbMock.commandCalls(UpdateCommand);
      expect(updateCalls).toHaveLength(1);
      expect(updateCalls[0].args[0].input).toMatchObject({
        TableName: 'Jobs',
        Key: { jobId: jobData.jobId },
        UpdateExpression: expect.stringContaining('SET #status = :status')
      });

      // Step 4: Process with Bedrock AI
      console.log('Step 4: Processing with Bedrock AI...');
      
      // Create async generator for streaming response
      async function* streamGenerator() {
        const chunks = aiResponse.split(' ');
        for (const chunk of chunks) {
          yield {
            chunk: {
              bytes: new TextEncoder().encode(JSON.stringify({
                completion: chunk + ' '
              }))
            }
          };
        }
      }

      bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({
        body: streamGenerator(),
        $metadata: { requestId: 'bedrock-req-001' }
      });

      const aiStream = await bedrockService.invokeModelStream({
        prompt: jobData.taskPrompt,
        modelId: 'anthropic.claude-3-sonnet-20240229',
        maxTokens: 2048,
        systemPrompt: `You are an expert ${jobData.context.language} developer`,
        temperature: 0.7
      });

      // Verify Bedrock InvokeModelWithResponseStreamCommand
      const bedrockCalls = bedrockMock.commandCalls(InvokeModelWithResponseStreamCommand);
      expect(bedrockCalls).toHaveLength(1);
      const bedrockInput = JSON.parse(bedrockCalls[0].args[0].input.body);
      expect(bedrockInput).toMatchObject({
        prompt: expect.stringContaining('typescript developer'),
        max_tokens_to_sample: 2048,
        temperature: 0.7
      });

      // Collect AI response
      let fullResponse = '';
      aiStream.on('data', (chunk) => {
        fullResponse += chunk.toString();
      });

      await new Promise((resolve) => aiStream.on('end', resolve));
      expect(fullResponse).toContain('fibonacci');

      // Step 5: Update Job Status to Completed
      console.log('Step 5: Updating job status to completed...');
      
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          jobId: jobData.jobId,
          status: 'completed',
          result: { generatedCode: fullResponse },
          completedAt: new Date().toISOString()
        }
      });

      await jobDAO.updateJobStatus(jobData.jobId, 'completed', {
        result: { generatedCode: fullResponse },
        completedAt: new Date().toISOString()
      });

      // Verify second UpdateCommand
      updateCalls = ddbMock.commandCalls(UpdateCommand);
      expect(updateCalls).toHaveLength(2);
      expect(updateCalls[1].args[0].input).toMatchObject({
        TableName: 'Jobs',
        Key: { jobId: jobData.jobId },
        ExpressionAttributeValues: expect.objectContaining({
          ':status': 'completed',
          ':result': { generatedCode: expect.stringContaining('fibonacci') }
        })
      });

      // Verify complete execution sequence
      console.log('Verifying complete execution sequence...');
      
      // DynamoDB: 1 PUT + 2 UPDATEs
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(2);
      
      // SQS: 1 SEND
      expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
      
      // Bedrock: 1 INVOKE_STREAM
      expect(bedrockMock.commandCalls(InvokeModelWithResponseStreamCommand)).toHaveLength(1);

      console.log('✅ E2E test completed successfully');
    });

    it('should handle job failure flow', async () => {
      const jobData = {
        jobId: 'e2e-fail-job-002',
        userId: 'e2e-user-456',
        agentName: 'FailingAgent',
        taskPrompt: 'This will fail',
        context: {},
        status: 'pending' as const
      };

      // Create job
      ddbMock.on(PutCommand).resolves({});
      await jobDAO.createJob(jobData);

      // Queue job
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'fail-msg-001' });
      await queueService.sendMessage({
        jobId: jobData.jobId,
        userId: jobData.userId,
        agentName: jobData.agentName,
        priority: 5
      });

      // Update to running
      ddbMock.on(UpdateCommand).resolves({
        Attributes: { jobId: jobData.jobId, status: 'running' }
      });
      await jobDAO.updateJobStatus(jobData.jobId, 'running');

      // Simulate Bedrock failure
      bedrockMock.on(InvokeModelWithResponseStreamCommand).rejects(
        new Error('Model overloaded')
      );

      // Attempt AI processing
      await expect(bedrockService.invokeModelStream({
        prompt: jobData.taskPrompt,
        modelId: 'anthropic.claude-3-sonnet-20240229'
      })).rejects.toThrow('Model overloaded');

      // Update to failed status
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          jobId: jobData.jobId,
          status: 'failed',
          errorMessage: 'Model overloaded'
        }
      });

      await jobDAO.updateJobStatus(jobData.jobId, 'failed', {
        errorMessage: 'Model overloaded',
        completedAt: new Date().toISOString()
      });

      // Send to DLQ
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'dlq-msg-001' });
      await queueService.sendToDLQ(
        {
          jobId: jobData.jobId,
          userId: jobData.userId,
          agentName: jobData.agentName,
          priority: 5
        },
        'Model overloaded'
      );

      // Verify failure flow
      const updateCalls = ddbMock.commandCalls(UpdateCommand);
      expect(updateCalls[updateCalls.length - 1].args[0].input.ExpressionAttributeValues)
        .toMatchObject({
          ':status': 'failed',
          ':errorMessage': 'Model overloaded'
        });

      const sqsCalls = sqsMock.commandCalls(SendMessageCommand);
      const dlqCall = sqsCalls[sqsCalls.length - 1];
      expect(dlqCall.args[0].input.QueueUrl).toContain('ecosystemcl-dlq');
    });
  });

  describe('Service Isolation Verification', () => {
    it('should maintain service independence', async () => {
      // Each service should be independently mockable
      const jobDAOMock = vi.spyOn(jobDAO, 'createJob');
      const queueServiceMock = vi.spyOn(queueService, 'sendMessage');
      const bedrockServiceMock = vi.spyOn(bedrockService, 'invokeModel');

      ddbMock.on(PutCommand).resolves({});
      sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test' });
      bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({ completion: 'test' }))
      });

      // Services should not have cross-dependencies
      expect(jobDAO).not.toHaveProperty('queueService');
      expect(queueService).not.toHaveProperty('jobDAO');
      expect(bedrockService).not.toHaveProperty('jobDAO');
    });
  });
});
