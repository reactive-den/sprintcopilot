import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { estimateTickets } from '@/lib/estimator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await params;

    // Get run with tickets
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        tickets: true,
      },
    });

    if (!run) {
      throw new NotFoundError('Run');
    }

    if (!run.tickets || run.tickets.length === 0) {
      return NextResponse.json({ error: 'No tickets found for this run' }, { status: 400 });
    }

    console.log(`📊 [ESTIMATOR] Estimating ${run.tickets.length} tickets for run:`, runId);

    // Format tickets for estimation
    const ticketsForEstimation = run.tickets.map((ticket) => ({
      title: ticket.title,
      description: ticket.description,
      acceptanceCriteria: ticket.acceptanceCriteria,
      estimateHours: ticket.estimateHours || undefined,
      tshirtSize: ticket.tshirtSize || undefined,
    }));

    // Estimate tickets using AI
    const estimatedTickets = await estimateTickets(ticketsForEstimation);

    // Update tickets in database with new estimates
    const updatePromises = estimatedTickets.map((estimatedTicket, index) => {
      const originalTicket = run.tickets[index];
      if (!originalTicket) return null;

      return prisma.ticket.update({
        where: { id: originalTicket.id },
        data: {
          estimateHours: estimatedTicket.estimateHours,
          tshirtSize: estimatedTicket.tshirtSize as 'XS' | 'S' | 'M' | 'L' | 'XL',
        },
      });
    });

    await Promise.all(updatePromises.filter((p) => p !== null));

    console.log(`✅ [ESTIMATOR] Updated ${estimatedTickets.length} tickets with estimates`);

    return NextResponse.json({
      success: true,
      ticketsUpdated: estimatedTickets.length,
      tickets: estimatedTickets,
    });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
