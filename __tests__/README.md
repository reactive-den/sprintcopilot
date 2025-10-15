# SprintCopilot Testing Guide

This directory contains automated tests for the SprintCopilot API.

## Test Structure

```
__tests__/
├── setup.ts              # Test setup and cleanup
├── api/
│   └── projects.test.ts  # Project API tests
└── README.md            # This file
```

## Running Tests

### Quick API Test (End-to-End)

This script tests the complete flow with real OpenAI API calls:

```bash
# Make sure the dev server is running first
pnpm dev

# In another terminal, run the test
pnpm test:api
```

**What it does:**
1. Creates a test project
2. Starts a run (triggers LangGraph pipeline)
3. Polls until completion (1-3 minutes)
4. Downloads CSV and Jira exports
5. Validates all responses

**Requirements:**
- Development server must be running (`pnpm dev`)
- `OPENAI_API_KEY` must be set in `.env`
- Database must be accessible

### Vitest Unit Tests

Fast unit tests that don't require the server or OpenAI:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

## Test Environment Setup

### 1. Environment Variables

Create a `.env.test` file (optional) or use your existing `.env`:

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
NODE_ENV="test"
```

### 2. Test Database (Recommended)

For safety, use a separate test database:

```bash
# Create test database
createdb sprintcopilot_test

# Update .env.test
DATABASE_URL="postgresql://user:pass@localhost:5432/sprintcopilot_test"

# Run migrations
npx prisma migrate deploy
```

## Writing Tests

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('My Feature', () => {
  it('should do something', async () => {
    const result = await prisma.project.create({
      data: {
        title: 'Test Project',
        problem: 'Test problem',
      },
    });
    
    expect(result).toBeDefined();
    expect(result.title).toBe('Test Project');
  });
});
```

## Test Coverage

Generate a coverage report:

```bash
pnpm test:coverage
```

View the HTML report:
```bash
open coverage/index.html
```

## Troubleshooting

### Tests Failing

1. **Database connection issues**
   - Ensure PostgreSQL is running
   - Check `DATABASE_URL` in `.env`
   - Run `npx prisma migrate deploy`

2. **OpenAI API errors** (for `test:api`)
   - Verify `OPENAI_API_KEY` is set
   - Check API quota/limits
   - Ensure you have credits

3. **Server not running** (for `test:api`)
   - Start dev server: `pnpm dev`
   - Wait for "Ready" message
   - Check port 3000 is available

### Clean Test Data

```bash
# Reset test database
npx prisma migrate reset --force

# Or manually clean
npx prisma studio
# Delete all records from tables
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    NODE_ENV: test
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach`/`afterEach` for cleanup
3. **Mocking**: Mock external services when possible
4. **Speed**: Keep unit tests fast (<100ms each)
5. **Coverage**: Aim for >80% coverage on critical paths

## Next Steps

- Add more test files for other API routes
- Add integration tests for the full pipeline
- Add E2E tests with Playwright
- Set up CI/CD with automated testing
