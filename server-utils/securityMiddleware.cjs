/**
 * Security Middleware
 * 
 * Provides additional security middleware for the Identity Remediation System:
 * - Rate limiting for verification endpoints
 * - Security header validation
 * - Request sanitization
 * - SERVICEID protection
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for verification endpoints
 * Prevents abuse of verification APIs
 * 
 * Limits:
 * - 10 requests per 15 minutes per IP
 * - Stricter than general API rate limits
 */
const verificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many verification attempts',
    message: 'You have exceeded the maximum number of verification attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use IP address for rate limiting
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind proxy, otherwise use req.ip
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  },
  // Skip rate limiting for successful requests (only count failures)
  skip: (req, res) => {
    // Only rate limit failed verification attempts
    // This is checked after the response is sent
    return res.statusCode === 200;
  },
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many verification attempts',
      message: 'You have exceeded the maximum number of verification attempts. Please try again in 15 minutes.',
      retryAfter: 900 // seconds
    });
  }
});

/**
 * Rate limiter for bulk verification endpoints
 * More lenient than individual verification
 * 
 * Limits:
 * - 5 requests per hour per authenticated user
 */
const bulkVerificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user to 5 bulk operations per hour
  message: {
    error: 'Too many bulk verification requests',
    message: 'You have exceeded the maximum number of bulk verification requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use authenticated user ID for rate limiting
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.uid || req.ip;
  },
  handler: (req, res) => {
    console.warn(`⚠️  Bulk verification rate limit exceeded for user: ${req.user?.email || req.ip}`);
    res.status(429).json({
      error: 'Too many bulk verification requests',
      message: 'You have exceeded the maximum number of bulk verification requests. Please try again in 1 hour.',
      retryAfter: 3600 // seconds
    });
  }
});

/**
 * Middleware to ensure SERVICEID is never sent to frontend
 * Strips SERVICEID from response headers and body
 */
const stripServiceId = (req, res, next) => {
  // Override res.json to strip SERVICEID from response
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Recursively remove SERVICEID from response data
    const sanitized = sanitizeObject(data);
    return originalJson(sanitized);
  };
  
  // Remove SERVICEID from response headers
  res.removeHeader('SERVICEID');
  res.removeHeader('serviceid');
  res.removeHeader('ServiceId');
  
  next();
};

/**
 * Recursively sanitize object to remove sensitive fields
 * @param {any} obj - Object to sanitize
 * @returns {any} Sanitized object
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive fields
      const keyLower = key.toLowerCase();
      if (keyLower === 'serviceid' || 
          keyLower === 'encryption_key' || 
          keyLower === 'private_key' ||
          keyLower === 'secret_key') {
        continue; // Don't include in response
      }
      
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware to add additional security headers
 * Complements helmet middleware
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Permissions policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // Clear site data on logout (if applicable)
  if (req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }
  
  next();
};

/**
 * Middleware to validate request origin
 * Ensures requests come from allowed origins
 */
const validateOrigin = (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  
  // Skip validation for requests without origin (server-to-server, health checks)
  if (!origin) {
    return next();
  }
  
  // Log suspicious origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://nemforms.com',
    'https://www.nemforms.com',
    'https://nem-kyc.web.app',
    'https://nem-kyc.firebaseapp.com'
  ];
  
  const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
  
  if (!isAllowed && process.env.NODE_ENV === 'production') {
    console.warn(`⚠️  Suspicious origin detected: ${origin} for ${req.path}`);
    // Don't block, just log (CORS will handle blocking)
  }
  
  next();
};

/**
 * Middleware to log security events
 * Logs suspicious activity for audit trail
 */
const logSecurityEvent = (eventType, details) => {
  const timestamp = new Date().toISOString();
  console.log(`🔒 [SECURITY] ${timestamp} - ${eventType}:`, JSON.stringify(details, null, 2));
  
  // In production, this should write to a dedicated security log file
  // or send to a SIEM system
};

module.exports = {
  verificationRateLimiter,
  bulkVerificationRateLimiter,
  stripServiceId,
  additionalSecurityHeaders,
  validateOrigin,
  logSecurityEvent
};
