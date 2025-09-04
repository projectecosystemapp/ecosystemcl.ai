import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';

/**
 * QueueService - AWS SQS Integration Service
 * Manages job queue operations using Amazon SQS
 * 
 * Queue Configuration:
 * - Primary Queue: ecosystemcl-tasks
 * - DLQ: ecosystemcl-dlq
 * - Visibility Timeout: 15 minutes
 * - Message Retention: 4 days
 */

export interface QueueMessage {
  jobId: string;
  userId: string;
  agentName: string;
  priority: number;
  bidPower?: number;
  metadata?: Record<string, any>;
}

export interface QueueMetrics {
  approximateNumberOfMessages: number;
  approximateNumberOfMessagesNotVisible: number;
  approximateNumberOfMessagesDelayed: number;
}

export class QueueService {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private readonly dlqUrl: string;

  constructor(region: string = process.env.AWS_REGION || 'us-west-2') {
    this.sqsClient = new SQSClient({ region });
    this.queueUrl = process.env.TASK_QUEUE_URL || 
      `https://sqs.${region}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/ecosystemcl-tasks`;
    this.dlqUrl = process.env.DLQ_URL || 
      `https://sqs.${region}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/ecosystemcl-dlq`;
  }

  /**
   * Send job message to SQS queue with priority-based delay
   */
  async sendMessage(message: QueueMessage): Promise<string> {
    // Calculate delay based on priority (lower priority = longer delay)
    const delaySeconds = this.calculateDelay(message.priority);
    
    // Add message attributes for filtering and metrics
    const messageAttributes = {
      userId: {
        DataType: 'String',
        StringValue: message.userId
      },
      agentName: {
        DataType: 'String',
        StringValue: message.agentName
      },
      priority: {
        DataType: 'Number',
        StringValue: message.priority.toString()
      },
      ...(message.bidPower && {
        bidPower: {
          DataType: 'Number',
          StringValue: message.bidPower.toString()
        }
      })
    };

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: messageAttributes,
      DelaySeconds: delaySeconds,
      MessageGroupId: message.agentName, // For FIFO queue support
      MessageDeduplicationId: `${message.jobId}-${Date.now()}`
    });

    try {
      const response = await this.sqsClient.send(command);
      return response.MessageId!;
    } catch (error: any) {
      throw new Error(`Failed to queue job ${message.jobId}: ${error.message}`);
    }
  }

  /**
   * Receive messages from queue for processing
   */
  async receiveMessages(maxMessages: number = 10): Promise<QueueMessage[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: Math.min(maxMessages, 10), // SQS limit
      WaitTimeSeconds: 20, // Long polling
      VisibilityTimeout: 900, // 15 minutes
      MessageAttributeNames: ['All'],
      AttributeNames: ['All']
    });

    const response = await this.sqsClient.send(command);
    
    if (!response.Messages || response.Messages.length === 0) {
      return [];
    }

    return response.Messages.map(msg => ({
      ...JSON.parse(msg.Body!),
      receiptHandle: msg.ReceiptHandle,
      messageId: msg.MessageId
    }));
  }

  /**
   * Delete processed message from queue
   */
  async deleteMessage(receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle
    });

    await this.sqsClient.send(command);
  }

  /**
   * Get queue metrics for monitoring
   */
  async getQueueMetrics(): Promise<QueueMetrics> {
    const command = new GetQueueAttributesCommand({
      QueueUrl: this.queueUrl,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
        'ApproximateNumberOfMessagesDelayed'
      ]
    });

    const response = await this.sqsClient.send(command);
    
    return {
      approximateNumberOfMessages: parseInt(response.Attributes?.ApproximateNumberOfMessages || '0'),
      approximateNumberOfMessagesNotVisible: parseInt(response.Attributes?.ApproximateNumberOfMessagesNotVisible || '0'),
      approximateNumberOfMessagesDelayed: parseInt(response.Attributes?.ApproximateNumberOfMessagesDelayed || '0')
    };
  }

  /**
   * Send message to DLQ for manual inspection
   */
  async sendToDLQ(message: QueueMessage, error: string): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.dlqUrl,
      MessageBody: JSON.stringify({
        ...message,
        failureReason: error,
        failedAt: new Date().toISOString()
      }),
      MessageAttributes: {
        originalJobId: {
          DataType: 'String',
          StringValue: message.jobId
        },
        errorType: {
          DataType: 'String',
          StringValue: error.substring(0, 256)
        }
      }
    });

    await this.sqsClient.send(command);
  }

  /**
   * Calculate delay based on priority (0-10 scale)
   */
  private calculateDelay(priority: number): number {
    // Higher priority = less delay
    // Priority 10 = 0 seconds, Priority 0 = 900 seconds (15 min)
    const maxDelay = 900;
    const normalizedPriority = Math.max(0, Math.min(10, priority));
    return Math.floor(maxDelay * (1 - normalizedPriority / 10));
  }

  /**
   * Batch send messages for efficiency
   */
  async batchSendMessages(messages: QueueMessage[]): Promise<string[]> {
    // SQS batch limit is 10
    const batches = [];
    for (let i = 0; i < messages.length; i += 10) {
      batches.push(messages.slice(i, i + 10));
    }

    const messageIds: string[] = [];
    for (const batch of batches) {
      const promises = batch.map(msg => this.sendMessage(msg));
      const results = await Promise.all(promises);
      messageIds.push(...results);
    }

    return messageIds;
  }
}
