'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function AdminPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEstimating, setIsEstimating] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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
            alert(`✅ Successfully estimated and assigned ${data.totalTickets} tickets!\n\n` +
              `📊 Summary:\n` +
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

  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-indigo-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900">ClickUp Admin</h1>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                View and manage your ClickUp folders, sprints, and tickets
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEstimate}
                disabled={isEstimating || !selectedProjectId}
                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isEstimating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Estimating...</span>
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    <span>Estimate</span>
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>🏠</span>
                <span>Home</span>
              </button>
            </div>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-4">
            <label className="text-gray-700 font-semibold">Select Project:</label>
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="flex-1 max-w-md px-4 py-3 bg-gray-50 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium"
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

        {selectedProjectId ? (
          <>
            {/* Back Button */}
            <button
              onClick={() => router.push(`/projects/${selectedProjectId}`)}
              className="text-indigo-600 hover:text-indigo-700 font-semibold mb-6 flex items-center gap-2 transition-colors group"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
              <span>Back to Project</span>
            </button>

            {/* Folders Section */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-indigo-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span>📁</span>
                <span>Project Folders ({folders.length})</span>
              </h2>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Loading folders from ClickUp...</p>
                </div>
              ) : folders.length > 0 ? (
                <div className="space-y-4">
                  {folders.map((folder) => (
                    <div key={folder.id} className="border border-indigo-200 rounded-xl overflow-hidden">
                      {/* Folder Header */}
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{expandedFolders.has(folder.id) ? '📂' : '📁'}</span>
                          <span className="font-semibold text-gray-900">{folder.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {folder.lists?.length || 0} sprint{folder.lists?.length !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {/* Sprint Lists */}
                      {expandedFolders.has(folder.id) && folder.lists && folder.lists.length > 0 && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {folder.lists.map((list) => (
                              <div
                                key={list.id}
                                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-900">{list.name}</span>
                                  <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                    {list.task_count || 0} tasks
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">ID: {list.id}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No folders found. Create tickets to generate folders.</p>
              )}
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span>🎫</span>
                <span>All Tasks ({tasks.length})</span>
              </h2>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Loading tasks from ClickUp...</p>
                </div>
              ) : tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Sprint</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Task</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Estimate</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {task.sprintList || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: task.status?.color || '#e5e7eb',
                                color: '#1f2937',
                              }}
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
                                className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                              >
                                {task.name}
                              </a>
                            ) : (
                              <span className="font-medium text-gray-900">{task.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {task.priority ? (
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                task.priority === 1 ? 'bg-red-100 text-red-700' :
                                task.priority === 2 ? 'bg-orange-100 text-orange-700' :
                                task.priority === 3 ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {task.priority === 1 ? 'Urgent' :
                                 task.priority === 2 ? 'High' :
                                 task.priority === 3 ? 'Normal' : 'Low'}
                              </span>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {task.time_estimate ? (
                              <span className="text-gray-700">
                                {Math.round(task.time_estimate / 3600000)}h
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {/* ClickUp returns assignees as an array, handle both formats */}
                            {(() => {
                              const assignee = task.assignee || (task.assignees && task.assignees[0]);
                              if (assignee) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                      {assignee.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span className="text-gray-700">{assignee.username || 'Unknown'}</span>
                                  </div>
                                );
                              }
                              return <span className="text-gray-400">Unassigned</span>;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
                  <p className="text-gray-500 mb-6">
                    Create tickets for this project to see them here
                  </p>
                  <button
                    onClick={() => router.push(`/projects/${selectedProjectId}`)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold"
                  >
                    Go to Project
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-12 border border-indigo-100 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Project Selected</h2>
            <p className="text-gray-500 mb-6">
              Select a project from the dropdown above to view its ClickUp data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
