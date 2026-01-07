import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { generateHDDSection, type HDDSection } from '@/lib/hdd-generator';
import type { RepoAnalysis } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; section: string }> }
) {
  try {
    const { id, section } = await params;

    if (!['architecture', 'deployment', 'dataflow', 'users'].includes(section)) {
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
    const businessDocument = fullSession.bddDocuments[0]?.contentJson as
      | {
          systemDesign?: string;
          deployment?: string;
          dataFlows?: string[];
          stakeholders?: string[];
          productOverview?: string;
        }
      | undefined;

    const latestRun = await prisma.run.findFirst({
      where: { projectId: fullSession.projectId },
      orderBy: { createdAt: 'desc' },
    });

    const repoAnalysis = latestRun?.repoAnalysis as RepoAnalysis | undefined;

    // Generate HDD section
    console.log(`📋 [HDD] Generating ${section} for project ${fullSession.projectId} and session:`, id);
    const content = await generateHDDSection(section as HDDSection, {
      idea: fullSession.idea,
      context: fullSession.context,
      constraints: fullSession.constraints,
      systemDesign: businessDocument?.systemDesign,
      deployment: businessDocument?.deployment,
      dataFlows: businessDocument?.dataFlows,
      stakeholders: businessDocument?.stakeholders,
      productOverview: businessDocument?.productOverview,
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
