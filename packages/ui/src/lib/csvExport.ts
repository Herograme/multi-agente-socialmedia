import { ExecutionStatus } from '@social-content/shared';
import type { ExecutionWithDuration } from '@social-content/shared';

/**
 * Exports executions data to a CSV file and triggers download
 */
export function exportExecutionsToCSV(executions: ExecutionWithDuration[]): void {
  const headers = [
    'ID',
    'Data Inicio',
    'Data Fim',
    'Duracao (s)',
    'Status',
    'Posts Gerados',
    'Posts Aprovados',
    'Score Medio',
  ];

  const rows = executions.map((execution) => [
    execution.id,
    formatDateForCSV(execution.startedAt),
    execution.finishedAt ? formatDateForCSV(execution.finishedAt) : '',
    Math.round(execution.duration / 1000).toString(),
    translateStatus(execution.status),
    execution.postsGenerated.toString(),
    execution.postsApproved.toString(),
    execution.averageScore?.toFixed(2) || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const today = new Date().toISOString().split('T')[0];
  downloadCSV(csvContent, `execucoes-${today}.csv`);
}

/**
 * Format date for CSV (ISO format)
 */
function formatDateForCSV(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Translate execution status to Portuguese
 */
function translateStatus(status: ExecutionStatus): string {
  const translations: Record<ExecutionStatus, string> = {
    [ExecutionStatus.COMPLETED]: 'Sucesso',
    [ExecutionStatus.PENDING]: 'Pendente',
    [ExecutionStatus.RUNNING]: 'Executando',
    [ExecutionStatus.FAILED]: 'Falha',
    [ExecutionStatus.CANCELLED]: 'Cancelado',
  };
  return translations[status] || status;
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
export function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger CSV file download in browser
 */
function downloadCSV(content: string, filename: string): void {
  // Add BOM for Excel compatibility with UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate CSV content without triggering download (useful for testing)
 */
export function generateExecutionsCSVContent(executions: ExecutionWithDuration[]): string {
  const headers = [
    'ID',
    'Data Inicio',
    'Data Fim',
    'Duracao (s)',
    'Status',
    'Posts Gerados',
    'Posts Aprovados',
    'Score Medio',
  ];

  const rows = executions.map((execution) => [
    execution.id,
    formatDateForCSV(execution.startedAt),
    execution.finishedAt ? formatDateForCSV(execution.finishedAt) : '',
    Math.round(execution.duration / 1000).toString(),
    translateStatus(execution.status),
    execution.postsGenerated.toString(),
    execution.postsApproved.toString(),
    execution.averageScore?.toFixed(2) || '',
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');
}
