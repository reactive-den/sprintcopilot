# Technical Specifications

## Environment Configuration

### `.env.example`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sprintcopilot"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"  # or gpt-4o for better quality
OPENAI_MAX_TOKENS=4000

# NextAuth (if implementing auth)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# App Config
MAX_FEATURE_LENGTH=2000
MAX_TICKETS_PER_RUN=20
DEFAULT_SPRINT_CAPACITY=40  # hours per sprint
```

---

## Enhanced Prisma Schema

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  projects  Project[]
  apiUsage  ApiUsage[]
}

model Project {
  id          String   @id @default(cuid())
  userId      String?
  title       String
  problem     String   @db.Text
  constraints String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  runs        Run[]
  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
}

model Run {
  id              String    @id @default(cuid())
  projectId       String
  createdAt       DateTime  @default(now())
  status          RunStatus @default(PENDING)
  clarifications  Json?
  hld             Json?
  summary         String?   @db.Text
  errorMessage    String?   @db.Text
  tokensUsed      Int       @default(0)
  durationMs      Int?
  tickets         Ticket[]
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([status])
}

model Ticket {
  id                  String       @id @default(cuid())
  runId               String
  title               String
  description         String       @db.Text
  acceptanceCriteria  String       @db.Text
  estimateHours       Int?
  tshirtSize          TShirtSize?
  priority            Int
  sprint              Int?
  status              TicketStatus @default(TODO)
  dependencies        String[]     // Array of ticket IDs
  tags                String[]
  run                 Run          @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([runId])
}

model ApiUsage {
  id          String   @id @default(cuid())
  userId      String
  endpoint    String
  tokensUsed  Int
  cost        Float
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}

enum RunStatus {
  PENDING
  CLARIFYING
  DRAFTING_HLD
  SLICING_TICKETS
  ESTIMATING
  PRIORITIZING
  COMPLETED
  FAILED
}

enum TicketStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TShirtSize {
  XS
  S
  M
  L
  XL
}
```

---

## Zod Validation Schemas

### `lib/validations.ts`

```typescript
import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  problem: z
    .string()
    .min(20, 'Problem statement must be at least 20 characters')
    .max(2000, 'Problem statement too long'),
  constraints: z.string().max(1000, 'Constraints too long').optional(),
});

export const createRunSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
});

export const runStatusSchema = z.enum([
  'PENDING',
  'CLARIFYING',
  'DRAFTING_HLD',
  'SLICING_TICKETS',
  'ESTIMATING',
  'PRIORITIZING',
  'COMPLETED',
  'FAILED',
]);

export const tshirtSizeSchema = z.enum(['XS', 'S', 'M', 'L', 'XL']);

export const ticketStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const ticketSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().min(1, 'Description required'),
  acceptanceCriteria: z.string().min(1, 'Acceptance criteria required'),
  estimateHours: z.number().positive().optional(),
  tshirtSize: tshirtSizeSchema.optional(),
  priority: z.number().min(1).max(10),
  sprint: z.number().positive().optional(),
  dependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const clarificationsSchema = z.object({
  questions: z.array(z.string()),
  assumptions: z.array(z.string()),
  scope: z.string(),
});

export const hldSchema = z.object({
  modules: z.array(z.string()),
  dataFlows: z.array(z.string()),
  risks: z.array(z.string()),
  nfrs: z.array(z.string()),
});
```

---

## LangGraph State & Prompts

### `lib/langgraph/state.ts`

```typescript
import { Annotation } from '@langchain/langgraph';

export const GraphState = Annotation.Root({
  // Input
  projectId: Annotation<string>,
  title: Annotation<string>,
  problem: Annotation<string>,
  constraints: Annotation<string | undefined>,

  // Clarifier outputs
  clarifications: Annotation<
    | {
        questions: string[];
        assumptions: string[];
        scope: string;
      }
    | undefined
  >,

  // HLD outputs
  hld: Annotation<
    | {
        modules: string[];
        dataFlows: string[];
        risks: string[];
        nfrs: string[];
      }
    | undefined
  >,

  // Ticket slicer outputs
  rawTickets: Annotation<
    | Array<{
        title: string;
        description: string;
        acceptanceCriteria: string;
      }>
    | undefined
  >,

  // Estimator outputs
  estimatedTickets: Annotation<
    | Array<{
        title: string;
        description: string;
        acceptanceCriteria: string;
        estimateHours: number;
        tshirtSize: string;
      }>
    | undefined
  >,

  // Prioritizer outputs
  finalTickets: Annotation<
    | Array<{
        title: string;
        description: string;
        acceptanceCriteria: string;
        estimateHours: number;
        tshirtSize: string;
        priority: number;
        sprint: number;
        dependencies: string[];
        tags: string[];
      }>
    | undefined
  >,

  // Metadata
  currentStep: Annotation<string>,
  errors: Annotation<string[]>,
  tokensUsed: Annotation<number>,
});

export type GraphStateType = typeof GraphState.State;
```

### `lib/langgraph/prompts.ts`

```typescript
export const CLARIFIER_PROMPT = `You are a senior product manager helping clarify a feature request.

Feature Title: {title}
Problem Statement: {problem}
Constraints: {constraints}

Your task:
1. Identify 3-5 clarifying questions that would help scope this feature better
2. List 3-5 key assumptions we should validate with stakeholders
3. Provide a clear, concise scope statement (2-3 sentences)

Return ONLY valid JSON in this exact format:
{
  "questions": ["Question 1?", "Question 2?", "Question 3?"],
  "assumptions": ["Assumption 1", "Assumption 2", "Assumption 3"],
  "scope": "Clear scope statement describing what's in and out of scope"
}`;

export const HLD_PROMPT = `You are a senior software architect creating a high-level design.

Feature: {title}
Scope: {scope}
Problem: {problem}
Constraints: {constraints}

Create a mini-HLD with:
1. Key modules/components (3-7 items) - describe each briefly
2. Data flows between components (3-5 flows)
3. Technical risks (2-4 risks)
4. Non-functional requirements (2-4 NFRs covering performance, security, scalability)

Return ONLY valid JSON in this exact format:
{
  "modules": ["Module 1: Brief description", "Module 2: Brief description"],
  "dataFlows": ["Flow 1: Component A -> Component B via REST API", "Flow 2: ..."],
  "risks": ["Risk 1: Description and mitigation", "Risk 2: ..."],
  "nfrs": ["NFR 1: Performance requirement", "NFR 2: Security requirement"]
}`;

export const TICKET_SLICER_PROMPT = `You are a senior product manager breaking down features into user stories.

Feature: {title}
Scope: {scope}
HLD Modules: {modules}
Problem: {problem}

Create 5-15 user stories following this format:
- Title: Clear, action-oriented (e.g., "User can login with email")
- Description: As a [user type], I want [goal] so that [benefit]
- Acceptance Criteria: Specific, testable conditions (3-5 per story)

Guidelines:
- Start with foundational/infrastructure stories
- Include frontend, backend, and testing stories
- Keep stories small and independently deliverable
- Include edge cases and error handling

Return ONLY valid JSON array in this exact format:
[
  {
    "title": "Story title",
    "description": "As a [user], I want [goal] so that [benefit]",
    "acceptanceCriteria": "1. Specific testable condition\\n2. Another condition\\n3. Edge case handling"
  }
]`;

export const ESTIMATOR_PROMPT = `You are a senior engineering manager estimating work.

Tickets: {tickets}

For each ticket, provide:
1. Estimated hours (realistic, including coding, testing, code review, and deployment)
2. T-shirt size based on hours:
   - XS: 1-4 hours (simple config changes, minor UI tweaks)
   - S: 4-8 hours (small features, simple API endpoints)
   - M: 8-16 hours (medium features, multiple components)
   - L: 16-32 hours (complex features, significant integration)
   - XL: 32+ hours (very complex, consider breaking down)

Consider:
- Technical complexity and unknowns
- Dependencies on other work
- Testing effort (unit, integration, E2E)
- Code review and iteration time
- Documentation needs

Return ONLY valid JSON array with estimates added to each ticket:
[
  {
    "title": "...",
    "description": "...",
    "acceptanceCriteria": "...",
    "estimateHours": 12,
    "tshirtSize": "M"
  }
]`;

export const PRIORITIZER_PROMPT = `You are a senior product manager prioritizing work for sprints.

Tickets: {tickets}
Sprint Capacity: {sprintCapacity} hours per sprint

Your task:
1. Assign priority (1-10, where 10 = highest priority)
   - Consider: user value, technical dependencies, risk reduction
2. Identify dependencies between tickets (use ticket titles to reference)
3. Assign to sprints (1, 2, or 3+)
   - Sprint 1: Foundational work, critical path items
   - Sprint 2: Core features building on Sprint 1
   - Sprint 3+: Nice-to-haves, polish, advanced features
4. Add relevant tags (e.g., "frontend", "backend", "infrastructure", "testing")

Ensure:
- Sprint 1 has foundational/infrastructure work
- Dependencies are respected in sprint assignments
- Sprint capacity is not exceeded (leave 20% buffer)
- High-risk items are tackled early

Return ONLY valid JSON array with priority, sprint, dependencies, and tags added:
[
  {
    "title": "...",
    "description": "...",
    "acceptanceCriteria": "...",
    "estimateHours": 12,
    "tshirtSize": "M",
    "priority": 9,
    "sprint": 1,
    "dependencies": ["Title of dependent ticket"],
    "tags": ["backend", "infrastructure"]
  }
]`;
```

---

## Error Handling

### `lib/errors.ts`

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class RateLimitError extends AppError {
  constructor(public resetTime?: Date) {
    super('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    this.resetTime = resetTime;
  }
}

export class LLMError extends AppError {
  constructor(
    message: string,
    public originalError?: any
  ) {
    super(message, 500, 'LLM_ERROR');
    this.originalError = originalError;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export const handleApiError = (error: unknown) => {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(error instanceof ValidationError && { details: error.details }),
      ...(error instanceof RateLimitError && { resetTime: error.resetTime }),
    };
  }

  // Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: error.issues,
    };
  }

  // Generic error
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
};

// Retry utility for LLM calls
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new LLMError(`Failed after ${maxRetries} retries`, lastError);
}
```

---

## Rate Limiting

### `lib/rate-limit.ts`

```typescript
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

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
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';

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
```

---

## Testing Configuration

### `jest.config.js`

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### `jest.setup.js`

```javascript
import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.OPENAI_API_KEY = 'sk-test-key';
```

---

## Deployment Configuration

### `DEPLOYMENT.md`

````markdown
# Deployment Checklist

## Pre-deployment

### Environment Variables

- [ ] DATABASE_URL (Supabase/Neon connection string)
- [ ] OPENAI_API_KEY (with sufficient credits)
- [ ] OPENAI_MODEL (gpt-4o-mini or gpt-4o)
- [ ] UPSTASH_REDIS_REST_URL (for rate limiting)
- [ ] UPSTASH_REDIS_REST_TOKEN
- [ ] NEXTAUTH_SECRET (if using auth)
- [ ] NEXTAUTH_URL (production URL)

### Database

- [ ] Provision Postgres database (Supabase/Neon/Railway)
- [ ] Enable connection pooling
- [ ] Configure backups
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify schema with: `npx prisma db pull`

### Testing

- [ ] All API endpoints tested locally
- [ ] LangGraph pipeline tested with real OpenAI
- [ ] Export functionality verified
- [ ] Error handling tested
- [ ] Rate limiting tested

## Vercel Deployment

### Project Configuration

```bash
# Build settings
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
Node Version: 20.x
```
````

### Environment Variables in Vercel

1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.example`
3. Set for Production, Preview, and Development

### Deploy

```bash
# Connect to Vercel
vercel link

# Deploy to production
vercel --prod
```

## Post-deployment

### Verification

- [ ] Test homepage loads
- [ ] Create a test project
- [ ] Verify LangGraph pipeline completes
- [ ] Test CSV export
- [ ] Test Jira JSON export
- [ ] Check error
