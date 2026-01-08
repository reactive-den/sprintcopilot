import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { generateHDDSection, getSectionConfig, type HDDSection } from '@/lib/hdd-generator';
import { getAvailableSectionIds } from '@/lib/hdd-config';
import type { RepoAnalysis } from '@/types';
import type { BusinessDocument } from '@/lib/business-document';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; section: string }> }
) {
  try {
    const { id, section } = await params;
    const validSections = getAvailableSectionIds();

    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // Get session to get projectId
    const session = await prisma.clarifierSession.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!session) {
      throw new NotFoundError('Clarifier session');
    }

    // Check if HDD document exists in database
    const existingHDD = await prisma.hDDDocument.findFirst({
      where: {
        sessionId: id,
        projectId: session.projectId,
        section: section,
      },
    });

    if (existingHDD) {
      return NextResponse.json({ content: existingHDD.content });
    }

    return NextResponse.json({ error: 'HDD section not found' }, { status: 404 });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; section: string }> }
) {
  try {
    const { id, section } = await params;
    const validSections = getAvailableSectionIds();

    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // Get session first to get projectId
    const session = await prisma.clarifierSession.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!session) {
      throw new NotFoundError('Clarifier session');
    }

    // Check if HDD document already exists in database for this project and session
    const existingHDD = await prisma.hDDDocument.findFirst({
      where: {
        sessionId: id,
        projectId: session.projectId,
        section: section,
      },
    });

    if (existingHDD) {
      console.log(`📋 [HDD] Returning cached ${section} for project ${session.projectId} and session:`, id);
      return NextResponse.json({ content: existingHDD.content });
    }

    // Get full session data with messages and business document for generation
    const fullSession = await prisma.clarifierSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        project: true,
        bddDocuments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!fullSession) {
      throw new NotFoundError('Clarifier session');
    }

    // Get business document if available
    const bddContent = (fullSession.bddDocuments[0]?.contentJson as unknown as BusinessDocument | undefined);

    const latestRun = await prisma.run.findFirst({
      where: { projectId: fullSession.projectId },
      orderBy: { createdAt: 'desc' },
    });

    const repoAnalysis = latestRun?.repoAnalysis as RepoAnalysis | undefined;

    // Get section configuration
    const sectionConfig = getSectionConfig(section);

    // Generate HDD section with few-shot prompts
    console.log(`📋 [HDD] Generating ${section} for project ${fullSession.projectId} and session:`, id);
    const content = await generateHDDSection(section, sectionConfig, {
      idea: fullSession.idea,
      context: fullSession.context,
      constraints: fullSession.constraints,
      businessDocument: bddContent,
      repoAnalysis,
    });

    // Save to database with projectId (use upsert to avoid unique constraint races)
    await prisma.hDDDocument.upsert({
      where: {
        sessionId_section: {
          sessionId: id,
          section: section,
        },
      },
      update: {
        content: content,
        projectId: fullSession.projectId,
      },
      create: {
        sessionId: id,
        projectId: fullSession.projectId,
        section: section,
        content: content,
      },
    });

    console.log(`✅ [HDD] Saved ${section} to database for project ${fullSession.projectId} and session:`, id);

    return NextResponse.json({ content });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
