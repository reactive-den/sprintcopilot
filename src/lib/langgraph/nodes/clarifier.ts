import { llm } from '@/lib/llm';
import { CLARIFIER_PROMPT } from '../prompts';
import type { GraphStateType } from '../state';
import { retryWithBackoff } from '@/lib/errors';

export async function clarifierNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const prompt = CLARIFIER_PROMPT
    .replace('{title}', state.title)
    .replace('{problem}', state.problem)
    .replace('{constraints}', state.constraints || 'None');
  
  try {
    const response = await retryWithBackoff(async () => {
      return await llm.invoke(prompt);
    });
    
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    
    const clarifications = JSON.parse(jsonStr);
    
    const tokensUsed = response.response_metadata?.tokenUsage?.totalTokens || 0;
    
    return {
      clarifications,
      currentStep: 'CLARIFYING',
      tokensUsed: state.tokensUsed + tokensUsed,
    };
  } catch (error) {
    console.error('Clarifier node error:', error);
    return {
      currentStep: 'FAILED',
      errors: [...state.errors, `Clarifier failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}
