'use client';

import type { Clarifications } from '@/types';

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
      <div className={`bg-white rounded-3xl shadow-xl p-8 border border-blue-100 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
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
      className={`bg-white rounded-3xl shadow-xl p-8 border border-blue-100 hover:shadow-2xl transition-shadow duration-300 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🎯</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Clarifications</h2>
      </div>

      {/* Questions Section */}
      {hasQuestions && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>❓</span>
            <span>Key Questions</span>
          </h3>
          <div className="space-y-3">
            {clarifications.questions!.map((question: string, index: number) => (
              <div
                key={index}
                className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors"
              >
                <span className="text-blue-600 font-bold flex-shrink-0">{index + 1}.</span>
                <p className="text-gray-700 flex-1">{question}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions Section */}
      {hasAssumptions && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>Assumptions</span>
          </h3>
          <div className="space-y-3">
            {clarifications.assumptions!.map((assumption: string, index: number) => (
              <div
                key={index}
                className="flex gap-3 p-4 bg-cyan-50 rounded-xl border border-cyan-100 hover:border-cyan-200 transition-colors"
              >
                <span className="text-cyan-600 font-bold flex-shrink-0">•</span>
                <p className="text-gray-700 flex-1">{assumption}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scope Section */}
      {hasScope && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>🎯</span>
            <span>Project Scope</span>
          </h3>
          <p className="text-gray-700 leading-relaxed">{clarifications.scope}</p>
        </div>
      )}
    </div>
  );
}
