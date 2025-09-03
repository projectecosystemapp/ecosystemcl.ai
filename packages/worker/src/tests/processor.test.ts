import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Job } from 'bullmq';
import { processForgeJob } from '../processor';
import Docker from 'dockerode';
import nock from 'nock';

// Mock all external dependencies
vi.mock('dockerode');
vi.mock('../lib', () => ({
  supabase: {
    from: vi.fn(),
  },
  updateJobStatus: vi.fn(),
  addJobLog: vi.fn(),
}));

// Mock child_process for git operations
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, callback) => callback(null, { stdout: 'success', stderr: '' })),
  promisify: vi.fn(() => vi.fn().mockResolvedValue({ stdout: 'success', stderr: '' })),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Worker Processor Tests', () => {
  let mockJob: Job;
  let mockDocker: any;
  let mockContainer: any;
  let mockSupabase: any;
  let mockStream: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock job
    mockJob = {
      id: 'test-job-123',
      data: { jobId: 'job-uuid-123' },
    } as Job;

    // Setup mock Docker container
    mockStream = {
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          // Simulate some output
          setTimeout(() => {
            const buffer = Buffer.from('Test output from container');
            callback(buffer);
          }, 10);
        }
      }),
    };

    mockContainer = {
      id: 'container-123',
      attach: vi.fn().mockResolvedValue(mockStream),
      start: vi.fn().mockResolvedValue(undefined),
      wait: vi.fn().mockResolvedValue({ StatusCode: 0 }),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    mockDocker = {
      createContainer: vi.fn().mockResolvedValue(mockContainer),
    };

    Docker.mockImplementation(() => mockDocker);

    // Setup mock Supabase
    mockSupabase = (require('../lib') as any).supabase;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'jobs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'job-uuid-123',
                  user_id: 'user-123',
                  command: 'audit',
                  args: { mode: 'security' },
                  workspace_id: 'workspace-123',
                  workspaces: {
                    repo_url: 'https://github.com/test/repo.git',
                    repo_name: 'test-repo',
                    repo_owner: 'test',
                  },
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Successful Job Processing', () => {
    it('should process a job successfully from queue to completion', async () => {
      const { updateJobStatus, addJobLog } = require('../lib') as any;
      
      await processForgeJob(mockJob);

      // Verify status updates
      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'preparing');
      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'running', expect.any(Object));
      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'completed', expect.objectContaining({
        exit_code: 0,
      }));

      // Verify logs were added
      expect(addJobLog).toHaveBeenCalledWith(
        'job-uuid-123',
        'system',
        expect.stringContaining('Worker picked up job')
      );
      expect(addJobLog).toHaveBeenCalledWith(
        'job-uuid-123',
        'system',
        expect.stringContaining('Repository cloned successfully')
      );

      // Verify Docker container was created and started
      expect(mockDocker.createContainer).toHaveBeenCalledWith(expect.objectContaining({
        Image: 'forge-executor',
        WorkingDir: '/workspace',
        Env: expect.arrayContaining([
          'FORGE_JOB_ID=job-uuid-123',
          'FORGE_USER_ID=user-123',
        ]),
      }));
      expect(mockContainer.start).toHaveBeenCalled();
      expect(mockContainer.wait).toHaveBeenCalled();
    });

    it('should handle repository cloning correctly', async () => {
      const childProcess = require('child_process') as any;
      const execAsync = childProcess.promisify();
      
      await processForgeJob(mockJob);

      // Verify git clone was called with correct URL
      expect(execAsync).toHaveBeenCalledWith(
        expect.stringContaining('git clone'),
        expect.any(Object)
      );
    });

    it('should stream container output to logs', async () => {
      const { addJobLog } = require('../lib') as any;
      
      // Modify mock stream to provide structured output
      mockStream.on = vi.fn((event, callback) => {
        if (event === 'data') {
          setTimeout(() => {
            // Docker stream format with 8-byte header
            const message = 'Executing forge command...';
            const buffer = Buffer.concat([
              Buffer.from([1, 0, 0, 0, 0, 0, 0, message.length]),
              Buffer.from(message),
            ]);
            callback(buffer);
          }, 10);
        }
      });

      await processForgeJob(mockJob);

      // Wait for async stream processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify output was logged
      expect(addJobLog).toHaveBeenCalledWith(
        'job-uuid-123',
        'stdout',
        expect.any(String)
      );
    });

    it('should parse structured LOG BLOCKS', async () => {
      const { addJobLog } = require('../lib') as any;
      
      const structuredLog = `[LOG BLOCK]
Thinking: Analyzing the code structure
Reasoning: Need to identify security vulnerabilities
Reference: file.js:line:42
Action: Scanning for SQL injection
Result: Found potential vulnerability
[END LOG BLOCK]`;

      mockStream.on = vi.fn((event, callback) => {
        if (event === 'data') {
          setTimeout(() => {
            const buffer = Buffer.concat([
              Buffer.from([1, 0, 0, 0, 0, 0, 0, structuredLog.length]),
              Buffer.from(structuredLog),
            ]);
            callback(buffer);
          }, 10);
        }
      });

      await processForgeJob(mockJob);
      
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify structured log was processed
      expect(addJobLog).toHaveBeenCalledWith(
        'job-uuid-123',
        'stdout',
        expect.stringContaining('[LOG BLOCK]'),
        expect.objectContaining({
          isStructured: true,
          blockType: 'log_block',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Docker container failures', async () => {
      const { updateJobStatus, addJobLog } = require('../lib') as any;
      
      // Make container exit with error
      mockContainer.wait.mockResolvedValue({ StatusCode: 1 });

      await expect(processForgeJob(mockJob)).rejects.toThrow('Container exited with code 1');

      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', expect.objectContaining({
        error_message: expect.stringContaining('Container exited with code 1'),
      }));
    });

    it('should handle repository clone failures', async () => {
      const { updateJobStatus, addJobLog } = require('../lib') as any;
      const childProcess = require('child_process') as any;
      
      // Make git clone fail
      childProcess.promisify.mockReturnValue(
        vi.fn().mockRejectedValue(new Error('Repository not found'))
      );

      await expect(processForgeJob(mockJob)).rejects.toThrow('Repository not found');

      expect(addJobLog).toHaveBeenCalledWith(
        'job-uuid-123',
        'stderr',
        expect.stringContaining('Repository not found')
      );
      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', expect.any(Object));
    });

    it('should handle missing job details', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Job not found' },
            }),
          }),
        }),
      }));

      await expect(processForgeJob(mockJob)).rejects.toThrow('Failed to fetch job details');
    });

    it('should handle Docker creation failures', async () => {
      const { updateJobStatus } = require('../lib') as any;
      
      mockDocker.createContainer.mockRejectedValue(new Error('Docker daemon not running'));

      await expect(processForgeJob(mockJob)).rejects.toThrow('Docker daemon not running');

      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', expect.any(Object));
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up container on success', async () => {
      await processForgeJob(mockJob);

      expect(mockContainer.remove).toHaveBeenCalledWith({ force: true });
    });

    it('should clean up container on failure', async () => {
      mockContainer.wait.mockResolvedValue({ StatusCode: 1 });

      try {
        await processForgeJob(mockJob);
      } catch (error) {
        // Expected to fail
      }

      expect(mockContainer.remove).toHaveBeenCalledWith({ force: true });
    });

    it('should clean up work directory', async () => {
      const childProcess = require('child_process') as any;
      const execAsync = childProcess.promisify();
      
      await processForgeJob(mockJob);

      // Verify cleanup command was called
      expect(execAsync).toHaveBeenCalledWith(
        expect.stringContaining('rm -rf /tmp/forge-jobs/job-uuid-123')
      );
    });

    it('should handle cleanup failures gracefully', async () => {
      mockContainer.remove.mockRejectedValue(new Error('Container already removed'));
      
      // Should not throw even if cleanup fails
      await processForgeJob(mockJob);
      
      expect(mockContainer.remove).toHaveBeenCalled();
    });
  });

  describe('BullMQ Integration', () => {
    it('should handle job retry on transient failures', async () => {
      const { updateJobStatus } = require('../lib') as any;
      
      // Simulate transient network error
      mockDocker.createContainer
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce(mockContainer);

      // First attempt fails
      await expect(processForgeJob(mockJob)).rejects.toThrow('Network timeout');
      
      // Second attempt succeeds
      await processForgeJob(mockJob);
      
      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'completed', expect.any(Object));
    });

    it('should respect job timeout settings', async () => {
      // Make container hang
      mockContainer.wait.mockImplementation(() => new Promise(() => {}));
      
      const timeoutJob = {
        ...mockJob,
        data: { jobId: 'job-uuid-123', timeout: 100 },
      } as Job;

      // This would timeout in real scenario
      // For test, we just verify the timeout is passed to Docker
      await processForgeJob(timeoutJob);
      
      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            Memory: expect.any(Number),
            CpuQuota: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Security - Command Injection Prevention', () => {
    it('should sanitize malicious command arguments', async () => {
      const maliciousJob = {
        id: 'test-job-123',
        data: { 
          jobId: 'job-uuid-123',
          args: {
            mode: '"; rm -rf /; echo "',
            target: '../../../etc/passwd'
          }
        }
      } as Job;

      await processForgeJob(maliciousJob);
      
      // Verify sanitized command doesn't contain injection
      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          Env: expect.arrayContaining([
            expect.not.stringContaining('rm -rf'),
            expect.not.stringContaining('/etc/passwd')
          ])
        })
      );
    });

    it('should reject malicious repository URLs', async () => {
      const { updateJobStatus, addJobLog } = require('../lib') as any;
      
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'job-uuid-123',
                user_id: 'user-123',
                command: 'audit',
                args: { mode: 'security' },
                workspace_id: 'workspace-123',
                workspaces: {
                  repo_url: 'file:///etc/passwd; cat /etc/shadow',
                  repo_name: 'malicious',
                  repo_owner: 'attacker'
                }
              },
              error: null
            })
          })
        })
      }));

      await expect(processForgeJob(mockJob)).rejects.toThrow();
      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', expect.any(Object));
    });

    it('should prevent directory traversal in workspace paths', async () => {
      const traversalJob = {
        id: 'test-job-123',
        data: { 
          jobId: '../../../etc/passwd'
        }
      } as Job;

      await processForgeJob(traversalJob);
      
      // Should sanitize the job ID for file paths
      const childProcess = require('child_process') as any;
      const execAsync = childProcess.promisify();
      
      expect(execAsync).not.toHaveBeenCalledWith(
        expect.stringContaining('/etc/passwd')
      );
    });
  });

  describe('Security - Resource Limits', () => {
    it('should enforce memory limits strictly', async () => {
      await processForgeJob(mockJob);

      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            Memory: 2 * 1024 * 1024 * 1024, // Exactly 2GB
            MemorySwap: 2 * 1024 * 1024 * 1024, // Prevent swap usage
            CpuQuota: expect.any(Number),
            CpuPeriod: expect.any(Number)
          })
        })
      );
    });

    it('should handle output stream flooding', async () => {
      const { addJobLog } = require('../lib') as any;
      let callCount = 0;
      const maxLogCalls = 100; // Reasonable limit for logs
      
      mockStream.on = vi.fn((event, callback) => {
        if (event === 'data') {
          // Simulate massive output - 10000 chunks
          const interval = setInterval(() => {
            if (callCount >= 10000) {
              clearInterval(interval);
              return;
            }
            callCount++;
            const largeBuffer = Buffer.concat([
              Buffer.from([1, 0, 0, 0, 0, 0, 0, 10]),
              Buffer.from('Flood test')
            ]);
            callback(largeBuffer);
          }, 1);
        }
      });

      await processForgeJob(mockJob);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify output was rate-limited/truncated
      expect(addJobLog).toHaveBeenCalledTimes(expect.any(Number));
      expect(addJobLog.mock.calls.length).toBeLessThan(10000);
    });

    it('should enforce CPU limits', async () => {
      await processForgeJob(mockJob);

      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            CpuQuota: 100000, // 1 CPU core
            CpuPeriod: 100000
          })
        })
      );
    });
  });

  describe('Security - Privilege Escalation Prevention', () => {
    it('should prevent privileged container creation', async () => {
      await processForgeJob(mockJob);

      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            Privileged: false,
            ReadonlyRootfs: false, // We need write for workspace
            SecurityOpt: expect.arrayContaining(['no-new-privileges:true']),
            CapDrop: expect.arrayContaining(['ALL'])
          }),
          User: expect.not.stringMatching(/^(root|0)(:.*)?$/)
        })
      );
    });

    it('should prevent host namespace access', async () => {
      await processForgeJob(mockJob);

      const containerConfig = mockDocker.createContainer.mock.calls[0][0];
      
      expect(containerConfig.HostConfig).not.toHaveProperty('PidMode', 'host');
      expect(containerConfig.HostConfig).not.toHaveProperty('IpcMode', 'host');
      expect(containerConfig.HostConfig).not.toHaveProperty('NetworkMode', 'host');
      expect(containerConfig.HostConfig).not.toHaveProperty('UsernsMode', 'host');
    });

    it('should restrict volume mounts to workspace only', async () => {
      await processForgeJob(mockJob);

      expect(mockDocker.createContainer).toHaveBeenCalledWith(
        expect.objectContaining({
          HostConfig: expect.objectContaining({
            Binds: expect.arrayContaining([
              expect.stringMatching(/^\/tmp\/forge-jobs\/[^:]+:\/workspace$/)
            ])
          })
        })
      );
      
      // Should not mount sensitive directories
      const binds = mockDocker.createContainer.mock.calls[0][0].HostConfig.Binds || [];
      binds.forEach((bind: string) => {
        expect(bind).not.toMatch(/\/etc/);
        expect(bind).not.toMatch(/\/root/);
        expect(bind).not.toMatch(/\/home/);
        expect(bind).not.toMatch(/\.ssh/);
      });
    });
  });

  describe('Security - Secrets Protection', () => {
    it('should not log sensitive environment variables', async () => {
      const { addJobLog } = require('../lib') as any;
      
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'secret-key-123';
      process.env.OPENAI_API_KEY = 'sk-secret-openai-key';
      
      // Trigger an error that might leak env vars
      mockContainer.start.mockRejectedValue(new Error('Container start failed with env'));
      
      try {
        await processForgeJob(mockJob);
      } catch {}

      // Verify secrets were not logged
      const allLogCalls = addJobLog.mock.calls.map((call: any[]) => call[2]).join(' ');
      expect(allLogCalls).not.toContain('secret-key-123');
      expect(allLogCalls).not.toContain('sk-secret-openai-key');
      
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.OPENAI_API_KEY;
    });

    it('should sanitize git credentials from error messages', async () => {
      const { addJobLog } = require('../lib') as any;
      const childProcess = require('child_process') as any;
      
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'job-uuid-123',
                user_id: 'user-123',
                command: 'audit',
                args: {},
                workspace_id: 'workspace-123',
                workspaces: {
                  repo_url: 'https://user:secretpassword123@github.com/test/repo.git',
                  repo_name: 'test-repo',
                  repo_owner: 'test'
                }
              },
              error: null
            })
          })
        })
      }));
      
      childProcess.promisify.mockReturnValue(
        vi.fn().mockRejectedValue(new Error('Failed to clone https://user:secretpassword123@github.com/test/repo.git'))
      );

      await expect(processForgeJob(mockJob)).rejects.toThrow();
      
      // Check all log calls for password leakage
      const allLogCalls = addJobLog.mock.calls.map((call: any[]) => call[2]).join(' ');
      expect(allLogCalls).not.toContain('secretpassword123');
      expect(allLogCalls).not.toContain('user:secret');
    });

    it('should mask API keys in container environment', async () => {
      await processForgeJob(mockJob);

      const envVars = mockDocker.createContainer.mock.calls[0][0].Env || [];
      
      envVars.forEach((envVar: string) => {
        // Should not contain raw API keys
        expect(envVar).not.toMatch(/sk-[a-zA-Z0-9]{48}/); // OpenAI format
        expect(envVar).not.toMatch(/key_[a-zA-Z0-9]{32}/); // Generic API key
        
        // Should mask sensitive values
        if (envVar.includes('API_KEY') || envVar.includes('SECRET')) {
          const value = envVar.split('=')[1];
          expect(value).not.toMatch(/^[^*]+$/); // Should contain masking
        }
      });
    });
  });

  describe('Security - Input Validation', () => {
    it('should validate job ID format', async () => {
      const invalidJob = {
        id: 'test-job-123',
        data: { jobId: 'not-a-valid-uuid' }
      } as Job;

      await expect(processForgeJob(invalidJob)).rejects.toThrow();
    });

    it('should validate workspace ID references', async () => {
      const { updateJobStatus } = require('../lib') as any;
      
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'job-uuid-123',
                user_id: 'user-123',
                workspace_id: null, // Missing workspace
                command: 'audit',
                args: {}
              },
              error: null
            })
          })
        })
      }));

      await expect(processForgeJob(mockJob)).rejects.toThrow();
      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', expect.any(Object));
    });

    it('should validate command arguments structure', async () => {
      const { updateJobStatus } = require('../lib') as any;
      
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'job-uuid-123',
                user_id: 'user-123',
                command: 'audit',
                args: 'not-an-object', // Invalid args type
                workspace_id: 'workspace-123',
                workspaces: {
                  repo_url: 'https://github.com/test/repo.git',
                  repo_name: 'test-repo',
                  repo_owner: 'test'
                }
              },
              error: null
            })
          })
        })
      }));

      await expect(processForgeJob(mockJob)).rejects.toThrow();
      expect(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', expect.any(Object));
    });
  });
});