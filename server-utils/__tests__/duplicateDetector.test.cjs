/**
 * Unit Tests for Duplicate Detector
 * 
 * Tests the duplicate detection functionality including:
 * - Cross-list duplicate detection
 * - Encrypted identity handling
 * - Caching behavior
 * - Batch checking
 * - Error handling
 */

const crypto = require('crypto');

// Set up encryption key before importing modules
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

// Mock firebase-admin before importing
const mockGet = vi.fn();
const mockLimit = vi.fn(() => ({ get: mockGet }));
const mockWhere = vi.fn(() => ({ 
  where: mockWhere,
  limit: mockLimit,
  get: mockGet
}));
const mockCollection = vi.fn(() => ({
  where: mockWhere
}));

const mockFirestore = {
  collection: mockCollection
};

vi.mock('firebase-admin', () => ({
  default: {
    firestore: () => mockFirestore,
    initializeApp: vi.fn()
  },
  firestore: () => mockFirestore,
  initializeApp: vi.fn()
}));

const { checkDuplicate, batchCheckDuplicates, clearCache, getCacheStats } = require('../duplicateDetector.cjs');
const { encryptData } = require('../encryption.cjs');

describe('duplicateDetector', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
    
    // Reset mocks
    vi.clearAllMocks();
    mockGet.mockReset();
    mockLimit.mockReset();
    mockWhere.mockReset();
    mockCollection.mockReset();
    
    // Re-establish mock chain
    mockGet.mockReturnValue(Promise.resolve({ docs: [] }));
    mockLimit.mockReturnValue({ get: mockGet });
    mockWhere.mockReturnValue({ 
      where: mockWhere,
      limit: mockLimit,
      get: mockGet
    });
    mockCollection.mockReturnValue({
      where: mockWhere
    });
  });
  
  describe('checkDuplicate', () => {
    test('should return isDuplicate=false when no matching verified entry exists', async () => {
      // Mock empty result
      mockGet.mockResolvedValue({
        docs: []
      });
      
      const result = await checkDuplicate('NIN', '12345678901');
      
      expect(result.isDuplicate).toBe(false);
      expect(result.originalListId).toBeNull();
      expect(result.originalEntryId).toBeNull();
      expect(result.originalVerificationDate).toBeNull();
      expect(result.originalBroker).toBeNull();
      expect(result.originalResult).toBeNull();
    });
    
    test('should return isDuplicate=true when matching verified entry exists', async () => {
      const mockEntry = {
        listId: 'list-123',
        status: 'verified',
        data: {
          nin: '12345678901'
        },
        verifiedAt: { toDate: () => new Date('2024-01-01') },
        verifiedBy: 'user-456',
        verificationResult: { success: true, name: 'John Doe' }
      };
      
      mockGet.mockResolvedValue({
        docs: [
          {
            id: 'entry-789',
            data: () => mockEntry
          }
        ]
      });
      
      const result = await checkDuplicate('NIN', '12345678901');
      
      expect(result.isDuplicate).toBe(true);
      expect(result.originalListId).toBe('list-123');
      expect(result.originalEntryId).toBe('entry-789');
      expect(result.originalVerificationDate).toEqual(new Date('2024-01-01'));
      expect(result.originalBroker).toBe('user-456');
      expect(result.originalResult).toEqual({ success: true, name: 'John Doe' });
    });
    
    test('should handle encrypted identity values', async () => {
      const plainValue = '12345678901';
      const encrypted = encryptData(plainValue);
      
      const mockEntry = {
        listId: 'list-123',
        status: 'verified',
        data: {
          nin: encrypted
        },
        verifiedAt: { toDate: () => new Date('2024-01-01') },
        verifiedBy: 'user-456'
      };
      
      mockGet.mockResolvedValue({
        docs: [
          {
            id: 'entry-789',
            data: () => mockEntry
          }
        ]
      });
      
      // Check with encrypted value
      const result = await checkDuplicate('NIN', encrypted);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.originalEntryId).toBe('entry-789');
    });
    
    test('should check both nested and top-level identity fields', async () => {
      const mockEntry = {
        listId: 'list-123',
        status: 'verified',
        nin: '12345678901', // Top-level field
        verifiedAt: { toDate: () => new Date('2024-01-01') }
      };
      
      mockGet.mockResolvedValue({
        docs: [
          {
            id: 'entry-789',
            data: () => mockEntry
          }
        ]
      });
      
      const result = await checkDuplicate('NIN', '12345678901');
      
      expect(result.isDuplicate).toBe(true);
      expect(result.originalEntryId).toBe('entry-789');
    });
    
    test('should cache duplicate check results', async () => {
      const mockEntry = {
        listId: 'list-123',
        status: 'verified',
        data: { nin: '12345678901' },
        verifiedAt: { toDate: () => new Date('2024-01-01') }
      };
      
      mockGet.mockResolvedValue({
        docs: [
          {
            id: 'entry-789',
            data: () => mockEntry
          }
        ]
      });
      
      // First call - should query database
      await checkDuplicate('NIN', '12345678901');
      expect(mockGet).toHaveBeenCalledTimes(2); // Once for limit query, once for all verified
      
      // Second call - should use cache
      mockGet.mockClear();
      const result = await checkDuplicate('NIN', '12345678901');
      expect(mockGet).not.toHaveBeenCalled();
      expect(result.isDuplicate).toBe(true);
      
      // Verify cache stats
      const stats = getCacheStats();
      expect(stats.validEntries).toBe(1);
    });
    
    test('should handle decryption errors gracefully', async () => {
      const invalidEncrypted = {
        encrypted: 'invalid-base64',
        iv: 'invalid-iv'
      };
      
      mockGet.mockResolvedValue({
        docs: []
      });
      
      const result = await checkDuplicate('NIN', invalidEncrypted);
      
      // Should fail-open and return non-duplicate
      expect(result.isDuplicate).toBe(false);
    });
    
    test('should handle database errors gracefully', async () => {
      mockGet.mockRejectedValue(new Error('Database connection failed'));
      
      const result = await checkDuplicate('NIN', '12345678901');
      
      // Should fail-open and return non-duplicate
      expect(result.isDuplicate).toBe(false);
    });
    
    test('should work with BVN identity type', async () => {
      const mockEntry = {
        listId: 'list-123',
        status: 'verified',
        data: { bvn: '98765432109' },
        verifiedAt: { toDate: () => new Date('2024-01-01') }
      };
      
      mockGet.mockResolvedValue({
        docs: [
          {
            id: 'entry-789',
            data: () => mockEntry
          }
        ]
      });
      
      const result = await checkDuplicate('BVN', '98765432109');
      
      expect(result.isDuplicate).toBe(true);
    });
    
    test('should work with CAC identity type', async () => {
      const mockEntry = {
        listId: 'list-123',
        status: 'verified',
        data: { cac: 'RC123456' },
        verifiedAt: { toDate: () => new Date('2024-01-01') }
      };
      
      mockGet.mockResolvedValue({
        docs: [
          {
            id: 'entry-789',
            data: () => mockEntry
          }
        ]
      });
      
      const result = await checkDuplicate('CAC', 'RC123456');
      
      expect(result.isDuplicate).toBe(true);
    });
  });
  
  describe('batchCheckDuplicates', () => {
    test('should check multiple identities efficiently', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          data: () => ({
            listId: 'list-123',
            status: 'verified',
            data: { nin: '11111111111' },
            verifiedAt: { toDate: () => new Date('2024-01-01') }
          })
        },
        {
          id: 'entry-2',
          data: () => ({
            listId: 'list-456',
            status: 'verified',
            data: { bvn: '22222222222' },
            verifiedAt: { toDate: () => new Date('2024-01-02') }
          })
        }
      ];
      
      mockGet.mockResolvedValue({
        docs: mockEntries
      });
      
      const identities = [
        { type: 'NIN', value: '11111111111', entryId: 'check-1' },
        { type: 'BVN', value: '22222222222', entryId: 'check-2' },
        { type: 'CAC', value: 'RC999999', entryId: 'check-3' }
      ];
      
      const results = await batchCheckDuplicates(identities);
      
      expect(results.size).toBe(3);
      expect(results.get('check-1').isDuplicate).toBe(true);
      expect(results.get('check-2').isDuplicate).toBe(true);
      expect(results.get('check-3').isDuplicate).toBe(false);
    });
    
    test('should use cache for batch checks', async () => {
      const mockEntry = {
        listId: 'list-123',
        status: 'verified',
        data: { nin: '11111111111' },
        verifiedAt: { toDate: () => new Date('2024-01-01') }
      };
      
      mockGet.mockResolvedValue({
        docs: [
          {
            id: 'entry-1',
            data: () => mockEntry
          }
        ]
      });
      
      // First batch check - should query database
      const identities1 = [
        { type: 'NIN', value: '11111111111', entryId: 'check-1' }
      ];
      await batchCheckDuplicates(identities1);
      
      // Second batch check with same identity - should use cache
      mockGet.mockClear();
      const identities2 = [
        { type: 'NIN', value: '11111111111', entryId: 'check-2' }
      ];
      const results = await batchCheckDuplicates(identities2);
      
      expect(mockGet).not.toHaveBeenCalled();
      expect(results.get('check-2').isDuplicate).toBe(true);
    });
    
    test('should handle encrypted values in batch', async () => {
      const plainValue = '11111111111';
      const encrypted = encryptData(plainValue);
      
      const mockEntry = {
        listId: 'list-123',
        status: 'verified',
        data: { nin: encrypted },
        verifiedAt: { toDate: () => new Date('2024-01-01') }
      };
      
      mockGet.mockResolvedValue({
        docs: [
          {
            id: 'entry-1',
            data: () => mockEntry
          }
        ]
      });
      
      const identities = [
        { type: 'NIN', value: encrypted, entryId: 'check-1' }
      ];
      
      const results = await batchCheckDuplicates(identities);
      
      expect(results.get('check-1').isDuplicate).toBe(true);
    });
    
    test('should handle errors gracefully in batch mode', async () => {
      mockGet.mockRejectedValue(new Error('Database error'));
      
      const identities = [
        { type: 'NIN', value: '11111111111', entryId: 'check-1' },
        { type: 'BVN', value: '22222222222', entryId: 'check-2' }
      ];
      
      const results = await batchCheckDuplicates(identities);
      
      // Should fail-open and return non-duplicate for all
      expect(results.size).toBe(2);
      expect(results.get('check-1').isDuplicate).toBe(false);
      expect(results.get('check-2').isDuplicate).toBe(false);
    });
  });
  
  describe('cache management', () => {
    test('should provide cache statistics', async () => {
      clearCache();
      
      const stats = getCacheStats();
      
      expect(stats.totalEntries).toBe(0);
      expect(stats.validEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.maxSize).toBe(10000);
      expect(stats.ttlMs).toBe(5 * 60 * 1000);
    });
    
    test('should clear cache', async () => {
      mockGet.mockResolvedValue({
        docs: []
      });
      
      // Add some entries to cache
      await checkDuplicate('NIN', '11111111111');
      await checkDuplicate('BVN', '22222222222');
      
      let stats = getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
      
      // Clear cache
      clearCache();
      
      stats = getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });
  });
});
