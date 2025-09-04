import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

/**
 * Minimal ECOSYSTEMCL.AI Backend - Just Auth for Now
 */
const backend = defineBackend({
  auth,
});

// Export the API endpoint for CLI configuration
backend.addOutput({
  custom: {
    API_ENDPOINT: 'https://ecosystem-app.com/api',
  },
});