'use client';

import type { Ticket } from '@/types';
import { Fragment, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ClipboardList, Save } from 'lucide-react';

interface TicketsTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
  className?: string;
  onTicketsUpdate?: (updatedTickets: Ticket[]) => void;
}

export function TicketsTable({ tickets, isLoading = false, className = '', onTicketsUpdate }: TicketsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editedTickets, setEditedTickets] = useState<Map<string, { description: string; acceptanceCriteria: string }>>(new Map());
  const [savingTicketId, setSavingTicketId] = useState<string | null>(null);

  // Initialize edited tickets with current values
  useEffect(() => {
    const initial = new Map<string, { description: string; acceptanceCriteria: string }>();
    tickets.forEach((ticket) => {
      initial.set(ticket.id, {
        description: ticket.description,
        acceptanceCriteria: ticket.acceptanceCriteria,
      });
    });
    setEditedTickets(initial);
  }, [tickets]);

  const toggleRow = (ticketId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDescriptionChange = (ticketId: string, value: string) => {
    const updated = new Map(editedTickets);
    const current = updated.get(ticketId) || { description: '', acceptanceCriteria: '' };
    updated.set(ticketId, { ...current, description: value });
    setEditedTickets(updated);
  };

  const handleAcceptanceCriteriaChange = (ticketId: string, value: string) => {
    const updated = new Map(editedTickets);
    const current = updated.get(ticketId) || { description: '', acceptanceCriteria: '' };
    updated.set(ticketId, { ...current, acceptanceCriteria: value });
    setEditedTickets(updated);
  };

  const handleSaveTicket = async (ticket: Ticket) => {
    const edited = editedTickets.get(ticket.id);
    if (!edited) return;

    setSavingTicketId(ticket.id);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: edited.description,
          acceptanceCriteria: edited.acceptanceCriteria,
        }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        // Update local tickets if callback provided
        if (onTicketsUpdate) {
          const updatedTickets = tickets.map((t) => (t.id === ticket.id ? updatedTicket : t));
          onTicketsUpdate(updatedTickets);
        }
        alert('Ticket updated successfully.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Failed to update ticket:', error);
      alert('Failed to update ticket. Please try again.');
    } finally {
      setSavingTicketId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-[color:rgba(37,99,235,0.12)]"></div>
          <div className="h-5 w-40 rounded bg-[color:rgba(15,23,42,0.08)]"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded bg-[color:rgba(15,23,42,0.06)]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:rgba(37,99,235,0.12)]">
            <ClipboardList className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Sprint tickets</h2>
        </div>
        <div className="rounded-full border border-[color:rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
          {tickets.length} tickets
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[color:rgba(15,23,42,0.12)]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(15,23,42,0.6)]">
                Title
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(15,23,42,0.6)]">
                Size
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(15,23,42,0.6)]">
                Hours
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(15,23,42,0.6)]">
                Sprint
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(15,23,42,0.6)]">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(15,23,42,0.6)]">
                Tags
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[color:rgba(15,23,42,0.6)]">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:rgba(15,23,42,0.08)]">
            {tickets.map((ticket) => {
              const isExpanded = expandedRows.has(ticket.id);
              return (
                <Fragment key={ticket.id}>
                  <tr
                    className="cursor-pointer transition hover:bg-[color:rgba(37,99,235,0.04)]"
                    onClick={() => toggleRow(ticket.id)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-[color:var(--color-text)] max-w-xs">
                      <div className="flex items-center gap-2">
                        <span>{ticket.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
                        {ticket.tshirtSize}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="text-sm text-[color:rgba(15,23,42,0.7)]">{ticket.estimateHours}h</span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
                        Sprint {ticket.sprint}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className="rounded-full border border-[color:rgba(37,99,235,0.3)] bg-[color:rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]"
                      >
                        P{ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded border border-[color:rgba(15,23,42,0.12)] px-2 py-1 text-[11px] text-[color:rgba(15,23,42,0.6)]"
                          >
                            {tag}
                          </span>
                        ))}
                        {ticket.tags.length > 2 && (
                          <span className="rounded border border-[color:rgba(15,23,42,0.12)] px-2 py-1 text-[11px] text-[color:rgba(15,23,42,0.6)]">
                            +{ticket.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm">
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:rgba(15,23,42,0.12)] text-[color:rgba(15,23,42,0.6)] transition hover:border-[color:rgba(15,23,42,0.24)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(ticket.id);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 bg-[color:var(--color-background)]">
                        <div className="space-y-4">
                          {/* Description */}
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-[color:var(--color-text)]">
                              Description
                            </h4>
                            <p className="rounded-lg border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-4 text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)]">
                              {ticket.description}
                            </p>
                          </div>

                          {/* Acceptance Criteria */}
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-[color:var(--color-text)]">
                              Acceptance criteria
                            </h4>
                            <div className="rounded-lg border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-4 text-sm leading-relaxed text-[color:rgba(15,23,42,0.75)] whitespace-pre-line">
                              {ticket.acceptanceCriteria}
                            </div>
                          </div>

                          {/* Dependencies */}
                          {ticket.dependencies.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-sm font-semibold text-[color:var(--color-text)]">
                                Dependencies
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {ticket.dependencies.map((dep, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs text-[color:rgba(15,23,42,0.7)]"
                                  >
                                    {dep}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* All Tags */}
                          {ticket.tags.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-sm font-semibold text-[color:var(--color-text)]">
                                Tags
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {ticket.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs text-[color:rgba(15,23,42,0.7)]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {tickets.map((ticket) => {
          const isExpanded = expandedRows.has(ticket.id);
          return (
            <div
              key={ticket.id}
              className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] overflow-hidden transition hover:border-[color:rgba(37,99,235,0.3)]"
            >
              <div
                className="cursor-pointer bg-[color:var(--color-background)] p-4"
                onClick={() => toggleRow(ticket.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="flex-1 text-sm font-semibold text-[color:var(--color-text)]">{ticket.title}</h3>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:rgba(15,23,42,0.12)] text-[color:rgba(15,23,42,0.6)]">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
                    {ticket.tshirtSize}
                  </span>
                  <span className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
                    {ticket.estimateHours}h
                  </span>
                  <span className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs font-semibold text-[color:rgba(15,23,42,0.7)]">
                    Sprint {ticket.sprint}
                  </span>
                  <span
                    className="rounded-full border border-[color:rgba(37,99,235,0.3)] bg-[color:rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]"
                  >
                    P{ticket.priority}
                  </span>
                </div>
              </div>
              {isExpanded && (
                <div className="space-y-4 border-t border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[color:var(--color-text)]">Description</h4>
                      <button
                        onClick={() => handleSaveTicket(ticket)}
                        disabled={savingTicketId === ticket.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingTicketId === ticket.id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={editedTickets.get(ticket.id)?.description || ticket.description}
                      onChange={(e) => handleDescriptionChange(ticket.id, e.target.value)}
                      className="w-full rounded-lg border border-[color:rgba(15,23,42,0.16)] px-4 py-3 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)]"
                      rows={8}
                      placeholder="Enter objective (up to 10 lines) and acceptance criteria..."
                    />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-[color:var(--color-text)]">Acceptance criteria</h4>
                    <textarea
                      value={editedTickets.get(ticket.id)?.acceptanceCriteria || ticket.acceptanceCriteria}
                      onChange={(e) => handleAcceptanceCriteriaChange(ticket.id, e.target.value)}
                      className="w-full rounded-lg border border-[color:rgba(15,23,42,0.16)] px-4 py-3 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)]"
                      rows={10}
                      placeholder="Enter acceptance criteria (one per line, up to 10 items)..."
                    />
                    <p className="mt-2 text-xs text-[color:rgba(15,23,42,0.55)]">
                      Enter one acceptance criterion per line (up to 10 items). Each line will become a bullet point.
                    </p>
                  </div>
                  {ticket.dependencies.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-[color:var(--color-text)]">Dependencies</h4>
                      <div className="flex flex-wrap gap-2">
                        {ticket.dependencies.map((dep, idx) => (
                          <span
                            key={idx}
                            className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs text-[color:rgba(15,23,42,0.7)]"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ticket.tags.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-[color:var(--color-text)]">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {ticket.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs text-[color:rgba(15,23,42,0.7)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
