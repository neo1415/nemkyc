/**
 * Duplicate Detection Utility
 * 
 * Provides duplicate checking for identity verification to prevent wasting API credits
 * on already-verified identities. Searches across ALL identity lists in the database.
 * 
 * Features:
 * - Cross-list duplicate detection (searches all identity-entries regardless of listId)
 * - Handles encrypted identity values by decrypting before comparison
 * - In-memory caching with 5-minute TTL for performance optimization
 * - Batch checking to minimize database queries
 * 
 * Requirements: 1.1, 1.2
 */

const admin = require('firebase-admin');
const { decryptData, isEncrypted } = require('./encryption.cjs');

// Cache for duplicate check results
// Key: `${identityType}:${identityValue}` (decrypted value)
// Value: { result: DuplicateCheckResult, expiresAt: timestamp }
const duplicateCache = new Map();

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

// Maximum cache size (LRU eviction)
const MAX_CACHE_SIZE = 10000;

/**
 * Result type for duplicate checks
 * @typedef {Object} DuplicateCheckResult
 * @property {boolean} isDuplicate - Whether the identity has been verified before
 * @property {string|null} originalListId - ID of the list containing the original verification
 * @property {string|null} originalEntryId - ID of the original verified entry
 * @property {Date|null} originalVerificationDate - When the identity was first verified
 * @property {string|null} originalBroker - User ID who performed the original verification
 * @property {Object|null} originalResult - Verification result from the original verification
 */

/**
 * Check if an identity has been verified before across all lists
 * 
 * @param {string} identityType - 'NIN', 'BVN', or 'CAC'
 * @param {string|Object} identityValue - The identity number (can be encrypted object or plain string)
 * @returns {Promise<DuplicateCheckResult>}
 */
async function checkDuplicate(identityType, identityValue) {
  try {
    // Decrypt if encrypted
    let decryptedValue = identityValue;
    if (typeof identityValue === 'object' && isEncrypted(identityValue)) {
      try {
        decryptedValue = decryptData(identityValue.encrypted, identityValue.iv);
      } catch (err) {
        console.error(`Failed to decrypt identity value for duplicate check:`, err.message);
        // Return non-duplicate result if decryption fails (fail-open approach)
        return {
          isDuplicate: false,
          originalListId: null,
          originalEntryId: null,
          originalVerificationDate: null,
          originalBroker: null,
          originalResult: null
        };
      }
    }

    // Check cache first
    const cacheKey = `${identityType}:${decryptedValue}`;
    const cached = duplicateCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    // Query Firestore for verified entries with matching identity
    const db = admin.firestore();
    
    // Build query based on identity type
    // Identity values can be stored in multiple locations:
    // - entry.data.nin, entry.data.bvn, entry.data.cac (nested in data object)
    // - entry.nin, entry.bvn, entry.cac (top-level fields)
    // We need to check both locations
    
    const fieldPath = identityType.toLowerCase();
    
    // Query for entries with matching identity in data object
    let query = db.collection('identity-entries')
      .where('status', '==', 'verified')
      .limit(1);
    
    // Note: We can't directly query encrypted fields, so we need to fetch all verified entries
    // and check them one by one. For performance, we'll implement a more targeted approach:
    // 1. First try to find entries with the same identity type
    // 2. Then check if any match our decrypted value
    
    const snapshot = await query.get();
    
    // Check all verified entries for matching identity
    // This is necessary because identity values may be encrypted
    const allVerifiedQuery = db.collection('identity-entries')
      .where('status', '==', 'verified');
    
    const allVerifiedSnapshot = await allVerifiedQuery.get();
    
    for (const doc of allVerifiedSnapshot.docs) {
      const entry = doc.data();
      
      // Check both nested and top-level locations
      let entryIdentityValue = entry.data?.[fieldPath] || entry[fieldPath];
      
      if (!entryIdentityValue) {
        continue;
      }
      
      // Decrypt if encrypted
      if (isEncrypted(entryIdentityValue)) {
        try {
          entryIdentityValue = decryptData(entryIdentityValue.encrypted, entryIdentityValue.iv);
        } catch (err) {
          console.error(`Failed to decrypt ${identityType} for entry ${doc.id}:`, err.message);
          continue;
        }
      }
      
      // Compare decrypted values
      if (entryIdentityValue === decryptedValue) {
        // Found a duplicate!
        const result = {
          isDuplicate: true,
          originalListId: entry.listId || null,
          originalEntryId: doc.id,
          originalVerificationDate: entry.verifiedAt?.toDate() || entry.updatedAt?.toDate() || null,
          originalBroker: entry.verifiedBy || entry.userId || null,
          originalResult: entry.verificationResult || null
        };
        
        // Cache the result
        cacheResult(cacheKey, result);
        
        return result;
      }
    }
    
    // No duplicate found
    const result = {
      isDuplicate: false,
      originalListId: null,
      originalEntryId: null,
      originalVerificationDate: null,
      originalBroker: null,
      originalResult: null
    };
    
    // Cache the result
    cacheResult(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.error('Duplicate check error:', error.message);
    
    // Fail-open: return non-duplicate result to avoid blocking verification
    return {
      isDuplicate: false,
      originalListId: null,
      originalEntryId: null,
      originalVerificationDate: null,
      originalBroker: null,
      originalResult: null
    };
  }
}

/**
 * Batch check multiple identities for duplicates
 * More efficient than individual checks when processing multiple entries
 * 
 * @param {Array<{type: string, value: string|Object, entryId: string}>} identities
 * @returns {Promise<Map<string, DuplicateCheckResult>>}
 */
async function batchCheckDuplicates(identities) {
  const results = new Map();
  
  try {
    // Decrypt all identity values first
    const decryptedIdentities = identities.map(identity => {
      let decryptedValue = identity.value;
      
      if (typeof identity.value === 'object' && isEncrypted(identity.value)) {
        try {
          decryptedValue = decryptData(identity.value.encrypted, identity.value.iv);
        } catch (err) {
          console.error(`Failed to decrypt identity for batch check:`, err.message);
          decryptedValue = null;
        }
      }
      
      return {
        ...identity,
        decryptedValue,
        cacheKey: `${identity.type}:${decryptedValue}`
      };
    });
    
    // Check cache for all identities
    const uncachedIdentities = [];
    
    for (const identity of decryptedIdentities) {
      if (!identity.decryptedValue) {
        // Decryption failed, return non-duplicate
        results.set(identity.entryId, {
          isDuplicate: false,
          originalListId: null,
          originalEntryId: null,
          originalVerificationDate: null,
          originalBroker: null,
          originalResult: null
        });
        continue;
      }
      
      const cached = duplicateCache.get(identity.cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        results.set(identity.entryId, cached.result);
      } else {
        uncachedIdentities.push(identity);
      }
    }
    
    // If all results were cached, return early
    if (uncachedIdentities.length === 0) {
      return results;
    }
    
    // Fetch all verified entries once
    const db = admin.firestore();
    const allVerifiedSnapshot = await db.collection('identity-entries')
      .where('status', '==', 'verified')
      .get();
    
    // Build a map of decrypted identity values from verified entries
    const verifiedIdentities = new Map();
    
    for (const doc of allVerifiedSnapshot.docs) {
      const entry = doc.data();
      
      // Check all identity types
      for (const identityType of ['nin', 'bvn', 'cac']) {
        let entryIdentityValue = entry.data?.[identityType] || entry[identityType];
        
        if (!entryIdentityValue) {
          continue;
        }
        
        // Decrypt if encrypted
        if (isEncrypted(entryIdentityValue)) {
          try {
            entryIdentityValue = decryptData(entryIdentityValue.encrypted, entryIdentityValue.iv);
          } catch (err) {
            console.error(`Failed to decrypt ${identityType} for entry ${doc.id}:`, err.message);
            continue;
          }
        }
        
        const key = `${identityType.toUpperCase()}:${entryIdentityValue}`;
        
        // Store the first occurrence (most recent if ordered)
        if (!verifiedIdentities.has(key)) {
          verifiedIdentities.set(key, {
            entryId: doc.id,
            listId: entry.listId || null,
            verifiedAt: entry.verifiedAt?.toDate() || entry.updatedAt?.toDate() || null,
            verifiedBy: entry.verifiedBy || entry.userId || null,
            verificationResult: entry.verificationResult || null
          });
        }
      }
    }
    
    // Check each uncached identity against the verified identities map
    for (const identity of uncachedIdentities) {
      const verified = verifiedIdentities.get(identity.cacheKey);
      
      const result = verified ? {
        isDuplicate: true,
        originalListId: verified.listId,
        originalEntryId: verified.entryId,
        originalVerificationDate: verified.verifiedAt,
        originalBroker: verified.verifiedBy,
        originalResult: verified.verificationResult
      } : {
        isDuplicate: false,
        originalListId: null,
        originalEntryId: null,
        originalVerificationDate: null,
        originalBroker: null,
        originalResult: null
      };
      
      // Cache the result
      cacheResult(identity.cacheKey, result);
      
      results.set(identity.entryId, result);
    }
    
    return results;
    
  } catch (error) {
    console.error('Batch duplicate check error:', error.message);
    
    // Fail-open: return non-duplicate results for all identities
    for (const identity of identities) {
      if (!results.has(identity.entryId)) {
        results.set(identity.entryId, {
          isDuplicate: false,
          originalListId: null,
          originalEntryId: null,
          originalVerificationDate: null,
          originalBroker: null,
          originalResult: null
        });
      }
    }
    
    return results;
  }
}

/**
 * Cache a duplicate check result
 * Implements LRU eviction when cache is full
 * 
 * @param {string} cacheKey - Cache key for the identity
 * @param {DuplicateCheckResult} result - Result to cache
 */
function cacheResult(cacheKey, result) {
  // Implement LRU eviction if cache is full
  if (duplicateCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first entry in Map)
    const firstKey = duplicateCache.keys().next().value;
    duplicateCache.delete(firstKey);
  }
  
  duplicateCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

/**
 * Clear expired entries from cache
 * Should be called periodically (e.g., every 5 minutes)
 */
function cleanupCache() {
  const now = Date.now();
  
  for (const [key, value] of duplicateCache.entries()) {
    if (value.expiresAt <= now) {
      duplicateCache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 * Useful for testing or manual cache invalidation
 */
function clearCache() {
  duplicateCache.clear();
}

/**
 * Get cache statistics
 * Useful for monitoring and debugging
 * 
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const value of duplicateCache.values()) {
    if (value.expiresAt > now) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: duplicateCache.size,
    validEntries,
    expiredEntries,
    maxSize: MAX_CACHE_SIZE,
    ttlMs: CACHE_TTL_MS
  };
}

// Set up periodic cache cleanup (every 5 minutes)
setInterval(cleanupCache, 5 * 60 * 1000);

module.exports = {
  checkDuplicate,
  batchCheckDuplicates,
  clearCache,
  getCacheStats
};
