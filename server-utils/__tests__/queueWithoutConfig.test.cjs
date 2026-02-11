/**
 * Test: Queue functionality works without QUEUE_CONFIG import in server.js
 * 
 * This test validates Requirement 8.5: The Server SHALL ensure queue 
 * functionality works correctly regardless of QUEUE_CONFIG usage.
 * 
 * The queue module encapsulates its configuration internally, so server.js
 * does not need to import QUEUE_CONFIG to use queue operations.
 * 
 * This test verifies that the queue module exports all necessary functions
 * and that QUEUE_CONFIG is not required by server.js consumers.
 */

describe('Queue Module Exports Without QUEUE_CONFIG', () => {
  it('should export all required queue functions', () => {
    // Simulate server.js import without QUEUE_CONFIG
    const queueModule = require('../verificationQueue.cjs');
    
    // Verify all required functions are exported
    expect(typeof queueModule.enqueue).toBe('function');
    expect(typeof queueModule.getQueueStatus).toBe('function');
    expect(typeof queueModule.getUserQueueItems).toBe('function');
    expect(typeof queueModule.getQueueStats).toBe('function');
  });

  it('should allow destructuring without QUEUE_CONFIG', () => {
    // This is how server.js imports the queue module
    const {
      enqueue,
      getQueueStatus,
      getUserQueueItems,
      getQueueStats
    } = require('../verificationQueue.cjs');
    
    // Verify all functions are available
    expect(enqueue).toBeDefined();
    expect(getQueueStatus).toBeDefined();
    expect(getUserQueueItems).toBeDefined();
    expect(getQueueStats).toBeDefined();
    
    // Verify they are functions
    expect(typeof enqueue).toBe('function');
    expect(typeof getQueueStatus).toBe('function');
    expect(typeof getUserQueueItems).toBe('function');
    expect(typeof getQueueStats).toBe('function');
  });

  it('should not require QUEUE_CONFIG for basic queue operations', () => {
    // Import without QUEUE_CONFIG (as server.js now does)
    const {
      enqueue,
      getQueueStatus,
      getUserQueueItems,
      getQueueStats
    } = require('../verificationQueue.cjs');
    
    // Verify getQueueStats works without QUEUE_CONFIG
    // This function should return stats that include maxQueueSize
    // which comes from QUEUE_CONFIG internally
    expect(() => {
      const stats = getQueueStats();
      expect(stats).toHaveProperty('maxQueueSize');
      expect(typeof stats.maxQueueSize).toBe('number');
    }).not.toThrow();
  });
});

