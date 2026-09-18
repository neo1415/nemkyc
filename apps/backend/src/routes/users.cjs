'use strict';

/**
 * User management: list/create/enable/disable users, role and claim-access updates, password reset
 * and change. Extracted verbatim from server.js; helpers used only here travel with it.
 */

module.exports = function register(app, ctx) {
  const {
    admin,
    body,
    buildUserRoleClaimAccessUpdate,
    db,
    generatePasswordResetEmail,
    generateSecurePassword,
    generateWelcomeEmail,
    getLocationFromIP,
    getUserDetailsForLogging,
    handleValidationErrors,
    isSuperAdmin,
    logAction,
    logAuditSecurityEvent,
    normalizeRole,
    param,
    requireAuth,
    requireSuperAdmin,
    sendEmailWithRetry,
    userCreationRateLimit,
    validatePasswordComplexity,
    validationResult,
  } = ctx;

/**
 * Validation chains for user role update
 */
const validateRoleUpdate = [
  param('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isString().withMessage('User ID must be a string'),
  
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['default', 'user', 'broker', 'claims', 'compliance', 'admin', 'super admin'])
    .withMessage('Invalid role value'),
  
  handleValidationErrors
];

function buildClaimAccessRoleFields(role, claimAccessAll = false, assignedClaimCollections = []) {
  const result = buildUserRoleClaimAccessUpdate(role, { claimAccessAll, assignedClaimCollections });
  if (!result.valid) {
    return result;
  }

  if (result.clearClaimAccess) {
    return {
      valid: true,
      fields: {
        assignedClaimCollections: admin.firestore.FieldValue.delete(),
        claimAccessAll: admin.firestore.FieldValue.delete()
      }
    };
  }

  return {
    valid: true,
    fields: {
      assignedClaimCollections: result.assignedClaimCollections,
      claimAccessAll: result.claimAccessAll
    }
  };
}


app.get('/api/users', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    // Verify session cookie
    const authUid = req.user.uid;

    // Get authenticated user's role
    const userDoc = await db.collection('userroles').doc(authUid).get();
    if (!userDoc.exists || !isSuperAdmin(userDoc.data().role)) {
      console.log('❌ Access denied - User role:', userDoc.exists ? userDoc.data().role : 'no doc', 'Normalized:', userDoc.exists ? normalizeRole(userDoc.data().role) : 'N/A');
      return res.status(403).json({ error: 'Forbidden: Super admin access required' });
    }
    console.log('✅ Super admin verified - Role:', userDoc.data().role, 'Normalized:', normalizeRole(userDoc.data().role));

    // Fetch all users from userroles collection
    const usersSnapshot = await db.collection('userroles').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 📝 LOG USERS FETCH EVENT
    const viewerDetails = await getUserDetailsForLogging(authUid);
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view-users-list',
      actorUid: authUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: 'users',
      targetId: 'all',
      details: {
        userCount: users.length
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        fetchTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ========== NEW: Update User Role (Super Admin Only) ==========
// ✅ PROTECTED: Requires admin or super admin role
// ✅ VALIDATED: Input validation applied
app.put('/api/users/:userId/role', requireAuth, requireSuperAdmin, validateRoleUpdate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, claimAccessAll, assignedClaimCollections } = req.body;
    
    console.log('👤 Role update by:', req.user.email, 'Role:', req.user.role);

    // Get target user details before update
    const targetUserDoc = await db.collection('userroles').doc(userId).get();
    const oldRole = targetUserDoc.exists ? targetUserDoc.data().role : 'unknown';

    const hasClaimAccessPayload = claimAccessAll !== undefined || assignedClaimCollections !== undefined;
    const updatePayload = {
      role,
      dateModified: new Date()
    };

    if (role === 'claims' && hasClaimAccessPayload) {
      const claimAccessResult = buildClaimAccessRoleFields(
        role,
        claimAccessAll ?? false,
        assignedClaimCollections ?? []
      );

      if (!claimAccessResult.valid) {
        return res.status(400).json({ error: claimAccessResult.error || 'Invalid claim access configuration' });
      }

      Object.assign(updatePayload, claimAccessResult.fields);
    } else if (role !== 'claims') {
      const claimAccessResult = buildClaimAccessRoleFields(role, false, []);
      Object.assign(updatePayload, claimAccessResult.fields);
    }

    // Update user role
    await db.collection('userroles').doc(userId).update(updatePayload);

    // 📝 LOG ROLE UPDATE EVENT
    const targetDetails = await getUserDetailsForLogging(userId);
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'update-user-role',
      actorUid: req.user.uid,
      actorDisplayName: req.user.name,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetType: 'user',
      targetId: userId,
      details: {
        from: { role: oldRole },
        to: { role: role },
        targetUserEmail: targetDetails.email,
        targetUserName: targetDetails.displayName
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        updateTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

app.put('/api/users/:userId/claim-access', requireAuth, requireSuperAdmin, [
  param('userId').trim().notEmpty().withMessage('User ID is required'),
  body('claimAccessAll').isBoolean().withMessage('claimAccessAll must be a boolean'),
  body('assignedClaimCollections').optional().isArray().withMessage('assignedClaimCollections must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { userId } = req.params;
    const { claimAccessAll, assignedClaimCollections = [] } = req.body;
    const targetUserDoc = await db.collection('userroles').doc(userId).get();

    if (!targetUserDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetRole = targetUserDoc.data().role;
    if (String(targetRole || '').trim().toLowerCase() !== 'claims') {
      return res.status(400).json({ error: 'Claim access can only be assigned to users with the claims role' });
    }

    const claimAccessResult = buildClaimAccessRoleFields('claims', claimAccessAll, assignedClaimCollections);
    if (!claimAccessResult.valid) {
      return res.status(400).json({ error: claimAccessResult.error || 'Invalid claim access configuration' });
    }

    await db.collection('userroles').doc(userId).update({
      dateModified: new Date(),
      ...claimAccessResult.fields
    });

    res.status(200).json({
      success: true,
      assignedClaimCollections: claimAccessResult.fields.assignedClaimCollections ?? null,
      claimAccessAll: claimAccessResult.fields.claimAccessAll === true
    });
  } catch (error) {
    console.error('Error updating claim access:', error);
    res.status(500).json({ error: 'Failed to update claim access' });
  }
});

// ✅ PROTECTED: Requires admin or super admin role (PATCH alias for PUT)
// ✅ VALIDATED: Input validation applied
app.patch('/api/users/:userId/role', requireAuth, requireSuperAdmin, validateRoleUpdate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, claimAccessAll, assignedClaimCollections } = req.body;
    
    console.log('👤 Role update (PATCH) by:', req.user.email, 'Role:', req.user.role);

    // Get target user details before update
    const targetUserDoc = await db.collection('userroles').doc(userId).get();
    const oldRole = targetUserDoc.exists ? targetUserDoc.data().role : 'unknown';

    const hasClaimAccessPayload = claimAccessAll !== undefined || assignedClaimCollections !== undefined;
    const updatePayload = {
      role,
      dateModified: new Date()
    };

    if (role === 'claims' && hasClaimAccessPayload) {
      const claimAccessResult = buildClaimAccessRoleFields(
        role,
        claimAccessAll ?? false,
        assignedClaimCollections ?? []
      );

      if (!claimAccessResult.valid) {
        return res.status(400).json({ error: claimAccessResult.error || 'Invalid claim access configuration' });
      }

      Object.assign(updatePayload, claimAccessResult.fields);
    } else if (role !== 'claims') {
      const claimAccessResult = buildClaimAccessRoleFields(role, false, []);
      Object.assign(updatePayload, claimAccessResult.fields);
    }

    // Update user role
    await db.collection('userroles').doc(userId).update(updatePayload);

    // 📝 LOG ROLE UPDATE EVENT
    const targetDetails = await getUserDetailsForLogging(userId);
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'update-user-role',
      actorUid: req.user.uid,
      actorDisplayName: req.user.name,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetType: 'user',
      targetId: userId,
      details: {
        from: { role: oldRole },
        to: { role: role },
        targetUserEmail: targetDetails.email,
        targetUserName: targetDetails.displayName
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        updateTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ========== NEW: Delete User (Super Admin Only) ==========
app.delete('/api/users/:userId', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { userName } = req.body;

    // Verify session cookie
    const authUid = req.user.uid;

    // Get authenticated user's role
    const authUserDoc = await db.collection('userroles').doc(authUid).get();
    if (!authUserDoc.exists || !isSuperAdmin(authUserDoc.data().role)) {
      console.log('❌ User deletion denied - User role:', authUserDoc.exists ? authUserDoc.data().role : 'no doc');
      return res.status(403).json({ error: 'Forbidden: Super admin access required' });
    }

    // Prevent self-deletion
    if (authUid === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get target user details before deletion
    const targetDetails = await getUserDetailsForLogging(userId);

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(userId);

    // Delete user from Firestore
    await db.collection('userroles').doc(userId).delete();

    // 📝 LOG USER DELETION EVENT
    const deleterDetails = await getUserDetailsForLogging(authUid);
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'delete-user',
      actorUid: authUid,
      actorDisplayName: deleterDetails.displayName,
      actorEmail: deleterDetails.email,
      actorRole: deleterDetails.role,
      targetType: 'user',
      targetId: userId,
      details: {
        deletedUserEmail: targetDetails.email,
        deletedUserName: userName || targetDetails.displayName,
        deletedUserRole: targetDetails.role
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        deletionTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ========== USER MANAGEMENT ENDPOINTS (Phase 1: Backend Infrastructure) ==========

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
  body('role').trim().isIn(['default', 'broker', 'admin', 'compliance', 'claims', 'super admin']).withMessage('Invalid role'),
  body('claimAccessAll').optional().isBoolean().withMessage('claimAccessAll must be a boolean'),
  body('assignedClaimCollections').optional().isArray().withMessage('assignedClaimCollections must be an array')
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

    const { fullName, email, role, claimAccessAll = false, assignedClaimCollections = [] } = req.body;
    const claimAccessResult = buildUserRoleClaimAccessUpdate(role, { claimAccessAll, assignedClaimCollections });

    if (!claimAccessResult.valid) {
      return res.status(400).json({
        success: false,
        error: claimAccessResult.error || 'Invalid claim access configuration',
        code: 'VALIDATION_ERROR'
      });
    }
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
      const roleDocument = {
        uid: firebaseUser.uid,
        email,
        name: fullName,
        role,
        dateCreated: admin.firestore.FieldValue.serverTimestamp(),
        dateModified: admin.firestore.FieldValue.serverTimestamp()
      };

      if (claimAccessResult.shouldInclude) {
        roleDocument.assignedClaimCollections = claimAccessResult.assignedClaimCollections;
        roleDocument.claimAccessAll = claimAccessResult.claimAccessAll;
      }

      batch.set(roleRef, roleDocument);

      await batch.commit();

      console.log(`✅ Firestore documents created for: ${firebaseUser.uid}`);

      // Step 3: Send welcome email (BLOCKING - must succeed for transaction to complete)
      const loginUrl = `${process.env.APP_URL || 'http://localhost:8080'}/signin`;
      const emailHtml = generateWelcomeEmail({
        fullName,
        email,
        temporaryPassword,
        loginUrl
      });

      // Send email with retry logic - MUST succeed or transaction fails
      const emailResult = await sendEmailWithRetry({
        to: email,
        subject: 'Welcome to NEM Forms - Your Account Has Been Created',
        html: emailHtml,
        userId: firebaseUser.uid
      });

      // If email failed, throw error to trigger rollback
      if (!emailResult.success) {
        throw new Error(`Email delivery failed: ${emailResult.error}`);
      }

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
          role,
          assignedClaimCollections: claimAccessResult.shouldInclude ? claimAccessResult.assignedClaimCollections : null,
          claimAccessAll: claimAccessResult.shouldInclude ? claimAccessResult.claimAccessAll : false
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

    // Check if error is email-related
    let errorMessage;
    let statusCode = 500;
    
    if (error.message && error.message.includes('Email delivery failed')) {
      errorMessage = 'Failed to send welcome email. User account was not created. Please check email configuration or try again later.';
      statusCode = 503; // Service Unavailable
    } else if (error.code === 'auth/email-already-exists') {
      errorMessage = errorMessages[error.code];
      statusCode = 409;
    } else {
      errorMessage = errorMessages[error.code] || 'An unexpected error occurred. Please try again or contact support';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code || 'INTERNAL_SERVER_ERROR'
    });
  }
});

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

    // Get user documents (Firestore 'in' limit is 10, so we need to batch)
    const batchSize = 10;
    const userBatches = [];
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batchIds = userIds.slice(i, i + batchSize);
      const batchSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', batchIds)
        .get();
      userBatches.push(...batchSnapshot.docs);
    }

    // Combine user and role data
    let users = [];
    for (const userDoc of userBatches) {
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

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password',
        code: 'PASSWORD_SAME_AS_CURRENT'
      });
    }

    // Note: We cannot verify the current password on the server side with Firebase Admin SDK
    // The client should handle this verification before calling this endpoint
    // For now, we'll trust that the client has verified the current password

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
      'super admin': '/admin',
      'admin': '/admin',
      'compliance': '/admin',
      'claims': '/admin',
      'broker': '/dashboard',
      'default': '/dashboard'
    };

    const redirectUrl = roleRedirects[req.user.role] || '/dashboard';

    res.json({
      success: true,
      redirectUrl
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
};
