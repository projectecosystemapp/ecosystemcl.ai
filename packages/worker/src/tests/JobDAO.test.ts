import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { JobDAO } from '../services/JobDAO';

/**
 * Unit Tests for JobDAO
 * Validates DynamoDB interaction patterns for job persistence
 */

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('JobDAO', () => {
  let jobDAO: JobDAO;

  beforeEach(() => {
    ddbMock.reset();
    jobDAO = new JobDAO();
  });

  describe('createJob', () => {
    it('should send correct PutCommand to DynamoDB', async () => {
      const jobData = {
        jobId: 'job-123',
        userId: 'user-456',
        agentName: 'CodeGenerator',
        taskPrompt: 'Generate a React component',
        context: { framework: 'react', version: '18' },
        status: 'pending' as const
      };

      ddbMock.on(PutCommand).resolves({});

      await jobDAO.createJob(jobData);

      const calls = ddbMock.commandCalls(PutCommand);
      expect(calls).toHaveLength(1);
      
      const [putCommand] = calls;
      expect(putCommand.args[0].input).toMatchObject({
        TableName: 'Jobs',
        Item: expect.objectContaining({
          jobId: jobData.jobId,
          userId: jobData.userId,
          agentName: jobData.agentName,
          taskPrompt: jobData.taskPrompt,
          context: jobData.context,
          status: 'pending',
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      });
    });

    it('should handle DynamoDB errors', async () => {
      const error = new Error('DynamoDB unavailable');
      ddbMock.on(PutCommand).rejects(error);

      await expect(jobDAO.createJob({
        jobId: 'job-123',
        userId: 'user-456',
        agentName: 'CodeGenerator',
        taskPrompt: 'Test prompt',
        context: {},
        status: 'pending'
      })).rejects.toThrow('DynamoDB unavailable');
    });
  });

  describe('updateJobStatus', () => {
    it('should send correct UpdateCommand with status transition', async () => {
      const updateData = {
        jobId: 'job-123',
        status: 'running' as const,
        startedAt: new Date().toISOString()
      };

      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      });

      await jobDAO.updateJobStatus(updateData.jobId, updateData.status, {
        startedAt: updateData.startedAt
      });

      const calls = ddbMock.commandCalls(UpdateCommand);
      expect(calls).toHaveLength(1);
      
      const [updateCommand] = calls;
      expect(updateCommand.args[0].input).toMatchObject({
        TableName: 'Jobs',
        Key: { jobId: updateData.jobId },
        UpdateExpression: expect.stringContaining('SET #status = :status'),
        ExpressionAttributeNames: expect.objectContaining({
          '#status': 'status'
        }),
        ExpressionAttributeValues: expect.objectContaining({
          ':status': updateData.status,
          ':updatedAt': expect.any(String)
        })
      });
    });

    it('should include additional data in update', async () => {
      const additionalData = {
        result: { output: 'Generated code' },
        errorMessage: null,
        completedAt: new Date().toISOString()
      };

      ddbMock.on(UpdateCommand).resolves({});

      await jobDAO.updateJobStatus('job-123', 'completed', additionalData);

      const calls = ddbMock.commandCalls(UpdateCommand);
      const [updateCommand] = calls;
      
      expect(updateCommand.args[0].input.ExpressionAttributeValues).toMatchObject({
        ':status': 'completed',
        ':result': additionalData.result,
        ':completedAt': additionalData.completedAt,
        ':updatedAt': expect.any(String)
      });
    });
  });

  describe('getJob', () => {
    it('should retrieve job by ID', async () => {
      const mockJob = {
        jobId: 'job-123',
        userId: 'user-456',
        agentName: 'CodeGenerator',
        status: 'completed',
        createdAt: '2025-01-01T00:00:00Z'
      };

      ddbMock.on(GetCommand).resolves({
        Item: mockJob
      });

      const result = await jobDAO.getJob('job-123');

      const calls = ddbMock.commandCalls(GetCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input).toMatchObject({
        TableName: 'Jobs',
        Key: { jobId: 'job-123' }
      });
      expect(result).toEqual(mockJob);
    });

    it('should return null for non-existent job', async () => {
      ddbMock.on(GetCommand).resolves({});

      const result = await jobDAO.getJob('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('queryJobsByUser', () => {
    it('should query jobs by userId', async () => {
      const mockJobs = [
        { jobId: 'job-1', userId: 'user-456', status: 'completed' },
        { jobId: 'job-2', userId: 'user-456', status: 'running' }
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: mockJobs
      });

      const result = await jobDAO.queryJobsByUser('user-456');

      const calls = ddbMock.commandCalls(QueryCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input).toMatchObject({
        TableName: 'Jobs',
        IndexName: 'UserIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': 'user-456'
        }
      });
      expect(result).toEqual(mockJobs);
    });

    it('should apply status filter when provided', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: []
      });

      await jobDAO.queryJobsByUser('user-456', 'running');

      const calls = ddbMock.commandCalls(QueryCommand);
      expect(calls[0].args[0].input).toMatchObject({
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':userId': 'user-456',
          ':status': 'running'
        }
      });
    });
  });
});
