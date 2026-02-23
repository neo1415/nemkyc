/**
 * Property-Based Tests for Identity Format Validation
 * 
 * Feature: kyc-autofill-security
 * Property 3: Format validation correctness
 * Validates: Requirements 2.1, 2.3
 * 
 * Tests that format validation correctly identifies valid and invalid
 * identity numbers (NIN and CAC/RC) across all possible string inputs.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateNINFormat, validateCACFormat } from '../../utils/identityFormatValidator';

describe('Feature: kyc-autofill-security, Property 3: Format validation correctness', () => {
  describe('NIN Format Validation', () => {
    it('should return valid=true for any string with exactly 11 digits', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 11, maxLength: 11 }),
          (digits) => {
            const nin = digits.join('');
            const result = validateNINFormat(nin);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.fieldName).toBe('NIN');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid=false for any string that is not exactly 11 digits', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => {
            const trimmed = s.trim();
            // Filter out valid NINs (exactly 11 digits)
            return !(trimmed.length === 11 && /^\d{11}$/.test(trimmed));
          }),
          (invalidNIN) => {
            const result = validateNINFormat(invalidNIN);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.fieldName).toBe('NIN');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid=false for strings with non-digit characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /[^\d]/.test(s)),
          (stringWithNonDigits) => {
            const result = validateNINFormat(stringWithNonDigits);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.fieldName).toBe('NIN');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid=false for digit strings of incorrect length', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 30 }).filter(len => len !== 11),
          fc.array(fc.integer({ min: 0, max: 9 })),
          (length, digitPool) => {
            if (length === 0) {
              const result = validateNINFormat('');
              expect(result.valid).toBe(false);
              return;
            }
            
            const digits = Array(length).fill(0).map((_, i) => digitPool[i % digitPool.length] || 0);
            const nin = digits.join('');
            const result = validateNINFormat(nin);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.fieldName).toBe('NIN');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle whitespace correctly (trim before validation)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 11, maxLength: 11 }),
          fc.string({ maxLength: 5 }).filter(s => /^\s*$/.test(s)),
          (digits, whitespace) => {
            const validNIN = digits.join('');
            const ninWithWhitespace = whitespace + validNIN + whitespace;
            const result = validateNINFormat(ninWithWhitespace);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('CAC/RC Format Validation', () => {
    it('should return valid=true for any string starting with "RC" followed by digits', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('RC', 'rc', 'Rc', 'rC'), // Test case-insensitivity
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 10 }),
          (prefix, digits) => {
            const cac = prefix + digits.join('');
            const result = validateCACFormat(cac);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.fieldName).toBe('CAC/RC');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid=false for strings not starting with "RC"', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
            const trimmed = s.trim();
            return trimmed.length > 0 && !/^RC/i.test(trimmed);
          }),
          (invalidCAC) => {
            const result = validateCACFormat(invalidCAC);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.fieldName).toBe('CAC/RC');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid=false for "RC" without digits', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('RC', 'rc', 'Rc', 'rC'),
          fc.string().filter(s => s.length > 0 && !/^\d/.test(s)),
          (prefix, nonDigitSuffix) => {
            const cac = prefix + nonDigitSuffix;
            const result = validateCACFormat(cac);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.fieldName).toBe('CAC/RC');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid=false for "RC" followed by digits and then non-digit characters', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('RC', 'rc', 'Rc', 'rC'),
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 5 }),
          fc.constantFrom('A', 'B', 'Z', 'a', 'z', '-', '_', '@', '#'),
          (prefix, digits, nonDigit) => {
            // Insert non-digit in the middle, not at the end where it could be trimmed
            const cac = prefix + digits.join('') + nonDigit + '0';
            const result = validateCACFormat(cac);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.fieldName).toBe('CAC/RC');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle whitespace correctly (trim before validation)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('RC', 'rc', 'Rc', 'rC'),
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 10 }),
          fc.string({ maxLength: 5 }).filter(s => /^\s*$/.test(s)),
          (prefix, digits, whitespace) => {
            const validCAC = prefix + digits.join('');
            const cacWithWhitespace = whitespace + validCAC + whitespace;
            const result = validateCACFormat(cacWithWhitespace);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive for "RC" prefix', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 10 }),
          (digits) => {
            const digitString = digits.join('');
            const results = [
              validateCACFormat('RC' + digitString),
              validateCACFormat('rc' + digitString),
              validateCACFormat('Rc' + digitString),
              validateCACFormat('rC' + digitString)
            ];
            
            // All variations should be valid
            results.forEach(result => {
              expect(result.valid).toBe(true);
              expect(result.error).toBeUndefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Empty and Null Input Handling', () => {
    it('should return valid=false for empty strings', () => {
      expect(validateNINFormat('').valid).toBe(false);
      expect(validateCACFormat('').valid).toBe(false);
    });

    it('should return valid=false for whitespace-only strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^\s+$/.test(s)),
          (whitespace) => {
            expect(validateNINFormat(whitespace).valid).toBe(false);
            expect(validateCACFormat(whitespace).valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Result Structure', () => {
    it('should always return an object with valid, fieldName, and optionally error', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            const ninResult = validateNINFormat(input);
            const cacResult = validateCACFormat(input);
            
            // Check structure
            expect(ninResult).toHaveProperty('valid');
            expect(ninResult).toHaveProperty('fieldName');
            expect(typeof ninResult.valid).toBe('boolean');
            expect(typeof ninResult.fieldName).toBe('string');
            
            expect(cacResult).toHaveProperty('valid');
            expect(cacResult).toHaveProperty('fieldName');
            expect(typeof cacResult.valid).toBe('boolean');
            expect(typeof cacResult.fieldName).toBe('string');
            
            // If invalid, should have error message
            if (!ninResult.valid) {
              expect(ninResult.error).toBeDefined();
              expect(typeof ninResult.error).toBe('string');
            }
            
            if (!cacResult.valid) {
              expect(cacResult.error).toBeDefined();
              expect(typeof cacResult.error).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
