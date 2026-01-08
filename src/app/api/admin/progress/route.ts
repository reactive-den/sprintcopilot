import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ADMIN_PROGRESS_CHATBOT_PROMPT } from '@/lib/langgraph/prompts';
import { env } from '@/lib/env';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';
const DONE_STATUSES = new Set(['done', 'complete', 'closed']);

type ClickUpTask = {
  id: string;
  name: string;
  status?: { status?: string };
  due_date?: string | number | null;
  assignee?: { id: string; username?: string; email?: string } | null;
  assignees?: Array<{ id: string; username?: string; email?: string }>;
};

type ClickUpList = {
  id: string;
  name: string;
};

type ProgressBucket = {
  total: number;
  done: number;
  blocked: number;
  overdue: number;
  donePercent: number;
  statusCounts: Record<string, number>;
};

type ProgressContext = {
  projectId: string;
  generatedAt: string;
  totals: {
    totalTasks: number;
    doneTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    donePercent: number;
    statusCounts: Record<string, number>;
  };
  sprints: Array<{
    sprintName: string;
    total: number;
    done: number;
    blocked: number;
    overdue: number;
    donePercent: number;
    statusCounts: Record<string, number>;
  }>;
  assignees: Array<{
    assigneeName: string;
    assigneeIdentifiers: string[];
    total: number;
    done: number;
    blocked: number;
    overdue: number;
    donePercent: number;
    statusCounts: Record<string, number>;
  }>;
};

async function fetchClickUpJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: token },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ClickUp API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

function getTaskStatus(task: ClickUpTask): string {
  return (task.status?.status || '').toLowerCase();
}

function isTaskDone(status: string): boolean {
  return DONE_STATUSES.has(status);
}

function isTaskBlocked(status: string): boolean {
  return status === 'blocked';
}

function isTaskOverdue(task: ClickUpTask, nowMs: number): boolean {
  if (!task.due_date) return false;
  const dueMs = typeof task.due_date === 'string' ? Number(task.due_date) : task.due_date;
  if (!dueMs) return false;
  return dueMs < nowMs;
}

function toPercent(done: number, total: number): number {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function updateBucket(bucket: ProgressBucket, status: string, overdue: boolean) {
  bucket.total += 1;
  if (isTaskDone(status)) bucket.done += 1;
  if (isTaskBlocked(status)) bucket.blocked += 1;
  if (overdue) bucket.overdue += 1;
  if (status) {
    bucket.statusCounts[status] = (bucket.statusCounts[status] || 0) + 1;
  } else {
    bucket.statusCounts.unknown = (bucket.statusCounts.unknown || 0) + 1;
  }
}

function finalizeBucket(bucket: ProgressBucket) {
  bucket.donePercent = toPercent(bucket.done, bucket.total);
}

function buildProgressContext(
  projectId: string,
  lists: ClickUpList[],
  tasksByList: Map<string, ClickUpTask[]>
): ProgressContext {
  const nowMs = Date.now();
  const totals: ProgressBucket = {
    total: 0,
    done: 0,
    blocked: 0,
    overdue: 0,
    donePercent: 0,
    statusCounts: {},
  };

  const sprintBuckets = new Map<string, ProgressBucket>();
  const assigneeBuckets = new Map<string, ProgressBucket>();
  const assigneeIdentifiers = new Map<string, Set<string>>();

  for (const list of lists) {
    const listTasks = tasksByList.get(list.id) || [];
    if (!sprintBuckets.has(list.name)) {
      sprintBuckets.set(list.name, {
        total: 0,
        done: 0,
        blocked: 0,
        overdue: 0,
        donePercent: 0,
        statusCounts: {},
      });
    }

    for (const task of listTasks) {
      const status = getTaskStatus(task);
      const overdue = isTaskOverdue(task, nowMs);
      updateBucket(totals, status, overdue);
      const sprintBucket = sprintBuckets.get(list.name);
      if (sprintBucket) updateBucket(sprintBucket, status, overdue);

      const assignees = task.assignees && task.assignees.length > 0
        ? task.assignees
        : task.assignee
          ? [task.assignee]
          : [];

      if (assignees.length === 0) {
        const unassigned = 'Unassigned';
        if (!assigneeBuckets.has(unassigned)) {
          assigneeBuckets.set(unassigned, {
            total: 0,
            done: 0,
            blocked: 0,
            overdue: 0,
            donePercent: 0,
            statusCounts: {},
          });
          assigneeIdentifiers.set(unassigned, new Set([unassigned]));
        }
        const bucket = assigneeBuckets.get(unassigned);
        if (bucket) updateBucket(bucket, status, overdue);
      } else {
        for (const assignee of assignees) {
          const assigneeName = assignee.username || assignee.email || assignee.id;
          if (!assigneeBuckets.has(assigneeName)) {
            assigneeBuckets.set(assigneeName, {
              total: 0,
              done: 0,
              blocked: 0,
              overdue: 0,
              donePercent: 0,
              statusCounts: {},
            });
            assigneeIdentifiers.set(assigneeName, new Set());
          }
          const identifierSet = assigneeIdentifiers.get(assigneeName);
          if (identifierSet) {
            identifierSet.add(assigneeName);
            if (assignee.username) identifierSet.add(assignee.username);
            if (assignee.email) identifierSet.add(assignee.email);
            identifierSet.add(assignee.id);
          }
          const bucket = assigneeBuckets.get(assigneeName);
          if (bucket) updateBucket(bucket, status, overdue);
        }
      }
    }
  }

  finalizeBucket(totals);
  for (const bucket of sprintBuckets.values()) finalizeBucket(bucket);
  for (const bucket of assigneeBuckets.values()) finalizeBucket(bucket);

  return {
    projectId,
    generatedAt: new Date().toISOString(),
    totals: {
      totalTasks: totals.total,
      doneTasks: totals.done,
      blockedTasks: totals.blocked,
      overdueTasks: totals.overdue,
      donePercent: totals.donePercent,
      statusCounts: totals.statusCounts,
    },
    sprints: Array.from(sprintBuckets.entries()).map(([sprintName, bucket]) => ({
      sprintName,
      total: bucket.total,
      done: bucket.done,
      blocked: bucket.blocked,
      overdue: bucket.overdue,
      donePercent: bucket.donePercent,
      statusCounts: bucket.statusCounts,
    })),
    assignees: Array.from(assigneeBuckets.entries()).map(([assigneeName, bucket]) => ({
      assigneeName,
      assigneeIdentifiers: Array.from(assigneeIdentifiers.get(assigneeName) || [assigneeName]),
      total: bucket.total,
      done: bucket.done,
      blocked: bucket.blocked,
      overdue: bucket.overdue,
      donePercent: bucket.donePercent,
      statusCounts: bucket.statusCounts,
    })),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = body?.projectId;
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    if (!env.CLICKUP_API_TOKEN) {
      return NextResponse.json({ error: 'ClickUp API token is not configured' }, { status: 500 });
    }

    const listsResponse = await fetchClickUpJson<{ lists: ClickUpList[] }>(
      `${CLICKUP_API_BASE}/folder/${projectId}/list`,
      env.CLICKUP_API_TOKEN
    );

    const lists = listsResponse.lists || [];
    const tasksByList = new Map<string, ClickUpTask[]>();

    for (const list of lists) {
      const tasksResponse = await fetchClickUpJson<{ tasks: ClickUpTask[] }>(
        `${CLICKUP_API_BASE}/list/${list.id}/task?include_closed=true`,
        env.CLICKUP_API_TOKEN
      );
      tasksByList.set(list.id, tasksResponse.tasks || []);
    }

    const progressContext = buildProgressContext(projectId, lists, tasksByList);

    const llm = new ChatOpenAI({
      modelName: env.OPENAI_MODEL,
      temperature: 0.3,
      maxTokens: env.OPENAI_MAX_TOKENS,
      openAIApiKey: env.OPENAI_API_KEY,
      timeout: 60000,
      maxRetries: 3,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://sprintcopilot.app',
          'X-Title': 'SprintCopilot',
        },
      },
    });

    const chatMessages = [
      new SystemMessage(ADMIN_PROGRESS_CHATBOT_PROMPT),
      new SystemMessage(
        `Project context (source of truth): ${JSON.stringify(progressContext)}`
      ),
      ...messages.map((message: { role: string; content: string }) => {
        if (message.role === 'assistant') {
          return new AIMessage(message.content);
        }
        return new HumanMessage(message.content);
      }),
    ];

    const response = await llm.invoke(chatMessages);
    let reply = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    reply = reply.trim();
    if (progressContext.totals.blockedTasks === 0 && progressContext.totals.overdueTasks === 0) {
      reply = reply.replace(/\n?\s*Next Actions:[\s\S]*$/i, '').trim();
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('❌ [ADMIN-PROGRESS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ClickUp data or generate response' },
      { status: 500 }
    );
  }
}
