import axios from 'axios';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: any, context: ToolContext) => Promise<any>;
  permissions: string[];
}

export interface ToolContext {
  userId: string;
  workspaceId?: string;
  jobId: string;
  agentId: string;
}

export const TOOL_REGISTRY: Record<string, Tool> = {
  web_search: {
    name: 'web_search',
    description: 'Searches the web for real-time information using Tavily API',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to execute'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5
        }
      },
      required: ['query']
    },
    execute: async (args, context) => {
      const { query, max_results = 5 } = args;
      
      try {
        const response = await axios.post('https://api.tavily.com/search', {
          api_key: process.env.TAVILY_API_KEY,
          query,
          max_results,
          search_depth: 'basic',
          include_answer: true,
          include_raw_content: false
        });
        
        return {
          success: true,
          results: response.data.results,
          answer: response.data.answer,
          query: query,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: `Web search failed: ${error.message}`,
          query: query
        };
      }
    },
    permissions: ['web_access']
  },

  file_read: {
    name: 'file_read',
    description: 'Reads the contents of a file in the workspace',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path to the file within the workspace'
        }
      },
      required: ['path']
    },
    execute: async (args, context) => {
      const { path } = args;
      
      try {
        // Security: Ensure path is within workspace
        const safePath = path.replace(/\.\./g, '').replace(/^\//, '');
        const workspacePath = `/tmp/workspaces/${context.workspaceId}/${safePath}`;
        
        const content = await fs.readFile(workspacePath, 'utf-8');
        
        return {
          success: true,
          path: safePath,
          content,
          size: content.length,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to read file: ${error.message}`,
          path: path
        };
      }
    },
    permissions: ['file_access']
  },

  file_write: {
    name: 'file_write',
    description: 'Writes content to a file in the workspace',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path to the file within the workspace'
        },
        content: {
          type: 'string',
          description: 'Content to write to the file'
        },
        create_dirs: {
          type: 'boolean',
          description: 'Create parent directories if they don\'t exist',
          default: true
        }
      },
      required: ['path', 'content']
    },
    execute: async (args, context) => {
      const { path, content, create_dirs = true } = args;
      
      try {
        const safePath = path.replace(/\.\./g, '').replace(/^\//, '');
        const workspacePath = `/tmp/workspaces/${context.workspaceId}/${safePath}`;
        
        if (create_dirs) {
          const dir = workspacePath.substring(0, workspacePath.lastIndexOf('/'));
          await fs.mkdir(dir, { recursive: true });
        }
        
        await fs.writeFile(workspacePath, content, 'utf-8');
        
        return {
          success: true,
          path: safePath,
          size: content.length,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to write file: ${error.message}`,
          path: path
        };
      }
    },
    permissions: ['file_access']
  },

  execute_command: {
    name: 'execute_command',
    description: 'Executes a shell command in a sandboxed environment',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in seconds (default: 30)',
          default: 30
        }
      },
      required: ['command']
    },
    execute: async (args, context) => {
      const { command, timeout = 30 } = args;
      
      try {
        // Security: Whitelist allowed commands
        const allowedCommands = ['npm', 'yarn', 'git', 'ls', 'cat', 'grep', 'find', 'test'];
        const commandWord = command.split(' ')[0];
        
        if (!allowedCommands.includes(commandWord)) {
          return {
            success: false,
            error: `Command '${commandWord}' is not allowed`,
            command: command
          };
        }
        
        const workspaceDir = `/tmp/workspaces/${context.workspaceId}`;
        const { stdout, stderr } = await execAsync(command, {
          cwd: workspaceDir,
          timeout: timeout * 1000,
          maxBuffer: 1024 * 1024 // 1MB buffer
        });
        
        return {
          success: true,
          command,
          stdout,
          stderr,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: `Command execution failed: ${error.message}`,
          command: command
        };
      }
    },
    permissions: ['command_execution']
  },

  cache_get: {
    name: 'cache_get',
    description: 'Retrieves a value from the intelligent cache',
    parameters: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Cache key to retrieve'
        }
      },
      required: ['key']
    },
    execute: async (args, context) => {
      const { key } = args;
      
      try {
        // In production, this would use Redis
        const cacheKey = `${context.userId}:${key}`;
        // Mock cache implementation
        return {
          success: true,
          key: cacheKey,
          value: null, // Would be actual cached value
          hit: false,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: `Cache retrieval failed: ${error.message}`,
          key: key
        };
      }
    },
    permissions: ['cache_access']
  },

  cache_set: {
    name: 'cache_set',
    description: 'Stores a value in the intelligent cache',
    parameters: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Cache key to store under'
        },
        value: {
          type: 'string',
          description: 'Value to cache'
        },
        ttl: {
          type: 'number',
          description: 'Time to live in seconds (default: 3600)',
          default: 3600
        }
      },
      required: ['key', 'value']
    },
    execute: async (args, context) => {
      const { key, value, ttl = 3600 } = args;
      
      try {
        const cacheKey = `${context.userId}:${key}`;
        // In production, this would use Redis
        return {
          success: true,
          key: cacheKey,
          stored: true,
          ttl: ttl,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: `Cache storage failed: ${error.message}`,
          key: key
        };
      }
    },
    permissions: ['cache_access']
  }
};

export const AGENT_TOOL_PERMISSIONS: Record<string, string[]> = {
  'research-agent': ['web_search', 'cache_get', 'cache_set'],
  'code-generator': ['file_read', 'file_write', 'cache_get', 'cache_set'],
  'test-writer': ['file_read', 'file_write', 'execute_command', 'cache_get'],
  'security-auditor': ['file_read', 'execute_command', 'web_search', 'cache_get'],
  'ui-architect': ['file_read', 'file_write', 'web_search', 'cache_get', 'cache_set'],
  'database-expert': ['file_read', 'file_write', 'execute_command', 'cache_get'],
  'devops-manager': ['file_read', 'file_write', 'execute_command', 'cache_get'],
  'performance-optimizer': ['file_read', 'file_write', 'execute_command', 'cache_get']
};

export function getAgentTools(agentId: string): Tool[] {
  const permissions = AGENT_TOOL_PERMISSIONS[agentId] || [];
  return permissions.map(toolName => TOOL_REGISTRY[toolName]).filter(Boolean);
}

export async function executeTool(
  toolName: string, 
  args: any, 
  context: ToolContext
): Promise<any> {
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  
  const agentPermissions = AGENT_TOOL_PERMISSIONS[context.agentId] || [];
  if (!agentPermissions.includes(toolName)) {
    throw new Error(`Agent '${context.agentId}' does not have permission to use tool '${toolName}'`);
  }
  
  return await tool.execute(args, context);
}