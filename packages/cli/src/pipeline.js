#!/usr/bin/env node

const AgentDispatcher = require('./agentDispatcher');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const chalk = require('chalk');

class AuditPipeline {
  constructor(options = {}) {
    this.parallelism = options.parallelism || 4;
    this.mode = options.mode || 'interactive';
    this.dispatcher = new AgentDispatcher();
    this.worktrees = [];
    this.results = [];
    this.sessionId = null;
    this.sessionDir = '.forge/sessions';
    this.completedTasks = new Set();
  }

  /**
   * Initialize session management
   */
  async initializeSession(tasks) {
    // Ensure session directory exists
    await fs.mkdir(this.sessionDir, { recursive: true });
    
    // Generate session ID based on task hash
    const taskHash = crypto.createHash('md5')
      .update(JSON.stringify(tasks.map(t => ({ type: t.type, target: t.target }))))
      .digest('hex').substring(0, 8);
    
    this.sessionId = `audit-${Date.now()}-${taskHash}`;
    
    // Check for existing sessions with same task pattern
    const existingSession = await this.detectPreviousSession(tasks);
    
    if (existingSession && this.mode === 'interactive') {
      console.log(chalk.yellow('\n⚠️  Previous session detected'));
      console.log(chalk.gray(`   Session: ${existingSession.sessionId}`));
      console.log(chalk.gray(`   Completed: ${existingSession.completedTasks.length} tasks`));
      console.log(chalk.gray(`   Created: ${new Date(existingSession.timestamp).toLocaleString()}`));
      
      // In real implementation, would prompt user here
      // For now, we'll auto-resume if less than 1 hour old
      const sessionAge = Date.now() - new Date(existingSession.timestamp).getTime();
      if (sessionAge < 3600000) { // 1 hour
        console.log(chalk.green('   Resuming from checkpoint...'));
        return existingSession;
      }
    }
    
    // Create new session
    await this.saveCheckpoint({
      sessionId: this.sessionId,
      tasks,
      completedTasks: [],
      worktrees: [],
      results: []
    });
    
    return null;
  }

  /**
   * Save checkpoint for session recovery
   */
  async saveCheckpoint(state) {
    const sessionPath = path.join(this.sessionDir, `${state.sessionId || this.sessionId}.json`);
    
    const checkpoint = {
      sessionId: state.sessionId || this.sessionId,
      timestamp: new Date().toISOString(),
      tasks: state.tasks,
      completedTasks: Array.from(state.completedTasks || this.completedTasks),
      worktrees: state.worktrees || this.worktrees,
      results: state.results || this.results,
      parallelism: this.parallelism,
      mode: this.mode
    };
    
    await fs.writeFile(sessionPath, JSON.stringify(checkpoint, null, 2));
    console.log(chalk.gray(`   💾 Checkpoint saved: ${this.sessionId}`));
  }

  /**
   * Load checkpoint from previous session
   */
  async loadCheckpoint(sessionId) {
    const sessionPath = path.join(this.sessionDir, `${sessionId}.json`);
    
    try {
      const data = await fs.readFile(sessionPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(chalk.red(`Failed to load checkpoint: ${error.message}`));
      return null;
    }
  }

  /**
   * Detect previous sessions with matching tasks
   */
  async detectPreviousSession(tasks) {
    try {
      const files = await fs.readdir(this.sessionDir);
      const sessions = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionData = await this.loadCheckpoint(file.replace('.json', ''));
          if (sessionData) {
            // Check if tasks match
            const taskMatch = JSON.stringify(tasks.map(t => ({ type: t.type, target: t.target }))) ===
                            JSON.stringify(sessionData.tasks.map(t => ({ type: t.type, target: t.target })));
            
            if (taskMatch && sessionData.completedTasks.length > 0) {
              sessions.push(sessionData);
            }
          }
        }
      }
      
      // Return most recent matching session
      sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return sessions[0] || null;
      
    } catch (error) {
      // Session directory might not exist yet
      return null;
    }
  }

  /**
   * Resume from checkpoint
   */
  async resumeFromCheckpoint(checkpoint) {
    this.sessionId = checkpoint.sessionId;
    this.completedTasks = new Set(checkpoint.completedTasks);
    this.worktrees = checkpoint.worktrees || [];
    this.results = checkpoint.results || [];
    
    console.log(chalk.green(`\n✅ Resumed session: ${this.sessionId}`));
    console.log(chalk.gray(`   Completed tasks: ${this.completedTasks.size}`));
    
    return checkpoint.tasks;
  }

  /**
   * Main entry point for the audit pipeline
   */
  async execute(tasks) {
    console.log(chalk.bold.cyan('\n🚀 Starting Audit Pipeline'));
    console.log(chalk.gray(`   Mode: ${this.mode}`));
    console.log(chalk.gray(`   Parallelism: ${this.parallelism}`));
    console.log(chalk.gray(`   Tasks: ${tasks.length}`));

    try {
      // Initialize or resume session
      const existingSession = await this.initializeSession(tasks);
      if (existingSession) {
        tasks = await this.resumeFromCheckpoint(existingSession);
      }
      
      // Phase 1: Decompose tasks
      const decomposedTasks = await this.decomposeTasks(tasks);
      
      // Filter out already completed tasks
      const pendingTasks = decomposedTasks.filter(task => !this.completedTasks.has(task.id));
      
      if (pendingTasks.length === 0) {
        console.log(chalk.green('\n✅ All tasks already completed!'));
        return this.results;
      }
      
      console.log(chalk.yellow(`\n📋 Tasks to process: ${pendingTasks.length} (${this.completedTasks.size} already completed)`));
      
      // Phase 2: Create worktrees (only for pending tasks)
      await this.createWorktrees(pendingTasks);
      
      // Phase 3: Execute agents in parallel with checkpointing
      const results = await this.executeAgents(pendingTasks);
      
      // Phase 4: Integrate results
      const integration = await this.integrateResults(results);
      
      // Phase 5: Generate report and PR
      await this.finalizeAudit(integration);
      
      // Cleanup
      await this.cleanup();
      
      return integration;
    } catch (error) {
      console.error(chalk.red(`\n❌ Pipeline failed: ${error.message}`));
      
      // Save checkpoint on failure
      await this.saveCheckpoint({
        tasks,
        completedTasks: Array.from(this.completedTasks),
        worktrees: this.worktrees,
        results: this.results
      });
      
      console.log(chalk.yellow('\n💡 Session saved. Run the same command to resume from checkpoint.'));
      
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Find target files for granular analysis
   */
  async findTargetFiles(target, _pattern = '*.{ts,tsx,js,jsx}') {
    try {
      const { stdout } = await execAsync(`find ${target} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) | grep -v node_modules | head -20`);
      return stdout.trim().split('\n').filter(f => f.length > 0);
    } catch (error) {
      // If find fails, return the target as-is
      return [target];
    }
  }

  /**
   * Estimate task complexity for time allocation
   */
  estimateTaskComplexity(file) {
    // Critical files get more time
    if (file.includes('webhook') || file.includes('payment') || file.includes('auth')) {
      return 'high';
    }
    if (file.includes('test') || file.includes('spec')) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Decompose high-level tasks into granular, manageable chunks
   */
  async decomposeTasks(tasks) {
    const decomposed = [];
    let taskId = 0;

    console.log(chalk.cyan('\n📋 Decomposing tasks for granular execution...'));

    for (const task of tasks) {
      if (task.type === 'lint') {
        // Linting can be done by directory
        decomposed.push({
          id: `lint-${task.target.replace(/\//g, '-')}-${++taskId}`,
          agent: 'tdd-implementer',
          prompt: `Fix all linting and formatting issues in ${task.target}. Run 'npm run lint -- --fix' first, then manually fix any remaining issues. Commit all changes with message "fix: Resolve linting issues in ${task.target}".`,
          workdir: `lint-${task.target.replace(/\//g, '-')}`,
          branch: `audit/lint-${task.target.replace(/\//g, '-')}`,
          target: task.target,
          maxDuration: 300000, // 5 minutes
          complexity: 'low'
        });
        
      } else if (task.type === 'logic-analysis' || task.type === 'security') {
        // Break down by individual files for detailed analysis
        const files = await this.findTargetFiles(task.target);
        
        // Group files into chunks of 3-5 for efficiency
        const chunkSize = task.type === 'security' ? 3 : 5;
        for (let i = 0; i < files.length; i += chunkSize) {
          const fileChunk = files.slice(i, i + chunkSize);
          const chunkName = fileChunk.length === 1 ? 
            path.basename(fileChunk[0]) : 
            `${path.basename(fileChunk[0])}-and-${fileChunk.length - 1}-more`;
          
          decomposed.push({
            id: `${task.type}-${chunkName}-${++taskId}`,
            agent: 'critical-code-reviewer',
            prompt: task.type === 'security' ?
              `SECURITY AUDIT for files: ${fileChunk.join(', ')}
               
               Focus on:
               1. Exposed secrets or credentials (CWE-798)
               2. Missing authentication checks (CWE-306)
               3. Webhook signature verification (CWE-345)
               4. Input validation vulnerabilities (CWE-20)
               5. Lambda Function URL usage (FORBIDDEN)
               
               Analyze ONLY these specific files. Provide fixes for any issues found.` :
              `LOGIC ANALYSIS for files: ${fileChunk.join(', ')}
               
               Focus on:
               1. Null/undefined reference errors
               2. Unhandled promise rejections
               3. Race conditions in async code
               4. Missing error boundaries
               5. Resource leaks (unclosed connections, memory leaks)
               
               Analyze ONLY these specific files. Provide fixes for any issues found.`,
            workdir: `${task.type}-${chunkName.replace(/\./g, '-')}`,
            branch: `audit/${task.type}-${chunkName.replace(/\./g, '-')}`,
            target: fileChunk,
            maxDuration: 600000, // 10 minutes for critical analysis
            complexity: this.estimateTaskComplexity(fileChunk[0])
          });
        }
        
      } else if (task.type === 'migration-check') {
        // Migration checks by specific patterns
        decomposed.push({
          id: `migration-${task.target.replace(/\//g, '-')}-${++taskId}`,
          agent: 'legacy-modernization-specialist',
          prompt: `MIGRATION CHECK for ${task.target}:
          
          Search for and report:
          1. Any use of process.env.*_LAMBDA_URL variables
          2. Direct Lambda invocations (lambda.invoke)
          3. Lambda Function URL configurations
          4. Direct fetch() calls to Lambda endpoints
          5. Missing AppSync wrapper usage
          
          For each finding, provide the file path, line number, and migration strategy.`,
          workdir: `migration-${task.target.replace(/\//g, '-')}`,
          branch: `audit/migration-${task.target.replace(/\//g, '-')}`,
          target: task.target,
          maxDuration: 480000, // 8 minutes
          complexity: 'medium'
        });
      }
    }

    // Sort by complexity - do simple tasks first for quick wins
    decomposed.sort((a, b) => {
      const complexityOrder = { low: 0, medium: 1, high: 2 };
      return complexityOrder[a.complexity] - complexityOrder[b.complexity];
    });

    console.log(chalk.green(`   ✅ Decomposed into ${decomposed.length} granular tasks`));
    
    // Show task breakdown
    const breakdown = {};
    decomposed.forEach(task => {
      const type = task.id.split('-')[0];
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    
    Object.entries(breakdown).forEach(([type, count]) => {
      console.log(chalk.gray(`      - ${type}: ${count} tasks`));
    });

    return decomposed;
  }

  /**
   * Create git worktrees for parallel execution
   */
  async createWorktrees(tasks) {
    console.log(`\n📁 Creating ${tasks.length} worktrees for parallel execution`);
    
    for (const task of tasks.slice(0, this.parallelism)) {
      const worktreePath = path.resolve(process.cwd(), '..', `worktree-${task.workdir}`);
      
      try {
        // Create worktree with new branch
        await execAsync(`git worktree add -b ${task.branch} "${worktreePath}"`);
        
        task.worktreePath = worktreePath;
        this.worktrees.push(worktreePath);
        
        console.log(`   ✅ Created worktree: ${task.branch}`);
      } catch (error) {
        // Worktree might already exist, try to use it
        if (error.message.includes('already exists')) {
          task.worktreePath = worktreePath;
          this.worktrees.push(worktreePath);
          console.log(`   ℹ️  Using existing worktree: ${task.branch}`);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Execute agents in parallel using the dispatcher with checkpointing
   */
  async executeAgents(tasks) {
    console.log(chalk.bold.cyan(`\n🤖 Dispatching ${tasks.length} agents`));
    
    // Prepare tasks for parallel dispatch with progress tracking
    const dispatchTasks = tasks.slice(0, this.parallelism).map(task => ({
      id: task.id,
      agent: task.agent,
      prompt: task.prompt,
      options: {
        workingDirectory: task.worktreePath,
        files: [], // Could add context files here
        retries: 2,
        streaming: true,
        timeout: 600000 // 10 minutes per task
      }
    }));

    // Execute with progress callback for checkpointing
    const results = await this.dispatcher.dispatchParallel(dispatchTasks, {
      onProgress: async (progress) => {
        if (progress.type === 'completed') {
          // Mark task as completed
          this.completedTasks.add(progress.taskId);
          console.log(chalk.green(`   ✅ Task ${progress.taskId} completed`));
          
          // Save checkpoint after each task completes
          await this.saveCheckpoint({
            tasks,
            completedTasks: Array.from(this.completedTasks),
            worktrees: this.worktrees,
            results: this.results
          });
        } else if (progress.type === 'failed') {
          console.log(chalk.red(`   ❌ Task ${progress.taskId} failed: ${progress.error}`));
        } else if (progress.type === 'log_block' && progress.block) {
          // Real-time progress display handled by dispatcher
        }
      }
    });
    
    // Map results back to tasks
    for (const task of tasks) {
      const result = results.successful.find(r => r.taskId === task.id) ||
                     results.failed.find(r => r.taskId === task.id);
      
      if (result) {
        task.result = result;
        task.success = !result.error;
        this.results.push(result);
      }
    }

    // Final checkpoint after all tasks
    await this.saveCheckpoint({
      tasks,
      completedTasks: Array.from(this.completedTasks),
      worktrees: this.worktrees,
      results: this.results
    });

    return tasks;
  }

  /**
   * Integrate results from all agents
   */
  async integrateResults(tasks) {
    console.log(`\n🔄 Integrating results from ${tasks.length} agents`);
    
    const integration = {
      successful: [],
      failed: [],
      conflicts: [],
      totalChanges: 0,
      totalIssues: 0
    };

    // Create integration branch
    const integrationBranch = `audit/integration-${Date.now()}`;
    await execAsync(`git checkout -b ${integrationBranch}`);
    
    for (const task of tasks) {
      if (!task.success) {
        integration.failed.push({
          task: task.id,
          error: task.result?.error || 'Unknown error'
        });
        continue;
      }

      try {
        // Attempt to merge the branch
        console.log(`   Merging ${task.branch}...`);
        await execAsync(`git merge ${task.branch} --no-edit`, {
          maxBuffer: 10 * 1024 * 1024
        });
        
        integration.successful.push({
          task: task.id,
          branch: task.branch,
          changes: task.result?.fileChanges || [],
          issues: task.result?.issues || []
        });
        
        integration.totalChanges += (task.result?.fileChanges || []).length;
        integration.totalIssues += (task.result?.issues || []).length;
        
      } catch (mergeError) {
        if (mergeError.message.includes('CONFLICT')) {
          integration.conflicts.push({
            task: task.id,
            branch: task.branch,
            conflict: mergeError.message
          });
          
          // Abort the merge
          await execAsync('git merge --abort').catch(() => {});
        } else {
          integration.failed.push({
            task: task.id,
            error: mergeError.message
          });
        }
      }
    }

    integration.integrationBranch = integrationBranch;
    return integration;
  }

  /**
   * Generate final report and create PR
   */
  async finalizeAudit(integration) {
    console.log('\n📊 Audit Summary:');
    console.log(`   ✅ Successful merges: ${integration.successful.length}`);
    console.log(`   ❌ Failed tasks: ${integration.failed.length}`);
    console.log(`   ⚠️  Conflicts: ${integration.conflicts.length}`);
    console.log(`   📝 Total changes: ${integration.totalChanges}`);
    console.log(`   🐛 Issues found: ${integration.totalIssues}`);

    if (integration.conflicts.length > 0) {
      console.log('\n⚠️  Manual intervention required for conflicts:');
      integration.conflicts.forEach(c => {
        console.log(`   - ${c.branch}: ${c.conflict.split('\n')[0]}`);
      });
    }

    if (this.mode === 'autonomous' && integration.successful.length > 0) {
      // Create PR automatically
      console.log('\n🔄 Creating pull request...');
      
      const prBody = this.generatePRBody(integration);
      
      try {
        await execAsync(`git push -u origin ${integration.integrationBranch}`);
        
        // Use GitHub CLI if available
        const { stdout } = await execAsync(`gh pr create --title "Automated Audit: ${integration.totalChanges} changes, ${integration.totalIssues} issues found" --body "${prBody}"`, {
          maxBuffer: 10 * 1024 * 1024
        }).catch(() => ({ stdout: 'PR creation requires GitHub CLI (gh)' }));
        
        console.log(`\n✅ Pull request created: ${stdout}`);
      } catch (error) {
        console.log(`\n⚠️  Could not create PR automatically: ${error.message}`);
        console.log(`   Branch pushed to: ${integration.integrationBranch}`);
        console.log('   Create PR manually from this branch');
      }
    }
  }

  /**
   * Generate PR body with comprehensive report
   */
  generatePRBody(integration) {
    let body = '## 🤖 Automated Audit Report\n\n';
    body += 'This PR contains automated fixes and findings from parallel agent analysis.\n\n';
    
    body += '### 📊 Summary\n';
    body += `- **Successful tasks:** ${integration.successful.length}\n`;
    body += `- **Failed tasks:** ${integration.failed.length}\n`;
    body += `- **Conflicts requiring review:** ${integration.conflicts.length}\n`;
    body += `- **Total files changed:** ${integration.totalChanges}\n`;
    body += `- **Issues identified:** ${integration.totalIssues}\n\n`;
    
    if (integration.successful.length > 0) {
      body += '### ✅ Completed Tasks\n';
      integration.successful.forEach(task => {
        body += `- **${task.task}** (${task.branch})\n`;
        if (task.changes.length > 0) {
          body += `  - Files changed: ${task.changes.length}\n`;
        }
        if (task.issues.length > 0) {
          body += `  - Issues found: ${task.issues.length}\n`;
        }
      });
      body += '\n';
    }
    
    if (integration.totalIssues > 0) {
      body += '### 🐛 Issues Found\n';
      integration.successful.forEach(task => {
        if (task.issues && task.issues.length > 0) {
          task.issues.forEach(issue => {
            body += `- **${issue.severity}**: ${issue.description}\n`;
          });
        }
      });
      body += '\n';
    }
    
    if (integration.failed.length > 0) {
      body += '### ❌ Failed Tasks\n';
      integration.failed.forEach(task => {
        body += `- **${task.task}**: ${task.error}\n`;
      });
      body += '\n';
    }
    
    body += '### 🔍 Review Instructions\n';
    body += '1. Review all changes carefully\n';
    body += '2. Run tests locally: `npm test`\n';
    body += '3. Check for any breaking changes\n';
    body += '4. Merge when CI passes\n';
    
    return body;
  }

  /**
   * Clean up worktrees and temporary branches
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up worktrees...');
    
    for (const worktree of this.worktrees) {
      try {
        await execAsync(`git worktree remove "${worktree}" --force`);
        console.log(`   ✅ Removed worktree: ${path.basename(worktree)}`);
      } catch (error) {
        console.log(`   ⚠️  Could not remove worktree: ${path.basename(worktree)}`);
      }
    }
  }
}

module.exports = { AuditPipeline };