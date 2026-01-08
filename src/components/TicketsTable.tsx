'use client';

import type { Ticket } from '@/types';
import { Fragment, useState, useEffect } from 'react';

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
        alert('✅ Ticket updated successfully!');
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
      <div className={`bg-white rounded-3xl shadow-xl p-8 border border-orange-100 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
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
      className={`bg-white rounded-3xl shadow-xl p-8 border border-orange-100 hover:shadow-2xl transition-shadow duration-300 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Sprint Tickets</h2>
        </div>
        <div className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
          <span className="text-sm font-bold text-orange-700">{tickets.length} tickets</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Size
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Sprint
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((ticket) => {
              const isExpanded = expandedRows.has(ticket.id);
              return (
                <Fragment key={ticket.id}>
                  <tr
                    className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(ticket.id)}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span>{ticket.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-sm">
                        {ticket.tshirtSize}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="font-semibold text-gray-700">{ticket.estimateHours}h</span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        Sprint {ticket.sprint}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
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
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {ticket.tags.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{ticket.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm">
                      <button
                        className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(ticket.id);
                        }}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 bg-gradient-to-r from-orange-50 to-red-50"
                      >
                        <div className="space-y-4">
                          {/* Description */}
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span>📝</span>
                              <span>Description</span>
                            </h4>
                            <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg">
                              {ticket.description}
                            </p>
                          </div>

                          {/* Acceptance Criteria */}
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span>✅</span>
                              <span>Acceptance Criteria</span>
                            </h4>
                            <div className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg whitespace-pre-line">
                              {ticket.acceptanceCriteria}
                            </div>
                          </div>

                          {/* Dependencies */}
                          {ticket.dependencies.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <span>🔗</span>
                                <span>Dependencies</span>
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {ticket.dependencies.map((dep, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
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
                              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <span>🏷️</span>
                                <span>Tags</span>
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {ticket.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
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
              className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 transition-colors"
            >
              <div
                className="p-4 bg-gradient-to-r from-orange-50 to-red-50 cursor-pointer"
                onClick={() => toggleRow(ticket.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-gray-900 flex-1">{ticket.title}</h3>
                  <button className="text-indigo-600 font-bold text-xl flex-shrink-0">
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-bold">
                    {ticket.tshirtSize}
                  </span>
                  <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-xs font-bold">
                    {ticket.estimateHours}h
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    Sprint {ticket.sprint}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ticket.priority >= 8
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                        : ticket.priority >= 5
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                        : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                    }`}
                  >
                    P{ticket.priority}
                  </span>
                </div>
              </div>
              {isExpanded && (
                <div className="p-4 bg-white space-y-4 border-t-2 border-gray-200">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span>📝</span>
                        <span>Description</span>
                      </h4>
                      <button
                        onClick={() => handleSaveTicket(ticket)}
                        disabled={savingTicketId === ticket.id}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all flex items-center gap-2"
                      >
                        {savingTicketId === ticket.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={editedTickets.get(ticket.id)?.description || ticket.description}
                      onChange={(e) => handleDescriptionChange(ticket.id, e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none text-sm"
                      rows={8}
                      placeholder="Enter objective (up to 10 lines) and acceptance criteria..."
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span>✅</span>
                      <span>Acceptance Criteria</span>
                    </h4>
                    <textarea
                      value={editedTickets.get(ticket.id)?.acceptanceCriteria || ticket.acceptanceCriteria}
                      onChange={(e) => handleAcceptanceCriteriaChange(ticket.id, e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none text-sm font-mono"
                      rows={10}
                      placeholder="Enter acceptance criteria (one per line, up to 10 items)..."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Enter one acceptance criterion per line (up to 10 items). Each line will become a bullet point.
                    </p>
                  </div>
                  {ticket.dependencies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span>🔗</span>
                        <span>Dependencies</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ticket.dependencies.map((dep, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ticket.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span>🏷️</span>
                        <span>Tags</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ticket.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
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
