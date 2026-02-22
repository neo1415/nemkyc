/**
 * Property-Based Tests for Date Normalization
 * 
 * Feature: nin-cac-autofill
 * Property 5: Multi-Format Date Parsing
 * Validates: Requirements 4.2
 * 
 * Tests that date normalization successfully parses multiple date formats
 * and converts them to ISO 8601 format (YYYY-MM-DD)
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeDate } from '../../utils/autoFill/normalizers';

describe('Feature: nin-cac-autofill, Property 5: Multi-Format Date Parsing', () => {
  it('should parse DD/MM/YYYY format and convert to YYYY-MM-DD', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 28 }), // Day (1-28 to avoid month-specific issues)
        fc.integer({ min: 1, max: 12 }), // Month
        fc.integer({ min: 1900, max: 2100 }), // Year
        (day, month, year) => {
          const ddmmyyyy = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
          const normalized = normalizeDate(ddmmyyyy);
          const expected = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          expect(normalized).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should parse DD-MMM-YYYY format and convert to YYYY-MM-DD', () => {
    const monthMap = [
      { abbr: 'Jan', num: 1 },
      { abbr: 'Feb', num: 2 },
      { abbr: 'Mar', num: 3 },
      { abbr: 'Apr', num: 4 },
      { abbr: 'May', num: 5 },
      { abbr: 'Jun', num: 6 },
      { abbr: 'Jul', num: 7 },
      { abbr: 'Aug', num: 8 },
      { abbr: 'Sep', num: 9 },
      { abbr: 'Oct', num: 10 },
      { abbr: 'Nov', num: 11 },
      { abbr: 'Dec', num: 12 }
    ];

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 28 }),
        fc.constantFrom(...monthMap),
        fc.integer({ min: 1900, max: 2100 }),
        (day, monthObj, year) => {
          const ddmmmyyyy = `${String(day).padStart(2, '0')}-${monthObj.abbr}-${year}`;
          const normalized = normalizeDate(ddmmmyyyy);
          const expected = `${year}-${String(monthObj.num).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          expect(normalized).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should parse YYYY-MM-DD format (already normalized)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1900, max: 2100 }),
        (day, month, year) => {
          const yyyymmdd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const normalized = normalizeDate(yyyymmdd);
          expect(normalized).toBe(yyyymmdd);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle dates with single-digit days and months', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 1900, max: 2100 }),
        (day, month, year) => {
          const ddmmyyyy = `${day}/${month}/${year}`;
          const normalized = normalizeDate(ddmmyyyy);
          const expected = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          expect(normalized).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for invalid date formats', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          // Filter out strings that match valid date patterns
          return !s.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) &&
                 !s.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}$/) &&
                 !s.match(/^\d{4}-\d{1,2}-\d{1,2}$/);
        }),
        (invalidDate) => {
          const normalized = normalizeDate(invalidDate);
          expect(normalized).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for null, undefined, or empty values', () => {
    expect(normalizeDate('')).toBe('');
    expect(normalizeDate('   ')).toBe('');
    expect(normalizeDate(null as any)).toBe('');
    expect(normalizeDate(undefined as any)).toBe('');
  });

  it('should handle month abbreviations in different cases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 28 }),
        fc.constantFrom('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'),
        fc.constantFrom('lower', 'upper', 'mixed'),
        fc.integer({ min: 1900, max: 2100 }),
        (day, month, caseType, year) => {
          let monthStr: string;
          if (caseType === 'lower') {
            monthStr = month.toLowerCase();
          } else if (caseType === 'upper') {
            monthStr = month.toUpperCase();
          } else {
            monthStr = month;
          }

          const ddmmmyyyy = `${String(day).padStart(2, '0')}-${monthStr}-${year}`;
          const normalized = normalizeDate(ddmmmyyyy);
          
          // Should successfully parse regardless of case
          expect(normalized).not.toBe('');
          expect(normalized).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce consistent output for the same date in different formats', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1900, max: 2100 }),
        (day, month, year) => {
          const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1];
          
          const ddmmyyyy = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
          const ddmmmyyyy = `${String(day).padStart(2, '0')}-${monthAbbr}-${year}`;
          const yyyymmdd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const normalized1 = normalizeDate(ddmmyyyy);
          const normalized2 = normalizeDate(ddmmmyyyy);
          const normalized3 = normalizeDate(yyyymmdd);

          // All three formats should produce the same normalized output
          expect(normalized1).toBe(normalized2);
          expect(normalized2).toBe(normalized3);
          expect(normalized3).toBe(yyyymmdd);
        }
      ),
      { numRuns: 100 }
    );
  });
});
