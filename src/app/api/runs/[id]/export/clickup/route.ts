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
    const { id } = await params;

    const clickupToken = env.CLICKUP_API_TOKEN;
    const clickupListId = env.CLICKUP_LIST_ID;

    if (!clickupToken || !clickupListId) {
      throw new AppError(
        'ClickUp is not configured. Please set CLICKUP_API_TOKEN and CLICKUP_LIST_ID.',
        400,
        'CONFIG_ERROR'
      );
    }

    const run = await prisma.run.findUnique({
      where: { id },
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

    const created: Array<{ id: string; name: string; url?: string }> = [];
    const failed: Array<{ title: string; error: string }> = [];

    for (const ticket of run.tickets) {
      const payload = {
        name: ticket.title,
        description: buildDescription(ticket, run.project.title),
        tags: ticket.tags,
        priority: mapPriority(ticket.priority),
        time_estimate: ticket.estimateHours ? ticket.estimateHours * 60 * 60 * 1000 : undefined,
      };

      const response = await fetch(`${CLICKUP_API_BASE}/list/${clickupListId}/task`, {
        method: 'POST',
        headers: {
          Authorization: clickupToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        failed.push({
          title: ticket.title,
          error: errorText || response.statusText,
        });
        continue;
      }

      const task = await response.json();
      created.push({ id: task.id, name: task.name, url: task.url });
    }

    if (created.length === 0) {
      throw new AppError('Failed to create ClickUp tasks. Please check your ClickUp settings.', 502, 'CLICKUP_ERROR');
    }

    return NextResponse.json({
      created,
      failed,
      total: run.tickets.length,
      listId: clickupListId,
    });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
