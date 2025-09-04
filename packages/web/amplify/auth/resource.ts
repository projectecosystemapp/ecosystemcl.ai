import { defineAuth } from '@aws-amplify/backend';

/**
 * ECOSYSTEMCL.AI Authentication Configuration
 * Simplified for initial deployment
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});