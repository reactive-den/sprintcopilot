import { useState } from 'react';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportCSV = async (runId: string, projectTitle: string) => {
    setIsExporting(true);
    setExportError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/export/csv`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to export CSV' }));
        throw new Error(errorData.error || 'Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprintcopilot-${projectTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-tickets.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export CSV';
      setExportError(message);
      console.error('Export CSV error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const createClickUpTasks = async (runId: string) => {
    setIsExporting(true);
    setExportError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/export/clickup`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create ClickUp tasks' }));
        throw new Error(errorData.error || 'Failed to create ClickUp tasks');
      }

      const data = await response.json();
      if (data.failed?.length) {
        setExportError(`Created ${data.created?.length || 0} tasks, ${data.failed.length} failed.`);
      }
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create ClickUp tasks';
      setExportError(message);
      console.error('Create ClickUp tasks error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCSV, createClickUpTasks, isExporting, exportError };
}
