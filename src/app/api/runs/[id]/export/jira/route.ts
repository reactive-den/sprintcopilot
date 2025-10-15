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
    
    // Map priority (1-10) to Jira priority names
    const mapPriority = (priority: number) => {
      if (priority >= 9) return 'Highest';
      if (priority >= 7) return 'High';
      if (priority >= 5) return 'Medium';
      if (priority >= 3) return 'Low';
      return 'Lowest';
    };
    
    // Generate Jira-compatible JSON
    const jiraIssues = run.tickets.map(ticket => ({
      summary: ticket.title,
      description: `${ticket.description}\n\n*Acceptance Criteria:*\n${ticket.acceptanceCriteria}`,
      issuetype: { name: 'Story' },
      priority: { name: mapPriority(ticket.priority) },
      labels: ticket.tags,
      customfield_tshirt: ticket.tshirtSize || undefined,
      timeoriginalestimate: ticket.estimateHours ? ticket.estimateHours * 3600 : undefined, // Convert hours to seconds
      customfield_sprint: ticket.sprint || undefined,
    }));
    
    return NextResponse.json(jiraIssues, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sprintcopilot-${run.project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-jira.json"`,
      },
    });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
