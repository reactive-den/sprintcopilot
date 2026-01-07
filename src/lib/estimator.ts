import { llm } from './llm';
import { ESTIMATOR_PROMPT } from './langgraph/prompts';
import { retryWithBackoff } from './errors';
import type { PipelineTicket } from '@/types';

interface TicketForEstimation {
  title: string;
  description: string;
  acceptanceCriteria: string | string[];
  estimateHours?: number;
  tshirtSize?: string;
}

/**
 * Estimates tickets using AI
 * Takes tickets without estimates and returns tickets with estimateHours and tshirtSize
 */
export async function estimateTickets(
  tickets: TicketForEstimation[]
): Promise<Array<TicketForEstimation & { estimateHours: number; tshirtSize: string }>> {
  if (!tickets || tickets.length === 0) {
    throw new Error('No tickets provided for estimation');
  }

  // Format tickets for the prompt
  const ticketsForPrompt = tickets.map((ticket) => ({
    title: ticket.title,
    description: ticket.description,
    acceptanceCriteria: Array.isArray(ticket.acceptanceCriteria)
      ? ticket.acceptanceCriteria.join('\n')
      : ticket.acceptanceCriteria,
  }));

  const prompt = ESTIMATOR_PROMPT.replace('{tickets}', JSON.stringify(ticketsForPrompt, null, 2));

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    const estimatedTickets = JSON.parse(jsonStr) as Array<{
      title: string;
      description: string;
      acceptanceCriteria: string;
      estimateHours: number;
      tshirtSize: string;
    }>;

    // Validate and ensure all tickets have estimates
    return estimatedTickets.map((ticket) => {
      // Find the original ticket to preserve other fields
      const originalTicket = tickets.find((t) => t.title === ticket.title) || tickets[0];

      return {
        ...originalTicket,
        estimateHours: ticket.estimateHours || originalTicket.estimateHours || 8,
        tshirtSize: ticket.tshirtSize || originalTicket.tshirtSize || 'M',
      };
    });
  } catch (error) {
    console.error('❌ [ESTIMATOR] Error estimating tickets:', error);
    throw new Error(
      `Failed to estimate tickets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
