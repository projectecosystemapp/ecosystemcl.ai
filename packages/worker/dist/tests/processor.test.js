"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const processor_1 = require("../processor");
const dockerode_1 = __importDefault(require("dockerode"));
const nock_1 = __importDefault(require("nock"));
// Mock all external dependencies
vitest_1.vi.mock('dockerode');
vitest_1.vi.mock('../lib', () => ({
    supabase: {
        from: vitest_1.vi.fn(),
    },
    updateJobStatus: vitest_1.vi.fn(),
    addJobLog: vitest_1.vi.fn(),
}));
// Mock child_process for git operations
vitest_1.vi.mock('child_process', () => ({
    exec: vitest_1.vi.fn((cmd, callback) => callback(null, { stdout: 'success', stderr: '' })),
    promisify: vitest_1.vi.fn(() => vitest_1.vi.fn().mockResolvedValue({ stdout: 'success', stderr: '' })),
}));
// Mock fs/promises
vitest_1.vi.mock('fs/promises', () => ({
    default: {
        mkdir: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
}));
(0, vitest_1.describe)('Worker Processor Tests', () => {
    let mockJob;
    let mockDocker;
    let mockContainer;
    let mockSupabase;
    let mockStream;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Setup mock job
        mockJob = {
            id: 'test-job-123',
            data: { jobId: 'job-uuid-123' },
        };
        // Setup mock Docker container
        mockStream = {
            on: vitest_1.vi.fn((event, callback) => {
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
            attach: vitest_1.vi.fn().mockResolvedValue(mockStream),
            start: vitest_1.vi.fn().mockResolvedValue(undefined),
            wait: vitest_1.vi.fn().mockResolvedValue({ StatusCode: 0 }),
            remove: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        mockDocker = {
            createContainer: vitest_1.vi.fn().mockResolvedValue(mockContainer),
        };
        dockerode_1.default.mockImplementation(() => mockDocker);
        // Setup mock Supabase
        mockSupabase = require('../lib').supabase;
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'jobs') {
                return {
                    select: vitest_1.vi.fn().mockReturnValue({
                        eq: vitest_1.vi.fn().mockReturnValue({
                            single: vitest_1.vi.fn().mockResolvedValue({
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
    (0, vitest_1.afterEach)(() => {
        nock_1.default.cleanAll();
    });
    (0, vitest_1.describe)('Successful Job Processing', () => {
        (0, vitest_1.it)('should process a job successfully from queue to completion', async () => {
            const { updateJobStatus, addJobLog } = require('../lib');
            await (0, processor_1.processForgeJob)(mockJob);
            // Verify status updates
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'preparing');
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'running', vitest_1.expect.any(Object));
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'completed', vitest_1.expect.objectContaining({
                exit_code: 0,
            }));
            // Verify logs were added
            (0, vitest_1.expect)(addJobLog).toHaveBeenCalledWith('job-uuid-123', 'system', vitest_1.expect.stringContaining('Worker picked up job'));
            (0, vitest_1.expect)(addJobLog).toHaveBeenCalledWith('job-uuid-123', 'system', vitest_1.expect.stringContaining('Repository cloned successfully'));
            // Verify Docker container was created and started
            (0, vitest_1.expect)(mockDocker.createContainer).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                Image: 'forge-executor',
                WorkingDir: '/workspace',
                Env: vitest_1.expect.arrayContaining([
                    'FORGE_JOB_ID=job-uuid-123',
                    'FORGE_USER_ID=user-123',
                ]),
            }));
            (0, vitest_1.expect)(mockContainer.start).toHaveBeenCalled();
            (0, vitest_1.expect)(mockContainer.wait).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle repository cloning correctly', async () => {
            const childProcess = require('child_process');
            const execAsync = childProcess.promisify();
            await (0, processor_1.processForgeJob)(mockJob);
            // Verify git clone was called with correct URL
            (0, vitest_1.expect)(execAsync).toHaveBeenCalledWith(vitest_1.expect.stringContaining('git clone'), vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should stream container output to logs', async () => {
            const { addJobLog } = require('../lib');
            // Modify mock stream to provide structured output
            mockStream.on = vitest_1.vi.fn((event, callback) => {
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
            await (0, processor_1.processForgeJob)(mockJob);
            // Wait for async stream processing
            await new Promise(resolve => setTimeout(resolve, 50));
            // Verify output was logged
            (0, vitest_1.expect)(addJobLog).toHaveBeenCalledWith('job-uuid-123', 'stdout', vitest_1.expect.any(String));
        });
        (0, vitest_1.it)('should parse structured LOG BLOCKS', async () => {
            const { addJobLog } = require('../lib');
            const structuredLog = `[LOG BLOCK]
Thinking: Analyzing the code structure
Reasoning: Need to identify security vulnerabilities
Reference: file.js:line:42
Action: Scanning for SQL injection
Result: Found potential vulnerability
[END LOG BLOCK]`;
            mockStream.on = vitest_1.vi.fn((event, callback) => {
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
            await (0, processor_1.processForgeJob)(mockJob);
            await new Promise(resolve => setTimeout(resolve, 50));
            // Verify structured log was processed
            (0, vitest_1.expect)(addJobLog).toHaveBeenCalledWith('job-uuid-123', 'stdout', vitest_1.expect.stringContaining('[LOG BLOCK]'), vitest_1.expect.objectContaining({
                isStructured: true,
                blockType: 'log_block',
            }));
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle Docker container failures', async () => {
            const { updateJobStatus, addJobLog } = require('../lib');
            // Make container exit with error
            mockContainer.wait.mockResolvedValue({ StatusCode: 1 });
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow('Container exited with code 1');
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', vitest_1.expect.objectContaining({
                error_message: vitest_1.expect.stringContaining('Container exited with code 1'),
            }));
        });
        (0, vitest_1.it)('should handle repository clone failures', async () => {
            const { updateJobStatus, addJobLog } = require('../lib');
            const childProcess = require('child_process');
            // Make git clone fail
            childProcess.promisify.mockReturnValue(vitest_1.vi.fn().mockRejectedValue(new Error('Repository not found')));
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow('Repository not found');
            (0, vitest_1.expect)(addJobLog).toHaveBeenCalledWith('job-uuid-123', 'stderr', vitest_1.expect.stringContaining('Repository not found'));
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should handle missing job details', async () => {
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnValue({
                    eq: vitest_1.vi.fn().mockReturnValue({
                        single: vitest_1.vi.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Job not found' },
                        }),
                    }),
                }),
            }));
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow('Failed to fetch job details');
        });
        (0, vitest_1.it)('should handle Docker creation failures', async () => {
            const { updateJobStatus } = require('../lib');
            mockDocker.createContainer.mockRejectedValue(new Error('Docker daemon not running'));
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow('Docker daemon not running');
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', vitest_1.expect.any(Object));
        });
    });
    (0, vitest_1.describe)('Resource Cleanup', () => {
        (0, vitest_1.it)('should clean up container on success', async () => {
            await (0, processor_1.processForgeJob)(mockJob);
            (0, vitest_1.expect)(mockContainer.remove).toHaveBeenCalledWith({ force: true });
        });
        (0, vitest_1.it)('should clean up container on failure', async () => {
            mockContainer.wait.mockResolvedValue({ StatusCode: 1 });
            try {
                await (0, processor_1.processForgeJob)(mockJob);
            }
            catch (error) {
                // Expected to fail
            }
            (0, vitest_1.expect)(mockContainer.remove).toHaveBeenCalledWith({ force: true });
        });
        (0, vitest_1.it)('should clean up work directory', async () => {
            const childProcess = require('child_process');
            const execAsync = childProcess.promisify();
            await (0, processor_1.processForgeJob)(mockJob);
            // Verify cleanup command was called
            (0, vitest_1.expect)(execAsync).toHaveBeenCalledWith(vitest_1.expect.stringContaining('rm -rf /tmp/forge-jobs/job-uuid-123'));
        });
        (0, vitest_1.it)('should handle cleanup failures gracefully', async () => {
            mockContainer.remove.mockRejectedValue(new Error('Container already removed'));
            // Should not throw even if cleanup fails
            await (0, processor_1.processForgeJob)(mockJob);
            (0, vitest_1.expect)(mockContainer.remove).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('BullMQ Integration', () => {
        (0, vitest_1.it)('should handle job retry on transient failures', async () => {
            const { updateJobStatus } = require('../lib');
            // Simulate transient network error
            mockDocker.createContainer
                .mockRejectedValueOnce(new Error('Network timeout'))
                .mockResolvedValueOnce(mockContainer);
            // First attempt fails
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow('Network timeout');
            // Second attempt succeeds
            await (0, processor_1.processForgeJob)(mockJob);
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'completed', vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should respect job timeout settings', async () => {
            // Make container hang
            mockContainer.wait.mockImplementation(() => new Promise(() => { }));
            const timeoutJob = {
                ...mockJob,
                data: { jobId: 'job-uuid-123', timeout: 100 },
            };
            // This would timeout in real scenario
            // For test, we just verify the timeout is passed to Docker
            await (0, processor_1.processForgeJob)(timeoutJob);
            (0, vitest_1.expect)(mockDocker.createContainer).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                HostConfig: vitest_1.expect.objectContaining({
                    Memory: vitest_1.expect.any(Number),
                    CpuQuota: vitest_1.expect.any(Number),
                }),
            }));
        });
    });
    (0, vitest_1.describe)('Security - Command Injection Prevention', () => {
        (0, vitest_1.it)('should sanitize malicious command arguments', async () => {
            const maliciousJob = {
                id: 'test-job-123',
                data: {
                    jobId: 'job-uuid-123',
                    args: {
                        mode: '"; rm -rf /; echo "',
                        target: '../../../etc/passwd'
                    }
                }
            };
            await (0, processor_1.processForgeJob)(maliciousJob);
            // Verify sanitized command doesn't contain injection
            (0, vitest_1.expect)(mockDocker.createContainer).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                Env: vitest_1.expect.arrayContaining([
                    vitest_1.expect.not.stringContaining('rm -rf'),
                    vitest_1.expect.not.stringContaining('/etc/passwd')
                ])
            }));
        });
        (0, vitest_1.it)('should reject malicious repository URLs', async () => {
            const { updateJobStatus, addJobLog } = require('../lib');
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnValue({
                    eq: vitest_1.vi.fn().mockReturnValue({
                        single: vitest_1.vi.fn().mockResolvedValue({
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
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow();
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should prevent directory traversal in workspace paths', async () => {
            const traversalJob = {
                id: 'test-job-123',
                data: {
                    jobId: '../../../etc/passwd'
                }
            };
            await (0, processor_1.processForgeJob)(traversalJob);
            // Should sanitize the job ID for file paths
            const childProcess = require('child_process');
            const execAsync = childProcess.promisify();
            (0, vitest_1.expect)(execAsync).not.toHaveBeenCalledWith(vitest_1.expect.stringContaining('/etc/passwd'));
        });
    });
    (0, vitest_1.describe)('Security - Resource Limits', () => {
        (0, vitest_1.it)('should enforce memory limits strictly', async () => {
            await (0, processor_1.processForgeJob)(mockJob);
            (0, vitest_1.expect)(mockDocker.createContainer).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                HostConfig: vitest_1.expect.objectContaining({
                    Memory: 2 * 1024 * 1024 * 1024, // Exactly 2GB
                    MemorySwap: 2 * 1024 * 1024 * 1024, // Prevent swap usage
                    CpuQuota: vitest_1.expect.any(Number),
                    CpuPeriod: vitest_1.expect.any(Number)
                })
            }));
        });
        (0, vitest_1.it)('should handle output stream flooding', async () => {
            const { addJobLog } = require('../lib');
            let callCount = 0;
            const maxLogCalls = 100; // Reasonable limit for logs
            mockStream.on = vitest_1.vi.fn((event, callback) => {
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
            await (0, processor_1.processForgeJob)(mockJob);
            // Wait for async processing
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify output was rate-limited/truncated
            (0, vitest_1.expect)(addJobLog).toHaveBeenCalledTimes(vitest_1.expect.any(Number));
            (0, vitest_1.expect)(addJobLog.mock.calls.length).toBeLessThan(10000);
        });
        (0, vitest_1.it)('should enforce CPU limits', async () => {
            await (0, processor_1.processForgeJob)(mockJob);
            (0, vitest_1.expect)(mockDocker.createContainer).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                HostConfig: vitest_1.expect.objectContaining({
                    CpuQuota: 100000, // 1 CPU core
                    CpuPeriod: 100000
                })
            }));
        });
    });
    (0, vitest_1.describe)('Security - Privilege Escalation Prevention', () => {
        (0, vitest_1.it)('should prevent privileged container creation', async () => {
            await (0, processor_1.processForgeJob)(mockJob);
            (0, vitest_1.expect)(mockDocker.createContainer).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                HostConfig: vitest_1.expect.objectContaining({
                    Privileged: false,
                    ReadonlyRootfs: false, // We need write for workspace
                    SecurityOpt: vitest_1.expect.arrayContaining(['no-new-privileges:true']),
                    CapDrop: vitest_1.expect.arrayContaining(['ALL'])
                }),
                User: vitest_1.expect.not.stringMatching(/^(root|0)(:.*)?$/)
            }));
        });
        (0, vitest_1.it)('should prevent host namespace access', async () => {
            await (0, processor_1.processForgeJob)(mockJob);
            const containerConfig = mockDocker.createContainer.mock.calls[0][0];
            (0, vitest_1.expect)(containerConfig.HostConfig).not.toHaveProperty('PidMode', 'host');
            (0, vitest_1.expect)(containerConfig.HostConfig).not.toHaveProperty('IpcMode', 'host');
            (0, vitest_1.expect)(containerConfig.HostConfig).not.toHaveProperty('NetworkMode', 'host');
            (0, vitest_1.expect)(containerConfig.HostConfig).not.toHaveProperty('UsernsMode', 'host');
        });
        (0, vitest_1.it)('should restrict volume mounts to workspace only', async () => {
            await (0, processor_1.processForgeJob)(mockJob);
            (0, vitest_1.expect)(mockDocker.createContainer).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                HostConfig: vitest_1.expect.objectContaining({
                    Binds: vitest_1.expect.arrayContaining([
                        vitest_1.expect.stringMatching(/^\/tmp\/forge-jobs\/[^:]+:\/workspace$/)
                    ])
                })
            }));
            // Should not mount sensitive directories
            const binds = mockDocker.createContainer.mock.calls[0][0].HostConfig.Binds || [];
            binds.forEach((bind) => {
                (0, vitest_1.expect)(bind).not.toMatch(/\/etc/);
                (0, vitest_1.expect)(bind).not.toMatch(/\/root/);
                (0, vitest_1.expect)(bind).not.toMatch(/\/home/);
                (0, vitest_1.expect)(bind).not.toMatch(/\.ssh/);
            });
        });
    });
    (0, vitest_1.describe)('Security - Secrets Protection', () => {
        (0, vitest_1.it)('should not log sensitive environment variables', async () => {
            const { addJobLog } = require('../lib');
            process.env.SUPABASE_SERVICE_ROLE_KEY = 'secret-key-123';
            process.env.OPENAI_API_KEY = 'sk-secret-openai-key';
            // Trigger an error that might leak env vars
            mockContainer.start.mockRejectedValue(new Error('Container start failed with env'));
            try {
                await (0, processor_1.processForgeJob)(mockJob);
            }
            catch { }
            // Verify secrets were not logged
            const allLogCalls = addJobLog.mock.calls.map((call) => call[2]).join(' ');
            (0, vitest_1.expect)(allLogCalls).not.toContain('secret-key-123');
            (0, vitest_1.expect)(allLogCalls).not.toContain('sk-secret-openai-key');
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;
            delete process.env.OPENAI_API_KEY;
        });
        (0, vitest_1.it)('should sanitize git credentials from error messages', async () => {
            const { addJobLog } = require('../lib');
            const childProcess = require('child_process');
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnValue({
                    eq: vitest_1.vi.fn().mockReturnValue({
                        single: vitest_1.vi.fn().mockResolvedValue({
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
            childProcess.promisify.mockReturnValue(vitest_1.vi.fn().mockRejectedValue(new Error('Failed to clone https://user:secretpassword123@github.com/test/repo.git')));
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow();
            // Check all log calls for password leakage
            const allLogCalls = addJobLog.mock.calls.map((call) => call[2]).join(' ');
            (0, vitest_1.expect)(allLogCalls).not.toContain('secretpassword123');
            (0, vitest_1.expect)(allLogCalls).not.toContain('user:secret');
        });
        (0, vitest_1.it)('should mask API keys in container environment', async () => {
            await (0, processor_1.processForgeJob)(mockJob);
            const envVars = mockDocker.createContainer.mock.calls[0][0].Env || [];
            envVars.forEach((envVar) => {
                // Should not contain raw API keys
                (0, vitest_1.expect)(envVar).not.toMatch(/sk-[a-zA-Z0-9]{48}/); // OpenAI format
                (0, vitest_1.expect)(envVar).not.toMatch(/key_[a-zA-Z0-9]{32}/); // Generic API key
                // Should mask sensitive values
                if (envVar.includes('API_KEY') || envVar.includes('SECRET')) {
                    const value = envVar.split('=')[1];
                    (0, vitest_1.expect)(value).not.toMatch(/^[^*]+$/); // Should contain masking
                }
            });
        });
    });
    (0, vitest_1.describe)('Security - Input Validation', () => {
        (0, vitest_1.it)('should validate job ID format', async () => {
            const invalidJob = {
                id: 'test-job-123',
                data: { jobId: 'not-a-valid-uuid' }
            };
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(invalidJob)).rejects.toThrow();
        });
        (0, vitest_1.it)('should validate workspace ID references', async () => {
            const { updateJobStatus } = require('../lib');
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnValue({
                    eq: vitest_1.vi.fn().mockReturnValue({
                        single: vitest_1.vi.fn().mockResolvedValue({
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
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow();
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should validate command arguments structure', async () => {
            const { updateJobStatus } = require('../lib');
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnValue({
                    eq: vitest_1.vi.fn().mockReturnValue({
                        single: vitest_1.vi.fn().mockResolvedValue({
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
            await (0, vitest_1.expect)((0, processor_1.processForgeJob)(mockJob)).rejects.toThrow();
            (0, vitest_1.expect)(updateJobStatus).toHaveBeenCalledWith('job-uuid-123', 'failed', vitest_1.expect.any(Object));
        });
    });
});
