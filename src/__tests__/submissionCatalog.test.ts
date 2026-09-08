import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  COMPLIANCE_COLLECTION_NAMES,
  SUBMISSION_COLLECTION_NAMES,
} from '../config/submissionCatalog';
import { getFormPageUrl } from '../hooks/useAuthRequiredSubmit';

const CLAIM_FORM_PAGES = [
  ['Motor Claim', 'MotorClaim.tsx', '/claims/motor', 'useEnhancedFormSubmit'],
  ['Professional Indemnity Claim', 'ProfessionalIndemnityClaimForm.tsx', '/claims/professional-indemnity', 'useAuthRequiredSubmit'],
  ['Public Liability Claim', 'PublicLiabilityClaimForm.tsx', '/claims/public-liability', 'useAuthRequiredSubmit'],
  ['Employers Liability Claim', 'EmployersLiabilityClaim.tsx', '/claims/employers-liability', 'useAuthRequiredSubmit'],
  ['Combined GPA Employers Liability Claim', 'CombinedGPAEmployersLiabilityClaim.tsx', '/claims/combined-gpa-employers-liability', 'useAuthRequiredSubmit'],
  ['Burglary Claim', 'BurglaryClaimForm.tsx', '/claims/burglary', 'useAuthRequiredSubmit'],
  ['Group Personal Accident Claim', 'GroupPersonalAccidentClaim.tsx', '/claims/group-personal-accident', 'useAuthRequiredSubmit'],
  ['Fire Special Perils Claim', 'FireSpecialPerilsClaim.tsx', '/claims/fire-special-perils', 'useAuthRequiredSubmit'],
  ['Rent Assurance Claim', 'RentAssuranceClaim.tsx', '/claims/rent-assurance', 'useAuthRequiredSubmit'],
  ['Money Insurance Claim', 'MoneyInsuranceClaim.tsx', '/claims/money-insurance', 'useAuthRequiredSubmit'],
  ['Goods In Transit Claim', 'GoodsInTransitClaim.tsx', '/claims/goods-in-transit', 'useAuthRequiredSubmit'],
  ['Contractors Plant & Machinery Claim', 'ContractorsPlantMachineryClaim.tsx', '/claims/contractors-plant-machinery', 'useAuthRequiredSubmit'],
  ['All Risk Claim', 'AllRiskClaim.tsx', '/claims/all-risk', 'useAuthRequiredSubmit'],
  ['Fidelity Guarantee Claim', 'FidelityGuaranteeClaim.tsx', '/claims/fidelity-guarantee', 'useAuthRequiredSubmit'],
  ['Smart Motorist Protection Claim', 'SmartMotoristProtectionClaim.tsx', '/claims/smart-motorist-protection', 'useEnhancedFormSubmit'],
  ['Smart Students Protection Claim', 'SmartStudentsProtectionClaim.tsx', '/claims/smart-students-protection', 'useEnhancedFormSubmit'],
  ['Smart Traveller Protection Claim', 'SmartTravellerProtectionClaim.tsx', '/claims/smart-traveller-protection', 'useEnhancedFormSubmit'],
  ['Smart Artisan Protection Claim', 'SmartArtisanProtectionClaim.tsx', '/claims/smart-artisan-protection', 'useEnhancedFormSubmit'],
  ['Smart Generation Z Protection Claim', 'SmartGenerationZProtectionClaim.tsx', '/claims/smart-generation-z-protection', 'useEnhancedFormSubmit'],
  ['NEM Home Protection Claim', 'NEMHomeProtectionClaim.tsx', '/claims/nem-home-protection', 'useEnhancedFormSubmit'],
  ['Farm Property and Produce Insurance Claim', 'FarmPropertyProduceClaim.tsx', '/claims/farm-property-produce', 'useEnhancedFormSubmit'],
  ['Livestock Insurance Claim', 'LivestockClaim.tsx', '/claims/livestock', 'useEnhancedFormSubmit'],
  ['Poultry Claim', 'PoultryClaim.tsx', '/claims/poultry', 'useEnhancedFormSubmit'],
  ['Fishery and Fish Farm Insurance Claim', 'FisheryFishFarmClaim.tsx', '/claims/fishery-fish-farm', 'useEnhancedFormSubmit'],
  ['Yield Index Insurance Claim', 'YieldIndexInsuranceClaim.tsx', '/claims/yield-index-insurance', 'useEnhancedFormSubmit'],
  ['Multi-Perils Crop Insurance Claim', 'MultiPerilsCropClaim.tsx', '/claims/multi-perils-crop', 'useEnhancedFormSubmit'],
] as const;

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

describe('all claims form flow parity', () => {
  it('covers all 26 claim forms', () => {
    expect(CLAIM_FORM_PAGES).toHaveLength(26);
  });

  it.each(CLAIM_FORM_PAGES)(
    '%s has the expected route, auth-aware submission, drafts, validation, summary, and success UX',
    (formType, page, route, submissionHook) => {
      const source = readFileSync(join(process.cwd(), 'src', 'pages', 'claims', page), 'utf8');
      expect(getFormPageUrl(formType)).toBe(route);
      expect(source).toContain(submissionHook);
      expect(source).toContain('useFormDraft');
      expect(source).toContain('MultiStepForm');
      expect(source).toMatch(/FormSummaryDialog|setShowSummary\(true\)/);
      expect(source).toContain('SuccessModal');
    },
  );

  it('derives every backend claim upload root from the canonical claims registry', () => {
    const serverSource = readFileSync(join(process.cwd(), 'apps', 'backend', 'server.js'), 'utf8');
    expect(serverSource).toContain('...getAllClaimCollections()');
  });

  it.each(CLAIM_FORM_PAGES)('%s renders entered information in its final review', (_formType, page) => {
    const source = readFileSync(join(process.cwd(), 'src', 'pages', 'claims', page), 'utf8');
    expect(source).toMatch(/FormSummaryDialog|CompleteFormReview/);

    if (!source.includes('FormSummaryDialog')) {
      expect(source).toContain('<CompleteFormReview formData={watchedValues} />');
    }
  });

  it('downloads admin documents through the authenticated application endpoint', () => {
    const viewerPaths = [
      ['pages', 'admin', 'FormViewer.tsx'],
      ['pages', 'admin', 'AgentsCDDViewer.tsx'],
      ['pages', 'admin', 'PartnersCDDViewer.tsx'],
      ['pages', 'dashboard', 'UserFormViewer.tsx'],
    ];
    const viewers = viewerPaths.map((parts) =>
      readFileSync(join(process.cwd(), 'src', ...parts), 'utf8'));
    const service = readFileSync(join(process.cwd(), 'src', 'services', 'secureDocumentService.ts'), 'utf8');
    for (const viewer of viewers) {
      expect(viewer).toContain('downloadSubmissionDocument');
      expect(viewer).not.toContain('getDownloadURL');
      expect(viewer).not.toMatch(/window\.open\([^)]*(?:file|url)/i);
    }
    expect(service).toContain('/documents/');
    expect(service).toContain("'CSRF-Token'");
    expect(service).toContain('Authorization');
  });
});
