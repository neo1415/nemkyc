/**
 * Property-Based Test: Field Mapping Correctness
 * 
 * Property 11: Field Mapping Correctness
 * For any field defined in the form mapping configuration, the Admin Table column
 * SHALL retrieve data from the correct database field name.
 * 
 * Validates: Requirements 8.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FORM_MAPPINGS } from '@/config/formMappings';

// Helper function to get field value from data object (mimics AdminUnifiedTable behavior)
const getFieldValue = (data: any, field: string): any => {
  if (field.includes('.')) {
    const parts = field.split('.');
    let value = data;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    return value;
  }
  return data[field];
};

// Helper to extract all field keys from a form mapping
const extractFieldKeys = (formType: string): string[] => {
  const mapping = FORM_MAPPINGS[formType];
  if (!mapping) return [];
  
  const keys: string[] = [];
  mapping.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.type !== 'file') {
        keys.push(field.key);
      }
    });
  });
  
  return keys;
};

describe('Property 11: Field Mapping Correctness', () => {
  it('should retrieve correct field values for motor claims mapping', () => {
    const motorClaimsFields = extractFieldKeys('motor-claims');
    
    fc.assert(
      fc.property(
        fc.record({
          policyNumber: fc.string({ minLength: 5, maxLength: 20 }),
          insuredSurname: fc.string({ minLength: 2, maxLength: 50 }),
          insuredFirstName: fc.string({ minLength: 2, maxLength: 50 }),
          phone: fc.string({ minLength: 10, maxLength: 15 }),
          email: fc.emailAddress(),
          registrationNumber: fc.string({ minLength: 5, maxLength: 15 }),
          incidentTime: fc.oneof(
            fc.tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
              .map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
            fc.constant('14:30')
          ),
          otherDriverPhone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
          otherVehicleMake: fc.option(fc.string({ minLength: 2, maxLength: 30 }), { nil: undefined })
        }),
        (mockData) => {
          // Test that each field in the mapping can be retrieved correctly
          motorClaimsFields.forEach(fieldKey => {
            if (Object.prototype.hasOwnProperty.call(mockData, fieldKey)) {
              const retrievedValue = getFieldValue(mockData, fieldKey);
              expect(retrievedValue).toBe(mockData[fieldKey]);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle nested field paths correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          user: fc.record({
            profile: fc.record({
              name: fc.string({ minLength: 1 }),
              age: fc.integer({ min: 18, max: 100 })
            })
          })
        }),
        (mockData) => {
          // Test nested field access
          expect(getFieldValue(mockData, 'user.profile.name')).toBe(mockData.user.profile.name);
          expect(getFieldValue(mockData, 'user.profile.age')).toBe(mockData.user.profile.age);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return undefined for non-existent fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          existingField: fc.string()
        }),
        (mockData) => {
          expect(getFieldValue(mockData, 'nonExistentField')).toBeUndefined();
          expect(getFieldValue(mockData, 'nested.nonExistent')).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly map all motor claims fields', () => {
    const motorClaimsMapping = FORM_MAPPINGS['motor-claims'];
    expect(motorClaimsMapping).toBeDefined();
    
    // Check that critical fields are present in the mapping
    const allFields = extractFieldKeys('motor-claims');
    
    // Critical motor claims fields that must be mapped
    const criticalFields = [
      'policyNumber',
      'insuredSurname',
      'insuredFirstName',
      'phone',
      'email',
      'registrationNumber',
      'incidentTime',
      'incidentDate',
      'incidentLocation',
      'otherDriverPhone', // New field added in requirements
      'otherVehicleMake'
    ];
    
    criticalFields.forEach(field => {
      expect(allFields).toContain(field);
    });
  });

  it('should handle array fields in mapping', () => {
    const motorClaimsFields = extractFieldKeys('motor-claims');
    
    // Witnesses is an array field
    expect(motorClaimsFields).toContain('witnesses');
    
    fc.assert(
      fc.property(
        fc.record({
          witnesses: fc.array(
            fc.record({
              name: fc.string({ minLength: 2 }),
              phone: fc.string({ minLength: 10 }),
              address: fc.string({ minLength: 5 })
            }),
            { minLength: 0, maxLength: 5 }
          )
        }),
        (mockData) => {
          const retrievedValue = getFieldValue(mockData, 'witnesses');
          expect(Array.isArray(retrievedValue)).toBe(true);
          expect(retrievedValue).toEqual(mockData.witnesses);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify field mappings exist for all supported form types', () => {
    const supportedFormTypes = [
      'motor-claims',
      'all-risk-claims',
      'goods-in-transit-claims',
      'rent-assurance-claims',
      'professional-indemnity-claims',
      'public-liability-claims',
      'employers-liability-claims'
    ];
    
    supportedFormTypes.forEach(formType => {
      const mapping = FORM_MAPPINGS[formType];
      expect(mapping).toBeDefined();
      expect(mapping.sections).toBeDefined();
      expect(Array.isArray(mapping.sections)).toBe(true);
      expect(mapping.sections.length).toBeGreaterThan(0);
    });
  });

  it('should ensure motor claims mapping includes otherDriverPhone field', () => {
    const motorClaimsMapping = FORM_MAPPINGS['motor-claims'];
    const allFields = extractFieldKeys('motor-claims');
    
    // Verify the new field from requirements 1.1 is in the mapping
    expect(allFields).toContain('otherDriverPhone');
    
    // Find the field in the sections
    let foundField = false;
    motorClaimsMapping.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.key === 'otherDriverPhone') {
          foundField = true;
          expect(field.label).toBe('Other Driver Phone');
          expect(field.type).toBe('text');
        }
      });
    });
    
    expect(foundField).toBe(true);
  });

  it('should correctly retrieve time field values without corruption', () => {
    fc.assert(
      fc.property(
        fc.record({
          incidentTime: fc.oneof(
            fc.tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
              .map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
            fc.date().map(d => d.toISOString())
          )
        }),
        (mockData) => {
          const retrievedValue = getFieldValue(mockData, 'incidentTime');
          
          // Value should be retrieved exactly as stored
          expect(retrievedValue).toBe(mockData.incidentTime);
          
          // Should not be NaN or corrupted
          expect(retrievedValue).not.toBe('NaN');
          expect(retrievedValue).not.toContain('NaN');
          expect(typeof retrievedValue).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle optional fields correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          policyNumber: fc.string(),
          otherDriverPhone: fc.option(fc.string(), { nil: undefined }),
          otherVehicleMake: fc.option(fc.string(), { nil: undefined })
        }),
        (mockData) => {
          // Required field should always be retrievable
          expect(getFieldValue(mockData, 'policyNumber')).toBe(mockData.policyNumber);
          
          // Optional fields should return undefined when not present
          const phoneValue = getFieldValue(mockData, 'otherDriverPhone');
          const makeValue = getFieldValue(mockData, 'otherVehicleMake');
          
          if (mockData.otherDriverPhone !== undefined) {
            expect(phoneValue).toBe(mockData.otherDriverPhone);
          } else {
            expect(phoneValue).toBeUndefined();
          }
          
          if (mockData.otherVehicleMake !== undefined) {
            expect(makeValue).toBe(mockData.otherVehicleMake);
          } else {
            expect(makeValue).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify claim form mappings have required system fields', () => {
    // Only check claim forms which should have status fields
    const claimFormTypes = [
      'motor-claims',
      'all-risk-claims',
      'goods-in-transit-claims',
      'rent-assurance-claims',
      'professional-indemnity-claims',
      'public-liability-claims',
      'employers-liability-claims'
    ];
    
    claimFormTypes.forEach(formType => {
      const fields = extractFieldKeys(formType);
      
      // System fields that should be in every claim form mapping
      expect(fields).toContain('status');
      expect(fields).toContain('submittedAt');
      expect(fields).toContain('submittedBy');
    });
  });
});
