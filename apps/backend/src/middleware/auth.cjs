'use strict';

/**
 * Authentication and authorization middleware, role helpers and the short-lived session cache,
 * moved verbatim from server.js. Returned functions keep their names (the route table and the
 * security policy tests identify handlers by name). `sessions` is the store from src/lib/sessions.cjs.
 */
function createAuthMiddleware({ db, admin, logger, logAuditSecurityEvent, logSecurityEvent, sessions }) {
  const { resolveSessionUid } = sessions;

// ========================================
// SESSION CACHE (to reduce Firestore reads)
// ========================================
const sessionCache = new Map();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Get user session from cache or Firestore
 * @param {string} sessionToken - The session token
 * @param {object} db - Firestore database instance
 * @returns {Promise<object|null>} User data or null if not found
 */
/**
 * Resolves a session id to the user's profile (cached briefly). Returns null for unknown,
 * malformed or expired sessions. The returned object always carries `uid`.
 */
async function getCachedSession(sessionToken, db) {
  const now = Date.now();
  const cached = sessionCache.get(sessionToken);
  if (cached && (now - cached.timestamp) < SESSION_CACHE_TTL) {
    return cached.data;
  }
  const uid = await resolveSessionUid(sessionToken);
  if (!uid) {
    sessionCache.delete(sessionToken);
    return null;
  }
  const userDoc = await db.collection('userroles').doc(uid).get();
  if (!userDoc.exists) {
    sessionCache.delete(sessionToken);
    return null;
  }
  const userData = { ...userDoc.data(), uid };
  sessionCache.set(sessionToken, { data: userData, timestamp: now });
  return userData;
}

/**
 * Invalidate session cache for a specific token
 * @param {string} sessionToken - The session token to invalidate
 */
function invalidateSessionCache(sessionToken) {
  sessionCache.delete(sessionToken);
}

/**
 * Clear expired cache entries (run periodically)
 */
function cleanupSessionCache() {
  const now = Date.now();
  for (const [token, cached] of sessionCache.entries()) {
    if ((now - cached.timestamp) >= SESSION_CACHE_TTL) {
      sessionCache.delete(token);
    }
  }
}

// Run cache cleanup every 10 minutes
setInterval(cleanupSessionCache, 10 * 60 * 1000).unref();

// ============= ROLE NORMALIZATION HELPER =============
/**
 * Normalize role strings to standard format for consistent comparison
 * Maps common role variants to canonical values
 */
const normalizeRole = (role) => {
  if (!role) return 'default';
  
  const roleLower = role.toLowerCase().trim();
  
  // Map super admin variants
  if (['superadmin', 'super-admin', 'super_admin', 'super admin'].includes(roleLower)) {
    return 'super admin';
  }
  
  // Map user variants
  if (['user', 'regular'].includes(roleLower)) {
    return 'default';
  }
  
  // Return other roles as-is (admin, compliance, claims, default)
  return roleLower;
};

/**
 * Check if a role is super admin (handles variants)
 */
const isSuperAdmin = (role) => {
  return normalizeRole(role) === 'super admin';
};

/**
 * Check if a role is admin or super admin
 */
const isAdminOrSuperAdmin = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'super admin';
};

/**
 * Check if a role is compliance, admin, or super admin
 */
const isAdminOrCompliance = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'compliance' || normalized === 'admin' || normalized === 'super admin';
};

/**
 * Check if a role is claims, compliance, admin, or super admin
 */
const isClaimsOrAdminOrCompliance = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'claims' || normalized === 'compliance' || normalized === 'admin' || normalized === 'super admin';
};

// ============= AUTHENTICATION & AUTHORIZATION MIDDLEWARE =============

/**
 * Middleware to require authentication
 * Verifies session cookie OR Firebase ID token and attaches user data to request
 */
const requireAuth = async (req, res, next) => {
  try {
    // Accept session token from cookie OR Authorization header (for localhost cross-port)
    let sessionToken = req.cookies.__session;
    let isFirebaseIdToken = false;
    
    // A Bearer Firebase ID token always wins over a possibly stale __session cookie.
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
        console.log('🔑 Using token from Authorization header (localhost fallback)');
        
        // Try to verify as Firebase ID token first
        try {
          const decodedToken = await admin.auth().verifyIdToken(sessionToken);
          console.log('✅ Valid Firebase ID token for user:', decodedToken.uid);
          
          // Fetch user data from userroles collection using UID
          const userDoc = await db.collection('userroles').doc(decodedToken.uid).get();
          
          if (!userDoc.exists) {
            console.log('❌ User not found in userroles collection:', decodedToken.uid);
            return res.status(401).json({ 
              error: 'User not found',
              message: 'Your account is not properly configured. Please contact support.'
            });
          }
          
          const userData = userDoc.data();
          
          // Attach user data to request
          req.user = {
            ...userData,
            uid: decodedToken.uid,
            email: decodedToken.email || userData.email,
            role: normalizeRole(userData.role),
            name: userData.name
          };
          
          isFirebaseIdToken = true;
          return next();
        } catch (firebaseError) {
          console.log('⚠️ Not a valid Firebase ID token, trying as session token:', firebaseError.message);
          // Prefer the cookie session if one exists; otherwise fall through with the header value.
          if (req.cookies.__session) {
            sessionToken = req.cookies.__session;
          }
        }
      }
    }
    
    if (!sessionToken) {
      console.log('❌ No session token found in cookie or Authorization header');
      
      // Log unauthenticated access attempt
      try {
        await logAuditSecurityEvent({
          eventType: 'unauthenticated_verification_attempt',
          severity: 'medium',
          description: 'Attempted to access protected endpoint without authentication',
          userId: 'anonymous',
          ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
          metadata: {
            endpoint: req.path,
            method: req.method,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access this resource'
      });
    }

    // If we reach here and it's not a Firebase ID token, try as session token
    if (!isFirebaseIdToken) {
      // Get user data from cache or Firestore
      const userData = await getCachedSession(sessionToken, db);
      
      if (!userData) {
        console.log('❌ Auth failed: Invalid session token');
        
        // Log invalid session attempt
        try {
          await logAuditSecurityEvent({
            eventType: 'unauthenticated_verification_attempt',
            severity: 'medium',
            description: 'Attempted to access protected endpoint with invalid session token',
            userId: 'anonymous',
            ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
            metadata: {
              endpoint: req.path,
              method: req.method,
              userAgent: req.headers['user-agent']
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }
        
        return res.status(401).json({ 
          error: 'Invalid session',
          message: 'Your session has expired. Please sign in again.'
        });
      }
    }
    
    // ✅ SESSION TIMEOUT CHECK (2 hours of inactivity) - only for session tokens
    if (!isFirebaseIdToken) {
      const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours (increased from 30 minutes)
      const ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // Only update lastActivity every 5 minutes
      
      // Get user data from cache or Firestore
      const userData = await getCachedSession(sessionToken, db);
      
      // Check timeout if lastActivity exists
      if (userData.lastActivity) {
        const timeSinceLastActivity = Date.now() - userData.lastActivity;
        
        if (timeSinceLastActivity > SESSION_TIMEOUT) {
          logger.warn(`Session expired due to inactivity: ${userData.email}`);
          // Don't delete the userroles document! Just clear the session cookie
          invalidateSessionCache(sessionToken); // Clear from cache
          res.clearCookie('__session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
          });
          return res.status(401).json({ 
            error: 'Session expired',
            message: 'Your session has expired due to inactivity. Please sign in again.'
          });
        }
        
        // Only update lastActivity if it's been more than 5 minutes since last update
        if (timeSinceLastActivity > ACTIVITY_UPDATE_INTERVAL) {
          // Update in background (don't await to avoid slowing down requests)
          db.collection('userroles').doc(userData.uid).update({
            lastActivity: Date.now()
          }).then(() => {
            // Invalidate cache so next request gets fresh data
            invalidateSessionCache(sessionToken);
          }).catch(err => logger.error('Failed to update lastActivity:', err));
        }
      } else {
        // ✅ MIGRATION: If lastActivity doesn't exist, set it now (for existing sessions)
        logger.info(`Initializing lastActivity for existing session: ${userData.email}`);
        db.collection('userroles').doc(userData.uid).update({
          lastActivity: Date.now()
        }).then(() => {
          invalidateSessionCache(sessionToken);
        }).catch(err => logger.error('Failed to initialize lastActivity:', err));
      }
      
      // Attach user data to request for use in route handlers
      req.user = {
        uid: userData.uid,
        email: userData.email,
        name: userData.name || userData.displayName,
        role: normalizeRole(userData.role),
        rawRole: userData.role // Keep original for logging
      };

      console.log('✅ Auth success:', req.user.email, 'Role:', req.user.role);
    }
    // If Firebase ID token was used, req.user is already set above
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred while verifying your session'
    });
  }
};

/**
 * Middleware to require specific roles
 * Must be used after requireAuth
 * Usage: requireRole('admin', 'super admin')
 */
/**
 * Customer forms may be submitted without an account. When the request carries a `guest`
 * identity and no credentials, the handler provisions the account itself; any request that
 * does carry credentials goes through the normal requireAuth path so a stale cookie or token
 * is never silently downgraded to a guest.
 */
const requireAuthOrGuest = (req, res, next) => {
  const hasCredentials = Boolean(req.cookies?.__session) || Boolean(req.headers.authorization);
  const guest = req.body?.guest;
  if (!hasCredentials && guest && typeof guest === 'object') {
    req.user = null;
    return next();
  }
  return requireAuth(req, res, next);
};

const requireRole = (...allowedRoles) => {
  const middleware = (req, res, next) => {
    if (!req.user) {
      console.log('❌ Role check failed: No user in request (requireAuth not called?)');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access this resource'
      });
    }

    // Normalize all allowed roles for comparison
    const normalizedAllowedRoles = allowedRoles.map(r => normalizeRole(r));
    const userRole = req.user.role; // Already normalized in requireAuth

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log('❌ Authorization failed:', req.user.email, 'has role', userRole, 'but needs one of', normalizedAllowedRoles);
      
      // Log authorization failure using audit logger
      logSecurityEvent({
        eventType: 'authorization_failure',
        severity: 'high',
        description: `User ${req.user.email} with role ${userRole} attempted to access resource requiring roles: ${allowedRoles.join(', ')}`,
        userId: req.user.uid,
        ipAddress: req.ipData?.masked || 'unknown',
        metadata: {
          requiredRoles: allowedRoles,
          userRole: userRole,
          rawRole: req.user.rawRole,
          email: req.user.email,
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent']
        }
      }).catch(err => 
        console.error('Failed to log authorization failure:', err)
      );
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource',
        requiredRoles: allowedRoles,
        yourRole: req.user.rawRole
      });
    }

    console.log('✅ Authorization success:', req.user.email, 'has required role', userRole);
    next();
  };
  // Exposed so tests can assert authorization policy from the live route table.
  middleware.requiredRoles = allowedRoles;
  middleware.displayName = `requireRole(${allowedRoles.join('|')})`;
  return middleware;
};

/**
 * Middleware to require super admin role
 * Convenience wrapper for requireRole('super admin')
 */
const requireSuperAdmin = requireRole('super admin');

/**
 * Middleware to require admin or super admin role
 */
const requireAdmin = requireRole('admin', 'super admin');

/**
 * Middleware to require compliance, admin, or super admin role
 */
const requireCompliance = requireRole('compliance', 'admin', 'super admin');

/**
 * Middleware to require claims, compliance, admin, or super admin role
 */
const requireClaims = requireRole('claims', 'compliance', 'admin', 'super admin');

/**
 * Middleware to require broker, compliance, admin, or super admin role
 * Used for identity collection endpoints
 */
const requireBrokerOrAdmin = requireRole('broker', 'compliance', 'admin', 'super admin');

/**
 * Helper function to check if user can access a specific identity list
 * Brokers can only access their own lists, admins can access all
 */
const canAccessIdentityList = async (userId, userRole, listId) => {
  // Admins, super admins, and compliance can access all lists
  if (isAdminOrSuperAdmin(userRole) || normalizeRole(userRole) === 'compliance') {
    return true;
  }
  
  // Brokers can only access their own lists
  if (normalizeRole(userRole) === 'broker') {
    try {
      const listDoc = await db.collection('identity-lists').doc(listId).get();
      if (!listDoc.exists) {
        return false;
      }
      return listDoc.data().createdBy === userId;
    } catch (error) {
      console.error('Error checking list access:', error);
      return false;
    }
  }
  
  // Other roles cannot access identity lists
  return false;
};

/**
 * Middleware to check if user owns the resource or is admin
 * Checks if req.user.uid matches the resource's submittedBy field
 */
const requireOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins can access anything
    if (isAdminOrSuperAdmin(req.user.role)) {
      console.log('✅ Admin access granted:', req.user.email);
      return next();
    }

    // For regular users, check ownership
    // This will be used in routes that fetch documents
    req.requireOwnership = true;
    next();
    
  } catch (error) {
    console.error('Owner check error:', error);
    return res.status(500).json({ error: 'Authorization error' });
  }
};

  return {
    canAccessIdentityList,
    getCachedSession,
    invalidateSessionCache,
    isAdminOrCompliance,
    isAdminOrSuperAdmin,
    isClaimsOrAdminOrCompliance,
    isSuperAdmin,
    normalizeRole,
    requireAdmin,
    requireAuth,
    requireAuthOrGuest,
    requireBrokerOrAdmin,
    requireClaims,
    requireCompliance,
    requireOwnerOrAdmin,
    requireRole,
    requireSuperAdmin,
  };
}

module.exports = { createAuthMiddleware };
