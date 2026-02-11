/**
 * Tests for verification queue manager
 */

const {
  enqueue,
  getQueueStatus,
  getUserQueueItems,
  getQueueStats,
  QUEUE_CONFIG
} = require('../verificationQueue.cjs');

// Mock admin and audit logger
jest.mock('firebase-admin', () => ({
  firestore: () => ({
    collection: () => ({
      add: jest.fn().mockResolvedValue({ id: 'test-notification-id' })
    }),
    FieldValue: {
      serverTimestamp: jest.fn()
    }
  })
}));

jest.mock('../auditLogger.cjs', () => ({
  logBulkOperation: jest.fn().mockResolvedValue(undefined)
}));

describe('Verification Queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueue', () => {
    it('should enqueue a verification request', () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true });
      
      const result = enqueue({
        type: 'single',
        userId: 'user123',
        userEmail: 'test@example.com',
        listId: 'list123',
        entryId: 'entry123',
        verificationType: 'NIN',
        verificationFn: mockFn
      });

      expect(result).toHaveProperty('queueId');
      expect(result).toHaveProperty('position');
      expect(result).toHaveProperty('queueSize');
      expect(result).toHaveProperty('estimatedWaitTime');
      expect(result.status).toBe('queued');
    });

    it('should respect priority ordering', () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true });
      
      // Add low priority item
      const result1 = enqueue({
        type: 'single',
        userId: 'user1',
        userEmail: 'user1@example.com',
        listId: 'list1',
        priority: 0,
        verificationFn: mockFn
      });

      // Add high priority item
      const result2 = enqueue({
        type: 'single',
        userId: 'user2',
        userEmail: 'user2@example.com',
        listId: 'list2',
        priority: 10,
        verificationFn: mockFn
      });

      // High priority should be first
      expect(result2.position).toBe(1);
      expect(result1.position).toBe(2);
    });

    it('should throw error when queue is full', () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true });
      
      // Fill queue to max
      for (let i = 0; i < QUEUE_CONFIG.maxQueueSize; i++) {
        try {
          enqueue({
            type: 'single',
            userId: `user${i}`,
            userEmail: `user${i}@example.com`,
            listId: `list${i}`,
            verificationFn: mockFn
          });
        } catch (err) {
          // Queue might start processing, ignore errors
        }
      }

      // Next enqueue should fail
      expect(() => {
        enqueue({
          type: 'single',
          userId: 'overflow',
          userEmail: 'overflow@example.com',
          listId: 'overflow',
          verificationFn: mockFn
        });
      }).toThrow('Queue is full');
    });
  });

  describe('getQueueStatus', () => {
    it('should return status for queued item', () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true });
      
      const result = enqueue({
        type: 'single',
        userId: 'user123',
        userEmail: 'test@example.com',
        listId: 'list123',
        verificationFn: mockFn
      });

      const status = getQueueStatus(result.queueId);
      
      expect(status).toBeTruthy();
      expect(status.queueId).toBe(result.queueId);
      expect(status.status).toBe('queued');
    });

    it('should return null for non-existent queue item', () => {
      const status = getQueueStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('getUserQueueItems', () => {
    it('should return all items for a user', () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true });
      
      enqueue({
        type: 'single',
        userId: 'user123',
        userEmail: 'test@example.com',
        listId: 'list1',
        verificationFn: mockFn
      });

      enqueue({
        type: 'bulk',
        userId: 'user123',
        userEmail: 'test@example.com',
        listId: 'list2',
        verificationFn: mockFn
      });

      enqueue({
        type: 'single',
        userId: 'user456',
        userEmail: 'other@example.com',
        listId: 'list3',
        verificationFn: mockFn
      });

      const items = getUserQueueItems('user123');
      
      expect(items).toHaveLength(2);
      expect(items.every(item => item.userId === 'user123')).toBe(true);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', () => {
      const stats = getQueueStats();
      
      expect(stats).toHaveProperty('queueSize');
      expect(stats).toHaveProperty('activeJobs');
      expect(stats).toHaveProperty('maxConcurrent');
      expect(stats).toHaveProperty('maxQueueSize');
      expect(stats).toHaveProperty('isProcessing');
      expect(stats).toHaveProperty('utilizationPercent');
      
      expect(typeof stats.queueSize).toBe('number');
      expect(typeof stats.activeJobs).toBe('number');
      expect(typeof stats.utilizationPercent).toBe('number');
    });
  });
});
