#!/usr/bin/env node
/**
 * Checks that Firebase Storage is writable with the backend service account, and can delete a
 * leftover object. Useful whenever uploads start failing (a closed billing account returns
 * 403 "The billing account for the owning project is disabled").
 *
 *   node scripts/storage-probe.cjs                 # write + read back + delete a probe object
 *   node scripts/storage-probe.cjs --delete <path> # delete one object by its bucket path
 */
'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const admin = require('../server-utils/firebaseAdminCompat.cjs');

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
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const deleteIndex = process.argv.indexOf('--delete');
const targetPath = deleteIndex !== -1 ? process.argv[deleteIndex + 1] : null;

(async () => {
  const bucket = admin.storage().bucket();

  if (targetPath) {
    await bucket.file(targetPath).delete();
    console.log('deleted', targetPath);
    return;
  }

  const [meta] = await bucket.getMetadata();
  console.log(`bucket ${meta.name} (${meta.location}) reachable`);

  const name = `_healthcheck/storage-probe-${Date.now()}.txt`;
  await bucket.file(name).save(Buffer.from('storage probe'), { contentType: 'text/plain', resumable: false });
  const [exists] = await bucket.file(name).exists();
  await bucket.file(name).delete();
  console.log(`write + read-back (${exists}) + delete OK — Storage is healthy`);
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Storage probe FAILED:', error.code || '', String(error.message).slice(0, 200));
    process.exit(1);
  });
