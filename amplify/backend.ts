import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { askAi } from './functions/ask-ai/resource';

defineBackend({
  auth,
  data,
  askAi,
});
