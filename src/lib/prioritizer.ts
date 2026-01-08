import { llm } from './llm';
import { PRIORITIZER_PROMPT } from './langgraph/prompts';
import { retryWithBackoff } from './errors';
import type { FinalTicket } from '@/types';

interface TicketForPrioritization {
  title: string;
  description: string;
  acceptanceCriteria: string | string[];
  estimateHours: number;
  tshirtSize: string;
  priority?: number;
  sprint?: number;
  dependencies?: string[];
  tags?: string[];
}

/**
 * Assigns priority (and related sprint metadata) using AI.
 */
export async function prioritizeTickets(
  tickets: TicketForPrioritization[]
): Promise<FinalTicket[]> {
  if (!tickets || tickets.length === 0) {
    throw new Error('No tickets provided for prioritization');
  }

  const sprintCapacity = parseInt(process.env.DEFAULT_SPRINT_CAPACITY || '40', 10);

  const ticketsForPrompt = tickets.map((ticket) => ({
    title: ticket.title,
    description: ticket.description,
    acceptanceCriteria: Array.isArray(ticket.acceptanceCriteria)
      ? ticket.acceptanceCriteria.join('\n')
      : ticket.acceptanceCriteria,
    estimateHours: ticket.estimateHours,
    tshirtSize: ticket.tshirtSize,
  }));

  const prompt = PRIORITIZER_PROMPT.replace(
    '{tickets}',
    JSON.stringify(ticketsForPrompt, null, 2)
  ).replace('{sprintCapacity}', sprintCapacity.toString());

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    const prioritizedTickets = JSON.parse(jsonStr) as FinalTicket[];

    return prioritizedTickets.map((ticket) => {
      const originalTicket = tickets.find((t) => t.title === ticket.title) || tickets[0];

      return {
        ...originalTicket,
        priority: ticket.priority ?? originalTicket.priority ?? 5,
        sprint: ticket.sprint ?? originalTicket.sprint ?? 1,
        dependencies: Array.isArray(ticket.dependencies) ? ticket.dependencies : [],
        tags: Array.isArray(ticket.tags) ? ticket.tags : [],
      };
    });
  } catch (error) {
    console.error('❌ [PRIORITIZER] Error prioritizing tickets:', error);
    throw new Error(
      `Failed to prioritize tickets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
