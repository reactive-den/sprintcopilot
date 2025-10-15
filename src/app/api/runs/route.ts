import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRunSchema } from '@/lib/validations';
import { createPipeline } from '@/lib/langgraph/pipeline';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError, NotFoundError } from '@/lib/errors';
import type { PipelineProject, PipelineTicket } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const { success, reset, remaining } = await checkRateLimit(ip);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { projectId } = createRunSchema.parse(body);

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Create run
    const run = await prisma.run.create({
      data: {
        projectId,
        status: 'PENDING',
      },
    });

    console.log('✅ [RUNS] Run created:', {
      runId: run.id,
      projectId: project.id,
      projectTitle: project.title,
    });

    // Start pipeline asynchronously (don't await)
    console.log('🚀 [RUNS] Starting pipeline execution asynchronously...');
    executePipeline(run.id, project).catch((error) => {
      console.error('❌ [RUNS] Pipeline execution failed:', error);
      console.error('Stack trace:', error.stack);
    });

    return NextResponse.json(
      { run },
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toISOString(),
        },
      }
    );
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

async function executePipeline(runId: string, project: PipelineProject) {
  const startTime = Date.now();

  console.log('🔄 [PIPELINE] Starting execution:', {
    runId,
    projectId: project.id,
    projectTitle: project.title,
  });

  try {
    // Update status to CLARIFYING
    console.log('📝 [PIPELINE] Updating status to CLARIFYING...');
    await prisma.run.update({
      where: { id: runId },
      data: { status: 'CLARIFYING' },
    });

    console.log('🏗️ [PIPELINE] Creating LangGraph pipeline...');
    const pipeline = createPipeline();

    console.log('▶️ [PIPELINE] Invoking pipeline with input:', {
      projectId: project.id,
      title: project.title,
      problemLength: project.problem?.length || 0,
      hasConstraints: !!project.constraints,
    });

    const result = await pipeline.invoke({
      projectId: project.id,
      title: project.title,
      problem: project.problem,
      constraints: project.constraints || '',
      currentStep: 'PENDING',
      errors: [],
      tokensUsed: 0,
    });

    console.log('✅ [PIPELINE] Pipeline completed:', {
      currentStep: result.currentStep,
      tokensUsed: result.tokensUsed,
      hasErrors: result.errors?.length > 0,
      ticketCount: result.finalTickets?.length || 0,
    });

    // Check if pipeline failed
    if (result.currentStep === 'FAILED') {
      console.error('❌ [PIPELINE] Pipeline failed with errors:', result.errors);
      await prisma.run.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          errorMessage: result.errors.join('; '),
          durationMs: Date.now() - startTime,
        },
      });
      return;
    }

    // Save tickets
    if (result.finalTickets && result.finalTickets.length > 0) {
      console.log(`💾 [PIPELINE] Saving ${result.finalTickets.length} tickets...`);
      await prisma.ticket.createMany({
        data: result.finalTickets.map((ticket: PipelineTicket) => ({
          runId,
          title: ticket.title,
          description: ticket.description,
          acceptanceCriteria: Array.isArray(ticket.acceptanceCriteria)
            ? ticket.acceptanceCriteria.join('\n')
            : ticket.acceptanceCriteria,
          estimateHours: ticket.estimateHours,
          tshirtSize: ticket.tshirtSize as 'XS' | 'S' | 'M' | 'L' | 'XL',
          priority: ticket.priority,
          sprint: ticket.sprint,
          status: 'TODO' as const,
          dependencies: ticket.dependencies || [],
          tags: ticket.tags || [],
        })),
      });
      console.log('✅ [PIPELINE] Tickets saved successfully');
    } else {
      console.warn('⚠️ [PIPELINE] No tickets generated');
    }

    // Update run with final results
    const duration = Date.now() - startTime;
    console.log('💾 [PIPELINE] Updating run with final results:', {
      status: 'COMPLETED',
      tokensUsed: result.tokensUsed,
      durationMs: duration,
      durationSec: (duration / 1000).toFixed(2),
    });

    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        clarifications: result.clarifications || undefined,
        hld: result.hld || undefined,
        tokensUsed: result.tokensUsed,
        durationMs: duration,
      },
    });

    console.log('🎉 [PIPELINE] Execution completed successfully!');
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [PIPELINE] Execution error:', {
      runId,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: duration,
    });
    console.error('❌ [PIPELINE] Full error:', error);
    console.error(
      '❌ [PIPELINE] Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration,
      },
    });
  }
}
