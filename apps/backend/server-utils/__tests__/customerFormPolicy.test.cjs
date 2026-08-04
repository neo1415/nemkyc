'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CUSTOMER_FORM_CONFIGS,
  buildNotificationRoleQuery,
  normalizeNotificationEmails,
  getCustomerFormConfig
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
