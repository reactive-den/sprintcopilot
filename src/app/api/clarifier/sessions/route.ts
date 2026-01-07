import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const createSessionSchema = z.object({
  projectId: z.string(),
  idea: z.string().min(10),
  context: z.string().optional(),
  constraints: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, idea, context, constraints } = createSessionSchema.parse(body);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Create clarifier session
    const session = await prisma.clarifierSession.create({
      data: {
        projectId,
        status: 'ACTIVE',
        idea,
        context: context || project.problem,
        constraints: constraints || project.constraints || null,
      },
    });

    // Generate initial question using AI (one at a time)
    const { generateInitialQuestion } = await import('@/lib/clarifier');
    const initialQuestion = await generateInitialQuestion(idea, context || project.problem, constraints || project.constraints);

    // Create initial AI message with the first question
    await prisma.clarifierMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: initialQuestion,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
