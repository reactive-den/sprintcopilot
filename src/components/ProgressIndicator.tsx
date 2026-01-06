'use client';

import { useEffect, useRef, useState } from 'react';

interface ProgressIndicatorProps {
  status: string;
  className?: string;
}

const PIPELINE_STEPS = [
  { key: 'PENDING', label: 'Initializing', icon: '⏳', order: 0, color: 'from-indigo-500 to-purple-500' },
  { key: 'CLARIFYING', label: 'Clarifying Requirements', icon: '🎯', order: 1, color: 'from-indigo-500 to-purple-500' },
  { key: 'DRAFTING_HLD', label: 'Drafting High-Level Design', icon: '🏗️', order: 2, color: 'from-purple-500 to-pink-500' },
  { key: 'SLICING_TICKETS', label: 'Creating User Stories', icon: '✂️', order: 3, color: 'from-purple-500 to-pink-500' },
  { key: 'ESTIMATING', label: 'Estimating Effort', icon: '📊', order: 4, color: 'from-pink-500 to-red-500' },
  { key: 'PRIORITIZING', label: 'Prioritizing & Scheduling', icon: '🎨', order: 5, color: 'from-pink-500 to-red-500' },
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

const MOTIVATIONAL_MESSAGES = [
  "✨ Crafting your perfect sprint plan...",
  "🚀 Analyzing requirements with AI precision...",
  "🎯 Breaking down complex features...",
  "💡 Generating intelligent estimates...",
  "🎨 Organizing priorities for maximum impact...",
  "⚡ Almost there! Finalizing details...",
];

const STATUS_PROGRESS: Record<string, { min: number; max: number; durationMs: number }> = {
  PENDING: { min: 2, max: 12, durationMs: 7000 },
  CLARIFYING: { min: 12, max: 30, durationMs: 14000 },
  DRAFTING_HLD: { min: 30, max: 50, durationMs: 16000 },
  SLICING_TICKETS: { min: 50, max: 70, durationMs: 16000 },
  ESTIMATING: { min: 70, max: 84, durationMs: 14000 },
  PRIORITIZING: { min: 84, max: 95, durationMs: 12000 },
};

export function ProgressIndicator({ status, className = '' }: ProgressIndicatorProps) {
  const currentOrder = STATUS_TO_ORDER[status] || 0;
  const currentStep = PIPELINE_STEPS.find((step) => step.key === status);
  const [messageIndex, setMessageIndex] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Initialize progress based on current status to avoid glitch
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

  // Rotate motivational messages
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing]);

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

    // Ensure progress never goes backward
    const newBaseProgress = Math.max(progressRef.current, range.min);

    setStatusMeta({
      startedAt: Date.now(),
      baseProgress: newBaseProgress,
    });

    // Immediately update visual progress to avoid jumps
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
    }, 120);
    return () => clearInterval(interval);
  }, [isProcessing, status, statusMeta]);

  // Generate floating particles
  useEffect(() => {
    if (!isProcessing) return;
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [isProcessing]);

  const handleShuffleMessage = () => {
    setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    if (!isProcessing) return;
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      }))
    );
  };

  return (
    <div className={`relative overflow-hidden bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-2xl ${className}`}>
      {/* Animated Background Particles */}
      {isProcessing && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-10 animate-float"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated Gradient Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
      )}

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section with Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            {/* Pulsing Rings */}
            {isProcessing && (
              <>
                <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 animate-ping" />
                <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30 animate-pulse" />
              </>
            )}

            {/* Main Icon Container */}
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${currentStep?.color || 'from-indigo-500 to-purple-500'} flex items-center justify-center shadow-2xl ${isProcessing ? 'animate-bounce-slow' : ''}`}>
              <span className="text-5xl filter drop-shadow-lg">
                {isFailed ? '❌' : currentStep?.icon || '⏳'}
              </span>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-4">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-2">
              {isFailed ? 'Process Failed' : currentStep?.label || 'Processing'}
            </h3>
            {isProcessing && (
              <>
                <p className="text-lg text-gray-600 font-medium animate-fade-in">
                  {MOTIVATIONAL_MESSAGES[messageIndex]}
                </p>
                <button
                  type="button"
                  onClick={handleShuffleMessage}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-white px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md"
                >
                  <span aria-hidden="true">🎲</span>
                  Change vibe
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modern Progress Bar */}
        <div className="relative w-full h-4 bg-gray-200/50 rounded-full overflow-hidden mb-8 backdrop-blur-sm">
          {/* Background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-fast" />

          {/* Progress fill */}
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentStep?.color || 'from-indigo-500 to-purple-500'} rounded-full transition-all duration-700 ease-out shadow-lg`}
            style={{ width: `${visualProgress}%` }}
          >
            {/* Animated overlay */}
            {isProcessing && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast" />
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </>
            )}
          </div>

          {/* Progress glow effect */}
          {isProcessing && (
            <div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent blur-xl opacity-60 animate-shimmer-fast"
              style={{ left: `${Math.max(0, visualProgress - 10)}%` }}
            />
          )}
        </div>

        {/* Pipeline Steps Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PIPELINE_STEPS.map((step, index) => {
            const isCompleted = step.order < currentOrder;
            const isCurrent = step.key === status;

            return (
              <div
                key={step.key}
                className={`relative group transition-all duration-500 ${
                  isCurrent ? 'scale-110 z-10' : isCompleted ? 'scale-100' : 'scale-95 opacity-60'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card */}
                <div
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-500 ${
                    isCurrent
                      ? `bg-gradient-to-br ${step.color} border-white shadow-2xl`
                      : isCompleted
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg'
                        : 'bg-white/50 border-gray-300 backdrop-blur-sm'
                  }`}
                >
                  {/* Glow effect for current step */}
                  {isCurrent && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
                  )}

                  <div className="relative flex flex-col items-center text-center gap-3">
                    {/* Icon */}
                    <div className={`text-4xl transition-transform duration-300 ${
                      isCurrent ? 'animate-bounce-slow scale-110' : isCompleted ? 'scale-100' : 'scale-90'
                    }`}>
                      {isCompleted ? '✅' : step.icon}
                    </div>

                    {/* Label */}
                    <p
                      className={`text-xs font-bold leading-tight transition-colors duration-300 ${
                        isCurrent
                          ? 'text-white drop-shadow-md'
                          : isCompleted
                            ? 'text-green-900'
                            : 'text-gray-600'
                      }`}
                    >
                      {step.label}
                    </p>

                    {/* Status indicator */}
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full animate-ping" />
                        <div className="absolute w-3 h-3 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection line to next step */}
                {index < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-gray-300 to-transparent transform -translate-y-1/2 z-0">
                    {isCompleted && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-transparent animate-pulse" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
