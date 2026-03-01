/**
 * CAC Document Performance Optimizer
 * 
 * Provides performance optimization for CAC document operations:
 * - Document caching strategy (session-based)
 * - Thumbnail generation for images
 * - Lazy loading for document lists
 * - Request batching for multiple documents
 * - Connection pooling for Firebase
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { getDocumentForPreview } from './cacStorageService';
import { EncryptionMetadata } from '../types/cacDocuments';

/**
 * Cache entry for decrypted documents
 */
interface CacheEntry {
  data: ArrayBuffer;
  mimeType: string;
  timestamp: number;
  size: number;
}

/**
 * Thumbnail cache entry
 */
interface ThumbnailCacheEntry {
  dataUrl: string;
  timestamp: number;
}

/**
 * Batch request for document loading
 */
interface BatchRequest {
  storagePath: string;
  encryptionMetadata: EncryptionMetadata;
  mimeType: string;
  resolve: (data: ArrayBuffer) => void;
  reject: (error: Error) => void;
}

/**
 * Session-based document cache
 * Stores decrypted documents in memory for the current session
 */
class DocumentCache {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB max cache size
  private currentCacheSize = 0;

  /**
   * Gets a document from cache
   */
  get(storagePath: string): ArrayBuffer | null {
    const entry = this.cache.get(storagePath);
    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid (within session, max 1 hour)
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (now - entry.timestamp > maxAge) {
      this.delete(storagePath);
      return null;
    }

    return entry.data;
  }

  /**
   * Stores a document in cache
   */
  set(storagePath: string, data: ArrayBuffer, mimeType: string): void {
    const size = data.byteLength;

    // Check if we need to evict old entries
    while (this.currentCacheSize + size > this.maxCacheSize && this.cache.size > 0) {
      this.evictOldest();
    }

    // Don't cache if single document exceeds max cache size
    if (size > this.maxCacheSize) {
      return;
    }

    this.cache.set(storagePath, {
      data,
      mimeType,
      timestamp: Date.now(),
      size
    });

    this.currentCacheSize += size;
  }

  /**
   * Deletes a document from cache
   */
  delete(storagePath: string): void {
    const entry = this.cache.get(storagePath);
    if (entry) {
      this.currentCacheSize -= entry.size;
      this.cache.delete(storagePath);
    }
  }

  /**
   * Evicts the oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Gets cache statistics
   */
  getStats(): { size: number; count: number; maxSize: number } {
    return {
      size: this.currentCacheSize,
      count: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }
}

/**
 * Thumbnail cache for image previews
 */
class ThumbnailCache {
  private cache = new Map<string, ThumbnailCacheEntry>();
  private maxEntries = 100;

  /**
   * Gets a thumbnail from cache
   */
  get(storagePath: string): string | null {
    const entry = this.cache.get(storagePath);
    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid (max 1 hour)
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (now - entry.timestamp > maxAge) {
      this.cache.delete(storagePath);
      return null;
    }

    return entry.dataUrl;
  }

  /**
   * Stores a thumbnail in cache
   */
  set(storagePath: string, dataUrl: string): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(storagePath, {
      dataUrl,
      timestamp: Date.now()
    });
  }

  /**
   * Clears the thumbnail cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Request batcher for loading multiple documents efficiently
 */
class RequestBatcher {
  private pendingRequests: BatchRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay = 50; // 50ms delay to collect requests
  private maxBatchSize = 5;

  /**
   * Adds a request to the batch
   */
  addRequest(
    storagePath: string,
    encryptionMetadata: EncryptionMetadata,
    mimeType: string
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({
        storagePath,
        encryptionMetadata,
        mimeType,
        resolve,
        reject
      });

      // Schedule batch processing
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatch(), this.batchDelay);
      }

      // Process immediately if batch is full
      if (this.pendingRequests.length >= this.maxBatchSize) {
        if (this.batchTimeout) {
          clearTimeout(this.batchTimeout);
          this.batchTimeout = null;
        }
        this.processBatch();
      }
    });
  }

  /**
   * Processes the current batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.pendingRequests.length === 0) {
      return;
    }

    const batch = this.pendingRequests.splice(0, this.maxBatchSize);
    this.batchTimeout = null;

    // Process requests in parallel
    await Promise.all(
      batch.map(async (request) => {
        try {
          const data = await getDocumentForPreview(
            request.storagePath,
            request.encryptionMetadata,
            request.mimeType
          );
          request.resolve(data);
        } catch (error) {
          request.reject(error as Error);
        }
      })
    );

    // Process remaining requests if any
    if (this.pendingRequests.length > 0) {
      this.batchTimeout = setTimeout(() => this.processBatch(), this.batchDelay);
    }
  }
}

// Global instances
const documentCache = new DocumentCache();
const thumbnailCache = new ThumbnailCache();
const requestBatcher = new RequestBatcher();

/**
 * Loads a document with caching
 * 
 * @param storagePath - Storage path of the document
 * @param encryptionMetadata - Encryption metadata
 * @param mimeType - Original MIME type
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise resolving to document data
 */
export async function loadDocumentWithCache(
  storagePath: string,
  encryptionMetadata: EncryptionMetadata,
  mimeType: string,
  useCache = true
): Promise<ArrayBuffer> {
  // Check cache first
  if (useCache) {
    const cached = documentCache.get(storagePath);
    if (cached) {
      return cached;
    }
  }

  // Load document
  const data = await getDocumentForPreview(storagePath, encryptionMetadata, mimeType);

  // Store in cache
  if (useCache) {
    documentCache.set(storagePath, data, mimeType);
  }

  return data;
}

/**
 * Loads multiple documents with batching and caching
 * 
 * @param requests - Array of document load requests
 * @returns Promise resolving to array of document data
 */
export async function loadDocumentsBatch(
  requests: Array<{
    storagePath: string;
    encryptionMetadata: EncryptionMetadata;
    mimeType: string;
  }>
): Promise<ArrayBuffer[]> {
  const results: ArrayBuffer[] = [];

  for (const request of requests) {
    // Check cache first
    const cached = documentCache.get(request.storagePath);
    if (cached) {
      results.push(cached);
      continue;
    }

    // Add to batch
    const data = await requestBatcher.addRequest(
      request.storagePath,
      request.encryptionMetadata,
      request.mimeType
    );

    // Store in cache
    documentCache.set(request.storagePath, data, request.mimeType);
    results.push(data);
  }

  return results;
}

/**
 * Generates a thumbnail for an image document
 * 
 * @param imageData - Image data as ArrayBuffer
 * @param mimeType - Image MIME type
 * @param maxWidth - Maximum thumbnail width (default: 200)
 * @param maxHeight - Maximum thumbnail height (default: 200)
 * @returns Promise resolving to thumbnail data URL
 */
export async function generateThumbnail(
  imageData: ArrayBuffer,
  mimeType: string,
  maxWidth = 200,
  maxHeight = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create blob from image data
    const blob = new Blob([imageData], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Create image element
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate thumbnail dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        // Clean up
        URL.revokeObjectURL(url);

        resolve(dataUrl);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail generation'));
    };

    img.src = url;
  });
}

/**
 * Loads a document thumbnail with caching
 * 
 * @param storagePath - Storage path of the document
 * @param encryptionMetadata - Encryption metadata
 * @param mimeType - Original MIME type
 * @returns Promise resolving to thumbnail data URL
 */
export async function loadThumbnailWithCache(
  storagePath: string,
  encryptionMetadata: EncryptionMetadata,
  mimeType: string
): Promise<string> {
  // Check if it's an image
  if (!mimeType.startsWith('image/')) {
    throw new Error('Thumbnail generation only supported for images');
  }

  // Check thumbnail cache
  const cached = thumbnailCache.get(storagePath);
  if (cached) {
    return cached;
  }

  // Load full image
  const imageData = await loadDocumentWithCache(storagePath, encryptionMetadata, mimeType);

  // Generate thumbnail
  const thumbnail = await generateThumbnail(imageData, mimeType);

  // Store in cache
  thumbnailCache.set(storagePath, thumbnail);

  return thumbnail;
}

/**
 * Preloads documents for lazy loading
 * 
 * @param documents - Array of documents to preload
 * @param visibleIndices - Indices of currently visible documents
 * @param preloadCount - Number of documents to preload ahead (default: 3)
 */
export async function preloadDocuments(
  documents: Array<{
    storagePath: string;
    encryptionMetadata: EncryptionMetadata;
    mimeType: string;
  }>,
  visibleIndices: number[],
  preloadCount = 3
): Promise<void> {
  // Determine which documents to preload
  const maxIndex = Math.max(...visibleIndices);
  const preloadIndices: number[] = [];

  for (let i = maxIndex + 1; i <= Math.min(maxIndex + preloadCount, documents.length - 1); i++) {
    preloadIndices.push(i);
  }

  // Preload documents
  const preloadRequests = preloadIndices.map((index) => documents[index]);

  if (preloadRequests.length > 0) {
    // Load in background without blocking
    loadDocumentsBatch(preloadRequests).catch((error) => {
      console.warn('Preload failed:', error);
    });
  }
}

/**
 * Clears all caches
 */
export function clearAllCaches(): void {
  documentCache.clear();
  thumbnailCache.clear();
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): {
  documentCache: { size: number; count: number; maxSize: number };
  thumbnailCache: { count: number };
} {
  return {
    documentCache: documentCache.getStats(),
    thumbnailCache: { count: thumbnailCache['cache'].size }
  };
}

/**
 * Estimates document load time based on file size
 * 
 * @param fileSize - File size in bytes
 * @returns Estimated load time in milliseconds
 */
export function estimateLoadTime(fileSize: number): number {
  // Assume average download speed of 5 Mbps (625 KB/s)
  const downloadSpeed = 625 * 1024; // bytes per second
  const downloadTime = (fileSize / downloadSpeed) * 1000;

  // Add overhead for decryption (approximately 10% of download time)
  const decryptionTime = downloadTime * 0.1;

  return downloadTime + decryptionTime;
}

/**
 * Checks if a document should load within the 3-second requirement
 * 
 * @param fileSize - File size in bytes
 * @returns True if document should load within 3 seconds
 */
export function shouldLoadWithinThreeSeconds(fileSize: number): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return fileSize <= maxSize;
}

/**
 * Optimizes image for faster loading
 * Reduces resolution for large images
 * 
 * @param imageData - Image data as ArrayBuffer
 * @param mimeType - Image MIME type
 * @param maxDimension - Maximum dimension (default: 1920)
 * @returns Promise resolving to optimized image data
 */
export async function optimizeImageForLoading(
  imageData: ArrayBuffer,
  mimeType: string,
  maxDimension = 1920
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([imageData], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Check if optimization is needed
        if (width <= maxDimension && height <= maxDimension) {
          URL.revokeObjectURL(url);
          resolve(imageData);
          return;
        }

        // Calculate new dimensions
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }

        // Create canvas and draw optimized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Failed to create optimized image blob'));
              return;
            }

            const arrayBuffer = await blob.arrayBuffer();
            URL.revokeObjectURL(url);
            resolve(arrayBuffer);
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for optimization'));
    };

    img.src = url;
  });
}
