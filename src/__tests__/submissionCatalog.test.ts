import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  COMPLIANCE_COLLECTION_NAMES,
  SUBMISSION_COLLECTION_NAMES,
} from '../config/submissionCatalog';

describe('customer dashboard submission catalog', () => {
  it('contains each durable collection exactly once', () => {
    expect(new Set(SUBMISSION_COLLECTION_NAMES).size).toBe(SUBMISSION_COLLECTION_NAMES.length);
    expect(SUBMISSION_COLLECTION_NAMES).toHaveLength(35);
  });

  it('includes KYC, NFIU and every CDD collection as compliance submissions', () => {
    expect(COMPLIANCE_COLLECTION_NAMES).toEqual(new Set([
      'Individual-kyc-form',
      'corporate-kyc-form',
      'individual-nfiu-form',
      'corporate-nfiu-form',
      'individual-kyc',
      'corporate-kyc',
      'brokers-kyc',
      'agentsCDD',
      'partnersCDD',
    ]));
  });

  it('includes legacy, smart protection and agricultural claims', () => {
    expect(SUBMISSION_COLLECTION_NAMES).toEqual(expect.arrayContaining([
      'motor-claims',
      'fire-special-perils-claims',
      'professional-indemnity-claims',
      'smart-motorist-protection-claims',
      'nem-home-protection-claims',
      'farm-property-produce-claims',
      'livestock-claims',
      'poultry-claims',
      'fishery-fish-farm-claims',
      'yield-index-claims',
      'multi-perils-crop-claims',
    ]));
  });
});

describe('CDD flow parity guard', () => {
  const pages = [
    'IndividualCDD.tsx',
    'CorporateCDD.tsx',
    'NaicomCorporateCDD.tsx',
    'PartnersCDD.tsx',
    'NaicomPartnersCDD.tsx',
    'BrokersCDD.tsx',
    'AgentsCDD.tsx',
  ];

  it.each(pages)('%s keeps authenticated submit, verification, document matching, drafts, and summary', (page) => {
    const source = readFileSync(join(process.cwd(), 'src', 'pages', 'cdd', page), 'utf8');

    expect(source).toContain('useEnhancedFormSubmit');
    expect(source).toContain('VerifiedDocumentUpload');
    expect(source).toMatch(/VerifiedIdentifierField|useAutoFill/);
    expect(source).toContain('useFormDraft');
    expect(source).toContain('FormSummaryDialog');
    expect(source).toContain('<ErrorModal');
  });

  it.each([
    ['CorporateCDD.tsx', ['fieldName="identification"']],
    ['NaicomCorporateCDD.tsx', ['fieldName="identification"', 'fieldName="cacForm"', 'documentType="naicom"']],
    ['PartnersCDD.tsx', ['fieldName="directorId1"', 'fieldName="directorId2"', 'fieldName="cacStatusReport"']],
    ['NaicomPartnersCDD.tsx', ['fieldName="directorId1"', 'fieldName="directorId2"', 'fieldName="cacStatusReport"', 'fieldName="naicomLicenseCertificate"', 'documentType="naicom"']],
    ['AgentsCDD.tsx', ['fieldName="agentId"', 'fieldName="naicomCertificate"', 'documentType="naicom"']],
    ['BrokersCDD.tsx', ['fieldName="identification"', 'fieldName="identification2"', 'fieldName="NAICOMForm"', 'documentType="naicom"']],
  ])('%s verifies director identification and NAICOM documents where applicable', (page, expectedControls) => {
    const source = readFileSync(join(process.cwd(), 'src', 'pages', 'cdd', page as string), 'utf8');
    for (const control of expectedControls as string[]) expect(source).toContain(control);
  });
});

describe('global customer feedback', () => {
  it('mounts the Sonner notification renderer used by submission and validation services', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf8');
    expect(source).toContain('Toaster as SonnerToaster');
    expect(source).toContain('<SonnerToaster');
  });
});
