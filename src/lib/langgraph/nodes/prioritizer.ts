import { llm } from '@/lib/llm';
import { PRIORITIZER_PROMPT } from '../prompts';
import type { GraphStateType } from '../state';
import { retryWithBackoff } from '@/lib/errors';

export async function prioritizerNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  if (!state.estimatedTickets) {
    return {
      currentStep: 'FAILED',
      errors: [...state.errors, 'Prioritizer: No estimated tickets available'],
    };
  }

  const sprintCapacity = parseInt(process.env.DEFAULT_SPRINT_CAPACITY || '40');

  const prompt = PRIORITIZER_PROMPT.replace(
    '{tickets}',
    JSON.stringify(state.estimatedTickets, null, 2)
  ).replace('{sprintCapacity}', sprintCapacity.toString());

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    const finalTickets = JSON.parse(jsonStr);

    const tokensUsed = response.response_metadata?.tokenUsage?.totalTokens || 0;

    return {
      finalTickets,
      currentStep: 'COMPLETED',
      tokensUsed: state.tokensUsed + tokensUsed,
    };
  } catch (error) {
    console.error('Prioritizer node error:', error);
    return {
      currentStep: 'FAILED',
      errors: [
        ...state.errors,
        `Prioritizer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}
