import { PutCommand, UpdateCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from './aws-clients';

export class JobDAO {
  private tableName = process.env.JOBS_TABLE || 'ecosystem-jobs';

  async createJob(job: any) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...job,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return dynamoClient.send(command);
  }

  async updateJobStatus(jobId: string, status: string, result?: any) {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { jobId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt' + (result ? ', #result = :result' : ''),
      ExpressionAttributeNames: {
        '#status': 'status',
        ...(result && { '#result': 'result' }),
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
        ...(result && { ':result': result }),
      },
    });
    return dynamoClient.send(command);
  }

  async getJob(jobId: string) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { jobId },
    });
    const result = await dynamoClient.send(command);
    return result.Item;
  }

  async getJobsByStatus(status: string) {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'StatusIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
    });
    const result = await dynamoClient.send(command);
    return result.Items || [];
  }
}