import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import awsConfig from '@/config';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: awsConfig,
});