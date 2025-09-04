import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // User profiles and subscription management
  UserProfile: a
    .model({
      userId: a.id().required(),
      email: a.email().required(),
      // Legacy field for backward compatibility
      tier: a.enum(['starter', 'pro', 'team', 'enterprise']),
      // New subscription fields
      whopSubscriptionId: a.string(),
      subscriptionStatus: a.enum(['active', 'trialing', 'cancelled', 'past_due']),
      subscriptionTier: a.enum(['developer', 'architect', 'enterprise']),
      trialEndsAt: a.datetime(),
      subscriptionEndsAt: a.datetime(),
      credits: a.integer(),
      apiKeys: a.json(), // Encrypted API keys
      workspaces: a.string().array(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // Workspaces for project organization
  Workspace: a
    .model({
      workspaceId: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      ownerId: a.string().required(),
      members: a.string().array(),
      files: a.json(), // File structure
      settings: a.json(),
    })
    .authorization((allow) => [allow.owner(), allow.authenticated().to(['read'])]),

  // Plans for execution
  Plan: a
    .model({
      goal: a.string().required(),
      workspaceId: a.string(),
      status: a.enum(['pending', 'executing', 'completed', 'failed']),
      result: a.json(),
      creditsUsed: a.integer(),
    })
    .authorization((allow) => [allow.authenticated()]),

  // API Key management
  ApiKey: a
    .model({
      keyId: a.id().required(),
      service: a.enum(['anthropic', 'openai', 'github', 'aws']),
      keyName: a.string().required(),
      encryptedKey: a.string().required(),
      isActive: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),

  // Subscription audit trail
  SubscriptionEvent: a
    .model({
      eventId: a.id().required(),
      userId: a.string().required(),
      whopSubscriptionId: a.string(),
      eventType: a.enum(['subscription_created', 'subscription_updated', 'subscription_cancelled', 'subscription_renewed', 'trial_started', 'trial_ended', 'payment_succeeded', 'payment_failed']),
      fromStatus: a.string(),
      toStatus: a.string(),
      fromTier: a.string(),
      toTier: a.string(),
      metadata: a.json(), // Additional event data
      timestamp: a.datetime().required(),
      source: a.enum(['whop_webhook', 'admin_action', 'user_action', 'system_automation']),
    })
    .authorization((allow) => [allow.owner(), allow.groups(['admin']).to(['read', 'create', 'update', 'delete'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});