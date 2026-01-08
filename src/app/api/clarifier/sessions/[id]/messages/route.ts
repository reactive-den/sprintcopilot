import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { parseGitHubRepoUrl } from '@/lib/repo-analyzer';

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

    // Check if an assistant message actually contains a question (ends with ?)
    const isQuestion = (content: string) => {
      return content.trim().endsWith('?');
    };

    // Count questions asked by AI (excluding thank you messages)
    const questionCount = session.messages.filter(
      (msg) => msg.role === 'assistant' && isQuestion(msg.content)
    ).length;
    const maxQuestions = 5;

    // Save user message
    const userMessage = await prisma.clarifierMessage.create({
      data: {
        sessionId: id,
        role: 'user',
        content,
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: session.projectId },
    });

    let updatedRepoUrl = project?.repoUrl ?? null;
    if (!updatedRepoUrl) {
      const parsedRepo = parseGitHubRepoUrl(content);
      if (parsedRepo) {
        await prisma.project.update({
          where: { id: session.projectId },
          data: { repoUrl: parsedRepo.url },
        });
        updatedRepoUrl = parsedRepo.url;
      } else if (/no repo|no repository|none|n\/a/i.test(content)) {
        updatedRepoUrl = 'No repo provided';
      }
    }

    // Generate AI response based on conversation
    const { generateAIResponse } = await import('@/lib/clarifier');
    const aiResponse = await generateAIResponse(
      {
        idea: session.idea,
        context: session.context,
        constraints: session.constraints,
        repoUrl: updatedRepoUrl,
        messages: session.messages,
      },
      content,
      questionCount
    );

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
