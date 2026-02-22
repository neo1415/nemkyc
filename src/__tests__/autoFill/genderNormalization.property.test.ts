/**
 * Property-Based Tests for Gender Normalization
 * 
 * Feature: nin-cac-autofill
 * Property 4: Gender Normalization Consistency
 * Validates: Requirements 4.1
 * 
 * Tests that gender normalization consistently converts all variations
 * of male/female values to lowercase "male" or "female"
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeGender } from '../../utils/autoFill/normalizers';

describe('Feature: nin-cac-autofill, Property 4: Gender Normalization Consistency', () => {
  it('should normalize all male variations to lowercase "male"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('M', 'Male', 'MALE', 'm', 'male'),
        (genderInput) => {
          const normalized = normalizeGender(genderInput);
          expect(normalized).toBe('male');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should normalize all female variations to lowercase "female"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('F', 'Female', 'FEMALE', 'f', 'female'),
        (genderInput) => {
          const normalized = normalizeGender(genderInput);
          expect(normalized).toBe('female');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for invalid gender values', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          const lower = s.trim().toLowerCase();
          return lower !== 'm' && lower !== 'male' && 
                 lower !== 'f' && lower !== 'female';
        }),
        (invalidGender) => {
          const normalized = normalizeGender(invalidGender);
          expect(normalized).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle gender values with extra whitespace', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('M', 'Male', 'F', 'Female'),
        fc.nat(5),
        fc.nat(5),
        (gender, leadingSpaces, trailingSpaces) => {
          const paddedGender = ' '.repeat(leadingSpaces) + gender + ' '.repeat(trailingSpaces);
          const normalized = normalizeGender(paddedGender);
          const expected = gender.toLowerCase() === 'm' || gender.toLowerCase() === 'male' 
            ? 'male' 
            : 'female';
          expect(normalized).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for null, undefined, or empty values', () => {
    expect(normalizeGender('')).toBe('');
    expect(normalizeGender('   ')).toBe('');
    expect(normalizeGender(null as any)).toBe('');
    expect(normalizeGender(undefined as any)).toBe('');
  });

  it('should be case-insensitive for valid gender values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('male', 'female'),
        fc.constantFrom('lower', 'upper', 'mixed'),
        (baseGender, caseType) => {
          let genderInput: string;
          if (caseType === 'lower') {
            genderInput = baseGender.toLowerCase();
          } else if (caseType === 'upper') {
            genderInput = baseGender.toUpperCase();
          } else {
            // Mixed case
            genderInput = baseGender.charAt(0).toUpperCase() + baseGender.slice(1);
          }
          
          const normalized = normalizeGender(genderInput);
          expect(normalized).toBe(baseGender);
        }
      ),
      { numRuns: 100 }
    );
  });
});
