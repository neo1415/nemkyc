/**
 * Rate Limiter for Datapro API
 * 
 * Implements a token bucket algorithm to limit API requests.
 * Maximum 50 requests per minute to avoid exceeding API limits.
 * 
 * Features:
 * - Token bucket algorithm with automatic refill
 * - Request queuing when limit exceeded
 * - Configurable max queue size
 * - Logging of rate limit hits
 */

class RateLimiter {
  constructor(maxRequests = 50, windowMs = 60000, maxQueueSize = 100) {
    this.maxRequests = maxRequests; // Maximum requests per window
    this.windowMs = windowMs; // Time window in milliseconds (default: 1 minute)
    this.maxQueueSize = maxQueueSize; // Maximum queued requests
    
    this.tokens = maxRequests; // Available tokens
    this.queue = []; // Request queue
    this.lastRefill = Date.now(); // Last token refill time
    
    // Start token refill interval
    this.refillInterval = setInterval(() => this.refillTokens(), 1000);
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  refillTokens() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    // Calculate tokens to add based on elapsed time
    const tokensToAdd = Math.floor((elapsed / this.windowMs) * this.maxRequests);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
      this.lastRefill = now;
      
      // Process queued requests if tokens available
      this.processQueue();
    }
  }
  
  /**
   * Process queued requests
   */
  processQueue() {
    while (this.queue.length > 0 && this.tokens > 0) {
      const { resolve, reject } = this.queue.shift();
      this.tokens--;
      resolve();
    }
  }
  
  /**
   * Acquire a token to make a request
   * Returns a promise that resolves when a token is available
   * 
   * @returns {Promise<void>}
   * @throws {Error} If queue is full
   */
  async acquire() {
    // If tokens available, consume one immediately
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }
    
    // Check if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      console.error('[RateLimiter] Queue is full, rejecting request');
      throw new Error('Rate limit queue is full. Please try again later.');
    }
    
    // Queue the request
    console.log(`[RateLimiter] Queueing request (queue size: ${this.queue.length + 1})`);
    
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }
  
  /**
   * Get current rate limiter status
   * 
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      availableTokens: this.tokens,
      maxTokens: this.maxRequests,
      queueSize: this.queue.length,
      maxQueueSize: this.maxQueueSize,
      utilizationPercent: Math.round(((this.maxRequests - this.tokens) / this.maxRequests) * 100)
    };
  }
  
  /**
   * Reset the rate limiter
   */
  reset() {
    this.tokens = this.maxRequests;
    this.queue = [];
    this.lastRefill = Date.now();
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    if (this.refillInterval) {
      clearInterval(this.refillInterval);
      this.refillInterval = null;
    }
    
    // Reject all queued requests
    while (this.queue.length > 0) {
      const { reject } = this.queue.shift();
      reject(new Error('Rate limiter destroyed'));
    }
  }
}

// Create singleton instance for Datapro API
// Max 50 requests per minute
const dataproRateLimiter = new RateLimiter(50, 60000, 100);

// Create singleton instance for VerifyData API
// Max 50 requests per minute
const verifydataRateLimiter = new RateLimiter(50, 60000, 100);

/**
 * Middleware to apply rate limiting to Datapro API calls
 * 
 * Usage:
 * await applyDataproRateLimit();
 * // Make Datapro API call
 * 
 * @returns {Promise<void>}
 * @throws {Error} If rate limit exceeded and queue is full
 */
async function applyDataproRateLimit() {
  try {
    await dataproRateLimiter.acquire();
  } catch (error) {
    console.error('[RateLimiter] Rate limit error:', error.message);
    throw error;
  }
}

/**
 * Middleware to apply rate limiting to VerifyData API calls
 * 
 * Usage:
 * await applyVerifydataRateLimit();
 * // Make VerifyData API call
 * 
 * @returns {Promise<void>}
 * @throws {Error} If rate limit exceeded and queue is full
 */
async function applyVerifydataRateLimit() {
  try {
    await verifydataRateLimiter.acquire();
  } catch (error) {
    console.error('[RateLimiter] VerifyData rate limit error:', error.message);
    throw error;
  }
}

/**
 * Get Datapro rate limiter status
 * 
 * @returns {Object} Status object
 */
function getDataproRateLimitStatus() {
  return dataproRateLimiter.getStatus();
}

/**
 * Get VerifyData rate limiter status
 * 
 * @returns {Object} Status object
 */
function getVerifydataRateLimitStatus() {
  return verifydataRateLimiter.getStatus();
}

/**
 * Reset Datapro rate limiter
 */
function resetDataproRateLimit() {
  dataproRateLimiter.reset();
  console.log('[RateLimiter] Datapro rate limiter reset');
}

/**
 * Reset VerifyData rate limiter
 */
function resetVerifydataRateLimit() {
  verifydataRateLimiter.reset();
  console.log('[RateLimiter] VerifyData rate limiter reset');
}

module.exports = {
  RateLimiter,
  applyDataproRateLimit,
  applyVerifydataRateLimit,
  getDataproRateLimitStatus,
  getVerifydataRateLimitStatus,
  resetDataproRateLimit,
  resetVerifydataRateLimit
};

/**
 * User Creation Rate Limiter
 * 
 * Implements Firestore-based rate limiting for user creation operations.
 * Limits each super admin to 10 user creations per hour.
 * 
 * Features:
 * - Firestore-backed rate limit tracking
 * - Per-user rate limiting (by super admin ID)
 * - Automatic cleanup of expired rate limit documents
 * - Returns retry-after time when limit exceeded
 */

const admin = require('firebase-admin');

/**
 * Middleware to apply rate limiting to user creation
 * Limits each super admin to 10 user creations per hour
 * 
 * Usage in Express:
 * app.post('/api/users/create', requireAuth, requireSuperAdmin, userCreationRateLimit, async (req, res) => {
 *   // Create user
 * });
 * 
 * @param {Object} req - Express request object (must have req.user.uid)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
async function userCreationRateLimit(req, res, next) {
  try {
    const superAdminId = req.user?.uid;
    
    if (!superAdminId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const db = admin.firestore();
    const rateLimitRef = db.collection('rateLimits').doc(superAdminId);
    
    // Get current rate limit document
    const rateLimitDoc = await rateLimitRef.get();
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour in milliseconds
    const maxCreations = 10;
    
    if (!rateLimitDoc.exists) {
      // First creation - create rate limit document
      await rateLimitRef.set({
        superAdminId,
        userCreationCount: 1,
        windowStartTime: admin.firestore.Timestamp.fromMillis(now),
        windowEndTime: admin.firestore.Timestamp.fromMillis(now + windowMs),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[RateLimiter] User creation rate limit initialized for ${superAdminId}: 1/${maxCreations}`);
      return next();
    }
    
    const rateLimitData = rateLimitDoc.data();
    const windowEndTime = rateLimitData.windowEndTime.toMillis();
    
    // Check if window has expired
    if (now >= windowEndTime) {
      // Window expired - reset counter
      await rateLimitRef.set({
        superAdminId,
        userCreationCount: 1,
        windowStartTime: admin.firestore.Timestamp.fromMillis(now),
        windowEndTime: admin.firestore.Timestamp.fromMillis(now + windowMs),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[RateLimiter] User creation rate limit reset for ${superAdminId}: 1/${maxCreations}`);
      return next();
    }
    
    // Window still active - check if limit exceeded
    if (rateLimitData.userCreationCount >= maxCreations) {
      const retryAfterMs = windowEndTime - now;
      const retryAfterMinutes = Math.ceil(retryAfterMs / 60000);
      
      console.warn(`[RateLimiter] User creation rate limit exceeded for ${superAdminId}: ${rateLimitData.userCreationCount}/${maxCreations}`);
      
      // Log rate limit violation (async, don't wait)
      const auditLogger = require('./auditLogger.cjs');
      auditLogger.logSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        description: `User creation rate limit exceeded: ${rateLimitData.userCreationCount}/${maxCreations}`,
        userId: superAdminId,
        metadata: {
          operation: 'user_creation',
          currentCount: rateLimitData.userCreationCount,
          maxAllowed: maxCreations,
          retryAfterMinutes
        }
      }).catch(err => console.error('Failed to log rate limit violation:', err.message));
      
      return res.status(429).json({
        success: false,
        error: `User creation rate limit exceeded. Please try again in ${retryAfterMinutes} minute${retryAfterMinutes !== 1 ? 's' : ''}`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(retryAfterMs / 1000), // seconds
        details: {
          currentCount: rateLimitData.userCreationCount,
          maxAllowed: maxCreations,
          windowEndTime: new Date(windowEndTime).toISOString()
        }
      });
    }
    
    // Increment counter
    await rateLimitRef.update({
      userCreationCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[RateLimiter] User creation rate limit check passed for ${superAdminId}: ${rateLimitData.userCreationCount + 1}/${maxCreations}`);
    next();
    
  } catch (error) {
    console.error('[RateLimiter] Error checking user creation rate limit:', error.message);
    // Don't block request on rate limiter errors
    next();
  }
}

/**
 * Cleanup expired rate limit documents
 * Should be called periodically (e.g., via cron job or Cloud Function)
 * 
 * @returns {Promise<number>} Number of documents deleted
 */
async function cleanupExpiredRateLimits() {
  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    // Find expired rate limit documents
    const expiredDocs = await db.collection('rateLimits')
      .where('windowEndTime', '<', now)
      .get();
    
    if (expiredDocs.empty) {
      console.log('[RateLimiter] No expired rate limit documents to clean up');
      return 0;
    }
    
    // Delete expired documents in batch
    const batch = db.batch();
    expiredDocs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`[RateLimiter] Cleaned up ${expiredDocs.size} expired rate limit documents`);
    return expiredDocs.size;
    
  } catch (error) {
    console.error('[RateLimiter] Error cleaning up expired rate limits:', error.message);
    throw error;
  }
}

/**
 * Get rate limit status for a super admin
 * 
 * @param {string} superAdminId - Super admin user ID
 * @returns {Promise<Object>} Rate limit status
 */
async function getUserCreationRateLimitStatus(superAdminId) {
  try {
    const db = admin.firestore();
    const rateLimitDoc = await db.collection('rateLimits').doc(superAdminId).get();
    
    if (!rateLimitDoc.exists) {
      return {
        currentCount: 0,
        maxAllowed: 10,
        remaining: 10,
        windowActive: false
      };
    }
    
    const rateLimitData = rateLimitDoc.data();
    const now = Date.now();
    const windowEndTime = rateLimitData.windowEndTime.toMillis();
    const windowActive = now < windowEndTime;
    
    return {
      currentCount: rateLimitData.userCreationCount,
      maxAllowed: 10,
      remaining: Math.max(0, 10 - rateLimitData.userCreationCount),
      windowActive,
      windowEndTime: windowActive ? new Date(windowEndTime).toISOString() : null,
      retryAfterSeconds: windowActive ? Math.ceil((windowEndTime - now) / 1000) : 0
    };
    
  } catch (error) {
    console.error('[RateLimiter] Error getting rate limit status:', error.message);
    throw error;
  }
}

/**
 * Reset rate limit for a super admin (admin function)
 * 
 * @param {string} superAdminId - Super admin user ID
 * @returns {Promise<void>}
 */
async function resetUserCreationRateLimit(superAdminId) {
  try {
    const db = admin.firestore();
    await db.collection('rateLimits').doc(superAdminId).delete();
    console.log(`[RateLimiter] User creation rate limit reset for ${superAdminId}`);
  } catch (error) {
    console.error('[RateLimiter] Error resetting rate limit:', error.message);
    throw error;
  }
}

module.exports = {
  RateLimiter,
  applyDataproRateLimit,
  applyVerifydataRateLimit,
  getDataproRateLimitStatus,
  getVerifydataRateLimitStatus,
  resetDataproRateLimit,
  resetVerifydataRateLimit,
  userCreationRateLimit,
  cleanupExpiredRateLimits,
  getUserCreationRateLimitStatus,
  resetUserCreationRateLimit
};
