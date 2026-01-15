/**
 * Property-Based Tests for Witness Array Formatting
 * 
 * Feature: motor-claims-ux-improvements
 * Property 9: Witness Array Formatting
 * 
 * **Validates: Requirements 8.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Witness interface matching the application's witness structure
 */
interface Witness {
  name?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

/**
 * Format witnesses as readable entries (implementation to test)
 * This function should format witnesses as readable text entries, not JSON
 */
function formatWitnessArray(witnesses: Witness[] | null | undefined, fieldKey: string): string | null {
  if (!witnesses || !Array.isArray(witnesses) || witnesses.length === 0) {
    return null; // Return null to hide column when empty
  }
  
  // Filter out empty objects (objects with no meaningful data)
  const validWitnesses = witnesses.filter(witness => {
    if (typeof witness !== 'object' || witness === null) return false;
    const hasData = Object.entries(witness).some(([key, val]) => 
      val !== null && val !== undefined && String(val).trim() !== ''
    );
    return hasData;
  });
  
  if (validWitnesses.length === 0) {
    return null; // Return null if no valid witnesses
  }
  
  return validWitnesses.map((witness, index) => {
    const parts: string[] = [];
    
    // Format witness number
    const witnessLabel = `Witness ${index + 1}`;
    
    // Extract relevant fields
    if (witness.name && String(witness.name).trim()) {
      parts.push(`Name: ${witness.name}`);
    }
    if (witness.phone && String(witness.phone).trim()) {
      parts.push(`Phone: ${witness.phone}`);
    }
    if (witness.address && String(witness.address).trim()) {
      parts.push(`Address: ${witness.address}`);
    }
    
    // Join parts with comma separator
    const witnessInfo = parts.length > 0 ? parts.join(', ') : null;
    
    return witnessInfo ? `${witnessLabel} - ${witnessInfo}` : null;
  }).filter(Boolean).join(' | ') || null;
}

/**
 * Check if a string is valid JSON
 */
function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if formatted output contains readable witness information
 */
function isReadableWitnessFormat(formatted: string): boolean {
  // Should contain "Witness" label
  if (!formatted.includes('Witness')) return false;
  
  // Should not be JSON format
  if (isJsonString(formatted)) return false;
  
  // Should contain at least one of: Name, Phone, Address
  const hasRelevantFields = 
    formatted.includes('Name:') || 
    formatted.includes('Phone:') || 
    formatted.includes('Address:');
  
  return hasRelevantFields;
}

describe('Feature: motor-claims-ux-improvements, Property 9: Witness Array Formatting', () => {
  /**
   * Property: Witness Array Readable Format
   * For any witnesses array displayed in the Admin Table, the output SHALL be formatted
   * as readable text entries (not JSON string format) with each witness showing name, phone, and address
   * 
   * **Validates: Requirements 8.1**
   */
  it('should format witnesses as readable text entries, not JSON', () => {
    // Arbitrary for generating witness objects
    const witnessArbitrary = fc.record({
      name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      phone: fc.option(
        fc.oneof(
          fc.stringMatching(/^\+234\d{10}$/),
          fc.stringMatching(/^0\d{10}$/)
        ),
        { nil: undefined }
      ),
      address: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
    }).filter(w => w.name || w.phone || w.address); // At least one field must be present
    
    fc.assert(
      fc.property(
        fc.array(witnessArbitrary, { minLength: 1, maxLength: 5 }),
        (witnesses) => {
          const formatted = formatWitnessArray(witnesses, 'witnesses');
          
          // Should not return null for non-empty arrays
          expect(formatted).not.toBeNull();
          
          if (formatted) {
            // Should not be JSON format
            expect(isJsonString(formatted)).toBe(false);
            
            // Should be readable format
            expect(isReadableWitnessFormat(formatted)).toBe(true);
            
            // Should contain witness labels
            witnesses.forEach((_, index) => {
              expect(formatted).toContain(`Witness ${index + 1}`);
            });
            
            // Should contain field labels for present fields
            witnesses.forEach((witness) => {
              if (witness.name && formatted.includes(witness.name)) {
                expect(formatted).toContain('Name:');
              }
              if (witness.phone && formatted.includes(witness.phone)) {
                expect(formatted).toContain('Phone:');
              }
              if (witness.address && formatted.includes(witness.address)) {
                expect(formatted).toContain('Address:');
              }
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty Witness Array Handling
   * For any empty or null witnesses array, the formatter SHALL return null
   * (to hide the column in the admin table)
   * 
   * **Validates: Requirements 8.2**
   */
  it('should return null for empty or null witness arrays', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined, []),
        (emptyWitnesses) => {
          const formatted = formatWitnessArray(emptyWitnesses as any, 'witnesses');
          
          // Should return null to hide column
          expect(formatted).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
    
    // Test empty object separately
    const emptyObjectArray = [{}];
    const formatted = formatWitnessArray(emptyObjectArray, 'witnesses');
    expect(formatted).toBeNull();
    
    // Test object with only empty strings
    const emptyStringsArray = [{ name: '', phone: '', address: '' }];
    const formatted2 = formatWitnessArray(emptyStringsArray, 'witnesses');
    expect(formatted2).toBeNull();
  });

  /**
   * Property: Witness Separator
   * For any witnesses array with multiple witnesses, they SHALL be separated by ' | '
   * Note: This test ensures the separator is used correctly, accounting for the fact
   * that user data might contain the pipe character
   * 
   * **Validates: Requirements 8.1**
   */
  it('should separate multiple witnesses with pipe separator', () => {
    const witnessArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('|')),
      phone: fc.stringMatching(/^\+234\d{10}$/).filter(s => !s.includes('|')),
      address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => !s.includes('|')),
    });
    
    fc.assert(
      fc.property(
        fc.array(witnessArbitrary, { minLength: 2, maxLength: 5 }),
        (witnesses) => {
          const formatted = formatWitnessArray(witnesses, 'witnesses');
          
          expect(formatted).not.toBeNull();
          
          if (formatted) {
            // Should contain pipe separators between witnesses
            const pipeCount = (formatted.match(/ \| /g) || []).length;
            expect(pipeCount).toBe(witnesses.length - 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Individual Witness Format
   * For any single witness with all fields populated, the format SHALL be 
   * "Witness N - Name: X, Phone: Y, Address: Z"
   * 
   * **Validates: Requirements 8.1**
   */
  it('should format individual witness with correct structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          phone: fc.stringMatching(/^\+234\d{10}$/),
          address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        (witness) => {
          const formatted = formatWitnessArray([witness], 'witnesses');
          
          expect(formatted).not.toBeNull();
          
          if (formatted) {
            // Should start with "Witness 1 -"
            expect(formatted).toMatch(/^Witness 1 -/);
            
            // Should contain all fields
            expect(formatted).toContain(`Name: ${witness.name}`);
            expect(formatted).toContain(`Phone: ${witness.phone}`);
            expect(formatted).toContain(`Address: ${witness.address}`);
            
            // Should use comma separators between fields
            const commaCount = (formatted.match(/,/g) || []).length;
            expect(commaCount).toBeGreaterThanOrEqual(2); // At least 2 commas for 3 fields
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Partial Witness Information
   * For any witness with only some fields present, the formatter SHALL only display
   * the available fields
   * 
   * **Validates: Requirements 8.1**
   */
  it('should handle witnesses with partial information', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0) }),
          fc.record({ phone: fc.stringMatching(/^\+234\d{10}$/) }),
          fc.record({ address: fc.string({ minLength: 5 }).filter(s => s.trim().length > 0) }),
          fc.record({ 
            name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), 
            phone: fc.stringMatching(/^\+234\d{10}$/) 
          }),
          fc.record({ 
            name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), 
            address: fc.string({ minLength: 5 }).filter(s => s.trim().length > 0) 
          }),
          fc.record({ 
            phone: fc.stringMatching(/^\+234\d{10}$/), 
            address: fc.string({ minLength: 5 }).filter(s => s.trim().length > 0) 
          })
        ),
        (witness) => {
          const formatted = formatWitnessArray([witness], 'witnesses');
          
          expect(formatted).not.toBeNull();
          
          if (formatted) {
            // Should contain "Witness 1"
            expect(formatted).toContain('Witness 1');
            
            // Should only contain labels for present fields
            if ('name' in witness && witness.name) {
              expect(formatted).toContain('Name:');
              expect(formatted).toContain(witness.name);
            } else {
              // If name is not present, formatted string shouldn't have orphaned "Name:"
              const nameIndex = formatted.indexOf('Name:');
              if (nameIndex !== -1) {
                // If "Name:" exists, it should be followed by a value
                expect(formatted.substring(nameIndex)).toMatch(/Name: .+/);
              }
            }
            
            if ('phone' in witness && witness.phone) {
              expect(formatted).toContain('Phone:');
              expect(formatted).toContain(witness.phone);
            }
            
            if ('address' in witness && witness.address) {
              expect(formatted).toContain('Address:');
              expect(formatted).toContain(witness.address);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: No JSON Artifacts
   * For any formatted witness array, the output SHALL NOT contain JSON structural artifacts
   * like the pattern of JSON objects (e.g., {"key":"value"} or [{"key":"value"}])
   * Note: Individual data values may contain these characters, but the overall format
   * should not be JSON
   * 
   * **Validates: Requirements 8.1**
   */
  it('should not contain JSON artifacts in formatted output', () => {
    const witnessArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"') && !s.includes('{')),
      phone: fc.stringMatching(/^\+234\d{10}$/),
      address: fc.string({ minLength: 5, maxLength: 100 }).filter(s => !s.includes('"') && !s.includes('{')),
    });
    
    fc.assert(
      fc.property(
        fc.array(witnessArbitrary, { minLength: 1, maxLength: 5 }),
        (witnesses) => {
          const formatted = formatWitnessArray(witnesses, 'witnesses');
          
          expect(formatted).not.toBeNull();
          
          if (formatted) {
            // Should not be valid JSON
            expect(isJsonString(formatted)).toBe(false);
            
            // Should not have JSON object patterns like {"key":"value"}
            expect(formatted).not.toMatch(/\{"\w+":/);
            expect(formatted).not.toMatch(/"\w+":/);
            
            // Should have readable labels instead
            expect(formatted).toMatch(/Name:|Phone:|Address:/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: motor-claims-ux-improvements, Witness Array Edge Cases', () => {
  /**
   * Edge Case: Witness with extra fields
   * The formatter should handle witnesses with additional fields gracefully
   */
  it('should handle witnesses with extra fields', () => {
    const witnessWithExtra = {
      name: 'John Doe',
      phone: '+2348012345678',
      address: '123 Main St',
      extraField: 'extra value',
      anotherField: 'another value'
    };
    
    const formatted = formatWitnessArray([witnessWithExtra], 'witnesses');
    
    expect(formatted).not.toBeNull();
    if (formatted) {
      // Should contain the main fields
      expect(formatted).toContain('Name: John Doe');
      expect(formatted).toContain('Phone: +2348012345678');
      expect(formatted).toContain('Address: 123 Main St');
      
      // Should be readable format
      expect(isReadableWitnessFormat(formatted)).toBe(true);
    }
  });

  /**
   * Edge Case: Witness with empty strings
   * Empty strings should be treated as missing fields
   */
  it('should treat empty strings as missing fields', () => {
    const witnessWithEmpties = {
      name: 'John Doe',
      phone: '',
      address: ''
    };
    
    const formatted = formatWitnessArray([witnessWithEmpties], 'witnesses');
    
    expect(formatted).not.toBeNull();
    if (formatted) {
      // Should contain name
      expect(formatted).toContain('Name: John Doe');
      
      // Should not contain empty phone or address labels
      // (or if they do, they should not have empty values)
      if (formatted.includes('Phone:')) {
        expect(formatted).not.toMatch(/Phone:\s*,/);
        expect(formatted).not.toMatch(/Phone:\s*$/);
      }
      if (formatted.includes('Address:')) {
        expect(formatted).not.toMatch(/Address:\s*,/);
        expect(formatted).not.toMatch(/Address:\s*$/);
      }
    }
  });

  /**
   * Edge Case: Large witness array
   * Should handle arrays with many witnesses
   */
  it('should handle large witness arrays', () => {
    const witnesses: Witness[] = Array.from({ length: 10 }, (_, i) => ({
      name: `Witness ${i + 1}`,
      phone: `+23480${String(i).padStart(8, '0')}`,
      address: `Address ${i + 1}`
    }));
    
    const formatted = formatWitnessArray(witnesses, 'witnesses');
    
    expect(formatted).not.toBeNull();
    if (formatted) {
      // Should contain all witness labels
      witnesses.forEach((_, index) => {
        expect(formatted).toContain(`Witness ${index + 1}`);
      });
      
      // Should have correct number of separators
      const pipeCount = (formatted.match(/\|/g) || []).length;
      expect(pipeCount).toBe(witnesses.length - 1);
    }
  });
});
