import { ChatOpenAI } from '@langchain/openai';

export const llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
  openAIApiKey: process.env.OPENAI_API_KEY,
});
