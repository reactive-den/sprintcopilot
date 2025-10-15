import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        tickets: {
          orderBy: [
            { sprint: 'asc' },
            { priority: 'desc' },
          ],
        },
        project: {
          select: {
            id: true,
            title: true,
            problem: true,
            constraints: true,
          },
        },
      },
    });
    
    if (!run) {
      throw new NotFoundError('Run');
    }
    
    return NextResponse.json({ run });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
