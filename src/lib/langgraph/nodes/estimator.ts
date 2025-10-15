import { llm } from '@/lib/llm';
import { ESTIMATOR_PROMPT } from '../prompts';
import type { GraphStateType } from '../state';
import { retryWithBackoff } from '@/lib/errors';

export async function estimatorNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  if (!state.rawTickets) {
    return {
      currentStep: 'FAILED',
      errors: [...state.errors, 'Estimator: No raw tickets available'],
    };
  }

  const prompt = ESTIMATOR_PROMPT.replace('{tickets}', JSON.stringify(state.rawTickets, null, 2));

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    const estimatedTickets = JSON.parse(jsonStr);

    const tokensUsed = response.response_metadata?.tokenUsage?.totalTokens || 0;

    return {
      estimatedTickets,
      currentStep: 'ESTIMATING',
      tokensUsed: state.tokensUsed + tokensUsed,
    };
  } catch (error) {
    console.error('Estimator node error:', error);
    return {
      currentStep: 'FAILED',
      errors: [
        ...state.errors,
        `Estimator failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}
