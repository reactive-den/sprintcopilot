# Comprehensive Implementation Plan

## Phase 0: Project Setup (30 minutes)

### Step 0.1: Initialize Next.js Project
```bash
pnpm create next-app@latest sprintcopilot --typescript --tailwind --app --src-dir --import-alias "@/*"
cd sprintcopilot
```

### Step 0.2: Install Core Dependencies
```bash
# Core framework
pnpm add @prisma/client zod

# LangChain & LangGraph
pnpm add @langchain/core @langchain/openai @langchain/langgraph langchain

# UI Components
pnpm add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# Forms & Data Fetching
pnpm add react-hook-form @hookform/resolvers @tanstack/react-query

# Rate Limiting
pnpm add @upstash/redis @upstash/ratelimit

# Dev Dependencies
pnpm add -D prisma tsx @types/node
```

### Step 0.3: Initialize shadcn/ui
```bash
npx shadcn@latest init
# Choose: Default style, Slate color, CSS variables: yes
```

### Step 0.4: Install shadcn Components
```bash
npx shadcn@latest add button card input textarea label table badge skeleton progress tabs dialog toast dropdown-menu select
```

### Step 0.5: Setup Prisma
```bash
npx prisma init
```

---

## Phase 1: Database & Core Infrastructure (1 hour)

### Step 1.1: Configure Prisma Schema
**File:** `prisma/schema.prisma`
- Add the enhanced schema with User, Project, Run, Ticket, ApiUsage models
- Include all enums (RunStatus, TicketStatus, TShirtSize)

### Step 1.2: Create Environment File
**File:** `.env`
- Add all required environment variables
- Set DATABASE_URL for local Postgres
- Add OPENAI_API_KEY

### Step 1.3: Run Initial Migration
```bash
npx prisma migrate dev --name init
```

### Step 1.4: Create Prisma Client Singleton
**File:** `lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Step 1.5: Create Validation Schemas
**File:** `lib/validations.ts`
- Add all Zod schemas for API validation

### Step 1.6: Create Error Handling
**File:** `lib/errors.ts`
- Add custom error classes
- Add error handler utility

### Step 1.7: Setup Rate Limiting
**File:** `lib/rate-limit.ts`
- Configure Upstash Redis rate limiter

---

## Phase 2: LangGraph Pipeline (2 hours)

### Step 2.1: Create State Definition
**File:** `lib/langgraph/state.ts`
- Define GraphState annotation with all fields

### Step 2.2: Create Prompt Templates
**File:** `lib/langgraph/prompts.ts`
- Add all 5 node prompts (clarifier, HLD, slicer, estimator, prioritizer)

### Step 2.3: Create LLM Client
**File:** `lib/llm.ts`
```typescript
import { ChatOpenAI } from '@langchain/openai';

export const llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
});
```

### Step 2.4: Implement Clarifier Node
**File:** `lib/langgraph/nodes/clarifier.ts`
```typescript
import { llm } from '@/lib/llm';
import { CLARIFIER_PROMPT } from '../prompts';
import type { GraphStateType } from '../state';

export async function clarifierNode(state: GraphStateType) {
  const prompt = CLARIFIER_PROMPT
    .replace('{title}', state.title)
    .replace('{problem}', state.problem)
    .replace('{constraints}', state.constraints || 'None');
  
  const response = await llm.invoke(prompt);
  const clarifications = JSON.parse(response.content as string);
  
  return {
    clarifications,
    currentStep: 'CLARIFYING',
    tokensUsed: state.tokensUsed + response.usage_metadata.total_tokens,
  };
}
```

### Step 2.5: Implement HLD Node
**File:** `lib/langgraph/nodes/hld-drafter.ts`
- Similar structure to clarifier
- Parse HLD JSON response

### Step 2.6: Implement Ticket Slicer Node
**File:** `lib/langgraph/nodes/ticket-slicer.ts`
- Generate user stories array
- Validate with Zod schema

### Step 2.7: Implement Estimator Node
**File:** `lib/langgraph/nodes/estimator.ts`
- Add estimates to tickets
- Map T-shirt sizes

### Step 2.8: Implement Prioritizer Node
**File:** `lib/langgraph/nodes/prioritizer.ts`
- Assign priorities and sprints
- Identify dependencies

### Step 2.9: Create Pipeline Graph
**File:** `lib/langgraph/pipeline.ts`
```typescript
import { StateGraph, END } from '@langchain/langgraph';
import { GraphState } from './state';
import { clarifierNode } from './nodes/clarifier';
import { hldDrafterNode } from './nodes/hld-drafter';
import { ticketSlicerNode } from './nodes/ticket-slicer';
import { estimatorNode } from './nodes/estimator';
import { prioritizerNode } from './nodes/prioritizer';

export function createPipeline() {
  const workflow = new StateGraph(GraphState)
    .addNode('clarifier', clarifierNode)
    .addNode('hld_drafter', hldDrafterNode)
    .addNode('ticket_slicer', ticketSlicerNode)
    .addNode('estimator', estimatorNode)
    .addNode('prioritizer', prioritizerNode)
    .addEdge('__start__', 'clarifier')
    .addEdge('clarifier', 'hld_drafter')
    .addEdge('hld_drafter', 'ticket_slicer')
    .addEdge('ticket_slicer', 'estimator')
    .addEdge('estimator', 'prioritizer')
    .addEdge('prioritizer', END);
  
  return workflow.compile();
}
```

---

## Phase 3: API Routes (1.5 hours)

### Step 3.1: Create Projects API
**File:** `app/api/projects/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProjectSchema } from '@/lib/validations';
import { handleApiError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createProjectSchema.parse(body);
    
    const project = await prisma.project.create({
      data: validated,
    });
    
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function GET(request: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    return NextResponse.json({ projects });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
```

### Step 3.2: Create Single Project API
**File:** `app/api/projects/[id]/route.ts`
- GET endpoint to fetch project with runs

### Step 3.3: Create Runs API
**File:** `app/api/runs/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRunSchema } from '@/lib/validations';
import { createPipeline } from '@/lib/langgraph/pipeline';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'anonymous';
    const { success } = await checkRateLimit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { projectId } = createRunSchema.parse(body);
    
    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Create run
    const run = await prisma.run.create({
      data: {
        projectId,
        status: 'PENDING',
      },
    });
    
    // Start pipeline asynchronously
    executePipeline(run.id, project).catch(console.error);
    
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

async function executePipeline(runId: string, project: any) {
  const startTime = Date.now();
  
  try {
    await prisma.run.update({
      where: { id: runId },
      data: { status: 'CLARIFYING' },
    });
    
    const pipeline = createPipeline();
    const result = await pipeline.invoke({
      projectId: project.id,
      title: project.title,
      problem: project.problem,
      constraints: project.constraints,
      currentStep: 'PENDING',
      errors: [],
      tokensUsed: 0,
    });
    
    // Save tickets
    const tickets = await prisma.ticket.createMany({
      data: result.finalTickets.map((t: any) => ({
        runId,
        ...t,
      })),
    });
    
    // Update run
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        clarifications: result.clarifications,
        hld: result.hld,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });
  }
}
```

### Step 3.4: Create Run Status API
**File:** `app/api/runs/[id]/route.ts`
- GET endpoint for polling run status

### Step 3.5: Create Export APIs
**File:** `app/api/runs/[id]/export/csv/route.ts`
**File:** `app/api/runs/[id]/export/jira/route.ts`
- CSV export endpoint
- Jira JSON export endpoint

---

## Phase 4: Frontend Components (2 hours)

### Step 4.1: Create Layout
**File:** `app/layout.tsx`
- Add React Query provider
- Add Toaster component

### Step 4.2: Create Home Page (Create Brief)
**File:** `app/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(createProjectSchema),
  });
  
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const { project } = await res.json();
      
      // Create run
      const runRes = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      
      const { run } = await runRes.json();
      router.push(`/projects/${project.id}?runId=${run.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-4xl font-bold mb-8">SprintCopilot</h1>
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Feature Title</Label>
            <Input {...form.register('title')} />
          </div>
          <div>
            <Label>Problem Statement</Label>
            <Textarea {...form.register('problem')} rows={5} />
          </div>
          <div>
            <Label>Constraints (Optional)</Label>
            <Textarea {...form.register('constraints')} rows={3} />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Plan'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

### Step 4.3: Create Project Results Page
**File:** `app/projects/[id]/page.tsx`
- Display run status with progress
- Show clarifications, HLD, tickets
- Export buttons

### Step 4.4: Create Projects List Page
**File:** `app/projects/page.tsx`
- List all projects with last run status

### Step 4.5: Create Reusable Components
**File:** `components/StepsProgress.tsx` - Progress indicator
**File:** `components/TicketsTable.tsx` - Tickets display
**File:** `components/HLDCard.tsx` - HLD display
**File:** `components/ClarificationsCard.tsx` - Clarifications display

### Step 4.6: Create Custom Hooks
**File:** `hooks/useRun.ts` - Polling hook for run status
**File:** `hooks/useProject.ts` - Project data fetching

---

## Phase 5: Testing & Polish (1 hour)

### Step 5.1: Create Test Setup
**File:** `jest.config.js`
**File:** `jest.setup.js`

### Step 5.2: Write API Tests
**File:** `__tests__/api/projects.test.ts`
**File:** `__tests__/api/runs.test.ts`

### Step 5.3: Write Component Tests
**File:** `__tests__/components/TicketsTable.test.tsx`

### Step 5.4: Manual Testing Checklist
- [ ] Create project flow
- [ ] Run generation with real OpenAI
- [ ] Verify all 5 pipeline steps
- [ ] Test CSV export
- [ ] Test Jira JSON export
- [ ] Test error handling
- [ ] Test rate limiting

### Step 5.5: UI Polish
- Add loading skeletons
- Add error boundaries
- Add toast notifications
- Improve responsive design

---

## Phase 6: Deployment (30 minutes)

### Step 6.1: Setup Vercel Project
- Connect GitHub repo
- Configure environment variables

### Step 6.2: Setup Production Database
- Provision Supabase/Neon Postgres
- Run migrations: `npx prisma migrate deploy`

### Step 6.3: Deploy
```bash
git push origin main
```

### Step 6.4: Post-Deployment Verification
- Test production API endpoints
- Verify LangGraph pipeline
- Check error logging
- Monitor performance

---

## Time Estimates

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Setup | 30 min | 30 min |
| Phase 1: Database | 1 hour | 1.5 hours |
| Phase 2: LangGraph | 2 hours | 3.5 hours |
| Phase 3: API Routes | 1.5 hours | 5 hours |
| Phase 4: Frontend | 2 hours | 7 hours |
| Phase 5: Testing | 1 hour | 8 hours |
| Phase 6: Deployment | 30 min | 8.5 hours |

**Total: ~8.5 hours (1-2 days)**

---

## Critical Path Dependencies

```
Phase 0 (Setup)
    ↓
Phase 1 (Database) ← Must complete before Phase 3
    ↓
Phase 2 (LangGraph) ← Must complete before Phase 3
    ↓
Phase 3 (API Routes) ← Must complete before Phase 4
    ↓
Phase 4 (Frontend)
    ↓
Phase 5 (Testing)
    ↓
Phase 6 (Deployment)
```

---

## Risk Mitigation

### Risk 1: OpenAI API Failures
- **Mitigation**: Implement retry logic with exponential backoff
- **Fallback**: Save partial progress at each node

### Risk 2: Rate Limiting Issues
- **Mitigation**:
