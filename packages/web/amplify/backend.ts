import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { forgeExecute } from './functions/forge-execute/resource';
import { postConfirmation } from './functions/post-confirmation/resource';

/**
 * ECOSYSTEMCL.AI Backend - Full Platform
 */
const backend = defineBackend({
  auth,
  data,
  forgeExecute,
  postConfirmation,
});

// Add function outputs
backend.addOutput({
  custom: {
    FORGE_EXECUTE_URL: backend.forgeExecute.resources.lambda.functionArn,
  },
});

// Export the API endpoint for CLI configuration
backend.addOutput({
  custom: {
    API_ENDPOINT: 'https://ecosystem-app.com/api',
  },
});