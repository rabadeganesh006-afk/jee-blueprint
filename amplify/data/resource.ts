import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { askAi } from '../functions/ask-ai/resource';

const schema = a.schema({
  askAi: a
    .query()
    .arguments({
      question: a.string().required(),
      context: a.string(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(askAi)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
