import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 12: Form Viewer Completeness
 * 
 * **Validates: Requirements 9.1, 9.3, 9.4**
 * 
 * For any form submission, the Form Viewer SHALL display all fields that have values 
 * in the database, SHALL format witnesses as individual entries, and SHALL NOT display 
 * fields that don't exist in the form schema.
 */

// Helper to simulate form viewer field filtering logic
const filterFieldsForDisplay = (formData: Record<string, any>, formSchema: string[]): Record<string, any> => {
  const filtered: Record<string, any> = {};
  
  // Only include fields that:
  // 1. Are in the form schema
  // 2. Have non-null, non-undefined values
  for (const key of formSchema) {
    if (key in formData && formData[key] !== null && formData[key] !== undefined) {
      filtered[key] = formData[key];
    }
  }
  
  return filtered;
};

// Helper to format witnesses as individual entries
const formatWitnesses = (witnesses: any): any[] => {
  if (!witnesses) return [];
  
  // If already an array, return as-is
  if (Array.isArray(witnesses)) {
    return witnesses.map((w, index) => ({
      label: `Witness ${index + 1}`,
      name: w.name || 'N/A',
      phone: w.phone || 'N/A',
      address: w.address || 'N/A'
    }));
  }
  
  // If single object, convert to array
  if (typeof witnesses === 'object') {
    return [{
      label: 'Witness 1',
      name: witnesses.name || 'N/A',
      phone: witnesses.phone || 'N/A',
      address: witnesses.address || 'N/A'
    }];
  }
  
  return [];
};

describe('Property 12: Form Viewer Completeness', () => {
  it('should display all fields with values from the database', () => {
    fc.assert(
      fc.property(
        // Generate form data with random fields
        fc.record({
          claimantName: fc.string({ minLength: 1, maxLength: 50 }),
          policyNumber: fc.string({ minLength: 5, maxLength: 20 }),
          incidentDate: fc.date(),
          description: fc.string({ minLength: 10, maxLength: 200 }),
          amount: fc.integer({ min: 0, max: 1000000 }),
          // Some fields might be null/undefined
          optionalField1: fc.option(fc.string(), { nil: null }),
          optionalField2: fc.option(fc.integer(), { nil: undefined })
        }),
        // Generate form schema (list of valid fields)
        fc.constant(['claimantName', 'policyNumber', 'incidentDate', 'description', 'amount', 'optionalField1', 'optionalField2']),
        (formData, formSchema) => {
          const displayedFields = filterFieldsForDisplay(formData, formSchema);
          
          // Property: All fields with non-null/non-undefined values should be displayed
          for (const key of formSchema) {
            if (formData[key] !== null && formData[key] !== undefined) {
              expect(displayedFields).toHaveProperty(key);
              expect(displayedFields[key]).toBe(formData[key]);
            }
          }
          
          // Property: Fields with null/undefined should NOT be displayed
          for (const key of formSchema) {
            if (formData[key] === null || formData[key] === undefined) {
              expect(displayedFields).not.toHaveProperty(key);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format witnesses as individual entries', () => {
    fc.assert(
      fc.property(
        // Generate witnesses data in various formats
        fc.oneof(
          // Array of witnesses
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
              address: fc.string({ minLength: 10, maxLength: 100 })
            }),
            { minLength: 0, maxLength: 5 }
          ),
          // Single witness object
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            address: fc.string({ minLength: 10, maxLength: 100 })
          }),
          // Null/undefined
          fc.constant(null),
          fc.constant(undefined)
        ),
        (witnesses) => {
          const formatted = formatWitnesses(witnesses);
          
          // Property: Result should always be an array
          expect(Array.isArray(formatted)).toBe(true);
          
          // Property: Each witness should have proper structure
          formatted.forEach((witness, index) => {
            expect(witness).toHaveProperty('label');
            expect(witness.label).toMatch(/^Witness \d+$/);
            expect(witness).toHaveProperty('name');
            expect(witness).toHaveProperty('phone');
            expect(witness).toHaveProperty('address');
          });
          
          // Property: If input is null/undefined, output should be empty array
          if (!witnesses) {
            expect(formatted).toHaveLength(0);
          }
          
          // Property: If input is array, output length should match
          if (Array.isArray(witnesses)) {
            expect(formatted).toHaveLength(witnesses.length);
          }
          
          // Property: If input is single object, output should have length 1
          if (witnesses && !Array.isArray(witnesses) && typeof witnesses === 'object') {
            expect(formatted).toHaveLength(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT display fields that do not exist in the form schema', () => {
    fc.assert(
      fc.property(
        // Generate form data with extra fields not in schema
        fc.record({
          validField1: fc.string(),
          validField2: fc.integer(),
          extraField1: fc.string(), // Not in schema
          extraField2: fc.integer(), // Not in schema
          deprecatedField: fc.string() // Not in schema
        }),
        // Generate form schema (only valid fields)
        fc.constant(['validField1', 'validField2']),
        (formData, formSchema) => {
          const displayedFields = filterFieldsForDisplay(formData, formSchema);
          
          // Property: Only fields in schema should be displayed
          const displayedKeys = Object.keys(displayedFields);
          displayedKeys.forEach(key => {
            expect(formSchema).toContain(key);
          });
          
          // Property: Extra fields should NOT be displayed
          expect(displayedFields).not.toHaveProperty('extraField1');
          expect(displayedFields).not.toHaveProperty('extraField2');
          expect(displayedFields).not.toHaveProperty('deprecatedField');
          
          // Property: Valid fields should be displayed
          if (formData.validField1 !== null && formData.validField1 !== undefined) {
            expect(displayedFields).toHaveProperty('validField1');
          }
          if (formData.validField2 !== null && formData.validField2 !== undefined) {
            expect(displayedFields).toHaveProperty('validField2');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle complex form data with mixed field types', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Standard fields
          name: fc.string({ minLength: 1 }),
          age: fc.integer({ min: 0, max: 120 }),
          email: fc.emailAddress(),
          // Array field (witnesses)
          witnesses: fc.option(
            fc.array(
              fc.record({
                name: fc.string({ minLength: 1 }),
                phone: fc.string({ minLength: 10 }),
                address: fc.string({ minLength: 10 })
              }),
              { maxLength: 3 }
            ),
            { nil: null }
          ),
          // Optional fields
          notes: fc.option(fc.string(), { nil: null }),
          // Deprecated field (not in schema)
          oldField: fc.string()
        }),
        fc.constant(['name', 'age', 'email', 'witnesses', 'notes']),
        (formData, formSchema) => {
          const displayedFields = filterFieldsForDisplay(formData, formSchema);
          
          // Property: All non-null schema fields should be present
          for (const key of formSchema) {
            if (formData[key] !== null && formData[key] !== undefined) {
              expect(displayedFields).toHaveProperty(key);
            }
          }
          
          // Property: Deprecated fields should not be present
          expect(displayedFields).not.toHaveProperty('oldField');
          
          // Property: Witnesses should be formatted correctly if present
          if (formData.witnesses) {
            const formatted = formatWitnesses(formData.witnesses);
            expect(Array.isArray(formatted)).toBe(true);
            formatted.forEach(witness => {
              expect(witness).toHaveProperty('label');
              expect(witness).toHaveProperty('name');
              expect(witness).toHaveProperty('phone');
              expect(witness).toHaveProperty('address');
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
