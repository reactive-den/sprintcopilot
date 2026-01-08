'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRun } from '@/hooks/useRun';
import { useExport } from '@/hooks/useExport';
import { TicketsTable } from '@/components/TicketsTable';

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
          alert(`✅ Successfully uploaded ${data.ticketsCreated || 0} tickets to Sprint ${sprintNumber}!`);
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Oops!</h2>
          <p className="text-gray-600 text-center">{error?.message || 'Run not found'}</p>
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Loading Overlay */}
      {(isExporting || isUploadingToSprint) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Creating ClickUp Tasks</h3>
            <p className="text-gray-600 mb-4">
              Please wait while we create tasks in ClickUp...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-indigo-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900">Generated Tickets</h1>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {run.tickets?.length || 0} tickets generated for {run.project.title}
              </p>
            </div>
            <button
              onClick={handleCreateClickUpTasks}
              disabled={(isExporting || isUploadingToSprint) || !run.tickets?.length}
              className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {(isExporting || isUploadingToSprint) ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{sprintNumber ? `Uploading to Sprint ${sprintNumber}...` : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>{sprintNumber ? `Upload to Sprint ${sprintNumber}` : 'Create ClickUp Tasks'}</span>
                </>
              )}
            </button>
          </div>

          {exportError && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-red-600 flex-1">{exportError}</p>
            </div>
          )}
        </div>

        {/* Back to Project */}
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="text-indigo-600 hover:text-indigo-700 font-semibold mb-6 flex items-center gap-2 transition-colors group"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Project</span>
        </button>

        {/* Tickets Table */}
        {run.tickets && run.tickets.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Tickets</h2>
            {sprintNumber && (
              <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Sprint {sprintNumber}:</span> Review and edit ticket descriptions below, then click "Upload to Sprint {sprintNumber}" to create them in ClickUp.
                </p>
              </div>
            )}
            <TicketsTable tickets={run.tickets} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-12 border border-indigo-100 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Tickets Yet</h2>
            <p className="text-gray-600 mb-6">
              No tickets have been generated for this run.
            </p>
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold"
            >
              Back to Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
