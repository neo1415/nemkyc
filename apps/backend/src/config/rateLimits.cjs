'use strict';

/**
 * Rate limiter definitions, moved verbatim from server.js. The `app.use(path, limiter)` registrations
 * stay in server.js because their position relative to the routes is behaviour.
 */
function createRateLimiters({ rateLimit, logRateLimitHit }) {
// ============= RATE LIMITING CONFIGURATION =============

// Authentication rate limiting - protects against brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes (reasonable for legitimate users)
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from counting against the limit
  skipSuccessfulRequests: true,
  // Custom key generator to be more lenient for different users from same IP
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return ip + ':' + (req.body?.email || 'anonymous');
  },
  // Log rate limit hits
  handler: async (req, res) => {
    await logRateLimitHit(req).catch(err => console.error('Failed to log rate limit:', err));
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// Form submission rate limiting - prevents spam while allowing legitimate use
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // 15 form submissions per hour (generous for legitimate users)
  message: {
    error: 'Too many form submissions. Please try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all submissions
  keyGenerator: (req) => {
    // More lenient for authenticated users
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userKey = req.body?.userUid || req.body?.userEmail || 'anonymous';
    return ip + ':' + userKey;
  },
  // Log rate limit hits
  handler: async (req, res) => {
    await logRateLimitHit(req).catch(err => console.error('Failed to log rate limit:', err));
    res.status(429).json({
      error: 'Too many form submissions. Please try again in an hour.',
      retryAfter: '1 hour'
    });
  }
});

// General API rate limiting - prevents API abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes (very generous for normal use)
  message: {
    error: 'Too many requests. Please slow down and try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Strict rate limiting for sensitive operations
const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 sensitive operations per hour
  message: {
    error: 'Too many sensitive operations. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// MFA rate limiting (existing, but improved)
const mfaAttemptLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // Increased from 5 to 8 for better UX
  message: {
    error: 'Too many MFA attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email rate limiting - prevents email spam
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 emails per hour
  message: {
    error: 'Too many email requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Account provisioning from a guest submission is the most abusable public write we have.
const guestProvisionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => Boolean(req.headers.authorization) || Boolean(req.cookies?.__session) || !req.body?.guest,
  keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown',
  handler: (req, res) => res.status(429).json({
    error: 'Too many new accounts',
    message: 'Too many accounts were created from this network recently. Please try again later or sign in.',
    retryAfter: 3600
  })
});

const publicFormSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60, // per IP; Nigerian mobile carriers put thousands of users behind one address
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown',
  handler: (req, res) => res.status(429).json({
    error: 'Too many form submissions',
    message: 'You have submitted several forms recently. Please wait one hour and try again.',
    retryAfter: 3600
  })
});

const publicUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 240, // per IP; a single CDD submission uploads 4-5 documents
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown',
  handler: (req, res) => res.status(429).json({
    error: 'Too many uploads',
    message: 'You have uploaded several documents recently. Please wait and try again.',
    retryAfter: 3600
  })
});

  return {
    authLimiter,
    submissionLimiter,
    apiLimiter,
    sensitiveOperationLimiter,
    mfaAttemptLimit,
    emailLimiter,
    guestProvisionLimiter,
    publicFormSubmissionLimiter,
    publicUploadLimiter,
  };
}

module.exports = { createRateLimiters };
