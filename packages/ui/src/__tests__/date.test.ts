import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime, formatDateTime } from '../lib/date';

describe('date utilities', () => {
  beforeEach(() => {
    // Mock Date.now to return a fixed time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-28T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatRelativeTime', () => {
    it('should return "agora mesmo" for recent times', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('agora mesmo');
    });

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date('2025-01-28T11:55:00Z');
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutos atrás');
    });

    it('should return "1 minuto atrás" for singular', () => {
      const oneMinuteAgo = new Date('2025-01-28T11:59:00Z');
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minuto atrás');
    });

    it('should return hours ago', () => {
      const threeHoursAgo = new Date('2025-01-28T09:00:00Z');
      expect(formatRelativeTime(threeHoursAgo)).toBe('3 horas atrás');
    });

    it('should return "1 hora atrás" for singular', () => {
      const oneHourAgo = new Date('2025-01-28T11:00:00Z');
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hora atrás');
    });

    it('should return days ago', () => {
      const threeDaysAgo = new Date('2025-01-25T12:00:00Z');
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 dias atrás');
    });

    it('should return "1 dia atrás" for singular', () => {
      const oneDayAgo = new Date('2025-01-27T12:00:00Z');
      expect(formatRelativeTime(oneDayAgo)).toBe('1 dia atrás');
    });

    it('should return weeks ago', () => {
      const twoWeeksAgo = new Date('2025-01-14T12:00:00Z');
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2 semanas atrás');
    });

    it('should handle string dates', () => {
      expect(formatRelativeTime('2025-01-28T11:55:00Z')).toBe('5 minutos atrás');
    });
  });

  describe('formatDateTime', () => {
    it('should format date correctly', () => {
      const result = formatDateTime('2025-01-28T14:30:00Z');
      // Note: this will depend on locale, so we just check it contains expected parts
      expect(result).toMatch(/28\/01\/2025/);
    });

    it('should handle Date objects', () => {
      const result = formatDateTime(new Date('2025-01-28T14:30:00Z'));
      expect(result).toMatch(/28\/01\/2025/);
    });
  });
});
