/**
 * Test to verify that Date objects are not rendered directly in JSX
 * This test ensures the fix for the React rendering error is working
 */

import { simpleVerificationMatcher } from '../../services/simpleVerificationMatcher';

describe('Date Rendering Fix', () => {
  describe('simpleVerificationMatcher', () => {
    it('should convert date values to strings in mismatches for CAC documents', async () => {
      const extractedData = {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456',
        registrationDate: '2020-01-15',
        address: '123 Test Street'
      };

      const formData = {
        insured: 'Test Company Ltd',
        cacNumber: 'RC123456',
        incorporationDate: '2020-01-20', // Different date to trigger mismatch
        address: '123 Test Street'
      };

      const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

      // Should have a mismatch for registration date
      const dateMismatch = result.mismatches.find(m => m.field === 'registrationDate');
      expect(dateMismatch).toBeDefined();
      
      // Verify that extractedValue and expectedValue are strings, not Date objects
      expect(typeof dateMismatch?.extractedValue).toBe('string');
      expect(typeof dateMismatch?.expectedValue).toBe('string');
      
      // Verify they are not Date objects
      expect(dateMismatch?.extractedValue).not.toBeInstanceOf(Date);
      expect(dateMismatch?.expectedValue).not.toBeInstanceOf(Date);
      
      // Verify the values are the expected strings
      expect(dateMismatch?.extractedValue).toBe('2020-01-15');
      expect(dateMismatch?.expectedValue).toBe('2020-01-20');
    });

    it('should handle Date objects passed as date values', async () => {
      const extractedData = {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456',
        registrationDate: new Date('2020-01-15').toISOString(), // Date object converted to string
        address: '123 Test Street'
      };

      const formData = {
        insured: 'Test Company Ltd',
        cacNumber: 'RC123456',
        incorporationDate: new Date('2020-01-20').toISOString(), // Date object converted to string
        address: '123 Test Street'
      };

      const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

      // Should have a mismatch for registration date
      const dateMismatch = result.mismatches.find(m => m.field === 'registrationDate');
      expect(dateMismatch).toBeDefined();
      
      // Verify that extractedValue and expectedValue are strings
      expect(typeof dateMismatch?.extractedValue).toBe('string');
      expect(typeof dateMismatch?.expectedValue).toBe('string');
      
      // Verify they are not Date objects
      expect(dateMismatch?.extractedValue).not.toBeInstanceOf(Date);
      expect(dateMismatch?.expectedValue).not.toBeInstanceOf(Date);
    });

    it('should handle undefined date values gracefully', async () => {
      const extractedData = {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456',
        registrationDate: '',
        address: '123 Test Street'
      };

      const formData = {
        insured: 'Test Company Ltd',
        cacNumber: 'RC123456',
        incorporationDate: undefined,
        address: '123 Test Street'
      };

      const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

      // Should not crash and should handle gracefully
      expect(result.success).toBe(true);
    });

    it('should ensure all mismatch values are strings, never Date objects', async () => {
      const extractedData = {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456',
        registrationDate: '2020-01-15',
        address: '123 Test Street'
      };

      const formData = {
        insured: 'Different Company',
        cacNumber: 'RC999999',
        incorporationDate: '2020-01-20',
        address: '456 Other Street'
      };

      const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

      // Check all mismatches have string values
      result.mismatches.forEach(mismatch => {
        expect(typeof mismatch.extractedValue).toBe('string');
        expect(typeof mismatch.expectedValue).toBe('string');
        expect(mismatch.extractedValue).not.toBeInstanceOf(Date);
        expect(mismatch.expectedValue).not.toBeInstanceOf(Date);
      });
    });
  });
});
