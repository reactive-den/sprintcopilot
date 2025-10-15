import { beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Setup before all tests
beforeAll(async () => {
  // You can add global setup here if needed
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test data after each test
  // Be careful with this in development - only run in test environment
  if (process.env.NODE_ENV === 'test') {
    await prisma.ticket.deleteMany();
    await prisma.run.deleteMany();
    await prisma.project.deleteMany();
  }
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
