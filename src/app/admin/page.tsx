'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Folder,
  FolderOpen,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Ticket,
  UploadCloud,
} from 'lucide-react';

interface ClickUpTask {
  id: string;
  name: string;
  status: { status: string; color: string };
  priority: number | null;
  time_estimate: number | null;
  assignee: { id: string; username: string; email: string } | null;
  assignees?: Array<{ id: string; username: string; email: string }>;
  url?: string;
  sprintList?: string;
}

interface Project {
  id: string;
  title: string;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  lists: Array<{
    id: string;
    name: string;
    task_count: number;
  }>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isAddingSprint, setIsAddingSprint] = useState(false);
  const [showAddSprintModal, setShowAddSprintModal] = useState(false);
  const [featureDescription, setFeatureDescription] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch projects from ClickUp on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/clickup/data');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects from ClickUp:', error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch ClickUp folder data when project is selected
  useEffect(() => {
    if (!selectedProjectId) {
      setFolders([]);
      setTasks([]);
      setIsLoading(false);
      return;
    }

    const fetchClickUpData = async () => {
      setIsLoading(true);
      try {
        // Fetch ClickUp data directly using the folder ID
        const response = await fetch(`/api/clickup/data?folderId=${selectedProjectId}`);
        if (response.ok) {
          const data = await response.json();

          // Find the selected folder
          const selectedFolder = data.folders?.find((f: any) => f.id === selectedProjectId);
          if (selectedFolder) {
            setFolders([selectedFolder]);

            // Fetch all tasks from all sprint lists in this folder
            const allTasks: any[] = [];
            for (const list of selectedFolder.lists || []) {
              const tasksResponse = await fetch(`/api/clickup/list/${list.id}/tasks`);
              if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                allTasks.push(...tasksData.tasks.map((t: any) => ({
                  ...t,
                  sprintList: list.name
                })));
              }
            }
            setTasks(allTasks);

            // Auto-expand the folder
            setExpandedFolders(new Set([selectedProjectId]));
          }
        }
      } catch (error) {
        console.error('Failed to fetch ClickUp data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClickUpData();
  }, [selectedProjectId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    setChatMessages([]);
    setChatError(null);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleEstimate = async () => {
    if (!selectedProjectId) return;

    setIsEstimating(true);
    try {
      // Find the project in database by matching folder name
      const projectResponse = await fetch('/api/projects');
      if (projectResponse.ok) {
        const { projects } = await projectResponse.json();
        const selectedProject = projects?.find((p: any) =>
          p.title === folders[0]?.name
        );

        if (selectedProject) {
          const estimateResponse = await fetch(`/api/projects/${selectedProject.id}/estimate-and-assign`, {
            method: 'POST',
          });

          if (estimateResponse.ok) {
            const data = await estimateResponse.json();
            alert(`Successfully estimated and assigned ${data.totalTickets} tickets.\n\n` +
              `Summary:\n` +
              `- FE tickets: ${data.feTickets}\n` +
              `- BE tickets: ${data.beTickets}\n` +
              `- Fullstack tickets: ${data.fullstackTickets}`);
            // Refresh the data
            window.location.reload();
          } else {
            const error = await estimateResponse.json();
            alert(error.error || 'Failed to estimate tickets');
          }
        } else {
          alert('No matching project found in database for this ClickUp folder');
        }
      } else {
        alert('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Failed to estimate and assign tickets:', error);
      alert('Failed to estimate tickets');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleAddSprint = () => {
    if (!selectedProjectId) return;
    setShowAddSprintModal(true);
    setFeatureDescription('');
  };

  const handleCreateSprintWithTickets = async () => {
    if (!selectedProjectId || !featureDescription.trim()) {
      alert('Please provide a feature description');
      return;
    }

    setIsAddingSprint(true);
    try {
      // Get the current folder to find the next sprint number
      const currentSprintCount = folders[0]?.lists?.length || 0;
      const nextSprintNumber = currentSprintCount + 1;

      // Generate tickets and create run (but don't create sprint in ClickUp yet)
      const response = await fetch(`/api/clickup/folder/${selectedProjectId}/generate-sprint-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sprintNumber: nextSprintNumber,
          featureDescription: featureDescription.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to tickets page where user can edit and then upload to ClickUp
        router.push(`/projects/${data.projectId}/tickets/${data.runId}?sprintNumber=${nextSprintNumber}&folderId=${selectedProjectId}`);
      } else {
        const error = await response.json();
        console.error('Failed to generate tickets:', error);
        const errorMessage = error.error || error.message || 'Failed to generate tickets';
        alert(`Error: ${errorMessage}\n\nPlease ensure:\n- Project has a business document\n- Project has HDD sections generated\n- Feature description is detailed enough`);
      }
    } catch (error) {
      console.error('Failed to generate tickets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate tickets: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setIsAddingSprint(false);
    }
  };

  const handleChatSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setChatError(null);

    if (!selectedProjectId) {
      setChatError('Select a project before asking a question.');
      return;
    }

    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const nextMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: trimmed },
    ];

    setChatMessages(nextMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/admin/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          messages: nextMessages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setChatError(error.error || 'Failed to fetch progress.');
        return;
      }

      const data = await response.json();
      if (data?.reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error('Failed to fetch admin progress:', error);
      setChatError('Failed to fetch progress.');
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[color:var(--color-background)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
          <p className="text-sm font-semibold text-[color:var(--color-text)]">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="mb-8 rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:rgba(37,99,235,0.12)]">
                  <UploadCloud className="h-5 w-5 text-[color:var(--color-primary)]" />
                </div>
                <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">ClickUp admin</h1>
              </div>
              <p className="text-sm leading-relaxed text-[color:rgba(15,23,42,0.7)]">
                View and manage your ClickUp folders, sprints, and tickets
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95"
              >
                <Plus className="h-4 w-4" />
                <span>Add project</span>
              </button>
            </div>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-[color:var(--color-text)]">Select project:</label>
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="flex-1 max-w-md h-11 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)]"
            >
              <option value="">-- Select a project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Sprint Modal */}
        {showAddSprintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(15,23,42,0.4)] p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[color:var(--color-text)]">Add new sprint</h2>
                <button
                  onClick={() => {
                    setShowAddSprintModal(false);
                    setFeatureDescription('');
                  }}
                  className="text-sm font-semibold text-[color:rgba(15,23,42,0.6)] transition hover:text-[color:rgba(15,23,42,0.85)]"
                >
                  Close
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[color:var(--color-text)]">
                    Feature Description *
                  </label>
                  <textarea
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    placeholder="Describe the feature or functionality you want to implement in this sprint..."
                    className="w-full rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 py-3 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)] resize-none"
                    rows={8}
                    disabled={isAddingSprint}
                  />
                  <p className="mt-2 text-xs text-[color:rgba(15,23,42,0.6)]">
                    This feature will be used along with your project's HDD, LLDs, and business document context to generate tickets.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateSprintWithTickets}
                  disabled={isAddingSprint || !featureDescription.trim()}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingSprint ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Sprint & Tickets...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create sprint</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddSprintModal(false);
                    setFeatureDescription('');
                  }}
                  disabled={isAddingSprint}
                  className="h-11 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedProjectId ? (
          <>
            {/* Back Button */}
            <button
              onClick={() => router.push(`/projects/${selectedProjectId}`)}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)] transition hover:text-[color:rgba(15,23,42,0.7)]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Project</span>
            </button>

            {/* Admin Progress Chat */}
            <div className="mb-8 rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--color-text)]">
                  <MessageSquare className="h-4 w-4 text-[color:var(--color-primary)]" />
                  <span>Admin progress chat</span>
                </h2>
                <span className="text-xs text-[color:rgba(15,23,42,0.6)]">
                  Ask about project, sprint, or assignee progress
                </span>
              </div>

              <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4">
                <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-[color:rgba(15,23,42,0.6)]">
                      Ask a question like "How is the current sprint going?"
                    </p>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            message.role === 'user'
                              ? 'bg-[color:var(--color-primary)] text-white'
                              : 'border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]'
                          } whitespace-pre-wrap`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] px-4 py-3 text-sm text-[color:rgba(15,23,42,0.6)]">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {chatError && (
                <p className="mt-3 text-sm text-[color:var(--color-danger)]">{chatError}</p>
              )}

              <form onSubmit={handleChatSend} className="mt-4 flex gap-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about progress, blockers, or assignees..."
                  className="flex-1 h-11 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(37,99,235,0.2)]"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </form>
            </div>

            {/* Folders Section */}
            <div className="mb-8 rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--color-text)]">
                  <Folder className="h-4 w-4 text-[color:var(--color-primary)]" />
                  <span>Project folders ({folders.length})</span>
                </h2>
                {selectedProjectId && (
                  <button
                    onClick={handleAddSprint}
                    disabled={isAddingSprint || !selectedProjectId}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAddingSprint ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Adding Sprint...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Add sprint</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
                  <p className="mt-3 text-sm text-[color:rgba(15,23,42,0.6)]">Loading folders from ClickUp...</p>
                </div>
              ) : folders.length > 0 ? (
                <div className="space-y-4">
                  {folders.map((folder) => (
                    <div key={folder.id} className="overflow-hidden rounded-xl border border-[color:rgba(15,23,42,0.12)]">
                      {/* Folder Header */}
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="flex w-full items-center justify-between bg-[color:var(--color-background)] px-4 py-3 text-left text-sm transition hover:bg-[color:rgba(37,99,235,0.08)]"
                      >
                        <div className="flex items-center gap-3">
                          {expandedFolders.has(folder.id) ? (
                            <FolderOpen className="h-4 w-4 text-[color:var(--color-primary)]" />
                          ) : (
                            <Folder className="h-4 w-4 text-[color:var(--color-primary)]" />
                          )}
                          <span className="font-semibold text-[color:var(--color-text)]">{folder.name}</span>
                        </div>
                        <span className="text-xs text-[color:rgba(15,23,42,0.6)]">
                          {folder.lists?.length || 0} sprint{folder.lists?.length !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {/* Sprint Lists */}
                      {expandedFolders.has(folder.id) && folder.lists && folder.lists.length > 0 && (
                        <div className="bg-[color:var(--color-surface)] p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {folder.lists.map((list) => (
                              <div
                                key={list.id}
                                className="rounded-xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-background)] p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-[color:var(--color-text)]">{list.name}</span>
                                  <span className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-2 py-1 text-xs text-[color:rgba(15,23,42,0.7)]">
                                    {list.task_count || 0} tasks
                                  </span>
                                </div>
                                <p className="text-xs text-[color:rgba(15,23,42,0.55)]">ID: {list.id}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:rgba(15,23,42,0.6)]">
                  No folders found. Create tickets to generate folders.
                </p>
              )}
            </div>

            {/* Tasks Section */}
            <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--color-text)]">
                  <Ticket className="h-4 w-4 text-[color:var(--color-primary)]" />
                  <span>All tasks ({tasks.length})</span>
                </h2>
                <button
                  onClick={handleEstimate}
                  disabled={isEstimating || !selectedProjectId}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-[color:rgba(15,23,42,0.16)] bg-[color:var(--color-surface)] px-4 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:rgba(15,23,42,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEstimating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-primary)]" />
                      <span>Estimating...</span>
                    </>
                  ) : (
                    <>
                      <span>Estimate</span>
                    </>
                  )}
                </button>
              </div>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-primary)]" />
                  <p className="mt-3 text-sm text-[color:rgba(15,23,42,0.6)]">Loading tasks from ClickUp...</p>
                </div>
              ) : tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[color:rgba(15,23,42,0.12)]">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(15,23,42,0.6)]">Sprint</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(15,23,42,0.6)]">Status</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(15,23,42,0.6)]">Task</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(15,23,42,0.6)]">Priority</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(15,23,42,0.6)]">Estimate</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(15,23,42,0.6)]">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id} className="border-b border-[color:rgba(15,23,42,0.08)] hover:bg-[color:rgba(37,99,235,0.04)]">
                          <td className="py-3 px-4">
                            <span className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs text-[color:rgba(15,23,42,0.7)]">
                              {task.sprintList || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="rounded-full border border-[color:rgba(15,23,42,0.16)] px-3 py-1 text-xs text-[color:rgba(15,23,42,0.7)]"
                            >
                              {task.status?.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {task.url ? (
                              <a
                                href={task.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[color:var(--color-primary)] hover:underline"
                              >
                                {task.name}
                              </a>
                            ) : (
                              <span className="text-sm font-medium text-[color:var(--color-text)]">{task.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              if (!task.priority) {
                                return (
                                  <span className="text-xs text-[color:rgba(15,23,42,0.5)]">None</span>
                                );
                              }
                              if (typeof task.priority === 'number') {
                                return (
                                  <span className="rounded-full border border-[color:rgba(37,99,235,0.3)] bg-[color:rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]">
                                    P{task.priority}
                                  </span>
                                );
                              }
                              const label = String(task.priority.priority || task.priority)
                                .trim()
                                .replace(/^./, (char) => char.toUpperCase());
                              return (
                                <span className="rounded-full border border-[color:rgba(37,99,235,0.3)] bg-[color:rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]">
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4">
                            {task.time_estimate ? (
                              <span className="text-sm text-[color:rgba(15,23,42,0.7)]">
                                {Math.round(task.time_estimate / 3600000)}h
                              </span>
                            ) : (
                              <span className="text-xs text-[color:rgba(15,23,42,0.5)]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {/* ClickUp returns assignees as an array, handle both formats */}
                            {(() => {
                              const assignee = task.assignee || (task.assignees && task.assignees[0]);
                              if (assignee) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:rgba(15,23,42,0.12)] text-xs font-semibold text-[color:var(--color-text)]">
                                      {assignee.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span className="text-sm text-[color:rgba(15,23,42,0.7)]">{assignee.username || 'Unknown'}</span>
                                  </div>
                                );
                              }
                              return <span className="text-xs text-[color:rgba(15,23,42,0.5)]">Unassigned</span>;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(37,99,235,0.12)]">
                    <Ticket className="h-5 w-5 text-[color:var(--color-primary)]" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">No tasks yet</h3>
                  <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
                    Create tickets for this project to see them here
                  </p>
                  <button
                    onClick={() => router.push(`/projects/${selectedProjectId}`)}
                    className="mt-6 h-11 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Go to Project
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-[color:rgba(15,23,42,0.12)] bg-[color:var(--color-surface)] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:rgba(37,99,235,0.12)]">
              <Folder className="h-5 w-5 text-[color:var(--color-primary)]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[color:var(--color-text)]">No project selected</h2>
            <p className="mt-2 text-sm text-[color:rgba(15,23,42,0.6)]">
              Select a project from the dropdown above to view its ClickUp data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
