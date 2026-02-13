/**
 * Unit Tests for Date Formatter (Backend)
 * Feature: date-formatting-fixes
 * Validates: Requirements 2.4, 2.6, 3.3
 */

const { formatDate, formatDateShort, formatDateLong, formatDateTime } = require('../dateFormatter.cjs');

describe('Date Formatter Unit Tests', () => {
  const testDate = new Date('2024-02-20T15:45:30Z');

  describe('formatDate with different styles', () => {
    test('formats date in short style', () => {
      const result = formatDate(testDate, { style: 'short' });
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/); // e.g., "2/20/24"
    });

    test('formats date in medium style (default)', () => {
      const result = formatDate(testDate, { style: 'medium' });
      expect(result).toContain('2024');
      expect(result).toContain('20');
    });

    test('formats date in long style', () => {
      const result = formatDate(testDate, { style: 'long' });
      expect(result).toContain('February');
      expect(result).toContain('20');
      expect(result).toContain('2024');
    });

    test('formats date in full style', () => {
      const result = formatDate(testDate, { style: 'full' });
      expect(result).toContain('2024');
      expect(result).toContain('20');
      // Should include day of week
      expect(result.length).toBeGreaterThan(20);
    });
  });

  describe('date-only vs date-time formatting', () => {
    test('formats date without time by default', () => {
      const result = formatDate(testDate);
      // Should not contain time indicators
      expect(result).not.toMatch(/\d{1,2}:\d{2}/);
      expect(result.toLowerCase()).not.toContain('am');
      expect(result.toLowerCase()).not.toContain('pm');
    });

    test('formats date with time when includeTime is true', () => {
      const result = formatDate(testDate, { includeTime: true });
      // Should contain time
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('Firestore Timestamp formatting', () => {
    test('formats Firestore Timestamp-like objects', () => {
      const firestoreTimestamp = {
        toDate: () => testDate
      };
      
      const result = formatDate(firestoreTimestamp);
      expect(result).not.toBe('Date unavailable');
      expect(result).toContain('2024');
    });

    test('handles Firestore Timestamp with error in toDate', () => {
      const badTimestamp = {
        toDate: () => { throw new Error('Invalid timestamp'); }
      };
      
      const result = formatDate(badTimestamp);
      expect(result).toBe('Date unavailable');
    });
  });

  describe('fallback messages for invalid dates', () => {
    test('returns default fallback for null', () => {
      const result = formatDate(null);
      expect(result).toBe('Date unavailable');
    });

    test('returns default fallback for undefined', () => {
      const result = formatDate(undefined);
      expect(result).toBe('Date unavailable');
    });

    test('returns default fallback for invalid string', () => {
      const result = formatDate('not a date');
      expect(result).toBe('Date unavailable');
    });

    test('returns default fallback for NaN', () => {
      const result = formatDate(NaN);
      expect(result).toBe('Date unavailable');
    });

    test('returns default fallback for Invalid Date object', () => {
      const result = formatDate(new Date('invalid'));
      expect(result).toBe('Date unavailable');
    });

    test('uses custom fallback message', () => {
      const result = formatDate(null, { fallback: 'No date provided' });
      expect(result).toBe('No date provided');
    });

    test('never returns "Invalid Date" string', () => {
      const invalidInputs = [null, undefined, 'invalid', NaN, {}, [], new Date('invalid')];
      
      invalidInputs.forEach(input => {
        const result = formatDate(input);
        expect(result).not.toContain('Invalid Date');
      });
    });
  });

  describe('helper functions', () => {
    test('formatDateShort produces short format', () => {
      const result = formatDateShort(testDate);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
    });

    test('formatDateLong produces long format', () => {
      const result = formatDateLong(testDate);
      expect(result).toContain('February');
      expect(result).toContain('2024');
    });

    test('formatDateTime includes time', () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    test('helper functions handle invalid input', () => {
      expect(formatDateShort(null)).toBe('Date unavailable');
      expect(formatDateLong(undefined)).toBe('Date unavailable');
      expect(formatDateTime('invalid')).toBe('Date unavailable');
    });
  });

  describe('ISO string parsing', () => {
    test('formats ISO string correctly', () => {
      const isoString = '2024-02-20T15:45:30Z';
      const result = formatDate(isoString);
      expect(result).not.toBe('Date unavailable');
      expect(result).toContain('2024');
    });

    test('formats ISO string with timezone', () => {
      const isoString = '2024-02-20T15:45:30+05:00';
      const result = formatDate(isoString);
      expect(result).not.toBe('Date unavailable');
    });
  });

  describe('epoch timestamp formatting', () => {
    test('formats epoch timestamp (milliseconds)', () => {
      const timestamp = testDate.getTime();
      const result = formatDate(timestamp);
      expect(result).not.toBe('Date unavailable');
      expect(result).toContain('2024');
    });

    test('handles zero timestamp', () => {
      const result = formatDate(0);
      expect(result).not.toBe('Date unavailable');
      expect(result).toContain('1970');
    });
  });
});
