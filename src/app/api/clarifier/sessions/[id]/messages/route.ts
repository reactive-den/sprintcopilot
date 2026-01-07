import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const sendMessageSchema = z.object({
  content: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.clarifierSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Clarifier session');
    }

    return NextResponse.json({ messages: session.messages });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = sendMessageSchema.parse(body);

    // Verify session exists
    const session = await prisma.clarifierSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Clarifier session');
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Check question limit (count assistant messages)
    const questionCount = session.messages.filter((msg) => msg.role === 'assistant').length;
    const maxQuestions = 10;
    if (questionCount >= maxQuestions) {
      return NextResponse.json(
        { error: 'Maximum number of questions (10) has been reached. Please finalize the session.' },
        { status: 400 }
      );
    }

    // Save user message
    const userMessage = await prisma.clarifierMessage.create({
      data: {
        sessionId: id,
        role: 'user',
        content,
      },
    });

    // Generate AI response based on conversation
    const { generateAIResponse } = await import('@/lib/clarifier');
    const aiResponse = await generateAIResponse(session, content);

    // Save AI response
    const assistantMessage = await prisma.clarifierMessage.create({
      data: {
        sessionId: id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
