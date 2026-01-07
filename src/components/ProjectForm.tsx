'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';

const projectSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  problem: z.string().min(50, 'Problem statement must be at least 50 characters'),
  constraints: z.string().optional(),
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
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
          Feature Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white placeholder:text-gray-500 text-gray-900"
          placeholder="e.g., User Authentication System"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span> {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="problem" className="block text-sm font-semibold text-gray-700">
          Problem Statement *
        </label>
        <textarea
          id="problem"
          {...register('problem')}
          rows={6}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none placeholder:text-gray-500 text-gray-900"
          placeholder="Describe the problem you're trying to solve and the desired outcome..."
        />
        {errors.problem && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span> {errors.problem.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="constraints" className="block text-sm font-semibold text-gray-700">
          Constraints <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <textarea
          id="constraints"
          {...register('constraints')}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none placeholder:text-gray-500 text-gray-900"
          placeholder="Any technical constraints, deadlines, or requirements..."
        />
        {errors.constraints && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span> {errors.constraints.message}
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
          <span className="text-xl">❌</span>
          <p className="text-sm text-red-600 flex-1">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={createProject.isPending}
        className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {createProject.isPending ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Creating Magic...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Generate Sprint Plan</span>
            <span>→</span>
          </>
        )}
      </button>
    </form>
  );
}
