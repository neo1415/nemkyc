#!/usr/bin/env node
/**
 * Deploys firestore.rules (and optionally storage.rules) through the Firebase Rules REST API,
 * authenticating with the backend service account in apps/backend/.env.
 *
 * The firebase CLI refuses these credentials ("Failed to authenticate") and the GitHub Actions
 * hosting service account lacks the Firebase Rules Admin role, so this is how rules ship until
 * one of those is fixed.
 *
 *   node scripts/deploy-rules.cjs            # dry run: compiles and reports, releases nothing
 *   node scripts/deploy-rules.cjs --apply    # create ruleset + update the live release
 *   node scripts/deploy-rules.cjs --apply --storage
 */
'use strict';
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const admin = require('../server-utils/firebaseAdminCompat.cjs');

const apply = process.argv.includes('--apply');
const includeStorage = process.argv.includes('--storage');
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const projectId = process.env.PROJECT_ID;

if (!projectId) {
  console.error('PROJECT_ID missing from apps/backend/.env');
  process.exit(1);
}

const credential = admin.credential.cert({
  projectId,
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: String(process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
});

async function accessToken() {
  const token = await credential.getAccessToken();
  return token.access_token;
}

async function api(token, method, url, body) {
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  if (!response.ok) {
    const message = parsed?.error?.message || text.slice(0, 300);
    const error = new Error(`${method} ${url.replace(projectId, '<project>')} -> ${response.status}: ${message}`);
    error.status = response.status;
    throw error;
  }
  return parsed;
}

/** Firestore release is `cloud.firestore`; Storage is `firebase.storage/<bucket>`. */
async function deploy(token, { label, file, releaseName }) {
  const content = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  console.log(`\n${label}: ${file} (${content.length} bytes)`);

  const ruleset = await api(token, 'POST', `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
    source: { files: [{ name: file, content }] },
  });
  console.log(`  compiled ruleset ${ruleset.name.split('/').pop()}`);

  if (!apply) {
    console.log('  dry run: ruleset created but NOT released (pass --apply to release)');
    return;
  }

  const release = `projects/${projectId}/releases/${releaseName}`;
  try {
    await api(token, 'PATCH', `https://firebaserules.googleapis.com/v1/${release}`, {
      release: { name: release, rulesetName: ruleset.name },
    });
    console.log(`  released to ${releaseName}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    await api(token, 'POST', `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`, {
      name: release,
      rulesetName: ruleset.name,
    });
    console.log(`  created release ${releaseName}`);
  }
}

/** Reads back what is actually live and compares it to the repo. */
async function verify(token, { label, file, releaseName }) {
  const release = await api(token, 'GET', `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/${releaseName}`);
  const ruleset = await api(token, 'GET', `https://firebaserules.googleapis.com/v1/${release.rulesetName}`);
  const live = ruleset.source.files[0].content.trim();
  const repo = fs.readFileSync(path.join(repoRoot, file), 'utf8').trim();
  console.log(`${label}: live ruleset ${release.rulesetName.split('/').pop()} — matches repo: ${live === repo}`);
  return live;
}

(async () => {
  const token = await accessToken();

  if (process.argv.includes('--verify')) {
    const firestore = await verify(token, { label: 'Firestore', file: 'firestore.rules', releaseName: 'cloud.firestore' });
    console.log('  sessions collection denied to clients:', /match \/sessions\/\{docId\} \{\s*allow read, write: if false;/.test(firestore));
    console.log('  claim-scope self-escalation blocked:', firestore.includes("'claimAccessAll', 'assignedClaimCollections'"));
    const storage = await verify(token, { label: 'Storage', file: 'storage.rules', releaseName: `firebase.storage/${process.env.FIREBASE_STORAGE_BUCKET}` });
    console.log('  CAC documents restricted to staff/brokers:', /allow read: if isBroker\(\) \|\| isAdminOrCompliance\(\);/.test(storage));
    return;
  }

  console.log(`Project ${projectId} — ${apply ? 'APPLYING' : 'dry run'}`);

  await deploy(token, { label: 'Firestore rules', file: 'firestore.rules', releaseName: 'cloud.firestore' });

  if (includeStorage) {
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    try {
      await deploy(token, { label: 'Storage rules', file: 'storage.rules', releaseName: `firebase.storage/${bucket}` });
    } catch (error) {
      console.error(`  Storage rules failed (expected while billing is closed): ${error.message}`);
    }
  }

  console.log('\nDone.');
  process.exit(0);
})().catch((error) => {
  console.error('\nFailed:', error.message);
  process.exit(1);
});
