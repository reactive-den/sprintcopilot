'use client';

import { ClarifierChat } from '@/components/ClarifierChat';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';

export default function ClarifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async () => {
    try {
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Failed to load project');
      }
      const { project } = await projectResponse.json();

      // Create clarifier session
      const sessionResponse = await fetch('/api/clarifier/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          idea: project.title,
          context: project.problem,
          constraints: project.constraints,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to create clarifier session');
      }

      const { session } = await sessionResponse.json();
      setSessionId(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize clarifier');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    createSession();
  }, [createSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Initializing clarifier session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-center">
            <span className="text-4xl mb-4 block">❌</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 hover:text-indigo-700 font-semibold mb-6 flex items-center gap-2 transition-colors group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Home</span>
          </button>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">✨</span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Feature Clarification
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Let&apos;s work together to understand your feature requirements. I&apos;ll ask
                  you thoughtful questions one at a time to ensure we capture everything needed for
                  your sprint plan.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <ClarifierChat sessionId={sessionId} projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
