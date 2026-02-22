/**
 * Property-Based Test: High Mapping Success Rate
 * 
 * Feature: nin-cac-autofill
 * Property 14: High Mapping Success Rate
 * 
 * Validates: Requirements 3.6
 * 
 * For any supported form type (individual-kyc, corporate-kyc, brokers-kyc,
 * agentsCDD, partnersCDD, motor-claims), at least 90% of available API
 * response fields should be successfully mapped to form fields.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { FieldMapper } from '../../services/autoFill/FieldMapper';
import { NormalizedNINData, NormalizedCACData } from '../../services/autoFill/DataNormalizer';

describe('Feature: nin-cac-autofill, Property 14: High Mapping Success Rate', () => {
  let fieldMapper: FieldMapper;

  beforeEach(() => {
    fieldMapper = new FieldMapper();
  });

  /**
   * Helper function to create a form with standard field names
   * using various naming conventions
   */
  function createIndividualKYCForm(namingConvention: 'camelCase' | 'snake_case' | 'Title Case'): HTMLFormElement {
    const form = document.createElement('form');
    
    const fieldNames = {
      camelCase: ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'phoneNumber', 'birthstate', 'birthlga'],
      snake_case: ['first_name', 'middle_name', 'last_name', 'gender', 'date_of_birth', 'phone_number', 'birthstate', 'birthlga'],
      'Title Case': ['First Name', 'Middle Name', 'Last Name', 'Gender', 'Date Of Birth', 'Phone Number', 'Birthstate', 'Birthlga']
    };

    fieldNames[namingConvention].forEach(fieldName => {
      const input = document.createElement('input');
      input.setAttribute('name', fieldName);
      input.setAttribute('type', 'text');
      form.appendChild(input);
    });

    return form;
  }

  /**
   * Helper function to create a corporate KYC form
   */
  function createCorporateKYCForm(namingConvention: 'camelCase' | 'snake_case' | 'Title Case'): HTMLFormElement {
    const form = document.createElement('form');
    
    const fieldNames = {
      camelCase: ['companyName', 'registrationNumber', 'registrationDate', 'companyStatus', 'typeOfEntity'],
      snake_case: ['company_name', 'registration_number', 'registration_date', 'company_status', 'type_of_entity'],
      'Title Case': ['Company Name', 'Registration Number', 'Registration Date', 'Company Status', 'Type Of Entity']
    };

    fieldNames[namingConvention].forEach(fieldName => {
      const input = document.createElement('input');
      input.setAttribute('name', fieldName);
      input.setAttribute('type', 'text');
      form.appendChild(input);
    });

    return form;
  }

  /**
   * Helper function to count non-empty fields in NIN data
   */
  function countNonEmptyNINFields(data: NormalizedNINData): number {
    let count = 0;
    if (data.firstName) count++;
    if (data.middleName) count++;
    if (data.lastName) count++;
    if (data.gender) count++;
    if (data.dateOfBirth) count++;
    if (data.phoneNumber) count++;
    if (data.birthstate) count++;
    if (data.birthlga) count++;
    return count;
  }

  /**
   * Helper function to count non-empty fields in CAC data
   */
  function countNonEmptyCACFields(data: NormalizedCACData): number {
    let count = 0;
    if (data.companyName) count++;
    if (data.registrationNumber) count++;
    if (data.registrationDate) count++;
    if (data.companyStatus) count++;
    if (data.typeOfEntity) count++;
    return count;
  }

  it('should achieve at least 90% mapping success rate for individual-kyc forms with camelCase fields', () => {
    fc.assert(
      fc.property(
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
        (ninData) => {
          const form = createIndividualKYCForm('camelCase');
          const mappings = fieldMapper.mapNINFields(ninData as NormalizedNINData, form);

          const availableFields = countNonEmptyNINFields(ninData as NormalizedNINData);
          const mappedFields = mappings.length;

          // Skip if no fields available
          if (availableFields === 0) return true;

          const successRate = mappedFields / availableFields;

          // Property: At least 90% of available fields should be mapped
          expect(successRate).toBeGreaterThanOrEqual(0.9);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should achieve at least 90% mapping success rate for individual-kyc forms with snake_case fields', () => {
    fc.assert(
      fc.property(
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
        (ninData) => {
          const form = createIndividualKYCForm('snake_case');
          const mappings = fieldMapper.mapNINFields(ninData as NormalizedNINData, form);

          const availableFields = countNonEmptyNINFields(ninData as NormalizedNINData);
          const mappedFields = mappings.length;

          // Skip if no fields available
          if (availableFields === 0) return true;

          const successRate = mappedFields / availableFields;

          // Property: At least 90% of available fields should be mapped
          expect(successRate).toBeGreaterThanOrEqual(0.9);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should achieve at least 90% mapping success rate for individual-kyc forms with Title Case fields', () => {
    fc.assert(
      fc.property(
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
        (ninData) => {
          const form = createIndividualKYCForm('Title Case');
          const mappings = fieldMapper.mapNINFields(ninData as NormalizedNINData, form);

          const availableFields = countNonEmptyNINFields(ninData as NormalizedNINData);
          const mappedFields = mappings.length;

          // Skip if no fields available
          if (availableFields === 0) return true;

          const successRate = mappedFields / availableFields;

          // Property: At least 90% of available fields should be mapped
          expect(successRate).toBeGreaterThanOrEqual(0.9);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should achieve at least 90% mapping success rate for corporate-kyc forms with camelCase fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 100 }),
          registrationNumber: fc.string({ minLength: 1, maxLength: 20 }),
          registrationDate: fc.string({ minLength: 1, maxLength: 20 }),
          companyStatus: fc.string({ minLength: 1, maxLength: 50 }),
          typeOfEntity: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
        }),
        (cacData) => {
          const form = createCorporateKYCForm('camelCase');
          const mappings = fieldMapper.mapCACFields(cacData as NormalizedCACData, form);

          const availableFields = countNonEmptyCACFields(cacData as NormalizedCACData);
          const mappedFields = mappings.length;

          // Skip if no fields available
          if (availableFields === 0) return true;

          const successRate = mappedFields / availableFields;

          // Property: At least 90% of available fields should be mapped
          expect(successRate).toBeGreaterThanOrEqual(0.9);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should achieve at least 90% mapping success rate for corporate-kyc forms with snake_case fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 100 }),
          registrationNumber: fc.string({ minLength: 1, maxLength: 20 }),
          registrationDate: fc.string({ minLength: 1, maxLength: 20 }),
          companyStatus: fc.string({ minLength: 1, maxLength: 50 }),
          typeOfEntity: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
        }),
        (cacData) => {
          const form = createCorporateKYCForm('snake_case');
          const mappings = fieldMapper.mapCACFields(cacData as NormalizedCACData, form);

          const availableFields = countNonEmptyCACFields(cacData as NormalizedCACData);
          const mappedFields = mappings.length;

          // Skip if no fields available
          if (availableFields === 0) return true;

          const successRate = mappedFields / availableFields;

          // Property: At least 90% of available fields should be mapped
          expect(successRate).toBeGreaterThanOrEqual(0.9);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should achieve at least 90% mapping success rate for corporate-kyc forms with Title Case fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          companyName: fc.string({ minLength: 1, maxLength: 100 }),
          registrationNumber: fc.string({ minLength: 1, maxLength: 20 }),
          registrationDate: fc.string({ minLength: 1, maxLength: 20 }),
          companyStatus: fc.string({ minLength: 1, maxLength: 50 }),
          typeOfEntity: fc.option(fc.string({ minLength: 1, maxLength: 50 }))
        }),
        (cacData) => {
          const form = createCorporateKYCForm('Title Case');
          const mappings = fieldMapper.mapCACFields(cacData as NormalizedCACData, form);

          const availableFields = countNonEmptyCACFields(cacData as NormalizedCACData);
          const mappedFields = mappings.length;

          // Skip if no fields available
          if (availableFields === 0) return true;

          const successRate = mappedFields / availableFields;

          // Property: At least 90% of available fields should be mapped
          expect(successRate).toBeGreaterThanOrEqual(0.9);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should achieve at least 90% mapping success rate for mixed forms (brokers-kyc)', () => {
    fc.assert(
      fc.property(
        fc.record({
          firstName: fc.string({ minLength: 1, maxLength: 50 }),
          lastName: fc.string({ minLength: 1, maxLength: 50 }),
          gender: fc.constantFrom('male', 'female', ''),
          dateOfBirth: fc.string({ minLength: 1, maxLength: 20 }),
          phoneNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 }))
        }),
        (ninData) => {
          // Create a mixed form with both individual and corporate fields
          const form = document.createElement('form');
          ['firstName', 'lastName', 'gender', 'dateOfBirth', 'phoneNumber', 'companyName', 'registrationNumber'].forEach(fieldName => {
            const input = document.createElement('input');
            input.setAttribute('name', fieldName);
            input.setAttribute('type', 'text');
            form.appendChild(input);
          });

          const mappings = fieldMapper.mapNINFields(ninData as NormalizedNINData, form);

          const availableFields = countNonEmptyNINFields(ninData as NormalizedNINData);
          const mappedFields = mappings.length;

          // Skip if no fields available
          if (availableFields === 0) return true;

          const successRate = mappedFields / availableFields;

          // Property: At least 90% of available fields should be mapped
          expect(successRate).toBeGreaterThanOrEqual(0.9);
        }
      ),
      { numRuns: 100 }
    );
  });
});
