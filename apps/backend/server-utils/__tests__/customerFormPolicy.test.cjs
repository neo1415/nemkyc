'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CUSTOMER_FORM_CONFIGS,
  CLAIM_FORM_CONFIGS,
  buildNotificationRoleQuery,
  normalizeNotificationEmails,
  getCustomerFormConfig,
  getClaimFormConfig,
  getClaimFormConfigByCollection,
  resolveClaimNotificationEmails,
  buildAdminSubmissionDeepLink,
  isClaimFormType
} = require('../customerFormPolicy.cjs');

test('notification role queries include requested staff, admins, and super admins', () => {
  assert.deepEqual(buildNotificationRoleQuery([' Compliance ', 'admin']), [
    'compliance',
    'admin',
    'super admin',
    'super-admin',
    'superadmin'
  ]);
});

test('notification emails are normalized, validated, and deduplicated', () => {
  assert.deepEqual(
    normalizeNotificationEmails([' Admin@Nem.com ', 'invalid', 'admin@nem.com', null]),
    ['admin@nem.com']
  );
});

test('account-bound KYC and CDD forms have valid storage routing', () => {
  assert.equal(CUSTOMER_FORM_CONFIGS.length, 9);

  for (const config of CUSTOMER_FORM_CONFIGS) {
    assert.deepEqual(getCustomerFormConfig(config.formType), config);
    assert.match(config.collection, /^[A-Za-z0-9-]+$/);
    assert.match(config.ticketPrefix, /^[A-Z]{3}$/);
  }

  assert.equal(getCustomerFormConfig('Motor Claim'), null);
  assert.equal(getCustomerFormConfig(''), null);
});

test('all 26 claim policies have routing and notification contacts', () => {
  assert.equal(CLAIM_FORM_CONFIGS.length, 26);

  for (const config of CLAIM_FORM_CONFIGS) {
    assert.deepEqual(getClaimFormConfig(config.formType), config);
    assert.deepEqual(getClaimFormConfigByCollection(config.collection), config);
    assert.match(config.collection, /^[a-z0-9-]+$/);
    assert.match(config.ticketPrefix, /^[A-Z]{3}$/);
    assert.match(config.unitRecipientEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    assert.match(config.unitAdminEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    const recipients = resolveClaimNotificationEmails(config.formType, config.collection);
    assert.equal(recipients.length, 2);
    assert.ok(recipients.includes(config.unitRecipientEmail.toLowerCase()));
    assert.ok(recipients.includes(config.unitAdminEmail.toLowerCase()));
  }
});

test('motor claim routes to the motor unit contacts from management list', () => {
  const config = getClaimFormConfig('Motor Claim');
  assert.equal(config.unitRecipientEmail, 'motorclaimunit@nem-insurance.com');
  assert.equal(config.unitAdminEmail, 'folahanoluwadaisi@nem-insurance.com');
});

test('admin submission deep links require sign-in before opening the record', () => {
  const link = buildAdminSubmissionDeepLink('motor-claims', 'abc123', 'https://nemforms.com');
  assert.equal(
    link,
    'https://nemforms.com/signin?redirect=%2Fadmin%2Fform%2Fmotor-claims%2Fabc123'
  );
});

test('claim form detection covers configured and legacy form names', () => {
  assert.equal(isClaimFormType('Motor Claim', 'motor-claims'), true);
  assert.equal(isClaimFormType('Individual KYC', 'Individual-kyc-form'), false);
});

test('assigned claim collections scope unit admins by email', () => {
  const {
    getAssignedClaimCollectionsForEmail,
    resolveAssignedClaimCollections,
    validateAssignedClaimCollectionsInput,
    getClaimUnitGroups
  } = require('../customerFormPolicy.cjs');

  assert.deepEqual(
    getAssignedClaimCollectionsForEmail('folahanoluwadaisi@nem-insurance.com'),
    ['motor-claims']
  );

  assert.equal(
    resolveAssignedClaimCollections({
      email: 'folahanoluwadaisi@nem-insurance.com',
      role: 'claims'
    }).length,
    1
  );

  assert.equal(
    resolveAssignedClaimCollections({
      email: 'folahanoluwadaisi@nem-insurance.com',
      role: 'admin'
    }),
    null
  );

  assert.equal(getClaimUnitGroups().length, 4);

  assert.equal(
    validateAssignedClaimCollectionsInput('claims', {
      claimAccessAll: false,
      assignedClaimCollections: []
    }).valid,
    false
  );

  assert.deepEqual(
    validateAssignedClaimCollectionsInput('claims', {
      claimAccessAll: false,
      assignedClaimCollections: ['motor-claims']
    }).value,
    ['motor-claims']
  );
});
