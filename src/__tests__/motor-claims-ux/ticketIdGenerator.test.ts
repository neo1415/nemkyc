/**
 * Property-Based Tests for Ticket ID Generator
 * 
 * Feature: motor-claims-ux-improvements
 * Property 1: Ticket ID Format Validation
 * Property 2: Ticket ID Uniqueness
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  FORM_TYPE_PREFIXES,
  DEFAULT_PREFIX,
  TICKET_ID_PATTERN,
  getFormTypePrefix,
  generateRandomNumber,
  formatTicketId,
  isValidTicketIdFormat,
  generateTicketIdSync,
} from '../../utils/ticketIdGenerator';

describe('Feature: motor-claims-ux-improvements, Property 1: Ticket ID Format Validation', () => {
  /**
   * Property: Ticket ID Format
   * For any form type and generated ticket ID, the ticket ID SHALL match the pattern
   * ^[A-Z]{3}-\d{8}$ (3 uppercase letters, hyphen, 8 digits)
   * 
   * **Validates: Requirements 3.1**
   */
  it('should generate ticket IDs matching the required format pattern', () => {
    const formTypes = Object.keys(FORM_TYPE_PREFIXES);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...formTypes),
        (formType) => {
          const result = generateTicketIdSync(formType);
          
          // Ticket ID should match the pattern: 3 uppercase letters, hyphen, 8 digits
          expect(TICKET_ID_PATTERN.test(result.ticketId)).toBe(true);
          expect(isValidTicketIdFormat(result.ticketId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Prefix Correspondence
   * For any known form type, the prefix SHALL correspond to the correct form type mapping
   * 
   * **Validates: Requirements 3.2**
   */
  it('should use correct prefix for each known form type', () => {
    const formTypes = Object.keys(FORM_TYPE_PREFIXES);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...formTypes),
        (formType) => {
          const result = generateTicketIdSync(formType);
          const expectedPrefix = FORM_TYPE_PREFIXES[formType];
          
          // Prefix should match the expected mapping
          expect(result.prefix).toBe(expectedPrefix);
          expect(result.ticketId.startsWith(expectedPrefix + '-')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Unknown Form Type Handling
   * For any unknown form type, the system SHALL use the default prefix 'GEN'
   * 
   * **Validates: Requirements 3.2**
   */
  it('should use default prefix GEN for unknown form types', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          s => !Object.keys(FORM_TYPE_PREFIXES).includes(s)
        ),
        (unknownFormType) => {
          const result = generateTicketIdSync(unknownFormType);
          
          // Should use default prefix
          expect(result.prefix).toBe(DEFAULT_PREFIX);
          expect(result.ticketId.startsWith(DEFAULT_PREFIX + '-')).toBe(true);
          
          // Should still match the format pattern
          expect(isValidTicketIdFormat(result.ticketId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Number Component
   * For any generated ticket ID, the number component SHALL be exactly 8 digits
   * 
   * **Validates: Requirements 3.1**
   */
  it('should generate 8-digit number component', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const number = generateRandomNumber();
        
        // Number should be exactly 8 digits
        expect(number.length).toBe(8);
        expect(/^\d{8}$/.test(number)).toBe(true);
        
        // Number should be in valid range (10000000 to 99999999)
        const numValue = parseInt(number, 10);
        expect(numValue).toBeGreaterThanOrEqual(10000000);
        expect(numValue).toBeLessThanOrEqual(99999999);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Ticket ID Structure
   * For any generated ticket ID, it SHALL consist of prefix, hyphen, and number
   * 
   * **Validates: Requirements 3.1**
   */
  it('should generate ticket IDs with correct structure', () => {
    const formTypes = Object.keys(FORM_TYPE_PREFIXES);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...formTypes),
        (formType) => {
          const result = generateTicketIdSync(formType);
          
          // Ticket ID should be composed of prefix + hyphen + number
          const expectedTicketId = formatTicketId(result.prefix, result.number);
          expect(result.ticketId).toBe(expectedTicketId);
          
          // Parts should be extractable
          const parts = result.ticketId.split('-');
          expect(parts.length).toBe(2);
          expect(parts[0]).toBe(result.prefix);
          expect(parts[1]).toBe(result.number);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Prefix Format
   * For any prefix, it SHALL be exactly 3 uppercase letters
   * 
   * **Validates: Requirements 3.1**
   */
  it('should have prefixes that are exactly 3 uppercase letters', () => {
    const allPrefixes = [...Object.values(FORM_TYPE_PREFIXES), DEFAULT_PREFIX];
    
    allPrefixes.forEach(prefix => {
      expect(prefix.length).toBe(3);
      expect(/^[A-Z]{3}$/.test(prefix)).toBe(true);
    });
  });
});

describe('Feature: motor-claims-ux-improvements, Property 2: Ticket ID Uniqueness', () => {
  /**
   * Property: Uniqueness Within Batch
   * For any set of generated ticket IDs within a test run, there SHALL be no duplicate values
   * 
   * **Validates: Requirements 3.3**
   */
  it('should generate unique ticket IDs across multiple generations', () => {
    const ticketIds = new Set<string>();
    const generationCount = 1000;
    const formTypes = Object.keys(FORM_TYPE_PREFIXES);
    
    for (let i = 0; i < generationCount; i++) {
      const formType = formTypes[i % formTypes.length];
      const result = generateTicketIdSync(formType);
      ticketIds.add(result.ticketId);
    }
    
    // All generated ticket IDs should be unique
    expect(ticketIds.size).toBe(generationCount);
  });

  /**
   * Property: Uniqueness Per Form Type
   * For any single form type, multiple generations SHALL produce unique ticket IDs
   * 
   * **Validates: Requirements 3.3**
   */
  it('should generate unique ticket IDs for the same form type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(FORM_TYPE_PREFIXES)),
        (formType) => {
          const ticketIds = new Set<string>();
          const generationCount = 50;
          
          for (let i = 0; i < generationCount; i++) {
            const result = generateTicketIdSync(formType);
            ticketIds.add(result.ticketId);
          }
          
          // All generated ticket IDs should be unique
          expect(ticketIds.size).toBe(generationCount);
        }
      ),
      { numRuns: 20 } // 20 form types * 50 generations = 1000 total
    );
  });

  /**
   * Property: Random Number Distribution
   * For any batch of generated numbers, they should show reasonable distribution
   * (not all the same, not sequential)
   * 
   * **Validates: Requirements 3.3**
   */
  it('should generate well-distributed random numbers', () => {
    const numbers: number[] = [];
    const generationCount = 100;
    
    for (let i = 0; i < generationCount; i++) {
      const numStr = generateRandomNumber();
      numbers.push(parseInt(numStr, 10));
    }
    
    // Check that numbers are not sequential
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    let sequentialCount = 0;
    for (let i = 1; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] - sortedNumbers[i - 1] === 1) {
        sequentialCount++;
      }
    }
    
    // Less than 5% should be sequential (allowing for some coincidence)
    expect(sequentialCount).toBeLessThan(generationCount * 0.05);
    
    // All numbers should be unique
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(generationCount);
  });
});

describe('Feature: motor-claims-ux-improvements, Ticket ID Validation', () => {
  /**
   * Property: Valid Format Detection
   * For any valid ticket ID format, isValidTicketIdFormat SHALL return true
   */
  it('should correctly validate valid ticket ID formats', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z]{3}$/),
        fc.stringMatching(/^\d{8}$/),
        (prefix, number) => {
          const ticketId = `${prefix}-${number}`;
          expect(isValidTicketIdFormat(ticketId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid Format Detection
   * For any invalid ticket ID format, isValidTicketIdFormat SHALL return false
   */
  it('should correctly reject invalid ticket ID formats', () => {
    // Test various invalid formats
    const invalidFormats = [
      'MOT12345678',      // Missing hyphen
      'MOT-1234567',      // Only 7 digits
      'MOT-123456789',    // 9 digits
      'MO-12345678',      // Only 2 letters
      'MOTO-12345678',    // 4 letters
      'mot-12345678',     // Lowercase letters
      'MOT-1234567a',     // Letter in number
      '-12345678',        // Missing prefix
      'MOT-',             // Missing number
      '',                 // Empty string
      'MOT--12345678',    // Double hyphen
    ];
    
    invalidFormats.forEach(format => {
      expect(isValidTicketIdFormat(format)).toBe(false);
    });
  });

  /**
   * Property: getFormTypePrefix returns valid prefix
   * For any input, getFormTypePrefix SHALL return a valid 3-letter uppercase prefix
   */
  it('should always return a valid prefix for any input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const prefix = getFormTypePrefix(input);
          
          // Prefix should always be 3 uppercase letters
          expect(prefix.length).toBe(3);
          expect(/^[A-Z]{3}$/.test(prefix)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
