/**
 * Property-Based Tests for File Parser
 * 
 * Feature: identity-remediation
 * Property 1: Column Preservation
 * Property 2: Email Auto-Detection
 * 
 * Tests that the file parser correctly:
 * - Preserves all original column names in their exact order
 * - Auto-detects email columns by finding columns containing "email" (case-insensitive)
 * 
 * **Validates: Requirements 1.2, 1.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectEmailColumn } from '../../utils/fileParser';

describe('Feature: identity-remediation, Property 1: Column Preservation', () => {
  /**
   * Property: Column Order Preservation
   * For any array of column names, detectEmailColumn should not modify the original array
   */
  it('should not modify the original columns array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
        (columns) => {
          const originalColumns = [...columns];
          detectEmailColumn(columns);
          
          // Original array should be unchanged
          expect(columns).toEqual(originalColumns);
          expect(columns.length).toBe(originalColumns.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Column Names Preserved Exactly
   * For any column names including special characters, the detection should work
   * without altering the column names
   */
  it('should preserve column names with special characters', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }),
          { minLength: 1, maxLength: 15 }
        ),
        (columns) => {
          const originalColumns = [...columns];
          detectEmailColumn(columns);
          
          // Each column name should be exactly preserved
          for (let i = 0; i < columns.length; i++) {
            expect(columns[i]).toBe(originalColumns[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty Array Handling
   * For an empty columns array, detectEmailColumn should return null
   */
  it('should return null for empty columns array', () => {
    const result = detectEmailColumn([]);
    expect(result).toBeNull();
  });
});

describe('Feature: identity-remediation, Property 2: Email Auto-Detection', () => {
  /**
   * Property: Exact "email" Match Detection (Case-Insensitive)
   * For any columns array containing a column that is exactly "email" (any case),
   * that column should be detected
   */
  it('should detect exact "email" column regardless of case', () => {
    const emailVariants = ['email', 'Email', 'EMAIL', 'eMail', 'eMAIL', 'EmAiL'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...emailVariants),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.toLowerCase().includes('email')), { minLength: 0, maxLength: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (emailColumn, otherColumns, insertPosition) => {
          // Insert email column at a random position
          const columns = [...otherColumns];
          const pos = Math.min(insertPosition, columns.length);
          columns.splice(pos, 0, emailColumn);
          
          const detected = detectEmailColumn(columns);
          
          // Should detect the email column
          expect(detected).toBe(emailColumn);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Columns Starting/Ending with "email" Detection
   * For any column starting or ending with "email" (case-insensitive),
   * it should be detected if no exact match exists
   */
  it('should detect columns starting or ending with "email"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('email_address', 'Email_Address', 'EMAIL_ID', 'user_email', 'User_Email', 'customerEmail', 'primary_email'),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.toLowerCase().includes('email')), { minLength: 0, maxLength: 10 }),
        (emailColumn, otherColumns) => {
          const columns = [emailColumn, ...otherColumns];
          
          const detected = detectEmailColumn(columns);
          
          // Should detect the email column
          expect(detected).toBe(emailColumn);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Columns Containing "email" Detection
   * For any column containing "email" (case-insensitive),
   * it should be detected if no exact or prefix/suffix match exists
   */
  it('should detect columns containing "email" anywhere', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('contact_email_address', 'myEmailField', 'the_EMAIL_column', 'xemailx'),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.toLowerCase().includes('email')), { minLength: 0, maxLength: 10 }),
        (emailColumn, otherColumns) => {
          const columns = [emailColumn, ...otherColumns];
          
          const detected = detectEmailColumn(columns);
          
          // Should detect the email column
          expect(detected).toBe(emailColumn);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: First Email Column Detection (Left to Right)
   * For any columns array with multiple email-containing columns,
   * the first one (leftmost) should be detected
   */
  it('should detect the first email column when multiple exist', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('email', 'Email', 'EMAIL'),
        fc.constantFrom('secondary_email', 'backup_email', 'other_email'),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.toLowerCase().includes('email')), { minLength: 0, maxLength: 5 }),
        (firstEmail, secondEmail, otherColumns) => {
          // First email column should be detected
          const columns = [firstEmail, ...otherColumns, secondEmail];
          
          const detected = detectEmailColumn(columns);
          
          expect(detected).toBe(firstEmail);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Exact Match Priority
   * For any columns array with both exact "email" and partial matches,
   * the exact match should be prioritized
   */
  it('should prioritize exact "email" match over partial matches', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('email', 'Email', 'EMAIL'),
        fc.constantFrom('email_address', 'user_email', 'contact_email'),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.toLowerCase().includes('email')), { minLength: 0, maxLength: 5 }),
        (exactEmail, partialEmail, otherColumns) => {
          // Put partial match first, exact match later
          const columns = [partialEmail, ...otherColumns, exactEmail];
          
          const detected = detectEmailColumn(columns);
          
          // Should detect the exact match, not the partial
          expect(detected).toBe(exactEmail);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: No Email Column Returns Null
   * For any columns array without any column containing "email",
   * detectEmailColumn should return null
   */
  it('should return null when no email column exists', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.toLowerCase().includes('email')),
          { minLength: 1, maxLength: 15 }
        ),
        (columns) => {
          const detected = detectEmailColumn(columns);
          
          expect(detected).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Detected Column Exists in Original Array
   * For any columns array, if a column is detected, it must exist in the original array
   */
  it('should only return columns that exist in the input array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 15 }),
        (columns) => {
          const detected = detectEmailColumn(columns);
          
          if (detected !== null) {
            expect(columns).toContain(detected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Detection is Deterministic
   * For any columns array, calling detectEmailColumn multiple times
   * should always return the same result
   */
  it('should return consistent results for the same input', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 15 }),
        (columns) => {
          const result1 = detectEmailColumn(columns);
          const result2 = detectEmailColumn(columns);
          const result3 = detectEmailColumn(columns);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Start/End Priority Over Contains
   * For columns where one starts/ends with "email" and another just contains it,
   * the start/end match should be prioritized
   */
  it('should prioritize columns starting/ending with "email" over those just containing it', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('email_address', 'user_email', 'emailField'),
        fc.constantFrom('myemailcontact', 'xemailx', 'theemailfield'),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.toLowerCase().includes('email')), { minLength: 0, maxLength: 5 }),
        (startEndEmail, containsEmail, otherColumns) => {
          // Put contains match first, start/end match later
          const columns = [containsEmail, ...otherColumns, startEndEmail];
          
          const detected = detectEmailColumn(columns);
          
          // Should detect the start/end match, not the contains match
          expect(detected).toBe(startEndEmail);
        }
      ),
      { numRuns: 100 }
    );
  });
});


import { detectFileType, detectNameColumns, buildDisplayName, isEmptyValue, getCleanValue } from '../../utils/fileParser';

describe('Feature: identity-remediation, Property 3: File Type Detection (Corporate vs Individual)', () => {
  /**
   * Property: Corporate File Detection
   * Files with director columns, company name, RC number should be detected as corporate
   */
  it('should detect corporate files by director columns', () => {
    const corporateColumns = [
      ['Director 1', 'Director 2', 'Company Name', 'Email'],
      ['director_name', 'director_1', 'company', 'email'],
      ['DIRECTOR', 'RC Number', 'Business Name', 'contact_email'],
    ];
    
    for (const columns of corporateColumns) {
      const result = detectFileType(columns);
      expect(result).toBe('corporate');
    }
  });

  it('should detect corporate files by company name columns', () => {
    const corporateColumns = [
      ['Company Name', 'Registration Number', 'Email'],
      ['company_name', 'cac_number', 'email'],
      ['CompanyName', 'RC_Number', 'contact'],
    ];
    
    for (const columns of corporateColumns) {
      const result = detectFileType(columns);
      expect(result).toBe('corporate');
    }
  });

  /**
   * Property: Individual File Detection
   * Files with firstName, lastName, middleName should be detected as individual
   */
  it('should detect individual files by first/last name columns', () => {
    const individualColumns = [
      ['First Name', 'Last Name', 'Email', 'Policy Number'],
      ['firstName', 'lastName', 'middleName', 'email'],
      ['first_name', 'surname', 'other_name', 'contact_email'],
      ['FIRST', 'LAST', 'MIDDLE', 'EMAIL'],
    ];
    
    for (const columns of individualColumns) {
      const result = detectFileType(columns);
      expect(result).toBe('individual');
    }
  });

  /**
   * Property: Unknown File Type
   * Files without clear indicators should return 'unknown'
   */
  it('should return unknown for ambiguous files', () => {
    const ambiguousColumns = [
      ['Name', 'Email', 'Phone'],
      ['Insured', 'Policy', 'Amount'],
      ['ID', 'Value', 'Date'],
    ];
    
    for (const columns of ambiguousColumns) {
      const result = detectFileType(columns);
      expect(result).toBe('unknown');
    }
  });

  /**
   * Property: Corporate Score Beats Individual Score
   * When both indicators exist, the higher score wins
   */
  it('should prioritize corporate when corporate indicators are stronger', () => {
    // Director + Company Name = 6 points corporate
    // vs just "name" which doesn't score for individual
    const columns = ['Director 1', 'Company Name', 'Name', 'Email'];
    const result = detectFileType(columns);
    expect(result).toBe('corporate');
  });

  it('should prioritize individual when individual indicators are stronger', () => {
    // First Name + Last Name + Middle Name = 8 points individual
    // vs just "business" = 1 point corporate
    const columns = ['First Name', 'Last Name', 'Middle Name', 'Business Type', 'Email'];
    const result = detectFileType(columns);
    expect(result).toBe('individual');
  });
});

describe('Feature: identity-remediation, Property 4: Name Column Detection by File Type', () => {
  /**
   * Property: Corporate files should detect companyName
   */
  it('should detect companyName for corporate files', () => {
    const columns = ['Director 1', 'Company Name', 'Email', 'RC Number'];
    const fileType = detectFileType(columns);
    const nameColumns = detectNameColumns(columns, fileType);
    
    expect(fileType).toBe('corporate');
    expect(nameColumns.companyName).toBe('Company Name');
    expect(nameColumns.firstName).toBeUndefined();
    expect(nameColumns.lastName).toBeUndefined();
  });

  it('should use insured as companyName for corporate files', () => {
    const columns = ['Director 1', 'Insured', 'Email', 'RC Number'];
    const fileType = detectFileType(columns);
    const nameColumns = detectNameColumns(columns, fileType);
    
    expect(fileType).toBe('corporate');
    expect(nameColumns.companyName).toBe('Insured');
  });

  /**
   * Property: Individual files should detect firstName/lastName
   */
  it('should detect firstName/lastName for individual files', () => {
    const columns = ['First Name', 'Middle Name', 'Last Name', 'Email', 'Policy'];
    const fileType = detectFileType(columns);
    const nameColumns = detectNameColumns(columns, fileType);
    
    expect(fileType).toBe('individual');
    expect(nameColumns.firstName).toBe('First Name');
    expect(nameColumns.middleName).toBe('Middle Name');
    expect(nameColumns.lastName).toBe('Last Name');
    expect(nameColumns.companyName).toBeUndefined();
  });

  /**
   * Property: Unknown files should fall back to individual detection
   */
  it('should detect name columns for unknown file types', () => {
    const columns = ['Name', 'Email', 'Phone'];
    const fileType = detectFileType(columns);
    const nameColumns = detectNameColumns(columns, fileType);
    
    expect(fileType).toBe('unknown');
    expect(nameColumns.fullName).toBe('Name');
  });
});

describe('Feature: identity-remediation, Property 5: N/A and Empty Value Handling', () => {
  /**
   * Property: N/A values should be treated as empty
   */
  it('should treat N/A as empty', () => {
    expect(isEmptyValue('N/A')).toBe(true);
    expect(isEmptyValue('n/a')).toBe(true);
    expect(isEmptyValue('NA')).toBe(true);
    expect(isEmptyValue('na')).toBe(true);
    expect(isEmptyValue('-')).toBe(true);
    expect(isEmptyValue('nil')).toBe(true);
    expect(isEmptyValue('none')).toBe(true);
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
  });

  it('should not treat actual values as empty', () => {
    expect(isEmptyValue('John')).toBe(false);
    expect(isEmptyValue('Doe')).toBe(false);
    expect(isEmptyValue('ABC Company')).toBe(false);
    expect(isEmptyValue('0')).toBe(false);
  });

  /**
   * Property: getCleanValue should return null for empty values
   */
  it('should return null for empty values', () => {
    expect(getCleanValue('N/A')).toBeNull();
    expect(getCleanValue('n/a')).toBeNull();
    expect(getCleanValue('')).toBeNull();
    expect(getCleanValue(null)).toBeNull();
  });

  it('should return trimmed value for non-empty values', () => {
    expect(getCleanValue('  John  ')).toBe('John');
    expect(getCleanValue('Doe')).toBe('Doe');
  });

  /**
   * Property: buildDisplayName should skip N/A middle names
   */
  it('should skip N/A middle names when building display name', () => {
    const nameColumns = {
      firstName: 'First Name',
      middleName: 'Middle Name',
      lastName: 'Last Name'
    };
    
    // With N/A middle name
    const entry1 = { 'First Name': 'John', 'Middle Name': 'N/A', 'Last Name': 'Doe' };
    expect(buildDisplayName(entry1, nameColumns)).toBe('John Doe');
    
    // With actual middle name
    const entry2 = { 'First Name': 'John', 'Middle Name': 'Michael', 'Last Name': 'Doe' };
    expect(buildDisplayName(entry2, nameColumns)).toBe('John Michael Doe');
    
    // With empty middle name
    const entry3 = { 'First Name': 'John', 'Middle Name': '', 'Last Name': 'Doe' };
    expect(buildDisplayName(entry3, nameColumns)).toBe('John Doe');
  });

  /**
   * Property: buildDisplayName should work with companyName for corporate
   */
  it('should use companyName for corporate entries', () => {
    const nameColumns = {
      companyName: 'Company Name'
    };
    
    const entry = { 'Company Name': 'ABC Corporation Ltd' };
    expect(buildDisplayName(entry, nameColumns)).toBe('ABC Corporation Ltd');
  });

  it('should return undefined when no name is available', () => {
    const nameColumns = {
      firstName: 'First Name',
      lastName: 'Last Name'
    };
    
    const entry = { 'First Name': 'N/A', 'Last Name': '' };
    expect(buildDisplayName(entry, nameColumns)).toBeUndefined();
  });
});
