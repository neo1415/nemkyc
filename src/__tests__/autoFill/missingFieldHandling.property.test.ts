/**
 * Property-Based Test: Missing Field Graceful Handling
 * 
 * Feature: nin-cac-autofill
 * Property 11: Missing Field Graceful Handling
 * 
 * Validates: Requirements 3.3
 * 
 * For any API response field that doesn't have a corresponding form field,
 * the field mapper should skip that field without causing errors or blocking
 * other field population.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { FieldMapper } from '../../services/autoFill/FieldMapper';
import { NormalizedNINData, NormalizedCACData } from '../../services/autoFill/DataNormalizer';

describe('Feature: nin-cac-autofill, Property 11: Missing Field Graceful Handling', () => {
  let fieldMapper: FieldMapper;

  beforeEach(() => {
    fieldMapper = new FieldMapper();
  });

  it('should skip NIN fields that do not exist in the form without errors', () => {
    fc.assert(
      fc.property(
        // Generate random NIN data with all fields populated
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          middleName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          gender: fc.constantFrom('male', 'female', ''),
          dateOfBirth: fc.string({ minLength: 1, maxLength: 20 }),
          phoneNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
          birthstate: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          birthlga: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
        }),
        // Generate a subset of fields to include in the form (some fields will be missing)
        fc.subarray(['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'phoneNumber', 'birthstate', 'birthlga'], { minLength: 0, maxLength: 8 }),
        (ninData, fieldsToInclude) => {
          // Create a form with only the selected fields
          const form = document.createElement('form');
          fieldsToInclude.forEach(fieldName => {
            const input = document.createElement('input');
            input.setAttribute('name', fieldName);
            input.setAttribute('type', 'text');
            form.appendChild(input);
          });

          // Attempt to map all NIN fields to the form
          let mappings;
          let errorThrown = false;

          try {
            mappings = fieldMapper.mapNINFields(ninData as NormalizedNINData, form);
          } catch (error) {
            errorThrown = true;
          }

          // Property 1: No errors should be thrown
          expect(errorThrown).toBe(false);

          // Property 2: Mappings should only include fields that exist in the form
          if (mappings) {
            mappings.forEach(mapping => {
              expect(fieldsToInclude).toContain(mapping.sourceField);
            });

            // Property 3: Number of mappings should not exceed number of form fields
            expect(mappings.length).toBeLessThanOrEqual(fieldsToInclude.length);

            // Property 4: All mappings should have valid form field elements
            mappings.forEach(mapping => {
              expect(mapping.formFieldElement).toBeInstanceOf(HTMLInputElement);
              expect(form.contains(mapping.formFieldElement)).toBe(true);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should skip CAC fields that do not exist in the form without errors', () => {
    fc.assert(
      fc.property(
        // Generate random CAC data with all fields populated
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 100 }),
          registrationNumber: fc.string({ minLength: 1, maxLength: 20 }),
          registrationDate: fc.string({ minLength: 1, maxLength: 20 }),
          companyStatus: fc.string({ minLength: 1, maxLength: 50 }),
          typeOfEntity: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
        }),
        // Generate a subset of fields to include in the form
        fc.subarray(['companyName', 'registrationNumber', 'registrationDate', 'companyStatus', 'typeOfEntity'], { minLength: 0, maxLength: 5 }),
        (cacData, fieldsToInclude) => {
          // Create a form with only the selected fields
          const form = document.createElement('form');
          fieldsToInclude.forEach(fieldName => {
            const input = document.createElement('input');
            input.setAttribute('name', fieldName);
            input.setAttribute('type', 'text');
            form.appendChild(input);
          });

          // Attempt to map all CAC fields to the form
          let mappings;
          let errorThrown = false;

          try {
            mappings = fieldMapper.mapCACFields(cacData as NormalizedCACData, form);
          } catch (error) {
            errorThrown = true;
          }

          // Property 1: No errors should be thrown
          expect(errorThrown).toBe(false);

          // Property 2: Mappings should only include fields that exist in the form
          if (mappings) {
            mappings.forEach(mapping => {
              expect(fieldsToInclude).toContain(mapping.sourceField);
            });

            // Property 3: Number of mappings should not exceed number of form fields
            expect(mappings.length).toBeLessThanOrEqual(fieldsToInclude.length);

            // Property 4: All mappings should have valid form field elements
            mappings.forEach(mapping => {
              expect(mapping.formFieldElement).toBeInstanceOf(HTMLInputElement);
              expect(form.contains(mapping.formFieldElement)).toBe(true);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle forms with no matching fields gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          gender: fc.constantFrom('male', 'female', ''),
          dateOfBirth: fc.string({ minLength: 1, maxLength: 20 })
        }),
        (ninData) => {
          // Create a form with completely different field names
          const form = document.createElement('form');
          const unrelatedFields = ['field1', 'field2', 'field3', 'randomField', 'anotherField'];
          unrelatedFields.forEach(fieldName => {
            const input = document.createElement('input');
            input.setAttribute('name', fieldName);
            input.setAttribute('type', 'text');
            form.appendChild(input);
          });

          // Attempt to map NIN fields to the form
          let mappings;
          let errorThrown = false;

          try {
            mappings = fieldMapper.mapNINFields(ninData as NormalizedNINData, form);
          } catch (error) {
            errorThrown = true;
          }

          // Property 1: No errors should be thrown
          expect(errorThrown).toBe(false);

          // Property 2: Mappings should be empty (no matching fields)
          expect(mappings).toBeDefined();
          expect(mappings!.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should continue mapping other fields when some fields are missing', () => {
    fc.assert(
      fc.property(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          middleName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          gender: fc.constantFrom('male', 'female', ''),
          dateOfBirth: fc.string({ minLength: 1, maxLength: 20 }),
          phoneNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 }))
        }),
        (ninData) => {
          // Create a form with only firstName and lastName (missing other fields)
          const form = document.createElement('form');
          
          const firstNameInput = document.createElement('input');
          firstNameInput.setAttribute('name', 'firstName');
          form.appendChild(firstNameInput);

          const lastNameInput = document.createElement('input');
          lastNameInput.setAttribute('name', 'lastName');
          form.appendChild(lastNameInput);

          // Map fields
          const mappings = fieldMapper.mapNINFields(ninData as NormalizedNINData, form);

          // Property 1: Should successfully map the available fields
          expect(mappings.length).toBeGreaterThan(0);

          // Property 2: Should map firstName and lastName
          const mappedFields = mappings.map(m => m.sourceField);
          expect(mappedFields).toContain('firstName');
          expect(mappedFields).toContain('lastName');

          // Property 3: Should not include missing fields in mappings
          expect(mappedFields).not.toContain('gender');
          expect(mappedFields).not.toContain('dateOfBirth');
        }
      ),
      { numRuns: 100 }
    );
  });
});
