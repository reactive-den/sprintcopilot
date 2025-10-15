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
        project: true,
      },
    });
    
    if (!run) {
      throw new NotFoundError('Run');
    }
    
    // Generate CSV
    const headers = [
      'Title',
      'Description',
      'Acceptance Criteria',
      'Estimate (Hours)',
      'T-Shirt Size',
      'Priority',
      'Sprint',
      'Status',
      'Dependencies',
      'Tags',
    ];
    
    const rows = run.tickets.map(ticket => [
      ticket.title,
      ticket.description,
      ticket.acceptanceCriteria.replace(/\n/g, ' '),
      ticket.estimateHours?.toString() || '',
      ticket.tshirtSize || '',
      ticket.priority.toString(),
      ticket.sprint?.toString() || '',
      ticket.status,
      ticket.dependencies.join('; '),
      ticket.tags.join('; '),
    ]);
    
    // Escape CSV fields
    const escapeCsvField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    
    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map(row => row.map(escapeCsvField).join(',')),
    ].join('\n');
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sprintcopilot-${run.project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-tickets.csv"`,
      },
    });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
