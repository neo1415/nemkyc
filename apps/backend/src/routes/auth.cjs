'use strict';

/**
 * Authentication: login, logout, Firebase ID-token exchange and MFA status. Extracted verbatim from
 * server.js. Session minting/lookup lives in src/lib/sessions.cjs and arrives through ctx.
 */

module.exports = function register(app, ctx) {
  const {
    admin,
    axios,
    createSession,
    db,
    destroySession,
    getLocationFromIP,
    invalidateSessionCache,
    isAdminOrCompliance,
    logAction,
    logger,
    normalizeRole,
    requireAuth,
    resolveAssignedClaimCollections,
  } = ctx;

// ============= AUTHENTICATION BACKEND ENDPOINTS =============

// Login endpoint with event logging
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate credentials using Firebase Admin SDK
    try {
      // Check if user exists
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // ✅ SECURE: Use Firebase Auth REST API for password validation
      // This is the recommended approach for server-side password validation
      const apiKey = process.env.REACT_APP_FIREBASE_KEY || process.env.VITE_FIREBASE_API_KEY;
      
      if (!apiKey) {
        console.error('❌ Firebase API key not configured');
        return res.status(500).json({ 
          error: 'Server configuration error',
          message: 'Authentication service is not properly configured. Please contact support.'
        });
      }
      
      // Use Firebase Auth REST API to verify password
      const authResponse = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          email: email,
          password: password,
          returnSecureToken: true
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      
      // If we get here, credentials are valid
      if (!authResponse.data || !authResponse.data.idToken) {
        throw new Error('Invalid authentication response');
      }
      
    } catch (authError) {
      // Password validation failed or user doesn't exist
      const errorCode = authError.response?.data?.error?.message || authError.code || 'UNKNOWN_ERROR';
      console.error('Authentication failed:', errorCode);
      
      // Log failed attempt
      const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
      await logAction({
        action: 'failed-login',
        actorUid: null,
        actorDisplayName: null,
        actorEmail: email,
        actorRole: null,
        targetType: 'user',
        targetId: email,
        details: {
          loginMethod: 'email-password',
          success: false,
          error: errorCode,
          errorMessage: authError.message
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: {
          attemptTimestamp: new Date().toISOString()
        }
      });
      
      // User-friendly error messages
      let userMessage = 'Invalid email or password. Please check your credentials and try again.';
      if (errorCode === 'EMAIL_NOT_FOUND') {
        userMessage = 'No account found with this email address.';
      } else if (errorCode === 'INVALID_PASSWORD') {
        userMessage = 'Incorrect password. Please try again.';
      } else if (errorCode === 'USER_DISABLED') {
        userMessage = 'This account has been disabled. Please contact support.';
      } else if (errorCode === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        userMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: userMessage
      });
    }

    // Now get user record after successful authentication
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Check if user exists in userroles collection
    const userDoc = await db.collection('userroles').doc(userRecord.uid).get();
    const userRole = userDoc.exists ? userDoc.data().role : 'user';
    
    // Create custom token for the user
    const customToken = await admin.auth().createCustomToken(userRecord.uid, {
      role: userRole,
      email: email
    });

    // 📝 LOG SUCCESSFUL LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'login',
      actorUid: userRecord.uid,
      actorDisplayName: userRecord.displayName || email.split('@')[0],
      actorEmail: email,
      actorRole: userRole,
      targetType: 'user',
      targetId: userRecord.uid,
      details: {
        loginMethod: 'email-password',
        success: true
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        loginTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ 
      success: true,
      customToken, 
      role: userRole,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // 📝 LOG FAILED LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'failed-login',
      actorUid: null,
      actorDisplayName: null,
      actorEmail: req.body.email,
      actorRole: null,
      targetType: 'user',
      targetId: req.body.email,
      details: {
        loginMethod: 'email-password',
        success: false,
        error: error.message
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        attemptTimestamp: new Date().toISOString()
      }
    });
    
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
});

// Token exchange endpoint with MFA checking - frontend does Firebase auth, backend verifies token and returns user info
app.post('/api/logout', async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  };
  const candidates = [req.cookies?.__session];
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    candidates.push(authHeader.substring(7));
  }
  for (const candidate of candidates) {
    if (candidate) {
      invalidateSessionCache(candidate);
      await destroySession(candidate);
    }
  }
  res.clearCookie('__session', cookieOptions);
  res.json({ success: true });
});

app.post('/api/exchange-token', async (req, res) => {
  // Skip general logging - this endpoint has its own detailed logging
  req.skipGeneralLogging = true;
  
  try {
    console.log('�🚀� SERVNDER VERSION: MFA-MANDATORY-v2.0 - DEPLOYED 🚀�🚀');
    console.log('🔄 Token exchange request received from origin:', req.headers.origin);
    console.log('🔄 Request headers:', {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'x-timestamp': req.headers['x-timestamp']
    });

    const { idToken } = req.body;
    
    if (!idToken) {
      console.error('❌ Token exchange failed: ID token is required');
      return res.status(400).json({ error: 'ID token is required' });
    }

    console.log('🔍 Verifying Firebase ID token...');
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;
    const uid = decodedToken.uid;
    
    console.log('✅ Token verified successfully for user:', email);
    
    // Get user from Firestore userroles collection
    let userDoc = await db.collection('userroles').doc(uid).get();
    let userData;
    
    if (!userDoc.exists) {
      console.log('⚠️ User not found in userroles collection, checking users collection...');
      
      // Fallback: Check 'users' collection for role
      const usersDoc = await db.collection('users').doc(uid).get();
      
      if (usersDoc.exists) {
        const usersData = usersDoc.data();
        console.log('🔍 Found user in users collection with role:', usersData.role);
        
        // Create userroles document from users data
        const normalizedRole = normalizeRole(usersData.role || 'default');
        userData = {
          name: usersData.name || usersData.displayName || email.split('@')[0],
          email: email,
          role: normalizedRole,
          phone: usersData.phone || null,
          dateCreated: new Date(),
          dateModified: new Date(),
          lastActivity: Date.now()
        };
        
        await db.collection('userroles').doc(uid).set(userData);
        console.log('✅ Created userroles document with role:', normalizedRole);
      } else {
        console.error('❌ User not found in userroles or users collection:', uid);
        return res.status(401).json({ error: 'User not found. Please contact administrator.' });
      }
    } else {
      userData = userDoc.data();
    }
    
    // ============================================================================
    // MFA DISABLED - Simple login tracking only
    // ============================================================================
    
    // Get or create login metadata document
    const loginMetaRef = db.collection('loginMetadata').doc(uid);
    const loginMetaDoc = await loginMetaRef.get();
    
    let loginCount = 1;
    
    if (loginMetaDoc.exists) {
      const metaData = loginMetaDoc.data();
      loginCount = (metaData.loginCount || 0) + 1;
    }
    
    // Update login count only (no MFA fields)
    await loginMetaRef.set({
      loginCount: loginCount,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      email: email,
      role: userData.role
    }, { merge: true });
    
    // ✅ CRITICAL: Update lastActivity in userroles to prevent immediate session expiration
    await db.collection('userroles').doc(uid).update({
      lastActivity: Date.now()
    }).catch(err => logger.error('Failed to update lastActivity on login:', err));
    
    console.log('✅ Login #' + loginCount + ' for user:', email);
    
    // Log successful login (token exchange)
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'login', // Changed from 'login-success' for consistency
      actorUid: uid,
      actorDisplayName: userData.name || email.split('@')[0],
      actorEmail: email,
      actorPhone: userData.phone || null,
      actorRole: userData.role,
      targetType: 'user',
      targetId: uid,
      details: { 
        loginMethod: 'token-exchange',
        loginCount: loginCount,
        success: true
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: { loginTimestamp: new Date().toISOString() }
    });
    
    console.log('✅ Login successful (MFA disabled)\n');

    // Set httpOnly session cookie with user UID for subsequent authenticated requests
    // Note: For localhost cross-port (8080 -> 3001), we use 'lax' which works for same-site different ports
    const sessionId = await createSession(uid, req);
    res.cookie('__session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure only in production (HTTPS required)
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-origin in production
      maxAge: 2 * 60 * 60 * 1000, // 2 hours (reduced from 24 hours for better security)
      path: '/',
      // Don't set domain for localhost - let browser handle it
    });

    console.log('🍪 Session cookie set for UID:', uid);
    console.log('🔧 Cookie config:', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: '2 hours',
      path: '/'
    });

    const assignedClaimCollections = resolveAssignedClaimCollections({
      email,
      role: userData.role,
      assignedClaimCollections: userData.assignedClaimCollections,
      claimAccessAll: userData.claimAccessAll
    });

    res.json({
      success: true,
      role: userData.role,
      user: { uid, email, displayName: userData.name },
      loginCount: loginCount,
      sessionToken: sessionId, // Opaque session id; used as a Bearer fallback where cookies are blocked
      assignedClaimCollections,
      claimAccessAll: userData.claimAccessAll === true
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});


// MFA enrollment check endpoint
app.get('/api/auth/mfa-status/:uid', requireAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    if (req.user.uid !== uid && !isAdminOrCompliance(req.user.role)) {
      return res.status(403).json({ error: 'You may only view your own MFA status' });
    }

    // Get user's MFA enrollment status
    const userRecord = await admin.auth().getUser(uid);
    const enrolledFactors = userRecord.multiFactor?.enrolledFactors || [];
    
    res.json({
      success: true,
      mfaEnrolled: enrolledFactors.length > 0,
      enrolledFactors: enrolledFactors.map(factor => ({
        uid: factor.uid,
        factorId: factor.factorId,
        displayName: factor.displayName,
        enrollmentTime: factor.enrollmentTime
      }))
    });

  } catch (error) {
    console.error('MFA status check error:', error);
    res.status(500).json({ error: 'Failed to check MFA status' });
  }
});
};

/**
 * POST /api/register. Registered from a later point in server.js than the routes above (after the
 * verification proxies) because Express registration order is behaviour and is checked against
 * scripts/route-table.baseline.jsonl; moving it would change the route table.
 */
module.exports.signup = function signup(app, ctx) {
  const {
    admin,
    body,
    db,
    getLocationFromIP,
    handleValidationErrors,
    logAction,
  } = ctx;

/**
 * Validation chains for user registration
 */
const validateUserRegistration = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'),
  
  body('displayName')
    .trim()
    .notEmpty().withMessage('Display name is required')
    .isString().withMessage('Display name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Display name must be 2-100 characters'),
  
  body('role')
    .optional()
    .trim()
    .isIn(['default', 'user', 'broker', 'claims', 'compliance', 'admin', 'super admin'])
    .withMessage('Invalid role'),
  
  body('dateOfBirth')
    .optional()
    .trim()
    .isISO8601().withMessage('Invalid date format (use YYYY-MM-DD)'),
  
  handleValidationErrors
];


// Register endpoint with event logging
// ✅ VALIDATED: Input validation applied
app.post('/api/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, displayName, role = 'user', dateOfBirth, userType } = req.body;

    // Determine the actual role based on userType
    // If userType is 'broker', set role to 'broker'
    // If userType is 'regular' or undefined/empty, set role to 'default'
    let actualRole = 'default'; // Default role for regular users
    if (userType === 'broker') {
      actualRole = 'broker';
    } else if (userType === 'regular' || !userType) {
      actualRole = 'default';
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });

    // Set role in userroles collection with date of birth
    const userRoleData = {
      email: email,
      role: actualRole, // Use the determined role
      displayName: displayName,
      name: displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add date of birth if provided
    if (dateOfBirth) {
      userRoleData.dateOfBirth = dateOfBirth;
    }
    
    await db.collection('userroles').doc(userRecord.uid).set(userRoleData);

    // Initialize login metadata
    await db.collection('loginMetadata').doc(userRecord.uid).set({
      loginCount: 0,
      email: email,
      role: actualRole, // Use the determined role
      lastLoginAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 📝 LOG THE REGISTRATION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'register',
      actorUid: userRecord.uid,
      actorDisplayName: displayName,
      actorEmail: email,
      actorRole: actualRole, // Use the determined role
      targetType: 'user',
      targetId: userRecord.uid,
      details: {
        registrationMethod: 'email-password',
        assignedRole: actualRole, // Use the determined role
        userType: userType || 'regular' // Log the userType for audit
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        registrationTimestamp: new Date().toISOString()
      }
    });

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});
};
