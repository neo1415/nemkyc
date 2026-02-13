/**
 * Property-Based Tests for Datapro Client Error Handling
 * 
 * **Property 14: Parse Errors Trigger Retries**
 * **Validates: Requirements 5.7**
 * 
 * Tests that the Datapro client properly retries requests when encountering
 * parse errors from empty or malformed JSON responses.
 * 
 * Note: These tests verify the retry logic conceptually by testing the
 * safeJSONParse utility that the Datapro client uses, and by verifying
 * the client's error handling structure.
 */

const fc = require('fast-check');
const { safeJSONParse } = require('../../server-utils/jsonParser.cjs');
const { 
  verifyNIN, 
  maskNIN,
  getUserFriendlyError,
  getTechnicalError 
} = require('../dataproClient.cjs');

describe('Datapro Client - Property-Based Tests', () => {
  describe('Property 14: Parse Errors Trigger Retries', () => {
    /**
     * Property: For any empty or malformed JSON response,
     * the safeJSONParse utility (used by Datapro client) should
     * return a structured error that can trigger retry logic.
     */
    test('safeJSONParse returns structured error for empty responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate empty or whitespace-only strings
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\n'),
            fc.constant('\t'),
            fc.constant('  \n  \t  ')
          ),
          async (emptyResponse) => {
            const result = safeJSONParse(emptyResponse, {
              source: 'DataproClient',
              nin: '1234*******',
              statusCode: 200,
              responseLength: emptyResponse.length
            });
            
            // Verify structured error response
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('EMPTY_RESPONSE');
            expect(result.error).toBeDefined();
            expect(result.details).toBeDefined();
            expect(result.details.responseLength).toBe(emptyResponse.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('safeJSONParse returns structured error for malformed JSON', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate malformed JSON strings
          fc.oneof(
            fc.constant('{invalid'),
            fc.constant('{"key": }'),
            fc.constant('[1, 2,]'),
            fc.constant('{"unclosed": "string'),
            fc.constant('null}'),
            fc.constant('{]'),
            fc.constant('undefined'),
            fc.constant('NaN'),
            fc.constant('{key: value}'), // Missing quotes
            fc.constant("{'key': 'value'}") // Single quotes
          ),
          async (malformedJSON) => {
            const result = safeJSONParse(malformedJSON, {
              source: 'DataproClient',
              nin: '1234*******',
              statusCode: 200,
              responseLength: malformedJSON.length
            });
            
            // Verify structured error response
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('PARSE_ERROR');
            expect(result.error).toBeDefined();
            expect(result.details).toBeDefined();
            expect(result.details.parseError).toBeDefined();
            expect(result.details.responseLength).toBe(malformedJSON.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('verifyNIN returns error for invalid input without retries', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid NINs (not 11 digits)
          fc.oneof(
            fc.constant(''),
            fc.constant('123'), // Too short
            fc.constant('123456789012'), // Too long
            fc.constant('abcdefghijk'), // Not digits
            fc.constant('1234567890a') // Contains letter
          ),
          async (invalidNIN) => {
            const result = await verifyNIN(invalidNIN);
            
            // Verify error response structure
            expect(result.success).toBe(false);
            expect(result.errorCode).toBeDefined();
            expect(result.error).toBeDefined();
            expect(result.details).toBeDefined();
            
            // Verify error code is appropriate
            expect(['INVALID_INPUT', 'INVALID_FORMAT']).toContain(result.errorCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('verifyNIN returns error when SERVICEID not configured', async () => {
      // Save original SERVICEID
      const originalServiceId = process.env.DATAPRO_SERVICE_ID;
      
      await fc.assert(
        fc.asyncProperty(
          // Generate valid 11-digit NINs
          fc.tuple(
            fc.integer({ min: 1, max: 9 }),
            fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 10 })
          ).map(([first, rest]) => first.toString() + rest.join('')),
          async (nin) => {
            // Remove SERVICEID
            delete process.env.DATAPRO_SERVICE_ID;
            
            const result = await verifyNIN(nin);
            
            // Verify error response
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('NOT_CONFIGURED');
            expect(result.error).toContain('not configured');
            
            // Restore SERVICEID
            process.env.DATAPRO_SERVICE_ID = originalServiceId;
          }
        ),
        { numRuns: 100 }
      );
      
      // Ensure SERVICEID is restored
      process.env.DATAPRO_SERVICE_ID = originalServiceId;
    });

    test('maskNIN always masks sensitive data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid 11-digit NINs
          fc.tuple(
            fc.integer({ min: 1, max: 9 }),
            fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 10 })
          ).map(([first, rest]) => first.toString() + rest.join('')),
          async (nin) => {
            const masked = maskNIN(nin);
            
            // Verify masking properties
            expect(masked).toBeDefined();
            expect(masked.length).toBe(11);
            expect(masked.substring(0, 4)).toBe(nin.substring(0, 4));
            expect(masked.substring(4)).toBe('*******');
            expect(masked).not.toBe(nin);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getUserFriendlyError returns appropriate messages for all error codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various error codes
          fc.constantFrom(
            'INVALID_INPUT',
            'INVALID_FORMAT',
            'NOT_CONFIGURED',
            'BAD_REQUEST',
            'UNAUTHORIZED',
            'INVALID_SERVICE_ID',
            'NETWORK_ERROR',
            'UNEXPECTED_STATUS',
            'PARSE_ERROR',
            'EMPTY_RESPONSE',
            'INVALID_RESPONSE',
            'NIN_NOT_FOUND',
            'MAX_RETRIES_EXCEEDED',
            'FIELD_MISMATCH',
            'UNKNOWN_ERROR'
          ),
          async (errorCode) => {
            const message = getUserFriendlyError(errorCode);
            
            // Verify message properties
            expect(message).toBeDefined();
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);
            
            // Verify message is user-friendly (no technical jargon)
            expect(message).not.toContain('undefined');
            expect(message).not.toContain('null');
            expect(message).not.toContain('NaN');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getTechnicalError includes all relevant details', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate error code
          fc.constantFrom(
            'PARSE_ERROR',
            'EMPTY_RESPONSE',
            'NETWORK_ERROR',
            'MAX_RETRIES_EXCEEDED'
          ),
          // Generate details
          fc.record({
            statusCode: fc.option(fc.integer({ min: 100, max: 599 })),
            message: fc.option(fc.string()),
            attempt: fc.option(fc.integer({ min: 1, max: 3 })),
            failedFields: fc.option(fc.array(fc.string()))
          }),
          async (errorCode, details) => {
            const message = getTechnicalError(errorCode, details);
            
            // Verify message includes error code
            expect(message).toContain(errorCode);
            
            // Verify message includes provided details
            if (details.statusCode) {
              expect(message).toContain(details.statusCode.toString());
            }
            if (details.attempt) {
              expect(message).toContain(details.attempt.toString());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('error responses have consistent structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid inputs that will cause errors
          fc.oneof(
            fc.constant(''), // Empty NIN
            fc.constant('123'), // Too short
            fc.constant('abcdefghijk') // Not digits
          ),
          async (invalidNIN) => {
            const result = await verifyNIN(invalidNIN);
            
            // Verify consistent error structure
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('error');
            expect(result).toHaveProperty('errorCode');
            expect(result).toHaveProperty('details');
            
            expect(result.success).toBe(false);
            expect(typeof result.error).toBe('string');
            expect(typeof result.errorCode).toBe('string');
            expect(typeof result.details).toBe('object');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
