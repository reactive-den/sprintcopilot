import { env } from './env';

/**
 * Centralized application configuration
 * All configuration values should be accessed through this module
 */
export const config = {
  /**
   * Database configuration
   */
  database: {
    url: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
      timeout: env.DATABASE_POOL_TIMEOUT,
    },
  },

  /**
   * OpenAI/LLM configuration
   */
  llm: {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    maxTokens: env.OPENAI_MAX_TOKENS,
    timeout: 60000, // 60 seconds
    maxRetries: 3,
  },

  /**
   * Rate limiting configuration
   */
  rateLimit: {
    enabled: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
    requestsPerHour: 10,
    windowSize: '1 h' as const,
  },

  /**
   * Application limits
   */
  limits: {
    maxFeatureLength: env.MAX_FEATURE_LENGTH,
    maxTicketsPerRun: env.MAX_TICKETS_PER_RUN,
    defaultSprintCapacity: env.DEFAULT_SPRINT_CAPACITY,
  },

  /**
   * Environment flags
   */
  env: {
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    nodeEnv: env.NODE_ENV,
  },
} as const;

/**
 * Type-safe configuration access
 */
export type Config = typeof config;
