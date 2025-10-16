import { PrismaClient } from '@prisma/client';
import { env, isDevelopment, isProduction } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma client with connection pooling configuration
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        // Use dummy URL during build if SKIP_ENV_VALIDATION is set
        url:
          process.env.SKIP_ENV_VALIDATION === '1'
            ? 'postgresql://dummy:dummy@localhost:5432/dummy'
            : env.DATABASE_URL,
      },
    },
  });

// Prevent multiple instances in development
if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect Prisma on application shutdown
 */
if (isProduction) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

/**
 * Check database connection health
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
