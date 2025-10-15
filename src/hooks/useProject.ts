import { useQuery } from '@tanstack/react-query';
import type { Clarifications, HLD, Ticket } from '@/types';

interface Project {
  id: string;
  title: string;
  problem: string;
  constraints?: string;
  createdAt: string;
  runs: Run[];
}

interface Run {
  id: string;
  status: string;
  clarifications?: Clarifications;
  hld?: HLD;
  tokensUsed: number;
  durationMs?: number;
  errorMessage?: string;
  createdAt: string;
  tickets: Ticket[];
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      return data.project as Project;
    },
    enabled: !!projectId,
  });
}
