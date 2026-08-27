'use strict';

const ADMIN_NOTIFICATION_ROLE_VARIANTS = Object.freeze([
  'admin',
  'super admin',
  'super-admin',
  'superadmin'
]);

const CUSTOMER_FORM_CONFIGS = Object.freeze([
  { formType: 'Individual KYC', collection: 'Individual-kyc-form', ticketPrefix: 'IKY' },
  { formType: 'Corporate KYC', collection: 'corporate-kyc-form', ticketPrefix: 'CKY' },
  { formType: 'Individual CDD', collection: 'individual-kyc', ticketPrefix: 'ICD' },
  { formType: 'Corporate CDD', collection: 'corporate-kyc', ticketPrefix: 'CCD' },
  { formType: 'NAICOM Corporate CDD', collection: 'corporate-kyc', ticketPrefix: 'NCC' },
  { formType: 'Partners CDD', collection: 'partnersCDD', ticketPrefix: 'PCD' },
  { formType: 'NAICOM Partners CDD', collection: 'partnersCDD', ticketPrefix: 'NPC' },
  { formType: 'Agents CDD', collection: 'agentsCDD', ticketPrefix: 'ACD' },
  { formType: 'Brokers CDD', collection: 'brokers-kyc', ticketPrefix: 'BCD' }
]);

const GEN_ACCIDENT_UNIT = 'genaccidentclaims@nem-insurance.com';
const GEN_ACCIDENT_ADMIN = 'nathanielaina@nem-insurance.com';
const FIRE_MARINE_UNIT = 'fire&marineclaims@nem-insurance.com';
const FIRE_MARINE_ADMIN = 'jumokeamuni@nem-insurance.com';
const SPECIAL_RISK_UNIT = 'specialriskclaims@nem-insurance.com';
const SPECIAL_RISK_ADMIN = 'abimboladada@nem-insurance.com';

/** Per-policy claim routing from management distribution list (Feb 2026). */
const CLAIM_FORM_CONFIGS = Object.freeze([
  {
    formType: 'Motor Claim',
    collection: 'motor-claims',
    routePath: '/claims/motor',
    ticketPrefix: 'MTR',
    policyRisk: 'Motor Policy',
    unitRecipientEmail: 'motorclaimunit@nem-insurance.com',
    unitAdminEmail: 'folahanoluwadaisi@nem-insurance.com'
  },
  {
    formType: 'Professional Indemnity Claim',
    collection: 'professional-indemnity-claims',
    routePath: '/claims/professional-indemnity',
    ticketPrefix: 'PID',
    policyRisk: 'Professional Indemnity',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Public Liability Claim',
    collection: 'public-liability-claims',
    routePath: '/claims/public-liability',
    ticketPrefix: 'PBL',
    policyRisk: 'Public Liability',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Employers Liability Claim',
    collection: 'employers-liability-claims',
    routePath: '/claims/employers-liability',
    ticketPrefix: 'EML',
    policyRisk: 'Employer Liability',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Combined GPA Employers Liability Claim',
    collection: 'combined-gpa-employers-liability-claims',
    routePath: '/claims/combined-gpa-employers-liability',
    ticketPrefix: 'CGE',
    policyRisk: 'Combined GPA and Employer Liability',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Burglary Claim',
    collection: 'burglary-claims',
    routePath: '/claims/burglary',
    ticketPrefix: 'BUR',
    policyRisk: 'Burglary',
    unitRecipientEmail: FIRE_MARINE_UNIT,
    unitAdminEmail: FIRE_MARINE_ADMIN
  },
  {
    formType: 'Group Personal Accident Claim',
    collection: 'group-personal-accident-claims',
    routePath: '/claims/group-personal-accident',
    ticketPrefix: 'GPA',
    policyRisk: 'Group Personal Accident',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Fire Special Perils Claim',
    collection: 'fire-special-perils-claims',
    routePath: '/claims/fire-special-perils',
    ticketPrefix: 'FSP',
    policyRisk: 'Fire and Special Peril',
    unitRecipientEmail: FIRE_MARINE_UNIT,
    unitAdminEmail: FIRE_MARINE_ADMIN
  },
  {
    formType: 'Rent Assurance Claim',
    collection: 'rent-assurance-claims',
    routePath: '/claims/rent-assurance',
    ticketPrefix: 'RAC',
    policyRisk: 'Rent Assurance Policy',
    unitRecipientEmail: FIRE_MARINE_UNIT,
    unitAdminEmail: FIRE_MARINE_ADMIN
  },
  {
    formType: 'Money Insurance Claim',
    collection: 'money-insurance-claims',
    routePath: '/claims/money-insurance',
    ticketPrefix: 'MON',
    policyRisk: 'Money Insurance',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Goods In Transit Claim',
    collection: 'goods-in-transit-claims',
    routePath: '/claims/goods-in-transit',
    ticketPrefix: 'GIT',
    policyRisk: 'Goods in Transit',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Contractors Plant & Machinery Claim',
    collection: 'contractors-claims',
    routePath: '/claims/contractors-plant-machinery',
    ticketPrefix: 'CPM',
    policyRisk: 'Contractor, Plant and Machinery',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'All Risk Claim',
    collection: 'all-risk-claims',
    routePath: '/claims/all-risk',
    ticketPrefix: 'ARL',
    policyRisk: 'All Risks Insurance',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Fidelity Guarantee Claim',
    collection: 'fidelity-guarantee-claims',
    routePath: '/claims/fidelity-guarantee',
    ticketPrefix: 'FID',
    policyRisk: 'Fidelity Guarantee',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Smart Motorist Protection Claim',
    collection: 'smart-motorist-protection-claims',
    routePath: '/claims/smart-motorist-protection',
    ticketPrefix: 'SMP',
    policyRisk: 'Smart Motorist Protection',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Smart Students Protection Claim',
    collection: 'smart-students-protection-claims',
    routePath: '/claims/smart-students-protection',
    ticketPrefix: 'SSP',
    policyRisk: 'Smart Student Protection',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Smart Traveller Protection Claim',
    collection: 'smart-traveller-protection-claims',
    routePath: '/claims/smart-traveller-protection',
    ticketPrefix: 'STP',
    policyRisk: 'Smart Traveller Protection',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Smart Artisan Protection Claim',
    collection: 'smart-artisan-protection-claims',
    routePath: '/claims/smart-artisan-protection',
    ticketPrefix: 'SAP',
    policyRisk: 'Smart Artisan Protection',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'Smart Generation Z Protection Claim',
    collection: 'smart-generation-z-protection-claims',
    routePath: '/claims/smart-generation-z-protection',
    ticketPrefix: 'SGZ',
    policyRisk: 'Smart Generation Protection',
    unitRecipientEmail: GEN_ACCIDENT_UNIT,
    unitAdminEmail: GEN_ACCIDENT_ADMIN
  },
  {
    formType: 'NEM Home Protection Claim',
    collection: 'nem-home-protection-claims',
    routePath: '/claims/nem-home-protection',
    ticketPrefix: 'NHP',
    policyRisk: 'Home Protection',
    unitRecipientEmail: FIRE_MARINE_UNIT,
    unitAdminEmail: FIRE_MARINE_ADMIN
  },
  {
    formType: 'Livestock Insurance Claim',
    collection: 'livestock-claims',
    routePath: '/claims/livestock',
    ticketPrefix: 'LIV',
    policyRisk: 'Livestock Policy',
    unitRecipientEmail: SPECIAL_RISK_UNIT,
    unitAdminEmail: SPECIAL_RISK_ADMIN
  },
  {
    formType: 'Farm Property and Produce Insurance Claim',
    collection: 'farm-property-produce-claims',
    routePath: '/claims/farm-property-produce',
    ticketPrefix: 'FPP',
    policyRisk: 'Farm Properties and Produce',
    unitRecipientEmail: SPECIAL_RISK_UNIT,
    unitAdminEmail: SPECIAL_RISK_ADMIN
  },
  {
    formType: 'Poultry Claim',
    collection: 'poultry-claims',
    routePath: '/claims/poultry',
    ticketPrefix: 'POU',
    policyRisk: 'Poultry',
    unitRecipientEmail: SPECIAL_RISK_UNIT,
    unitAdminEmail: SPECIAL_RISK_ADMIN
  },
  {
    formType: 'Fishery and Fish Farm Insurance Claim',
    collection: 'fishery-fish-farm-claims',
    routePath: '/claims/fishery-fish-farm',
    ticketPrefix: 'FIS',
    policyRisk: 'Fishery and Fish Farm',
    unitRecipientEmail: SPECIAL_RISK_UNIT,
    unitAdminEmail: SPECIAL_RISK_ADMIN
  },
  {
    formType: 'Yield Index Insurance Claim',
    collection: 'yield-index-claims',
    routePath: '/claims/yield-index-insurance',
    ticketPrefix: 'YIX',
    policyRisk: 'Yield Index Policy',
    unitRecipientEmail: SPECIAL_RISK_UNIT,
    unitAdminEmail: SPECIAL_RISK_ADMIN
  },
  {
    formType: 'Multi-Perils Crop Insurance Claim',
    collection: 'multi-perils-crop-claims',
    routePath: '/claims/multi-perils-crop',
    ticketPrefix: 'MPC',
    policyRisk: 'MultiPeril Cropping',
    unitRecipientEmail: SPECIAL_RISK_UNIT,
    unitAdminEmail: SPECIAL_RISK_ADMIN
  }
]);

const CUSTOMER_FORM_CONFIG_BY_NAME = new Map(
  CUSTOMER_FORM_CONFIGS.map(config => [config.formType.toLowerCase(), config])
);
const CLAIM_FORM_CONFIG_BY_NAME = new Map(
  CLAIM_FORM_CONFIGS.map(config => [config.formType.toLowerCase(), config])
);
const CLAIM_FORM_CONFIG_BY_COLLECTION = new Map(
  CLAIM_FORM_CONFIGS.map(config => [config.collection.toLowerCase(), config])
);

function buildNotificationRoleQuery(requestedRoles = []) {
  const roles = Array.isArray(requestedRoles) ? requestedRoles : [];

  return [...new Set([...roles, ...ADMIN_NOTIFICATION_ROLE_VARIANTS]
    .map(role => String(role).trim().toLowerCase())
    .filter(Boolean))];
}

function normalizeNotificationEmails(emails = []) {
  return [...new Set(emails
    .map(email => String(email || '').trim().toLowerCase())
    .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];
}

function getCustomerFormConfig(formType) {
  if (typeof formType !== 'string') return null;
  return CUSTOMER_FORM_CONFIG_BY_NAME.get(formType.trim().toLowerCase()) || null;
}

function getClaimFormConfig(formType) {
  if (typeof formType !== 'string') return null;
  return CLAIM_FORM_CONFIG_BY_NAME.get(formType.trim().toLowerCase()) || null;
}

function getClaimFormConfigByCollection(collection) {
  if (typeof collection !== 'string') return null;
  return CLAIM_FORM_CONFIG_BY_COLLECTION.get(collection.trim().toLowerCase()) || null;
}

function resolveClaimFormConfig(formType, collection) {
  return getClaimFormConfig(formType) || getClaimFormConfigByCollection(collection);
}

function resolveClaimNotificationEmails(formType, collection) {
  const config = resolveClaimFormConfig(formType, collection);
  if (!config) return [];

  return normalizeNotificationEmails([
    config.unitRecipientEmail,
    config.unitAdminEmail
  ]);
}

function buildAdminSubmissionDeepLink(collection, documentId, frontendUrl = 'https://nemforms.com') {
  if (!collection || !documentId) {
    const base = String(frontendUrl || 'https://nemforms.com').replace(/\/$/, '');
    return `${base}/signin`;
  }

  const base = String(frontendUrl || 'https://nemforms.com').replace(/\/$/, '');
  const reviewPath = `/admin/form/${collection}/${documentId}`;
  return `${base}/signin?redirect=${encodeURIComponent(reviewPath)}`;
}

function isClaimFormType(formType, collection) {
  if (resolveClaimFormConfig(formType, collection)) return true;
  if (typeof formType !== 'string') return false;

  const formTypeLower = formType.toLowerCase();
  return formTypeLower.includes('claim')
    || ['motor', 'burglary', 'fire', 'allrisk', 'goods', 'money', 'employers', 'public',
      'professional', 'fidelity', 'contractors', 'group', 'rent', 'combined', 'livestock',
      'poultry', 'fishery', 'yield', 'farm', 'smart', 'nem home']
      .some(keyword => formTypeLower.includes(keyword));
}

function getAssignedClaimCollectionsForEmail(email) {
  if (typeof email !== 'string' || !email.trim()) return [];

  const normalizedEmail = email.trim().toLowerCase();
  return [...new Set(
    CLAIM_FORM_CONFIGS
      .filter((config) => {
        const recipient = String(config.unitRecipientEmail || '').trim().toLowerCase();
        const admin = String(config.unitAdminEmail || '').trim().toLowerCase();
        return recipient === normalizedEmail || admin === normalizedEmail;
      })
      .map((config) => config.collection)
  )];
}

function resolveAssignedClaimCollections({ email, role, assignedClaimCollections }) {
  const profileAssignments = Array.isArray(assignedClaimCollections)
    ? assignedClaimCollections.filter(Boolean)
    : [];
  const emailAssignments = getAssignedClaimCollectionsForEmail(email);
  const merged = [...new Set([...profileAssignments, ...emailAssignments])];

  const normalizedRole = String(role || '').trim().toLowerCase();
  if (['admin', 'super admin', 'superadmin', 'super-admin', 'compliance'].includes(normalizedRole)) {
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

module.exports = {
  ADMIN_NOTIFICATION_ROLE_VARIANTS,
  CUSTOMER_FORM_CONFIGS,
  CLAIM_FORM_CONFIGS,
  buildNotificationRoleQuery,
  normalizeNotificationEmails,
  getCustomerFormConfig,
  getClaimFormConfig,
  getClaimFormConfigByCollection,
  resolveClaimFormConfig,
  resolveClaimNotificationEmails,
  buildAdminSubmissionDeepLink,
  isClaimFormType,
  getAssignedClaimCollectionsForEmail,
  resolveAssignedClaimCollections
};
