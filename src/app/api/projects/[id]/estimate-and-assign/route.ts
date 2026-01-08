import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { handleApiError, NotFoundError } from '@/lib/errors';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

interface ClickUpUser {
  id: string;
  username: string;
  email: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const clickupToken = env.CLICKUP_API_TOKEN;
    const clickupSpaceId = env.CLICKUP_SPACE_ID;

    if (!clickupToken || !clickupSpaceId) {
      throw new Error('ClickUp is not configured');
    }

    // Get project with runs and tickets
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        runs: {
          include: {
            tickets: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const run = project.runs[0];
    if (!run || !run.tickets || run.tickets.length === 0) {
      return NextResponse.json({ error: 'No tickets found' }, { status: 400 });
    }

    console.log(`📊 [ESTIMATE-ASSIGN] Processing ${run.tickets.length} tickets for project:`, projectId);

    // Format tickets for estimation
    const ticketsForEstimation = run.tickets.map((ticket) => ({
      title: ticket.title,
      description: ticket.description,
      acceptanceCriteria: ticket.acceptanceCriteria,
      tags: ticket.tags,
    }));

    // Create enhanced estimation prompt
    const enhancedPrompt = `You are a senior software engineering manager. Analyze the following tickets and provide estimates and categorization.

For each ticket:
1. Estimate in DAYS for a Senior Software Engineer (1 day = 8 hours)
2. Categorize as: FE (frontend), BE (backend), or FULLSTACK
3. Base your estimate on complexity, dependencies, and scope

Return a JSON array:
[
  {
    "title": "Ticket title",
    "estimateDays": 2.5,
    "category": "FE" | "BE" | "FULLSTACK"
  }
]

Tickets:
${JSON.stringify(ticketsForEstimation, null, 2)}

Return ONLY valid JSON array.`;

    // Call LLM for estimation
    const { llm } = await import('@/lib/llm');
    const response = await llm.invoke(enhancedPrompt);
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const estimates = JSON.parse(jsonStr) as Array<{ title: string; estimateDays: number; category: string }>;

    console.log(`✅ [ESTIMATE-ASSIGN] Generated ${estimates.length} estimates`);

    // Find the project folder
    const foldersResponse = await fetch(`${CLICKUP_API_BASE}/space/${clickupSpaceId}/folder`, {
      headers: { Authorization: clickupToken },
    });
    const foldersData = foldersResponse.ok ? await foldersResponse.json() : { folders: [] };
    const projectFolder = foldersData.folders?.find((f: any) => f.name === project.title);

    if (!projectFolder) {
      console.warn(`⚠️ [ESTIMATE-ASSIGN] No folder found for project: ${project.title}`);
      // Update local DB only
      for (let i = 0; i < run.tickets.length; i++) {
        const ticket = run.tickets[i];
        const estimate = estimates[i];
        if (estimate) {
          const estimateHours = Math.round(estimate.estimateDays * 8);
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              estimateHours,
              tshirtSize: estimateHours <= 8 ? 'S' : estimateHours <= 16 ? 'M' : estimateHours <= 24 ? 'L' : 'XL',
            },
          });
        }
      }
      return NextResponse.json({ success: true, message: 'Updated local database (no ClickUp folder found)' });
    }

    // Get all lists in the folder
    const listsResponse = await fetch(`${CLICKUP_API_BASE}/folder/${projectFolder.id}/list`, {
      headers: { Authorization: clickupToken },
    });
    const listsData = listsResponse.ok ? await listsResponse.json() : { lists: [] };
    const lists = listsData.lists || [];

    // Group tickets by sprint
    const ticketsBySprint: Record<number, typeof run.tickets> = {};
    for (const ticket of run.tickets) {
      const sprint = ticket.sprint ?? 1;
      if (!ticketsBySprint[sprint]) {
        ticketsBySprint[sprint] = [];
      }
      ticketsBySprint[sprint].push(ticket);
    }

    // Update each sprint list
    const results: any[] = [];
    for (const [sprintNum, sprintTickets] of Object.entries(ticketsBySprint)) {
      const sprint = parseInt(sprintNum);
      const sprintList = lists.find((l: any) => l.name === `Sprint ${sprint}`);

      if (!sprintList) continue;

      // Fetch members for this list
      const membersResponse = await fetch(`${CLICKUP_API_BASE}/list/${sprintList.id}/member`, {
        headers: { Authorization: clickupToken },
      });
      const membersData = membersResponse.ok ? await membersResponse.json() : { members: [] };
      const members: ClickUpUser[] = membersData.members || [];

      // Separate FE and BE members
      const feMembers = members.filter((m) =>
        m.username?.toLowerCase().includes('fe') ||
        m.username?.toLowerCase().includes('frontend') ||
        m.email?.toLowerCase().includes('fe') ||
        m.email?.toLowerCase().includes('frontend')
      );
      const beMembers = members.filter((m) =>
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

      for (const ticket of sprintTickets) {
        const estimate = estimates.find((e) => e.title === ticket.title) || estimates[0];
        if (!estimate) continue;

        const category = (estimate.category as 'FE' | 'BE' | 'FULLSTACK') || 'FULLSTACK';
        const estimateHours = Math.round(estimate.estimateDays * 8);

        // Assign assignee
        let assigneeId: string | undefined;
        if (category === 'FE' && effectiveFeMembers.length > 0) {
          assigneeId = effectiveFeMembers[feIndex % effectiveFeMembers.length].id;
          feIndex++;
        } else if (category === 'BE' && effectiveBeMembers.length > 0) {
          assigneeId = effectiveBeMembers[beIndex % effectiveBeMembers.length].id;
          beIndex++;
        } else if (members.length > 0) {
          assigneeId = members[(feIndex + beIndex) % members.length].id;
        }

        // Update local DB
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            estimateHours,
            tshirtSize: estimateHours <= 8 ? 'S' : estimateHours <= 16 ? 'M' : estimateHours <= 24 ? 'L' : 'XL',
          },
        });

        results.push({
          ticketId: ticket.id,
          title: ticket.title,
          sprint,
          estimateDays: estimate.estimateDays,
          category,
          assigneeId,
        });

        // Update ClickUp task
        if (ticket.id && assigneeId) {
          try {
            await fetch(`${CLICKUP_API_BASE}/task/${ticket.id}`, {
              method: 'PUT',
              headers: {
                Authorization: clickupToken,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                time_estimate: estimateHours * 60 * 60 * 1000,
                assignees: [assigneeId],
              }),
            });
          } catch (e) {
            console.error(`Failed to update ClickUp task: ${ticket.title}`);
          }
        }
      }
    }

    // Summary
    const feTickets = results.filter((r) => r.category === 'FE').length;
    const beTickets = results.filter((r) => r.category === 'BE').length;
    const fullstackTickets = results.filter((r) => r.category === 'FULLSTACK').length;

    return NextResponse.json({
      success: true,
      totalTickets: results.length,
      feTickets,
      beTickets,
      fullstackTickets,
      results,
    });
  } catch (error) {
    console.error('❌ [ESTIMATE-ASSIGN] Error:', error);
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
