'use client';

interface ProgressIndicatorProps {
  status: string;
  className?: string;
}

const PIPELINE_STEPS = [
  { key: 'PENDING', label: 'Initializing', icon: '⏳', order: 0 },
  { key: 'CLARIFYING', label: 'Clarifying Requirements', icon: '🎯', order: 1 },
  { key: 'DRAFTING_HLD', label: 'Drafting High-Level Design', icon: '🏗️', order: 2 },
  { key: 'SLICING_TICKETS', label: 'Creating User Stories', icon: '✂️', order: 3 },
  { key: 'ESTIMATING', label: 'Estimating Effort', icon: '📊', order: 4 },
  { key: 'PRIORITIZING', label: 'Prioritizing & Scheduling', icon: '🎨', order: 5 },
] as const;

const STATUS_TO_ORDER: Record<string, number> = {
  PENDING: 0,
  CLARIFYING: 1,
  DRAFTING_HLD: 2,
  SLICING_TICKETS: 3,
  ESTIMATING: 4,
  PRIORITIZING: 5,
  COMPLETED: 6,
  FAILED: 6,
};

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

export function ProgressIndicator({ status, className = '' }: ProgressIndicatorProps) {
  const currentOrder = STATUS_TO_ORDER[status] || 0;
  const progress = getProgress(status);
  const currentStep = PIPELINE_STEPS.find((step) => step.key === status);

  const isProcessing = status !== 'COMPLETED' && status !== 'FAILED';
  const isFailed = status === 'FAILED';

  return (
    <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 ${className}`}>
      {/* Current Status Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className={`text-3xl ${isProcessing ? 'animate-bounce' : ''}`}>
            {isFailed ? '❌' : currentStep?.icon || '⏳'}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-500">Current Stage</p>
            <p className="text-lg font-bold text-gray-900">
              {isFailed ? 'Failed' : currentStep?.label || 'Processing'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            {progress}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          {isProcessing && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {PIPELINE_STEPS.map((step) => {
          const isCompleted = step.order < currentOrder;
          const isCurrent = step.key === status;

          return (
            <div
              key={step.key}
              className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                isCurrent
                  ? 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-300 shadow-lg scale-105'
                  : isCompleted
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <span className={`text-2xl ${isCurrent ? 'animate-bounce' : ''}`}>
                  {isCompleted ? '✅' : step.icon}
                </span>
                <p
                  className={`text-xs font-semibold leading-tight ${
                    isCurrent
                      ? 'text-indigo-900'
                      : isCompleted
                        ? 'text-green-900'
                        : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full animate-ping"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
