'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractNAICOMCompanyName } = require('../naicomDocumentExtractor.cjs');

test('extracts a labelled NAICOM licensee company name', () => {
  assert.equal(extractNAICOMCompanyName('NATIONAL INSURANCE COMMISSION\nName of Licensee: NEM INSURANCE PLC\nLicence No: RIC047'), 'NEM INSURANCE PLC');
});

test('extracts a company name from an unlabelled certificate', () => {
  assert.equal(extractNAICOMCompanyName('NAICOM\nCERTIFICATE OF REGISTRATION\nNEM INSURANCE PLC\nThis licence remains valid'), 'NEM INSURANCE PLC');
});
