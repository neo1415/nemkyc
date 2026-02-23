import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateNINFormat, validateCACFormat } from '@/utils/identityFormatValidator';

/**
 * Property-Based Tests for Invalid Format Error Messages
 * 
 * Feature: kyc-autofill-security
 * Property 4: Invalid formats produce error messages without API calls
 * 
 * Validates: Requirements 2.2, 2.4, 2.5
 * 
 * This test verifies that:
 * 1. Invalid identity number formats always produce error messages
 * 2. Error messages are descriptive and specific to the format issue
 * 3. No API calls are made for format validation (client-side only)
 */

describe('Property 4: Invalid formats produce error messages without API calls', () => {
  it('should produce error messages for all invalid NIN formats', () => {
    fc.assert(
      fc.property(
        // Generate strings that are NOT valid NIns (not exactly 11 digits)
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 10 }), // Too short
          fc.string({ minLength: 12, maxLength: 20 }), // Too long
          fc.string({ minLength: 11, maxLength: 11 }).filter(s => !/^\d{11}$/.test(s)), // 11 chars but not all digits
        ),
        (invalidNIN) => {
          const result = validateNINFormat(invalidNIN);
          
          // Invalid format should return valid=false
          expect(result.valid).toBe(false);
          
          // Should have an error message
          expect(result.error).toBeDefined();
          expect(result.error).not.toBe('');
          
          // Error message should be descriptive
          expect(typeof result.error).toBe('string');
          expect(result.error!.length).toBeGreaterThan(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce error messages for all invalid CAC formats', () => {
    fc.assert(
      fc.property(
        // Generate strings that are NOT valid CAC numbers (not starting with RC followed by digits)
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 5 }).filter(s => !s.toUpperCase().startsWith('RC')), // No RC prefix
          fc.constant('RC'), // Just RC with no digits
          fc.string({ minLength: 1, maxLength: 10 }).map(s => 'RC' + s).filter(s => !/^RC\d+$/i.test(s)), // RC but not followed by digits
        ),
        (invalidCAC) => {
          const result = validateCACFormat(invalidCAC);
          
          // Invalid format should return valid=false
          expect(result.valid).toBe(false);
          
          // Should have an error message
          expect(result.error).toBeDefined();
          expect(result.error).not.toBe('');
          
          // Error message should be descriptive
          expect(typeof result.error).toBe('string');
          expect(result.error!.length).toBeGreaterThan(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce specific error messages for NIN length issues', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 1, max: 10 }).chain(len => fc.array(fc.integer({ min: 0, max: 9 }), { minLength: len, maxLength: len }).map(arr => arr.join(''))),
          fc.integer({ min: 12, max: 20 }).chain(len => fc.array(fc.integer({ min: 0, max: 9 }), { minLength: len, maxLength: len }).map(arr => arr.join(''))),
        ),
        (invalidLengthNIN) => {
          const result = validateNINFormat(invalidLengthNIN);
          
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
          
          // Error should mention "11 digits" or "length" or "required"
          const errorLower = result.error!.toLowerCase();
          expect(errorLower.includes('11') || errorLower.includes('digit') || errorLower.includes('length') || errorLower.includes('required')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce specific error messages for NIN with non-digit characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 11, maxLength: 11 }).filter(s => /[^\d]/.test(s)),
        (ninWithNonDigits) => {
          const result = validateNINFormat(ninWithNonDigits);
          
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
          
          // Error should mention "numbers" or "digits"
          const errorLower = result.error!.toLowerCase();
          expect(errorLower.includes('number') || errorLower.includes('digit')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce specific error messages for CAC without RC prefix', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 15 }).filter(s => !s.toUpperCase().startsWith('RC')),
        (cacWithoutRC) => {
          const result = validateCACFormat(cacWithoutRC);
          
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
          
          // Error should mention "RC"
          expect(result.error!.includes('RC')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce specific error messages for CAC with RC but no digits', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('RC'),
          fc.constant('rc'),
          fc.string({ minLength: 1, maxLength: 10 }).map(s => 'RC' + s).filter(s => !/^RC\d+$/i.test(s)),
        ),
        (cacWithoutDigits) => {
          const result = validateCACFormat(cacWithoutDigits);
          
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
          
          // Error should mention "digits" or "number"
          const errorLower = result.error!.toLowerCase();
          expect(errorLower.includes('digit') || errorLower.includes('number')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never make API calls for format validation (client-side only)', () => {
    // This property verifies that format validation is synchronous and client-side
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const startTime = performance.now();
          
          // Run both validators
          validateNINFormat(input);
          validateCACFormat(input);
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Format validation should be extremely fast (< 10ms)
          // If it were making API calls, it would take much longer
          expect(duration).toBeLessThan(10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
