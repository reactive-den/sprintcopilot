'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface HDDSectionConfig {
  id: string;
  label: string;
  icon: string;
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
              { id: 'architecture', label: 'Architecture', icon: '🏗️', type: 'hld', description: 'High-level system architecture' },
              { id: 'deployment', label: 'Deployment', icon: '🚀', type: 'guide', description: 'Deployment steps' },
              { id: 'dataflow', label: 'Data Flow', icon: '🔄', type: 'hld', description: 'Data flow diagrams' },
              { id: 'users', label: 'Users', icon: '👥', type: 'guide', description: 'User documentation' },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sections:', error);
        // Use default sections on error
        setSections([
          { id: 'architecture', label: 'Architecture', icon: '🏗️', type: 'hld', description: 'High-level system architecture' },
          { id: 'deployment', label: 'Deployment', icon: '🚀', type: 'guide', description: 'Deployment steps' },
          { id: 'dataflow', label: 'Data Flow', icon: '🔄', type: 'hld', description: 'Data flow diagrams' },
          { id: 'users', label: 'Users', icon: '👥', type: 'guide', description: 'User documentation' },
        ]);
      } finally {
        setIsLoadingSections(false);
      }
    };

    fetchSections();
  }, [sessionId]);

  const loadSection = useCallback(async (sectionId: string) => {
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
          [sectionId]: `# Error\n\nFailed to load ${sectionId}: ${error.error || 'Unknown error'}`,
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
  }, [content, sessionId]);

  // Load active section on mount and when it changes
  useEffect(() => {
    if (activeSection && !isLoadingSections) {
      loadSection(activeSection);
    }
  }, [activeSection, isLoadingSections, loadSection]);

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
      hld: { bg: 'bg-blue-100 text-blue-700', text: 'HLD' },
      lld: { bg: 'bg-purple-100 text-purple-700', text: 'LLD' },
      guide: { bg: 'bg-green-100 text-green-700', text: 'Guide' },
      reference: { bg: 'bg-gray-100 text-gray-700', text: 'Ref' },
    };
    return badges[type] || badges.guide;
  };

  if (isLoadingSections) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}/business-document/${sessionId}`)}
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2 transition-colors group"
              >
                <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                <span>Back to Business Document</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">High-Level Design Document (HDD)</h1>
            </div>
            <button
              onClick={handleGenerateTickets}
              disabled={isGeneratingTickets}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:transform-none flex items-center gap-2"
            >
              {isGeneratingTickets ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>🎫</span>
                  <span>Generate Tickets</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Section List */}
          <div className="w-72 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sections</h2>
            <nav className="space-y-2">
              {sections.map((section) => {
                const badge = getSectionTypeBadge(section.type);
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{section.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{section.label}</div>
                      <div className="text-xs text-gray-400 truncate">{section.description}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bg}`}>
                      {badge.text}
                    </span>
                    {loading[section.id] && (
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Side - Content Display */}
          <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            {/* Content Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {sections.find((s) => s.id === activeSection)?.icon}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {sections.find((s) => s.id === activeSection)?.label}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getSectionTypeBadge(sections.find((s) => s.id === activeSection)?.type || 'guide').bg}`}>
                      {getSectionTypeBadge(sections.find((s) => s.id === activeSection)?.type || 'guide').text}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => downloadMarkdown(activeSection)}
                disabled={!content[activeSection] || loading[activeSection]}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center gap-2"
              >
                <span>📥</span>
                <span>Download MD</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading[activeSection] ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Generating content...</p>
                </div>
              ) : content[activeSection] ? (
                <div className="markdown-content">
                  <ReactMarkdown>{content[activeSection]}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
