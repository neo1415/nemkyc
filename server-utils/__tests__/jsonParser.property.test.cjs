/**
 * Property-Based Tests for JSON Parser (Backend)
 * Feature: date-formatting-fixes
 * Property 10: JSON Parser Handles Malformed Input
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6
 */

const fc = require('fast-check');
const { safeJSONParse, isValidJSON } = require('../jsonParser.cjs');

describe('JSON Parser Property Tests', () => {
  // Feature: date-formatting-fixes, Property 10: JSON Parser Handles Malformed Input
  test('Property 10: safeJSONParse handles all input types without throwing errors', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          // Should never throw an error
          expect(() => safeJSONParse(input)).not.toThrow();
          
          const result = safeJSONParse(input);
          
          // Result should always have the expected structure
          expect(result).toHaveProperty('success');
          expect(typeof result.success).toBe('boolean');
          
          if (!result.success) {
            expect(result).toHaveProperty('error');
            expect(result).toHaveProperty('errorCode');
            expect(result).toHaveProperty('details');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 10: Empty strings return EMPTY_RESPONSE error
  test('Property 10: Empty or whitespace-only strings return EMPTY_RESPONSE error', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim() === ''),
        (emptyString) => {
          const result = safeJSONParse(emptyString);
          
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('EMPTY_RESPONSE');
          expect(result.details).toHaveProperty('responseLength');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 10: Malformed JSON returns PARSE_ERROR
  test('Property 10: Malformed JSON strings return PARSE_ERROR', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '{invalid}',
          '{"key": }',
          '{key: "value"}',
          '{"unclosed": "string',
          '[1, 2, 3,]',
          'not json at all',
          '{"nested": {"broken": }}'
        ),
        (malformedJSON) => {
          const result = safeJSONParse(malformedJSON);
          
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('PARSE_ERROR');
          expect(result.details).toHaveProperty('parseError');
          expect(result.details).toHaveProperty('responseLength');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 10: Valid JSON returns success with data
  test('Property 10: Valid JSON strings return success with parsed data', () => {
    fc.assert(
      fc.property(
        fc.jsonValue(), // Use jsonValue which only generates JSON-compatible values
        (value) => {
          const jsonString = JSON.stringify(value);
          const result = safeJSONParse(jsonString);
          
          expect(result.success).toBe(true);
          expect(result).toHaveProperty('data');
          // Parse the JSON string again to get the expected value (handles undefined -> null conversion)
          expect(result.data).toEqual(JSON.parse(jsonString));
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 10: Null and undefined return EMPTY_RESPONSE
  test('Property 10: Null and undefined inputs return EMPTY_RESPONSE error', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        (nullishValue) => {
          const result = safeJSONParse(nullishValue);
          
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('EMPTY_RESPONSE');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 10: Context is included in error details
  test('Property 10: Context information is included in error details', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '{invalid}', null),
        fc.record({
          source: fc.string(),
          statusCode: fc.integer({ min: 100, max: 599 })
        }),
        (invalidInput, context) => {
          const result = safeJSONParse(invalidInput, context);
          
          expect(result.success).toBe(false);
          expect(result.details).toMatchObject(context);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 10: isValidJSON handles all input types
  test('Property 10: isValidJSON handles all input types without throwing', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (input) => {
          expect(() => isValidJSON(input)).not.toThrow();
          
          const result = isValidJSON(input);
          expect(typeof result).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 10: isValidJSON matches safeJSONParse success
  test('Property 10: isValidJSON result matches safeJSONParse success for strings', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (str) => {
          const isValid = isValidJSON(str);
          const parseResult = safeJSONParse(str);
          
          expect(isValid).toBe(parseResult.success);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: date-formatting-fixes, Property 10: Response length is always included in error details
  test('Property 10: Error details always include responseLength for string inputs', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !isValidJSON(s)),
        (invalidString) => {
          const result = safeJSONParse(invalidString);
          
          if (!result.success) {
            expect(result.details).toHaveProperty('responseLength');
            expect(typeof result.details.responseLength).toBe('number');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
