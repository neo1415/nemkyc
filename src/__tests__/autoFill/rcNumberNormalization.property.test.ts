/**
 * Property-Based Tests for RC Number Normalization
 * 
 * Feature: nin-cac-autofill
 * Property 9: RC Prefix Removal
 * Validates: Requirements 2.5
 * 
 * Tests that RC number normalization removes RC prefix if present
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeRCNumber } from '../../utils/autoFill/normalizers';

describe('Feature: nin-cac-autofill, Property 9: RC Prefix Removal', () => {
  it('should remove RC prefix from registration numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 9999999 }),
        (rcNumber) => {
          const withPrefix = `RC${rcNumber}`;
          const normalized = normalizeRCNumber(withPrefix);
          
          expect(normalized).toBe(String(rcNumber));
          expect(normalized).not.toMatch(/^RC/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle RC prefix in different cases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 9999999 }),
        fc.constantFrom('RC', 'Rc', 'rc', 'rC'),
        (rcNumber, prefix) => {
          const withPrefix = `${prefix}${rcNumber}`;
          const normalized = normalizeRCNumber(withPrefix);
          
          expect(normalized).toBe(String(rcNumber));
          expect(normalized).not.toMatch(/^RC/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle RC prefix with space', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 9999999 }),
        fc.nat({ max: 5 }),
        (rcNumber, spaceCount) => {
          const withPrefixAndSpace = `RC${' '.repeat(spaceCount)}${rcNumber}`;
          const normalized = normalizeRCNumber(withPrefixAndSpace);
          
          expect(normalized).toBe(String(rcNumber));
          expect(normalized).not.toMatch(/^RC/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not modify numbers without RC prefix', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 9999999 }),
        (rcNumber) => {
          const withoutPrefix = String(rcNumber);
          const normalized = normalizeRCNumber(withoutPrefix);
          
          expect(normalized).toBe(withoutPrefix);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply string normalization (trim and remove extra spaces)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 9999999 }),
        fc.nat(5),
        fc.nat(5),
        (rcNumber, leadingSpaces, trailingSpaces) => {
          const paddedRC = ' '.repeat(leadingSpaces) + `RC${rcNumber}` + ' '.repeat(trailingSpaces);
          const normalized = normalizeRCNumber(paddedRC);
          
          expect(normalized).not.toMatch(/^\s/);
          expect(normalized).not.toMatch(/\s$/);
          expect(normalized).toBe(String(rcNumber));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for null, undefined, or empty values', () => {
    expect(normalizeRCNumber('')).toBe('');
    expect(normalizeRCNumber('   ')).toBe('');
    expect(normalizeRCNumber(null as any)).toBe('');
    expect(normalizeRCNumber(undefined as any)).toBe('');
  });

  it('should handle alphanumeric RC numbers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.match(/^RC/i)),
        (rcNumber) => {
          const withPrefix = `RC${rcNumber}`;
          const normalized = normalizeRCNumber(withPrefix);
          
          expect(normalized).toBe(rcNumber.trim().replace(/\s+/g, ' '));
          expect(normalized).not.toMatch(/^RC/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only remove RC prefix at the beginning', () => {
    const rcNumber = 'RC123456RC';
    const normalized = normalizeRCNumber(rcNumber);
    
    // Should only remove the first RC, not the one at the end
    expect(normalized).toBe('123456RC');
  });

  it('should be idempotent for numbers without RC prefix', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 9999999 }),
        (rcNumber) => {
          const withoutPrefix = String(rcNumber);
          const normalized1 = normalizeRCNumber(withoutPrefix);
          const normalized2 = normalizeRCNumber(normalized1);
          
          expect(normalized1).toBe(normalized2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle RC prefix with various whitespace', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 9999999 }),
        (rcNumber) => {
          const withWhitespace = `RC  \t\n  ${rcNumber}`;
          const normalized = normalizeRCNumber(withWhitespace);
          
          expect(normalized).toBe(String(rcNumber));
        }
      ),
      { numRuns: 100 }
    );
  });
});
