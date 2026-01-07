import { llm } from './llm';
import { retryWithBackoff } from './errors';

export interface BusinessDocument {
  title: string;
  executiveSummary: string;
  problemStatement: string;
  productOverview: string;
  systemDesign: string;
  objectives: string[];
  scope: string;
  stakeholders: string[];
  requirements: {
    functional: string[];
    nonFunctional: string[];
  };
  dataFlows: string[];
  costCuttingConcerns: string[];
  deployment: string;
  backlog: string[];
  questions: string[];
  assumptions: string[];
  constraints: string[];
  successCriteria: string[];
  risks: string[];
  timeline?: string;
  dependencies?: string[];
}

const BUSINESS_DOCUMENT_PROMPT = `You are a business analyst creating a comprehensive business requirements document. Based on the following information, generate a structured business document.

Project Title: {idea}
Problem Statement: {context}
Constraints: {constraints}

Full Conversation History:
{conversation}

Generate a comprehensive business requirements document in the following JSON format:
{
  "title": "Business Requirements Document: [Feature Title]",
  "executiveSummary": "2-3 sentence summary of the feature and its business value",
  "problemStatement": "Clear description of the problem being solved",
  "productOverview": "Comprehensive overview of the product/feature including its purpose, key features, and value proposition (3-5 sentences)",
  "systemDesign": "High-level system design description including architecture, components, and technical approach (4-6 sentences)",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "scope": "Detailed scope statement including what's in and out of scope",
  "stakeholders": ["Stakeholder 1", "Stakeholder 2"],
  "requirements": {
    "functional": ["Requirement 1", "Requirement 2", "Requirement 3"],
    "nonFunctional": ["Requirement 1", "Requirement 2"]
  },
  "dataFlows": ["Data flow description 1", "Data flow description 2", "Data flow description 3"],
  "costCuttingConcerns": ["Cost concern 1", "Cost concern 2", "Cost concern 3"],
  "deployment": "Deployment strategy and approach including environment, infrastructure, and rollout plan (3-5 sentences)",
  "backlog": ["Backlog item 1", "Backlog item 2", "Backlog item 3"],
  "questions": ["Question 1 that was asked", "Question 2 that was asked", "Question 3 that was asked"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "constraints": ["Constraint 1", "Constraint 2"],
  "successCriteria": ["Criterion 1", "Criterion 2"],
  "risks": ["Risk 1", "Risk 2"],
  "timeline": "High-level timeline if mentioned",
  "dependencies": ["Dependency 1", "Dependency 2"]
}

Make sure to:
- Extract all relevant information from the conversation
- Be specific and actionable
- Include at least 3-5 items in each array
- Use clear, business-friendly language
- Base everything on the actual conversation content
- For dataFlows: describe how data moves through the system
- For costCuttingConcerns: identify areas where costs can be optimized
- For deployment: describe how the system will be deployed and maintained
- For backlog: list items that are out of scope but may be considered later
- For questions: extract the key questions that were asked during the clarification session

Return ONLY valid JSON, no markdown formatting.`;

export async function generateBusinessDocument(session: {
  idea: string;
  context: string | null;
  constraints: string | null;
  messages: Array<{ role: string; content: string }>;
}): Promise<BusinessDocument> {
  // Build full conversation
  const conversation = session.messages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  const prompt = BUSINESS_DOCUMENT_PROMPT.replace('{idea}', session.idea)
    .replace('{context}', session.context || 'Not specified')
    .replace('{constraints}', session.constraints || 'None')
    .replace('{conversation}', conversation);

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    const document = JSON.parse(jsonStr) as BusinessDocument;

    // Validate and provide defaults
    return {
      title: document.title || `Business Requirements Document: ${session.idea}`,
      executiveSummary: document.executiveSummary || 'Business requirements document for the feature.',
      problemStatement: document.problemStatement || session.context || 'Problem statement to be defined.',
      productOverview: document.productOverview || 'Product overview to be defined.',
      systemDesign: document.systemDesign || 'System design to be defined.',
      objectives: document.objectives || [],
      scope: document.scope || 'Scope to be determined.',
      stakeholders: document.stakeholders || [],
      requirements: {
        functional: document.requirements?.functional || [],
        nonFunctional: document.requirements?.nonFunctional || [],
      },
      dataFlows: document.dataFlows || [],
      costCuttingConcerns: document.costCuttingConcerns || [],
      deployment: document.deployment || 'Deployment strategy to be defined.',
      backlog: document.backlog || [],
      questions: document.questions || [],
      assumptions: document.assumptions || [],
      constraints: document.constraints || [],
      successCriteria: document.successCriteria || [],
      risks: document.risks || [],
      timeline: document.timeline,
      dependencies: document.dependencies,
    };
  } catch (error) {
    console.error('❌ [BUSINESS-DOCUMENT] Error generating document:', error);
    // Fallback document
    return {
      title: `Business Requirements Document: ${session.idea}`,
      executiveSummary: 'Business requirements document generated from clarification session.',
      problemStatement: session.context || 'Problem statement to be defined.',
      productOverview: 'Product overview to be defined.',
      systemDesign: 'System design to be defined.',
      objectives: [],
      scope: 'Scope to be determined.',
      stakeholders: [],
      requirements: {
        functional: [],
        nonFunctional: [],
      },
      dataFlows: [],
      costCuttingConcerns: [],
      deployment: 'Deployment strategy to be defined.',
      backlog: [],
      questions: [],
      assumptions: [],
      constraints: session.constraints ? [session.constraints] : [],
      successCriteria: [],
      risks: [],
    };
  }
}
