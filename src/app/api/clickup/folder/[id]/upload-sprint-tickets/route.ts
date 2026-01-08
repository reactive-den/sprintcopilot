import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

const buildDescription = (ticket: any, projectTitle: string) => {
  // Extract objective and acceptance criteria from description
  let description = ticket.description || '';
  
  // If description doesn't already include acceptance criteria, add it
  if (description && !description.includes('Acceptance Criteria:')) {
    const acceptanceCriteria = Array.isArray(ticket.acceptanceCriteria)
      ? ticket.acceptanceCriteria
      : ticket.acceptanceCriteria
        ? [ticket.acceptanceCriteria]
        : [];
    
    if (acceptanceCriteria.length > 0) {
      const criteriaText = acceptanceCriteria.map((c: string) => `- ${c}`).join('\n');
      description = `${description}\n\nAcceptance Criteria:\n${criteriaText}`;
    }
  }
  
  // Return only the description (which contains Objective + Acceptance Criteria)
  return description.trim();
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;
    const body = await request.json();
    const { runId, sprintNumber } = body;

    const clickupToken = env.CLICKUP_API_TOKEN;

    if (!clickupToken) {
      throw new AppError(
        'ClickUp is not configured. Please set CLICKUP_API_TOKEN.',
        400,
        'CONFIG_ERROR'
      );
    }

    if (!runId) {
      throw new AppError('Run ID is required', 400, 'VALIDATION_ERROR');
    }

    if (!sprintNumber || typeof sprintNumber !== 'number') {
      throw new AppError('Sprint number is required', 400, 'VALIDATION_ERROR');
    }

    // Get the run with tickets
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        tickets: {
          orderBy: [{ priority: 'desc' }],
        },
        project: true,
      },
    });

    if (!run) {
      throw new NotFoundError('Run');
    }

    if (run.tickets.length === 0) {
      throw new AppError('No tickets found for this run', 400, 'NO_TICKETS');
    }

    // Check if sprint list already exists
    const listsResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folderId}/list`, {
      headers: { Authorization: clickupToken },
    });

    if (!listsResponse.ok) {
      const errorText = await listsResponse.text();
      throw new AppError(`Failed to fetch folder lists: ${errorText}`, 500, 'CLICKUP_ERROR');
    }

    const listsData = await listsResponse.json();
    const existingLists = listsData.lists || [];
    let sprintList = existingLists.find((l: any) => l.name === `Sprint ${sprintNumber}`);

    // Create sprint list if it doesn't exist
    if (!sprintList) {
      const sprintName = `Sprint ${sprintNumber}`;
      const createListResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folderId}/list`, {
        method: 'POST',
        headers: {
          Authorization: clickupToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sprintName,
        }),
      });

      if (!createListResponse.ok) {
        const errorText = await createListResponse.text();
        throw new AppError(`Failed to create sprint list: ${errorText}`, 500, 'CLICKUP_LIST_CREATE_ERROR');
      }

      sprintList = await createListResponse.json();
      console.log(`✅ [CLICKUP] Created sprint list: ${sprintName} (${sprintList.id})`);
    }

    // Get list members for assignment
    const membersResponse = await fetch(`${CLICKUP_API_BASE}/list/${sprintList.id}/member`, {
      headers: { Authorization: clickupToken },
    });
    const membersData = membersResponse.ok ? await membersResponse.json() : { members: [] };
    const members: Array<{ id: string; username?: string; email?: string }> = membersData.members || [];

    // Separate FE and BE members
    const feMembers = members.filter(
      (m) =>
        m.username?.toLowerCase().includes('fe') ||
        m.username?.toLowerCase().includes('frontend') ||
        m.email?.toLowerCase().includes('fe') ||
        m.email?.toLowerCase().includes('frontend')
    );
    const beMembers = members.filter(
      (m) =>
        !feMembers.includes(m) &&
        (m.username?.toLowerCase().includes('be') ||
          m.username?.toLowerCase().includes('backend') ||
          m.email?.toLowerCase().includes('be') ||
          m.email?.toLowerCase().includes('backend'))
    );

    const effectiveFeMembers = feMembers.length > 0 ? feMembers : members;
    const effectiveBeMembers = beMembers.length > 0 ? beMembers : members;

    let feIndex = 0;
    let beIndex = 0;

    // Create tickets in ClickUp
    const created: Array<{ id: string; name: string; url?: string }> = [];
    const failed: Array<{ title: string; error: string }> = [];

    for (const ticket of run.tickets) {
      const tags = ticket.tags.map((t) => t.toLowerCase());
      const title = ticket.title.toLowerCase();

      let category: 'FE' | 'BE' | 'FULLSTACK' = 'FULLSTACK';
      let assigneeId: string | undefined;

      if (tags.some((t) => t.includes('frontend') || t.includes('ui') || t.includes('react'))) {
        category = 'FE';
      } else if (tags.some((t) => t.includes('backend') || t.includes('api') || t.includes('database'))) {
        category = 'BE';
      } else if (title.includes('frontend') || title.includes('ui') || title.includes('react')) {
        category = 'FE';
      } else if (title.includes('backend') || title.includes('api') || title.includes('database')) {
        category = 'BE';
      }

      if (category === 'FE') {
        assigneeId = effectiveFeMembers[feIndex % effectiveFeMembers.length]?.id;
        feIndex++;
      } else if (category === 'BE') {
        assigneeId = effectiveBeMembers[beIndex % effectiveBeMembers.length]?.id;
        beIndex++;
      } else if (members.length > 0) {
        assigneeId = members[(feIndex + beIndex) % members.length]?.id;
      }

      const mapPriority = (priority: number) => {
        if (priority === 1) return 1; // Urgent
        if (priority === 2) return 2; // High
        if (priority === 3) return 3; // Normal
        return 4; // Low
      };

      const payload: any = {
        name: ticket.title,
        description: buildDescription(ticket, run.project.title),
        tags: ticket.tags,
        priority: mapPriority(ticket.priority),
        time_estimate: ticket.estimateHours ? ticket.estimateHours * 60 * 60 * 1000 : undefined,
      };

      if (assigneeId) {
        payload.assignees = [assigneeId];
      }

      const taskResponse = await fetch(`${CLICKUP_API_BASE}/list/${sprintList.id}/task`, {
        method: 'POST',
        headers: {
          Authorization: clickupToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!taskResponse.ok) {
        const errorText = await taskResponse.text();
        failed.push({
          title: ticket.title,
          error: errorText || taskResponse.statusText,
        });
        continue;
      }

      const task = await taskResponse.json();
      created.push({ id: task.id, name: task.name, url: task.url });
      console.log(`✅ [CLICKUP] Created: ${ticket.title} (Sprint ${sprintNumber})`);
    }

    console.log(`📊 [CLICKUP] Created: ${created.length}, Failed: ${failed.length}`);

    return NextResponse.json({
      success: true,
      sprintNumber,
      ticketsCreated: created.length,
      ticketsFailed: failed.length,
      created,
      failed,
      message: `Successfully uploaded ${created.length} tickets to Sprint ${sprintNumber}`,
    });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
