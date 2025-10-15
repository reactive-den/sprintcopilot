import { llm } from '@/lib/llm';
import { CLARIFIER_PROMPT } from '../prompts';
import type { GraphStateType } from '../state';
import { retryWithBackoff } from '@/lib/errors';

export async function clarifierNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log('🎯 [CLARIFIER] Starting clarification node...');
  console.log('📝 [CLARIFIER] Input:', {
    title: state.title,
    problemLength: state.problem?.length || 0,
    hasConstraints: !!state.constraints,
  });

  const prompt = CLARIFIER_PROMPT.replace('{title}', state.title)
    .replace('{problem}', state.problem)
    .replace('{constraints}', state.constraints || 'None');

  console.log('📤 [CLARIFIER] Sending request to OpenAI...');

  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });

    console.log('📥 [CLARIFIER] Received response from OpenAI');

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    console.log('🔍 [CLARIFIER] Response content length:', content.length);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

    console.log('🔄 [CLARIFIER] Parsing JSON response...');
    const clarifications = JSON.parse(jsonStr);

    const tokensUsed = response.response_metadata?.tokenUsage?.totalTokens || 0;

    console.log('✅ [CLARIFIER] Clarifications generated:', {
      questionsCount: clarifications.questions?.length || 0,
      hasScope: !!clarifications.scope,
      tokensUsed,
      totalTokens: state.tokensUsed + tokensUsed,
    });

    return {
      clarifications,
      currentStep: 'CLARIFYING',
      tokensUsed: state.tokensUsed + tokensUsed,
    };
  } catch (error) {
    console.error('❌ [CLARIFIER] Node error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    console.error('❌ [CLARIFIER] Full error:', error);
    console.error(
      '❌ [CLARIFIER] Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    return {
      currentStep: 'FAILED',
      errors: [
        ...state.errors,
        `Clarifier failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}
