import { defineFunction } from '@aws-amplify/backend';

export const forgeExecute = defineFunction({
  name: 'forge-execute',
  entry: './handler.ts',
  environment: {
    ANTHROPIC_API_KEY: 'placeholder',
    OPENAI_API_KEY: 'placeholder',
  }
});