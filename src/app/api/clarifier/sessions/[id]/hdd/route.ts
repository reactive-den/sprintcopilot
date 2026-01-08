import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { getSectionsFromBusinessDoc } from '@/lib/hdd-config';
import type { BusinessDocument } from '@/lib/business-document';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get session with business document
    const session = await prisma.clarifierSession.findUnique({
      where: { id },
      include: {
        bddDocuments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Clarifier session');
    }

    // Get business document if available
    const bddContent = (session.bddDocuments[0]?.contentJson as unknown as BusinessDocument | undefined);

    if (!bddContent) {
      // Return default sections if no business document
      return NextResponse.json({ sections: [] });
    }

    // Generate dynamic sections based on business document
    const sections = getSectionsFromBusinessDoc(bddContent);

    return NextResponse.json({ sections });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
