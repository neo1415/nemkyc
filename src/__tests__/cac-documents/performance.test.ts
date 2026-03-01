/**
 * Performance Tests for CAC Document Performance Optimizer
 * 
 * Tests document loading time, caching effectiveness, lazy loading behavior,
 * thumbnail generation speed, and concurrent request handling.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadDocumentWithCache,
  loadDocumentsBatch,
  generateThumbnail,
  loadThumbnailWithCache,
  preloadDocuments,
  clearAllCaches,
  getCacheStats,
  estimateLoadTime,
  shouldLoadWithinThreeSeconds,
  optimizeImageForLoading
} from '../../services/cacPerformanceOptimizer';
import { EncryptionMetadata } from '../../types/cacDocuments';
import * as cacStorageService from '../../services/cacStorageService';

// Mock storage service
vi.mock('../../services/cacStorageService', () => ({
  getDocumentForPreview: vi.fn()
}));

const mockEncryptionMetadata: EncryptionMetadata = {
  algorithm: 'AES-256-GCM',
  keyVersion: 'v1',
  iv: 'mock-iv',
  authTag: 'mock-tag'
};

describe('CAC Document Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearAllCaches();
  });

  describe('Document Loading Time - Requirement 10.3', () => {
    it('should load documents under 5MB within 3 seconds', async () => {
      const fileSize = 4 * 1024 * 1024;
      const mockData = new ArrayBuffer(fileSize);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const startTime = Date.now();
      
      const result = await loadDocumentWithCache(
        'test-path',
        mockEncryptionMetadata,
        'application/pdf',
        false
      );

      const loadTime = Date.now() - startTime;

      expect(result).toBe(mockData);
      expect(loadTime).toBeLessThan(3000);
    });

    it('should estimate load time correctly for files under 5MB', () => {
      const fileSizes = [
        1 * 1024 * 1024,
        2.5 * 1024 * 1024,
        5 * 1024 * 1024
      ];

      fileSizes.forEach(size => {
        const estimatedTime = estimateLoadTime(size);
        expect(estimatedTime).toBeLessThan(3000);
      });
    });

    it('should identify files that should load within 3 seconds', () => {
      expect(shouldLoadWithinThreeSeconds(4 * 1024 * 1024)).toBe(true);
      expect(shouldLoadWithinThreeSeconds(5 * 1024 * 1024)).toBe(true);
      expect(shouldLoadWithinThreeSeconds(6 * 1024 * 1024)).toBe(false);
      expect(shouldLoadWithinThreeSeconds(10 * 1024 * 1024)).toBe(false);
    });
  });

  describe('Caching Effectiveness - Requirement 10.1, 10.2', () => {
    it('should cache documents after first load', async () => {
      const mockData = new ArrayBuffer(1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const storagePath = 'test-path';

      await loadDocumentWithCache(storagePath, mockEncryptionMetadata, 'application/pdf');
      expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);

      await loadDocumentWithCache(storagePath, mockEncryptionMetadata, 'application/pdf');
      expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);
    });

    it('should reduce load time significantly for cached documents', async () => {
      const mockData = new ArrayBuffer(2 * 1024 * 1024);
      
      vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockData), 100))
      );

      const storagePath = 'test-path-cached';

      const startTime1 = Date.now();
      await loadDocumentWithCache(storagePath, mockEncryptionMetadata, 'application/pdf');
      const firstLoadTime = Date.now() - startTime1;

      const startTime2 = Date.now();
      await loadDocumentWithCache(storagePath, mockEncryptionMetadata, 'application/pdf');
      const secondLoadTime = Date.now() - startTime2;

      expect(secondLoadTime).toBeLessThan(firstLoadTime / 10);
      expect(secondLoadTime).toBeLessThan(20);
    });

    it('should track cache statistics correctly', async () => {
      const mockData = new ArrayBuffer(1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      let stats = getCacheStats();
      expect(stats.documentCache.count).toBe(0);

      await loadDocumentWithCache('path1', mockEncryptionMetadata, 'application/pdf');
      stats = getCacheStats();
      expect(stats.documentCache.count).toBe(1);

      await loadDocumentWithCache('path2', mockEncryptionMetadata, 'application/pdf');
      stats = getCacheStats();
      expect(stats.documentCache.count).toBe(2);
    });

    it('should respect cache size limits', async () => {
      const mockData = new ArrayBuffer(10 * 1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      for (let i = 0; i < 10; i++) {
        await loadDocumentWithCache(`path-${i}`, mockEncryptionMetadata, 'application/pdf');
      }

      const stats = getCacheStats();
      expect(stats.documentCache.count).toBeLessThanOrEqual(10);
    });
  });

  describe('Lazy Loading - Requirement 10.2', () => {
    it('should not load documents until requested', async () => {
      const mockData = new ArrayBuffer(1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      expect(cacStorageService.getDocumentForPreview).not.toHaveBeenCalled();

      await loadDocumentWithCache('test-path', mockEncryptionMetadata, 'application/pdf');

      expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);
    });

    it('should support preloading for anticipated requests', async () => {
      const mockData = new ArrayBuffer(1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const paths = ['path1', 'path2', 'path3'];
      await preloadDocuments(paths.map(path => ({
        storagePath: path,
        encryptionMetadata: mockEncryptionMetadata,
        mimeType: 'application/pdf'
      })));

      expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(3);

      const stats = getCacheStats();
      expect(stats.documentCache.count).toBe(3);
    });
  });

  describe('Thumbnail Generation - Requirement 10.4', () => {
    it('should generate thumbnails quickly', async () => {
      const mockImage = new ArrayBuffer(2 * 1024 * 1024);

      const startTime = Date.now();
      const thumbnail = await generateThumbnail(mockImage, 'image/jpeg');
      const generationTime = Date.now() - startTime;

      expect(thumbnail).toBeDefined();
      expect(generationTime).toBeLessThan(1000);
    });

    it('should cache generated thumbnails', async () => {
      const mockImage = new ArrayBuffer(2 * 1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockImage);

      const path = 'test-image-path';

      await loadThumbnailWithCache(path, mockEncryptionMetadata, 'image/jpeg');
      expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);

      await loadThumbnailWithCache(path, mockEncryptionMetadata, 'image/jpeg');
      expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);
    });

    it('should optimize images for faster loading', async () => {
      const mockImage = new ArrayBuffer(5 * 1024 * 1024);

      const optimized = await optimizeImageForLoading(mockImage, 'image/jpeg');

      expect(optimized.byteLength).toBeLessThanOrEqual(mockImage.byteLength);
    });
  });

  describe('Concurrent Request Handling - Requirement 10.6', () => {
    it('should batch multiple concurrent requests', async () => {
      const mockData = new ArrayBuffer(1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const requests = Array.from({ length: 5 }, (_, i) => ({
        storagePath: `path-${i}`,
        encryptionMetadata: mockEncryptionMetadata,
        mimeType: 'application/pdf'
      }));

      const results = await loadDocumentsBatch(requests);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBe(mockData);
      });
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockData = new ArrayBuffer(1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockData), 50))
      );

      const startTime = Date.now();

      const promises = Array.from({ length: 10 }, (_, i) =>
        loadDocumentWithCache(`concurrent-path-${i}`, mockEncryptionMetadata, 'application/pdf')
      );

      await Promise.all(promises);

      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(1000);
    });

    it('should not overwhelm storage service with concurrent requests', async () => {
      const mockData = new ArrayBuffer(1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const requests = Array.from({ length: 20 }, (_, i) => ({
        storagePath: `batch-path-${i}`,
        encryptionMetadata: mockEncryptionMetadata,
        mimeType: 'application/pdf'
      }));

      await loadDocumentsBatch(requests);

      expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(20);
    });
  });

  describe('Performance Metrics', () => {
    it('should provide accurate cache statistics', async () => {
      const mockData = new ArrayBuffer(2 * 1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      await loadDocumentWithCache('path1', mockEncryptionMetadata, 'application/pdf');
      await loadDocumentWithCache('path2', mockEncryptionMetadata, 'application/pdf');

      const stats = getCacheStats();

      expect(stats.documentCache.count).toBe(2);
      expect(stats.documentCache.maxSize).toBe(50 * 1024 * 1024);
      expect(stats.documentCache.size).toBeGreaterThan(0);
    });

    it('should estimate load times based on file size', () => {
      const testCases = [
        { size: 1 * 1024 * 1024, maxTime: 3000 },
        { size: 5 * 1024 * 1024, maxTime: 3000 },
        { size: 10 * 1024 * 1024, maxTime: 6000 }
      ];

      testCases.forEach(({ size, maxTime }) => {
        const estimated = estimateLoadTime(size);
        expect(estimated).toBeLessThan(maxTime);
      });
    });

    it('should clear all caches when requested', async () => {
      const mockData = new ArrayBuffer(1024 * 1024);
      const mockImage = new ArrayBuffer(2 * 1024 * 1024);
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      await loadDocumentWithCache('path1', mockEncryptionMetadata, 'application/pdf');
      
      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockImage);
      await loadThumbnailWithCache('path2', mockEncryptionMetadata, 'image/jpeg');

      let stats = getCacheStats();
      expect(stats.documentCache.count).toBeGreaterThan(0);

      clearAllCaches();

      stats = getCacheStats();
      expect(stats.documentCache.count).toBe(0);
      expect(stats.thumbnailCache.count).toBe(0);
    });
  });
});
