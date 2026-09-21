'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { wrapTransport, isSuppressed, parsePatterns, toAddressList } = require('../../src/lib/emailSuppression.cjs');

function fakeTransport() {
  const sent = [];
  return {
    sent,
    sendMail: async (options) => {
      sent.push(options);
      return { messageId: 'fake', accepted: [options.to] };
    },
  };
}

/** Silences the console.warn banner the filter emits, so test output stays readable. */
function quiet(run) {
  const original = console.warn;
  console.warn = () => {};
  try { return run(); } finally { console.warn = original; }
}

test('with no pattern configured the transport is returned untouched', () => {
  const transport = fakeTransport();
  assert.equal(wrapTransport(transport, ''), transport);
  assert.equal(wrapTransport(transport, undefined), transport);
  assert.equal(wrapTransport(transport, '   '), transport);
});

test('recipients matching the pattern are dropped, others still receive', async () => {
  const transport = fakeTransport();
  const wrapped = wrapTransport(transport, 'nem-insurance');

  await quiet(() => wrapped.sendMail({
    to: ['customer@gmail.com', 'motorclaimunit@nem-insurance.com', 'folahan@NEM-INSURANCE.com'],
    subject: 'New Motor Claim',
    html: '<p>hi</p>',
  }));

  assert.equal(transport.sent.length, 1);
  assert.equal(transport.sent[0].to, 'customer@gmail.com');
  assert.equal(transport.sent[0].subject, 'New Motor Claim');
});

test('a message with only suppressed recipients is never handed to the transport', async () => {
  const transport = fakeTransport();
  const wrapped = wrapTransport(transport, 'nem-insurance');

  const result = await quiet(() => wrapped.sendMail({
    to: 'claims@nem-insurance.com',
    cc: 'admin@nem-insurance.com',
    subject: 'Staff notification',
  }));

  assert.equal(transport.sent.length, 0);
  assert.equal(result.suppressed, true);
  assert.deepEqual(result.removed, ['claims@nem-insurance.com', 'admin@nem-insurance.com']);
});

test('comma-separated recipient strings and cc/bcc are filtered too', async () => {
  const transport = fakeTransport();
  const wrapped = wrapTransport(transport, 'nem-insurance');

  await quiet(() => wrapped.sendMail({
    to: 'customer@gmail.com, kyc@nem-insurance.com',
    bcc: ['audit@nem-insurance.com', 'tester@example.org'],
    subject: 'Mixed',
  }));

  assert.equal(transport.sent[0].to, 'customer@gmail.com');
  assert.equal(transport.sent[0].bcc, 'tester@example.org');
  assert.equal(transport.sent[0].cc, undefined);
});

test('multiple comma-separated patterns are honoured', () => {
  const patterns = parsePatterns('nem-insurance, Example.COM ,');
  assert.deepEqual(patterns, ['nem-insurance', 'example.com']);
  assert.equal(isSuppressed('a@nem-insurance.com', patterns), true);
  assert.equal(isSuppressed('b@example.com', patterns), true);
  assert.equal(isSuppressed('c@gmail.com', patterns), false);
});

test('address objects and nested arrays are understood', () => {
  assert.deepEqual(toAddressList([{ address: 'a@x.com' }, 'b@y.com, c@z.com']), ['a@x.com', 'b@y.com', 'c@z.com']);
  assert.deepEqual(toAddressList(undefined), []);
});

test('the customer still gets their mail while staff are suppressed', async () => {
  const transport = fakeTransport();
  const wrapped = wrapTransport(transport, 'nem-insurance');

  await quiet(() => wrapped.sendMail({ to: 'tester@gmail.com', subject: 'Submission Confirmation' }));

  assert.equal(transport.sent.length, 1);
  assert.equal(transport.sent[0].to, 'tester@gmail.com');
});
