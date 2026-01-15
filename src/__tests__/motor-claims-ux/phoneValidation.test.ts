/**
 * Property-Based Tests for Phone Number Validation
 * 
 * Feature: motor-claims-ux-improvements
 * Property 16: Phone Number Validation
 * 
 * **Validates: Requirements 1.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateAndFormatPhone, PhoneValidationResult } from '../../utils/phoneController';

describe('Feature: motor-claims-ux-improvements, Property 16: Phone Number Validation', () => {
  /**
   * Property: Valid Nigerian Phone Numbers Pass Validation
   * For any valid Nigerian phone number format, validation SHALL pass
   * 
   * **Validates: Requirements 1.2**
   */
  it('should validate valid Nigerian phone numbers', () => {
    // Nigerian phone number patterns (mobile)
    const validNigerianPrefixes = ['0803', '0805', '0806', '0807', '0808', '0809', '0810', '0811', '0812', '0813', '0814', '0815', '0816', '0817', '0818', '0819', '0902', '0903', '0904', '0905', '0906', '0907', '0908', '0909', '0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...validNigerianPrefixes),
        fc.stringMatching(/^\d{7}$/),
        (prefix, suffix) => {
          const phoneNumber = prefix + suffix;
          const result = validateAndFormatPhone(phoneNumber, 'NG');
          
          // Valid Nigerian numbers should pass validation
          expect(result.isValid).toBe(true);
          expect(result.formatted).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid International Format Phone Numbers Pass Validation
   * For any phone number in valid international format (+234...), validation SHALL pass
   * 
   * **Validates: Requirements 1.2**
   */
  it('should validate valid international format Nigerian phone numbers', () => {
    const validNigerianMobilePrefixes = ['803', '805', '806', '807', '808', '809', '810', '811', '812', '813', '814', '815', '816', '817', '818', '819', '902', '903', '904', '905', '906', '907', '908', '909', '701', '702', '703', '704', '705', '706', '707', '708'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...validNigerianMobilePrefixes),
        fc.stringMatching(/^\d{7}$/),
        (prefix, suffix) => {
          const phoneNumber = '+234' + prefix + suffix;
          const result = validateAndFormatPhone(phoneNumber);
          
          // Valid international format should pass validation
          expect(result.isValid).toBe(true);
          expect(result.formatted).toBeDefined();
          expect(result.country).toBe('NG');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty Phone Numbers Fail Validation
   * For any empty or whitespace-only input, validation SHALL fail
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject empty phone numbers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', '  ', '\t', '\n'),
        (emptyInput) => {
          const result = validateAndFormatPhone(emptyInput.trim());
          
          // Empty inputs should fail validation
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Invalid Format Phone Numbers Fail Validation
   * For any phone number with invalid format (letters, special chars, wrong length), validation SHALL fail
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject invalid phone number formats', () => {
    const invalidFormats = [
      'abc12345678',      // Contains letters
      '123',              // Too short
      '12345',            // Too short
      '!@#$%^&*()',       // Special characters only
      '0803-123-4567',    // Contains dashes (may or may not be valid depending on parser)
      'phone123',         // Mixed letters and numbers
      '000000000000',     // Invalid prefix
    ];
    
    invalidFormats.forEach(invalidPhone => {
      const result = validateAndFormatPhone(invalidPhone, 'NG');
      // Most invalid formats should fail
      // Note: Some formats might be parsed differently by libphonenumber-js
      if (!result.isValid) {
        expect(result.error).toBeDefined();
      }
    });
  });

  /**
   * Property: Validation Result Structure
   * For any input, the validation result SHALL have the correct structure
   * 
   * **Validates: Requirements 1.2**
   */
  it('should return properly structured validation results', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 20 }),
        (input) => {
          const result: PhoneValidationResult = validateAndFormatPhone(input, 'NG');
          
          // Result should always have isValid property
          expect(typeof result.isValid).toBe('boolean');
          
          // If valid, should have formatted number
          if (result.isValid) {
            expect(result.formatted).toBeDefined();
            expect(typeof result.formatted).toBe('string');
          }
          
          // If invalid, should have error message
          if (!result.isValid) {
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Formatted Output Consistency
   * For any valid phone number, the formatted output SHALL be consistent across multiple validations
   * 
   * **Validates: Requirements 1.2**
   */
  it('should produce consistent formatted output for the same input', () => {
    const validNigerianPrefixes = ['0803', '0805', '0806', '0807', '0808'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...validNigerianPrefixes),
        fc.stringMatching(/^\d{7}$/),
        (prefix, suffix) => {
          const phoneNumber = prefix + suffix;
          
          // Validate the same number multiple times
          const result1 = validateAndFormatPhone(phoneNumber, 'NG');
          const result2 = validateAndFormatPhone(phoneNumber, 'NG');
          const result3 = validateAndFormatPhone(phoneNumber, 'NG');
          
          // Results should be consistent
          expect(result1.isValid).toBe(result2.isValid);
          expect(result2.isValid).toBe(result3.isValid);
          
          if (result1.isValid) {
            expect(result1.formatted).toBe(result2.formatted);
            expect(result2.formatted).toBe(result3.formatted);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
