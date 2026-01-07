import type { GraphStateType } from '../state';
import { generateRepoAnalysis } from '@/lib/repo-analyzer';

export async function repoAnalyzerNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log('🔍 [REPO_ANALYZER] Starting repo analysis...');

  if (!state.repoUrl) {
    return {
      repoAnalysis: {
        status: 'skipped',
        message: 'No repository URL provided.',
      },
      currentStep: 'ANALYZING_REPO',
      tokensUsed: state.tokensUsed,
    };
  }

  try {
    const { analysis, tokensUsed } = await generateRepoAnalysis({
      repoUrl: state.repoUrl,
      title: state.title,
      problem: state.problem,
      constraints: state.constraints || undefined,
      scope: state.clarifications?.scope,
    });

    return {
      repoAnalysis: analysis,
      currentStep: 'ANALYZING_REPO',
      tokensUsed: state.tokensUsed + tokensUsed,
    };
  } catch (error) {
    console.error('❌ [REPO_ANALYZER] Node error:', error);
    return {
      repoAnalysis: {
        status: 'failed',
        repoUrl: state.repoUrl,
        message: error instanceof Error ? error.message : 'Repository analysis failed.',
      },
      currentStep: 'ANALYZING_REPO',
      tokensUsed: state.tokensUsed,
    };
  }
}
