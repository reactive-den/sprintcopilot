import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Folder } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  const tickets = await prisma.ticket.findMany({
    include: {
      run: {
        include: {
          project: true,
        },
      },
    },
    orderBy: [{ run: { createdAt: 'desc' } }, { priority: 'desc' }],
  });

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">Admin ticket view</h1>
              <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
                All generated tickets with project context, estimates, and details.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-[color:rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
                  {tickets.length} tickets
              </div>
              <Link
                href="/"
                className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-4 py-2 text-xs font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)]"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(37,99,235,0.12)]">
              <Folder className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">No tickets yet</h2>
            <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">Run a project to generate tickets for this list.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => {
              const tags = ticket.tags.length > 0 ? ticket.tags.join(', ') : 'None';
              const dependencies =
                ticket.dependencies.length > 0 ? ticket.dependencies.join(', ') : 'None';

              return (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-[color:var(--color-text)]">{ticket.title}</h3>
                      <div className="space-y-1 text-sm text-[color:rgba(15,23,42,0.7)]">
                        <div>
                          <span className="font-semibold text-[color:var(--color-text)]">Project:</span>{' '}
                          {ticket.run.project.title}
                        </div>
                        <div>
                          <span className="font-semibold text-[color:var(--color-text)]">Run ID:</span> {ticket.run.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[color:rgba(37,99,235,0.3)] bg-[color:rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]">
                        P{ticket.priority}
                      </span>
                      <span className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-3">
                      <div className="text-xs text-[color:rgba(15,23,42,0.55)]">Sprint</div>
                      <div className="font-semibold text-[color:var(--color-text)]">
                        {ticket.sprint ?? 'TBD'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-3">
                      <div className="text-xs text-[color:rgba(15,23,42,0.55)]">Estimate</div>
                      <div className="font-semibold text-[color:var(--color-text)]">
                        {ticket.estimateHours ? `${ticket.estimateHours}h` : 'N/A'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-3">
                      <div className="text-xs text-[color:rgba(15,23,42,0.55)]">T-shirt</div>
                      <div className="font-semibold text-[color:var(--color-text)]">
                        {ticket.tshirtSize ?? 'N/A'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-3">
                      <div className="text-xs text-[color:rgba(15,23,42,0.55)]">Run status</div>
                      <div className="font-semibold text-[color:var(--color-text)]">{ticket.run.status}</div>
                    </div>
                  </div>

                  <details className="mt-5 rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-[color:var(--color-primary)]">
                      View full details
                    </summary>
                    <div className="mt-4 space-y-4 text-sm text-[color:rgba(15,23,42,0.75)]">
                      <div>
                        <div className="mb-1 font-semibold text-[color:var(--color-text)]">Description</div>
                        <p className="leading-relaxed whitespace-pre-line">{ticket.description}</p>
                      </div>
                      <div>
                        <div className="mb-1 font-semibold text-[color:var(--color-text)]">Acceptance criteria</div>
                        <p className="leading-relaxed whitespace-pre-line">
                          {ticket.acceptanceCriteria}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="mb-1 font-semibold text-[color:var(--color-text)]">Tags</div>
                          <p>{tags}</p>
                        </div>
                        <div>
                          <div className="mb-1 font-semibold text-[color:var(--color-text)]">Dependencies</div>
                          <p>{dependencies}</p>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
