'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createMailer } = require('../../src/lib/mail.cjs');
const policy = require('../customerFormPolicy.cjs');

// Accounts as the super-admin "create user" endpoint stores them in userroles.
const ACCOUNTS = [
  { email: 'boss@nem-insurance.com', role: 'super admin' },
  { email: 'admin@nem-insurance.com', role: 'admin' },
  { email: 'compliance@nem-insurance.com', role: 'compliance' },
  { email: 'motor.officer@nem-insurance.com', role: 'claims', assignedClaimCollections: ['motor-claims'] },
  { email: 'fire.officer@nem-insurance.com', role: 'claims', assignedClaimCollections: ['fire-special-perils-claims'] },
  { email: 'roaming.officer@nem-insurance.com', role: 'claims', claimAccessAll: true },
  { email: 'folahanoluwadaisi@nem-insurance.com', role: 'claims' }, // unit admin from the distribution list, no explicit assignment
  { email: 'gone@nem-insurance.com', role: 'claims', claimAccessAll: true, disabled: true },
  { email: 'customer@example.com', role: 'default' },
  { email: 'broker@example.com', role: 'broker' },
];

function fakeAdmin() {
  return {
    firestore: () => ({
      collection: (name) => ({
        where: (field, op, values) => ({
          get: async () => {
            assert.equal(name, 'userroles');
            assert.equal(field, 'role');
            assert.equal(op, 'in');
            return { docs: ACCOUNTS.filter((a) => values.includes(a.role)).map((a) => ({ data: () => a })) };
          },
        }),
      }),
    }),
  };
}

const mailer = createMailer({
  getTransporter: () => null,
  admin: fakeAdmin(),
  buildNotificationRoleQuery: policy.buildNotificationRoleQuery,
  isValidEmail: () => true,
  logAuditSecurityEvent: async () => {},
  normalizeNotificationEmails: policy.normalizeNotificationEmails,
  resolveAssignedClaimCollections: policy.resolveAssignedClaimCollections,
  sanitizeEmail: (e) => e,
  sanitizeEmailSubject: (s) => s,
});

test('motor claims reach admins, the assigned officer, all-access officers and the unit admin by email', async () => {
  const emails = await mailer.getClaimStaffEmails('motor-claims');
  assert.deepEqual(emails.sort(), [
    'admin@nem-insurance.com',
    'boss@nem-insurance.com',
    'folahanoluwadaisi@nem-insurance.com',
    'motor.officer@nem-insurance.com',
    'roaming.officer@nem-insurance.com',
  ]);
});

test('an officer assigned to another unit, disabled accounts, customers and brokers are never notified', async () => {
  const emails = await mailer.getClaimStaffEmails('motor-claims');
  assert.ok(!emails.includes('fire.officer@nem-insurance.com'));
  assert.ok(!emails.includes('gone@nem-insurance.com'));
  assert.ok(!emails.includes('customer@example.com'));
  assert.ok(!emails.includes('broker@example.com'));
  assert.ok(!emails.includes('compliance@nem-insurance.com'), 'compliance is not part of the claims role query');
});

test('fire claims go to the fire officer, not the motor officer', async () => {
  const emails = await mailer.getClaimStaffEmails('fire-special-perils-claims');
  assert.ok(emails.includes('fire.officer@nem-insurance.com'));
  assert.ok(!emails.includes('motor.officer@nem-insurance.com'));
});
