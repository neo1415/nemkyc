
const express = require('express');
const admin = require('./server-utils/firebaseAdminCompat.cjs');
const cookieParser = require('cookie-parser'); 
const { createCsrfUtilities } = require('./server-utils/csrfConfiguration.cjs');
const cors = require('cors'); 
const crypto = require('crypto');
const uuidv4 = crypto.randomUUID;
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
const multer = require("multer");
const { getStorage } = require("firebase-admin/storage");
if (process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET) {
  throw new Error('CSRF_SECRET must be configured in production');
}

const claimLifecycle = require('./src/lib/claimLifecycle.cjs');

const {
  CUSTOMER_FORM_CONFIGS,
  getCustomerFormConfig,
  resolveClaimFormConfig,
  resolveClaimNotificationEmails,
  buildAdminSubmissionDeepLink,
  buildCustomerDashboardLink,
  isClaimFormType,
  resolveAssignedClaimCollections,
  buildNotificationRoleQuery,
  normalizeNotificationEmails,
  getAllClaimCollections,
  getClaimUnitGroups,
  validateAssignedClaimCollectionsInput,
  buildUserRoleClaimAccessUpdate
} = require('./server-utils/customerFormPolicy.cjs');

// Import verification error handling utility
const {
  createVerificationError
} = require('./server-utils/verificationErrors.js');

// Import encryption utility for NDPR compliance
const {
  encryptData,
  decryptData,
  isEncrypted,
  clearSensitiveData,
  hashForCacheLookup
} = require('./server-utils/encryption.cjs');

// Import Datapro NIN verification client
const {
  verifyNIN: dataproVerifyNIN,
  matchFields: dataproMatchFields,
  getUserFriendlyError: dataproGetUserFriendlyError,
  getTechnicalError: dataproGetTechnicalError
} = require('./server-services/dataproClient.cjs');

// Import VerifyData CAC verification client
const {
  verifyCAC: verifydataVerifyCAC,
  matchCACFields: verifydataMatchCACFields,
  getUserFriendlyError: verifydataGetUserFriendlyError,
  getTechnicalError: verifydataGetTechnicalError
} = require('./server-services/verifydataClient.cjs');

// Import rate limiter
const {
  RateLimiter,
  applyDataproRateLimit,
  applyVerifydataRateLimit,
  getDataproRateLimitStatus,
  resetDataproRateLimit,
  resetVerifydataRateLimit
} = require('./server-utils/rateLimiter.cjs');

// Import API usage tracker
const {
  trackDataproAPICall,
  trackVerifydataAPICall,
  getAPIUsageStats,
  getMonthlyUsageSummary,
  checkUsageLimits
} = require('./server-utils/apiUsageTracker.cjs');

// Import security middleware
const {
  verificationRateLimiter,
  bulkVerificationRateLimiter,
  stripServiceId,
  additionalSecurityHeaders,
  validateOrigin
} = require('./server-utils/securityMiddleware.cjs');

// Import audit logger
const {
  logVerificationAttempt,
  logAPICall,
  logEncryptionOperation,
  logSecurityEvent,
  logSecurityEvent: logAuditSecurityEvent,
  logBulkOperation,
  logFormView,
  logFormSubmission,
  logDocumentUpload,
  logAdminAction,
  queryAuditLogs,
  getAuditLogStats
} = require('./server-utils/auditLogger.cjs');

// Import password generator utility
const {
  generateSecurePassword,
  validatePasswordComplexity
} = require('./server-utils/passwordGenerator.cjs');

// Import email templates
const {
  generateWelcomeEmail,
  generateSetPasswordEmail,
  generateClaimStageEmail,
  generatePasswordResetEmail
} = require('./server-utils/emailTemplates.cjs');

// Import user creation rate limiter
const {
  userCreationRateLimit,
  cleanupExpiredRateLimits,
  getUserCreationRateLimitStatus,
  resetUserCreationRateLimit
} = require('./server-utils/rateLimiter.cjs');

// Import verification queue
const {
  enqueue: enqueueVerification,
  getQueueStatus,
  getUserQueueItems,
  getQueueStats
} = require('./server-utils/verificationQueue.cjs');

// Import date formatter
const {
  formatDate,
  formatDateLong
} = require('./server-utils/dateFormatter.cjs');

// Import health monitor
const {
  initializeHealthMonitor,
  stopHealthMonitor,
  getHealthStatus,
  getHealthHistory,
  calculateErrorRate,
  getAPIUsage,
  getUnacknowledgedAlerts,
  acknowledgeAlert
} = require('./server-utils/healthMonitor.cjs');

// ========================================
// IP-Based Rate Limiter for Verification Endpoints
// ========================================
// Create IP-based rate limiter instance (100 requests per minute, max queue size 50)
const ipRateLimiter = new RateLimiter(100, 60000, 50);

/**
 * IP-based rate limiting middleware
 * Backup defense against abuse even for authenticated users
 */
async function ipBasedRateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  
  try {
    await ipRateLimiter.acquire();
    next();
  } catch (error) {
    // Log rate limit violation
    try {
      await logAuditSecurityEvent({
        eventType: 'rate_limit_exceeded',
        severity: 'high',
        description: `IP ${ip} exceeded rate limit for verification endpoints`,
        userId: req.user?.uid || 'anonymous',
        ipAddress: ip,
        metadata: {
          endpoint: req.path,
          method: req.method,
          userAgent: req.headers['user-agent'],
          queueStatus: ipRateLimiter.getStatus()
        }
      });
    } catch (logError) {
      console.error('Failed to log rate limit violation:', logError);
    }
    
    console.warn(`⚠️  IP rate limit exceeded for ${ip} on ${req.path}`);
    res.status(429).json({
      status: false,
      message: 'Too many requests. Please try again later.'
    });
  }
}

// ========================================
// EMAIL SECURITY HELPERS
// ========================================

/**
 * Sanitize email address to prevent injection attacks
 * @param {string} email - Email address to sanitize
 * @returns {string} Sanitized email address
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  // Remove any newlines, carriage returns, and null bytes
  return email.replace(/[\r\n\0]/g, '').trim();
}

/**
 * Sanitize email subject to prevent header injection
 * @param {string} subject - Email subject to sanitize
 * @returns {string} Sanitized subject
 */
function sanitizeEmailSubject(subject) {
  if (!subject || typeof subject !== 'string') {
    return '';
  }
  // Remove newlines, carriage returns, and null bytes that could inject headers
  return subject.replace(/[\r\n\0]/g, '').trim();
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && !email.includes('\n') && !email.includes('\r');
}

// ========================================
// ERROR SANITIZATION HELPERS
// ========================================

/**
 * Sanitize error message for production
 * Prevents leaking sensitive information in error responses
 * @param {Error} error - The error object
 * @param {string} genericMessage - Generic message to return in production
 * @returns {object} Sanitized error response
 */
function sanitizeError(error, genericMessage = 'An error occurred') {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // In production, return generic error
    return {
      error: genericMessage,
      message: 'Please try again later or contact support if the problem persists.'
    };
  }
  
  // In development, return detailed error
  return {
    error: error.name || 'Error',
    message: error.message,
    stack: error.stack
  };
}

// Import duplicate detector for bulk verification
const {
  checkDuplicate,
  batchCheckDuplicates
} = require('./server-utils/duplicateDetector.cjs');

// Import identity validator for format validation
const {
  validateIdentityFormat,
  batchValidateIdentities
} = require('./server-utils/identityValidator.cjs');

// Import cost calculator for bulk verification analysis
const {
  calculateCost: calculateVerificationCost
} = require('./server-utils/costCalculator.cjs');

// Debug: Verify the import loaded correctly
console.log('🔍 DEBUG: calculateVerificationCost imported, type:', typeof calculateVerificationCost);

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

// ============= VERIFICATION LOGGING HELPER =============

/**
 * Helper function to consolidate verification logging
 * Eliminates duplicate audit log entries by combining API usage tracking and audit logging
 * 
 * @param {Object} db - Firestore database instance
 * @param {Object} params - Logging parameters
 * @param {string} params.provider - API provider ('datapro' or 'verifydata')
 * @param {string} params.verificationType - Type of verification ('NIN' or 'CAC')
 * @param {boolean} params.success - Whether verification succeeded
 * @param {string} params.listId - Identity list ID
 * @param {string} params.entryId - Entry ID being verified
 * @param {string} params.identityNumber - Identity number (will be masked)
 * @param {string} params.userId - User ID
 * @param {string} params.userEmail - User email
 * @param {string} params.userName - User name
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.errorCode - Error code if failed
 * @param {string} params.errorMessage - Error message if failed
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logVerificationComplete(db, params) {
  const {
    provider,
    verificationType,
    success,
    listId,
    entryId,
    identityNumber,
    userId,
    userEmail,
    userName,
    userType = 'customer', // Default to customer
    ipAddress,
    errorCode,
    errorMessage,
    metadata = {}
  } = params;

  try {
    // Import helper functions from apiUsageTracker
    const { calculateCost, lookupBrokerInfo } = require('./server-utils/apiUsageTracker.cjs');
    
    // Calculate cost based on provider and success
    const cost = calculateCost(provider, success);
    
    // Look up broker information from listId for API usage tracking only
    const brokerInfo = await lookupBrokerInfo(db, listId);
    
    // Track API usage with broker context (for cost attribution)
    if (provider === 'datapro') {
      await trackDataproAPICall(db, {
        nin: identityNumber ? identityNumber.substring(0, 4) + '*******' : '****',
        success,
        errorCode: errorCode || null,
        userId: brokerInfo.userId,
        listId: listId || null,
        entryId: entryId || null
      });
    } else if (provider === 'verifydata') {
      await trackVerifydataAPICall(db, {
        rcNumber: identityNumber ? identityNumber.substring(0, 4) + '*******' : '****',
        success,
        errorCode: errorCode || null,
        userId: brokerInfo.userId,
        listId: listId || null,
        entryId: entryId || null
      });
    }
    
    // Log verification attempt with CUSTOMER context (not broker)
    await logVerificationAttempt({
      verificationType,
      identityNumber,
      userId: userId, // Customer name/ID from params
      userEmail: userEmail, // Customer email from params
      userName: userName, // Customer name from params
      userType: userType, // Customer or broker
      ipAddress: ipAddress || 'unknown',
      result: success ? 'success' : 'failure',
      errorCode: errorCode || null,
      errorMessage: errorMessage || null,
      apiProvider: provider,
      cost,
      metadata: {
        ...metadata,
        listId,
        entryId,
        brokerUserId: brokerInfo.userId, // Track broker for reference
        brokerEmail: brokerInfo.userEmail
      }
    });
    
    console.log(`📝 [AUDIT] Consolidated logging complete: ${provider} ${verificationType} - ${success ? 'SUCCESS' : 'FAILED'} - User: ${userName}`);
    
  } catch (error) {
    console.error('[LogVerificationComplete] Error in consolidated logging:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

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
  ...Object.fromEntries(
    CUSTOMER_FORM_CONFIGS.map(config => [config.formType, config.ticketPrefix])
  )
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

// Ticket helpers are exported for tests; the app itself is exported at the bottom of this file.
if (typeof module !== 'undefined' && module.exports) {
  Object.assign(module.exports, {
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
  });
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

// ============= CORS CONFIGURATION (src/config/cors.cjs; definitions unchanged) =============
const { corsOptions } = require('./src/config/cors.cjs');

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

// ============= CORS CONFIGURATION =============
// SECURITY NOTE: CORS is configured to allow localhost in development mode
// In production, ensure ADDITIONAL_ALLOWED_ORIGINS environment variable is set
// to include only trusted domains. Never use '*' wildcard in production.
// Example: ADDITIONAL_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
app.use(cors(corsOptions));

// Static file serving will be added after API routes

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

// ✅ SECURITY: Additional security middleware
app.use(stripServiceId); // Ensure SERVICEID never sent to frontend
app.use(additionalSecurityHeaders); // Additional security headers
app.use(validateOrigin); // Validate request origin

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

// Initialize CSRF protection middleware with csrf-csrf
const {
  generateCsrfToken, // Used to provide a CSRF token
  validateRequest, // Used to validate a CSRF token
  doubleCsrfProtection, // Middleware to validate CSRF tokens
} = createCsrfUtilities({
  secret: process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex'),
  isProduction: process.env.NODE_ENV === 'production',
});

// Use doubleCsrfProtection as the middleware (replaces csrfProtection)
const csrfProtection = doubleCsrfProtection;

// Nonce implementation middleware
const generateNonce = () => {
  return uuidv4();
};

app.use((req, res, next) => {
  res.locals.nonce = generateNonce();
  next();
});

// ============= FIRESTORE CONFIGURATION WITH TIMEOUTS =============
// Configure Firestore with shorter timeouts to prevent blocking
const db = admin.firestore();
const {
  hashSessionId,
  createSession,
  resolveSessionUid,
  destroySession,
} = require('./src/lib/sessions.cjs').createSessionStore({ db, crypto });

// Set Firestore client settings with reasonable timeouts
const firestoreSettings = {
  ignoreUndefinedProperties: true,
  // Note: Firestore doesn't support direct timeout configuration in settings
  // We'll implement timeout handling at the operation level
};

db.settings(firestoreSettings);

// ============= FIRESTORE OPERATION WRAPPER WITH TIMEOUT =============
/**
 * Wrapper for Firestore operations with timeout
 * Prevents operations from blocking indefinitely
 * @param {Promise} operation - Firestore operation promise
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000ms)
 * @returns {Promise} Operation result or timeout error
 */
async function firestoreWithTimeout(operation, timeoutMs = 5000) {
  return Promise.race([
    operation,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Firestore operation timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// ============= CIRCUIT BREAKER FOR FIRESTORE =============
/**
 * Circuit breaker to prevent cascading failures when Firestore is down
 */
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - Firestore unavailable');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.error(`🔴 Circuit breaker OPEN - Firestore operations suspended for ${this.timeout}ms`);
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null
    };
  }
}

// Create circuit breaker instances for different operations
const auditLogCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 60s timeout
const healthMonitorCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30s timeout

// ✅ SECURITY: Enhanced multer configuration with size limits and file type validation
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size (matches CAC document validation)
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

// ============= AUTHENTICATION & AUTHORIZATION MIDDLEWARE (src/middleware/auth.cjs; definitions unchanged) =============
const {
  canAccessIdentityList,
  getCachedSession,
  invalidateSessionCache,
  isAdminOrCompliance,
  isAdminOrSuperAdmin,
  isClaimsOrAdminOrCompliance,
  isSuperAdmin,
  normalizeRole,
  requireAdmin,
  requireAuth,
  requireAuthOrGuest,
  requireBrokerOrAdmin,
  requireClaims,
  requireCompliance,
  requireOwnerOrAdmin,
  requireRole,
  requireSuperAdmin,
} = require('./src/middleware/auth.cjs').createAuthMiddleware({
  db,
  admin,
  logger,
  logAuditSecurityEvent,
  logSecurityEvent,
  sessions: { resolveSessionUid },
});

// ============= INPUT VALIDATION MIDDLEWARE (src/middleware/validation.cjs; definitions unchanged) =============
const {
  handleValidationErrors,
  sanitizeHtmlFields,
  validateFormStatusUpdate,
  validateFormSubmission,
  validatePagination,
} = require('./src/middleware/validation.cjs');

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

const { validateRequestContentType } = require('./server-utils/contentTypePolicy.cjs');

/**
 * Content-Type validation middleware
 * Ensures requests with body have correct Content-Type header
 */
app.use((req, res, next) => {
  const validationError = validateRequestContentType({
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type']
  });

  if (validationError) {
    return res.status(415).json(validationError);
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
    
    // CRITICAL FIX: Fire-and-forget - don't await logAction
    // This prevents blocking the response if Firestore is slow/down
    logAction({
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
    }).catch(err => {
      // Silently catch errors - already logged in logAction
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
 * 
 * CRITICAL FIX: Fire-and-forget pattern with timeout and circuit breaker
 * - Non-blocking: Does not await Firestore write
 * - Short timeout: 5 seconds max (not 10 minutes)
 * - Circuit breaker: Stops trying if Firestore is down
 * - Error handling: Logs errors but doesn't crash
 */
const logAction = async (actionData) => {
  if (!EVENTS_CONFIG.ENABLE_EVENTS_LOGGING) {
    return;
  }

  // Fire-and-forget: Don't await, don't block the response
  setImmediate(async () => {
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

      // Write to Firestore with timeout and circuit breaker
      await auditLogCircuitBreaker.execute(async () => {
        await firestoreWithTimeout(
          db.collection('eventLogs').add(eventLog),
          5000 // 5 second timeout (not 10 minutes!)
        );
      });
      
      // Log critical events to console
      if (severity === SEVERITY.CRITICAL || severity === SEVERITY.ERROR) {
        console.error(`🚨 ${severity.toUpperCase()} EVENT:`, {
          action: actionData.action,
          actor: actionData.actorEmail,
          riskScore: riskScore
        });
      }
      
    } catch (error) {
      // Log error but don't throw - logging failures shouldn't break main functionality
      console.error('💥 Failed to log event:', error.message);
      
      // If circuit breaker is open, log to console for visibility
      if (error.message.includes('Circuit breaker is OPEN')) {
        console.warn('⚠️  Audit logging suspended due to Firestore issues');
      }
    }
  });
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
}, 60 * 1000).unref();

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
  const publicAuditPaths = new Set([
    '/api/audit/form_view',
    '/api/audit/form_submission',
    '/api/audit/document_upload'
  ]);
  const isPublicAuditEvent = req.method === 'POST' && publicAuditPaths.has(req.path);
  // Requests authenticated with an explicit Authorization header cannot be forged by a cross-site
  // page (browsers never attach that header automatically), so the double-submit cookie adds nothing
  // and only fails when the browser blocks third-party cookies (Safari, iOS, Brave, strict Chrome).
  const hasBearerAuth = typeof req.headers.authorization === 'string'
    && req.headers.authorization.startsWith('Bearer ');
  // A guest submission carries no ambient credential (no cookie, no token), so there is nothing a
  // cross-site page could ride on; the double-submit cookie would only block cookie-less browsers.
  const isGuestSubmission = req.method === 'POST' && req.path === '/api/submit-form'
    && !req.cookies?.__session && !req.headers.authorization
    && req.body && typeof req.body.guest === 'object' && req.body.guest !== null;

  // Skip CSRF protection for specific routes including exchange-token
  if (isPublicAuditEvent || hasBearerAuth || isGuestSubmission ||
    req.path === '/api/logout' ||
    req.path === '/listenForUpdates' ||
    req.path === '/csrf-token' ||
    req.path === '/send-to-user' ||
    req.path === '/send-to-admin-and-claims' ||
    req.path === '/send-to-admin-and-compliance' ||
    req.path === '/api/update-claim-status' ||
    req.path === '/api/exchange-token' ||
    req.path === '/api/register' ||       // Registration doesn't need CSRF (user not authenticated yet)
    req.path === '/api/verify/nin' ||    // Demo NIN verification
    req.path === '/api/verify/cac' ||    // Demo CAC verification
    req.path === '/api/gemini/generate' || // Gemini API endpoint
    req.path === '/api/document-ai/process' || // Document AI API endpoint (NDPA compliant)
    req.path === '/api/test-endpoint' || // Test endpoint for debugging
    req.path === '/api/autofill/verify-nin' ||  // Auto-fill NIN verification (self-verification, protected by rate limiting)
    req.path === '/api/autofill/verify-cac' ||  // Auto-fill CAC verification (self-verification, protected by rate limiting)
    req.path.startsWith('/api/remediation/') ||  // Remediation endpoints (protected by auth)
    req.path.startsWith('/api/identity/') ||     // Identity collection endpoints (protected by auth)
    req.path.startsWith('/api/analytics/') ||    // Analytics endpoints (protected by requireAuth + requireSuperAdmin)
    req.path.startsWith('/api/cac-documents/') ||    // CAC document endpoints (protected by auth)
    req.path.startsWith('/api/admin/') ||    // Admin endpoints (protected by requireAuth + requireSuperAdmin)
    req.path.startsWith('/api/users/')) {    // User management endpoints (protected by requireAuth + requireSuperAdmin)
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
// ============= RATE LIMITING (registered before any route so it actually runs) =============
// ============= RATE LIMITING CONFIGURATION (src/config/rateLimits.cjs; definitions unchanged) =============
const {
  authLimiter,
  submissionLimiter,
  apiLimiter,
  sensitiveOperationLimiter,
  mfaAttemptLimit,
  emailLimiter,
  guestProvisionLimiter,
  publicFormSubmissionLimiter,
  publicUploadLimiter,
} = require('./src/config/rateLimits.cjs').createRateLimiters({ rateLimit, logRateLimitHit });

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
// ============= END RATE LIMITING =============

// ============= HELPERS MOVED ABOVE ctx (definitions only, unchanged) =============
// ✅ SECURITY: Whitelist of allowed Firestore collections
const ALLOWED_COLLECTIONS = [
  // KYC Forms
  'Individual-kyc-form',
  'corporate-kyc-form',
  
  // NFIU Forms
  'individual-nfiu-form',
  'corporate-nfiu-form',
  
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
  
  // NEM Smart Protection Claims
  'smart-motorist-protection-claims',
  'smart-students-protection-claims',
  'smart-traveller-protection-claims',
  'smart-artisan-protection-claims',
  'smart-generation-z-protection-claims',
  'nem-home-protection-claims',
  
  // NEM Agricultural Claims
  'farm-property-produce-claims',
  'livestock-claims',
  'poultry-claims',
  'fishery-fish-farm-claims',
  'yield-index-claims',
  'multi-perils-crop-claims',
  
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
 * Create CAC document audit log
 * 
 * Logs CAC document operations to both console and Firestore audit collection.
 * Used for tracking document uploads, metadata writes, and admin queries.
 * 
 * @param {string} action - Action type (CAC_DOCUMENT_UPLOAD_STARTED, CAC_DOCUMENT_METADATA_WRITTEN, etc.)
 * @param {Object} params - Audit log parameters
 * @param {string} params.documentType - Document type (certificate_of_incorporation, etc.)
 * @param {string} params.identityRecordId - Identity record ID
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.documentId - Document ID (optional)
 * @param {Object} params.metadata - Additional metadata (optional)
 * @returns {Promise<Object|null>} Audit log entry or null if failed
 */
const createCACDocumentAuditLog = async (action, params) => {
  try {
    const {
      documentType,
      identityRecordId,
      userId,
      documentId,
      metadata = {}
    } = params;
    
    const auditLogRef = db.collection('audit-logs').doc();
    const auditLog = {
      id: auditLogRef.id,
      action,
      documentType: documentType || null,
      identityRecordId: identityRecordId || null,
      userId: userId || 'system',
      documentId: documentId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        ...metadata,
        source: 'server',
        loggedAt: new Date().toISOString()
      }
    };
    
    await auditLogRef.set(auditLog);
    console.log(`✅ CAC audit log created: ${action} for identity ${identityRecordId}`);
    return auditLog;
  } catch (error) {
    console.error('❌ Failed to create CAC audit log:', error);
    // Don't throw - audit logging failures shouldn't break the main operation
    return null;
  }
};

// ============= MAIL HELPERS (src/lib/mail.cjs; definitions unchanged) =============
const {
  getAllAdminEmails,
  sendEmailToAdmins,
  getEmailsByRoles,
  getClaimStaffEmails,
  sendEmail,
  sendEmailWithRetry,
} = require('./src/lib/mail.cjs').createMailer({
  getTransporter: () => transporter,
  admin,
  buildNotificationRoleQuery,
  isValidEmail,
  logAuditSecurityEvent,
  normalizeNotificationEmails,
  resolveAssignedClaimCollections,
  sanitizeEmail,
  sanitizeEmailSubject,
});

// ============= END MOVED HELPERS =============

// ============= SHARED CONTEXT FOR EXTRACTED ROUTE MODULES =============
// Handles and helpers handed to every src/routes/*.cjs module (see REFACTOR.md).
// Built once; modules only read from it. `transporter` is exposed through a getter because it is a
// `let` assigned later in this file (email configuration); every module registers after that point.
const ctx = {
  claimLifecycle,
  app,
  express,
  admin,
  db,
  bucket,
  getStorage,
  upload,
  multer,
  get transporter() { return transporter; },
  sendEmail,
  sendEmailWithRetry,
  sendEmailToAdmins,
  getAllAdminEmails,
  getEmailsByRoles,
  getClaimStaffEmails,
  rateLimit,
  body,
  param,
  validationResult,
  handleValidationErrors,
  sanitizeHtmlFields,
  validatePagination,
  validateFormSubmission,
  validateFormStatusUpdate,
  requireAuth,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireCompliance,
  requireClaims,
  requireBrokerOrAdmin,
  requireOwnerOrAdmin,
  requireAuthOrGuest,
  canAccessIdentityList,
  normalizeRole,
  isSuperAdmin,
  isAdminOrSuperAdmin,
  isAdminOrCompliance,
  isClaimsOrAdminOrCompliance,
  logAction,
  logSecurityEvent,
  logAuditSecurityEvent,
  getUserDetailsForLogging,
  getLocationFromIP,
  logger,
  logVerificationComplete,
  logAuthEvent,
  logRateLimitHit,
  sanitizeRequestBody,
  parseUserAgent,
  sanitizeEmail,
  sanitizeEmailSubject,
  isValidEmail,
  sanitizeError,
  validateCollectionName,
  ALLOWED_COLLECTIONS,
  createAuditLog,
  createRemediationAuditLog,
  createCACDocumentAuditLog,
  firestoreWithTimeout,
  auditLogCircuitBreaker,
  healthMonitorCircuitBreaker,
  generateTicketId,
  generateTicketIdSync,
  isValidTicketIdFormat,
  verificationRateLimiter,
  bulkVerificationRateLimiter,
  apiLimiter,
  authLimiter,
  submissionLimiter,
  sensitiveOperationLimiter,
  mfaAttemptLimit,
  emailLimiter,
  guestProvisionLimiter,
  publicFormSubmissionLimiter,
  publicUploadLimiter,
  ipBasedRateLimit,
  crypto,
  uuidv4,
  axios,
  fs,
  path,
  nodemailer,
  // sessions (src/lib/sessions.cjs) and session cache
  hashSessionId,
  createSession,
  resolveSessionUid,
  destroySession,
  getCachedSession,
  invalidateSessionCache,
  // server-utils modules
  CUSTOMER_FORM_CONFIGS,
  getCustomerFormConfig,
  resolveClaimFormConfig,
  resolveClaimNotificationEmails,
  buildAdminSubmissionDeepLink,
  buildCustomerDashboardLink,
  isClaimFormType,
  resolveAssignedClaimCollections,
  buildNotificationRoleQuery,
  normalizeNotificationEmails,
  getAllClaimCollections,
  getClaimUnitGroups,
  validateAssignedClaimCollectionsInput,
  buildUserRoleClaimAccessUpdate,
  createVerificationError,
  encryptData,
  decryptData,
  isEncrypted,
  clearSensitiveData,
  hashForCacheLookup,
  dataproVerifyNIN,
  dataproMatchFields,
  dataproGetUserFriendlyError,
  dataproGetTechnicalError,
  verifydataVerifyCAC,
  verifydataMatchCACFields,
  verifydataGetUserFriendlyError,
  verifydataGetTechnicalError,
  RateLimiter,
  applyDataproRateLimit,
  applyVerifydataRateLimit,
  getDataproRateLimitStatus,
  resetDataproRateLimit,
  resetVerifydataRateLimit,
  trackDataproAPICall,
  trackVerifydataAPICall,
  getAPIUsageStats,
  getMonthlyUsageSummary,
  checkUsageLimits,
  stripServiceId,
  additionalSecurityHeaders,
  validateOrigin,
  logVerificationAttempt,
  logAPICall,
  logEncryptionOperation,
  logBulkOperation,
  logFormView,
  logFormSubmission,
  logDocumentUpload,
  logAdminAction,
  queryAuditLogs,
  getAuditLogStats,
  generateSecurePassword,
  validatePasswordComplexity,
  generateWelcomeEmail,
  generateSetPasswordEmail,
  generateClaimStageEmail,
  generatePasswordResetEmail,
  userCreationRateLimit,
  cleanupExpiredRateLimits,
  getUserCreationRateLimitStatus,
  resetUserCreationRateLimit,
  enqueueVerification,
  getQueueStatus,
  getUserQueueItems,
  getQueueStats,
  formatDate,
  formatDateLong,
  initializeHealthMonitor,
  stopHealthMonitor,
  getHealthStatus,
  getHealthHistory,
  calculateErrorRate,
  getAPIUsage,
  getUnacknowledgedAlerts,
  acknowledgeAlert,
  checkDuplicate,
  batchCheckDuplicates,
  validateIdentityFormat,
  batchValidateIdentities,
  calculateVerificationCost,
  validateRequestContentType,
};
// ============= END SHARED CONTEXT =============

app.get('/csrf-token', (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
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
      debug: process.env.NODE_ENV !== 'production',
      // Additional Office365 specific options
      requireTLS: true,
      tls: {
        minVersion: 'TLSv1.2'
      }
    });
  }
};

// Initialize transporter
let transporter;

// Test email configuration
const testEmailConnection = async () => {
  try {
    console.log('🔍 Testing email connection...');
    console.log('📧 Email config:', {
      host: process.env.EMAIL_HOST || 'smtp.office365.com',
      port: process.env.EMAIL_PORT || '587',
      user: process.env.EMAIL_USER,
      secure: process.env.EMAIL_SECURE === 'true'
    });
    
    if (transporter) {
      await transporter.verify();
      console.log('✅ Email connection verified successfully');
    }
  } catch (error) {
    console.error('❌ Email connection test failed:', error.message);
    console.error('💡 Suggestions:');
    console.error('   - Check if EMAIL_USER and EMAIL_PASS are correct');
    console.error('   - Verify network connectivity to SMTP server');
    console.error('   - Consider using App Password instead of regular password');
    console.error('   - Try different ports (25, 465, 587)');
  }
};
try {
  transporter = createEmailTransporter();
  console.log('✅ Email transporter initialized successfully');
  
  // Test the connection
  setTimeout(() => {
    if (process.env.SKIP_EMAIL_VERIFY !== 'true') testEmailConnection();
  }, 2000).unref(); // Wait 2 seconds after server starts
  
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

require('./src/routes/email.cjs')(app, ctx);

require('./src/routes/users.cjs')(app, ctx);

require('./src/routes/forms.cjs')(app, ctx);

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

require('./src/routes/auth.cjs')(app, ctx);

require('./src/routes/verification.cjs')(app, ctx);

require('./src/routes/auth.cjs').signup(app, ctx);

require('./src/routes/forms.cjs').dataRoutes(app, ctx);

require('./src/routes/remediation.cjs')(app, ctx);

require('./src/routes/identity.cjs')(app, ctx);

require('./src/routes/cacDocuments.cjs')(app, ctx);

require('./src/routes/audit.cjs')(app, ctx);

require('./src/routes/health.cjs')(app, ctx);

require('./src/routes/analytics.cjs')(app, ctx);

require('./src/routes/auditReports.cjs')(app, ctx);

// ============= END IDENTITY REMEDIATION SYSTEM =============

require('./src/routes/birthdays.cjs')(app, ctx);

require('./src/routes/documentAi.cjs')(app, ctx);

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

// ============= CONFIGURATION VALIDATION =============

const { validateServerConfiguration } = require('./src/config/env.cjs').createConfigValidation({ logger });

// Run configuration validation
const configValidation = validateServerConfiguration();

// ============= TEST ENDPOINT (for debugging) =============
app.post('/api/test-endpoint', requireAuth, requireSuperAdmin, (req, res) => {
  console.log('🧪 [TEST] Test endpoint hit!');
  res.json({ message: 'Test endpoint working!' });
});

// ============= END CONFIGURATION VALIDATION =============

// ============= PRODUCTION ERROR HANDLER =============
/**
 * Global error handler middleware
 * Sanitizes error messages in production to prevent information leakage
 */
app.use((err, req, res, next) => {
  // Log full error details for debugging
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // In production, return generic error messages
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Generic error response for production
    return res.status(err.status || 500).json({
      error: 'An error occurred',
      message: 'Something went wrong. Please try again later or contact support if the problem persists.'
    });
  }
  
  // In development, return detailed error information
  res.status(err.status || 500).json({
    error: err.name || 'Error',
    message: err.message,
    stack: err.stack
  });
});

// ============= END PRODUCTION ERROR HANDLER =============

let server = null;

function startServer() {
  server = app.listen(port, async () => {
  console.log('='.repeat(80));
  console.log(`🚀 SERVER STARTED - UPDATED VERSION WITH COLLECTION MAPPING FIX`);
  console.log(`Server running on port ${port}`);
  console.log(`📝 Events logging: ${EVENTS_CONFIG.ENABLE_EVENTS_LOGGING ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🌐 IP geolocation: ${EVENTS_CONFIG.ENABLE_IP_GEOLOCATION ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔐 Encryption: ${process.env.ENCRYPTION_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log(`🔍 Verification mode: ${process.env.VERIFICATION_MODE || 'mock'}`);
  if (configValidation.warnings.length > 0) {
    console.log(`⚠️  Configuration warnings: ${configValidation.warnings.length}`);
  }
  if (configValidation.errors.length > 0) {
    console.log(`❌ Configuration errors: ${configValidation.errors.length}`);
  }
  console.log('='.repeat(80));
  console.log(`⏰ Raw IP retention: ${EVENTS_CONFIG.RAW_IP_RETENTION_DAYS} days`);
  
  // Initialize health monitoring
  console.log('🏥 Initializing health monitoring...');
  initializeHealthMonitor(db);
  
  // Sample events are opt-in for local diagnostics and never run in production.
  if (process.env.GENERATE_STARTUP_SAMPLE_EVENTS === 'true' && process.env.NODE_ENV !== 'production') {
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
  }
  
  await setSuperAdminOnStartup();
  });
  return server;
}

// ============= GRACEFUL SHUTDOWN HANDLERS =============

/**
 * Graceful shutdown function
 * Handles cleanup when server receives shutdown signals
 */
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal} signal. Starting graceful shutdown...`);
  
  try {
    // Log shutdown event
    await logSecurityEvent({
      eventType: 'server_shutdown',
      severity: 'medium',
      description: `Server shutting down due to ${signal} signal`,
      userId: 'system',
      ipAddress: 'localhost',
      metadata: {
        signal,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('❌ Failed to log shutdown event:', error.message);
  }
  
  // Stop accepting new connections
  console.log('🔒 Closing server to new connections...');
  if (!server) return process.exit(0);
  server.close((err) => {
    if (err) {
      console.error('❌ Error closing server:', err.message);
    } else {
      console.log('✅ Server closed to new connections');
    }
  });
  
  // Stop health monitoring
  console.log('🏥 Stopping health monitor...');
  try {
    stopHealthMonitor();
    console.log('✅ Health monitor stopped');
  } catch (error) {
    console.error('❌ Error stopping health monitor:', error.message);
  }
  
  // Wait for in-flight requests with 10-second timeout
  console.log('⏳ Waiting for in-flight requests (10s timeout)...');
  const shutdownTimeout = setTimeout(() => {
    console.warn('⚠️  Shutdown timeout reached. Forcing exit...');
    process.exit(1);
  }, 10000);
  
  // Clear timeout if shutdown completes before timeout
  shutdownTimeout.unref();
  
  console.log('✅ Graceful shutdown complete');
  process.exit(0);
}

// Register SIGTERM handler (production deployments)
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

// Register SIGINT handler (Ctrl+C in terminal)
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// Register uncaughtException handler
process.on('uncaughtException', async (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  
  try {
    await logSecurityEvent({
      eventType: 'uncaught_exception',
      severity: 'critical',
      description: `Uncaught exception: ${error.message}`,
      userId: 'system',
      ipAddress: 'localhost',
      metadata: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
  } catch (logError) {
    console.error('❌ Failed to log uncaught exception:', logError.message);
  }
  
  gracefulShutdown('uncaughtException');
});

// Register unhandledRejection handler
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  
  try {
    await logSecurityEvent({
      eventType: 'unhandled_rejection',
      severity: 'critical',
      description: `Unhandled promise rejection: ${reason}`,
      userId: 'system',
      ipAddress: 'localhost',
      metadata: {
        reason: String(reason),
        timestamp: new Date().toISOString()
      }
    });
  } catch (logError) {
    console.error('❌ Failed to log unhandled rejection:', logError.message);
  }
  
  // Don't exit on unhandled rejection, just log it
  console.log('⚠️  Continuing after unhandled rejection...');
});

// ============= CATCH-ALL 404 HANDLER (for debugging) =============
app.use('*', (req, res) => {
  console.log('❌ [404] Unmatched route:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist.',
    path: req.originalUrl
  });
});

console.log('✅ Graceful shutdown handlers registered');

if (require.main === module) {
  startServer();
}

Object.assign(module.exports, { app, startServer });
