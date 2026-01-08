import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import { generateTicketsFromHDD } from '@/lib/ticket-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;
    const body = await request.json();
    const { sprintNumber, featureDescription } = body;

    if (!sprintNumber || typeof sprintNumber !== 'number') {
      throw new AppError('Sprint number is required', 400, 'VALIDATION_ERROR');
    }

    if (!featureDescription || !featureDescription.trim()) {
      throw new AppError('Feature description is required', 400, 'VALIDATION_ERROR');
    }

    const clickupToken = env.CLICKUP_API_TOKEN;

    if (!clickupToken) {
      throw new AppError(
        'ClickUp is not configured. Please set CLICKUP_API_TOKEN.',
        400,
        'CONFIG_ERROR'
      );
    }

    // Get folder name to find the project
    const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';
    const folderResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folderId}`, {
      headers: { Authorization: clickupToken },
    });

    if (!folderResponse.ok) {
      throw new AppError('Failed to fetch folder', 500, 'CLICKUP_ERROR');
    }

    const folderData = await folderResponse.json();
    const folderName = folderData.name;

    // Find project by matching folder name
    const project = await prisma.project.findFirst({
      where: { title: folderName },
      include: {
        clarifierSessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            bddDocuments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            hddDocuments: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const session = project.clarifierSessions[0];
    if (!session) {
      throw new AppError(
        'No clarifier session found for this project. Please create a session first.',
        400,
        'NO_SESSION'
      );
    }

    // Get business document
    const businessDocument = session.bddDocuments[0]?.contentJson as
      | {
          title?: string;
          problemStatement?: string;
          productOverview?: string;
          scope?: string;
          requirements?: {
            functional?: string[];
            nonFunctional?: string[];
          };
        }
      | undefined;

    // Get all HDD sections
    const hddSections = {
      architecture: session.hddDocuments.find((doc) => doc.section === 'architecture')?.content || '',
      deployment: session.hddDocuments.find((doc) => doc.section === 'deployment')?.content || '',
      dataflow: session.hddDocuments.find((doc) => doc.section === 'dataflow')?.content || '',
      users: session.hddDocuments.find((doc) => doc.section === 'users')?.content || '',
    };

    // Check if we have at least some context (business doc or HDD)
    const hasBusinessDoc = businessDocument && (businessDocument.scope || businessDocument.productOverview);
    const hasHDD = Object.values(hddSections).some((content) => content.length > 0);

    if (!hasBusinessDoc && !hasHDD) {
      throw new AppError(
        'No business document or HDD found for this project. Please generate them first.',
        400,
        'NO_CONTEXT'
      );
    }

    // Create enhanced business document with the new feature
    const enhancedBusinessDocument = {
      title: businessDocument?.title || project.title,
      problemStatement: businessDocument?.problemStatement || project.problem,
      productOverview: businessDocument?.productOverview || project.problem,
      scope: businessDocument?.scope
        ? `${businessDocument.scope}\n\nNew Feature for Sprint ${sprintNumber}: ${featureDescription}`
        : `New Feature for Sprint ${sprintNumber}: ${featureDescription}`,
      requirements: businessDocument?.requirements || {
        functional: [],
        nonFunctional: [],
      },
    };

    console.log(`🎫 [SPRINT-TICKETS] Generating tickets for Sprint ${sprintNumber} with feature: ${featureDescription}`);
    console.log(`📋 [SPRINT-TICKETS] Context: hasBusinessDoc=${hasBusinessDoc}, hasHDD=${hasHDD}`);
    console.log(`📋 [SPRINT-TICKETS] Project: ${project.title}, Problem: ${project.problem?.substring(0, 100)}...`);

    // Generate tickets using business document, problem statement, HDD, and new feature
    let tickets;
    try {
      console.log(`🔄 [SPRINT-TICKETS] Calling generateTicketsFromHDD...`);
      tickets = await generateTicketsFromHDD({
        projectId: project.id,
        projectTitle: project.title,
        problemStatement: project.problem,
        businessDocument: enhancedBusinessDocument,
        hddSections,
      });
      console.log(`✅ [SPRINT-TICKETS] Generated ${tickets?.length || 0} tickets`);
    } catch (error) {
      console.error('❌ [SPRINT-TICKETS] Error generating tickets:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [SPRINT-TICKETS] Full error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new AppError(
        `Failed to generate tickets: ${errorMessage}. Please ensure the project has a business document and HDD sections, and try with a more detailed feature description.`,
        500,
        'TICKET_GENERATION_ERROR'
      );
    }

    if (!tickets || tickets.length === 0) {
      throw new AppError(
        'No tickets were generated. Please try again with a more detailed feature description.',
        400,
        'NO_TICKETS'
      );
    }

    // Create a run with the tickets
    const run = await prisma.run.create({
      data: {
        projectId: project.id,
        status: 'COMPLETED',
        clarifications: {
          questions: [],
          assumptions: [],
          scope: enhancedBusinessDocument.scope || 'Not specified',
        } as any,
      },
    });

    // Save tickets
    if (tickets && tickets.length > 0) {
      await prisma.ticket.createMany({
        data: tickets.map((ticket) => ({
          runId: run.id,
          title: ticket.title,
          description: ticket.description,
          acceptanceCriteria: Array.isArray(ticket.acceptanceCriteria)
            ? ticket.acceptanceCriteria.join('\n')
            : ticket.acceptanceCriteria || '',
          estimateHours: ticket.estimateHours,
          tshirtSize: ticket.tshirtSize as 'XS' | 'S' | 'M' | 'L' | 'XL',
          priority: ticket.priority,
          sprint: sprintNumber, // Use the new sprint number
          status: 'TODO' as const,
          dependencies: ticket.dependencies || [],
          tags: ticket.tags || [],
        })),
      });

      console.log(`✅ [SPRINT-TICKETS] Generated and saved ${tickets.length} tickets for run:`, run.id);
    }

    return NextResponse.json({
      success: true,
      runId: run.id,
      projectId: project.id,
      sprintNumber,
      ticketCount: tickets?.length || 0,
      message: `Successfully generated ${tickets?.length || 0} tickets for Sprint ${sprintNumber}`,
    });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
