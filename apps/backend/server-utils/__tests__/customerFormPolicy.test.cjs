'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CUSTOMER_FORM_CONFIGS,
  getAdminNotificationRecipients,
  getCustomerFormConfig
} = require('../customerFormPolicy.cjs');

test('admin notifications default only to Ade Daniel', () => {
  assert.deepEqual(getAdminNotificationRecipients(), ['adedaniel502@gmail.com']);
});

test('configured recipients are normalized, validated, and deduplicated', () => {
  assert.deepEqual(
    getAdminNotificationRecipients(' ADEDaniel502@gmail.com,invalid,adedaniel502@gmail.com '),
    ['adedaniel502@gmail.com']
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
