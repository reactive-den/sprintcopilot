'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRun } from '@/hooks/useRun';
import { useProject } from '@/hooks/useProject';
import { useExport } from '@/hooks/useExport';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { ClarificationsCard } from '@/components/ClarificationsCard';
import { HLDCard } from '@/components/HLDCard';
import { TicketsTable } from '@/components/TicketsTable';
import { RepoAnalysisCard } from '@/components/RepoAnalysisCard';
import {
  AlertTriangle,
  Calculator,
  Compass,
  FileText,
  FolderKanban,
  LayoutList,
  Loader2,
  UploadCloud,
} from 'lucide-react';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  const [activeRunId, setActiveRunId] = useState(runId);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: run, isLoading, error } = useRun(activeRunId || undefined);
  const { createClickUpTasks, isExporting, exportError } = useExport();
  const repoSectionRef = useRef<HTMLDivElement | null>(null);
  const [showRepoDetails, setShowRepoDetails] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('showRepoDetails') === 'true';
    }
    return false;
  });
  const [isEstimating, setIsEstimating] = useState(false);

  useEffect(() => {
    if (runId && !activeRunId) {
      setActiveRunId(runId);
    }
  }, [runId, activeRunId]);

  useEffect(() => {
    if (!activeRunId && project?.runs?.length) {
      setActiveRunId(project.runs[0].id);
    }
  }, [activeRunId, project]);

  // Load latest session for business document
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/sessions`);
        if (response.ok) {
          const { session } = await response.json();
          if (session) {
            setSessionId(session.id);
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };
    loadSession();
  }, [projectId]);

  const handleEstimateTickets = async () => {
    if (!run?.id) return;

    if (!confirm('Estimate all tickets using AI? This will update existing estimates.')) {
      return;
    }

    setIsEstimating(true);

    try {
      const response = await fetch(`/api/runs/${run.id}/estimate`, {
        method: 'POST',
      });

      if (response.ok) {
        const { ticketsUpdated } = await response.json();
        alert(`Successfully estimated ${ticketsUpdated} tickets!`);
        // Refresh the run data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to estimate tickets');
      }
    } catch (error) {
      console.error('Failed to estimate tickets:', error);
      alert('Failed to estimate tickets. Please try again.');
    } finally {
      setIsEstimating(false);
    }
  };

  if (isProjectLoading || (isLoading && activeRunId)) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-primary)] mx-auto" />
          <p className="text-sm font-semibold text-[color:var(--color-text)]">Loading your project...</p>
        </div>
      </div>
    );
  }

  if (!activeRunId && project && project.runs.length === 0) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(37,99,235,0.12)]">
            <FolderKanban className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">No runs yet</h2>
          <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
            Start a clarifier session to generate your first repo analysis and HLD.
          </p>
          <button
            onClick={() => router.push(`/projects/${projectId}/clarify`)}
            className="mt-6 h-11 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Start clarifier
          </button>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[color:rgba(185,28,28,0.3)] bg-[color:var(--color-surface)] p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(185,28,28,0.1)]">
            <AlertTriangle className="h-5 w-5 text-[color:var(--color-danger)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[color:var(--color-danger)]">Run unavailable</h2>
          <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
            {error?.message || 'Run not found'}
          </p>
        </div>
      </div>
    );
  }

  const isProcessing = run.status !== 'COMPLETED' && run.status !== 'FAILED';

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      {/* Loading Overlay for ClickUp Export */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(15,23,42,0.4)]">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
            <h3 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">
              Creating ClickUp tasks
            </h3>
            <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
              Please wait while we create tasks in ClickUp.
            </p>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="mb-8 rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:rgba(37,99,235,0.12)]">
                  <FolderKanban className="h-5 w-5 text-[color:var(--color-primary)]" />
                </div>
                <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">
                  {run.project.title}
                </h1>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[color:rgba(15,23,42,0.7)]">
                {run.project.problem}
              </p>
            </div>
          </div>

          {/* Progress Section */}
          {isProcessing && <ProgressIndicator status={run.status} />}

          {/* Action Buttons */}
          {run.status === 'COMPLETED' && (
            <>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sessionId && (
                  <button
                    onClick={() => router.push(`/projects/${projectId}/business-document/${sessionId}`)}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)]"
                  >
                    <FileText className="h-4 w-4 text-[color:var(--color-primary)]" />
                    <span>Business document</span>
                  </button>
                )}
                {run.repoAnalysis && (
                  <button
                    onClick={() => {
                      router.push(`/projects/${projectId}?showRepoDetails=true`);
                    }}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)]"
                  >
                    <Compass className="h-4 w-4 text-[color:var(--color-primary)]" />
                    <span>Repo analysis</span>
                  </button>
                )}
                {sessionId && (
                  <button
                    onClick={() => router.push(`/projects/${projectId}/hdd/${sessionId}`)}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)]"
                  >
                    <LayoutList className="h-4 w-4 text-[color:var(--color-primary)]" />
                    <span>HLDs and LLDs</span>
                  </button>
                )}
                <button
                  onClick={() => createClickUpTasks(run.id)}
                  disabled={isExporting}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      <span>Create ClickUp tasks</span>
                    </>
                  )}
                </button>
                {run.tickets && run.tickets.length > 0 && (
                  <button
                    onClick={handleEstimateTickets}
                    disabled={isEstimating}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isEstimating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-primary)]" />
                        <span>Estimating...</span>
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 text-[color:var(--color-primary)]" />
                        <span>Estimate tickets</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {run.status === 'FAILED' && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[color:rgba(185,28,28,0.3)] bg-[color:rgba(185,28,28,0.06)] p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-[color:var(--color-danger)]" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[color:var(--color-danger)]">Pipeline failed</p>
                <p className="text-sm text-[color:rgba(15,23,42,0.7)]">{run.errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Clarifications Card */}
        {run.clarifications && <ClarificationsCard clarifications={run.clarifications} className="mb-8" />}

        {/* Repo Analysis Card */}
        {run.repoAnalysis && (
          <div ref={repoSectionRef}>
            <RepoAnalysisCard
              repoAnalysis={run.repoAnalysis}
              className="mb-8"
              isOpen={showRepoDetails}
              onToggle={() => setShowRepoDetails((prev) => !prev)}
            />
          </div>
        )}

        {/* HLD Card */}
        {run.hld && <HLDCard hld={run.hld} className="mb-8" />}

        {/* Tickets Card */}
        {run.tickets && run.tickets.length > 0 && <TicketsTable tickets={run.tickets} />}
      </div>
    </div>
  );
}
