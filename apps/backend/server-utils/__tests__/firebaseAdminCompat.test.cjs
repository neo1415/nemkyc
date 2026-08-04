const test = require('node:test');
const assert = require('node:assert/strict');

test('Firebase Admin compatibility surface supports the backend namespace API', () => {
  const admin = require('../firebaseAdminCompat.cjs');

  assert.equal(typeof admin.initializeApp, 'function');
  assert.equal(typeof admin.credential.cert, 'function');
  assert.equal(typeof admin.auth, 'function');
  assert.equal(typeof admin.firestore, 'function');
  assert.equal(typeof admin.firestore.FieldValue.serverTimestamp, 'function');
  assert.equal(typeof admin.firestore.FieldPath.documentId, 'function');
  assert.equal(typeof admin.firestore.Timestamp.fromDate, 'function');
  assert.equal(typeof admin.storage, 'function');
  assert.ok(Array.isArray(admin.apps));
});

