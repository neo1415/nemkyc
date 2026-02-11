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
 * Get Datapro rate limiter status
 * 
 * @returns {Object} Status object
 */
function getDataproRateLimitStatus() {
  return dataproRateLimiter.getStatus();
}

/**
 * Reset Datapro rate limiter
 */
function resetDataproRateLimit() {
  dataproRateLimiter.reset();
  console.log('[RateLimiter] Datapro rate limiter reset');
}

module.exports = {
  RateLimiter,
  applyDataproRateLimit,
  getDataproRateLimitStatus,
  resetDataproRateLimit
};
