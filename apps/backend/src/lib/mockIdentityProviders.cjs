'use strict';

/**
 * Stand-ins for the paid Datapro (NIN) and VerifyData (CAC) lookups, for local and staging testing.
 *
 * Enabled only by MOCK_IDENTITY_PROVIDERS=true. Deliberately separate from VERIFICATION_MODE, which
 * defaults to 'mock' when unset and so must never be able to switch real lookups off.
 *
 * Every number returns the same fictional record, so a tester knows what to type:
 *   NIN  -> Test / Customer, born 01-01-1990, Male
 *   CAC  -> "Test Company Ltd", registered 01-01-2010
 * Numbers ending in 99 simulate a provider outage; numbers ending in 98 simulate "not found".
 */

const ENV_VAR = 'MOCK_IDENTITY_PROVIDERS';

const MOCK_NIN_RECORD = Object.freeze({
  firstName: 'Test',
  middleName: '',
  lastName: 'Customer',
  birthdate: '01-01-1990',
  gender: 'Male',
});

const MOCK_CAC_RECORD = Object.freeze({
  name: 'Test Company Ltd',
  registrationNumber: '',
  companyStatus: 'ACTIVE',
  registrationDate: '01-01-2010',
  typeOfEntity: 'PRIVATE_COMPANY_LIMITED_BY_SHARES',
});

function isEnabled(env = process.env) {
  return String(env[ENV_VAR] || '').trim().toLowerCase() === 'true';
}

function simulated(number) {
  const value = String(number || '');
  if (value.endsWith('99')) {
    return { success: false, errorCode: 'NETWORK_ERROR', error: 'Simulated provider outage (mock)', cost: 0 };
  }
  if (value.endsWith('98')) {
    return { success: false, errorCode: 'NOT_FOUND', error: 'Simulated record not found (mock)', cost: 0 };
  }
  return null;
}

async function mockVerifyNIN(nin) {
  return simulated(nin) || { success: true, cost: 0, data: { ...MOCK_NIN_RECORD }, mock: true };
}

async function mockVerifyCAC(rcNumber) {
  return simulated(rcNumber) || {
    success: true,
    cost: 0,
    data: { ...MOCK_CAC_RECORD, registrationNumber: String(rcNumber || '') },
    mock: true,
  };
}

/** Returns the real provider functions, or the mocks when the env var is set. */
function selectProviders({ verifyNIN, verifyCAC }, env = process.env) {
  if (!isEnabled(env)) return { verifyNIN, verifyCAC };
  return { verifyNIN: mockVerifyNIN, verifyCAC: mockVerifyCAC };
}

function announce(env = process.env) {
  if (!isEnabled(env)) return;
  const bar = '='.repeat(72);
  console.warn(`\n${bar}\n  MOCK IDENTITY PROVIDERS ACTIVE (${ENV_VAR}=true)\n  NIN/CAC lookups return fictional test records. Never set this in production.\n${bar}\n`);
}

module.exports = {
  ENV_VAR,
  MOCK_CAC_RECORD,
  MOCK_NIN_RECORD,
  announce,
  isEnabled,
  mockVerifyCAC,
  mockVerifyNIN,
  selectProviders,
};
