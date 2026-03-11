// Caching service for Gemini Document Verification

import { DocumentVerificationResult, ExtractedDocumentData } from '@/types/geminiDocumentVerification';

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
}

export class GeminiCacheService {
  private documentCache = new Map<string, CacheEntry<DocumentVerificationResult>>();
  private ocrCache = new Map<string, CacheEntry<ExtractedDocumentData>>();
  private verificationCache = new Map<string, CacheEntry<any>>();
  private apiResponseCache = new Map<string, CacheEntry<any>>();

  private stats = {
    totalHits: 0,
    totalMisses: 0
  };

  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Start periodic cleanup
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  /**
   * Cache document processing result
   */
  cacheDocumentResult(
    documentHash: string,
    result: DocumentVerificationResult,
    ttl: number = this.DEFAULT_TTL
  ): void {
    this.setCache(this.documentCache, documentHash, result, ttl);
  }

  /**
   * Get cached document result
   */
  getCachedDocumentResult(documentHash: string): DocumentVerificationResult | null {
    return this.getCache(this.documentCache, documentHash);
  }

  /**
   * Cache OCR extraction result
   */
  cacheOCRResult(
    documentHash: string,
    extractedData: ExtractedDocumentData,
    ttl: number = this.DEFAULT_TTL
  ): void {
    this.setCache(this.ocrCache, documentHash, extractedData, ttl);
  }

  /**
   * Get cached OCR result
   */
  getCachedOCRResult(documentHash: string): ExtractedDocumentData | null {
    return this.getCache(this.ocrCache, documentHash);
  }

  /**
   * Cache verification result for official records
   */
  cacheVerificationResult(
    recordKey: string,
    verificationData: any,
    ttl: number = 60 * 60 * 1000 // 1 hour for official records
  ): void {
    this.setCache(this.verificationCache, recordKey, verificationData, ttl);
  }

  /**
   * Get cached verification result
   */
  getCachedVerificationResult(recordKey: string): any | null {
    return this.getCache(this.verificationCache, recordKey);
  }

  /**
   * Cache API response
   */
  cacheApiResponse(
    requestKey: string,
    response: any,
    ttl: number = 30 * 60 * 1000 // 30 minutes for API responses
  ): void {
    this.setCache(this.apiResponseCache, requestKey, response, ttl);
  }

  /**
   * Get cached API response
   */
  getCachedApiResponse(requestKey: string): any | null {
    return this.getCache(this.apiResponseCache, requestKey);
  }

  /**
   * Generate document hash for caching
   */
  generateDocumentHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file for hashing'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Generate key for verification caching
   */
  generateVerificationKey(documentType: string, identifier: string): string {
    return `${documentType}:${identifier}`;
  }

  /**
   * Generate key for API request caching
   */
  generateApiRequestKey(endpoint: string, params: any): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${endpoint}:${btoa(paramString)}`;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.documentCache.clear();
    this.ocrCache.clear();
    this.verificationCache.clear();
    this.apiResponseCache.clear();
    this.stats.totalHits = 0;
    this.stats.totalMisses = 0;
  }

  /**
   * Clear specific cache
   */
  clearCache(cacheType: 'document' | 'ocr' | 'verification' | 'api'): void {
    switch (cacheType) {
      case 'document':
        this.documentCache.clear();
        break;
      case 'ocr':
        this.ocrCache.clear();
        break;
      case 'verification':
        this.verificationCache.clear();
        break;
      case 'api':
        this.apiResponseCache.clear();
        break;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.totalHits + this.stats.totalMisses;
    const hitRate = totalRequests > 0 ? (this.stats.totalHits / totalRequests) * 100 : 0;
    const missRate = 100 - hitRate;

    const totalEntries = this.documentCache.size + 
                        this.ocrCache.size + 
                        this.verificationCache.size + 
                        this.apiResponseCache.size;

    // Estimate memory usage (rough calculation)
    const memoryUsage = this.estimateMemoryUsage();

    return {
      totalEntries,
      hitRate,
      missRate,
      totalHits: this.stats.totalHits,
      totalMisses: this.stats.totalMisses,
      memoryUsage
    };
  }

  /**
   * Get cache contents for debugging
   */
  getCacheContents(): {
    document: string[];
    ocr: string[];
    verification: string[];
    api: string[];
  } {
    return {
      document: Array.from(this.documentCache.keys()),
      ocr: Array.from(this.ocrCache.keys()),
      verification: Array.from(this.verificationCache.keys()),
      api: Array.from(this.apiResponseCache.keys())
    };
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp, cacheType?: 'document' | 'ocr' | 'verification' | 'api'): number {
    let invalidatedCount = 0;

    const caches = cacheType ? [this.getCacheByType(cacheType)] : [
      this.documentCache,
      this.ocrCache,
      this.verificationCache,
      this.apiResponseCache
    ];

    caches.forEach(cache => {
      if (cache) {
        const keysToDelete = Array.from(cache.keys()).filter(key => pattern.test(key));
        keysToDelete.forEach(key => {
          cache.delete(key);
          invalidatedCount++;
        });
      }
    });

    return invalidatedCount;
  }

  /**
   * Preload cache with common verification data
   */
  async preloadCommonData(): Promise<void> {
    // This would preload frequently accessed verification data
    // Implementation would depend on your specific use case
    console.log('Preloading common verification data...');
  }

  /**
   * Generic cache setter
   */
  private setCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
    ttl: number
  ): void {
    // Implement LRU eviction if cache is full
    if (cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU(cache);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl,
      accessCount: 0,
      lastAccessed: new Date()
    };

    cache.set(key, entry);
  }

  /**
   * Generic cache getter
   */
  private getCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);

    if (!entry) {
      this.stats.totalMisses++;
      return null;
    }

    // Check if entry has expired
    const now = new Date();
    if (now.getTime() - entry.timestamp.getTime() > entry.ttl) {
      cache.delete(key);
      this.stats.totalMisses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.totalHits++;

    return entry.data;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU<T>(cache: Map<string, CacheEntry<T>>): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = new Date();
    const caches = [this.documentCache, this.ocrCache, this.verificationCache, this.apiResponseCache];

    caches.forEach(cache => {
      for (const [key, entry] of cache.entries()) {
        if (now.getTime() - entry.timestamp.getTime() > entry.ttl) {
          cache.delete(key);
        }
      }
    });
  }

  /**
   * Get cache by type
   */
  private getCacheByType(type: 'document' | 'ocr' | 'verification' | 'api'): Map<string, CacheEntry<any>> | null {
    switch (type) {
      case 'document':
        return this.documentCache;
      case 'ocr':
        return this.ocrCache;
      case 'verification':
        return this.verificationCache;
      case 'api':
        return this.apiResponseCache;
      default:
        return null;
    }
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    const caches = [this.documentCache, this.ocrCache, this.verificationCache, this.apiResponseCache];
    
    caches.forEach(cache => {
      for (const entry of cache.values()) {
        // Rough estimation: JSON string length * 2 (for UTF-16)
        totalSize += JSON.stringify(entry).length * 2;
      }
    });

    return totalSize;
  }
}

// Singleton instance
export const geminiCacheService = new GeminiCacheService();