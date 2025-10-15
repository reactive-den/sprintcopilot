import { useQuery } from '@tanstack/react-query';

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
  clarifications?: any;
  hld?: any;
  tokensUsed: number;
  durationMs?: number;
  errorMessage?: string;
  createdAt: string;
  tickets: Ticket[];
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  estimateHours?: number;
  tshirtSize?: string;
  priority: number;
  sprint?: number;
  status: string;
  dependencies: string[];
  tags: string[];
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
