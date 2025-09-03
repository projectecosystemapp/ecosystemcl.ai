import { SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from './aws-clients';

export class QueueService {
  private getQueueUrl(tier: string): string {
    const queueUrls = {
      critical: process.env.CRITICAL_QUEUE_URL,
      enterprise: process.env.ENTERPRISE_QUEUE_URL,
      pro: process.env.PRO_QUEUE_URL,
      starter: process.env.STARTER_QUEUE_URL,
    };
    return queueUrls[tier as keyof typeof queueUrls] || queueUrls.starter!;
  }

  async addJob(job: any, tier: string = 'starter') {
    const command = new SendMessageCommand({
      QueueUrl: this.getQueueUrl(tier),
      MessageBody: JSON.stringify(job),
      MessageGroupId: tier,
      MessageDeduplicationId: `${job.jobId}-${Date.now()}`,
      MessageAttributes: {
        tier: { StringValue: tier, DataType: 'String' },
        priority: { StringValue: job.priority?.toString() || '5', DataType: 'Number' },
      },
    });
    return sqsClient.send(command);
  }

  async receiveJobs(tier: string = 'starter', maxMessages: number = 1) {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.getQueueUrl(tier),
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20,
      MessageAttributeNames: ['All'],
    });
    const result = await sqsClient.send(command);
    return result.Messages?.map(msg => ({
      ...JSON.parse(msg.Body || '{}'),
      receiptHandle: msg.ReceiptHandle,
    })) || [];
  }

  async deleteJob(tier: string, receiptHandle: string) {
    const command = new DeleteMessageCommand({
      QueueUrl: this.getQueueUrl(tier),
      ReceiptHandle: receiptHandle,
    });
    return sqsClient.send(command);
  }
}