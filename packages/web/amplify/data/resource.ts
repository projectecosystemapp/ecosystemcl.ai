import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // User profiles and tier management
  UserProfile: a
    .model({
      userId: a.id().required(),
      email: a.email().required(),
      tier: a.enum(['starter', 'pro', 'team', 'enterprise']),
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
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});