'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { loadApp } = require('./helpers/loadApp.cjs');

// Source-level assertions read every backend module so they keep working while server.js is split.
function backendSource() {
  const root = path.resolve(__dirname, '../..');
  const files = [path.join(root, 'server.js')];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(cjs|js)$/.test(entry.name)) files.push(full);
    }
  };
  walk(path.join(root, 'src'));
  return files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
}

const source = backendSource();
const { app, routes, find } = loadApp();

function assertPolicy(method, routePath, { roles = [] } = {}) {
  const route = find(method, routePath);
  assert.ok(route, `${method} ${routePath} is not registered`);
  assert.ok(route.names.includes('requireAuth'), `${method} ${routePath} lacks requireAuth (${route.names.join(', ')})`);
  for (const role of roles) {
    assert.ok(route.roles.includes(role), `${method} ${routePath} does not require role "${role}" (${route.roles.join(', ')})`);
  }
}

test('no route is registered twice (Express keeps the first, the second is dead code)', () => {
  const seen = new Set();
  for (const r of routes) {
    for (const m of r.methods) {
      const key = `${m} ${r.path}`;
      assert.ok(!seen.has(key), `${key} is registered more than once`);
      seen.add(key);
    }
  }
});

test('sensitive routes require server-side authorization', () => {
  assertPolicy('GET', '/api/users', { roles: ['super admin'] });
  assertPolicy('DELETE', '/api/users/:userId', { roles: ['super admin'] });
  assertPolicy('PUT', '/api/users/:userId/role', { roles: ['super admin'] });
  assertPolicy('PATCH', '/api/users/:userId/role', { roles: ['super admin'] });
  assertPolicy('POST', '/api/forms/multiple', { roles: ['claims'] });
  assertPolicy('PUT', '/api/forms/:collection/:id/status', { roles: ['claims'] });
  assertPolicy('DELETE', '/api/forms/:collectionName/:formId', { roles: ['claims'] });
  assertPolicy('POST', '/api/pdf/download', { roles: ['claims'] });
  assertPolicy('POST', '/api/check-birthdays', { roles: ['super admin'] });
  assertPolicy('POST', '/api/test-birthday-email', { roles: ['super admin'] });
  assertPolicy('GET', '/api/auth/mfa-status/:uid');
  assertPolicy('GET', '/api/forms/:collection/:id');
  assertPolicy('GET', '/api/forms/:collection/:id/documents/:field');
  assertPolicy('POST', '/api/update-claim-status', { roles: ['claims'] });
  assertPolicy('POST', '/api/claims/:collection/:id/transition', { roles: ['claims'] });
  assertPolicy('POST', '/api/claims/:collection/:id/offer/:version/accept');
  assertPolicy('POST', '/api/claims/:collection/:id/offer/:version/query');
  assertPolicy('POST', '/api/claims/:collection/:id/documents/:key');
});

test('guest submissions provision an account and never downgrade a credentialed request', () => {
  const route = find('POST', '/api/submit-form');
  assert.ok(route, 'POST /api/submit-form is registered');
  assert.ok(route.names.includes('requireAuthOrGuest'), route.names.join(', '));
  assert.ok(source.includes("if (!hasCredentials && guest && typeof guest === 'object')"));
  assert.ok(source.includes("provisionError.code === 'ACCOUNT_EXISTS'"));
  assert.ok(source.includes("password: crypto.randomBytes(32).toString('base64url')"));
  assert.ok(!source.includes('temporaryPassword: guest'));
});

test('sessions are opaque ids, never the Firebase uid', () => {
  assert.ok(!source.includes("res.cookie('__session', uid"));
  assert.ok(!source.includes('sessionToken: uid'));
  assert.ok(source.includes("db.collection('sessions').doc(hashSessionId(sessionId))"));
  assert.ok(source.includes('const uid = await resolveSessionUid(sessionToken);'));
  assert.ok(!source.includes("db.collection('userroles').doc(sessionToken)"));
  const logout = find('POST', '/api/logout');
  assert.ok(logout, 'POST /api/logout is registered');
});

test('rate limiters are registered before the routes they protect', () => {
  const stack = app._router.stack;
  const firstRoute = stack.findIndex((l) => l.route);
  const wanted = ['api\\/login', 'api\\/exchange-token', 'api\\/register', '^\\/api\\/?(?=\\/|$)'];
  const limiterLayers = stack
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => !l.route && l.regexp && wanted.some((w) => l.regexp.source.includes(w)));
  assert.ok(limiterLayers.length >= wanted.length, `expected path-scoped limiters for ${wanted.join(', ')}`);
  for (const { i } of limiterLayers) {
    assert.ok(i < firstRoute, `limiter layer at index ${i} is registered after the first route (index ${firstRoute}) and never runs`);
  }
});

test('document downloads proxy only files referenced by an authorized submission', () => {
  assert.ok(source.includes('resolveManagedStorageObject(submissionData[field], bucket.name)'));
  assert.ok(source.includes('if (!staffRoles.has(req.user.role))'));
  assert.ok(source.includes("'Content-Disposition': `attachment; filename=\"${safeName}\"`"));
  assert.ok(source.includes("'Cache-Control': 'private, no-store, max-age=0'"));
});

test('customer submissions are account-bound by server-derived identity', () => {
  assert.ok(!source.includes('allowPublicKycCddSubmission'));
  assert.ok(!source.includes('isGuestPublicSubmission'));
  assert.ok(source.includes('const userUid = req.user?.uid || null'));
  assert.ok(source.includes('submittedByUid: userUid'));
  assert.ok(source.includes('const rawEmail = req.user?.email || userDetails.email'));
});

test('costly and upload endpoints are rate limited', () => {
  assert.ok(source.includes("app.post('/api/document-ai/process', verificationRateLimiter"));
  assert.ok(source.includes("app.post('/api/verify/cac', verificationRateLimiter"));
  assert.ok(source.includes("app.post('/api/public/upload', publicUploadLimiter"));
  assert.ok(source.includes("app.post('/api/submit-form', publicFormSubmissionLimiter, guestProvisionLimiter, requireAuthOrGuest"));
  assert.ok(source.includes("upload.single('file')"));
});

test('new customer uploads do not mint permanent Firebase bearer URLs', () => {
  const start = source.indexOf("app.post('/api/public/upload'");
  const end = source.indexOf("app.post('/api/submit-form'", start);
  const uploadRoute = source.slice(start, end);
  assert.ok(uploadRoute.includes('gs://${bucket.name}/${objectName}'));
  assert.ok(!uploadRoute.includes('firebaseStorageDownloadTokens'));
});

test('deprecated submission endpoints cannot write data', () => {
  const legacy = [
    'submit-kyc-individual', 'submit-kyc-corporate', 'submit-cdd-individual',
    'submit-cdd-corporate', 'submit-cdd-agents', 'submit-cdd-brokers',
    'submit-cdd-partners', 'submit-claim-motor', 'submit-claim-fire',
    'submit-claim-burglary', 'submit-claim-all-risk',
  ];
  for (const route of legacy) {
    assert.ok(source.includes(`app.post('/${route}', rejectDeprecatedSubmissionRoute`), route);
  }
});

test('production CSRF configuration fails closed', () => {
  assert.ok(source.includes("process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET"));
  assert.ok(!source.includes("'your-csrf-secret-key-change-in-production'"));
});

test('demo mode is never honoured in production', () => {
  const demoReads = source.match(/const demoMode = process\.env\.NODE_ENV !== 'production' && req\.body\.demoMode === true;/g) || [];
  assert.equal(demoReads.length, 3);
  assert.ok(!/const \{[^}]*\bdemoMode\b[^}]*\} = req\.body/.test(source));
});
