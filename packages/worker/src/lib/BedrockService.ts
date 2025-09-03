import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from './aws-clients';

export class BedrockService {
  async invokeModel(prompt: string, modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0') {
    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0].text;
  }

  async generateCode(requirements: string, language: string = 'typescript') {
    const prompt = `Generate production-ready ${language} code for: ${requirements}. Include error handling and documentation.`;
    return this.invokeModel(prompt);
  }

  async generatePlan(goal: string, context?: string) {
    const prompt = `Create a detailed execution plan for: ${goal}${context ? `\nContext: ${context}` : ''}. Break into actionable steps with time estimates.`;
    return this.invokeModel(prompt);
  }
}