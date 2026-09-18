'use strict';

// Node's crypto module: the `crypto` global is WebCrypto and has no randomBytes/createHash.
const crypto = require('crypto');

module.exports = function register(app, ctx) {
  const {
    admin,
    applyVerifydataRateLimit,
    bulkVerificationRateLimiter,
    calculateVerificationCost,
    checkDuplicate,
    checkUsageLimits,
    clearSensitiveData,
    createCACDocumentAuditLog,
    createVerificationError,
    dataproGetTechnicalError,
    dataproGetUserFriendlyError,
    dataproMatchFields,
    dataproVerifyNIN,
    db,
    decryptData,
    encryptData,
    enqueueVerification,
    formatDateLong,
    getAPIUsageStats,
    getDataproRateLimitStatus,
    getMonthlyUsageSummary,
    getQueueStats,
    getQueueStatus,
    getUserQueueItems,
    isEncrypted,
    isValidEmail,
    logAPICall,
    logAuditSecurityEvent,
    logBulkOperation,
    logVerificationAttempt,
    logVerificationComplete,
    normalizeRole,
    requireAdmin,
    requireAuth,
    requireBrokerOrAdmin,
    requireRole,
    sanitizeEmail,
    sanitizeEmailSubject,
    sendEmail,
    transporter,
    upload,
    validateIdentityFormat,
    verificationRateLimiter,
    verifydataGetTechnicalError,
    verifydataGetUserFriendlyError,
    verifydataMatchCACFields,
    verifydataVerifyCAC,
  } = ctx;

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
 * Track a VerifyData API call for cost monitoring
 * Similar to trackDataproAPICall but for VerifyData CAC verification
 * 
 * @param {Object} db - Firestore database instance
 * @param {Object} callData - API call data
 * @param {string} callData.rcNumber - Masked RC number (first 4 chars only)
 * @param {boolean} callData.success - Whether the call succeeded
 * @param {string} callData.errorCode - Error code if failed
 * @param {string} callData.userId - User ID who initiated the call
 * @param {string} callData.listId - List ID if part of bulk verification
 * @param {string} callData.entryId - Entry ID being verified
 * @returns {Promise<void>}
 */
// DUPLICATE REMOVED - Function is imported from apiUsageTracker.cjs at line 69
// const trackVerifydataAPICall = async (db, callData) => {
//   ... function body removed ...
// };

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
    
    // Import email template functions (these are in src/templates/verificationEmail.ts)
    // For server-side use, we'll inline the template generation here
    
    const verificationType = entry.verificationType || 'NIN';
    const customerName = entry.displayName;
    const policyNumber = entry.policyNumber;
    const errorMessage = verificationError.customerMessage;
    const brokerEmail = verificationError.brokerEmail;
    const failedFields = verificationError.failedFields;
    
    const documentType = verificationType === 'NIN' ? 'NIN' : 'CAC Registration Number';
    
    const subject = `Action Required: ${verificationType} Verification Issue${policyNumber ? ` - Policy ${policyNumber}` : ''} - NEM Insurance`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Issue - NEM Insurance</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header with NEM Insurance Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #800020 0%, #600018 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="color: #FFD700; margin: 0; font-size: 28px; font-weight: bold;">NEM Insurance</h1>
                    <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Verification Update</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear ${customerName ? `<strong>${customerName}</strong>` : 'Client'},
              </p>
              
              <!-- Issue Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 0 6px 6px 0; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #856404; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                      ⚠️ Verification Issue
                    </p>
                    <p style="color: #856404; font-size: 14px; margin: 0;">
                      We encountered an issue while verifying your ${documentType}.
                    </p>
                  </td>
                </tr>
              </table>
              
              ${policyNumber ? `
              <!-- Policy Information -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Policy Reference</p>
                    <p style="color: #333333; font-size: 14px; font-weight: bold; margin: 0;">${policyNumber}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- What Went Wrong -->
              <h2 style="color: #800020; font-size: 18px; margin: 25px 0 15px 0;">What Went Wrong</h2>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 0 0 25px 0;">
                <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-line;">
${errorMessage}
                </p>
              </div>
              
              <!-- Next Steps -->
              <h2 style="color: #800020; font-size: 18px; margin: 25px 0 15px 0;">Next Steps</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 0 6px 6px 0; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #2e7d32; font-size: 15px; line-height: 1.8; margin: 0;">
                      <strong>Please contact your broker${brokerEmail ? ` at <a href="mailto:${brokerEmail}" style="color: #800020;">${brokerEmail}</a>` : ''}</strong> to resolve this issue.
                      <br><br>
                      Your broker will:
                      <br>• Verify your information is correct
                      <br>• Help update any outdated details
                      <br>• Send you a new verification link if needed
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Reassurance -->
              <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 25px 0 0 0;">
                We understand this may be frustrating, and we're here to help. This verification is required by NAICOM regulations to ensure the security and accuracy of your policy information.
              </p>
              
              <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">
                Thank you for your patience and cooperation.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 25px 40px; border-radius: 0 0 8px 8px;">
              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
                If you need immediate assistance, please contact us:
              </p>
              <p style="color: #333333; font-size: 13px; margin: 5px 0;">
                📧 Email: <a href="mailto:nemsupport@nem-insurance.com" style="color: #800020;">nemsupport@nem-insurance.com</a>
              </p>
              <p style="color: #333333; font-size: 13px; margin: 5px 0;">
                📞 Telephone: <a href="tel:+2342014489570" style="color: #800020;">0201-4489570-2</a>
              </p>
              <p style="color: #333333; font-size: 16px; margin: 20px 0 10px 0;">
                Yours faithfully,<br>
                <strong>NEM Insurance</strong>
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
    `;
    
    await sendEmail(entry.email, subject, html);
    console.log(`✅ Customer error notification sent to ${entry.email}`);
    
    // Log email send
    await createIdentityActivityLog({
      listId: entry.listId,
      entryId: entry.id,
      action: 'customer_error_email_sent',
      actorType: 'system',
      details: {
        email: entry.email,
        errorType: verificationError.errorType
      }
    });
    
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
    
    const customerName = entry.displayName;
    const customerEmail = entry.email;
    const policyNumber = entry.policyNumber;
    const verificationType = entry.verificationType || 'NIN';
    const errorType = verificationError.errorType || 'Unknown';
    const failedFields = verificationError.failedFields || [];
    const technicalDetails = verificationError.technicalDetails;
    
    const documentType = verificationType === 'NIN' ? 'NIN' : 'CAC Registration Number';
    const customerRef = customerName || (policyNumber ? `Policy ${policyNumber}` : 'Customer');
    const subject = `⚠️ Verification Failure: ${customerRef} - Action Required`;
    
    // Generate admin portal link
    const adminPortalLink = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/admin/identity/${listId}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Failure Alert - NEM Insurance</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="700" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">⚠️ Verification Failure Alert</h1>
                    <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Staff Notification - Action Required</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Alert Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffebee; border-left: 4px solid #d32f2f; border-radius: 0 6px 6px 0; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #c62828; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                      A customer verification has failed and requires attention.
                    </p>
                    <p style="color: #c62828; font-size: 14px; margin: 0;">
                      Please review the details below and take appropriate action.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Customer Information -->
              <h2 style="color: #800020; font-size: 18px; margin: 25px 0 15px 0;">Customer Information</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 6px; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    ${customerName ? `<p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;"><strong>Customer Name:</strong> ${customerName}</p>` : ''}
                    ${customerEmail ? `<p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;"><strong>Email:</strong> ${customerEmail}</p>` : ''}
                    ${policyNumber ? `<p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;"><strong>Policy Number:</strong> ${policyNumber}</p>` : ''}
                    <p style="color: #333333; font-size: 14px; margin: 0;"><strong>Verification Type:</strong> ${documentType}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Error Details -->
              <h2 style="color: #800020; font-size: 18px; margin: 25px 0 15px 0;">Error Details</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 6px; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;"><strong>Error Type:</strong> ${errorType}</p>
                    ${failedFields && failedFields.length > 0 ? `
                    <p style="color: #333333; font-size: 14px; margin: 0 0 5px 0;"><strong>Failed Fields:</strong></p>
                    <ul style="color: #333333; font-size: 14px; margin: 5px 0 10px 20px; padding: 0;">
                      ${failedFields.map(field => `<li>${field}</li>`).join('')}
                    </ul>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              ${technicalDetails ? `
              <!-- Technical Details -->
              <h2 style="color: #800020; font-size: 18px; margin: 25px 0 15px 0;">Technical Details</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5; border-radius: 6px; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <pre style="color: #333333; font-size: 12px; font-family: 'Courier New', monospace; margin: 0; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(technicalDetails, null, 2)}</pre>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Staff Message -->
              <h2 style="color: #800020; font-size: 18px; margin: 25px 0 15px 0;">Detailed Analysis</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9; border-radius: 6px; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <pre style="color: #333333; font-size: 13px; font-family: Arial, sans-serif; margin: 0; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">${verificationError.staffMessage}</pre>
                  </td>
                </tr>
              </table>
              
              <!-- Action Required -->
              <h2 style="color: #800020; font-size: 18px; margin: 25px 0 15px 0;">Action Required</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #e3f2fd; border-left: 4px solid #1976d2; border-radius: 0 6px 6px 0; margin: 0 0 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #0d47a1; font-size: 15px; line-height: 1.8; margin: 0;">
                      <strong>Please take the following actions:</strong>
                      <br><br>
                      1. Review the customer's information in the uploaded list
                      <br>2. Verify the data matches the customer's official documents
                      <br>3. Contact the customer if necessary to confirm their information
                      <br>4. Update the list with correct information if needed
                      <br>5. Resend verification link if appropriate
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Admin Portal Link -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="${adminPortalLink}" 
                       style="display: inline-block; background-color: #800020; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      View in Admin Portal
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Footer Note -->
              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 25px 0 0 0;">
                This is an automated notification sent to compliance, admin, and broker staff. Please do not reply to this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 25px 40px; border-radius: 0 0 8px 8px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">
                <strong>NEM Insurance</strong><br>
                Identity Verification System
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
    `;
    
    await sendEmail(staffEmails, subject, html);
    console.log(`✅ Staff error notification sent to ${staffEmails.length} recipients`);
    
    // Log email send
    await createIdentityActivityLog({
      listId: listId,
      entryId: entry.id,
      action: 'staff_error_email_sent',
      actorType: 'system',
      details: {
        recipientCount: staffEmails.length,
        errorType: verificationError.errorType
      }
    });
    
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
    
    // Server-side identity data validation (Requirements: 7.1, 7.2, 7.3, 7.4)
    const { validateIdentityData } = require('../../server-utils/identityUploadValidator.cjs');
    const templateType = listType || 'flexible';
    const validationResult = validateIdentityData(entries, columns, { templateType });
    
    if (!validationResult.valid) {
      console.warn(`⚠️ Server-side validation failed for list "${name}": ${validationResult.errorSummary.totalErrors} error(s) found`);
      
      // Log validation failures for monitoring
      logAuditSecurityEvent({
        eventType: 'VALIDATION_FAILURE',
        userId: req.user.uid,
        userEmail: req.user.email,
        details: {
          listName: name,
          totalErrors: validationResult.errorSummary.totalErrors,
          affectedRows: validationResult.errorSummary.affectedRows,
          templateType,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Identity data validation failed',
        validationErrors: validationResult.errors,
        errorSummary: validationResult.errorSummary,
      });
    }
    
    console.log(`✅ Server-side validation passed for list "${name}"`);
    
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
      
      // Encrypt sensitive identity fields if present (NDPR compliance)
      // Check for NIN, BVN, CAC in the entry data
      const sensitiveFields = {};
      
      // Check for NIN field (various possible column names)
      const ninValue = entryData.nin || entryData.NIN || entryData.Nin || 
                       entryData['NIN'] || entryData['nin'] || null;
      if (ninValue && String(ninValue).trim() && !isEmptyValue(ninValue)) {
        try {
          const encrypted = encryptData(String(ninValue).trim());
          sensitiveFields.nin = encrypted;
          console.log(`🔒 Encrypted NIN for entry ${index + 1}`);
        } catch (err) {
          console.error(`❌ Failed to encrypt NIN for entry ${index + 1}:`, err.message);
        }
      }
      
      // Check for BVN field
      const bvnValue = entryData.bvn || entryData.BVN || entryData.Bvn || 
                       entryData['BVN'] || entryData['bvn'] || null;
      if (bvnValue && String(bvnValue).trim() && !isEmptyValue(bvnValue)) {
        try {
          const encrypted = encryptData(String(bvnValue).trim());
          sensitiveFields.bvn = encrypted;
          console.log(`🔒 Encrypted BVN for entry ${index + 1}`);
        } catch (err) {
          console.error(`❌ Failed to encrypt BVN for entry ${index + 1}:`, err.message);
        }
      }
      
      // Check for CAC field
      const cacValue = entryData.cac || entryData.CAC || entryData.Cac || 
                       entryData['CAC'] || entryData['cac'] || null;
      if (cacValue && String(cacValue).trim() && !isEmptyValue(cacValue)) {
        try {
          const encrypted = encryptData(String(cacValue).trim());
          sensitiveFields.cac = encrypted;
          console.log(`🔒 Encrypted CAC for entry ${index + 1}`);
        } catch (err) {
          console.error(`❌ Failed to encrypt CAC for entry ${index + 1}:`, err.message);
        }
      }
      
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
        updatedAt: now,
        ...sensitiveFields // Add encrypted fields if present
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
        listType: data.listType, // Include listType for tab filtering
        totalEntries: total,
        verifiedCount: verified,
        pendingCount: data.pendingCount || 0,
        failedCount: data.failedCount || 0,
        linkSentCount: data.linkSentCount || 0,
        progress: total > 0 ? Math.round((verified / total) * 100) : 0,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
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
      createdAt: listData.createdAt?.toDate?.() ? listData.createdAt.toDate().toISOString() : listData.createdAt,
      updatedAt: listData.updatedAt?.toDate?.() ? listData.updatedAt.toDate().toISOString() : listData.updatedAt,
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
        tokenExpiresAt: data.tokenExpiresAt?.toDate?.() ? data.tokenExpiresAt.toDate().toISOString() : data.tokenExpiresAt,
        nin: data.nin,
        cac: data.cac,
        cacCompanyName: data.cacCompanyName,
        verifiedAt: data.verifiedAt?.toDate?.() ? data.verifiedAt.toDate().toISOString() : data.verifiedAt,
        linkSentAt: data.linkSentAt?.toDate?.() ? data.linkSentAt.toDate().toISOString() : data.linkSentAt,
        resendCount: data.resendCount || 0,
        verificationAttempts: data.verificationAttempts || 0,
        lastAttemptAt: data.lastAttemptAt?.toDate?.() ? data.lastAttemptAt.toDate().toISOString() : data.lastAttemptAt,
        verificationDetails: data.verificationDetails || null,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt
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
 * POST /api/identity/lists/:listId/analyze-send-links
 * Analyze entries before sending verification links to show confirmation modal
 * 
 * This endpoint:
 * 1. Fetches all entries that need links sent (based on entryIds)
 * 2. Validates format for each entry
 * 3. Checks for duplicates across all lists
 * 4. Returns analysis summary with analysisId
 * 5. Caches results for 10 minutes
 * 
 * Body:
 * - entryIds: string[] - Array of entry IDs to analyze
 * - verificationType: 'NIN' | 'CAC' - Type of verification
 * 
 * Requirements: 2.1
 */
app.post('/api/identity/lists/:listId/analyze-send-links', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    const { entryIds, verificationType } = req.body;
    
    console.log(`🔍 Analyzing link sending for list ${listId}`);
    
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
      console.log(`❌ Broker ${req.user.email} attempted to analyze list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to analyze this list'
      });
    }
    
    // Fetch all selected entries (handle Firestore 'in' limit of 10)
    let allEntries = [];
    
    for (let i = 0; i < entryIds.length; i += 10) {
      const batchIds = entryIds.slice(i, i + 10);
      const batchSnapshot = await db.collection('identity-entries')
        .where('listId', '==', listId)
        .where(admin.firestore.FieldPath.documentId(), 'in', batchIds)
        .get();
      allEntries = allEntries.concat(batchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    
    console.log(`📋 Found ${allEntries.length} entries to analyze`);
    
    if (allEntries.length === 0) {
      return res.json({
        analysisId: null,
        totalEntries: 0,
        toSend: 0,
        toSkip: 0,
        skipReasons: {},
        identityTypeBreakdown: { nin: 0, bvn: 0, cac: 0 }
      });
    }
    
    // Analyze each entry
    const entriesToSend = [];
    const skipReasons = {
      already_verified: 0,
      invalid_format: 0,
      no_identity_data: 0,
      invalid_email: 0
    };
    const identityTypeCounts = {
      nin: 0,
      bvn: 0,
      cac: 0
    };
    
    for (const entry of allEntries) {
      // Validate email
      if (!entry.email || !entry.email.includes('@')) {
        skipReasons.invalid_email++;
        entriesToSend.push({
          entryId: entry.id,
          email: entry.email,
          shouldSend: false,
          skipReason: 'invalid_email',
          isDuplicate: false
        });
        continue;
      }
      
      // For send links, we DON'T require identity data to exist
      // The whole point is to send links to customers who need to provide their identity numbers
      // We only validate that the email is valid (already done above)
      
      // CRITICAL CHECK: Check if this email is already associated with a verified entry
      // of the same verification type across ALL lists (not just this list)
      // This prevents sending duplicate verification requests to already verified customers
      let foundExistingVerified = false;
      try {
        console.log(`🔍 Checking if email ${entry.email} already has verified ${verificationType}...`);
        
        // Query for any entry with this email that has verified status
        const existingVerifiedQuery = await db.collection('identity-entries')
          .where('email', '==', entry.email)
          .where('status', '==', 'verified')
          .limit(5) // Get up to 5 to check
          .get();
        
        console.log(`   Found ${existingVerifiedQuery.size} verified entries for this email`);
        
        if (!existingVerifiedQuery.empty) {
          // Check if any of these verified entries have the same verification type
          for (const doc of existingVerifiedQuery.docs) {
            const existingData = doc.data();
            console.log(`   Checking entry ${doc.id}: verificationType=${existingData.verificationType}, status=${existingData.status}`);
            
            // Check if this verified entry is for the same verification type
            if (existingData.verificationType === verificationType) {
              console.log(`   ✅ Found existing verified ${verificationType} for ${entry.email} - SKIPPING`);
              
              skipReasons.already_verified++;
              entriesToSend.push({
                entryId: entry.id,
                email: entry.email,
                identityType: verificationType,
                shouldSend: false,
                skipReason: 'already_verified',
                isDuplicate: true,
                duplicateInfo: {
                  originalEntryId: doc.id,
                  originalListId: existingData.listId,
                  verifiedAt: existingData.verifiedAt || existingData.updatedAt
                }
              });
              foundExistingVerified = true;
              break; // Exit inner loop
            }
          }
        }
        
        if (!foundExistingVerified) {
          console.log(`   No existing verified ${verificationType} found for ${entry.email} - OK to send`);
        }
      } catch (checkError) {
        console.error('❌ Error checking for existing verified entry:', checkError);
        // Continue with sending if check fails (don't block the operation)
      }
      
      // If we found an existing verified entry, skip to next entry
      if (foundExistingVerified) {
        continue;
      }
      
      // Check if this specific entry already has verified identity data
      let identityValue = null;
      
      if (verificationType === 'NIN') {
        identityValue = entry.data?.nin || entry.nin;
      } else if (verificationType === 'BVN') {
        identityValue = entry.data?.bvn || entry.bvn;
      } else if (verificationType === 'CAC') {
        identityValue = entry.data?.cac || entry.cac;
      }
      
      // If THIS entry has identity data and it's verified, skip sending link
      if (identityValue && entry.verificationStatus === 'verified') {
        skipReasons.already_verified++;
        entriesToSend.push({
          entryId: entry.id,
          email: entry.email,
          identityType: verificationType,
          shouldSend: false,
          skipReason: 'already_verified',
          isDuplicate: false
        });
        continue;
      }
      
      // Otherwise, send the link (even if no identity data - that's the point!)
      // No format validation needed since we're asking them to provide the data
      
      // Send the link - count it
      const typeKey = verificationType.toLowerCase();
      identityTypeCounts[typeKey]++;
      
      entriesToSend.push({
        entryId: entry.id,
        email: entry.email,
        identityType: verificationType,
        identityValue: identityValue || null,
        shouldSend: true,
        skipReason: null,
        isDuplicate: false,
        duplicateInfo: null
      });
    }
    
    // Generate analysis ID
    const analysisId = `link_analysis_${listId}_${Date.now()}`;
    
    // Store in cache
    const analysis = {
      analysisId,
      listId,
      verificationType,
      createdAt: Date.now(),
      expiresAt: Date.now() + ANALYSIS_CACHE_TTL,
      totalEntries: allEntries.length,
      entriesToSend,
      identityTypeBreakdown: identityTypeCounts
    };
    
    linkSendingAnalysisCache.set(analysisId, analysis);
    
    console.log(`✅ Link sending analysis complete for list ${listId}:`);
    console.log(`   - Total entries: ${allEntries.length}`);
    console.log(`   - To send: ${entriesToSend.filter(e => e.shouldSend).length}`);
    console.log(`   - To skip: ${entriesToSend.filter(e => !e.shouldSend).length}`);
    
    // Return analysis summary
    res.json({
      analysisId,
      totalEntries: allEntries.length,
      toSend: entriesToSend.filter(e => e.shouldSend).length,
      toSkip: entriesToSend.filter(e => !e.shouldSend).length,
      skipReasons,
      identityTypeBreakdown: identityTypeCounts
    });
    
  } catch (error) {
    console.error('❌ Error analyzing link sending:', error);
    res.status(500).json({
      error: 'Analysis failed',
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
 * - analysisId: string (optional) - ID from analyze-send-links endpoint to use cached analysis
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 11.7, 11.8
 */
app.post('/api/identity/lists/:listId/send', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    const { entryIds, verificationType, analysisId } = req.body;
    
    console.log(`📧 Sending ${verificationType} verification links for list ${listId}`);
    if (analysisId) {
      console.log(`   Using cached analysis: ${analysisId}`);
    }
    
    // If analysisId provided, check cache
    let cachedAnalysis = null;
    if (analysisId) {
      cachedAnalysis = linkSendingAnalysisCache.get(analysisId);
      
      if (!cachedAnalysis) {
        // Cache expired or invalid analysisId
        console.log(`❌ Link sending analysis cache miss or expired for ${analysisId}`);
        return res.status(410).json({
          error: 'Analysis expired',
          message: 'The analysis results have expired. Please try again to get a fresh analysis.',
          code: 'ANALYSIS_EXPIRED'
        });
      }
      
      // Verify the analysis is for this list
      if (cachedAnalysis.listId !== listId) {
        console.log(`❌ Analysis ${analysisId} is for list ${cachedAnalysis.listId}, not ${listId}`);
        return res.status(400).json({
          error: 'Invalid analysis',
          message: 'The analysis ID does not match this list'
        });
      }
    }
    
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
      skipped: 0,
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
        // If we have cached analysis, check if this entry should be skipped
        if (cachedAnalysis) {
          const analysisEntry = cachedAnalysis.entriesToSend.find(e => e.entryId === entry.id);
          
          if (analysisEntry && !analysisEntry.shouldSend) {
            // Skip this entry based on cached analysis
            results.skipped++;
            
            // Log the skip with duplicate metadata if applicable
            if (analysisEntry.isDuplicate && analysisEntry.duplicateInfo) {
              await createIdentityActivityLog({
                listId: listId,
                entryId: entry.id,
                action: 'link_send_skipped',
                actorType: 'admin',
                actorId: req.user.uid,
                details: {
                  reason: analysisEntry.skipReason,
                  email: entry.email,
                  verificationType: verificationType,
                  originalListId: analysisEntry.duplicateInfo.originalListId,
                  originalVerificationDate: analysisEntry.duplicateInfo.originalVerificationDate,
                  originalBroker: analysisEntry.duplicateInfo.originalBroker,
                  originalResult: analysisEntry.duplicateInfo.originalResult
                },
                ipAddress: req.ipData?.masked,
                userAgent: req.headers['user-agent']
              });
              
              console.log(`⊘ Skipped entry ${entry.id} - already verified in list ${analysisEntry.duplicateInfo.originalListId}`);
            } else {
              // Log skip for other reasons (invalid format, no data, etc.)
              await createIdentityActivityLog({
                listId: listId,
                entryId: entry.id,
                action: 'link_send_skipped',
                actorType: 'admin',
                actorId: req.user.uid,
                details: {
                  reason: analysisEntry.skipReason,
                  email: entry.email,
                  verificationType: verificationType
                },
                ipAddress: req.ipData?.masked,
                userAgent: req.headers['user-agent']
              });
              
              console.log(`⊘ Skipped entry ${entry.id} - ${analysisEntry.skipReason}`);
            }
            
            continue;
          }
        } else {
          // No cached analysis - perform duplicate check now
          // Determine identity value based on verificationType
          let identityValue = null;
          
          if (verificationType === 'NIN') {
            identityValue = entry.data?.nin || entry.nin;
          } else if (verificationType === 'BVN') {
            identityValue = entry.data?.bvn || entry.bvn;
          } else if (verificationType === 'CAC') {
            identityValue = entry.data?.cac || entry.cac;
          }
          
          // Check for duplicates if we have identity value
          if (identityValue) {
            // Convert to string if needed
            if (typeof identityValue === 'number') {
              identityValue = String(identityValue);
            }
            
            // Validate format
            const validation = validateIdentityFormat(verificationType, identityValue);
            
            if (!validation.isValid) {
              results.skipped++;
              results.errors.push({
                entryId: entry.id,
                email: entry.email,
                error: `Invalid ${verificationType} format`
              });
              
              await createIdentityActivityLog({
                listId: listId,
                entryId: entry.id,
                action: 'link_send_skipped',
                actorType: 'admin',
                actorId: req.user.uid,
                details: {
                  reason: 'invalid_format',
                  email: entry.email,
                  verificationType: verificationType
                },
                ipAddress: req.ipData?.masked,
                userAgent: req.headers['user-agent']
              });
              
              console.log(`⊘ Skipped entry ${entry.id} - invalid format`);
              continue;
            }
            
            // Check for duplicates
            const duplicateCheck = await checkDuplicate(verificationType, identityValue);
            
            if (duplicateCheck.isDuplicate) {
              results.skipped++;
              
              // Log the skip with duplicate metadata
              await createIdentityActivityLog({
                listId: listId,
                entryId: entry.id,
                action: 'link_send_skipped',
                actorType: 'admin',
                actorId: req.user.uid,
                details: {
                  reason: 'already_verified',
                  email: entry.email,
                  verificationType: verificationType,
                  originalListId: duplicateCheck.originalListId,
                  originalVerificationDate: duplicateCheck.originalVerificationDate,
                  originalBroker: duplicateCheck.originalBroker,
                  originalResult: duplicateCheck.originalResult
                },
                ipAddress: req.ipData?.masked,
                userAgent: req.headers['user-agent']
              });
              
              console.log(`⊘ Skipped entry ${entry.id} - already verified in list ${duplicateCheck.originalListId}`);
              continue;
            }
          }
        }
        
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
        
        // Format expiration date (declare before using in console.log)
        const expirationDateStr = formatDateLong(tokenExpiresAt);
        
        console.log(`   ✓ Token saved for entry ${entry.id}: ${token.substring(0, 8)}... (${token.length} chars)`);
        console.log(`   ✓ Verification type: ${verificationType}`);
        console.log(`   ✓ Expires: ${expirationDateStr}`);
        
        // Generate verification URL
        const baseUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
        const verificationUrl = `${baseUrl}/verify/${token}`;
        
        // Extract name from entry data if available
        const recipientName = entry.data?.name || entry.data?.Name || 
                             entry.data?.customerName || entry.data?.CustomerName ||
                             entry.data?.fullName || entry.data?.FullName ||
                             'Valued Customer';
        
        // Send verification email
        const sanitizedEmail = sanitizeEmail(entry.email);
        const sanitizedSubject = sanitizeEmailSubject(`Action Required: ${verificationType} Verification - NEM Insurance`);
        
        // Validate email before sending
        if (!isValidEmail(sanitizedEmail)) {
          console.error('❌ Invalid email address:', entry.email);
          results.failed++;
          results.errors.push({
            entryId: entry.id,
            email: entry.email,
            error: 'Invalid email address format'
          });
          continue;
        }
        
        const mailOptions = {
          from: '"NEM Insurance" <kyc@nem-insurance.com>',
          to: sanitizedEmail,
          subject: sanitizedSubject,
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
        skipped: results.skipped,
        sentBy: req.user.email
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Sent ${results.sent} verification links, ${results.failed} failed, ${results.skipped} skipped`);
    
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
 * OPTIONS /api/identity/verify/:token
 * Handle preflight requests for CORS
 */
app.options('/api/identity/verify/:token', (req, res) => {
  console.log('✅ CORS Preflight: /api/identity/verify/:token from origin:', req.headers.origin);
  res.status(204).send();
});

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
    
    // Log CORS headers for debugging
    console.log('🔍 CORS Debug - Request Origin:', req.headers.origin);
    console.log('🔍 CORS Debug - Response Headers:', {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
    });
    
    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token is required'
      });
    }
    
    console.log(`🔍 Validating identity verification token: ${token.substring(0, 8)}...`);
    console.log(`   Full token length: ${token.length} characters`);
    
    // Find entry by token
    const entriesSnapshot = await db.collection('identity-entries')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    console.log(`   Query result: ${entriesSnapshot.empty ? 'NO MATCH' : 'FOUND'}`);
    
    if (entriesSnapshot.empty) {
      console.log('❌ Token not found in database');
      console.log('   Checking if any entries exist in collection...');
      
      // Debug: Check if collection has any entries at all
      const anyEntriesSnapshot = await db.collection('identity-entries').limit(1).get();
      console.log(`   Collection has entries: ${!anyEntriesSnapshot.empty}`);
      
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
 * POST /api/identity/verify/:token/upload-document
 * Upload CAC document during customer verification
 * 
 * This endpoint allows customers to upload required CAC documents
 * during the verification process using their verification token.
 * Documents are encrypted before storage for security.
 */
app.post('/api/identity/verify/:token/upload-document', upload.single('file'), async (req, res) => {
  try {
    const { token } = req.params;
    const { documentType } = req.body;
    const file = req.file;
    
    if (!token || !documentType || !file) {
      return res.status(400).json({
        success: false,
        error: 'Token, document type, and file are required'
      });
    }
    
    // Validate document type
    const validTypes = ['certificate_of_incorporation', 'particulars_of_directors', 'share_allotment'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type'
      });
    }
    
    // Validate file type
    const validMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Please upload PDF, JPEG, or PNG'
      });
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File size must not exceed 10MB'
      });
    }
    
    console.log(`📄 Uploading CAC document: ${documentType} for token: ${token.substring(0, 8)}...`);
    
    // Find entry by token
    const entriesSnapshot = await db.collection('identity-entries')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (entriesSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Invalid verification link'
      });
    }
    
    const entryDoc = entriesSnapshot.docs[0];
    const entry = entryDoc.data();
    
    // Verify this is a CAC verification
    if (entry.verificationType !== 'CAC') {
      return res.status(400).json({
        success: false,
        error: 'Document upload is only available for CAC verification'
      });
    }
    
    // Check token expiration
    const tokenExpiresAt = entry.tokenExpiresAt?.toDate ? entry.tokenExpiresAt.toDate() : new Date(entry.tokenExpiresAt);
    if (tokenExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Verification link has expired'
      });
    }
    
    // Encrypt document
    const fileBuffer = file.buffer;
    const base64File = fileBuffer.toString('base64');
    const { encrypted, iv } = encryptData(base64File);
    
    // Generate document ID
    const documentId = `${entryDoc.id}_${documentType}_${Date.now()}`;
    
    // Store encrypted document in Firebase Storage
    const storagePath = `cac-documents/${entryDoc.id}/${documentType}/${documentId}_${file.originalname}`;
    const storageRef = admin.storage().bucket().file(storagePath);
    
    await storageRef.save(Buffer.from(encrypted, 'base64'), {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          encrypted: 'true',
          iv: iv,
          originalName: file.originalname,
          documentType: documentType,
          entryId: entryDoc.id,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    // Store document metadata in Firestore
    const metadataDoc = {
      id: documentId,
      identityRecordId: entryDoc.id,
      listId: entry.listId,
      documentType: documentType,
      storagePath: storagePath,
      filename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionIV: iv,
      uploadedBy: 'customer',
      uploaderId: 'customer',
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'uploaded',
      version: 1,
      isCurrent: true
    };
    
    console.log('[CAC Upload] Writing metadata to Firestore:', {
      documentId,
      identityRecordId: entryDoc.id,
      documentType,
      collection: 'cac-document-metadata',
      isCurrent: true,
      timestamp: new Date().toISOString()
    });
    
    // Log upload started
    await createCACDocumentAuditLog('CAC_DOCUMENT_UPLOAD_STARTED', {
      documentType,
      identityRecordId: entryDoc.id,
      userId: 'customer',
      documentId,
      metadata: {
        filename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      }
    });
    
    await db.collection('cac-document-metadata').doc(documentId).set(metadataDoc);
    
    console.log('[CAC Upload] Metadata written successfully:', {
      documentId,
      identityRecordId: entryDoc.id,
      documentType,
      timestamp: new Date().toISOString()
    });
    
    // Log metadata written
    await createCACDocumentAuditLog('CAC_DOCUMENT_METADATA_WRITTEN', {
      documentType,
      identityRecordId: entryDoc.id,
      userId: 'customer',
      documentId,
      metadata: {
        storagePath: storagePath,
        version: 1,
        isCurrent: true
      }
    });
    
    // Update entry with document reference
    const documentField = `cacDocuments.${documentType}`;
    await entryDoc.ref.update({
      [documentField]: {
        documentId: documentId,
        status: 'uploaded',
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        filename: file.originalname
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Document uploaded successfully: ${documentId}`);
    
    // Log upload completed
    await createCACDocumentAuditLog('CAC_DOCUMENT_UPLOAD_COMPLETED', {
      documentType,
      identityRecordId: entryDoc.id,
      userId: 'customer',
      documentId,
      metadata: {
        filename: file.originalname,
        success: true
      }
    });
    
    res.json({
      success: true,
      documentId: documentId,
      filename: file.originalname
    });
    
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document. Please try again.'
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
app.post('/api/identity/verify/:token', verificationRateLimiter, async (req, res) => {
  try {
    const { token } = req.params;
    const { identityNumber } = req.body;
    const demoMode = process.env.NODE_ENV !== 'production' && req.body.demoMode === true;
    
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
    
    // ============================================
    // CRITICAL: Check for duplicate NIN/CAC BEFORE making expensive API call
    // This prevents wasting money on already-verified identity numbers
    // ============================================
    const verificationType = entry.verificationType;
    console.log(`🔍 Checking for duplicate ${verificationType} before API call...`);
    
    try {
      const identityQuery = db.collection('identity-entries')
        .where('listId', '==', entry.listId)
        .where('status', '==', 'verified');
      
      const identitySnapshot = await identityQuery.get();
      
      let duplicateFound = false;
      let duplicateEntry = null;
      
      for (const doc of identitySnapshot.docs) {
        const existingEntry = doc.data();
        
        // Skip the current entry
        if (doc.id === entryDoc.id) continue;
        
        // Check if NIN/CAC matches (handle both encrypted and plain)
        let existingIdentityNumber = null;
        
        if (verificationType === 'NIN') {
          if (existingEntry.nin) {
            if (isEncrypted(existingEntry.nin)) {
              try {
                existingIdentityNumber = decryptData(existingEntry.nin.encrypted, existingEntry.nin.iv);
              } catch (err) {
                console.error('Failed to decrypt existing NIN for comparison:', err);
                continue;
              }
            } else {
              existingIdentityNumber = existingEntry.nin;
            }
          }
        } else if (verificationType === 'CAC') {
          if (existingEntry.cac) {
            if (isEncrypted(existingEntry.cac)) {
              try {
                existingIdentityNumber = decryptData(existingEntry.cac.encrypted, existingEntry.cac.iv);
              } catch (err) {
                console.error('Failed to decrypt existing CAC for comparison:', err);
                continue;
              }
            } else {
              existingIdentityNumber = existingEntry.cac;
            }
          } else if (existingEntry.registrationNumber) {
            existingIdentityNumber = existingEntry.registrationNumber;
          }
        }
        
        // Compare identity numbers
        if (existingIdentityNumber && existingIdentityNumber === identityNumber) {
          duplicateFound = true;
          duplicateEntry = existingEntry;
          console.log(`⚠️  Duplicate ${verificationType} found! Already verified in entry ${doc.id} - BLOCKING API CALL`);
          break;
        }
      }
      
      if (duplicateFound) {
        // Extract user information for audit logging
        const data = entry.data || {};
        let userName = 'anonymous';
        if (verificationType === 'NIN') {
          const firstName = data.firstName || data.first_name || data['First Name'] || data.FirstName || '';
          const lastName = data.lastName || data.last_name || data['Last Name'] || data.LastName || data.surname || data.Surname || '';
          if (firstName && lastName) {
            userName = `${firstName} ${lastName}`;
          } else if (firstName) {
            userName = firstName;
          } else if (lastName) {
            userName = lastName;
          }
        } else if (verificationType === 'CAC') {
          const companyName = data.companyName || data.company_name || data['Company Name'] || data.CompanyName || '';
          if (companyName) {
            userName = companyName;
          }
        }
        
        // Log verification attempt as FAILED due to duplicate (this will show in audit logs)
        try {
          await logVerificationAttempt({
            verificationType: verificationType,
            identityNumber: identityNumber, // Will be masked by function
            userId: userName,
            userEmail: entry.email || 'anonymous',
            ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
            result: 'failure',
            errorCode: 'DUPLICATE_IDENTITY',
            errorMessage: `${verificationType} already verified in system`,
            metadata: {
              userAgent: req.headers['user-agent'],
              listId: entry.listId,
              entryId: entryDoc.id,
              blockedBeforeAPICall: true,
              costSaved: 100 // Both NIN and CAC cost ₦100
            }
          });
        } catch (logError) {
          console.error('Failed to log duplicate verification attempt:', logError);
        }
        
        // Update current entry as failed due to duplicate
        await entryRef.update({
          status: 'failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          verificationDetails: {
            failureReason: `This ${verificationType} has already been verified in the system`,
            isDuplicate: true,
            validationSuccess: false
          }
        });
        
        // Log security event for duplicate attempt
        await logAuditSecurityEvent({
          eventType: 'duplicate_identity_blocked',
          severity: 'medium',
          description: `Duplicate ${verificationType} blocked before API call - cost saved`,
          userId: 'anonymous',
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          metadata: {
            verificationType,
            listId: entry.listId,
            entryId: entryDoc.id,
            email: entry.email,
            error: 'Duplicate identity number',
            reason: `${verificationType} already verified in system`,
            costSaved: 100 // Both NIN and CAC cost ₦100
          }
        });
        
        return res.json({
          success: false,
          error: `This ${verificationType === 'NIN' ? 'National Identification Number' : 'CAC Registration Number'} has already been verified in our system. Each identity number can only be used once. If you believe this is an error, please contact your insurance broker or our support team at nemsupport@nem-insurance.com.`,
          isDuplicate: true
        });
      }
      
      console.log(`✅ No duplicate ${verificationType} found - proceeding with verification`);
    } catch (duplicateCheckError) {
      console.error('❌ Error checking for duplicates:', duplicateCheckError);
      // Continue with verification - don't block on duplicate check failure
    }
    
    // Check if max attempts exceeded
    if (entry.status === 'failed' || entry.status === 'verification_failed') {
      console.log('ℹ️ Entry marked as failed - max attempts exceeded');
      return res.json({
        success: false,
        error: 'Maximum verification attempts exceeded. Please contact your insurance provider.',
        attemptsRemaining: 0
      });
    }
    
    const currentAttempts = entry.verificationAttempts || 0;
    const maxAttempts = 3;
    
    // Check token expiration
    const tokenExpiresAt = entry.tokenExpiresAt?.toDate ? entry.tokenExpiresAt.toDate() : new Date(entry.tokenExpiresAt);
    if (tokenExpiresAt < new Date()) {
      console.log('ℹ️ Token expired');
      return res.json({
        success: false,
        error: 'This link has expired. Please contact your insurance provider for a new link.'
      });
    }
    
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
    
    // Call Datapro verification API with field-level validation (Requirement 20.3, 20.6)
    let verificationResult;
    
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
        
        // Extract user name for audit logging
        let userName = 'anonymous';
        if (firstName && lastName) {
          userName = `${firstName} ${lastName}`;
        } else if (firstName) {
          userName = firstName;
        } else if (lastName) {
          userName = lastName;
        }
        
        // Log warning if customer data is missing
        if (!firstName || !lastName) {
          console.warn(`⚠️  Missing customer name data for entry ${entryDoc.id}:`, {
            firstName: firstName ? 'present' : 'MISSING',
            lastName: lastName ? 'present' : 'MISSING',
            attemptedFields: ['firstName', 'first_name', 'First Name', 'FirstName', 'lastName', 'last_name', 'Last Name', 'LastName', 'surname', 'Surname'],
            listId: entry.listId,
            email: entry.email || 'MISSING'
          });
        }
        
        fieldsValidated.push('firstName', 'lastName', 'dateOfBirth', 'gender');
        if (bvn) fieldsValidated.push('bvn');
        
        // Decrypt NIN if encrypted
        let decryptedNIN = identityNumber;
        if (entry.nin && isEncrypted(entry.nin)) {
          try {
            decryptedNIN = decryptData(entry.nin.encrypted, entry.nin.iv);
            console.log(`🔓 Decrypted NIN for verification`);
          } catch (err) {
            console.error(`❌ Failed to decrypt NIN:`, err.message);
            return res.status(500).json({
              success: false,
              error: 'Failed to process verification. Please contact support.'
            });
          }
        }
        
        // NIN verification via Datapro
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
              firstName: mockValidation.first_name,
              lastName: mockValidation.last_name,
              middleName: 'DEMO',
              dateOfBirth: mockValidation.dob,
              phoneNumber: '080****5678',
              gender: mockValidation.gender
            },
            fieldsValidated,
            failedFields: allFieldsMatch ? [] : ['firstName', 'lastName']
          };
        } else {
          console.log(`🔍 Calling Datapro NIN verification for: ${decryptedNIN.substring(0, 4)}*** with field validation`);
          
          // Track API call start time (Requirement 5.1, 5.3, 5.4)
          const apiStartTime = Date.now();
          
          // Call Datapro NIN verification API
          const dataproResult = await dataproVerifyNIN(decryptedNIN);
          
          // Calculate API call duration (Requirement 5.3, 5.4)
          const apiDuration = Date.now() - apiStartTime;
          
          // Log API call (Requirement 5.1, 5.3, 5.4)
          try {
            await logAPICall({
              apiName: 'Datapro',
              endpoint: '/verifynin',
              method: 'GET',
              requestData: { nin: decryptedNIN }, // Will be masked by function
              statusCode: dataproResult.success ? 200 : 400,
              responseData: dataproResult, // Will be masked by function
              duration: apiDuration,
              userId: 'anonymous', // Customer verification - no user ID
              ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
              metadata: {
                listId: entry.listId,
                entryId: entryDoc.id,
                cost: dataproResult.cost || 0
              }
            });
          } catch (logError) {
            console.error('Failed to log API call:', logError);
            // Continue execution - don't throw
          }
          
          if (dataproResult.success) {
            // Perform field-level validation using Datapro's matchFields function
            const excelData = {
              firstName,
              lastName,
              dateOfBirth,
              gender,
              phoneNumber: data.phoneNumber || data.phone_number || data['Phone Number'] || ''
            };
            
            const matchResult = dataproMatchFields(dataproResult.data, excelData);
            
            verificationResult = {
              success: matchResult.matched,
              data: dataproResult.data,
              message: matchResult.matched ? 'Verification successful' : 'Field mismatch detected',
              fieldsValidated,
              failedFields: matchResult.failedFields,
              matchDetails: matchResult.details
            };
            
            console.log(`✅ Datapro verification completed: ${matchResult.matched ? 'MATCHED' : 'FAILED'}`);
            if (!matchResult.matched) {
              console.log(`❌ Failed fields: ${matchResult.failedFields.join(', ')}`);
            }
            
            // Consolidated logging - replaces duplicate trackDataproAPICall + logVerificationAttempt calls
            try {
              await logVerificationComplete(db, {
                provider: 'datapro',
                verificationType: 'NIN',
                success: matchResult.matched,
                listId: entry.listId,
                entryId: entryDoc.id,
                identityNumber: decryptedNIN,
                userId: userName,
                userEmail: entry.email || 'anonymous',
                userName: userName,
                userType: 'customer', // Mark as customer verification
                ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
                errorCode: matchResult.matched ? null : 'FIELD_MISMATCH',
                errorMessage: matchResult.matched ? null : 'Field mismatch detected',
                metadata: {
                  userAgent: req.headers['user-agent'],
                  fieldsValidated: matchResult.details?.matchedFields || [],
                  failedFields: matchResult.failedFields || []
                }
              });
            } catch (logError) {
              console.error('Failed to log verification complete:', logError);
            }
          } else {
            // Datapro API error
            console.error(`❌ Datapro verification failed: ${dataproResult.error}`);
            verificationResult = {
              success: false,
              message: dataproGetUserFriendlyError(dataproResult.errorCode, dataproResult.details),
              technicalMessage: dataproGetTechnicalError(dataproResult.errorCode, dataproResult.details),
              errorCode: dataproResult.errorCode,
              fieldsValidated,
              failedFields: []
            };
            
            // Consolidated logging - replaces duplicate trackDataproAPICall + logVerificationAttempt calls
            try {
              await logVerificationComplete(db, {
                provider: 'datapro',
                verificationType: 'NIN',
                success: false,
                listId: entry.listId,
                entryId: entryDoc.id,
                identityNumber: decryptedNIN,
                userId: userName,
                userEmail: entry.email || 'anonymous',
                userName: userName,
                userType: 'customer', // Mark as customer verification
                ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
                errorCode: dataproResult.errorCode,
                errorMessage: dataproResult.error || 'Verification failed',
                metadata: {
                  userAgent: req.headers['user-agent'],
                  failedFields: []
                }
              });
            } catch (logError) {
              console.error('Failed to log verification complete:', logError);
            }
          }
        }
        
        // Clear decrypted NIN from memory
        clearSensitiveData(decryptedNIN);
      } else {
        // CAC verification with field-level validation (Requirement 20.6)
        const companyName = data.companyName || data.company_name || data['Company Name'] || data.CompanyName || '';
        const registrationNumber = entry.registrationNumber || data.registrationNumber || data.registration_number || data['Registration Number'] || '';
        const registrationDate = entry.registrationDate || data.registrationDate || data.registration_date || data['Registration Date'] || '';
        const businessAddress = entry.businessAddress || data.businessAddress || data.business_address || data['Business Address'] || data.companyAddress || data.company_address || '';
        
        // Extract user name for audit logging
        const userName = companyName || 'anonymous';
        
        // Log warning if customer data is missing
        if (!companyName) {
          console.warn(`⚠️  Missing company name data for CAC entry ${entryDoc.id}:`, {
            companyName: 'MISSING',
            attemptedFields: ['companyName', 'company_name', 'Company Name', 'CompanyName'],
            listId: entry.listId,
            email: entry.email || 'MISSING'
          });
        }
        
        fieldsValidated.push('companyName', 'registrationNumber', 'registrationDate', 'businessAddress');
        
        // Decrypt CAC if encrypted
        let decryptedCAC = identityNumber;
        if (entry.cac && isEncrypted(entry.cac)) {
          try {
            decryptedCAC = decryptData(entry.cac.encrypted, entry.cac.iv);
            console.log(`🔓 Decrypted CAC for verification`);
          } catch (err) {
            console.error(`❌ Failed to decrypt CAC:`, err.message);
            return res.status(500).json({
              success: false,
              error: 'Failed to process verification. Please contact support.'
            });
          }
        }
        
        // CAC verification via VerifyData
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
        } else {
          console.log(`🔍 Calling VerifyData CAC verification for: ${decryptedCAC.substring(0, 4)}*** with field validation`);
          
          // Apply VerifyData rate limiting
          try {
            await applyVerifydataRateLimit();
          } catch (rateLimitError) {
            console.error('❌ VerifyData rate limit exceeded:', rateLimitError);
            return res.status(429).json({
              success: false,
              error: 'Too many verification requests. Please try again in a moment.',
              attemptsRemaining: maxAttempts - currentAttempts
            });
          }
          
          // Track API call start time (Requirement 5.2, 5.3, 5.4)
          const apiStartTime = Date.now();
          
          // Call VerifyData CAC verification API
          const verifydataResult = await verifydataVerifyCAC(decryptedCAC);
          
          // Calculate API call duration (Requirement 5.3, 5.4)
          const apiDuration = Date.now() - apiStartTime;
          
          // Log API call (Requirement 5.2, 5.3, 5.4)
          try {
            await logAPICall({
              apiName: 'VerifyData',
              endpoint: '/api/ValidateRcNumber/Initiate',
              method: 'POST',
              requestData: { rcNumber: decryptedCAC }, // Will be masked by function
              statusCode: verifydataResult.success ? 200 : 400,
              responseData: verifydataResult, // Will be masked by function
              duration: apiDuration,
              userId: 'anonymous', // Customer verification - no user ID
              ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
              metadata: {
                listId: entry.listId,
                entryId: entryDoc.id,
                cost: verifydataResult.cost || 0
              }
            });
          } catch (logError) {
            console.error('Failed to log API call:', logError);
            // Continue execution - don't throw
          }
          
          if (verifydataResult.success) {
            // Perform field-level validation using VerifyData's matchCACFields function
            const excelData = {
              companyName,
              registrationNumber,
              registrationDate,
              businessAddress
            };
            
            const matchResult = verifydataMatchCACFields(verifydataResult.data, excelData);
            
            verificationResult = {
              success: matchResult.matched,
              data: verifydataResult.data,
              message: matchResult.matched ? 'Verification successful' : 'Field mismatch detected',
              fieldsValidated,
              failedFields: matchResult.failedFields,
              matchDetails: matchResult.details
            };
            
            console.log(`✅ VerifyData verification completed: ${matchResult.matched ? 'MATCHED' : 'FAILED'}`);
            if (!matchResult.matched) {
              console.log(`❌ Failed fields: ${matchResult.failedFields.join(', ')}`);
            }
            
            // Consolidated logging - replaces duplicate trackVerifydataAPICall + logVerificationAttempt calls
            try {
              await logVerificationComplete(db, {
                provider: 'verifydata',
                verificationType: 'CAC',
                success: matchResult.matched,
                listId: entry.listId,
                entryId: entryDoc.id,
                identityNumber: decryptedCAC,
                userId: userName,
                userEmail: entry.email || 'anonymous',
                userName: userName,
                userType: 'customer', // Mark as customer verification
                ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
                errorCode: matchResult.matched ? null : 'FIELD_MISMATCH',
                errorMessage: matchResult.matched ? null : 'Field mismatch detected',
                metadata: {
                  userAgent: req.headers['user-agent'],
                  fieldsValidated: matchResult.details?.matchedFields || [],
                  failedFields: matchResult.failedFields || []
                }
              });
            } catch (logError) {
              console.error('Failed to log verification complete:', logError);
            }
          } else {
            // VerifyData API error
            console.error(`❌ VerifyData verification failed: ${verifydataResult.error}`);
            verificationResult = {
              success: false,
              message: verifydataGetUserFriendlyError(verifydataResult.errorCode, verifydataResult.details),
              technicalMessage: verifydataGetTechnicalError(verifydataResult.errorCode, verifydataResult.details),
              errorCode: verifydataResult.errorCode,
              fieldsValidated,
              failedFields: []
            };
            
            // Consolidated logging - replaces duplicate trackVerifydataAPICall + logVerificationAttempt calls
            try {
              await logVerificationComplete(db, {
                provider: 'verifydata',
                verificationType: 'CAC',
                success: false,
                listId: entry.listId,
                entryId: entryDoc.id,
                identityNumber: decryptedCAC,
                userId: userName,
                userEmail: entry.email || 'anonymous',
                userName: userName,
                userType: 'customer', // Mark as customer verification
                ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
                errorCode: verifydataResult.errorCode,
                errorMessage: verifydataResult.error || 'Verification failed',
                metadata: {
                  userAgent: req.headers['user-agent'],
                  failedFields: []
                }
              });
            } catch (logError) {
              console.error('Failed to log verification complete:', logError);
            }
          }
        }
        
        // Clear decrypted CAC from memory
        clearSensitiveData(decryptedCAC);
      }
    } catch (apiError) {
      console.error('❌ API error:', apiError);
      verificationResult = {
        success: false,
        message: 'Verification service temporarily unavailable. Please try again.',
        fieldsValidated,
        failedFields: []
      };
    }
    
    // Handle verification result
    if (verificationResult.success) {
      console.log(`✅ Verification successful, proceeding with data storage`);
      
      // Success - update entry with verified data and validation details (Requirement 20.8, 20.9)
      const updateData = {
        status: 'verified',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Store verification details (Requirement 20.9)
        verificationDetails: {
          fieldsValidated: verificationResult.fieldsValidated || [],
          failedFields: [],
          validationSuccess: true,
          matchDetails: verificationResult.matchDetails || null
        }
      };
      
      // Encrypt identity numbers before storing (NDPR compliance)
      if (verificationType === 'NIN') {
        try {
          const encrypted = encryptData(identityNumber);
          updateData.nin = encrypted;
          console.log(`🔒 Encrypted NIN before storage`);
        } catch (err) {
          console.error(`❌ Failed to encrypt NIN:`, err.message);
          // Store unencrypted as fallback (should not happen in production)
          updateData.nin = identityNumber;
        }
      } else {
        try {
          const encrypted = encryptData(identityNumber);
          updateData.cac = encrypted;
          console.log(`🔒 Encrypted CAC before storage`);
        } catch (err) {
          console.error(`❌ Failed to encrypt CAC:`, err.message);
          // Store unencrypted as fallback (should not happen in production)
          updateData.cac = identityNumber;
        }
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
      
      // Decrypt identity numbers for export (authorized users only)
      let ninValue = entry.nin || '';
      let cacValue = entry.cac || '';
      
      if (ninValue && isEncrypted(ninValue)) {
        try {
          ninValue = decryptData(ninValue.encrypted, ninValue.iv);
        } catch (err) {
          console.error(`❌ Failed to decrypt NIN for export:`, err.message);
          ninValue = '[ENCRYPTED]'; // Show that data is encrypted but couldn't be decrypted
        }
      }
      
      if (cacValue && isEncrypted(cacValue)) {
        try {
          cacValue = decryptData(cacValue.encrypted, cacValue.iv);
        } catch (err) {
          console.error(`❌ Failed to decrypt CAC for export:`, err.message);
          cacValue = '[ENCRYPTED]'; // Show that data is encrypted but couldn't be decrypted
        }
      }
      
      // Add verification columns
      row.push(escapeCSV(formatStatus(entry.status)));           // Verification Status
      row.push(escapeCSV(ninValue));                             // NIN (decrypted)
      row.push(escapeCSV(cacValue));                             // CAC (decrypted)
      row.push(escapeCSV(entry.cacCompanyName || ''));           // CAC Company Name
      row.push(escapeCSV(formatDate(entry.verifiedAt)));         // Verified At
      row.push(escapeCSV(formatDate(entry.linkSentAt)));         // Link Sent At
      
      // Clear decrypted values from memory
      clearSensitiveData(ninValue);
      clearSensitiveData(cacValue);
      
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
    const expirationDateStr = formatDateLong(newTokenExpiresAt);
    
    // Send verification email
    const sanitizedEmail = sanitizeEmail(entry.email);
    const sanitizedSubject = sanitizeEmailSubject(`Action Required: ${entry.verificationType} Verification - NEM Insurance`);
    
    // Validate email before sending
    if (!isValidEmail(sanitizedEmail)) {
      console.error('❌ Invalid email address for resend:', entry.email);
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Entry has an invalid email address format'
      });
    }
    
    const mailOptions = {
      from: '"NEM Insurance" <kyc@nem-insurance.com>',
      to: sanitizedEmail,
      subject: sanitizedSubject,
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
      newExpiresAt: newTokenExpiresAt.toISOString(), // Explicit ISO string conversion
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
 * POST /api/identity/entries/:entryId/retry-verification
 * Manually retry verification for a failed entry
 * Admin/Compliance only - brokers must use bulk verify
 */
app.post('/api/identity/entries/:entryId/retry-verification', requireAuth, requireRole('compliance', 'admin', 'super admin'), async (req, res) => {
  try {
    const { entryId } = req.params;
    
    console.log(`🔄 Manually retrying verification for entry ${entryId}`);
    
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
    
    // Check if entry has already been verified
    if (entry.status === 'verified') {
      return res.status(400).json({
        error: 'Already verified',
        message: 'This entry has already been verified.'
      });
    }
    
    // Check if entry has verification data
    if (!entry.data) {
      return res.status(400).json({
        error: 'No verification data',
        message: 'Entry does not have verification data stored.'
      });
    }
    
    // Determine verification type
    const verificationType = entry.verificationType || 
      (entry.data.nin || entry.data.NIN ? 'NIN' : 
       entry.data.cac || entry.data.CAC ? 'CAC' : null);
    
    if (!verificationType) {
      return res.status(400).json({
        error: 'Unknown verification type',
        message: 'Cannot determine verification type for this entry.'
      });
    }
    
    // Process the verification using the same logic as bulk verify
    const result = await processSingleEntry(
      entry,
      entryId,
      entry.listId,
      req.user.uid,
      req.ipData,
      req.headers['user-agent'],
      false // Don't skip duplicate check
    );
    
    // Create activity log
    await createIdentityActivityLog({
      listId: entry.listId,
      entryId: entryId,
      action: 'manual_retry',
      actorType: 'admin',
      actorId: req.user.uid,
      details: {
        email: entry.email,
        verificationType: verificationType,
        result: result.status,
        retriedBy: req.user.email
      },
      ipAddress: req.ipData?.masked,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`✅ Manual retry completed for ${entry.email}: ${result.status}`);
    
    res.status(200).json({
      success: result.status === 'verified',
      status: result.status,
      message: result.status === 'verified' ? 'Verification successful' : result.reason || 'Verification failed',
      error: result.status !== 'verified' ? result.reason : null
    });
    
  } catch (error) {
    console.error('❌ Error retrying verification:', error);
    
    res.status(500).json({
      error: 'Failed to retry verification',
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
      // Handle timestamp conversion - check if it exists and has toDate method
      let timestamp = null;
      if (data.timestamp) {
        if (typeof data.timestamp.toDate === 'function') {
          timestamp = data.timestamp.toDate().toISOString();
        } else if (data.timestamp instanceof Date) {
          timestamp = data.timestamp.toISOString();
        } else if (typeof data.timestamp === 'string' || typeof data.timestamp === 'number') {
          timestamp = new Date(data.timestamp).toISOString();
        }
      }
      
      return {
        id: doc.id,
        ...data,
        timestamp: timestamp
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
 * GET /api/identity/rate-limit-status
 * Get Datapro API rate limiter status
 * Admin only endpoint for monitoring API usage
 * 
 * Response:
 * - availableTokens: number - Available request tokens
 * - maxTokens: number - Maximum tokens (50)
 * - queueSize: number - Number of queued requests
 * - maxQueueSize: number - Maximum queue size (100)
 * - utilizationPercent: number - Percentage of tokens used
 */
app.get('/api/identity/rate-limit-status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = getDataproRateLimitStatus();
    
    console.log(`📊 Rate limit status requested by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching rate limit status:', error);
    res.status(500).json({
      error: 'Failed to fetch rate limit status',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/api-usage/monthly/:month
 * Get monthly API usage summary
 * Admin only endpoint for cost monitoring
 * 
 * Params:
 * - month: YYYY-MM format (e.g., "2026-02")
 * 
 * Response:
 * - month: string - Month in YYYY-MM format
 * - totalCalls: number - Total API calls
 * - successCalls: number - Successful calls
 * - failedCalls: number - Failed calls
 * - successRate: number - Success rate percentage
 * - estimatedCost: number - Estimated cost in NGN
 * - currency: string - Currency code (NGN)
 */
app.get('/api/identity/api-usage/monthly/:month', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { month } = req.params;
    
    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        error: 'Invalid month format',
        message: 'Month must be in YYYY-MM format (e.g., "2026-02")'
      });
    }
    
    const summary = await getMonthlyUsageSummary(db, month);
    
    console.log(`📊 Monthly API usage requested by ${req.user.email} for ${month}`);
    
    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('❌ Error fetching monthly usage:', error);
    res.status(500).json({
      error: 'Failed to fetch monthly usage',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/api-usage/stats
 * Get API usage statistics for a date range
 * Admin only endpoint for cost monitoring
 * 
 * Query params:
 * - startDate: YYYY-MM-DD format (required)
 * - endDate: YYYY-MM-DD format (required)
 * 
 * Response:
 * - startDate: string
 * - endDate: string
 * - totalCalls: number
 * - successCalls: number
 * - failedCalls: number
 * - successRate: number
 * - dailyStats: array of daily statistics
 */
app.get('/api/identity/api-usage/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'startDate and endDate are required (YYYY-MM-DD format)'
      });
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }
    
    const stats = await getAPIUsageStats(db, startDate, endDate);
    
    console.log(`📊 API usage stats requested by ${req.user.email} for ${startDate} to ${endDate}`);
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching usage stats:', error);
    res.status(500).json({
      error: 'Failed to fetch usage stats',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/api-usage/alerts
 * Check if API usage is approaching limits
 * Admin only endpoint for cost monitoring
 * 
 * Query params:
 * - monthlyLimit: number (optional, default: 10000)
 * - alertThreshold: number (optional, default: 80)
 * 
 * Response:
 * - month: string - Current month
 * - totalCalls: number - Total calls this month
 * - monthlyLimit: number - Monthly limit
 * - usagePercent: number - Usage percentage
 * - shouldAlert: boolean - Whether to alert
 * - alertLevel: string - 'normal', 'warning', or 'critical'
 * - message: string - Alert message if applicable
 */
app.get('/api/identity/api-usage/alerts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const monthlyLimit = parseInt(req.query.monthlyLimit) || 10000;
    const alertThreshold = parseInt(req.query.alertThreshold) || 80;
    
    const alert = await checkUsageLimits(db, monthlyLimit, alertThreshold);
    
    console.log(`📊 API usage alerts requested by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('❌ Error checking usage alerts:', error);
    res.status(500).json({
      error: 'Failed to check usage alerts',
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
 * - Processes in parallel batches (10 concurrent) for performance
 * - Supports progress tracking via separate endpoint
 * - Supports pause/resume functionality
 * 
 * Request body (optional):
 * - batchSize: number - Number of concurrent verifications (default: 10, max: 20)
 * 
 * Response:
 * - jobId: string - Unique job ID for tracking progress
 * - processed: number - Total entries processed
 * - verified: number - Successfully verified entries
 * - failed: number - Failed verification entries
 * - skipped: number - Skipped entries (already verified or missing data)
 * - details: array - Detailed results for each entry
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10, 19.11
 * Performance: 51.2 - Parallel batch processing, progress tracking, pause/resume
 */

// In-memory job tracking for bulk verification
const bulkVerificationJobs = new Map();

// In-memory cache for bulk verification analysis results
// Structure: { analysisId: { listId, createdAt, expiresAt, totalEntries, entriesToVerify, costEstimate, identityTypeBreakdown } }
const bulkVerificationAnalysisCache = new Map();

// In-memory cache for link sending analysis results
// Structure: { analysisId: { listId, verificationType, createdAt, expiresAt, totalEntries, entriesToSend, identityTypeBreakdown } }
const linkSendingAnalysisCache = new Map();

const ANALYSIS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_ANALYSIS_CACHE_SIZE = 1000;

// Clean up expired analysis cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [analysisId, analysis] of bulkVerificationAnalysisCache.entries()) {
    if (analysis.expiresAt < now) {
      bulkVerificationAnalysisCache.delete(analysisId);
      expiredCount++;
    }
  }
  
  // Clean up link sending analysis cache
  for (const [analysisId, analysis] of linkSendingAnalysisCache.entries()) {
    if (analysis.expiresAt < now) {
      linkSendingAnalysisCache.delete(analysisId);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    console.log(`🧹 Cleaned up ${expiredCount} expired analysis cache entries`);
  }
  
  // LRU eviction if cache is too large
  if (bulkVerificationAnalysisCache.size > MAX_ANALYSIS_CACHE_SIZE) {
    const entriesToDelete = bulkVerificationAnalysisCache.size - MAX_ANALYSIS_CACHE_SIZE;
    const sortedEntries = Array.from(bulkVerificationAnalysisCache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    for (let i = 0; i < entriesToDelete; i++) {
      bulkVerificationAnalysisCache.delete(sortedEntries[i][0]);
    }
    
    console.log(`🧹 Evicted ${entriesToDelete} old analysis cache entries (LRU)`);
  }
  
  // LRU eviction for link sending cache
  if (linkSendingAnalysisCache.size > MAX_ANALYSIS_CACHE_SIZE) {
    const entriesToDelete = linkSendingAnalysisCache.size - MAX_ANALYSIS_CACHE_SIZE;
    const sortedEntries = Array.from(linkSendingAnalysisCache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    for (let i = 0; i < entriesToDelete; i++) {
      linkSendingAnalysisCache.delete(sortedEntries[i][0]);
    }
    
    console.log(`🧹 Evicted ${entriesToDelete} old link sending analysis cache entries (LRU)`);
  }
}, 5 * 60 * 1000).unref();

// Helper function to execute bulk verification (can be called directly or from queue)
async function executeBulkVerification(listId, entriesSnapshot, batchSize, userId, ipData, userAgent, providedJobId) {
  // Use provided jobId or generate new one (should always be provided)
  const jobId = providedJobId || `bulk_verify_${listId}_${Date.now()}`;
  
  console.log(`📋 executeBulkVerification called for job ${jobId}`);
  console.log(`   - listId: ${listId}`);
  console.log(`   - entries: ${entriesSnapshot.size}`);
  console.log(`   - batchSize: ${batchSize}`);
  console.log(`   - userId: ${userId}`);
  console.log(`   - providedJobId: ${providedJobId || 'NOT PROVIDED'}`);
  
  // Initialize job tracking
  const jobData = {
    jobId,
    listId,
    userId,
    status: 'running',
    startedAt: new Date(),
    totalEntries: entriesSnapshot.size,
    processed: 0,
    verified: 0,
    failed: 0,
    skipped: 0,
    skipReasons: {
      already_verified: 0,
      invalid_format: 0,
      no_identity_data: 0
    },
    costSavings: {
      duplicatesSkipped: 0,
      estimatedSaved: 0,
      currency: process.env.COST_CURRENCY || 'NGN',
      byType: {
        NIN: 0,
        BVN: 0,
        CAC: 0
      }
    },
    details: [],
    paused: false,
    batchSize,
    progress: 0
  };
  
  bulkVerificationJobs.set(jobId, jobData);
  console.log(`✅ Job ${jobId} initialized and stored in bulkVerificationJobs Map`);
  console.log(`Current jobs in map: ${Array.from(bulkVerificationJobs.keys()).join(', ')}`);
  
  // Log bulk operation start
  try {
    await logBulkOperation({
      operationType: 'bulk_verification_start',
      totalRecords: entriesSnapshot.size,
      successCount: 0,
      failureCount: 0,
      userId: userId,
      userEmail: 'unknown', // Will be filled from user context if available
      metadata: {
        listId,
        jobId,
        batchSize,
        ipAddress: ipData?.masked || 'unknown'
      }
    });
  } catch (logError) {
    console.error('❌ Failed to log bulk operation start:', logError);
    // Don't fail the operation if logging fails
  }
  
  try {
    const entries = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    
    // Process in batches
    for (let i = 0; i < entries.length; i += batchSize) {
      // Check if job is paused
      let currentJob = bulkVerificationJobs.get(jobId);
      if (currentJob && currentJob.paused) {
        console.log(`⏸️ Job ${jobId} paused at entry ${i}/${entries.length}`);
        currentJob.status = 'paused';
        currentJob.pausedAt = new Date();
        bulkVerificationJobs.set(jobId, currentJob);
        throw new Error('Job paused');
      }
      
      const batch = entries.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entries.length / batchSize)} (${batch.length} entries)`);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(entry => 
          processSingleEntry(
            entry.data,
            entry.id,
            listId,
            userId,
            ipData,
            userAgent
          )
        )
      );
      
      // Update job progress
      currentJob = bulkVerificationJobs.get(jobId);
      if (currentJob) {
        batchResults.forEach(result => {
          currentJob.processed++;
          if (result.status === 'verified') currentJob.verified++;
          else if (result.status === 'failed') currentJob.failed++;
          else if (result.status === 'skipped') {
            currentJob.skipped++;
            // Track skip reasons
            const reason = result.reason || 'unknown';
            if (currentJob.skipReasons[reason] !== undefined) {
              currentJob.skipReasons[reason]++;
            } else {
              currentJob.skipReasons[reason] = 1;
            }
            // Track cost savings for duplicates by verification type
            if (reason === 'already_verified' && result.verificationType) {
              currentJob.costSavings.duplicatesSkipped++;
              
              // Get cost for this verification type
              const { loadCostConfig } = require('../../server-utils/costCalculator.cjs');
              const costConfig = loadCostConfig();
              const costPerVerification = costConfig[result.verificationType] || costConfig.NIN;
              
              // Update total savings and by-type breakdown
              currentJob.costSavings.estimatedSaved += costPerVerification;
              currentJob.costSavings.byType[result.verificationType] = 
                (currentJob.costSavings.byType[result.verificationType] || 0) + costPerVerification;
            }
          }
          currentJob.details.push(result);
        });
        
        currentJob.progress = Math.round((currentJob.processed / currentJob.totalEntries) * 100);
        bulkVerificationJobs.set(jobId, currentJob);
      }
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Update list statistics
    const db = admin.firestore();
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
    
    // Mark job as complete
    const finalJob = bulkVerificationJobs.get(jobId);
    if (finalJob) {
      finalJob.status = 'completed';
      finalJob.completedAt = new Date();
      bulkVerificationJobs.set(jobId, finalJob);
      
      // Log bulk operation completion with detailed cost savings
      const duration = finalJob.completedAt - finalJob.startedAt;
      try {
        await logBulkOperation({
          operationType: 'bulk_verification_complete',
          totalRecords: finalJob.totalEntries,
          successCount: finalJob.verified,
          failureCount: finalJob.failed,
          userId: userId,
          userEmail: 'unknown',
          metadata: {
            listId,
            jobId,
            duration,
            skippedCount: finalJob.skipped,
            skipReasons: finalJob.skipReasons,
            costSavings: {
              duplicatesSkipped: finalJob.costSavings.duplicatesSkipped,
              estimatedSaved: finalJob.costSavings.estimatedSaved,
              currency: finalJob.costSavings.currency,
              byType: finalJob.costSavings.byType,
              formattedSavings: `${finalJob.costSavings.currency} ${finalJob.costSavings.estimatedSaved.toFixed(2)}`
            },
            batchSize,
            ipAddress: ipData?.masked || 'unknown'
          }
        });
        
        // Log summary to console for monitoring
        console.log(`💰 Cost Savings Summary for job ${jobId}:`);
        console.log(`   Total duplicates skipped: ${finalJob.costSavings.duplicatesSkipped}`);
        console.log(`   Estimated savings: ${finalJob.costSavings.currency} ${finalJob.costSavings.estimatedSaved.toFixed(2)}`);
        console.log(`   Savings by type:`, finalJob.costSavings.byType);
      } catch (logError) {
        console.error('❌ Failed to log bulk operation completion:', logError);
      }
    }
    
    console.log(`✅ Bulk verification complete for list ${listId}`);
    console.log(`   Processed: ${finalJob.processed}, Verified: ${finalJob.verified}, Failed: ${finalJob.failed}, Skipped: ${finalJob.skipped}`);
    console.log(`   Skip reasons:`, finalJob.skipReasons);
    console.log(`   Cost savings: ${finalJob.costSavings.currency} ${finalJob.costSavings.estimatedSaved.toFixed(2)} (${finalJob.costSavings.duplicatesSkipped} duplicates)`);
    console.log(`   Savings by type:`, finalJob.costSavings.byType);
    
    // Clean up job after 1 hour
    setTimeout(() => {
      bulkVerificationJobs.delete(jobId);
      console.log(`🗑️ Cleaned up job ${jobId}`);
    }, 3600000);
    
    return {
      jobId,
      processed: finalJob.processed,
      verified: finalJob.verified,
      failed: finalJob.failed,
      skipped: finalJob.skipped
    };
    
  } catch (error) {
    console.error('❌ Error during bulk verification:', error);
    const errorJob = bulkVerificationJobs.get(jobId);
    if (errorJob) {
      errorJob.status = 'error';
      errorJob.error = error.message;
      errorJob.errorAt = new Date();
      bulkVerificationJobs.set(jobId, errorJob);
      
      // Log bulk operation failure
      try {
        await logBulkOperation({
          operationType: 'bulk_verification_failure',
          totalRecords: errorJob.totalEntries,
          successCount: errorJob.verified,
          failureCount: errorJob.failed,
          userId: userId,
          userEmail: 'unknown',
          metadata: {
            listId,
            jobId,
            error: error.message,
            processed: errorJob.processed,
            skippedCount: errorJob.skipped,
            ipAddress: ipData?.masked || 'unknown'
          }
        });
      } catch (logError) {
        console.error('❌ Failed to log bulk operation failure:', logError);
      }
    }
    throw error;
  }
}

// Helper function to process a single entry
async function processSingleEntry(entry, entryId, listId, userId, ipData, userAgent, skipDuplicateCheck = false) {
  const entryRef = db.collection('identity-entries').doc(entryId);
  
  // 🔍 DIAGNOSTIC LOGGING - Log entry structure
  console.log(`🔍 Processing entry ${entryId}:`);
  console.log(`   Email: ${entry.email || 'N/A'}`);
  console.log(`   Status: ${entry.status || 'N/A'}`);
  console.log(`   Top-level fields: ${Object.keys(entry).join(', ')}`);
  if (entry.data) {
    console.log(`   entry.data fields: ${Object.keys(entry.data).join(', ')}`);
  } else {
    console.log(`   entry.data: NOT PRESENT`);
  }
  
  // Skip if already verified (safety check)
  if (entry.status === 'verified') {
    await createIdentityActivityLog({
      listId,
      entryId,
      action: 'bulk_verify_skipped',
      actorType: 'admin',
      actorId: userId,
      details: {
        reason: 'already_verified',
        email: entry.email
      },
      ipAddress: ipData?.masked,
      userAgent
    });
    
    return {
      entryId,
      email: entry.email,
      status: 'skipped',
      reason: 'already_verified'
    };
  }
  
  // Check if entry has pre-filled identity data
  let hasNIN = entry.data?.nin || entry.data?.NIN || entry.data?.Nin || entry.data?.['NIN'] || entry.nin;
  let hasBVN = entry.data?.bvn || entry.data?.BVN || entry.data?.Bvn || entry.data?.['BVN'] || entry.bvn;
  let hasCAC = entry.data?.cac || entry.data?.CAC || entry.data?.Cac || entry.data?.['CAC'] || 
               entry.data?.['CAC Number'] || entry.data?.['cac number'] || entry.data?.['Cac Number'] || entry.cac;
  
  // 🔍 DIAGNOSTIC LOGGING - Log field detection results
  console.log(`   Field detection results:`);
  console.log(`     hasNIN: ${hasNIN ? `YES (${typeof hasNIN === 'object' ? 'encrypted' : 'plain'})` : 'NO'}`);
  console.log(`     hasBVN: ${hasBVN ? `YES (${typeof hasBVN === 'object' ? 'encrypted' : 'plain'})` : 'NO'}`);
  console.log(`     hasCAC: ${hasCAC ? `YES (${typeof hasCAC === 'object' ? 'encrypted' : 'plain'})` : 'NO'}`);
  
  // Decrypt encrypted identity fields if present
  if (hasNIN && isEncrypted(hasNIN)) {
    try {
      hasNIN = decryptData(hasNIN.encrypted, hasNIN.iv);
      console.log(`🔓 Decrypted NIN for entry ${entryId}`);
    } catch (err) {
      console.error(`❌ Failed to decrypt NIN for entry ${entryId}:`, err.message);
      hasNIN = null;
    }
  }
  
  if (hasBVN && isEncrypted(hasBVN)) {
    try {
      hasBVN = decryptData(hasBVN.encrypted, hasBVN.iv);
      console.log(`🔓 Decrypted BVN for entry ${entryId}`);
    } catch (err) {
      console.error(`❌ Failed to decrypt BVN for entry ${entryId}:`, err.message);
      hasBVN = null;
    }
  }
  
  if (hasCAC && isEncrypted(hasCAC)) {
    try {
      hasCAC = decryptData(hasCAC.encrypted, hasCAC.iv);
      console.log(`🔓 Decrypted CAC for entry ${entryId}`);
    } catch (err) {
      console.error(`❌ Failed to decrypt CAC for entry ${entryId}:`, err.message);
      hasCAC = null;
    }
  }
  
  // Skip if no identity data pre-filled
  if (!hasNIN && !hasBVN && !hasCAC) {
    console.log(`⏭️ SKIPPING entry ${entryId}: No identity data found`);
    console.log(`   Checked fields: entry.data?.nin, entry.data?.NIN, entry.nin, entry.data?.bvn, entry.data?.BVN, entry.bvn, entry.data?.cac, entry.data?.CAC, entry.cac`);
    return {
      entryId,
      email: entry.email,
      status: 'skipped',
      reason: 'no_identity_data'
    };
  }
  
  // Determine verification type and data
  let verificationType;
  let identityNumber;
  let verificationData = {};
  
  console.log(`✅ Identity data found for entry ${entryId}`);
  
  if (hasNIN || hasBVN) {
    verificationType = 'NIN';
    identityNumber = hasNIN || hasBVN;
    
    // 🔍 DIAGNOSTIC: Check data type and convert to string if needed
    console.log(`   Raw identity data type: ${typeof identityNumber}`);
    console.log(`   Raw identity data value:`, identityNumber);
    
    // Convert to string if it's an object or other type
    if (typeof identityNumber === 'object' && identityNumber !== null) {
      // If it's an encrypted object, it should have been decrypted already
      // If it's still an object, try to extract the value
      if (identityNumber.value) {
        identityNumber = String(identityNumber.value);
      } else if (identityNumber.encrypted) {
        console.log(`⚠️ WARNING: Identity data is still encrypted object, attempting to decrypt...`);
        try {
          identityNumber = decryptData(identityNumber.encrypted, identityNumber.iv);
        } catch (err) {
          console.error(`❌ Failed to decrypt identity data:`, err.message);
          return {
            entryId,
            email: entry.email,
            status: 'skipped',
            reason: 'decryption_failed'
          };
        }
      } else {
        // Try to convert object to string
        identityNumber = String(identityNumber);
      }
    } else if (typeof identityNumber !== 'string') {
      identityNumber = String(identityNumber);
    }
    
    console.log(`   Type: NIN/BVN, Value: ${identityNumber.substring(0, 4)}***`);
    
    verificationData = {
      firstName: entry.data?.firstName || entry.data?.['First Name'] || entry.data?.['first name'],
      lastName: entry.data?.lastName || entry.data?.['Last Name'] || entry.data?.['last name'],
      dateOfBirth: entry.data?.dateOfBirth || entry.data?.['Date of Birth'] || entry.data?.['date of birth'],
      gender: entry.data?.gender || entry.data?.Gender,
      bvn: hasBVN
    };
  } else if (hasCAC) {
    verificationType = 'CAC';
    identityNumber = hasCAC;
    
    // 🔍 DIAGNOSTIC: Check data type and convert to string if needed
    console.log(`   Raw CAC data type: ${typeof identityNumber}`);
    console.log(`   Raw CAC data value:`, identityNumber);
    
    // Convert to string if it's an object or other type
    if (typeof identityNumber === 'object' && identityNumber !== null) {
      if (identityNumber.value) {
        identityNumber = String(identityNumber.value);
      } else if (identityNumber.encrypted) {
        console.log(`⚠️ WARNING: CAC data is still encrypted object, attempting to decrypt...`);
        try {
          identityNumber = decryptData(identityNumber.encrypted, identityNumber.iv);
        } catch (err) {
          console.error(`❌ Failed to decrypt CAC data:`, err.message);
          return {
            entryId,
            email: entry.email,
            status: 'skipped',
            reason: 'decryption_failed'
          };
        }
      } else {
        identityNumber = String(identityNumber);
      }
    } else if (typeof identityNumber !== 'string') {
      identityNumber = String(identityNumber);
    }
    
    console.log(`   Type: CAC, Value: ${identityNumber}`);
    
    verificationData = {
      companyName: entry.data?.companyName || entry.data?.['Company Name'] || entry.data?.['company name'],
      registrationNumber: entry.data?.registrationNumber || entry.data?.['Registration Number'] || entry.data?.['registration number'],
      registrationDate: entry.data?.registrationDate || entry.data?.['Registration Date'] || entry.data?.['registration date'],
      businessAddress: entry.data?.businessAddress || entry.data?.['Business Address'] || entry.data?.['business address']
    };
  }
  
  // Validate identity number format
  if (verificationType === 'NIN' && !/^\d{11}$/.test(identityNumber)) {
    console.log(`⏭️ SKIPPING entry ${entryId}: Invalid NIN format (expected 11 digits, got: ${identityNumber})`);
    return {
      entryId,
      email: entry.email,
      status: 'skipped',
      reason: 'invalid_nin_format'
    };
  }
  
  // 🔍 DUPLICATE CHECK - Check if identity has been verified before (unless already done in analysis phase)
  if (!skipDuplicateCheck) {
    try {
      console.log(`🔍 Checking for duplicate: ${verificationType} ${identityNumber.substring(0, 4)}***`);
      const duplicateResult = await checkDuplicate(verificationType, identityNumber);
      
      if (duplicateResult.isDuplicate) {
        console.log(`⏭️ SKIPPING entry ${entryId}: Already verified in list ${duplicateResult.originalListId}`);
        console.log(`   Original verification date: ${duplicateResult.originalVerificationDate}`);
        console.log(`   Original broker: ${duplicateResult.originalBroker}`);
        
        // Log the duplicate skip for audit purposes
        await createIdentityActivityLog({
          listId,
          entryId,
          action: 'bulk_verify_skipped',
          actorType: 'admin',
          actorId: userId,
          details: {
            reason: 'already_verified',
            email: entry.email,
            verificationType,
            identityNumber: identityNumber.substring(0, 4) + '***', // Masked for security
            originalListId: duplicateResult.originalListId,
            originalEntryId: duplicateResult.originalEntryId,
            originalVerificationDate: duplicateResult.originalVerificationDate,
            originalBroker: duplicateResult.originalBroker,
            duplicateDetectedAt: new Date()
          },
          ipAddress: ipData?.masked,
          userAgent
        });
        
        return {
          entryId,
          email: entry.email,
          status: 'skipped',
          reason: 'already_verified',
          verificationType,
          duplicateInfo: {
            originalListId: duplicateResult.originalListId,
            originalEntryId: duplicateResult.originalEntryId,
            originalDate: duplicateResult.originalVerificationDate,
            originalBroker: duplicateResult.originalBroker
          }
        };
      } else {
        console.log(`✅ No duplicate found for ${verificationType} ${identityNumber.substring(0, 4)}***`);
      }
    } catch (duplicateCheckError) {
      // Fail-open: Log error and proceed with verification to avoid blocking legitimate requests
      console.error(`⚠️ Duplicate check failed for entry ${entryId}:`, duplicateCheckError.message);
      console.error(`   Proceeding with verification (fail-open approach)`);
      
      // Log the duplicate check failure for monitoring
      try {
        await createIdentityActivityLog({
          listId,
          entryId,
          action: 'duplicate_check_error',
          actorType: 'system',
          actorId: 'duplicate_detector',
          details: {
            error: duplicateCheckError.message,
            verificationType,
            identityNumber: identityNumber.substring(0, 4) + '***',
            failOpenAction: 'proceeding_with_verification'
          },
          ipAddress: ipData?.masked,
          userAgent
        });
      } catch (logError) {
        console.error('Failed to log duplicate check error:', logError);
      }
    }
  }
  
  // Call verification API
  let verificationResult;
  
  try {
    if (verificationType === 'NIN') {
      console.log(`🔍 Verifying NIN for entry ${entryId}: ${identityNumber.substring(0, 4)}***`);
      
      const dataproResult = await dataproVerifyNIN(identityNumber);
      
      if (dataproResult.success) {
        const excelData = {
          firstName: verificationData.firstName,
          lastName: verificationData.lastName,
          dateOfBirth: verificationData.dateOfBirth,
          gender: verificationData.gender,
          phoneNumber: entry.data?.phoneNumber || entry.data?.phone_number || entry.data?.['Phone Number'] || ''
        };
        
        const matchResult = dataproMatchFields(dataproResult.data, excelData);
        
        verificationResult = {
          success: matchResult.matched,
          data: dataproResult.data,
          message: matchResult.matched ? 'Verification successful' : 'Field mismatch detected',
          failedFields: matchResult.failedFields,
          matchDetails: matchResult.details
        };
        
        console.log(`✅ Datapro verification for entry ${entryId}: ${matchResult.matched ? 'MATCHED' : 'FAILED'}`);
        if (!matchResult.matched) {
          console.log(`❌ Failed fields: ${matchResult.failedFields.join(', ')}`);
        }
        
        // ✅ CONSOLIDATED LOGGING - Single call replaces trackDataproAPICall + logVerificationAttempt
        // Extract customer name from entry data for audit logging
        let customerName = 'anonymous';
        if (verificationData.firstName && verificationData.lastName) {
          customerName = `${verificationData.firstName} ${verificationData.lastName}`;
        } else if (verificationData.firstName) {
          customerName = verificationData.firstName;
        } else if (verificationData.lastName) {
          customerName = verificationData.lastName;
        }
        
        try {
          await logVerificationComplete(db, {
            provider: 'datapro',
            verificationType: 'NIN',
            success: matchResult.matched,
            listId,
            entryId,
            identityNumber,
            userId: customerName, // Customer name, not broker ID
            userEmail: entry.email || 'bulk_verification',
            userName: customerName, // Customer name for display
            ipAddress: ipData?.masked || 'bulk_operation',
            userType: 'customer', // Mark as customer verification
            errorCode: matchResult.matched ? null : 'FIELD_MISMATCH',
            errorMessage: matchResult.matched ? null : 'Field mismatch detected',
            metadata: {
              bulkOperation: true,
              initiatedBy: userId, // Track broker who initiated bulk operation
              fieldsValidated: matchResult.details?.matchedFields || [],
              failedFields: matchResult.failedFields || []
            }
          });
        } catch (logError) {
          console.error('Failed to log verification:', logError);
        }
      } else {
        console.error(`❌ Datapro verification failed for entry ${entryId}: ${dataproResult.error}`);
        verificationResult = {
          success: false,
          message: dataproGetUserFriendlyError(dataproResult.errorCode, dataproResult.details),
          technicalMessage: dataproGetTechnicalError(dataproResult.errorCode, dataproResult.details),
          errorCode: dataproResult.errorCode
        };
        
        // ✅ CONSOLIDATED LOGGING for failed verification
        // Extract customer name from entry data for audit logging
        let customerName = 'anonymous';
        if (verificationData.firstName && verificationData.lastName) {
          customerName = `${verificationData.firstName} ${verificationData.lastName}`;
        } else if (verificationData.firstName) {
          customerName = verificationData.firstName;
        } else if (verificationData.lastName) {
          customerName = verificationData.lastName;
        }
        
        try {
          await logVerificationComplete(db, {
            provider: 'datapro',
            verificationType: 'NIN',
            success: false,
            listId,
            entryId,
            identityNumber,
            userId: customerName, // Customer name, not broker ID
            userEmail: entry.email || 'bulk_verification',
            userName: customerName, // Customer name for display
            ipAddress: ipData?.masked || 'bulk_operation',
            userType: 'customer', // Mark as customer verification
            errorCode: dataproResult.errorCode,
            errorMessage: dataproResult.error || 'Verification failed',
            metadata: {
              bulkOperation: true,
              initiatedBy: userId // Track broker who initiated bulk operation
            }
          });
        } catch (logError) {
          console.error('Failed to log verification:', logError);
        }
      }
    } else {
      // CAC verification via VerifyData
      console.log(`🔍 Verifying CAC for entry ${entryId}: ${identityNumber.substring(0, 4)}***`);
      
      // Apply VerifyData rate limiting
      try {
        await applyVerifydataRateLimit();
      } catch (rateLimitError) {
        console.error(`❌ VerifyData rate limit exceeded for entry ${entryId}:`, rateLimitError);
        return {
          entryId,
          email: entry.email,
          status: 'failed',
          verificationType,
          reason: 'Rate limit exceeded'
        };
      }
      
      const verifydataResult = await verifydataVerifyCAC(identityNumber);
      
      if (verifydataResult.success) {
        const excelData = {
          companyName: verificationData.companyName,
          registrationNumber: verificationData.registrationNumber,
          registrationDate: verificationData.registrationDate,
          businessAddress: verificationData.businessAddress
        };
        
        const matchResult = verifydataMatchCACFields(verifydataResult.data, excelData);
        
        verificationResult = {
          success: matchResult.matched,
          data: verifydataResult.data,
          message: matchResult.matched ? 'Verification successful' : 'Field mismatch detected',
          failedFields: matchResult.failedFields,
          matchDetails: matchResult.details
        };
        
        console.log(`✅ VerifyData verification for entry ${entryId}: ${matchResult.matched ? 'MATCHED' : 'FAILED'}`);
        if (!matchResult.matched) {
          console.log(`❌ Failed fields: ${matchResult.failedFields.join(', ')}`);
        }
        
        // ✅ CONSOLIDATED LOGGING - Single call replaces trackVerifydataAPICall + logVerificationAttempt
        // Extract customer (company) name from entry data for audit logging
        const customerName = verificationData.companyName || 'anonymous';
        
        try {
          await logVerificationComplete(db, {
            provider: 'verifydata',
            verificationType: 'CAC',
            success: matchResult.matched,
            listId,
            entryId,
            identityNumber,
            userId: customerName, // Company name, not broker ID
            userEmail: entry.email || 'bulk_verification',
            userName: customerName, // Company name for display
            ipAddress: ipData?.masked || 'bulk_operation',
            userType: 'customer', // Mark as customer verification
            errorCode: matchResult.matched ? null : 'FIELD_MISMATCH',
            errorMessage: matchResult.matched ? null : 'Field mismatch detected',
            metadata: {
              bulkOperation: true,
              initiatedBy: userId, // Track broker who initiated bulk operation
              fieldsValidated: matchResult.details?.matchedFields || [],
              failedFields: matchResult.failedFields || []
            }
          });
        } catch (logError) {
          console.error('Failed to log verification:', logError);
        }
      } else {
        console.error(`❌ VerifyData verification failed for entry ${entryId}: ${verifydataResult.error}`);
        verificationResult = {
          success: false,
          message: verifydataGetUserFriendlyError(verifydataResult.errorCode, verifydataResult.details),
          technicalMessage: verifydataGetTechnicalError(verifydataResult.errorCode, verifydataResult.details),
          errorCode: verifydataResult.errorCode
        };
        
        // ✅ CONSOLIDATED LOGGING for failed verification
        // Extract customer (company) name from entry data for audit logging
        const customerName = verificationData.companyName || 'anonymous';
        
        try {
          await logVerificationComplete(db, {
            provider: 'verifydata',
            verificationType: 'CAC',
            success: false,
            listId,
            entryId,
            identityNumber,
            userId: customerName, // Company name, not broker ID
            userEmail: entry.email || 'bulk_verification',
            userName: customerName, // Company name for display
            ipAddress: ipData?.masked || 'bulk_operation',
            userType: 'customer', // Mark as customer verification
            errorCode: verifydataResult.errorCode,
            errorMessage: verifydataResult.error || 'Verification failed',
            metadata: {
              bulkOperation: true,
              initiatedBy: userId // Track broker who initiated bulk operation
            }
          });
        } catch (logError) {
          console.error('Failed to log verification:', logError);
        }
      }
    }
    
    // Handle verification result
    if (verificationResult.success) {
      const updateData = {
        status: 'verified',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        verificationDetails: {
          validationSuccess: true,
          matchDetails: verificationResult.matchDetails || null,
          verifiedVia: 'bulk_verify'
        }
      };
      
      if (verificationType === 'NIN') {
        try {
          const encrypted = encryptData(identityNumber);
          updateData.nin = encrypted;
          console.log(`🔒 Encrypted NIN before storage for entry ${entryId}`);
        } catch (err) {
          console.error(`❌ Failed to encrypt NIN for entry ${entryId}:`, err.message);
          updateData.nin = identityNumber;
        }
      } else {
        try {
          const encrypted = encryptData(identityNumber);
          updateData.cac = encrypted;
          console.log(`🔒 Encrypted CAC before storage for entry ${entryId}`);
        } catch (err) {
          console.error(`❌ Failed to encrypt CAC for entry ${entryId}:`, err.message);
          updateData.cac = identityNumber;
        }
        if (verificationData.companyName) {
          updateData.cacCompanyName = verificationData.companyName;
        }
      }
      
      await entryRef.update(updateData);
      clearSensitiveData(identityNumber);
      
      await createIdentityActivityLog({
        listId,
        entryId,
        action: 'verification_success',
        actorType: 'admin',
        actorId: userId,
        details: {
          email: entry.email,
          verificationType,
          method: 'bulk_verify'
        },
        ipAddress: ipData?.masked,
        userAgent
      });
      
      console.log(`✅ Entry ${entryId} verified successfully`);
      
      return {
        entryId,
        email: entry.email,
        status: 'verified',
        verificationType
      };
    } else {
      await entryRef.update({
        status: 'verification_failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        verificationDetails: {
          failureReason: verificationResult.message || 'Verification failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
      
      await createIdentityActivityLog({
        listId,
        entryId,
        action: 'verification_failed',
        actorType: 'admin',
        actorId: userId,
        details: {
          email: entry.email,
          verificationType,
          error: verificationResult.message,
          method: 'bulk_verify'
        },
        ipAddress: ipData?.masked,
        userAgent
      });
      
      console.log(`❌ Entry ${entryId} verification failed: ${verificationResult.message}`);
      
      return {
        entryId,
        email: entry.email,
        status: 'failed',
        verificationType,
        reason: verificationResult.message
      };
    }
  } catch (apiError) {
    console.error(`❌ API error for entry ${entryId}:`, apiError);
    
    await entryRef.update({
      status: 'verification_failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationDetails: {
        failureReason: 'API error: ' + apiError.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });
    
    return {
      entryId,
      email: entry.email,
      status: 'failed',
      verificationType,
      reason: 'API error: ' + apiError.message
    };
  }
}

/**
 * POST /api/identity/lists/:listId/analyze-bulk-verify
 * Analyze entries before bulk verification to show confirmation modal
 * 
 * This endpoint:
 * 1. Fetches all unverified entries for the list
 * 2. Validates format for each entry
 * 3. Checks for duplicates across all lists
 * 4. Calculates cost estimate
 * 5. Returns analysis summary with analysisId
 * 6. Caches results for 10 minutes
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
app.post('/api/identity/lists/:listId/analyze-bulk-verify', requireAuth, requireBrokerOrAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    console.log(`🔍 Analyzing bulk verification for list ${listId}`);
    
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
      console.log(`❌ Broker ${req.user.email} attempted to analyze list ${listId} owned by ${listData.createdBy}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to analyze this list'
      });
    }
    
    // Fetch all unverified entries
    const entriesSnapshot = await db.collection('identity-entries')
      .where('listId', '==', listId)
      .where('status', 'in', ['pending', 'link_sent'])
      .get();
    
    console.log(`📋 Found ${entriesSnapshot.size} unverified entries to analyze`);
    
    if (entriesSnapshot.empty) {
      return res.json({
        analysisId: null,
        totalEntries: 0,
        toVerify: 0,
        toSkip: 0,
        skipReasons: {},
        costEstimate: {
          totalCost: 0,
          currency: process.env.COST_CURRENCY || 'NGN',
          breakdown: { nin: 0, bvn: 0, cac: 0 }
        },
        identityTypeBreakdown: { nin: 0, bvn: 0, cac: 0 }
      });
    }
    
    // Analyze each entry
    const entriesToVerify = [];
    const skipReasons = {
      already_verified: 0,
      invalid_format: 0,
      no_identity_data: 0
    };
    const identityTypeCounts = {
      nin: 0,
      bvn: 0,
      cac: 0
    };
    
    for (const doc of entriesSnapshot.docs) {
      const entry = doc.data();
      const entryId = doc.id;
      
      // Determine verification type(s) - check NIN and CAC (BVN commented out for now)
      // Note: We check in priority order, but only verify ONE type per entry
      let verificationType = null;
      let identityValue = null;
      
      // Priority 1: NIN
      // Check encrypted field first, then data object with various column name variations
      if (entry.nin) {
        verificationType = 'NIN';
        identityValue = entry.nin;
      } else if (entry.data?.nin || entry.data?.NIN || entry.data?.Nin || entry.data?.['NIN']) {
        verificationType = 'NIN';
        identityValue = entry.data.nin || entry.data.NIN || entry.data.Nin || entry.data['NIN'];
      }
      // Priority 2: BVN (COMMENTED OUT - may be enabled later)
      // else if (entry.bvn) {
      //   verificationType = 'BVN';
      //   identityValue = entry.bvn;
      // } else if (entry.data?.bvn || entry.data?.BVN || entry.data?.Bvn || entry.data?.['BVN']) {
      //   verificationType = 'BVN';
      //   identityValue = entry.data.bvn || entry.data.BVN || entry.data.Bvn || entry.data['BVN'];
      // }
      // Priority 3: CAC
      else if (entry.cac) {
        verificationType = 'CAC';
        identityValue = entry.cac;
      } else if (entry.data?.cac || entry.data?.CAC || entry.data?.Cac || entry.data?.['CAC'] || 
                 entry.data?.['CAC Number'] || entry.data?.['cac number'] || entry.data?.['Cac Number']) {
        verificationType = 'CAC';
        identityValue = entry.data.cac || entry.data.CAC || entry.data.Cac || entry.data['CAC'] || 
                        entry.data['CAC Number'] || entry.data['cac number'] || entry.data['Cac Number'];
      }
      
      // Skip if no identity data
      if (!verificationType || !identityValue) {
        skipReasons.no_identity_data++;
        continue;
      }
      
      // Convert to string if needed and decrypt if encrypted
      if (typeof identityValue === 'number') {
        identityValue = String(identityValue);
      } else if (typeof identityValue === 'object' && identityValue.encrypted) {
        // Decrypt encrypted identity data
        try {
          identityValue = decryptData(identityValue.encrypted, identityValue.iv);
        } catch (decryptError) {
          console.error(`Failed to decrypt ${verificationType} for entry ${entryId}:`, decryptError.message);
          skipReasons.invalid_format++;
          continue;
        }
      } else if (typeof identityValue !== 'string') {
        skipReasons.invalid_format++;
        continue;
      }
      
      // Validate format
      const validation = validateIdentityFormat(verificationType, identityValue);
      if (!validation.isValid) {
        skipReasons.invalid_format++;
        continue;
      }
      
      // Check for duplicates
      const duplicateCheck = await checkDuplicate(verificationType, identityValue);
      
      if (duplicateCheck.isDuplicate) {
        skipReasons.already_verified++;
        entriesToVerify.push({
          entryId,
          identityType: verificationType,
          identityValue,
          shouldVerify: false,
          skipReason: 'already_verified',
          isDuplicate: true,
          duplicateInfo: duplicateCheck
        });
      } else {
        // Count for cost calculation
        const typeKey = verificationType.toLowerCase();
        identityTypeCounts[typeKey]++;
        
        entriesToVerify.push({
          entryId,
          identityType: verificationType,
          identityValue,
          shouldVerify: true,
          skipReason: null,
          isDuplicate: false,
          duplicateInfo: null
        });
      }
    }
    
    // Calculate cost estimate
    console.log('🔍 DEBUG: About to call calculateVerificationCost');
    console.log('🔍 DEBUG: typeof calculateVerificationCost:', typeof calculateVerificationCost);
    console.log('🔍 DEBUG: identityTypeCounts:', identityTypeCounts);
    const costEstimate = calculateVerificationCost(identityTypeCounts);
    
    // Generate analysis ID
    const analysisId = `analysis_${listId}_${Date.now()}`;
    
    // Store in cache
    const analysis = {
      analysisId,
      listId,
      createdAt: Date.now(),
      expiresAt: Date.now() + ANALYSIS_CACHE_TTL,
      totalEntries: entriesSnapshot.size,
      entriesToVerify,
      costEstimate,
      identityTypeBreakdown: identityTypeCounts
    };
    
    bulkVerificationAnalysisCache.set(analysisId, analysis);
    
    console.log(`✅ Analysis complete for list ${listId}:`);
    console.log(`   - Total entries: ${entriesSnapshot.size}`);
    console.log(`   - To verify: ${entriesToVerify.filter(e => e.shouldVerify).length}`);
    console.log(`   - To skip: ${Object.values(skipReasons).reduce((a, b) => a + b, 0)}`);
    console.log(`   - Estimated cost: ${costEstimate.currency} ${costEstimate.totalCost}`);
    
    // Return analysis summary
    res.json({
      analysisId,
      totalEntries: entriesSnapshot.size,
      toVerify: entriesToVerify.filter(e => e.shouldVerify).length,
      toSkip: Object.values(skipReasons).reduce((a, b) => a + b, 0),
      skipReasons,
      costEstimate,
      identityTypeBreakdown: identityTypeCounts
    });
    
  } catch (error) {
    console.error('❌ Error analyzing bulk verification:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

app.post('/api/identity/lists/:listId/bulk-verify', requireAuth, requireBrokerOrAdmin, bulkVerificationRateLimiter, async (req, res) => {
  try {
    const { listId } = req.params;
    const { batchSize = 10, analysisId } = req.body;
    
    // Validate batch size
    const validatedBatchSize = Math.min(20, Math.max(1, parseInt(batchSize) || 10));
    
    console.log(`🔄 Starting bulk verification for list ${listId} with batch size ${validatedBatchSize}`);
    if (analysisId) {
      console.log(`   Using cached analysis: ${analysisId}`);
    }
    
    // If analysisId provided, check cache
    let cachedAnalysis = null;
    if (analysisId) {
      cachedAnalysis = bulkVerificationAnalysisCache.get(analysisId);
      
      if (!cachedAnalysis) {
        // Cache expired or invalid analysisId
        console.log(`❌ Analysis cache miss or expired for ${analysisId}`);
        return res.status(410).json({
          error: 'Analysis expired',
          message: 'The analysis results have expired. Please click "Verify All Unverified" again to get a fresh analysis.',
          code: 'ANALYSIS_EXPIRED'
        });
      }
      
      // Verify the analysis is for this list
      if (cachedAnalysis.listId !== listId) {
        console.log(`❌ Analysis ${analysisId} is for list ${cachedAnalysis.listId}, not ${listId}`);
        return res.status(400).json({
          error: 'Invalid analysis',
          message: 'The analysis results do not match this list.',
          code: 'ANALYSIS_MISMATCH'
        });
      }
      
      console.log(`✅ Using cached analysis: ${cachedAnalysis.entriesToVerify.length} entries analyzed`);
    }
    
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
    
    // Check queue load - if system is at capacity, queue the request
    const queueStats = getQueueStats();
    const isHighLoad = queueStats.utilizationPercent >= 80 || queueStats.queueSize > 50;
    
    if (isHighLoad && entriesSnapshot.size > 20) {
      console.log(`⚠️ System under high load (${queueStats.utilizationPercent}% utilization, ${queueStats.queueSize} queued). Queuing bulk verification request.`);
      
      try {
        // Queue the bulk verification request
        const queueResult = enqueueVerification({
          type: 'bulk',
          userId: req.user.uid,
          userEmail: req.user.email,
          listId,
          verificationType: 'bulk_verify',
          priority: 0, // Normal priority
          notifyOnComplete: true,
          metadata: {
            batchSize: validatedBatchSize,
            totalEntries: entriesSnapshot.size
          },
          verificationFn: async () => {
            // This function will be executed when the queue processes this item
            return await executeBulkVerification(
              listId,
              entriesSnapshot,
              validatedBatchSize,
              req.user.uid,
              req.ipData,
              req.headers['user-agent']
            );
          }
        });
        
        return res.status(202).json({
          queued: true,
          queueId: queueResult.queueId,
          position: queueResult.position,
          queueSize: queueResult.queueSize,
          estimatedWaitTime: queueResult.estimatedWaitTime,
          message: 'Your bulk verification request has been queued due to high system load. You will be notified when it completes.',
          statusUrl: `/api/identity/queue/status/${queueResult.queueId}`
        });
        
      } catch (queueError) {
        console.error('❌ Failed to queue request:', queueError);
        // Fall through to immediate processing if queuing fails
        console.log('⚠️ Falling back to immediate processing');
      }
    }
    
    // Create job ID for tracking
    const jobId = `bulk_verify_${listId}_${Date.now()}`;
    
    // Send immediate response with job ID
    res.status(202).json({
      jobId,
      message: 'Bulk verification started',
      totalEntries: entriesSnapshot.size,
      batchSize: validatedBatchSize,
      statusUrl: `/api/identity/bulk-verify/${jobId}/status`
    });
    
    // Process entries in background using helper function
    (async () => {
      try {
        await executeBulkVerification(
          listId,
          entriesSnapshot,
          validatedBatchSize,
          req.user.uid,
          req.ipData,
          req.headers['user-agent'],
          jobId  // Pass the jobId to ensure it matches!
        );
      } catch (error) {
        console.error('❌ Error during bulk verification:', error);
      }
    })();
    
  } catch (error) {
    console.error('❌ Error starting bulk verification:', error);
    res.status(500).json({
      error: 'Bulk verification failed to start',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/bulk-verify/:jobId/status
 * Get the status of a bulk verification job
 * 
 * Response:
 * - jobId: string - Job ID
 * - status: string - Job status (running, paused, completed, error)
 * - progress: number - Progress percentage (0-100)
 * - processed: number - Entries processed so far
 * - verified: number - Successfully verified entries
 * - failed: number - Failed verification entries
 * - skipped: number - Skipped entries
 * - totalEntries: number - Total entries to process
 * - startedAt: Date - Job start time
 * - completedAt: Date - Job completion time (if completed)
 * - pausedAt: Date - Job pause time (if paused)
 * - details: array - Detailed results (optional, only if includeDetails=true)
 */
app.get('/api/identity/bulk-verify/:jobId/status', requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { includeDetails = 'false' } = req.query;
    
    const job = bulkVerificationJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No bulk verification job found with ID: ${jobId}`
      });
    }
    
    // Check if user has permission to view this job
    if (job.userId !== req.user.uid && !['admin', 'super_admin', 'compliance'].includes(normalizeRole(req.user.role))) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this job'
      });
    }
    
    // Build response
    const response = {
      jobId: job.jobId,
      listId: job.listId,
      status: job.status,
      completed: job.status === 'completed' || job.status === 'error' || job.status === 'paused',
      progress: job.progress || 0,
      processed: job.processed,
      verified: job.verified,
      failed: job.failed,
      skipped: job.skipped,
      skipReasons: job.skipReasons || {
        already_verified: 0,
        invalid_format: 0,
        no_identity_data: 0
      },
      totalEntries: job.totalEntries,
      batchSize: job.batchSize,
      startedAt: job.startedAt,
      completedAt: job.completedAt || null,
      pausedAt: job.pausedAt || null,
      error: job.error || null,
      costSavings: job.costSavings || {
        duplicatesSkipped: 0,
        estimatedSaved: 0,
        currency: process.env.COST_CURRENCY || 'NGN',
        byType: {
          NIN: 0,
          BVN: 0,
          CAC: 0
        }
      }
    };
    
    // Include details if requested
    if (includeDetails === 'true') {
      response.details = job.details;
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error getting job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      message: error.message
    });
  }
});

/**
 * POST /api/identity/bulk-verify/:jobId/pause
 * Pause a running bulk verification job
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - jobId: string
 * - status: string
 */
app.post('/api/identity/bulk-verify/:jobId/pause', requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = bulkVerificationJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No bulk verification job found with ID: ${jobId}`
      });
    }
    
    // Check if user has permission to pause this job
    if (job.userId !== req.user.uid && !['admin', 'super_admin', 'compliance'].includes(normalizeRole(req.user.role))) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to pause this job'
      });
    }
    
    // Check if job is running
    if (job.status !== 'running') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: `Cannot pause job with status: ${job.status}`
      });
    }
    
    // Set pause flag
    job.paused = true;
    bulkVerificationJobs.set(jobId, job);
    
    console.log(`⏸️ Job ${jobId} pause requested by ${req.user.email}`);
    
    // Log bulk operation pause
    try {
      await logBulkOperation({
        operationType: 'bulk_verification_pause',
        totalRecords: job.totalEntries,
        successCount: job.verified,
        failureCount: job.failed,
        userId: req.user.uid,
        userEmail: req.user.email,
        metadata: {
          listId: job.listId,
          jobId,
          progress: job.progress,
          processed: job.processed,
          skippedCount: job.skipped,
          ipAddress: req.ipData?.masked || 'unknown'
        }
      });
    } catch (logError) {
      console.error('❌ Failed to log bulk operation pause:', logError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Job pause requested. The job will pause after completing the current batch.',
      jobId: job.jobId,
      status: 'pausing'
    });
    
  } catch (error) {
    console.error('❌ Error pausing job:', error);
    res.status(500).json({
      error: 'Failed to pause job',
      message: error.message
    });
  }
});

/**
 * POST /api/identity/bulk-verify/:jobId/resume
 * Resume a paused bulk verification job
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - jobId: string
 * - status: string
 */
app.post('/api/identity/bulk-verify/:jobId/resume', requireAuth, requireBrokerOrAdmin, bulkVerificationRateLimiter, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = bulkVerificationJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: `No bulk verification job found with ID: ${jobId}`
      });
    }
    
    // Check if user has permission to resume this job
    if (job.userId !== req.user.uid && !['admin', 'super_admin', 'compliance'].includes(normalizeRole(req.user.role))) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to resume this job'
      });
    }
    
    // Check if job is paused
    if (job.status !== 'paused') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: `Cannot resume job with status: ${job.status}`
      });
    }
    
    console.log(`▶️ Resuming job ${jobId} requested by ${req.user.email}`);
    
    // Get remaining entries
    const entriesSnapshot = await db.collection('identity-entries')
      .where('listId', '==', job.listId)
      .where('status', 'in', ['pending', 'link_sent'])
      .get();
    
    const entries = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    
    // Reset pause flag and update status
    job.paused = false;
    job.status = 'running';
    job.resumedAt = new Date();
    bulkVerificationJobs.set(jobId, job);
    
    // Log bulk operation resume
    try {
      await logBulkOperation({
        operationType: 'bulk_verification_resume',
        totalRecords: job.totalEntries,
        successCount: job.verified,
        failureCount: job.failed,
        userId: req.user.uid,
        userEmail: req.user.email,
        metadata: {
          listId: job.listId,
          jobId,
          progress: job.progress,
          processed: job.processed,
          remainingEntries: entries.length,
          skippedCount: job.skipped,
          ipAddress: req.ipData?.masked || 'unknown'
        }
      });
    } catch (logError) {
      console.error('❌ Failed to log bulk operation resume:', logError);
    }
    
    // Send response immediately
    res.status(200).json({
      success: true,
      message: 'Job resumed',
      jobId: job.jobId,
      status: 'running',
      remainingEntries: entries.length
    });
    
    // Continue processing in background
    (async () => {
      try {
        const startIndex = job.processed;
        
        // Process remaining entries in batches
        for (let i = 0; i < entries.length; i += job.batchSize) {
          // Check if job is paused again
          let currentJob = bulkVerificationJobs.get(jobId);
          if (currentJob && currentJob.paused) {
            console.log(`⏸️ Job ${jobId} paused again at entry ${i}/${entries.length}`);
            currentJob.status = 'paused';
            currentJob.pausedAt = new Date();
            bulkVerificationJobs.set(jobId, currentJob);
            return;
          }
          
          const batch = entries.slice(i, i + job.batchSize);
          console.log(`📦 Processing resumed batch ${Math.floor(i / job.batchSize) + 1}/${Math.ceil(entries.length / job.batchSize)} (${batch.length} entries)`);
          
          // Process batch in parallel
          const batchResults = await Promise.all(
            batch.map(entry => 
              processSingleEntry(
                entry.data,
                entry.id,
                job.listId,
                job.userId,
                req.ipData,
                req.headers['user-agent']
              )
            )
          );
          
          // Update job progress
          currentJob = bulkVerificationJobs.get(jobId);
          if (currentJob) {
            batchResults.forEach(result => {
              currentJob.processed++;
              if (result.status === 'verified') currentJob.verified++;
              else if (result.status === 'failed') currentJob.failed++;
              else if (result.status === 'skipped') {
                currentJob.skipped++;
                // Track skip reasons
                const reason = result.reason || 'unknown';
                if (currentJob.skipReasons[reason] !== undefined) {
                  currentJob.skipReasons[reason]++;
                } else {
                  currentJob.skipReasons[reason] = 1;
                }
                // Track cost savings for duplicates
                if (reason === 'already_verified') {
                  currentJob.costSavings.duplicatesSkipped++;
                  const costPerVerification = parseInt(process.env.NIN_VERIFICATION_COST || '100', 10);
                  currentJob.costSavings.estimatedSaved += costPerVerification;
                }
              }
              currentJob.details.push(result);
            });
            
            currentJob.progress = Math.round((currentJob.processed / currentJob.totalEntries) * 100);
            bulkVerificationJobs.set(jobId, currentJob);
          }
          
          // Small delay between batches
          if (i + job.batchSize < entries.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Update list statistics
        const listRef = db.collection('identity-lists').doc(job.listId);
        const updatedEntriesSnapshot = await db.collection('identity-entries')
          .where('listId', '==', job.listId)
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
        
        // Mark job as complete
        const finalJob = bulkVerificationJobs.get(jobId);
        if (finalJob) {
          finalJob.status = 'completed';
          finalJob.completedAt = new Date();
          bulkVerificationJobs.set(jobId, finalJob);
        }
        
        console.log(`✅ Resumed bulk verification complete for list ${job.listId}`);
        
        // Clean up job after 1 hour
        setTimeout(() => {
          bulkVerificationJobs.delete(jobId);
          console.log(`🗑️ Cleaned up job ${jobId}`);
        }, 3600000);
        
      } catch (error) {
        console.error('❌ Error during resumed bulk verification:', error);
        const errorJob = bulkVerificationJobs.get(jobId);
        if (errorJob) {
          errorJob.status = 'error';
          errorJob.error = error.message;
          errorJob.errorAt = new Date();
          bulkVerificationJobs.set(jobId, errorJob);
        }
      }
    })();
    
  } catch (error) {
    console.error('❌ Error resuming job:', error);
    res.status(500).json({
      error: 'Failed to resume job',
      message: error.message
    });
  }
});

// ============= VERIFICATION QUEUE API =============

/**
 * GET /api/identity/queue/status/:queueId
 * Get the status of a queued verification request
 * 
 * Response:
 * - queueId: string - Queue item ID
 * - status: string - Status (queued, processing, completed, failed)
 * - position: number - Position in queue (if queued)
 * - queueSize: number - Total queue size (if queued)
 * - estimatedWaitTime: number - Estimated wait time in seconds (if queued)
 * - queuedAt: Date - When item was queued
 * - startedAt: Date - When processing started (if processing/completed)
 * - completedAt: Date - When processing completed (if completed)
 * - result: object - Verification result (if completed)
 * - error: string - Error message (if failed)
 */
app.get('/api/identity/queue/status/:queueId', requireAuth, async (req, res) => {
  try {
    const { queueId } = req.params;
    
    const status = getQueueStatus(queueId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Queue item not found',
        message: `No queue item found with ID: ${queueId}`
      });
    }
    
    res.status(200).json(status);
    
  } catch (error) {
    console.error('❌ Error getting queue status:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/queue/user
 * Get all queue items for the current user
 * 
 * Response:
 * - items: Array of queue items
 */
app.get('/api/identity/queue/user', requireAuth, async (req, res) => {
  try {
    const items = getUserQueueItems(req.user.uid);
    
    res.status(200).json({
      items,
      total: items.length
    });
    
  } catch (error) {
    console.error('❌ Error getting user queue items:', error);
    res.status(500).json({
      error: 'Failed to get queue items',
      message: error.message
    });
  }
});

/**
 * GET /api/identity/queue/stats
 * Get queue statistics (Admin only)
 * 
 * Response:
 * - queueSize: number - Current queue size
 * - activeJobs: number - Number of active jobs
 * - maxConcurrent: number - Maximum concurrent jobs
 * - maxQueueSize: number - Maximum queue size
 * - isProcessing: boolean - Whether queue is being processed
 * - utilizationPercent: number - Queue utilization percentage
 */
app.get('/api/identity/queue/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = getQueueStats();
    
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('❌ Error getting queue stats:', error);
    res.status(500).json({
      error: 'Failed to get queue stats',
      message: error.message
    });
  }
});

// ============= END IDENTITY COLLECTION SYSTEM API =============
};
