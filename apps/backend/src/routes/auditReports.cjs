'use strict';

module.exports = function register(app, ctx) {
  const {
    logAdminAction,
    logDocumentUpload,
    logFormSubmission,
    logFormView,
    requireAuth,
  } = ctx;

// ============= AUDIT LOGGING API =============

/**
 * Log form view event
 * POST /api/audit/form_view
 * 
 * Body:
 * - userId: string (optional)
 * - userRole: string (optional)
 * - userEmail: string (optional)
 * - formType: string (required)
 * - formVariant: string (required)
 * - deviceInfo: object (optional)
 * - location: object (optional)
 */
app.post('/api/audit/form_view', async (req, res) => {
  try {
    const {
      userId,
      userRole,
      userEmail,
      formType,
      formVariant,
      deviceInfo,
      location
    } = req.body;

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    await logFormView({
      userId,
      userRole,
      userEmail,
      formType,
      formVariant,
      ipAddress,
      deviceInfo,
      location
    });

    res.json({ success: true, message: 'Form view logged' });
  } catch (error) {
    console.error('❌ Failed to log form view:', error);
    res.status(500).json({ error: 'Failed to log form view' });
  }
});

/**
 * Log form submission event
 * POST /api/audit/form_submission
 * 
 * Body:
 * - userId: string (required)
 * - userRole: string (optional)
 * - userEmail: string (optional)
 * - formType: string (required)
 * - formVariant: string (required)
 * - submissionId: string (required)
 * - formData: object (optional, will be masked)
 * - deviceInfo: object (optional)
 * - location: object (optional)
 */
app.post('/api/audit/form_submission', async (req, res) => {
  try {
    const {
      userId,
      userRole,
      userEmail,
      formType,
      formVariant,
      submissionId,
      formData,
      deviceInfo,
      location
    } = req.body;

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    await logFormSubmission({
      userId,
      userRole,
      userEmail,
      formType,
      formVariant,
      submissionId,
      ipAddress,
      deviceInfo,
      location,
      formData
    });

    res.json({ success: true, message: 'Form submission logged' });
  } catch (error) {
    console.error('❌ Failed to log form submission:', error);
    res.status(500).json({ error: 'Failed to log form submission' });
  }
});

/**
 * Log document upload event
 * POST /api/audit/document_upload
 * 
 * Body:
 * - userId: string (required)
 * - userRole: string (optional)
 * - userEmail: string (optional)
 * - formType: string (required)
 * - documentType: string (required)
 * - fileName: string (required)
 * - fileSize: number (required)
 * - deviceInfo: object (optional)
 * - location: object (optional)
 */
app.post('/api/audit/document_upload', async (req, res) => {
  try {
    const {
      userId,
      userRole,
      userEmail,
      formType,
      documentType,
      fileName,
      fileSize,
      deviceInfo,
      location
    } = req.body;

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    await logDocumentUpload({
      userId,
      userRole,
      userEmail,
      formType,
      documentType,
      fileName,
      fileSize,
      ipAddress,
      deviceInfo,
      location
    });

    res.json({ success: true, message: 'Document upload logged' });
  } catch (error) {
    console.error('❌ Failed to log document upload:', error);
    res.status(500).json({ error: 'Failed to log document upload' });
  }
});

/**
 * Log admin action event
 * POST /api/audit/admin_action
 * 
 * Body:
 * - adminUserId: string (required)
 * - adminRole: string (optional)
 * - adminEmail: string (optional)
 * - formType: string (required)
 * - formVariant: string (optional)
 * - submissionId: string (required)
 * - action: string (required) - view, edit, approve, reject
 * - changedFields: array (optional)
 * - oldValues: object (optional, will be masked)
 * - newValues: object (optional, will be masked)
 * - deviceInfo: object (optional)
 * - location: object (optional)
 */
app.post('/api/audit/admin_action', requireAuth, async (req, res) => {
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
      deviceInfo,
      location
    } = req.body;

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    await logAdminAction({
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
      location
    });

    res.json({ success: true, message: 'Admin action logged' });
  } catch (error) {
    console.error('❌ Failed to log admin action:', error);
    res.status(500).json({ error: 'Failed to log admin action' });
  }
});

/**
 * Query audit logs
 * GET /api/audit/logs
 * 
 * Query params:
 * - eventType: string (optional)
 * - userId: string (optional)
 * - formType: string (optional)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - limit: number (optional, default 100)
 * 
 * Requires super admin role
 */

// ============= END AUDIT LOGGING API =============
};
