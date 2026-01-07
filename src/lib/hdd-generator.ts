import { llm } from './llm';
import { retryWithBackoff } from './errors';
import type { RepoAnalysis } from '@/types';
import { formatRepoAnalysisForPrompt } from './repo-analyzer';

export type HDDSection = 'architecture' | 'deployment' | 'dataflow' | 'users';

const HDD_PROMPTS: Record<HDDSection, string> = {
  architecture: `You are a senior software architect. Generate a comprehensive, in-depth architecture document in Markdown format.

Based on the following information:
Project Title: {idea}
Problem Statement: {context}
Constraints: {constraints}
System Design: {systemDesign}
Repo Analysis: {repoAnalysis}

Generate a detailed architecture document covering:
- System Architecture Overview
- Technology Stack
- Component Architecture
- Database Design
- API Design
- Security Architecture
- Scalability Considerations
- Integration Points
- Error Handling
- Monitoring and Logging

Use proper Markdown formatting with headers, lists, code blocks where appropriate.
Be specific, technical, and comprehensive.`,

  deployment: `You are a DevOps engineer. Generate a comprehensive, in-depth deployment guide in Markdown format.

Based on the following information:
Project Title: {idea}
Problem Statement: {context}
Constraints: {constraints}
Deployment Strategy: {deployment}
Repo Analysis: {repoAnalysis}

Generate a detailed deployment document covering:
- Deployment Architecture
- Environment Setup (Dev, Staging, Production)
- Infrastructure Requirements
- CI/CD Pipeline
- Deployment Steps (step-by-step)
- Rollback Procedures
- Health Checks
- Monitoring Setup
- Backup and Recovery
- Security Considerations

Use proper Markdown formatting with headers, lists, code blocks where appropriate.
Be specific, technical, and comprehensive.`,

  dataflow: `You are a data architect. Generate a comprehensive, in-depth data flow document in Markdown format.

Based on the following information:
Project Title: {idea}
Problem Statement: {context}
Constraints: {constraints}
Data Flows: {dataFlows}
Repo Analysis: {repoAnalysis}

Generate a detailed data flow document covering:
- Data Flow Overview
- Data Sources
- Data Processing Pipeline
- Data Storage
- Data Transformations
- Data Validation
- Data Security
- Data Retention Policies
- Error Handling
- Data Flow Diagrams (describe in text)

Use proper Markdown formatting with headers, lists, code blocks where appropriate.
Be specific, technical, and comprehensive.`,

  users: `You are a UX/product designer. Generate a comprehensive, in-depth user documentation in Markdown format.

Based on the following information:
Project Title: {idea}
Problem Statement: {context}
Constraints: {constraints}
Stakeholders: {stakeholders}
Product Overview: {productOverview}
Repo Analysis: {repoAnalysis}

Generate a detailed user documentation covering:
- User Personas
- User Roles and Permissions
- User Journey Maps
- User Stories
- User Interface Overview
- Key Features for Users
- User Onboarding
- User Support and Help
- Accessibility Considerations
- User Feedback Mechanisms

Use proper Markdown formatting with headers, lists, code blocks where appropriate.
Be specific, user-focused, and comprehensive.`,
};

export async function generateHDDSection(
  section: HDDSection,
  context: {
    idea: string;
    context: string | null;
    constraints: string | null;
    systemDesign?: string;
    deployment?: string;
    dataFlows?: string[];
    stakeholders?: string[];
    productOverview?: string;
    repoAnalysis?: RepoAnalysis;
  }
): Promise<string> {
  const prompt = HDD_PROMPTS[section]
    .replace('{idea}', context.idea)
    .replace('{context}', context.context || 'Not specified')
    .replace('{constraints}', context.constraints || 'None')
    .replace('{systemDesign}', context.systemDesign || 'Not specified')
    .replace('{deployment}', context.deployment || 'Not specified')
    .replace(
      '{dataFlows}',
      context.dataFlows && context.dataFlows.length > 0
        ? context.dataFlows.join('\n- ')
        : 'Not specified'
    )
    .replace(
      '{stakeholders}',
      context.stakeholders && context.stakeholders.length > 0
        ? context.stakeholders.join(', ')
        : 'Not specified'
    )
    .replace('{productOverview}', context.productOverview || 'Not specified')
    .replace('{repoAnalysis}', formatRepoAnalysisForPrompt(context.repoAnalysis));

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return content.trim();
  } catch (error) {
    console.error(`❌ [HDD] Error generating ${section}:`, error);
    return `# ${section.charAt(0).toUpperCase() + section.slice(1)} Document\n\nError generating content. Please try again.`;
  }
}
