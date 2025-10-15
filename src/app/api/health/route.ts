import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/prisma';
import { isRedisConfigured } from '@/lib/env';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

/**
 * Health check endpoint
 * Used by load balancers and monitoring systems to verify service health
 *
 * GET /api/health
 *
 * Returns:
 * - 200: Service is healthy
 * - 503: Service is unhealthy
 */
export async function GET() {
  const startTime = Date.now();

  // Check database connection
  const dbHealthy = await checkDatabaseConnection();

  // Check Redis connection (if configured)
  let redisHealthy = true;
  if (isRedisConfigured) {
    try {
      const redis = new Redis({
        url: env.UPSTASH_REDIS_REST_URL!,
        token: env.UPSTASH_REDIS_REST_TOKEN!,
      });
      await redis.ping();
    } catch (error) {
      console.error('Redis health check failed:', error);
      redisHealthy = false;
    }
  }

  const responseTime = Date.now() - startTime;
  const isHealthy = dbHealthy && redisHealthy;

  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    services: {
      database: {
        status: dbHealthy ? 'up' : 'down',
        type: 'postgresql',
      },
      redis: {
        status: isRedisConfigured ? (redisHealthy ? 'up' : 'down') : 'not_configured',
        type: 'upstash',
      },
    },
    version: process.env.npm_package_version || '0.1.0',
    environment: env.NODE_ENV,
  };

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
