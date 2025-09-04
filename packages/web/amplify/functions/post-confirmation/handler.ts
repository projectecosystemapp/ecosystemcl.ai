import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const userId = event.userName;
    const email = event.request.userAttributes.email;

    await client.models.UserProfile.create({
      userId,
      email,
      tier: 'starter',
      credits: 10000,
      apiKeys: {},
      workspaces: [],
      createdAt: new Date().toISOString(),
    });
  }
  return event;
};