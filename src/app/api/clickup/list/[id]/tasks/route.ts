import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { AppError, handleApiError } from '@/lib/errors';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;

    const clickupToken = env.CLICKUP_API_TOKEN;

    if (!clickupToken) {
      throw new AppError(
        'ClickUp is not configured. Please set CLICKUP_API_TOKEN.',
        400,
        'CONFIG_ERROR'
      );
    }

    // Fetch tasks from the list
    const response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task?include_closed=true`, {
      headers: { Authorization: clickupToken },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(`Failed to fetch tasks: ${errorText}`, 500, 'CLICKUP_ERROR');
    }

    const data = await response.json();

    return NextResponse.json({
      tasks: data.tasks || [],
    });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
