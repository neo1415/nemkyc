/**
 * Property-Based Tests for Date Validator (Frontend)
 * Feature: date-formatting-fixes
 * Property 1: Date Validator Handles All Input Types
 * Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6
 */

import fc from 'fast-check';
import { validateDate, isValidDate, normalizeDate } from '../dateValidator';

describe('Date Validator Property Tests', () => {
  // Feature: date-formatting-fixes, Property 1: Date Validator Handles All Input Types
  test('Property 1: validateDate handles all input types without throwing errors', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          // Should never throw an error
          expect(() => validateDate(input)).not.toThrow();
          
          const result = validateDate(input);
          
          // Result should always have the expected structure
          expect(result).toHaveProperty('isValid');
          expect(result).toHaveProperty('date');
          expect(typeof result.isValid).toBe('boolean');
          
          // If valid and date is not null, it should be a Date object
          if (result.isValid && result.date !== null) {
            expect(result.date).toBeInstanceOf(Date);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 1: Date Validator never returns invalid Date with NaN
  test('Property 1: validateDate never returns a Date that produces NaN from getTime()', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          const result = validateDate(input);
          
          // If a Date is returned, it must not produce NaN
          if (result.date instanceof Date) {
            expect(isNaN(result.date.getTime())).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 1: isValidDate handles all input types
  test('Property 1: isValidDate handles all input types without throwing errors', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          expect(() => isValidDate(input)).not.toThrow();
          
          const result = isValidDate(input);
          expect(typeof result).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 1: normalizeDate handles all input types
  test('Property 1: normalizeDate handles all input types without throwing errors', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          expect(() => normalizeDate(input)).not.toThrow();
          
          const result = normalizeDate(input);
          
          // Result should be either a Date or null
          expect(result === null || result instanceof Date).toBe(true);
          
          // If it's a Date, it must be valid (not NaN)
          if (result instanceof Date) {
            expect(isNaN(result.getTime())).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 1: Valid dates remain valid through normalization
  test('Property 1: Valid Date objects are correctly identified and normalized', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (validDate) => {
          expect(isValidDate(validDate)).toBe(true);
          
          const normalized = normalizeDate(validDate);
          expect(normalized).toBeInstanceOf(Date);
          expect(normalized!.getTime()).toBe(validDate.getTime());
          
          const validated = validateDate(validDate);
          expect(validated.isValid).toBe(true);
          expect(validated.date).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 1: ISO strings are correctly parsed
  test('Property 1: Valid ISO strings are correctly identified and normalized', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const isoString = date.toISOString();
          
          expect(isValidDate(isoString)).toBe(true);
          
          const normalized = normalizeDate(isoString);
          expect(normalized).toBeInstanceOf(Date);
          expect(Math.abs(normalized!.getTime() - date.getTime())).toBeLessThan(1);
          
          const validated = validateDate(isoString);
          expect(validated.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 1: Epoch timestamps are correctly parsed
  test('Property 1: Valid epoch timestamps (numbers) are correctly identified and normalized', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Date.now() + 1000000000 }),
        (timestamp) => {
          expect(isValidDate(timestamp)).toBe(true);
          
          const normalized = normalizeDate(timestamp);
          expect(normalized).toBeInstanceOf(Date);
          expect(normalized!.getTime()).toBe(timestamp);
          
          const validated = validateDate(timestamp);
          expect(validated.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 1: Firestore Timestamp objects are handled
  test('Property 1: Firestore Timestamp-like objects are correctly normalized', () => {
    fc.assert(
      fc.property(
        fc.date().filter(date => !isNaN(date.getTime())), // Only use valid dates
        (date) => {
          // Create a Firestore Timestamp-like object
          const firestoreTimestamp = {
            toDate: () => date
          };
          
          expect(isValidDate(firestoreTimestamp)).toBe(true);
          
          const normalized = normalizeDate(firestoreTimestamp);
          expect(normalized).toBeInstanceOf(Date);
          expect(normalized!.getTime()).toBe(date.getTime());
          
          const validated = validateDate(firestoreTimestamp);
          expect(validated.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
