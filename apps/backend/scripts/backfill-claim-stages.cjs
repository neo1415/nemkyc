#!/usr/bin/env node
/**
 * One-off: give every existing claim document a `claim` lifecycle block derived from its legacy
 * `status`, so the customer tracker, staff dialog and queue all read the same shape.
 *
 * Dry run (default) prints what would change. Pass --apply to write. Idempotent: documents that
 * already carry a valid `claim.step` are skipped.
 *
 *   node scripts/backfill-claim-stages.cjs            # dry run
 *   node scripts/backfill-claim-stages.cjs --apply    # write
 */
'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const admin = require('../server-utils/firebaseAdminCompat.cjs');
const lifecycle = require('../src/lib/claimLifecycle.cjs');
const { getAllClaimCollections } = require('../server-utils/customerFormPolicy.cjs');

const apply = process.argv.includes('--apply');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: String(process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }),
});
const db = admin.firestore();

function toMillis(value) {
  if (!value) return Date.now();
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number') return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

(async () => {
  const collections = getAllClaimCollections();
  let scanned = 0;
  let changed = 0;
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    for (const doc of snapshot.docs) {
      scanned++;
      const data = doc.data();
      if (data.claim && lifecycle.isValidStep(data.claim.step)) continue;
      const submitted = toMillis(data.submittedAt || data.timestamp || data.createdAt);
      const step = lifecycle.stepFromLegacyStatus(data.status);
      const block = lifecycle.initialClaimBlock(submitted);
      block.step = step;
      block.stage = lifecycle.STEPS[step].stage;
      block.waitingOn = lifecycle.STEPS[step].waitingOn;
      if (step !== 'registered') {
        block.history.push({
          step,
          stage: block.stage,
          at: toMillis(data.updatedAt || data.approvedAt) || submitted,
          byUid: data.updatedBy || data.approvedBy || null,
          byName: data.updaterName || data.approverName || 'NEM Insurance',
          note: data.updateComment || data.approvalComment || `Migrated from legacy status "${data.status || 'pending'}"`,
          customerVisible: true,
        });
      }
      if (step === 'declined') {
        block.decision = { outcome: 'decline', reason: data.approvalComment || data.updateComment || 'Declined before the claims tracker was introduced', at: block.history[block.history.length - 1].at, byUid: data.approvedBy || null };
      }
      changed++;
      console.log(`${apply ? 'UPDATE' : 'would update'} ${collection}/${doc.id}: status=${data.status || 'pending'} -> ${block.stage}/${block.step}`);
      if (apply) {
        await doc.ref.update({ claim: block, lastClaimStep: step });
      }
    }
  }
  console.log(`\n${apply ? 'Updated' : 'Would update'} ${changed} of ${scanned} claim documents across ${collections.length} collections.`);
  process.exit(0);
})().catch((error) => {
  console.error('Backfill failed:', error.message);
  process.exit(1);
});
