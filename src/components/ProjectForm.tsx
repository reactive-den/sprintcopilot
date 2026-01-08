'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  problem: z.string().min(50, 'Problem statement must be at least 50 characters'),
  constraints: z.string().optional(),
  repoUrl: z
    .union([z.string().url('Please enter a valid URL'), z.literal(''), z.undefined()])
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function ProjectForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const createProject = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      // Redirect to clarifier chat instead of directly creating a run
      router.push(`/projects/${data.project.id}/clarify`);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    setError(null);
    createProject.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-semibold text-[color:var(--color-text)]">
          Feature Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className="w-full h-11 px-4 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] text-sm text-[color:var(--color-text)] transition focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)] placeholder:text-[color:rgba(15,23,42,0.5)]"
          placeholder="e.g., User Authentication System"
        />
        {errors.title && (
          <p className="mt-1 flex items-center gap-2 text-xs text-[color:var(--color-danger)]">
            <AlertCircle className="h-4 w-4" />
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="problem" className="block text-sm font-semibold text-[color:var(--color-text)]">
          Problem Statement *
        </label>
        <textarea
          id="problem"
          {...register('problem')}
          rows={6}
          className="w-full min-h-[132px] px-4 py-3 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] text-sm text-[color:var(--color-text)] transition focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)] resize-none placeholder:text-[color:rgba(15,23,42,0.5)]"
          placeholder="Describe the problem you're trying to solve and the desired outcome..."
        />
        {errors.problem && (
          <p className="mt-1 flex items-center gap-2 text-xs text-[color:var(--color-danger)]">
            <AlertCircle className="h-4 w-4" />
            {errors.problem.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="constraints" className="block text-sm font-semibold text-[color:var(--color-text)]">
          Constraints <span className="font-normal text-[color:rgba(15,23,42,0.55)]">(Optional)</span>
        </label>
        <textarea
          id="constraints"
          {...register('constraints')}
          rows={4}
          className="w-full min-h-[110px] px-4 py-3 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] text-sm text-[color:var(--color-text)] transition focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)] resize-none placeholder:text-[color:rgba(15,23,42,0.5)]"
          placeholder="Any technical constraints, deadlines, or requirements..."
        />
        {errors.constraints && (
          <p className="mt-1 flex items-center gap-2 text-xs text-[color:var(--color-danger)]">
            <AlertCircle className="h-4 w-4" />
            {errors.constraints.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="repoUrl" className="block text-sm font-semibold text-[color:var(--color-text)]">
          Repository URL <span className="font-normal text-[color:rgba(15,23,42,0.55)]">(Optional)</span>
        </label>
        <input
          id="repoUrl"
          type="url"
          {...register('repoUrl')}
          className="w-full h-11 px-4 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] text-sm text-[color:var(--color-text)] transition focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)] placeholder:text-[color:rgba(15,23,42,0.5)]"
          placeholder="https://github.com/owner/repo"
        />
        {errors.repoUrl && (
          <p className="mt-1 flex items-center gap-2 text-xs text-[color:var(--color-danger)]">
            <AlertCircle className="h-4 w-4" />
            {errors.repoUrl.message}
          </p>
        )}
        <p className="mt-1 text-xs text-[color:rgba(15,23,42,0.6)]">
          Optional: Provide a GitHub repository URL for additional context when generating tickets.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-[color:rgba(185,28,28,0.3)] bg-[color:rgba(185,28,28,0.08)] p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 text-[color:var(--color-danger)]" />
          <p className="text-sm text-[color:var(--color-danger)]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={createProject.isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {createProject.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Creating project...</span>
          </>
        ) : (
          <>
            <span>Generate sprint plan</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
