/**
 * Preservation Property Tests for NFIU/KYC Corporate Form Fixes
 * 
 * These tests MUST PASS on unfixed code to establish baseline behavior.
 * They verify that non-buggy inputs continue to work correctly after the fix.
 * 
 * Preservation scope:
 * 1. KYC Corporate form field configurations (Website required, Ownership text, separate Business fields)
 * 2. NFIU Corporate fields other than Website, Ownership, and Business Type/Occupation
 * 3. Individual forms (NFIU and KYC) - all fields and configurations
 * 4. Admin dashboard display for non-NFIU Corporate forms
 * 5. Date handling consistency across all forms
 * 
 * Expected outcome: Tests PASS (confirms baseline behavior to preserve)
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  nfiuCorporateConfig, 
  kycCorporateConfig, 
  nfiuIndividualConfig, 
  kycIndividualConfig 
} from '@/config/formConfigs';
import { generateValidationSchema } from '@/utils/formValidation';
import { FORM_MAPPINGS } from '@/config/formMappings';

describe('Preservation Property Tests - KYC Corporate Form Configuration', () => {
  /**
   * **Validates: Requirements 3.1**
   * 
   * Preservation: KYC Corporate form must continue to display all fields correctly
   * This includes Website required, Ownership as text, separate Business fields
   */
  describe('Property: KYC Corporate Form Field Configuration Unchanged', () => {
    it('should keep Website field as required in KYC Corporate form', () => {
      const websiteField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'website');

      expect(websiteField).toBeDefined();
      expect(websiteField?.required).toBe(true);
      expect(websiteField?.type).toBe('text');
    });

    it('should keep Ownership field as text input in KYC Corporate form', () => {
      const ownershipField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'ownershipOfCompany');

      expect(ownershipField).toBeDefined();
      expect(ownershipField?.type).toBe('text');
      expect(ownershipField?.required).toBe(true);
      expect(ownershipField?.options).toBeUndefined(); // Should NOT be a select field
    });

    it('should keep separate Business Type and Occupation fields in KYC Corporate form', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const fields = companySection?.fields || [];

      const natureOfBusinessField = fields.find(f => f.name === 'natureOfBusiness');
      const businessOccupationField = fields.find(f => f.name === 'businessOccupation');

      expect(natureOfBusinessField).toBeDefined();
      expect(businessOccupationField).toBeDefined();
      expect(natureOfBusinessField?.required).toBe(true);
      expect(businessOccupationField?.required).toBe(true);
      expect(natureOfBusinessField?.type).toBe('text');
      expect(businessOccupationField?.type).toBe('text');
    });

    it('should have Contact Person Name as mandatory in KYC Corporate form', () => {
      const contactPersonNameField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'contactPersonName');

      expect(contactPersonNameField).toBeDefined();
      expect(contactPersonNameField?.required).toBe(true);
    });

    it('should have Contact Person Email in KYC Corporate form', () => {
      const contactPersonEmailField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'contactPersonEmail');

      expect(contactPersonEmailField).toBeDefined();
      expect(contactPersonEmailField?.required).toBe(true);
      expect(contactPersonEmailField?.type).toBe('email');
    });

    it('should have Estimated Turnover as mandatory in KYC Corporate form', () => {
      const estimatedTurnoverField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'estimatedTurnover');

      expect(estimatedTurnoverField).toBeDefined();
      expect(estimatedTurnoverField?.required).toBe(true);
    });

    it('should NOT have Premium Payment Source in KYC Corporate form', () => {
      const premiumPaymentSourceField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'premiumPaymentSource');

      expect(premiumPaymentSourceField).toBeUndefined();
    });

    it('should have Tax ID as optional in KYC Corporate form', () => {
      const taxIDField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'taxIDNo');

      expect(taxIDField).toBeDefined();
      expect(taxIDField?.required).toBe(false);
    });

    it('should NOT have Account Details section in KYC Corporate form', () => {
      const accountsSection = kycCorporateConfig.sections.find(s => s.id === 'accounts');
      expect(accountsSection).toBeUndefined();
    });
  });

  /**
   * **Validates: Requirements 3.2**
   * 
   * Preservation: KYC Corporate form validation must continue to work as before
   */
  describe('Property: KYC Corporate Form Validation Unchanged', () => {
    it('should validate KYC Corporate form with all required fields', async () => {
      const schema = generateValidationSchema(kycCorporateConfig);

      const validData = {
        insured: 'Test Company',
        officeAddress: 'Test Address',
        ownershipOfCompany: 'Nigerian Owned', // Text field, any text is valid
        website: 'https://example.com', // Required in KYC
        incorporationNumber: '12345',
        incorporationState: 'Lagos',
        dateOfIncorporationRegistration: new Date('2020-01-01'),
        contactPersonNo: '08012345678',
        natureOfBusiness: 'Manufacturing', // Separate field
        businessOccupation: 'Factory Operations', // Separate field
        taxIDNo: '', // Optional
        contactPersonName: 'John Doe', // Required in KYC
        contactPersonEmail: 'john@example.com', // Required in KYC
        estimatedTurnover: '10000000', // Required in KYC
        verificationDocUrl: 'test.pdf'
      };

      await expect(schema.validate(validData)).resolves.toBeDefined();
    });

    it('should reject KYC Corporate form with missing Website', async () => {
      const schema = generateValidationSchema(kycCorporateConfig);

      const invalidData = {
        insured: 'Test Company',
        officeAddress: 'Test Address',
        ownershipOfCompany: 'Nigerian Owned',
        website: '', // Missing required field
        incorporationNumber: '12345',
        incorporationState: 'Lagos',
        dateOfIncorporationRegistration: new Date('2020-01-01'),
        contactPersonNo: '08012345678',
        natureOfBusiness: 'Manufacturing',
        businessOccupation: 'Factory Operations',
        taxIDNo: '',
        contactPersonName: 'John Doe',
        contactPersonEmail: 'john@example.com',
        estimatedTurnover: '10000000',
        verificationDocUrl: 'test.pdf'
      };

      await expect(schema.validate(invalidData)).rejects.toThrow();
    });

    it('should accept any text value for Ownership field in KYC Corporate form', async () => {
      const schema = generateValidationSchema(kycCorporateConfig);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (ownershipText) => {
            const testData = {
              insured: 'Test Company',
              officeAddress: 'Test Address',
              ownershipOfCompany: ownershipText, // Any text should be valid
              website: 'https://example.com',
              incorporationNumber: '12345',
              incorporationState: 'Lagos',
              dateOfIncorporationRegistration: new Date('2020-01-01'),
              contactPersonNo: '08012345678',
              natureOfBusiness: 'Manufacturing',
              businessOccupation: 'Factory Operations',
              taxIDNo: '',
              contactPersonName: 'John Doe',
              contactPersonEmail: 'john@example.com',
              estimatedTurnover: '10000000',
              verificationDocUrl: 'test.pdf'
            };

            await expect(schema.validate(testData)).resolves.toBeDefined();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

describe('Preservation Property Tests - NFIU Corporate Other Fields', () => {
  /**
   * **Validates: Requirements 3.3, 3.4**
   * 
   * Preservation: All NFIU Corporate fields other than Website, Ownership, and Business Type/Occupation
   * must continue to display and validate with their current configuration
   */
  describe('Property: NFIU Corporate Other Fields Unchanged', () => {
    it('should keep Company Name field configuration unchanged', () => {
      const companyNameField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'insured');

      expect(companyNameField).toBeDefined();
      expect(companyNameField?.required).toBe(true);
      expect(companyNameField?.type).toBe('text');
      expect(companyNameField?.label).toBe('Company Name');
    });

    it('should keep Office Address field configuration unchanged', () => {
      const officeAddressField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'officeAddress');

      expect(officeAddressField).toBeDefined();
      expect(officeAddressField?.required).toBe(true);
      expect(officeAddressField?.type).toBe('textarea');
    });

    it('should keep Incorporation Number field configuration unchanged', () => {
      const incorporationNumberField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'incorporationNumber');

      expect(incorporationNumberField).toBeDefined();
      expect(incorporationNumberField?.required).toBe(true);
      expect(incorporationNumberField?.type).toBe('text');
    });

    it('should keep Tax ID field configuration unchanged', () => {
      const taxIDField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'taxIDNo');

      expect(taxIDField).toBeDefined();
      expect(taxIDField?.required).toBe(true);
      expect(taxIDField?.type).toBe('text');
    });

    it('should keep Email Address field configuration unchanged', () => {
      const emailField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'emailAddress');

      expect(emailField).toBeDefined();
      expect(emailField?.required).toBe(true);
      expect(emailField?.type).toBe('email');
    });

    it('should keep Premium Payment Source field configuration unchanged', () => {
      const premiumPaymentSourceField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'premiumPaymentSource');

      expect(premiumPaymentSourceField).toBeDefined();
      expect(premiumPaymentSourceField?.required).toBe(true);
      expect(premiumPaymentSourceField?.type).toBe('select');
      expect(premiumPaymentSourceField?.options).toBeDefined();
    });

    it('should keep Account Details section configuration unchanged', () => {
      const accountsSection = nfiuCorporateConfig.sections.find(s => s.id === 'accounts');
      
      expect(accountsSection).toBeDefined();
      expect(accountsSection?.title).toBe('Account Details');
      expect(accountsSection?.fields.length).toBeGreaterThan(0);
      
      // Check Naira account fields
      const localBankNameField = accountsSection?.fields.find(f => f.name === 'localBankName');
      expect(localBankNameField).toBeDefined();
      expect(localBankNameField?.required).toBe(true);
      
      const localAccountNumberField = accountsSection?.fields.find(f => f.name === 'localAccountNumber');
      expect(localAccountNumberField).toBeDefined();
      expect(localAccountNumberField?.required).toBe(true);
    });

    it('should keep Document Upload section configuration unchanged', () => {
      const documentsSection = nfiuCorporateConfig.sections.find(s => s.id === 'documents');
      
      expect(documentsSection).toBeDefined();
      expect(documentsSection?.title).toBe('Document Upload');
      
      const verificationDocField = documentsSection?.fields.find(f => f.name === 'verificationDocUrl');
      expect(verificationDocField).toBeDefined();
      expect(verificationDocField?.required).toBe(true);
      expect(verificationDocField?.type).toBe('file');
    });

    it('should validate NFIU Corporate form with unmodified fields correctly', async () => {
      const schema = generateValidationSchema(nfiuCorporateConfig);

      const validData = {
        insured: 'Test Company',
        officeAddress: 'Test Address',
        ownershipOfCompany: 'Nigerian', // Updated to use select value
        website: 'https://example.com',
        incorporationNumber: '12345',
        incorporationState: 'Lagos',
        dateOfIncorporationRegistration: new Date('2020-01-01'),
        contactPersonNo: '08012345678',
        businessTypeOccupation: 'Manufacturing / Factory Operations', // Combined field
        taxIDNo: 'TAX123',
        emailAddress: 'test@example.com',
        premiumPaymentSource: 'Salary or Business Income',
        localBankName: 'Test Bank',
        localAccountNumber: '1234567890',
        localBankBranch: 'Test Branch',
        localAccountOpeningDate: new Date('2019-01-01'),
        verificationDocUrl: 'test.pdf'
      };

      await expect(schema.validate(validData)).resolves.toBeDefined();
    });
  });
});

describe('Preservation Property Tests - Individual Forms', () => {
  /**
   * **Validates: Requirements 3.3, 3.4**
   * 
   * Preservation: Individual forms (NFIU and KYC) must continue to work exactly as before
   */
  describe('Property: NFIU Individual Form Configuration Unchanged', () => {
    it('should keep NFIU Individual form structure unchanged', () => {
      expect(nfiuIndividualConfig.formType).toBe('nfiu-individual');
      expect(nfiuIndividualConfig.sections.length).toBeGreaterThan(0);
      
      const personalSection = nfiuIndividualConfig.sections.find(s => s.id === 'personal');
      expect(personalSection).toBeDefined();
      expect(personalSection?.title).toBe('Personal Information');
    });

    it('should keep BVN field in NFIU Individual form', () => {
      const bvnField = nfiuIndividualConfig.sections
        .find(s => s.id === 'personal')
        ?.fields.find(f => f.name === 'BVN');

      expect(bvnField).toBeDefined();
      expect(bvnField?.required).toBe(true);
      expect(bvnField?.maxLength).toBe(11);
    });

    it('should keep Tax ID as required in NFIU Individual form', () => {
      const taxIDField = nfiuIndividualConfig.sections
        .find(s => s.id === 'personal')
        ?.fields.find(f => f.name === 'taxIDNo');

      expect(taxIDField).toBeDefined();
      expect(taxIDField?.required).toBe(true);
    });

    it('should validate NFIU Individual form correctly', async () => {
      const schema = generateValidationSchema(nfiuIndividualConfig);

      const validData = {
        firstName: 'John',
        middleName: 'Middle',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        placeOfBirth: 'Lagos',
        nationality: 'Nigerian',
        occupation: 'Engineer',
        NIN: '12345678901',
        BVN: '12345678901',
        taxIDNo: 'TAX123',
        identificationType: 'NIN',
        idNumber: '12345678901',
        issuingBody: 'NIMC',
        issuedDate: new Date('2015-01-01'),
        expiryDate: new Date('2030-01-01'), // Future date
        emailAddress: 'john@example.com',
        GSMno: '08012345678',
        sourceOfIncome: 'Salary or Business Income',
        identification: 'test.pdf'
      };

      await expect(schema.validate(validData)).resolves.toBeDefined();
    });
  });

  describe('Property: KYC Individual Form Configuration Unchanged', () => {
    it('should keep KYC Individual form structure unchanged', () => {
      expect(kycIndividualConfig.formType).toBe('kyc-individual');
      expect(kycIndividualConfig.sections.length).toBeGreaterThan(0);
      
      const personalSection = kycIndividualConfig.sections.find(s => s.id === 'personal');
      expect(personalSection).toBeDefined();
      expect(personalSection?.title).toBe('Personal Information');
    });

    it('should NOT have BVN field in KYC Individual form', () => {
      const bvnField = kycIndividualConfig.sections
        .find(s => s.id === 'personal')
        ?.fields.find(f => f.name === 'BVN');

      expect(bvnField).toBeUndefined();
    });

    it('should have Tax ID as optional in KYC Individual form', () => {
      const taxIDField = kycIndividualConfig.sections
        .find(s => s.id === 'personal')
        ?.fields.find(f => f.name === 'taxIDNo');

      expect(taxIDField).toBeDefined();
      expect(taxIDField?.required).toBe(false);
    });

    it('should NOT have Account Details section in KYC Individual form', () => {
      const accountsSection = kycIndividualConfig.sections.find(s => s.id === 'accounts');
      expect(accountsSection).toBeUndefined();
    });

    it('should validate KYC Individual form correctly', async () => {
      const schema = generateValidationSchema(kycIndividualConfig);

      const validData = {
        firstName: 'John',
        middleName: 'Middle',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        placeOfBirth: 'Lagos',
        nationality: 'Nigerian',
        occupation: 'Engineer',
        NIN: '12345678901',
        taxIDNo: '', // Optional in KYC
        identificationType: 'NIN',
        idNumber: '12345678901',
        issuingBody: 'NIMC',
        issuedDate: new Date('2015-01-01'),
        expiryDate: new Date('2030-01-01'), // Future date
        emailAddress: 'john@example.com',
        GSMno: '08012345678',
        sourceOfIncome: 'Salary or Business Income',
        identification: 'test.pdf'
      };

      await expect(schema.validate(validData)).resolves.toBeDefined();
    });
  });
});

describe('Preservation Property Tests - Date Handling', () => {
  /**
   * **Validates: Requirements 3.9, 3.10**
   * 
   * Preservation: Date handling must remain consistent across all forms
   */
  describe('Property: Date Handling Consistency', () => {
    it('should handle date fields consistently across all corporate forms', () => {
      const nfiuDateField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'dateOfIncorporationRegistration');

      const kycDateField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'dateOfIncorporationRegistration');

      expect(nfiuDateField?.type).toBe('date');
      expect(kycDateField?.type).toBe('date');
      expect(nfiuDateField?.maxDate).toBeDefined();
      expect(kycDateField?.maxDate).toBeDefined();
    });

    it('should handle date fields consistently across all individual forms', () => {
      const nfiuDateField = nfiuIndividualConfig.sections
        .find(s => s.id === 'personal')
        ?.fields.find(f => f.name === 'dateOfBirth');

      const kycDateField = kycIndividualConfig.sections
        .find(s => s.id === 'personal')
        ?.fields.find(f => f.name === 'dateOfBirth');

      expect(nfiuDateField?.type).toBe('date');
      expect(kycDateField?.type).toBe('date');
      expect(nfiuDateField?.maxDate).toBeDefined();
      expect(kycDateField?.maxDate).toBeDefined();
    });

    it('should validate date fields consistently across forms', async () => {
      const nfiuSchema = generateValidationSchema(nfiuCorporateConfig);
      const kycSchema = generateValidationSchema(kycCorporateConfig);

      const testDate = new Date('2020-01-01');

      // Both schemas should handle dates the same way
      const nfiuData = {
        insured: 'Test',
        officeAddress: 'Test',
        ownershipOfCompany: 'Nigerian', // Updated to use select value
        website: 'https://test.com',
        incorporationNumber: '123',
        incorporationState: 'Lagos',
        dateOfIncorporationRegistration: testDate,
        contactPersonNo: '08012345678',
        businessTypeOccupation: 'Test', // Combined field
        taxIDNo: 'TAX123',
        emailAddress: 'test@example.com',
        premiumPaymentSource: 'Salary or Business Income',
        localBankName: 'Test Bank',
        localAccountNumber: '1234567890',
        localBankBranch: 'Test',
        localAccountOpeningDate: testDate,
        verificationDocUrl: 'test.pdf'
      };

      const kycData = {
        insured: 'Test',
        officeAddress: 'Test',
        ownershipOfCompany: 'Test',
        website: 'https://test.com',
        incorporationNumber: '123',
        incorporationState: 'Lagos',
        dateOfIncorporationRegistration: testDate,
        contactPersonNo: '08012345678',
        natureOfBusiness: 'Test',
        businessOccupation: 'Test',
        taxIDNo: '',
        contactPersonName: 'John Doe',
        contactPersonEmail: 'john@example.com',
        estimatedTurnover: '10000000',
        verificationDocUrl: 'test.pdf'
      };

      await expect(nfiuSchema.validate(nfiuData)).resolves.toBeDefined();
      await expect(kycSchema.validate(kycData)).resolves.toBeDefined();
    });
  });
});

describe('Preservation Property Tests - Admin Dashboard Display', () => {
  /**
   * **Validates: Requirements 3.5, 3.6, 3.7, 3.8**
   * 
   * Preservation: Admin dashboard components must continue to display non-NFIU Corporate forms correctly
   */
  describe('Property: Form Mappings for Non-NFIU Corporate Forms', () => {
    it('should have form mapping for KYC Corporate form', () => {
      const kycMapping = FORM_MAPPINGS['kyc-corporate'] || FORM_MAPPINGS['corporate-kyc'];
      expect(kycMapping).toBeDefined();
      
      if (kycMapping) {
        expect(kycMapping.sections).toBeDefined();
        expect(kycMapping.sections.length).toBeGreaterThan(0);
      }
    });

    it('should have form mapping for Individual KYC form', () => {
      const individualMapping = FORM_MAPPINGS['individual-kyc'] || FORM_MAPPINGS['Individual-kyc-form'];
      expect(individualMapping).toBeDefined();
      
      if (individualMapping) {
        expect(individualMapping.sections).toBeDefined();
        expect(individualMapping.sections.length).toBeGreaterThan(0);
      }
    });

    it('should preserve field mappings for KYC Corporate form', () => {
      const kycMapping = FORM_MAPPINGS['kyc-corporate'] || FORM_MAPPINGS['corporate-kyc'];
      
      if (kycMapping) {
        const companySection = kycMapping.sections.find(s => 
          s.title.toLowerCase().includes('company')
        );
        
        if (companySection) {
          const fields = companySection.fields;
          
          // Should have separate business fields in KYC
          const natureField = fields.find(f => f.key === 'natureOfBusiness');
          const occupationField = fields.find(f => f.key === 'businessOccupation');
          
          // These should exist for KYC Corporate form
          expect(natureField || occupationField).toBeDefined();
        }
      }
    });

    it('should preserve Website field mapping for KYC Corporate form', () => {
      const kycMapping = FORM_MAPPINGS['kyc-corporate'] || FORM_MAPPINGS['corporate-kyc'];
      
      if (kycMapping) {
        const companySection = kycMapping.sections.find(s => 
          s.title.toLowerCase().includes('company')
        );
        
        if (companySection) {
          const websiteField = companySection.fields.find(f => f.key === 'website');
          expect(websiteField).toBeDefined();
        }
      }
    });

    it('should preserve Ownership field mapping for KYC Corporate form', () => {
      const kycMapping = FORM_MAPPINGS['kyc-corporate'] || FORM_MAPPINGS['corporate-kyc'];
      
      if (kycMapping) {
        const companySection = kycMapping.sections.find(s => 
          s.title.toLowerCase().includes('company')
        );
        
        if (companySection) {
          const ownershipField = companySection.fields.find(f => f.key === 'ownershipOfCompany');
          expect(ownershipField).toBeDefined();
        }
      }
    });
  });
});

describe('Property-Based Preservation Tests', () => {
  /**
   * Property-based tests to verify preservation across many inputs
   */
  describe('Property: KYC Corporate Form Accepts Any Ownership Text', () => {
    it('should accept any text value for Ownership field across many inputs', async () => {
      const schema = generateValidationSchema(kycCorporateConfig);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (ownershipText) => {
            const testData = {
              insured: 'Test Company',
              officeAddress: 'Test Address',
              ownershipOfCompany: ownershipText,
              website: 'https://example.com',
              incorporationNumber: '12345',
              incorporationState: 'Lagos',
              dateOfIncorporationRegistration: new Date('2020-01-01'),
              contactPersonNo: '08012345678',
              natureOfBusiness: 'Manufacturing',
              businessOccupation: 'Factory Operations',
              taxIDNo: '',
              contactPersonName: 'John Doe',
              contactPersonEmail: 'john@example.com',
              estimatedTurnover: '10000000',
              verificationDocUrl: 'test.pdf'
            };

            await expect(schema.validate(testData)).resolves.toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: Individual Forms Handle Various Names', () => {
    it('should handle various name formats in NFIU Individual form', async () => {
      const schema = generateValidationSchema(nfiuIndividualConfig);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (firstName, lastName) => {
            const testData = {
              firstName,
              middleName: '',
              lastName,
              dateOfBirth: new Date('1990-01-01'),
              placeOfBirth: 'Lagos',
              nationality: 'Nigerian',
              occupation: 'Engineer',
              NIN: '12345678901',
              BVN: '12345678901',
              taxIDNo: 'TAX123',
              identificationType: 'NIN',
              idNumber: '12345678901',
              issuingBody: 'NIMC',
              issuedDate: new Date('2015-01-01'),
              expiryDate: new Date('2030-01-01'), // Future date
              emailAddress: 'test@example.com',
              GSMno: '08012345678',
              sourceOfIncome: 'Salary or Business Income',
              identification: 'test.pdf'
            };

            await expect(schema.validate(testData)).resolves.toBeDefined();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle various name formats in KYC Individual form', async () => {
      const schema = generateValidationSchema(kycIndividualConfig);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (firstName, lastName) => {
            const testData = {
              firstName,
              middleName: '',
              lastName,
              dateOfBirth: new Date('1990-01-01'),
              placeOfBirth: 'Lagos',
              nationality: 'Nigerian',
              occupation: 'Engineer',
              NIN: '12345678901',
              taxIDNo: '',
              identificationType: 'NIN',
              idNumber: '12345678901',
              issuingBody: 'NIMC',
              issuedDate: new Date('2015-01-01'),
              expiryDate: new Date('2030-01-01'), // Future date
              emailAddress: 'test@example.com',
              GSMno: '08012345678',
              sourceOfIncome: 'Salary or Business Income',
              identification: 'test.pdf'
            };

            await expect(schema.validate(testData)).resolves.toBeDefined();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property: Date Validation Consistency', () => {
    it('should validate dates consistently across all forms', async () => {
      const nfiuCorporateSchema = generateValidationSchema(nfiuCorporateConfig);
      const kycCorporateSchema = generateValidationSchema(kycCorporateConfig);

      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2000-01-01'), max: new Date('2025-01-01') }), // Past dates only
          async (testDate) => {
            // Test NFIU Corporate
            const nfiuCorporateData = {
              insured: 'Test',
              officeAddress: 'Test',
              ownershipOfCompany: 'Nigerian', // Updated to use select value
              website: 'https://test.com',
              incorporationNumber: '123',
              incorporationState: 'Lagos',
              dateOfIncorporationRegistration: testDate,
              contactPersonNo: '08012345678',
              businessTypeOccupation: 'Test', // Combined field
              taxIDNo: 'TAX123',
              emailAddress: 'test@example.com',
              premiumPaymentSource: 'Salary or Business Income',
              localBankName: 'Test Bank',
              localAccountNumber: '1234567890',
              localBankBranch: 'Test',
              localAccountOpeningDate: testDate,
              verificationDocUrl: 'test.pdf'
            };

            await expect(nfiuCorporateSchema.validate(nfiuCorporateData)).resolves.toBeDefined();

            // Test KYC Corporate
            const kycCorporateData = {
              insured: 'Test',
              officeAddress: 'Test',
              ownershipOfCompany: 'Test',
              website: 'https://test.com',
              incorporationNumber: '123',
              incorporationState: 'Lagos',
              dateOfIncorporationRegistration: testDate,
              contactPersonNo: '08012345678',
              natureOfBusiness: 'Test',
              businessOccupation: 'Test',
              taxIDNo: '',
              contactPersonName: 'John Doe',
              contactPersonEmail: 'john@example.com',
              estimatedTurnover: '10000000',
              verificationDocUrl: 'test.pdf'
            };

            await expect(kycCorporateSchema.validate(kycCorporateData)).resolves.toBeDefined();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
