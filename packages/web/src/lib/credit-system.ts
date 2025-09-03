export class CreditSystem {
  async calculateJobCost(inputTokens: number, outputTokens: number, modelId: string) {
    const rates = {
      'claude-3-opus': { input: 15, output: 75 }, // per 1M tokens
      'claude-3-sonnet': { input: 3, output: 15 },
      'claude-3-haiku': { input: 0.25, output: 1.25 },
    };

    const rate = rates[modelId] || rates['claude-3-sonnet'];
    const cost = (inputTokens * rate.input + outputTokens * rate.output) / 1000000;
    
    // Apply 2x markup after optimizations
    return Math.ceil(cost * 2 * 1000); // Convert to credits (1 credit = $0.001)
  }

  async deductCredits(userId: string, amount: number) {
    // Atomic transaction to deduct credits
    const { data, error } = await supabase.rpc('deduct_user_credits', {
      user_id: userId,
      amount: amount
    });

    if (error) throw new Error('Insufficient credits');
    return data;
  }

  async optimizeModelSelection(taskComplexity: 'simple' | 'medium' | 'complex') {
    const modelMap = {
      simple: 'claude-3-haiku',    // 20x cheaper
      medium: 'claude-3-sonnet',   // 5x cheaper  
      complex: 'claude-3-opus',    // Most capable
    };

    return modelMap[taskComplexity];
  }
}