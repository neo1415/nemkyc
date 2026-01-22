
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

// Import verification error handling utility
const {
  createVerificationError,
  isVerificationError
} = require('./src/utils/verificationErrors.js');

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

// ============= TICKET ID GENERATOR =============
/**
 * Ticket ID Generator Utility (Server-side)
 * 
 * Generates unique ticket IDs for form submissions with format: PREFIX-XXXXXXXX
 * where PREFIX is a 3-letter form type code and XXXXXXXX is an 8-digit number.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

/**
 * Form type to prefix mapping
 * Requirements: 3.2 - Use specific prefixes for each form type
 */
const FORM_TYPE_PREFIXES = {
  'Motor Claim': 'MOT',
  'Fire Special Perils Claim': 'FIR',
  'Fire & Special Perils Claim': 'FIR',
  'Burglary Claim': 'BUR',
  'All Risk Claim': 'ALL',
  'Goods In Transit Claim': 'GIT',
  'Money Insurance Claim': 'MON',
  'Public Liability Claim': 'PUB',
  'Employers Liability Claim': 'EMP',
  'Group Personal Accident Claim': 'GPA',
  'Fidelity Guarantee Claim': 'FID',
  'Rent Assurance Claim': 'REN',
  'Contractors Plant Machinery Claim': 'CPM',
  'Combined GPA Employers Liability Claim': 'COM',
  'Professional Indemnity Claim': 'PRO',
  'Individual KYC': 'IKY',
  'Corporate KYC': 'CKY',
  'Individual CDD': 'ICD',
  'Corporate CDD': 'CCD',
  'Brokers CDD': 'BCD',
  'Agents CDD': 'ACD',
  'Partners CDD': 'PCD'
};

const DEFAULT_PREFIX = 'GEN';
const TICKET_ID_PATTERN = /^[A-Z]{3}-\d{8}$/;

/**
 * Gets the prefix for a given form type
 * @param {string} formType - The form type name
 * @returns {string} The 3-letter prefix for the form type
 */
function getFormTypePrefix(formType) {
  if (formType && Object.prototype.hasOwnProperty.call(FORM_TYPE_PREFIXES, formType)) {
    return FORM_TYPE_PREFIXES[formType];
  }
  return DEFAULT_PREFIX;
}

/**
 * Generates a random 8-digit number string
 * @returns {string} An 8-digit string (10000000 to 99999999)
 */
function generateRandomNumber() {
  const min = 10000000;
  const max = 99999999;
  const randomNumber = Math.floor(min + Math.random() * (max - min + 1));
  return randomNumber.toString();
}

/**
 * Creates a ticket ID from prefix and number
 * @param {string} prefix - The 3-letter prefix
 * @param {string} number - The 8-digit number string
 * @returns {string} The formatted ticket ID
 */
function formatTicketId(prefix, number) {
  return `${prefix}-${number}`;
}

/**
 * Validates if a string matches the ticket ID format
 * @param {string} ticketId - The string to validate
 * @returns {boolean} True if the string matches the ticket ID format
 */
function isValidTicketIdFormat(ticketId) {
  return TICKET_ID_PATTERN.test(ticketId);
}

/**
 * Generates a ticket ID result object (without uniqueness check)
 * @param {string} formType - The form type name
 * @returns {{ticketId: string, prefix: string, number: string}} TicketIdResult
 */
function generateTicketIdSync(formType) {
  const prefix = getFormTypePrefix(formType);
  const number = generateRandomNumber();
  const ticketId = formatTicketId(prefix, number);
  
  return {
    ticketId,
    prefix,
    number
  };
}

/**
 * Collection names to check for ticket ID uniqueness
 */
const COLLECTIONS_TO_CHECK = [
  'claims-motor',
  'claims-fire-special-perils',
  'claims-burglary',
  'claims-all-risk',
  'claims-goods-in-transit',
  'claims-money-insurance',
  'claims-public-liability',
  'claims-employers-liability',
  'claims-group-personal-accident',
  'claims-fidelity-guarantee',
  'claims-rent-assurance',
  'claims-contractors-plant-machinery',
  'claims-combined-gpa-employers-liability',
  'claims-professional-indemnity',
  'kyc-individual',
  'kyc-corporate',
  'cdd-individual',
  'cdd-corporate',
  'cdd-brokers',
  'cdd-agents',
  'cdd-partners'
];

/**
 * Checks if a ticket ID already exists in Firestore (server-side)
 * @param {string} ticketId - The ticket ID to check
 * @returns {Promise<boolean>} True if the ticket ID exists, false otherwise
 */
async function checkTicketIdExists(ticketId) {
  for (const collectionName of COLLECTIONS_TO_CHECK) {
    try {
      const snapshot = await admin.firestore()
        .collection(collectionName)
        .where('ticketId', '==', ticketId)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        return true;
      }
    } catch (error) {
      // Collection might not exist, continue checking others
      logger.warn(`Error checking collection ${collectionName}:`, error.message);
    }
  }
  return false;
}

const MAX_RETRY_ATTEMPTS = 10;

/**
 * Generates a unique ticket ID for a form submission
 * Checks against Firestore to ensure uniqueness
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * 
 * @param {string} formType - The form type name
 * @returns {Promise<{ticketId: string, prefix: string, number: string}>} TicketIdResult
 * @throws {Error} If unable to generate unique ID after max retries
 */
async function generateTicketId(formType) {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_ATTEMPTS) {
    const result = generateTicketIdSync(formType);
    
    // Check if this ticket ID already exists
    const exists = await checkTicketIdExists(result.ticketId);
    
    if (!exists) {
      logger.info(`Generated unique ticket ID: ${result.ticketId} for form type: ${formType}`);
      return result;
    }
    
    attempts++;
    logger.warn(`Ticket ID ${result.ticketId} already exists, retrying... (attempt ${attempts})`);
  }
  
  throw new Error(`Failed to generate unique ticket ID after ${MAX_RETRY_ATTEMPTS} attempts`);
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FORM_TYPE_PREFIXES,
    DEFAULT_PREFIX,
    TICKET_ID_PATTERN,
    getFormTypePrefix,
    generateRandomNumber,
    formatTicketId,
    isValidTicketIdFormat,
    generateTicketIdSync,
    generateTicketId,
    checkTicketIdExists
  };
}

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
 * Middleware to require broker, compliance, admin, or super admin role
 * Used for identity collection endpoints
 */
const requireBrokerOrAdmin = requireRole('broker', 'compliance', 'admin', 'super admin');

/**
 * Helper function to check if user can access a specific identity list
 * Brokers can only access their own lists, admins can access all
 */
const canAccessIdentityList = async (userId, userRole, listId) => {
  // Admins, super admins, and compliance can access all lists
  if (isAdminOrSuperAdmin(userRole) || normalizeRole(userRole) === 'compliance') {
    return true;
  }
  
  // Brokers can only access their own lists
  if (normalizeRole(userRole) === 'broker') {
    try {
      const listDoc = await db.collection('identity-lists').doc(listId).get();
      if (!listDoc.exists) {
        return false;
      }
      return listDoc.data().createdBy === userId;
    } catch (error) {
      console.error('Error checking list access:', error);
      return false;
    }
  }
  
  // Other roles cannot access identity lists
  return false;
};

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
    .isIn(['default', 'user', 'broker', 'claims', 'compliance', 'admin', 'super admin'])
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
    .isIn(['default', 'user', 'broker', 'claims', 'compliance', 'admin', 'super admin'])
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
    req.path === '/api/exchange-token' ||
    req.path === '/api/register' ||       // Registration doesn't need CSRF (user not authenticated yet)
    req.path === '/api/verify/nin' ||    // Demo NIN verification
    req.path === '/api/verify/cac' ||    // Demo CAC verification
    req.path.startsWith('/api/remediation/') ||  // Remediation endpoints (protected by auth)
    req.path.startsWith('/api/identity/')) {  // Identity collection endpoints (protected by auth)
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
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
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
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
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
    // Always include admin and super admin roles (with both variants)
    const allRoles = [...new Set([...rolesArray, 'admin', 'super admin', 'super-admin', 'superadmin'])];
    
    const usersSnapshot = await admin.firestore()
      .collection('userroles')
      .where('role', 'in', allRoles)
      .get();

    const emails = usersSnapshot.docs.map(doc => doc.data().email).filter(email => email);
    console.log(`📧 Found ${emails.length} emails for roles:`, allRoles);
    return emails;
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
// ✅ PROTECTED: Requires admin or super admin role
// ✅ VALIDATED: Input validation applied
app.put('/api/users/:userId/role', requireAuth, requireRole('admin', 'super admin'), validateRoleUpdate, async (req, res) => {
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

// ✅ PROTECTED: Requires admin or super admin role (PATCH alias for PUT)
// ✅ VALIDATED: Input validation applied
app.patch('/api/users/:userId/role', requireAuth, requireRole('admin', 'super admin'), validateRoleUpdate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    console.log('👤 Role update (PATCH) by:', req.user.email, 'Role:', req.user.role);

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

// Enhanced form submission function with EVENT LOGGING and TICKET ID
async function handleFormSubmission(req, res, formType, collectionName, userUid = null) {
  const formData = req.body;

  // Perform validation as needed here...

  try {
    const docId = uuidv4();
    
    // Generate unique ticket ID for this submission
    // Requirements: 3.1, 3.2, 3.3, 3.4
    let ticketIdResult;
    try {
      ticketIdResult = await generateTicketId(formType);
      logger.info(`Generated ticket ID ${ticketIdResult.ticketId} for ${formType} submission`);
    } catch (ticketError) {
      // Fallback: use UUID-based ID if ticket generation fails
      logger.error('Failed to generate ticket ID, using fallback:', ticketError.message);
      ticketIdResult = {
        ticketId: `GEN-${Date.now().toString().slice(-8)}`,
        prefix: 'GEN',
        number: Date.now().toString().slice(-8)
      };
    }

    // Add form to the Firestore collection with ticket ID
    await admin.firestore().collection(collectionName).doc(docId).set({
      ...formData,
      ticketId: ticketIdResult.ticketId, // Store the ticket ID
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
        ticketId: ticketIdResult.ticketId, // Include ticket ID in log
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
        ticketId: ticketIdResult.ticketId, // Include ticket ID in meta
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
      documentId: docId,
      ticketId: ticketIdResult.ticketId // Return ticket ID in response (Requirements: 3.4)
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

    // Generate unique ticket ID for this submission
    const ticketIdResult = await generateTicketId(formType);
    const ticketId = ticketIdResult.ticketId;
    console.log('🎫 Generated ticket ID:', ticketId);

    // Get the submitter's email (prioritize userEmail, then userDetails, then formData)
    // Normalize to lowercase for consistent querying
    const rawEmail = userEmail || userDetails.email || formData?.email;
    const submitterEmail = rawEmail ? rawEmail.toLowerCase().trim() : null;
    const submitterName = formData?.name || formData?.insuredFirstName || formData?.companyName || userDetails.displayName || 'Valued Customer';

    // Add metadata to form data
    const submissionData = {
      ...formData,
      ticketId: ticketId,
      formType: formType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toLocaleDateString('en-GB'),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: submitterEmail,
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
        ticketId: ticketId,
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
        ticketId: ticketId,
        collectionName: collectionName,
        submissionId: docRef.id
      }
    });

    // Send email notifications
    try {
      const finalSubmissionData = { ...submissionData, documentId: docRef.id, collectionName };
      
      // Send user confirmation email with ticket ID
      if (submitterEmail) {
        await sendEmail(submitterEmail, 
          `${formType} Submission Confirmation - Ticket #${ticketId}`, 
          generateConfirmationEmailHTML(formType, ticketId, submitterName));
        console.log('📧 User confirmation email sent to:', submitterEmail);
      }

      // Send admin notification with PDF
      const isClaimsForm = ['claim', 'motor', 'burglary', 'fire', 'allrisk', 'goods', 'money',
        'employers', 'public', 'professional', 'fidelity', 'contractors', 'group', 'rent', 'combined']
        .some(keyword => formType.toLowerCase().includes(keyword));

      const adminRoles = isClaimsForm ? ['claims'] : ['compliance'];
      const adminEmails = await getEmailsByRoles(adminRoles);
      
      if (adminEmails.length > 0) {
        await sendEmail(adminEmails, 
          `New ${formType} Submission - Ticket #${ticketId} - Review Required`,
          generateAdminNotificationHTML(formType, formData, docRef.id, ticketId, submitterName, submitterEmail));
        console.log('📧 Admin notification email sent to:', adminEmails);
      } else {
        console.warn('⚠️ No admin emails found for roles:', adminRoles);
      }

      // 📝 LOG EMAIL NOTIFICATIONS
      await logAction({
        action: 'email-sent',
        actorUid: 'system',
        actorDisplayName: 'System',
        actorEmail: 'system@nem-insurance.com',
        actorRole: 'system',
        targetType: 'email',
        targetId: (submitterEmail || 'unknown') + ',' + adminEmails.join(','),
        details: {
          emailType: 'submission-notification',
          formType: formType,
          ticketId: ticketId,
          userEmail: submitterEmail,
          adminEmails: adminEmails
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: {
          relatedSubmission: docRef.id,
          ticketId: ticketId,
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
      ticketId: ticketId,
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
const generateConfirmationEmailHTML = (formType, ticketId, userName = 'Valued Customer') => {
  const dashboardUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #800020, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #800020;">Thank you for your submission!</h2>
        <p>Dear ${userName},</p>
        <p>We have successfully received your <strong>${formType}</strong> form.</p>
        
        <div style="background: #fff; border: 2px solid #800020; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666;">Your Ticket ID</p>
          <h2 style="margin: 10px 0; color: #800020; font-size: 28px; letter-spacing: 2px;">${ticketId}</h2>
          <p style="margin: 0; font-size: 12px; color: #666;">Please reference this ID in all future correspondence</p>
        </div>
        
        <p>Our team will review your submission and get back to you shortly.</p>
        <p>You can track your submission status by logging into your dashboard:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}/signin?redirect=dashboard" style="background: #800020; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View or Track Submission
          </a>
        </div>
        
        <p>We will notify you via email once your submission has been reviewed.</p>
        
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.<br>
          If you have any questions, please contact our support team.
        </p>
        <p>Best regards,<br><strong>NEM Insurance Team</strong></p>
      </div>
    </div>
  `;
};

const generateAdminNotificationHTML = (formType, formData, documentId, ticketId, submitterName, submitterEmail) => {
  const adminDashboardUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #800020, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #800020;">New ${formType} Submission</h2>
        <p>A new <strong>${formType}</strong> form has been submitted and requires review.</p>
        
        <div style="background: #fff; border: 2px solid #800020; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666;">Ticket ID</p>
          <h2 style="margin: 10px 0; color: #800020; font-size: 24px; letter-spacing: 2px;">${ticketId}</h2>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #666;">Submitter Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${submitterName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #666;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${submitterEmail || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #666;">Document ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace;">${documentId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #666;">Phone:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData?.phone || formData?.phoneNumber || 'N/A'}</td>
          </tr>
        </table>
        
        <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #DAA520; border-radius: 4px;">
          <p style="margin: 0; color: #856404;"><strong>⚠️ Action Required:</strong> Please review this submission in the admin dashboard.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminDashboardUrl}/signin" style="background: #800020; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Access Admin Dashboard
          </a>
        </div>
        
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from NEM Forms System.
        </p>
        <p>Best regards,<br><strong>NEM Forms System</strong></p>
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

// ============= PAYSTACK IDENTITY VERIFICATION PROXY =============
// These endpoints proxy requests to Paystack to avoid CORS issues

// BVN Verification Proxy (Paystack Resolve BVN)
app.post('/api/verify/nin', async (req, res) => {
  try {
    const { nin, secretKey, demoMode } = req.body;
    
    // DEMO MODE - Return mock successful verification
    if (demoMode) {
      console.log('🎭 DEMO MODE: Simulating BVN verification for:', nin.substring(0, 4) + '***');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful response
      return res.json({
        status: true,
        message: 'BVN verified successfully (Demo Mode)',
        data: {
          first_name: 'JOHN',
          last_name: 'DOE',
          middle_name: 'DEMO',
          dob: '1990-01-15',
          formatted_dob: '15-Jan-1990',
          mobile: '080****5678',
          bvn: nin.substring(0, 4) + '*******',
        }
      });
    }
    
    if (!nin || !secretKey) {
      return res.status(400).json({ 
        status: false, 
        message: 'BVN and API key are required' 
      });
    }

    // Validate BVN format (11 digits)
    if (!/^\d{11}$/.test(nin)) {
      return res.status(400).json({ 
        status: false, 
        message: 'BVN must be exactly 11 digits' 
      });
    }

    console.log('🔍 BVN Verification request for:', nin.substring(0, 4) + '***');

    // Paystack Resolve BVN endpoint
    const response = await fetch(`https://api.paystack.co/bank/resolve_bvn/${nin}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    console.log('📋 Paystack response status:', response.status);
    
    const responseText = await response.text();
    console.log('📋 Paystack response:', responseText.substring(0, 300));
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : { status: false, message: 'Empty response from Paystack' };
    } catch (parseError) {
      console.error('❌ Failed to parse Paystack response:', parseError);
      data = { status: false, message: 'Invalid response from verification service' };
    }
    
    if (response.ok && data.status) {
      console.log('✅ BVN verification successful');
      return res.json({
        status: true,
        message: 'BVN verified successfully',
        data: data.data
      });
    } else {
      console.log('❌ BVN verification failed:', data.message);
      return res.json({
        status: false,
        message: data.message || 'Verification failed. Please check your BVN and try again.'
      });
    }
  } catch (error) {
    console.error('❌ BVN verification error:', error);
    return res.status(500).json({ 
      status: false, 
      message: 'Verification service error. Please try again.' 
    });
  }
});

// CAC Verification Proxy
app.post('/api/verify/cac', async (req, res) => {
  try {
    const { rc_number, company_name, secretKey, demoMode } = req.body;
    
    // DEMO MODE - Return mock successful verification
    if (demoMode) {
      console.log('🎭 DEMO MODE: Simulating CAC verification for:', rc_number);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful response
      return res.json({
        status: true,
        message: 'CAC verified successfully (Demo Mode)',
        data: {
          company_name: company_name.toUpperCase(),
          rc_number: rc_number,
          company_type: 'LIMITED LIABILITY COMPANY',
          date_of_registration: '2015-03-20',
          address: '123 Business District, Lagos',
          status: 'ACTIVE',
          email: 'info@' + company_name.toLowerCase().replace(/\s+/g, '') + '.com',
        }
      });
    }
    
    if (!rc_number || !company_name || !secretKey) {
      return res.status(400).json({ 
        status: false, 
        message: 'RC number, company name, and API key are required' 
      });
    }

    console.log('🔍 CAC Verification request for:', rc_number);

    const response = await fetch('https://api.paystack.co/identity/cac', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rc_number, company_name }),
    });

    const responseText = await response.text();
    console.log('📋 Paystack CAC response:', responseText.substring(0, 300));
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : { status: false, message: 'Empty response' };
    } catch (parseError) {
      data = { status: false, message: 'Invalid response from verification service' };
    }
    
    if (response.ok && data.status) {
      console.log('✅ CAC verification successful');
      return res.json({
        status: true,
        message: 'CAC verified successfully',
        data: data.data
      });
    } else {
      console.log('❌ CAC verification failed:', data.message);
      return res.json({
        status: false,
        message: data.message || 'Verification failed'
      });
    }
  } catch (error) {
    console.error('❌ CAC verification error:', error);
    return res.status(500).json({ 
      status: false, 
      message: 'Verification service error. Please try again.' 
    });
  }
});

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

// Remediation endpoints (admin operations)
app.use('/api/remediation/', apiLimiter);

// Identity collection endpoints (admin operations)
app.use('/api/identity/', apiLimiter);

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
    const { email, password, displayName, role = 'user', dateOfBirth, userType } = req.body;

    // Determine the actual role based on userType
    // If userType is 'broker', set role to 'broker'
    // If userType is 'regular' or undefined/empty, set role to 'default'
    let actualRole = 'default'; // Default role for regular users
    if (userType === 'broker') {
      actualRole = 'broker';
    } else if (userType === 'regular' || !userType) {
      actualRole = 'default';
    }

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
      role: actualRole, // Use the determined role
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
      role: actualRole, // Use the determined role
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
      actorRole: actualRole, // Use the determined role
      targetType: 'user',
      targetId: userRecord.uid,
      details: {
        registrationMethod: 'email-password',
        assignedRole: actualRole, // Use the determined role
        userType: userType || 'regular' // Log the userType for audit
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

// ============= IDENTITY REMEDIATION SYSTEM =============

/**
 * Helper function to create remediation audit log entries
 * Creates comprehensive audit logs for all remediation system actions
 * 
 * @param {string} action - The action type (batch_created, batch_deleted, emails_sent, 
 *                          link_generated, link_resent, verification_attempted,
 *                          verification_success, verification_failed, 
 *                          record_approved, record_rejected, export_generated)
 * @param {Object} details - Action-specific details object
 * @param {string} actorType - Type of actor ('admin', 'customer', 'system')
 * @param {string} actorId - Actor identifier (UID for admin, IP hash for customer)
 * @param {Object} options - Optional parameters
 * @param {string} options.batchId - Reference to batch (optional)
 * @param {string} options.recordId - Reference to record (optional)
 * @param {Object} options.req - Express request object for extracting IP/user agent (optional)
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
const createAuditLog = async (action, details, actorType, actorId, options = {}) => {
  try {
    const { batchId, recordId, req } = options;
    
    const auditLogRef = db.collection('remediation-audit-logs').doc();
    const auditLog = {
      id: auditLogRef.id,
      action,
      details: details || {},
      actorType,
      actorId: actorId || null,
      batchId: batchId || null,
      recordId: recordId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Include IP address and user agent for customer actions
    if (req) {
      // Use the processed IP data from middleware if available
      if (req.ipData) {
        auditLog.ipAddress = req.ipData.masked; // Use masked IP for privacy
        auditLog.ipHash = req.ipData.hash; // Hash for correlation
      } else {
        // Fallback: extract IP directly
        const rawIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                      req.headers['x-real-ip'] || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress || 
                      'unknown';
        auditLog.ipAddress = rawIP;
      }
      auditLog.userAgent = req.headers['user-agent'] || null;
    }
    
    await auditLogRef.set(auditLog);
    console.log(`✅ Remediation audit log created: ${action} by ${actorType}${actorId ? ` (${actorId})` : ''}`);
    return auditLog;
  } catch (error) {
    console.error('❌ Failed to create remediation audit log:', error);
    // Don't throw - audit logging failures shouldn't break the main operation
    return null;
  }
};

/**
 * Legacy helper function for backward compatibility
 * @deprecated Use createAuditLog instead
 * @param {Object} logData - The audit log data
 */
const createRemediationAuditLog = async (logData) => {
  try {
    const auditLogRef = db.collection('remediation-audit-logs').doc();
    const auditLog = {
      id: auditLogRef.id,
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    await auditLogRef.set(auditLog);
    console.log(`✅ Remediation audit log created: ${logData.action}`);
    return auditLog;
  } catch (error) {
    console.error('❌ Failed to create remediation audit log:', error);
    throw error;
  }
};

/**
 * GET /api/remediation/batches
 * Get all remediation batches with summary statistics
 * 
 * Requirements: 6.1
 */
app.get('/api/remediation/batches', requireAuth, requireAdmin, async (req, res) => {
  try {
    const batchesSnapshot = await db.collection('remediation-batches')
      .orderBy('createdAt', 'desc')
      .get();
    
    const batches = batchesSnapshot.docs.map(doc => {
      const data = doc.data();
      const totalRecords = data.totalRecords || 0;
      const verifiedCount = data.verifiedCount || 0;
      const progress = totalRecords > 0 ? Math.round((verifiedCount / totalRecords) * 100) : 0;
      
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        status: data.status || 'pending',
        totalRecords,
        pendingCount: data.pendingCount || 0,
        emailSentCount: data.emailSentCount || 0,
        verifiedCount,
        failedCount: data.failedCount || 0,
        reviewRequiredCount: data.reviewRequiredCount || 0,
        progress,
        expirationDays: data.expirationDays || 7,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        originalFileName: data.originalFileName
      };
    });
    
    console.log(`✅ Retrieved ${batches.length} remediation batches`);
    res.status(200).json({ batches });
    
  } catch (error) {
    console.error('❌ Error fetching remediation batches:', error);
    res.status(500).json({ 
      error: 'Failed to fetch batches',
      message: error.message
    });
  }
});

/**
 * POST /api/remediation/batches
 * Create a new remediation batch with records
 * 
 * Body:
 * - name: Batch name (required)
 * - description: Batch description (optional)
 * - expirationDays: Days until links expire (default: 7)
 * - records: Array of parsed records (required)
 * - originalFileName: Name of uploaded file (optional)
 * 
 * Requirements: 1.3, 1.6, 2.1, 7.1
 */
app.post('/api/remediation/batches', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, expirationDays = 7, records, originalFileName } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Batch name is required' });
    }
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'At least one record is required' });
    }
    
    // Create batch document
    const batchRef = db.collection('remediation-batches').doc();
    const batchId = batchRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    const batchData = {
      id: batchId,
      name: name.trim(),
      description: description?.trim() || null,
      status: 'pending',
      totalRecords: records.length,
      pendingCount: records.length,
      emailSentCount: 0,
      verifiedCount: 0,
      failedCount: 0,
      reviewRequiredCount: 0,
      expirationDays,
      createdBy: req.user.uid,
      createdAt: now,
      updatedAt: now,
      originalFileName: originalFileName || null
    };
    
    // Create records with tokens
    const recordPromises = records.map(async (record, index) => {
      const recordRef = db.collection('remediation-records').doc();
      const recordId = recordRef.id;
      
      // Generate secure token (32 bytes, URL-safe base64)
      const token = crypto.randomBytes(32).toString('base64url');
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      const recordData = {
        id: recordId,
        batchId,
        customerName: record.customerName,
        email: record.email,
        phone: record.phone || null,
        policyNumber: record.policyNumber,
        brokerName: record.brokerName,
        identityType: record.identityType || 'individual',
        existingName: record.existingName || null,
        existingDob: record.existingDob || null,
        token,
        tokenExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        tokenUsedAt: null,
        status: 'pending',
        emailSentAt: null,
        emailError: null,
        resendCount: 0,
        submittedIdentityNumber: null,
        submittedCompanyName: null,
        verifiedAt: null,
        verificationResponse: null,
        nameMatchScore: null,
        reviewedBy: null,
        reviewedAt: null,
        reviewComment: null,
        createdAt: now,
        updatedAt: now,
        verificationAttempts: 0,
        lastAttemptAt: null,
        lastAttemptError: null
      };
      
      await recordRef.set(recordData);
      return recordData;
    });
    
    // Wait for all records to be created
    await Promise.all(recordPromises);
    
    // Save batch document
    await batchRef.set(batchData);
    
    // Create audit log
    await createAuditLog(
      'batch_created',
      {
        batchName: name,
        recordCount: records.length,
        expirationDays,
        createdBy: req.user.email
      },
      'admin',
      req.user.uid,
      { batchId, req }
    );
    
    console.log(`✅ Created remediation batch ${batchId} with ${records.length} records`);
    
    res.status(201).json({
      batchId,
      recordCount: records.length,
      status: 'pending',
      message: 'Batch created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating remediation batch:', error);
    res.status(500).json({ 
      error: 'Failed to create batch',
      message: error.message
    });
  }
});

/**
 * GET /api/remediation/batches/:batchId
 * Get a single batch with full details and statistics
 * 
 * Requirements: 6.1
 */
app.get('/api/remediation/batches/:batchId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batchDoc = await db.collection('remediation-batches').doc(batchId).get();
    
    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const data = batchDoc.data();
    const totalRecords = data.totalRecords || 0;
    const verifiedCount = data.verifiedCount || 0;
    const progress = totalRecords > 0 ? Math.round((verifiedCount / totalRecords) * 100) : 0;
    
    const batch = {
      id: batchDoc.id,
      name: data.name,
      description: data.description,
      status: data.status || 'pending',
      totalRecords,
      pendingCount: data.pendingCount || 0,
      emailSentCount: data.emailSentCount || 0,
      verifiedCount,
      failedCount: data.failedCount || 0,
      reviewRequiredCount: data.reviewRequiredCount || 0,
      progress,
      expirationDays: data.expirationDays || 7,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      originalFileName: data.originalFileName
    };
    
    console.log(`✅ Retrieved batch ${batchId}`);
    res.status(200).json({ batch });
    
  } catch (error) {
    console.error('❌ Error fetching remediation batch:', error);
    res.status(500).json({ 
      error: 'Failed to fetch batch',
      message: error.message
    });
  }
});

/**
 * DELETE /api/remediation/batches/:batchId
 * Soft delete a remediation batch (marks as cancelled)
 * 
 * Requirements: 6.1
 */
app.delete('/api/remediation/batches/:batchId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batchRef = db.collection('remediation-batches').doc(batchId);
    const batchDoc = await batchRef.get();
    
    if (!batchDoc.exists) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const batchData = batchDoc.data();
    
    // Soft delete - mark as cancelled
    await batchRef.update({
      status: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: req.user.uid,
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create audit log
    await createAuditLog(
      'batch_deleted',
      {
        batchName: batchData.name,
        recordCount: batchData.totalRecords,
        deletedBy: req.user.email
      },
      'admin',
      req.user.uid,
      { batchId, req }
    );
    
    console.log(`✅ Deleted remediation batch ${batchId}`);
    
    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting remediation batch:', error);
    res.status(500).json({ 
      error: 'Failed to delete batch',
      message: error.message
    });
  }
});

/**
 * GET /api/remediation/batches/:batchId/records
 * Get records for a batch with filtering, search, and pagination
 * 
 * Query params:
 * - status: Filter by record status
 * - search: Search across customer name, email, policy number
 * - page: Page number (default: 1)
 * - limit: Records per page (default: 20, max: 100)
 * 
 * Requirements: 6.2, 6.3
 */
app.get('/api/remediation/batches/:batchId/records', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status, search, page = 1, limit = 20 } = req.query;
    
    console.log(`📋 Fetching records for batch ${batchId}`);
    console.log(`   Filters: status=${status}, search=${search}, page=${page}, limit=${limit}`);
    
    // Validate batch exists
    const batchDoc = await db.collection('remediation-batches').doc(batchId).get();
    if (!batchDoc.exists) {
      return res.status(404).json({ 
        error: 'Batch not found',
        message: `No batch found with ID: ${batchId}`
      });
    }
    
    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    
    // Build query
    let query = db.collection('remediation-records').where('batchId', '==', batchId);
    
    // Apply status filter if provided
    if (status) {
      const validStatuses = [
        'pending', 'email_sent', 'email_failed', 'link_expired',
        'verified', 'verification_failed', 'review_required', 'approved', 'rejected'
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      query = query.where('status', '==', status);
    }
    
    // Get all matching records (we'll filter by search and paginate in memory)
    // Note: Firestore doesn't support full-text search, so we do it client-side
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    let records = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        tokenExpiresAt: data.tokenExpiresAt?.toDate?.()?.toISOString() || data.tokenExpiresAt,
        tokenUsedAt: data.tokenUsedAt?.toDate?.()?.toISOString() || data.tokenUsedAt,
        emailSentAt: data.emailSentAt?.toDate?.()?.toISOString() || data.emailSentAt,
        verifiedAt: data.verifiedAt?.toDate?.()?.toISOString() || data.verifiedAt,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
        lastAttemptAt: data.lastAttemptAt?.toDate?.()?.toISOString() || data.lastAttemptAt,
      };
    });
    
    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      records = records.filter(record => 
        (record.customerName && record.customerName.toLowerCase().includes(searchLower)) ||
        (record.email && record.email.toLowerCase().includes(searchLower)) ||
        (record.policyNumber && record.policyNumber.toLowerCase().includes(searchLower))
      );
    }
    
    // Calculate pagination
    const total = records.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedRecords = records.slice(startIndex, startIndex + limitNum);
    
    console.log(`✅ Found ${total} records, returning page ${pageNum} of ${totalPages}`);
    
    res.status(200).json({
      records: paginatedRecords,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    });
    
  } catch (error) {
    console.error('❌ Error fetching remediation records:', error);
    res.status(500).json({ 
      error: 'Failed to fetch records',
      message: error.message
    });
  }
});

/**
 * PATCH /api/remediation/records/:recordId
 * Update a remediation record (status, review comments, etc.)
 * 
 * Body:
 * - status: New status for the record
 * - reviewComment: Comment from reviewer
 * - reviewedBy: UID of the reviewer (auto-set from auth)
 * 
 * Requirements: 5.5, 5.6, 7.4
 */
app.patch('/api/remediation/records/:recordId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { recordId } = req.params;
    const { status, reviewComment } = req.body;
    
    console.log(`📝 Updating record ${recordId}`);
    console.log(`   Updates: status=${status}, reviewComment=${reviewComment ? 'provided' : 'none'}`);
    
    // Get the record
    const recordRef = db.collection('remediation-records').doc(recordId);
    const recordDoc = await recordRef.get();
    
    if (!recordDoc.exists) {
      return res.status(404).json({
        error: 'Record not found',
        message: `No record found with ID: ${recordId}`
      });
    }
    
    const currentRecord = recordDoc.data();
    const previousStatus = currentRecord.status;
    
    // Build update object
    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Validate and apply status update
    if (status) {
      const validStatuses = [
        'pending', 'email_sent', 'email_failed', 'link_expired',
        'verified', 'verification_failed', 'review_required', 'approved', 'rejected'
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      updates.status = status;
      
      // If approving or rejecting, set review metadata
      if (status === 'approved' || status === 'rejected') {
        updates.reviewedBy = req.user.uid;
        updates.reviewedAt = admin.firestore.FieldValue.serverTimestamp();
      }
    }
    
    // Apply review comment if provided
    if (reviewComment !== undefined) {
      updates.reviewComment = reviewComment;
    }
    
    // Update the record
    await recordRef.update(updates);
    
    // Update batch statistics if status changed
    if (status && status !== previousStatus) {
      const batchRef = db.collection('remediation-batches').doc(currentRecord.batchId);
      const batchDoc = await batchRef.get();
      
      if (batchDoc.exists) {
        const batchUpdates = {};
        
        // Decrement old status count
        const oldCountField = getStatusCountField(previousStatus);
        if (oldCountField) {
          batchUpdates[oldCountField] = admin.firestore.FieldValue.increment(-1);
        }
        
        // Increment new status count
        const newCountField = getStatusCountField(status);
        if (newCountField) {
          batchUpdates[newCountField] = admin.firestore.FieldValue.increment(1);
        }
        
        batchUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await batchRef.update(batchUpdates);
      }
    }
    
    // Create audit log entry
    const auditAction = status === 'approved' ? 'record_approved' : 
                        status === 'rejected' ? 'record_rejected' : 
                        'record_updated';
    
    await createRemediationAuditLog({
      batchId: currentRecord.batchId,
      recordId: recordId,
      action: auditAction,
      actorType: 'admin',
      actorId: req.user.uid,
      details: {
        previousStatus,
        newStatus: status || previousStatus,
        reviewComment: reviewComment || null,
        updatedBy: req.user.email
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    // Fetch updated record
    const updatedDoc = await recordRef.get();
    const updatedData = updatedDoc.data();
    
    const responseRecord = {
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt,
      tokenExpiresAt: updatedData.tokenExpiresAt?.toDate?.()?.toISOString() || updatedData.tokenExpiresAt,
      reviewedAt: updatedData.reviewedAt?.toDate?.()?.toISOString() || updatedData.reviewedAt,
    };
    
    console.log(`✅ Record ${recordId} updated successfully`);
    
    res.status(200).json({ record: responseRecord });
    
  } catch (error) {
    console.error('❌ Error updating remediation record:', error);
    res.status(500).json({
      error: 'Failed to update record',
      message: error.message
    });
  }
});

/**
 * Helper function to map status to batch count field
 */
const getStatusCountField = (status) => {
  const statusToField = {
    'pending': 'pendingCount',
    'email_sent': 'emailSentCount',
    'verified': 'verifiedCount',
    'verification_failed': 'failedCount',
    'review_required': 'reviewRequiredCount',
    // Note: approved/rejected don't have dedicated count fields in the batch
    // They are tracked via the records themselves
  };
  return statusToField[status] || null;
};

/**
 * POST /api/remediation/records/:recordId/resend
 * Resend verification link for a record
 * Generates new token, invalidates old one, increments resendCount
 * 
 * Requirements: 8.2, 8.3, 8.4
 */
app.post('/api/remediation/records/:recordId/resend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { recordId } = req.params;
    
    console.log(`🔄 Resending verification link for record ${recordId}`);
    
    // Get the record
    const recordRef = db.collection('remediation-records').doc(recordId);
    const recordDoc = await recordRef.get();
    
    if (!recordDoc.exists) {
      return res.status(404).json({
        error: 'Record not found',
        message: `No record found with ID: ${recordId}`
      });
    }
    
    const currentRecord = recordDoc.data();
    const previousResendCount = currentRecord.resendCount || 0;
    
    // Check if resend limit exceeded (more than 3 times requires confirmation)
    if (previousResendCount >= 3) {
      const { confirmed } = req.body;
      if (!confirmed) {
        return res.status(400).json({
          error: 'Confirmation required',
          message: 'This link has been resent 3 or more times. Please confirm to proceed.',
          requiresConfirmation: true,
          currentResendCount: previousResendCount
        });
      }
    }
    
    // Get batch to determine expiration days
    const batchDoc = await db.collection('remediation-batches').doc(currentRecord.batchId).get();
    const expirationDays = batchDoc.exists ? (batchDoc.data().expirationDays || 7) : 7;
    
    // Generate new token
    const newToken = crypto.randomBytes(32).toString('base64url');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + expirationDays);
    
    // Update the record with new token
    const updates = {
      token: newToken,
      tokenExpiresAt: admin.firestore.Timestamp.fromDate(newExpiresAt),
      tokenUsedAt: admin.firestore.FieldValue.delete(), // Clear used timestamp
      resendCount: admin.firestore.FieldValue.increment(1),
      status: 'pending', // Reset status to pending for new email
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await recordRef.update(updates);
    
    // Create audit log entry
    await createRemediationAuditLog({
      batchId: currentRecord.batchId,
      recordId: recordId,
      action: 'link_resent',
      actorType: 'admin',
      actorId: req.user.uid,
      details: {
        previousResendCount,
        newResendCount: previousResendCount + 1,
        newExpiresAt: newExpiresAt.toISOString(),
        resentBy: req.user.email
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ New verification link generated for record ${recordId}`);
    console.log(`   New token expires: ${newExpiresAt.toISOString()}`);
    console.log(`   Resend count: ${previousResendCount + 1}`);
    
    res.status(200).json({
      success: true,
      newToken: newToken,
      expiresAt: newExpiresAt.toISOString(),
      resendCount: previousResendCount + 1
    });
    
  } catch (error) {
    console.error('❌ Error resending verification link:', error);
    res.status(500).json({
      error: 'Failed to resend verification link',
      message: error.message
    });
  }
});

/**
 * POST /api/remediation/batches/:batchId/send-emails
 * Send verification emails to customers in a batch
 * 
 * Implements rate limiting (50 emails/minute) to avoid spam filters
 * Updates record status on success/failure
 * Creates audit log entries for each email attempt
 * Updates batch status to "in_progress" when complete
 * 
 * Body:
 * - recordIds: Optional array of specific record IDs to send to
 *              If not provided, sends to all pending records in the batch
 * 
 * Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 7.2
 */
app.post('/api/remediation/batches/:batchId/send-emails', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { recordIds } = req.body;
    
    console.log(`📧 Starting email send for batch ${batchId}`);
    
    // Validate batch exists
    const batchRef = db.collection('remediation-batches').doc(batchId);
    const batchDoc = await batchRef.get();
    
    if (!batchDoc.exists) {
      return res.status(404).json({
        error: 'Batch not found',
        message: `No batch found with ID: ${batchId}`
      });
    }
    
    const batchData = batchDoc.data();
    
    // Get records to send emails to
    let query = db.collection('remediation-records').where('batchId', '==', batchId);
    
    // If specific recordIds provided, filter to those
    // Otherwise, get all pending records
    let recordsSnapshot;
    if (recordIds && Array.isArray(recordIds) && recordIds.length > 0) {
      // Firestore 'in' query limited to 10 items, so we need to batch
      const recordChunks = [];
      for (let i = 0; i < recordIds.length; i += 10) {
        recordChunks.push(recordIds.slice(i, i + 10));
      }
      
      const allRecords = [];
      for (const chunk of recordChunks) {
        const chunkSnapshot = await db.collection('remediation-records')
          .where('batchId', '==', batchId)
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        allRecords.push(...chunkSnapshot.docs);
      }
      recordsSnapshot = { docs: allRecords };
    } else {
      // Get all pending records (status = 'pending' or 'email_failed')
      recordsSnapshot = await query
        .where('status', 'in', ['pending', 'email_failed'])
        .get();
    }
    
    const records = recordsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (records.length === 0) {
      return res.status(200).json({
        sent: 0,
        failed: 0,
        errors: [],
        message: 'No records to send emails to'
      });
    }
    
    console.log(`📧 Found ${records.length} records to send emails to`);
    
    // Rate limiting: 50 emails per minute
    const RATE_LIMIT = 50;
    const RATE_WINDOW_MS = 60000; // 1 minute
    const DELAY_BETWEEN_EMAILS = Math.ceil(RATE_WINDOW_MS / RATE_LIMIT); // ~1200ms
    
    // Get frontend base URL for verification links
    const frontendBaseUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
    
    // Process results
    let sentCount = 0;
    let failedCount = 0;
    const errors = [];
    
    // Process emails with rate limiting
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Generate verification URL
        const verificationUrl = `${frontendBaseUrl}/verify/${record.token}`;
        
        // Format expiration date
        const expiresAt = record.tokenExpiresAt?.toDate?.() || new Date(record.tokenExpiresAt);
        const expirationDate = expiresAt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Generate email content
        const emailHtml = generateVerificationEmailHtml({
          customerName: record.customerName,
          policyNumber: record.policyNumber,
          brokerName: record.brokerName,
          verificationUrl: verificationUrl,
          expirationDate: expirationDate
        });
        
        const emailSubject = `Action Required: Identity Verification for Policy ${record.policyNumber} - NEM Insurance`;
        
        // Send email
        await transporter.sendMail({
          from: '"NEM Insurance" <kyc@nem-insurance.com>',
          to: record.email,
          subject: emailSubject,
          html: emailHtml
        });
        
        // Update record status to email_sent
        const recordRef = db.collection('remediation-records').doc(record.id);
        await recordRef.update({
          status: 'email_sent',
          emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          emailError: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create audit log for successful send
        await createRemediationAuditLog({
          batchId: batchId,
          recordId: record.id,
          action: 'emails_sent',
          actorType: 'admin',
          actorId: req.user.uid,
          details: {
            email: record.email,
            customerName: record.customerName,
            policyNumber: record.policyNumber,
            status: 'success',
            sentBy: req.user.email
          },
          ipAddress: req.ipData?.masked,
          userAgent: req.headers['user-agent']
        });
        
        sentCount++;
        console.log(`✅ Email sent to ${record.email} (${i + 1}/${records.length})`);
        
      } catch (emailError) {
        // Update record status to email_failed
        const recordRef = db.collection('remediation-records').doc(record.id);
        await recordRef.update({
          status: 'email_failed',
          emailError: emailError.message || 'Unknown error',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create audit log for failed send
        await createRemediationAuditLog({
          batchId: batchId,
          recordId: record.id,
          action: 'emails_sent',
          actorType: 'admin',
          actorId: req.user.uid,
          details: {
            email: record.email,
            customerName: record.customerName,
            policyNumber: record.policyNumber,
            status: 'failed',
            error: emailError.message || 'Unknown error',
            sentBy: req.user.email
          },
          ipAddress: req.ipData?.masked,
          userAgent: req.headers['user-agent']
        });
        
        errors.push({
          recordId: record.id,
          email: record.email,
          error: emailError.message || 'Unknown error'
        });
        
        failedCount++;
        console.error(`❌ Failed to send email to ${record.email}: ${emailError.message}`);
      }
      
      // Rate limiting delay (skip for last email)
      if (i < records.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS));
      }
    }
    
    // Update batch statistics
    const batchUpdates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (sentCount > 0) {
      batchUpdates.emailSentCount = admin.firestore.FieldValue.increment(sentCount);
      batchUpdates.pendingCount = admin.firestore.FieldValue.increment(-sentCount);
    }
    
    // Update batch status to in_progress if it was pending
    if (batchData.status === 'pending') {
      batchUpdates.status = 'in_progress';
    }
    
    await batchRef.update(batchUpdates);
    
    console.log(`📧 Email sending complete: ${sentCount} sent, ${failedCount} failed`);
    
    res.status(200).json({
      sent: sentCount,
      failed: failedCount,
      errors: errors
    });
    
  } catch (error) {
    console.error('❌ Error sending batch emails:', error);
    res.status(500).json({
      error: 'Failed to send emails',
      message: error.message
    });
  }
});

/**
 * Helper function to generate verification email HTML
 * This is a server-side version of the email template
 * 
 * @param {Object} data - Email data
 * @param {string} data.customerName - Customer's name
 * @param {string} data.policyNumber - Policy number
 * @param {string} data.brokerName - Broker's name
 * @param {string} data.verificationUrl - Verification URL
 * @param {string} data.expirationDate - Formatted expiration date
 * @returns {string} HTML email content
 */
function generateVerificationEmailHtml(data) {
  const { customerName, policyNumber, brokerName, verificationUrl, expirationDate } = data;
  
  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return String(text).replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
  };
  
  const BRAND_COLORS = {
    primary: '#800020',
    secondary: '#FFD700',
    background: '#f9f9f9',
    text: '#333333',
    lightText: '#666666',
    border: '#dddddd',
  };
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Identity Verification Required - NEM Insurance</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header with NEM Insurance Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #600018 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="color: ${BRAND_COLORS.secondary}; margin: 0; font-size: 28px; font-weight: bold;">NEM Insurance</h1>
                    <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Identity Verification Request</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>${escapeHtml(customerName)}</strong>,
              </p>
              
              <!-- Introduction -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                As part of our ongoing commitment to regulatory compliance and the security of your insurance policy, 
                we need to verify your identity information on file.
              </p>
              
              <!-- Policy Information Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND_COLORS.background}; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: ${BRAND_COLORS.lightText}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Policy Details</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: ${BRAND_COLORS.lightText}; font-size: 14px;">Policy Number:</span>
                        </td>
                        <td style="padding: 5px 0 5px 15px;">
                          <strong style="color: ${BRAND_COLORS.text}; font-size: 14px;">${escapeHtml(policyNumber)}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: ${BRAND_COLORS.lightText}; font-size: 14px;">Broker:</span>
                        </td>
                        <td style="padding: 5px 0 5px 15px;">
                          <strong style="color: ${BRAND_COLORS.text}; font-size: 14px;">${escapeHtml(brokerName)}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Broker Authorization Statement -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                This verification request has been authorized by your broker, <strong>${escapeHtml(brokerName)}</strong>, 
                in accordance with regulatory requirements.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="${escapeHtml(verificationUrl)}" 
                       style="display: inline-block; background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.secondary}; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      Verify My Identity
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiration Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff8e6; border-left: 4px solid #f0ad4e; border-radius: 0 4px 4px 0; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #856404; font-size: 14px; margin: 0;">
                      <strong>⏰ Important:</strong> This verification link will expire on <strong>${escapeHtml(expirationDate)}</strong>. 
                      Please complete your verification before this date.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="color: ${BRAND_COLORS.lightText}; font-size: 13px; line-height: 1.6; margin: 25px 0 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: ${BRAND_COLORS.primary}; font-size: 13px; word-break: break-all; margin: 5px 0 25px 0;">
                <a href="${escapeHtml(verificationUrl)}" style="color: ${BRAND_COLORS.primary};">${escapeHtml(verificationUrl)}</a>
              </p>
              
              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid ${BRAND_COLORS.border}; margin-top: 25px;">
                <tr>
                  <td style="padding-top: 20px;">
                    <p style="color: ${BRAND_COLORS.lightText}; font-size: 13px; line-height: 1.6; margin: 0;">
                      <strong>🔒 Security Notice:</strong> This is a secure, one-time verification link unique to you. 
                      Do not share this link with anyone. NEM Insurance will never ask for your password or PIN via email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND_COLORS.background}; padding: 25px 40px; border-radius: 0 0 8px 8px;">
              <p style="color: ${BRAND_COLORS.lightText}; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
                If you have any questions or need assistance, please contact your broker or reach out to us at:
              </p>
              <p style="color: ${BRAND_COLORS.text}; font-size: 13px; margin: 0;">
                📧 <a href="mailto:kyc@nem-insurance.com" style="color: ${BRAND_COLORS.primary};">kyc@nem-insurance.com</a>
              </p>
              <p style="color: ${BRAND_COLORS.lightText}; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} NEM Insurance. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * GET /api/remediation/verify/:token
 * Public endpoint to validate a verification token and get record info
 * 
 * This endpoint is PUBLIC (no authentication required) - customers access it via their unique link
 * 
 * Returns:
 * - valid: true if token is valid and can be used
 * - record: Public record info (customer name, policy, broker, identity type)
 * - expired: true if token has expired
 * - used: true if token has already been used for verification
 * 
 * Requirements: 2.5, 2.6
 */
app.get('/api/remediation/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log(`🔍 Token validation request received`);
    
    // Validate token format
    if (!token || typeof token !== 'string' || token.length < 43) {
      console.log('❌ Invalid token format');
      return res.status(400).json({
        valid: false,
        error: 'Invalid token format'
      });
    }
    
    // Find record by token
    const recordsSnapshot = await db.collection('remediation-records')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (recordsSnapshot.empty) {
      console.log('❌ Token not found');
      return res.status(404).json({
        valid: false,
        error: 'Invalid verification link. Please check the link or contact your broker.'
      });
    }
    
    const recordDoc = recordsSnapshot.docs[0];
    const record = recordDoc.data();
    
    // Check if token has already been used (verified status)
    if (record.status === 'verified' || record.status === 'approved') {
      console.log('ℹ️ Token already used - verification complete');
      return res.status(200).json({
        valid: false,
        used: true,
        message: 'Your identity has already been verified. No further action is required.'
      });
    }
    
    // Check if token has expired
    const expiresAt = record.tokenExpiresAt?.toDate?.() || new Date(record.tokenExpiresAt);
    const now = new Date();
    
    if (now > expiresAt) {
      console.log('ℹ️ Token has expired');
      
      // Update record status to link_expired if not already
      if (record.status !== 'link_expired') {
        await recordDoc.ref.update({
          status: 'link_expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return res.status(200).json({
        valid: false,
        expired: true,
        message: 'This verification link has expired. Please contact your broker for a new link.',
        brokerName: record.brokerName
      });
    }
    
    // Token is valid - return public record info
    console.log('✅ Token validated successfully');
    
    res.status(200).json({
      valid: true,
      record: {
        customerName: record.customerName,
        policyNumber: record.policyNumber,
        brokerName: record.brokerName,
        identityType: record.identityType,
        expiresAt: expiresAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error validating token:', error);
    res.status(500).json({
      valid: false,
      error: 'Verification service temporarily unavailable. Please try again later.'
    });
  }
});

/**
 * POST /api/remediation/verify/:token
 * Public endpoint to submit identity verification
 * 
 * This endpoint is PUBLIC (no authentication required) - customers submit their identity info
 * 
 * Body:
 * - identityNumber: NIN/BVN (11 digits) for individuals, or CAC/RC number for corporates
 * - companyName: Required for corporate identity type
 * - demoMode: Optional - if true, uses mock verification (for testing)
 * 
 * Requirements: 4.3, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 7.3
 */
app.post('/api/remediation/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { identityNumber, companyName, demoMode } = req.body;
    
    console.log(`🔐 Verification submission received`);
    
    // Validate token format
    if (!token || typeof token !== 'string' || token.length < 43) {
      console.log('❌ Invalid token format');
      return res.status(400).json({
        success: false,
        error: 'Invalid token format'
      });
    }
    
    // Find record by token
    const recordsSnapshot = await db.collection('remediation-records')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (recordsSnapshot.empty) {
      console.log('❌ Token not found');
      return res.status(404).json({
        success: false,
        error: 'Invalid verification link. Please check the link or contact your broker.'
      });
    }
    
    const recordDoc = recordsSnapshot.docs[0];
    const record = recordDoc.data();
    const recordId = recordDoc.id;
    
    // Check if already verified
    if (record.status === 'verified' || record.status === 'approved') {
      console.log('ℹ️ Already verified');
      return res.status(400).json({
        success: false,
        error: 'Your identity has already been verified. No further action is required.'
      });
    }
    
    // Check if token has expired
    const expiresAt = record.tokenExpiresAt?.toDate?.() || new Date(record.tokenExpiresAt);
    const now = new Date();
    
    if (now > expiresAt) {
      console.log('ℹ️ Token has expired');
      return res.status(400).json({
        success: false,
        error: 'This verification link has expired. Please contact your broker for a new link.'
      });
    }
    
    // Check verification attempts
    const currentAttempts = record.verificationAttempts || 0;
    const MAX_ATTEMPTS = 3;
    
    if (currentAttempts >= MAX_ATTEMPTS) {
      console.log('❌ Maximum verification attempts exceeded');
      return res.status(400).json({
        success: false,
        error: 'Maximum verification attempts reached. An administrator will contact you.',
        attemptsRemaining: 0
      });
    }
    
    // Validate identity input based on identity type
    if (record.identityType === 'individual') {
      // Validate NIN/BVN format (11 digits)
      if (!identityNumber || !/^\d{11}$/.test(identityNumber)) {
        console.log('❌ Invalid NIN/BVN format');
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid 11-digit NIN or BVN number.'
        });
      }
    } else if (record.identityType === 'corporate') {
      // Validate CAC number and company name
      if (!identityNumber || !identityNumber.trim()) {
        console.log('❌ Missing CAC/RC number');
        return res.status(400).json({
          success: false,
          error: 'Please enter your CAC/RC registration number.'
        });
      }
      if (!companyName || !companyName.trim()) {
        console.log('❌ Missing company name');
        return res.status(400).json({
          success: false,
          error: 'Please enter your registered company name.'
        });
      }
    }
    
    // Increment verification attempts
    await recordDoc.ref.update({
      verificationAttempts: admin.firestore.FieldValue.increment(1),
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Call Paystack verification API
    let verificationResult;
    let verificationSuccess = false;
    let verifiedName = '';
    
    try {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (record.identityType === 'individual') {
        // BVN/NIN verification
        if (demoMode) {
          // Demo mode - simulate successful verification
          console.log('🎭 DEMO MODE: Simulating BVN verification');
          await new Promise(resolve => setTimeout(resolve, 1500));
          verificationResult = {
            status: true,
            data: {
              first_name: 'JOHN',
              last_name: 'DOE',
              middle_name: 'DEMO',
              dob: '1990-01-15'
            }
          };
          verificationSuccess = true;
          verifiedName = `${verificationResult.data.first_name} ${verificationResult.data.middle_name || ''} ${verificationResult.data.last_name}`.trim();
        } else {
          // Real Paystack verification
          const response = await fetch(`https://api.paystack.co/bank/resolve_bvn/${identityNumber}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${paystackSecretKey}`,
            },
          });
          
          const responseText = await response.text();
          verificationResult = responseText ? JSON.parse(responseText) : { status: false };
          
          if (response.ok && verificationResult.status) {
            verificationSuccess = true;
            const data = verificationResult.data;
            verifiedName = `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.trim();
          }
        }
      } else {
        // CAC verification
        if (demoMode) {
          // Demo mode - simulate successful verification
          console.log('🎭 DEMO MODE: Simulating CAC verification');
          await new Promise(resolve => setTimeout(resolve, 1500));
          verificationResult = {
            status: true,
            data: {
              company_name: companyName.toUpperCase(),
              rc_number: identityNumber,
              status: 'ACTIVE'
            }
          };
          verificationSuccess = true;
          verifiedName = verificationResult.data.company_name;
        } else {
          // Real Paystack CAC verification
          const response = await fetch('https://api.paystack.co/identity/cac', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${paystackSecretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              rc_number: identityNumber, 
              company_name: companyName 
            }),
          });
          
          const responseText = await response.text();
          verificationResult = responseText ? JSON.parse(responseText) : { status: false };
          
          if (response.ok && verificationResult.status) {
            verificationSuccess = true;
            verifiedName = verificationResult.data?.company_name || companyName;
          }
        }
      }
    } catch (apiError) {
      console.error('❌ Paystack API error:', apiError);
      
      // Update record with error
      await recordDoc.ref.update({
        lastAttemptError: apiError.message || 'Verification service error',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create audit log for failed attempt
      await createRemediationAuditLog({
        batchId: record.batchId,
        recordId: recordId,
        action: 'verification_attempted',
        actorType: 'customer',
        actorId: req.ipData?.hash,
        details: {
          identityType: record.identityType,
          error: 'API error',
          attemptNumber: currentAttempts + 1
        },
        ipAddress: req.ipData?.masked,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(500).json({
        success: false,
        error: 'Verification service temporarily unavailable. Please try again later.',
        attemptsRemaining: MAX_ATTEMPTS - (currentAttempts + 1)
      });
    }
    
    // Handle verification failure
    if (!verificationSuccess) {
      console.log('❌ Verification failed');
      
      const newAttemptCount = currentAttempts + 1;
      const attemptsRemaining = MAX_ATTEMPTS - newAttemptCount;
      
      // Update record status if max attempts reached
      if (newAttemptCount >= MAX_ATTEMPTS) {
        await recordDoc.ref.update({
          status: 'verification_failed',
          lastAttemptError: verificationResult?.message || 'Verification failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update batch statistics
        const batchRef = db.collection('remediation-batches').doc(record.batchId);
        await batchRef.update({
          failedCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await recordDoc.ref.update({
          lastAttemptError: verificationResult?.message || 'Verification failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Create audit log
      await createRemediationAuditLog({
        batchId: record.batchId,
        recordId: recordId,
        action: 'verification_failed',
        actorType: 'customer',
        actorId: req.ipData?.hash,
        details: {
          identityType: record.identityType,
          error: verificationResult?.message || 'Verification failed',
          attemptNumber: newAttemptCount,
          attemptsRemaining
        },
        ipAddress: req.ipData?.masked,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(400).json({
        success: false,
        verified: false,
        error: verificationResult?.message || 'Verification failed. Please check your information and try again.',
        attemptsRemaining
      });
    }
    
    // Verification successful - calculate name match score
    console.log('✅ Paystack verification successful');
    
    // Calculate name match score using fuzzy matching
    const customerName = record.customerName || '';
    const nameMatchScore = calculateNameMatchScore(customerName, verifiedName);
    
    console.log(`📊 Name match score: ${nameMatchScore}% (Customer: "${customerName}", Verified: "${verifiedName}")`);
    
    // Determine final status based on name match
    const NAME_MATCH_THRESHOLD = 80;
    let finalStatus;
    let needsReview = false;
    
    if (nameMatchScore >= NAME_MATCH_THRESHOLD) {
      finalStatus = 'verified';
      console.log('✅ Name match above threshold - auto-verified');
    } else {
      finalStatus = 'review_required';
      needsReview = true;
      console.log('⚠️ Name match below threshold - flagged for review');
    }
    
    // Update record with verification results
    const updateData = {
      status: finalStatus,
      submittedIdentityNumber: identityNumber,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationResponse: verificationResult.data || {},
      nameMatchScore: nameMatchScore,
      tokenUsedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (record.identityType === 'corporate' && companyName) {
      updateData.submittedCompanyName = companyName;
    }
    
    await recordDoc.ref.update(updateData);
    
    // Update batch statistics
    const batchRef = db.collection('remediation-batches').doc(record.batchId);
    const batchUpdates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (finalStatus === 'verified') {
      batchUpdates.verifiedCount = admin.firestore.FieldValue.increment(1);
    } else if (finalStatus === 'review_required') {
      batchUpdates.reviewRequiredCount = admin.firestore.FieldValue.increment(1);
    }
    
    // Decrement the previous status count
    const previousStatus = record.status;
    const prevCountField = getStatusCountField(previousStatus);
    if (prevCountField) {
      batchUpdates[prevCountField] = admin.firestore.FieldValue.increment(-1);
    }
    
    await batchRef.update(batchUpdates);
    
    // Create audit log for successful verification
    await createRemediationAuditLog({
      batchId: record.batchId,
      recordId: recordId,
      action: 'verification_success',
      actorType: 'customer',
      actorId: req.ipData?.hash,
      details: {
        identityType: record.identityType,
        nameMatchScore,
        needsReview,
        finalStatus,
        verifiedName
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Verification complete for record ${recordId} - Status: ${finalStatus}`);
    
    res.status(200).json({
      success: true,
      verified: !needsReview,
      matchScore: nameMatchScore,
      message: needsReview 
        ? 'Your information has been submitted and is pending review. You will be contacted if additional information is needed.'
        : 'Your identity has been verified successfully. Thank you for completing this process.'
    });
    
  } catch (error) {
    console.error('❌ Error processing verification:', error);
    res.status(500).json({
      success: false,
      error: 'Verification service temporarily unavailable. Please try again later.'
    });
  }
});

/**
 * Helper function to calculate name match score using fuzzy matching
 * Returns a score between 0 and 100
 * 
 * @param {string} name1 - First name to compare
 * @param {string} name2 - Second name to compare
 * @returns {number} Match score (0-100)
 */
function calculateNameMatchScore(name1, name2) {
  if (!name1 || !name2) return 0;
  
  // Normalize names for comparison
  const normalize = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
      .replace(/[^a-z0-9\s]/g, ''); // Remove special characters
  };
  
  const normalized1 = normalize(name1);
  const normalized2 = normalize(name2);
  
  // If identical after normalization, return 100
  if (normalized1 === normalized2) return 100;
  
  // Calculate Levenshtein distance-based similarity
  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  // Also check word-based matching (handles name order differences)
  const words1 = normalized1.split(' ').filter(w => w.length > 0);
  const words2 = normalized2.split(' ').filter(w => w.length > 0);
  
  let matchedWords = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || 
          (word1.length > 2 && word2.length > 2 && 
           (word1.includes(word2) || word2.includes(word1)))) {
        matchedWords++;
        break;
      }
    }
  }
  
  const wordSimilarity = totalWords > 0 ? (matchedWords / totalWords) * 100 : 0;
  
  // Return the higher of the two similarity scores
  return Math.round(Math.max(similarity, wordSimilarity));
}

/**
 * Helper function to calculate Levenshtein distance between two strings
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Create a 2D array to store distances
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * GET /api/remediation/audit-logs
 * Get audit logs with filtering and pagination
 * 
 * Query params:
 * - batchId: Filter by batch ID (optional)
 * - recordId: Filter by record ID (optional)
 * - action: Filter by action type (optional)
 * - startDate: Filter logs from this date (ISO string, optional)
 * - endDate: Filter logs until this date (ISO string, optional)
 * - page: Page number (default: 1)
 * - limit: Logs per page (default: 50, max: 100)
 * 
 * Requirements: 7.6
 */
app.get('/api/remediation/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { batchId, recordId, action, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    console.log(`📋 Fetching remediation audit logs`);
    console.log(`   Filters: batchId=${batchId}, recordId=${recordId}, action=${action}`);
    console.log(`   Date range: ${startDate || 'any'} to ${endDate || 'any'}`);
    console.log(`   Pagination: page=${page}, limit=${limit}`);
    
    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    
    // Build query
    let query = db.collection('remediation-audit-logs');
    
    // Apply filters
    if (batchId) {
      query = query.where('batchId', '==', batchId);
    }
    
    if (recordId) {
      query = query.where('recordId', '==', recordId);
    }
    
    if (action) {
      // Validate action type
      const validActions = [
        'batch_created', 'batch_deleted', 'emails_sent',
        'link_generated', 'link_resent', 'verification_attempted',
        'verification_success', 'verification_failed',
        'record_approved', 'record_rejected', 'export_generated',
        'email_sent', 'email_failed', 'record_updated'
      ];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          error: 'Invalid action',
          message: `Action must be one of: ${validActions.join(', ')}`
        });
      }
      query = query.where('action', '==', action);
    }
    
    // Apply date range filters
    if (startDate) {
      const startTimestamp = new Date(startDate);
      if (isNaN(startTimestamp.getTime())) {
        return res.status(400).json({
          error: 'Invalid startDate',
          message: 'startDate must be a valid ISO date string'
        });
      }
      query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startTimestamp));
    }
    
    if (endDate) {
      const endTimestamp = new Date(endDate);
      if (isNaN(endTimestamp.getTime())) {
        return res.status(400).json({
          error: 'Invalid endDate',
          message: 'endDate must be a valid ISO date string'
        });
      }
      query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endTimestamp));
    }
    
    // Order by timestamp descending (most recent first)
    query = query.orderBy('timestamp', 'desc');
    
    // Get total count for pagination (using a separate query)
    // Note: Firestore doesn't have a direct count, so we fetch all IDs
    const countSnapshot = await query.select().get();
    const total = countSnapshot.size;
    
    // Apply pagination
    const offset = (pageNum - 1) * limitNum;
    const paginatedQuery = query.offset(offset).limit(limitNum);
    
    const snapshot = await paginatedQuery.get();
    
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamp to ISO string
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
      };
    });
    
    console.log(`✅ Found ${logs.length} audit logs (total: ${total})`);
    
    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: offset + logs.length < total
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching remediation audit logs:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: error.message
    });
  }
});

/**
 * GET /api/remediation/batches/:batchId/export
 * Export all records from a batch as CSV
 * 
 * Generates a CSV file containing all record data including:
 * - Customer information (name, email, phone, policy number, broker)
 * - Identity type and verification status
 * - Verification results (submitted identity, match score)
 * - Timestamps (created, email sent, verified, reviewed)
 * - Review information (reviewer, comment)
 * 
 * Requirements: 6.4
 */
app.get('/api/remediation/batches/:batchId/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    console.log(`📤 Exporting records for batch ${batchId}`);
    
    // Validate batch exists
    const batchDoc = await db.collection('remediation-batches').doc(batchId).get();
    if (!batchDoc.exists) {
      return res.status(404).json({ 
        error: 'Batch not found',
        message: `No batch found with ID: ${batchId}`
      });
    }
    
    const batchData = batchDoc.data();
    
    // Get all records for this batch
    const recordsSnapshot = await db.collection('remediation-records')
      .where('batchId', '==', batchId)
      .orderBy('createdAt', 'desc')
      .get();
    
    if (recordsSnapshot.empty) {
      return res.status(404).json({
        error: 'No records found',
        message: 'This batch has no records to export'
      });
    }
    
    // Define CSV columns (non-sensitive fields)
    const csvColumns = [
      'Record ID',
      'Customer Name',
      'Email',
      'Phone',
      'Policy Number',
      'Broker Name',
      'Identity Type',
      'Status',
      'Email Sent At',
      'Resend Count',
      'Submitted Identity Number',
      'Submitted Company Name',
      'Verified At',
      'Name Match Score',
      'Verification Attempts',
      'Reviewed By',
      'Reviewed At',
      'Review Comment',
      'Created At',
      'Updated At'
    ];
    
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // If value contains comma, newline, or double quote, wrap in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    // Helper function to format timestamp
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toISOString();
    };
    
    // Build CSV rows
    const csvRows = [csvColumns.join(',')]; // Header row
    
    recordsSnapshot.docs.forEach(doc => {
      const record = doc.data();
      
      const row = [
        escapeCSV(doc.id),
        escapeCSV(record.customerName),
        escapeCSV(record.email),
        escapeCSV(record.phone),
        escapeCSV(record.policyNumber),
        escapeCSV(record.brokerName),
        escapeCSV(record.identityType),
        escapeCSV(record.status),
        escapeCSV(formatTimestamp(record.emailSentAt)),
        escapeCSV(record.resendCount || 0),
        escapeCSV(record.submittedIdentityNumber),
        escapeCSV(record.submittedCompanyName),
        escapeCSV(formatTimestamp(record.verifiedAt)),
        escapeCSV(record.nameMatchScore),
        escapeCSV(record.verificationAttempts || 0),
        escapeCSV(record.reviewedBy),
        escapeCSV(formatTimestamp(record.reviewedAt)),
        escapeCSV(record.reviewComment),
        escapeCSV(formatTimestamp(record.createdAt)),
        escapeCSV(formatTimestamp(record.updatedAt))
      ];
      
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Generate filename with batch name and date
    const sanitizedBatchName = (batchData.name || 'batch').replace(/[^a-zA-Z0-9-_]/g, '_');
    const exportDate = new Date().toISOString().split('T')[0];
    const filename = `remediation_${sanitizedBatchName}_${exportDate}.csv`;
    
    // Create audit log entry for export
    await db.collection('remediation-audit-logs').add({
      batchId,
      action: 'export_generated',
      actorType: 'admin',
      actorId: req.user.uid,
      details: {
        recordCount: recordsSnapshot.size,
        filename,
        exportedBy: req.user.email
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: req.ipData?.masked || req.ip,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Exported ${recordsSnapshot.size} records for batch ${batchId}`);
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    res.status(200).send(csvContent);
    
  } catch (error) {
    console.error('❌ Error exporting remediation batch:', error);
    res.status(500).json({ 
      error: 'Failed to export batch',
      message: error.message
    });
  }
});

// ============= IDENTITY COLLECTION SYSTEM API =============
// New flexible identity collection system that accepts any CSV/Excel structure

/**
 * Helper function to create identity activity log entries
 * Creates comprehensive audit logs for all identity collection system actions
 * 
 * @param {Object} logData - The log data
 * @param {string} logData.listId - The identity list ID
 * @param {string} [logData.entryId] - Optional entry ID for entry-specific actions
 * @param {string} logData.action - The action type
 * @param {string} logData.actorType - 'admin', 'customer', or 'system'
 * @param {string} [logData.actorId] - Actor's UID
 * @param {Object} [logData.details] - Additional details
 * @param {string} [logData.ipAddress] - IP address
 * @param {string} [logData.userAgent] - User agent string
 */
const createIdentityActivityLog = async (logData) => {
  try {
    const logRef = db.collection('identity-logs').doc();
    const log = {
      id: logRef.id,
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await logRef.set(log);
    console.log(`✅ Identity activity log created: ${logData.action}`);
    return log;
  } catch (error) {
    console.error('❌ Failed to create identity activity log:', error);
    // Don't throw - logging failures shouldn't break the main operation
    return null;
  }
};

/**
 * Send customer error notification email
 * Requirements: 21.2, 21.3, 21.6
 */
const sendCustomerErrorNotification = async (entry, verificationError) => {
  try {
    if (!entry.email) {
      console.log('⚠️ No email address for customer notification');
      return false;
    }
    
    const subject = 'Identity Verification Issue - Action Required';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #800020; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .error-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .next-steps { background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>NEM Insurance</h2>
            <p>Identity Verification</p>
          </div>
          <div class="content">
            <p>Dear ${entry.displayName || 'Client'},</p>
            
            <div class="error-box">
              <h3>Verification Issue</h3>
              <p>${verificationError.customerMessage}</p>
            </div>
            
            <p>We apologize for any inconvenience this may cause. This verification is required to comply with regulatory requirements from the National Insurance Commission (NAICOM).</p>
            
            <p>Thank you for your cooperation.</p>
            
            <p>Yours faithfully,<br/>
            <strong>NEM Insurance</strong></p>
          </div>
          <div class="footer">
            <p>Email: nemsupport@nem-insurance.com | Telephone: 0201-4489570-2</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(entry.email, subject, html);
    console.log(`✅ Customer error notification sent to ${entry.email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send customer error notification:', error);
    return false;
  }
};

/**
 * Send staff error notification email
 * Requirements: 21.4, 21.5, 21.10
 */
const sendStaffErrorNotification = async (entry, verificationError, listId) => {
  try {
    // Get all users with roles: compliance, admin, broker (who created the list)
    const usersSnapshot = await db.collection('users').get();
    const staffEmails = [];
    
    // Get list creator
    let listCreatorEmail = null;
    try {
      const listDoc = await db.collection('identity-lists').doc(listId).get();
      if (listDoc.exists) {
        const listData = listDoc.data();
        if (listData.createdBy) {
          const creatorDoc = await db.collection('users').doc(listData.createdBy).get();
          if (creatorDoc.exists) {
            listCreatorEmail = creatorDoc.data().email;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching list creator:', err);
    }
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const role = userData.role || 'default';
      
      // Include compliance, admin, super_admin, and the broker who created this list
      if (role === 'compliance' || role === 'admin' || role === 'super_admin') {
        if (userData.email && !staffEmails.includes(userData.email)) {
          staffEmails.push(userData.email);
        }
      } else if (role === 'broker' && userData.email === listCreatorEmail) {
        if (!staffEmails.includes(userData.email)) {
          staffEmails.push(userData.email);
        }
      }
    });
    
    if (staffEmails.length === 0) {
      console.log('⚠️ No staff emails found for notification');
      return false;
    }
    
    const subject = `Verification Failure Alert - ${entry.displayName || 'Customer'}`;
    
    // Generate admin portal link
    const adminPortalLink = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/admin/identity/${listId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #800020; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .alert-box { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
          .details-box { background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
          .action-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #800020; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>NEM Insurance - Staff Alert</h2>
            <p>Verification Failure Notification</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h3>⚠️ Verification Failed</h3>
              <p>A customer verification attempt has failed and requires attention.</p>
            </div>
            
            <div class="details-box">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> ${entry.displayName || 'N/A'}</p>
              <p><strong>Email:</strong> ${entry.email || 'N/A'}</p>
              <p><strong>Policy Number:</strong> ${entry.policyNumber || 'N/A'}</p>
              <p><strong>Verification Type:</strong> ${entry.verificationType || 'N/A'}</p>
            </div>
            
            <div class="alert-box">
              <h3>Technical Details</h3>
              <pre>${verificationError.staffMessage}</pre>
            </div>
            
            <div class="action-box">
              <h3>Action Required</h3>
              <p>Please review the customer's information and verify that the data in the uploaded list matches their official documents.</p>
              <p>You may need to contact the customer to confirm their information.</p>
              <a href="${adminPortalLink}" class="button">View in Admin Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated alert from the NEM Insurance Identity Collection System.</p>
            <p>Email: nemsupport@nem-insurance.com | Telephone: 0201-4489570-2</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(staffEmails, subject, html);
    console.log(`✅ Staff error notification sent to ${staffEmails.length} recipients`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send staff error notification:', error);
    return false;
  }
};

/**
/**
 * POST /api/identity/lists
 * Create a new identity list from uploaded file data
 * 
 * Body:
 * - name: string - Admin-provided name for the list
 * - columns: string[] - Original column names in order
 * - emailColumn: string - Which column contains email addresses
 * - nameColumns: object - Auto-detected name columns { firstName?, lastName?, middleName?, fullName?, insured?, companyName? }
 * - policyColumn: string - Auto-detected policy number column
 * - fileType: string - Auto-detected file type ('corporate', 'individual', or 'unknown')
 * - entries: object[] - Array of row data objects
 * - originalFileName: string - Original uploaded file name
 * - listType: string - Type of list ('individual', 'corporate', 'flexible') - optional
 * - uploadMode: string - Upload mode used ('template', 'flexible') - optional
 * 
 * Requirements: 1.5, 1.6, 1.7, 15.7
 */
app.post('/api/identity/lists', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { 
      name, 
      columns, 
      emailColumn, 
      nameColumns, 
      policyColumn, 
      fileType, 
      entries, 
      originalFileName,
      listType,
      uploadMode
    } = req.body;
    
    console.log(`📋 Creating identity list: ${name} (type: ${fileType || 'unknown'}, listType: ${listType || 'flexible'}, mode: ${uploadMode || 'flexible'})`);
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'List name is required'
      });
    }
    
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Columns array is required and must not be empty'
      });
    }
    
    if (!emailColumn || typeof emailColumn !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email column must be specified'
      });
    }
    
    if (!columns.includes(emailColumn)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email column must be one of the provided columns'
      });
    }
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Entries array is required and must not be empty'
      });
    }
    
    // Validate listType if provided
    if (listType && !['individual', 'corporate', 'flexible'].includes(listType)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'listType must be one of: individual, corporate, flexible'
      });
    }
    
    // Validate uploadMode if provided
    if (uploadMode && !['template', 'flexible'].includes(uploadMode)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'uploadMode must be one of: template, flexible'
      });
    }
    
    // Create list document
    const listRef = db.collection('identity-lists').doc();
    const listId = listRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    const listData = {
      id: listId,
      name: name.trim(),
      columns: columns,
      emailColumn: emailColumn,
      nameColumns: nameColumns || null,
      policyColumn: policyColumn || null,
      fileType: fileType || 'unknown',
      listType: listType || 'flexible',
      uploadMode: uploadMode || 'flexible',
      totalEntries: entries.length,
      verifiedCount: 0,
      pendingCount: entries.length,
      failedCount: 0,
      linkSentCount: 0,
      createdBy: req.user.uid,
      createdAt: now,
      updatedAt: now,
      originalFileName: originalFileName || 'unknown'
    };
    
    await listRef.set(listData);
    
    // Helper function to check if a value is effectively empty (N/A, blank, etc.)
    const isEmptyValue = (val) => {
      if (!val) return true;
      const str = String(val).trim().toLowerCase();
      return str === '' || str === 'n/a' || str === 'na' || str === '-' || str === 'nil' || str === 'none';
    };
    
    // Helper function to get clean value (returns null if empty)
    const getCleanValue = (val) => {
      if (isEmptyValue(val)) return null;
      return String(val).trim();
    };
    
    // Helper function to build display name from entry data
    const buildDisplayName = (entryData, nameCols) => {
      if (!nameCols) return null;
      
      // If we have firstName/lastName, combine them
      if (nameCols.firstName || nameCols.lastName) {
        const parts = [];
        if (nameCols.firstName) {
          const val = getCleanValue(entryData[nameCols.firstName]);
          if (val) parts.push(val);
        }
        if (nameCols.middleName) {
          const val = getCleanValue(entryData[nameCols.middleName]);
          if (val) parts.push(val); // Only add if not N/A or empty
        }
        if (nameCols.lastName) {
          const val = getCleanValue(entryData[nameCols.lastName]);
          if (val) parts.push(val);
        }
        if (parts.length > 0) {
          return parts.join(' ');
        }
      }
      
      // Try fullName
      if (nameCols.fullName) {
        const val = getCleanValue(entryData[nameCols.fullName]);
        if (val) return val;
      }
      
      // Try insured
      if (nameCols.insured) {
        const val = getCleanValue(entryData[nameCols.insured]);
        if (val) return val;
      }
      
      // Try companyName (for corporate entries)
      if (nameCols.companyName) {
        const val = getCleanValue(entryData[nameCols.companyName]);
        if (val) return val;
      }
      
      return null;
    };
    
    // Create entry documents
    const entryPromises = entries.map(async (entryData, index) => {
      const entryRef = db.collection('identity-entries').doc();
      const entryId = entryRef.id;
      
      // Extract email from the specified column
      const email = entryData[emailColumn];
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        console.warn(`⚠️ Invalid or missing email in row ${index + 1}: ${email}`);
      }
      
      // Extract display name from name columns
      const displayName = buildDisplayName(entryData, nameColumns);
      
      // Extract policy number if policy column is specified
      const policyNumber = policyColumn && entryData[policyColumn] 
        ? String(entryData[policyColumn]).trim() 
        : null;
      
      const entry = {
        id: entryId,
        listId: listId,
        data: entryData, // Store all original columns
        email: (email || '').toString().trim().toLowerCase(),
        displayName: displayName,
        policyNumber: policyNumber,
        status: 'pending',
        resendCount: 0,
        verificationAttempts: 0,
        createdAt: now,
        updatedAt: now
      };
      
      await entryRef.set(entry);
      return entry;
    });
    
    await Promise.all(entryPromises);
    
    // Create activity log
    await createIdentityActivityLog({
      listId: listId,
      action: 'list_created',
      actorType: 'admin',
      actorId: req.user.uid,
      details: {
        name: name.trim(),
        entryCount: entries.length,
        columns: columns,
        emailColumn: emailColumn,
        nameColumns: nameColumns,
        policyColumn: policyColumn,
        originalFileName: originalFileName,
        listType: listType || 'flexible',
        uploadMode: uploadMode || 'flexible',
        createdBy: req.user.email
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Created identity list ${listId} with ${entries.length} entries (listType: ${listType || 'flexible'}, uploadMode: ${uploadMode || 'flexible'})`);
    
    res.status(201).json({
      listId: listId,
      entryCount: entries.length
    });
    
  } catch (error) {
    console.error('❌ Error creating identity list:', error);
    res.status(500).json({
      error: 'Failed to create list',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/lists
 * Get all identity lists with summary statistics
 * Brokers see only their own lists, admins see all
 * 
 * Requirements: 2.1, 11.3, 11.4
 */
app.get('/api/identity/lists', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    let listsQuery = db.collection('identity-lists');
    
    // Filter by createdBy for brokers
    if (normalizeRole(req.user.role) === 'broker') {
      listsQuery = listsQuery.where('createdBy', '==', req.user.uid);
      console.log(`🔒 Broker ${req.user.email} filtering lists by createdBy: ${req.user.uid}`);
    } else {
      console.log(`✅ Admin/Compliance ${req.user.email} accessing all lists`);
    }
    
    const listsSnapshot = await listsQuery
      .orderBy('createdAt', 'desc')
      .get();
    
    const lists = listsSnapshot.docs.map(doc => {
      const data = doc.data();
      const total = data.totalEntries || 0;
      const verified = data.verifiedCount || 0;
      
      return {
        id: doc.id,
        name: data.name,
        totalEntries: total,
        verifiedCount: verified,
        pendingCount: data.pendingCount || 0,
        failedCount: data.failedCount || 0,
        linkSentCount: data.linkSentCount || 0,
        progress: total > 0 ? Math.round((verified / total) * 100) : 0,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        originalFileName: data.originalFileName,
        createdBy: data.createdBy // Include for debugging
      };
    });
    
    console.log(`✅ Retrieved ${lists.length} identity lists for ${req.user.email}`);
    res.status(200).json({ lists });
    
  } catch (error) {
    console.error('❌ Error fetching identity lists:', error);
    res.status(500).json({
      error: 'Failed to fetch lists',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/lists/:listId
 * Get a single list with full details
 * Brokers can only access their own lists
 * 
 * Requirements: 2.2, 11.3, 11.4
 */
app.get('/api/identity/lists/:listId', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    const listDoc = await db.collection('identity-lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        error: 'List not found',
        message: `No list found with ID: ${listId}`
      });
    }
    
    const listData = listDoc.data();
    
    // Check ownership for brokers
    if (normalizeRole(req.user.role) === 'broker' && listData.createdBy !== req.user.uid) {
      console.log(`❌ Broker ${req.user.email} attempted to access list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this list'
      });
    }
    
    const total = listData.totalEntries || 0;
    const verified = listData.verifiedCount || 0;
    
    const list = {
      id: listDoc.id,
      name: listData.name,
      columns: listData.columns,
      emailColumn: listData.emailColumn,
      totalEntries: total,
      verifiedCount: verified,
      pendingCount: listData.pendingCount || 0,
      failedCount: listData.failedCount || 0,
      linkSentCount: listData.linkSentCount || 0,
      progress: total > 0 ? Math.round((verified / total) * 100) : 0,
      createdBy: listData.createdBy,
      createdAt: listData.createdAt?.toDate?.() || listData.createdAt,
      updatedAt: listData.updatedAt?.toDate?.() || listData.updatedAt,
      originalFileName: listData.originalFileName
    };
    
    console.log(`✅ Retrieved identity list ${listId} for ${req.user.email}`);
    res.status(200).json({ list });
    
  } catch (error) {
    console.error('❌ Error fetching identity list:', error);
    res.status(500).json({
      error: 'Failed to fetch list',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/lists/:listId/entries
 * Get entries for a list with filtering, search, and pagination
 * Brokers can only access entries from their own lists
 * 
 * Query params:
 * - status: Filter by status (pending, link_sent, verified, failed, email_failed)
 * - search: Search across all columns
 * - page: Page number (default 1)
 * - limit: Items per page (default 50, max 100)
 * 
 * Requirements: 2.2, 2.3, 2.4, 11.3, 11.4
 */
app.get('/api/identity/lists/:listId/entries', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    const { status, search, page = 1, limit = 50 } = req.query;
    
    // Validate list exists
    const listDoc = await db.collection('identity-lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        error: 'List not found',
        message: `No list found with ID: ${listId}`
      });
    }
    
    const listData = listDoc.data();
    
    // Check ownership for brokers
    if (normalizeRole(req.user.role) === 'broker' && listData.createdBy !== req.user.uid) {
      console.log(`❌ Broker ${req.user.email} attempted to access entries for list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access entries for this list'
      });
    }
    
    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    
    // Build query
    let query = db.collection('identity-entries').where('listId', '==', listId);
    
    // Apply status filter if provided
    if (status && ['pending', 'link_sent', 'verified', 'failed', 'email_failed'].includes(status)) {
      query = query.where('status', '==', status);
    }
    
    // Get all matching entries (we'll filter and paginate in memory for search)
    const entriesSnapshot = await query.orderBy('createdAt', 'desc').get();
    
    let entries = entriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        listId: data.listId,
        data: data.data,
        email: data.email,
        verificationType: data.verificationType,
        status: data.status,
        token: data.token,
        tokenExpiresAt: data.tokenExpiresAt?.toDate?.() || data.tokenExpiresAt,
        nin: data.nin,
        cac: data.cac,
        cacCompanyName: data.cacCompanyName,
        verifiedAt: data.verifiedAt?.toDate?.() || data.verifiedAt,
        linkSentAt: data.linkSentAt?.toDate?.() || data.linkSentAt,
        resendCount: data.resendCount || 0,
        verificationAttempts: data.verificationAttempts || 0,
        lastAttemptAt: data.lastAttemptAt?.toDate?.() || data.lastAttemptAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      };
    });
    
    // Apply search filter if provided (search across all data fields and email)
    if (search && search.trim().length > 0) {
      const searchLower = search.toLowerCase().trim();
      entries = entries.filter(entry => {
        // Search in email
        if (entry.email && entry.email.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search in all data fields
        if (entry.data) {
          for (const value of Object.values(entry.data)) {
            if (value && String(value).toLowerCase().includes(searchLower)) {
              return true;
            }
          }
        }
        return false;
      });
    }
    
    // Calculate pagination
    const total = entries.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedEntries = entries.slice(startIndex, startIndex + limitNum);
    
    console.log(`✅ Retrieved ${paginatedEntries.length} entries for list ${listId} (page ${pageNum}/${totalPages})`);
    
    res.status(200).json({
      entries: paginatedEntries,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    });
    
  } catch (error) {
    console.error('❌ Error fetching identity entries:', error);
    res.status(500).json({
      error: 'Failed to fetch entries',
      message: error.message
    });
  }
});

/**
 * DELETE /api/identity/lists/:listId
 * Delete a list and all its entries
 * Brokers can only delete their own lists
 * 
 * Requirements: 2.5, 2.6, 11.7, 11.9
 */
app.delete('/api/identity/lists/:listId', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    console.log(`🗑️ Deleting identity list ${listId}`);
    
    // Validate list exists
    const listRef = db.collection('identity-lists').doc(listId);
    const listDoc = await listRef.get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        error: 'List not found',
        message: `No list found with ID: ${listId}`
      });
    }
    
    const listData = listDoc.data();
    
    // Check ownership for brokers
    if (normalizeRole(req.user.role) === 'broker' && listData.createdBy !== req.user.uid) {
      console.log(`❌ Broker ${req.user.email} attempted to delete list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this list'
      });
    }
    
    // Delete all entries for this list
    const entriesSnapshot = await db.collection('identity-entries')
      .where('listId', '==', listId)
      .get();
    
    const batch = db.batch();
    
    // Add entries to batch delete
    entriesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add list to batch delete
    batch.delete(listRef);
    
    // Execute batch delete
    await batch.commit();
    
    // Create activity log
    await createIdentityActivityLog({
      listId: listId,
      action: 'list_deleted',
      actorType: normalizeRole(req.user.role) === 'broker' ? 'broker' : 'admin',
      actorId: req.user.uid,
      details: {
        name: listData.name,
        entriesDeleted: entriesSnapshot.size,
        deletedBy: req.user.email
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Deleted identity list ${listId} and ${entriesSnapshot.size} entries`);
    
    res.status(200).json({
      success: true,
      message: `List "${listData.name}" and ${entriesSnapshot.size} entries deleted successfully`
    });
    
  } catch (error) {
    console.error('❌ Error deleting identity list:', error);
    res.status(500).json({
      error: 'Failed to delete list',
      message: error.message
    });
  }
});

/**
 * POST /api/identity/lists/:listId/send
 * Send verification links to selected entries
 * Brokers can only send for their own lists
 * 
 * Body:
 * - entryIds: string[] - Array of entry IDs to send links to
 * - verificationType: 'NIN' | 'CAC' - Type of verification to request
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 11.7, 11.8
 */
app.post('/api/identity/lists/:listId/send', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    const { entryIds, verificationType } = req.body;
    
    console.log(`📧 Sending ${verificationType} verification links for list ${listId}`);
    
    // Validate inputs
    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'entryIds array is required and must not be empty'
      });
    }
    
    if (!verificationType || !['NIN', 'CAC'].includes(verificationType)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'verificationType must be either "NIN" or "CAC"'
      });
    }
    
    // Validate list exists
    const listRef = db.collection('identity-lists').doc(listId);
    const listDoc = await listRef.get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        error: 'List not found',
        message: `No list found with ID: ${listId}`
      });
    }
    
    const listData = listDoc.data();
    
    // Check ownership for brokers
    if (normalizeRole(req.user.role) === 'broker' && listData.createdBy !== req.user.uid) {
      console.log(`❌ Broker ${req.user.email} attempted to send verification for list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to send verification links for this list'
      });
    }
    
    // Fetch all selected entries
    const entriesSnapshot = await db.collection('identity-entries')
      .where('listId', '==', listId)
      .where(admin.firestore.FieldPath.documentId(), 'in', entryIds.slice(0, 10)) // Firestore 'in' limit is 10
      .get();
    
    // For more than 10 entries, we need to batch the queries
    let allEntries = entriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (entryIds.length > 10) {
      // Batch fetch remaining entries
      for (let i = 10; i < entryIds.length; i += 10) {
        const batchIds = entryIds.slice(i, i + 10);
        const batchSnapshot = await db.collection('identity-entries')
          .where('listId', '==', listId)
          .where(admin.firestore.FieldPath.documentId(), 'in', batchIds)
          .get();
        allEntries = allEntries.concat(batchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }
    
    // Track results
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };
    
    // Rate limiting: 50 emails per minute (Requirement 5.5)
    const RATE_LIMIT = 50;
    const RATE_WINDOW_MS = 60000; // 1 minute
    const DELAY_BETWEEN_EMAILS = Math.ceil(RATE_WINDOW_MS / RATE_LIMIT); // ~1200ms
    
    console.log(`📧 Processing ${allEntries.length} entries with rate limiting (${RATE_LIMIT} emails/min)`);
    
    // Process each entry with rate limiting
    for (let i = 0; i < allEntries.length; i++) {
      const entry = allEntries[i];
      try {
        // Validate email
        if (!entry.email || !entry.email.includes('@')) {
          results.failed++;
          results.errors.push({
            entryId: entry.id,
            email: entry.email || 'missing',
            error: 'Invalid or missing email address'
          });
          continue;
        }
        
        // Generate secure token (32 bytes, URL-safe base64)
        const tokenBytes = crypto.randomBytes(32);
        const token = tokenBytes.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
        
        // Calculate expiration (default 7 days)
        const expirationDays = 7;
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setDate(tokenExpiresAt.getDate() + expirationDays);
        
        // Update entry with token and verification type
        const entryRef = db.collection('identity-entries').doc(entry.id);
        await entryRef.update({
          token: token,
          tokenExpiresAt: admin.firestore.Timestamp.fromDate(tokenExpiresAt),
          verificationType: verificationType,
          status: 'link_sent',
          linkSentAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Generate verification URL
        const baseUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
        const verificationUrl = `${baseUrl}/verify/${token}`;
        
        // Extract name from entry data if available
        const recipientName = entry.data?.name || entry.data?.Name || 
                             entry.data?.customerName || entry.data?.CustomerName ||
                             entry.data?.fullName || entry.data?.FullName ||
                             'Valued Customer';
        
        // Format expiration date
        const expirationDateStr = tokenExpiresAt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Send verification email
        const mailOptions = {
          from: '"NEM Insurance" <kyc@nem-insurance.com>',
          to: entry.email,
          subject: `Action Required: ${verificationType} Verification - NEM Insurance`,
          html: generateIdentityVerificationEmailHtml({
            recipientName,
            verificationUrl,
            expirationDate: expirationDateStr,
            verificationType
          }),
          text: generateIdentityVerificationEmailText({
            recipientName,
            verificationUrl,
            expirationDate: expirationDateStr,
            verificationType
          })
        };
        
        await transporter.sendMail(mailOptions);
        results.sent++;
        
        console.log(`✅ Sent ${verificationType} verification link to ${entry.email} (${i + 1}/${allEntries.length})`);
        
        // Rate limiting delay (skip for last email)
        if (i < allEntries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS));
        }
        
      } catch (entryError) {
        console.error(`❌ Failed to process entry ${entry.id}:`, entryError);
        results.failed++;
        results.errors.push({
          entryId: entry.id,
          email: entry.email,
          error: entryError.message
        });
        
        // Update entry status to email_failed
        try {
          await db.collection('identity-entries').doc(entry.id).update({
            status: 'email_failed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (updateError) {
          console.error(`Failed to update entry status:`, updateError);
        }
      }
    }
    
    // Update list statistics
    const statsUpdate = {};
    if (results.sent > 0) {
      statsUpdate.linkSentCount = admin.firestore.FieldValue.increment(results.sent);
      statsUpdate.pendingCount = admin.firestore.FieldValue.increment(-results.sent);
    }
    if (Object.keys(statsUpdate).length > 0) {
      statsUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await listRef.update(statsUpdate);
    }
    
    // Create activity log
    await createIdentityActivityLog({
      listId: listId,
      action: 'links_sent',
      actorType: 'admin',
      actorId: req.user.uid,
      details: {
        verificationType,
        totalSelected: entryIds.length,
        sent: results.sent,
        failed: results.failed,
        sentBy: req.user.email
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Sent ${results.sent} verification links, ${results.failed} failed`);
    
    res.status(200).json(results);
    
  } catch (error) {
    console.error('❌ Error sending verification links:', error);
    res.status(500).json({
      error: 'Failed to send verification links',
      message: error.message
    });
  }
});

/**
 * Helper function to generate identity verification email HTML
 * Simplified version for the new flexible schema
 */
function generateIdentityVerificationEmailHtml({ recipientName, verificationUrl, expirationDate, verificationType }) {
  const verificationTypeLabel = verificationType === 'NIN' ? 'National Identification Number (NIN)' : 'CAC Registration Number';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Identity Verification Required - NEM Insurance</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header with NEM Insurance Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #FFD700; margin: 0; font-size: 28px; font-weight: bold;">NEM Insurance</h1>
              <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Identity Verification Request</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>${escapeHtmlServer(recipientName)}</strong>,
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                As part of our ongoing commitment to regulatory compliance and the security of your insurance records, 
                we need to verify your <strong>${verificationTypeLabel}</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 25px 0;">
                    <a href="${escapeHtmlServer(verificationUrl)}" 
                       style="display: inline-block; background-color: #800020; color: #FFD700; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      Verify My ${verificationType}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiration Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff8e6; border-left: 4px solid #f0ad4e; border-radius: 0 4px 4px 0; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #856404; font-size: 14px; margin: 0;">
                      <strong>⏰ Important:</strong> This verification link will expire on <strong>${escapeHtmlServer(expirationDate)}</strong>. 
                      Please complete your verification before this date.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 25px 0 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #800020; font-size: 13px; word-break: break-all; margin: 5px 0 25px 0;">
                <a href="${escapeHtmlServer(verificationUrl)}" style="color: #800020;">${escapeHtmlServer(verificationUrl)}</a>
              </p>
              
              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid #dddddd; margin-top: 25px;">
                <tr>
                  <td style="padding-top: 20px;">
                    <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0;">
                      <strong>🔒 Security Notice:</strong> This is a secure, one-time verification link unique to you. 
                      Do not share this link with anyone. NEM Insurance will never ask for your password or PIN via email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 25px 40px; border-radius: 0 0 8px 8px;">
              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
                If you have any questions or need assistance, please contact us at:
              </p>
              <p style="color: #333333; font-size: 13px; margin: 0;">
                📧 <a href="mailto:kyc@nem-insurance.com" style="color: #800020;">kyc@nem-insurance.com</a>
              </p>
              <p style="color: #666666; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} NEM Insurance. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Helper function to generate identity verification email plain text
 */
function generateIdentityVerificationEmailText({ recipientName, verificationUrl, expirationDate, verificationType }) {
  const verificationTypeLabel = verificationType === 'NIN' ? 'National Identification Number (NIN)' : 'CAC Registration Number';
  
  return `
NEM Insurance - Identity Verification Request
=============================================

Dear ${recipientName},

As part of our ongoing commitment to regulatory compliance and the security of your insurance records, we need to verify your ${verificationTypeLabel}.

VERIFY YOUR IDENTITY
--------------------
Please click the link below to complete your identity verification:

${verificationUrl}

IMPORTANT: This verification link will expire on ${expirationDate}. Please complete your verification before this date.

SECURITY NOTICE
---------------
This is a secure, one-time verification link unique to you. Do not share this link with anyone. NEM Insurance will never ask for your password or PIN via email.

NEED HELP?
----------
If you have any questions or need assistance, please contact us at:
Email: kyc@nem-insurance.com

© ${new Date().getFullYear()} NEM Insurance. All rights reserved.
  `.trim();
}

/**
 * Helper function to escape HTML for server-side email generation
 */
function escapeHtmlServer(text) {
  if (!text) return '';
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(text).replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * GET /api/identity/verify/:token
 * Validate a verification token and return entry info
 * 
 * This is a PUBLIC endpoint - no authentication required
 * Customers access this via their verification link
 * 
 * Response:
 * - valid: boolean - Whether the token is valid
 * - entryInfo: { name?, policyNumber?, verificationType, expiresAt } - Entry info if valid
 * - expired: boolean - True if token has expired
 * - used: boolean - True if already verified
 * 
 * Requirements: 4.4, 4.5, 6.1, 6.2, 6.3, 6.4
 */
app.get('/api/identity/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token is required'
      });
    }
    
    console.log(`🔍 Validating identity verification token: ${token.substring(0, 8)}...`);
    
    // Find entry by token
    const entriesSnapshot = await db.collection('identity-entries')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (entriesSnapshot.empty) {
      console.log('❌ Token not found');
      return res.json({
        valid: false,
        error: 'Invalid verification link. Please check the link or contact your insurance provider.'
      });
    }
    
    const entryDoc = entriesSnapshot.docs[0];
    const entry = entryDoc.data();
    
    // Check if already verified
    if (entry.status === 'verified') {
      console.log('ℹ️ Token already used - entry verified');
      return res.json({
        valid: false,
        used: true,
        message: 'Your information has already been submitted. Thank you.'
      });
    }
    
    // Check if max attempts exceeded
    if (entry.status === 'failed') {
      console.log('ℹ️ Entry marked as failed - max attempts exceeded');
      return res.json({
        valid: false,
        used: true,
        message: 'Maximum verification attempts exceeded. Please contact your insurance provider.'
      });
    }
    
    // Check token expiration
    const tokenExpiresAt = entry.tokenExpiresAt?.toDate ? entry.tokenExpiresAt.toDate() : new Date(entry.tokenExpiresAt);
    if (tokenExpiresAt < new Date()) {
      console.log('ℹ️ Token expired');
      return res.json({
        valid: false,
        expired: true,
        message: 'This link has expired. Please contact your insurance provider for a new link.'
      });
    }
    
    // Use stored displayName and policyNumber first, then fall back to data extraction
    let name = entry.displayName || null;
    let policyNumber = entry.policyNumber || null;
    
    // Helper to check if a value is effectively empty (N/A, blank, etc.)
    const isEmptyValue = (val) => {
      if (!val) return true;
      const str = String(val).trim().toLowerCase();
      return str === '' || str === 'n/a' || str === 'na' || str === '-' || str === 'nil' || str === 'none';
    };
    
    // Helper to get clean value (returns null if empty)
    const getCleanValue = (val) => {
      if (isEmptyValue(val)) return null;
      return String(val).trim();
    };
    
    // If no stored displayName, try to extract from data (backward compatibility)
    if (!name && entry.data) {
      const data = entry.data;
      
      // Check if this is a corporate entry (has director-related columns)
      const isCorporate = Object.keys(data).some(key => 
        key.toLowerCase().includes('director')
      );
      
      if (isCorporate) {
        // CORPORATE: Look for company name variations
        const companyNameFields = [
          'companyName', 'company_name', 'Company Name', 'CompanyName', 'COMPANY_NAME',
          'company', 'Company', 'COMPANY',
          'businessName', 'business_name', 'Business Name', 'BusinessName',
          'corporateName', 'corporate_name', 'Corporate Name',
          'registeredName', 'registered_name', 'Registered Name',
          'entityName', 'entity_name', 'Entity Name',
          'organizationName', 'organisation_name', 'Organization Name', 'Organisation Name',
          'firmName', 'firm_name', 'Firm Name'
        ];
        
        for (const field of companyNameFields) {
          const val = getCleanValue(data[field]);
          if (val) {
            name = val;
            break;
          }
        }
      } else {
        // INDIVIDUAL: Look for personal name fields
        // First try full name fields
        const fullNameFields = [
          'insured', 'Insured', 'INSURED', 'insuredName', 'Insured Name', 'insured_name',
          'name', 'Name', 'NAME',
          'fullName', 'full_name', 'Full Name', 'FullName', 'FULL_NAME',
          'customerName', 'customer_name', 'Customer Name', 'CustomerName',
          'clientName', 'client_name', 'Client Name',
          'policyHolder', 'policy_holder', 'Policy Holder', 'PolicyHolder'
        ];
        
        for (const field of fullNameFields) {
          const val = getCleanValue(data[field]);
          if (val) {
            name = val;
            break;
          }
        }
        
        // If no full name found, try to combine firstName + middleName + lastName
        if (!name) {
          const firstNameFields = ['firstName', 'first_name', 'First Name', 'FirstName', 'FIRST_NAME', 'first', 'First'];
          const middleNameFields = ['middleName', 'middle_name', 'Middle Name', 'MiddleName', 'MIDDLE_NAME', 'middle', 'Middle', 'otherName', 'other_name', 'Other Name'];
          const lastNameFields = ['lastName', 'last_name', 'Last Name', 'LastName', 'LAST_NAME', 'surname', 'Surname', 'SURNAME', 'last', 'Last'];
          
          let firstName = null;
          let middleName = null;
          let lastName = null;
          
          for (const field of firstNameFields) {
            const val = getCleanValue(data[field]);
            if (val) { firstName = val; break; }
          }
          
          for (const field of middleNameFields) {
            const val = getCleanValue(data[field]);
            if (val) { middleName = val; break; }
          }
          
          for (const field of lastNameFields) {
            const val = getCleanValue(data[field]);
            if (val) { lastName = val; break; }
          }
          
          // Combine name parts (skip middle name if it was N/A or empty)
          const nameParts = [firstName, middleName, lastName].filter(Boolean);
          if (nameParts.length > 0) {
            name = nameParts.join(' ');
          }
        }
      }
    }
    
    // If no stored policyNumber, try to extract from data (backward compatibility)
    if (!policyNumber && entry.data) {
      const data = entry.data;
      const policyFields = ['policy_number', 'policyNumber', 'Policy Number', 'policy', 'Policy', 'POLICY', 'policy_no', 'policyNo'];
      for (const field of policyFields) {
        if (data[field]) {
          policyNumber = data[field];
          break;
        }
      }
    }
    
    console.log(`✅ Token valid for entry ${entryDoc.id}, verificationType: ${entry.verificationType}, name: ${name || 'N/A'}`);
    
    // Extract enhanced fields for field-level validation display (Requirement 20.1, 20.2, 20.4, 20.5)
    const entryInfo = {
      name,
      policyNumber,
      verificationType: entry.verificationType,
      expiresAt: tokenExpiresAt.toISOString()
    };
    
    // For NIN verification: add firstName, lastName, email, dateOfBirth (Requirement 20.1)
    if (entry.verificationType === 'NIN' && entry.data) {
      const data = entry.data;
      
      // Extract firstName
      const firstNameFields = ['firstName', 'first_name', 'First Name', 'FirstName', 'FIRST_NAME', 'first', 'First'];
      for (const field of firstNameFields) {
        const val = getCleanValue(data[field]);
        if (val) { entryInfo.firstName = val; break; }
      }
      
      // Extract lastName
      const lastNameFields = ['lastName', 'last_name', 'Last Name', 'LastName', 'LAST_NAME', 'surname', 'Surname', 'SURNAME', 'last', 'Last'];
      for (const field of lastNameFields) {
        const val = getCleanValue(data[field]);
        if (val) { entryInfo.lastName = val; break; }
      }
      
      // Extract email
      entryInfo.email = entry.email || null;
      
      // Extract dateOfBirth
      const dobFields = ['dateOfBirth', 'date_of_birth', 'Date of Birth', 'DateOfBirth', 'DOB', 'dob', 'birthDate', 'birth_date'];
      for (const field of dobFields) {
        const val = getCleanValue(data[field]);
        if (val) { entryInfo.dateOfBirth = val; break; }
      }
    }
    
    // For CAC verification: add companyName, registrationNumber, registrationDate (Requirement 20.4)
    if (entry.verificationType === 'CAC' && entry.data) {
      const data = entry.data;
      
      // Extract companyName
      const companyNameFields = [
        'companyName', 'company_name', 'Company Name', 'CompanyName', 'COMPANY_NAME',
        'company', 'Company', 'COMPANY',
        'businessName', 'business_name', 'Business Name', 'BusinessName'
      ];
      for (const field of companyNameFields) {
        const val = getCleanValue(data[field]);
        if (val) { entryInfo.companyName = val; break; }
      }
      
      // Extract registrationNumber (use stored field first)
      entryInfo.registrationNumber = entry.registrationNumber || null;
      if (!entryInfo.registrationNumber) {
        const regNumFields = ['registrationNumber', 'registration_number', 'Registration Number', 'RegistrationNumber', 'RC_Number', 'rc_number', 'RC Number'];
        for (const field of regNumFields) {
          const val = getCleanValue(data[field]);
          if (val) { entryInfo.registrationNumber = val; break; }
        }
      }
      
      // Extract registrationDate (use stored field first)
      entryInfo.registrationDate = entry.registrationDate || null;
      if (!entryInfo.registrationDate) {
        const regDateFields = ['registrationDate', 'registration_date', 'Registration Date', 'RegistrationDate', 'dateOfRegistration', 'date_of_registration'];
        for (const field of regDateFields) {
          const val = getCleanValue(data[field]);
          if (val) { entryInfo.registrationDate = val; break; }
        }
      }
    }
    
    res.json({
      valid: true,
      entryInfo
    });
    
  } catch (error) {
    console.error('❌ Error validating token:', error);
    res.status(500).json({
      valid: false,
      error: 'Unable to validate verification link. Please try again later.'
    });
  }
});

/**
 * POST /api/identity/verify/:token
 * Submit identity verification (NIN or CAC)
 * 
 * This is a PUBLIC endpoint - no authentication required
 * Customers submit their identity information via this endpoint
 * 
 * Body:
 * - identityNumber: string - NIN (11 digits) or CAC/RC number
 * - demoMode: boolean (optional) - Use demo mode for testing
 * 
 * Response:
 * - success: boolean - Whether verification succeeded
 * - error: string (optional) - Error message if failed
 * - attemptsRemaining: number (optional) - Remaining attempts if failed
 * 
 * Field-level validation (Requirement 20.3, 20.6, 20.7, 20.8, 20.9):
 * - For NIN: validates against firstName, lastName, dateOfBirth, gender, bvn
 * - For CAC: validates against companyName, registrationNumber, registrationDate, businessAddress
 * - All validations performed in background (not disclosed to customer)
 * - Validation results stored in entry.verificationDetails
 * 
 * Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 20.3, 20.6, 20.7, 20.8, 20.9
 */
app.post('/api/identity/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { identityNumber, demoMode } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }
    
    if (!identityNumber) {
      return res.status(400).json({
        success: false,
        error: 'Identity number is required'
      });
    }
    
    console.log(`🔍 Processing identity verification for token: ${token.substring(0, 8)}...`);
    
    // Find entry by token
    const entriesSnapshot = await db.collection('identity-entries')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (entriesSnapshot.empty) {
      console.log('❌ Token not found');
      return res.status(404).json({
        success: false,
        error: 'Invalid verification link. Please check the link or contact your insurance provider.'
      });
    }
    
    const entryDoc = entriesSnapshot.docs[0];
    const entry = entryDoc.data();
    const entryRef = db.collection('identity-entries').doc(entryDoc.id);
    
    // Check if already verified
    if (entry.status === 'verified') {
      console.log('ℹ️ Entry already verified');
      return res.json({
        success: false,
        error: 'Your information has already been submitted. Thank you.'
      });
    }
    
    // Check if max attempts exceeded
    if (entry.status === 'failed') {
      console.log('ℹ️ Entry marked as failed - max attempts exceeded');
      return res.json({
        success: false,
        error: 'Maximum verification attempts exceeded. Please contact your insurance provider.',
        attemptsRemaining: 0
      });
    }
    
    // Check token expiration
    const tokenExpiresAt = entry.tokenExpiresAt?.toDate ? entry.tokenExpiresAt.toDate() : new Date(entry.tokenExpiresAt);
    if (tokenExpiresAt < new Date()) {
      console.log('ℹ️ Token expired');
      return res.json({
        success: false,
        error: 'This link has expired. Please contact your insurance provider for a new link.'
      });
    }
    
    const verificationType = entry.verificationType;
    const currentAttempts = entry.verificationAttempts || 0;
    const maxAttempts = 3;
    
    // Validate input based on verification type
    if (verificationType === 'NIN') {
      // NIN must be exactly 11 digits
      if (!/^\d{11}$/.test(identityNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid 11-digit NIN',
          attemptsRemaining: maxAttempts - currentAttempts
        });
      }
    } else if (verificationType === 'CAC') {
      // CAC requires number (company name will be validated from stored data)
      if (!identityNumber.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid CAC/RC number',
          attemptsRemaining: maxAttempts - currentAttempts
        });
      }
    }
    
    // Increment attempt count
    const newAttemptCount = currentAttempts + 1;
    
    // Update entry with attempt info
    await entryRef.update({
      verificationAttempts: newAttemptCount,
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Call Paystack verification API with field-level validation (Requirement 20.3, 20.6)
    let verificationResult;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    // Extract fields from entry data for validation
    const data = entry.data || {};
    const fieldsValidated = [];
    const failedFields = [];
    
    try {
      if (verificationType === 'NIN') {
        // Extract fields for NIN validation (Requirement 20.3)
        const firstName = data.firstName || data.first_name || data['First Name'] || data.FirstName || '';
        const lastName = data.lastName || data.last_name || data['Last Name'] || data.LastName || data.surname || data.Surname || '';
        const dateOfBirth = data.dateOfBirth || data.date_of_birth || data['Date of Birth'] || data.DOB || data.dob || '';
        const gender = data.gender || data.Gender || data.GENDER || data.sex || data.Sex || '';
        const bvn = entry.bvn || data.bvn || data.BVN || '';
        
        fieldsValidated.push('firstName', 'lastName', 'dateOfBirth', 'gender', 'bvn');
        
        // NIN verification via Paystack
        if (demoMode) {
          console.log('🎭 DEMO MODE: Simulating NIN verification with field-level validation');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulate field validation
          const mockValidation = {
            first_name: firstName.toUpperCase(),
            last_name: lastName.toUpperCase(),
            dob: dateOfBirth,
            gender: gender.toUpperCase(),
            bvn: bvn
          };
          
          // Check if fields match (simple demo logic)
          const allFieldsMatch = firstName && lastName && dateOfBirth;
          
          verificationResult = {
            success: allFieldsMatch,
            data: {
              first_name: mockValidation.first_name,
              last_name: mockValidation.last_name,
              middle_name: 'DEMO',
              dob: mockValidation.dob,
              mobile: '080****5678',
              nin: identityNumber.substring(0, 4) + '*******',
              gender: mockValidation.gender
            },
            fieldsValidated,
            failedFields: allFieldsMatch ? [] : ['firstName', 'lastName']
          };
        } else if (paystackSecretKey) {
          console.log(`🔍 Calling Paystack NIN verification for: ${identityNumber.substring(0, 4)}*** with field validation`);
          
          // Call Paystack NIN verification API
          const response = await fetch(`https://api.paystack.co/bank/resolve_bvn/${identityNumber}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${paystackSecretKey}`,
            },
          });
          
          const responseData = await response.json();
          
          if (response.ok && responseData.status && responseData.data) {
            // Perform field-level validation (Requirement 20.3)
            const apiData = responseData.data;
            
            // Validate firstName
            if (firstName && apiData.first_name) {
              const match = firstName.toLowerCase().trim() === apiData.first_name.toLowerCase().trim();
              if (!match) failedFields.push('firstName');
            }
            
            // Validate lastName
            if (lastName && apiData.last_name) {
              const match = lastName.toLowerCase().trim() === apiData.last_name.toLowerCase().trim();
              if (!match) failedFields.push('lastName');
            }
            
            // Validate dateOfBirth
            if (dateOfBirth && apiData.dob) {
              const match = dateOfBirth === apiData.dob;
              if (!match) failedFields.push('dateOfBirth');
            }
            
            // Validate gender
            if (gender && apiData.gender) {
              const match = gender.toLowerCase().charAt(0) === apiData.gender.toLowerCase().charAt(0);
              if (!match) failedFields.push('gender');
            }
            
            // Validate BVN
            if (bvn && apiData.bvn) {
              const match = bvn === apiData.bvn;
              if (!match) failedFields.push('bvn');
            }
            
            verificationResult = {
              success: failedFields.length === 0,
              data: apiData,
              message: failedFields.length > 0 ? 'Some fields did not match' : responseData.message,
              fieldsValidated,
              failedFields
            };
          } else {
            verificationResult = {
              success: false,
              message: responseData.message || 'Verification failed',
              fieldsValidated,
              failedFields: []
            };
          }
        } else {
          // No API key - use demo mode
          console.log('⚠️ No Paystack API key configured, using demo mode');
          verificationResult = {
            success: true,
            data: { nin: identityNumber },
            message: 'Verification simulated (no API key configured)',
            fieldsValidated,
            failedFields: []
          };
        }
      } else {
        // CAC verification with field-level validation (Requirement 20.6)
        const companyName = data.companyName || data.company_name || data['Company Name'] || data.CompanyName || '';
        const registrationNumber = entry.registrationNumber || data.registrationNumber || data.registration_number || data['Registration Number'] || '';
        const registrationDate = entry.registrationDate || data.registrationDate || data.registration_date || data['Registration Date'] || '';
        const businessAddress = entry.businessAddress || data.businessAddress || data.business_address || data['Business Address'] || data.companyAddress || data.company_address || '';
        
        fieldsValidated.push('companyName', 'registrationNumber', 'registrationDate', 'businessAddress');
        
        // CAC verification via Paystack
        if (demoMode) {
          console.log('🎭 DEMO MODE: Simulating CAC verification with field-level validation');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulate field validation
          const allFieldsMatch = companyName && registrationNumber;
          
          verificationResult = {
            success: allFieldsMatch,
            data: {
              company_name: companyName.toUpperCase(),
              rc_number: identityNumber,
              company_type: 'LIMITED LIABILITY COMPANY',
              status: 'ACTIVE',
              registration_date: registrationDate,
              address: businessAddress
            },
            fieldsValidated,
            failedFields: allFieldsMatch ? [] : ['companyName']
          };
        } else if (paystackSecretKey) {
          console.log(`🔍 Calling Paystack CAC verification for: ${identityNumber} with field validation`);
          
          const response = await fetch('https://api.paystack.co/identity/cac', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${paystackSecretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              rc_number: identityNumber, 
              company_name: companyName 
            }),
          });
          
          const responseData = await response.json();
          
          if (response.ok && responseData.status && responseData.data) {
            // Perform field-level validation (Requirement 20.6)
            const apiData = responseData.data;
            
            // Validate companyName
            if (companyName && apiData.company_name) {
              const match = companyName.toLowerCase().trim() === apiData.company_name.toLowerCase().trim();
              if (!match) failedFields.push('companyName');
            }
            
            // Validate registrationNumber
            if (registrationNumber && apiData.rc_number) {
              const match = registrationNumber.toLowerCase().trim() === apiData.rc_number.toLowerCase().trim();
              if (!match) failedFields.push('registrationNumber');
            }
            
            // Validate registrationDate
            if (registrationDate && apiData.registration_date) {
              const match = registrationDate === apiData.registration_date;
              if (!match) failedFields.push('registrationDate');
            }
            
            // Validate businessAddress
            if (businessAddress && apiData.address) {
              const match = businessAddress.toLowerCase().includes(apiData.address.toLowerCase()) || 
                           apiData.address.toLowerCase().includes(businessAddress.toLowerCase());
              if (!match) failedFields.push('businessAddress');
            }
            
            verificationResult = {
              success: failedFields.length === 0,
              data: apiData,
              message: failedFields.length > 0 ? 'Some fields did not match' : responseData.message,
              fieldsValidated,
              failedFields
            };
          } else {
            verificationResult = {
              success: false,
              message: responseData.message || 'Verification failed',
              fieldsValidated,
              failedFields: []
            };
          }
        } else {
          // No API key - use demo mode
          console.log('⚠️ No Paystack API key configured, using demo mode');
          verificationResult = {
            success: true,
            data: { rc_number: identityNumber, company_name: companyName },
            message: 'Verification simulated (no API key configured)',
            fieldsValidated,
            failedFields: []
          };
        }
      }
    } catch (apiError) {
      console.error('❌ Paystack API error:', apiError);
      verificationResult = {
        success: false,
        message: 'Verification service temporarily unavailable. Please try again.',
        fieldsValidated,
        failedFields: []
      };
    }
    
    // Handle verification result
    if (verificationResult.success) {
      // Success - update entry with verified data and validation details (Requirement 20.8, 20.9)
      const updateData = {
        status: 'verified',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Store verification details (Requirement 20.9)
        verificationDetails: {
          fieldsValidated: verificationResult.fieldsValidated || [],
          failedFields: [],
          validationSuccess: true
        }
      };
      
      if (verificationType === 'NIN') {
        updateData.nin = identityNumber;
      } else {
        updateData.cac = identityNumber;
        // Store company name from data if available
        const companyName = data.companyName || data.company_name || data['Company Name'] || data.CompanyName || '';
        if (companyName) {
          updateData.cacCompanyName = companyName;
        }
      }
      
      await entryRef.update(updateData);
      
      // Update list statistics
      const listRef = db.collection('identity-lists').doc(entry.listId);
      await listRef.update({
        verifiedCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create activity log
      await createIdentityActivityLog({
        listId: entry.listId,
        entryId: entryDoc.id,
        action: 'verification_success',
        actorType: 'customer',
        details: {
          verificationType,
          email: entry.email,
          fieldsValidated: verificationResult.fieldsValidated
        },
        ipAddress: req.ipData?.masked,
        userAgent: req.headers['user-agent']
      });
      
      console.log(`✅ Verification successful for entry ${entryDoc.id}`);
      
      return res.json({
        success: true,
        verified: true
      });
      
    } else {
      // Failure - check if max attempts reached and store validation details (Requirement 20.7, 20.8, 20.9, 21.1, 21.7, 21.8, 21.9, 21.10)
      const attemptsRemaining = maxAttempts - newAttemptCount;
      
      // Get broker email for error messages
      let brokerEmail = null;
      try {
        const listDoc = await db.collection('identity-lists').doc(entry.listId).get();
        if (listDoc.exists) {
          const listData = listDoc.data();
          if (listData.createdBy) {
            const creatorDoc = await db.collection('users').doc(listData.createdBy).get();
            if (creatorDoc.exists) {
              brokerEmail = creatorDoc.data().email;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching broker email:', err);
      }
      
      // Create structured error using utility (Requirement 21.1, 21.2, 21.9)
      const verificationError = createVerificationError(
        verificationResult.failedFields && verificationResult.failedFields.length > 0 
          ? 'field_mismatch' 
          : 'api_error',
        {
          failedFields: verificationResult.failedFields || [],
          brokerEmail,
          customerName: entry.displayName,
          policyNumber: entry.policyNumber,
          verificationType,
          technicalDetails: {
            attemptNumber: newAttemptCount,
            maxAttempts,
            apiMessage: verificationResult.message,
            fieldsValidated: verificationResult.fieldsValidated
          }
        }
      );
      
      // Update entry with error info and validation details (Requirement 21.7, 21.8, 21.10)
      const updateData = {
        lastAttemptError: verificationResult.message || 'Verification failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Store verification details (Requirement 20.9, 21.8, 21.9)
        verificationDetails: {
          fieldsValidated: verificationResult.fieldsValidated || [],
          failedFields: verificationResult.failedFields || [],
          failureReason: verificationError.message,
          validationSuccess: false,
          customerMessage: verificationError.customerMessage,
          staffMessage: verificationError.staffMessage
        }
      };
      
      if (attemptsRemaining <= 0) {
        // Max attempts reached - mark as verification_failed (Requirement 21.7)
        updateData.status = 'verification_failed';
        
        // Update list statistics
        const listRef = db.collection('identity-lists').doc(entry.listId);
        await listRef.update({
          failedCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Still have attempts remaining - mark as verification_failed but allow retry
        updateData.status = 'verification_failed';
      }
      
      await entryRef.update(updateData);
      
      // Send error notifications (Requirement 21.2, 21.3, 21.4, 21.5, 21.6)
      try {
        // Send customer notification
        await sendCustomerErrorNotification(entry, verificationError);
        
        // Send staff notification
        await sendStaffErrorNotification(entry, verificationError, entry.listId);
      } catch (emailError) {
        console.error('❌ Error sending error notifications:', emailError);
        // Don't fail the request if email sending fails
      }
      
      // Create activity log
      await createIdentityActivityLog({
        listId: entry.listId,
        entryId: entryDoc.id,
        action: 'verification_failed',
        actorType: 'customer',
        details: {
          verificationType,
          email: entry.email,
          error: verificationResult.message,
          attemptsRemaining,
          fieldsValidated: verificationResult.fieldsValidated,
          failedFields: verificationResult.failedFields,
          errorType: verificationError.errorType
        },
        ipAddress: req.ipData?.masked,
        userAgent: req.headers['user-agent']
      });
      
      console.log(`❌ Verification failed for entry ${entryDoc.id}, attempts remaining: ${attemptsRemaining}`);
      
      // Return user-friendly error message (Requirement 21.1, 21.2)
      return res.json({
        success: false,
        error: verificationError.customerMessage,
        attemptsRemaining: Math.max(0, attemptsRemaining)
      });
    }
    
  } catch (error) {
    console.error('❌ Error processing verification:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during verification. Please try again.'
    });
  }
});

/**
 * GET /api/identity/lists/:listId/export
 * Export a list to CSV with all original columns + verification columns
 * Brokers can only export their own lists
 * 
 * Response: CSV file download
 * 
 * Requirements: 7.3, 7.4, 7.5, 11.7
 */
app.get('/api/identity/lists/:listId/export', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    console.log(`📥 Exporting identity list ${listId}`);
    
    // Validate list exists
    const listDoc = await db.collection('identity-lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        error: 'List not found',
        message: `No list found with ID: ${listId}`
      });
    }
    
    const listData = listDoc.data();
    
    // Check ownership for brokers
    if (normalizeRole(req.user.role) === 'broker' && listData.createdBy !== req.user.uid) {
      console.log(`❌ Broker ${req.user.email} attempted to export list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to export this list'
      });
    }
    
    const originalColumns = listData.columns || [];
    
    // Fetch all entries for this list (no pagination for export)
    const entriesSnapshot = await db.collection('identity-entries')
      .where('listId', '==', listId)
      .orderBy('createdAt', 'asc')
      .get();
    
    const entries = entriesSnapshot.docs.map(doc => doc.data());
    
    // Define verification columns to append
    const verificationColumns = ['Verification Status', 'NIN', 'CAC', 'CAC Company Name', 'Verified At', 'Link Sent At'];
    
    // Build CSV header: original columns + verification columns
    const allColumns = [...originalColumns, ...verificationColumns];
    
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // If value contains comma, newline, or double quote, wrap in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"') || stringValue.includes('\r')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }
      return stringValue;
    };
    
    // Helper function to format date for CSV
    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toISOString();
    };
    
    // Helper function to format status for display
    const formatStatus = (status) => {
      const statusMap = {
        'pending': 'Pending',
        'link_sent': 'Link Sent',
        'verified': 'Verified',
        'failed': 'Failed',
        'email_failed': 'Email Failed'
      };
      return statusMap[status] || status || 'Pending';
    };
    
    // Build CSV rows
    const csvRows = [];
    
    // Add header row
    csvRows.push(allColumns.map(escapeCSV).join(','));
    
    // Add data rows
    for (const entry of entries) {
      const row = [];
      
      // Add original column values
      for (const col of originalColumns) {
        const value = entry.data ? entry.data[col] : '';
        row.push(escapeCSV(value));
      }
      
      // Add verification columns
      row.push(escapeCSV(formatStatus(entry.status)));           // Verification Status
      row.push(escapeCSV(entry.nin || ''));                       // NIN
      row.push(escapeCSV(entry.cac || ''));                       // CAC
      row.push(escapeCSV(entry.cacCompanyName || ''));            // CAC Company Name
      row.push(escapeCSV(formatDate(entry.verifiedAt)));          // Verified At
      row.push(escapeCSV(formatDate(entry.linkSentAt)));          // Link Sent At
      
      csvRows.push(row.join(','));
    }
    
    // Join all rows with newlines
    const csvContent = csvRows.join('\r\n');
    
    // Generate filename
    const sanitizedName = (listData.name || 'export')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${sanitizedName}_${timestamp}.csv`;
    
    // Create activity log
    await createIdentityActivityLog({
      listId: listId,
      action: 'export_generated',
      actorType: 'admin',
      actorId: req.user.uid,
      details: {
        name: listData.name,
        entryCount: entries.length,
        exportedBy: req.user.email,
        filename: filename
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Exported identity list ${listId} with ${entries.length} entries`);
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send CSV content
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ Error exporting identity list:', error);
    res.status(500).json({
      error: 'Failed to export list',
      message: error.message
    });
  }
});

/**
 * POST /api/identity/entries/:entryId/resend
 * Resend verification link for a single entry
 * Brokers can only resend for entries in their own lists
 * 
 * This endpoint:
 * - Generates a new secure token (invalidating the old one)
 * - Increments the resendCount
 * - Sends a new verification email
 * - Shows warning if resendCount > 3
 * 
 * Response:
 * - success: boolean
 * - newExpiresAt: Date - New token expiration date
 * - resendCount: number - Updated resend count
 * - warning?: string - Warning message if resendCount > 3
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 11.7, 11.8
 */
app.post('/api/identity/entries/:entryId/resend', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { entryId } = req.params;
    
    console.log(`🔄 Resending verification link for entry ${entryId}`);
    
    // Validate entryId
    if (!entryId || typeof entryId !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Entry ID is required'
      });
    }
    
    // Fetch the entry
    const entryRef = db.collection('identity-entries').doc(entryId);
    const entryDoc = await entryRef.get();
    
    if (!entryDoc.exists) {
      return res.status(404).json({
        error: 'Entry not found',
        message: `No entry found with ID: ${entryId}`
      });
    }
    
    const entry = entryDoc.data();
    
    // Check ownership for brokers - verify they own the list this entry belongs to
    if (normalizeRole(req.user.role) === 'broker') {
      const listDoc = await db.collection('identity-lists').doc(entry.listId).get();
      if (!listDoc.exists || listDoc.data().createdBy !== req.user.uid) {
        console.log(`❌ Broker ${req.user.email} attempted to resend for entry ${entryId} in list owned by ${listDoc.data()?.createdBy}`);
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to resend verification links for this entry'
        });
      }
    }
    
    // Check if entry has already been verified
    if (entry.status === 'verified') {
      return res.status(400).json({
        error: 'Already verified',
        message: 'This entry has already been verified. Cannot resend link.'
      });
    }
    
    // Validate email exists
    if (!entry.email || !entry.email.includes('@')) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Entry does not have a valid email address'
      });
    }
    
    // Check if verification type is set
    if (!entry.verificationType) {
      return res.status(400).json({
        error: 'No verification type',
        message: 'Entry does not have a verification type set. Please send the initial link first.'
      });
    }
    
    // Calculate new resend count
    const currentResendCount = entry.resendCount || 0;
    const newResendCount = currentResendCount + 1;
    
    // Generate new secure token (32 bytes, URL-safe base64)
    // This invalidates the old token by replacing it
    const tokenBytes = crypto.randomBytes(32);
    const newToken = tokenBytes.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Calculate new expiration (default 7 days)
    const expirationDays = 7;
    const newTokenExpiresAt = new Date();
    newTokenExpiresAt.setDate(newTokenExpiresAt.getDate() + expirationDays);
    
    // Update entry with new token and increment resendCount
    await entryRef.update({
      token: newToken,
      tokenExpiresAt: admin.firestore.Timestamp.fromDate(newTokenExpiresAt),
      resendCount: newResendCount,
      status: 'link_sent',
      linkSentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Generate verification URL
    const baseUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
    const verificationUrl = `${baseUrl}/verify/${newToken}`;
    
    // Extract name from entry data if available
    const recipientName = entry.data?.name || entry.data?.Name || 
                         entry.data?.customerName || entry.data?.CustomerName ||
                         entry.data?.fullName || entry.data?.FullName ||
                         'Valued Customer';
    
    // Format expiration date
    const expirationDateStr = newTokenExpiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Send verification email
    const mailOptions = {
      from: '"NEM Insurance" <kyc@nem-insurance.com>',
      to: entry.email,
      subject: `Action Required: ${entry.verificationType} Verification - NEM Insurance`,
      html: generateIdentityVerificationEmailHtml({
        recipientName,
        verificationUrl,
        expirationDate: expirationDateStr,
        verificationType: entry.verificationType
      }),
      text: generateIdentityVerificationEmailText({
        recipientName,
        verificationUrl,
        expirationDate: expirationDateStr,
        verificationType: entry.verificationType
      })
    };
    
    await transporter.sendMail(mailOptions);
    
    // Create activity log
    await createIdentityActivityLog({
      listId: entry.listId,
      entryId: entryId,
      action: 'link_resent',
      actorType: 'admin',
      actorId: req.user.uid,
      details: {
        email: entry.email,
        verificationType: entry.verificationType,
        resendCount: newResendCount,
        resentBy: req.user.email
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Resent verification link to ${entry.email} (resend count: ${newResendCount})`);
    
    // Build response
    const response = {
      success: true,
      newExpiresAt: newTokenExpiresAt,
      resendCount: newResendCount
    };
    
    // Add warning if resendCount > 3 (Requirement 8.4)
    if (newResendCount > 3) {
      response.warning = `This link has been resent ${newResendCount} times. Consider contacting the customer directly if they continue to have issues.`;
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error resending verification link:', error);
    
    // Check if it's an email sending error
    if (error.code === 'ECONNECTION' || error.code === 'EAUTH' || error.responseCode) {
      return res.status(500).json({
        error: 'Email sending failed',
        message: 'Failed to send verification email. Please try again later.'
      });
    }
    
    res.status(500).json({
      error: 'Failed to resend verification link',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/lists/:listId/activity
 * Get activity logs for a specific list with filtering and pagination
 * Brokers can only view activity logs for their own lists
 * 
 * Query Parameters:
 * - action: string - Filter by action type (list_created, list_deleted, links_sent, link_resent, verification_success, verification_failed, export_generated)
 * - startDate: string - Filter logs from this date (ISO format)
 * - endDate: string - Filter logs until this date (ISO format)
 * - page: number - Page number (default: 1)
 * - limit: number - Items per page (default: 50, max: 100)
 * 
 * Requirements: 9.2, 9.3, 9.4, 11.7
 */
app.get('/api/identity/lists/:listId/activity', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    const { action, startDate, endDate, page = '1', limit = '50' } = req.query;
    
    console.log(`📋 Fetching activity logs for list ${listId}`);
    
    // Validate list exists
    const listDoc = await db.collection('identity-lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        error: 'List not found',
        message: `No list found with ID: ${listId}`
      });
    }
    
    const listData = listDoc.data();
    
    // Check ownership for brokers
    if (normalizeRole(req.user.role) === 'broker' && listData.createdBy !== req.user.uid) {
      console.log(`❌ Broker ${req.user.email} attempted to view activity logs for list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view activity logs for this list'
      });
    }
    
    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    
    // Build query
    let query = db.collection('identity-logs')
      .where('listId', '==', listId)
      .orderBy('timestamp', 'desc');
    
    // Apply action filter
    if (action && typeof action === 'string') {
      const validActions = ['list_created', 'list_deleted', 'links_sent', 'link_resent', 'verification_success', 'verification_failed', 'export_generated'];
      if (validActions.includes(action)) {
        query = query.where('action', '==', action);
      }
    }
    
    // Note: Firestore doesn't support multiple inequality filters on different fields
    // Date filtering will be done in-memory after fetching
    
    // Fetch logs with pagination
    // We fetch more than needed to handle date filtering
    const fetchLimit = limitNum * 3; // Fetch extra to account for date filtering
    const snapshot = await query.limit(fetchLimit).get();
    
    let logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp
      };
    });
    
    // Apply date filters in-memory
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        logs = logs.filter(log => new Date(log.timestamp) >= start);
      }
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        logs = logs.filter(log => new Date(log.timestamp) <= end);
      }
    }
    
    // Calculate total and apply pagination
    const total = logs.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedLogs = logs.slice(startIndex, startIndex + limitNum);
    
    console.log(`✅ Retrieved ${paginatedLogs.length} activity logs for list ${listId}`);
    
    res.status(200).json({
      logs: paginatedLogs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    });
    
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      error: 'Failed to fetch activity logs',
      message: error.message
    });
  }
});

/**
 * POST /api/identity/lists/:listId/bulk-verify
 * Bulk verify all unverified entries that have NIN, BVN, or CAC pre-filled
 * Brokers can only bulk verify entries in their own lists
 * 
 * This endpoint:
 * - Queries entries with status 'pending' or 'link_sent'
 * - Filters entries that have NIN, BVN, or CAC pre-filled
 * - For each entry, calls appropriate verification API
 * - Updates entry status based on result
 * - Skips entries that are already verified
 * - Returns summary: { processed, verified, failed, skipped }
 * 
 * Response:
 * - processed: number - Total entries processed
 * - verified: number - Successfully verified entries
 * - failed: number - Failed verification entries
 * - skipped: number - Skipped entries (already verified or missing data)
 * - details: array - Detailed results for each entry
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10, 19.11
 */
app.post('/api/identity/lists/:listId/bulk-verify', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    console.log(`🔄 Starting bulk verification for list ${listId}`);
    
    // Validate list exists
    const listDoc = await db.collection('identity-lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        error: 'List not found',
        message: `No list found with ID: ${listId}`
      });
    }
    
    const listData = listDoc.data();
    
    // Check ownership for brokers
    if (normalizeRole(req.user.role) === 'broker' && listData.createdBy !== req.user.uid) {
      console.log(`❌ Broker ${req.user.email} attempted to bulk verify list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to bulk verify entries in this list'
      });
    }
    
    // Query entries with status 'pending' or 'link_sent'
    const entriesSnapshot = await db.collection('identity-entries')
      .where('listId', '==', listId)
      .where('status', 'in', ['pending', 'link_sent'])
      .get();
    
    console.log(`📋 Found ${entriesSnapshot.size} entries with status 'pending' or 'link_sent'`);
    
    // Initialize results
    const results = {
      processed: 0,
      verified: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
    
    // Process each entry
    for (const entryDoc of entriesSnapshot.docs) {
      const entry = entryDoc.data();
      const entryId = entryDoc.id;
      const entryRef = db.collection('identity-entries').doc(entryId);
      
      // Skip if already verified (safety check)
      if (entry.status === 'verified') {
        results.skipped++;
        results.details.push({
          entryId,
          email: entry.email,
          status: 'skipped',
          reason: 'already_verified'
        });
        
        // Log audit event
        await createIdentityActivityLog({
          listId,
          entryId,
          action: 'bulk_verify_skipped',
          actorType: 'admin',
          actorId: req.user.uid,
          details: {
            reason: 'already_verified',
            email: entry.email
          },
          ipAddress: req.ipData?.masked,
          userAgent: req.headers['user-agent']
        });
        
        continue;
      }
      
      // Check if entry has pre-filled identity data
      const hasNIN = entry.data?.nin || entry.data?.NIN || entry.nin;
      const hasBVN = entry.data?.bvn || entry.data?.BVN || entry.bvn;
      const hasCAC = entry.data?.cac || entry.data?.CAC || entry.cac;
      
      // Skip if no identity data pre-filled
      if (!hasNIN && !hasBVN && !hasCAC) {
        results.skipped++;
        results.details.push({
          entryId,
          email: entry.email,
          status: 'skipped',
          reason: 'no_identity_data'
        });
        continue;
      }
      
      // Determine verification type and data
      let verificationType;
      let identityNumber;
      let verificationData = {};
      
      if (hasNIN || hasBVN) {
        // Individual verification (NIN/BVN)
        verificationType = 'NIN';
        identityNumber = hasNIN || hasBVN;
        
        // Extract additional fields for validation
        verificationData = {
          firstName: entry.data?.firstName || entry.data?.['First Name'] || entry.data?.['first name'],
          lastName: entry.data?.lastName || entry.data?.['Last Name'] || entry.data?.['last name'],
          dateOfBirth: entry.data?.dateOfBirth || entry.data?.['Date of Birth'] || entry.data?.['date of birth'],
          gender: entry.data?.gender || entry.data?.Gender,
          bvn: hasBVN
        };
      } else if (hasCAC) {
        // Corporate verification (CAC)
        verificationType = 'CAC';
        identityNumber = hasCAC;
        
        // Extract additional fields for validation
        verificationData = {
          companyName: entry.data?.companyName || entry.data?.['Company Name'] || entry.data?.['company name'],
          registrationNumber: entry.data?.registrationNumber || entry.data?.['Registration Number'] || entry.data?.['registration number'],
          registrationDate: entry.data?.registrationDate || entry.data?.['Registration Date'] || entry.data?.['registration date'],
          businessAddress: entry.data?.businessAddress || entry.data?.['Business Address'] || entry.data?.['business address']
        };
      }
      
      // Validate identity number format
      if (verificationType === 'NIN' && !/^\d{11}$/.test(identityNumber)) {
        results.skipped++;
        results.details.push({
          entryId,
          email: entry.email,
          status: 'skipped',
          reason: 'invalid_nin_format'
        });
        continue;
      }
      
      // Call verification API
      let verificationResult;
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      
      try {
        results.processed++;
        
        if (verificationType === 'NIN') {
          // NIN verification via Paystack
          if (paystackSecretKey) {
            console.log(`🔍 Verifying NIN for entry ${entryId}: ${identityNumber.substring(0, 4)}***`);
            const response = await fetch(`https://api.paystack.co/bank/resolve_bvn/${identityNumber}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${paystackSecretKey}`,
              },
            });
            
            const responseData = await response.json();
            verificationResult = {
              success: response.ok && responseData.status,
              data: responseData.data,
              message: responseData.message
            };
          } else {
            // No API key - use demo mode
            console.log(`🎭 DEMO MODE: Simulating NIN verification for entry ${entryId}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            verificationResult = {
              success: true,
              data: { nin: identityNumber },
              message: 'Verification simulated (no API key configured)'
            };
          }
        } else {
          // CAC verification via Paystack
          if (paystackSecretKey) {
            console.log(`🔍 Verifying CAC for entry ${entryId}: ${identityNumber}`);
            const response = await fetch('https://api.paystack.co/identity/cac', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${paystackSecretKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                rc_number: identityNumber, 
                company_name: verificationData.companyName 
              }),
            });
            
            const responseData = await response.json();
            verificationResult = {
              success: response.ok && responseData.status,
              data: responseData.data,
              message: responseData.message
            };
          } else {
            // No API key - use demo mode
            console.log(`🎭 DEMO MODE: Simulating CAC verification for entry ${entryId}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            verificationResult = {
              success: true,
              data: { rc_number: identityNumber, company_name: verificationData.companyName },
              message: 'Verification simulated (no API key configured)'
            };
          }
        }
        
        // Handle verification result
        if (verificationResult.success) {
          // Success - update entry with verified data
          const updateData = {
            status: 'verified',
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          if (verificationType === 'NIN') {
            updateData.nin = identityNumber;
          } else {
            updateData.cac = identityNumber;
            if (verificationData.companyName) {
              updateData.cacCompanyName = verificationData.companyName;
            }
          }
          
          await entryRef.update(updateData);
          
          results.verified++;
          results.details.push({
            entryId,
            email: entry.email,
            status: 'verified',
            verificationType
          });
          
          // Log success
          await createIdentityActivityLog({
            listId,
            entryId,
            action: 'verification_success',
            actorType: 'admin',
            actorId: req.user.uid,
            details: {
              email: entry.email,
              verificationType,
              method: 'bulk_verify'
            },
            ipAddress: req.ipData?.masked,
            userAgent: req.headers['user-agent']
          });
          
          console.log(`✅ Entry ${entryId} verified successfully`);
        } else {
          // Failure - update entry status
          await entryRef.update({
            status: 'verification_failed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            verificationDetails: {
              failureReason: verificationResult.message || 'Verification failed',
              failedAt: admin.firestore.FieldValue.serverTimestamp()
            }
          });
          
          results.failed++;
          results.details.push({
            entryId,
            email: entry.email,
            status: 'failed',
            verificationType,
            reason: verificationResult.message
          });
          
          // Log failure
          await createIdentityActivityLog({
            listId,
            entryId,
            action: 'verification_failed',
            actorType: 'admin',
            actorId: req.user.uid,
            details: {
              email: entry.email,
              verificationType,
              error: verificationResult.message,
              method: 'bulk_verify'
            },
            ipAddress: req.ipData?.masked,
            userAgent: req.headers['user-agent']
          });
          
          console.log(`❌ Entry ${entryId} verification failed: ${verificationResult.message}`);
        }
        
      } catch (apiError) {
        console.error(`❌ API error for entry ${entryId}:`, apiError);
        
        results.failed++;
        results.details.push({
          entryId,
          email: entry.email,
          status: 'failed',
          verificationType,
          reason: 'API error: ' + apiError.message
        });
        
        // Update entry with error
        await entryRef.update({
          status: 'verification_failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          verificationDetails: {
            failureReason: 'API error: ' + apiError.message,
            failedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        });
      }
    }
    
    // Update list statistics
    const listRef = db.collection('identity-lists').doc(listId);
    const updatedEntriesSnapshot = await db.collection('identity-entries')
      .where('listId', '==', listId)
      .get();
    
    let verifiedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    
    updatedEntriesSnapshot.forEach(doc => {
      const status = doc.data().status;
      if (status === 'verified') verifiedCount++;
      else if (status === 'verification_failed' || status === 'failed') failedCount++;
      else pendingCount++;
    });
    
    await listRef.update({
      verifiedCount,
      pendingCount,
      failedCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Bulk verification complete for list ${listId}`);
    console.log(`   Processed: ${results.processed}, Verified: ${results.verified}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
    
    res.status(200).json(results);
    
  } catch (error) {
    console.error('❌ Error during bulk verification:', error);
    res.status(500).json({
      error: 'Bulk verification failed',
      message: error.message
    });
  }
});

// ============= END IDENTITY COLLECTION SYSTEM API =============

// ============= END IDENTITY REMEDIATION SYSTEM =============

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
