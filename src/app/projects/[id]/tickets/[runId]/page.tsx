'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRun } from '@/hooks/useRun';
import { useExport } from '@/hooks/useExport';
import { TicketsTable } from '@/components/TicketsTable';
import { AlertTriangle, ChevronLeft, Loader2, Ticket, UploadCloud } from 'lucide-react';

export default function TicketsPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id: projectId, runId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: run, isLoading, error } = useRun(runId);
  const { createClickUpTasks, isExporting, exportError } = useExport();
  const [sprintNumber, setSprintNumber] = useState<number | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isUploadingToSprint, setIsUploadingToSprint] = useState(false);

  useEffect(() => {
    const sprint = searchParams.get('sprintNumber');
    const folder = searchParams.get('folderId');
    if (sprint) setSprintNumber(parseInt(sprint, 10));
    if (folder) setFolderId(folder);
  }, [searchParams]);

  const handleCreateClickUpTasks = async () => {
    if (!run) return;
    
    const currentRun = run; // Store in local variable for TypeScript
    
    // If this is for a specific sprint, use the sprint upload endpoint
    if (sprintNumber && folderId) {
      setIsUploadingToSprint(true);
      try {
        const response = await fetch(`/api/clickup/folder/${folderId}/upload-sprint-tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            runId: currentRun.id,
            sprintNumber,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          alert(`Successfully uploaded ${data.ticketsCreated || 0} tickets to Sprint ${sprintNumber}.`);
          router.push('/admin');
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to upload tickets to sprint');
        }
      } catch (err) {
        console.error('Failed to upload tickets to sprint:', err);
        alert('Failed to upload tickets. Please try again.');
      } finally {
        setIsUploadingToSprint(false);
      }
    } else {
      // Regular flow - create all sprints
      try {
        const result = await createClickUpTasks(currentRun.id);
        // Redirect to global admin screen with ClickUp data
        if (result && result.created && result.created.length > 0) {
          router.push('/admin');
        }
      } catch (err) {
        // Error is handled by useExport hook
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
          <p className="text-sm font-semibold text-[color:var(--color-text)]">Loading tickets...</p>
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
          <h2 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">Run unavailable</h2>
          <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
            {error?.message || 'Run not found'}
          </p>
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mt-6 h-11 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Back to project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      {/* Loading Overlay */}
      {(isExporting || isUploadingToSprint) && (
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:rgba(37,99,235,0.12)]">
                  <Ticket className="h-5 w-5 text-[color:var(--color-primary)]" />
                </div>
                <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">Generated tickets</h1>
              </div>
              <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.7)]">
                {run.tickets?.length || 0} tickets generated for {run.project.title}
              </p>
            </div>
            <button
              onClick={handleCreateClickUpTasks}
              disabled={(isExporting || isUploadingToSprint) || !run.tickets?.length}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(isExporting || isUploadingToSprint) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{sprintNumber ? `Uploading to Sprint ${sprintNumber}...` : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>{sprintNumber ? `Upload to Sprint ${sprintNumber}` : 'Create ClickUp tasks'}</span>
                </>
              )}
            </button>
          </div>

          {exportError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-[color:rgba(185,28,28,0.3)] bg-[color:rgba(185,28,28,0.06)] p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-[color:var(--color-danger)]" />
              <p className="text-sm text-[color:var(--color-danger)]">{exportError}</p>
            </div>
          )}
        </div>

        {/* Back to Project */}
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:text-[color:rgba(15,23,42,0.7)]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Project</span>
        </button>

        {/* Tickets Table */}
        {run.tickets && run.tickets.length > 0 ? (
          <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-[color:var(--color-text)]">All tickets</h2>
            {sprintNumber && (
              <div className="mb-4 rounded-lg border border-[color:rgba(37,99,235,0.25)] bg-[color:rgba(37,99,235,0.08)] p-4">
                <p className="text-sm text-[color:var(--color-primary)]">
                  <span className="font-semibold">Sprint {sprintNumber}:</span> Review and edit ticket descriptions below, then click "Upload to Sprint {sprintNumber}" to create them in ClickUp.
                </p>
              </div>
            )}
            <TicketsTable tickets={run.tickets} />
          </div>
        ) : (
          <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(37,99,235,0.12)]">
              <Ticket className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">No tickets yet</h2>
            <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
              No tickets have been generated for this run.
            </p>
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="mt-6 h-11 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Back to project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
