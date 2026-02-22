/**
 * Property-Based Tests for Text Normalization
 * 
 * Feature: nin-cac-autofill
 * Property 7: Text Normalization Consistency
 * Validates: Requirements 4.4
 * 
 * Tests that text normalization trims whitespace and removes extra spaces
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeString } from '../../utils/autoFill/normalizers';

describe('Feature: nin-cac-autofill, Property 7: Text Normalization Consistency', () => {
  it('should trim leading and trailing whitespace', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.nat(10),
        fc.nat(10),
        (text, leadingSpaces, trailingSpaces) => {
          const paddedText = ' '.repeat(leadingSpaces) + text + ' '.repeat(trailingSpaces);
          const normalized = normalizeString(paddedText);
          expect(normalized).not.toMatch(/^\s/); // No leading whitespace
          expect(normalized).not.toMatch(/\s$/); // No trailing whitespace
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should replace multiple consecutive spaces with single space', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes(' ')), { minLength: 2, maxLength: 5 }),
        fc.nat({ max: 5 }).filter(n => n > 1),
        (words, spaceCount) => {
          const textWithMultipleSpaces = words.join(' '.repeat(spaceCount));
          const normalized = normalizeString(textWithMultipleSpaces);
          expect(normalized).not.toMatch(/\s{2,}/); // No multiple consecutive spaces
          expect(normalized).toBe(words.join(' '));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for null, undefined, or empty values', () => {
    expect(normalizeString('')).toBe('');
    expect(normalizeString('   ')).toBe('');
    expect(normalizeString(null as any)).toBe('');
    expect(normalizeString(undefined as any)).toBe('');
  });

  it('should preserve original casing', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (text) => {
          const normalized = normalizeString(text);
          // Check that casing is preserved (not converted to lower/upper)
          const trimmedText = text.trim().replace(/\s+/g, ' ');
          expect(normalized).toBe(trimmedText);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle text with mixed whitespace types', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes(' ')), { minLength: 2, maxLength: 5 }),
        (words) => {
          // Mix spaces, tabs, and newlines
          const textWithMixedWhitespace = words.join('  \t\n  ');
          const normalized = normalizeString(textWithMixedWhitespace);
          expect(normalized).toBe(words.join(' '));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be idempotent (normalizing twice produces same result)', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text) => {
          const normalized1 = normalizeString(text);
          const normalized2 = normalizeString(normalized1);
          expect(normalized1).toBe(normalized2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle single-word strings correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => !s.includes(' ') && s.trim().length > 0),
        (word) => {
          const normalized = normalizeString(word);
          expect(normalized).toBe(word.trim());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle strings with only whitespace', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 20 }).filter(n => n > 0),
        (spaceCount) => {
          const onlySpaces = ' '.repeat(spaceCount);
          const normalized = normalizeString(onlySpaces);
          expect(normalized).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});
