'use strict';

module.exports = function register(app, ctx) {
  const {
    admin,
    body,
    db,
    handleValidationErrors,
    logAction,
    logSecurityEvent,
    requireAuth,
    requireClaims,
    requireSuperAdmin,
    resetDataproRateLimit,
    resetVerifydataRateLimit,
  } = ctx;

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

    // Get total count for pagination
    // NOTE: For large collections, consider using a counter document or aggregation query
    // For now, we'll estimate based on the current page results
    console.log('🔢 Estimating total count...');
    let totalCount;
    
    // If we got fewer results than the limit, we're on the last page
    if (snapshot.size < limitNum) {
      totalCount = offset + snapshot.size;
    } else {
      // Estimate: if we have full pages, there's likely more data
      // This avoids reading all documents
      totalCount = (pageNum * limitNum) + 1; // +1 indicates "more pages available"
    }
    console.log('📊 Estimated total events:', totalCount);

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

// ============= RATE LIMIT RESET ENDPOINT =============
// ✅ PROTECTED: Requires super admin role
// POST /api/admin/rate-limit/reset
// Reset rate limiter for Datapro or VerifyData API
app.post('/api/admin/rate-limit/reset', 
  requireAuth, 
  requireSuperAdmin,
  [
    body('service')
      .trim()
      .notEmpty().withMessage('Service is required')
      .isIn(['datapro', 'verifydata']).withMessage('Service must be either "datapro" or "verifydata"'),
    body('reason')
      .trim()
      .notEmpty().withMessage('Reason is required')
      .isString().withMessage('Reason must be a string')
      .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { service, reason } = req.body;
      
      console.log(`🔄 Rate limit reset requested by ${req.user.email} for ${service}`);
      console.log(`📝 Reason: ${reason}`);
      
      // Reset the appropriate rate limiter
      if (service === 'datapro') {
        resetDataproRateLimit();
      } else if (service === 'verifydata') {
        resetVerifydataRateLimit();
      }
      
      // Log the rate limit reset event
      try {
        await logSecurityEvent({
          eventType: 'rate_limit_reset',
          severity: 'medium',
          description: `Rate limit reset for ${service} by ${req.user.email}`,
          userId: req.user.uid,
          ipAddress: req.ipData?.masked || 'unknown',
          metadata: {
            service,
            reason,
            resetBy: req.user.email,
            resetByUid: req.user.uid,
            resetByRole: req.user.role,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('❌ Failed to log rate limit reset:', logError.message);
        // Continue even if logging fails
      }
      
      console.log(`✅ Rate limit reset successful for ${service}`);
      
      res.json({
        success: true,
        message: `Rate limit reset successful for ${service}`,
        service,
        resetBy: req.user.email,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error resetting rate limit:', error);
      res.status(500).json({
        error: 'Rate limit reset failed',
        message: 'Unable to reset rate limit. Please try again or contact support.'
      });
    }
  }
);

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
        actorUid: req.user?.uid || 'current-user',
        actorDisplayName: req.user?.displayName || req.user?.email?.split('@')[0] || 'Current User',
        actorEmail: req.user?.email || 'current.user@example.com',
        actorRole: 'admin',
        targetType: 'user',
        targetId: req.user?.uid || 'current-user',
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
};
