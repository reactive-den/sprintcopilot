import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { AppError, handleApiError } from '@/lib/errors';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;
    const body = await request.json();
    const { sprintNumber } = body;

    const clickupToken = env.CLICKUP_API_TOKEN;

    if (!clickupToken) {
      throw new AppError(
        'ClickUp is not configured. Please set CLICKUP_API_TOKEN.',
        400,
        'CONFIG_ERROR'
      );
    }

    if (!sprintNumber || typeof sprintNumber !== 'number') {
      throw new AppError('Sprint number is required', 400, 'VALIDATION_ERROR');
    }

    // Fetch existing lists to determine the next sprint number if not provided
    const listsResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folderId}/list`, {
      headers: { Authorization: clickupToken },
    });

    if (!listsResponse.ok) {
      const errorText = await listsResponse.text();
      throw new AppError(`Failed to fetch folder lists: ${errorText}`, 500, 'CLICKUP_ERROR');
    }

    const listsData = await listsResponse.json();
    const existingLists = listsData.lists || [];

    // Create the sprint list
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

    const newList = await createListResponse.json();

    console.log(`✅ [CLICKUP] Created sprint list: ${sprintName} (${newList.id})`);

    return NextResponse.json({
      success: true,
      list: newList,
      sprintNumber,
      message: `Successfully created ${sprintName}`,
    });
  } catch (error) {
    const errorResponse = handleApiError(
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
