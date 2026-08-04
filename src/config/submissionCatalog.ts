export type SubmissionCategory = 'compliance' | 'claim';

export interface SubmissionCollectionConfig {
  collection: string;
  category: SubmissionCategory;
}

/** Every durable collection produced by the customer submission backend. */
export const SUBMISSION_COLLECTIONS: readonly SubmissionCollectionConfig[] = [
  { collection: 'Individual-kyc-form', category: 'compliance' },
  { collection: 'corporate-kyc-form', category: 'compliance' },
  { collection: 'individual-nfiu-form', category: 'compliance' },
  { collection: 'corporate-nfiu-form', category: 'compliance' },
  { collection: 'individual-kyc', category: 'compliance' },
  { collection: 'corporate-kyc', category: 'compliance' },
  { collection: 'brokers-kyc', category: 'compliance' },
  { collection: 'agentsCDD', category: 'compliance' },
  { collection: 'partnersCDD', category: 'compliance' },
  { collection: 'motor-claims', category: 'claim' },
  { collection: 'fire-special-perils-claims', category: 'claim' },
  { collection: 'burglary-claims', category: 'claim' },
  { collection: 'all-risk-claims', category: 'claim' },
  { collection: 'goods-in-transit-claims', category: 'claim' },
  { collection: 'money-insurance-claims', category: 'claim' },
  { collection: 'public-liability-claims', category: 'claim' },
  { collection: 'employers-liability-claims', category: 'claim' },
  { collection: 'group-personal-accident-claims', category: 'claim' },
  { collection: 'fidelity-guarantee-claims', category: 'claim' },
  { collection: 'rent-assurance-claims', category: 'claim' },
  { collection: 'contractors-claims', category: 'claim' },
  { collection: 'combined-gpa-employers-liability-claims', category: 'claim' },
  { collection: 'professional-indemnity-claims', category: 'claim' },
  { collection: 'smart-motorist-protection-claims', category: 'claim' },
  { collection: 'smart-students-protection-claims', category: 'claim' },
  { collection: 'smart-traveller-protection-claims', category: 'claim' },
  { collection: 'smart-artisan-protection-claims', category: 'claim' },
  { collection: 'smart-generation-z-protection-claims', category: 'claim' },
  { collection: 'nem-home-protection-claims', category: 'claim' },
  { collection: 'farm-property-produce-claims', category: 'claim' },
  { collection: 'livestock-claims', category: 'claim' },
  { collection: 'poultry-claims', category: 'claim' },
  { collection: 'fishery-fish-farm-claims', category: 'claim' },
  { collection: 'yield-index-claims', category: 'claim' },
  { collection: 'multi-perils-crop-claims', category: 'claim' },
] as const;

export const SUBMISSION_COLLECTION_NAMES = SUBMISSION_COLLECTIONS.map(item => item.collection);
export const COMPLIANCE_COLLECTION_NAMES = new Set(
  SUBMISSION_COLLECTIONS.filter(item => item.category === 'compliance').map(item => item.collection),
);
