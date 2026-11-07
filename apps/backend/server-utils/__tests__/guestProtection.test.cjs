'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const rateLimit = require('express-rate-limit');

const { matchNINData, matchCACData } = require('../../src/lib/identityMatch.cjs');
const mockProviders = require('../../src/lib/mockIdentityProviders.cjs');
const { createGuestProtection, GUEST_SESSION_HEADER } = require('../../src/middleware/guestProtection.cjs');

const REGISTRY_NIN = { firstName: 'Adaeze', middleName: 'Ngozi', lastName: 'Okafor', birthdate: '21-05-1990', gender: 'F' };

/** Starts an app on an ephemeral port; `build(app)` registers routes. Returns { url, close }. */
async function serve(build, { user } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = user || null; next(); });
  build(app);
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}

const post = (url, body, headers = {}) => fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body),
}).then(async (res) => ({ status: res.status, body: await res.json() }));

// ---------- matching ----------

test('NIN match accepts the right person, including ISO dates from date inputs', () => {
  const result = matchNINData({ firstName: 'adaeze', lastName: 'OKAFOR', dateOfBirth: '1990-05-21', gender: 'Female' }, REGISTRY_NIN);
  assert.equal(result.matches, true, JSON.stringify(result));
  assert.deepEqual(result.warnings, []);
});

test('NIN match rejects a different name or birth date without revealing registry values', () => {
  const result = matchNINData({ firstName: 'John', lastName: 'Doe', dateOfBirth: '1985-01-01' }, REGISTRY_NIN);
  assert.equal(result.matches, false);
  assert.deepEqual(result.fields.sort(), ['dateOfBirth', 'firstName', 'lastName']);
  assert.ok(!JSON.stringify(result).includes('Adaeze') && !JSON.stringify(result).includes('1990'));
});

test('CAC match tolerates suffix variants and flags a wrong incorporation date', () => {
  const registry = { name: 'NEM INSURANCE PUBLIC LIMITED COMPANY', registrationDate: '01-01-1970' };
  assert.equal(matchCACData({ companyName: 'Nem Insurance PLC', registrationDate: '1970-01-01' }, registry).matches, true);
  const wrong = matchCACData({ companyName: 'Nem Insurance PLC', registrationDate: '2001-01-01' }, registry);
  assert.equal(wrong.matches, false);
  assert.deepEqual(wrong.fields, ['registrationDate']);
});

// ---------- mock providers ----------

test('mock identity providers are off unless explicitly enabled (VERIFICATION_MODE does not count)', async () => {
  const real = { verifyNIN: async () => 'real', verifyCAC: async () => 'real' };
  assert.equal(mockProviders.selectProviders(real, { VERIFICATION_MODE: 'mock' }).verifyNIN, real.verifyNIN);
  const mocked = mockProviders.selectProviders(real, { MOCK_IDENTITY_PROVIDERS: 'true' });
  const ok = await mocked.verifyNIN('12345678901');
  assert.equal(ok.success, true);
  assert.equal(ok.data.lastName, 'Customer');
  assert.equal((await mocked.verifyNIN('12345678999')).errorCode, 'NETWORK_ERROR');
  assert.equal((await mocked.verifyCAC('RC1234598')).errorCode, 'NOT_FOUND');
});

// ---------- match-only responses ----------

function lookupApp(protection, kind) {
  return (app) => app.post('/lookup', protection.identityMatchResponse(kind), (req, res) => {
    res.json({ status: true, message: 'verified', data: kind === 'NIN' ? REGISTRY_NIN : { name: 'Test Company Ltd', registrationDate: '01-01-2010' } });
  });
}

test('guests get only a verdict, never the registry record', async () => {
  const logged = [];
  const protection = createGuestProtection({ rateLimit, secret: 's', logVerificationAttempt: async (e) => logged.push(e) });
  const srv = await serve(lookupApp(protection, 'NIN'));
  try {
    const ok = await post(`${srv.url}/lookup`, { nin: '12345678901', match: { firstName: 'Adaeze', lastName: 'Okafor', dateOfBirth: '1990-05-21' } });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.match.matches, true);
    assert.equal(ok.body.data, undefined);
    assert.ok(!JSON.stringify(ok.body).includes('Ngozi'));

    const bad = await post(`${srv.url}/lookup`, { nin: '12345678901', match: { firstName: 'John', lastName: 'Doe' } });
    assert.equal(bad.body.match.matches, false);
    assert.equal(bad.body.data, undefined);
    assert.equal(logged.length, 1, 'a mismatch leaves a server-side audit trace');
    assert.equal(logged[0].result, 'mismatch');
  } finally {
    await srv.close();
  }
});

test('guests must send what they typed before any (paid) lookup runs', async () => {
  let handlerRan = false;
  const protection = createGuestProtection({ rateLimit, secret: 's' });
  const srv = await serve((app) => app.post('/lookup', protection.identityMatchResponse('NIN'), (_req, res) => {
    handlerRan = true;
    res.json({ status: true, data: REGISTRY_NIN });
  }));
  try {
    const res = await post(`${srv.url}/lookup`, { nin: '12345678901' });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'MATCH_DETAILS_REQUIRED');
    assert.equal(handlerRan, false);
  } finally {
    await srv.close();
  }
});

test('signed-in users keep the record for auto-fill', async () => {
  const protection = createGuestProtection({ rateLimit, secret: 's' });
  const srv = await serve(lookupApp(protection, 'NIN'), { user: { uid: 'u1', email: 'a@b.c' } });
  try {
    const res = await post(`${srv.url}/lookup`, { nin: '12345678901' });
    assert.equal(res.body.data.firstName, 'Adaeze');
  } finally {
    await srv.close();
  }
});

// ---------- human check / guest sessions ----------

test('guest sessions are signed and expire', () => {
  const protection = createGuestProtection({ rateLimit, secret: 'secret-a' });
  const other = createGuestProtection({ rateLimit, secret: 'secret-b' });
  const { token } = protection.issueGuestSession();
  assert.equal(protection.isValidGuestSession(token), true);
  assert.equal(other.isValidGuestSession(token), false, 'forged with another key');
  assert.equal(protection.isValidGuestSession(`${token}x`), false);
  assert.equal(protection.isValidGuestSession(token, Date.now() + 3 * 60 * 60 * 1000), false, 'expired');
});

test('Turnstile is enforced only when configured, and only for guests', async (t) => {
  const previous = process.env.TURNSTILE_SECRET_KEY;
  t.after(() => { if (previous === undefined) delete process.env.TURNSTILE_SECRET_KEY; else process.env.TURNSTILE_SECRET_KEY = previous; });
  const turnstileCalls = [];
  const fetchImpl = async (_url, init) => {
    turnstileCalls.push(init.body.get('response'));
    return { json: async () => ({ success: init.body.get('response') === 'good-token' }) };
  };
  const protection = createGuestProtection({ rateLimit, secret: 's', fetchImpl });
  const build = (app) => {
    app.post('/session', protection.guestSessionHandler);
    app.post('/paid', protection.requireHumanCheck, (_req, res) => res.json({ ok: true }));
  };
  const srv = await serve(build);
  try {
    delete process.env.TURNSTILE_SECRET_KEY;
    assert.equal((await post(`${srv.url}/paid`, {})).status, 200, 'off when not configured');

    process.env.TURNSTILE_SECRET_KEY = 'configured';
    assert.equal((await post(`${srv.url}/paid`, {})).status, 403);
    assert.equal((await post(`${srv.url}/session`, { turnstileToken: 'bad-token' })).status, 403);
    const session = await post(`${srv.url}/session`, { turnstileToken: 'good-token' });
    assert.equal(session.status, 200);
    assert.equal((await post(`${srv.url}/paid`, {}, { [GUEST_SESSION_HEADER]: session.body.token })).status, 200);
    assert.deepEqual(turnstileCalls, ['bad-token', 'good-token']);
  } finally {
    await srv.close();
  }

  const signedIn = await serve(build, { user: { uid: 'u1' } });
  try {
    assert.equal((await post(`${signedIn.url}/paid`, {})).status, 200, 'signed-in users skip the challenge');
  } finally {
    await signedIn.close();
  }
});

// ---------- limits ----------

test('guest lookups are limited per IP even when X-Forwarded-For is spoofed', async (t) => {
  const previous = process.env.GUEST_HOURLY_LOOKUP_LIMIT;
  process.env.GUEST_HOURLY_LOOKUP_LIMIT = '3';
  t.after(() => { if (previous === undefined) delete process.env.GUEST_HOURLY_LOOKUP_LIMIT; else process.env.GUEST_HOURLY_LOOKUP_LIMIT = previous; });
  const protection = createGuestProtection({ rateLimit, secret: 's' });
  const srv = await serve((app) => app.post('/lookup', protection.identityLookupLimiter, (_req, res) => res.json({ ok: true })));
  try {
    const statuses = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await post(`${srv.url}/lookup`, {}, { 'X-Forwarded-For': `10.0.0.${i}` })).status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 429, 429]);
  } finally {
    await srv.close();
  }
});

test('the same NIN cannot be enumerated by guests', async () => {
  const protection = createGuestProtection({ rateLimit, secret: 's' });
  const srv = await serve((app) => app.post('/lookup', protection.perIdentityLimiter('nin'), (_req, res) => res.json({ ok: true })));
  try {
    const statuses = [];
    for (let i = 0; i < 8; i++) statuses.push((await post(`${srv.url}/lookup`, { nin: '11111111111' })).status);
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 200, 429, 429]);
    assert.equal((await post(`${srv.url}/lookup`, { nin: '22222222222' })).status, 200, 'other numbers unaffected');
  } finally {
    await srv.close();
  }
});
