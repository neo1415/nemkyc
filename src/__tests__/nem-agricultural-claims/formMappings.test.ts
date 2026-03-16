import { FORM_MAPPINGS, getFormMapping } from '@/config/formMappings';

describe('Agricultural Claims Form Mappings', () => {
  describe('Farm Property & Produce Claims Mapping', () => {
    const mapping = getFormMapping('farm-property-produce-claims');

    test('should have correct title', () => {
      expect(mapping).toBeDefined();
      expect(mapping?.title).toBe('Farm Property & Produce Insurance Claim');
    });

    test('should have 5 sections', () => {
      expect(mapping?.sections).toHaveLength(5);
    });

    test('should have correct section titles', () => {
      const sectionTitles = mapping?.sections.map(s => s.title);
      expect(sectionTitles).toEqual([
        'Policy & Insured Details',
        'Cause of Loss',
        'Property Lost or Damaged',
        'Declaration & Signature',
        'System Information'
      ]);
    });

    test('should have all required fields in Policy & Insured Details', () => {
      const section = mapping?.sections[0];
      const fieldKeys = section?.fields.map(f => f.key);
      expect(fieldKeys).toContain('policyNumber');
      expect(fieldKeys).toContain('periodOfCoverFrom');
      expect(fieldKeys).toContain('periodOfCoverTo');
      expect(fieldKeys).toContain('insuredName');
      expect(fieldKeys).toContain('address');
      expect(fieldKeys).toContain('phone');
      expect(fieldKeys).toContain('email');
    });

    test('should have conditional field pestDiseaseSpecification', () => {
      const section = mapping?.sections[1]; // Cause of Loss
      const conditionalField = section?.fields.find(f => f.key === 'pestDiseaseSpecification');
      expect(conditionalField).toBeDefined();
      expect(conditionalField?.conditional).toEqual({
        dependsOn: 'causeOfLoss',
        value: 'Outbreak of Pest and Disease'
      });
    });

    test('should have array field damagedItems', () => {
      const section = mapping?.sections[2]; // Property Lost or Damaged
      const arrayField = section?.fields.find(f => f.key === 'damagedItems');
      expect(arrayField).toBeDefined();
      expect(arrayField?.type).toBe('array');
    });

    test('should mark system fields as non-editable', () => {
      const section = mapping?.sections[4]; // System Information
      const statusField = section?.fields.find(f => f.key === 'status');
      const submittedAtField = section?.fields.find(f => f.key === 'submittedAt');
      const createdAtField = section?.fields.find(f => f.key === 'createdAt');
      
      expect(statusField?.editable).toBe(true); // Status is editable by admin
      expect(submittedAtField?.editable).toBe(false);
      expect(createdAtField?.editable).toBe(false);
    });

    test('should mark declaration fields as non-editable', () => {
      const section = mapping?.sections[3]; // Declaration & Signature
      const agreeField = section?.fields.find(f => f.key === 'agreeToDataPrivacy');
      const declarationField = section?.fields.find(f => f.key === 'declarationTrue');
      
      expect(agreeField?.editable).toBe(false);
      expect(declarationField?.editable).toBe(false);
    });

    test('should have file upload fields', () => {
      const section = mapping?.sections[3]; // Declaration & Signature
      const signatureUpload = section?.fields.find(f => f.key === 'signatureUpload');
      const receipts = section?.fields.find(f => f.key === 'receiptsAndInvoices');
      
      expect(signatureUpload?.type).toBe('file');
      expect(receipts?.type).toBe('file');
    });
  });

  describe('Livestock Claims Mapping', () => {
    const mapping = getFormMapping('livestock-claims');

    test('should have correct title', () => {
      expect(mapping).toBeDefined();
      expect(mapping?.title).toBe('Livestock Insurance Claim');
    });

    test('should have 5 sections', () => {
      expect(mapping?.sections).toHaveLength(5);
    });

    test('should have correct section titles', () => {
      const sectionTitles = mapping?.sections.map(s => s.title);
      expect(sectionTitles).toEqual([
        'Policy & Insured Details',
        'Cause of Loss',
        'Claim Details',
        'Declaration & Signature',
        'System Information'
      ]);
    });

    test('should have all required fields in Policy & Insured Details', () => {
      const section = mapping?.sections[0];
      const fieldKeys = section?.fields.map(f => f.key);
      expect(fieldKeys).toContain('policyNumber');
      expect(fieldKeys).toContain('periodOfCoverFrom');
      expect(fieldKeys).toContain('periodOfCoverTo');
      expect(fieldKeys).toContain('insuredName');
      expect(fieldKeys).toContain('address');
      expect(fieldKeys).toContain('phone');
      expect(fieldKeys).toContain('email');
    });

    test('should have conditional field diseaseSpecification', () => {
      const section = mapping?.sections[1]; // Cause of Loss
      const conditionalField = section?.fields.find(f => f.key === 'diseaseSpecification');
      expect(conditionalField).toBeDefined();
      expect(conditionalField?.conditional).toEqual({
        dependsOn: 'causeOfDeath',
        value: 'Outbreak of Pest and Disease'
      });
    });

    test('should have conditional field otherCauseExplanation', () => {
      const section = mapping?.sections[1]; // Cause of Loss
      const conditionalField = section?.fields.find(f => f.key === 'otherCauseExplanation');
      expect(conditionalField).toBeDefined();
      expect(conditionalField?.conditional).toEqual({
        dependsOn: 'causeOfDeath',
        value: 'Other cause of loss not listed'
      });
    });

    test('should have all claim detail fields', () => {
      const section = mapping?.sections[2]; // Claim Details
      const fieldKeys = section?.fields.map(f => f.key);
      expect(fieldKeys).toContain('livestockType');
      expect(fieldKeys).toContain('numberOfAnimals');
      expect(fieldKeys).toContain('ageOfAnimals');
      expect(fieldKeys).toContain('valuePerAnimal');
      expect(fieldKeys).toContain('totalClaimValue');
      expect(fieldKeys).toContain('circumstancesOfLoss');
    });

    test('should have correct field types for claim details', () => {
      const section = mapping?.sections[2]; // Claim Details
      const numberOfAnimals = section?.fields.find(f => f.key === 'numberOfAnimals');
      const valuePerAnimal = section?.fields.find(f => f.key === 'valuePerAnimal');
      const totalClaimValue = section?.fields.find(f => f.key === 'totalClaimValue');
      
      expect(numberOfAnimals?.type).toBe('number');
      expect(valuePerAnimal?.type).toBe('currency');
      expect(totalClaimValue?.type).toBe('currency');
    });

    test('should mark system fields as non-editable', () => {
      const section = mapping?.sections[4]; // System Information
      const statusField = section?.fields.find(f => f.key === 'status');
      const submittedAtField = section?.fields.find(f => f.key === 'submittedAt');
      const createdAtField = section?.fields.find(f => f.key === 'createdAt');
      
      expect(statusField?.editable).toBe(true); // Status is editable by admin
      expect(submittedAtField?.editable).toBe(false);
      expect(createdAtField?.editable).toBe(false);
    });

    test('should mark declaration fields as non-editable', () => {
      const section = mapping?.sections[3]; // Declaration & Signature
      const agreeField = section?.fields.find(f => f.key === 'agreeToDataPrivacy');
      const declarationField = section?.fields.find(f => f.key === 'declarationTrue');
      
      expect(agreeField?.editable).toBe(false);
      expect(declarationField?.editable).toBe(false);
    });

    test('should have file upload fields', () => {
      const section = mapping?.sections[3]; // Declaration & Signature
      const signatureUpload = section?.fields.find(f => f.key === 'signatureUpload');
      const medicalReports = section?.fields.find(f => f.key === 'medicalPostMortemReports');
      const receipts = section?.fields.find(f => f.key === 'receiptsInvoicesMortalityRecords');
      
      expect(signatureUpload?.type).toBe('file');
      expect(medicalReports?.type).toBe('file');
      expect(receipts?.type).toBe('file');
    });
  });

  describe('Form Mapping Consistency', () => {
    test('both mappings should have System Information section', () => {
      const fppMapping = getFormMapping('farm-property-produce-claims');
      const livMapping = getFormMapping('livestock-claims');
      
      const fppSystemSection = fppMapping?.sections.find(s => s.title === 'System Information');
      const livSystemSection = livMapping?.sections.find(s => s.title === 'System Information');
      
      expect(fppSystemSection).toBeDefined();
      expect(livSystemSection).toBeDefined();
    });

    test('both mappings should have Declaration & Signature section', () => {
      const fppMapping = getFormMapping('farm-property-produce-claims');
      const livMapping = getFormMapping('livestock-claims');
      
      const fppDeclarationSection = fppMapping?.sections.find(s => s.title === 'Declaration & Signature');
      const livDeclarationSection = livMapping?.sections.find(s => s.title === 'Declaration & Signature');
      
      expect(fppDeclarationSection).toBeDefined();
      expect(livDeclarationSection).toBeDefined();
    });

    test('both mappings should have ticketId field', () => {
      const fppMapping = getFormMapping('farm-property-produce-claims');
      const livMapping = getFormMapping('livestock-claims');
      
      const fppSystemSection = fppMapping?.sections.find(s => s.title === 'System Information');
      const livSystemSection = livMapping?.sections.find(s => s.title === 'System Information');
      
      const fppTicketId = fppSystemSection?.fields.find(f => f.key === 'ticketId');
      const livTicketId = livSystemSection?.fields.find(f => f.key === 'ticketId');
      
      expect(fppTicketId).toBeDefined();
      expect(livTicketId).toBeDefined();
    });
  });
});
