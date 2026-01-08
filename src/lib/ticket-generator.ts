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

Based on all this information, generate a comprehensive list of tickets that break down the work needed to implement this feature.

**CRITICAL REQUIREMENTS FOR EACH TICKET:**

1. **Objective (Up to 10 lines):**
   - The objective must be a detailed, comprehensive description of what needs to be accomplished
   - It should be up to 10 lines long, explaining the purpose, context, and goals of the ticket
   - Write it as a multi-line paragraph, not bullet points
   - Include why this work is needed and what problem it solves
   - Keep it concise but comprehensive (maximum 10 lines)

2. **Acceptance Criteria (Up to 10 bullet points):**
   - Provide up to 10 clear, testable acceptance criteria
   - Each criterion should be specific and measurable
   - Use bullet point format
   - Aim for 8-10 criteria to ensure comprehensive coverage

3. **Ticket Description Structure:**
   - The description field should contain ONLY the Objective followed by the Acceptance Criteria
   - Format: First write the Objective (8+ lines), then add "Acceptance Criteria:" followed by the bullet points
   - **DO NOT include tags, dependencies, or any other metadata in the description field**
   - Tags will be stored separately and displayed in the table, not in the description

Return a JSON array of tickets in this exact format:
[
  {
    "title": "Ticket title",
    "description": "Objective paragraph (up to 10 lines explaining what needs to be done, why it's needed, and the context)...\n\nAcceptance Criteria:\n- Criterion 1\n- Criterion 2\n- Criterion 3\n- Criterion 4\n- Criterion 5\n- Criterion 6\n- Criterion 7\n- Criterion 8\n- Criterion 9\n- Criterion 10",
    "tags": ["frontend", "api"],
    "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3", "Criterion 4", "Criterion 5", "Criterion 6", "Criterion 7", "Criterion 8", "Criterion 9", "Criterion 10"],
    "estimateHours": 8,
    "tshirtSize": "M",
    "priority": 1,
    "sprint": 1,
    "dependencies": []
  }
]

Guidelines:
- Generate 10-20 tickets covering all aspects (frontend, backend, database, deployment, testing, etc.)
- Break down work into manageable chunks (typically 4-16 hours each)
- Use T-shirt sizes: XS (1-2h), S (3-4h), M (5-8h), L (9-16h), XL (17-32h)
- Priority: 1 = highest, 5 = lowest
- **CRITICAL: All tickets must be assigned to Sprint 1 (sprint: 1). Do NOT create multiple sprints.**
- **CRITICAL: Objective must be up to 10 lines. Keep it comprehensive but concise.**
- **CRITICAL: Acceptance criteria must be up to 10 bullet points. Aim for 8-10 criteria.**
- **CRITICAL: Description field should ONLY contain Objective + Acceptance Criteria, nothing else. Do NOT include tags, dependencies, or metadata in description.**
- Include dependencies as array of ticket indices if tickets depend on others
- Tags should be provided separately in the tags array (e.g., ["frontend", "backend", "api", "database", "ui", "testing"])

Return ONLY valid JSON array, no markdown formatting.

**CRITICAL JSON FORMATTING RULES:**
- All strings must be properly escaped (use \\n for newlines, \\" for quotes)
- No trailing commas in objects or arrays
- All property names must be in double quotes
- No comments or extra text outside the JSON array
- Ensure all special characters in strings are properly escaped
- Description field may contain newlines - they must be escaped as \\n in JSON`;

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

    console.log(`📝 [TICKET-GENERATOR] LLM response length: ${content.length} chars`);
    console.log(`📝 [TICKET-GENERATOR] LLM response preview: ${content.substring(0, 200)}...`);

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const markdownMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (markdownMatch) {
      jsonStr = markdownMatch[1];
    } else {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }

    if (!jsonStr || jsonStr.trim().length === 0) {
      throw new Error('LLM returned empty response. Please try again.');
    }

    // Clean up common JSON issues
    jsonStr = jsonStr.trim();
    
    // Remove any leading/trailing markdown or text
    jsonStr = jsonStr.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');

    let tickets: PipelineTicket[];
    try {
      tickets = JSON.parse(jsonStr) as PipelineTicket[];
    } catch (parseError) {
      console.error('❌ [TICKET-GENERATOR] JSON parse error:', parseError);
      
      // If it's a SyntaxError, try to find and log the problematic area
      if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
        const positionMatch = parseError.message.match(/position (\d+)/);
        if (positionMatch) {
          const position = parseInt(positionMatch[1], 10);
          const start = Math.max(0, position - 500);
          const end = Math.min(jsonStr.length, position + 500);
          const lineNumber = jsonStr.substring(0, position).split('\n').length;
          console.error(`❌ [TICKET-GENERATOR] Error at position ${position} (line ${lineNumber}):`);
          console.error(`❌ [TICKET-GENERATOR] Context around error:`);
          console.error(jsonStr.substring(start, end));
          console.error(`❌ [TICKET-GENERATOR] Character at error position: "${jsonStr[position]}" (char code: ${jsonStr.charCodeAt(position)})`);
        }
      }
      
      // Try to repair common JSON issues
      try {
        console.log('🔄 [TICKET-GENERATOR] Attempting to repair JSON...');
        
        let repaired = jsonStr;
        
        // Step 1: Remove trailing commas before } or ]
        repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
        
        // Step 2: Fix unescaped newlines, tabs, and carriage returns in string values
        // We'll use a state machine to track when we're inside a string
        let inString = false;
        let escapeNext = false;
        let result = '';
        
        for (let i = 0; i < repaired.length; i++) {
          const char = repaired[i];
          const prevChar = i > 0 ? repaired[i - 1] : '';
          
          // Handle escape sequences
          if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            result += char;
            escapeNext = true;
            continue;
          }
          
          // Toggle string state on unescaped quotes
          if (char === '"' && (i === 0 || repaired[i - 1] !== '\\' || (i > 1 && repaired[i - 2] === '\\'))) {
            // Check if previous backslash was itself escaped
            let backslashCount = 0;
            for (let j = i - 1; j >= 0 && repaired[j] === '\\'; j--) {
              backslashCount++;
            }
            if (backslashCount % 2 === 0) {
              inString = !inString;
            }
            result += char;
            continue;
          }
          
          // Inside a string - escape special characters
          if (inString) {
            if (char === '\n') {
              result += '\\n';
            } else if (char === '\r') {
              result += '\\r';
            } else if (char === '\t') {
              result += '\\t';
            } else {
              result += char;
            }
          } else {
            // Outside string - keep as is
            result += char;
          }
        }
        
        repaired = result;
        
        // Step 3: Try parsing the repaired version
        tickets = JSON.parse(repaired) as PipelineTicket[];
        console.log('✅ [TICKET-GENERATOR] Successfully repaired and parsed JSON');
      } catch (repairError) {
        // If repair fails, log the full JSON for debugging
        console.error('❌ [TICKET-GENERATOR] JSON repair failed');
        console.error('❌ [TICKET-GENERATOR] Full JSON (first 2000 chars):', jsonStr.substring(0, 2000));
        console.error('❌ [TICKET-GENERATOR] Full JSON (last 2000 chars):', jsonStr.substring(Math.max(0, jsonStr.length - 2000)));
        
        throw new Error(
          `Failed to parse tickets JSON: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}. ` +
          `The LLM may have generated invalid JSON. Please try again with a more detailed feature description.`
        );
      }
    }

    if (!Array.isArray(tickets)) {
      throw new Error('LLM did not return an array of tickets. Please try again.');
    }

    // Validate and ensure all required fields
    // Force all tickets to Sprint 1
    return tickets.map((ticket, index) => {
      // Ensure acceptance criteria is an array with max 10 items
      let acceptanceCriteria = Array.isArray(ticket.acceptanceCriteria)
        ? ticket.acceptanceCriteria
        : ticket.acceptanceCriteria
          ? [ticket.acceptanceCriteria]
          : [];
      
      // Limit to 10 acceptance criteria
      if (acceptanceCriteria.length > 10) {
        acceptanceCriteria = acceptanceCriteria.slice(0, 10);
      }

      // Ensure description contains objective and acceptance criteria
      let description = ticket.description || '';
      
      // Remove any tags, dependencies, or metadata that might have been included in description
      // Clean up common patterns that shouldn't be in description
      description = description
        .replace(/Tags?:?\s*\[.*?\]/gi, '')
        .replace(/Tags?:?\s*[^\n]*/gi, '')
        .replace(/Dependencies?:?\s*\[.*?\]/gi, '')
        .replace(/Dependencies?:?\s*[^\n]*/gi, '')
        .replace(/Sprint:?\s*\d+/gi, '')
        .replace(/Priority:?\s*\d+/gi, '')
        .replace(/Estimate:?\s*[^\n]*/gi, '')
        .trim();
      
      // If description doesn't have acceptance criteria section, add it
      if (description && !description.includes('Acceptance Criteria:')) {
        const criteriaText = acceptanceCriteria.length > 0
          ? '\n\nAcceptance Criteria:\n' + acceptanceCriteria.map(c => `- ${c}`).join('\n')
          : '';
        description = description + criteriaText;
      }

      return {
        title: ticket.title || `Ticket ${index + 1}`,
        description: description,
        acceptanceCriteria: acceptanceCriteria,
        estimateHours: ticket.estimateHours || 8,
        tshirtSize: ticket.tshirtSize || 'M',
        priority: ticket.priority || 3,
        sprint: 1, // Force all tickets to Sprint 1
        // Convert dependencies to strings if they are integers (ticket indices)
        dependencies: (ticket.dependencies || []).map((dep) =>
          typeof dep === 'number' ? String(dep) : dep
        ),
        tags: ticket.tags || [], // Keep tags for backward compatibility but not required in prompt
      };
    });
  } catch (error) {
    console.error('❌ [TICKET-GENERATOR] Error generating tickets:', error);
    throw new Error('Failed to generate tickets. Please try again.');
  }
}
