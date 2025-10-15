export function useExport() {
  const exportCSV = async (runId: string, projectTitle: string) => {
    try {
      const response = await fetch(`/api/runs/${runId}/export/csv`);
      if (!response.ok) {
        throw new Error('Failed to export CSV');
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
      console.error('Export CSV error:', error);
      throw error;
    }
  };

  const exportJira = async (runId: string, projectTitle: string) => {
    try {
      const response = await fetch(`/api/runs/${runId}/export/jira`);
      if (!response.ok) {
        throw new Error('Failed to export Jira JSON');
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprintcopilot-${projectTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-jira.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export Jira error:', error);
      throw error;
    }
  };

  return { exportCSV, exportJira };
}
