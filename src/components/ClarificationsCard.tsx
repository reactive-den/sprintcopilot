'use client';

import type { Clarifications } from '@/types';
import { HelpCircle, Lightbulb, Target } from 'lucide-react';

interface ClarificationsCardProps {
  clarifications: Clarifications;
  isLoading?: boolean;
  className?: string;
}

export function ClarificationsCard({
  clarifications,
  isLoading = false,
  className = '',
}: ClarificationsCardProps) {
  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-[color:rgba(37,99,235,0.12)]"></div>
          <div className="h-5 w-40 rounded bg-[color:rgba(15,23,42,0.08)]"></div>
        </div>
        <div className="space-y-3">
          <div className="h-3 rounded bg-[color:rgba(15,23,42,0.08)]"></div>
          <div className="h-3 rounded bg-[color:rgba(15,23,42,0.08)] w-3/4"></div>
          <div className="h-3 rounded bg-[color:rgba(15,23,42,0.08)] w-5/6"></div>
        </div>
      </div>
    );
  }

  const hasQuestions = clarifications.questions && clarifications.questions.length > 0;
  const hasAssumptions = clarifications.assumptions && clarifications.assumptions.length > 0;
  const hasScope = clarifications.scope;

  // Don't render if there's no data
  if (!hasQuestions && !hasAssumptions && !hasScope) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:rgba(37,99,235,0.12)]">
          <HelpCircle className="h-5 w-5 text-[color:var(--color-primary)]" />
        </div>
        <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Clarifications</h2>
      </div>

      {/* Questions Section */}
      {hasQuestions && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <HelpCircle className="h-4 w-4 text-[color:var(--color-primary)]" />
            <span>Key questions</span>
          </h3>
          <div className="space-y-3">
            {clarifications.questions!.map((question: string, index: number) => (
              <div
                key={index}
                className="flex gap-3 rounded-lg border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4"
              >
                <span className="text-sm font-semibold text-[color:var(--color-primary)]">{index + 1}.</span>
                <p className="text-sm text-[color:rgba(15,23,42,0.75)]">{question}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions Section */}
      {hasAssumptions && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <Lightbulb className="h-4 w-4 text-[color:var(--color-primary)]" />
            <span>Assumptions</span>
          </h3>
          <div className="space-y-3">
            {clarifications.assumptions!.map((assumption: string, index: number) => (
              <div
                key={index}
                className="flex gap-3 rounded-lg border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4"
              >
                <span className="text-sm text-[color:rgba(15,23,42,0.55)]">•</span>
                <p className="text-sm text-[color:rgba(15,23,42,0.75)]">{assumption}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scope Section */}
      {hasScope && (
        <div className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <Target className="h-4 w-4 text-[color:var(--color-primary)]" />
            <span>Project scope</span>
          </h3>
          <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
            {clarifications.scope}
          </p>
        </div>
      )}
    </div>
  );
}
