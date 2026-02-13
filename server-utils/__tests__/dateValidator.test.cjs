/**
 * Unit Tests for Date Validator (Backend)
 * Tests edge cases and specific examples
 * Requirements: 1.2, 1.4, 1.5
 */

const { validateDate, isValidDate, normalizeDate } = require('../dateValidator.cjs');

describe('Date Validator Unit Tests', () => {
  describe('validateDate', () => {
    // Requirement 1.2: null and undefined inputs return fallback
    test('returns fallback for null input', () => {
      const result = validateDate(null);
      expect(result.isValid).toBe(true); // allowNull defaults to true
      expect(result.date).toBe(null);
    });

    test('returns fallback for undefined input', () => {
      const result = validateDate(undefined);
      expect(result.isValid).toBe(true); // allowNull defaults to true
      expect(result.date).toBe(null);
    });

    test('returns invalid when allowNull is false and input is null', () => {
      const result = validateDate(null, { allowNull: false });
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('returns default value when provided', () => {
      const defaultDate = new Date('2024-01-01');
      const result = validateDate(null, { defaultValue: defaultDate });
      expect(result.date).toBe(defaultDate);
    });

    // Requirement 1.4: Firestore Timestamp conversion
    test('handles Firestore Timestamp objects', () => {
      const testDate = new Date('2024-02-20T10:00:00Z');
      const firestoreTimestamp = {
        toDate: () => testDate
      };

      const result = validateDate(firestoreTimestamp);
      expect(result.isValid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.getTime()).toBe(testDate.getTime());
    });

    test('handles Firestore Timestamp with toDate that throws', () => {
      const badTimestamp = {
        toDate: () => {
          throw new Error('Invalid timestamp');
        }
      };

      const result = validateDate(badTimestamp);
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    // Requirement 1.5: ISO string parsing
    test('parses valid ISO string', () => {
      const isoString = '2024-02-20T10:00:00.000Z';
      const result = validateDate(isoString);
      expect(result.isValid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.toISOString()).toBe(isoString);
    });

    test('handles invalid ISO string', () => {
      const result = validateDate('not-a-date');
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    test('handles empty string', () => {
      const result = validateDate('');
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    test('handles whitespace-only string', () => {
      const result = validateDate('   ');
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    // Requirement 1.6: Check for NaN using isNaN(date.getTime())
    test('rejects Invalid Date objects', () => {
      const invalidDate = new Date('invalid');
      const result = validateDate(invalidDate);
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    test('handles valid Date object', () => {
      const validDate = new Date('2024-02-20');
      const result = validateDate(validDate);
      expect(result.isValid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.getTime()).toBe(validDate.getTime());
    });

    test('handles epoch timestamp (number)', () => {
      const timestamp = 1708426800000; // 2024-02-20T10:00:00.000Z
      const result = validateDate(timestamp);
      expect(result.isValid).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.getTime()).toBe(timestamp);
    });

    test('handles NaN number', () => {
      const result = validateDate(NaN);
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    test('handles Infinity', () => {
      const result = validateDate(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    test('handles negative Infinity', () => {
      const result = validateDate(-Infinity);
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    test('handles objects without toDate method', () => {
      const result = validateDate({ foo: 'bar' });
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    test('handles arrays', () => {
      const result = validateDate([2024, 2, 20]);
      expect(result.isValid).toBe(false);
      expect(result.date).toBe(null);
    });

    test('handles boolean values', () => {
      expect(validateDate(true).isValid).toBe(false);
      expect(validateDate(false).isValid).toBe(false);
    });
  });

  describe('isValidDate', () => {
    test('returns true for valid Date object', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    test('returns false for Invalid Date', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    test('returns false for null', () => {
      expect(isValidDate(null)).toBe(false);
    });

    test('returns false for undefined', () => {
      expect(isValidDate(undefined)).toBe(false);
    });

    test('returns true for valid ISO string', () => {
      expect(isValidDate('2024-02-20T10:00:00.000Z')).toBe(true);
    });

    test('returns false for invalid string', () => {
      expect(isValidDate('not-a-date')).toBe(false);
    });

    test('returns true for epoch timestamp', () => {
      expect(isValidDate(1708426800000)).toBe(true);
    });

    test('returns true for Firestore Timestamp', () => {
      const timestamp = { toDate: () => new Date() };
      expect(isValidDate(timestamp)).toBe(true);
    });
  });

  describe('normalizeDate', () => {
    test('returns null for null input', () => {
      expect(normalizeDate(null)).toBe(null);
    });

    test('returns null for undefined input', () => {
      expect(normalizeDate(undefined)).toBe(null);
    });

    test('returns Date for valid Date object', () => {
      const date = new Date('2024-02-20');
      const result = normalizeDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(date.getTime());
    });

    test('returns null for Invalid Date', () => {
      expect(normalizeDate(new Date('invalid'))).toBe(null);
    });

    test('converts Firestore Timestamp to Date', () => {
      const testDate = new Date('2024-02-20');
      const timestamp = { toDate: () => testDate };
      const result = normalizeDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(testDate.getTime());
    });

    test('parses ISO string to Date', () => {
      const isoString = '2024-02-20T10:00:00.000Z';
      const result = normalizeDate(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(isoString);
    });

    test('converts epoch timestamp to Date', () => {
      const timestamp = 1708426800000;
      const result = normalizeDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });

    test('returns null for empty string', () => {
      expect(normalizeDate('')).toBe(null);
    });

    test('returns null for whitespace string', () => {
      expect(normalizeDate('   ')).toBe(null);
    });

    test('returns null for invalid string', () => {
      expect(normalizeDate('not-a-date')).toBe(null);
    });

    test('returns null for NaN', () => {
      expect(normalizeDate(NaN)).toBe(null);
    });

    test('returns null for Infinity', () => {
      expect(normalizeDate(Infinity)).toBe(null);
    });

    test('returns null for objects without toDate', () => {
      expect(normalizeDate({ foo: 'bar' })).toBe(null);
    });

    test('returns null for arrays', () => {
      expect(normalizeDate([2024, 2, 20])).toBe(null);
    });

    test('returns null for boolean', () => {
      expect(normalizeDate(true)).toBe(null);
      expect(normalizeDate(false)).toBe(null);
    });
  });
});
