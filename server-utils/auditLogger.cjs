/**
 * Audit Logger
 * 
 * Comprehensive audit logging for security-sensitive operations.
 * Logs all verification attempts, API calls, and encryption operations.
 * 
 * Security Requirements:
 * - Log all verification attempts (success and failure)
 * - Log all API calls with masked sensitive data
 * - Log all encryption/decryption operations
 * - Store logs in Firestore: verification-audit-logs
 * - Never log plaintext sensitive data (NIN, BVN, CAC, passwords, keys)
 * - Include timestamp, user, action, result, and context
 */

const admin = require('firebase-admin');

/**
 * Mask sensitive data for logging
 * Shows only first 4 characters, rest are asterisks
 * @param {string} data - Sensitive data to mask
 * @param {number} visibleChars - Number of characters to show (default: 4)
 * @returns {string} Masked data
 */
function maskSensitiveData(data, visibleChars = 4) {
  if (!data || typeof data !== 'string') return '****';
  if (data.length <= visibleChars) return '*'.repeat(data.length);
  return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

/**
 * Get Firestore database instance
 * @returns {FirebaseFirestore.Firestore}
 */
function getDb() {
  return admin.firestore();
}

/**
 * Log verification attempt
 * CRITICAL FIX: Fire-and-forget with timeout to prevent blocking
 * 
 * @param {Object} params - Verification attempt parameters
 * @param {string} params.verificationType - Type of verification (NIN, BVN, CAC)
 * @param {string} params.identityNumber - Identity number (will be masked)
 * @param {string} params.userId - User ID (if authenticated)
 * @param {string} params.userEmail - User email (if authenticated)
 * @param {string} params.userName - User name (if authenticated)
 * @param {string} params.userType - User type ('user', 'customer', 'system')
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.result - Result (success, failure, error)
 * @param {string} params.errorCode - Error code (if failed)
 * @param {string} params.errorMessage - Error message (if failed)
 * @param {string} params.apiProvider - API provider ('datapro' or 'verifydata')
 * @param {number} params.cost - Cost of the API call in Naira
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logVerificationAttempt(params) {
  // Fire-and-forget: Don't block the response
  setImmediate(async () => {
    try {
      const {
        verificationType,
        identityNumber,
        userId,
        userEmail,
        userName,
        userType,
        ipAddress,
        result,
        errorCode,
        errorMessage,
        apiProvider,
        cost,
        metadata = {}
      } = params;

      const db = getDb();
      const logEntry = {
        // Event information
        eventType: 'verification_attempt',
        verificationType: verificationType || 'unknown',
        
        // Masked sensitive data
        identityNumberMasked: maskSensitiveData(identityNumber),
        
        // User information
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous',
        userName: userName || 'Anonymous',
        userType: userType || 'customer', // 'user', 'customer', 'system'
        ipAddress: ipAddress || 'unknown',
        
        // Result
        result: result, // 'success', 'failure', 'error'
        errorCode: errorCode || null,
        errorMessage: errorMessage || null,
        
        // API provider and cost
        apiProvider: apiProvider || 'unknown',
        cost: cost || 0,
        
        // Metadata
        metadata: {
          ...metadata,
          userAgent: metadata.userAgent || 'unknown',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        
        // Timestamp
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Use Promise.race for timeout (5 seconds max)
      await Promise.race([
        db.collection('verification-audit-logs').add(logEntry),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Audit log timeout after 5000ms')), 5000)
        )
      ]);
      
      console.log(`📝 [AUDIT] Verification attempt logged: ${verificationType} - ${result}`);
    } catch (error) {
      console.error('❌ Failed to log verification attempt:', error.message);
      // Don't throw - logging failures shouldn't break the application
    }
  });
}

/**
 * Log API call
 * 
 * @param {Object} params - API call parameters
 * @param {string} params.apiName - Name of the API (Datapro, Paystack, etc.)
 * @param {string} params.endpoint - API endpoint
 * @param {string} params.method - HTTP method
 * @param {string} params.requestData - Request data (will be masked)
 * @param {number} params.statusCode - Response status code
 * @param {string} params.responseData - Response data (will be masked)
 * @param {number} params.duration - Request duration in ms
 * @param {string} params.userId - User ID (if authenticated)
 * @param {string} params.userName - User name (if authenticated)
 * @param {string} params.userType - User type ('user', 'customer', 'system')
 * @param {string} params.ipAddress - Client IP address
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logAPICall(params) {
  try {
    const {
      apiName,
      endpoint,
      method,
      requestData,
      statusCode,
      responseData,
      duration,
      userId,
      userName,
      userType,
      ipAddress,
      metadata = {}
    } = params;

    const db = getDb();
    
    // Determine success from status code
    const isSuccess = statusCode >= 200 && statusCode < 300;
    
    const logEntry = {
      // Event information
      eventType: 'api_call',
      apiName: apiName || 'unknown',
      endpoint: endpoint || 'unknown',
      method: method || 'unknown',
      
      // Request/Response (masked)
      requestDataMasked: maskRequestData(requestData),
      statusCode: statusCode || 0,
      responseDataMasked: maskResponseData(responseData),
      duration: duration || 0,
      success: isSuccess,
      result: isSuccess ? 'success' : 'failure',
      
      // User information
      userId: userId || 'system',
      userName: userName || 'System',
      userType: userType || 'system', // 'user', 'customer', 'system'
      ipAddress: ipAddress || 'unknown',
      
      // Metadata
      metadata: {
        ...metadata,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Timestamp
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('verification-audit-logs').add(logEntry);
    
    console.log(`📝 [AUDIT] API call logged: ${apiName} ${endpoint} - ${statusCode}`);
  } catch (error) {
    console.error('❌ Failed to log API call:', error.message);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log encryption operation
 * 
 * @param {Object} params - Encryption operation parameters
 * @param {string} params.operation - Operation type (encrypt, decrypt)
 * @param {string} params.dataType - Type of data (NIN, BVN, CAC, etc.)
 * @param {string} params.userId - User ID (if authenticated)
 * @param {string} params.result - Result (success, failure)
 * @param {string} params.errorMessage - Error message (if failed)
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logEncryptionOperation(params) {
  try {
    const {
      operation,
      dataType,
      userId,
      result,
      errorMessage,
      metadata = {}
    } = params;

    const db = getDb();
    const logEntry = {
      // Event information
      eventType: 'encryption_operation',
      operation: operation, // 'encrypt' or 'decrypt'
      dataType: dataType || 'unknown',
      
      // User information
      userId: userId || 'system',
      
      // Result
      result: result, // 'success' or 'failure'
      errorMessage: errorMessage || null,
      
      // Metadata
      metadata: {
        ...metadata,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Timestamp
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('verification-audit-logs').add(logEntry);
    
    // Only log in development to reduce noise
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 [AUDIT] Encryption operation logged: ${operation} ${dataType} - ${result}`);
    }
  } catch (error) {
    console.error('❌ Failed to log encryption operation:', error.message);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log security event
 * 
 * @param {Object} params - Security event parameters
 * @param {string} params.eventType - Type of security event
 * @param {string} params.severity - Severity (low, medium, high, critical)
 * @param {string} params.description - Event description
 * @param {string} params.userId - User ID (if applicable)
 * @param {string} params.ipAddress - Client IP address
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logSecurityEvent(params) {
  try {
    const {
      eventType,
      severity,
      description,
      userId,
      ipAddress,
      metadata = {}
    } = params;

    const db = getDb();
    const logEntry = {
      // Event information
      eventType: 'security_event',
      securityEventType: eventType,
      severity: severity || 'medium',
      description: description || 'No description provided',
      
      // User information
      userId: userId || 'unknown',
      ipAddress: ipAddress || 'unknown',
      
      // Metadata
      metadata: {
        ...metadata,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Timestamp
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('verification-audit-logs').add(logEntry);
    
    console.warn(`🔒 [SECURITY] ${severity.toUpperCase()}: ${eventType} - ${description}`);
  } catch (error) {
    console.error('❌ Failed to log security event:', error.message);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log bulk operation
 * 
 * @param {Object} params - Bulk operation parameters
 * @param {string} params.operationType - Type of operation (bulk_verification, bulk_upload, etc.)
 * @param {number} params.totalRecords - Total number of records
 * @param {number} params.successCount - Number of successful operations
 * @param {number} params.failureCount - Number of failed operations
 * @param {string} params.userId - User ID
 * @param {string} params.userEmail - User email
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logBulkOperation(params) {
  try {
    const {
      operationType,
      totalRecords,
      successCount,
      failureCount,
      userId,
      userEmail,
      metadata = {}
    } = params;

    const db = getDb();
    const logEntry = {
      // Event information
      eventType: 'bulk_operation',
      operationType: operationType,
      
      // Statistics
      totalRecords: totalRecords || 0,
      successCount: successCount || 0,
      failureCount: failureCount || 0,
      successRate: totalRecords > 0 ? (successCount / totalRecords * 100).toFixed(2) : 0,
      
      // User information
      userId: userId || 'unknown',
      userEmail: userEmail || 'unknown',
      
      // Metadata
      metadata: {
        ...metadata,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Timestamp
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('verification-audit-logs').add(logEntry);
    
    console.log(`📝 [AUDIT] Bulk operation logged: ${operationType} - ${successCount}/${totalRecords} successful`);
  } catch (error) {
    console.error('❌ Failed to log bulk operation:', error.message);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Mask request data for logging
 * Removes sensitive fields from request data
 * @param {Object|string} data - Request data
 * @returns {Object|string} Masked data
 */
function maskRequestData(data) {
  if (!data) return null;
  
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return '[UNPARSEABLE]';
    }
  }
  
  if (typeof data !== 'object') return '[INVALID_TYPE]';
  
  const masked = { ...data };
  
  // Mask sensitive fields
  const sensitiveFields = ['nin', 'bvn', 'cac', 'password', 'secretKey', 'apiKey', 'serviceid', 'identityNumber'];
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = maskSensitiveData(String(masked[field]));
    }
  }
  
  return masked;
}

/**
 * Mask response data for logging
 * Removes sensitive fields from response data
 * @param {Object|string} data - Response data
 * @returns {Object|string} Masked data
 */
function maskResponseData(data) {
  if (!data) return null;
  
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return '[UNPARSEABLE]';
    }
  }
  
  if (typeof data !== 'object') return '[INVALID_TYPE]';
  
  const masked = { ...data };
  
  // Mask sensitive fields
  const sensitiveFields = ['nin', 'bvn', 'cac', 'password', 'photo', 'signature', 'identityNumber'];
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = maskSensitiveData(String(masked[field]));
    }
  }
  
  // Mask nested data
  if (masked.data && typeof masked.data === 'object') {
    masked.data = maskResponseData(masked.data);
  }
  
  if (masked.ResponseData && typeof masked.ResponseData === 'object') {
    // Datapro response structure
    if (masked.ResponseData.photo) masked.ResponseData.photo = '[REDACTED]';
    if (masked.ResponseData.signature) masked.ResponseData.signature = '[REDACTED]';
  }
  
  return masked;
}

/**
 * Query audit logs
 * 
 * @param {Object} filters - Query filters
 * @param {string} filters.eventType - Filter by event type
 * @param {string} filters.userId - Filter by user ID
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {number} filters.limit - Limit number of results (default: 100)
 * @returns {Promise<Array>} Array of log entries
 */
async function queryAuditLogs(filters = {}) {
  try {
    const db = getDb();
    let query = db.collection('verification-audit-logs');
    
    // Apply filters
    if (filters.eventType) {
      query = query.where('eventType', '==', filters.eventType);
    }
    
    if (filters.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    
    if (filters.startDate) {
      query = query.where('createdAt', '>=', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.where('createdAt', '<=', filters.endDate);
    }
    
    // Order by timestamp descending
    query = query.orderBy('createdAt', 'desc');
    
    // Limit results
    const limit = filters.limit || 100;
    query = query.limit(limit);
    
    const snapshot = await query.get();
    
    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return logs;
  } catch (error) {
    console.error('❌ Failed to query audit logs:', error.message);
    throw error;
  }
}

/**
 * Get audit log statistics
 * 
 * @param {Object} filters - Query filters
 * @param {Date} filters.startDate - Start date
 * @param {Date} filters.endDate - End date
 * @returns {Promise<Object>} Statistics object
 */
async function getAuditLogStats(filters = {}) {
  try {
    const db = getDb();
    let query = db.collection('verification-audit-logs');
    
    if (filters.startDate) {
      query = query.where('createdAt', '>=', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.where('createdAt', '<=', filters.endDate);
    }
    
    const snapshot = await query.get();
    
    const stats = {
      total: snapshot.size,
      byEventType: {},
      byResult: {},
      byVerificationType: {}
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Count by event type
      stats.byEventType[data.eventType] = (stats.byEventType[data.eventType] || 0) + 1;
      
      // Count by result (for verification attempts)
      if (data.result) {
        stats.byResult[data.result] = (stats.byResult[data.result] || 0) + 1;
      }
      
      // Count by verification type
      if (data.verificationType) {
        stats.byVerificationType[data.verificationType] = (stats.byVerificationType[data.verificationType] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get audit log stats:', error.message);
    throw error;
  }
}

/**
 * Log form view event
 * 
 * @param {Object} params - Form view parameters
 * @param {string} params.userId - User ID (if authenticated)
 * @param {string} params.userRole - User role
 * @param {string} params.userEmail - User email
 * @param {string} params.formType - Form type (kyc, nfiu)
 * @param {string} params.formVariant - Form variant (individual, corporate)
 * @param {string} params.ipAddress - Client IP address
 * @param {Object} params.deviceInfo - Device information
 * @param {Object} params.location - Location information
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logFormView(params) {
  try {
    const {
      userId,
      userRole,
      userEmail,
      formType,
      formVariant,
      ipAddress,
      deviceInfo,
      location,
      metadata = {}
    } = params;

    const db = getDb();
    const logEntry = {
      // Event information
      eventType: 'form_view',
      formType: formType || 'unknown',
      formVariant: formVariant || 'unknown',
      
      // User information
      userId: userId || 'anonymous',
      userRole: userRole || 'customer',
      userEmail: userEmail || 'anonymous',
      ipAddress: ipAddress || 'unknown',
      
      // Device and location
      deviceInfo: deviceInfo || {},
      location: location || {},
      
      // Metadata
      metadata: {
        ...metadata,
        userAgent: deviceInfo?.userAgent || 'unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Timestamp
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('verification-audit-logs').add(logEntry);
    
    console.log(`📝 [AUDIT] Form view logged: ${formType}-${formVariant} by ${userId || 'anonymous'}`);
  } catch (error) {
    console.error('❌ Failed to log form view:', error.message);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log form submission event
 * 
 * @param {Object} params - Form submission parameters
 * @param {string} params.userId - User ID
 * @param {string} params.userRole - User role
 * @param {string} params.userEmail - User email
 * @param {string} params.formType - Form type (kyc, nfiu)
 * @param {string} params.formVariant - Form variant (individual, corporate)
 * @param {string} params.submissionId - Submission document ID
 * @param {string} params.ipAddress - Client IP address
 * @param {Object} params.deviceInfo - Device information
 * @param {Object} params.location - Location information
 * @param {Object} params.formData - Form data (will be masked)
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logFormSubmission(params) {
  try {
    const {
      userId,
      userRole,
      userEmail,
      formType,
      formVariant,
      submissionId,
      ipAddress,
      deviceInfo,
      location,
      formData,
      metadata = {}
    } = params;

    const db = getDb();
    const logEntry = {
      // Event information
      eventType: 'form_submission',
      formType: formType || 'unknown',
      formVariant: formVariant || 'unknown',
      submissionId: submissionId || 'unknown',
      
      // User information
      userId: userId || 'unknown',
      userRole: userRole || 'customer',
      userEmail: userEmail || 'unknown',
      ipAddress: ipAddress || 'unknown',
      
      // Device and location
      deviceInfo: deviceInfo || {},
      location: location || {},
      
      // Masked form data
      formDataMasked: maskFormData(formData),
      
      // Metadata
      metadata: {
        ...metadata,
        userAgent: deviceInfo?.userAgent || 'unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Timestamp
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('verification-audit-logs').add(logEntry);
    
    console.log(`📝 [AUDIT] Form submission logged: ${formType}-${formVariant} by ${userId} (${submissionId})`);
  } catch (error) {
    console.error('❌ Failed to log form submission:', error.message);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log document upload event
 * 
 * @param {Object} params - Document upload parameters
 * @param {string} params.userId - User ID
 * @param {string} params.userRole - User role
 * @param {string} params.userEmail - User email
 * @param {string} params.formType - Form type (kyc, nfiu)
 * @param {string} params.documentType - Document type (identification, cac, etc.)
 * @param {string} params.fileName - File name
 * @param {number} params.fileSize - File size in bytes
 * @param {string} params.ipAddress - Client IP address
 * @param {Object} params.deviceInfo - Device information
 * @param {Object} params.location - Location information
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logDocumentUpload(params) {
  try {
    const {
      userId,
      userRole,
      userEmail,
      formType,
      documentType,
      fileName,
      fileSize,
      ipAddress,
      deviceInfo,
      location,
      metadata = {}
    } = params;

    const db = getDb();
    const logEntry = {
      // Event information
      eventType: 'document_upload',
      formType: formType || 'unknown',
      documentType: documentType || 'unknown',
      fileName: fileName || 'unknown',
      fileSize: fileSize || 0,
      
      // User information
      userId: userId || 'unknown',
      userRole: userRole || 'customer',
      userEmail: userEmail || 'unknown',
      ipAddress: ipAddress || 'unknown',
      
      // Device and location
      deviceInfo: deviceInfo || {},
      location: location || {},
      
      // Metadata
      metadata: {
        ...metadata,
        userAgent: deviceInfo?.userAgent || 'unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Timestamp
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('verification-audit-logs').add(logEntry);
    
    console.log(`📝 [AUDIT] Document upload logged: ${documentType} by ${userId} (${fileName}, ${fileSize} bytes)`);
  } catch (error) {
    console.error('❌ Failed to log document upload:', error.message);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log admin action event
 * 
 * @param {Object} params - Admin action parameters
 * @param {string} params.adminUserId - Admin user ID
 * @param {string} params.adminRole - Admin role
 * @param {string} params.adminEmail - Admin email
 * @param {string} params.formType - Form type (kyc, nfiu)
 * @param {string} params.formVariant - Form variant (individual, corporate)
 * @param {string} params.submissionId - Submission document ID
 * @param {string} params.action - Action performed (view, edit, approve, reject)
 * @param {Array<string>} params.changedFields - Fields that were changed (for edit actions)
 * @param {Object} params.oldValues - Old values (masked)
 * @param {Object} params.newValues - New values (masked)
 * @param {string} params.ipAddress - Client IP address
 * @param {Object} params.deviceInfo - Device information
 * @param {Object} params.location - Location information
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logAdminAction(params) {
  try {
    const {
      adminUserId,
      adminRole,
      adminEmail,
      formType,
      formVariant,
      submissionId,
      action,
      changedFields,
      oldValues,
      newValues,
      ipAddress,
      deviceInfo,
      location,
      metadata = {}
    } = params;

    const db = getDb();
    const logEntry = {
      // Event information
      eventType: 'admin_action',
      formType: formType || 'unknown',
      formVariant: formVariant || 'unknown',
      submissionId: submissionId || 'unknown',
      action: action || 'unknown', // view, edit, approve, reject
      
      // Admin information
      adminUserId: adminUserId || 'unknown',
      adminRole: adminRole || 'admin',
      adminEmail: adminEmail || 'unknown',
      ipAddress: ipAddress || 'unknown',
      
      // Device and location
      deviceInfo: deviceInfo || {},
      location: location || {},
      
      // Change tracking (for edit actions)
      changedFields: changedFields || [],
      oldValuesMasked: oldValues ? maskFormData(oldValues) : null,
      newValuesMasked: newValues ? maskFormData(newValues) : null,
      
      // Metadata
      metadata: {
        ...metadata,
        userAgent: deviceInfo?.userAgent || 'unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Timestamp
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('verification-audit-logs').add(logEntry);
    
    console.log(`📝 [AUDIT] Admin action logged: ${action} on ${formType}-${formVariant} by ${adminUserId} (${submissionId})`);
  } catch (error) {
    console.error('❌ Failed to log admin action:', error.message);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Mask form data for logging
 * Masks sensitive fields (NIN, BVN, account numbers, etc.)
 * @param {Object} formData - Form data to mask
 * @returns {Object} Masked form data
 */
function maskFormData(formData) {
  if (!formData || typeof formData !== 'object') return null;
  
  const masked = { ...formData };
  
  // Sensitive fields to mask
  const sensitiveFields = [
    'NIN', 'nin', 'NINNumber',
    'BVN', 'bvn', 'BVNNumber',
    'CAC', 'cac', 'cacNumber',
    'taxIDNo', 'taxIDNumber',
    'idNumber', 'identificationType',
    'localAccountNumber', 'foreignAccountNumber',
    'accountNumber', 'bankAccountNumber'
  ];
  
  // Mask top-level sensitive fields
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = maskSensitiveData(String(masked[field]));
    }
  }
  
  // Mask directors array if present
  if (Array.isArray(masked.directors)) {
    masked.directors = masked.directors.map(director => {
      const maskedDirector = { ...director };
      for (const field of sensitiveFields) {
        if (maskedDirector[field]) {
          maskedDirector[field] = maskSensitiveData(String(maskedDirector[field]));
        }
      }
      return maskedDirector;
    });
  }
  
  return masked;
}

module.exports = {
  logVerificationAttempt,
  logAPICall,
  logEncryptionOperation,
  logSecurityEvent,
  logBulkOperation,
  logFormView,
  logFormSubmission,
  logDocumentUpload,
  logAdminAction,
  queryAuditLogs,
  getAuditLogStats,
  maskSensitiveData,
  maskFormData
};
