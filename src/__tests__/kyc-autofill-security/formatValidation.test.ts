/**
 * Unit Tests for Identity Format Validation Edge Cases
 * 
 * Feature: kyc-autofill-security
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 * 
 * Tests specific edge cases and boundary conditions for identity format validation.
 */

import { describe, it, expect } from 'vitest';
import { validateNINFormat, validateCACFormat } from '../../utils/identityFormatValidator';

describe('Identity Format Validation - Edge Cases', () => {
  describe('NIN Validation Edge Cases', () => {
    describe('Empty and Null Values', () => {
      it('should reject empty string', () => {
        const result = validateNINFormat('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN is required');
        expect(result.fieldName).toBe('NIN');
      });

      it('should reject whitespace-only string', () => {
        const result = validateNINFormat('   ');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN is required');
      });

      it('should reject null value', () => {
        const result = validateNINFormat(null as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN is required');
      });

      it('should reject undefined value', () => {
        const result = validateNINFormat(undefined as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN is required');
      });
    });

    describe('Special Characters', () => {
      it('should reject NIN with spaces', () => {
        const result = validateNINFormat('123 456 7890');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN must contain only numbers');
      });

      it('should reject NIN with hyphens', () => {
        const result = validateNINFormat('123-456-7890');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN must contain only numbers');
      });

      it('should reject NIN with letters', () => {
        const result = validateNINFormat('12345ABC890');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN must contain only numbers');
      });

      it('should reject NIN with special characters', () => {
        const result = validateNINFormat('12345@67890');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN must contain only numbers');
      });

      it('should reject NIN with dots', () => {
        const result = validateNINFormat('123.456.7890');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN must contain only numbers');
      });
    });

    describe('Boundary Cases - Length', () => {
      it('should reject NIN with 10 digits (one less than required)', () => {
        const result = validateNINFormat('1234567890');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN must be exactly 11 digits');
      });

      it('should accept NIN with exactly 11 digits', () => {
        const result = validateNINFormat('12345678901');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject NIN with 12 digits (one more than required)', () => {
        const result = validateNINFormat('123456789012');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN must be exactly 11 digits');
      });

      it('should reject NIN with 1 digit', () => {
        const result = validateNINFormat('1');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN must be exactly 11 digits');
      });

      it('should reject NIN with 0 digits', () => {
        const result = validateNINFormat('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('NIN is required');
      });
    });

    describe('Whitespace Handling', () => {
      it('should accept valid NIN with leading whitespace', () => {
        const result = validateNINFormat('  12345678901');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept valid NIN with trailing whitespace', () => {
        const result = validateNINFormat('12345678901  ');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept valid NIN with both leading and trailing whitespace', () => {
        const result = validateNINFormat('  12345678901  ');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('All Zeros and Repeated Digits', () => {
      it('should accept NIN with all zeros', () => {
        const result = validateNINFormat('00000000000');
        expect(result.valid).toBe(true);
      });

      it('should accept NIN with all nines', () => {
        const result = validateNINFormat('99999999999');
        expect(result.valid).toBe(true);
      });

      it('should accept NIN with repeated digit', () => {
        const result = validateNINFormat('11111111111');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('CAC/RC Validation Edge Cases', () => {
    describe('Empty and Null Values', () => {
      it('should reject empty string', () => {
        const result = validateCACFormat('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number is required');
        expect(result.fieldName).toBe('CAC/RC');
      });

      it('should reject whitespace-only string', () => {
        const result = validateCACFormat('   ');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number is required');
      });

      it('should reject null value', () => {
        const result = validateCACFormat(null as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number is required');
      });

      it('should reject undefined value', () => {
        const result = validateCACFormat(undefined as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number is required');
      });
    });

    describe('RC Prefix Validation', () => {
      it('should reject CAC without RC prefix', () => {
        const result = validateCACFormat('123456');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number must start with "RC"');
      });

      it('should reject CAC with wrong prefix', () => {
        const result = validateCACFormat('AC123456');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number must start with "RC"');
      });

      it('should accept CAC with uppercase RC prefix', () => {
        const result = validateCACFormat('RC123456');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept CAC with lowercase rc prefix', () => {
        const result = validateCACFormat('rc123456');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept CAC with mixed case Rc prefix', () => {
        const result = validateCACFormat('Rc123456');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept CAC with mixed case rC prefix', () => {
        const result = validateCACFormat('rC123456');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('Digits After RC', () => {
      it('should reject RC without digits', () => {
        const result = validateCACFormat('RC');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number must have digits after "RC"');
      });

      it('should reject RC followed by letters', () => {
        const result = validateCACFormat('RCABC');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number must have digits after "RC"');
      });

      it('should reject RC followed by special characters', () => {
        const result = validateCACFormat('RC@#$');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number must have digits after "RC"');
      });

      it('should reject RC followed by space and digits', () => {
        const result = validateCACFormat('RC 123456');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number must have digits after "RC"');
      });

      it('should reject RC followed by digits and letters', () => {
        const result = validateCACFormat('RC123ABC');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('CAC/RC number must have digits after "RC"');
      });

      it('should accept RC followed by single digit', () => {
        const result = validateCACFormat('RC1');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept RC followed by multiple digits', () => {
        const result = validateCACFormat('RC123456789');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('Whitespace Handling', () => {
      it('should accept valid CAC with leading whitespace', () => {
        const result = validateCACFormat('  RC123456');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept valid CAC with trailing whitespace', () => {
        const result = validateCACFormat('RC123456  ');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept valid CAC with both leading and trailing whitespace', () => {
        const result = validateCACFormat('  RC123456  ');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('Common Real-World Examples', () => {
      it('should accept typical CAC format RC123456', () => {
        const result = validateCACFormat('RC123456');
        expect(result.valid).toBe(true);
      });

      it('should accept CAC with leading zeros RC000123', () => {
        const result = validateCACFormat('RC000123');
        expect(result.valid).toBe(true);
      });

      it('should accept long CAC number RC1234567890', () => {
        const result = validateCACFormat('RC1234567890');
        expect(result.valid).toBe(true);
      });

      it('should accept short CAC number RC1', () => {
        const result = validateCACFormat('RC1');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Result Structure Consistency', () => {
    it('should always return fieldName for NIN', () => {
      const validResult = validateNINFormat('12345678901');
      const invalidResult = validateNINFormat('invalid');
      
      expect(validResult.fieldName).toBe('NIN');
      expect(invalidResult.fieldName).toBe('NIN');
    });

    it('should always return fieldName for CAC', () => {
      const validResult = validateCACFormat('RC123456');
      const invalidResult = validateCACFormat('invalid');
      
      expect(validResult.fieldName).toBe('CAC/RC');
      expect(invalidResult.fieldName).toBe('CAC/RC');
    });

    it('should not include error property when valid', () => {
      const ninResult = validateNINFormat('12345678901');
      const cacResult = validateCACFormat('RC123456');
      
      expect(ninResult.error).toBeUndefined();
      expect(cacResult.error).toBeUndefined();
    });

    it('should always include error property when invalid', () => {
      const ninResult = validateNINFormat('invalid');
      const cacResult = validateCACFormat('invalid');
      
      expect(ninResult.error).toBeDefined();
      expect(typeof ninResult.error).toBe('string');
      expect(cacResult.error).toBeDefined();
      expect(typeof cacResult.error).toBe('string');
    });
  });
});
