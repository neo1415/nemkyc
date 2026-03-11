import { describe, it, expect } from 'vitest';
import { SimpleVerificationMatcher } from '../../services/simpleVerificationMatcher';

describe('Simple Verification Matcher', () => {
  const matcher = new SimpleVerificationMatcher();

  describe('Individual (NIN) Verification', () => {
    it('should pass when all fields match exactly', async () => {
      const extractedData = {
        fullName: 'DANIEL ADEMOLA OYENIYI',
        nin: '80026704438',
        gender: 'Male',
        dateOfBirth: null,
        documentType: 'NIN',
        documentNumber: '80026704438',
        issuingAuthority: 'NIMC'
      };

      const formData = {
        firstName: 'Daniel',
        lastName: 'Oyeniyi',
        nin: '80026704438',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.mismatches).toHaveLength(0);
    });

    it('should fail when NIN numbers do not match', async () => {
      const extractedData = {
        fullName: 'DANIEL ADEMOLA OYENIYI',
        nin: '80026704438',
        gender: 'Male',
        dateOfBirth: null,
        documentType: 'NIN',
        documentNumber: '80026704438',
        issuingAuthority: 'NIMC'
      };

      const formData = {
        firstName: 'Daniel',
        lastName: 'Oyeniyi',
        nin: '12345678901', // Different NIN
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0].field).toBe('nin');
      expect(result.mismatches[0].reason).toBe('NIN numbers do not match');
    });

    it('should fail when names do not match', async () => {
      const extractedData = {
        fullName: 'DANIEL ADEMOLA OYENIYI',
        nin: '80026704438',
        gender: 'Male',
        dateOfBirth: null,
        documentType: 'NIN',
        documentNumber: '80026704438',
        issuingAuthority: 'NIMC'
      };

      const formData = {
        firstName: 'John', // Different first name
        lastName: 'Smith', // Different last name
        nin: '80026704438',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.mismatches).toHaveLength(2);
      expect(result.mismatches.some(m => m.field === 'firstName')).toBe(true);
      expect(result.mismatches.some(m => m.field === 'lastName')).toBe(true);
    });

    it('should handle middle names correctly', async () => {
      const extractedData = {
        fullName: 'DANIEL ADEMOLA OYENIYI',
        nin: '80026704438',
        gender: 'Male',
        dateOfBirth: null,
        documentType: 'NIN',
        documentNumber: '80026704438',
        issuingAuthority: 'NIMC'
      };

      const formData = {
        firstName: 'Daniel', // Matches first name
        lastName: 'Oyeniyi', // Matches last name (ignoring middle name)
        nin: '80026704438',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.mismatches).toHaveLength(0);
    });
  });

  describe('Corporate (CAC) Verification', () => {
    it('should pass when all fields match exactly', async () => {
      const extractedData = {
        companyName: 'ACME CORPORATION LIMITED',
        rcNumber: 'RC123456',
        registrationDate: '2020-01-15',
        address: '123 Business Street, Lagos',
        directors: ['John Doe', 'Jane Smith']
      };

      const formData = {
        insured: 'ACME CORPORATION LIMITED',
        cacNumber: 'RC123456',
        incorporationDate: '2020-01-15'
      };

      const result = await matcher.verifyCACDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.mismatches).toHaveLength(0);
    });

    it('should fail when company names do not match', async () => {
      const extractedData = {
        companyName: 'ACME CORPORATION LIMITED',
        rcNumber: 'RC123456',
        registrationDate: '2020-01-15',
        address: '123 Business Street, Lagos',
        directors: ['John Doe', 'Jane Smith']
      };

      const formData = {
        insured: 'DIFFERENT COMPANY LIMITED', // Different company name
        cacNumber: 'RC123456',
        incorporationDate: '2020-01-15'
      };

      const result = await matcher.verifyCACDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0].field).toBe('companyName');
      expect(result.mismatches[0].reason).toBe('Company names do not match');
    });

    it('should fail when CAC numbers do not match', async () => {
      const extractedData = {
        companyName: 'ACME CORPORATION LIMITED',
        rcNumber: 'RC123456',
        registrationDate: '2020-01-15',
        address: '123 Business Street, Lagos',
        directors: ['John Doe', 'Jane Smith']
      };

      const formData = {
        insured: 'ACME CORPORATION LIMITED',
        cacNumber: 'RC999999', // Different CAC number
        incorporationDate: '2020-01-15'
      };

      const result = await matcher.verifyCACDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0].field).toBe('cacNumber');
      expect(result.mismatches[0].reason).toBe('CAC numbers do not match');
    });
  });
});