/**
 * Property-Based Tests for Phone Number Normalization
 * 
 * Feature: nin-cac-autofill
 * Property 6: Phone Number Normalization
 * Validates: Requirements 4.3
 * 
 * Tests that phone normalization handles +234 prefix conversion,
 * removes non-digit characters, and validates 11-digit Nigerian format
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizePhone } from '../../utils/autoFill/normalizers';

describe('Feature: nin-cac-autofill, Property 6: Phone Number Normalization', () => {
  it('should convert +234 prefix to 0 prefix for valid 13-digit numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7000000000, max: 9999999999 }), // 10-digit number starting with 7-9
        (tenDigits) => {
          const phoneWith234 = `+234${tenDigits}`;
          const normalized = normalizePhone(phoneWith234);
          const expected = `0${tenDigits}`;
          expect(normalized).toBe(expected);
          expect(normalized).toHaveLength(11);
          expect(normalized).toMatch(/^0\d{10}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove non-digit characters from phone numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7000000000, max: 9999999999 }),
        fc.constantFrom('-', ' ', '(', ')', '.'),
        (tenDigits, separator) => {
          // Create phone with separators: 0-XXX-XXX-XXXX or similar
          const phoneStr = `0${tenDigits}`;
          const withSeparators = phoneStr.slice(0, 4) + separator + 
                                phoneStr.slice(4, 7) + separator + 
                                phoneStr.slice(7);
          
          const normalized = normalizePhone(withSeparators);
          expect(normalized).toBe(`0${tenDigits}`);
          expect(normalized).toMatch(/^\d+$/); // Only digits
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate 11-digit Nigerian phone format starting with 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7000000000, max: 9999999999 }),
        (tenDigits) => {
          const validPhone = `0${tenDigits}`;
          const normalized = normalizePhone(validPhone);
          expect(normalized).toBe(validPhone);
          expect(normalized).toHaveLength(11);
          expect(normalized.startsWith('0')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for phone numbers not matching 11-digit format', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          const digits = s.replace(/\D/g, '');
          // Filter out valid formats
          return !(digits.length === 11 && digits.startsWith('0')) &&
                 !(digits.length === 13 && digits.startsWith('234'));
        }),
        (invalidPhone) => {
          const normalized = normalizePhone(invalidPhone);
          expect(normalized).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for phone numbers with wrong length', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }).filter(len => len !== 11 && len !== 13),
        (length) => {
          const phone = '0' + '1'.repeat(length - 1);
          const normalized = normalizePhone(phone);
          expect(normalized).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for null, undefined, or empty values', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone('   ')).toBe('');
    expect(normalizePhone(null as any)).toBe('');
    expect(normalizePhone(undefined as any)).toBe('');
  });

  it('should handle phone numbers with various non-digit characters', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7000000000, max: 9999999999 }),
        (tenDigits) => {
          const validPhone = `0${tenDigits}`;
          // Add various non-digit characters
          const withChars = `+0 (${tenDigits.toString().slice(0, 3)}) ${tenDigits.toString().slice(3, 6)}-${tenDigits.toString().slice(6)}`;
          
          const normalized = normalizePhone(withChars);
          expect(normalized).toBe(validPhone);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not accept phone numbers starting with digits other than 0 (for 11-digit)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }).filter(d => d !== 0),
        fc.integer({ min: 1000000000, max: 9999999999 }),
        (firstDigit, restDigits) => {
          const invalidPhone = `${firstDigit}${restDigits}`;
          const normalized = normalizePhone(invalidPhone);
          expect(normalized).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle +234 format with spaces and dashes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7000000000, max: 9999999999 }),
        (tenDigits) => {
          const phoneWithFormatting = `+234 ${tenDigits.toString().slice(0, 3)}-${tenDigits.toString().slice(3, 6)}-${tenDigits.toString().slice(6)}`;
          const normalized = normalizePhone(phoneWithFormatting);
          const expected = `0${tenDigits}`;
          expect(normalized).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce consistent output regardless of formatting', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7000000000, max: 9999999999 }),
        (tenDigits) => {
          const plain = `0${tenDigits}`;
          const withDashes = `0-${tenDigits.toString().slice(0, 3)}-${tenDigits.toString().slice(3, 6)}-${tenDigits.toString().slice(6)}`;
          const withSpaces = `0 ${tenDigits.toString().slice(0, 3)} ${tenDigits.toString().slice(3, 6)} ${tenDigits.toString().slice(6)}`;
          const withPlus234 = `+234${tenDigits}`;

          const normalized1 = normalizePhone(plain);
          const normalized2 = normalizePhone(withDashes);
          const normalized3 = normalizePhone(withSpaces);
          const normalized4 = normalizePhone(withPlus234);

          // All formats should produce the same output
          expect(normalized1).toBe(normalized2);
          expect(normalized2).toBe(normalized3);
          expect(normalized3).toBe(normalized4);
          expect(normalized4).toBe(plain);
        }
      ),
      { numRuns: 100 }
    );
  });
});
