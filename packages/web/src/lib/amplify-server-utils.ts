import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { awsconfig } from '../config';
import { cookies } from 'next/headers';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: awsconfig,
});

export async function getAuthenticatedUser() {
  try {
    return await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
  } catch (error) {
    return null;
  }
}
