'use client';

import { ClarifierChat } from '@/components/ClarifierChat';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, Loader2, Sparkles } from 'lucide-react';

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
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
          <p className="text-sm font-semibold text-[color:var(--color-text)]">
            Initializing clarifier session...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[color:rgba(185,28,28,0.3)] bg-[color:var(--color-surface)] p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(185,28,28,0.1)]">
            <AlertTriangle className="h-5 w-5 text-[color:var(--color-danger)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">Unable to load</h2>
          <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 h-11 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => router.push('/')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:text-[color:rgba(15,23,42,0.7)]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
          <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:rgba(37,99,235,0.12)]">
                <Sparkles className="h-5 w-5 text-[color:var(--color-primary)]" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">
                  Feature clarification
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[color:rgba(15,23,42,0.7)]">
                  Answer a few targeted questions so we can lock scope and generate a precise sprint
                  plan.
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
