import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Plan: a
    .model({
      goal: a.string().required(),
      status: a.enum(['pending', 'executing', 'completed', 'failed']),
      result: a.json(),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});