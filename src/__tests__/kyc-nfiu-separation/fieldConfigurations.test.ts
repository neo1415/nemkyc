import { describe, it, expect } from 'vitest';
import {
  nfiuIndividualConfig,
  nfiuCorporateConfig,
  kycIndividualConfig,
  kycCorporateConfig,
} from '@/config/formConfigs';
import { generateValidationSchema, getDefaultValues } from '@/utils/formValidation';

describe('Field Configurations', () => {
  describe('NFIU Individual Configuration', () => {
    it('should have BVN field', () => {
      const personalSection = nfiuIndividualConfig.sections.find(s => s.id === 'personal');
      const bvnField = personalSection?.fields.find(f => f.name === 'BVN');
      
      expect(bvnField).toBeDefined();
      expect(bvnField?.required).toBe(true);
      expect(bvnField?.maxLength).toBe(11);
    });

    it('should have Tax ID as required', () => {
      const personalSection = nfiuIndividualConfig.sections.find(s => s.id === 'personal');
      const taxIdField = personalSection?.fields.find(f => f.name === 'taxIDNo');
      
      expect(taxIdField).toBeDefined();
      expect(taxIdField?.required).toBe(true);
    });

    it('should have all required NFIU fields', () => {
      const personalSection = nfiuIndividualConfig.sections.find(s => s.id === 'personal');
      const fieldNames = personalSection?.fields.map(f => f.name) || [];
      
      expect(fieldNames).toContain('firstName');
      expect(fieldNames).toContain('lastName');
      expect(fieldNames).toContain('NIN');
      expect(fieldNames).toContain('BVN');
      expect(fieldNames).toContain('taxIDNo');
      expect(fieldNames).toContain('sourceOfIncome');
    });
  });

  describe('KYC Individual Configuration', () => {
    it('should NOT have BVN field', () => {
      const personalSection = kycIndividualConfig.sections.find(s => s.id === 'personal');
      const bvnField = personalSection?.fields.find(f => f.name === 'BVN');
      
      expect(bvnField).toBeUndefined();
    });

    it('should have Tax ID as optional', () => {
      const personalSection = kycIndividualConfig.sections.find(s => s.id === 'personal');
      const taxIdField = personalSection?.fields.find(f => f.name === 'taxIDNo');
      
      expect(taxIdField).toBeDefined();
      expect(taxIdField?.required).toBe(false);
    });

    it('should NOT have Account Details section', () => {
      const accountsSection = kycIndividualConfig.sections.find(s => s.id === 'accounts');
      
      expect(accountsSection).toBeUndefined();
    });
  });

  describe('NFIU Corporate Configuration', () => {
    it('should have Account Details section', () => {
      const accountsSection = nfiuCorporateConfig.sections.find(s => s.id === 'accounts');
      
      expect(accountsSection).toBeDefined();
      expect(accountsSection?.fields.length).toBeGreaterThan(0);
    });

    it('should have required Naira account fields', () => {
      const accountsSection = nfiuCorporateConfig.sections.find(s => s.id === 'accounts');
      const fieldNames = accountsSection?.fields.map(f => f.name) || [];
      
      expect(fieldNames).toContain('localBankName');
      expect(fieldNames).toContain('localAccountNumber');
      expect(fieldNames).toContain('localBankBranch');
      expect(fieldNames).toContain('localAccountOpeningDate');
      
      // Check they are required
      const localBankName = accountsSection?.fields.find(f => f.name === 'localBankName');
      expect(localBankName?.required).toBe(true);
    });

    it('should have optional Domiciliary account fields', () => {
      const accountsSection = nfiuCorporateConfig.sections.find(s => s.id === 'accounts');
      const foreignBankName = accountsSection?.fields.find(f => f.name === 'foreignBankName');
      
      expect(foreignBankName).toBeDefined();
      expect(foreignBankName?.required).toBe(false);
    });

    it('should have Premium Payment Source field (mandatory)', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const premiumPaymentSource = companySection?.fields.find(f => f.name === 'premiumPaymentSource');
      
      expect(premiumPaymentSource).toBeDefined();
      expect(premiumPaymentSource?.required).toBe(true);
    });

    it('should have "Email Address of the Company" field (mandatory)', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const emailField = companySection?.fields.find(f => f.name === 'emailAddress');
      
      expect(emailField).toBeDefined();
      expect(emailField?.label).toBe('Email Address of the Company');
      expect(emailField?.required).toBe(true);
    });

    it('should NOT have Name of Contact Person field', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const contactPersonName = companySection?.fields.find(f => f.name === 'contactPersonName');
      
      expect(contactPersonName).toBeUndefined();
    });

    it('should NOT have Estimated Turnover field', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const estimatedTurnover = companySection?.fields.find(f => f.name === 'estimatedTurnover');
      
      expect(estimatedTurnover).toBeUndefined();
    });

    it('should NOT have Office Location field', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const officeLocation = companySection?.fields.find(f => f.name === 'officeLocation');
      
      expect(officeLocation).toBeUndefined();
    });

    it('should NOT have Name of Branch Office field', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const branchOffice = companySection?.fields.find(f => f.name === 'branchOffice' || f.name === 'nameOfBranchOffice');
      
      expect(branchOffice).toBeUndefined();
    });

    it('should have Tax ID as mandatory', () => {
      const companySection = nfiuCorporateConfig.sections.find(s => s.id === 'company');
      const taxIdField = companySection?.fields.find(f => f.name === 'taxIDNo');
      
      expect(taxIdField).toBeDefined();
      expect(taxIdField?.required).toBe(true);
    });

    // Note: Director field tests would go here if directors section was in config
    // For now, directors are handled separately in the form component
  });

  describe('KYC Corporate Configuration', () => {
    it('should NOT have Account Details section', () => {
      const accountsSection = kycCorporateConfig.sections.find(s => s.id === 'accounts');
      
      expect(accountsSection).toBeUndefined();
    });

    it('should have Contact Person fields', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const fieldNames = companySection?.fields.map(f => f.name) || [];
      
      expect(fieldNames).toContain('contactPersonName');
      expect(fieldNames).toContain('contactPersonEmail');
    });

    it('should have Estimated Turnover field', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const turnoverField = companySection?.fields.find(f => f.name === 'estimatedTurnover');
      
      expect(turnoverField).toBeDefined();
      expect(turnoverField?.required).toBe(true);
    });

    it('should have Name of Contact Person field (mandatory)', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const contactPersonName = companySection?.fields.find(f => f.name === 'contactPersonName');
      
      expect(contactPersonName).toBeDefined();
      expect(contactPersonName?.label).toBe('Name of Contact Person');
      expect(contactPersonName?.required).toBe(true);
    });

    it('should have "Contact Person\'s Email Address" field (mandatory)', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const emailField = companySection?.fields.find(f => f.name === 'contactPersonEmail');
      
      expect(emailField).toBeDefined();
      expect(emailField?.label).toBe("Contact Person's Email Address");
      expect(emailField?.required).toBe(true);
    });

    it('should have Estimated Turnover field (mandatory)', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const turnoverField = companySection?.fields.find(f => f.name === 'estimatedTurnover');
      
      expect(turnoverField).toBeDefined();
      expect(turnoverField?.required).toBe(true);
    });

    it('should have Tax ID as optional', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const taxIdField = companySection?.fields.find(f => f.name === 'taxIDNo');
      
      expect(taxIdField).toBeDefined();
      expect(taxIdField?.required).toBe(false);
    });

    it('should NOT have Premium Payment Source field', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const premiumPaymentSource = companySection?.fields.find(f => f.name === 'premiumPaymentSource');
      
      expect(premiumPaymentSource).toBeUndefined();
    });

    it('should NOT have Office Location field', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const officeLocation = companySection?.fields.find(f => f.name === 'officeLocation');
      
      expect(officeLocation).toBeUndefined();
    });

    it('should NOT have Name of Branch Office field', () => {
      const companySection = kycCorporateConfig.sections.find(s => s.id === 'company');
      const branchOffice = companySection?.fields.find(f => f.name === 'branchOffice' || f.name === 'nameOfBranchOffice');
      
      expect(branchOffice).toBeUndefined();
    });

    // Note: Director field tests would go here if directors section was in config
    // For now, directors are handled separately in the form component
    // KYC directors should NOT have BVN, Residential Address, or Tax ID fields
  });

  describe('Validation Schema Generation', () => {
    it('should generate valid schema for NFIU Individual', () => {
      const schema = generateValidationSchema(nfiuIndividualConfig);
      
      expect(schema).toBeDefined();
      expect(typeof schema.validateSync).toBe('function');
    });

    it('should generate valid schema for KYC Individual', () => {
      const schema = generateValidationSchema(kycIndividualConfig);
      
      expect(schema).toBeDefined();
      expect(typeof schema.validateSync).toBe('function');
    });

    it('should generate valid schema for NFIU Corporate', () => {
      const schema = generateValidationSchema(nfiuCorporateConfig);
      
      expect(schema).toBeDefined();
      expect(typeof schema.validateSync).toBe('function');
    });

    it('should generate valid schema for KYC Corporate', () => {
      const schema = generateValidationSchema(kycCorporateConfig);
      
      expect(schema).toBeDefined();
      expect(typeof schema.validateSync).toBe('function');
    });
  });

  describe('Default Values Generation', () => {
    it('should generate default values for NFIU Individual', () => {
      const defaults = getDefaultValues(nfiuIndividualConfig);
      
      expect(defaults).toBeDefined();
      expect(defaults.firstName).toBe('');
      expect(defaults.BVN).toBe('');
      expect(defaults.dateOfBirth).toBeNull();
    });

    it('should generate default values for KYC Individual', () => {
      const defaults = getDefaultValues(kycIndividualConfig);
      
      expect(defaults).toBeDefined();
      expect(defaults.firstName).toBe('');
      expect(defaults.BVN).toBeUndefined(); // BVN should not exist in KYC
      expect(defaults.dateOfBirth).toBeNull();
    });
  });
});
