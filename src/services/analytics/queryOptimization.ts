/**
 * Query Optimization Utilities for Analytics Dashboard
 * Implements caching, pagination, and performance optimizations
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface QueryCacheOptions {
  ttlMs?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
}

/**
 * Query Result Cache
 * Caches query results in browser storage with TTL
 */
export class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(options: QueryCacheOptions = {}) {
    this.ttlMs = options.ttlMs || 5 * 60 * 1000; // Default 5 minutes
    this.maxSize = options.maxSize || 100; // Default 100 entries

    // Load cache from sessionStorage on initialization
    this.loadFromStorage();
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const now = Date.now();
    const ttl = ttlMs || this.ttlMs;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, entry);
    this.saveToStorage();
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.saveToStorage();
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Get oldest cache key
   */
  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Save cache to sessionStorage
   */
  private saveToStorage(): void {
    try {
      const cacheData: Record<string, CacheEntry<any>> = {};
      
      for (const [key, entry] of this.cache.entries()) {
        cacheData[key] = entry;
      }

      sessionStorage.setItem('analytics-query-cache', JSON.stringify(cacheData));
    } catch (error) {
      // Storage quota exceeded or not available
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Load cache from sessionStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('analytics-query-cache');
      
      if (!stored) {
        return;
      }

      const cacheData: Record<string, CacheEntry<any>> = JSON.parse(stored);
      const now = Date.now();

      for (const [key, entry] of Object.entries(cacheData)) {
        // Only load non-expired entries
        if (now <= entry.expiresAt) {
          this.cache.set(key, entry);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
}

/**
 * Pagination Helper
 * Manages pagination state and calculations
 */
export class PaginationHelper {
  /**
   * Calculate pagination state
   */
  static calculatePagination(
    totalItems: number,
    currentPage: number,
    pageSize: number
  ): PaginationState {
    const totalPages = Math.ceil(totalItems / pageSize);
    const safePage = Math.max(1, Math.min(currentPage, totalPages));

    return {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  /**
   * Get items for current page
   */
  static getPageItems<T>(
    items: T[],
    page: number,
    pageSize: number
  ): T[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }

  /**
   * Calculate offset for Firestore queries
   */
  static getQueryOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }

  /**
   * Check if there are more pages
   */
  static hasNextPage(pagination: PaginationState): boolean {
    return pagination.page < pagination.totalPages;
  }

  /**
   * Check if there are previous pages
   */
  static hasPreviousPage(pagination: PaginationState): boolean {
    return pagination.page > 1;
  }
}

/**
 * Query Batching Helper
 * Batches multiple queries to reduce Firestore reads
 */
export class QueryBatcher {
  private pendingQueries: Map<string, Promise<any>> = new Map();

  /**
   * Execute query with deduplication
   * If the same query is already pending, return the existing promise
   */
  async execute<T>(
    key: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    // Check if query is already pending
    const pending = this.pendingQueries.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Execute query and store promise
    const promise = queryFn().finally(() => {
      this.pendingQueries.delete(key);
    });

    this.pendingQueries.set(key, promise);
    return promise;
  }

  /**
   * Clear all pending queries
   */
  clear(): void {
    this.pendingQueries.clear();
  }
}

/**
 * Loading State Manager
 * Manages loading states for multiple concurrent operations
 */
export class LoadingStateManager {
  private loadingOperations: Set<string> = new Set();
  private listeners: Set<(isLoading: boolean) => void> = new Set();

  /**
   * Start loading operation
   */
  startLoading(operationId: string): void {
    this.loadingOperations.add(operationId);
    this.notifyListeners();
  }

  /**
   * Stop loading operation
   */
  stopLoading(operationId: string): void {
    this.loadingOperations.delete(operationId);
    this.notifyListeners();
  }

  /**
   * Check if any operation is loading
   */
  isLoading(): boolean {
    return this.loadingOperations.size > 0;
  }

  /**
   * Check if specific operation is loading
   */
  isOperationLoading(operationId: string): boolean {
    return this.loadingOperations.has(operationId);
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(listener: (isLoading: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const isLoading = this.isLoading();
    this.listeners.forEach(listener => listener(isLoading));
  }

  /**
   * Clear all loading operations
   */
  clear(): void {
    this.loadingOperations.clear();
    this.notifyListeners();
  }
}

// Singleton instances
export const queryCache = new QueryCache();
export const queryBatcher = new QueryBatcher();
export const loadingStateManager = new LoadingStateManager();

/**
 * Generate cache key from query parameters
 */
export function generateCacheKey(
  collection: string,
  filters: Record<string, any>
): string {
  const sortedFilters = Object.keys(filters)
    .sort()
    .map(key => `${key}:${JSON.stringify(filters[key])}`)
    .join('|');

  return `${collection}:${sortedFilters}`;
}

/**
 * Debounce function for query optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}
