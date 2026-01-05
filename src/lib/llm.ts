import { ChatOpenAI } from '@langchain/openai';
import { env } from './env';

export const llm = new ChatOpenAI({
  modelName: env.OPENAI_MODEL,
  temperature: 0.7,
  maxTokens: env.OPENAI_MAX_TOKENS,
  openAIApiKey: env.OPENAI_API_KEY,
  timeout: 60000, // 60 seconds timeout
  maxRetries: 3, // Retry up to 3 times on failure
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://sprintcopilot.app', // Optional: your site URL
      'X-Title': 'SprintCopilot', // Optional: your app name
    },
  },
});
