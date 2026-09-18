'use strict';

/**
 * express-validator chains and validation helpers shared by the route modules, moved verbatim from
 * server.js. Plain exports: nothing here depends on server state.
 */
const { body, param, validationResult } = require('express-validator');
const { logSecurityEvent } = require('../../server-utils/auditLogger.cjs');

// ============= INPUT VALIDATION MIDDLEWARE =============

/**
 * Validation helper - checks validation results and returns errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation failed:', errors.array());
    
    // Log validation failure using audit logger
    logSecurityEvent({
      eventType: 'validation_failure',
      severity: 'low',
      description: `Validation failed for ${req.method} ${req.path}`,
      userId: req.user?.uid || 'unknown',
      ipAddress: req.ipData?.masked || 'unknown',
      metadata: {
        path: req.path,
        method: req.method,
        errors: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg
        })),
        userAgent: req.headers['user-agent']
      }
    }).catch(err => 
      console.error('Failed to log validation failure:', err)
    );
    
    const validationErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    const firstError = validationErrors[0];

    return res.status(400).json({ 
      error: 'Validation failed',
      message: firstError
        ? `Please check ${firstError.field}: ${firstError.message}`
        : 'Please check the highlighted fields and try again.',
      details: validationErrors
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
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Invalid email format'),
  
  body('userUid')
    .optional({ values: 'falsy' })
    .trim()
    .isString().withMessage('User UID must be a string')
    .isLength({ max: 128 }).withMessage('User UID too long'),

  body('idempotencyKey')
    .optional({ values: 'falsy' })
    .trim()
    .isString().withMessage('Submission key must be a string')
    .isLength({ min: 8, max: 200 }).withMessage('Invalid submission key'),
  
  body('guest')
    .optional({ values: 'falsy' })
    .isObject().withMessage('Guest identity must be an object'),

  body('guest.name')
    .if(body('guest').exists())
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Please enter your full name'),

  body('guest.email')
    .if(body('guest').exists())
    .trim()
    .isEmail().withMessage('Please enter a valid email address')
    .isLength({ max: 254 }).withMessage('Email is too long'),

  body('formData')
    .notEmpty().withMessage('Form data is required')
    .isObject().withMessage('Form data must be an object'),
  
  // Common form fields validation
  body('formData.name')
    .optional({ values: 'falsy' })
    .trim()
    .isString().withMessage('Name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('formData.email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Invalid email in form data'),
  
  body('formData.phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[\d\s\+\-\(\)]+$/).withMessage('Invalid phone number format'),
  
  body('formData.companyName')
    .optional({ values: 'falsy' })
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

module.exports = {
  handleValidationErrors,
  validateFormSubmission,
  validateClaimStatusUpdate,
  validateFormStatusUpdate,
  validatePagination,
  sanitizeHtmlFields,
};
