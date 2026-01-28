import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatDate,
  maskSecret,
  isDefined,
  safeJsonParse,
  truncate,
  pick,
  omit,
} from '../utils/helpers';

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with expected format', () => {
    const id = generateId();

    expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});

describe('formatDate', () => {
  it('should format date as ISO string', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDate(date);

    expect(formatted).toBe('2024-01-15T10:30:00.000Z');
  });
});

describe('maskSecret', () => {
  it('should mask short secrets completely', () => {
    expect(maskSecret('abc')).toBe('****');
    expect(maskSecret('12345678')).toBe('****');
  });

  it('should mask long secrets with visible ends', () => {
    expect(maskSecret('sk-1234567890abcdef')).toBe('sk-1****cdef');
  });
});

describe('isDefined', () => {
  it('should return true for defined values', () => {
    expect(isDefined('string')).toBe(true);
    expect(isDefined(0)).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined([])).toBe(true);
    expect(isDefined({})).toBe(true);
  });

  it('should return false for null and undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    const result = safeJsonParse('{"key":"value"}', {});
    expect(result).toEqual({ key: 'value' });
  });

  it('should return fallback for invalid JSON', () => {
    const fallback = { default: true };
    const result = safeJsonParse('invalid json', fallback);
    expect(result).toBe(fallback);
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long strings with default suffix', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('should truncate with custom suffix', () => {
    expect(truncate('hello world', 9, '…')).toBe('hello wo…');
  });
});

describe('pick', () => {
  it('should pick specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = pick(obj, ['a', 'c']);

    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should ignore non-existent keys', () => {
    const obj = { a: 1, b: 2 };
    const result = pick(obj, ['a', 'c' as keyof typeof obj]);

    expect(result).toEqual({ a: 1 });
  });
});

describe('omit', () => {
  it('should omit specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = omit(obj, ['b']);

    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should handle non-existent keys', () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, ['c' as keyof typeof obj]);

    expect(result).toEqual({ a: 1, b: 2 });
  });
});
