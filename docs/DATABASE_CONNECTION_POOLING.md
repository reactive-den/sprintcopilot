# Database Connection Pooling Configuration

## Overview

Connection pooling is critical for production applications to prevent database connection exhaustion and ensure optimal performance under load. This document explains how SprintCopilot manages database connections.

## Configuration

### Environment Variables

Connection pool settings are configured via environment variables in `.env`:

```bash
# Database Connection Pool Settings
DATABASE_POOL_MIN="2"      # Minimum connections to maintain
DATABASE_POOL_MAX="10"     # Maximum connections allowed
DATABASE_POOL_TIMEOUT="20" # Connection timeout in seconds
```

### Recommended Settings

#### Development

```bash
DATABASE_POOL_MIN="2"
DATABASE_POOL_MAX="5"
DATABASE_POOL_TIMEOUT="20"
```

#### Production (Small - Medium Traffic)

```bash
DATABASE_POOL_MIN="2"
DATABASE_POOL_MAX="10"
DATABASE_POOL_TIMEOUT="20"
```

#### Production (High Traffic)

```bash
DATABASE_POOL_MIN="5"
DATABASE_POOL_MAX="20"
DATABASE_POOL_TIMEOUT="30"
```

## How It Works

### Prisma Client Configuration

The Prisma client is configured in `src/lib/prisma.ts` with:

1. **Single Instance Pattern**: Prevents multiple Prisma clients in development
2. **Graceful Shutdown**: Disconnects properly on application exit
3. **Health Checks**: Provides connection health monitoring

```typescript
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
```

### Connection Pool Behavior

1. **Minimum Connections**: Always maintained in the pool
2. **Maximum Connections**: Hard limit to prevent exhaustion
3. **Timeout**: How long to wait for an available connection
4. **Idle Timeout**: Connections are closed after inactivity (default: 10 minutes)

## Database URL Format

### Standard PostgreSQL URL

```
postgresql://username:password@host:port/database
```

### With Connection Pool Parameters

```
postgresql://username:password@host:port/database?connection_limit=10&pool_timeout=20
```

### Supabase Example

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
```

### Neon Example

```
postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
```

## Monitoring Connection Pool

### Health Check Endpoint

Create a health check endpoint to monitor database connectivity:

```typescript
// src/app/api/health/route.ts
import { checkDatabaseConnection } from '@/lib/prisma';

export async function GET() {
  const dbHealthy = await checkDatabaseConnection();

  return Response.json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy,
    timestamp: new Date().toISOString(),
  });
}
```

### Logging

In development, Prisma logs all queries:

```typescript
log: isDevelopment ? ['query', 'error', 'warn'] : ['error'];
```

In production, only errors are logged to reduce noise.

## Common Issues & Solutions

### Issue: "Too many connections"

**Symptoms**: Database rejects new connections
**Cause**: Connection pool exhausted or not properly closed
**Solution**:

1. Increase `DATABASE_POOL_MAX`
2. Ensure proper connection cleanup
3. Check for connection leaks in code

### Issue: "Connection timeout"

**Symptoms**: Queries hang or timeout
**Cause**: All connections busy, waiting for available connection
**Solution**:

1. Increase `DATABASE_POOL_TIMEOUT`
2. Optimize slow queries
3. Increase `DATABASE_POOL_MAX`

### Issue: "Connection refused"

**Symptoms**: Cannot connect to database
**Cause**: Database not running or incorrect credentials
**Solution**:

1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Verify network connectivity

## Best Practices

### 1. Use Connection Pooling in Production

Always use a connection pooler like PgBouncer for production:

- Reduces connection overhead
- Better resource utilization
- Handles connection spikes

### 2. Set Appropriate Pool Sizes

Calculate based on:

- Expected concurrent requests
- Database plan limits
- Application server count

**Formula**: `pool_size = (core_count * 2) + effective_spindle_count`

For serverless: Keep pool size small (2-5) per instance

### 3. Monitor Connection Usage

Track:

- Active connections
- Idle connections
- Connection wait time
- Query performance

### 4. Graceful Shutdown

Always disconnect Prisma client on shutdown:

```typescript
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### 5. Handle Connection Errors

Implement retry logic for transient connection errors:

```typescript
import { retryWithBackoff } from '@/lib/errors';

const result = await retryWithBackoff(async () => {
  return await prisma.project.findMany();
});
```

## Database Provider Specific Notes

### Supabase

- Use PgBouncer connection string for pooling
- Default pool size: 15 connections (Free tier)
- Enable connection pooling in project settings

### Neon

- Built-in connection pooling
- Automatic scaling
- No manual pool configuration needed

### Railway

- Connection pooling via PgBouncer
- Configure in service settings
- Monitor via Railway dashboard

### Self-Hosted PostgreSQL

- Install PgBouncer separately
- Configure pool sizes in pgbouncer.ini
- Monitor with pg_stat_activity

## Testing Connection Pooling

### Load Testing

```bash
# Install k6 for load testing
brew install k6

# Run load test
k6 run scripts/load-test.js
```

### Monitor Connections

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection details
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'sprintcopilot';
```

## Troubleshooting Checklist

- [ ] Verify `DATABASE_URL` is correct
- [ ] Check database is accessible
- [ ] Confirm pool settings are appropriate
- [ ] Monitor active connections
- [ ] Check for connection leaks
- [ ] Review slow query logs
- [ ] Verify graceful shutdown works
- [ ] Test under load
- [ ] Monitor error rates
- [ ] Check database plan limits

## Additional Resources

- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [PgBouncer Documentation](https://www.pgbouncer.org/usage.html)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

**Last Updated**: January 16, 2025  
**Maintained By**: SprintCopilot Team
