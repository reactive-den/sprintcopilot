import { llm } from './llm';
import { retryWithBackoff } from './errors';
import type { PipelineTicket } from '@/types';

interface GenerateTicketsInput {
  projectId: string;
  projectTitle: string;
  problemStatement: string;
  businessDocument: {
    title?: string;
    problemStatement?: string;
    productOverview?: string;
    scope?: string;
    requirements?: {
      functional?: string[];
      nonFunctional?: string[];
    };
  };
  hddSections: {
    architecture: string;
    deployment: string;
    dataflow: string;
    users: string;
  };
}

const TICKET_GENERATION_PROMPT = `You are a senior product manager and technical lead. Generate comprehensive, actionable tickets based on the provided business document, problem statement, and HDD (High-Level Design Document).

Project Title: {projectTitle}
Problem Statement: {problemStatement}

Business Document:
Title: {bdTitle}
Product Overview: {productOverview}
Scope: {scope}
Functional Requirements: {functionalRequirements}
Non-Functional Requirements: {nonFunctionalRequirements}

HDD Sections:
Architecture: {architecture}
Deployment: {deployment}
Data Flow: {dataflow}
Users: {users}

Based on all this information, generate a comprehensive list of tickets that break down the work needed to implement this feature. Each ticket should be:
- Specific and actionable
- Include clear acceptance criteria
- Have appropriate estimates
- Be properly prioritized
- Include dependencies if needed

Return a JSON array of tickets in this exact format:
[
  {
    "title": "Ticket title",
    "description": "Detailed description of what needs to be done",
    "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"],
    "estimateHours": 8,
    "tshirtSize": "M",
    "priority": 1,
    "sprint": 1,
    "dependencies": [],
    "tags": ["tag1", "tag2"]
  }
]

Guidelines:
- Generate 10-20 tickets covering all aspects (frontend, backend, database, deployment, testing, etc.)
- Break down work into manageable chunks (typically 4-16 hours each)
- Use T-shirt sizes: XS (1-2h), S (3-4h), M (5-8h), L (9-16h), XL (17-32h)
- Priority: 1 = highest, 5 = lowest
- **CRITICAL: All tickets must be assigned to Sprint 1 (sprint: 1). Do NOT create multiple sprints.**
- Include dependencies as array of ticket indices if tickets depend on others
- Tags should be relevant (e.g., "frontend", "backend", "database", "api", "ui", "testing")

Return ONLY valid JSON array, no markdown formatting.`;

export async function generateTicketsFromHDD(input: GenerateTicketsInput): Promise<PipelineTicket[]> {
  const prompt = TICKET_GENERATION_PROMPT.replace('{projectTitle}', input.projectTitle)
    .replace('{problemStatement}', input.problemStatement)
    .replace('{bdTitle}', input.businessDocument.title || input.projectTitle)
    .replace('{productOverview}', input.businessDocument.productOverview || 'Not specified')
    .replace('{scope}', input.businessDocument.scope || 'Not specified')
    .replace(
      '{functionalRequirements}',
      input.businessDocument.requirements?.functional?.join('\n- ') || 'Not specified'
    )
    .replace(
      '{nonFunctionalRequirements}',
      input.businessDocument.requirements?.nonFunctional?.join('\n- ') || 'Not specified'
    )
    .replace('{architecture}', input.hddSections.architecture || 'Not specified')
    .replace('{deployment}', input.hddSections.deployment || 'Not specified')
    .replace('{dataflow}', input.hddSections.dataflow || 'Not specified')
    .replace('{users}', input.hddSections.users || 'Not specified');

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    const tickets = JSON.parse(jsonStr) as PipelineTicket[];

    // Validate and ensure all required fields
    // Force all tickets to Sprint 1
    return tickets.map((ticket, index) => ({
      title: ticket.title || `Ticket ${index + 1}`,
      description: ticket.description || '',
      acceptanceCriteria: Array.isArray(ticket.acceptanceCriteria)
        ? ticket.acceptanceCriteria
        : ticket.acceptanceCriteria
          ? [ticket.acceptanceCriteria]
          : [],
      estimateHours: ticket.estimateHours || 8,
      tshirtSize: ticket.tshirtSize || 'M',
      priority: ticket.priority || 3,
      sprint: 1, // Force all tickets to Sprint 1
      // Convert dependencies to strings if they are integers (ticket indices)
      dependencies: (ticket.dependencies || []).map((dep) =>
        typeof dep === 'number' ? String(dep) : dep
      ),
      tags: ticket.tags || [],
    }));
  } catch (error) {
    console.error('❌ [TICKET-GENERATOR] Error generating tickets:', error);
    throw new Error('Failed to generate tickets. Please try again.');
  }
}
