import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface CreateRunInput {
  projectId: string;
}

interface Run {
  id: string;
  projectId: string;
  status: string;
  clarifications?: any;
  hld?: any;
  tokensUsed: number;
  durationMs?: number;
  errorMessage?: string;
  createdAt: string;
  tickets: any[];
  project: {
    id: string;
    title: string;
    problem: string;
    constraints?: string;
  };
}

export function useCreateRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRunInput) => {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create run');
      }

      const data = await response.json();
      return data.run;
    },
    onSuccess: (data) => {
      // Invalidate project queries to refetch with new run
      queryClient.invalidateQueries({ queryKey: ['project', data.projectId] });
    },
  });
}

export function useRun(runId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: async () => {
      if (!runId) throw new Error('Run ID is required');

      const response = await fetch(`/api/runs/${runId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch run');
      }
      const data = await response.json();
      return data.run as Run;
    },
    enabled: !!runId && (options?.enabled !== false),
    refetchInterval: (query) => {
      const run = query.state.data;
      // Poll every 2 seconds if run is in progress
      if (run && run.status !== 'COMPLETED' && run.status !== 'FAILED') {
        return 2000;
      }
      return false;
    },
  });
}
