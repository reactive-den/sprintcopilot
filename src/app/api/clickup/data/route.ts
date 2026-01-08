import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { AppError, handleApiError } from '@/lib/errors';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

export async function GET() {
  try {
    const clickupToken = env.CLICKUP_API_TOKEN;
    const clickupSpaceId = env.CLICKUP_SPACE_ID;

    if (!clickupToken || !clickupSpaceId) {
      throw new AppError(
        'ClickUp is not configured. Please set CLICKUP_API_TOKEN and CLICKUP_SPACE_ID.',
        400,
        'CONFIG_ERROR'
      );
    }

    // Fetch workspace teams
    const teamsResponse = await fetch(`${CLICKUP_API_BASE}/team`, {
      headers: { Authorization: clickupToken },
    });
    const teamsData = teamsResponse.ok ? await teamsResponse.json() : { teams: [] };

    // Fetch folders in the space
    const foldersResponse = await fetch(`${CLICKUP_API_BASE}/space/${clickupSpaceId}/folder`, {
      headers: { Authorization: clickupToken },
    });
    const foldersData = foldersResponse.ok ? await foldersResponse.json() : { folders: [] };

    // Fetch lists directly in the space (not in folders)
    const listsResponse = await fetch(`${CLICKUP_API_BASE}/space/${clickupSpaceId}/list`, {
      headers: { Authorization: clickupToken },
    });
    const listsData = listsResponse.ok ? await listsResponse.json() : { lists: [] };

    // Collect all folders with their lists
    const allFolders = foldersData.folders || [];

    // For each folder, fetch its lists if not already included
    const foldersWithLists = await Promise.all(
      allFolders.map(async (folder: any) => {
        const folderListsResponse = await fetch(`${CLICKUP_API_BASE}/folder/${folder.id}/list`, {
          headers: { Authorization: clickupToken },
        });
        const folderListsData = folderListsResponse.ok ? await folderListsResponse.json() : { lists: [] };
        return {
          ...folder,
          lists: folderListsData.lists || [],
        };
      })
    );

    // Map folders to projects format
    const projects = foldersWithLists.map((folder: any) => ({
      id: folder.id,
      title: folder.name,
      createdAt: new Date().toISOString(),
      folderId: folder.id,
    }));

    return NextResponse.json({
      teams: teamsData.teams || [],
      spaceId: clickupSpaceId,
      folders: foldersWithLists,
      lists: listsData.lists || [],
      projects,
    });
  } catch (error) {
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
