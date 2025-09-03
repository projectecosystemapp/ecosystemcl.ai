import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/forge/execute/route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-123' })),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'queue-job-123' }),
  })),
}));

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      duplicate: vi.fn().mockReturnThis(),
    })),
  };
});

describe('API: /api/forge/execute', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = (require('@/lib/supabase') as any).supabase;
  });

  describe('POST - Create Job', () => {
    it('successfully queues a valid job', async () => {
      // Mock workspace verification
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'workspace-123' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock job creation
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'job-123',
                status: 'queued',
                command: 'audit',
                args: { mode: 'security' },
                queued_at: '2024-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/forge/execute', {
        method: 'POST',
        body: JSON.stringify({
          command: 'audit',
          args: { mode: 'security' },
          workspaceId: 'workspace-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.job).toHaveProperty('id', 'job-123');
      expect(data.job).toHaveProperty('status', 'queued');
      expect(data.message).toContain('queued successfully');
    });

    it('rejects unauthorized requests', async () => {
      const { auth } = require('@clerk/nextjs/server') as any;
      auth.mockReturnValueOnce({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/forge/execute', {
        method: 'POST',
        body: JSON.stringify({ command: 'audit' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('validates command whitelist', async () => {
      const request = new NextRequest('http://localhost:3000/api/forge/execute', {
        method: 'POST',
        body: JSON.stringify({
          command: 'rm -rf /', // Malicious command
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid command');
      expect(data.error).toContain('audit, task, migrate');
    });

    it('verifies workspace ownership', async () => {
      // Mock workspace not found/unauthorized
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/forge/execute', {
        method: 'POST',
        body: JSON.stringify({
          command: 'audit',
          workspaceId: 'other-user-workspace',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Invalid workspace');
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/forge/execute', {
        method: 'POST',
        body: JSON.stringify({ command: 'audit' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to queue job');
      expect(data.details).toContain('Database connection failed');
    });
  });

  describe('GET - Check Job Status', () => {
    it('returns list of user jobs when no jobId provided', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { id: 'job-1', status: 'completed', command: 'audit' },
                  { id: 'job-2', status: 'running', command: 'task' },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/forge/execute');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs).toHaveLength(2);
      expect(data.jobs[0]).toHaveProperty('id', 'job-1');
      expect(data.jobs[1]).toHaveProperty('status', 'running');
    });

    it('returns specific job details with logs', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'job-123',
                  status: 'completed',
                  command: 'audit',
                  job_logs: [
                    { log_type: 'stdout', message: 'Starting audit...' },
                    { log_type: 'stdout', message: 'Audit complete' },
                  ],
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/forge/execute?jobId=job-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job).toHaveProperty('id', 'job-123');
      expect(data.job.job_logs).toHaveLength(2);
      expect(data.job.job_logs[0].message).toBe('Starting audit...');
    });

    it('returns 404 for non-existent job', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/forge/execute?jobId=fake-job');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Job not found');
    });

    it('enforces user isolation for job queries', async () => {
      // User tries to query another user's job
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null, // RLS blocks the query
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/forge/execute?jobId=other-user-job');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Job not found');
    });
  });
});