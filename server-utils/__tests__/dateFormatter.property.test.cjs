/**
 * Property-Based Tests for Date Formatter (Backend)
 * Feature: date-formatting-fixes
 * Properties 2, 3, 4: Date Formatter validation and consistency
 * Validates: Requirements 2.3, 2.5, 3.2, 3.3, 7.4, 8.1
 */

const fc = require('fast-check');
const { formatDate, formatDateShort, formatDateLong, formatDateTime } = require('../dateFormatter.cjs');

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

  // Feature: date-formatting-fixes, Property 4: Date Formatting Consistency
  test('Property 4: Formatting the same date multiple times produces identical output', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const result1 = formatDate(date);
          const result2 = formatDate(date);
          const result3 = formatDate(date);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 4: Consistency across different format styles
  test('Property 4: Same date formatted with same options produces identical output', () => {
    fc.assert(
      fc.property(
        fc.date(),
        fc.constantFrom('short', 'medium', 'long', 'full'),
        fc.boolean(),
        (date, style, includeTime) => {
          const options = { style, includeTime };
          const result1 = formatDate(date, options);
          const result2 = formatDate(date, options);
          
          expect(result1).toBe(result2);
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

  // Feature: date-formatting-fixes, Property 4: Helper functions are consistent
  test('Property 4: Helper functions produce consistent output for same input', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          // Each helper should produce consistent output
          const short1 = formatDateShort(date);
          const short2 = formatDateShort(date);
          expect(short1).toBe(short2);
          
          const long1 = formatDateLong(date);
          const long2 = formatDateLong(date);
          expect(long1).toBe(long2);
          
          const dateTime1 = formatDateTime(date);
          const dateTime2 = formatDateTime(date);
          expect(dateTime1).toBe(dateTime2);
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
});
