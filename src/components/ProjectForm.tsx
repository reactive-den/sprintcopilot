'use client';

import { useState, useEffect } from 'react';
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

const LOADING_MESSAGES = [
  { icon: '🚀', text: 'Initializing AI Sprint Planner...', color: 'from-blue-400 to-blue-600' },
  { icon: '🎯', text: 'Analyzing your requirements...', color: 'from-purple-400 to-purple-600' },
  { icon: '🏗️', text: 'Crafting high-level architecture...', color: 'from-indigo-400 to-indigo-600' },
  { icon: '✂️', text: 'Breaking down into user stories...', color: 'from-pink-400 to-pink-600' },
  { icon: '📊', text: 'Estimating effort and complexity...', color: 'from-orange-400 to-orange-600' },
  { icon: '🎨', text: 'Prioritizing and scheduling...', color: 'from-green-400 to-green-600' },
  { icon: '✨', text: 'Finalizing your sprint plan...', color: 'from-indigo-400 to-purple-600' },
];

export function ProjectForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

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
      try {
        // Create a run immediately
        const runResponse = await fetch('/api/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: data.project.id }),
        });

        if (!runResponse.ok) {
          const errorData = await runResponse.json();
          throw new Error(errorData.error || 'Failed to start pipeline');
        }

        const runData = await runResponse.json();
        router.push(`/projects/${data.project.id}?runId=${runData.run.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start pipeline');
        // Still navigate to project page even if run creation fails
        router.push(`/projects/${data.project.id}`);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    setError(null);
    createProject.mutate(data);
  };

  // Rotate loading messages
  useEffect(() => {
    if (!createProject.isPending) return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [createProject.isPending]);

  // Generate particles for loading animation
  useEffect(() => {
    if (!createProject.isPending) return;

    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [createProject.isPending]);

  const currentMessage = LOADING_MESSAGES[loadingMessageIndex];

  // Full-screen loading overlay
  if (createProject.isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-3 h-3 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 animate-float"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />

        {/* Main Content */}
        <div className="relative z-10 text-center px-4 max-w-2xl">
          {/* Animated Icon Container */}
          <div className="relative mb-8 flex justify-center">
            {/* Pulsing Rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 animate-ping" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-30 animate-pulse" />
            </div>

            {/* Main Icon */}
            <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${currentMessage.color} flex items-center justify-center shadow-2xl animate-bounce-slow`}>
              <span className="text-6xl filter drop-shadow-lg animate-pulse-slow">
                {currentMessage.icon}
              </span>
            </div>
          </div>

          {/* Loading Message */}
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-4 animate-fade-in">
            {currentMessage.text}
          </h2>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {LOADING_MESSAGES.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === loadingMessageIndex
                    ? 'w-8 bg-gradient-to-r from-indigo-500 to-purple-500'
                    : index < loadingMessageIndex
                      ? 'w-2 bg-green-400'
                      : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Animated Progress Bar */}
          <div className="relative w-full max-w-md mx-auto h-3 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-fast" />
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentMessage.color} rounded-full transition-all duration-1000 ease-out shadow-lg`}
              style={{ width: `${((loadingMessageIndex + 1) / LOADING_MESSAGES.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast" />
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Fun Loading Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-600 animate-pulse">
              AI is working its magic
            </span>
          </div>

          {/* Subtle hint */}
          <p className="mt-8 text-sm text-gray-500 animate-fade-in">
            This usually takes 30-60 seconds...
          </p>
        </div>
      </div>
    );
  }

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
