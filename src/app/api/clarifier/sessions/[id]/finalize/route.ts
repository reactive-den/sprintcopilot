import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get session with messages
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

    // Generate clarifications from conversation
    const { generateClarificationsFromChat } = await import('@/lib/clarifier');
    const clarifications = await generateClarificationsFromChat(session);

    // Update session status
    await prisma.clarifierSession.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json({ clarifications });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
