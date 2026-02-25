/**
 * Property Test: Validation Consistency
 * 
 * **Property 7: Validation Consistency**
 * 
 * For any row that is saved after editing, re-validation should apply the same 
 * validation rules (18+ age, 11-digit NIN/BVN, valid year range) as the initial 
 * upload validation.
 * 
 * **Validates: Requirements 3.5**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateRow } from '../../utils/validation/rowValidation';
import { validateIdentityData } from '../../utils/validation/identityValidation';

describe('Property 7: Validation Consistency', () => {
  it('should apply same validation rules for row validation as initial validation', () => {
    fc.assert(
      fc.property(
        // Generate DOB (valid and invalid)
        fc.oneof(
          fc.constant('01/01/1990'), // Valid: 34 years old
          fc.constant('01/01/2010'), // Invalid: 14 years old (under 18)
          fc.constant('15/03/1985'), // Valid: 39 years old
          fc.constant('01/01/2020'), // Invalid: 4 years old
        ),
        // Generate NIN (valid and invalid)
        fc.oneof(
          fc.constant('12345678901'), // Valid: 11 digits
          fc.constant('123'), // Invalid: too short
          fc.constant('123456789012345'), // Invalid: too long
          fc.constant('1234567890A'), // Invalid: contains letter
        ),
        // Generate BVN (valid and invalid)
        fc.oneof(
          fc.constant('98765432109'), // Valid: 11 digits
          fc.constant('987'), // Invalid: too short
          fc.constant('987654321098765'), // Invalid: too long
          fc.constant('9876543210B'), // Invalid: contains letter
        ),
        (dob, nin, bvn) => {
          const row = {
            'Date of Birth': dob,
            'NIN': nin,
            'BVN': bvn,
            'Email': 'test@example.com',
            'First Name': 'John',
            'Last Name': 'Doe',
          };

          const columns = ['Date of Birth', 'NIN', 'BVN', 'Email', 'First Name', 'Last Name'];

          // Validate using initial validation (full dataset)
          const initialValidation = validateIdentityData([row], columns, { templateType: 'individual' });
          const initialErrors = initialValidation.errors.filter(e => e.rowIndex === 0);

          // Validate using row validation (single row)
          const rowErrors = validateRow(row, 0, columns, { templateType: 'individual' });

          // Both should produce the same errors for the same row
          expect(rowErrors.length).toBe(initialErrors.length);

          // Check that error types match
          const initialErrorTypes = initialErrors.map(e => e.errorType).sort();
          const rowErrorTypes = rowErrors.map(e => e.errorType).sort();
          expect(rowErrorTypes).toEqual(initialErrorTypes);

          // Check that error columns match
          const initialErrorColumns = initialErrors.map(e => e.column).sort();
          const rowErrorColumns = rowErrors.map(e => e.column).sort();
          expect(rowErrorColumns).toEqual(initialErrorColumns);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate DOB age requirement consistently (18+ years)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2024 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        (year, month, day) => {
          const dob = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
          const row = {
            'Date of Birth': dob,
            'Email': 'test@example.com',
            'First Name': 'John',
            'Last Name': 'Doe',
          };

          const columns = ['Date of Birth', 'Email', 'First Name', 'Last Name'];
          const currentYear = 2024;

          // Calculate expected age
          const age = currentYear - year;
          const shouldHaveError = age < 18;

          // Validate using row validation
          const rowErrors = validateRow(row, 0, columns, { templateType: 'individual', currentYear });
          const dobErrors = rowErrors.filter(e => e.column === 'Date of Birth' && e.errorType === 'DOB_UNDER_AGE');

          // Validate using initial validation
          const initialValidation = validateIdentityData([row], columns, { templateType: 'individual', currentYear });
          const initialDobErrors = initialValidation.errors.filter(
            e => e.column === 'Date of Birth' && e.errorType === 'DOB_UNDER_AGE'
          );

          // Both should agree on whether there's an age error
          if (shouldHaveError) {
            expect(dobErrors.length).toBeGreaterThan(0);
            expect(initialDobErrors.length).toBeGreaterThan(0);
          } else {
            expect(dobErrors.length).toBe(0);
            expect(initialDobErrors.length).toBe(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate NIN format consistently (11 digits)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('12345678901'), // Valid
          fc.constant('123'), // Invalid: too short
          fc.constant('123456789012345'), // Invalid: too long
          fc.constant('1234567890A'), // Invalid: non-digit
          fc.constant(''), // Invalid: empty
        ),
        (nin) => {
          const row = {
            'NIN': nin,
            'Date of Birth': '01/01/1990',
            'Email': 'test@example.com',
            'First Name': 'John',
            'Last Name': 'Doe',
          };

          const columns = ['NIN', 'Date of Birth', 'Email', 'First Name', 'Last Name'];

          // Validate using row validation
          const rowErrors = validateRow(row, 0, columns, { templateType: 'individual' });
          const ninErrors = rowErrors.filter(e => e.column === 'NIN');

          // Validate using initial validation
          const initialValidation = validateIdentityData([row], columns, { templateType: 'individual' });
          const initialNinErrors = initialValidation.errors.filter(e => e.column === 'NIN');

          // Both should produce the same result
          expect(ninErrors.length).toBe(initialNinErrors.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate BVN format consistently (11 digits)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('98765432109'), // Valid
          fc.constant('987'), // Invalid: too short
          fc.constant('987654321098765'), // Invalid: too long
          fc.constant('9876543210B'), // Invalid: non-digit
          fc.constant(''), // Invalid: empty
        ),
        (bvn) => {
          const row = {
            'BVN': bvn,
            'Date of Birth': '01/01/1990',
            'Email': 'test@example.com',
            'First Name': 'John',
            'Last Name': 'Doe',
          };

          const columns = ['BVN', 'Date of Birth', 'Email', 'First Name', 'Last Name'];

          // Validate using row validation
          const rowErrors = validateRow(row, 0, columns, { templateType: 'individual' });
          const bvnErrors = rowErrors.filter(e => e.column === 'BVN');

          // Validate using initial validation
          const initialValidation = validateIdentityData([row], columns, { templateType: 'individual' });
          const initialBvnErrors = initialValidation.errors.filter(e => e.column === 'BVN');

          // Both should produce the same result
          expect(bvnErrors.length).toBe(initialBvnErrors.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});
