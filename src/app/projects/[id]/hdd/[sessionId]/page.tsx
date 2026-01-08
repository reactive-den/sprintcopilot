'use client';

import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen,
  ChevronLeft,
  FileDown,
  Layers,
  Loader2,
  LayoutList,
  ScrollText,
  Users,
} from 'lucide-react';

interface HDDSectionConfig {
  id: string;
  label: string;
  icon?: string;
  type: 'hld' | 'lld' | 'guide' | 'reference';
  description: string;
}

interface HDDContent {
  [key: string]: string;
}

interface LoadingState {
  [key: string]: boolean;
}

export default function HDDPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id: projectId, sessionId } = use(params);
  const router = useRouter();
  const [sections, setSections] = useState<HDDSectionConfig[]>([]);
  const [activeSection, setActiveSection] = useState<string>('architecture');
  const [content, setContent] = useState<HDDContent>({});
  const [loading, setLoading] = useState<LoadingState>({});
  const [isGeneratingTickets, setIsGeneratingTickets] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  // Fetch dynamic sections from API
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch(`/api/clarifier/sessions/${sessionId}/hdd`);
        if (response.ok) {
          const data = await response.json();
          if (data.sections && data.sections.length > 0) {
            setSections(data.sections);
            setActiveSection(data.sections[0].id);
          } else {
            // Fallback to default sections if none returned
            setSections([
              {
                id: 'architecture',
                label: 'Architecture',
                type: 'hld',
                description: 'High-level system architecture',
              },
              {
                id: 'deployment',
                label: 'Deployment',
                type: 'guide',
                description: 'Deployment steps',
              },
              {
                id: 'dataflow',
                label: 'Data Flow',
                type: 'hld',
                description: 'Data flow diagrams',
              },
              {
                id: 'users',
                label: 'Users',
                type: 'guide',
                description: 'User documentation',
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sections:', error);
        // Use default sections on error
        setSections([
          {
            id: 'architecture',
            label: 'Architecture',
            type: 'hld',
            description: 'High-level system architecture',
          },
          {
            id: 'deployment',
            label: 'Deployment',
            type: 'guide',
            description: 'Deployment steps',
          },
          {
            id: 'dataflow',
            label: 'Data Flow',
            type: 'hld',
            description: 'Data flow diagrams',
          },
          {
            id: 'users',
            label: 'Users',
            type: 'guide',
            description: 'User documentation',
          },
        ]);
      } finally {
        setIsLoadingSections(false);
      }
    };

    fetchSections();
  }, [sessionId]);

  const loadSection = useCallback(
    async (sectionId: string) => {
      if (content[sectionId]) {
        // Content already loaded in state
        return;
      }

      setLoading((prev) => ({ ...prev, [sectionId]: true }));

      try {
        // First try GET to fetch existing, then POST to generate if not found
        let response = await fetch(`/api/clarifier/sessions/${sessionId}/hdd/${sectionId}`);

        if (!response.ok && response.status === 404) {
          // Not found, generate it
          response = await fetch(`/api/clarifier/sessions/${sessionId}/hdd/${sectionId}`, {
            method: 'POST',
          });
        }

        if (response.ok) {
          const { content: sectionContent } = await response.json();
          setContent((prev) => ({ ...prev, [sectionId]: sectionContent }));
        } else {
          const error = await response.json();
          setContent((prev) => ({
            ...prev,
            [sectionId]: `# Error\n\nFailed to load ${sectionId}: ${
              error.error || 'Unknown error'
            }`,
          }));
        }
      } catch (error) {
        console.error(`Failed to load ${sectionId}:`, error);
        setContent((prev) => ({
          ...prev,
          [sectionId]: `# Error\n\nFailed to load ${sectionId}. Please try again.`,
        }));
      } finally {
        setLoading((prev) => ({ ...prev, [sectionId]: false }));
      }
    },
    [content, sessionId]
  );

  // Load all sections when sections are fetched
  useEffect(() => {
    if (sections.length > 0 && !isLoadingSections) {
      // Load all sections in parallel
      sections.forEach((section) => {
        // loadSection already checks if content exists, so safe to call for all
        loadSection(section.id);
      });
    }
  }, [sections, isLoadingSections, loadSection]);

  const downloadMarkdown = (sectionId: string) => {
    if (!content[sectionId] || typeof window === 'undefined') return;

    try {
      const blob = new Blob([content[sectionId]], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      const section = sections.find((s) => s.id === sectionId);
      const sectionLabel = section?.label || sectionId;
      a.download = `${sectionLabel.replace(/\s+/g, '_').toLowerCase()}.md`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download markdown:', error);
      alert('Failed to download markdown. Please try again.');
    }
  };

  const handleGenerateTickets = async () => {
    setIsGeneratingTickets(true);

    try {
      const response = await fetch(`/api/clarifier/sessions/${sessionId}/generate-tickets`, {
        method: 'POST',
      });

      if (response.ok) {
        const { run } = await response.json();
        // Redirect to tickets page to view generated tickets
        router.push(`/projects/${projectId}/tickets/${run.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate tickets');
      }
    } catch (error) {
      console.error('Failed to generate tickets:', error);
      alert('Failed to generate tickets. Please try again.');
    } finally {
      setIsGeneratingTickets(false);
    }
  };

  const getSectionTypeBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      hld: { bg: 'bg-[color:rgba(37,99,235,0.12)] text-[color:var(--color-primary)]', text: 'HLD' },
      lld: { bg: 'bg-[color:rgba(37,99,235,0.12)] text-[color:var(--color-primary)]', text: 'LLD' },
      guide: { bg: 'bg-[color:rgba(15,23,42,0.08)] text-[color:rgba(15,23,42,0.7)]', text: 'Guide' },
      reference: { bg: 'bg-[color:rgba(15,23,42,0.08)] text-[color:rgba(15,23,42,0.7)]', text: 'Ref' },
    };
    return badges[type] || badges.guide;
  };

  const getSectionIcon = (section: HDDSectionConfig) => {
    if (section.id.toLowerCase().includes('user')) {
      return Users;
    }
    switch (section.type) {
      case 'hld':
        return Layers;
      case 'lld':
        return ScrollText;
      case 'reference':
        return ScrollText;
      case 'guide':
      default:
        return BookOpen;
    }
  };

  if (isLoadingSections) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
          <p className="text-sm font-semibold text-[color:var(--color-text)]">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      {/* Header */}
      <div className="border-b border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}/business-document/${sessionId}`)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:text-[color:rgba(15,23,42,0.7)]"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to business document</span>
              </button>
              <div className="h-6 w-px bg-[color:rgba(15,23,42,0.16)]"></div>
              <h1 className="text-lg font-semibold text-[color:var(--color-text)]">
                High-level design document
              </h1>
            </div>
            <button
              onClick={handleGenerateTickets}
              disabled={isGeneratingTickets}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingTickets ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <LayoutList className="h-4 w-4" />
                  <span>Generate sprint</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Section List */}
          <div className="w-72 rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-[color:var(--color-text)]">Sections</h2>
            <nav className="space-y-2">
              {sections.map((section) => {
                const badge = getSectionTypeBadge(section.type);
                const SectionIcon = getSectionIcon(section);
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    disabled={loading[section.id]}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all flex items-center gap-3 ${
                      loading[section.id]
                        ? 'opacity-50 cursor-not-allowed bg-[color:var(--color-background)]'
                        : activeSection === section.id
                        ? 'bg-[color:rgba(37,99,235,0.12)] text-[color:var(--color-primary)] font-semibold'
                        : 'text-[color:rgba(15,23,42,0.7)] hover:bg-[color:var(--color-background)]'
                    }`}
                  >
                    <SectionIcon className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm">{section.label}</div>
                      <div className="truncate text-xs text-[color:rgba(15,23,42,0.5)]">{section.description}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.bg}`}>
                      {badge.text}
                    </span>
                    {loading[section.id] && (
                      <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-primary)]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Side - Content Display */}
          <div className="flex-1 rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] shadow-sm overflow-hidden flex flex-col">
            {/* Content Header */}
            <div className="border-b border-[color:rgba(15,23,42,0.12)] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const active = sections.find((s) => s.id === activeSection);
                  const Icon = active ? getSectionIcon(active) : Layers;
                  return <Icon className="h-5 w-5 text-[color:var(--color-primary)]" />;
                })()}
                <div>
                  <h2 className="text-base font-semibold text-[color:var(--color-text)]">
                    {sections.find((s) => s.id === activeSection)?.label}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[color:rgba(15,23,42,0.6)]">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        getSectionTypeBadge(
                          sections.find((s) => s.id === activeSection)?.type || 'guide'
                        ).bg
                      }`}
                    >
                      {
                        getSectionTypeBadge(
                          sections.find((s) => s.id === activeSection)?.type || 'guide'
                        ).text
                      }
                    </span>
                  </div>
                </div>
            </div>
            <button
              onClick={() => downloadMarkdown(activeSection)}
              disabled={!content[activeSection] || loading[activeSection]}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-xs font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileDown className="h-4 w-4 text-[color:var(--color-primary)]" />
              <span>Download MD</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading[activeSection] ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
                <p className="mt-3 text-sm text-[color:rgba(15,23,42,0.6)]">Generating content...</p>
              </div>
            ) : content[activeSection] ? (
              <div className="markdown-content">
                <ReactMarkdown>{content[activeSection]}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[color:rgba(15,23,42,0.6)]">
                <p>No content available</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
