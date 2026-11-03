#!/usr/bin/env node
/**
 * READ-ONLY. Reconstructs what happened to customer form attempts in a time window, so a
 * "documents verified but nothing submitted" report can be traced to the step that failed.
 * Writes nothing, sends no email, touches no Storage object.
 *
 *   node scripts/trace-submission.cjs --from 2026-11-02 --to 2026-11-03
 *   node scripts/trace-submission.cjs --from 2026-11-02T08:00 --to 2026-11-02T18:00 --ip 102.89
 *
 * --from / --to   ISO dates or datetimes (UTC). Default: the last 48 hours.
 * --ip <prefix>   only show requests whose masked IP starts with this
 *
 * Needs the same apps/backend/.env service-account fields as the server (PROJECT_ID,
 * CLIENT_EMAIL, PRIVATE_KEY).
 */
'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const admin = require('../server-utils/firebaseAdminCompat.cjs');
const { CUSTOMER_FORM_CONFIGS } = require('../server-utils/customerFormPolicy.cjs');

const privateKey = String(process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n');
if (!privateKey.includes('BEGIN')) {
  console.error('PRIVATE_KEY missing or unparseable in apps/backend/.env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey,
  }),
});
const db = admin.firestore();

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
};
const to = arg('--to') ? new Date(arg('--to')) : new Date();
const from = arg('--from') ? new Date(arg('--from')) : new Date(to.getTime() - 48 * 3600 * 1000);
const ipPrefix = arg('--ip');

// The customer-facing steps of a form, in the order a customer hits them.
const INTERESTING_PATHS = [
  '/api/document-ai/process',
  '/api/autofill/verify-nin',
  '/api/autofill/verify-cac',
  '/api/public/upload',
  '/api/submit-form',
];

const fmt = (iso) => String(iso).replace('T', ' ').slice(0, 19);

(async () => {
  console.log(`Window (UTC): ${from.toISOString()}  ->  ${to.toISOString()}\n`);

  // 1. Every request the backend saw on the customer path, with its HTTP status.
  //    eventLogs.createdAt is an ISO string, so a string range is a time range.
  const events = await db.collection('eventLogs')
    .where('createdAt', '>=', from.toISOString())
    .where('createdAt', '<=', to.toISOString())
    .orderBy('createdAt')
    .get();

  const steps = events.docs
    .map((d) => d.data())
    .filter((e) => INTERESTING_PATHS.includes(e.requestPath))
    .filter((e) => !ipPrefix || String(e.ipMasked || '').startsWith(ipPrefix));

  console.log(`== Customer-path requests (${steps.length}) — grouped by masked IP`);
  const byIp = new Map();
  for (const e of steps) {
    const key = `${e.ipMasked || 'unknown-ip'} | ${e.browser || '?'} on ${e.os || '?'}`;
    if (!byIp.has(key)) byIp.set(key, []);
    byIp.get(key).push(e);
  }
  for (const [key, list] of byIp) {
    console.log(`\n-- ${key}`);
    for (const e of list) {
      const flag = e.responseStatus >= 400 ? '  <-- FAILED' : '';
      console.log(`   ${fmt(e.createdAt)}  ${String(e.responseStatus).padEnd(4)} ${e.requestPath}${flag}`);
    }
    const reachedSubmit = list.some((e) => e.requestPath === '/api/submit-form');
    const okSubmit = list.some((e) => e.requestPath === '/api/submit-form' && e.responseStatus < 300);
    const failedUpload = list.some((e) => e.requestPath === '/api/public/upload' && e.responseStatus >= 400);
    const limited = list.some((e) => e.responseStatus === 429);
    let verdict = 'submitted';
    if (!okSubmit) {
      if (limited) verdict = 'BLOCKED: hit a rate limit (429)';
      else if (failedUpload) verdict = 'BLOCKED: document upload to Storage failed (see status: 403 = CSRF/cookie, 500 = Storage/billing)';
      else if (reachedSubmit) verdict = 'BLOCKED: submit-form rejected (see status)';
      else verdict = 'NEVER SUBMITTED: stopped after verification (mismatch popup, guest dialog closed, or left)';
    }
    console.log(`   => ${verdict}`);
  }

  // 2. Identity / document verification audit trail (what the admin "audit" screen shows).
  const verifications = await db.collection('verification-audit-logs')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(from))
    .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(to))
    .orderBy('createdAt')
    .get();
  console.log(`\n== verification-audit-logs (${verifications.size})`);
  for (const d of verifications.docs) {
    const v = d.data();
    console.log(`   ${fmt(v.createdAt?.toDate?.().toISOString())}  ${String(v.verificationType).padEnd(10)} ${String(v.result).padEnd(8)} ${v.identityNumberMasked || ''}  ${v.errorCode || ''} ${v.errorMessage || ''}`.trimEnd());
  }

  // 3. Validation rejections are recorded as security events.
  const rejections = verifications.docs
    .map((d) => d.data())
    .filter((v) => v.securityEventType === 'validation_failure');
  if (rejections.length) {
    console.log(`\n== Validation rejections (${rejections.length})`);
    for (const r of rejections) {
      console.log(`   ${r.metadata?.path}  ${JSON.stringify(r.metadata?.errors)}`);
    }
  }

  // 4. Submissions that DID land, so nothing is reported missing that actually exists.
  const collections = [...new Set(CUSTOMER_FORM_CONFIGS.map((p) => p.collection))];
  console.log('\n== Submissions saved in the window');
  for (const name of collections) {
    const snap = await db.collection(name)
      .where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(from))
      .where('submittedAt', '<=', admin.firestore.Timestamp.fromDate(to))
      .get();
    for (const d of snap.docs) {
      const s = d.data();
      console.log(`   ${name.padEnd(20)} ${s.ticketId}  ${s.formType}  ${s.submittedBy || ''}  ${fmt(s.submittedAt?.toDate?.().toISOString())}`);
    }
  }
  console.log('\nDone (read-only).');
  process.exit(0);
})().catch((error) => {
  console.error('Trace failed:', error.message);
  if (/index/i.test(error.message)) console.error('Firestore asked for an index; open the link above once, then re-run.');
  process.exit(1);
});
