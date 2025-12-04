/**
 * SERVER.JS SECURITY ADDITIONS
 * 
 * Add these sections to your server.js file in the locations indicated.
 * These additions provide authentication, rate limiting, and better security.
 */

// ============================================================================
// SECTION 1: ADD AFTER LINE 22 (after crypto import, before config)
// ============================================================================

// ===== AUTHENTICATION MIDDLEWARE =====
/**
 * Middleware to verify Firebase ID tokens
 * Use this on routes that require authentication
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user'
    };
    
    // Get user role from Firestore
    try {
      const userDoc = await admin.firestore().collection('userroles').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        req.user.role = userDoc.data().role || 'user';
      }
    } catch (error) {
      console.warn('Could not fetch user role:', error.message);
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

/**
 * Middleware to check if user has required role
 * Usage: requireRole(['admin', 'super admin'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
    }
    
    // Normalize roles for comparison
    const normalizeRole = (role) => {
      if (!role) return 'user';
      return role.toLowerCase().trim().replace(/[-_]/g, ' ');
    };
    
    const userRole = normalizeRole(req.user.role);
    const allowed = allowedRoles.map(r => normalizeRole(r));
    
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden - Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// ===== RATE LIMITING =====
/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for form submissions
 * Prevents spam submissions
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 submissions per hour
  message: {
    error: 'Too many form submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for general API endpoints
 * Prevents API abuse
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== LOG SANITIZATION =====
/**
 * Sanitize data before logging
 * Removes sensitive information
 */
const sanitizeForLog = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = [
    'password',
    'token',
    'idToken',
    'customToken',
    'authorization',
    'cookie',
    'csrf-token',
    'rawIP',
    'bvn',
    'identificationNumber',
    'accountNumber'
  ];
  
  // Remove sensitive fields
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Mask email (show first 2 chars and domain)
  if (sanitized.email && typeof sanitized.email === 'string') {
    const parts = sanitized.email.split('@');
    if (parts.length === 2) {
      sanitized.email = `${parts[0].substring(0, 2)}***@${parts[1]}`;
    }
  }
  
  // Mask phone (show last 4 digits)
  if (sanitized.phone && typeof sanitized.phone === 'string') {
    const digits = sanitized.phone.replace(/\D/g, '');
    if (digits.length > 4) {
      sanitized.phone = `***${digits.slice(-4)}`;
    }
  }
  
  return sanitized;
};

/**
 * Safe console.log replacement
 * Use this instead of console.log for sensitive data
 */
const safeLog = (message, data) => {
  if (data) {
    console.log(message, sanitizeForLog(data));
  } else {
    console.log(message);
  }
};

// ============================================================================
// SECTION 2: REPLACE CORS CONFIGURATION (around line 90-130)
// ============================================================================

// ===== IMPROVED CORS CONFIGURATION =====
// Get allowed origins from environment variable or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://nemforms.com',
      'https://nem-kyc.web.app',
      'https://nem-kyc.firebaseapp.com'
    ];

// Add Lovable patterns if in development
const lovablePatterns = process.env.NODE_ENV !== 'production' ? [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/preview--.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
] : [];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check Lovable patterns (dev only)
    if (lovablePatterns.length > 0) {
      const isLovableDomain = lovablePatterns.some(pattern => pattern.test(origin));
      if (isLovableDomain) {
        console.log('✅ CORS: Allowing Lovable domain:', origin);
        return callback(null, true);
      }
    }
    
    // Log blocked origins for debugging
    console.warn('❌ CORS: Blocked origin:', origin);
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'CSRF-Token', 'X-Requested-With', 'Authorization', 'x-timestamp'],
}));

// ============================================================================
// SECTION 3: ADD THESE ROUTE PROTECTIONS
// ============================================================================

/**
 * USAGE EXAMPLES:
 * 
 * 1. Protect admin-only endpoints:
 *    app.get('/api/users', authenticate, requireRole(['admin', 'super admin']), async (req, res) => {
 *      // Only admins can access
 *    });
 * 
 * 2. Add rate limiting to auth endpoints:
 *    app.post('/api/login', authLimiter, async (req, res) => {
 *      // Rate limited login
 *    });
 * 
 * 3. Add rate limiting to form submissions:
 *    app.post('/api/submit-form', submissionLimiter, async (req, res) => {
 *      // Rate limited submissions
 *    });
 * 
 * 4. Use safe logging:
 *    safeLog('User data:', userData); // Sensitive fields will be redacted
 */

// ============================================================================
// SECTION 4: SPECIFIC ENDPOINT UPDATES
// ============================================================================

/**
 * UPDATE THESE ENDPOINTS (find and replace):
 * 
 * 1. /api/users - Add authentication
 *    OLD: app.get('/api/users', async (req, res) => {
 *    NEW: app.get('/api/users', authenticate, requireRole(['admin', 'super admin']), async (req, res) => {
 * 
 * 2. /api/users/:userId/role - Add authentication
 *    OLD: app.put('/api/users/:userId/role', async (req, res) => {
 *    NEW: app.put('/api/users/:userId/role', authenticate, requireRole(['super admin']), async (req, res) => {
 * 
 * 3. /api/users/:userId - Add authentication
 *    OLD: app.delete('/api/users/:userId', async (req, res) => {
 *    NEW: app.delete('/api/users/:userId', authenticate, requireRole(['super admin']), async (req, res) => {
 * 
 * 4. /api/events-logs - Add authentication
 *    OLD: app.get('/api/events-logs', async (req, res) => {
 *    NEW: app.get('/api/events-logs', authenticate, requireRole(['admin', 'super admin', 'compliance', 'claims']), async (req, res) => {
 * 
 * 5. /api/events-logs/:id - Add authentication
 *    OLD: app.get('/api/events-logs/:id', async (req, res) => {
 *    NEW: app.get('/api/events-logs/:id', authenticate, requireRole(['admin', 'super admin']), async (req, res) => {
 * 
 * 6. /api/update-claim-status - Add authentication
 *    OLD: app.post('/api/update-claim-status', async (req, res) => {
 *    NEW: app.post('/api/update-claim-status', authenticate, requireRole(['admin', 'super admin', 'claims']), async (req, res) => {
 * 
 * 7. /api/login - Add rate limiting
 *    OLD: app.post('/api/login', async (req, res) => {
 *    NEW: app.post('/api/login', authLimiter, async (req, res) => {
 * 
 * 8. /api/register - Add rate limiting
 *    OLD: app.post('/api/register', async (req, res) => {
 *    NEW: app.post('/api/register', authLimiter, async (req, res) => {
 * 
 * 9. /api/submit-form - Add rate limiting
 *    OLD: app.post('/api/submit-form', async (req, res) => {
 *    NEW: app.post('/api/submit-form', submissionLimiter, async (req, res) => {
 * 
 * 10. /api/forms/:collection/:id/status - Add authentication
 *     OLD: app.put('/api/forms/:collection/:id/status', async (req, res) => {
 *     NEW: app.put('/api/forms/:collection/:id/status', authenticate, requireRole(['admin', 'super admin', 'claims', 'compliance']), async (req, res) => {
 */

// ============================================================================
// SECTION 5: REPLACE CONSOLE.LOG STATEMENTS
// ============================================================================

/**
 * FIND AND REPLACE (examples):
 * 
 * OLD: console.log('User data:', userData);
 * NEW: safeLog('User data:', userData);
 * 
 * OLD: console.log('Form submission:', formData);
 * NEW: safeLog('Form submission:', formData);
 * 
 * OLD: console.log('Token exchange result:', result);
 * NEW: safeLog('Token exchange result:', result);
 * 
 * Keep simple logs without sensitive data as is:
 * OK: console.log('Server started on port', port);
 * OK: console.log('✅ Event logged successfully');
 */

// ============================================================================
// SECTION 6: ADD TO .ENV FILE
// ============================================================================

/**
 * Add these to your .env file:
 * 
 * # CORS Configuration
 * ALLOWED_ORIGINS=https://nemforms.com,https://nem-kyc.web.app,https://nem-kyc.firebaseapp.com
 * 
 * # Environment
 * NODE_ENV=production
 * 
 * # Existing variables...
 * TYPE=service_account
 * PROJECT_ID=nem-customer-feedback-8d3fb
 * # ... etc
 */

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/**
 * After adding these changes, test:
 * 
 * 1. ✅ Authentication works
 *    - Try accessing /api/users without token (should fail)
 *    - Try accessing /api/users with valid token (should work)
 * 
 * 2. ✅ Rate limiting works
 *    - Try logging in 6 times quickly (6th should fail)
 *    - Wait 15 minutes and try again (should work)
 * 
 * 3. ✅ Role-based access works
 *    - Try accessing admin endpoint as regular user (should fail)
 *    - Try accessing admin endpoint as admin (should work)
 * 
 * 4. ✅ CORS works
 *    - Try from allowed origin (should work)
 *    - Try from blocked origin (should fail)
 * 
 * 5. ✅ Logs are sanitized
 *    - Check logs don't contain passwords, tokens, or full emails
 */

// ============================================================================
// EXPORT FOR USE
// ============================================================================

module.exports = {
  authenticate,
  requireRole,
  authLimiter,
  submissionLimiter,
  apiLimiter,
  sanitizeForLog,
  safeLog
};
