'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRun } from '@/hooks/useRun';
import { useExport } from '@/hooks/useExport';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { ClarificationsCard } from '@/components/ClarificationsCard';
import { HLDCard } from '@/components/HLDCard';
import { TicketsTable } from '@/components/TicketsTable';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  const [activeRunId, setActiveRunId] = useState(runId);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { data: run, isLoading, error } = useRun(activeRunId || undefined);
  const { exportCSV, createClickUpTasks, isExporting, exportError } = useExport();

  useEffect(() => {
    if (runId && !activeRunId) {
      setActiveRunId(runId);
    }
  }, [runId, activeRunId]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700">Loading your project...</p>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <div className="text-6xl mb-4 text-center">😞</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2 text-center">Oops!</h2>
          <p className="text-gray-600 text-center">{error?.message || 'Run not found'}</p>
        </div>
      </div>
    );
  }

  const isProcessing = run.status !== 'COMPLETED' && run.status !== 'FAILED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-indigo-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900">{run.project.title}</h1>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">{run.project.problem}</p>
            </div>
          </div>

          {/* Progress Section */}
          {isProcessing && <ProgressIndicator status={run.status} />}

          {/* Action Buttons */}
          {run.status === 'COMPLETED' && (
            <>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                {sessionId && (
                  <button
                    onClick={() => router.push(`/projects/${projectId}/business-document/${sessionId}`)}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>📄</span>
                    <span>View Business Document</span>
                  </button>
                )}
                <button
                  onClick={() => exportCSV(run.id, run.project.title)}
                  disabled={isExporting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      <span>Export CSV</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => createClickUpTasks(run.id)}
                  disabled={isExporting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>Create ClickUp Tasks</span>
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
            </>
          )}

          {run.status === 'FAILED' && (
            <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-4">
              <span className="text-3xl">❌</span>
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-1">Pipeline Failed</p>
                <p className="text-sm text-red-600">{run.errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Clarifications Card */}
        {run.clarifications && <ClarificationsCard clarifications={run.clarifications} className="mb-8" />}

        {/* HLD Card */}
        {run.hld && <HLDCard hld={run.hld} className="mb-8" />}

        {/* Tickets Card */}
        {run.tickets && run.tickets.length > 0 && <TicketsTable tickets={run.tickets} />}
      </div>
    </div>
  );
}
