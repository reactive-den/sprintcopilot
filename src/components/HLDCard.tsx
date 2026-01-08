'use client';

import type { HLD } from '@/types';
import { AlertTriangle, Gauge, GitBranch, Layers } from 'lucide-react';

interface HLDCardProps {
  hld: HLD;
  isLoading?: boolean;
  className?: string;
}

export function HLDCard({ hld, isLoading = false, className = '' }: HLDCardProps) {
  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-[color:rgba(37,99,235,0.12)]"></div>
          <div className="h-5 w-48 rounded bg-[color:rgba(15,23,42,0.08)]"></div>
        </div>
        <div className="space-y-3">
          <div className="h-3 rounded bg-[color:rgba(15,23,42,0.08)]"></div>
          <div className="h-3 rounded bg-[color:rgba(15,23,42,0.08)] w-4/5"></div>
          <div className="h-3 rounded bg-[color:rgba(15,23,42,0.08)] w-3/4"></div>
        </div>
      </div>
    );
  }

  const hasModules = hld.modules && hld.modules.length > 0;
  const hasDataFlows = hld.dataFlows && hld.dataFlows.length > 0;
  const hasRisks = hld.risks && hld.risks.length > 0;
  const hasNFRs = hld.nfrs && hld.nfrs.length > 0;

  // Don't render if there's no data
  if (!hasModules && !hasDataFlows && !hasRisks && !hasNFRs) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:rgba(37,99,235,0.12)]">
          <Layers className="h-5 w-5 text-[color:var(--color-primary)]" />
        </div>
        <h2 className="text-xl font-semibold text-[color:var(--color-text)]">High-level design</h2>
      </div>

      {/* System Modules Section */}
      {hasModules && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <Layers className="h-4 w-4 text-[color:var(--color-primary)]" />
            <span>System modules</span>
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {hld.modules!.map((module: string, index: number) => (
              <div
                key={index}
                className="rounded-lg border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4 text-sm text-[color:rgba(15,23,42,0.75)]"
              >
                {module}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Flows Section */}
      {hasDataFlows && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <GitBranch className="h-4 w-4 text-[color:var(--color-primary)]" />
            <span>Data flows</span>
          </h3>
          <div className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-5">
            <div className="space-y-2">
              {hld.dataFlows!.map((flow: string, index: number) => (
                <p key={index} className="flex items-start gap-2 text-sm text-[color:rgba(15,23,42,0.75)]">
                  <span className="flex-shrink-0 text-[color:var(--color-primary)]">→</span>
                  <span>{flow}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Technical Risks Section */}
      {hasRisks && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <AlertTriangle className="h-4 w-4 text-[color:var(--color-danger)]" />
            <span>Technical risks</span>
          </h3>
          <div className="space-y-3">
            {hld.risks!.map((risk: string, index: number) => (
              <div
                key={index}
                className="flex gap-3 rounded-lg border border-[color:rgba(185,28,28,0.25)] bg-[color:rgba(185,28,28,0.06)] p-4"
              >
                <span className="text-sm font-semibold text-[color:var(--color-danger)]">{index + 1}.</span>
                <p className="text-sm text-[color:rgba(15,23,42,0.75)]">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-Functional Requirements Section */}
      {hasNFRs && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
            <Gauge className="h-4 w-4 text-[color:var(--color-primary)]" />
            <span>Non-functional requirements</span>
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {hld.nfrs!.map((nfr: string, index: number) => (
              <div
                key={index}
                className="rounded-lg border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4 text-sm text-[color:rgba(15,23,42,0.75)]"
              >
                {nfr}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
