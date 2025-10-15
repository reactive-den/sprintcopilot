import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : null;

// Create rate limiter (10 requests per hour per IP)
export const rateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'sprintcopilot',
    })
  : null;

export async function checkRateLimit(identifier: string) {
  // If Redis is not configured, allow all requests (dev mode)
  if (!rateLimiter) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: new Date(Date.now() + 3600000),
    };
  }
  
  const { success, limit, reset, remaining } = await rateLimiter.limit(identifier);
  
  return {
    success,
    limit,
    remaining,
    reset: new Date(reset),
  };
}

// Middleware helper for Next.js API routes
export async function withRateLimit(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  
  const { success, reset, remaining } = await checkRateLimit(ip);
  
  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toISOString(),
        },
      }
    );
  }
  
  const response = await handler();
  
  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toISOString());
  
  return response;
}
