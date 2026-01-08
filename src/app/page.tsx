'use client';

import { ProjectForm } from '@/components/ProjectForm';
import { ClipboardList, FileText, Sparkles, WandSparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:rgba(15,23,42,0.7)]">
                <Sparkles className="h-4 w-4 text-[color:var(--color-primary)]" />
                Enterprise-grade sprint planning
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--color-text)] md:text-5xl">
                  SprintCopilot
                </h1>
                <p className="text-base leading-relaxed text-[color:rgba(15,23,42,0.72)] md:text-lg">
                  Translate feature requests into structured sprint tickets, estimates, and execution-ready plans with
                  AI-assisted workflows.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-[color:rgba(15,23,42,0.7)] sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <WandSparkles className="h-4 w-4 text-[color:var(--color-primary)]" />
                  Clarifies scope before planning
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[color:var(--color-primary)]" />
                  Generates business + design docs
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[color:var(--color-primary)]" />
                  Produces sprint-ready tickets
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[color:var(--color-primary)]" />
                  Supports ClickUp export flows
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:rgba(37,99,235,0.1)]">
                  <WandSparkles className="h-5 w-5 text-[color:var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
                    Create a sprint plan
                  </h2>
                  <p className="text-sm text-[color:rgba(15,23,42,0.6)]">
                    Add context and constraints to start.
                  </p>
                </div>
              </div>
              <ProjectForm />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Clarify requirements',
              description:
                'Step through focused questions to remove ambiguity before scope is locked.',
            },
            {
              title: 'Document architecture',
              description:
                'Capture high-level design and key technical considerations in one pass.',
            },
            {
              title: 'Deliver sprint output',
              description: 'Receive scoped tickets with estimates and prioritized sequencing.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-[color:var(--color-text)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.65)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'AI agents', value: '5+' },
            { label: 'Avg. turnaround', value: '<3 min' },
            { label: 'Automation coverage', value: '100%' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-5 text-center"
            >
              <div className="text-2xl font-semibold text-[color:var(--color-text)]">
                {stat.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-[color:rgba(15,23,42,0.6)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
