'use strict';

/**
 * CORS whitelist and options, moved verbatim from server.js. Requiring this module has the same
 * load-time effect the block had (reads ADDITIONAL_ALLOWED_ORIGINS and logs the additions).
 */
const { logSecurityEvent } = require('../../server-utils/auditLogger.cjs');

// ============= CORS CONFIGURATION =============
// ✅ SECURE: Explicit whitelist only, no wildcard patterns

const allowedOrigins = [
  // Development environments
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080', // Vite dev server
  
  // Production NEM domains
  'https://nemforms.com',
  'https://www.nemforms.com',
  
  // Firebase hosting (project nem-customer-feedback-8d3fb)
  'https://nem-customer-feedback-8d3fb.web.app',
  'https://nem-customer-feedback-8d3fb.firebaseapp.com',
  'https://nem-kyc.web.app',
  'https://nem-kyc.firebaseapp.com',
  
  // Backend server
  'https://nem-server-rhdb.onrender.com',
];

// Optional: Add environment-specific origins
if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
  const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...additionalOrigins);
  console.log('📋 Added additional allowed origins from env:', additionalOrigins);
}

const corsOptions = {
  origin: function (origin, callback) {
    // CORS library doesn't provide 'this.req', so we can't check method/path here
    // Instead, we'll be permissive with no-origin requests and let other middleware handle security
    
    // Allow requests with no origin (health checks, server-to-server, etc.)
    if (!origin) {
      // In production, allow no-origin requests (Render health checks, etc.)
      // Security is handled by authentication middleware on protected routes
      return callback(null, true);
    }
    
    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Allowing whitelisted origin:', origin);
      return callback(null, true);
    }
    
    // Development: Allow localhost with any port in development mode
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      console.log('✅ CORS: Allowing localhost in development:', origin);
      return callback(null, true);
    }
    
    // Block all other origins
    console.error('❌ CORS: Blocked origin:', origin);
    console.error('💡 To allow this origin, add it to allowedOrigins array or ADDITIONAL_ALLOWED_ORIGINS env var');
    
    // Log CORS block using audit logger
    logSecurityEvent({
      eventType: 'cors_block',
      severity: 'medium',
      description: `CORS policy blocked access from origin: ${origin}`,
      userId: 'unknown',
      ipAddress: 'unknown',
      metadata: {
        origin,
        userAgent: 'unknown'
      }
    }).catch(err => console.error('Failed to log CORS block:', err));
    
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'CSRF-Token',
    'X-Requested-With',
    'Authorization',
    'Accept',
    'Origin',
    'x-timestamp',
    'x-nonce',
    'x-request-id',
    'x-idempotency-key',
    'Idempotency-Key'
  ],
  exposedHeaders: ['CSRF-Token'], // Allow frontend to read CSRF token
  maxAge: 86400, // Cache preflight requests for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = { allowedOrigins, corsOptions };
