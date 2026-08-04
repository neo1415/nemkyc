const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractCACCompanyName,
  extractCACRegistrationNumber,
  extractCACRegistrationDate,
} = require('../cacDocumentExtractor.cjs');

const certificateText = `UNITY AND FAITH PEACE AND PROGRESS
FEDERAL REPUBLIC OF NIGERIA
CERTIFICATE OF INCORPORATION
OF A
PUBLIC COMPANY LIMITED BY SHARES
COMPANY REGISTRATION NO. 6971
The Registrar - General of Corporate Affairs Commission
hereby certifies that
NEM INSURANCE PLC
is this day incorporated under the
COMPANIES AND ALLIED MATTERS ACT 2020
as a public company limited by shares
Given under my hand at Abuja this 1st day of April, 1970`;

test('extracts CAC certificate fields without treating the document header as company name', () => {
  assert.equal(extractCACCompanyName(certificateText), 'NEM INSURANCE PLC');
  assert.equal(extractCACRegistrationNumber(certificateText), 'RC6971');
  assert.equal(extractCACRegistrationDate(certificateText), '01/04/1970');
});

