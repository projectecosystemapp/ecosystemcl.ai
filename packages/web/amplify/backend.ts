import { defineBackend } from '@aws-amplify/backend';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { forgeExecute } from './functions/forge-execute/resource';
import { postConfirmation } from './functions/post-confirmation/resource';
/**
 * ECOSYSTEMCL.AI Backend - Core Platform
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
    API_ENDPOINT: 'https://ecosystem-app.com/api',
    FORGE_EXECUTE_URL: backend.forgeExecute.resources.lambda.functionArn,
  },
});