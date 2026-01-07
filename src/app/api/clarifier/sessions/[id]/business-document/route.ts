import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { generateBusinessDocument } from '@/lib/business-document';
import { Prisma } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get session with messages and project
    const session = await prisma.clarifierSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        project: true,
      },
    });

    if (!session) {
      throw new NotFoundError('Clarifier session');
    }

    // Check if document already exists
    const existingDocument = await prisma.bddDocument.findFirst({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (existingDocument) {
      return NextResponse.json({
        document: existingDocument,
        businessDocument: existingDocument.contentJson as unknown,
      });
    }

    // Generate business document
    console.log('📄 [BUSINESS-DOCUMENT] Generating business document for session:', id);
    const businessDocument = await generateBusinessDocument({
      idea: session.idea,
      context: session.context,
      constraints: session.constraints,
      messages: session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Save to database
    const bddDocument = await prisma.bddDocument.create({
      data: {
        sessionId: id,
        contentJson: businessDocument as unknown as Prisma.InputJsonValue,
      },
    });

    console.log('✅ [BUSINESS-DOCUMENT] Business document created:', bddDocument.id);

    return NextResponse.json({
      document: bddDocument,
      businessDocument,
    });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await prisma.bddDocument.findFirst({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (!document) {
      throw new NotFoundError('Business document');
    }

    return NextResponse.json({
      document,
      businessDocument: document.contentJson as unknown,
    });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
