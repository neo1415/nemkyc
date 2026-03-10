/**
 * NIN Verification Data Matching Tests
 * 
 * Tests that NIN verification data matches user-entered data
 */

import { describe, it, expect } from 'vitest';
import { matchNINData } from '../../utils/verificationMatcher';

describe('NIN Verification Matching', () => {
  it('should match when names are identical', () => {
    const result = matchNINData(
      {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'Male'
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        birthdate: '1990-05-15',
        gender: 'Male'
      }
    );

    expect(result.matches).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('should fail when first names are completely different', () => {
    const result = matchNINData(
      {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-05-15')
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        birthdate: '1990-05-15'
      }
    );

    expect(result.matches).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
    expect(result.mismatches[0]).toContain('first name');
  });

  it('should fail when last names are completely different', () => {
    const result = matchNINData(
      {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-05-15')
      },
      {
        firstName: 'John',
        lastName: 'Smith',
        birthdate: '1990-05-15'
      }
    );

    expect(result.matches).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
    expect(result.mismatches[0]).toContain('last name');
  });

  it('should fail when dates of birth differ', () => {
    const result = matchNINData(
      {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-05-15')
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        birthdate: '1985-03-20'
      }
    );

    expect(result.matches).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
    expect(result.mismatches[0]).toContain('date of birth');
  });

  it('should handle case-insensitive matching', () => {
    const result = matchNINData(
      {
        firstName: 'john',
        lastName: 'doe',
        dateOfBirth: new Date('1990-05-15')
      },
      {
        firstName: 'JOHN',
        lastName: 'DOE',
        birthdate: '1990-05-15'
      }
    );

    expect(result.matches).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('should warn on gender mismatch but not fail', () => {
    const result = matchNINData(
      {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'Male'
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        birthdate: '1990-05-15',
        gender: 'Female'
      }
    );

    expect(result.matches).toBe(true); // Gender is warning only
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should handle missing optional fields gracefully', () => {
    const result = matchNINData(
      {
        firstName: 'John',
        lastName: 'Doe'
      },
      {
        firstName: 'John',
        lastName: 'Doe'
      }
    );

    expect(result.matches).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });
});
