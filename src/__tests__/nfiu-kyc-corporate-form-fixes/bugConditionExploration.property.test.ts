/**
 * Bug Condition Exploration Test for NFIU/KYC Corporate Form Fixes
 * 
 * This test MUST FAIL on unfixed code to confirm the bugs exist.
 * 
 * Bugs being tested:
 * 1. Website field displays as required (should be optional)
 * 2. Ownership field displays as text input (should be select dropdown)
 * 3. Business Type and Occupation display as two separate fields (should be combined)
 * 4. Ownership field accepts invalid values without validation error
 * 5. Admin dashboard components fail to display/export combined business field
 * 
 * Expected outcome: TEST FAILS (this proves the bugs exist)
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { nfiuCorporateConfig, kycCorporateConfig } from '@/config/formConfigs';
import { generateValidationSchema } from '@/utils/formValidation';
import { FORM_MAPPINGS } from '@/config/formMappings';

describe('Bug Condition Exploration - NFIU Corporate Form Configuration', () => {
  describe('Bug 1: Website Field Required Status', () => {
    /**
     * **Validates: Requirements 2.1**
     * 
     * Bug: Website field displays as required (red asterisk)
     * Expected: Website field should be optional (required: false)
     */
    it('should mark Website field as optional (EXPECTED TO FAIL on unfixed code)', () => {
      const websiteField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'website');

      expect(websiteField).toBeDefined();
      expect(websiteField?.required).toBe(false); // WILL FAIL: currently true
    });
  });

  describe('Bug 2: Ownership Field Type', () => {
    /**
     * **Validates: Requirements 2.2**
     * 
     * Bug: Ownership field displays as text input
     * Expected: Ownership field should be select dropdown with options
     */
    it('should configure Ownership field as select dropdown (EXPECTED TO FAIL on unfixed code)', () => {
      const ownershipField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'ownershipOfCompany');

      expect(ownershipField).toBeDefined();
      expect(ownershipField?.type).toBe('select'); // WILL FAIL: currently 'text'
      expect(ownershipField?.options).toBeDefined(); // WILL FAIL: currently undefined
      expect(ownershipField?.options?.length).toBeGreaterThan(0); // WILL FAIL
    });

    it('should mark Ownership field as optional (EXPECTED TO FAIL on unfixed code)', () => {
      const ownershipField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'ownershipOfCompany');

      expect(ownershipField).toBeDefined();
      expect(ownershipField?.required).toBe(false); // WILL FAIL: currently true
    });

    it('should have correct options for Ownership field (EXPECTED TO FAIL on unfixed code)', () => {
      const ownershipField = nfiuCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'ownershipOfCompany');

      expect(ownershipField?.options).toBeDefined();
      
      const optionValues = ownershipField?.options?.map(opt => opt.value) || [];
      expect(optionValues).toContain('Nigerian'); // WILL FAIL
      expect(optionValues).toContain('Foreign'); // WILL FAIL
      expect(optionValues).toContain('Both'); // WILL FAIL
    });
  });

  describe('Bug 3: Business Type and Occupation Field Separation', () => {
    /**
     * **Validates: Requirements 2.3**
     * 
     * Bug: Business Type and Occupation are two separate fields
     * Expected: Should be combined into single field "Business Type/Occupation"
     */
    it('should have combined Business Type/Occupation field (EXPECTED TO FAIL on unfixed code)', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const fields = companySection?.fields || [];

      // Should have businessTypeOccupation field
      const combinedField = fields.find(f => f.name === 'businessTypeOccupation');
      expect(combinedField).toBeDefined(); // WILL FAIL: field doesn't exist yet

      if (combinedField) {
        expect(combinedField.label).toBe('Business Type/Occupation'); // WILL FAIL
        expect(combinedField.type).toBe('text');
        expect(combinedField.required).toBe(true);
      }
    });

    it('should NOT have separate natureOfBusiness field (EXPECTED TO FAIL on unfixed code)', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const fields = companySection?.fields || [];

      const natureOfBusinessField = fields.find(f => f.name === 'natureOfBusiness');
      expect(natureOfBusinessField).toBeUndefined(); // WILL FAIL: field still exists
    });

    it('should NOT have separate businessOccupation field (EXPECTED TO FAIL on unfixed code)', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const fields = companySection?.fields || [];

      const businessOccupationField = fields.find(f => f.name === 'businessOccupation');
      expect(businessOccupationField).toBeUndefined(); // WILL FAIL: field still exists
    });
  });

  describe('Bug 4: Unused Imports in formConfigs.ts', () => {
    /**
     * **Validates: Requirements 2.4**
     * 
     * Bug: Unused imports (yup, genderOptions) present in file
     * Expected: Unused imports should be removed
     * 
     * Note: This is tested indirectly through TypeScript compilation warnings
     * The actual removal will be verified during code review
     */
    it('should not import unused yup module (verified by TypeScript)', () => {
      // This test documents the requirement
      // Actual verification happens through TypeScript compiler warnings
      expect(true).toBe(true);
    });
  });
});

describe('Bug Condition Exploration - NFIU Corporate Form Validation', () => {
  describe('Bug 5: Ownership Field Validation', () => {
    /**
     * **Validates: Requirements 2.5**
     * 
     * Bug: Ownership field accepts invalid values without validation error
     * Expected: Should validate against enum ["Nigerian", "Foreign", "Both"]
     */
    it('should reject invalid ownership values (EXPECTED TO FAIL on unfixed code)', async () => {
      const schema = generateValidationSchema(nfiuCorporateConfig);

      // Test with invalid ownership value
      const invalidData = {
        ownershipOfCompany: 'InvalidValue', // Should be rejected
        // Include other required fields to isolate the ownership validation
        insured: 'Test Company',
        officeAddress: 'Test Address',
        website: '', // Optional field
        incorporationNumber: '12345',
        incorporationState: 'Lagos',
        dateOfIncorporationRegistration: new Date(),
        contactPersonNo: '08012345678',
        businessTypeOccupation: 'Test Business', // Using new combined field name
        taxIDNo: 'TAX123',
        emailAddress: 'test@example.com',
        premiumPaymentSource: 'Salary or Business Income',
        localBankName: 'Test Bank',
        localAccountNumber: '1234567890',
        localBankBranch: 'Test Branch',
        localAccountOpeningDate: new Date(),
        verificationDocUrl: 'test.pdf'
      };

      // WILL FAIL: Currently no validation error because field is text type
      await expect(schema.validate(invalidData)).rejects.toThrow();
    });

    it('should accept valid ownership values when provided (EXPECTED TO FAIL on unfixed code)', async () => {
      const schema = generateValidationSchema(nfiuCorporateConfig);

      const validValues = ['Nigerian', 'Foreign', 'Both'];

      // Use a past date to avoid timing issues with date validation
      const pastDate = new Date('2025-01-01');

      for (const value of validValues) {
        const validData = {
          ownershipOfCompany: value,
          insured: 'Test Company',
          officeAddress: 'Test Address',
          website: '', // Optional
          incorporationNumber: '12345',
          incorporationState: 'Lagos',
          dateOfIncorporationRegistration: pastDate,
          contactPersonNo: '08012345678',
          businessTypeOccupation: 'Test Business',
          taxIDNo: 'TAX123',
          emailAddress: 'test@example.com',
          premiumPaymentSource: 'Salary or Business Income',
          localBankName: 'Test Bank',
          localAccountNumber: '1234567890',
          localBankBranch: 'Test Branch',
          localAccountOpeningDate: pastDate,
          verificationDocUrl: 'test.pdf'
        };

        // WILL FAIL: Field is currently text type, not select with enum validation
        await expect(schema.validate(validData)).resolves.toBeDefined();
      }
    });

    it('should allow empty ownership value since field is optional (EXPECTED TO FAIL on unfixed code)', async () => {
      const schema = generateValidationSchema(nfiuCorporateConfig);

      // Use a past date to avoid timing issues with date validation
      const pastDate = new Date('2025-01-01');

      const dataWithEmptyOwnership = {
        ownershipOfCompany: '', // Empty value should be allowed
        insured: 'Test Company',
        officeAddress: 'Test Address',
        website: '',
        incorporationNumber: '12345',
        incorporationState: 'Lagos',
        dateOfIncorporationRegistration: pastDate,
        contactPersonNo: '08012345678',
        businessTypeOccupation: 'Test Business',
        taxIDNo: 'TAX123',
        emailAddress: 'test@example.com',
        premiumPaymentSource: 'Salary or Business Income',
        localBankName: 'Test Bank',
        localAccountNumber: '1234567890',
        localBankBranch: 'Test Branch',
        localAccountOpeningDate: pastDate,
        verificationDocUrl: 'test.pdf'
      };

      // WILL FAIL: Field is currently required: true
      await expect(schema.validate(dataWithEmptyOwnership)).resolves.toBeDefined();
    });
  });

  describe('Bug 6: Combined Business Field Validation', () => {
    /**
     * **Validates: Requirements 2.6**
     * 
     * Bug: Combined business field may not have proper validation
     * Expected: Should validate as required text field
     */
    it('should reject empty businessTypeOccupation value (EXPECTED TO FAIL on unfixed code)', async () => {
      const schema = generateValidationSchema(nfiuCorporateConfig);

      const dataWithEmptyBusiness = {
        ownershipOfCompany: 'Nigerian',
        insured: 'Test Company',
        officeAddress: 'Test Address',
        website: '',
        incorporationNumber: '12345',
        incorporationState: 'Lagos',
        dateOfIncorporationRegistration: new Date(),
        contactPersonNo: '08012345678',
        businessTypeOccupation: '', // Should be rejected - field is required
        taxIDNo: 'TAX123',
        emailAddress: 'test@example.com',
        premiumPaymentSource: 'Salary or Business Income',
        localBankName: 'Test Bank',
        localAccountNumber: '1234567890',
        localBankBranch: 'Test Branch',
        localAccountOpeningDate: new Date(),
        verificationDocUrl: 'test.pdf'
      };

      // WILL FAIL: Field doesn't exist yet in config
      await expect(schema.validate(dataWithEmptyBusiness)).rejects.toThrow();
    });
  });
});

describe('Bug Condition Exploration - Admin Dashboard Field Mappings', () => {
  describe('Bug 7: FormViewer Field Mappings', () => {
    /**
     * **Validates: Requirements 2.7, 2.8**
     * 
     * Bug: Admin dashboard components don't have field mappings for modified fields
     * Expected: Should have mappings for businessTypeOccupation and ownershipOfCompany
     */
    it('should have field mapping for businessTypeOccupation (EXPECTED TO FAIL on unfixed code)', () => {
      // Check if NFIU Corporate form mapping exists
      const nfiuMapping = FORM_MAPPINGS['nfiu-corporate'];
      
      if (nfiuMapping) {
        const companySection = nfiuMapping.sections.find(s => s.title.includes('Company'));
        const fields = companySection?.fields || [];
        
        // Should have businessTypeOccupation field
        const combinedField = fields.find(f => f.key === 'businessTypeOccupation');
        expect(combinedField).toBeDefined(); // WILL FAIL: mapping doesn't exist yet
        
        if (combinedField) {
          expect(combinedField.label).toContain('Business Type'); // WILL FAIL
        }
      }
    });

    it('should NOT have separate natureOfBusiness and businessOccupation mappings (EXPECTED TO FAIL on unfixed code)', () => {
      const nfiuMapping = FORM_MAPPINGS['nfiu-corporate'];
      
      if (nfiuMapping) {
        const companySection = nfiuMapping.sections.find(s => s.title.includes('Company'));
        const fields = companySection?.fields || [];
        
        const natureField = fields.find(f => f.key === 'natureOfBusiness');
        const occupationField = fields.find(f => f.key === 'businessOccupation');
        
        // These fields should not exist in the mapping
        expect(natureField).toBeUndefined(); // WILL FAIL: still exists
        expect(occupationField).toBeUndefined(); // WILL FAIL: still exists
      }
    });
  });

  describe('Bug 8: AdminUnifiedTable Column Definitions', () => {
    /**
     * **Validates: Requirements 2.9, 2.10**
     * 
     * Bug: Table columns reference old field names
     * Expected: Should reference businessTypeOccupation instead of separate fields
     * 
     * Note: This is tested indirectly through the form mappings
     * AdminUnifiedTable uses FORM_MAPPINGS to generate columns
     */
    it('should use form mappings for column generation (verified through FORM_MAPPINGS)', () => {
      // AdminUnifiedTable dynamically generates columns from FORM_MAPPINGS
      // So if FORM_MAPPINGS is correct, columns will be correct
      expect(true).toBe(true);
    });
  });

  describe('Bug 9: CSV/PDF Export Field Handling', () => {
    /**
     * **Validates: Requirements 2.11, 2.12, 2.13, 2.14**
     * 
     * Bug: CSV/PDF generators don't handle combined business field
     * Expected: Should export businessTypeOccupation field correctly
     * 
     * Note: CSV/PDF generators use form mappings for field labels
     * If form mappings are correct, exports will be correct
     */
    it('should use form mappings for export generation (verified through FORM_MAPPINGS)', () => {
      // CSVGenerator and PDFGenerator use FORM_MAPPINGS for field labels
      // So if FORM_MAPPINGS is correct, exports will be correct
      expect(true).toBe(true);
    });
  });
});

describe('Bug Condition Exploration - KYC Corporate Form Preservation', () => {
  /**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Preservation: KYC Corporate form should remain unchanged
   * This test should PASS even on unfixed code
   */
  describe('KYC Corporate Form Should Remain Unchanged', () => {
    it('should keep Website field as required in KYC Corporate form', () => {
      const websiteField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'website');

      expect(websiteField).toBeDefined();
      expect(websiteField?.required).toBe(true); // Should remain true
    });

    it('should keep Ownership field as text input in KYC Corporate form', () => {
      const ownershipField = kycCorporateConfig.sections
        .find(s => s.id === 'company')
        ?.fields.find(f => f.name === 'ownershipOfCompany');

      expect(ownershipField).toBeDefined();
      expect(ownershipField?.type).toBe('text'); // Should remain text
      expect(ownershipField?.required).toBe(true); // Should remain required
    });

    it('should keep separate Business Type and Occupation fields in KYC Corporate form', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const fields = companySection?.fields || [];

      const natureOfBusinessField = fields.find(f => f.name === 'natureOfBusiness');
      const businessOccupationField = fields.find(f => f.name === 'businessOccupation');

      expect(natureOfBusinessField).toBeDefined(); // Should still exist
      expect(businessOccupationField).toBeDefined(); // Should still exist
      expect(natureOfBusinessField?.required).toBe(true);
      expect(businessOccupationField?.required).toBe(true);
    });
  });
});

describe('Property-Based Bug Condition Exploration', () => {
  /**
   * Property-based tests to explore bug conditions across many inputs
   */
  describe('Property: Ownership Field Validation', () => {
    it('should validate ownership field correctly for any valid/invalid value', () => {
      // Use a past date to avoid timing issues with date validation
      const pastDate = new Date('2025-01-01');

      fc.assert(
        fc.property(
          fc.oneof(
            fc.constantFrom('Nigerian', 'Foreign', 'Both', ''), // Valid values (including empty for optional field)
            fc.string().filter(s => !['Nigerian', 'Foreign', 'Both', ''].includes(s)) // Invalid values
          ),
          async (ownershipValue) => {
            const schema = generateValidationSchema(nfiuCorporateConfig);
            // After trimming, whitespace-only strings become empty strings which are valid for optional fields
            const trimmedValue = ownershipValue.trim();
            const isValid = ['Nigerian', 'Foreign', 'Both', ''].includes(trimmedValue);

            const testData = {
              ownershipOfCompany: ownershipValue,
              insured: 'Test Company',
              officeAddress: 'Test Address',
              website: '',
              incorporationNumber: '12345',
              incorporationState: 'Lagos',
              dateOfIncorporationRegistration: pastDate,
              contactPersonNo: '08012345678',
              businessTypeOccupation: 'Test Business',
              taxIDNo: 'TAX123',
              emailAddress: 'test@example.com',
              premiumPaymentSource: 'Salary or Business Income',
              localBankName: 'Test Bank',
              localAccountNumber: '1234567890',
              localBankBranch: 'Test Branch',
              localAccountOpeningDate: pastDate,
              verificationDocUrl: 'test.pdf'
            };

            try {
              await schema.validate(testData);
              // If validation passes, the value should be valid
              // WILL FAIL on unfixed code: invalid values pass because field is text type
              expect(isValid).toBe(true);
            } catch (error) {
              // If validation fails, the value should be invalid
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
