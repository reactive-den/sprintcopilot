'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  status: string;
  className?: string;
}

const PIPELINE_STEPS = [
  { key: 'PENDING', label: 'Initializing', order: 0 },
  { key: 'CLARIFYING', label: 'Clarifying requirements', order: 1 },
  { key: 'ANALYZING_REPO', label: 'Analyzing repository', order: 2 },
  { key: 'DRAFTING_HLD', label: 'Drafting high-level design', order: 3 },
  { key: 'SLICING_TICKETS', label: 'Creating user stories', order: 4 },
  { key: 'ESTIMATING', label: 'Estimating effort', order: 5 },
  { key: 'PRIORITIZING', label: 'Prioritizing & scheduling', order: 6 },
] as const;

const STATUS_TO_ORDER: Record<string, number> = {
  PENDING: 0,
  CLARIFYING: 1,
  ANALYZING_REPO: 2,
  DRAFTING_HLD: 3,
  SLICING_TICKETS: 4,
  ESTIMATING: 5,
  PRIORITIZING: 6,
  COMPLETED: 7,
  FAILED: 7,
};

const STATUS_PROGRESS: Record<string, { min: number; max: number; durationMs: number }> = {
  PENDING: { min: 2, max: 12, durationMs: 7000 },
  CLARIFYING: { min: 12, max: 30, durationMs: 14000 },
  ANALYZING_REPO: { min: 30, max: 45, durationMs: 12000 },
  DRAFTING_HLD: { min: 45, max: 62, durationMs: 16000 },
  SLICING_TICKETS: { min: 62, max: 78, durationMs: 16000 },
  ESTIMATING: { min: 78, max: 88, durationMs: 14000 },
  PRIORITIZING: { min: 88, max: 95, durationMs: 12000 },
};

export function ProgressIndicator({ status, className = '' }: ProgressIndicatorProps) {
  const currentOrder = STATUS_TO_ORDER[status] || 0;
  const currentStep = PIPELINE_STEPS.find((step) => step.key === status);
  const [visualProgress, setVisualProgress] = useState(() => {
    const range = STATUS_PROGRESS[status];
    return range ? range.min : 0;
  });
  const [statusMeta, setStatusMeta] = useState(() => ({
    startedAt: Date.now(),
    baseProgress: STATUS_PROGRESS[status]?.min || 0,
  }));

  const progressRef = useRef(STATUS_PROGRESS[status]?.min || 0);

  const isProcessing = status !== 'COMPLETED' && status !== 'FAILED';
  const isFailed = status === 'FAILED';

  useEffect(() => {
    progressRef.current = visualProgress;
  }, [visualProgress]);

  useEffect(() => {
    if (status === 'COMPLETED') {
      setVisualProgress(100);
      return;
    }
    if (status === 'FAILED') {
      setVisualProgress((prev) => Math.max(prev, 100));
      return;
    }
    const range = STATUS_PROGRESS[status] || { min: 0, max: 95, durationMs: 12000 };
    const newBaseProgress = Math.max(progressRef.current, range.min);
    setStatusMeta({
      startedAt: Date.now(),
      baseProgress: newBaseProgress,
    });
    setVisualProgress((prev) => Math.max(prev, newBaseProgress));
  }, [status]);

  useEffect(() => {
    if (!isProcessing) return;
    const range = STATUS_PROGRESS[status] || { min: 0, max: 95, durationMs: 12000 };
    const interval = setInterval(() => {
      const elapsed = Date.now() - statusMeta.startedAt;
      const span = Math.max(0, range.max - statusMeta.baseProgress);
      const ease = 1 - Math.exp(-elapsed / range.durationMs);
      const next = statusMeta.baseProgress + span * ease;
      setVisualProgress((prev) => Math.max(prev, Math.min(range.max - 0.5, next)));
    }, 140);
    return () => clearInterval(interval);
  }, [isProcessing, status, statusMeta]);

  const statusLabel = isFailed
    ? 'Process failed'
    : status === 'COMPLETED'
    ? 'Completed'
    : currentStep?.label || 'Processing';

  return (
    <div
      className={`rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[color:rgba(15,23,42,0.55)]">
            Pipeline status
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[color:var(--color-text)]">
            {statusLabel}
          </h3>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[color:rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
          {isFailed ? (
            <AlertTriangle className="h-4 w-4 text-[color:var(--color-danger)]" />
          ) : isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-primary)]" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-[color:var(--color-primary)]" />
          )}
          {status}
        </div>
      </div>

      <div className="mt-5 h-2 w-full rounded-full bg-[color:rgba(15,23,42,0.08)]">
        <div
          className="h-2 rounded-full bg-[color:var(--color-primary)] transition-[width] duration-500"
          style={{ width: `${visualProgress}%` }}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PIPELINE_STEPS.map((step) => {
          const isCompleted = step.order < currentOrder;
          const isCurrent = step.key === status;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                isCurrent
                  ? 'border-[color:rgba(37,99,235,0.3)] bg-[color:rgba(37,99,235,0.08)] text-[color:var(--color-primary)]'
                  : 'border-[color:rgba(15,23,42,0.12)] text-[color:rgba(15,23,42,0.7)]'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-[color:var(--color-primary)]" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-primary)]" />
              ) : (
                <Circle className="h-4 w-4 text-[color:rgba(15,23,42,0.35)]" />
              )}
              <span className="text-[13px]">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
