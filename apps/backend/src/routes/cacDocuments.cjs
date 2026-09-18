'use strict';

module.exports = function register(app, ctx) {
  const {
    admin,
    canAccessIdentityList,
    createAuditLog,
    db,
    decryptData,
    encryptData,
    requireAuth,
    requireBrokerOrAdmin,
  } = ctx;

// ============= CAC DOCUMENT UPLOAD MANAGEMENT API =============

/**
 * Upload CAC Document
 * 
 * POST /api/cac-documents/upload
 * 
 * Body:
 * - file: File (multipart/form-data)
 * - documentType: string (certificate_of_incorporation, particulars_of_directors, share_allotment)
 * - identityRecordId: string
 * - isReplacement: boolean
 * - replacementReason: string (optional)
 * 
 * Requirements: 3.2, 3.6, 4.1, 5.1, 11.2
 */
app.post('/api/cac-documents/upload', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { documentType, identityRecordId, isReplacement, replacementReason } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    
    console.log(`📄 User ${userEmail} uploading CAC document: ${documentType} for identity ${identityRecordId}`);
    
    // Validate required fields
    if (!documentType || !identityRecordId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'documentType and identityRecordId are required'
      });
    }
    
    // Validate document type
    const validDocumentTypes = ['certificate_of_incorporation', 'particulars_of_directors', 'share_allotment'];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        error: 'Invalid document type',
        message: `documentType must be one of: ${validDocumentTypes.join(', ')}`
      });
    }
    
    // Check access control - user must have access to the identity record
    const identityRef = db.collection('identity-lists').doc(identityRecordId);
    const identityDoc = await identityRef.get();
    
    if (!identityDoc.exists) {
      return res.status(404).json({
        error: 'Identity record not found',
        message: `Identity record ${identityRecordId} does not exist`
      });
    }
    
    const identityData = identityDoc.data();
    const userRole = req.user.role;
    
    // Check if user has access to this identity record
    const hasAccess = await canAccessIdentityList(userId, userRole, identityRecordId);
    if (!hasAccess) {
      // Log failed access attempt
      await createAuditLog('cac_document_upload_denied', {
        documentType,
        identityRecordId,
        reason: 'Insufficient permissions'
      }, 'user', userId, {
        userEmail,
        userRole
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to upload documents for this identity record'
      });
    }
    
    // Note: File upload handling would be done on the frontend with Firebase Storage
    // This endpoint receives metadata after successful upload
    // The actual file upload is handled by the frontend cacStorageService
    
    // Log successful upload
    await createAuditLog('cac_document_uploaded', {
      documentType,
      identityRecordId,
      isReplacement: isReplacement || false,
      replacementReason: replacementReason || null
    }, 'user', userId, {
      userEmail,
      userRole
    });
    
    console.log(`✅ CAC document upload logged for identity ${identityRecordId}`);
    
    res.status(200).json({
      success: true,
      message: 'Document upload logged successfully'
    });
    
  } catch (error) {
    console.error('❌ Error handling CAC document upload:', error);
    res.status(500).json({
      error: 'Failed to process document upload',
      message: error.message
    });
  }
});

/**
 * Get CAC Document by ID
 * 
 * GET /api/cac-documents/:documentId
 * 
 * Requirements: 3.2, 4.1
 */
app.get('/api/cac-documents/:documentId', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    const userRole = req.user.role;
    
    console.log(`📄 User ${userEmail} requesting CAC document: ${documentId}`);
    
    // Get document metadata from Firestore
    const docRef = db.collection('cac-documents').doc(documentId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({
        error: 'Document not found',
        message: `Document ${documentId} does not exist`
      });
    }
    
    const docData = docSnap.data();
    const identityRecordId = docData.identityRecordId;
    
    // Check access control
    const hasAccess = await canAccessIdentityList(userId, userRole, identityRecordId);
    if (!hasAccess) {
      // Log failed access attempt
      await createAuditLog('cac_document_access_denied', {
        documentId,
        identityRecordId,
        action: 'view',
        reason: 'Insufficient permissions'
      }, 'user', userId, {
        userEmail,
        userRole
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this document'
      });
    }
    
    // Log successful access
    await createAuditLog('cac_document_viewed', {
      documentId,
      identityRecordId,
      documentType: docData.documentType
    }, 'user', userId, {
      userEmail,
      userRole
    });
    
    console.log(`✅ CAC document ${documentId} accessed by ${userEmail}`);
    
    res.status(200).json({
      success: true,
      document: docData
    });
    
  } catch (error) {
    console.error('❌ Error retrieving CAC document:', error);
    res.status(500).json({
      error: 'Failed to retrieve document',
      message: error.message
    });
  }
});

/**
 * Get CAC Documents by Identity Record ID
 * 
 * GET /api/cac-documents/identity/:identityId
 * 
 * Requirements: 3.6, 4.1
 */
app.get('/api/cac-documents/identity/:identityId', requireAuth, async (req, res) => {
  try {
    const { identityId } = req.params;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    const userRole = req.user.role;
    
    console.log(`📄 User ${userEmail} requesting CAC documents for identity: ${identityId}`);
    
    // Check access control
    const hasAccess = await canAccessIdentityList(userId, userRole, identityId);
    if (!hasAccess) {
      // Log failed access attempt
      await createAuditLog('cac_documents_access_denied', {
        identityRecordId: identityId,
        action: 'list',
        reason: 'Insufficient permissions'
      }, 'user', userId, {
        userEmail,
        userRole
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view documents for this identity record'
      });
    }
    
    // Query documents for this identity record
    const docsSnapshot = await db.collection('cac-documents')
      .where('identityRecordId', '==', identityId)
      .where('isLatest', '==', true)
      .orderBy('uploadedAt', 'desc')
      .get();
    
    const documents = [];
    docsSnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Log successful access
    await createAuditLog('cac_documents_listed', {
      identityRecordId: identityId,
      documentCount: documents.length
    }, 'user', userId, {
      userEmail,
      userRole
    });
    
    console.log(`✅ Retrieved ${documents.length} CAC documents for identity ${identityId}`);
    
    res.status(200).json({
      success: true,
      documents,
      count: documents.length
    });
    
  } catch (error) {
    console.error('❌ Error retrieving CAC documents:', error);
    res.status(500).json({
      error: 'Failed to retrieve documents',
      message: error.message
    });
  }
});

/**
 * Replace CAC Document
 * 
 * PUT /api/cac-documents/:documentId/replace
 * 
 * Body:
 * - replacementReason: string (optional)
 * 
 * Requirements: 11.2, 4.1, 5.1
 */
app.put('/api/cac-documents/:documentId/replace', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { replacementReason } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    const userRole = req.user.role;
    
    console.log(`📄 User ${userEmail} replacing CAC document: ${documentId}`);
    
    // Get existing document metadata
    const docRef = db.collection('cac-documents').doc(documentId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({
        error: 'Document not found',
        message: `Document ${documentId} does not exist`
      });
    }
    
    const docData = docSnap.data();
    const identityRecordId = docData.identityRecordId;
    
    // Check access control
    const hasAccess = await canAccessIdentityList(userId, userRole, identityRecordId);
    if (!hasAccess) {
      // Log failed access attempt
      await createAuditLog('cac_document_replace_denied', {
        documentId,
        identityRecordId,
        reason: 'Insufficient permissions'
      }, 'user', userId, {
        userEmail,
        userRole
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to replace this document'
      });
    }
    
    // Note: Actual file replacement is handled by frontend
    // This endpoint logs the replacement event
    
    // Log replacement event
    await createAuditLog('cac_document_replaced', {
      documentId,
      identityRecordId,
      documentType: docData.documentType,
      oldVersion: docData.version,
      newVersion: (docData.version || 1) + 1,
      replacementReason: replacementReason || 'No reason provided'
    }, 'user', userId, {
      userEmail,
      userRole
    });
    
    console.log(`✅ CAC document ${documentId} replacement logged`);
    
    res.status(200).json({
      success: true,
      message: 'Document replacement logged successfully'
    });
    
  } catch (error) {
    console.error('❌ Error handling CAC document replacement:', error);
    res.status(500).json({
      error: 'Failed to process document replacement',
      message: error.message
    });
  }
});

/**
 * Delete CAC Document
 * 
 * DELETE /api/cac-documents/:documentId
 * 
 * Requirements: 4.1, 5.1
 */
app.delete('/api/cac-documents/:documentId', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    const userRole = req.user.role;
    
    console.log(`📄 User ${userEmail} deleting CAC document: ${documentId}`);
    
    // Get document metadata
    const docRef = db.collection('cac-documents').doc(documentId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({
        error: 'Document not found',
        message: `Document ${documentId} does not exist`
      });
    }
    
    const docData = docSnap.data();
    const identityRecordId = docData.identityRecordId;
    
    // Check access control
    const hasAccess = await canAccessIdentityList(userId, userRole, identityRecordId);
    if (!hasAccess) {
      // Log failed access attempt
      await createAuditLog('cac_document_delete_denied', {
        documentId,
        identityRecordId,
        reason: 'Insufficient permissions'
      }, 'user', userId, {
        userEmail,
        userRole
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to delete this document'
      });
    }
    
    // Note: Actual file deletion is handled by frontend
    // This endpoint marks the document as deleted in metadata
    
    // Mark document as deleted
    await docRef.update({
      status: 'deleted',
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: userId,
      isCurrent: false
    });
    
    // Log deletion event
    await createAuditLog('cac_document_deleted', {
      documentId,
      identityRecordId,
      documentType: docData.documentType
    }, 'user', userId, {
      userEmail,
      userRole
    });
    
    console.log(`✅ CAC document ${documentId} deleted by ${userEmail}`);
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting CAC document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

/**
 * Download CAC Document
 * 
 * GET /api/cac-documents/:documentId/download
 * 
 * Requirements: 4.1, 5.1, 9.1
 */
app.get('/api/cac-documents/:documentId/download', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.uid;
    const userEmail = req.user.email;
    const userRole = req.user.role;
    
    console.log(`📄 User ${userEmail} downloading CAC document: ${documentId}`);
    
    // Get document metadata
    const docRef = db.collection('cac-documents').doc(documentId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({
        error: 'Document not found',
        message: `Document ${documentId} does not exist`
      });
    }
    
    const docData = docSnap.data();
    const identityRecordId = docData.identityRecordId;
    
    // Check access control
    const hasAccess = await canAccessIdentityList(userId, userRole, identityRecordId);
    if (!hasAccess) {
      // Log failed access attempt
      await createAuditLog('cac_document_download_denied', {
        documentId,
        identityRecordId,
        reason: 'Insufficient permissions'
      }, 'user', userId, {
        userEmail,
        userRole
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to download this document'
      });
    }
    
    // Log download event
    await createAuditLog('cac_document_downloaded', {
      documentId,
      identityRecordId,
      documentType: docData.documentType,
      filename: docData.filename
    }, 'user', userId, {
      userEmail,
      userRole
    });
    
    console.log(`✅ CAC document ${documentId} download logged for ${userEmail}`);
    
    // Note: Actual file download is handled by frontend using Firebase Storage
    // This endpoint logs the download event and returns metadata
    res.status(200).json({
      success: true,
      document: docData,
      message: 'Download authorized'
    });
    
  } catch (error) {
    console.error('❌ Error handling CAC document download:', error);
    res.status(500).json({
      error: 'Failed to process document download',
      message: error.message
    });
  }
});

/**
 * Encrypt CAC Document
 * 
 * POST /api/cac-documents/encrypt
 * 
 * Body:
 * - data: Base64 data to encrypt
 * 
 * Returns encrypted data with IV
 * 
 * Requirements: 3.2, 3.6, 4.1, 5.1
 */
app.post('/api/cac-documents/encrypt', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  const startTime = Date.now();
  try {
    const { data } = req.body;
    const userEmail = req.user?.email || 'unknown';
    const userId = req.user?.uid || 'unknown';
    const userRole = req.user?.role || 'unknown';
    
    console.log('� [Server Encrypt] Document encryption request received', {
      userEmail,
      userId,
      userRole,
      hasData: !!data,
      dataLength: data?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // Validate required fields
    if (!data) {
      console.error('❌ [Server Encrypt] Missing data field', { userEmail });
      return res.status(400).json({
        success: false,
        error: 'Data is required for encryption'
      });
    }
    
    console.log('🔐 [Server Encrypt] Starting encryption', {
      userEmail,
      dataLength: data.length
    });
    
    // Encrypt the data
    const { encrypted, iv } = encryptData(data);
    
    const duration = Date.now() - startTime;
    console.log('✅ [Server Encrypt] Document encrypted successfully', {
      userEmail,
      userId,
      encryptedDataLength: encrypted?.length || 0,
      ivLength: iv?.length || 0,
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      encrypted,
      iv,
      authTag: '' // Not used by current encryption implementation
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Server Encrypt] Error encrypting document:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userEmail: req.user?.email || 'unknown',
      userId: req.user?.uid || 'unknown',
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to encrypt document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Decrypt CAC Document
 * 
 * POST /api/cac-documents/decrypt
 * 
 * Body:
 * - encryptedData: Base64 encrypted data
 * - iv: Initialization vector
 * 
 * Returns decrypted data as base64
 * 
 * Requirements: 3.2, 3.6, 4.1, 5.1
 */
app.post('/api/cac-documents/decrypt', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  const startTime = Date.now();
  try {
    const { encryptedData, iv } = req.body;
    const userEmail = req.user?.email || 'unknown';
    const userId = req.user?.uid || 'unknown';
    const userRole = req.user?.role || 'unknown';
    
    console.log('🔓 [Server Decrypt] Document decryption request received', {
      userEmail,
      userId,
      userRole,
      hasEncryptedData: !!encryptedData,
      encryptedDataLength: encryptedData?.length || 0,
      hasIV: !!iv,
      ivLength: iv?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // Validate required fields
    if (!encryptedData || !iv) {
      console.error('❌ [Server Decrypt] Missing required fields', {
        hasEncryptedData: !!encryptedData,
        hasIV: !!iv,
        userEmail
      });
      return res.status(400).json({
        success: false,
        error: 'Encrypted data and IV are required'
      });
    }
    
    console.log('🔐 [Server Decrypt] Starting decryption', {
      userEmail,
      encryptedDataLength: encryptedData.length,
      ivLength: iv.length
    });
    
    // Decrypt the data
    const decryptedData = decryptData(encryptedData, iv);
    
    const duration = Date.now() - startTime;
    console.log('✅ [Server Decrypt] Document decrypted successfully', {
      userEmail,
      userId,
      decryptedDataLength: decryptedData?.length || 0,
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      decrypted: decryptedData
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Server Decrypt] Error decrypting document:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userEmail: req.user?.email || 'unknown',
      userId: req.user?.uid || 'unknown',
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to decrypt document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============= END CAC DOCUMENT UPLOAD MANAGEMENT API =============
};
