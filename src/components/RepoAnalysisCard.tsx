'use client';

import { useEffect, useState } from 'react';
import type { RepoAnalysis } from '@/types';
import { ChevronDown, ChevronUp, Compass } from 'lucide-react';

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
    <div className={`rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:rgba(37,99,235,0.12)]">
              <Compass className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>
            <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Repo analysis</h2>
          </div>
          {repoAnalysis.repoUrl && (
            <p className="text-xs text-[color:rgba(15,23,42,0.6)]">{repoAnalysis.repoUrl}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
            isAvailable
              ? 'border-[color:rgba(37,99,235,0.3)] text-[color:var(--color-primary)]'
              : 'border-[color:rgba(185,28,28,0.35)] text-[color:var(--color-danger)]'
          }`}
        >
          {isAvailable ? 'Ready' : 'Unavailable'}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
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
          className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-background)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.24)]"
        >
          <span>{showDetails ? 'Hide details' : 'View details'}</span>
          {showDetails ? (
            <ChevronUp className="h-4 w-4 text-[color:rgba(15,23,42,0.6)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[color:rgba(15,23,42,0.6)]" />
          )}
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
            <p className="text-sm font-semibold text-[color:var(--color-text)]">Coding practices</p>
            <DetailBlock title="Strengths" items={repoAnalysis.codingPractices?.strengths} />
            <DetailBlock title="Weaknesses" items={repoAnalysis.codingPractices?.weaknesses} />
          </div>
          <div className="space-y-3 md:col-span-2">
            <p className="text-sm font-semibold text-[color:var(--color-text)]">Evidence snapshot</p>
            <div className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4 text-sm text-[color:rgba(15,23,42,0.75)] space-y-2">
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
      <p className="text-sm font-semibold text-[color:var(--color-text)]">{title}</p>
      <div className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4 text-sm text-[color:rgba(15,23,42,0.75)]">
        {safeItems.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {safeItems.map((item, index) => (
              <li key={`${title}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[color:rgba(15,23,42,0.55)]">No details captured yet.</p>
        )}
      </div>
    </div>
  );
}
