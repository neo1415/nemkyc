'use strict';

const DEFAULT_ADMIN_NOTIFICATION_RECIPIENTS = Object.freeze(['adedaniel502@gmail.com']);
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

function getAdminNotificationRecipients(configuredRecipients) {
  const source = configuredRecipients
    ? configuredRecipients.split(',')
    : DEFAULT_ADMIN_NOTIFICATION_RECIPIENTS;

  return [...new Set(source
    .map(email => String(email).trim().toLowerCase())
    .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];
}

function getCustomerFormConfig(formType) {
  if (typeof formType !== 'string') return null;
  return CUSTOMER_FORM_CONFIG_BY_NAME.get(formType.trim().toLowerCase()) || null;
}

module.exports = {
  DEFAULT_ADMIN_NOTIFICATION_RECIPIENTS,
  CUSTOMER_FORM_CONFIGS,
  getAdminNotificationRecipients,
  getCustomerFormConfig
};
