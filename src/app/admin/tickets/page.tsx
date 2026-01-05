import Link from 'next/link';
import { prisma } from '@/lib/prisma';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-orange-100 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">Admin Ticket View</h1>
              <p className="text-gray-600">
                All generated tickets with project context, estimates, and details.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full">
                <span className="text-sm font-bold text-orange-700">
                  {tickets.length} tickets
                </span>
              </div>
              <Link
                href="/"
                className="px-4 py-2 rounded-full border border-orange-200 text-orange-700 font-semibold hover:bg-orange-50 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-100 text-center">
            <div className="text-5xl mb-4">🗂️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No tickets yet</h2>
            <p className="text-gray-600">Run a project to generate tickets for this list.</p>
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
                  className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-gray-900">{ticket.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-semibold text-gray-700">Project:</span>{' '}
                          {ticket.run.project.title}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Run ID:</span> {ticket.run.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          ticket.priority >= 8
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            : ticket.priority >= 5
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                            : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                        }`}
                      >
                        P{ticket.priority}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-500">Sprint</div>
                      <div className="font-semibold text-gray-900">
                        {ticket.sprint ?? 'TBD'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-500">Estimate</div>
                      <div className="font-semibold text-gray-900">
                        {ticket.estimateHours ? `${ticket.estimateHours}h` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-500">T-Shirt</div>
                      <div className="font-semibold text-gray-900">
                        {ticket.tshirtSize ?? 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-500">Run Status</div>
                      <div className="font-semibold text-gray-900">{ticket.run.status}</div>
                    </div>
                  </div>

                  <details className="mt-5 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                    <summary className="cursor-pointer font-semibold text-orange-700">
                      View full details
                    </summary>
                    <div className="mt-4 space-y-4 text-sm text-gray-700">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">Description</div>
                        <p className="leading-relaxed whitespace-pre-line">{ticket.description}</p>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">Acceptance Criteria</div>
                        <p className="leading-relaxed whitespace-pre-line">
                          {ticket.acceptanceCriteria}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">Tags</div>
                          <p>{tags}</p>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">Dependencies</div>
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
