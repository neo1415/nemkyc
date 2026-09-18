import { COMPLIANCE_COLLECTION_NAMES, SUBMISSION_COLLECTIONS } from '@/config/submissionCatalog';

/** Customer dashboard groupings: claims plus the three compliance form families. */
export type SubmissionFamily = 'claims' | 'kyc' | 'cdd' | 'nfiu';

export const SUBMISSION_FAMILIES: readonly SubmissionFamily[] = ['claims', 'kyc', 'cdd', 'nfiu'];

export const FAMILY_LABELS: Record<SubmissionFamily, string> = {
  claims: 'Claims',
  kyc: 'KYC',
  cdd: 'CDD',
  nfiu: 'NFIU',
};

const CLAIM_COLLECTION_NAMES = new Set(
  SUBMISSION_COLLECTIONS.filter(item => item.category === 'claim').map(item => item.collection),
);

/** True when the collection holds claims (catalog first, then a name-based fallback for legacy collections). */
export function isClaimCollection(collection: string | undefined | null): boolean {
  if (!collection) return false;
  if (CLAIM_COLLECTION_NAMES.has(collection)) return true;
  if (COMPLIANCE_COLLECTION_NAMES.has(collection)) return false;
  return /claim/i.test(collection);
}

const detectComplianceFamily = (value: string | undefined | null): Exclude<SubmissionFamily, 'claims'> | null => {
  const text = String(value || '').toLowerCase();
  if (!text) return null;
  if (text.includes('nfiu')) return 'nfiu';
  if (text.includes('cdd')) return 'cdd';
  if (text.includes('kyc')) return 'kyc';
  return null;
};

/**
 * Infers the dashboard family for a submission. Claims come from the catalog; compliance forms are
 * grouped by the form type first (e.g. "Corporate CDD") and the collection name second
 * (e.g. "agentsCDD", "individual-nfiu-form"). Unrecognised compliance forms land under KYC.
 */
export function submissionFamily(collection: string, formType?: string | null): SubmissionFamily {
  if (isClaimCollection(collection)) return 'claims';
  return detectComplianceFamily(formType) || detectComplianceFamily(collection) || 'kyc';
}
