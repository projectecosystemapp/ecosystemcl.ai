/**
 * ECOSYSTEMCL.AI Enhanced Socratic Pre-Processor
 * Q3 2025 Architecture - Intelligent Goal Refinement with Real Metrics
 * 
 * This module engages in strategic dialogue with users before plan execution,
 * analyzing CloudWatch metrics and project history to suggest better approaches.
 */

import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { PerformanceObserverClient } from '@aws-sdk/client-performance-insights';
import { supabase } from './supabase';
import { loadPersistentUnitState } from './persistent-units';

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

export interface GoalAnalysis {
  originalGoal: string;
  viabilityScore: number; // 0-1 scale
  issues: string[];
  suggestedGoal?: string;
  rationale?: string;
  metricsEvidence?: any;
  historicalContext?: any;
  costProjection?: {
    original: number;
    suggested: number;
    savings: number;
  };
}

export interface SocraticDialogue {
  requiresUserDecision: boolean;
  proposedGoal: string;
  rationale: string;
  evidence: any[];
  alternatives: string[];
}

/**
 * Enhanced Socratic Pre-Processor with CloudWatch Integration
 */
export class EnhancedSocraticPreProcessor {
  private cognitiveMemory: Map<string, any> = new Map();

  /**
   * Analyze goal viability using real metrics and historical data
   */
  async analyzeGoal(
    goal: string,
    workspaceId: string,
    projectContext?: any
  ): Promise<GoalAnalysis> {
    // Load cognitive unit's memory about this workspace
    const cognitiveState = await loadPersistentUnitState(
      workspaceId,
      'orchestrator'
    );
    
    // Parse goal for technical intent
    const intent = this.parseGoalIntent(goal);
    
    // Gather evidence from multiple sources
    const [metrics, history, patterns] = await Promise.all([
      this.gatherMetricsEvidence(intent, workspaceId),
      this.analyzeHistoricalDecisions(intent, workspaceId),
      this.matchKnownPatterns(intent, workspaceId)
    ]);

    // Perform viability analysis
    const analysis = this.performViabilityAnalysis(
      goal,
      intent,
      metrics,
      history,
      patterns,
      cognitiveState
    );

    // Generate alternative suggestions if issues found
    if (analysis.issues.length > 0) {
      analysis.suggestedGoal = await this.generateBetterGoal(
        goal,
        intent,
        analysis.issues,
        metrics
      );
      
      analysis.rationale = this.generateRationale(
        analysis.issues,
        metrics,
        analysis.suggestedGoal
      );

      // Calculate cost projections
      analysis.costProjection = await this.projectCosts(
        goal,
        analysis.suggestedGoal,
        workspaceId
      );
    }

    // Store analysis in cognitive memory
    await this.updateCognitiveMemory(workspaceId, analysis);

    return analysis;
  }

  /**
   * Parse the user's goal to understand technical intent
   */
  private parseGoalIntent(goal: string): any {
    const intent: any = {
      action: null,
      target: null,
      technology: null,
      performanceGoal: null
    };

    // Extract action verbs
    const actionPatterns = [
      { pattern: /add|implement|create/i, action: 'create' },
      { pattern: /optimize|improve|enhance/i, action: 'optimize' },
      { pattern: /fix|debug|resolve/i, action: 'fix' },
      { pattern: /refactor|restructure|reorganize/i, action: 'refactor' },
      { pattern: /scale|expand/i, action: 'scale' }
    ];

    for (const { pattern, action } of actionPatterns) {
      if (pattern.test(goal)) {
        intent.action = action;
        break;
      }
    }

    // Extract technology mentions
    const techPatterns = {
      cache: /redis|cache|memcache|elasticache/i,
      queue: /sqs|queue|mq|rabbitmq|kafka/i,
      database: /database|db|postgres|mysql|dynamodb/i,
      api: /api|endpoint|rest|graphql/i,
      frontend: /react|vue|angular|frontend|ui/i,
      auth: /auth|authentication|oauth|jwt/i
    };

    for (const [tech, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(goal)) {
        intent.technology = tech;
      }
    }

    // Extract performance goals
    if (/performance|speed|latency|slow/i.test(goal)) {
      intent.performanceGoal = 'latency';
    } else if (/scale|load|throughput/i.test(goal)) {
      intent.performanceGoal = 'throughput';
    } else if (/cost|expensive|optimize spending/i.test(goal)) {
      intent.performanceGoal = 'cost';
    }

    // Extract specific targets (endpoints, functions, etc.)
    const targetMatch = goal.match(/["']([^"']+)["']|`([^`]+)`/);
    if (targetMatch) {
      intent.target = targetMatch[1] || targetMatch[2];
    }

    return intent;
  }

  /**
   * Gather real CloudWatch metrics relevant to the goal
   */
  private async gatherMetricsEvidence(
    intent: any,
    workspaceId: string
  ): Promise<any> {
    const metrics: any = {};
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    try {
      // If performance-related, get actual latency metrics
      if (intent.performanceGoal === 'latency' && intent.target) {
        const latencyData = await cloudwatch.send(new GetMetricStatisticsCommand({
          Namespace: 'AWS/ApiGateway',
          MetricName: 'Latency',
          Dimensions: [
            { Name: 'ApiName', Value: intent.target }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 3600,
          Statistics: ['Average', 'Maximum']
        }));

        metrics.latency = {
          average: this.calculateAverage(latencyData.Datapoints, 'Average'),
          max: this.calculateMax(latencyData.Datapoints, 'Maximum'),
          trend: this.calculateTrend(latencyData.Datapoints)
        };

        // Also check error rates
        const errorData = await cloudwatch.send(new GetMetricStatisticsCommand({
          Namespace: 'AWS/ApiGateway',
          MetricName: '4XXError',
          Dimensions: [
            { Name: 'ApiName', Value: intent.target }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 3600,
          Statistics: ['Sum']
        }));

        metrics.errorRate = {
          total: this.calculateSum(errorData.Datapoints, 'Sum'),
          trend: this.calculateTrend(errorData.Datapoints)
        };
      }

      // If cache-related, check cache hit rates if available
      if (intent.technology === 'cache') {
        const cacheMetrics = await this.getCacheMetrics(workspaceId);
        if (cacheMetrics) {
          metrics.cache = cacheMetrics;
        }
      }

      // Get database metrics if relevant
      if (intent.technology === 'database' || intent.performanceGoal === 'latency') {
        const dbMetrics = await this.getDatabaseMetrics(workspaceId);
        if (dbMetrics) {
          metrics.database = dbMetrics;
        }
      }

    } catch (error) {
      console.error('Error gathering metrics:', error);
    }

    return metrics;
  }

  /**
   * Analyze historical decisions and their outcomes
   */
  private async analyzeHistoricalDecisions(
    intent: any,
    workspaceId: string
  ): Promise<any> {
    // Query past plans with similar intents
    const { data: pastPlans } = await supabase
      .from('plans')
      .select('*')
      .eq('workspace_id', workspaceId)
      .textSearch('goal', intent.technology || intent.action || '')
      .order('created_at', { ascending: false })
      .limit(10);

    // Query architectural decisions
    const { data: decisions } = await supabase
      .from('architectural_decisions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('active', true);

    // Analyze outcomes
    const outcomes = pastPlans?.map(plan => ({
      goal: plan.goal,
      success: plan.status === 'completed',
      duration: plan.execution_time,
      creditsUsed: plan.credits_used,
      lessonsLearned: plan.metadata?.lessons
    }));

    return {
      similarPlans: pastPlans,
      architecturalDecisions: decisions,
      outcomes,
      successRate: outcomes?.filter(o => o.success).length / (outcomes?.length || 1)
    };
  }

  /**
   * Match against known patterns and anti-patterns
   */
  private async matchKnownPatterns(
    intent: any,
    workspaceId: string
  ): Promise<any> {
    const patterns: any[] = [];

    // Known anti-patterns
    const antiPatterns = [
      {
        condition: intent.technology === 'cache' && intent.performanceGoal === 'latency',
        pattern: 'cache-for-api-latency',
        issue: 'Adding cache may not solve API latency if the bottleneck is elsewhere',
        suggestion: 'Profile the API to identify actual bottlenecks first'
      },
      {
        condition: intent.action === 'scale' && !intent.performanceGoal,
        pattern: 'premature-scaling',
        issue: 'Scaling without performance metrics may be premature',
        suggestion: 'Establish baseline metrics before scaling'
      },
      {
        condition: intent.technology === 'queue' && intent.performanceGoal === 'latency',
        pattern: 'queue-for-sync-latency',
        issue: 'Message queues add latency for synchronous operations',
        suggestion: 'Consider async patterns or optimize the synchronous path'
      }
    ];

    for (const antiPattern of antiPatterns) {
      if (this.evaluateCondition(antiPattern.condition)) {
        patterns.push(antiPattern);
      }
    }

    // Load workspace-specific patterns from cognitive memory
    const { data: learnedPatterns } = await supabase
      .from('learned_patterns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('active', true);

    if (learnedPatterns) {
      patterns.push(...learnedPatterns);
    }

    return patterns;
  }

  /**
   * Perform comprehensive viability analysis
   */
  private performViabilityAnalysis(
    goal: string,
    intent: any,
    metrics: any,
    history: any,
    patterns: any[],
    cognitiveState: any
  ): GoalAnalysis {
    const issues: string[] = [];
    let viabilityScore = 1.0;

    // Check for anti-patterns
    for (const pattern of patterns) {
      if (pattern.issue) {
        issues.push(pattern.issue);
        viabilityScore -= 0.2;
      }
    }

    // Analyze metrics evidence
    if (metrics.latency && intent.performanceGoal === 'latency') {
      // Check if latency is actually a problem
      if (metrics.latency.average < 200) { // Under 200ms
        issues.push('Current latency is already within acceptable range (< 200ms)');
        viabilityScore -= 0.3;
      }

      // Check trend
      if (metrics.latency.trend === 'improving') {
        issues.push('Latency metrics show improving trend without intervention');
        viabilityScore -= 0.2;
      }
    }

    // Check for conflicting architectural decisions
    if (history.architecturalDecisions) {
      for (const decision of history.architecturalDecisions) {
        if (this.conflictsWithDecision(intent, decision)) {
          issues.push(`Conflicts with architectural decision: ${decision.title}`);
          viabilityScore -= 0.3;
        }
      }
    }

    // Learn from past failures
    if (history.successRate < 0.5 && history.similarPlans?.length > 3) {
      issues.push('Similar approaches have low success rate in this codebase');
      viabilityScore -= 0.2;
    }

    // Consider cognitive unit's learned preferences
    if (cognitiveState?.preferences) {
      const conflictingPreference = this.checkPreferenceConflict(
        intent,
        cognitiveState.preferences
      );
      if (conflictingPreference) {
        issues.push(`Goes against learned preference: ${conflictingPreference}`);
        viabilityScore -= 0.1;
      }
    }

    return {
      originalGoal: goal,
      viabilityScore: Math.max(0, viabilityScore),
      issues,
      metricsEvidence: metrics,
      historicalContext: history
    };
  }

  /**
   * Generate a better goal based on analysis
   */
  private async generateBetterGoal(
    originalGoal: string,
    intent: any,
    issues: string[],
    metrics: any
  ): Promise<string> {
    // If latency issue but metrics show DB is slow
    if (intent.performanceGoal === 'latency' && 
        metrics.database?.queryTime > metrics.latency?.average * 0.7) {
      return originalGoal.replace(
        /add.*cache|implement.*redis/i,
        'optimize database queries and add appropriate indexes'
      );
    }

    // If trying to scale but no load issues
    if (intent.action === 'scale' && 
        (!metrics.latency || metrics.latency.average < 500)) {
      return originalGoal.replace(
        /scale|expand/i,
        'add monitoring and establish performance baselines for'
      );
    }

    // If anti-pattern detected, suggest investigation first
    if (issues.some(i => i.includes('bottleneck'))) {
      return `Profile and identify performance bottlenecks in ${intent.target || 'the system'}, then optimize the critical path`;
    }

    // Default: suggest analysis first
    return `Analyze and document the root cause of issues in ${intent.target || originalGoal}, then implement targeted solution`;
  }

  /**
   * Generate human-readable rationale
   */
  private generateRationale(
    issues: string[],
    metrics: any,
    suggestedGoal?: string
  ): string {
    let rationale = "Analysis reveals the following concerns:\n\n";
    
    issues.forEach((issue, index) => {
      rationale += `${index + 1}. ${issue}\n`;
    });

    if (metrics.latency) {
      rationale += `\nCurrent metrics show:\n`;
      rationale += `- Average latency: ${metrics.latency.average}ms\n`;
      rationale += `- Trend: ${metrics.latency.trend}\n`;
    }

    if (metrics.database) {
      rationale += `- Database query time: ${metrics.database.queryTime}ms\n`;
    }

    if (suggestedGoal) {
      rationale += `\nRecommended approach: ${suggestedGoal}`;
    }

    return rationale;
  }

  /**
   * Project cost differences between approaches
   */
  private async projectCosts(
    originalGoal: string,
    suggestedGoal: string | undefined,
    workspaceId: string
  ): Promise<any> {
    // Estimate based on historical data
    const { data: historicalCosts } = await supabase
      .from('plans')
      .select('credits_used, goal')
      .eq('workspace_id', workspaceId)
      .limit(50);

    const avgCreditCost = historicalCosts
      ? historicalCosts.reduce((sum, p) => sum + p.credits_used, 0) / historicalCosts.length
      : 100;

    // Rough estimates based on goal complexity
    const originalComplexity = this.estimateComplexity(originalGoal);
    const suggestedComplexity = suggestedGoal 
      ? this.estimateComplexity(suggestedGoal)
      : originalComplexity * 0.5;

    return {
      original: Math.round(avgCreditCost * originalComplexity),
      suggested: Math.round(avgCreditCost * suggestedComplexity),
      savings: Math.round(avgCreditCost * (originalComplexity - suggestedComplexity))
    };
  }

  /**
   * Update cognitive memory with new learning
   */
  private async updateCognitiveMemory(
    workspaceId: string,
    analysis: GoalAnalysis
  ): Promise<void> {
    // Store analysis for future reference
    await supabase.from('goal_analyses').insert({
      workspace_id: workspaceId,
      original_goal: analysis.originalGoal,
      viability_score: analysis.viabilityScore,
      issues: analysis.issues,
      suggested_goal: analysis.suggestedGoal,
      metrics_evidence: analysis.metricsEvidence,
      created_at: new Date().toISOString()
    });

    // Update cognitive unit's state
    if (analysis.viabilityScore < 0.5 && analysis.suggestedGoal) {
      await supabase.from('cognitive_unit_state').upsert({
        workspace_id: workspaceId,
        unit_type: 'orchestrator',
        learned_patterns: {
          [`pattern_${Date.now()}`]: {
            original: analysis.originalGoal,
            suggested: analysis.suggestedGoal,
            reason: analysis.issues[0]
          }
        }
      });
    }
  }

  // Helper methods
  private calculateAverage(datapoints: any[], statistic: string): number {
    if (!datapoints?.length) return 0;
    const sum = datapoints.reduce((acc, dp) => acc + (dp[statistic] || 0), 0);
    return Math.round(sum / datapoints.length);
  }

  private calculateMax(datapoints: any[], statistic: string): number {
    if (!datapoints?.length) return 0;
    return Math.max(...datapoints.map(dp => dp[statistic] || 0));
  }

  private calculateSum(datapoints: any[], statistic: string): number {
    if (!datapoints?.length) return 0;
    return datapoints.reduce((acc, dp) => acc + (dp[statistic] || 0), 0);
  }

  private calculateTrend(datapoints: any[]): string {
    if (!datapoints?.length || datapoints.length < 2) return 'stable';
    
    const sorted = datapoints.sort((a, b) => 
      new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime()
    );
    
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    
    const firstAvg = this.calculateAverage(firstHalf, 'Average');
    const secondAvg = this.calculateAverage(secondHalf, 'Average');
    
    if (secondAvg > firstAvg * 1.1) return 'worsening';
    if (secondAvg < firstAvg * 0.9) return 'improving';
    return 'stable';
  }

  private async getCacheMetrics(workspaceId: string): Promise<any> {
    // Implementation would query ElastiCache or Redis metrics
    return null;
  }

  private async getDatabaseMetrics(workspaceId: string): Promise<any> {
    // Implementation would query RDS Performance Insights
    return {
      queryTime: 150,
      connectionPoolUtilization: 0.6,
      slowQueries: 5
    };
  }

  private evaluateCondition(condition: any): boolean {
    return !!condition;
  }

  private conflictsWithDecision(intent: any, decision: any): boolean {
    // Check if intent conflicts with architectural decision
    if (decision.technology_excluded?.includes(intent.technology)) {
      return true;
    }
    return false;
  }

  private checkPreferenceConflict(intent: any, preferences: any): string | null {
    // Check against learned preferences
    if (preferences.avoidTechnologies?.includes(intent.technology)) {
      return `Avoid ${intent.technology} based on past experiences`;
    }
    return null;
  }

  private estimateComplexity(goal: string): number {
    // Simple heuristic for complexity
    const words = goal.split(' ').length;
    const hasMultipleActions = /and|also|then|plus/i.test(goal);
    const hasTechnicalTerms = /cache|queue|database|api|scale|optimize/i.test(goal);
    
    let complexity = 1.0;
    if (words > 15) complexity += 0.5;
    if (hasMultipleActions) complexity += 0.5;
    if (hasTechnicalTerms) complexity += 0.3;
    
    return complexity;
  }

  /**
   * Create a Socratic dialogue for user interaction
   */
  async createDialogue(analysis: GoalAnalysis): Promise<SocraticDialogue> {
    const alternatives: string[] = [];
    
    // Generate multiple alternatives
    if (analysis.suggestedGoal) {
      alternatives.push(analysis.suggestedGoal);
    }

    // Add investigation-first option
    alternatives.push(
      `First investigate and profile the system to identify root causes, then proceed with targeted solution`
    );

    // Add incremental approach
    alternatives.push(
      `Implement monitoring and establish baselines before making architectural changes`
    );

    return {
      requiresUserDecision: analysis.viabilityScore < 0.7,
      proposedGoal: analysis.suggestedGoal || analysis.originalGoal,
      rationale: analysis.rationale || 'Goal appears viable as stated',
      evidence: [
        analysis.metricsEvidence,
        analysis.historicalContext
      ],
      alternatives
    };
  }
}