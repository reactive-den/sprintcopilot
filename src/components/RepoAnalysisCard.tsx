'use client';

import { useEffect, useState } from 'react';
import type { RepoAnalysis } from '@/types';

interface RepoAnalysisCardProps {
  repoAnalysis: RepoAnalysis;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function RepoAnalysisCard({
  repoAnalysis,
  className = '',
  isOpen,
  onToggle,
}: RepoAnalysisCardProps) {
  const [showDetails, setShowDetails] = useState(isOpen ?? false);
  const isAvailable = repoAnalysis.status === 'available';

  useEffect(() => {
    if (typeof isOpen === 'boolean') {
      setShowDetails(isOpen);
    }
  }, [isOpen]);

  return (
    <div className={`bg-white rounded-3xl shadow-xl p-8 border border-indigo-100 ${className}`}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🧭</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900">Repo Analysis</h2>
          </div>
          {repoAnalysis.repoUrl && (
            <p className="text-sm text-gray-500">{repoAnalysis.repoUrl}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {isAvailable ? 'Ready' : 'Unavailable'}
        </span>
      </div>

      <p className="text-gray-700 leading-relaxed">
        {repoAnalysis.summary || repoAnalysis.message || 'Repository analysis is unavailable.'}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (onToggle) {
              onToggle();
              return;
            }
            setShowDetails((prev) => !prev);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-100"
        >
          <span>{showDetails ? 'Hide details' : 'View details'}</span>
          <span aria-hidden="true">{showDetails ? '▲' : '▼'}</span>
        </button>
      </div>

      {showDetails && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <DetailBlock title="Alignment" items={repoAnalysis.alignment} />
          <DetailBlock title="Gaps" items={repoAnalysis.gaps} />
          <DetailBlock title="Over-engineering" items={repoAnalysis.overEngineering} />
          <DetailBlock title="Risks" items={repoAnalysis.risks} />
          <DetailBlock title="Recommendations" items={repoAnalysis.recommendations} />
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">Coding Practices</p>
            <DetailBlock title="Strengths" items={repoAnalysis.codingPractices?.strengths} />
            <DetailBlock title="Weaknesses" items={repoAnalysis.codingPractices?.weaknesses} />
          </div>
          <div className="space-y-3 md:col-span-2">
            <p className="text-sm font-semibold text-gray-900">Evidence Snapshot</p>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
              {repoAnalysis.evidence?.topLevel?.length ? (
                <p>
                  <span className="font-semibold">Top level:</span> {repoAnalysis.evidence.topLevel.join(', ')}
                </p>
              ) : null}
              {repoAnalysis.evidence?.recentCommits?.length ? (
                <p>
                  <span className="font-semibold">Recent commits:</span>{' '}
                  {repoAnalysis.evidence.recentCommits.slice(0, 3).join(' · ')}
                </p>
              ) : null}
              {repoAnalysis.evidence?.readmeExcerpt ? (
                <p>
                  <span className="font-semibold">README:</span> {repoAnalysis.evidence.readmeExcerpt}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBlock({ title, items }: { title: string; items?: string[] }) {
  const safeItems = items || [];
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        {safeItems.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {safeItems.map((item, index) => (
              <li key={`${title}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No details captured yet.</p>
        )}
      </div>
    </div>
  );
}
