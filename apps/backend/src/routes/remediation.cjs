'use strict';

// Node's crypto module: the `crypto` global is WebCrypto and has no randomBytes/createHash.
const crypto = require('crypto');

module.exports = function register(app, ctx) {
  const {
    admin,
    createAuditLog,
    createRemediationAuditLog,
    db,
    formatDateLong,
    isValidEmail,
    requireAdmin,
    requireAuth,
    sanitizeEmail,
    sanitizeEmailSubject,
    transporter,
  } = ctx;

// ============= IDENTITY REMEDIATION SYSTEM =============

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
        const expirationDate = formatDateLong(expiresAt);
        
        // Generate email content
        const emailHtml = generateVerificationEmailHtml({
          customerName: record.customerName,
          policyNumber: record.policyNumber,
          brokerName: record.brokerName,
          verificationUrl: verificationUrl,
          expirationDate: expirationDate
        });
        
        const emailSubject = sanitizeEmailSubject(`Action Required: Identity Verification for Policy ${record.policyNumber} - NEM Insurance`);
        const sanitizedEmail = sanitizeEmail(record.email);
        
        // Validate email before sending
        if (!isValidEmail(sanitizedEmail)) {
          console.error('❌ Invalid email address:', record.email);
          throw new Error('Invalid email address format');
        }
        
        // Send email
        await transporter.sendMail({
          from: '"NEM Insurance" <kyc@nem-insurance.com>',
          to: sanitizedEmail,
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
    const { identityNumber, companyName } = req.body;
    const demoMode = process.env.NODE_ENV !== 'production' && req.body.demoMode === true;
    
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
};
