#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const chalk = require('chalk');

class AgentDispatcher {
  constructor() {
    this.agentsDir = path.resolve(__dirname, '..', 'agents');
    this.agentCache = new Map();
    this.activeStreams = new Map();
  }

  /**
   * Load agent configuration from YAML file
   */
  async loadAgentConfig(agentName) {
    if (this.agentCache.has(agentName)) {
      return this.agentCache.get(agentName);
    }

    const configPath = path.join(this.agentsDir, `${agentName}.yaml`);
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(configContent);
      this.agentCache.set(agentName, config);
      return config;
    } catch (error) {
      throw new Error(`Failed to load agent config for ${agentName}: ${error.message}`);
    }
  }

  /**
   * Construct the full prompt for the agent including system prompt and task
   */
  buildAgentPrompt(agentConfig, taskPrompt, context = {}) {
    const systemPrompt = agentConfig.system_prompt || '';
    const objectives = agentConfig.objectives ? 
      `\nObjectives:\n${agentConfig.objectives.map(o => `- ${o}`).join('\n')}` : '';
    
    const contextStr = context.files ? 
      `\nContext Files:\n${context.files.map(f => `- ${f}`).join('\n')}` : '';

    return `${systemPrompt}${objectives}

Task: ${taskPrompt}${contextStr}

Working Directory: ${context.workingDirectory || process.cwd()}

REMINDER: You MUST follow the LOG BLOCK format for every action. Each block must include Thinking, Reasoning, Reference, Action, and Result.`;
  }

  /**
   * Parse structured log blocks from agent output
   */
  parseLogBlock(text) {
    const blocks = [];
    const logBlockRegex = /---\s*\nLOG BLOCK (\d+)([\s\S]*?)(?=---\s*\nLOG BLOCK|---\s*$|$)/g;
    let match;

    while ((match = logBlockRegex.exec(text)) !== null) {
      const blockNumber = match[1];
      const blockContent = match[2];
      
      const thinking = blockContent.match(/Thinking:\s*(.+?)(?=\n|$)/)?.[1]?.trim();
      const reasoning = blockContent.match(/Reasoning:\s*([\s\S]+?)(?=\nReference:|$)/)?.[1]?.trim();
      const reference = blockContent.match(/Reference:\s*(.+?)(?=\n|$)/)?.[1]?.trim();
      const action = blockContent.match(/Action:\s*(.+?)(?=\n|$)/)?.[1]?.trim();
      const result = blockContent.match(/Result:\s*([\s\S]+?)(?=\n---|\n$|$)/)?.[1]?.trim();

      blocks.push({
        number: parseInt(blockNumber),
        thinking,
        reasoning,
        reference,
        action,
        result,
        timestamp: new Date().toISOString()
      });
    }

    return blocks;
  }

  /**
   * Format and display a log block in the console
   */
  displayLogBlock(block, agentName) {
    console.log(chalk.gray('─'.repeat(80)));
    console.log(chalk.cyan.bold(`[${agentName}] LOG BLOCK ${block.number}`));
    
    if (block.thinking) {
      console.log(chalk.yellow('Thinking:'), block.thinking);
    }
    
    if (block.reasoning) {
      console.log(chalk.magenta('Reasoning:'), block.reasoning);
    }
    
    if (block.reference) {
      console.log(chalk.blue('Reference:'), block.reference);
    }
    
    if (block.action) {
      console.log(chalk.green('Action:'), block.action);
    }
    
    if (block.result) {
      const isError = block.result.toLowerCase().includes('error') || 
                      block.result.toLowerCase().includes('vulnerability') ||
                      block.result.toLowerCase().includes('critical');
      const color = isError ? chalk.red : chalk.white;
      console.log(color('Result:'), block.result);
    }
  }

  /**
   * Execute Claude with streaming output
   */
  async executeClaudeStreaming(prompt, workingDirectory, agentName, onLogBlock) {
    return new Promise((resolve, reject) => {
      const tempFile = path.join('/tmp', `agent-prompt-${Date.now()}.txt`);
      let fullOutput = '';
      let currentBuffer = '';
      let processedBlocks = new Set();
      
      // Write prompt to temp file
      fs.writeFile(tempFile, prompt)
        .then(() => {
          const child = spawn('claude', [
            '--print',
            '--model', 'claude-opus-4-1-20250805',
            '--allowed-tools', 'Bash(git:*) Read Grep'
          ], {
            cwd: workingDirectory,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          // Feed the prompt through stdin
          fs.readFile(tempFile)
            .then(content => {
              child.stdin.write(content);
              child.stdin.end();
            })
            .catch(reject);

          // Handle stdout - streaming
          child.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            fullOutput += text;
            currentBuffer += text;
            
            // Try to parse complete log blocks from buffer
            const blocks = this.parseLogBlock(currentBuffer);
            
            blocks.forEach(block => {
              const blockKey = `${block.number}-${block.thinking}`;
              if (!processedBlocks.has(blockKey)) {
                processedBlocks.add(blockKey);
                this.displayLogBlock(block, agentName);
                
                if (onLogBlock) {
                  onLogBlock(block);
                }
              }
            });
            
            // Check if buffer ends with incomplete block
            if (currentBuffer.includes('LOG BLOCK') && !currentBuffer.endsWith('---')) {
              // Keep the incomplete block in buffer
              const lastBlockStart = currentBuffer.lastIndexOf('LOG BLOCK');
              if (lastBlockStart > 0) {
                currentBuffer = currentBuffer.substring(lastBlockStart - 4); // Include the --- before LOG BLOCK
              }
            } else if (currentBuffer.endsWith('---')) {
              // Clear buffer after complete block
              currentBuffer = '';
            }
          });

          // Handle stderr
          child.stderr.on('data', (chunk) => {
            const error = chunk.toString();
            if (!error.includes('Warning') && !error.includes('info')) {
              console.error(chalk.red(`[${agentName} STDERR]`), error);
            }
          });

          // Handle exit
          child.on('close', (code) => {
            // Clean up temp file
            fs.unlink(tempFile).catch(() => {});
            
            if (code === 0) {
              resolve({
                output: fullOutput,
                blocks: this.parseLogBlock(fullOutput),
                exitCode: code
              });
            } else {
              reject(new Error(`Claude exited with code ${code}`));
            }
          });

          child.on('error', (error) => {
            fs.unlink(tempFile).catch(() => {});
            reject(error);
          });

          // Store reference for potential cancellation
          this.activeStreams.set(agentName, child);
        })
        .catch(reject);
    });
  }

  /**
   * Execute Claude CLI with the agent's prompt
   */
  async executeClaudeCall(prompt, workingDirectory) {
    const tempFile = path.join('/tmp', `agent-prompt-${Date.now()}.txt`);
    
    try {
      // Write prompt to temp file to avoid shell escaping issues
      await fs.writeFile(tempFile, prompt);
      
      // Execute Claude CLI in headless mode
      const command = `cd "${workingDirectory}" && claude --print --model claude-opus-4-1-20250805 < "${tempFile}"`;
      
      console.log(`\n🤖 Dispatching to Claude...`);
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large responses
        timeout: 900000 // 15 minute timeout
      });

      if (stderr && !stderr.includes('Warning')) {
        console.error(`⚠️  Agent stderr: ${stderr}`);
      }

      return stdout;
    } catch (error) {
      throw new Error(`Claude execution failed: ${error.message}`);
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Main dispatch method with streaming support
   */
  async dispatch(agentName, taskPrompt, options = {}) {
    const {
      workingDirectory = process.cwd(),
      files = [],
      streaming = true,
      onLogBlock = null,
      timeout = 900000, // 15 minutes default
      retries = 1
    } = options;

    console.log(chalk.bold.cyan(`\n📋 Dispatching task to ${agentName}`));
    console.log(chalk.gray(`   Working directory: ${workingDirectory}`));
    console.log(chalk.gray(`   Timeout: ${timeout / 1000}s`));
    console.log(chalk.gray(`   Streaming: ${streaming ? 'enabled' : 'disabled'}`));
    
    try {
      // Load agent configuration
      const agentConfig = await this.loadAgentConfig(agentName);
      
      // Build the complete prompt
      const fullPrompt = this.buildAgentPrompt(agentConfig, taskPrompt, {
        workingDirectory,
        files
      });

      // Execute with retries
      let lastError;
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          let result;
          
          if (streaming) {
            // Set up timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                // Kill the process if it's still running
                const child = this.activeStreams.get(agentName);
                if (child) {
                  child.kill('SIGTERM');
                  this.activeStreams.delete(agentName);
                }
                reject(new Error(`Agent ${agentName} timed out after ${timeout / 1000} seconds`));
              }, timeout);
            });

            // Race between execution and timeout
            const executionResult = await Promise.race([
              this.executeClaudeStreaming(fullPrompt, workingDirectory, agentName, onLogBlock),
              timeoutPromise
            ]);
            
            result = {
              agent: agentName,
              blocks: executionResult.blocks || [],
              raw: executionResult.output,
              timestamp: new Date().toISOString(),
              success: true
            };
          } else {
            // Legacy non-streaming mode
            const response = await this.executeClaudeCall(fullPrompt, workingDirectory);
            result = this.parseAgentResponse(response, agentConfig);
          }
          
          // Clean up stream reference
          this.activeStreams.delete(agentName);
          
          console.log(chalk.green(`\n✅ ${agentName} completed successfully`));
          return result;
          
        } catch (error) {
          lastError = error;
          this.activeStreams.delete(agentName);
          
          if (attempt < retries) {
            console.log(chalk.yellow(`⚠️  Attempt ${attempt} failed, retrying...`));
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between retries
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      console.error(chalk.red(`\n❌ ${agentName} failed: ${error.message}`));
      this.activeStreams.delete(agentName);
      throw error;
    }
  }

  /**
   * Parse and structure the agent's response
   */
  parseAgentResponse(rawResponse, agentConfig) {
    // Extract structured data if the agent provides it
    const result = {
      raw: rawResponse,
      timestamp: new Date().toISOString(),
      agent: agentConfig.name
    };

    // Try to extract specific patterns based on agent type
    if (agentConfig.output_format === 'structured') {
      // Look for JSON blocks in the response
      const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          result.structured = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.warn('Failed to parse structured output');
        }
      }
    }

    // Extract file changes if present
    const fileChanges = this.extractFileChanges(rawResponse);
    if (fileChanges.length > 0) {
      result.fileChanges = fileChanges;
    }

    // Extract issues found (for review agents)
    const issues = this.extractIssues(rawResponse);
    if (issues.length > 0) {
      result.issues = issues;
    }

    return result;
  }

  /**
   * Extract file changes from agent response
   */
  extractFileChanges(response) {
    const changes = [];
    const filePattern = /(?:Created|Modified|Deleted):\s+(.+)/g;
    let match;
    
    while ((match = filePattern.exec(response)) !== null) {
      changes.push({
        file: match[1].trim(),
        action: match[0].split(':')[0].toLowerCase()
      });
    }
    
    return changes;
  }

  /**
   * Extract issues/findings from review agents
   */
  extractIssues(response) {
    const issues = [];
    const issuePattern = /(?:Issue|Error|Warning|Bug)(?:\s+\d+)?:\s+(.+?)(?:\n|$)/gi;
    let match;
    
    while ((match = issuePattern.exec(response)) !== null) {
      const severity = match[0].split(/[:\s]/)[0].toLowerCase();
      issues.push({
        severity,
        description: match[1].trim()
      });
    }
    
    return issues;
  }

  /**
   * Dispatch multiple agents in parallel
   */
  async dispatchParallel(tasks) {
    console.log(`\n🚀 Dispatching ${tasks.length} agents in parallel`);
    
    const promises = tasks.map(task => 
      this.dispatch(task.agent, task.prompt, task.options)
        .then(result => ({
          ...result,
          taskId: task.id,
          agent: task.agent
        }))
        .catch(error => ({
          error: error.message,
          taskId: task.id,
          agent: task.agent
        }))
    );

    const results = await Promise.all(promises);
    
    // Separate successful and failed results
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    
    if (failed.length > 0) {
      console.error(`\n⚠️  ${failed.length} agents failed:`);
      failed.forEach(f => console.error(`   - ${f.agent}: ${f.error}`));
    }
    
    console.log(`\n✅ ${successful.length}/${tasks.length} agents completed successfully`);
    
    return {
      successful,
      failed,
      totalTasks: tasks.length
    };
  }
}

module.exports = AgentDispatcher;