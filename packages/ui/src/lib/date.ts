/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'agora mesmo';
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minuto atrás' : `${diffMinutes} minutos atrás`;
  }

  if (diffHours < 24) {
    return diffHours === 1 ? '1 hora atrás' : `${diffHours} horas atrás`;
  }

  if (diffDays < 7) {
    return diffDays === 1 ? '1 dia atrás' : `${diffDays} dias atrás`;
  }

  if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 semana atrás' : `${diffWeeks} semanas atrás`;
  }

  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 mês atrás' : `${diffMonths} meses atrás`;
  }

  return past.toLocaleDateString('pt-BR');
}

/**
 * Format a date as a localized string
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
