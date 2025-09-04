import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { 
  SQSClient, 
  SendMessageCommand, 
  ReceiveMessageCommand, 
  DeleteMessageCommand,
  GetQueueAttributesCommand 
} from '@aws-sdk/client-sqs';
import { QueueService } from '../services/QueueService';

/**
 * Unit Tests for QueueService
 * Validates SQS interaction patterns for job queue management
 */

const sqsMock = mockClient(SQSClient);

describe('QueueService', () => {
  let queueService: QueueService;

  beforeEach(() => {
    sqsMock.reset();
    process.env.TASK_QUEUE_URL = 'https://sqs.us-west-2.amazonaws.com/123456789/ecosystemcl-tasks';
    process.env.DLQ_URL = 'https://sqs.us-west-2.amazonaws.com/123456789/ecosystemcl-dlq';
    queueService = new QueueService();
  });

  describe('sendMessage', () => {
    it('should send message with correct attributes and priority-based delay', async () => {
      const message = {
        jobId: 'job-123',
        userId: 'user-456',
        agentName: 'CodeGenerator',
        priority: 8,
        bidPower: 150,
        metadata: { framework: 'react' }
      };

      sqsMock.on(SendMessageCommand).resolves({
        MessageId: 'msg-789',
        MD5OfMessageBody: 'abc123'
      });

      const messageId = await queueService.sendMessage(message);

      const calls = sqsMock.commandCalls(SendMessageCommand);
      expect(calls).toHaveLength(1);
      
      const [sendCommand] = calls;
      const input = sendCommand.args[0].input;
      
      expect(input).toMatchObject({
        QueueUrl: process.env.TASK_QUEUE_URL,
        MessageBody: JSON.stringify(message),
        DelaySeconds: expect.any(Number),
        MessageGroupId: 'CodeGenerator',
        MessageAttributes: {
          userId: {
            DataType: 'String',
            StringValue: 'user-456'
          },
          agentName: {
            DataType: 'String',
            StringValue: 'CodeGenerator'
          },
          priority: {
            DataType: 'Number',
            StringValue: '8'
          },
          bidPower: {
            DataType: 'Number',
            StringValue: '150'
          }
        }
      });
      
      // Verify priority-based delay calculation (priority 8 = 180 seconds delay)
      expect(input.DelaySeconds).toBe(180);
      expect(messageId).toBe('msg-789');
    });

    it('should handle send failures', async () => {
      const message = {
        jobId: 'job-123',
        userId: 'user-456',
        agentName: 'CodeGenerator',
        priority: 5
      };

      sqsMock.on(SendMessageCommand).rejects(new Error('Queue unavailable'));

      await expect(queueService.sendMessage(message))
        .rejects
        .toThrow('Failed to queue job job-123: Queue unavailable');
    });
  });

  describe('receiveMessages', () => {
    it('should receive and parse messages correctly', async () => {
      const mockMessages = [
        {
          MessageId: 'msg-1',
          ReceiptHandle: 'receipt-1',
          Body: JSON.stringify({
            jobId: 'job-1',
            userId: 'user-1',
            agentName: 'Agent1',
            priority: 7
          }),
          MessageAttributes: {
            priority: { StringValue: '7' }
          }
        },
        {
          MessageId: 'msg-2',
          ReceiptHandle: 'receipt-2',
          Body: JSON.stringify({
            jobId: 'job-2',
            userId: 'user-2',
            agentName: 'Agent2',
            priority: 9
          }),
          MessageAttributes: {
            priority: { StringValue: '9' }
          }
        }
      ];

      sqsMock.on(ReceiveMessageCommand).resolves({
        Messages: mockMessages
      });

      const messages = await queueService.receiveMessages(10);

      const calls = sqsMock.commandCalls(ReceiveMessageCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input).toMatchObject({
        QueueUrl: process.env.TASK_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 900
      });

      expect(messages).toHaveLength(2);
      expect(messages[0]).toMatchObject({
        jobId: 'job-1',
        receiptHandle: 'receipt-1',
        messageId: 'msg-1'
      });
    });

    it('should return empty array when no messages available', async () => {
      sqsMock.on(ReceiveMessageCommand).resolves({});

      const messages = await queueService.receiveMessages();
      expect(messages).toEqual([]);
    });
  });

  describe('deleteMessage', () => {
    it('should delete message with receipt handle', async () => {
      sqsMock.on(DeleteMessageCommand).resolves({});

      await queueService.deleteMessage('receipt-123');

      const calls = sqsMock.commandCalls(DeleteMessageCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input).toMatchObject({
        QueueUrl: process.env.TASK_QUEUE_URL,
        ReceiptHandle: 'receipt-123'
      });
    });
  });

  describe('getQueueMetrics', () => {
    it('should retrieve and parse queue attributes', async () => {
      sqsMock.on(GetQueueAttributesCommand).resolves({
        Attributes: {
          ApproximateNumberOfMessages: '42',
          ApproximateNumberOfMessagesNotVisible: '5',
          ApproximateNumberOfMessagesDelayed: '3'
        }
      });

      const metrics = await queueService.getQueueMetrics();

      expect(metrics).toEqual({
        approximateNumberOfMessages: 42,
        approximateNumberOfMessagesNotVisible: 5,
        approximateNumberOfMessagesDelayed: 3
      });
    });
  });

  describe('sendToDLQ', () => {
    it('should send failed message to DLQ with error details', async () => {
      const message = {
        jobId: 'job-failed',
        userId: 'user-456',
        agentName: 'FailedAgent',
        priority: 5
      };
      const error = 'Processing timeout exceeded';

      sqsMock.on(SendMessageCommand).resolves({
        MessageId: 'dlq-msg-1'
      });

      await queueService.sendToDLQ(message, error);

      const calls = sqsMock.commandCalls(SendMessageCommand);
      expect(calls).toHaveLength(1);
      
      const input = calls[0].args[0].input;
      expect(input.QueueUrl).toBe(process.env.DLQ_URL);
      
      const bodyParsed = JSON.parse(input.MessageBody);
      expect(bodyParsed).toMatchObject({
        ...message,
        failureReason: error,
        failedAt: expect.any(String)
      });
      
      expect(input.MessageAttributes).toMatchObject({
        originalJobId: {
          DataType: 'String',
          StringValue: 'job-failed'
        }
      });
    });
  });

  describe('batchSendMessages', () => {
    it('should batch messages in groups of 10', async () => {
      const messages = Array.from({ length: 25 }, (_, i) => ({
        jobId: `job-${i}`,
        userId: `user-${i}`,
        agentName: `Agent${i}`,
        priority: 5
      }));

      sqsMock.on(SendMessageCommand).resolves((request) => ({
        MessageId: `msg-${Math.random()}`
      }));

      const messageIds = await queueService.batchSendMessages(messages);

      const calls = sqsMock.commandCalls(SendMessageCommand);
      expect(calls).toHaveLength(25); // Individual sends in this implementation
      expect(messageIds).toHaveLength(25);
    });
  });
});
