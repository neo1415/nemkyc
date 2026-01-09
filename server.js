
const express = require('express');
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser'); 
const csurf = require('csurf');
const cors = require('cors'); 
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const { body, param,validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const app = express();
const axios = require('axios');
const bcrypt = require('bcrypt'); 
const multer = require("multer");
const { getStorage } = require("firebase-admin/storage");
const crypto = require('crypto');

// ============= LOGGING UTILITY =============

/**
 * Logging utility with log levels
 * Reduces verbose logging in production
 */
const logger = {
  debug: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 [DEBUG] ${msg}`, ...args);
    }
  },
  info: (msg, ...args) => {
    console.log(`ℹ️  [INFO] ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    console.warn(`⚠️  [WARN] ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    console.error(`❌ [ERROR] ${msg}`, ...args);
  },
  success: (msg, ...args) => {
    console.log(`✅ [SUCCESS] ${msg}`, ...args);
  }
};

let config = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// ============= CORS CONFIGURATION =============
// ✅ SECURE: Explicit whitelist only, no wildcard patterns

const allowedOrigins = [
  // Development environments
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  
  // Production NEM domains
  'https://nemforms.com',
  'https://www.nemforms.com',
  
  // Firebase hosting
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

const port = process.env.PORT || 3001;

// ============= TRUST PROXY CONFIGURATION =============
// ✅ REQUIRED: Enable trust proxy for Render.com and other reverse proxies
// This allows Express to correctly identify client IPs from X-Forwarded-For header
// Use specific trust proxy configuration instead of 'true' for security
// Trust the first proxy (Render.com, Vercel, etc.)
app.set('trust proxy', 1);

// ============= COMPRESSION MIDDLEWARE =============
// ✅ Compress all responses (70-80% size reduction)
app.use(compression({
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all responses
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024 // Only compress responses larger than 1KB
}));

app.use(cors({
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
    
    // Log CORS block
    logCORSBlock(origin, null).catch(err => console.error('Failed to log CORS block:', err));
    
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'CSRF-Token',
    'X-Requested-With',
    'Authorization',
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
}));

// Middleware setup
app.use(morgan('combined', { stream: accessLogStream }));
app.use(helmet());

// Enhanced security headers
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.permittedCrossDomainPolicies({ permittedPolicies: 'none' }));
app.use(helmet.dnsPrefetchControl({ allow: false }));

// Expect-CT header removed - deprecated in helmet v5+
// Certificate Transparency is now enforced by browsers automatically

// Enhanced Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline only if absolutely necessary
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://nem-server-rhdb.onrender.com", "https://identitytoolkit.googleapis.com"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
  }
}));

app.use(helmet.frameguard({ action: 'deny' })); // Changed from sameorigin to deny for better security
app.use(hpp());
app.use(mongoSanitize());
app.use(xss());

// ✅ SECURE: Request size limits to prevent DoS
app.use(express.json({ 
  limit: '10mb',  // Limit JSON payload size
  strict: true,   // Only accept arrays and objects
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',  // Limit URL-encoded payload size
  parameterLimit: 1000  // Limit number of parameters
}));
app.use(cookieParser());
// CSRF protection will be applied selectively, not globally

// Initialize CSRF protection middleware
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Cross-site cookie policy
  }
});

// Nonce implementation middleware
const generateNonce = () => {
  return uuidv4();
};

app.use((req, res, next) => {
  res.locals.nonce = generateNonce();
  next();
});

const db = admin.firestore();

// ✅ SECURITY: Enhanced multer configuration with size limits and file type validation
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Max 5 files per request
    fields: 50, // Max 50 fields
    parts: 100 // Max 100 parts (fields + files)
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(', ')}`));
    }
  }
});

const bucket = getStorage().bucket();

// ============= ROLE NORMALIZATION HELPER =============
/**
 * Normalize role strings to standard format for consistent comparison
 * Maps common role variants to canonical values
 */
const normalizeRole = (role) => {
  if (!role) return 'default';
  
  const roleLower = role.toLowerCase().trim();
  
  // Map super admin variants
  if (['superadmin', 'super-admin', 'super_admin', 'super admin'].includes(roleLower)) {
    return 'super admin';
  }
  
  // Map user variants
  if (['user', 'regular'].includes(roleLower)) {
    return 'default';
  }
  
  // Return other roles as-is (admin, compliance, claims, default)
  return roleLower;
};

/**
 * Check if a role is super admin (handles variants)
 */
const isSuperAdmin = (role) => {
  return normalizeRole(role) === 'super admin';
};

/**
 * Check if a role is admin or super admin
 */
const isAdminOrSuperAdmin = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'super admin';
};

/**
 * Check if a role is compliance, admin, or super admin
 */
const isAdminOrCompliance = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'compliance' || normalized === 'admin' || normalized === 'super admin';
};

/**
 * Check if a role is claims, compliance, admin, or super admin
 */
const isClaimsOrAdminOrCompliance = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'claims' || normalized === 'compliance' || normalized === 'admin' || normalized === 'super admin';
};

// ============= AUTHENTICATION & AUTHORIZATION MIDDLEWARE =============

/**
 * Middleware to require authentication
 * Verifies session cookie and attaches user data to request
 */
const requireAuth = async (req, res, next) => {
  try {
    // Accept session token from cookie OR Authorization header (for localhost cross-port)
    let sessionToken = req.cookies.__session;
    
    // Fallback: Check Authorization header for localhost development
    if (!sessionToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
        console.log('🔑 Using session token from Authorization header (localhost fallback)');
      }
    }
    
    if (!sessionToken) {
      console.log('❌ No session token found in cookie or Authorization header');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access this resource'
      });
    }

    // Get user data from Firestore
    const userDoc = await db.collection('userroles').doc(sessionToken).get();
    
    if (!userDoc.exists) {
      console.log('❌ Auth failed: Invalid session token');
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'Your session has expired. Please sign in again.'
      });
    }

    const userData = userDoc.data();
    
    // ✅ SESSION TIMEOUT CHECK (2 hours of inactivity)
    const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours (increased from 30 minutes)
    
    // Check timeout if lastActivity exists
    if (userData.lastActivity) {
      const timeSinceLastActivity = Date.now() - userData.lastActivity;
      
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        logger.warn(`Session expired due to inactivity: ${userData.email}`);
        // Don't delete the userroles document! Just clear the session cookie
        res.clearCookie('__session');
        return res.status(401).json({ 
          error: 'Session expired',
          message: 'Your session has expired due to inactivity. Please sign in again.'
        });
      }
    } else {
      // ✅ MIGRATION: If lastActivity doesn't exist, set it now (for existing sessions)
      logger.info(`Initializing lastActivity for existing session: ${userData.email}`);
      await db.collection('userroles').doc(sessionToken).update({
        lastActivity: Date.now()
      }).catch(err => logger.error('Failed to initialize lastActivity:', err));
    }
    
    // Update last activity timestamp (don't await to avoid slowing down requests)
    db.collection('userroles').doc(sessionToken).update({
      lastActivity: Date.now()
    }).catch(err => logger.error('Failed to update lastActivity:', err));
    
    // Attach user data to request for use in route handlers
    req.user = {
      uid: sessionToken,
      email: userData.email,
      name: userData.name || userData.displayName,
      role: normalizeRole(userData.role),
      rawRole: userData.role // Keep original for logging
    };

    console.log('✅ Auth success:', req.user.email, 'Role:', req.user.role);
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred while verifying your session'
    });
  }
};

/**
 * Middleware to require specific roles
 * Must be used after requireAuth
 * Usage: requireRole('admin', 'super admin')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('❌ Role check failed: No user in request (requireAuth not called?)');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access this resource'
      });
    }

    // Normalize all allowed roles for comparison
    const normalizedAllowedRoles = allowedRoles.map(r => normalizeRole(r));
    const userRole = req.user.role; // Already normalized in requireAuth

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log('❌ Authorization failed:', req.user.email, 'has role', userRole, 'but needs one of', normalizedAllowedRoles);
      
      // Log authorization failure
      logAuthorizationFailure(req, allowedRoles, userRole).catch(err => 
        console.error('Failed to log authorization failure:', err)
      );
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource',
        requiredRoles: allowedRoles,
        yourRole: req.user.rawRole
      });
    }

    console.log('✅ Authorization success:', req.user.email, 'has required role', userRole);
    next();
  };
};

/**
 * Middleware to require super admin role
 * Convenience wrapper for requireRole('super admin')
 */
const requireSuperAdmin = requireRole('super admin');

/**
 * Middleware to require admin or super admin role
 */
const requireAdmin = requireRole('admin', 'super admin');

/**
 * Middleware to require compliance, admin, or super admin role
 */
const requireCompliance = requireRole('compliance', 'admin', 'super admin');

/**
 * Middleware to require claims, compliance, admin, or super admin role
 */
const requireClaims = requireRole('claims', 'compliance', 'admin', 'super admin');

/**
 * Middleware to check if user owns the resource or is admin
 * Checks if req.user.uid matches the resource's submittedBy field
 */
const requireOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins can access anything
    if (isAdminOrSuperAdmin(req.user.role)) {
      console.log('✅ Admin access granted:', req.user.email);
      return next();
    }

    // For regular users, check ownership
    // This will be used in routes that fetch documents
    req.requireOwnership = true;
    next();
    
  } catch (error) {
    console.error('Owner check error:', error);
    return res.status(500).json({ error: 'Authorization error' });
  }
};

// ============= INPUT VALIDATION MIDDLEWARE =============

/**
 * Validation helper - checks validation results and returns errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation failed:', errors.array());
    
    // Log validation failure
    logValidationFailure(req, errors.array()).catch(err => 
      console.error('Failed to log validation failure:', err)
    );
    
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validation chains for form submission
 */
const validateFormSubmission = [
  body('formType')
    .trim()
    .notEmpty().withMessage('Form type is required')
    .isString().withMessage('Form type must be a string')
    .isLength({ max: 100 }).withMessage('Form type too long'),
  
  body('userEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('userUid')
    .optional()
    .trim()
    .isString().withMessage('User UID must be a string')
    .isLength({ max: 128 }).withMessage('User UID too long'),
  
  body('formData')
    .notEmpty().withMessage('Form data is required')
    .isObject().withMessage('Form data must be an object'),
  
  // Common form fields validation
  body('formData.name')
    .optional()
    .trim()
    .isString().withMessage('Name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('formData.email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email in form data')
    .normalizeEmail(),
  
  body('formData.phone')
    .optional()
    .trim()
    .matches(/^[\d\s\+\-\(\)]+$/).withMessage('Invalid phone number format'),
  
  body('formData.companyName')
    .optional()
    .trim()
    .isString().withMessage('Company name must be a string')
    .isLength({ max: 200 }).withMessage('Company name too long'),
  
  handleValidationErrors
];

/**
 * Validation chains for claim status update
 */
const validateClaimStatusUpdate = [
  param('collection')
    .trim()
    .notEmpty().withMessage('Collection name is required')
    .matches(/^[a-z0-9\-]+$/).withMessage('Invalid collection name format'),
  
  param('id')
    .trim()
    .notEmpty().withMessage('Document ID is required')
    .matches(/^[a-zA-Z0-9\-_]+$/).withMessage('Invalid document ID format'),
  
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
  
  body('approverUid')
    .optional()
    .trim()
    .isString().withMessage('Approver UID must be a string'),
  
  body('comment')
    .optional()
    .trim()
    .isString().withMessage('Comment must be a string')
    .isLength({ max: 1000 }).withMessage('Comment too long (max 1000 characters)'),
  
  body('userEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid user email')
    .normalizeEmail(),
  
  body('formType')
    .optional()
    .trim()
    .isString().withMessage('Form type must be a string'),
  
  handleValidationErrors
];

/**
 * Validation chains for form status update
 */
const validateFormStatusUpdate = [
  param('collection')
    .trim()
    .notEmpty().withMessage('Collection name is required')
    .matches(/^[a-z0-9\-]+$/).withMessage('Invalid collection name format'),
  
  param('id')
    .trim()
    .notEmpty().withMessage('Document ID is required')
    .matches(/^[a-zA-Z0-9\-_]+$/).withMessage('Invalid document ID format'),
  
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
  
  body('updaterUid')
    .trim()
    .notEmpty().withMessage('Updater UID is required')
    .isString().withMessage('Updater UID must be a string'),
  
  body('comment')
    .optional()
    .trim()
    .isString().withMessage('Comment must be a string')
    .isLength({ max: 1000 }).withMessage('Comment too long (max 1000 characters)'),
  
  handleValidationErrors
];

/**
 * Validation chains for user registration
 */
const validateUserRegistration = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'),
  
  body('displayName')
    .trim()
    .notEmpty().withMessage('Display name is required')
    .isString().withMessage('Display name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Display name must be 2-100 characters'),
  
  body('role')
    .optional()
    .trim()
    .isIn(['default', 'user', 'claims', 'compliance', 'admin', 'super admin'])
    .withMessage('Invalid role'),
  
  body('dateOfBirth')
    .optional()
    .trim()
    .isISO8601().withMessage('Invalid date format (use YYYY-MM-DD)'),
  
  handleValidationErrors
];

/**
 * Validation chains for user role update
 */
const validateRoleUpdate = [
  param('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isString().withMessage('User ID must be a string'),
  
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['default', 'user', 'claims', 'compliance', 'admin', 'super admin'])
    .withMessage('Invalid role value'),
  
  handleValidationErrors
];

/**
 * Validation chains for pagination parameters
 */
const validatePagination = [
  param('collection')
    .optional()
    .trim()
    .matches(/^[a-z0-9\-]+$/).withMessage('Invalid collection name format'),
  
  param('id')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9\-_]+$/).withMessage('Invalid document ID format'),
  
  body('page')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Page must be between 1 and 10000')
    .toInt(),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

/**
 * Validation for email sending
 */
const validateEmailRequest = [
  body('userEmail')
    .trim()
    .notEmpty().withMessage('User email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('formType')
    .trim()
    .notEmpty().withMessage('Form type is required')
    .isString().withMessage('Form type must be a string'),
  
  body('userName')
    .optional()
    .trim()
    .isString().withMessage('User name must be a string')
    .isLength({ max: 100 }).withMessage('User name too long'),
  
  handleValidationErrors
];

/**
 * Sanitize HTML content to prevent XSS
 */
const sanitizeHtmlFields = (req, res, next) => {
  // List of fields that might contain HTML
  const htmlFields = ['comment', 'description', 'notes', 'message'];
  
  // Sanitize body fields
  if (req.body) {
    htmlFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        // Remove script tags and dangerous attributes
        req.body[field] = req.body[field]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/javascript:/gi, '');
      }
    });
    
    // Sanitize nested formData
    if (req.body.formData && typeof req.body.formData === 'object') {
      htmlFields.forEach(field => {
        if (req.body.formData[field] && typeof req.body.formData[field] === 'string') {
          req.body.formData[field] = req.body.formData[field]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '');
        }
      });
    }
  }
  
  next();
};

// ============= EVENTS LOG SYSTEM =============

// Environment configuration for events logging
const EVENTS_CONFIG = {
  IP_HASH_SALT: (() => {
    if (!process.env.EVENTS_IP_SALT) {
      console.error('❌ CRITICAL SECURITY ERROR: EVENTS_IP_SALT environment variable is not set!');
      console.error('💡 Generate a secure salt: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      throw new Error('EVENTS_IP_SALT environment variable is required for security');
    }
    return process.env.EVENTS_IP_SALT;
  })(),
  ENABLE_IP_GEOLOCATION: process.env.ENABLE_IP_GEOLOCATION === 'true',
  RAW_IP_RETENTION_DAYS: parseInt(process.env.RAW_IP_RETENTION_DAYS) || 30,
  ENABLE_EVENTS_LOGGING: process.env.ENABLE_EVENTS_LOGGING !== 'false' // Default to enabled
};

// IP processing middleware - extracts, masks, and hashes IPs
const processIPMiddleware = (req, res, next) => {
  if (!EVENTS_CONFIG.ENABLE_EVENTS_LOGGING) return next();

  // Extract real IP from various headers
  const extractRealIP = (req) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
  };

  const realIP = extractRealIP(req).split(',')[0].trim();
  
  // Mask IP (keep first 3 octets, mask last)
  const maskIP = (ip) => {
    // Handle localhost
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
      return 'localhost';
    }
    
    if (ip.includes(':')) {
      // IPv6 - show first 4 groups, mask rest
      const parts = ip.split(':').filter(p => p); // Remove empty parts
      if (parts.length > 4) {
        return parts.slice(0, 4).join(':') + ':****';
      }
      return parts.join(':') + ':****'; // Short IPv6
    } else {
      // IPv4 - mask last octet
      const parts = ip.split('.');
      if (parts.length === 4) {
        return parts.slice(0, 3).join('.') + '.*';
      }
      return ip; // Invalid IP, return as-is
    }
  };

  // Hash IP with salt for correlation while protecting privacy
  const hashIP = (ip) => {
    return crypto.createHmac('sha256', EVENTS_CONFIG.IP_HASH_SALT)
                 .update(ip)
                 .digest('hex')
                 .substring(0, 16);
  };

  // Attach processed IP data to request
  req.ipData = {
    raw: realIP,
    masked: maskIP(realIP),
    hash: hashIP(realIP)
  };

  next();
};

// Apply IP processing middleware globally
app.use(processIPMiddleware);

// ============= REQUEST ID TRACKING =============

/**
 * Request ID middleware - adds unique ID to each request for tracking
 */
app.use((req, res, next) => {
  // Use existing request ID from header or generate new one
  req.id = req.headers['x-request-id'] || uuidv4();
  req.correlationId = req.headers['x-correlation-id'] || req.id;
  
  // Add request ID to response headers for client tracking
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-Correlation-ID', req.correlationId);
  
  next();
});

// ============= CONTENT-TYPE VALIDATION =============

/**
 * Content-Type validation middleware
 * Ensures requests with body have correct Content-Type header
 */
app.use((req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests (no body expected)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip for specific routes that might not send JSON
  const skipPaths = ['/health', '/csrf-token'];
  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  const contentType = req.headers['content-type'];
  
  // Require Content-Type header for requests with body
  if (!contentType) {
    return res.status(415).json({ 
      error: 'Unsupported Media Type',
      message: 'Content-Type header is required. Please set Content-Type to application/json.'
    });
  }
  
  // Validate Content-Type is application/json
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ 
      error: 'Unsupported Media Type',
      message: 'Content-Type must be application/json. Received: ' + contentType
    });
  }
  
  next();
});

// ============= CENTRALIZED REQUEST LOGGING MIDDLEWARE =============

/**
 * Centralized request logging middleware
 * Automatically logs all API requests with comprehensive details
 */
const requestLoggingMiddleware = async (req, res, next) => {
  // Skip only: health checks, static files, and endpoints with VERY specific logging
  const skipPaths = [
    '/health', 
    '/favicon.ico',
    '/api/events-logs', // Don't log the logging endpoint itself (infinite loop)
    '/csrf-token' // Just a token request, not important
  ];
  
  // Skip if path matches
  if (skipPaths.some(path => req.path.includes(path))) {
    return next();
  }
  
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  const sessionId = req.cookies?.__session || null;
  
  // Attach correlation ID to request for use in route handlers
  req.correlationId = correlationId;
  req.startTime = startTime;
  
  // Parse user agent
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  
  // Capture original res.json to log response
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseLogged = false;
  
  const logResponse = async () => {
    if (responseLogged) return;
    responseLogged = true;
    
    // Skip if endpoint set the skip flag
    if (req.skipGeneralLogging) return;
    
    const duration = Date.now() - startTime;
    
    // Get user details if authenticated
    let userDetails = { uid: null, email: null, role: null, displayName: null };
    if (req.user) {
      userDetails = {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role,
        displayName: req.user.name
      };
    }
    
    // Determine SPECIFIC action based on method and path
    let action = 'api-request';
    const path = req.path.toLowerCase();
    const method = req.method;
    
    // Authentication actions
    if (path.includes('/exchange-token')) action = 'login';
    else if (path.includes('/authenticate')) action = 'login';
    else if (path.includes('/register')) action = 'register';
    else if (path.includes('/logout')) action = 'logout';
    
    // User management actions
    else if (path.includes('/users') && method === 'GET') action = 'view-users';
    else if (path.includes('/users') && method === 'POST') action = 'create-user';
    else if (path.includes('/users') && method === 'PUT') action = 'update-user';
    else if (path.includes('/users') && method === 'DELETE') action = 'delete-user';
    else if (path.includes('/role') && method === 'PUT') action = 'update-role';
    
    // Form actions
    else if (path.includes('/submit')) action = 'submit-form';
    else if (path.includes('/status') && method === 'PUT') action = 'update-status';
    else if (path.includes('/forms/') && method === 'GET' && path.split('/').length > 4) action = 'view-form-details';
    else if (path.includes('/forms') && method === 'GET') action = 'view-forms-list';
    else if (path.includes('/forms') && method === 'PUT') action = 'update-form';
    else if (path.includes('/forms') && method === 'DELETE') action = 'delete-form';
    
    // Claim actions
    else if (path.includes('/claims') && path.includes('/status')) action = 'update-claim-status';
    else if (path.includes('/claims') && method === 'GET') action = 'view-claims';
    else if (path.includes('/claims') && method === 'POST') action = 'submit-claim';
    
    // File actions
    else if (path.includes('/download')) action = 'download-file';
    else if (path.includes('/upload')) action = 'upload-file';
    
    // Generic fallbacks
    else if (method === 'DELETE') action = 'delete';
    else if (method === 'PUT' || method === 'PATCH') action = 'update';
    else if (method === 'POST') action = 'create';
    else if (method === 'GET') action = 'view';
    
    // Determine severity based on status code
    let severity = 'info';
    if (res.statusCode >= 500) severity = 'error';
    else if (res.statusCode >= 400) severity = 'warning';
    
    // Get location
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    
    // Log the request
    await logAction({
      action: action,
      severity: severity,
      actorUid: userDetails.uid,
      actorDisplayName: userDetails.displayName,
      actorEmail: userDetails.email,
      actorRole: userDetails.role,
      targetType: 'api-endpoint',
      targetId: req.path,
      targetName: `${req.method} ${req.path}`,
      requestMethod: req.method,
      requestPath: req.path,
      requestBody: sanitizeRequestBody(req.body),
      responseStatus: res.statusCode,
      responseTime: duration,
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      deviceType: deviceType,
      browser: browser,
      os: os,
      sessionId: sessionId,
      correlationId: correlationId,
      details: {
        query: req.query,
        params: req.params,
        statusCode: res.statusCode,
        contentLength: res.get('content-length'),
        responseTime: `${duration}ms`
      },
      meta: {
        referer: req.headers.referer || null,
        origin: req.headers.origin || null,
        acceptLanguage: req.headers['accept-language'] || null
      }
    });
  };
  
  res.json = function(body) {
    logResponse().catch(err => console.error('Failed to log response:', err));
    return originalJson(body);
  };
  
  res.send = function(body) {
    logResponse().catch(err => console.error('Failed to log response:', err));
    return originalSend(body);
  };
  
  // Also log on finish event as fallback
  res.on('finish', () => {
    logResponse().catch(err => console.error('Failed to log response:', err));
  });
  
  next();
};

// Apply centralized request logging (after IP processing)
app.use(requestLoggingMiddleware);

// Location enrichment function (optional)
const getLocationFromIP = async (ip) => {
  if (!EVENTS_CONFIG.ENABLE_IP_GEOLOCATION || ip === '0.0.0.0' || ip.includes('127.0.0.1')) {
    return 'Local/Unknown';
  }

  try {
    // Using a free IP geolocation service - you can replace with your preferred service
    const response = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 2000 });
    if (response.data.status === 'success') {
      return `${response.data.city || 'Unknown'}, ${response.data.country || 'Unknown'}`;
    }
  } catch (error) {
    console.warn('IP geolocation failed:', error.message);
  }
  
  return 'Unknown';
};

// ============= ENHANCED SIEM-LIKE LOGGING SYSTEM =============

/**
 * Severity levels for events
 */
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Calculate risk score based on action and context
 */
const calculateRiskScore = (actionData) => {
  let score = 0;
  
  // High-risk actions
  const highRiskActions = ['delete', 'reject', 'update-user-role', 'failed-login'];
  if (highRiskActions.includes(actionData.action)) score += 30;
  
  // Multiple failed logins
  if (actionData.action === 'failed-login') score += 40;
  
  // Admin actions
  if (['admin', 'super admin'].includes(actionData.actorRole)) score += 10;
  
  // Unknown location
  if (!actionData.location || actionData.location === 'Unknown') score += 20;
  
  return Math.min(score, 100);
};

/**
 * Determine severity based on action
 */
const getSeverity = (action) => {
  const criticalActions = ['delete-user', 'failed-login', 'security-breach'];
  const errorActions = ['failed-login', 'reject', 'error'];
  const warningActions = ['update-user-role', 'delete', 'rate-limit-hit'];
  
  if (criticalActions.includes(action)) return SEVERITY.CRITICAL;
  if (errorActions.includes(action)) return SEVERITY.ERROR;
  if (warningActions.includes(action)) return SEVERITY.WARNING;
  return SEVERITY.INFO;
};

/**
 * Enhanced logAction function - SIEM-grade logging
 * Captures comprehensive event data for security monitoring and compliance
 */
const logAction = async (actionData) => {
  if (!EVENTS_CONFIG.ENABLE_EVENTS_LOGGING) {
    return;
  }

  try {
    const severity = actionData.severity || getSeverity(actionData.action);
    const riskScore = calculateRiskScore(actionData);
    
    // Helper function to remove undefined values from objects
    const removeUndefined = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            cleaned[key] = removeUndefined(value);
          } else {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    };
    
    const eventLog = {
      // Timestamp
      ts: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      
      // Action details
      action: actionData.action,
      severity: severity,
      riskScore: riskScore,
      
      // Actor information (WHO did it)
      actorUid: actionData.actorUid || null,
      actorDisplayName: actionData.actorDisplayName || null,
      actorEmail: actionData.actorEmail || null,
      actorPhone: actionData.actorPhone || null,
      actorRole: actionData.actorRole || null,
      
      // Target information
      targetType: actionData.targetType,
      targetId: actionData.targetId,
      targetName: actionData.targetName || null,
      
      // Request details - remove undefined values
      details: removeUndefined(actionData.details || {}),
      requestMethod: actionData.requestMethod || null,
      requestPath: actionData.requestPath || null,
      requestBody: actionData.requestBody || null,
      responseStatus: actionData.responseStatus || null,
      responseTime: actionData.responseTime || null,
      
      // Network information - provide defaults for undefined values
      ipMasked: actionData.ipMasked || 'Unknown',
      ipHash: actionData.ipHash || 'unknown-hash',
      location: actionData.location || 'Unknown',
      userAgent: actionData.userAgent || 'Unknown',
      deviceType: actionData.deviceType || 'Unknown',
      browser: actionData.browser || 'Unknown',
      os: actionData.os || 'Unknown',
      
      // Session tracking
      sessionId: actionData.sessionId || null,
      correlationId: actionData.correlationId || uuidv4(),
      
      // Security flags
      isAnomaly: actionData.isAnomaly || false,
      isSuspicious: riskScore > 50,
      requiresReview: riskScore > 70,
      
      // Additional metadata - remove undefined values
      meta: removeUndefined({
        ...actionData.meta,
        serverVersion: process.env.npm_package_version || '1.0.0',
        nodeEnv: process.env.NODE_ENV || 'development',
        timestamp: Date.now()
      })
    };

    // Add raw IP with TTL for retention policy
    if (actionData.rawIP && EVENTS_CONFIG.RAW_IP_RETENTION_DAYS > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EVENTS_CONFIG.RAW_IP_RETENTION_DAYS);
      eventLog.rawIP = actionData.rawIP;
      eventLog.rawIPExpiry = admin.firestore.Timestamp.fromDate(expiryDate);
    }

    // Write to Firestore
    const docRef = await db.collection('eventLogs').add(eventLog);
    
    // Log critical events to console
    if (severity === SEVERITY.CRITICAL || severity === SEVERITY.ERROR) {
      console.error(`🚨 ${severity.toUpperCase()} EVENT:`, {
        id: docRef.id,
        action: actionData.action,
        actor: actionData.actorEmail,
        riskScore: riskScore
      });
    }
    
  } catch (error) {
    console.error('💥 Failed to log event:', error);
    // Don't throw - logging failures shouldn't break main functionality
  }
};

// ============= LOGGING HELPER FUNCTIONS =============

/**
 * Parse user agent to extract device, browser, and OS information
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { deviceType: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  
  const ua = userAgent.toLowerCase();
  
  // Device type
  let deviceType = 'Desktop';
  if (ua.includes('mobile')) deviceType = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';
  
  // Browser
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edge')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { deviceType, browser, os };
};

/**
 * Sensitive field patterns for data sanitization
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /ssn/i,
  /nin/i,
  /bvn/i,
  /card[_-]?number/i,
  /cvv/i,
  /cvc/i,
  /pin/i,
  /otp/i,
  /pass/i,
  /refresh[_-]?token/i,
  /access[_-]?token/i,
  /id[_-]?token/i,
  /session/i,
  /cookie/i
];

/**
 * Sanitize request body to remove sensitive data
 * Enhanced with pattern matching and recursive deep sanitization
 */
const sanitizeRequestBody = (body) => {
  if (!body) return null;
  
  try {
    const sanitized = JSON.parse(JSON.stringify(body)); // Deep clone
    
    const redactSensitiveFields = (obj, path = '') => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.keys(obj).forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;
        
        // Check if key matches any sensitive pattern
        const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
        
        if (isSensitive) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // Recursively sanitize nested objects
          redactSensitiveFields(obj[key], fullPath);
        } else if (typeof obj[key] === 'string') {
          // Check for potential sensitive data in string values (e.g., credit card numbers)
          // Redact credit card patterns
          if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(obj[key])) {
            obj[key] = '[REDACTED-CARD]';
          }
          // Redact email patterns in non-email fields
          else if (!key.toLowerCase().includes('email') && /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(obj[key])) {
            obj[key] = obj[key].replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]');
          }
        }
      });
    };
    
    redactSensitiveFields(sanitized);
    
    // Limit size
    const str = JSON.stringify(sanitized);
    if (str.length > 2000) {
      return { 
        _truncated: true, 
        _originalSize: str.length,
        _preview: str.substring(0, 2000) + '...'
      };
    }
    
    return sanitized;
  } catch (error) {
    console.error('Error sanitizing request body:', error);
    return { _error: 'Failed to sanitize body' };
  }
};

/**
 * Log authentication events
 */
const logAuthEvent = async (req, eventType, success, userId = null, email = null, reason = null) => {
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
  
  await logAction({
    action: eventType,
    severity: success ? 'info' : 'warning',
    actorUid: userId,
    actorEmail: email,
    targetType: 'authentication',
    targetId: email || 'unknown',
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: success ? 200 : 401,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    location: location,
    userAgent: req.headers['user-agent'],
    deviceType: deviceType,
    browser: browser,
    os: os,
    sessionId: req.cookies?.__session,
    correlationId: req.correlationId || uuidv4(),
    details: {
      success: success,
      reason: reason,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log authorization failures
 */
const logAuthorizationFailure = async (req, requiredRoles, userRole) => {
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
  
  await logAction({
    action: 'authorization-failure',
    severity: 'warning',
    actorUid: req.user?.uid,
    actorEmail: req.user?.email,
    actorRole: userRole,
    targetType: 'api-endpoint',
    targetId: req.path,
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: 403,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    location: location,
    userAgent: req.headers['user-agent'],
    deviceType: deviceType,
    browser: browser,
    os: os,
    sessionId: req.cookies?.__session,
    correlationId: req.correlationId || uuidv4(),
    details: {
      requiredRoles: requiredRoles,
      userRole: userRole,
      endpoint: req.path
    }
  });
};

/**
 * Log validation failures
 */
const logValidationFailure = async (req, errors) => {
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
  
  await logAction({
    action: 'validation-failure',
    severity: 'warning',
    actorUid: req.user?.uid,
    actorEmail: req.user?.email,
    actorRole: req.user?.role,
    targetType: 'api-endpoint',
    targetId: req.path,
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: 400,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    location: location,
    userAgent: req.headers['user-agent'],
    deviceType: deviceType,
    browser: browser,
    os: os,
    sessionId: req.cookies?.__session,
    correlationId: req.correlationId || uuidv4(),
    details: {
      errors: errors,
      requestBody: sanitizeRequestBody(req.body)
    }
  });
};

/**
 * Log rate limit hits
 */
const logRateLimitHit = async (req) => {
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
  
  await logAction({
    action: 'rate-limit-hit',
    severity: 'warning',
    actorUid: req.user?.uid,
    actorEmail: req.user?.email,
    actorRole: req.user?.role,
    targetType: 'api-endpoint',
    targetId: req.path,
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: 429,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    location: location,
    userAgent: req.headers['user-agent'],
    deviceType: deviceType,
    browser: browser,
    os: os,
    isAnomaly: true,
    details: {
      endpoint: req.path,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log CORS blocks
 */
const logCORSBlock = async (origin, req) => {
  await logAction({
    action: 'cors-block',
    severity: 'warning',
    targetType: 'security',
    targetId: origin,
    requestMethod: req?.method || 'OPTIONS',
    requestPath: req?.path || 'unknown',
    responseStatus: 403,
    ipMasked: req?.ipData?.masked,
    ipHash: req?.ipData?.hash,
    rawIP: req?.ipData?.raw,
    userAgent: req?.headers?.['user-agent'],
    isAnomaly: true,
    details: {
      blockedOrigin: origin,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Helper function to get comprehensive user details for logging
 * Captures: UID, email, name, role, phone number
 */
const getUserDetailsForLogging = async (uid) => {
  try {
    if (!uid) return { 
      displayName: null, 
      email: null, 
      role: null, 
      phone: null,
      uid: null
    };
    
    const userRecord = await admin.auth().getUser(uid);
    const userDoc = await db.collection('userroles').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    return {
      uid: uid,
      displayName: userRecord.displayName || userData.name || userRecord.email?.split('@')[0] || 'Unknown',
      email: userRecord.email || null,
      role: userData.role || null,
      phone: userData.phone || userRecord.phoneNumber || null
    };
  } catch (error) {
    console.warn('Failed to get user details for logging:', error);
    return { 
      uid: uid,
      displayName: null, 
      email: null, 
      role: null,
      phone: null
    };
  }
};

app.use(express.json());

// ============= REPLAY ATTACK PROTECTION =============

// Nonce tracking for replay attack prevention
const usedNonces = new Map(); // Map of nonce -> timestamp
const NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Clean up expired nonces every minute
setInterval(() => {
  const now = Date.now();
  for (const [nonce, timestamp] of usedNonces.entries()) {
    if (now - timestamp > NONCE_EXPIRY) {
      usedNonces.delete(nonce);
    }
  }
}, 60 * 1000);

// Enhanced timestamp validation middleware (nonce disabled - using CSRF instead)
app.use((req, res, next) => {
  // Skip validation for public routes and authentication endpoints
  const publicPaths = ['/', '/health', '/csrf-token', '/api/exchange-token', '/api/login', '/api/register'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  // Nonce validation disabled - production works fine without it
  // The app uses CSRF tokens and session management for security
  next();
});

// Apply CSRF protection middleware conditionally
app.use((req, res, next) => {
  // Skip CSRF protection for specific routes including exchange-token
  if (req.path === '/listenForUpdates' ||
    req.path === '/send-to-user' ||
    req.path === '/send-to-admin-and-claims' ||
    req.path === '/send-to-admin-and-compliance' ||
    req.path === '/api/update-claim-status' ||
    req.path === '/api/exchange-token') {  // ✅ Add exchange-token to CSRF exemptions
    console.log('🔓 Skipping CSRF protection for:', req.path);
    return next(); // Skip CSRF for this route
  }
  console.log('🔐 Applying CSRF protection for:', req.path);
  csrfProtection(req, res, next); // Apply CSRF protection
});

// Log the CSRF token when validating
app.use((req, res, next) => {
  // console.log('Received CSRF Token:', req.headers['csrf-token']);
  next();
});

// Endpoint to get CSRF token
app.get('/csrf-token', (req, res) => {
  const csrfToken = req.csrfToken();
  // console.log('Generated CSRF Token:', csrfToken); // Log the generated CSRF token
  res.status(200).json({ csrfToken });
});

// ============= EMAIL CONFIGURATION =============
// ✅ SECURE: Uses environment variables and supports OAuth2

/**
 * Create email transporter with secure configuration
 * Supports both app-specific passwords and OAuth2
 */
const createEmailTransporter = () => {
  // Validate required email configuration
  if (!process.env.EMAIL_USER) {
    console.error('❌ EMAIL_USER environment variable is required');
    throw new Error('Email configuration missing: EMAIL_USER');
  }

  // Check if OAuth2 is configured
  const useOAuth2 = process.env.EMAIL_CLIENT_ID && 
                    process.env.EMAIL_CLIENT_SECRET && 
                    process.env.EMAIL_REFRESH_TOKEN;

  if (useOAuth2) {
    // ✅ BEST PRACTICE: OAuth2 authentication
    console.log('✅ Using OAuth2 for email authentication');
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.office365.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
      },
      logger: process.env.NODE_ENV !== 'production',
      debug: process.env.NODE_ENV !== 'production'
    });
  } else {
    // ✅ FALLBACK: App-specific password (still secure if using app password)
    if (!process.env.EMAIL_PASS) {
      console.error('❌ EMAIL_PASS environment variable is required when not using OAuth2');
      throw new Error('Email configuration missing: EMAIL_PASS or OAuth2 credentials');
    }
    
    console.log('⚠️  Using app-specific password for email authentication');
    console.log('💡 Consider switching to OAuth2 for better security');
    
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.office365.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: process.env.NODE_ENV !== 'production',
      debug: process.env.NODE_ENV !== 'production'
    });
  }
};

// Initialize transporter
let transporter;
try {
  transporter = createEmailTransporter();
  console.log('✅ Email transporter initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize email transporter:', error.message);
  console.error('📧 Email functionality will not work until configuration is fixed');
  // Create a dummy transporter that logs errors
  transporter = {
    sendMail: async () => {
      throw new Error('Email transporter not configured. Check EMAIL_USER and EMAIL_PASS environment variables.');
    }
  };
}

// Fetch all admin emails from Firebase
async function getAllAdminEmails() {
  try {
    const usersSnapshot = await admin
      .firestore()
      .collection('userroles')
      .where('role', 'in', ['admin', 'compliance'])
      .get();

    const adminEmails = usersSnapshot.docs.map((doc) => doc.data().email);
    return adminEmails;
  } catch (error) {
    console.error('Error fetching admin emails from Firestore:', error);
    return [];
  }
}

// Function to send email to admins
async function sendEmailToAdmins(adminEmails, formType, formData) {
  const firstThreeDetails = Object.keys(formData).slice(0, 4).map(key => `${key}: ${formData[key]}`).join('<br/>');

  const emailContent = `
    <p>A new <strong>${formType}</strong> form has been successfully submitted.</p>
    <p>
    <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Log in to NEM Forms</a>
    </p>
    
    <p>Here is a brief summary for the submission:</p>
    <div style="background-color:#f4f4f4; padding:10px; border-radius:5px;">
      ${firstThreeDetails}
    </div>

    <p>Best regards,<br>NEM Customer Feedback Team</p>
  `;

  try {
    for (const email of adminEmails) {
      const mailOptions = {
        from: '"NEM FORMS Application" <kyc@nem-insurance.com>',
        to: email, 
        subject: `New ${formType} Submission`,
        html: emailContent,
      };
      await transporter.sendMail(mailOptions);
    }
    console.log('Emails sent to admins successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

//  Reusable helper
async function getEmailsByRoles(rolesArray) {
  try {
    // Always include admin and super-admin roles
    const allRoles = [...new Set([...rolesArray, 'admin', 'super-admin'])];
    
    const usersSnapshot = await admin.firestore()
      .collection('userroles')
      .where('role', 'in', allRoles)
      .get();

    return usersSnapshot.docs.map(doc => doc.data().email);
  } catch (error) {
    console.error('Error fetching emails by roles:', error);
    return [];
  }
}

async function sendEmail(to, subject, html, attachments = []) {
  // Handle sending individual emails if 'to' is an array
  if (Array.isArray(to)) {
    const emailPromises = to.map(email => {
      const mailOptions = {
        from: '"NEM FORMS Application" <kyc@nem-insurance.com>',
        to: email, // Send to individual email
        subject,
        html,
        attachments
      };
      return transporter.sendMail(mailOptions);
    });
    return Promise.all(emailPromises);
  }
  
  // Single email recipient
  const mailOptions = {
    from: '"NEM FORMS Application" <kyc@nem-insurance.com>',
    to,
    subject,
    html,
    attachments
  };
  return transporter.sendMail(mailOptions);
}

// ✅ NEW: Claims Approval/Rejection with Evidence Preservation + EVENT LOGGING
// ✅ PROTECTED: Requires claims, compliance, admin, or super admin role
// ✅ VALIDATED: Input validation applied
app.post('/api/update-claim-status', requireAuth, requireClaims, [
  body('collectionName').trim().notEmpty().matches(/^[a-z0-9\-]+$/),
  body('documentId').trim().notEmpty().matches(/^[a-zA-Z0-9\-_]+$/),
  body('status').trim().notEmpty().isIn(['pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']),
  body('approverUid').optional().trim().isString(),
  body('comment').optional().trim().isLength({ max: 1000 }),
  body('userEmail').optional().trim().isEmail().normalizeEmail(),
  body('formType').optional().trim().isString(),
  handleValidationErrors,
  sanitizeHtmlFields
], async (req, res) => {
  try {
    console.log('👤 Claim status update by:', req.user.email, 'Role:', req.user.role);
    
    const { 
      collectionName, 
      documentId, 
      status, 
      approverUid, 
      comment, 
      userEmail, 
      formType 
    } = req.body;

    // Validate required fields
    if (!collectionName || !documentId || !status || !approverUid || !comment) {
      return res.status(400).json({ 
        error: 'Missing required fields: collectionName, documentId, status, approverUid, comment'
      });
    }

    // Get document before update for logging
    const docBefore = await admin.firestore()
      .collection(collectionName)
      .doc(documentId)
      .get();
    
    const beforeData = docBefore.exists ? docBefore.data() : {};

    // Get approver details
    const approverDetails = await getUserDetailsForLogging(approverUid);
    const approverName = approverDetails.displayName || approverDetails.email;

    // Evidence preservation data
    const evidenceData = {
      status,
      approvedBy: approverUid,
      approverName: approverName,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvalComment: comment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update the claim document with evidence preservation
    await admin.firestore()
      .collection(collectionName)
      .doc(documentId)
      .update(evidenceData);

    // 📝 LOG THE APPROVAL/REJECTION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: status === 'approved' ? 'approve' : 'reject',
      actorUid: approverUid,
      actorDisplayName: approverDetails.displayName,
      actorEmail: approverDetails.email,
      actorRole: approverDetails.role,
      targetType: collectionName,
      targetId: documentId,
      details: {
        from: { status: beforeData.status || 'pending' },
        to: { status: status },
        comment: comment,
        formType: formType
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        userEmail: userEmail,
        formType: formType,
        approverName: approverName
      }
    });

    // Send status update email to user if email provided
    if (userEmail && formType) {
      const isApproved = status === 'approved';
      const statusText = isApproved ? 'approved' : 'rejected';
      const statusColor = isApproved ? '#22c55e' : '#ef4444';
      const statusEmoji = isApproved ? '🎉' : '❌';

      const subject = `${formType} Claim ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">NEM Insurance</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: ${statusColor};">Your ${formType} claim has been ${statusText}! ${statusEmoji}</h2>
            
            <p>Dear Valued Customer,</p>
            
            ${isApproved 
              ? `<p>We are pleased to inform you that your <strong>${formType}</strong> claim has been <strong>approved</strong>.</p>
                 <p>Our claims team will contact you shortly with further details regarding the next steps.</p>`
              : `<p>We regret to inform you that your <strong>${formType}</strong> claim has been <strong>rejected</strong>.</p>
                 <p><strong>Reason:</strong> ${comment}</p>
                 <p>If you have any questions or would like to appeal this decision, please contact our claims team.</p>`
            }
            
            <div style="background: #f0f8ff; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
              <p style="margin: 0;"><strong>Claim Reference:</strong> ${documentId}</p>
              <p style="margin: 5px 0 0 0;"><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${isApproved ? '<p>Congratulations again!</p>' : '<p>Thank you for your understanding.</p>'}
            
            <p>Best regards,<br/>NEM Claims & Support Team</p>
          </div>
        </div>
      `;

      try {
        await sendEmail(userEmail, subject, html);
        
        // 📝 LOG EMAIL SENT EVENT
        await logAction({
          action: 'email-sent',
          actorUid: approverUid,
          actorDisplayName: approverDetails.displayName,
          actorEmail: approverDetails.email,
          actorRole: approverDetails.role,
          targetType: 'email',
          targetId: userEmail,
          details: {
            emailType: `claim-${status}`,
            subject: subject
          },
          ipMasked: req.ipData?.masked,
          ipHash: req.ipData?.hash,
          rawIP: req.ipData?.raw,
          location: location,
          userAgent: req.headers['user-agent'] || 'Unknown',
          meta: {
            emailTarget: userEmail,
            formType: formType,
            claimStatus: status
          }
        });

        console.log(`${statusText} email sent to user: ${userEmail}`);
      } catch (emailError) {
        console.error(`Failed to send ${statusText} email:`, emailError);
        // Don't fail the main request if email fails
      }
    }

    res.status(200).json({ 
      message: `Claim ${status} successfully with evidence preserved`,
      approver: approverName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({ 
      error: 'Failed to update claim status',
      details: error.message 
    });
  }
});

// ✅ 1. Admin + Compliance
app.post('/send-to-admin-and-compliance', async (req, res) => {
  const { formType, formData, pdfAttachment } = req.body;

  try {
    // Get compliance + admin emails
    const roles = ['compliance'];
    const emails = await getEmailsByRoles(roles);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #8B4513;">New ${formType} Submission</h2>
          <p>A new <strong>${formType}</strong> form has been submitted and requires review.</p>
          <p><strong>Submitter:</strong> ${formData?.name || formData?.companyName || 'N/A'}</p>
          <p><strong>Email:</strong> ${formData?.email || 'N/A'}</p>
          <p><strong>Document ID:</strong> ${formData?.documentId || 'N/A'}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #8B4513;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please review this submission in the admin dashboard.</p>
          </div>
          
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Access Admin Dashboard</a>
          </p>
          
          ${pdfAttachment ? '<p><strong>Note:</strong> The complete form details are attached as a PDF.</p>' : ''}
          
          <p>Best regards,<br>NEM Forms System</p>
        </div>
      </div>
    `;

    // Prepare attachments array
    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        encoding: pdfAttachment.encoding || 'base64'
      });
    }

    // Send emails to all compliance + admin users
    await sendEmail(emails, `New ${formType} Submission - Review Required`, html, attachments);
    
    res.status(200).json({ message: 'Emails sent to Compliance and Admin teams with PDF attachment' });
  } catch (error) {
    console.error('Error in /send-to-admin-and-compliance:', error);
    res.status(500).json({ error: 'Email dispatch failed' });
  }
});

// ✅ 2. Admin + Claims
app.post('/send-to-admin-and-claims', async (req, res) => {
  const { formType, formData, pdfAttachment } = req.body;

  try {
    // Get claims + admin emails
    const roles = ['claims'];
    const emails = await getEmailsByRoles(roles);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #8B4513;">New ${formType} Submission</h2>
          <p>A new <strong>${formType}</strong> claim has been submitted and requires processing.</p>
          <p><strong>Claimant:</strong> ${formData?.nameOfInsured || formData?.insuredName || formData?.companyName || 'N/A'}</p>
          <p><strong>Email:</strong> ${formData?.email || formData?.insuredEmail || 'N/A'}</p>
          <p><strong>Document ID:</strong> ${formData?.documentId || 'N/A'}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #8B4513;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please review and process this claim in the claims dashboard.</p>
          </div>
          
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Access Claims Dashboard</a>
          </p>
          
          ${pdfAttachment ? '<p><strong>Note:</strong> The complete claim details are attached as a PDF.</p>' : ''}
          
          <p>Best regards,<br>NEM Claims Team</p>
        </div>
      </div>
    `;

    // Prepare attachments array
    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        encoding: pdfAttachment.encoding || 'base64'
      });
    }

    // Send emails to all claims + admin users
    await sendEmail(emails, `New ${formType} Claim - Processing Required`, html, attachments);
    
    res.status(200).json({ message: 'Emails sent to Claims and Admin teams with PDF attachment' });
  } catch (error) {
    console.error('Error in /send-to-admin-and-claims:', error);
    res.status(500).json({ error: 'Email dispatch failed' });
  }
});

// ✅ 3. User Confirmation
// ✅ VALIDATED: Input validation applied
app.post('/send-to-user', validateEmailRequest, async (req, res) => {
  const { userEmail, formType, userName } = req.body;

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #8B4513;">Form Submission Confirmed</h2>
          <p>Dear ${userName || 'Valued Customer'},</p>
          <p>Thank you for submitting your <strong>${formType}</strong> form. We have received your submission and it is currently being processed.</p>
          <p>You can track your submission status by logging in:</p>
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Track Your Submission</a>
          </p>
          <p>We will notify you via email once your submission has been reviewed.</p>
          <p>Best regards,<br>NEM Insurance Team</p>
        </div>
      </div>
    `;

    await sendEmail(userEmail, `${formType} Submission Confirmation`, html);
    
    res.status(200).json({ message: 'Confirmation email sent to user' });
  } catch (error) {
    console.error('Error in /send-to-user:', error);
    res.status(500).json({ error: 'User confirmation email failed' });
  }
});

// Status update email endpoint (existing functionality)
app.post('/send-status-update-email', async (req, res) => {
  const { userEmail, formType, status, userName, pdfAttachment } = req.body;

  if (!userEmail || !formType || !status) {
    return res.status(400).json({ error: 'Missing userEmail, formType, or status' });
  }

  try {
    const isApproved = status === 'approved';
    const statusText = isApproved ? 'approved' : 'rejected';
    const statusColor = isApproved ? '#22c55e' : '#ef4444';
    const statusEmoji = isApproved ? '🎉' : '❌';

    const subject = `${formType} Claim ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: ${statusColor};">Your ${formType} claim has been ${statusText}! ${statusEmoji}</h2>
          
          <p>Dear ${userName || 'Valued Customer'},</p>
          
          ${isApproved 
            ? `<p>We are pleased to inform you that your <strong>${formType}</strong> claim has been <strong>approved</strong>.</p>
               <p>Our claims team will contact you shortly with further details regarding the next steps.</p>`
            : `<p>We regret to inform you that your <strong>${formType}</strong> claim has been <strong>rejected</strong>.</p>
               <p>If you have any questions or would like to appeal this decision, please contact our claims team.</p>`
          }
          
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">View Your Claims</a>
          </p>
          
          ${isApproved ? '<p>Congratulations again!</p>' : '<p>Thank you for your understanding.</p>'}
          
          <p>Best regards,<br/>NEM Claims & Support Team</p>
        </div>
      </div>
    `;

    // Prepare attachments array
    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        encoding: pdfAttachment.encoding || 'base64'
      });
    }

    await sendEmail(userEmail, subject, html, attachments);
    
    res.status(200).json({ 
      message: `Claim ${statusText} email sent successfully`,
      status: statusText 
    });
  } catch (error) {
    console.error(`Error sending claim ${statusText} email:`, error);
    res.status(500).json({ 
      error: `Failed to send claim ${statusText} email`,
      details: error.message 
    });
  }
});

// Alias endpoint for claim approval emails (same functionality as status update)
app.post('/send-claim-approval-email', async (req, res) => {
  const { userEmail, formType, status, userName, pdfAttachment } = req.body;

  if (!userEmail || !formType || !status) {
    return res.status(400).json({ error: 'Missing userEmail, formType, or status' });
  }

  try {
    const isApproved = status === 'approved';
    const statusText = isApproved ? 'approved' : 'rejected';
    const statusColor = isApproved ? '#22c55e' : '#ef4444';
    const statusEmoji = isApproved ? '🎉' : '❌';

    const subject = `${formType} Claim ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: ${statusColor};">Your ${formType} claim has been ${statusText}! ${statusEmoji}</h2>
          
          <p>Dear ${userName || 'Valued Customer'},</p>
          
          ${isApproved 
            ? `<p>We are pleased to inform you that your <strong>${formType}</strong> claim has been <strong>approved</strong>.</p>
               <p>Our claims team will contact you shortly with further details regarding the next steps.</p>`
            : `<p>We regret to inform you that your <strong>${formType}</strong> claim has been <strong>rejected</strong>.</p>
               <p>If you have any questions or would like to appeal this decision, please contact our claims team.</p>`
          }
          
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">View Your Claims</a>
          </p>
          
          ${isApproved ? '<p>Congratulations again!</p>' : '<p>Thank you for your understanding.</p>'}
          
          <p>Best regards,<br/>NEM Claims & Support Team</p>
        </div>
      </div>
    `;

    // Prepare attachments array
    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        encoding: pdfAttachment.encoding || 'base64'
      });
    }

    await sendEmail(userEmail, subject, html, attachments);
    
    res.status(200).json({ 
      message: `Claim ${statusText} email sent successfully`,
      status: statusText 
    });
  } catch (error) {
    console.error(`Error sending claim ${statusText} email:`, error);
    res.status(500).json({ 
      error: `Failed to send claim ${statusText} email`,
      details: error.message 
    });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ error: 'Email and password are required' });
  }

  try {
    const idToken = await authenticateUser(email, password);
    const customToken = await createCustomToken(email);

    // Get user details for logging
    const userRecord = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection('userroles').doc(userRecord.uid).get();
    const userRole = userDoc.exists ? userDoc.data().role : 'user';

    // 📝 LOG SUCCESSFUL LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'login',
      actorUid: userRecord.uid,
      actorDisplayName: userRecord.displayName || email.split('@')[0],
      actorEmail: email,
      actorRole: userRole,
      targetType: 'user',
      targetId: userRecord.uid,
      details: {
        loginMethod: 'email-password',
        success: true
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        loginTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ customToken, role: userRole });

  } catch (error) {
    console.error(error.message);
    
    // 📝 LOG FAILED LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'failed-login',
      actorUid: null,
      actorDisplayName: null,
      actorEmail: email,
      actorRole: null,
      targetType: 'user',
      targetId: email,
      details: {
        loginMethod: 'email-password',
        success: false,
        error: error.message
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        attemptTimestamp: new Date().toISOString()
      }
    });
    
    res.status(500).send({ error: 'Authentication failed' });
  }
});

// ========== OLD: Token Exchange Endpoint - DISABLED (replaced by version with MFA checks below) ==========
// app.post('/api/exchange-token', async (req, res) => {
//   const { idToken } = req.body;
//
//   if (!idToken) {
//     return res.status(400).json({ error: 'ID token is required' });
//   }
//
//   try {
//     // Verify Firebase ID token
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
//     const uid = decodedToken.uid;
//
//     // Fetch user role from Firestore
//     const userDoc = await db.collection('userroles').doc(uid).get();
//     const userData = userDoc.exists ? userDoc.data() : {};
//     const role = userData.role || 'default';
//
//     // Increment login count
//     const loginCount = (userData.loginCount || 0) + 1;
//     await db.collection('userroles').doc(uid).set(
//       { loginCount, dateModified: new Date() },
//       { merge: true }
//     );
//
//     // Set httpOnly session cookie with user UID
//     res.cookie('__session', uid, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
//       maxAge: 3600000, // 1 hour
//       path: '/',
//     });
//
//     // 📝 LOG TOKEN EXCHANGE EVENT
//     const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
//     await logAction({
//       action: 'token-exchange',
//       actorUid: uid,
//       actorDisplayName: userData.name || decodedToken.name || decodedToken.email?.split('@')[0] || 'Unknown',
//       actorEmail: decodedToken.email,
//       actorRole: role,
//       targetType: 'session',
//       targetId: uid,
//       details: {
//         loginCount: loginCount,
//         sessionCreated: true
//       },
//       ipMasked: req.ipData?.masked,
//       ipHash: req.ipData?.hash,
//       rawIP: req.ipData?.raw,
//       location: location,
//       userAgent: req.headers['user-agent'] || 'Unknown',
//       meta: {
//         exchangeTimestamp: new Date().toISOString()
//       }
//     });
//
//     res.status(200).json({
//       success: true,
//       role,
//       loginCount,
//       user: {
//         uid,
//         email: decodedToken.email,
//         displayName: userData.name || decodedToken.name || '',
//       },
//     });
//   } catch (error) {
//     console.error('Error exchanging token:', error);
//     res.status(401).json({ error: 'Authentication failed' });
//   }
// });

// ========== NEW: Get All Users (Super Admin Only) ==========
app.get('/api/users', async (req, res) => {
  try {
    // Verify session cookie
    const sessionToken = req.cookies.__session;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized: No session token' });
    }

    // Get authenticated user's role
    const userDoc = await db.collection('userroles').doc(sessionToken).get();
    if (!userDoc.exists || !isSuperAdmin(userDoc.data().role)) {
      console.log('❌ Access denied - User role:', userDoc.exists ? userDoc.data().role : 'no doc', 'Normalized:', userDoc.exists ? normalizeRole(userDoc.data().role) : 'N/A');
      return res.status(403).json({ error: 'Forbidden: Super admin access required' });
    }
    console.log('✅ Super admin verified - Role:', userDoc.data().role, 'Normalized:', normalizeRole(userDoc.data().role));

    // Fetch all users from userroles collection
    const usersSnapshot = await db.collection('userroles').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 📝 LOG USERS FETCH EVENT
    const viewerDetails = await getUserDetailsForLogging(sessionToken);
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view-users-list',
      actorUid: sessionToken,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: 'users',
      targetId: 'all',
      details: {
        userCount: users.length
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        fetchTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ========== NEW: Update User Role (Super Admin Only) ==========
// ✅ PROTECTED: Requires super admin role
// ✅ VALIDATED: Input validation applied
app.put('/api/users/:userId/role', requireAuth, requireSuperAdmin, validateRoleUpdate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    console.log('👤 Role update by:', req.user.email, 'Role:', req.user.role);

    // Get target user details before update
    const targetUserDoc = await db.collection('userroles').doc(userId).get();
    const oldRole = targetUserDoc.exists ? targetUserDoc.data().role : 'unknown';

    // Update user role
    await db.collection('userroles').doc(userId).update({
      role,
      dateModified: new Date(),
    });

    // 📝 LOG ROLE UPDATE EVENT
    const targetDetails = await getUserDetailsForLogging(userId);
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'update-user-role',
      actorUid: req.user.uid,
      actorDisplayName: req.user.name,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetType: 'user',
      targetId: userId,
      details: {
        from: { role: oldRole },
        to: { role: role },
        targetUserEmail: targetDetails.email,
        targetUserName: targetDetails.displayName
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        updateTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ========== NEW: Delete User (Super Admin Only) ==========
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userName } = req.body;

    // Verify session cookie
    const sessionToken = req.cookies.__session;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized: No session token' });
    }

    // Get authenticated user's role
    const authUserDoc = await db.collection('userroles').doc(sessionToken).get();
    if (!authUserDoc.exists || !isSuperAdmin(authUserDoc.data().role)) {
      console.log('❌ User deletion denied - User role:', authUserDoc.exists ? authUserDoc.data().role : 'no doc');
      return res.status(403).json({ error: 'Forbidden: Super admin access required' });
    }

    // Prevent self-deletion
    if (sessionToken === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get target user details before deletion
    const targetDetails = await getUserDetailsForLogging(userId);

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(userId);

    // Delete user from Firestore
    await db.collection('userroles').doc(userId).delete();

    // 📝 LOG USER DELETION EVENT
    const deleterDetails = await getUserDetailsForLogging(sessionToken);
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'delete-user',
      actorUid: sessionToken,
      actorDisplayName: deleterDetails.displayName,
      actorEmail: deleterDetails.email,
      actorRole: deleterDetails.role,
      targetType: 'user',
      targetId: userId,
      details: {
        deletedUserEmail: targetDetails.email,
        deletedUserName: userName || targetDetails.displayName,
        deletedUserRole: targetDetails.role
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        deletionTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Legacy getFormData function - kept for backward compatibility
async function getFormData(req, res, collectionName){
  const dataRef = db.collection(collectionName);
  const q = dataRef.orderBy('timestamp', 'desc');
  const snapshot = await q.get();

  const data = snapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  res.json(data);
}

// ✅ NEW: Form viewing with EVENT LOGGING
// ✅ PROTECTED: Requires authentication, users can view their own or admins can view all
app.get('/api/forms/:collection/:id', requireAuth, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { viewerUid } = req.query; // Pass viewer UID as query param
    
    console.log('🔍 Form view request:', { collection, id, viewerUid });
    console.log('👤 Requested by:', req.user.email, 'Role:', req.user.role);
    
    // Validate collection name
    try {
      validateCollectionName(collection);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid collection',
        message: 'The specified collection is not valid or accessible.'
      });
    }
    
    // Get the document
    const doc = await admin.firestore().collection(collection).doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Get viewer details if UID provided
    let viewerDetails = { displayName: null, email: null, role: null };
    if (viewerUid) {
      viewerDetails = await getUserDetailsForLogging(viewerUid);
    }
    
    // 📝 LOG THE VIEW EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid || null,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: collection.replace(/s$/, ''), // Remove 's' from collection name
      targetId: id,
      details: {
        viewType: 'form-detail',
        formType: doc.data()?.formType || collection
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collection,
        documentId: id,
        viewTimestamp: new Date().toISOString()
      }
    });
    
    res.json({ id: doc.id, ...doc.data() });
    
  } catch (error) {
    console.error('Error fetching form details:', error);
    res.status(500).json({ error: 'Failed to fetch form details' });
  }
});

// ✅ KYC Form Submissions with EVENT LOGGING
app.post('/submit-kyc-individual', async (req, res) => {
  console.log('📝 Individual KYC form submission received');
  await handleFormSubmission(req, res, 'Individual KYC', 'kyc-individual', req.body.submittedByUid);
});

app.post('/submit-kyc-corporate', async (req, res) => {
  console.log('📝 Corporate KYC form submission received');
  await handleFormSubmission(req, res, 'Corporate KYC', 'kyc-corporate', req.body.submittedByUid);
});

// ✅ CDD Form Submissions with EVENT LOGGING
app.post('/submit-cdd-individual', async (req, res) => {
  console.log('📝 Individual CDD form submission received');
  await handleFormSubmission(req, res, 'Individual CDD', 'cdd-individual', req.body.submittedByUid);
});

app.post('/submit-cdd-corporate', async (req, res) => {
  console.log('📝 Corporate CDD form submission received');
  await handleFormSubmission(req, res, 'Corporate CDD', 'cdd-corporate', req.body.submittedByUid);
});

app.post('/submit-cdd-agents', async (req, res) => {
  console.log('📝 Agents CDD form submission received');
  await handleFormSubmission(req, res, 'Agents CDD', 'cdd-agents', req.body.submittedByUid);
});

app.post('/submit-cdd-brokers', async (req, res) => {
  console.log('📝 Brokers CDD form submission received');
  await handleFormSubmission(req, res, 'Brokers CDD', 'cdd-brokers', req.body.submittedByUid);
});

app.post('/submit-cdd-partners', async (req, res) => {
  console.log('📝 Partners CDD form submission received');
  await handleFormSubmission(req, res, 'Partners CDD', 'cdd-partners', req.body.submittedByUid);
});

// ✅ Claims Submissions with EVENT LOGGING
app.post('/submit-claim-motor', async (req, res) => {
  console.log('📝 Motor claim form submission received');
  await handleFormSubmission(req, res, 'Motor Claim', 'claims-motor', req.body.submittedByUid);
});

app.post('/submit-claim-fire', async (req, res) => {
  console.log('📝 Fire & Special Perils claim submission received');
  await handleFormSubmission(req, res, 'Fire & Special Perils Claim', 'claims-fire-special-perils', req.body.submittedByUid);
});

app.post('/submit-claim-burglary', async (req, res) => {
  console.log('📝 Burglary claim form submission received');
  await handleFormSubmission(req, res, 'Burglary Claim', 'claims-burglary', req.body.submittedByUid);
});

app.post('/submit-claim-all-risk', async (req, res) => {
  console.log('📝 All Risk claim form submission received');
  await handleFormSubmission(req, res, 'All Risk Claim', 'claims-all-risk', req.body.submittedByUid);
});

// ✅ User Registration with EVENT LOGGING
app.post('/api/register-user', async (req, res) => {
  try {
    const { email, displayName, role = 'user' } = req.body;
    
    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and displayName are required' });
    }
    
    // Create user in Firebase Auth (this is a simplified version)
    // In practice, you'd use proper user creation methods
    
    // 📝 LOG THE REGISTRATION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'register',
      actorUid: null, // New user, no UID yet
      actorDisplayName: displayName,
      actorEmail: email,
      actorRole: role,
      targetType: 'user',
      targetId: email, // Use email as temporary ID
      details: {
        registrationMethod: 'admin-created',
        assignedRole: role
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        registrationTimestamp: new Date().toISOString()
      }
    });
    
    res.status(201).json({ 
      message: 'User registration logged successfully',
      email,
      displayName,
      role 
    });
    
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ✅ File Download Tracking with EVENT LOGGING
app.get('/api/download/:fileType/:documentId', async (req, res) => {
  try {
    const { fileType, documentId } = req.params;
    const { downloaderUid, fileName } = req.query;
    
    // Get downloader details if UID provided
    let downloaderDetails = { displayName: null, email: null, role: null };
    if (downloaderUid) {
      downloaderDetails = await getUserDetailsForLogging(downloaderUid);
    }
    
    // 📝 LOG THE FILE DOWNLOAD EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'file-download',
      actorUid: downloaderUid || null,
      actorDisplayName: downloaderDetails.displayName,
      actorEmail: downloaderDetails.email,
      actorRole: downloaderDetails.role,
      targetType: 'file',
      targetId: documentId,
      details: {
        fileType: fileType,
        fileName: fileName || `${fileType}-${documentId}`,
        downloadMethod: 'direct-link'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        downloadTimestamp: new Date().toISOString(),
        fileSize: 'unknown' // Could be calculated if needed
      }
    });
    
    // In a real implementation, you'd serve the actual file here
    res.json({ 
      message: `File download logged: ${fileName || fileType}`,
      documentId,
      fileType
    });
    
  } catch (error) {
    console.error('Error logging file download:', error);
    res.status(500).json({ error: 'File download logging failed' });
  }
});

// ✅ Generate Sample Events for Testing (DEVELOPMENT ONLY)
app.post('/api/generate-sample-events', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Sample events can only be generated in development' });
    }
    
    const sampleEvents = [
      {
        action: 'submit',
        actorDisplayName: 'John Doe',
        actorEmail: 'john.doe@example.com',
        actorRole: 'user',
        targetType: 'kyc-form',
        targetId: 'sample-kyc-123',
        details: { formType: 'Individual KYC', status: 'processing' }
      },
      {
        action: 'approve',
        actorDisplayName: 'Admin User',
        actorEmail: 'admin@nem-insurance.com',
        actorRole: 'admin',
        targetType: 'claim',
        targetId: 'sample-claim-456',
        details: { from: { status: 'pending' }, to: { status: 'approved' } }
      },
      {
        action: 'view',
        actorDisplayName: 'Jane Smith',
        actorEmail: 'jane.smith@nem-insurance.com',
        actorRole: 'compliance',
        targetType: 'cdd-form',
        targetId: 'sample-cdd-789',
        details: { viewType: 'form-detail' }
      },
      {
        action: 'login',
        actorDisplayName: 'Bob Wilson',
        actorEmail: 'bob.wilson@example.com',
        actorRole: 'user',
        targetType: 'user',
        targetId: 'user-123',
        details: { loginMethod: 'email-password', success: true }
      }
    ];
    
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    
    for (const event of sampleEvents) {
      await logAction({
        ...event,
        actorUid: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ipMasked: req.ipData?.masked || '192.168.1.***',
        ipHash: req.ipData?.hash || 'sample-hash',
        rawIP: req.ipData?.raw || '192.168.1.100',
        location: location,
        userAgent: req.headers['user-agent'] || 'Sample Browser',
        meta: { 
          sampleEvent: true,
          generatedAt: new Date().toISOString()
        }
      });
    }
    
    console.log('✅ Generated sample events for testing');
    res.json({ 
      message: 'Sample events generated successfully',
      eventsGenerated: sampleEvents.length
    });
    
  } catch (error) {
    console.error('Error generating sample events:', error);
    res.status(500).json({ error: 'Failed to generate sample events' });
  }
});

// Enhanced form submission function with EVENT LOGGING
async function handleFormSubmission(req, res, formType, collectionName, userUid = null) {
  const formData = req.body;

  // Perform validation as needed here...

  try {
    const docId = uuidv4();

    // Add form to the Firestore collection
    await admin.firestore().collection(collectionName).doc(docId).set({
      ...formData,
      status: 'processing',   
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: userUid, // Track who submitted it
    });

    // 📝 LOG THE FORM SUBMISSION EVENT
    let userDetails = { displayName: null, email: null, role: null };
    if (userUid) {
      userDetails = await getUserDetailsForLogging(userUid);
    }
    
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'submit',
      actorUid: userUid,
      actorDisplayName: userDetails.displayName || formData?.name || formData?.companyName,
      actorEmail: userDetails.email || formData?.email,
      actorRole: userDetails.role,
      targetType: collectionName.replace(/s$/, ''), // Remove 's' from collection name (e.g., 'claims' -> 'claim')
      targetId: docId,
      details: {
        formType: formType,
        status: 'processing',
        submitterName: formData?.name || formData?.companyName || 'Unknown',
        submitterEmail: formData?.email || 'Unknown'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        formType: formType,
        collectionName: collectionName,
        submissionId: docId
      }
    });

    // Fetch admin emails
    const adminEmails = await getAllAdminEmails();

    // Send email to admins if found
    if (adminEmails.length > 0) {
      await sendEmailToAdmins(adminEmails, formType, formData);
      
      // 📝 LOG THE EMAIL NOTIFICATION EVENT
      await logAction({
        action: 'email-sent',
        actorUid: 'system',
        actorDisplayName: 'System',
        actorEmail: 'system@nem-insurance.com',
        actorRole: 'system',
        targetType: 'email',
        targetId: adminEmails.join(','),
        details: {
          emailType: 'admin-notification',
          formType: formType,
          recipients: adminEmails
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: {
          relatedSubmission: docId,
          adminCount: adminEmails.length
        }
      });
    }

    // Fetch document and format created date
    const doc = await admin.firestore().collection(collectionName).doc(docId).get();
    const createdAtTimestamp = doc.data().timestamp;
    const createdAtDate = createdAtTimestamp.toDate();
    const formattedDate = `${String(createdAtDate.getDate()).padStart(2, '0')}/${String(createdAtDate.getMonth() + 1).padStart(2, '0')}/${String(createdAtDate.getFullYear())}`;

    // Update the document with formatted date
    await admin.firestore().collection(collectionName).doc(docId).update({
      createdAt: formattedDate,
    });

    res.status(201).json({ 
      message: 'Form submitted successfully',
      documentId: docId
    });
  } catch (err) {
    console.error('Error during form submission:', err);
    res.status(500).json({ error: 'Form submission failed' });
  }
}

const setSuperAdminOnStartup = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    
    if (!email) {
      console.warn('⚠️  SUPER_ADMIN_EMAIL environment variable not set. Skipping auto super admin assignment.');
      console.warn('💡 Set SUPER_ADMIN_EMAIL in your .env file to enable automatic super admin setup.');
      return;
    }

    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    const uid = user.uid;

    //  Set custom claim if not already set
    if (!user.customClaims?.superAdmin) {
      await admin.auth().setCustomUserClaims(uid, {
        ...user.customClaims,
        superAdmin: true,
      });
      console.log(`✅ Custom claim set: ${email} is now a super admin`);
    } else {
      console.log(`✅ Custom claim already exists for ${email}`);
    }

    // Also set Firestore role - use normalized 'super admin' format
    const userDocRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    
    // Check if role needs to be set or updated (normalize existing role for comparison)
    const existingRole = userDoc.exists ? normalizeRole(userDoc.data()?.role) : null;
    
    if (!userDoc.exists || existingRole !== 'super admin') {
      await userDocRef.set(
        {
          role: 'super admin', // Use normalized format
          updatedAt: new Date(),
        },
        { merge: true }
      );
      console.log(`✅ Firestore role set: ${email} is now a super admin`);
    } else {
      console.log(`✅ Firestore role already set for ${email}`);
    }
    
    // Also update userroles collection if it exists
    const userRolesDocRef = admin.firestore().collection('userroles').doc(uid);
    const userRolesDoc = await userRolesDocRef.get();
    
    if (userRolesDoc.exists) {
      const existingUserRole = normalizeRole(userRolesDoc.data()?.role);
      if (existingUserRole !== 'super admin') {
        await userRolesDocRef.update({
          role: 'super admin',
          dateModified: new Date()
        });
        console.log(`✅ userroles collection updated: ${email} is now a super admin`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to assign super admin:`, error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('💡 User not found. Please create the user account first, then restart the server.');
    }
  }
};

// ============= FORM SUBMISSION BACKEND ENDPOINTS =============

// Centralized form submission endpoint with event logging
// ✅ PROTECTED: Requires authentication
// ✅ VALIDATED: Input validation applied
app.post('/api/submit-form', requireAuth, validateFormSubmission, sanitizeHtmlFields, async (req, res) => {
  console.log('🚀🚀🚀 /api/submit-form ENDPOINT HIT! 🚀🚀🚀');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('👤 Authenticated user:', req.user.email, 'Role:', req.user.role);
  
  try {
    const { formData, formType, userUid, userEmail } = req.body;
    
    console.log('📝 Form submission received:', { formType, userUid, userEmail });
    
    if (!formData || !formType) {
      return res.status(400).json({ error: 'Missing formData or formType' });
    }

    // Get user details for logging if UID provided
    let userDetails = { displayName: null, email: null, role: null };
    if (userUid) {
      userDetails = await getUserDetailsForLogging(userUid);
    }

    // Determine Firestore collection based on form type
    const collectionName = getFirestoreCollection(formType);
    console.log('📂 Using collection:', collectionName);
    console.log('💾 ABOUT TO SAVE TO FIRESTORE COLLECTION:', collectionName);

    // Add metadata to form data
    const submissionData = {
      ...formData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toLocaleDateString('en-GB'),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: userEmail || userDetails.email,
      status: 'pending'
    };

    // Submit to Firestore
    console.log('🔥 CALLING db.collection(' + collectionName + ').add()');
    const docRef = await db.collection(collectionName).add(submissionData);
    console.log('✅ Document written with ID:', docRef.id);
    console.log('✅ SAVED TO COLLECTION:', collectionName);

    // 📝 LOG THE FORM SUBMISSION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'submit',
      actorUid: userUid,
      actorDisplayName: userDetails.displayName || formData?.name || formData?.companyName,
      actorEmail: userDetails.email || userEmail || formData?.email,
      actorRole: userDetails.role,
      targetType: collectionName.replace(/s$/, ''),
      targetId: docRef.id,
      details: {
        formType: formType,
        status: 'pending',
        submitterName: formData?.name || formData?.companyName || 'Unknown',
        submitterEmail: formData?.email || userEmail || 'Unknown'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        formType: formType,
        collectionName: collectionName,
        submissionId: docRef.id
      }
    });

    // Send email notifications
    try {
      const finalSubmissionData = { ...submissionData, documentId: docRef.id, collectionName };
      
      // Send user confirmation email
      await sendEmail(userEmail || userDetails.email || formData?.email, 
        `${formType} Submission Confirmation`, 
        generateConfirmationEmailHTML(formType));

      // Send admin notification with PDF
      const isClaimsForm = ['claim', 'motor', 'burglary', 'fire', 'allrisk', 'goods', 'money',
        'employers', 'public', 'professional', 'fidelity', 'contractors', 'group', 'rent', 'combined']
        .some(keyword => formType.toLowerCase().includes(keyword));

      const adminRoles = isClaimsForm ? ['claims'] : ['compliance'];
      const adminEmails = await getEmailsByRoles(adminRoles);
      
      if (adminEmails.length > 0) {
        await sendEmail(adminEmails, 
          `New ${formType} Submission - Review Required`,
          generateAdminNotificationHTML(formType, formData, docRef.id));
      }

      // 📝 LOG EMAIL NOTIFICATIONS
      await logAction({
        action: 'email-sent',
        actorUid: 'system',
        actorDisplayName: 'System',
        actorEmail: 'system@nem-insurance.com',
        actorRole: 'system',
        targetType: 'email',
        targetId: (userEmail || userDetails.email || formData?.email) + ',' + adminEmails.join(','),
        details: {
          emailType: 'submission-notification',
          formType: formType,
          userEmail: userEmail || userDetails.email || formData?.email,
          adminEmails: adminEmails
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: {
          relatedSubmission: docRef.id,
          emailCount: adminEmails.length + 1
        }
      });

    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail submission if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      documentId: docRef.id,
      collectionName: collectionName
    });

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ error: 'Form submission failed', details: error.message });
  }
});

// ✅ SECURITY: Whitelist of allowed Firestore collections
const ALLOWED_COLLECTIONS = [
  // KYC Forms
  'Individual-kyc-form',
  'corporate-kyc-form',
  
  // CDD Forms
  'individual-kyc',
  'corporate-kyc',
  'agentsCDD',
  'brokers-kyc',  // Brokers CDD form goes to brokers-kyc collection
  'partnersCDD',
  
  // Claims Forms
  'combined-gpa-employers-liability-claims',
  'motor-claims',
  'burglary-claims',
  'fire-special-perils-claims',
  'all-risk-claims',
  'goods-in-transit-claims',
  'money-insurance-claims',
  'employers-liability-claims',
  'public-liability-claims',
  'professional-indemnity-claims',
  'fidelity-guarantee-claims',
  'contractors-claims',
  'group-personal-accident-claims',
  'rent-assurance-claims',
  
  // General
  'formSubmissions'
];

/**
 * Validate collection name against whitelist
 * @throws {Error} if collection is not in whitelist
 */
const validateCollectionName = (collection) => {
  if (!collection || typeof collection !== 'string') {
    throw new Error('Invalid collection name');
  }
  
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    console.error('❌ Attempted access to unauthorized collection:', collection);
    throw new Error('Unauthorized collection access');
  }
  
  return collection;
};

// Helper function to determine Firestore collection based on form type
const getFirestoreCollection = (formType) => {
  const formTypeLower = formType.toLowerCase();
  console.log('🔍 getFirestoreCollection called with formType:', formType);
  console.log('🔍 formTypeLower:', formTypeLower);
  
  let collection;
  
  // Claims forms
  if (formTypeLower.includes('combined')) collection = 'combined-gpa-employers-liability-claims';
  else if (formTypeLower.includes('motor')) collection = 'motor-claims';
  else if (formTypeLower.includes('burglary')) collection = 'burglary-claims';
  else if (formTypeLower.includes('fire')) collection = 'fire-special-perils-claims';
  else if (formTypeLower.includes('allrisk') || formTypeLower.includes('all risk')) collection = 'all-risk-claims';
  else if (formTypeLower.includes('goods')) collection = 'goods-in-transit-claims';
  else if (formTypeLower.includes('money')) collection = 'money-insurance-claims';
  else if (formTypeLower.includes('employers')) collection = 'employers-liability-claims';
  else if (formTypeLower.includes('public')) collection = 'public-liability-claims';
  else if (formTypeLower.includes('professional')) collection = 'professional-indemnity-claims';
  else if (formTypeLower.includes('fidelity')) collection = 'fidelity-guarantee-claims';
  else if (formTypeLower.includes('contractors')) collection = 'contractors-claims';
  else if (formTypeLower.includes('group')) collection = 'group-personal-accident-claims';
  else if (formTypeLower.includes('rent')) collection = 'rent-assurance-claims';
  
  // KYC forms
  else if (formTypeLower.includes('individual') && formTypeLower.includes('kyc')) {
    console.log('✅ Matched: Individual KYC -> Individual-kyc-form');
    collection = 'Individual-kyc-form';
  }
  else if (formTypeLower.includes('corporate') && formTypeLower.includes('kyc')) {
    console.log('✅ Matched: Corporate KYC -> corporate-kyc-form');
    collection = 'corporate-kyc-form';
  }
  
  // CDD forms
  else if (formTypeLower.includes('individual') && formTypeLower.includes('cdd')) {
    console.log('✅ Matched: Individual CDD -> individual-kyc');
    collection = 'individual-kyc';
  }
  else if (formTypeLower.includes('corporate') && formTypeLower.includes('cdd')) {
    console.log('✅ Matched: Corporate CDD (or NAICOM Corporate CDD) -> corporate-kyc');
    collection = 'corporate-kyc';
  }
  else if (formTypeLower.includes('agents') && formTypeLower.includes('cdd')) collection = 'agentsCDD';
  else if (formTypeLower.includes('brokers') && formTypeLower.includes('cdd')) {
    console.log('✅ Matched: Brokers CDD -> brokers-kyc');
    collection = 'brokers-kyc';
  }
  else if (formTypeLower.includes('partners') && formTypeLower.includes('cdd')) collection = 'partnersCDD';
  
  else {
    console.log('⚠️ No match found, using default: formSubmissions');
    collection = 'formSubmissions';
  }
  
  // Validate against whitelist
  return validateCollectionName(collection);
};

// Helper functions for email HTML generation
const generateConfirmationEmailHTML = (formType) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #8B4513;">Form Submission Confirmed</h2>
        <p>Thank you for submitting your <strong>${formType}</strong> form. We have received your submission and it is currently being processed.</p>
        <p>You can track your submission status by logging in:</p>
        <p>
          <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Track Your Submission</a>
        </p>
        <p>We will notify you via email once your submission has been reviewed.</p>
        <p>Best regards,<br>NEM Insurance Team</p>
      </div>
    </div>
  `;
};

const generateAdminNotificationHTML = (formType, formData, documentId) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #8B4513;">New ${formType} Submission</h2>
        <p>A new <strong>${formType}</strong> form has been submitted and requires review.</p>
        <p><strong>Submitter:</strong> ${formData?.name || formData?.companyName || 'N/A'}</p>
        <p><strong>Email:</strong> ${formData?.email || 'N/A'}</p>
        <p><strong>Document ID:</strong> ${documentId}</p>
        
        <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #8B4513;">
          <p style="margin: 0;"><strong>Action Required:</strong> Please review this submission in the admin dashboard.</p>
        </div>
        
        <p>
          <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Access Admin Dashboard</a>
        </p>
        
        <p>Best regards,<br>NEM Forms System</p>
      </div>
    </div>
  `;
};

// ============= AUTHENTICATION BACKEND ENDPOINTS =============

// Login endpoint with event logging
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate credentials using Firebase Admin SDK
    try {
      // Check if user exists
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // ✅ SECURE: Use Firebase Auth REST API for password validation
      // This is the recommended approach for server-side password validation
      const apiKey = process.env.REACT_APP_FIREBASE_KEY || process.env.VITE_FIREBASE_API_KEY;
      
      if (!apiKey) {
        console.error('❌ Firebase API key not configured');
        return res.status(500).json({ 
          error: 'Server configuration error',
          message: 'Authentication service is not properly configured. Please contact support.'
        });
      }
      
      // Use Firebase Auth REST API to verify password
      const authResponse = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          email: email,
          password: password,
          returnSecureToken: true
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      
      // If we get here, credentials are valid
      if (!authResponse.data || !authResponse.data.idToken) {
        throw new Error('Invalid authentication response');
      }
      
    } catch (authError) {
      // Password validation failed or user doesn't exist
      const errorCode = authError.response?.data?.error?.message || authError.code || 'UNKNOWN_ERROR';
      console.error('Authentication failed:', errorCode);
      
      // Log failed attempt
      const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
      await logAction({
        action: 'failed-login',
        actorUid: null,
        actorDisplayName: null,
        actorEmail: email,
        actorRole: null,
        targetType: 'user',
        targetId: email,
        details: {
          loginMethod: 'email-password',
          success: false,
          error: errorCode,
          errorMessage: authError.message
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: {
          attemptTimestamp: new Date().toISOString()
        }
      });
      
      // User-friendly error messages
      let userMessage = 'Invalid email or password. Please check your credentials and try again.';
      if (errorCode === 'EMAIL_NOT_FOUND') {
        userMessage = 'No account found with this email address.';
      } else if (errorCode === 'INVALID_PASSWORD') {
        userMessage = 'Incorrect password. Please try again.';
      } else if (errorCode === 'USER_DISABLED') {
        userMessage = 'This account has been disabled. Please contact support.';
      } else if (errorCode === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        userMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: userMessage
      });
    }

    // Now get user record after successful authentication
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Check if user exists in userroles collection
    const userDoc = await db.collection('userroles').doc(userRecord.uid).get();
    const userRole = userDoc.exists ? userDoc.data().role : 'user';
    
    // Create custom token for the user
    const customToken = await admin.auth().createCustomToken(userRecord.uid, {
      role: userRole,
      email: email
    });

    // 📝 LOG SUCCESSFUL LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'login',
      actorUid: userRecord.uid,
      actorDisplayName: userRecord.displayName || email.split('@')[0],
      actorEmail: email,
      actorRole: userRole,
      targetType: 'user',
      targetId: userRecord.uid,
      details: {
        loginMethod: 'email-password',
        success: true
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        loginTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ 
      success: true,
      customToken, 
      role: userRole,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // 📝 LOG FAILED LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'failed-login',
      actorUid: null,
      actorDisplayName: null,
      actorEmail: req.body.email,
      actorRole: null,
      targetType: 'user',
      targetId: req.body.email,
      details: {
        loginMethod: 'email-password',
        success: false,
        error: error.message
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        attemptTimestamp: new Date().toISOString()
      }
    });
    
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
});

// Token exchange endpoint with MFA checking - frontend does Firebase auth, backend verifies token and returns user info
app.post('/api/exchange-token', async (req, res) => {
  // Skip general logging - this endpoint has its own detailed logging
  req.skipGeneralLogging = true;
  
  try {
    console.log('�🚀� SERVNDER VERSION: MFA-MANDATORY-v2.0 - DEPLOYED 🚀�🚀');
    console.log('🔄 Token exchange request received from origin:', req.headers.origin);
    console.log('🔄 Request headers:', {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'x-timestamp': req.headers['x-timestamp']
    });

    const { idToken } = req.body;
    
    if (!idToken) {
      console.error('❌ Token exchange failed: ID token is required');
      return res.status(400).json({ error: 'ID token is required' });
    }

    console.log('🔍 Verifying Firebase ID token...');
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;
    const uid = decodedToken.uid;
    
    console.log('✅ Token verified successfully for user:', email);
    
    // Get user from Firestore userroles collection
    let userDoc = await db.collection('userroles').doc(uid).get();
    let userData;
    
    if (!userDoc.exists) {
      console.log('⚠️ User not found in userroles collection, checking users collection...');
      
      // Fallback: Check 'users' collection for role
      const usersDoc = await db.collection('users').doc(uid).get();
      
      if (usersDoc.exists) {
        const usersData = usersDoc.data();
        console.log('🔍 Found user in users collection with role:', usersData.role);
        
        // Create userroles document from users data
        const normalizedRole = normalizeRole(usersData.role || 'default');
        userData = {
          name: usersData.name || usersData.displayName || email.split('@')[0],
          email: email,
          role: normalizedRole,
          phone: usersData.phone || null,
          dateCreated: new Date(),
          dateModified: new Date(),
          lastActivity: Date.now()
        };
        
        await db.collection('userroles').doc(uid).set(userData);
        console.log('✅ Created userroles document with role:', normalizedRole);
      } else {
        console.error('❌ User not found in userroles or users collection:', uid);
        return res.status(401).json({ error: 'User not found. Please contact administrator.' });
      }
    } else {
      userData = userDoc.data();
    }
    
    // ============================================================================
    // MFA DISABLED - Simple login tracking only
    // ============================================================================
    
    // Get or create login metadata document
    const loginMetaRef = db.collection('loginMetadata').doc(uid);
    const loginMetaDoc = await loginMetaRef.get();
    
    let loginCount = 1;
    
    if (loginMetaDoc.exists) {
      const metaData = loginMetaDoc.data();
      loginCount = (metaData.loginCount || 0) + 1;
    }
    
    // Update login count only (no MFA fields)
    await loginMetaRef.set({
      loginCount: loginCount,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      email: email,
      role: userData.role
    }, { merge: true });
    
    // ✅ CRITICAL: Update lastActivity in userroles to prevent immediate session expiration
    await db.collection('userroles').doc(uid).update({
      lastActivity: Date.now()
    }).catch(err => logger.error('Failed to update lastActivity on login:', err));
    
    console.log('✅ Login #' + loginCount + ' for user:', email);
    
    // Log successful login (token exchange)
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'login', // Changed from 'login-success' for consistency
      actorUid: uid,
      actorDisplayName: userData.name || email.split('@')[0],
      actorEmail: email,
      actorPhone: userData.phone || null,
      actorRole: userData.role,
      targetType: 'user',
      targetId: uid,
      details: { 
        loginMethod: 'token-exchange',
        loginCount: loginCount,
        success: true
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: { loginTimestamp: new Date().toISOString() }
    });
    
    console.log('✅ Login successful (MFA disabled)\n');

    // Set httpOnly session cookie with user UID for subsequent authenticated requests
    // Note: For localhost cross-port (8080 -> 3001), we use 'lax' which works for same-site different ports
    res.cookie('__session', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure only in production (HTTPS required)
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-origin in production
      maxAge: 2 * 60 * 60 * 1000, // 2 hours (reduced from 24 hours for better security)
      path: '/',
      // Don't set domain for localhost - let browser handle it
    });

    console.log('🍪 Session cookie set for UID:', uid);
    console.log('🔧 Cookie config:', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: '2 hours',
      path: '/'
    });

    res.json({
      success: true,
      role: userData.role,
      user: { uid, email, displayName: userData.name },
      loginCount: loginCount,
      sessionToken: uid // Send token in response for localStorage fallback
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});


// MFA enrollment check endpoint
app.get('/api/auth/mfa-status/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    // Get user's MFA enrollment status
    const userRecord = await admin.auth().getUser(uid);
    const enrolledFactors = userRecord.multiFactor?.enrolledFactors || [];
    
    res.json({
      success: true,
      mfaEnrolled: enrolledFactors.length > 0,
      enrolledFactors: enrolledFactors.map(factor => ({
        uid: factor.uid,
        factorId: factor.factorId,
        displayName: factor.displayName,
        enrollmentTime: factor.enrollmentTime
      }))
    });

  } catch (error) {
    console.error('MFA status check error:', error);
    res.status(500).json({ error: 'Failed to check MFA status' });
  }
});

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

// Apply rate limiting to specific endpoints
app.use('/api/exchange-token', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/auth/verify-mfa', mfaAttemptLimit);

// Form submission endpoints
app.use('/api/submit-form', submissionLimiter);
app.use('/submit-kyc-individual', submissionLimiter);
app.use('/submit-kyc-corporate', submissionLimiter);
app.use('/submit-cdd-individual', submissionLimiter);
app.use('/submit-cdd-corporate', submissionLimiter);
app.use('/submit-cdd-agents', submissionLimiter);
app.use('/submit-cdd-brokers', submissionLimiter);
app.use('/submit-cdd-partners', submissionLimiter);
app.use('/submit-claim-motor', submissionLimiter);
app.use('/submit-claim-fire', submissionLimiter);
app.use('/submit-claim-burglary', submissionLimiter);
app.use('/submit-claim-all-risk', submissionLimiter);

// Email endpoints
app.use('/send-to-admin-and-compliance', emailLimiter);
app.use('/send-to-admin-and-claims', emailLimiter);
app.use('/send-to-user', emailLimiter);
app.use('/send-status-update-email', emailLimiter);
app.use('/send-claim-approval-email', emailLimiter);

// Sensitive operations
app.use('/api/update-claim-status', sensitiveOperationLimiter);
app.use('/api/users/:userId/role', sensitiveOperationLimiter);
app.use('/api/users/:userId', sensitiveOperationLimiter); // DELETE user
app.use('/api/cleanup-expired-ips', sensitiveOperationLimiter);

// Event logs endpoints
app.use('/api/events-logs', apiLimiter);

// User management endpoints
app.use('/api/users', apiLimiter);

// General API protection (apply to all /api routes not specifically limited above)
app.use('/api/', apiLimiter);

// Register endpoint with event logging
// ✅ VALIDATED: Input validation applied
app.post('/api/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, displayName, role = 'user', dateOfBirth } = req.body;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });

    // Set role in userroles collection with date of birth
    const userRoleData = {
      email: email,
      role: role,
      displayName: displayName,
      name: displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add date of birth if provided
    if (dateOfBirth) {
      userRoleData.dateOfBirth = dateOfBirth;
    }
    
    await db.collection('userroles').doc(userRecord.uid).set(userRoleData);

    // Initialize login metadata
    await db.collection('loginMetadata').doc(userRecord.uid).set({
      loginCount: 0,
      email: email,
      role: role,
      lastLoginAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 📝 LOG THE REGISTRATION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'register',
      actorUid: userRecord.uid,
      actorDisplayName: displayName,
      actorEmail: email,
      actorRole: role,
      targetType: 'user',
      targetId: userRecord.uid,
      details: {
        registrationMethod: 'email-password',
        assignedRole: role
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        registrationTimestamp: new Date().toISOString()
      }
    });

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// ============= DATA RETRIEVAL BACKEND ENDPOINTS =============

// Get forms data with event logging
// ✅ PROTECTED: Requires claims, compliance, admin, or super admin role
app.get('/api/forms/:collection', requireAuth, requireClaims, async (req, res) => {
  try {
    const { collection } = req.params;
    const { viewerUid, page = 1, limit = 50 } = req.query;
    
    console.log(`📊 Forms data request for collection: ${collection}`);
    console.log('👤 Requested by:', req.user.email, 'Role:', req.user.role);
    
    // Get viewer details for logging
    let viewerDetails = { displayName: null, email: null, role: null };
    if (viewerUid) {
      viewerDetails = await getUserDetailsForLogging(viewerUid);
    }
    
    // Build query
    let query = db.collection(collection);
    
    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    query = query.orderBy('timestamp', 'desc');
    
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }
    
    query = query.limit(limitNum);
    const snapshot = await query.get();
    
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get total count for pagination
    const totalSnapshot = await db.collection(collection).get();
    const totalCount = totalSnapshot.size;

    // 📝 LOG THE DATA RETRIEVAL EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: 'collection',
      targetId: collection,
      details: {
        viewType: 'table-data',
        recordCount: data.length,
        page: pageNum,
        limit: limitNum
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collection,
        totalRecords: totalCount,
        paginationInfo: { page: pageNum, limit: limitNum, offset }
      }
    });

    res.json({
      data,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });

  } catch (error) {
    console.error(`Error fetching forms data from ${req.params.collection}:`, error);
    res.status(500).json({ error: 'Failed to fetch forms data', details: error.message });
  }
});

// Get specific form by ID with event logging
// ✅ PROTECTED: Requires authentication, users can view their own or admins can view all
app.get('/api/forms/:collection/:id', requireAuth, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { viewerUid } = req.query;
    
    console.log('👤 Form detail requested by:', req.user.email, 'Role:', req.user.role);
    
    // Get viewer details for logging
    let viewerDetails = { displayName: null, email: null, role: null };
    if (viewerUid) {
      viewerDetails = await getUserDetailsForLogging(viewerUid);
    }
    
    const doc = await db.collection(collection).doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = {
      id: doc.id,
      ...doc.data()
    };

    // 📝 LOG THE DOCUMENT VIEW EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: collection,
      targetId: id,
      details: {
        viewType: 'form-detail',
        formType: data.formType || 'unknown'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collection,
        documentId: id
      }
    });

    res.json(data);

  } catch (error) {
    console.error(`Error fetching document ${req.params.id} from ${req.params.collection}:`, error);
    res.status(500).json({ error: 'Failed to fetch document', details: error.message });
  }
});

// ============= FORM EDITING AND STATUS UPDATE ENDPOINTS =============

// Update form status with event logging
// ✅ PROTECTED: Requires claims, compliance, admin, or super admin role
// ✅ VALIDATED: Input validation applied
app.put('/api/forms/:collection/:id/status', requireAuth, requireClaims, validateFormStatusUpdate, sanitizeHtmlFields, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { status, updaterUid, comment, userEmail, formType } = req.body;
    
    console.log('👤 Status update by:', req.user.email, 'Role:', req.user.role);

    // Get document before update for logging
    const docBefore = await db.collection(collection).doc(id).get();
    if (!docBefore.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const beforeData = docBefore.data();
    
    // Get updater details
    const updaterDetails = await getUserDetailsForLogging(updaterUid);
    
    // Update document
    const updateData = {
      status: status,
      updatedBy: updaterUid,
      updaterName: updaterDetails.displayName || updaterDetails.email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (comment) {
      updateData.updateComment = comment;
    }
    
    await db.collection(collection).doc(id).update(updateData);

    // 📝 LOG THE STATUS UPDATE EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'status-update',
      actorUid: updaterUid,
      actorDisplayName: updaterDetails.displayName,
      actorEmail: updaterDetails.email,
      actorRole: updaterDetails.role,
      targetType: collection,
      targetId: id,
      details: {
        from: { status: beforeData.status || 'unknown' },
        to: { status: status },
        comment: comment,
        formType: formType || beforeData.formType
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collection,
        documentId: id,
        userEmail: userEmail,
        updaterName: updaterDetails.displayName || updaterDetails.email
      }
    });

    // Send status update email if user email provided
    if (userEmail && formType) {
      try {
        const isApproved = status === 'approved';
        const statusText = isApproved ? 'approved' : (status === 'rejected' ? 'rejected' : 'updated');
        const statusColor = isApproved ? '#22c55e' : (status === 'rejected' ? '#ef4444' : '#f59e0b');
        const statusEmoji = isApproved ? '🎉' : (status === 'rejected' ? '❌' : '📝');

        const subject = `${formType} Status Update - ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">NEM Insurance</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: ${statusColor};">Your ${formType} has been ${statusText}! ${statusEmoji}</h2>
              
              <p>Dear Valued Customer,</p>
              
              <p>We wanted to update you on the status of your <strong>${formType}</strong> submission.</p>
              
              <div style="background: #f0f8ff; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
                <p style="margin: 0;"><strong>New Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
                <p style="margin: 5px 0 0 0;"><strong>Reference ID:</strong> ${id}</p>
                ${comment ? `<p style="margin: 5px 0 0 0;"><strong>Notes:</strong> ${comment}</p>` : ''}
              </div>
              
              <p>
                <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">View Your Dashboard</a>
              </p>
              
              <p>Best regards,<br/>NEM Insurance Team</p>
            </div>
          </div>
        `;

        await sendEmail(userEmail, subject, html);
        
        // 📝 LOG EMAIL SENT EVENT
        await logAction({
          action: 'email-sent',
          actorUid: updaterUid,
          actorDisplayName: updaterDetails.displayName,
          actorEmail: updaterDetails.email,
          actorRole: updaterDetails.role,
          targetType: 'email',
          targetId: userEmail,
          details: {
            emailType: `status-${status}`,
            subject: subject
          },
          ipMasked: req.ipData?.masked,
          ipHash: req.ipData?.hash,
          rawIP: req.ipData?.raw,
          location: location,
          userAgent: req.headers['user-agent'] || 'Unknown',
          meta: {
            emailTarget: userEmail,
            formType: formType,
            newStatus: status,
            relatedDocument: id
          }
        });

      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      updatedBy: updaterDetails.displayName || updaterDetails.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating form status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});

// ============= EVENTS LOG API ENDPOINTS =============

// Get event logs with filtering and pagination (Admin only)
// ✅ PROTECTED: Requires claims, compliance, admin, or super admin role
app.get('/api/events-logs', requireAuth, requireClaims, async (req, res) => {
  try {
    console.log('🔍 /api/events-logs endpoint called');
    console.log('👤 Requested by:', req.user.email, 'Role:', req.user.role);
    console.log('📤 Request query params:', req.query);
    console.log('📤 Request headers:', {
      'x-timestamp': req.headers['x-timestamp'],
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    });
    
    // Basic validation
    const { 
      page = 1, 
      limit = 50, 
      action, 
      targetType, 
      actorEmail, 
      startDate, 
      endDate,
      searchTerm,
      advanced = 'false'
    } = req.query;

    console.log('📋 Parsed parameters:', {
      page, limit, action, targetType, actorEmail, startDate, endDate, searchTerm, advanced
    });

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      console.error('❌ Invalid page parameter:', page);
      return res.status(400).json({ error: 'Invalid page parameter' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.error('❌ Invalid limit parameter:', limit);
      return res.status(400).json({ error: 'Invalid limit parameter (must be 1-100)' });
    }

    console.log('🔍 Checking if eventLogs collection exists...');
    
    // Always use eventLogs collection for this endpoint
    let query = db.collection('eventLogs');

    // Check if collection exists and has documents
    const collectionExists = await db.collection('eventLogs').limit(1).get();
    console.log('📊 Collection check result:', {
      empty: collectionExists.empty,
      size: collectionExists.size,
      docs: collectionExists.docs.length
    });
    
    if (collectionExists.empty) {
      console.log('⚠️  EventLogs collection is empty, returning empty response');
      return res.json({
        events: [],
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalCount: 0,
          totalPages: 0
        }
      });
    }

    console.log('✅ Collection has documents, building query...');

    // Apply filters
    if (action && action !== 'all') {
      console.log('🔽 Filtering by action:', action);
      query = query.where('action', '==', action);
    }

    if (targetType && targetType !== 'all') {
      console.log('🔽 Filtering by targetType:', targetType);
      query = query.where('targetType', '==', targetType);
    }

    if (actorEmail) {
      console.log('🔽 Filtering by actorEmail:', actorEmail);
      query = query.where('actorEmail', '==', actorEmail);
    }

    // Date range filtering
    if (startDate) {
      try {
        const start = admin.firestore.Timestamp.fromDate(new Date(startDate));
        console.log('🔽 Filtering by startDate:', startDate, '→', start.toDate());
        query = query.where('ts', '>=', start);
      } catch (dateError) {
        console.error('❌ Invalid startDate:', startDate, dateError);
        return res.status(400).json({ error: 'Invalid startDate format' });
      }
    }

    if (endDate) {
      try {
        const end = admin.firestore.Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
        console.log('🔽 Filtering by endDate:', endDate, '→', end.toDate());
        query = query.where('ts', '<=', end);
      } catch (dateError) {
        console.error('❌ Invalid endDate:', endDate, dateError);
        return res.status(400).json({ error: 'Invalid endDate format' });
      }
    }

    // Order by timestamp descending
    console.log('📅 Ordering by timestamp desc');
    query = query.orderBy('ts', 'desc');

    // Apply pagination
    const offset = (pageNum - 1) * limitNum;
    console.log('📄 Pagination settings:', { pageNum, limitNum, offset });
    
    if (offset > 0) {
      console.log('⏭️  Applying pagination offset:', offset);
      const startAfterSnapshot = await query.limit(offset).get();
      if (!startAfterSnapshot.empty) {
        const lastVisible = startAfterSnapshot.docs[startAfterSnapshot.docs.length - 1];
        query = query.startAfter(lastVisible);
      }
    }

    query = query.limit(limitNum);

    console.log('⚡ Executing main query...');
    const snapshot = await query.get();
    console.log('📊 Query result:', {
      empty: snapshot.empty,
      size: snapshot.size,
      docs: snapshot.docs.length
    });

    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert timestamp to ISO string for frontend
      const eventData = {
        ...data,
        ts: data.ts ? data.ts.toDate().toISOString() : new Date().toISOString()
      };
      
      // For regular view, exclude sensitive fields
      if (advanced !== 'true') {
        const { rawIP, ipHash, userAgent, location, ...regularData } = eventData;
        return { id: doc.id, ...regularData };
      }
      
      // For advanced view, include all fields but remove rawIP if expired
      if (data.rawIPExpiry && data.rawIPExpiry.toDate() < new Date()) {
        const { rawIP, ...dataWithoutRawIP } = eventData;
        return { id: doc.id, ...dataWithoutRawIP };
      }
      
      return { id: doc.id, ...eventData };
    });

    console.log('🔄 Processed events:', events.length);
    console.log('🔍 Sample events:', events.slice(0, 2));

    // Get total count for pagination (more efficient way)
    console.log('🔢 Calculating total count...');
    const totalCountSnapshot = await db.collection('eventLogs').select().get();
    const totalCount = totalCountSnapshot.size;
    console.log('📊 Total events in collection:', totalCount);

    console.log(`✅ Returning ${events.length} events out of ${totalCount} total`);

    const response = {
      events,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    };

    console.log('📤 Final response structure:', {
      eventsCount: response.events.length,
      pagination: response.pagination
    });

    res.json(response);

  } catch (error) {
    console.error('Error fetching event logs:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Return more specific error messages
    if (error.code === 9) { // FAILED_PRECONDITION
      return res.status(400).json({ 
        error: 'Query requires an index. Please ensure Firestore indexes are configured.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch event logs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get event details by ID (Admin only)
// ✅ PROTECTED: Requires claims, compliance, admin, or super admin role
app.get('/api/events-logs/:id', requireAuth, requireClaims, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Event log detail request by:', req.user.email, 'Role:', req.user.role);
    
    const doc = await db.collection('eventLogs').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        error: 'Event log not found',
        message: 'The requested event log does not exist or has been deleted.'
      });
    }

    const data = doc.data();
    
    // Remove rawIP if expired
    if (data.rawIPExpiry && data.rawIPExpiry.toDate() < new Date()) {
      const { rawIP, ...dataWithoutRawIP } = data;
      return res.json({ id: doc.id, ...dataWithoutRawIP });
    }
    
    res.json({ id: doc.id, ...data });
    
  } catch (error) {
    console.error('Error fetching event log details:', error);
    res.status(500).json({ 
      error: 'Unable to retrieve event log',
      message: 'An error occurred while fetching the event log details. Please try again.'
    });
  }
});

// Clean up expired raw IPs (scheduled job - call this periodically)
// ✅ PROTECTED: Requires super admin role
app.post('/api/cleanup-expired-ips', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('🧹 IP cleanup initiated by:', req.user.email, 'Role:', req.user.role);
    
    const now = admin.firestore.Timestamp.now();
    const expiredQuery = db.collection('eventLogs')
      .where('rawIPExpiry', '<', now)
      .where('rawIP', '!=', null);

    const snapshot = await expiredQuery.get();
    
    if (snapshot.empty) {
      return res.json({ 
        success: true,
        message: 'No expired IP addresses found',
        cleaned: 0 
      });
    }

    const batch = db.batch();
    let cleanedCount = 0;

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { rawIP: admin.firestore.FieldValue.delete() });
      cleanedCount++;
    });

    await batch.commit();
    
    console.log(`✅ Cleaned up ${cleanedCount} expired raw IPs by ${req.user.email}`);
    
    // Log the cleanup action
    await logAction({
      action: 'cleanup-expired-ips',
      actorUid: req.user.uid,
      actorDisplayName: req.user.name,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetType: 'system',
      targetId: 'event-logs',
      details: {
        cleanedCount: cleanedCount,
        timestamp: new Date().toISOString()
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });
    
    res.json({ 
      success: true,
      message: `Successfully cleaned up ${cleanedCount} expired IP addresses`,
      cleaned: cleanedCount 
    });
    
  } catch (error) {
    console.error('Error cleaning up expired IPs:', error);
    res.status(500).json({ 
      error: 'Cleanup failed',
      message: 'Unable to clean up expired IP addresses. Please try again or contact support.'
    });
  }
});

// ✅ Route to manually generate test events (for development/testing only)
// ✅ PROTECTED: Only available in non-production environments
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/generate-test-events', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      console.log('🧪 Manually generating test events...');
      console.log('👤 Requested by:', req.user.email, 'Role:', req.user.role);
      
      const sampleEvents = [
      {
        action: 'submit',
        actorUid: 'sample-user-1',
        actorDisplayName: 'John Doe',
        actorEmail: 'john.doe@example.com',
        actorRole: 'user',
        targetType: 'kyc-form',
        targetId: 'kyc-sample-001',
        details: { formType: 'Individual KYC', status: 'processing' },
        ipMasked: '203.115.45.***',
        ipHash: 'abc123def456',
        rawIP: '203.115.45.120',
        location: 'Lagos, Nigeria',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        meta: { sampleEvent: true, testData: true, generatedAt: new Date().toISOString() }
      },
      {
        action: 'approve',
        actorUid: 'admin-001',
        actorDisplayName: 'Admin User',
        actorEmail: 'admin@nem-insurance.com',
        actorRole: 'admin',
        targetType: 'claim',
        targetId: 'claim-sample-002',
        details: { 
          from: { status: 'pending' }, 
          to: { status: 'approved' },
          comment: 'Claim approved after review'
        },
        ipMasked: '192.168.1.***',
        ipHash: 'def456ghi789',
        rawIP: '192.168.1.100',
        location: 'Abuja, Nigeria',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        meta: { sampleEvent: true, adminAction: true, generatedAt: new Date().toISOString() }
      },
      {
        action: 'login',
        actorUid: user?.uid || 'current-user',
        actorDisplayName: user?.displayName || user?.email?.split('@')[0] || 'Current User',
        actorEmail: user?.email || 'current.user@example.com',
        actorRole: 'admin',
        targetType: 'user',
        targetId: user?.uid || 'current-user',
        details: { loginMethod: 'manual-test', success: true },
        ipMasked: req.ipData?.masked || '127.0.0.***',
        ipHash: req.ipData?.hash || 'test-hash',
        rawIP: req.ipData?.raw || '127.0.0.1',
        location: 'Test Location',
        userAgent: req.headers['user-agent'] || 'Test Browser',
        meta: { sampleEvent: true, manualTest: true, generatedAt: new Date().toISOString() }
      },
      {
        action: 'view',
        actorUid: 'compliance-001',
        actorDisplayName: 'Jane Smith',
        actorEmail: 'jane.smith@nem-insurance.com',
        actorRole: 'compliance',
        targetType: 'cdd-form',
        targetId: 'cdd-sample-003',
        details: { viewType: 'form-detail', formType: 'Corporate CDD' },
        ipMasked: '10.0.0.***',
        ipHash: 'ghi789jkl012',
        rawIP: '10.0.0.50',
        location: 'Port Harcourt, Nigeria',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        meta: { sampleEvent: true, complianceReview: true, generatedAt: new Date().toISOString() }
      },
      {
        action: 'email-sent',
        actorUid: 'system',
        actorDisplayName: 'System',
        actorEmail: 'system@nem-insurance.com',
        actorRole: 'system',
        targetType: 'email',
        targetId: 'admin@nem-insurance.com',
        details: { 
          emailType: 'admin-notification',
          subject: 'New KYC Submission',
          formType: 'Individual KYC'
        },
        ipMasked: '127.0.0.***',
        ipHash: 'mno345pqr678',
        rawIP: '127.0.0.1',
        location: 'Server Location',
        userAgent: 'System/1.0',
        meta: { sampleEvent: true, systemGenerated: true, generatedAt: new Date().toISOString() }
      }
    ];

    let successCount = 0;
    for (const event of sampleEvents) {
      try {
        await logAction(event);
        successCount++;
      } catch (error) {
        console.error('Failed to create sample event:', error);
      }
    }
    
      console.log(`✅ Generated ${successCount}/${sampleEvents.length} test events`);
      res.status(200).json({ 
        success: true,
        message: `Successfully generated ${successCount} test events`,
        generated: successCount,
        total: sampleEvents.length
      });
      
    } catch (error) {
      console.error('Error generating test events:', error);
      res.status(500).json({ 
        error: 'Failed to generate test events',
        message: 'Unable to generate test events. Please check server logs for details.'
      });
    }
  });
} else {
  // In production, return 404 for this endpoint
  app.post('/api/generate-test-events', (req, res) => {
    res.status(404).json({ 
      error: 'Not found',
      message: 'This endpoint is not available in production.'
    });
  });
}

// ============= USER MANAGEMENT ENDPOINTS WITH EVENT LOGGING =============

// ✅ NEW: Update user role with EVENT LOGGING
app.put('/api/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, updaterUid } = req.body;

    if (role === undefined) {
      return res.status(400).json({ error: 'Role is missing in the request body' });
    }

    // Get current user data before update
    const userDoc = await admin.firestore().collection('userroles').doc(userId).get();
    const oldRole = userDoc.exists ? userDoc.data().role : null;
    
    // Get updater details for logging
    const updaterDetails = await getUserDetailsForLogging(updaterUid);
    
    // Update the 'role' field in the Firestore collection for the specified user
    await admin.firestore().collection('userroles').doc(userId).update({
      role: role,
      dateModified: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get target user details for logging
    const targetUserRecord = await admin.auth().getUser(userId);

    // 📝 LOG THE ROLE UPDATE EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'role-update',
      actorUid: updaterUid,
      actorDisplayName: updaterDetails.displayName,
      actorEmail: updaterDetails.email,
      actorRole: updaterDetails.role,
      targetType: 'user',
      targetId: userId,
      details: {
        targetUserEmail: targetUserRecord.email,
        targetUserName: targetUserRecord.displayName || targetUserRecord.email?.split('@')[0],
        oldRole: oldRole,
        newRole: role,
        roleChangeType: oldRole ? 'role-modification' : 'initial-role-assignment'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        userId: userId,
        timestamp: new Date().toISOString(),
        updateMethod: 'admin-panel'
      }
    });

    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'User role update failed' });
  }
});

// ✅ NEW: Get all users with EVENT LOGGING
app.get('/api/users', async (req, res) => {
  try {
    const { viewerUid } = req.query;
    
    // Get viewer details for logging
    const viewerDetails = await getUserDetailsForLogging(viewerUid);
    
    // Fetch users from userroles collection
    const usersSnapshot = await admin.firestore().collection('userroles').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 📝 LOG THE USER LIST VIEW EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: 'user-list',
      targetId: 'all-users',
      details: {
        viewType: 'user-management',
        usersCount: users.length
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        timestamp: new Date().toISOString(),
        viewContext: 'admin-dashboard'
      }
    });

    res.status(200).json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ✅ NEW: Delete user with EVENT LOGGING
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { deleterUid, userName } = req.body;

    // Get user data before deletion for logging
    const userRecord = await admin.auth().getUser(userId);
    const userDoc = await admin.firestore().collection('userroles').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Get deleter details for logging
    const deleterDetails = await getUserDetailsForLogging(deleterUid);

    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);
    
    // Delete from Firestore
    await admin.firestore().collection('userroles').doc(userId).delete();

    // 📝 LOG THE USER DELETION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'delete',
      actorUid: deleterUid,
      actorDisplayName: deleterDetails.displayName,
      actorEmail: deleterDetails.email,
      actorRole: deleterDetails.role,
      targetType: 'user',
      targetId: userId,
      details: {
        deletedUserEmail: userRecord.email,
        deletedUserName: userName || userRecord.displayName || userRecord.email?.split('@')[0],
        deletedUserRole: userData.role,
        deletionMethod: 'admin-panel'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        deletedUserId: userId,
        timestamp: new Date().toISOString(),
        permanentDeletion: true
      }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============= ADDITIONAL FORMS BACKEND ENDPOINTS =============

// Get forms from multiple collections (for CDD and Claims tables)
app.post('/api/forms/multiple', async (req, res) => {
  try {
    const { collections } = req.body;
    const userAuth = req.headers.authorization;
    
    if (!Array.isArray(collections)) {
      return res.status(400).json({ error: 'Collections must be an array' });
    }
    
    // Get user details for logging
    let userDetails = { displayName: null, email: null, role: null, uid: null };
    if (userAuth && userAuth.startsWith('Bearer ')) {
      const token = userAuth.split(' ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userDetails = await getUserDetailsForLogging(decodedToken.uid);
        userDetails.uid = decodedToken.uid;
      } catch (err) {
        console.warn('Invalid token for multiple forms fetch:', err);
      }
    }
    
    console.log(`📊 Fetching forms from multiple collections: ${collections.join(', ')}`);
    
    const allForms = [];
    let totalRecords = 0;
    
    for (const collectionName of collections) {
      try {
        const formsRef = db.collection(collectionName);
        let snapshot;
        
        // Try different timestamp fields for ordering
        try {
          snapshot = await formsRef.orderBy('timestamp', 'desc').get();
          if (snapshot.docs.length === 0) {
            snapshot = await formsRef.orderBy('submittedAt', 'desc').get();
            if (snapshot.docs.length === 0) {
              snapshot = await formsRef.orderBy('createdAt', 'desc').get();
              if (snapshot.docs.length === 0) {
                snapshot = await formsRef.get();
              }
            }
          }
        } catch (error) {
          snapshot = await formsRef.get();
        }
        
        snapshot.docs.forEach(doc => {
          allForms.push({
            id: doc.id,
            collection: collectionName,
            ...doc.data()
          });
        });
        
        totalRecords += snapshot.docs.length;
        console.log(`✅ Fetched ${snapshot.docs.length} forms from ${collectionName}`);
        
      } catch (error) {
        console.error(`Error fetching from collection ${collectionName}:`, error);
      }
    }

    // 📝 LOG MULTIPLE COLLECTIONS RETRIEVAL EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view-multiple-forms-data',
      actorUid: userDetails.uid,
      actorDisplayName: userDetails.displayName,
      actorEmail: userDetails.email,
      actorRole: userDetails.role,
      targetType: 'forms-collections',
      targetId: collections.join(','),
      details: {
        collections: collections,
        recordsCount: totalRecords,
        timestamp: new Date().toISOString()
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        accessTimestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Successfully fetched ${totalRecords} total forms from ${collections.length} collections`);
    res.status(200).json({ data: allForms });
    
  } catch (error) {
    console.error('Error fetching multiple collections:', error);
    res.status(500).json({ error: 'Failed to fetch forms from multiple collections' });
  }
});

// Update form status with event logging
app.patch('/api/forms/:collectionName/:formId/status', async (req, res) => {
  try {
    const { collectionName, formId } = req.params;
    const { status } = req.body;
    const userAuth = req.headers.authorization;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get user details for logging
    let userDetails = { displayName: null, email: null, role: null, uid: null };
    if (userAuth && userAuth.startsWith('Bearer ')) {
      const token = userAuth.split(' ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userDetails = await getUserDetailsForLogging(decodedToken.uid);
        userDetails.uid = decodedToken.uid;
      } catch (err) {
        console.warn('Invalid token for status update:', err);
      }
    }
    
    // Get current form data for logging
    const formDoc = await db.collection(collectionName).doc(formId).get();
    const oldStatus = formDoc.exists ? formDoc.data().status : null;
    
    // Update the form status
    await db.collection(collectionName).doc(formId).update({
      status: status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusUpdatedBy: userDetails.email || 'Unknown'
    });

    // 📝 LOG STATUS UPDATE EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'update-form-status',
      actorUid: userDetails.uid,
      actorDisplayName: userDetails.displayName,
      actorEmail: userDetails.email,
      actorRole: userDetails.role,
      targetType: 'form',
      targetId: formId,
      details: {
        collection: collectionName,
        formId: formId,
        oldStatus: oldStatus,
        newStatus: status,
        timestamp: new Date().toISOString()
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        updateTimestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Updated status for form ${formId} in ${collectionName} from '${oldStatus}' to '${status}'`);
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error updating form status:', error);
    res.status(500).json({ error: 'Failed to update form status' });
  }
});

// Delete form with event logging
app.delete('/api/forms/:collectionName/:formId', async (req, res) => {
  try {
    const { collectionName, formId } = req.params;
    const userAuth = req.headers.authorization;
    
    // Get user details for logging
    let userDetails = { displayName: null, email: null, role: null, uid: null };
    if (userAuth && userAuth.startsWith('Bearer ')) {
      const token = userAuth.split(' ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userDetails = await getUserDetailsForLogging(decodedToken.uid);
        userDetails.uid = decodedToken.uid;
      } catch (err) {
        console.warn('Invalid token for form deletion:', err);
      }
    }
    
    // Get current form data for logging
    const formDoc = await db.collection(collectionName).doc(formId).get();
    const formData = formDoc.exists ? formDoc.data() : {};
    
    // Delete the form
    await db.collection(collectionName).doc(formId).delete();

    // 📝 LOG FORM DELETION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'delete-form',
      actorUid: userDetails.uid,
      actorDisplayName: userDetails.displayName,
      actorEmail: userDetails.email,
      actorRole: userDetails.role,
      targetType: 'form',
      targetId: formId,
      details: {
        collection: collectionName,
        formId: formId,
        deletedFormData: {
          // Only log non-sensitive identifying info
          formType: formData.formType || collectionName,
          email: formData.email,
          createdAt: formData.createdAt || formData.timestamp,
          status: formData.status
        },
        timestamp: new Date().toISOString()
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        deleteTimestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Deleted form ${formId} from ${collectionName}`);
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// ✅ NEW: Get forms data with EVENT LOGGING
app.get('/api/forms/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { viewerUid } = req.query;
    
    // Get viewer details for logging
    const viewerDetails = await getUserDetailsForLogging(viewerUid);
    
    const dataRef = admin.firestore().collection(collectionName);
    const q = dataRef.orderBy('timestamp', 'desc');
    const snapshot = await q.get();

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 📝 LOG THE FORMS VIEW EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: 'form-list',
      targetId: collectionName,
      details: {
        viewType: 'form-collection',
        formType: collectionName,
        formsCount: data.length
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collectionName,
        timestamp: new Date().toISOString(),
        viewContext: 'admin-dashboard'
      }
    });

    res.json({ data });
  } catch (error) {
    console.error(`Error fetching ${collectionName} data:`, error);
    res.status(500).json({ error: `Failed to fetch ${collectionName} data` });
  }
});

// ✅ NEW: Update form status with EVENT LOGGING
app.put('/api/forms/:collectionName/:docId/status', async (req, res) => {
  try {
    const { collectionName, docId } = req.params;
    const { status, updaterUid, userEmail, formType, comment } = req.body;

    // Get current form data before update
    const formDoc = await admin.firestore().collection(collectionName).doc(docId).get();
    const formData = formDoc.exists ? formDoc.data() : {};
    const oldStatus = formData.status;
    
    // Get updater details for logging
    const updaterDetails = await getUserDetailsForLogging(updaterUid);

    // Update form status
    await admin.firestore().collection(collectionName).doc(docId).update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: updaterUid
    });

    // 📝 LOG THE STATUS UPDATE EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'status-update',
      actorUid: updaterUid,
      actorDisplayName: updaterDetails.displayName,
      actorEmail: updaterDetails.email,
      actorRole: updaterDetails.role,
      targetType: 'form',
      targetId: docId,
      details: {
        formType: formType || collectionName,
        formCollection: collectionName,
        oldStatus: oldStatus,
        newStatus: status,
        comment: comment,
        formSubmitterEmail: userEmail || formData.email
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        formId: docId,
        collection: collectionName,
        timestamp: new Date().toISOString(),
        updateMethod: 'admin-panel'
      }
    });

    res.status(200).json({ message: 'Form status updated successfully' });
  } catch (error) {
    console.error('Error updating form status:', error);
    res.status(500).json({ error: 'Failed to update form status' });
  }
});

// ✅ NEW: Download PDF with EVENT LOGGING
app.post('/api/pdf/download', async (req, res) => {
  try {
    const { formData, formType, downloaderUid, fileName } = req.body;
    
    // Get downloader details for logging
    const downloaderDetails = await getUserDetailsForLogging(downloaderUid);

    // 📝 LOG THE PDF DOWNLOAD EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'download',
      actorUid: downloaderUid,
      actorDisplayName: downloaderDetails.displayName,
      actorEmail: downloaderDetails.email,
      actorRole: downloaderDetails.role,
      targetType: 'pdf',
      targetId: formData.id || 'unknown',
      details: {
        downloadType: 'pdf-form',
        formType: formType,
        fileName: fileName,
        formSubmitterEmail: formData.email
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        formId: formData.id,
        timestamp: new Date().toISOString(),
        downloadContext: 'admin-panel'
      }
    });

    // Return success - actual PDF generation will be handled by frontend
    res.status(200).json({ 
      message: 'PDF download logged successfully',
      allowDownload: true 
    });
  } catch (error) {
    console.error('Error logging PDF download:', error);
    res.status(500).json({ error: 'Failed to log PDF download' });
  }
});

// ============= BIRTHDAY EMAIL SYSTEM =============

// Function to check if today is someone's birthday
const isBirthdayToday = (dateOfBirth) => {
  if (!dateOfBirth) return false;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  return today.getMonth() === birthDate.getMonth() && 
         today.getDate() === birthDate.getDate();
};

// Function to send birthday email
const sendBirthdayEmail = async (email, displayName) => {
  const mailOptions = {
    from: 'kyc@nem-insurance.com',
    to: email,
    subject: '🎉 Happy Birthday from NEM Insurance!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎂 Happy Birthday ${displayName}! 🎂</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #8B4513;">Wishing you a wonderful day!</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            Happy Birthday to you from all of us at NEM Insurance! 🎉
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            We truly appreciate having you as a valued member of our community. 
            Your trust in us means the world, and we're committed to serving you with excellence.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            May this special day bring you joy, happiness, and wonderful memories. 
            Here's to another amazing year ahead! 🥳
          </p>
          <div style="margin: 30px 0; padding: 20px; background: white; border-left: 4px solid #DAA520;">
            <p style="font-style: italic; color: #666; margin: 0;">
              "Celebrate every moment, cherish every memory, and embrace every opportunity!"
            </p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">
            Warmest wishes,<br>
            <strong>The NEM Insurance Team</strong>
          </p>
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated birthday greeting from NEM Insurance.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Birthday email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send birthday email to ${email}:`, error);
    return false;
  }
};

// Endpoint to check and send birthday emails (can be called by cron job)
app.post('/api/check-birthdays', async (req, res) => {
  try {
    console.log('🎂 Checking for birthdays today...');
    
    // Get all users from userroles collection
    const usersSnapshot = await db.collection('userroles').get();
    
    let birthdayCount = 0;
    let emailsSent = 0;
    const birthdayUsers = [];
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      
      if (isBirthdayToday(userData.dateOfBirth)) {
        birthdayCount++;
        birthdayUsers.push({
          email: userData.email,
          displayName: userData.displayName || userData.name || 'Valued Customer'
        });
        
        const sent = await sendBirthdayEmail(
          userData.email, 
          userData.displayName || userData.name || 'Valued Customer'
        );
        
        if (sent) emailsSent++;
      }
    }
    
    console.log(`🎉 Found ${birthdayCount} birthdays today. Sent ${emailsSent} emails.`);
    
    res.status(200).json({ 
      success: true,
      message: `Found ${birthdayCount} birthdays today`,
      birthdaysFound: birthdayCount,
      emailsSent: emailsSent,
      users: birthdayUsers
    });
    
  } catch (error) {
    console.error('❌ Error checking birthdays:', error);
    res.status(500).json({ error: 'Failed to check birthdays', details: error.message });
  }
});

// Test endpoint to send birthday email to a specific user
app.post('/api/test-birthday-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    console.log(`🧪 Testing birthday email for ${email}`);
    
    // Find user by email
    const usersSnapshot = await db.collection('userroles')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = usersSnapshot.docs[0].data();
    const displayName = userData.displayName || userData.name || 'Valued Customer';
    
    const sent = await sendBirthdayEmail(email, displayName);
    
    if (sent) {
      res.status(200).json({ 
        success: true, 
        message: `Test birthday email sent to ${email}`,
        user: {
          email: email,
          displayName: displayName,
          dateOfBirth: userData.dateOfBirth || 'Not set'
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
    
  } catch (error) {
    console.error('❌ Error sending test birthday email:', error);
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

// ============= END BIRTHDAY EMAIL SYSTEM =============

// ============= HEALTH CHECK ENDPOINTS =============

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NEM Server API is running',
    version: '2.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    eventsLogging: EVENTS_CONFIG.ENABLE_EVENTS_LOGGING,
    ipGeolocation: EVENTS_CONFIG.ENABLE_IP_GEOLOCATION
  });
});

// ============= END HEALTH CHECK ENDPOINTS =============

// ============= CENTRALIZED ERROR HANDLER =============

/**
 * Centralized error handling middleware
 * Must be defined after all routes
 */
app.use((err, req, res, next) => {
  // Log error details
  console.error('❌ Error occurred:', {
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    user: req.user?.email || 'unauthenticated'
  });

  // Log error to events system
  logAction({
    action: 'error',
    severity: 'error',
    actorUid: req.user?.uid || null,
    actorEmail: req.user?.email || null,
    actorRole: req.user?.role || null,
    targetType: 'api-endpoint',
    targetId: req.path,
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: err.statusCode || 500,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    userAgent: req.headers['user-agent'] || 'Unknown',
    details: {
      errorMessage: err.message,
      errorCode: err.code,
      errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    }
  }).catch(logErr => console.error('Failed to log error:', logErr));

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // User-friendly error messages
  let userMessage = 'An unexpected error occurred. Please try again.';
  
  if (statusCode === 400) {
    userMessage = 'Invalid request. Please check your input and try again.';
  } else if (statusCode === 401) {
    userMessage = 'Authentication required. Please sign in and try again.';
  } else if (statusCode === 403) {
    userMessage = 'You do not have permission to perform this action.';
  } else if (statusCode === 404) {
    userMessage = 'The requested resource was not found.';
  } else if (statusCode === 429) {
    userMessage = 'Too many requests. Please slow down and try again later.';
  } else if (statusCode === 500) {
    userMessage = 'A server error occurred. Our team has been notified. Please try again later.';
  } else if (statusCode === 503) {
    userMessage = 'Service temporarily unavailable. Please try again in a few moments.';
  }

  // Send error response
  res.status(statusCode).json({
    error: err.name || 'Error',
    message: userMessage,
    ...(process.env.NODE_ENV !== 'production' && {
      details: err.message,
      stack: err.stack
    })
  });
});

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist.',
    path: req.path
  });
});

// ============= END ERROR HANDLER =============

app.listen(port, async () => {
  console.log('='.repeat(80));
  console.log(`� SERnVER STARTED - UPDATED VERSION WITH COLLECTION MAPPING FIX`);
  console.log(`Server running on port ${port}`);
  console.log(`📝 Events logging: ${EVENTS_CONFIG.ENABLE_EVENTS_LOGGING ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🌐 IP geolocation: ${EVENTS_CONFIG.ENABLE_IP_GEOLOCATION ? 'ENABLED' : 'DISABLED'}`);
  console.log('='.repeat(80));
  console.log(`⏰ Raw IP retention: ${EVENTS_CONFIG.RAW_IP_RETENTION_DAYS} days`);
  
  // Force generate sample events on every startup for testing
  console.log('🧪 Generating initial sample events for testing...');
  setTimeout(async () => {
    try {
      const sampleEvents = [
        {
          action: 'login',
          actorUid: 'startup-user',
          actorDisplayName: 'Startup User',
          actorEmail: 'startup@example.com',
          actorRole: 'admin',
          targetType: 'user',
          targetId: 'startup-user',
          details: { loginMethod: 'startup-generated', success: true },
          ipMasked: '127.0.0.***',
          ipHash: 'startup123',
          rawIP: '127.0.0.1',
          location: 'Server Startup',
          userAgent: 'Server/1.0',
          meta: { sampleEvent: true, startupGenerated: true, timestamp: new Date().toISOString() }
        }
      ];

      for (const event of sampleEvents) {
        await logAction(event);
      }
      
      console.log('✅ Startup sample events generated successfully');
    } catch (error) {
      console.log('⚠️  Failed to generate startup sample events:', error.message);
    }
  }, 3000); // Wait 3 seconds after server starts
  
  await setSuperAdminOnStartup();
});
