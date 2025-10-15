'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRun } from '@/hooks/useRun';
import { useExport } from '@/hooks/useExport';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Initializing...',
  CLARIFYING: 'Clarifying Requirements',
  DRAFTING_HLD: 'Drafting High-Level Design',
  SLICING_TICKETS: 'Creating User Stories',
  ESTIMATING: 'Estimating Effort',
  PRIORITIZING: 'Prioritizing & Scheduling',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const STATUS_ICONS: Record<string, string> = {
  PENDING: '⏳',
  CLARIFYING: '🎯',
  DRAFTING_HLD: '🏗️',
  SLICING_TICKETS: '✂️',
  ESTIMATING: '📊',
  PRIORITIZING: '🎨',
  COMPLETED: '✅',
  FAILED: '❌',
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  const [activeRunId, setActiveRunId] = useState(runId);

  const { data: run, isLoading, error } = useRun(activeRunId || undefined);
  const { exportCSV, exportJira } = useExport();

  useEffect(() => {
    if (runId && !activeRunId) {
      setActiveRunId(runId);
    }
  }, [runId, activeRunId]);

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
  const progress = getProgress(run.status);

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
                <h1 className="text-4xl font-black text-gray-900">
                  {run.project.title}
                </h1>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">{run.project.problem}</p>
            </div>
          </div>
          
          {/* Progress Section */}
          {isProcessing && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">{STATUS_ICONS[run.status]}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Stage</p>
                    <p className="text-lg font-bold text-gray-900">{STATUS_LABELS[run.status]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {progress}%
                  </p>
                </div>
              </div>
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {run.status === 'COMPLETED' && (
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => exportCSV(run.id, run.project.title)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => exportJira(run.id, run.project.title)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>🎫</span>
                <span>Export Jira JSON</span>
              </button>
            </div>
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
        {run.clarifications && (
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-blue-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Clarifications</h2>
            </div>
            
            {run.clarifications.questions && run.clarifications.questions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>❓</span>
                  <span>Key Questions</span>
                </h3>
                <div className="space-y-3">
                  {run.clarifications.questions.map((q: string, i: number) => (
                    <div key={i} className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-blue-600 font-bold">{i + 1}.</span>
                      <p className="text-gray-700 flex-1">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {run.clarifications.scope && (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Project Scope</span>
                </h3>
                <p className="text-gray-700 leading-relaxed">{run.clarifications.scope}</p>
              </div>
            )}
          </div>
        )}

        {/* HLD Card */}
        {run.hld && (
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-purple-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏗️</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">High-Level Design</h2>
            </div>
            
            {run.hld.modules && run.hld.modules.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>📦</span>
                  <span>System Modules</span>
                </h3>
                <div className="grid gap-3">
                  {run.hld.modules.map((m: string, i: number) => (
                    <div key={i} className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-300 transition-colors">
                      <p className="text-gray-700">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {run.hld.dataFlows && run.hld.dataFlows.length > 0 && (
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🔄</span>
                  <span>Data Flows</span>
                </h3>
                <div className="space-y-2">
                  {run.hld.dataFlows.map((f: string, i: number) => (
                    <p key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-purple-600">→</span>
                      <span className="flex-1">{f}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tickets Card */}
        {run.tickets && run.tickets.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-orange-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Sprint Tickets</h2>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
                <span className="text-sm font-bold text-orange-700">{run.tickets.length} tickets</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Size</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Hours</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Sprint</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {run.tickets.map((ticket: any) => (
                    <tr key={ticket.id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{ticket.title}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-sm">
                          {ticket.tshirtSize}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="font-semibold text-gray-700">{ticket.estimateHours}h</span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                          Sprint {ticket.sprint}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          ticket.priority >= 8 ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                          ticket.priority >= 5 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                          'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                        }`}>
                          P{ticket.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getProgress(status: string): number {
  const progressMap: Record<string, number> = {
    PENDING: 10,
    CLARIFYING: 25,
    DRAFTING_HLD: 45,
    SLICING_TICKETS: 65,
    ESTIMATING: 80,
    PRIORITIZING: 95,
    COMPLETED: 100,
    FAILED: 100,
  };
  return progressMap[status] || 0;
}
