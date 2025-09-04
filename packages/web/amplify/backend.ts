import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * ECOSYSTEMCL.AI Backend with Auth and Data
 */
const backend = defineBackend({
  auth,
  data,
});

// Export the API endpoint for CLI configuration
backend.addOutput({
  custom: {
    API_ENDPOINT: 'https://ecosystem-app.com/api',
  },
});