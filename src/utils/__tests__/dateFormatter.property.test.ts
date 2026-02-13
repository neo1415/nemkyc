/**
 * Property-Based Tests for Date Formatter (Frontend)
 * Feature: date-formatting-fixes
 * Properties 2, 3, 5, 6: Date Formatter validation and consistency
 * Validates: Requirements 2.3, 2.4, 2.6, 3.2, 3.3, 7.4, 8.1
 */

import fc from 'fast-check';
import { formatDate, formatDateShort, formatDateLong, formatDateTime } from '../dateFormatter';

describe('Date Formatter Property Tests', () => {
  // Feature: date-formatting-fixes, Property 2: Date Formatter Always Validates Before Formatting
  test('Property 2: formatDate handles all input types without throwing errors', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          // Should never throw an error
          expect(() => formatDate(input)).not.toThrow();
          
          const result = formatDate(input);
          
          // Result should always be a string
          expect(typeof result).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 3: Formatted Output Never Contains "Invalid Date"
  test('Property 3: formatDate never produces "Invalid Date" in output', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          const result = formatDate(input);
          
          // Output should never contain "Invalid Date"
          expect(result).not.toContain('Invalid Date');
          expect(result.toLowerCase()).not.toContain('invalid date');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 3: All formatter functions never produce "Invalid Date"
  test('Property 3: All formatter functions never produce "Invalid Date"', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          const results = [
            formatDate(input),
            formatDateShort(input),
            formatDateLong(input),
            formatDateTime(input)
          ];
          
          results.forEach(result => {
            expect(result).not.toContain('Invalid Date');
            expect(result.toLowerCase()).not.toContain('invalid date');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 5: Date Formatter Supports Multiple Formats
  test('Property 5: Formatter successfully produces output for both date-only and date-time formats', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          // Date-only format
          const dateOnly = formatDate(date, { includeTime: false });
          expect(dateOnly).not.toBe('Date unavailable');
          expect(dateOnly.length).toBeGreaterThan(0);
          
          // Date-time format
          const dateTime = formatDate(date, { includeTime: true });
          expect(dateTime).not.toBe('Date unavailable');
          expect(dateTime.length).toBeGreaterThan(0);
          
          // Date-time should be longer (includes time)
          expect(dateTime.length).toBeGreaterThanOrEqual(dateOnly.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 5: All format styles work without errors
  test('Property 5: All format styles produce valid output for valid dates', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const styles: Array<'short' | 'medium' | 'long' | 'full'> = ['short', 'medium', 'long', 'full'];
          
          styles.forEach(style => {
            const result = formatDate(date, { style });
            expect(result).not.toBe('Date unavailable');
            expect(result.length).toBeGreaterThan(0);
            expect(result).not.toContain('Invalid Date');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 6: Firestore Timestamp Formatting
  test('Property 6: Firestore Timestamp-like objects are successfully formatted', () => {
    fc.assert(
      fc.property(
        fc.date().filter(date => !isNaN(date.getTime())),
        (date) => {
          // Create a Firestore Timestamp-like object
          const firestoreTimestamp = {
            toDate: () => date
          };
          
          const result = formatDate(firestoreTimestamp);
          
          // Should successfully format (not fallback)
          expect(result).not.toBe('Date unavailable');
          expect(result.length).toBeGreaterThan(0);
          expect(result).not.toContain('Invalid Date');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 2: Valid dates always produce non-fallback output
  test('Property 2: Valid Date objects produce formatted output (not fallback)', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const result = formatDate(date);
          
          // Should not be the fallback message
          expect(result).not.toBe('Date unavailable');
          
          // Should be a non-empty string
          expect(result.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 2: Invalid inputs produce fallback message
  test('Property 2: Invalid inputs produce fallback message', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined, 'invalid', NaN, {}, []),
        (invalidInput) => {
          const result = formatDate(invalidInput);
          
          // Should be the fallback message
          expect(result).toBe('Date unavailable');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 3: Custom fallback messages work correctly
  test('Property 3: Custom fallback messages are used for invalid dates', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined, 'invalid'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (invalidInput, customFallback) => {
          const result = formatDate(invalidInput, { fallback: customFallback });
          
          // Should use the custom fallback
          expect(result).toBe(customFallback);
          
          // Should never contain "Invalid Date"
          expect(result).not.toContain('Invalid Date');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 2: Helper functions validate before formatting
  test('Property 2: Helper functions handle all input types without throwing', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          expect(() => formatDateShort(input)).not.toThrow();
          expect(() => formatDateLong(input)).not.toThrow();
          expect(() => formatDateTime(input)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
