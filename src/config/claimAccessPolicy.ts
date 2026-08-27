import { User, UserRole } from '../types';
import { normalizeRole } from '../utils/roleNormalization';

export interface ClaimNavItem {
  name: string;
  href: string;
  collection: string;
}

/** Mirrors backend CLAIM_FORM_CONFIGS unit email routing (Feb 2026). */
const CLAIM_UNIT_CONTACTS: ReadonlyArray<{
  collection: string;
  unitRecipientEmail: string;
  unitAdminEmail: string;
}> = [
  { collection: 'motor-claims', unitRecipientEmail: 'motorclaimunit@nem-insurance.com', unitAdminEmail: 'folahanoluwadaisi@nem-insurance.com' },
  { collection: 'professional-indemnity-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'public-liability-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'employers-liability-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'combined-gpa-employers-liability-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'burglary-claims', unitRecipientEmail: 'fire&marineclaims@nem-insurance.com', unitAdminEmail: 'jumokeamuni@nem-insurance.com' },
  { collection: 'group-personal-accident-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'fire-special-perils-claims', unitRecipientEmail: 'fire&marineclaims@nem-insurance.com', unitAdminEmail: 'jumokeamuni@nem-insurance.com' },
  { collection: 'rent-assurance-claims', unitRecipientEmail: 'fire&marineclaims@nem-insurance.com', unitAdminEmail: 'jumokeamuni@nem-insurance.com' },
  { collection: 'money-insurance-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'goods-in-transit-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'contractors-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'all-risk-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'fidelity-guarantee-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'smart-motorist-protection-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'smart-students-protection-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'smart-traveller-protection-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'smart-artisan-protection-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'smart-generation-z-protection-claims', unitRecipientEmail: 'genaccidentclaims@nem-insurance.com', unitAdminEmail: 'nathanielaina@nem-insurance.com' },
  { collection: 'nem-home-protection-claims', unitRecipientEmail: 'fire&marineclaims@nem-insurance.com', unitAdminEmail: 'jumokeamuni@nem-insurance.com' },
  { collection: 'livestock-claims', unitRecipientEmail: 'specialriskclaims@nem-insurance.com', unitAdminEmail: 'abimboladada@nem-insurance.com' },
  { collection: 'farm-property-produce-claims', unitRecipientEmail: 'specialriskclaims@nem-insurance.com', unitAdminEmail: 'abimboladada@nem-insurance.com' },
  { collection: 'poultry-claims', unitRecipientEmail: 'specialriskclaims@nem-insurance.com', unitAdminEmail: 'abimboladada@nem-insurance.com' },
  { collection: 'fishery-fish-farm-claims', unitRecipientEmail: 'specialriskclaims@nem-insurance.com', unitAdminEmail: 'abimboladada@nem-insurance.com' },
  { collection: 'yield-index-claims', unitRecipientEmail: 'specialriskclaims@nem-insurance.com', unitAdminEmail: 'abimboladada@nem-insurance.com' },
  { collection: 'multi-perils-crop-claims', unitRecipientEmail: 'specialriskclaims@nem-insurance.com', unitAdminEmail: 'abimboladada@nem-insurance.com' }
];

const COLLECTION_ALIASES: Record<string, string> = {
  'contractors-plant-machinery-claims': 'contractors-claims'
};

export const CLAIM_NAV_ITEMS: ClaimNavItem[] = [
  { name: 'Motor Claims', href: '/admin/motor-claims', collection: 'motor-claims' },
  { name: 'Fire & Special Perils', href: '/admin/fire-special-perils-claims', collection: 'fire-special-perils-claims' },
  { name: 'Employers Liability', href: '/admin/employers-liability-claims', collection: 'employers-liability-claims' },
  { name: 'All Risk Claims', href: '/admin/all-risk-claims', collection: 'all-risk-claims' },
  { name: 'Professional Indemnity', href: '/admin/professional-indemnity-claims', collection: 'professional-indemnity-claims' },
  { name: 'Public Liability', href: '/admin/public-liability-claims', collection: 'public-liability-claims' },
  { name: 'Combined GPA Employers Liability', href: '/admin/combined-gpa-employers-liability-claims', collection: 'combined-gpa-employers-liability-claims' },
  { name: 'Group Personal Accident', href: '/admin/group-personal-accident-claims', collection: 'group-personal-accident-claims' },
  { name: 'Goods In Transit', href: '/admin/goods-in-transit-claims', collection: 'goods-in-transit-claims' },
  { name: 'Rent Assurance', href: '/admin/rent-assurance-claims', collection: 'rent-assurance-claims' },
  { name: 'Money Insurance', href: '/admin/money-insurance-claims', collection: 'money-insurance-claims' },
  { name: 'Burglary Claims', href: '/admin/burglary-claims', collection: 'burglary-claims' },
  { name: 'Contractors Plant Machinery', href: '/admin/contractors-plant-machinery-claims', collection: 'contractors-claims' },
  { name: 'Fidelity Guarantee', href: '/admin/fidelity-guarantee-claims', collection: 'fidelity-guarantee-claims' },
  { name: 'Smart Motorist Protection', href: '/admin/smart-motorist-protection-claims', collection: 'smart-motorist-protection-claims' },
  { name: 'Smart Students Protection', href: '/admin/smart-students-protection-claims', collection: 'smart-students-protection-claims' },
  { name: 'Smart Traveller Protection', href: '/admin/smart-traveller-protection-claims', collection: 'smart-traveller-protection-claims' },
  { name: 'Smart Artisan Protection', href: '/admin/smart-artisan-protection-claims', collection: 'smart-artisan-protection-claims' },
  { name: 'Smart Generation Z Protection', href: '/admin/smart-generation-z-protection-claims', collection: 'smart-generation-z-protection-claims' },
  { name: 'NEM Home Protection', href: '/admin/nem-home-protection-claims', collection: 'nem-home-protection-claims' },
  { name: 'Farm Property & Produce', href: '/admin/farm-property-produce-claims', collection: 'farm-property-produce-claims' },
  { name: 'Livestock Claims', href: '/admin/livestock-claims', collection: 'livestock-claims' },
  { name: 'Poultry Claims', href: '/admin/poultry-claims', collection: 'poultry-claims' },
  { name: 'Fishery & Fish Farm Claims', href: '/admin/fishery-fish-farm-claims', collection: 'fishery-fish-farm-claims' },
  { name: 'Yield Index Claims', href: '/admin/yield-index-claims', collection: 'yield-index-claims' },
  { name: 'Multi-Perils Crop Claims', href: '/admin/multi-perils-crop-claims', collection: 'multi-perils-crop-claims' }
];

const CLAIM_COLLECTIONS = new Set(CLAIM_UNIT_CONTACTS.map((entry) => entry.collection));

export function normalizeClaimCollection(collection: string): string {
  const normalized = collection.trim().toLowerCase();
  return COLLECTION_ALIASES[normalized] || normalized;
}

export function isClaimCollection(collection: string): boolean {
  return CLAIM_COLLECTIONS.has(normalizeClaimCollection(collection));
}

export function getAssignedClaimCollectionsForEmail(email: string): string[] {
  if (!email.trim()) return [];

  const normalizedEmail = email.trim().toLowerCase();
  return [...new Set(
    CLAIM_UNIT_CONTACTS
      .filter((entry) => {
        const recipient = entry.unitRecipientEmail.toLowerCase();
        const admin = entry.unitAdminEmail.toLowerCase();
        return recipient === normalizedEmail || admin === normalizedEmail;
      })
      .map((entry) => entry.collection)
  )];
}

/** null = unrestricted claim access; [] = no claim collections. */
export function resolveAssignedClaimCollections({
  email,
  role,
  assignedClaimCollections
}: {
  email?: string;
  role?: UserRole | string;
  assignedClaimCollections?: string[] | null;
}): string[] | null {
  const profileAssignments = Array.isArray(assignedClaimCollections)
    ? assignedClaimCollections.filter(Boolean)
    : [];
  const emailAssignments = email ? getAssignedClaimCollectionsForEmail(email) : [];
  const merged = [...new Set([...profileAssignments, ...emailAssignments])];

  const normalizedRole = normalizeRole(role);
  if (['admin', 'super admin', 'compliance'].includes(normalizedRole)) {
    return null;
  }

  if (merged.length > 0) {
    return merged;
  }

  if (normalizedRole === 'claims') {
    return null;
  }

  return [];
}

export function canAccessClaimCollection(
  user: Pick<User, 'role' | 'email' | 'assignedClaimCollections'> | null | undefined,
  collection: string
): boolean {
  if (!user || !isClaimCollection(collection)) {
    return true;
  }

  const assignments = user.assignedClaimCollections ?? resolveAssignedClaimCollections({
    email: user.email,
    role: user.role,
    assignedClaimCollections: user.assignedClaimCollections
  });

  if (assignments === null) {
    return true;
  }

  const normalizedCollection = normalizeClaimCollection(collection);
  return assignments.includes(normalizedCollection);
}

export function filterAccessibleClaimNavItems(
  user: Pick<User, 'role' | 'email' | 'assignedClaimCollections'> | null | undefined
): ClaimNavItem[] {
  if (!user) return [];

  const assignments = user.assignedClaimCollections ?? resolveAssignedClaimCollections({
    email: user.email,
    role: user.role,
    assignedClaimCollections: user.assignedClaimCollections
  });

  if (assignments === null) {
    return [...CLAIM_NAV_ITEMS];
  }

  return CLAIM_NAV_ITEMS.filter((item) => assignments.includes(item.collection));
}
