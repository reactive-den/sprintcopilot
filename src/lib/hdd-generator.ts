import { llm } from './llm';
import { retryWithBackoff } from './errors';
import type { RepoAnalysis } from '@/types';
import { formatRepoAnalysisForPrompt } from './repo-analyzer';
import type { BusinessDocument } from './business-document';
import type { HDDSectionConfig } from './hdd-config';

export type HDDSection = string; // Dynamic section ID

// Few-shot examples for different section types
const FEW_SHOT_EXAMPLES: Record<string, { input: string; output: string }[]> = {
  architecture: [
    {
      input: `Project: E-commerce Platform
Problem: Customers need to browse and purchase products online
System Design: Microservices architecture with separate services for catalog, cart, payment, and orders. Uses React frontend, Node.js backend, PostgreSQL database, Redis cache.

Generate architecture overview.`,
      output: `## System Architecture Overview

The e-commerce platform follows a **microservices architecture** with well-defined service boundaries:

### Architecture Diagram (Conceptual)
\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Catalog   │────▶│    Cart     │────▶│   Payment   │────▶│   Orders    │
│   Service   │     │   Service   │     │   Service   │     │   Service   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PostgreSQL │     │    Redis    │     │   Stripe    │     │  PostgreSQL │
│  Database   │     │    Cache    │     │    API      │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL 15
- **Caching**: Redis 7
- **Message Queue**: RabbitMQ

### Component Architecture

#### Catalog Service
- Product catalog management
- Category and inventory tracking
- Search functionality with Elasticsearch integration

#### Cart Service
- Shopping cart management
- Real-time price calculations
- Promo code support

#### Payment Service
- Payment processing via Stripe
- Refund management
- PCI compliance

#### Order Service
- Order lifecycle management
- Order history and tracking
- Notification service integration`,
    },
  ],
  deployment: [
    {
      input: `Project: E-commerce Platform
Deployment Strategy: Blue-green deployment with zero downtime. Uses AWS infrastructure with Kubernetes for orchestration.

Generate deployment guide.`,
      output: `## Deployment Architecture

### Infrastructure Overview
\`\`\`
                    ┌─────────────────┐
                    │   AWS Route 53  │
                    │   (DNS)         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  AWS ALB        │
                    │  (Load Balancer)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│  Blue Env     │   │  Green Env    │   │  DB Cluster   │
│  (Production) │   │  (Staging)    │   │  (RDS)        │
└───────────────┘   └───────────────┘   └───────────────┘
\`\`\`

### Environment Setup

#### Development
- Local Docker Compose setup
- Mock services for external dependencies

#### Staging
- AWS ECS Fargate
- Isolated VPC
- Full feature parity with production

#### Production
- EKS Kubernetes cluster
- Multi-AZ deployment
- Auto-scaling enabled

### CI/CD Pipeline

1. **Build Stage**
   - Unit tests
   - Integration tests
   - Security scanning

2. **Deploy Stage**
   - Build Docker images
   - Push to ECR
   - Deploy to Kubernetes`,
    },
  ],
  dataflow: [
    {
      input: `Project: E-commerce Platform
Data Flows:
- User places order → Cart validates → Payment processes → Order created → Inventory updated
- Payment fails → Cart notified → User prompted to retry

Generate data flow document.`,
      output: `## Data Flow Overview

### Order Placement Flow
\`\`\`
User → Frontend → API Gateway → Cart Service → Payment Service → Order Service → Inventory Service
                                     │              │               │
                                     ▼              ▼               ▼
                                  Cache         External        Database
                                                Payment API
\`\`\`

### Data Processing Pipeline

#### 1. Order Creation
1. User submits order via frontend
2. API Gateway validates JWT token
3. Cart service validates items and pricing
4. Payment service processes payment
5. Order service creates order record
6. Inventory service decrements stock

#### 2. Data Transformations
- Cart item totals calculated with taxes
- Payment amounts normalized to cents
- Order dates stored in UTC

### Data Sources
- User interactions (web/mobile)
- Payment gateway webhooks
- Inventory management system

### Data Storage
- Primary: PostgreSQL (transactional data)
- Cache: Redis (session, cart data)
- Search: Elasticsearch (product catalog)`,
    },
  ],
  users: [
    {
      input: `Project: E-commerce Platform
Stakeholders:
- Shoppers (browse and purchase products)
- Store managers (manage inventory and orders)
- Administrators (platform configuration)

Generate user documentation.`,
      output: `## User Personas

### 1. Shopper
**Goals:**
- Find products quickly
- Complete purchase easily
- Track order status

**Behaviors:**
- Uses mobile app primarily
- Searches by category or keywords
- Compares prices

### 2. Store Manager
**Goals:**
- Manage product inventory
- Process orders
- View sales analytics

**Behaviors:**
- Uses desktop dashboard
- Bulk product updates
- Generates reports

### 3. Administrator
**Goals:**
- Configure platform settings
- Manage user access
- Monitor system health

**Behaviors:**
- Access all system areas
- Configure integrations
- Review audit logs

## User Roles and Permissions

| Feature | Shopper | Store Manager | Admin |
|---------|---------|---------------|-------|
| Browse Products | ✅ | ✅ | ✅ |
| Place Orders | ✅ | ✅ | ✅ |
| Manage Inventory | ❌ | ✅ | ✅ |
| View Analytics | ❌ | ✅ | ✅ |
| System Config | ❌ | ❌ | ✅ |`,
    },
  ],
};

// Generate few-shot prompt based on section type and business document
function generateFewShotPrompt(
  sectionConfig: HDDSectionConfig,
  context: {
    idea: string;
    context: string | null;
    constraints: string | null;
    businessDocument?: BusinessDocument;
    repoAnalysis?: RepoAnalysis;
  }
): string {
  const examples = FEW_SHOT_EXAMPLES[sectionConfig.promptKey] || FEW_SHOT_EXAMPLES.architecture;
  const businessDoc = context.businessDocument;

  // Build context from business document
  const businessContext = buildBusinessContext(context);

  // Create section-specific prompt
  const promptTemplates: Record<string, string> = {
    architecture: `You are a senior software architect. Using the provided business context and following the format in the examples, generate a comprehensive architecture document.

${formatFewShotExamples(examples)}

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}
- Repo Analysis: {repoAnalysis}

Generate the architecture document following the example format, tailored to this specific project.`,

    deployment: `You are a DevOps engineer. Using the provided business context and following the format in the examples, generate a comprehensive deployment guide.

${formatFewShotExamples(examples)}

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}
- Repo Analysis: {repoAnalysis}

Generate the deployment guide following the example format, tailored to this specific project.`,

    dataflow: `You are a data architect. Using the provided business context and following the format in the examples, generate a comprehensive data flow document.

${formatFewShotExamples(examples)}

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}
- Repo Analysis: {repoAnalysis}

Generate the data flow document following the example format, tailored to this specific project.`,

    users: `You are a UX/product designer. Using the provided business context and following the format in the examples, generate comprehensive user documentation.

${formatFewShotExamples(examples)}

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}
- Repo Analysis: {repoAnalysis}

Generate the user documentation following the example format, tailored to this specific project.`,

    apiDesign: `You are a senior API architect. Using the provided business context, generate a comprehensive API design document.

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}
- Functional Requirements: {requirements}

Generate a detailed API design covering:
- API Endpoints with HTTP methods
- Request/Response schemas
- Authentication/Authorization
- Error handling
- Rate limiting

Use proper OpenAPI-style formatting.`,

    database: `You are a database architect. Using the provided business context, generate a comprehensive database design document.

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}

Generate a detailed database design covering:
- Entity-relationship diagrams (text-based)
- Table schemas with columns and types
- Indexes and optimization strategies
- Data relationships and foreign keys
- Migration strategies`,

    security: `You are a security architect. Using the provided business context, generate a comprehensive security architecture document.

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}

Generate a detailed security architecture covering:
- Authentication flows
- Authorization models
- Data encryption strategies
- Security compliance (GDPR, SOC2, etc.)
- Vulnerability mitigation strategies`,

    infrastructure: `You are a cloud infrastructure engineer. Using the provided business context, generate a comprehensive infrastructure document.

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}

Generate a detailed infrastructure document covering:
- Cloud provider configuration
- Network architecture
- Kubernetes/container setup
- Environment variables and secrets
- Monitoring and alerting setup`,

    testing: `You are a QA architect. Using the provided business context, generate a comprehensive testing strategy document.

## Business Context:
${businessContext}

## Additional Context:
- Project: {idea}
- Problem: {context}
- Constraints: {constraints}

Generate a detailed testing strategy covering:
- Unit testing approach
- Integration testing strategy
- E2E testing coverage
- Performance testing benchmarks
- CI/CD testing pipeline`,
  };

  const template = promptTemplates[sectionConfig.promptKey] || promptTemplates.architecture;

  return template
    .replace('{idea}', context.idea)
    .replace('{context}', context.context || 'Not specified')
    .replace('{constraints}', context.constraints || 'Not specified')
    .replace('{requirements}', businessDoc?.requirements.functional.join('\n- ') || 'Not specified')
    .replace('{repoAnalysis}', formatRepoAnalysisForPrompt(context.repoAnalysis));
}

function formatFewShotExamples(examples: { input: string; output: string }[]): string {
  return examples.map((ex, i) => `
--- Example ${i + 1 } ---
**Input:**
${ex.input}

**Output:**
${ex.output}
--- End Example ${i + 1} ---
`).join('\n');
}

function buildBusinessContext(context: {
  idea: string;
  context: string | null;
  constraints: string | null;
  businessDocument?: BusinessDocument;
}): string {
  const doc = context.businessDocument;
  if (!doc) return 'No business document available.';

  const parts: string[] = [];

  if (doc.productOverview) {
    parts.push(`**Product Overview:**\n${doc.productOverview}`);
  }

  if (doc.systemDesign) {
    parts.push(`**System Design:**\n${doc.systemDesign}`);
  }

  if (doc.stakeholders && doc.stakeholders.length > 0) {
    parts.push(`**Stakeholders:**\n${doc.stakeholders.join(', ')}`);
  }

  if (doc.dataFlows && doc.dataFlows.length > 0) {
    parts.push(`**Data Flows:**\n${doc.dataFlows.join('\n- ')}`);
  }

  if (doc.deployment) {
    parts.push(`**Deployment Strategy:**\n${doc.deployment}`);
  }

  if (doc.requirements.functional.length > 0) {
    parts.push(`**Functional Requirements:**\n${doc.requirements.functional.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
  }

  if (doc.requirements.nonFunctional.length > 0) {
    parts.push(`**Non-Functional Requirements:**\n${doc.requirements.nonFunctional.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
  }

  return parts.join('\n\n');
}

export async function generateHDDSection(
  sectionId: string,
  sectionConfig: HDDSectionConfig,
  context: {
    idea: string;
    context: string | null;
    constraints: string | null;
    businessDocument?: BusinessDocument;
    repoAnalysis?: RepoAnalysis;
  }
): Promise<string> {
  const prompt = generateFewShotPrompt(sectionConfig, context);

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return content.trim();
  } catch (error) {
    console.error(`❌ [HDD] Error generating ${sectionId}:`, error);
    return `# ${sectionConfig.label}\n\nError generating content. Please try again.`;
  }
}

// Legacy support - convert old-style section names
export function getSectionConfig(section: string): HDDSectionConfig {
  const configMap: Record<string, HDDSectionConfig> = {
    architecture: {
      id: 'architecture',
      label: 'Architecture Overview',
      icon: '🏗️',
      type: 'hld',
      description: 'High-level system architecture and component design',
      promptKey: 'architecture',
    },
    deployment: {
      id: 'deployment',
      label: 'Deployment Guide',
      icon: '🚀',
      type: 'guide',
      description: 'Deployment steps and infrastructure',
      promptKey: 'deployment',
    },
    dataflow: {
      id: 'dataflow',
      label: 'Data Flow',
      icon: '🔄',
      type: 'hld',
      description: 'Data flow diagrams and processing pipeline',
      promptKey: 'dataflow',
    },
    users: {
      id: 'users',
      label: 'User Documentation',
      icon: '👥',
      type: 'guide',
      description: 'User personas, roles, and journey maps',
      promptKey: 'users',
    },
  };

  return configMap[section] || {
    id: section,
    label: section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' '),
    icon: '📄',
    type: 'guide',
    description: `${section} documentation`,
    promptKey: section,
  };
}
