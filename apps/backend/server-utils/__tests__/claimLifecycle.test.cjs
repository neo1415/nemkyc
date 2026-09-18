'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const lifecycle = require('../../src/lib/claimLifecycle.cjs');

const staff = { kind: 'staff', uid: 'staff-1', name: 'Ada Officer' };
const customer = { kind: 'customer', uid: 'cust-1', name: 'Ola Customer' };

test('a new claim starts at REPORT / registered with the 60-day clock running', () => {
  const block = lifecycle.initialClaimBlock(1_000);
  assert.equal(block.stage, 'report');
  assert.equal(block.step, 'registered');
  assert.equal(block.targetDate - block.notifiedAt, 60 * 24 * 60 * 60 * 1000);
  assert.equal(lifecycle.legacyStatusForStage(block.stage), 'pending');
});

test('every step belongs to a known stage and every transition target is a known step', () => {
  for (const [step, def] of Object.entries(lifecycle.STEPS)) {
    assert.ok(lifecycle.STAGES.includes(def.stage), `${step} has unknown stage ${def.stage}`);
    for (const target of lifecycle.TRANSITIONS[step]) {
      assert.ok(lifecycle.isValidStep(target), `${step} -> ${target} is not a step`);
    }
  }
  assert.deepEqual(lifecycle.TRANSITIONS.closed, []);
  assert.deepEqual(lifecycle.TRANSITIONS.declined, []);
});

test('the happy path walks REPORT -> SUBMIT -> REVIEW -> ACCEPT -> PAY -> closed', () => {
  let { claim } = { claim: lifecycle.initialClaimBlock(1) };
  const steps = [
    ['docs_requested', { outstandingDocuments: [{ label: 'Police report' }] }],
    ['docs_complete', {}],
    ['coverage_confirmed', {}],
    ['assessed', {}],
    ['offer_issued', { offer: { amount: 250000, basis: 'Repair estimate less excess' } }],
  ];
  for (const [step, extra] of steps) ({ claim } = lifecycle.applyTransition(claim, { step, ...extra }, staff, 2));
  assert.equal(claim.stage, 'accept');
  assert.equal(claim.waitingOn, 'customer');
  assert.equal(lifecycle.legacyStatusForStage(claim.stage), 'approved');
  ({ claim } = lifecycle.applyTransition(claim, { step: 'offer_accepted' }, customer, 3));
  assert.equal(claim.offers[0].status, 'accepted');
  ({ claim } = lifecycle.applyTransition(claim, { step: 'discharged' }, staff, 4));
  ({ claim } = lifecycle.applyTransition(claim, { step: 'payment_processed', payment: { reference: 'TRX-1', amount: 250000 } }, staff, 5));
  ({ claim } = lifecycle.applyTransition(claim, { step: 'payment_confirmed' }, staff, 6));
  const final = lifecycle.applyTransition(claim, { step: 'closed' }, staff, 7);
  assert.equal(final.claim.stage, 'closed');
  assert.equal(final.status, 'approved');
  assert.equal(final.claim.history.length, 11);
});

test('a query produces a revised offer that supersedes the first', () => {
  let { claim } = { claim: lifecycle.initialClaimBlock(1) };
  ({ claim } = lifecycle.applyTransition(claim, { step: 'coverage_confirmed' }, staff, 2));
  ({ claim } = lifecycle.applyTransition(claim, { step: 'assessed' }, staff, 3));
  ({ claim } = lifecycle.applyTransition(claim, { step: 'offer_issued', offer: { amount: 100 } }, staff, 4));
  ({ claim } = lifecycle.applyTransition(claim, { step: 'offer_queried', queryReason: 'Prices went up' }, customer, 5));
  assert.equal(claim.waitingOn, 'nem');
  ({ claim } = lifecycle.applyTransition(claim, { step: 'offer_revised', offer: { amount: 120 } }, staff, 6));
  assert.deepEqual(claim.offers.map((o) => [o.version, o.status]), [[1, 'superseded'], [2, 'offered']]);
  assert.equal(claim.offers[0].queryReason, 'Prices went up');
});

test('illegal moves, missing payloads and wrong actors are refused', () => {
  const block = lifecycle.initialClaimBlock(1);
  assert.throws(() => lifecycle.applyTransition(block, { step: 'payment_processed', payment: { reference: 'x' } }, staff), /Cannot move/);
  assert.throws(() => lifecycle.applyTransition(block, { step: 'docs_requested' }, staff), (e) => e.code === 'MISSING_PAYLOAD' && e.missing.includes('outstandingDocuments'));
  assert.throws(() => lifecycle.applyTransition(block, { step: 'declined' }, staff), (e) => e.code === 'MISSING_PAYLOAD');
  assert.throws(() => lifecycle.applyTransition(block, { step: 'coverage_confirmed' }, customer), (e) => e.code === 'FORBIDDEN_ACTOR');
  const declined = lifecycle.applyTransition(block, { step: 'declined', reason: 'Policy lapsed before the loss' }, staff, 2);
  assert.equal(declined.status, 'rejected');
  assert.equal(declined.claim.decision.reason, 'Policy lapsed before the loss');
  assert.throws(() => lifecycle.applyTransition(declined.claim, { step: 'registered' }, staff), /Cannot move/);
});

test('claims that predate the lifecycle map from their legacy status', () => {
  assert.equal(lifecycle.stepFromLegacyStatus('processing'), 'coverage_confirmed');
  assert.equal(lifecycle.stepFromLegacyStatus('approved'), 'offer_issued');
  assert.equal(lifecycle.stepFromLegacyStatus('rejected'), 'declined');
  assert.equal(lifecycle.stepFromLegacyStatus(undefined), 'registered');
});

test('the browser mirror carries the same steps and transitions', () => {
  const ts = fs.readFileSync(path.resolve(__dirname, '../../../../src/lib/claimLifecycle.ts'), 'utf8');
  for (const [step, targets] of Object.entries(lifecycle.TRANSITIONS)) {
    const line = new RegExp(`\\n\\s*${step}:\\s*\\[([^\\]]*)\\]`).exec(ts.slice(ts.indexOf('export const TRANSITIONS')));
    assert.ok(line, `browser TRANSITIONS is missing ${step}`);
    const browserTargets = line[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
    assert.deepEqual(browserTargets, targets, `transitions for ${step} differ between backend and browser`);
  }
  for (const step of Object.keys(lifecycle.STEPS)) {
    assert.ok(new RegExp(`\\n\\s*${step}:\\s*\\{ stage: '${lifecycle.STEPS[step].stage}'`).test(ts), `browser STEPS.${step} differs`);
  }
});
