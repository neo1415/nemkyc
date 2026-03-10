/**
 * Corporate Forms Field Matching Integration Test
 * 
 * Tests that field matching and re-validation work correctly in Corporate KYC and Corporate NFIU forms
 */

import { describe, it, expect } from 'vitest';
import { performAllFieldsMatching, revalidateSingleField } from '@/utils/realtimeFieldMatching';
import { CAC_FIELDS_CONFIG, CORPORATE_NFIU_CAC_FIELDS_CONFIG } from '@/config/realtimeValidationConfig';
import { FieldValidationStatus } from '@/types/realtimeVerificationValidation';

describe('Corporate Forms Field Matching Integration', () => {
  describe('Corporate KYC Field Matching', () => {
    it('should match all fields when data is correct', () => {
      const formData = {
        insured: 'NEM Insurance PLC',
        dateOfIncorporationRegistration: new Date('1970-04-01'),
        officeAddress: '123 Main Street, Lagos'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      expect(result.insured.status).toBe(FieldValidationStatus.MATCHED);
      expect(result.dateOfIncorporationRegistration.status).toBe(FieldValidationStatus.MATCHED);
      expect(result.officeAddress.status).toBe(FieldValidationStatus.MATCHED);
    });

    it('should detect mismatches when data is incorrect', () => {
      const formData = {
        insured: 'Wrong Company Name',
        dateOfIncorporationRegistration: new Date('2000-01-01'),
        officeAddress: 'Wrong Address'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      expect(result.insured.status).toBe(FieldValidationStatus.MISMATCHED);
      expect(result.insured.errorMessage).toBeTruthy();
      expect(result.dateOfIncorporationRegistration.status).toBe(FieldValidationStatus.MISMATCHED);
      expect(result.dateOfIncorporationRegistration.errorMessage).toBeTruthy();
      expect(result.officeAddress.status).toBe(FieldValidationStatus.MISMATCHED);
      expect(result.officeAddress.errorMessage).toBeTruthy();
    });

    it('should re-validate single field after user correction', () => {
      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      // Initial mismatch
      const wrongValue = 'Wrong Company Name';
      const wrongResult = revalidateSingleField(
        'insured',
        wrongValue,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );
      expect(wrongResult.status).toBe(FieldValidationStatus.MISMATCHED);

      // After correction
      const correctValue = 'NEM Insurance PLC';
      const correctResult = revalidateSingleField(
        'insured',
        correctValue,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );
      expect(correctResult.status).toBe(FieldValidationStatus.MATCHED);
    });
  });

  describe('Corporate NFIU Field Matching', () => {
    it('should use correct field names for Corporate NFIU', () => {
      // Verify that Corporate NFIU config uses the same field names as Corporate KYC
      const fieldNames = CORPORATE_NFIU_CAC_FIELDS_CONFIG.map(f => f.fieldName);
      
      expect(fieldNames).toContain('insured');
      expect(fieldNames).toContain('dateOfIncorporationRegistration');
      expect(fieldNames).toContain('officeAddress');
      
      // Should NOT contain the old incorrect field names
      expect(fieldNames).not.toContain('companyName');
      expect(fieldNames).not.toContain('incorporationDate');
      expect(fieldNames).not.toContain('registeredAddress');
    });

    it('should match all fields when data is correct', () => {
      const formData = {
        insured: 'NEM Insurance PLC',
        dateOfIncorporationRegistration: new Date('1970-04-01'),
        officeAddress: '123 Main Street, Lagos'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CORPORATE_NFIU_CAC_FIELDS_CONFIG,
        'CAC'
      );

      expect(result.insured.status).toBe(FieldValidationStatus.MATCHED);
      expect(result.dateOfIncorporationRegistration.status).toBe(FieldValidationStatus.MATCHED);
      expect(result.officeAddress.status).toBe(FieldValidationStatus.MATCHED);
    });

    it('should detect mismatches when data is incorrect', () => {
      const formData = {
        insured: 'Wrong Company Name',
        dateOfIncorporationRegistration: new Date('2000-01-01'),
        officeAddress: 'Wrong Address'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CORPORATE_NFIU_CAC_FIELDS_CONFIG,
        'CAC'
      );

      expect(result.insured.status).toBe(FieldValidationStatus.MISMATCHED);
      expect(result.dateOfIncorporationRegistration.status).toBe(FieldValidationStatus.MISMATCHED);
      expect(result.officeAddress.status).toBe(FieldValidationStatus.MISMATCHED);
    });
  });

  describe('Fuzzy Matching', () => {
    it('should match company names with different casing', () => {
      const formData = {
        insured: 'nem insurance plc',
        dateOfIncorporationRegistration: new Date('1970-04-01'),
        officeAddress: '123 Main Street, Lagos'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      expect(result.insured.status).toBe(FieldValidationStatus.MATCHED);
    });

    it('should match company names with abbreviations', () => {
      const formData = {
        insured: 'NEM Insurance',
        dateOfIncorporationRegistration: new Date('1970-04-01'),
        officeAddress: '123 Main Street, Lagos'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      // Should match because similarity > 80%
      expect(result.insured.status).toBe(FieldValidationStatus.MATCHED);
    });

    it('should not match completely different company names', () => {
      const formData = {
        insured: 'City Covenant Brokers',
        dateOfIncorporationRegistration: new Date('1970-04-01'),
        officeAddress: '123 Main Street, Lagos'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      expect(result.insured.status).toBe(FieldValidationStatus.MISMATCHED);
    });
  });

  describe('Date Matching', () => {
    it('should match dates regardless of time', () => {
      const formData = {
        insured: 'NEM Insurance PLC',
        dateOfIncorporationRegistration: new Date('1970-04-01T00:00:00Z'),
        officeAddress: '123 Main Street, Lagos'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01T12:30:45Z',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      expect(result.dateOfIncorporationRegistration.status).toBe(FieldValidationStatus.MATCHED);
    });

    it('should not match different dates', () => {
      const formData = {
        insured: 'NEM Insurance PLC',
        dateOfIncorporationRegistration: new Date('2000-01-01'),
        officeAddress: '123 Main Street, Lagos'
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      expect(result.dateOfIncorporationRegistration.status).toBe(FieldValidationStatus.MISMATCHED);
    });
  });

  describe('Empty Field Handling', () => {
    it('should mark empty fields as matched (will be autofilled)', () => {
      const formData = {
        insured: '',
        dateOfIncorporationRegistration: undefined,
        officeAddress: ''
      };

      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      const result = performAllFieldsMatching(
        formData,
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      // Empty fields should be marked as matched (they will be autofilled)
      expect(result.insured.status).toBe(FieldValidationStatus.MATCHED);
      expect(result.dateOfIncorporationRegistration.status).toBe(FieldValidationStatus.MATCHED);
      expect(result.officeAddress.status).toBe(FieldValidationStatus.MATCHED);
    });

    it('should mark cleared field as mismatched during re-validation', () => {
      const verificationData = {
        name: 'NEM INSURANCE PLC',
        registrationDate: '1970-04-01',
        address: '123 Main Street, Lagos'
      };

      // User clears the field after verification
      const result = revalidateSingleField(
        'insured',
        '',
        verificationData,
        CAC_FIELDS_CONFIG,
        'CAC'
      );

      // Cleared field during re-validation is a mismatch
      expect(result.status).toBe(FieldValidationStatus.MISMATCHED);
    });
  });
});
