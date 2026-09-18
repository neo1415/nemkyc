'use strict';

/**
 * Opaque server-side sessions (Firestore 'sessions' collection), moved verbatim from server.js.
 * `crypto` is the Node module (createHash/randomBytes), not the WebCrypto global.
 */
function createSessionStore({ db, crypto }) {
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours, matches the cookie maxAge
const SESSION_ID_PATTERN = /^[a-f0-9]{64}$/;

function hashSessionId(sessionId) {
  return crypto.createHash('sha256').update(sessionId).digest('hex');
}

/**
 * Mints an opaque session id for a signed-in user. Only its hash is stored, so a Firestore read
 * can never be replayed as a credential, and a bare uid is never accepted as a session again.
 */
async function createSession(uid, req) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  await db.collection('sessions').doc(hashSessionId(sessionId)).set({
    uid,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    userAgent: String(req?.headers?.['user-agent'] || '').slice(0, 200),
    ip: req?.ipData?.masked || null
  });
  return sessionId;
}

async function resolveSessionUid(sessionId) {
  if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) return null;
  const doc = await db.collection('sessions').doc(hashSessionId(sessionId)).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data.uid || (data.expiresAt && data.expiresAt < Date.now())) {
    doc.ref.delete().catch(() => {});
    return null;
  }
  return data.uid;
}

async function destroySession(sessionId) {
  if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) return;
  await db.collection('sessions').doc(hashSessionId(sessionId)).delete().catch(() => {});
}

  return { hashSessionId, createSession, resolveSessionUid, destroySession };
}

module.exports = { createSessionStore };
