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

describe('Feature: identity-remediation, Property 16: Template Validation - Individual', () => {
  /**
   * Property: Individual Template with All Required Columns
   * For any file with all 7 required Individual template columns,
   * validation must pass
   * 
   * **Validates: Requirements 15.1, 15.5, 15.8**
   */
  it('should validate successfully when all required Individual columns are present', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender'],
          ['Title', 'First Name', 'Last Name', 'Phone Number', 'Email', 'Address', 'Gender'],
          ['TITLE', 'FIRST NAME', 'LAST NAME', 'PHONE NUMBER', 'EMAIL', 'ADDRESS', 'GENDER'],
          ['title', 'firstName', 'lastName', 'phoneNumber', 'email', 'address', 'gender'],
          ['Title', 'First_Name', 'Last_Name', 'Phone_Number', 'Email', 'Address', 'Gender']
        ),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
        (requiredColumns, optionalColumns) => {
          const columns = [...requiredColumns, ...optionalColumns];
          const result = validateIndividualTemplate(columns);
          
          expect(result.valid).toBe(true);
          expect(result.detectedType).toBe('individual');
          expect(result.missingColumns).toHaveLength(0);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Individual Template with Missing Required Columns
   * For any file missing one or more required Individual columns,
   * validation must fail and list the missing columns
   * 
   * **Validates: Requirements 15.8, 15.9**
   */
  it('should fail validation when required Individual columns are missing', () => {
    const requiredColumns = ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender'];
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }),
        fc.shuffledSubarray(requiredColumns, { minLength: 0, maxLength: 6 }),
        (numToRemove, columnsToKeep) => {
          // Ensure we're actually removing at least one column
          if (columnsToKeep.length === requiredColumns.length) {
            columnsToKeep = columnsToKeep.slice(0, -1);
          }
          
          const result = validateIndividualTemplate(columnsToKeep);
          
          expect(result.valid).toBe(false);
          expect(result.detectedType).toBe('individual');
          expect(result.missingColumns.length).toBeGreaterThan(0);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Verify that all missing columns are actually required
          for (const missing of result.missingColumns) {
            expect(requiredColumns).toContain(missing);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Individual Template Column Name Variations
   * For any valid column name variations (spaces, underscores, case),
   * validation should recognize them as matching
   * 
   * **Validates: Requirements 15.5**
   */
  it('should recognize column name variations for Individual template', () => {
    const variations = [
      ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender'],
      ['Title', 'First Name', 'Last Name', 'Phone Number', 'Email', 'Address', 'Gender'],
      ['TITLE', 'FIRST_NAME', 'LAST_NAME', 'PHONE_NUMBER', 'EMAIL', 'ADDRESS', 'GENDER'],
      ['title', 'firstName', 'lastName', 'phoneNumber', 'email', 'address', 'gender'],
      ['Title', 'First-Name', 'Last-Name', 'Phone-Number', 'Email', 'Address', 'Gender']
    ];
    
    for (const columns of variations) {
      const result = validateIndividualTemplate(columns);
      
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('individual');
      expect(result.missingColumns).toHaveLength(0);
    }
  });

  /**
   * Property: Individual Template with Optional Columns
   * For any file with all required columns plus optional columns,
   * validation must pass
   * 
   * **Validates: Requirements 15.1, 15.2**
   */
  it('should validate successfully with optional Individual columns', () => {
    const requiredColumns = ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender'];
    const optionalColumns = ['date of birth', 'occupation', 'nationality'];
    
    fc.assert(
      fc.property(
        fc.shuffledSubarray(optionalColumns, { minLength: 0, maxLength: 3 }),
        (selectedOptional) => {
          const columns = [...requiredColumns, ...selectedOptional];
          const result = validateIndividualTemplate(columns);
          
          expect(result.valid).toBe(true);
          expect(result.detectedType).toBe('individual');
          expect(result.missingColumns).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: identity-remediation, Property 17: Template Validation - Corporate', () => {
  /**
   * Property: Corporate Template with All Required Columns
   * For any file with all 5 required Corporate template columns,
   * validation must pass
   * 
   * **Validates: Requirements 15.3, 15.6, 15.8**
   */
  it('should validate successfully when all required Corporate columns are present', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ['company name', 'company address', 'email address', 'company type', 'phone number'],
          ['Company Name', 'Company Address', 'Email Address', 'Company Type', 'Phone Number'],
          ['COMPANY NAME', 'COMPANY ADDRESS', 'EMAIL ADDRESS', 'COMPANY TYPE', 'PHONE NUMBER'],
          ['companyName', 'companyAddress', 'emailAddress', 'companyType', 'phoneNumber'],
          ['Company_Name', 'Company_Address', 'Email_Address', 'Company_Type', 'Phone_Number']
        ),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
        (requiredColumns, optionalColumns) => {
          const columns = [...requiredColumns, ...optionalColumns];
          const result = validateCorporateTemplate(columns);
          
          expect(result.valid).toBe(true);
          expect(result.detectedType).toBe('corporate');
          expect(result.missingColumns).toHaveLength(0);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Corporate Template with Missing Required Columns
   * For any file missing one or more required Corporate columns,
   * validation must fail and list the missing columns
   * 
   * **Validates: Requirements 15.8, 15.9**
   */
  it('should fail validation when required Corporate columns are missing', () => {
    const requiredColumns = ['company name', 'company address', 'email address', 'company type', 'phone number'];
    
    fc.assert(
      fc.property(
        fc.shuffledSubarray(requiredColumns, { minLength: 0, maxLength: 4 }),
        (columnsToKeep) => {
          // Ensure we're actually removing at least one column
          if (columnsToKeep.length === requiredColumns.length) {
            columnsToKeep = columnsToKeep.slice(0, -1);
          }
          
          const result = validateCorporateTemplate(columnsToKeep);
          
          expect(result.valid).toBe(false);
          expect(result.detectedType).toBe('corporate');
          expect(result.missingColumns.length).toBeGreaterThan(0);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Verify that all missing columns are actually required
          for (const missing of result.missingColumns) {
            expect(requiredColumns).toContain(missing);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Corporate Template Column Name Variations
   * For any valid column name variations (spaces, underscores, case),
   * validation should recognize them as matching
   * 
   * **Validates: Requirements 15.6**
   */
  it('should recognize column name variations for Corporate template', () => {
    const variations = [
      ['company name', 'company address', 'email address', 'company type', 'phone number'],
      ['Company Name', 'Company Address', 'Email Address', 'Company Type', 'Phone Number'],
      ['COMPANY_NAME', 'COMPANY_ADDRESS', 'EMAIL_ADDRESS', 'COMPANY_TYPE', 'PHONE_NUMBER'],
      ['companyName', 'companyAddress', 'emailAddress', 'companyType', 'phoneNumber'],
      ['Company-Name', 'Company-Address', 'Email-Address', 'Company-Type', 'Phone-Number']
    ];
    
    for (const columns of variations) {
      const result = validateCorporateTemplate(columns);
      
      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('corporate');
      expect(result.missingColumns).toHaveLength(0);
    }
  });
});

describe('Feature: identity-remediation, Property 18: List Type Auto-Detection', () => {
  /**
   * Property: Auto-detect Individual Template
   * For any file with Individual template indicators (first name, last name, gender),
   * the system must detect it as Individual type
   * 
   * **Validates: Requirements 15.5, 15.7**
   */
  it('should auto-detect Individual template from column patterns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender'],
          ['Title', 'First Name', 'Last Name', 'Phone Number', 'Email', 'Address', 'Gender', 'Date of Birth'],
          ['first name', 'last name', 'email', 'phone number', 'address', 'gender', 'title', 'occupation']
        ),
        (columns) => {
          const result = detectTemplateType(columns);
          
          expect(result.detectedType).toBe('individual');
          
          // If all required columns are present, validation should pass
          const hasAllRequired = ['title', 'first name', 'last name', 'phone number', 'email', 'address', 'gender']
            .every(required => columns.some(col => col.toLowerCase().replace(/[_\s-]/g, '') === required.replace(/[_\s-]/g, '')));
          
          if (hasAllRequired) {
            expect(result.valid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Auto-detect Corporate Template
   * For any file with Corporate template indicators (company name, company type),
   * the system must detect it as Corporate type
   * 
   * **Validates: Requirements 15.6, 15.7**
   */
  it('should auto-detect Corporate template from column patterns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ['company name', 'company address', 'email address', 'company type', 'phone number'],
          ['Company Name', 'Company Address', 'Email Address', 'Company Type', 'Phone Number', 'RC Number'],
          ['company name', 'company type', 'email address', 'phone number', 'company address', 'director 1']
        ),
        (columns) => {
          const result = detectTemplateType(columns);
          
          expect(result.detectedType).toBe('corporate');
          
          // If all required columns are present, validation should pass
          const hasAllRequired = ['company name', 'company address', 'email address', 'company type', 'phone number']
            .every(required => columns.some(col => col.toLowerCase().replace(/[_\s-]/g, '') === required.replace(/[_\s-]/g, '')));
          
          if (hasAllRequired) {
            expect(result.valid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Prioritize Individual over Corporate when Individual indicators present
   * For any file with first name/last name/gender but no company type,
   * Individual should be detected
   * 
   * **Validates: Requirements 15.7**
   */
  it('should prioritize Individual when Individual indicators are present without company type', () => {
    const columns = ['first name', 'last name', 'email', 'phone number', 'address', 'gender', 'title'];
    const result = detectTemplateType(columns);
    
    // Should detect as Individual because it has first/last name and gender
    expect(result.detectedType).toBe('individual');
  });

  /**
   * Property: Prioritize Corporate when company type is present
   * For any file with company name AND company type,
   * Corporate should be detected
   * 
   * **Validates: Requirements 15.7**
   */
  it('should prioritize Corporate when company type is present', () => {
    const columns = ['company name', 'company type', 'email address', 'phone number', 'company address'];
    const result = detectTemplateType(columns);
    
    expect(result.detectedType).toBe('corporate');
  });

  /**
   * Property: Return best match when neither template is complete
   * For any file that doesn't fully match either template,
   * return the one with fewer missing columns
   * 
   * **Validates: Requirements 15.7**
   */
  it('should return template with fewer missing columns when neither is complete', () => {
    // Has 3 Individual columns but only 1 Corporate column
    const columns1 = ['first name', 'last name', 'email', 'phone number'];
    const result1 = detectTemplateType(columns1);
    expect(result1.detectedType).toBe('individual');
    expect(result1.valid).toBe(false);
    
    // Has 3 Corporate columns but only 1 Individual column
    const columns2 = ['company name', 'company address', 'email address', 'phone number'];
    const result2 = detectTemplateType(columns2);
    expect(result2.detectedType).toBe('corporate');
    expect(result2.valid).toBe(false);
  });

  /**
   * Property: Validation errors list missing columns
   * For any invalid template, the errors array must contain information
   * about missing columns
   * 
   * **Validates: Requirements 15.9**
   */
  it('should list missing columns in validation errors', () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(['first name', 'last name', 'email'], { minLength: 1, maxLength: 3 }),
        (partialColumns) => {
          const result = detectTemplateType(partialColumns);
          
          if (!result.valid) {
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.missingColumns.length).toBeGreaterThan(0);
            
            // Error message should mention missing columns
            const errorMessage = result.errors[0];
            expect(errorMessage).toContain('Missing required columns');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: identity-remediation, Property 20: Backward Compatibility', () => {
  /**
   * Property: Flexible Mode Accepts Any Structure
   * For any arbitrary column structure, the system should accept it
   * when not in template validation mode
   * 
   * **Validates: Requirements 15.10**
   */
  it('should accept any column structure in flexible mode', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }),
          { minLength: 1, maxLength: 20 }
        ),
        (columns) => {
          // In flexible mode, we just parse without validation
          // The parseFile functions don't enforce template validation
          // They only detect email and name columns
          
          const emailColumn = detectEmailColumn(columns);
          const fileType = detectFileType(columns);
          const nameColumns = detectNameColumns(columns, fileType);
          
          // These should never throw errors, regardless of structure
          expect(emailColumn === null || typeof emailColumn === 'string').toBe(true);
          expect(['corporate', 'individual', 'unknown']).toContain(fileType);
          expect(typeof nameColumns).toBe('object');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Template Validation is Opt-In
   * For any file, template validation only occurs when explicitly called
   * The basic parsing functions (detectEmailColumn, detectNameColumns) work
   * independently of template validation
   * 
   * **Validates: Requirements 15.10**
   */
  it('should allow parsing without template validation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }),
          { minLength: 1, maxLength: 15 }
        ),
        (columns) => {
          // These functions should work regardless of template compliance
          const emailColumn = detectEmailColumn(columns);
          const fileType = detectFileType(columns);
          const nameColumns = detectNameColumns(columns, fileType);
          
          // Should not throw errors
          expect(() => detectEmailColumn(columns)).not.toThrow();
          expect(() => detectFileType(columns)).not.toThrow();
          expect(() => detectNameColumns(columns, fileType)).not.toThrow();
          
          // Template validation is separate and opt-in
          const templateResult = validateTemplate(columns);
          expect(typeof templateResult.valid).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Non-Template Files Still Work
   * For any file that doesn't match either template,
   * the system should still parse it successfully in flexible mode
   * 
   * **Validates: Requirements 15.10**
   */
  it('should successfully parse non-template files', () => {
    const nonTemplateColumns = [
      ['Name', 'Email', 'Phone', 'Policy'],
      ['Customer', 'Contact', 'ID', 'Status'],
      ['Insured', 'Policy Number', 'Email', 'Amount'],
      ['Field1', 'Field2', 'Field3', 'Field4']
    ];
    
    for (const columns of nonTemplateColumns) {
      // These should all work without errors
      const emailColumn = detectEmailColumn(columns);
      const fileType = detectFileType(columns);
      const nameColumns = detectNameColumns(columns, fileType);
      
      // Should detect email if present
      if (columns.some(col => col.toLowerCase().includes('email'))) {
        expect(emailColumn).not.toBeNull();
      }
      
      // Should detect file type (even if unknown)
      expect(['corporate', 'individual', 'unknown']).toContain(fileType);
      
      // Should detect name columns if present
      expect(typeof nameColumns).toBe('object');
    }
  });

  /**
   * Property: Template Validation Doesn't Break Existing Functionality
   * For any columns array, calling validateTemplate should not affect
   * the results of other detection functions
   * 
   * **Validates: Requirements 15.10**
   */
  it('should not affect other detection functions when template validation is used', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }),
          { minLength: 1, maxLength: 15 }
        ),
        (columns) => {
          // Get results before template validation
          const emailBefore = detectEmailColumn(columns);
          const fileTypeBefore = detectFileType(columns);
          const nameColumnsBefore = detectNameColumns(columns, fileTypeBefore);
          
          // Call template validation
          validateTemplate(columns);
          
          // Get results after template validation
          const emailAfter = detectEmailColumn(columns);
          const fileTypeAfter = detectFileType(columns);
          const nameColumnsAfter = detectNameColumns(columns, fileTypeAfter);
          
          // Results should be identical
          expect(emailAfter).toBe(emailBefore);
          expect(fileTypeAfter).toBe(fileTypeBefore);
          expect(nameColumnsAfter).toEqual(nameColumnsBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});

import { validateIndividualTemplate, validateCorporateTemplate, detectTemplateType, validateTemplate } from '../../utils/fileParser';
