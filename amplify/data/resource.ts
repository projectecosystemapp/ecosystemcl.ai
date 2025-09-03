import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * ECOSYSTEMCL.AI Data Schema
 * Fully AWS-native using DynamoDB through Amplify Data
 */
const schema = a.schema({
  // Workspace management
  Workspace: a
    .model({
      workspaceId: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      ownerId: a.string().required(),
      members: a.string().array(), // Array of user IDs
      settings: a.json(),
      cloudBrainData: a.json(), // Stored context and memory
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Agent configurations
  AgentConfig: a
    .model({
      agentId: a.id().required(),
      workspaceId: a.string().required(),
      name: a.string().required(),
      type: a.enum(['orchestrator', 'specialist', 'reviewer', 'implementer']),
      model: a.string().default('claude-3-opus'),
      systemPrompt: a.string(),
      temperature: a.float().default(0.7),
      maxTokens: a.integer().default(4096),
      capabilities: a.string().array(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // Plan executions
  Plan: a
    .model({
      planId: a.id().required(),
      workspaceId: a.string().required(),
      userId: a.string().required(),
      goal: a.string().required(),
      status: a.enum(['pending', 'planning', 'executing', 'completed', 'failed', 'cancelled']),
      steps: a.json(), // Array of plan steps
      context: a.json(), // Execution context
      result: a.json(),
      startedAt: a.datetime(),
      completedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Agent execution logs
  AgentExecution: a
    .model({
      executionId: a.id().required(),
      planId: a.string().required(),
      agentId: a.string().required(),
      stepNumber: a.integer().required(),
      input: a.json(),
      output: a.json(),
      reasoning: a.string(),
      tokensUsed: a.integer(),
      duration: a.integer(), // milliseconds
      status: a.enum(['running', 'completed', 'failed', 'timeout']),
      error: a.string(),
      timestamp: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated(),
    ]),

  // API keys and service connections
  ServiceConnection: a
    .model({
      connectionId: a.id().required(),
      userId: a.string().required(),
      service: a.enum(['bedrock', 'github', 'gitlab', 'bitbucket']),
      credentials: a.json(), // Encrypted in Lambda
      isActive: a.boolean().default(true),
      lastUsed: a.datetime(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Credit transactions
  CreditTransaction: a
    .model({
      transactionId: a.id().required(),
      userId: a.string().required(),
      amount: a.integer().required(),
      type: a.enum(['purchase', 'usage', 'refund', 'bonus']),
      description: a.string(),
      planId: a.string(),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins']),
    ]),

  // Usage tracking for billing
  UsageMetrics: a
    .model({
      metricId: a.id().required(),
      userId: a.string().required(),
      workspaceId: a.string(),
      date: a.date().required(),
      tokensUsed: a.integer().default(0),
      executionsCount: a.integer().default(0),
      storageBytes: a.integer().default(0),
      computeSeconds: a.integer().default(0),
      creditsUsed: a.integer().default(0),
      tier: a.enum(['starter', 'pro', 'team', 'enterprise']),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admins']),
    ]),

  // Audit log for compliance
  AuditLog: a
    .model({
      logId: a.id().required(),
      userId: a.string().required(),
      action: a.string().required(),
      resourceType: a.string(),
      resourceId: a.string(),
      details: a.json(),
      ipAddress: a.string(),
      userAgent: a.string(),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.groups(['admins']),
    ]),

  // Device authorization for CLI
  DeviceAuth: a
    .model({
      deviceCode: a.string().required(),
      userCode: a.string().required(),
      userId: a.string(),
      status: a.enum(['pending', 'authorized', 'expired', 'denied']),
      expiresAt: a.datetime().required(),
      createdAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.guest().to(['create', 'read']),
      allow.authenticated(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
  subscriptions: {
    level: 'public',
  },
});