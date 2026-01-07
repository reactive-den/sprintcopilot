'use client';

'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

type HDDSection = 'architecture' | 'deployment' | 'dataflow' | 'users';

const SECTIONS: { id: HDDSection; label: string; icon: string }[] = [
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'deployment', label: 'Deployment Steps', icon: '🚀' },
  { id: 'dataflow', label: 'Data Flow', icon: '🔄' },
  { id: 'users', label: 'Users', icon: '👥' },
];

export default function HDDPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id: projectId, sessionId } = use(params);
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<HDDSection>('architecture');
  const [content, setContent] = useState<Record<HDDSection, string>>({
    architecture: '',
    deployment: '',
    dataflow: '',
    users: '',
  });
  const [loading, setLoading] = useState<Record<HDDSection, boolean>>({
    architecture: false,
    deployment: false,
    dataflow: false,
    users: false,
  });
  const [isGeneratingTickets, setIsGeneratingTickets] = useState(false);

  useEffect(() => {
    loadSection(activeSection);
  }, [activeSection, sessionId]);

  const loadSection = async (section: HDDSection) => {
    if (content[section]) {
      // Content already loaded in state
      return;
    }

    setLoading((prev) => ({ ...prev, [section]: true }));

    try {
      // First try GET to fetch existing, then POST to generate if not found
      let response = await fetch(`/api/clarifier/sessions/${sessionId}/hdd/${section}`);

      if (!response.ok && response.status === 404) {
        // Not found, generate it
        response = await fetch(`/api/clarifier/sessions/${sessionId}/hdd/${section}`, {
          method: 'POST',
        });
      }

      if (response.ok) {
        const { content: sectionContent } = await response.json();
        setContent((prev) => ({ ...prev, [section]: sectionContent }));
      } else {
        const error = await response.json();
        setContent((prev) => ({
          ...prev,
          [section]: `# Error\n\nFailed to load ${section}: ${error.error || 'Unknown error'}`,
        }));
      }
    } catch (error) {
      console.error(`Failed to load ${section}:`, error);
      setContent((prev) => ({
        ...prev,
        [section]: `# Error\n\nFailed to load ${section}. Please try again.`,
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [section]: false }));
    }
  };

  const downloadMarkdown = (section: HDDSection) => {
    if (!content[section] || typeof window === 'undefined') return;

    try {
      const blob = new Blob([content[section]], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      const sectionLabel = SECTIONS.find((s) => s.id === section)?.label || section;
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
    if (!confirm('Generate tickets based on Business Document, Problem Statement, and HDD?')) {
      return;
    }

    setIsGeneratingTickets(true);

    try {
      const response = await fetch(`/api/clarifier/sessions/${sessionId}/generate-tickets`, {
        method: 'POST',
      });

      if (response.ok) {
        const { run } = await response.json();
        // Redirect to project page with the new run
        router.push(`/projects/${projectId}?runId=${run.id}`);
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
          <div className="w-64 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sections</h2>
            <nav className="space-y-2">
              {SECTIONS.map((section) => (
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
                  <span>{section.label}</span>
                  {loading[section.id] && (
                    <div className="ml-auto w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Side - Content Display */}
          <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            {/* Content Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {SECTIONS.find((s) => s.id === activeSection)?.label}
              </h2>
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
