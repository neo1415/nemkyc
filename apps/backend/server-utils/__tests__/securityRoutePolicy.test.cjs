'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

test('sensitive legacy routes require server-side authorization', () => {
  const requiredFragments = [
    "app.get('/api/users', requireAuth, requireSuperAdmin",
    "app.delete('/api/users/:userId', requireAuth, requireSuperAdmin",
    "app.post('/api/forms/multiple', requireAuth, requireClaims",
    "app.patch('/api/forms/:collectionName/:formId/status', requireAuth, requireClaims",
    "app.delete('/api/forms/:collectionName/:formId', requireAuth, requireClaims",
    "app.post('/api/pdf/download', requireAuth, requireClaims",
    "app.post('/api/check-birthdays', requireAuth, requireSuperAdmin",
    "app.post('/api/test-birthday-email', requireAuth, requireSuperAdmin",
    "app.get('/api/auth/mfa-status/:uid', requireAuth",
    "app.post('/api/submit-form', publicFormSubmissionLimiter, requireAuth",
    "app.get('/api/forms/:collection/:id/documents/:field', requireAuth",
  ];

  for (const fragment of requiredFragments) {
    assert.ok(source.includes(fragment), `Missing authorization policy: ${fragment}`);
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
  assert.ok(source.includes("app.post('/api/gemini/generate', verificationRateLimiter"));
  assert.ok(source.includes("app.post('/api/public/upload', publicUploadLimiter"));
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
  const routes = [
    'submit-kyc-individual', 'submit-kyc-corporate', 'submit-cdd-individual',
    'submit-cdd-corporate', 'submit-cdd-agents', 'submit-cdd-brokers',
    'submit-cdd-partners', 'submit-claim-motor', 'submit-claim-fire',
    'submit-claim-burglary', 'submit-claim-all-risk',
  ];
  for (const route of routes) {
    assert.ok(source.includes(`app.post('/${route}', rejectDeprecatedSubmissionRoute`));
  }
});

test('production CSRF configuration fails closed', () => {
  assert.ok(source.includes("process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET"));
  assert.ok(!source.includes("'your-csrf-secret-key-change-in-production'"));
});
