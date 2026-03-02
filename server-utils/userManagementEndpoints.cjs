/**
 * User Management API Endpoints
 * 
 * This file contains all user management endpoints for super admin operations.
 * These endpoints should be added to server.js after the existing user role endpoints.
 * 
 * Endpoints:
 * - POST /api/users/create - Create new user account
 * - GET /api/users/list - List all users with filtering and pagination
 * - PUT /api/users/:userId/role - Update user role (already exists, kept for reference)
 * - PUT /api/users/:userId/status - Enable/disable user account
 * - POST /api/users/:userId/reset-password - Reset user password
 * - POST /api/users/change-password - Change own password
 * 
 * Copy the code below and insert it into server.js after line 3250 (after existing user role endpoints)
 */

// ========== IMPORTS NEEDED (add to top of server.js if not already present) ==========
/*
const { generateSecurePassword, validatePasswordComplexity } = require('./server-utils/passwordGenerator.cjs');
const { generateWelcomeEmail, generatePasswordResetEmail } = require('./server-utils/emailTemplates.cjs');
const { userCreationRateLimit } = require('./server-utils/rateLimiter.cjs');
*/

// ========== USER MANAGEMENT ENDPOINTS ==========

// ========== Task 4: Create User Endpoint ==========
/**
 * Create new user account
 * 
 * @route POST /api/users/create
 * @access Super Admin only
 * @rateLimit 10 creations per hour per super admin
 * 
 * Requirements: 1, 2, 3, 4, 5, 6, 7, 21, 23, 26, 27, 28
 */
app.post('/api/users/create', requireAuth, requireSuperAdmin, userCreationRateLimit, [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Invalid email format'),
  body('role').trim().isIn(['default', 'broker', 'admin', 'compliance', 'claims', 'super admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        code: 'VALIDATION_ERROR'
      });
    }

    const { fullName, email, role } = req.body;
    const superAdminId = req.user.uid;
    const superAdminEmail = req.user.email;

    console.log(`👤 User creation initiated by: ${superAdminEmail} (${superAdminId})`);
    console.log(`📝 Creating user: ${fullName} <${email}> with role: ${role}`);

    // Generate secure temporary password
    const temporaryPassword = generateSecurePassword();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    let firebaseUser = null;

    try {
      // Step 1: Create Firebase Authentication account
      firebaseUser = await admin.auth().createUser({
        email,
        password: temporaryPassword,
        displayName: fullName,
        emailVerified: false
      });

      console.log(`✅ Firebase Auth account created: ${firebaseUser.uid}`);

      // Step 2: Create Firestore documents atomically
      const batch = db.batch();

      // Create user document
      const userRef = db.collection('users').doc(firebaseUser.uid);
      batch.set(userRef, {
        uid: firebaseUser.uid,
        email,
        name: fullName,
        mustChangePassword: true,
        passwordChangedAt: null,
        temporaryPasswordExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        createdBy: superAdminId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        disabled: false
      });

      // Create role document
      const roleRef = db.collection('userroles').doc(firebaseUser.uid);
      batch.set(roleRef, {
        uid: firebaseUser.uid,
        email,
        name: fullName,
        role,
        dateCreated: admin.firestore.FieldValue.serverTimestamp(),
        dateModified: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();

      console.log(`✅ Firestore documents created for: ${firebaseUser.uid}`);

      // Step 3: Send welcome email (non-blocking)
      const loginUrl = `${process.env.APP_URL || 'http://localhost:5173'}/auth/signin`;
      const emailHtml = generateWelcomeEmail({
        fullName,
        email,
        temporaryPassword,
        loginUrl
      });

      // Send email with retry logic
      sendEmailWithRetry({
        to: email,
        subject: 'Welcome to NEM Forms - Your Account Has Been Created',
        html: emailHtml,
        userId: firebaseUser.uid
      }).catch(error => {
        console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
      });

      // Step 4: Log audit event
      await logAuditSecurityEvent({
        eventType: 'USER_CREATED',
        severity: 'info',
        description: `User account created: ${email}`,
        userId: firebaseUser.uid,
        ipAddress: req.ip || req.connection?.remoteAddress,
        metadata: {
          performedBy: superAdminId,
          performedByEmail: superAdminEmail,
          newUserEmail: email,
          newUserName: fullName,
          assignedRole: role,
          temporaryPasswordExpires: expiresAt.toISOString()
        }
      });

      console.log(`✅ User creation complete: ${email}`);

      res.status(200).json({
        success: true,
        user: {
          uid: firebaseUser.uid,
          email,
          role
        }
      });

    } catch (error) {
      // Rollback: Delete Firebase Auth account if Firestore operations failed
      if (firebaseUser) {
        try {
          await admin.auth().deleteUser(firebaseUser.uid);
          console.log(`✅ Rolled back Firebase Auth account for ${email}`);

          await logAuditSecurityEvent({
            eventType: 'USER_CREATION_ROLLBACK',
            severity: 'warning',
            description: 'Rolled back Firebase Auth account due to Firestore failure',
            userId: firebaseUser.uid,
            metadata: {
              email,
              error: error.message
            }
          });
        } catch (rollbackError) {
          console.error(`❌ Failed to rollback Firebase Auth account:`, rollbackError);

          await logAuditSecurityEvent({
            eventType: 'ROLLBACK_FAILED',
            severity: 'critical',
            description: 'Failed to rollback Firebase Auth account - manual cleanup required',
            userId: firebaseUser.uid,
            metadata: {
              email,
              originalError: error.message,
              rollbackError: rollbackError.message
            }
          });
        }
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ User creation error:', error);

    // Log failure
    await logAuditSecurityEvent({
      eventType: 'USER_CREATION_FAILED',
      severity: 'warning',
      description: `Failed to create user: ${error.message}`,
      userId: req.user.uid,
      metadata: {
        attemptedEmail: req.body.email,
        error: error.message,
        errorCode: error.code
      }
    });

    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      'auth/email-already-exists': 'A user with this email already exists',
      'auth/invalid-email': 'The email address is invalid',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support',
      'auth/weak-password': 'Password is too weak. Please use a stronger password'
    };

    const statusCode = error.code === 'auth/email-already-exists' ? 409 : 500;
    const errorMessage = errorMessages[error.code] || 'An unexpected error occurred. Please try again or contact support';

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code || 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * Helper function to send email with retry logic
 */
async function sendEmailWithRetry(emailData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use existing email sending infrastructure
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@nemforms.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      });

      console.log(`✅ Email sent successfully to ${emailData.to}`);
      return { success: true };
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`❌ Failed to send email after ${maxRetries} attempts:`, error.message);

        await logAuditSecurityEvent({
          eventType: 'EMAIL_DELIVERY_FAILED',
          severity: 'high',
          description: `Failed to send email after ${maxRetries} attempts`,
          userId: emailData.userId,
          metadata: {
            to: emailData.to,
            error: error.message,
            attempts: maxRetries
          }
        });

        return { success: false, error: error.message };
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`⏳ Retrying email send (attempt ${attempt + 1}/${maxRetries})...`);
    }
  }
}

// ========== Task 5: List Users Endpoint ==========
/**
 * List all users with filtering and pagination
 * 
 * @route GET /api/users/list
 * @access Super Admin only
 * 
 * Query Parameters:
 * - role: Filter by role (optional)
 * - search: Search by name or email (optional)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50)
 * 
 * Requirements: 14, 15, 16
 */
app.get('/api/users/list', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { role, search, page = 1, pageSize = 50 } = req.query;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    console.log(`📋 Listing users - Role: ${role || 'all'}, Search: ${search || 'none'}, Page: ${pageNum}`);

    // Build query
    let usersQuery = db.collection('users');
    let rolesQuery = db.collection('userroles');

    // Apply role filter
    if (role && role !== 'all') {
      rolesQuery = rolesQuery.where('role', '==', role);
    }

    // Get role documents first (for filtering)
    const rolesSnapshot = await rolesQuery.get();
    const userIds = rolesSnapshot.docs.map(doc => doc.id);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        users: [],
        pagination: {
          currentPage: pageNum,
          pageSize: pageSizeNum,
          totalPages: 0,
          totalUsers: 0
        }
      });
    }

    // Get user documents
    const usersSnapshot = await db.collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', userIds.slice(0, 10)) // Firestore 'in' limit is 10
      .get();

    // Combine user and role data
    let users = [];
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const roleDoc = await db.collection('userroles').doc(userDoc.id).get();
      const roleData = roleDoc.exists ? roleDoc.data() : {};

      // Get Firebase Auth status
      let authStatus = 'Active';
      try {
        const authUser = await admin.auth().getUser(userDoc.id);
        authStatus = authUser.disabled ? 'Disabled' : 'Active';
      } catch (error) {
        authStatus = 'Unknown';
      }

      // Get creator name
      let creatorName = 'Unknown';
      if (userData.createdBy) {
        try {
          const creatorDoc = await db.collection('users').doc(userData.createdBy).get();
          if (creatorDoc.exists) {
            creatorName = creatorDoc.data().name || 'Unknown';
          }
        } catch (error) {
          console.error(`Failed to get creator name for ${userData.createdBy}:`, error.message);
        }
      }

      users.push({
        uid: userDoc.id,
        name: userData.name,
        email: userData.email,
        role: roleData.role || 'default',
        status: authStatus,
        createdAt: userData.createdAt?.toDate().toISOString(),
        createdBy: creatorName,
        mustChangePassword: userData.mustChangePassword || false
      });
    }

    // Apply search filter (client-side for now)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / pageSizeNum);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      success: true,
      users: paginatedUsers,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalPages,
        totalUsers
      }
    });

  } catch (error) {
    console.error('❌ Error listing users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list users',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// ========== Task 7: Toggle User Status Endpoint ==========
/**
 * Enable or disable user account
 * 
 * @route PUT /api/users/:userId/status
 * @access Super Admin only
 * 
 * Requirements: 18
 */
app.put('/api/users/:userId/status', requireAuth, requireSuperAdmin, [
  param('userId').trim().notEmpty().withMessage('User ID is required'),
  body('disabled').isBoolean().withMessage('Disabled must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        code: 'VALIDATION_ERROR'
      });
    }

    const { userId } = req.params;
    const { disabled } = req.body;
    const superAdminId = req.user.uid;

    console.log(`🔒 ${disabled ? 'Disabling' : 'Enabling'} user account: ${userId}`);

    // Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = userDoc.data();

    // Update Firebase Auth account status
    await admin.auth().updateUser(userId, { disabled });

    console.log(`✅ User account ${disabled ? 'disabled' : 'enabled'}: ${userId}`);

    // Log audit event
    await logAuditSecurityEvent({
      eventType: 'ACCOUNT_STATUS_CHANGED',
      severity: 'info',
      description: `User account ${disabled ? 'disabled' : 'enabled'}: ${userData.email}`,
      userId,
      metadata: {
        performedBy: superAdminId,
        action: disabled ? 'disable' : 'enable',
        userEmail: userData.email
      }
    });

    res.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Error toggling user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// ========== Task 8: Reset User Password Endpoint ==========
/**
 * Reset user password (super admin initiated)
 * 
 * @route POST /api/users/:userId/reset-password
 * @access Super Admin only
 * 
 * Requirements: 19, 22
 */
app.post('/api/users/:userId/reset-password', requireAuth, requireSuperAdmin, [
  param('userId').trim().notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        code: 'VALIDATION_ERROR'
      });
    }

    const { userId } = req.params;
    const superAdminId = req.user.uid;
    const superAdminName = req.user.name;

    console.log(`🔑 Password reset initiated by: ${req.user.email} for user: ${userId}`);

    // Get user details
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = userDoc.data();

    // Generate new temporary password
    const temporaryPassword = generateSecurePassword();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update Firebase Auth password
    await admin.auth().updateUser(userId, {
      password: temporaryPassword
    });

    // Update Firestore user document
    await db.collection('users').doc(userId).update({
      mustChangePassword: true,
      temporaryPasswordExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Password reset for user: ${userId}`);

    // Send password reset email
    const loginUrl = `${process.env.APP_URL || 'http://localhost:5173'}/auth/signin`;
    const emailHtml = generatePasswordResetEmail({
      fullName: userData.name,
      email: userData.email,
      temporaryPassword,
      loginUrl,
      resetBy: superAdminName
    });

    sendEmailWithRetry({
      to: userData.email,
      subject: 'Password Reset - NEM Forms',
      html: emailHtml,
      userId
    }).catch(error => {
      console.error(`❌ Failed to send password reset email to ${userData.email}:`, error.message);
    });

    // Log audit event
    await logAuditSecurityEvent({
      eventType: 'PASSWORD_RESET_BY_ADMIN',
      severity: 'info',
      description: `Password reset by admin for user: ${userData.email}`,
      userId,
      metadata: {
        performedBy: superAdminId,
        performedByEmail: req.user.email,
        targetUserEmail: userData.email,
        temporaryPasswordExpires: expiresAt.toISOString()
      }
    });

    res.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// ========== Task 9: Change Password Endpoint ==========
/**
 * Change own password (user initiated)
 * 
 * @route POST /api/users/change-password
 * @access Authenticated users
 * 
 * Requirements: 11, 12, 22, 25
 */
app.post('/api/users/change-password', requireAuth, [
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),
  body('newPassword').trim().notEmpty().withMessage('New password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        code: 'VALIDATION_ERROR'
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    console.log(`🔑 Password change requested by: ${userEmail}`);

    // Validate new password complexity
    const validation = validatePasswordComplexity(newPassword);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'New password does not meet requirements',
        code: 'WEAK_PASSWORD',
        details: validation.errors
      });
    }

    // Verify current password by attempting to sign in
    try {
      await admin.auth().signInWithEmailAndPassword(userEmail, currentPassword);
    } catch (error) {
      console.log(`❌ Current password verification failed for ${userEmail}`);

      await logAuditSecurityEvent({
        eventType: 'PASSWORD_CHANGE_FAILED',
        severity: 'warning',
        description: 'Password change failed: incorrect current password',
        userId,
        metadata: {
          reason: 'incorrect_current_password'
        }
      });

      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        code: 'AUTH_INVALID_PASSWORD'
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password',
        code: 'PASSWORD_SAME_AS_CURRENT'
      });
    }

    // Update password in Firebase Auth
    await admin.auth().updateUser(userId, {
      password: newPassword
    });

    // Update Firestore user document
    await db.collection('users').doc(userId).update({
      mustChangePassword: false,
      passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Password changed successfully for: ${userEmail}`);

    // Log audit event
    await logAuditSecurityEvent({
      eventType: 'PASSWORD_CHANGED',
      severity: 'info',
      description: `Password changed by user: ${userEmail}`,
      userId,
      metadata: {
        isFirstTimeChange: req.user.mustChangePassword || false
      }
    });

    // Determine redirect URL based on role
    const roleRedirects = {
      'super admin': '/admin/dashboard',
      'admin': '/admin/dashboard',
      'compliance': '/admin/dashboard',
      'claims': '/admin/dashboard',
      'broker': '/admin/identity', // Brokers go to identity page (not /dashboard)
      'default': '/dashboard'
    };

    const redirectUrl = roleRedirects[req.user.role] || '/dashboard';

    res.json({
      success: true,
      redirectUrl,
      role: req.user.role // Include role so frontend can handle state
    });

  } catch (error) {
    console.error('❌ Error changing password:', error);

    await logAuditSecurityEvent({
      eventType: 'PASSWORD_CHANGE_FAILED',
      severity: 'error',
      description: `Password change failed: ${error.message}`,
      userId: req.user.uid,
      metadata: {
        error: error.message
      }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// ========== END USER MANAGEMENT ENDPOINTS ==========

module.exports = {
  // Export functions if needed for testing
  sendEmailWithRetry
};
