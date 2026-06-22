import { defineFunction, secret } from '@aws-amplify/backend';

export const askAi = defineFunction({
  name: 'ask-ai',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    GEMINI_API_KEY: secret('GEMINI_API_KEY'),
  },
});
