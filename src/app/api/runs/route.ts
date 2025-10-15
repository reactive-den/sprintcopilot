import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRunSchema } from '@/lib/validations';
import { createPipeline } from '@/lib/langgraph/pipeline';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError, NotFoundError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    const { success, reset, remaining } = await checkRateLimit(ip);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: reset 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toISOString(),
          }
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
    
    // Start pipeline asynchronously (don't await)
    executePipeline(run.id, project).catch(console.error);
    
    return NextResponse.json(
      { run },
      { 
        status: 201,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toISOString(),
        }
      }
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

async function executePipeline(runId: string, project: any) {
  const startTime = Date.now();
  
  try {
    // Update status to CLARIFYING
    await prisma.run.update({
      where: { id: runId },
      data: { status: 'CLARIFYING' },
    });
    
    const pipeline = createPipeline();
    const result = await pipeline.invoke({
      projectId: project.id,
      title: project.title,
      problem: project.problem,
      constraints: project.constraints,
      currentStep: 'PENDING',
      errors: [],
      tokensUsed: 0,
    });
    
    // Check if pipeline failed
    if (result.currentStep === 'FAILED') {
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
      await prisma.ticket.createMany({
        data: result.finalTickets.map((ticket: any) => ({
          runId,
          title: ticket.title,
          description: ticket.description,
          acceptanceCriteria: ticket.acceptanceCriteria,
          estimateHours: ticket.estimateHours,
          tshirtSize: ticket.tshirtSize,
          priority: ticket.priority,
          sprint: ticket.sprint,
          status: 'TODO',
          dependencies: ticket.dependencies || [],
          tags: ticket.tags || [],
        })),
      });
    }
    
    // Update run with final results
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        clarifications: result.clarifications || null,
        hld: result.hld || null,
        tokensUsed: result.tokensUsed,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Pipeline execution error:', error);
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      },
    });
  }
}
