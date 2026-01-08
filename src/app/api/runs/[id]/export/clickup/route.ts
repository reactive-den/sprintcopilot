import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

const mapPriority = (priority: number) => {
  if (priority >= 9) return 1; // Urgent
  if (priority >= 7) return 2; // High
  if (priority >= 5) return 3; // Normal
  return 4; // Low
};

type ClickUpTicket = {
  description: string;
  acceptanceCriteria: string;
  sprint: number | null;
  estimateHours: number | null;
  tshirtSize: string | null;
  priority: number;
  tags: string[];
  dependencies: string[];
};

const buildDescription = (ticket: ClickUpTicket, projectTitle: string) => {
  const tags = ticket.tags.length > 0 ? ticket.tags.join(', ') : 'None';
  const dependencies = ticket.dependencies.length > 0 ? ticket.dependencies.map((dep) => `- ${dep}`).join('\n') : 'None';
  const estimate = ticket.estimateHours ? `${ticket.estimateHours}h` : 'N/A';
  const sprint = ticket.sprint ?? 'TBD';
  const tshirt = ticket.tshirtSize ?? 'N/A';

  return [
    `Project: ${projectTitle}`,
    `Sprint: ${sprint}`,
    `Estimate: ${estimate}`,
    `T-Shirt Size: ${tshirt}`,
    `Priority: P${ticket.priority}`,
    `Tags: ${tags}`,
    '',
    ticket.description,
    '',
    'Acceptance Criteria:',
    ticket.acceptanceCriteria,
    '',
    'Dependencies:',
    dependencies,
  ].join('\n');
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: runId } = await params;

    const clickupToken = env.CLICKUP_API_TOKEN;
    const clickupSpaceId = env.CLICKUP_SPACE_ID;

    if (!clickupToken || !clickupSpaceId) {
      throw new AppError(
        'ClickUp is not configured. Please set CLICKUP_API_TOKEN and CLICKUP_SPACE_ID.',
        400,
        'CONFIG_ERROR'
      );
    }

    // Get the run first to know the project name
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        tickets: {
          orderBy: [{ sprint: 'asc' }, { priority: 'desc' }],
        },
        project: true,
      },
    });

    if (!run) {
      throw new NotFoundError('Run');
    }

    if (run.status !== 'COMPLETED') {
      throw new AppError('Run is not completed yet. Please try again after it finishes.', 400, 'RUN_NOT_READY');
    }

    if (run.tickets.length === 0) {
      throw new AppError('No tickets found for this run.', 400, 'NO_TICKETS');
    }

    console.log(`📋 [CLICKUP] Creating folder for project: ${run.project.title}`);

    // Check if folder already exists for this project
    const foldersResponse = await fetch(`${CLICKUP_API_BASE}/space/${clickupSpaceId}/folder`, {
      headers: { Authorization: clickupToken },
    });
    const foldersData = foldersResponse.ok ? await foldersResponse.json() : { folders: [] };
    let folder = foldersData.folders?.find((f: any) => f.name === run.project.title);

    // Create folder if it doesn't exist
    if (!folder) {
      const createFolderResponse = await fetch(`${CLICKUP_API_BASE}/space/${clickupSpaceId}/folder`, {
        method: 'POST',
        headers: {
          Authorization: clickupToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: run.project.title,
          hidden: false,
        }),
      });

      if (!createFolderResponse.ok) {
        const errorText = await createFolderResponse.text();
        throw new AppError(`Failed to create ClickUp folder: ${errorText}`, 500, 'CLICKUP_FOLDER_CREATE_ERROR');
      }

      folder = await createFolderResponse.json();
      console.log(`✅ [CLICKUP] Created folder: ${folder.id}`);
    } else {
      console.log(`📁 [CLICKUP] Using existing folder: ${folder.id}`);
    }

    // Group tickets by sprint
    const ticketsBySprint: Record<number, typeof run.tickets> = {};
    for (const ticket of run.tickets) {
      const sprint = ticket.sprint ?? 1;
      if (!ticketsBySprint[sprint]) {
        ticketsBySprint[sprint] = [];
      }
      ticketsBySprint[sprint].push(ticket);
    }

    console.log(`📊 [CLICKUP] Creating lists for ${Object.keys(ticketsBySprint).length} sprints`);

    // Fetch folder lists
    const folderListsResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folder.id}/list`, {
      headers: { Authorization: clickupToken },
    });
    const folderListsData = folderListsResponse.ok ? await folderListsResponse.json() : { lists: [] };
    const existingLists = folderListsData.lists || [];

    const created: Array<{ id: string; name: string; sprint: number; url?: string }> = [];
    const failed: Array<{ title: string; sprint: number; error: string }> = [];

    // Create a list for each sprint
    for (const [sprintNum, sprintTickets] of Object.entries(ticketsBySprint)) {
      const sprint = parseInt(sprintNum);
      let sprintList = existingLists.find((l: any) => l.name === `Sprint ${sprint}`);

      // Create list if it doesn't exist
      if (!sprintList) {
        const createListResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folder.id}/list`, {
          method: 'POST',
          headers: {
            Authorization: clickupToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Sprint ${sprint}`,
            hidden: false,
          }),
        });

        if (!createListResponse.ok) {
          const errorText = await createListResponse.text();
          // Continue with other sprints even if one fails
          console.error(`❌ [CLICKUP] Failed to create Sprint ${sprint} list: ${errorText}`);
          continue;
        }

        sprintList = await createListResponse.json();
      }

      console.log(`📋 [CLICKUP] Creating ${sprintTickets.length} tickets in Sprint ${sprint} (list: ${sprintList.id})`);

      // Fetch list members for assignment
      const membersResponse = await fetch(`${CLICKUP_API_BASE}/list/${sprintList.id}/member`, {
        headers: { Authorization: clickupToken },
      });
      const membersData = membersResponse.ok ? await membersResponse.json() : { members: [] };
      const members = membersData.members || [];

      // Categorize members as FE or BE
      const feMembers = members.filter((m: any) =>
        m.username?.toLowerCase().includes('fe') ||
        m.username?.toLowerCase().includes('frontend') ||
        m.email?.toLowerCase().includes('fe') ||
        m.email?.toLowerCase().includes('frontend')
      );
      const beMembers = members.filter((m: any) =>
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

      // Create tickets in the sprint list
      for (const ticket of sprintTickets) {
        const tags = ticket.tags.map(t => t.toLowerCase());
        const title = ticket.title.toLowerCase();

        let category: 'FE' | 'BE' | 'FULLSTACK' = 'FULLSTACK';
        let assigneeId: string | undefined;

        if (tags.some(t => t.includes('frontend') || t.includes('ui') || t.includes('react'))) {
          category = 'FE';
        } else if (tags.some(t => t.includes('backend') || t.includes('api') || t.includes('database'))) {
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
            sprint,
            error: errorText || taskResponse.statusText,
          });
          continue;
        }

        const task = await taskResponse.json();
        created.push({ id: task.id, name: task.name, sprint, url: task.url });
        console.log(`✅ [CLICKUP] Created: ${ticket.title} (Sprint ${sprint})`);
      }
    }

    console.log(`📊 [CLICKUP] Created: ${created.length}, Failed: ${failed.length}`);

    // Fetch updated folder data
    const finalFolderResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folder.id}`, {
      headers: { Authorization: clickupToken },
    });
    const finalFolderData = finalFolderResponse.ok ? await finalFolderResponse.json() : null;

    // Fetch all tasks from all sprint lists
    const allTasks: any[] = [];
    const finalListsResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folder.id}/list`, {
      headers: { Authorization: clickupToken },
    });
    const finalListsData = finalListsResponse.ok ? await finalListsResponse.json() : { lists: [] };

    for (const list of finalListsData.lists || []) {
      const tasksResponse = await fetch(`${CLICKUP_API_BASE}/list/${list.id}/task?include_closed=true`, {
        headers: { Authorization: clickupToken },
      });
      const tasksData = tasksResponse.ok ? await tasksResponse.json() : { tasks: [] };
      allTasks.push(...tasksData.tasks.map((t: any) => ({ ...t, sprintList: list.name })));
    }

    return NextResponse.json({
      created,
      failed,
      total: run.tickets.length,
      folder,
      lists: finalListsData.lists || [],
      tasks: allTasks,
    });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
