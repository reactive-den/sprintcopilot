import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { generateTicketsFromHDD } from '@/lib/ticket-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Get session with project, business document, and all HDD documents
    const session = await prisma.clarifierSession.findUnique({
      where: { id: sessionId },
      include: {
        project: true,
        bddDocuments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        hddDocuments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Clarifier session');
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

    if (!businessDocument) {
      return NextResponse.json(
        { error: 'Business document not found. Please generate it first.' },
        { status: 400 }
      );
    }

    // Get all HDD sections
    const hddSections = {
      architecture: session.hddDocuments.find((doc) => doc.section === 'architecture')?.content || '',
      deployment: session.hddDocuments.find((doc) => doc.section === 'deployment')?.content || '',
      dataflow: session.hddDocuments.find((doc) => doc.section === 'dataflow')?.content || '',
      users: session.hddDocuments.find((doc) => doc.section === 'users')?.content || '',
    };

    // Check if at least one HDD section exists
    const hasHDD = Object.values(hddSections).some((content) => content.length > 0);
    if (!hasHDD) {
      return NextResponse.json(
        { error: 'HDD documents not found. Please generate at least one HDD section first.' },
        { status: 400 }
      );
    }

    console.log(`🎫 [TICKETS] Generating tickets for project ${session.projectId} and session:`, sessionId);

    // Generate tickets using business document, problem statement, and HDD
    const tickets = await generateTicketsFromHDD({
      projectId: session.projectId,
      projectTitle: session.project.title,
      problemStatement: session.project.problem,
      businessDocument,
      hddSections,
    });

    // Create a run with the tickets
    const run = await prisma.run.create({
      data: {
        projectId: session.projectId,
        status: 'COMPLETED',
        clarifications: {
          questions: [],
          assumptions: [],
          scope: businessDocument.scope || 'Not specified',
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
          sprint: ticket.sprint,
          status: 'TODO' as const,
          dependencies: ticket.dependencies || [],
          tags: ticket.tags || [],
        })),
      });

      console.log(`✅ [TICKETS] Generated and saved ${tickets.length} tickets for run:`, run.id);
    }

    return NextResponse.json({
      run,
      tickets,
      ticketCount: tickets?.length || 0,
    });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
