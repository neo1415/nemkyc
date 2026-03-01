/**
 * Property-Based Tests for CAC Document Caching
 * 
 * **Property 16: Cache consistency**
 * **Validates: Requirements 10.2**
 * 
 * Tests that cached documents always match source documents using fast-check
 * to generate various caching scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  loadDocumentWithCache,
  loadDocumentsBatch,
  clearAllCaches,
  getCacheStats,
  generateThumbnail,
  loadThumbnailWithCache
} from '../../services/cacPerformanceOptimizer';
import { EncryptionMetadata } from '../../types/cacDocuments';
import * as cacStorageService from '../../services/cacStorageService';

// Mock the storage service
vi.mock('../../services/cacStorageService');

describe('Property 16: Cache Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearAllCaches();
  });

  // Arbitrary generator for encryption metadata
  const encryptionMetadataArbitrary = fc.record({
    algorithm: fc.constant('AES-256-GCM'),
    keyVersion: fc.constant('v1'),
    iv: fc.string({ minLength: 10, maxLength: 50 }),
    authTag: fc.string({ minLength: 10, maxLength: 50 })
  });

  // Arbitrary generator for document data
  const documentDataArbitrary = fc.uint8Array({ minLength: 100, maxLength: 5000 });

  // Arbitrary generator for storage paths
  const storagePathArbitrary = fc.string({ minLength: 10, maxLength: 100 }).map(
    (str) => `cac-documents/identity-${str}/document-${Date.now()}.pdf`
  );

  // Arbitrary generator for MIME types
  const mimeTypeArbitrary = fc.constantFrom('application/pdf', 'image/jpeg', 'image/png');

  describe('Cache consistency for single document loads', () => {
    it('should return identical data on repeated loads from cache', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;
            let fetchCount = 0;

            vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(async () => {
              fetchCount++;
              // Return a copy to ensure we're testing cache, not reference equality
              return originalData.slice(0);
            });

            // Act - Load document twice
            const firstLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert - Data should be identical
            const firstBytes = new Uint8Array(firstLoad);
            const secondBytes = new Uint8Array(secondLoad);

            expect(Array.from(firstBytes)).toEqual(Array.from(secondBytes));
            expect(firstLoad.byteLength).toBe(secondLoad.byteLength);
            expect(firstLoad.byteLength).toBe(originalData.byteLength);

            // Should only fetch once (second load uses cache)
            expect(fetchCount).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain data integrity across multiple cache hits', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          fc.integer({ min: 2, max: 10 }), // Number of loads
          async (dataArray, storagePath, encryptionMetadata, mimeType, loadCount) => {
            // Arrange
            const originalData = dataArray.buffer;
            const originalBytes = Array.from(new Uint8Array(originalData));

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act - Load document multiple times
            const loads: ArrayBuffer[] = [];
            for (let i = 0; i < loadCount; i++) {
              const data = await loadDocumentWithCache(
                storagePath,
                encryptionMetadata,
                mimeType,
                true
              );
              loads.push(data);
            }

            // Assert - All loads should return identical data
            loads.forEach((loadedData) => {
              const loadedBytes = Array.from(new Uint8Array(loadedData));
              expect(loadedBytes).toEqual(originalBytes);
              expect(loadedData.byteLength).toBe(originalData.byteLength);
            });

            // Should only fetch once
            expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should return identical data when cache is bypassed vs when cache is used', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act - Load without cache
            const uncachedLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              false // Bypass cache
            );

            // Load with cache
            const cachedLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert - Both should return identical data
            const uncachedBytes = Array.from(new Uint8Array(uncachedLoad));
            const cachedBytes = Array.from(new Uint8Array(cachedLoad));

            expect(cachedBytes).toEqual(uncachedBytes);
            expect(cachedLoad.byteLength).toBe(uncachedLoad.byteLength);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Cache consistency for batch document loads', () => {
    it('should return identical data for all documents in batch', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              data: documentDataArbitrary,
              storagePath: storagePathArbitrary,
              encryptionMetadata: encryptionMetadataArbitrary,
              mimeType: mimeTypeArbitrary
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (documents) => {
            // Arrange
            const originalDataMap = new Map<string, Uint8Array>();

            documents.forEach((doc) => {
              const originalData = doc.data.buffer;
              originalDataMap.set(doc.storagePath, new Uint8Array(originalData));

              vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(
                async (path) => {
                  if (path === doc.storagePath) {
                    return originalData.slice(0);
                  }
                  throw new Error('Unexpected path');
                }
              );
            });

            // Act - Load batch
            const requests = documents.map((doc) => ({
              storagePath: doc.storagePath,
              encryptionMetadata: doc.encryptionMetadata,
              mimeType: doc.mimeType
            }));

            const batchResults = await loadDocumentsBatch(requests);

            // Assert - Each result should match original data
            batchResults.forEach((result, index) => {
              const originalBytes = originalDataMap.get(documents[index].storagePath);
              const resultBytes = new Uint8Array(result);

              expect(Array.from(resultBytes)).toEqual(Array.from(originalBytes!));
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain consistency when loading same documents in different batches', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              data: documentDataArbitrary,
              storagePath: storagePathArbitrary,
              encryptionMetadata: encryptionMetadataArbitrary,
              mimeType: mimeTypeArbitrary
            }),
            { minLength: 2, maxLength: 4 }
          ),
          async (documents) => {
            // Arrange
            const dataMap = new Map<string, ArrayBuffer>();

            documents.forEach((doc) => {
              const data = doc.data.buffer;
              dataMap.set(doc.storagePath, data);
            });

            vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(
              async (path) => {
                const data = dataMap.get(path);
                if (data) {
                  return data.slice(0);
                }
                throw new Error('Document not found');
              }
            );

            // Act - Load first batch
            const firstBatch = await loadDocumentsBatch(
              documents.map((doc) => ({
                storagePath: doc.storagePath,
                encryptionMetadata: doc.encryptionMetadata,
                mimeType: doc.mimeType
              }))
            );

            // Load second batch (should use cache)
            const secondBatch = await loadDocumentsBatch(
              documents.map((doc) => ({
                storagePath: doc.storagePath,
                encryptionMetadata: doc.encryptionMetadata,
                mimeType: doc.mimeType
              }))
            );

            // Assert - Both batches should return identical data
            firstBatch.forEach((firstData, index) => {
              const secondData = secondBatch[index];
              const firstBytes = Array.from(new Uint8Array(firstData));
              const secondBytes = Array.from(new Uint8Array(secondData));

              expect(secondBytes).toEqual(firstBytes);
              expect(secondData.byteLength).toBe(firstData.byteLength);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Cache consistency across different document types', () => {
    it('should maintain consistency for PDF documents', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          async (dataArray, storagePath, encryptionMetadata) => {
            // Arrange
            const originalData = dataArray.buffer;
            const mimeType = 'application/pdf';

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act
            const firstLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert
            const firstBytes = Array.from(new Uint8Array(firstLoad));
            const secondBytes = Array.from(new Uint8Array(secondLoad));

            expect(secondBytes).toEqual(firstBytes);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain consistency for JPEG images', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          async (dataArray, storagePath, encryptionMetadata) => {
            // Arrange
            const originalData = dataArray.buffer;
            const mimeType = 'image/jpeg';

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act
            const firstLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert
            const firstBytes = Array.from(new Uint8Array(firstLoad));
            const secondBytes = Array.from(new Uint8Array(secondLoad));

            expect(secondBytes).toEqual(firstBytes);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain consistency for PNG images', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          async (dataArray, storagePath, encryptionMetadata) => {
            // Arrange
            const originalData = dataArray.buffer;
            const mimeType = 'image/png';

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act
            const firstLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert
            const firstBytes = Array.from(new Uint8Array(firstLoad));
            const secondBytes = Array.from(new Uint8Array(secondLoad));

            expect(secondBytes).toEqual(firstBytes);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Cache consistency across different document sizes', () => {
    it('should maintain consistency for small documents (< 1MB)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 100, maxLength: 1024 * 100 }), // Up to 100KB
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act
            const loads = await Promise.all([
              loadDocumentWithCache(storagePath, encryptionMetadata, mimeType, true),
              loadDocumentWithCache(storagePath, encryptionMetadata, mimeType, true),
              loadDocumentWithCache(storagePath, encryptionMetadata, mimeType, true)
            ]);

            // Assert - All loads should be identical
            const firstBytes = Array.from(new Uint8Array(loads[0]));
            loads.forEach((load) => {
              const loadBytes = Array.from(new Uint8Array(load));
              expect(loadBytes).toEqual(firstBytes);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain consistency for medium documents (1-5MB)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1024 * 1024, maxLength: 1024 * 1024 * 2 }), // 1-2MB
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act
            const firstLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert
            expect(firstLoad.byteLength).toBe(secondLoad.byteLength);
            expect(firstLoad.byteLength).toBe(originalData.byteLength);

            const firstBytes = Array.from(new Uint8Array(firstLoad));
            const secondBytes = Array.from(new Uint8Array(secondLoad));
            expect(secondBytes).toEqual(firstBytes);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Cache consistency after cache operations', () => {
    it('should maintain consistency after cache clear and reload', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;
            const originalBytes = Array.from(new Uint8Array(originalData));

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act - Load, clear cache, reload
            const firstLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            clearAllCaches();

            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert - Both loads should match original
            const firstBytes = Array.from(new Uint8Array(firstLoad));
            const secondBytes = Array.from(new Uint8Array(secondLoad));

            expect(firstBytes).toEqual(originalBytes);
            expect(secondBytes).toEqual(originalBytes);
            expect(secondBytes).toEqual(firstBytes);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain consistency when cache stats are queried', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act
            const firstLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Query cache stats (should not affect cache)
            const stats = getCacheStats();
            expect(stats.documentCache.count).toBeGreaterThan(0);

            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert - Data should still be consistent
            const firstBytes = Array.from(new Uint8Array(firstLoad));
            const secondBytes = Array.from(new Uint8Array(secondLoad));

            expect(secondBytes).toEqual(firstBytes);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Cache consistency for concurrent loads', () => {
    it('should maintain consistency when loading same document concurrently', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          fc.integer({ min: 2, max: 5 }), // Number of concurrent loads
          async (dataArray, storagePath, encryptionMetadata, mimeType, concurrentCount) => {
            // Arrange
            const originalData = dataArray.buffer;
            const originalBytes = Array.from(new Uint8Array(originalData));

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act - Load same document concurrently
            const loads = await Promise.all(
              Array.from({ length: concurrentCount }, () =>
                loadDocumentWithCache(storagePath, encryptionMetadata, mimeType, true)
              )
            );

            // Assert - All concurrent loads should return identical data
            loads.forEach((load) => {
              const loadBytes = Array.from(new Uint8Array(load));
              expect(loadBytes).toEqual(originalBytes);
              expect(load.byteLength).toBe(originalData.byteLength);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain consistency when loading different documents concurrently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              data: documentDataArbitrary,
              storagePath: storagePathArbitrary,
              encryptionMetadata: encryptionMetadataArbitrary,
              mimeType: mimeTypeArbitrary
            }),
            { minLength: 2, maxLength: 4 }
          ),
          async (documents) => {
            // Arrange
            const dataMap = new Map<string, Uint8Array>();

            documents.forEach((doc) => {
              const data = doc.data.buffer;
              dataMap.set(doc.storagePath, new Uint8Array(data));

              vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(
                async (path) => {
                  if (path === doc.storagePath) {
                    return data.slice(0);
                  }
                  throw new Error('Unexpected path');
                }
              );
            });

            // Act - Load all documents concurrently
            const loads = await Promise.all(
              documents.map((doc) =>
                loadDocumentWithCache(
                  doc.storagePath,
                  doc.encryptionMetadata,
                  doc.mimeType,
                  true
                )
              )
            );

            // Assert - Each load should match its original data
            loads.forEach((load, index) => {
              const originalBytes = dataMap.get(documents[index].storagePath);
              const loadBytes = Array.from(new Uint8Array(load));

              expect(loadBytes).toEqual(Array.from(originalBytes!));
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Cache consistency with thumbnail generation', () => {
    it('should maintain source data consistency when generating thumbnails', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          fc.constantFrom('image/jpeg', 'image/png'),
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Mock canvas and image for thumbnail generation
            const mockCanvas = {
              width: 0,
              height: 0,
              getContext: vi.fn(() => ({
                drawImage: vi.fn()
              })),
              toDataURL: vi.fn(() => 'data:image/jpeg;base64,mock')
            };

            global.document = {
              createElement: vi.fn(() => mockCanvas)
            } as any;

            global.Image = class MockImage {
              onload: (() => void) | null = null;
              onerror: (() => void) | null = null;
              src = '';
              width = 100;
              height = 100;

              constructor() {
                setTimeout(() => {
                  if (this.onload) this.onload();
                }, 0);
              }
            } as any;

            global.URL = {
              createObjectURL: vi.fn(() => 'blob:mock'),
              revokeObjectURL: vi.fn()
            } as any;

            // Act - Load document and generate thumbnail
            const documentLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Generate thumbnail (should not affect cached document)
            await generateThumbnail(documentLoad, mimeType);

            // Load document again
            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert - Document data should remain consistent
            const firstBytes = Array.from(new Uint8Array(documentLoad));
            const secondBytes = Array.from(new Uint8Array(secondLoad));

            expect(secondBytes).toEqual(firstBytes);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Cache consistency invariants', () => {
    it('should always return data with same byte length as original', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;
            const originalLength = originalData.byteLength;

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act - Load multiple times
            const loads = await Promise.all([
              loadDocumentWithCache(storagePath, encryptionMetadata, mimeType, true),
              loadDocumentWithCache(storagePath, encryptionMetadata, mimeType, true),
              loadDocumentWithCache(storagePath, encryptionMetadata, mimeType, true)
            ]);

            // Assert - All loads should have same byte length
            loads.forEach((load) => {
              expect(load.byteLength).toBe(originalLength);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should never corrupt data in cache', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentDataArbitrary,
          storagePathArbitrary,
          encryptionMetadataArbitrary,
          mimeTypeArbitrary,
          async (dataArray, storagePath, encryptionMetadata, mimeType) => {
            // Arrange
            const originalData = dataArray.buffer;
            const originalBytes = Array.from(new Uint8Array(originalData));

            vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(
              originalData.slice(0)
            );

            // Act - Load, perform operations, load again
            const firstLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Simulate some operations
            getCacheStats();
            
            const secondLoad = await loadDocumentWithCache(
              storagePath,
              encryptionMetadata,
              mimeType,
              true
            );

            // Assert - Data should never be corrupted
            const firstBytes = Array.from(new Uint8Array(firstLoad));
            const secondBytes = Array.from(new Uint8Array(secondLoad));

            expect(firstBytes).toEqual(originalBytes);
            expect(secondBytes).toEqual(originalBytes);

            // Verify no byte corruption
            firstBytes.forEach((byte, index) => {
              expect(byte).toBe(originalBytes[index]);
            });

            secondBytes.forEach((byte, index) => {
              expect(byte).toBe(originalBytes[index]);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain cache consistency across cache size limits', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              data: documentDataArbitrary,
              storagePath: storagePathArbitrary,
              encryptionMetadata: encryptionMetadataArbitrary,
              mimeType: mimeTypeArbitrary
            }),
            { minLength: 3, maxLength: 10 }
          ),
          async (documents) => {
            // Arrange
            const dataMap = new Map<string, Uint8Array>();

            documents.forEach((doc) => {
              const data = doc.data.buffer;
              dataMap.set(doc.storagePath, new Uint8Array(data));

              vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(
                async (path) => {
                  if (path === doc.storagePath) {
                    return data.slice(0);
                  }
                  throw new Error('Unexpected path');
                }
              );
            });

            // Act - Load all documents (may exceed cache size)
            const firstLoads = await Promise.all(
              documents.map((doc) =>
                loadDocumentWithCache(
                  doc.storagePath,
                  doc.encryptionMetadata,
                  doc.mimeType,
                  true
                )
              )
            );

            // Load again
            const secondLoads = await Promise.all(
              documents.map((doc) =>
                loadDocumentWithCache(
                  doc.storagePath,
                  doc.encryptionMetadata,
                  doc.mimeType,
                  true
                )
              )
            );

            // Assert - Data should be consistent even if some were evicted
            firstLoads.forEach((firstLoad, index) => {
              const secondLoad = secondLoads[index];
              const originalBytes = dataMap.get(documents[index].storagePath);

              const firstBytes = Array.from(new Uint8Array(firstLoad));
              const secondBytes = Array.from(new Uint8Array(secondLoad));

              // Both should match original
              expect(firstBytes).toEqual(Array.from(originalBytes!));
              expect(secondBytes).toEqual(Array.from(originalBytes!));
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
