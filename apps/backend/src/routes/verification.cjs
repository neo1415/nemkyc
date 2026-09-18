'use strict';

/**
 * Identity verification proxies: CAC lookup and the NIN/CAC auto-fill endpoints with database
 * caching, API usage tracking and audit logging. Extracted verbatim from server.js.
 */

module.exports = function register(app, ctx) {
  const {
    admin,
    applyVerifydataRateLimit,
    dataproGetUserFriendlyError,
    dataproVerifyNIN,
    db,
    encryptData,
    hashForCacheLookup,
    logVerificationAttempt,
    logVerificationComplete,
    verificationRateLimiter,
    verifydataGetUserFriendlyError,
    verifydataVerifyCAC,
  } = ctx;

// ============= CAC VERIFICATION PROXY =============

// CAC Verification Proxy
app.post('/api/verify/cac', verificationRateLimiter, async (req, res) => {
  try {
    const { rc_number, company_name, secretKey } = req.body;
    const demoMode = process.env.NODE_ENV !== 'production' && req.body.demoMode === true;
    
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
    
    if (!rc_number || !company_name) {
      return res.status(400).json({ 
        status: false, 
        message: 'RC number and company name are required' 
      });
    }

    console.log('🔍 CAC Verification request for:', rc_number);

    // Log verification attempt before API call (Requirement 2.1, 2.5)
    try {
      await logVerificationAttempt({
        verificationType: 'CAC',
        identityNumber: rc_number, // Will be masked by function
        userId: req.user?.uid || 'anonymous',
        userEmail: req.user?.email || 'anonymous',
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        result: 'pending',
        metadata: {
          userAgent: req.headers['user-agent'],
          demoMode: false
        }
      });
    } catch (logError) {
      console.error('Failed to log verification attempt:', logError);
      // Continue execution - don't throw
    }

    // Apply VerifyData rate limiting
    try {
      await applyVerifydataRateLimit();
    } catch (rateLimitError) {
      console.error('❌ VerifyData rate limit exceeded:', rateLimitError);
      return res.status(429).json({
        status: false,
        message: 'Too many verification requests. Please try again in a moment.'
      });
    }

    // Track API call start time (Requirement 5.2, 5.3, 5.4)
    const apiStartTime = Date.now();

    // Call VerifyData CAC verification API
    const verifydataResult = await verifydataVerifyCAC(rc_number);
    
    // Calculate API call duration (Requirement 5.3, 5.4)
    const apiDuration = Date.now() - apiStartTime;
    
    // ✅ CONSOLIDATED LOGGING - Single call replaces logAPICall + trackVerifydataAPICall + logVerificationAttempt
    // This prevents duplicate audit log entries
    if (verifydataResult.success) {
      console.log('✅ CAC verification successful');
      
      // Single consolidated log for successful verification
      try {
        await logVerificationComplete(db, {
          provider: 'verifydata',
          verificationType: 'CAC',
          success: true,
          listId: null,
          entryId: null,
          identityNumber: rc_number,
          userId: req.user?.uid || 'anonymous',
          userEmail: req.user?.email || 'anonymous',
          userName: req.user?.name || 'Anonymous',
          userType: 'broker', // Demo endpoint - broker testing
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          errorCode: null,
          errorMessage: null,
          metadata: {
            userAgent: req.headers['user-agent'],
            fieldsValidated: verifydataResult.data ? Object.keys(verifydataResult.data) : [],
            demoMode: false,
            apiDuration
          }
        });
      } catch (logError) {
        console.error('Failed to log verification:', logError);
      }
      
      return res.json({
        status: true,
        message: 'CAC verified successfully',
        data: verifydataResult.data
      });
    } else {
      console.log('❌ CAC verification failed:', verifydataResult.error);
      
      // Single consolidated log for failed verification
      try {
        await logVerificationComplete(db, {
          provider: 'verifydata',
          verificationType: 'CAC',
          success: false,
          listId: null,
          entryId: null,
          identityNumber: rc_number,
          userId: req.user?.uid || 'anonymous',
          userEmail: req.user?.email || 'anonymous',
          userName: req.user?.name || 'Anonymous',
          userType: 'broker', // Demo endpoint - broker testing
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          errorCode: verifydataResult.errorCode,
          errorMessage: verifydataResult.error || 'Verification failed',
          metadata: {
            userAgent: req.headers['user-agent'],
            demoMode: false,
            apiDuration
          }
        });
      } catch (logError) {
        console.error('Failed to log verification:', logError);
      }
      
      return res.json({
        status: false,
        message: verifydataGetUserFriendlyError(verifydataResult.errorCode, verifydataResult.details) || 'Verification failed. Please check your CAC/RC number and try again.'
      });
    }
  } catch (error) {
    console.error('❌ CAC verification error:', error);
    
    // Log error verification (Requirement 2.2, 2.3, 2.5)
    try {
      await logVerificationAttempt({
        verificationType: 'CAC',
        identityNumber: req.body.rc_number,
        userId: req.user?.uid || 'anonymous',
        userEmail: req.user?.email || 'anonymous',
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        result: 'error',
        errorCode: 'INTERNAL_ERROR',
        errorMessage: error.message || 'Verification service error',
        metadata: {
          userAgent: req.headers['user-agent'],
          demoMode: false
        }
      });
    } catch (logError) {
      console.error('Failed to log verification attempt:', logError);
    }
    
    return res.status(500).json({ 
      status: false, 
      message: 'Verification service error. Please try again.' 
    });
  }
});

// ============================================================================
// AUTO-FILL VERIFICATION ENDPOINTS WITH DATABASE CACHING
// ============================================================================
// These endpoints support the NIN/CAC auto-fill feature with:
// - Database-backed caching in 'verified-identities' collection
// - Cost savings by preventing duplicate API calls
// - Integration with existing audit logging (metadata.source = 'auto-fill')
// - Integration with existing API usage tracking
// ============================================================================

function getVerificationFailureStatus(errorCode) {
  const code = String(errorCode || '').toUpperCase();
  if (code.includes('RATE_LIMIT') || code.includes('QUOTA')) return 429;
  if (code.includes('INVALID_INPUT') || code.includes('INVALID_FORMAT')) return 400;
  if (
    code.includes('NOT_CONFIGURED') ||
    code.includes('AUTH') ||
    code.includes('TIMEOUT') ||
    code.includes('NETWORK') ||
    code.includes('MAX_RETRIES') ||
    code.includes('SERVICE_UNAVAILABLE')
  ) return 503;
  return 422;
}

// NIN Auto-Fill Verification with Database Caching
app.post('/api/autofill/verify-nin', verificationRateLimiter, async (req, res) => {
  try {
    const { nin, userId, formId, userName, userEmail } = req.body;
    
    // Input validation
    if (!nin || typeof nin !== 'string' || nin.length !== 11 || !/^\d{11}$/.test(nin)) {
      return res.status(400).json({ 
        status: false, 
        message: 'Valid 11-digit NIN is required' 
      });
    }

    console.log('🔍 Auto-fill NIN verification request for:', nin.substring(0, 3) + '********');

    // Step 1: Check database cache first using deterministic hash
    const identityHash = hashForCacheLookup(nin);
    const cacheQuery = await db.collection('verified-identities')
      .where('identityType', '==', 'NIN')
      .where('identityHash', '==', identityHash)
      .where('source', '==', 'auto-fill')
      .limit(1)
      .get();

    // Cache HIT - return cached data
    if (!cacheQuery.empty) {
      const cachedDoc = cacheQuery.docs[0];
      const cachedData = cachedDoc.data();
      
      console.log('✅ Cache HIT - returning cached NIN data (cost = ₦0)');
      
      // Log cache hit with cost = 0
      try {
        await logVerificationAttempt({
          verificationType: 'NIN',
          identityNumber: nin,
          userId: userId || 'anonymous',
          userEmail: userEmail || 'anonymous',
          userName: userName || 'Anonymous',
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          result: 'success',
          metadata: {
            source: 'auto-fill',
            cacheHit: true,
            cost: 0,
            formId: formId || null,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (logError) {
        console.error('Failed to log cache hit:', logError);
      }
      
      return res.json({
        status: true,
        message: 'NIN verified successfully (cached)',
        data: cachedData.verificationData,
        cached: true,
        cachedAt: cachedData.createdAt?.toDate?.() || null
      });
    }

    // Cache MISS - call Datapro API
    console.log('❌ Cache MISS - calling Datapro API (cost = ₦100)');

    // Log verification attempt before API call
    try {
      await logVerificationAttempt({
        verificationType: 'NIN',
        identityNumber: nin,
        userId: userId || 'anonymous',
        userEmail: userEmail || 'anonymous',
        userName: userName || 'Anonymous',
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        result: 'pending',
        metadata: {
          source: 'auto-fill',
          cacheHit: false,
          formId: formId || null,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      console.error('Failed to log verification attempt:', logError);
    }

    // Track API call start time
    const apiStartTime = Date.now();

    // Call Datapro NIN verification API
    const dataproResult = await dataproVerifyNIN(nin);
    
    // Calculate API call duration
    const apiDuration = Date.now() - apiStartTime;
    
    if (dataproResult.success) {
      console.log('✅ NIN verification successful - caching result');
      
      // Store in database cache
      try {
        const encryptedNIN = encryptData(nin);
        await db.collection('verified-identities').add({
          identityType: 'NIN',
          identityHash: identityHash, // Deterministic hash for cache lookups
          encryptedIdentityNumber: encryptedNIN.encrypted, // Encrypted for security
          encryptedIV: encryptedNIN.iv, // IV for decryption
          verificationData: dataproResult.data,
          source: 'auto-fill',
          provider: 'datapro',
          userId: userId || 'anonymous',
          userName: userName || 'Anonymous',
          userEmail: userEmail || 'anonymous',
          formId: formId || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          cost: 100 // ₦100 per NIN verification
        });
        console.log('✅ Verification result cached in database');
      } catch (cacheError) {
        console.error('Failed to cache verification result:', cacheError);
        // Continue execution - caching failure shouldn't block response
      }
      
      // Log successful verification with cost
      try {
        await logVerificationComplete(db, {
          provider: 'datapro',
          verificationType: 'NIN',
          success: true,
          listId: null,
          entryId: null,
          identityNumber: nin,
          userId: userId || 'anonymous',
          userEmail: userEmail || 'anonymous',
          userName: userName || 'Anonymous',
          userType: 'user',
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          errorCode: null,
          errorMessage: null,
          metadata: {
            source: 'auto-fill',
            cacheHit: false,
            formId: formId || null,
            userAgent: req.headers['user-agent'],
            fieldsValidated: dataproResult.data ? Object.keys(dataproResult.data) : [],
            apiDuration
          }
        });
      } catch (logError) {
        console.error('Failed to log verification:', logError);
      }
      
      return res.json({
        status: true,
        message: 'NIN verified successfully',
        data: dataproResult.data,
        cached: false
      });
    } else {
      console.log('❌ NIN verification failed:', dataproResult.error);
      
      // Log failed verification
      try {
        await logVerificationComplete(db, {
          provider: 'datapro',
          verificationType: 'NIN',
          success: false,
          listId: null,
          entryId: null,
          identityNumber: nin,
          userId: userId || 'anonymous',
          userEmail: userEmail || 'anonymous',
          userName: userName || 'Anonymous',
          userType: 'user',
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          errorCode: dataproResult.errorCode,
          errorMessage: dataproResult.error || 'Verification failed',
          metadata: {
            source: 'auto-fill',
            cacheHit: false,
            formId: formId || null,
            userAgent: req.headers['user-agent'],
            apiDuration
          }
        });
      } catch (logError) {
        console.error('Failed to log verification:', logError);
      }
      
      return res.status(getVerificationFailureStatus(dataproResult.errorCode)).json({
        status: false,
        message: dataproGetUserFriendlyError(dataproResult.errorCode, dataproResult.details) || 'Verification failed. Please check your NIN and try again.'
      });
    }
  } catch (error) {
    console.error('❌ Auto-fill NIN verification error:', error);
    
    // Log error verification
    try {
      await logVerificationAttempt({
        verificationType: 'NIN',
        identityNumber: req.body.nin,
        userId: req.body.userId || 'anonymous',
        userEmail: req.body.userEmail || 'anonymous',
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        result: 'error',
        errorCode: 'INTERNAL_ERROR',
        errorMessage: error.message || 'Verification service error',
        metadata: {
          source: 'auto-fill',
          formId: req.body.formId || null,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      console.error('Failed to log verification attempt:', logError);
    }
    
    return res.status(500).json({ 
      status: false, 
      message: 'Verification service error. Please try again.' 
    });
  }
});

// CAC Auto-Fill Verification with Database Caching
app.post('/api/autofill/verify-cac', verificationRateLimiter, async (req, res) => {
  try {
    const { rc_number, userId, formId, userName, userEmail } = req.body;
    
    // Input validation - only RC number is required
    // The VerifyData API returns company name and other details based on RC number lookup
    if (!rc_number || typeof rc_number !== 'string' || rc_number.trim().length === 0) {
      return res.status(400).json({ 
        status: false, 
        message: 'Valid RC number is required' 
      });
    }

    console.log('🔍 Auto-fill CAC verification request for:', rc_number);

    // Step 1: Check database cache first using deterministic hash
    const identityHash = hashForCacheLookup(rc_number);
    const cacheQuery = await db.collection('verified-identities')
      .where('identityType', '==', 'CAC')
      .where('identityHash', '==', identityHash)
      .where('source', '==', 'auto-fill')
      .limit(1)
      .get();

    // Cache HIT - return cached data
    if (!cacheQuery.empty) {
      const cachedDoc = cacheQuery.docs[0];
      const cachedData = cachedDoc.data();
      
      console.log('✅ Cache HIT - returning cached CAC data (cost = ₦0)');
      
      // Log cache hit with cost = 0
      try {
        // Use company name from cached data if userName is Anonymous
        const displayName = (userName === 'Anonymous' || !userName) && cachedData.verificationData?.name 
          ? cachedData.verificationData.name 
          : userName || 'Anonymous';
        
        await logVerificationAttempt({
          verificationType: 'CAC',
          identityNumber: rc_number,
          userId: userId || 'anonymous',
          userEmail: userEmail || '',
          userName: displayName,
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          result: 'success',
          metadata: {
            source: 'auto-fill',
            cacheHit: true,
            cost: 0,
            formId: formId || null,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (logError) {
        console.error('Failed to log cache hit:', logError);
      }
      
      return res.json({
        status: true,
        message: 'CAC verified successfully (cached)',
        data: cachedData.verificationData,
        cached: true,
        cachedAt: cachedData.createdAt?.toDate?.() || null
      });
    }

    // Cache MISS - call VerifyData API
    console.log('❌ Cache MISS - calling VerifyData API (cost = ₦100)');

    // Track API call start time
    const apiStartTime = Date.now();

    // Call VerifyData CAC verification API
    const verifydataResult = await verifydataVerifyCAC(rc_number);
    
    // Calculate API call duration
    const apiDuration = Date.now() - apiStartTime;
    
    if (verifydataResult.success) {
      console.log('✅ CAC verification successful - caching result');
      
      // Store in database cache
      try {
        const encryptedRC = encryptData(rc_number);
        await db.collection('verified-identities').add({
          identityType: 'CAC',
          identityHash: identityHash, // Deterministic hash for cache lookups
          encryptedIdentityNumber: encryptedRC.encrypted, // Encrypted for security
          encryptedIV: encryptedRC.iv, // IV for decryption
          verificationData: verifydataResult.data,
          source: 'auto-fill',
          provider: 'verifydata',
          userId: userId || 'anonymous',
          userName: userName || 'Anonymous',
          userEmail: userEmail || 'anonymous',
          formId: formId || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          cost: 100 // ₦100 per CAC verification
        });
        console.log('✅ Verification result cached in database');
      } catch (cacheError) {
        console.error('Failed to cache verification result:', cacheError);
        // Continue execution - caching failure shouldn't block response
      }
      
      // Log successful verification with cost
      try {
        // Use company name from verification data if userName is Anonymous
        const displayName = (userName === 'Anonymous' || !userName) && verifydataResult.data?.name 
          ? verifydataResult.data.name 
          : userName || 'Anonymous';
        
        await logVerificationComplete(db, {
          provider: 'verifydata',
          verificationType: 'CAC',
          success: true,
          listId: null,
          entryId: null,
          identityNumber: rc_number,
          userId: userId || 'anonymous',
          userEmail: userEmail || '', // Leave empty if not provided
          userName: displayName,
          userType: 'user',
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          errorCode: null,
          errorMessage: null,
          metadata: {
            source: 'auto-fill',
            cacheHit: false,
            formId: formId || null,
            userAgent: req.headers['user-agent'],
            fieldsValidated: verifydataResult.data ? Object.keys(verifydataResult.data) : [],
            apiDuration
          }
        });
      } catch (logError) {
        console.error('Failed to log verification:', logError);
      }
      
      return res.json({
        status: true,
        message: 'CAC verified successfully',
        data: verifydataResult.data,
        cached: false
      });
    } else {
      console.log('❌ CAC verification failed:', verifydataResult.error);
      
      // Log failed verification
      try {
        await logVerificationComplete(db, {
          provider: 'verifydata',
          verificationType: 'CAC',
          success: false,
          listId: null,
          entryId: null,
          identityNumber: rc_number,
          userId: userId || 'anonymous',
          userEmail: userEmail || 'anonymous',
          userName: userName || 'Anonymous',
          userType: 'user',
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          errorCode: verifydataResult.errorCode,
          errorMessage: verifydataResult.error || 'Verification failed',
          metadata: {
            source: 'auto-fill',
            cacheHit: false,
            formId: formId || null,
            userAgent: req.headers['user-agent'],
            apiDuration
          }
        });
      } catch (logError) {
        console.error('Failed to log verification:', logError);
      }
      
      return res.status(getVerificationFailureStatus(verifydataResult.errorCode)).json({
        status: false,
        message: verifydataGetUserFriendlyError(verifydataResult.errorCode, verifydataResult.details) || 'Verification failed. Please check your CAC/RC number and try again.'
      });
    }
  } catch (error) {
    console.error('❌ Auto-fill CAC verification error:', error);
    
    // Log error verification
    try {
      await logVerificationAttempt({
        verificationType: 'CAC',
        identityNumber: req.body.rc_number,
        userId: req.body.userId || 'anonymous',
        userEmail: req.body.userEmail || 'anonymous',
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        result: 'error',
        errorCode: 'INTERNAL_ERROR',
        errorMessage: error.message || 'Verification service error',
        metadata: {
          source: 'auto-fill',
          formId: req.body.formId || null,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      console.error('Failed to log verification attempt:', logError);
    }
    
    return res.status(500).json({ 
      status: false, 
      message: 'Verification service error. Please try again.' 
    });
  }
});
};
