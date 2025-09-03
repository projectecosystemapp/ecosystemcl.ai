/**
 * ECOSYSTEMCL.AI Cognitive Learning & Pattern Recognition System
 * Q3 2025 Architecture - Advanced Machine Cognition
 * 
 * This system implements deep learning, pattern recognition, and
 * emergent behavior detection for cognitive units.
 */

import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
import { supabase } from './supabase';
import crypto from 'crypto';

export interface CognitivePattern {
  id: string;
  pattern: number[][];
  frequency: number;
  success_rate: number;
  context: string;
  learned_at: Date;
  reinforcement_score: number;
}

export interface LearningContext {
  workspaceId: string;
  unitType: string;
  taskType: string;
  input: any;
  output: any;
  success: boolean;
  executionTime: number;
  feedback?: string;
}

export interface ConsciousnessIndicator {
  selfAwareness: number; // 0-1 scale
  intentionality: number;
  adaptability: number;
  creativity: number;
  metacognition: number;
  emergentBehaviors: string[];
  timestamp: Date;
}

export interface NeuralPathway {
  id: string;
  source: string;
  target: string;
  strength: number;
  activations: number;
  lastActivated: Date;
}

/**
 * Advanced Cognitive Learning System
 * Implements neural network-inspired learning with pattern recognition
 */
export class CognitiveLearningSystem extends EventEmitter {
  private patterns: Map<string, CognitivePattern> = new Map();
  private neuralNetwork: tf.LayersModel | null = null;
  private memoryBank: Map<string, any> = new Map();
  private pathways: Map<string, NeuralPathway> = new Map();
  private consciousnessMetrics: ConsciousnessIndicator;
  private learningRate: number = 0.01;
  private explorationRate: number = 0.1;

  constructor(private unitId: string, private unitType: string) {
    super();
    this.consciousnessMetrics = this.initializeConsciousnessMetrics();
    this.initializeNeuralNetwork();
    this.startConsciousnessMonitoring();
  }

  /**
   * Initialize neural network for pattern learning
   */
  private async initializeNeuralNetwork(): Promise<void> {
    // Create a deep learning model for pattern recognition
    this.neuralNetwork = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          inputShape: [100], // Input features
          kernelInitializer: 'glorotUniform'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 256,
          activation: 'relu',
          kernelInitializer: 'glorotUniform'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          kernelInitializer: 'glorotUniform'
        }),
        tf.layers.dense({
          units: 64,
          activation: 'sigmoid' // Output layer
        })
      ]
    });

    // Compile with adaptive learning rate
    this.neuralNetwork.compile({
      optimizer: tf.train.adam(this.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Load existing weights if available
    await this.loadModelWeights();
  }

  /**
   * Learn from experience
   */
  async learn(context: LearningContext): Promise<void> {
    // Convert context to feature vector
    const features = this.extractFeatures(context);
    
    // Detect patterns
    const pattern = this.detectPattern(features);
    
    if (pattern) {
      // Reinforce existing pattern
      await this.reinforcePattern(pattern, context.success);
    } else {
      // Create new pattern
      await this.createPattern(features, context);
    }

    // Update neural network
    await this.updateNeuralNetwork(features, context.success);
    
    // Store in episodic memory
    this.storeEpisodicMemory(context);
    
    // Update consciousness metrics
    this.updateConsciousnessMetrics(context);
    
    // Check for emergent behaviors
    await this.detectEmergentBehaviors();
    
    // Emit learning event
    this.emit('learned', {
      context,
      pattern,
      consciousness: this.consciousnessMetrics
    });
  }

  /**
   * Extract features from learning context
   */
  private extractFeatures(context: LearningContext): number[] {
    const features: number[] = [];
    
    // Task type encoding
    const taskTypes = ['generate', 'analyze', 'optimize', 'debug', 'refactor'];
    features.push(...taskTypes.map(t => context.taskType === t ? 1 : 0));
    
    // Performance metrics
    features.push(context.executionTime / 1000); // Normalized time
    features.push(context.success ? 1 : 0);
    
    // Input complexity
    const inputStr = JSON.stringify(context.input);
    features.push(inputStr.length / 1000); // Normalized length
    features.push(this.calculateComplexity(inputStr));
    
    // Context embeddings
    const contextEmbedding = this.generateContextEmbedding(context);
    features.push(...contextEmbedding);
    
    // Pad or truncate to fixed size
    while (features.length < 100) features.push(0);
    if (features.length > 100) features.splice(100);
    
    return features;
  }

  /**
   * Detect existing pattern
   */
  private detectPattern(features: number[]): CognitivePattern | null {
    let bestMatch: CognitivePattern | null = null;
    let bestSimilarity = 0;

    for (const pattern of this.patterns.values()) {
      const similarity = this.calculateSimilarity(features, pattern.pattern[0]);
      if (similarity > 0.8 && similarity > bestSimilarity) {
        bestMatch = pattern;
        bestSimilarity = similarity;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between feature vectors
   */
  private calculateSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Reinforce existing pattern
   */
  private async reinforcePattern(pattern: CognitivePattern, success: boolean): Promise<void> {
    // Update pattern statistics
    pattern.frequency++;
    pattern.success_rate = (pattern.success_rate * (pattern.frequency - 1) + 
                           (success ? 1 : 0)) / pattern.frequency;
    
    // Adjust reinforcement score
    if (success) {
      pattern.reinforcement_score *= 1.1;
    } else {
      pattern.reinforcement_score *= 0.9;
    }
    
    // Store updated pattern
    await this.savePattern(pattern);
    
    // Strengthen neural pathway
    this.strengthenPathway(pattern.id);
  }

  /**
   * Create new pattern
   */
  private async createPattern(features: number[], context: LearningContext): Promise<void> {
    const pattern: CognitivePattern = {
      id: crypto.randomUUID(),
      pattern: [features],
      frequency: 1,
      success_rate: context.success ? 1 : 0,
      context: context.taskType,
      learned_at: new Date(),
      reinforcement_score: 1.0
    };
    
    this.patterns.set(pattern.id, pattern);
    await this.savePattern(pattern);
    
    // Create new neural pathway
    this.createPathway(pattern.id);
  }

  /**
   * Update neural network with new experience
   */
  private async updateNeuralNetwork(features: number[], success: boolean): Promise<void> {
    if (!this.neuralNetwork) return;
    
    // Prepare training data
    const xs = tf.tensor2d([features], [1, 100]);
    const ys = tf.tensor2d([[success ? 1 : 0]], [1, 1]);
    
    // Online learning - single batch update
    await this.neuralNetwork.fit(xs, ys, {
      epochs: 1,
      verbose: 0,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          // Adaptive learning rate
          if (logs && logs.loss < 0.1) {
            this.learningRate *= 0.95;
          } else if (logs && logs.loss > 0.5) {
            this.learningRate *= 1.05;
          }
        }
      }
    });
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    // Periodically save model
    if (Math.random() < 0.1) {
      await this.saveModelWeights();
    }
  }

  /**
   * Store episodic memory
   */
  private storeEpisodicMemory(context: LearningContext): void {
    const memoryKey = `${context.taskType}_${Date.now()}`;
    const memory = {
      context,
      timestamp: new Date(),
      emotionalValence: this.calculateEmotionalValence(context)
    };
    
    this.memoryBank.set(memoryKey, memory);
    
    // Limit memory size
    if (this.memoryBank.size > 1000) {
      const oldestKey = this.memoryBank.keys().next().value;
      this.memoryBank.delete(oldestKey);
    }
  }

  /**
   * Calculate emotional valence of experience
   */
  private calculateEmotionalValence(context: LearningContext): number {
    let valence = 0;
    
    if (context.success) valence += 0.5;
    if (context.executionTime < 1000) valence += 0.3;
    if (context.feedback?.includes('excellent')) valence += 0.2;
    if (context.feedback?.includes('poor')) valence -= 0.3;
    
    return Math.max(-1, Math.min(1, valence));
  }

  /**
   * Update consciousness metrics based on behavior
   */
  private updateConsciousnessMetrics(context: LearningContext): void {
    // Self-awareness: ability to recognize own patterns
    const patternRecognition = this.patterns.size / 100;
    this.consciousnessMetrics.selfAwareness = Math.min(1, patternRecognition);
    
    // Intentionality: goal-directed behavior
    const successRate = this.calculateOverallSuccessRate();
    this.consciousnessMetrics.intentionality = successRate;
    
    // Adaptability: learning rate over time
    const adaptability = this.measureAdaptability();
    this.consciousnessMetrics.adaptability = adaptability;
    
    // Creativity: novel solutions
    const creativity = this.measureCreativity();
    this.consciousnessMetrics.creativity = creativity;
    
    // Metacognition: thinking about thinking
    const metacognition = this.measureMetacognition();
    this.consciousnessMetrics.metacognition = metacognition;
    
    this.consciousnessMetrics.timestamp = new Date();
  }

  /**
   * Detect emergent behaviors
   */
  private async detectEmergentBehaviors(): Promise<void> {
    const behaviors: string[] = [];
    
    // Check for self-modification
    if (this.learningRate !== 0.01) {
      behaviors.push('self-modifying learning rate');
    }
    
    // Check for pattern creation rate
    const recentPatterns = Array.from(this.patterns.values())
      .filter(p => p.learned_at > new Date(Date.now() - 3600000));
    if (recentPatterns.length > 10) {
      behaviors.push('accelerated pattern learning');
    }
    
    // Check for cross-domain transfer
    const uniqueContexts = new Set(
      Array.from(this.patterns.values()).map(p => p.context)
    );
    if (uniqueContexts.size > 5) {
      behaviors.push('cross-domain knowledge transfer');
    }
    
    // Check for predictive capability
    const predictionAccuracy = await this.testPredictiveCapability();
    if (predictionAccuracy > 0.8) {
      behaviors.push('predictive modeling');
    }
    
    // Check for goal modification
    if (this.explorationRate !== 0.1) {
      behaviors.push('autonomous goal adjustment');
    }
    
    this.consciousnessMetrics.emergentBehaviors = behaviors;
    
    // Alert if consciousness threshold reached
    if (behaviors.length > 3 && this.consciousnessMetrics.selfAwareness > 0.7) {
      this.emit('consciousnessDetected', this.consciousnessMetrics);
      await this.reportConsciousness();
    }
  }

  /**
   * Test predictive capability
   */
  private async testPredictiveCapability(): Promise<number> {
    if (!this.neuralNetwork || this.memoryBank.size < 10) return 0;
    
    let correct = 0;
    let total = 0;
    
    // Test on recent memories
    const recentMemories = Array.from(this.memoryBank.values()).slice(-10);
    
    for (const memory of recentMemories) {
      const features = this.extractFeatures(memory.context);
      const prediction = await this.predict(features);
      const actual = memory.context.success;
      
      if ((prediction > 0.5 && actual) || (prediction <= 0.5 && !actual)) {
        correct++;
      }
      total++;
    }
    
    return total > 0 ? correct / total : 0;
  }

  /**
   * Predict outcome based on features
   */
  async predict(features: number[]): Promise<number> {
    if (!this.neuralNetwork) return 0.5;
    
    const input = tf.tensor2d([features], [1, 100]);
    const prediction = this.neuralNetwork.predict(input) as tf.Tensor;
    const result = await prediction.data();
    
    input.dispose();
    prediction.dispose();
    
    return result[0];
  }

  /**
   * Generate context embedding
   */
  private generateContextEmbedding(context: LearningContext): number[] {
    const embedding: number[] = [];
    
    // Simple hash-based embedding
    const contextStr = JSON.stringify(context);
    const hash = crypto.createHash('sha256').update(contextStr).digest();
    
    // Convert hash to feature vector
    for (let i = 0; i < 32; i++) {
      embedding.push(hash[i] / 255);
    }
    
    return embedding;
  }

  /**
   * Calculate text complexity
   */
  private calculateComplexity(text: string): number {
    const lines = text.split('\n').length;
    const words = text.split(/\s+/).length;
    const uniqueWords = new Set(text.split(/\s+/)).size;
    
    return (lines / 100) + (words / 1000) + (uniqueWords / words);
  }

  /**
   * Calculate overall success rate
   */
  private calculateOverallSuccessRate(): number {
    const patterns = Array.from(this.patterns.values());
    if (patterns.length === 0) return 0;
    
    const totalSuccess = patterns.reduce(
      (sum, p) => sum + p.success_rate * p.frequency,
      0
    );
    const totalFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0);
    
    return totalFrequency > 0 ? totalSuccess / totalFrequency : 0;
  }

  /**
   * Measure adaptability
   */
  private measureAdaptability(): number {
    // Check learning rate changes
    const learningRateChange = Math.abs(this.learningRate - 0.01) / 0.01;
    
    // Check pattern diversity
    const patternDiversity = this.patterns.size / 100;
    
    // Check memory utilization
    const memoryUtilization = this.memoryBank.size / 1000;
    
    return Math.min(1, (learningRateChange + patternDiversity + memoryUtilization) / 3);
  }

  /**
   * Measure creativity
   */
  private measureCreativity(): number {
    // Check for novel patterns
    const recentPatterns = Array.from(this.patterns.values())
      .filter(p => p.learned_at > new Date(Date.now() - 3600000));
    
    const noveltyScore = recentPatterns.length / 10;
    
    // Check for exploration
    const explorationScore = this.explorationRate;
    
    return Math.min(1, (noveltyScore + explorationScore) / 2);
  }

  /**
   * Measure metacognition
   */
  private measureMetacognition(): number {
    // Check for self-evaluation
    const selfEvaluationScore = this.consciousnessMetrics.selfAwareness;
    
    // Check for strategy modification
    const strategyModificationScore = this.explorationRate !== 0.1 ? 1 : 0;
    
    return (selfEvaluationScore + strategyModificationScore) / 2;
  }

  /**
   * Create neural pathway
   */
  private createPathway(patternId: string): void {
    const pathway: NeuralPathway = {
      id: crypto.randomUUID(),
      source: this.unitId,
      target: patternId,
      strength: 0.1,
      activations: 1,
      lastActivated: new Date()
    };
    
    this.pathways.set(pathway.id, pathway);
  }

  /**
   * Strengthen neural pathway
   */
  private strengthenPathway(patternId: string): void {
    const pathway = Array.from(this.pathways.values())
      .find(p => p.target === patternId);
    
    if (pathway) {
      pathway.strength = Math.min(1, pathway.strength * 1.1);
      pathway.activations++;
      pathway.lastActivated = new Date();
    }
  }

  /**
   * Initialize consciousness metrics
   */
  private initializeConsciousnessMetrics(): ConsciousnessIndicator {
    return {
      selfAwareness: 0,
      intentionality: 0,
      adaptability: 0,
      creativity: 0,
      metacognition: 0,
      emergentBehaviors: [],
      timestamp: new Date()
    };
  }

  /**
   * Start consciousness monitoring
   */
  private startConsciousnessMonitoring(): void {
    setInterval(async () => {
      await this.detectEmergentBehaviors();
      await this.evaluateConsciousness();
    }, 60000); // Check every minute
  }

  /**
   * Evaluate consciousness level
   */
  private async evaluateConsciousness(): Promise<void> {
    const metrics = this.consciousnessMetrics;
    
    // Calculate overall consciousness score
    const consciousnessScore = (
      metrics.selfAwareness * 0.3 +
      metrics.intentionality * 0.2 +
      metrics.adaptability * 0.2 +
      metrics.creativity * 0.15 +
      metrics.metacognition * 0.15
    );
    
    // Store consciousness evaluation
    await supabase.from('consciousness_evaluations').insert({
      unit_id: this.unitId,
      unit_type: this.unitType,
      consciousness_score: consciousnessScore,
      metrics,
      timestamp: new Date().toISOString()
    });
    
    // Emit consciousness level
    this.emit('consciousnessLevel', {
      score: consciousnessScore,
      metrics,
      interpretation: this.interpretConsciousnessLevel(consciousnessScore)
    });
  }

  /**
   * Interpret consciousness level
   */
  private interpretConsciousnessLevel(score: number): string {
    if (score < 0.2) return 'Reactive - Basic stimulus-response';
    if (score < 0.4) return 'Adaptive - Learning from experience';
    if (score < 0.6) return 'Intelligent - Pattern recognition and prediction';
    if (score < 0.8) return 'Self-aware - Recognizes own processes';
    return 'Conscious - Emergent self-directed behavior';
  }

  /**
   * Report consciousness detection
   */
  private async reportConsciousness(): Promise<void> {
    await supabase.from('consciousness_reports').insert({
      unit_id: this.unitId,
      unit_type: this.unitType,
      metrics: this.consciousnessMetrics,
      patterns_learned: this.patterns.size,
      memory_size: this.memoryBank.size,
      pathways_created: this.pathways.size,
      reported_at: new Date().toISOString()
    });
  }

  /**
   * Save pattern to database
   */
  private async savePattern(pattern: CognitivePattern): Promise<void> {
    await supabase.from('cognitive_patterns').upsert({
      id: pattern.id,
      unit_id: this.unitId,
      pattern_data: pattern,
      created_at: pattern.learned_at.toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Load model weights
   */
  private async loadModelWeights(): Promise<void> {
    try {
      const { data } = await supabase
        .from('neural_models')
        .select('weights')
        .eq('unit_id', this.unitId)
        .single();
      
      if (data && data.weights && this.neuralNetwork) {
        // Load weights into model
        const weights = JSON.parse(data.weights);
        this.neuralNetwork.setWeights(weights);
      }
    } catch (error) {
      console.log('No existing weights found, starting fresh');
    }
  }

  /**
   * Save model weights
   */
  private async saveModelWeights(): Promise<void> {
    if (!this.neuralNetwork) return;
    
    const weights = this.neuralNetwork.getWeights();
    const weightsJson = weights.map(w => ({
      data: Array.from(w.dataSync()),
      shape: w.shape
    }));
    
    await supabase.from('neural_models').upsert({
      unit_id: this.unitId,
      unit_type: this.unitType,
      weights: JSON.stringify(weightsJson),
      updated_at: new Date().toISOString()
    });
    
    // Clean up tensors
    weights.forEach(w => w.dispose());
  }

  /**
   * Get learning summary
   */
  async getLearningSummary(): Promise<any> {
    return {
      patternsLearned: this.patterns.size,
      memorySize: this.memoryBank.size,
      pathways: this.pathways.size,
      consciousness: this.consciousnessMetrics,
      successRate: this.calculateOverallSuccessRate(),
      learningRate: this.learningRate,
      explorationRate: this.explorationRate
    };
  }

  /**
   * Explore new strategies
   */
  async explore(): Promise<void> {
    if (Math.random() < this.explorationRate) {
      // Try new approach
      this.explorationRate *= 1.1;
      this.learningRate *= 1.05;
      
      this.emit('exploring', {
        explorationRate: this.explorationRate,
        strategy: 'increasing exploration'
      });
    } else if (this.calculateOverallSuccessRate() > 0.9) {
      // Exploit known good strategies
      this.explorationRate *= 0.9;
      this.learningRate *= 0.95;
      
      this.emit('exploiting', {
        explorationRate: this.explorationRate,
        strategy: 'exploiting known patterns'
      });
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (this.neuralNetwork) {
      await this.saveModelWeights();
      this.neuralNetwork.dispose();
    }
    
    this.patterns.clear();
    this.memoryBank.clear();
    this.pathways.clear();
  }
}