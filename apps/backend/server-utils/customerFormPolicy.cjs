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
const CUSTOMER_FORM_CONFIG_BY_NAME = new Map(
  CUSTOMER_FORM_CONFIGS.map(config => [config.formType.toLowerCase(), config])
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

module.exports = {
  ADMIN_NOTIFICATION_ROLE_VARIANTS,
  CUSTOMER_FORM_CONFIGS,
  buildNotificationRoleQuery,
  normalizeNotificationEmails,
  getCustomerFormConfig
};
