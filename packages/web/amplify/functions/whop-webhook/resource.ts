import { defineFunction } from '@aws-amplify/backend';

export const whopWebhook = defineFunction({
  name: 'whop-webhook',
  entry: './handler.ts',
  environment: {
    WHOP_WEBHOOK_SECRET: 'placeholder', // Will be set via environment variables
  },
  timeoutSeconds: 30, // Allow sufficient time for database operations
});