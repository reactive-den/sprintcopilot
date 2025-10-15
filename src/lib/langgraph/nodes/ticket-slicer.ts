import { llm } from '@/lib/llm';
import { TICKET_SLICER_PROMPT } from '../prompts';
import type { GraphStateType } from '../state';
import { retryWithBackoff } from '@/lib/errors';

export async function ticketSlicerNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  if (!state.clarifications || !state.hld) {
    return {
      currentStep: 'FAILED',
      errors: [...state.errors, 'Ticket Slicer: Missing clarifications or HLD'],
    };
  }

  const prompt = TICKET_SLICER_PROMPT
    .replace('{title}', state.title)
    .replace('{scope}', state.clarifications.scope)
    .replace('{modules}', state.hld.modules.join(', '))
    .replace('{problem}', state.problem);
  
  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });
    
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    
    const rawTickets = JSON.parse(jsonStr);
    
    const tokensUsed = response.response_metadata?.tokenUsage?.totalTokens || 0;
    
    return {
      rawTickets,
      currentStep: 'SLICING_TICKETS',
      tokensUsed: state.tokensUsed + tokensUsed,
    };
  } catch (error) {
    console.error('Ticket Slicer node error:', error);
    return {
      currentStep: 'FAILED',
      errors: [...state.errors, `Ticket Slicer failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}
