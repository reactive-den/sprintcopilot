import { z } from 'zod';

/**
 * Environment variable validation schema
 * This ensures all required environment variables are present and valid at startup
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),

  // OpenAI Configuration
  OPENAI_API_KEY: z
    .string()
    .min(1, 'OPENAI_API_KEY is required')
    .refine((key) => key.startsWith('sk-'), 'OPENAI_API_KEY must start with sk-'),

  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  OPENAI_MAX_TOKENS: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 128000, 'OPENAI_MAX_TOKENS must be between 1 and 128000'),

  // Rate Limiting (Optional - Upstash Redis)
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url('UPSTASH_REDIS_REST_URL must be a valid URL')
    .optional()
    .or(z.literal('')),

  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),

  // Application Configuration
  MAX_FEATURE_LENGTH: z
    .string()
    .default('2000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'MAX_FEATURE_LENGTH must be positive'),

  MAX_TICKETS_PER_RUN: z
    .string()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'MAX_TICKETS_PER_RUN must be between 1 and 100'),

  DEFAULT_SPRINT_CAPACITY: z
    .string()
    .default('40')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'DEFAULT_SPRINT_CAPACITY must be positive'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database Connection Pool (Optional)
  DATABASE_POOL_MIN: z
    .string()
    .optional()
    .default('2')
    .transform((val) => parseInt(val, 10)),

  DATABASE_POOL_MAX: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),

  DATABASE_POOL_TIMEOUT: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10)),
});

/**
 * Validate and parse environment variables
 * This will throw an error if validation fails, preventing the app from starting
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      console.error('');

      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        console.error(`  • ${path}: ${issue.message}`);
      });

      console.error('');
      console.error('Please check your .env file and ensure all required variables are set.');
      console.error('See .env.example for reference.');
      console.error('');

      throw new Error('Invalid environment variables');
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 * Use this instead of process.env throughout the application
 */
export const env = validateEnv();

/**
 * Type-safe environment variable access
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if Redis is configured for rate limiting
 */
export const isRedisConfigured = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test mode
 */
export const isTest = env.NODE_ENV === 'test';
