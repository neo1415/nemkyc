/**
 * Unit Tests for JSON Parser (Backend)
 * Feature: date-formatting-fixes
 * Validates: Requirements 4.1, 4.2, 4.3, 4.7
 */

const { safeJSONParse, isValidJSON } = require('../jsonParser.cjs');

describe('JSON Parser Unit Tests', () => {
  describe('safeJSONParse with empty responses', () => {
    test('returns EMPTY_RESPONSE error for empty string', () => {
      const result = safeJSONParse('');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EMPTY_RESPONSE');
      expect(result.error).toContain('empty');
      expect(result.details.responseLength).toBe(0);
    });

    test('returns EMPTY_RESPONSE error for whitespace-only string', () => {
      const result = safeJSONParse('   \n\t  ');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EMPTY_RESPONSE');
      expect(result.details.responseLength).toBeGreaterThan(0);
    });

    test('returns EMPTY_RESPONSE error for null', () => {
      const result = safeJSONParse(null);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EMPTY_RESPONSE');
      expect(result.error).toContain('null');
    });

    test('returns EMPTY_RESPONSE error for undefined', () => {
      const result = safeJSONParse(undefined);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EMPTY_RESPONSE');
      expect(result.error).toContain('undefined');
    });
  });

  describe('safeJSONParse with malformed JSON', () => {
    test('returns PARSE_ERROR for unclosed brace', () => {
      const result = safeJSONParse('{"key": "value"');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARSE_ERROR');
      expect(result.details.parseError).toBeDefined();
      expect(result.details.responseLength).toBeGreaterThan(0);
    });

    test('returns PARSE_ERROR for invalid JSON syntax', () => {
      const result = safeJSONParse('{key: "value"}');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARSE_ERROR');
    });

    test('returns PARSE_ERROR for trailing comma', () => {
      const result = safeJSONParse('{"key": "value",}');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARSE_ERROR');
    });

    test('returns PARSE_ERROR for plain text', () => {
      const result = safeJSONParse('This is not JSON');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PARSE_ERROR');
    });

    test('includes response preview in error details', () => {
      const longInvalidJSON = 'x'.repeat(200);
      const result = safeJSONParse(longInvalidJSON);
      
      expect(result.success).toBe(false);
      expect(result.details.responsePreview).toBeDefined();
      expect(result.details.responsePreview.length).toBeLessThanOrEqual(100);
    });
  });

  describe('safeJSONParse with valid JSON', () => {
    test('successfully parses valid JSON object', () => {
      const data = { key: 'value', number: 42 };
      const result = safeJSONParse(JSON.stringify(data));
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.error).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });

    test('successfully parses valid JSON array', () => {
      const data = [1, 2, 3, 'four'];
      const result = safeJSONParse(JSON.stringify(data));
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    test('successfully parses JSON string', () => {
      const result = safeJSONParse('"hello"');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('hello');
    });

    test('successfully parses JSON number', () => {
      const result = safeJSONParse('42');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });

    test('successfully parses JSON boolean', () => {
      const result = safeJSONParse('true');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    test('successfully parses JSON null', () => {
      const result = safeJSONParse('null');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });
  });

  describe('safeJSONParse with context', () => {
    test('includes context in error details', () => {
      const context = {
        source: 'TestClient',
        nin: '1234****',
        statusCode: 200
      };
      
      const result = safeJSONParse('', context);
      
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject(context);
    });

    test('includes response length in error details', () => {
      const invalidJSON = '{"broken": }';
      const result = safeJSONParse(invalidJSON);
      
      expect(result.success).toBe(false);
      expect(result.details.responseLength).toBe(invalidJSON.length);
    });
  });

  describe('isValidJSON', () => {
    test('returns true for valid JSON object', () => {
      expect(isValidJSON('{"key": "value"}')).toBe(true);
    });

    test('returns true for valid JSON array', () => {
      expect(isValidJSON('[1, 2, 3]')).toBe(true);
    });

    test('returns true for JSON primitives', () => {
      expect(isValidJSON('"string"')).toBe(true);
      expect(isValidJSON('42')).toBe(true);
      expect(isValidJSON('true')).toBe(true);
      expect(isValidJSON('null')).toBe(true);
    });

    test('returns false for empty string', () => {
      expect(isValidJSON('')).toBe(false);
    });

    test('returns false for whitespace-only string', () => {
      expect(isValidJSON('   ')).toBe(false);
    });

    test('returns false for malformed JSON', () => {
      expect(isValidJSON('{invalid}')).toBe(false);
      expect(isValidJSON('{"key": }')).toBe(false);
      expect(isValidJSON('not json')).toBe(false);
    });

    test('returns false for non-string input', () => {
      expect(isValidJSON(null)).toBe(false);
      expect(isValidJSON(undefined)).toBe(false);
      expect(isValidJSON(42)).toBe(false);
      expect(isValidJSON({})).toBe(false);
    });
  });

  describe('error structure consistency', () => {
    test('all errors have consistent structure', () => {
      const testCases = [
        '',
        null,
        undefined,
        '{invalid}',
        'not json'
      ];

      testCases.forEach(input => {
        const result = safeJSONParse(input);
        
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(false);
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('errorCode');
        expect(result).toHaveProperty('details');
        expect(typeof result.error).toBe('string');
        expect(typeof result.errorCode).toBe('string');
        expect(typeof result.details).toBe('object');
      });
    });
  });
});
