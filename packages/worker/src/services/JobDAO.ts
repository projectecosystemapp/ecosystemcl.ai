import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

/**
 * JobDAO - Data Access Object for Jobs Table
 * Implements DynamoDB persistence for job lifecycle management
 * 
 * Table Schema:
 * - Primary Key: jobId (String)
 * - GSI: UserIndex (userId)
 * - Attributes: userId, agentName, taskPrompt, context, status, result, errorMessage, 
 *               createdAt, updatedAt, startedAt, completedAt
 */

export interface JobData {
  jobId: string;
  userId: string;
  agentName: string;
  taskPrompt: string;
  context: Record<string, any>;
  status: 'pending' | 'preparing' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface JobRecord extends JobData {
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  errorMessage?: string;
}

export class JobDAO {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(region: string = process.env.AWS_REGION || 'us-west-2') {
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: false
      },
      unmarshallOptions: {
        wrapNumbers: false
      }
    });
    this.tableName = process.env.JOBS_TABLE_NAME || 'Jobs';
  }

  /**
   * Create a new job record in DynamoDB
   */
  async createJob(jobData: JobData): Promise<void> {
    const now = new Date().toISOString();
    const item: JobRecord = {
      ...jobData,
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(jobId)'
    });

    try {
      await this.docClient.send(command);
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Job ${jobData.jobId} already exists`);
      }
      throw error;
    }
  }

  /**
   * Update job status with atomic operation
   */
  async updateJobStatus(
    jobId: string,
    status: JobRecord['status'],
    additionalData?: Partial<JobRecord>
  ): Promise<JobRecord | null> {
    const now = new Date().toISOString();
    const updateExpressionParts: string[] = ['#status = :status', '#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#status': 'status',
      '#updatedAt': 'updatedAt'
    };
    const expressionAttributeValues: Record<string, any> = {
      ':status': status,
      ':updatedAt': now
    };

    // Handle status-specific timestamps
    if (status === 'running' || status === 'preparing') {
      updateExpressionParts.push('#startedAt = if_not_exists(#startedAt, :startedAt)');
      expressionAttributeNames['#startedAt'] = 'startedAt';
      expressionAttributeValues[':startedAt'] = now;
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updateExpressionParts.push('#completedAt = :completedAt');
      expressionAttributeNames['#completedAt'] = 'completedAt';
      expressionAttributeValues[':completedAt'] = now;
    }

    // Add additional data fields
    if (additionalData) {
      for (const [key, value] of Object.entries(additionalData)) {
        if (value !== undefined && key !== 'jobId') {
          const attrName = `#${key}`;
          const attrValue = `:${key}`;
          updateExpressionParts.push(`${attrName} = ${attrValue}`);
          expressionAttributeNames[attrName] = key;
          expressionAttributeValues[attrValue] = value;
        }
      }
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { jobId },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(jobId)'
    });

    try {
      const response = await this.docClient.send(command);
      return response.Attributes as JobRecord;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Retrieve job by ID
   */
  async getJob(jobId: string): Promise<JobRecord | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { jobId }
    });

    const response = await this.docClient.send(command);
    return response.Item as JobRecord | null;
  }

  /**
   * Query jobs by user ID using GSI
   */
  async queryJobsByUser(userId: string, status?: JobRecord['status']): Promise<JobRecord[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: status ? '#status = :status' : undefined,
      ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
      ExpressionAttributeValues: {
        ':userId': userId,
        ...(status && { ':status': status })
      },
      ScanIndexForward: false // Most recent first
    });

    const response = await this.docClient.send(command);
    return response.Items as JobRecord[] || [];
  }

  /**
   * Add job log entry (separate table for high-volume writes)
   */
  async addJobLog(
    jobId: string,
    logType: 'stdout' | 'stderr' | 'system',
    message: string
  ): Promise<void> {
    const command = new PutCommand({
      TableName: process.env.JOB_LOGS_TABLE_NAME || 'JobLogs',
      Item: {
        jobId,
        timestamp: Date.now(),
        logType,
        message,
        ttl: Math.floor(Date.now() / 1000) + 86400 * 7 // 7-day TTL
      }
    });

    await this.docClient.send(command);
  }
}
