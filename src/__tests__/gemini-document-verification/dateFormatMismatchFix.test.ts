/**
 * Test to verify that date format mismatches are properly handled
 * This test ensures dates in different formats (Date objects vs DD/MM/YYYY strings) are correctly compared
 */

import { simpleVerificationMatcher } from '../../services/simpleVerificationMatcher';

describe('Date Format Mismatch Fix', () => {
  describe('CAC Document Verification', () => {
    it('should match dates when form has Date object and extracted has DD/MM/YYYY string', async () => {
      const extractedData = {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456',
        registrationDate: '01/04/1970', // DD/MM/YYYY from OCR
        address: '123 Test Street'
      };

      const formData = {
        insured: 'Test Company Ltd',
        cacNumber: 'RC123456',
        incorporationDate: new Date('1970-04-01'), // Date object from form
        address: '123 Test Street'
      };

      const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

      // Should match successfully
      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe(100);
      
      // Should have no date mismatches
      const dateMismatch = result.mismatches.find(m => m.field === 'registrationDate');
      expect(dateMismatch).toBeUndefined();
    });

    it('should show normalized dates in error messages when dates do not match', async () => {
      const extractedData = {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456',
        registrationDate: '01/04/1970', // DD/MM/YYYY from OCR
        address: '123 Test Street'
      };

      const formData = {
        insured: 'Test Company Ltd',
        cacNumber: 'RC123456',
        incorporationDate: new Date('1970-04-15'), // Different date
        address: '123 Test Street'
      };

      const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

      // Should not match
      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      
      // Should have a date mismatch with normalized dates
      const dateMismatch = result.mismatches.find(m => m.field === 'registrationDate');
      expect(dateMismatch).toBeDefined();
      expect(dateMismatch?.extractedValue).toBe('1970-04-01'); // Normalized from 01/04/1970
      expect(dateMismatch?.expectedValue).toBe('1970-04-15'); // Normalized from Date object
    });

    it('should handle various date formats correctly', async () => {
      const testCases = [
        {
          extracted: '01/04/1970',
          form: new Date('1970-04-01'),
          shouldMatch: true,
          description: 'DD/MM/YYYY vs Date object'
        },
        {
          extracted: '2020-01-15',
          form: new Date('2020-01-15'),
          shouldMatch: true,
          description: 'YYYY-MM-DD vs Date object'
        },
        {
          extracted: '01/04/1970',
          form: '1970-04-01',
          shouldMatch: true,
          description: 'DD/MM/YYYY vs YYYY-MM-DD string'
        },
        {
          extracted: '01/04/1970',
          form: new Date('1970-04-02'),
          shouldMatch: false,
          description: 'Different dates'
        }
      ];

      for (const testCase of testCases) {
        const extractedData = {
          companyName: 'Test Company Ltd',
          rcNumber: 'RC123456',
          registrationDate: testCase.extracted,
          address: '123 Test Street'
        };

        const formData = {
          insured: 'Test Company Ltd',
          cacNumber: 'RC123456',
          incorporationDate: testCase.form,
          address: '123 Test Street'
        };

        const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

        expect(result.isMatch).toBe(testCase.shouldMatch);
        
        if (!testCase.shouldMatch) {
          const dateMismatch = result.mismatches.find(m => m.field === 'registrationDate');
          expect(dateMismatch).toBeDefined();
          // Verify values are strings in YYYY-MM-DD format
          expect(dateMismatch?.extractedValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(dateMismatch?.expectedValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    });

    it('should not show GMT string in error messages', async () => {
      const extractedData = {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456',
        registrationDate: '01/04/1970',
        address: '123 Test Street'
      };

      const formData = {
        insured: 'Test Company Ltd',
        cacNumber: 'RC123456',
        incorporationDate: new Date('1970-04-15'),
        address: '123 Test Street'
      };

      const result = await simpleVerificationMatcher.verifyCACDocument(extractedData, formData);

      const dateMismatch = result.mismatches.find(m => m.field === 'registrationDate');
      
      // Should NOT contain GMT string
      expect(dateMismatch?.extractedValue).not.toContain('GMT');
      expect(dateMismatch?.expectedValue).not.toContain('GMT');
      
      // Should NOT contain full Date.toString() format
      expect(dateMismatch?.extractedValue).not.toContain('West Africa Standard Time');
      expect(dateMismatch?.expectedValue).not.toContain('West Africa Standard Time');
      
      // Should be in YYYY-MM-DD format
      expect(dateMismatch?.extractedValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dateMismatch?.expectedValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
