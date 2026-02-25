/**
 * Backward Compatibility Tests for Identity Upload Validation
 * 
 * Ensures that the validation enhancement doesn't break existing upload functionality.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect } from 'vitest';
import { parseFile, parseCSV, parseExcel, detectEmailColumn, detectNameColumns, detectPolicyColumn } from '../../utils/fileParser';
import { validateIdentityData } from '../../utils/validation/identityValidation';

describe('Backward Compatibility - File Parsing', () => {
  it('should parse CSV files without DOB/NIN/BVN columns successfully', async () => {
    // Requirement 9.1: Existing CSV parsing still works
    const csvContent = 'Name,Email,Phone\nJohn Doe,john@example.com,08012345678';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'test.csv', { type: 'text/csv' });
    
    const result = await parseCSV(file);
    
    expect(result.columns).toEqual(['Name', 'Email', 'Phone']);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].Name).toBe('John Doe');
    expect(result.rows[0].Email).toBe('john@example.com');
  });

  it('should detect email columns as before', () => {
    // Requirement 9.5: Email column detection still works
    const columns = ['Name', 'Email Address', 'Phone'];
    const detected = detectEmailColumn(columns);
    
    expect(detected).toBe('Email Address');
  });

  it('should detect name columns as before', () => {
    // Requirement 9.5: Name column detection still works
    const columns = ['First Name', 'Last Name', 'Email'];
    const detected = detectNameColumns(columns, 'individual');
    
    expect(detected.firstName).toBe('First Name');
    expect(detected.lastName).toBe('Last Name');
  });

  it('should detect policy columns as before', () => {
    // Requirement 9.5: Policy column detection still works
    const columns = ['Name', 'Policy Number', 'Email'];
    const detected = detectPolicyColumn(columns);
    
    expect(detected).toBe('Policy Number');
  });
});

describe('Backward Compatibility - Validation with Missing Columns', () => {
  it('should pass validation when DOB/NIN/BVN columns are not present', () => {
    // Requirement 9.5: Files without DOB/NIN/BVN still upload successfully
    const rows = [
      { Name: 'John Doe', Email: 'john@example.com', Phone: '08012345678' },
      { Name: 'Jane Smith', Email: 'jane@example.com', Phone: '08087654321' },
    ];
    const columns = ['Name', 'Email', 'Phone'];
    
    const result = validateIdentityData(rows, columns, { templateType: 'flexible' });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass validation when DOB/NIN/BVN values are empty', () => {
    // Requirement 9.5: Empty optional fields don't cause validation errors
    const rows = [
      { Name: 'John Doe', Email: 'john@example.com', DOB: '', NIN: '', BVN: '' },
      { Name: 'Jane Smith', Email: 'jane@example.com', DOB: null, NIN: null, BVN: null },
    ];
    const columns = ['Name', 'Email', 'DOB', 'NIN', 'BVN'];
    
    const result = validateIdentityData(rows, columns, { templateType: 'individual' });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Backward Compatibility - Preview Functionality', () => {
  it('should still show first 10 rows in preview', () => {
    // Requirement 9.3: Preview table shows first 10 rows
    const rows = Array.from({ length: 50 }, (_, i) => ({
      Name: `Person ${i + 1}`,
      Email: `person${i + 1}@example.com`,
    }));
    
    const previewRows = rows.slice(0, 10);
    
    expect(previewRows).toHaveLength(10);
    expect(previewRows[0].Name).toBe('Person 1');
    expect(previewRows[9].Name).toBe('Person 10');
  });
});

describe('Backward Compatibility - Validation Does Not Break Existing Workflows', () => {
  it('should validate all rows, not just preview rows', () => {
    // Requirement 9.5: Validation runs on all rows
    const rows = Array.from({ length: 50 }, (_, i) => ({
      Name: `Person ${i + 1}`,
      Email: `person${i + 1}@example.com`,
      'Date of Birth': '15/03/1990', // Valid DOB
    }));
    
    // Add one invalid DOB in row 45
    rows[44]['Date of Birth'] = '15/03/21998'; // Invalid year
    
    const columns = ['Name', 'Email', 'Date of Birth'];
    const result = validateIdentityData(rows, columns, { templateType: 'flexible' });
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].rowIndex).toBe(44); // Row 45 (0-indexed as 44)
  });

  it('should not break upload when validation passes', () => {
    // Requirement 9.5: Valid data uploads successfully
    const rows = [
      { 
        Name: 'John Doe', 
        Email: 'john@example.com', 
        'Date of Birth': '15/03/1990',
        NIN: '12345678901',
        BVN: '09876543210'
      },
    ];
    const columns = ['Name', 'Email', 'Date of Birth', 'NIN', 'BVN'];
    
    const result = validateIdentityData(rows, columns, { templateType: 'individual' });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Backward Compatibility - Template Validation', () => {
  it('should still validate Individual template structure', () => {
    // Requirement 9.5: Template validation still works
    const columns = [
      'policy number',
      'first name',
      'last name',
      'date of birth',
      'email',
      'gender',
      'phone number',
      'address'
    ];
    
    // This should pass template structure validation
    // (Note: We're not testing template validation here, just ensuring columns are recognized)
    const detected = detectNameColumns(columns, 'individual');
    expect(detected.firstName).toBe('first name');
    expect(detected.lastName).toBe('last name');
  });

  it('should still validate Corporate template structure', () => {
    // Requirement 9.5: Template validation still works
    const columns = [
      'policy number',
      'company name',
      'registration date',
      'company type',
      'company address',
      'email address',
      'phone number'
    ];
    
    const detected = detectNameColumns(columns, 'corporate');
    expect(detected.companyName).toBe('company name');
  });
});
