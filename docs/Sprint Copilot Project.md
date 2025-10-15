
# SprintCopilot — “Plain-English Feature → Tickets in 60s”

## One-liner (what you’ll tell the client)
Give me a feature idea in plain English, and I’ll turn it into: clarified scope, acceptance criteria, a mini-HLD, and a prioritized ticket list ready to import into Jira/ClickUp — all in under a minute.

---

## Why this works for a client demo
- **Immediate value**: every team needs faster grooming.
- **Visually satisfying**: form in → multi-step progress → clean roadmap/tickets table, with export.
- **Small build surface**: 3–4 screens, a handful of endpoints, simple DB.
- **Real “agentic” feel**: a tiny graph of nodes (clarify → HLD → slice → estimate → prioritize).

---

## MVP Scope (tight & shippable)
1. **Input**: Feature title + problem statement + optional constraints.
2. **Agent chain (LangGraph)**:
   - `Clarifier`: rewrites/asks 3–5 clarifying Qs & assumptions.
   - `HLD Draft`: modules, data flows, risks, NFRs.
   - `Ticket Slicer`: user stories + acceptance criteria.
   - `Estimator`: T-shirt size (S/M/L) and rough hours.
   - `Prioritizer`: orders tickets by dependency/ROI; proposes 1–2 sprints.
3. **Output UI**:
   - Readable **Brief** (title, context, assumptions).
   - **Mini-HLD** section.
   - **Ticket plan** (status, owner placeholder, estimate, priority).
   - **Exports**: CSV + JSON (Jira-shaped).
4. **Storage**: Save projects, runs, and tickets.

---

## Tech Stack (aligned with your preferences)
- **FE**: Next.js (TypeScript), TailwindCSS + shadcn/ui, React Hook Form, React Query.
- **BE**: Next.js API routes (or NestJS), LangGraph/LangChain, zod, OpenAI.
- **DB**: Postgres + Prisma (or Supabase).
- **Optional**: Auth via NextAuth, rate limit via upstash/redis.

---

## Data Model (Prisma)
```prisma
model Project {
  id           String   @id @default(cuid())
  title        String
  problem      String
  constraints  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  runs         Run[]
}

model Run {
  id          String   @id @default(cuid())
  projectId   String
  createdAt   DateTime @default(now())
  status      String
  clarifications Json?
  hld          Json?
  summary       String?
  tickets       Ticket[]
  project     Project  @relation(fields: [projectId], references: [id])
}

model Ticket {
  id         String   @id @default(cuid())
  runId      String
  title      String
  description String
  acceptanceCriteria String
  estimateHours Int?
  tshirtSize  String?
  priority    Int
  sprint      Int?
  status      String
  run        Run     @relation(fields: [runId], references: [id])
}
```

---

## API Surface (Next.js /api)
- `POST /api/projects` → create project.
- `GET /api/projects/:id` → get project + last run summary.
- `POST /api/runs` → `{ projectId }` → kicks off LangGraph pipeline.
- `GET /api/runs/:id` → polling endpoint for run status + artifacts.
- `GET /api/runs/:id/export.csv` + `/export.jira.json`

---

## The Agent Graph (LangGraph)
### Nodes
1. `clarifier`: clarifies feature
2. `hld_drafter`: drafts HLD
3. `ticket_slicer`: breaks into tickets
4. `estimator`: estimates hours and size
5. `prioritizer`: assigns priority and sprint

**Edges**
`start → clarifier → hld_drafter → ticket_slicer → estimator → prioritizer → end`

---

## Frontend UX (shadcn + Tailwind)
1. **Create Brief** (page: `/`)
2. **Results** (page: `/projects/:id`)
3. **History** (page: `/projects`)
4. **Nice touches**: skeleton loaders, diff viewer.

---

## Example Jira JSON export
```json
[
  {
    "summary": "Auth: Email OTP login",
    "description": "As a user, I can login via email OTP...",
    "issuetype": { "name": "Story" },
    "priority": { "name": "High" },
    "customfield_tshirt": "M",
    "timeoriginalestimate": 14400
  }
]
```

---

## Repo Structure
```
sprintcopilot/
├─ app/
│  ├─ page.tsx
│  ├─ projects/[id]/page.tsx
│  ├─ projects/page.tsx
│  └─ api/
│     ├─ projects/route.ts
│     ├─ runs/route.ts
│     └─ runs/[id]/route.ts
├─ lib/
│  ├─ langgraph/pipeline.ts
│  ├─ llm.ts
│  └─ parse.ts
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ components/
│  ├─ Steps.tsx
│  ├─ TicketsTable.tsx
│  └─ HLDCard.tsx
├─ hooks/
│  ├─ useRun.ts
│  └─ useProject.ts
└─ README.md
```

---

## Demo Script (5 minutes)
1. Type a feature.
2. Click **Generate** → see steps.
3. Show clarifications, HLD, tickets.
4. Export to Jira JSON.

---

## Build Plan (1–2 days)
**Day 1**: Scaffold, DB, Clarifier + HLD nodes.  
**Day 2**: Tickets, Estimation, Prioritization, UI polish.

---

## Stretch Goals
- Dependency graph visualization.
- Quality gates.
- Persona presets (Startup vs Enterprise).

---

## Why LangGraph
- Deterministic flow.
- Partial retries.
- Auditability.

---

## Quick Start Commands
```bash
pnpm dlx create-next-app@latest sprintcopilot --ts --tailwind
cd sprintcopilot
pnpm add @prisma/client prisma zod @langchain/langgraph langchain openai
pnpm add @tanstack/react-query @hookform/resolvers react-hook-form
pnpm add lucide-react class-variance-authority tailwind-merge
pnpm add -D prisma-client-js @types/node
npx prisma init
npx prisma migrate dev
npx prisma db seed
pnpm dev
```

---

## Additional Documentation

For detailed implementation guidance, refer to:

- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Comprehensive step-by-step build plan with 6 phases
- **[TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md)** - Complete technical specifications including:
  - Enhanced Prisma schema with all models and enums
  - Zod validation schemas
  - LangGraph state definitions and prompt templates
  - Error handling utilities
  - Rate limiting configuration
  - Testing setup
  - Deployment checklist

These documents address all missing pieces identified during planning:
1. ✅ Environment configuration with all required variables
2. ✅ Complete Prisma schema with User, ApiUsage models
3. ✅ Detailed LangGraph implementation with state and prompts
4. ✅ Zod validation schemas for all API endpoints
5. ✅ Error handling strategy with custom error classes
6. ✅ Rate limiting with Upstash Redis
7. ✅ Testing configuration (Jest + React Testing Library)
8. ✅ Deployment guide for Vercel
9. ✅ shadcn/ui component list
10. ✅ Retry logic and LLM error handling
