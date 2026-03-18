/**
 * Test to reproduce and verify the fix for the exact issue described:
 * - Expected: Wed Apr 01 1970 00:00:00 GMT+0100 (West Africa Standard Time)
 * - Found: 01/04/1970
 * 
 * This should now work correctly after the fix.
 */

import { simpleVerificationMatcher } from '../../services/simpleVerificationMatcher';

describe('Date Format Issue Reproduction', () => {
  it('should fix the exact issue: Date object vs DD/MM/YYYY string comparison', async () => {
    // Simulate the exact scenario from the error message
    const extractedData = {
      companyName: 'Test Company Ltd',
      rcNumber: 'RC123456',
      registrationDate: '01/04/1970', // This is what OCR extracts
      address: '123 Test Street'
    };

    const formData = {
      insured: 'Test Company Ltd',
      cacNumber: 'RC123456',
      incorporationDate: new Date('1970-04-01'), // This is what the form has
      address: '123 Test Street'
    };

    const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

    // Before the fix, this would fail with:
    // Expected: Wed Apr 01 1970 00:00:00 GMT+0100 (West Africa Standard Time)
    // Found: 01/04/1970
    
    // After the fix, it should succeed
    expect(result.success).toBe(true);
    expect(result.isMatch).toBe(true);
    expect(result.confidence).toBe(100);
    
    // Should have no mismatches
    expect(result.mismatches).toHaveLength(0);
  });

  it('should show readable dates in error messages when dates actually differ', async () => {
    const extractedData = {
      companyName: 'Test Company Ltd',
      rcNumber: 'RC123456',
      registrationDate: '01/04/1970', // April 1, 1970
      address: '123 Test Street'
    };

    const formData = {
      insured: 'Test Company Ltd',
      cacNumber: 'RC123456',
      incorporationDate: new Date('1970-04-15'), // April 15, 1970 (different)
      address: '123 Test Street'
    };

    const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

    expect(result.success).toBe(true);
    expect(result.isMatch).toBe(false);
    
    const dateMismatch = result.mismatches.find(m => m.field === 'registrationDate');
    expect(dateMismatch).toBeDefined();
    
    // Should show normalized dates, not the GMT string
    expect(dateMismatch?.expectedValue).toBe('1970-04-15');
    expect(dateMismatch?.extractedValue).toBe('1970-04-01');
    
    // Should NOT contain the problematic GMT string
    expect(dateMismatch?.expectedValue).not.toContain('GMT');
    expect(dateMismatch?.expectedValue).not.toContain('West Africa Standard Time');
  });

  it('should handle dates with timezone offsets correctly', async () => {
    // When a Date object has a timezone offset, it should still match
    // if it represents the same calendar date
    const extractedData = {
      companyName: 'Test Company Ltd',
      rcNumber: 'RC123456',
      registrationDate: '01/04/1970', // April 1, 1970
      address: '123 Test Street'
    };

    const formData = {
      insured: 'Test Company Ltd',
      cacNumber: 'RC123456',
      incorporationDate: new Date('1970-04-01T00:00:00Z'), // April 1, 1970 UTC
      address: '123 Test Street'
    };

    const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

    // Should match successfully
    expect(result.success).toBe(true);
    expect(result.isMatch).toBe(true);
    expect(result.confidence).toBe(100);
    expect(result.mismatches).toHaveLength(0);
  });

  it('should verify the fix prevents the original error message', async () => {
    const extractedData = {
      companyName: 'Test Company Ltd',
      rcNumber: 'RC123456',
      registrationDate: '01/04/1970',
      address: '123 Test Street'
    };

    const formData = {
      insured: 'Test Company Ltd',
      cacNumber: 'RC123456',
      incorporationDate: new Date('1970-04-01'),
      address: '123 Test Street'
    };

    const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

    // The original error was:
    // "Document verification failed: registrationDate does not match your form data"
    // "Expected: Wed Apr 01 1970 00:00:00 GMT+0100 (West Africa Standard Time)"
    // "Found: 01/04/1970"
    
    // After the fix, this should NOT happen
    expect(result.isMatch).toBe(true);
    
    // If there were any mismatches (there shouldn't be), they should have normalized dates
    result.mismatches.forEach(mismatch => {
      expect(mismatch.expectedValue).not.toContain('GMT');
      expect(mismatch.expectedValue).not.toContain('West Africa Standard Time');
      expect(mismatch.extractedValue).not.toContain('GMT');
    });
  });
});
