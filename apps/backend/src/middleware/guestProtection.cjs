'use strict';

/**
 * Abuse protection for the parts of the customer journey that work without an account: NIN/CAC
 * checks, document reading, document upload and guest submission.
 *
 * - Limits are keyed on req.ip (Express resolves it through the one trusted proxy hop), never on a
 *   raw X-Forwarded-For value the client can choose.
 * - Guests get match-only identity checks: the registry record stays on the server and only the
 *   verdict is returned. Signed-in users keep the full record for auto-fill.
 * - Optional Cloudflare Turnstile: when TURNSTILE_SECRET_KEY is set, a guest must first exchange a
 *   Turnstile token for a signed two-hour guest session (x-guest-session header). Unset = off.
 */
const crypto = require('node:crypto');
const { matchCACData, matchNINData } = require('../lib/identityMatch.cjs');

const GUEST_SESSION_HEADER = 'x-guest-session';
const GUEST_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const envInt = (name, fallback) => {
  const value = parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

function createGuestProtection({ rateLimit, secret, logVerificationAttempt = async () => {}, fetchImpl = globalThis.fetch }) {
  if (!secret) throw new Error('guestProtection needs a signing secret');
  const signingKey = crypto.createHash('sha256').update(`guest-session:${secret}`).digest();
  const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

  // ---------- guest sessions ----------

  const sign = (payload) => crypto.createHmac('sha256', signingKey).update(payload).digest('base64url');

  function issueGuestSession(now = Date.now()) {
    const payload = Buffer.from(JSON.stringify({ exp: now + GUEST_SESSION_TTL_MS, n: crypto.randomBytes(9).toString('base64url') }))
      .toString('base64url');
    return { token: `${payload}.${sign(payload)}`, expiresAt: now + GUEST_SESSION_TTL_MS };
  }

  function isValidGuestSession(token, now = Date.now()) {
    if (typeof token !== 'string' || token.length > 512) return false;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
    try {
      const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      return typeof exp === 'number' && exp > now;
    } catch {
      return false;
    }
  }

  async function verifyTurnstile(token, ip) {
    if (typeof token !== 'string' || !token || token.length > 2048) return false;
    try {
      const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip || '' }),
      });
      const result = await response.json();
      return result?.success === true;
    } catch (error) {
      console.error('Turnstile verification request failed:', error.message);
      return false;
    }
  }

  /** POST /api/public/guest-session: { turnstileToken } -> { token, expiresAt, humanCheck } */
  async function guestSessionHandler(req, res) {
    if (turnstileEnabled() && !(await verifyTurnstile(req.body?.turnstileToken, req.ip))) {
      return res.status(403).json({
        error: 'Human check failed',
        code: 'HUMAN_CHECK_FAILED',
        message: 'We could not confirm this request. Please refresh the page and try again.',
      });
    }
    return res.json({ ...issueGuestSession(), humanCheck: turnstileEnabled() });
  }

  /** Guests must carry a valid guest session when Turnstile is configured. Signed-in users pass. */
  function requireHumanCheck(req, res, next) {
    if (req.user || !turnstileEnabled()) return next();
    if (isValidGuestSession(req.headers[GUEST_SESSION_HEADER])) return next();
    return res.status(403).json({
      error: 'Human check required',
      code: 'HUMAN_CHECK_REQUIRED',
      message: 'Please refresh the page and try again.',
    });
  }

  // ---------- limits ----------

  const keyFor = (req) => (req.user?.uid ? `u:${req.user.uid}` : `ip:${req.ip}`);
  const limitHandler = (message) => (req, res) => {
    console.warn(`⚠️  Rate limit exceeded (${keyFor(req)}) on ${req.path}`);
    res.status(429).json({ error: 'Too many requests', code: 'RATE_LIMITED', message, retryAfter: 3600 });
  };

  // Every request counts. Guests are per IP; Nigerian carriers share addresses, so these stay
  // well above what one customer needs (a CDD form makes 1-3 identity checks).
  const identityLookupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: (req) => (req.user ? envInt('USER_HOURLY_LOOKUP_LIMIT', 60) : envInt('GUEST_HOURLY_LOOKUP_LIMIT', 20)),
    keyGenerator: keyFor,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHandler('Too many verification attempts. Please try again in an hour.'),
  });

  // Each document is read once, plus retries; a CDD form has up to five documents.
  const documentReadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: (req) => (req.user ? envInt('USER_HOURLY_DOCUMENT_LIMIT', 120) : envInt('GUEST_HOURLY_DOCUMENT_LIMIT', 40)),
    keyGenerator: keyFor,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHandler('Too many documents were checked from this connection. Please try again in an hour.'),
  });

  // The same number looked up repeatedly by guests is enumeration, not a customer correcting a typo.
  const perIdentity = new Map();
  const PER_IDENTITY_WINDOW_MS = 60 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of perIdentity) if (entry.resetAt <= now) perIdentity.delete(key);
  }, 10 * 60 * 1000).unref();

  function perIdentityLimiter(field) {
    return function perIdentityLimit(req, res, next) {
      if (req.user) return next();
      const value = String(req.body?.[field] || '').trim();
      if (!value) return next();
      const key = crypto.createHash('sha256').update(`${field}:${value}`).digest('hex');
      const now = Date.now();
      const entry = perIdentity.get(key);
      if (!entry || entry.resetAt <= now) {
        perIdentity.set(key, { count: 1, resetAt: now + PER_IDENTITY_WINDOW_MS });
        return next();
      }
      entry.count++;
      if (entry.count > envInt('GUEST_PER_IDENTITY_HOURLY_LIMIT', 6)) {
        return limitHandler('This number has been checked too many times. Please try again in an hour.')(req, res);
      }
      return next();
    };
  }

  // Ceiling on guest identity lookups per UTC day, so a distributed abuser cannot run up the bill.
  let dailyDate = '';
  let dailyCount = 0;
  function guestDailyCap(req, res, next) {
    if (req.user) return next();
    const today = new Date().toISOString().slice(0, 10);
    if (today !== dailyDate) {
      dailyDate = today;
      dailyCount = 0;
    }
    dailyCount++;
    if (dailyCount > envInt('GUEST_DAILY_LOOKUP_CAP', 1500)) {
      console.error(`🚨 Guest daily identity lookup cap reached (${dailyCount - 1}); refusing until midnight UTC`);
      return res.status(503).json({
        error: 'Verification temporarily unavailable',
        code: 'DAILY_CAP_REACHED',
        message: 'Identity verification is temporarily unavailable. You can still submit; our team will verify your details.',
      });
    }
    return next();
  }

  // ---------- match-only responses ----------

  const MATCH_REQUIREMENTS = {
    NIN: { required: ['firstName', 'lastName'], message: 'Please enter your first and last name before we verify your NIN.' },
    CAC: { required: ['companyName'], message: 'Please enter the company name before we verify the RC number.' },
  };

  /**
   * Guests must send what they typed in `match`; the response replaces the registry record with
   * { match: { matches, mismatches, warnings, fields } }. Signed-in users get the record and, when
   * they sent `match`, the verdict as well.
   */
  function identityMatchResponse(kind) {
    const matcher = kind === 'NIN' ? matchNINData : matchCACData;
    const { required, message } = MATCH_REQUIREMENTS[kind];

    return function identityMatchOnly(req, res, next) {
      const entered = req.body?.match && typeof req.body.match === 'object' ? req.body.match : null;
      if (!req.user && (!entered || required.some((field) => !String(entered[field] || '').trim()))) {
        return res.status(400).json({ status: false, code: 'MATCH_DETAILS_REQUIRED', message });
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (!body || typeof body !== 'object') return originalJson(body);
        const { data, ...rest } = body;
        const match = body.status === true && data && entered ? matcher(entered, data) : undefined;

        if (match && !match.matches) {
          logVerificationAttempt({
            verificationType: kind,
            identityNumber: kind === 'NIN' ? req.body.nin : req.body.rc_number,
            userId: req.user?.uid || 'anonymous',
            userEmail: req.user?.email || 'anonymous',
            ipAddress: req.ip || 'unknown',
            result: 'mismatch',
            errorCode: 'DETAILS_MISMATCH',
            errorMessage: `Mismatched fields: ${match.fields.join(', ')}`,
            metadata: { source: 'submission-check', userAgent: req.headers['user-agent'] },
          }).catch(() => {});
        }

        if (req.user) return originalJson(match ? { ...body, match } : body);
        return originalJson(match ? { ...rest, match } : rest);
      };
      return next();
    };
  }

  return {
    GUEST_SESSION_HEADER,
    documentReadLimiter,
    guestDailyCap,
    guestSessionHandler,
    identityLookupLimiter,
    identityMatchResponse,
    isValidGuestSession,
    issueGuestSession,
    perIdentityLimiter,
    requireHumanCheck,
  };
}

module.exports = { createGuestProtection, GUEST_SESSION_HEADER };
