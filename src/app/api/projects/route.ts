import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProjectSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: validated,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
