'use client';

import type { HLD } from '@/types';

interface HLDCardProps {
  hld: HLD;
  isLoading?: boolean;
  className?: string;
}

export function HLDCard({ hld, isLoading = false, className = '' }: HLDCardProps) {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-3xl shadow-xl p-8 border border-purple-100 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded-lg w-56 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
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
      className={`bg-white rounded-3xl shadow-xl p-8 border border-purple-100 hover:shadow-2xl transition-shadow duration-300 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🏗️</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">High-Level Design</h2>
      </div>

      {/* System Modules Section */}
      {hasModules && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📦</span>
            <span>System Modules</span>
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {hld.modules!.map((module: string, index: number) => (
              <div
                key={index}
                className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-300 transition-colors"
              >
                <p className="text-gray-700 leading-relaxed">{module}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Flows Section */}
      {hasDataFlows && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>🔄</span>
            <span>Data Flows</span>
          </h3>
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
            <div className="space-y-2">
              {hld.dataFlows!.map((flow: string, index: number) => (
                <p key={index} className="text-gray-700 flex items-start gap-2">
                  <span className="text-purple-600 flex-shrink-0">→</span>
                  <span className="flex-1">{flow}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Technical Risks Section */}
      {hasRisks && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>⚠️</span>
            <span>Technical Risks</span>
          </h3>
          <div className="space-y-3">
            {hld.risks!.map((risk: string, index: number) => (
              <div
                key={index}
                className="flex gap-3 p-4 bg-red-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors"
              >
                <span className="text-red-600 font-bold flex-shrink-0">{index + 1}.</span>
                <p className="text-gray-700 flex-1">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-Functional Requirements Section */}
      {hasNFRs && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>⚡</span>
            <span>Non-Functional Requirements</span>
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {hld.nfrs!.map((nfr: string, index: number) => (
              <div
                key={index}
                className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors"
              >
                <p className="text-gray-700 leading-relaxed">{nfr}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
