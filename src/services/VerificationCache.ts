/**
 * Verification Cache Service
 * 
 * Manages in-memory caching of verification API responses to prevent duplicate API calls.
 * Cache entries are keyed by identifier (NIN/CAC number) and persist for the session duration.
 */

import { CachedVerification, IdentifierType } from '@/types/realtimeVerificationValidation';

/**
 * VerificationCache class
 * 
 * Provides methods to store, retrieve, and manage verification data cache.
 * Uses a Map for efficient lookups and supports cache invalidation.
 */
export class VerificationCache {
  private cache: Map<string, CachedVerification>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Store verification data in cache
   * 
   * @param identifier - The identifier (NIN/CAC number)
   * @param data - Verification API response data
   * @param identifierType - Type of identifier (CAC or NIN)
   */
  set(identifier: string, data: any, identifierType: IdentifierType): void {
    if (!identifier || !data) {
      console.warn('VerificationCache.set: Invalid identifier or data');
      return;
    }

    const cacheEntry: CachedVerification = {
      data,
      identifierType,
      timestamp: Date.now(),
      identifier
    };

    this.cache.set(identifier, cacheEntry);
    
    // Log cache operation for debugging
    console.log(`[VerificationCache] Cached ${identifierType} data for identifier: ${identifier}`);
  }

  /**
   * Retrieve verification data from cache
   * 
   * @param identifier - The identifier to look up
   * @returns Cached verification data or null if not found
   */
  get(identifier: string): CachedVerification | null {
    if (!identifier) {
      return null;
    }

    const cacheEntry = this.cache.get(identifier);
    
    if (cacheEntry) {
      console.log(`[VerificationCache] Cache hit for identifier: ${identifier}`);
      return cacheEntry;
    }

    console.log(`[VerificationCache] Cache miss for identifier: ${identifier}`);
    return null;
  }

  /**
   * Check if identifier exists in cache
   * 
   * @param identifier - The identifier to check
   * @returns True if cached, false otherwise
   */
  has(identifier: string): boolean {
    if (!identifier) {
      return false;
    }

    return this.cache.has(identifier);
  }

  /**
   * Invalidate (remove) a specific cache entry
   * 
   * @param identifier - The identifier to invalidate
   */
  invalidate(identifier: string): void {
    if (!identifier) {
      return;
    }

    const existed = this.cache.delete(identifier);
    
    if (existed) {
      console.log(`[VerificationCache] Invalidated cache for identifier: ${identifier}`);
    }
  }

  /**
   * Invalidate cache on identifier change
   * 
   * This method should be called when the user changes the identifier field value.
   * It clears the cache entry for the old identifier to prevent stale data from being used.
   * 
   * @param oldIdentifier - The previous identifier value
   * @param newIdentifier - The new identifier value
   * @returns Object indicating whether invalidation occurred and which identifier was invalidated
   */
  invalidateOnIdentifierChange(oldIdentifier: string | null, newIdentifier: string | null): {
    invalidated: boolean;
    invalidatedIdentifier: string | null;
  } {
    // If there's no old identifier, nothing to invalidate
    if (!oldIdentifier) {
      return { invalidated: false, invalidatedIdentifier: null };
    }

    // If identifiers are the same, no invalidation needed
    if (oldIdentifier === newIdentifier) {
      return { invalidated: false, invalidatedIdentifier: null };
    }

    // Invalidate the old identifier's cache entry
    const existed = this.cache.delete(oldIdentifier);
    
    if (existed) {
      console.log(`[VerificationCache] Invalidated cache on identifier change: ${oldIdentifier} -> ${newIdentifier || '(empty)'}`);
      return { invalidated: true, invalidatedIdentifier: oldIdentifier };
    }

    return { invalidated: false, invalidatedIdentifier: null };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[VerificationCache] Cleared all cache entries (${size} entries removed)`);
  }

  /**
   * Get cache size (number of entries)
   * 
   * @returns Number of cached entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cached identifiers
   * 
   * @returns Array of cached identifiers
   */
  getCachedIdentifiers(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics for debugging
   * 
   * @returns Cache statistics object
   */
  getStats(): {
    size: number;
    identifiers: string[];
    oldestEntry: { identifier: string; age: number } | null;
    newestEntry: { identifier: string; age: number } | null;
  } {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    if (entries.length === 0) {
      return {
        size: 0,
        identifiers: [],
        oldestEntry: null,
        newestEntry: null
      };
    }

    // Find oldest and newest entries
    let oldest = entries[0];
    let newest = entries[0];

    for (const entry of entries) {
      if (entry[1].timestamp < oldest[1].timestamp) {
        oldest = entry;
      }
      if (entry[1].timestamp > newest[1].timestamp) {
        newest = entry;
      }
    }

    return {
      size: entries.length,
      identifiers: entries.map(e => e[0]),
      oldestEntry: {
        identifier: oldest[0],
        age: now - oldest[1].timestamp
      },
      newestEntry: {
        identifier: newest[0],
        age: now - newest[1].timestamp
      }
    };
  }
}

// Singleton instance for global use
let cacheInstance: VerificationCache | null = null;

/**
 * Get the singleton VerificationCache instance
 * 
 * @returns The global VerificationCache instance
 */
export const getVerificationCache = (): VerificationCache => {
  if (!cacheInstance) {
    cacheInstance = new VerificationCache();
  }
  return cacheInstance;
};

/**
 * Reset the cache instance (useful for testing)
 */
export const resetVerificationCache = (): void => {
  if (cacheInstance) {
    cacheInstance.clear();
  }
  cacheInstance = null;
};
