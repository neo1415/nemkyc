/**
 * Verification Request Queue Manager
 * 
 * Handles queuing of verification requests during high load periods.
 * Processes requests in background and notifies users when complete.
 * 
 * Features:
 * - FIFO queue with priority support
 * - Configurable concurrency limits
 * - Automatic retry on failure
 * - Progress tracking
 * - User notifications on completion
 */

const admin = require('firebase-admin');
const { logBulkOperation } = require('./auditLogger.cjs');

// Queue configuration
const QUEUE_CONFIG = {
  maxConcurrent: 10,           // Maximum concurrent verifications
  maxQueueSize: 1000,          // Maximum queue size
  retryAttempts: 3,            // Number of retry attempts
  retryDelay: 2000,            // Delay between retries (ms)
  processingInterval: 100,     // Queue processing interval (ms)
  notificationThreshold: 5     // Notify user if queue time > X seconds
};

// In-memory queue (in production, use Redis or similar)
const verificationQueue = [];
const activeJobs = new Map();
let isProcessing = false;
let processingInterval = null;

/**
 * Queue item structure
 */
class QueueItem {
  constructor(data) {
    this.id = data.id || `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = data.type; // 'single' or 'bulk'
    this.priority = data.priority || 0; // Higher = more priority
    this.userId = data.userId;
    this.userEmail = data.userEmail;
    this.listId = data.listId;
    this.entryId = data.entryId; // For single verification
    this.entryIds = data.entryIds; // For bulk verification
    this.verificationType = data.verificationType;
    this.verificationFn = data.verificationFn; // Function to execute
    this.notifyOnComplete = data.notifyOnComplete !== false;
    this.metadata = data.metadata || {};
    
    // Status tracking
    this.status = 'queued';
    this.queuedAt = new Date();
    this.startedAt = null;
    this.completedAt = null;
    this.attempts = 0;
    this.maxAttempts = data.maxAttempts || QUEUE_CONFIG.retryAttempts;
    this.result = null;
    this.error = null;
  }
}

/**
 * Add item to queue
 * 
 * @param {Object} data - Queue item data
 * @returns {Object} - Queue item with ID and position
 */
function enqueue(data) {
  // Check queue size limit
  if (verificationQueue.length >= QUEUE_CONFIG.maxQueueSize) {
    throw new Error(`Queue is full (max ${QUEUE_CONFIG.maxQueueSize} items)`);
  }
  
  const item = new QueueItem(data);
  
  // Insert based on priority (higher priority first)
  let insertIndex = verificationQueue.length;
  for (let i = 0; i < verificationQueue.length; i++) {
    if (item.priority > verificationQueue[i].priority) {
      insertIndex = i;
      break;
    }
  }
  
  verificationQueue.splice(insertIndex, 0, item);
  
  console.log(`📥 Queued ${item.type} verification (ID: ${item.id}, Priority: ${item.priority}, Position: ${insertIndex + 1}/${verificationQueue.length})`);
  
  // Start processing if not already running
  if (!isProcessing) {
    startProcessing();
  }
  
  // Log to audit
  logBulkOperation({
    operation: 'queue_add',
    userId: item.userId,
    listId: item.listId,
    details: {
      queueId: item.id,
      type: item.type,
      priority: item.priority,
      queueSize: verificationQueue.length
    }
  }).catch(err => console.error('Failed to log queue add:', err));
  
  return {
    queueId: item.id,
    position: insertIndex + 1,
    queueSize: verificationQueue.length,
    estimatedWaitTime: estimateWaitTime(insertIndex),
    status: 'queued'
  };
}

/**
 * Get queue status
 * 
 * @param {string} queueId - Queue item ID
 * @returns {Object} - Queue item status
 */
function getQueueStatus(queueId) {
  // Check active jobs first
  if (activeJobs.has(queueId)) {
    const item = activeJobs.get(queueId);
    return {
      queueId: item.id,
      status: item.status,
      queuedAt: item.queuedAt,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      attempts: item.attempts,
      result: item.result,
      error: item.error
    };
  }
  
  // Check queue
  const queueIndex = verificationQueue.findIndex(item => item.id === queueId);
  if (queueIndex !== -1) {
    const item = verificationQueue[queueIndex];
    return {
      queueId: item.id,
      status: item.status,
      position: queueIndex + 1,
      queueSize: verificationQueue.length,
      estimatedWaitTime: estimateWaitTime(queueIndex),
      queuedAt: item.queuedAt
    };
  }
  
  return null;
}

/**
 * Get all queue items for a user
 * 
 * @param {string} userId - User ID
 * @returns {Array} - Array of queue items
 */
function getUserQueueItems(userId) {
  const items = [];
  
  // Get from queue
  verificationQueue.forEach((item, index) => {
    if (item.userId === userId) {
      items.push({
        queueId: item.id,
        type: item.type,
        status: item.status,
        position: index + 1,
        queuedAt: item.queuedAt,
        listId: item.listId
      });
    }
  });
  
  // Get from active jobs
  activeJobs.forEach(item => {
    if (item.userId === userId) {
      items.push({
        queueId: item.id,
        type: item.type,
        status: item.status,
        startedAt: item.startedAt,
        listId: item.listId
      });
    }
  });
  
  return items;
}

/**
 * Estimate wait time for queue position
 * 
 * @param {number} position - Position in queue
 * @returns {number} - Estimated wait time in seconds
 */
function estimateWaitTime(position) {
  // Assume average verification takes 2 seconds
  const avgVerificationTime = 2;
  const concurrentJobs = Math.min(QUEUE_CONFIG.maxConcurrent, activeJobs.size);
  const throughput = concurrentJobs > 0 ? concurrentJobs : 1;
  
  return Math.ceil((position * avgVerificationTime) / throughput);
}

/**
 * Start queue processing
 */
function startProcessing() {
  if (isProcessing) return;
  
  isProcessing = true;
  console.log('🚀 Starting verification queue processing');
  
  processingInterval = setInterval(async () => {
    try {
      await processQueue();
    } catch (error) {
      console.error('❌ Error processing queue:', error);
    }
  }, QUEUE_CONFIG.processingInterval);
}

/**
 * Stop queue processing
 */
function stopProcessing() {
  if (!isProcessing) return;
  
  isProcessing = false;
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
  
  console.log('⏹️ Stopped verification queue processing');
}

/**
 * Process queue items
 */
async function processQueue() {
  // Check if we can process more items
  if (activeJobs.size >= QUEUE_CONFIG.maxConcurrent) {
    return; // At capacity
  }
  
  // Get next item from queue
  if (verificationQueue.length === 0) {
    // Queue is empty, stop processing
    if (activeJobs.size === 0) {
      stopProcessing();
    }
    return;
  }
  
  // Process items up to concurrency limit
  const slotsAvailable = QUEUE_CONFIG.maxConcurrent - activeJobs.size;
  const itemsToProcess = Math.min(slotsAvailable, verificationQueue.length);
  
  for (let i = 0; i < itemsToProcess; i++) {
    const item = verificationQueue.shift();
    if (item) {
      processItem(item);
    }
  }
}

/**
 * Process a single queue item
 * 
 * @param {QueueItem} item - Queue item to process
 */
async function processItem(item) {
  item.status = 'processing';
  item.startedAt = new Date();
  item.attempts++;
  
  activeJobs.set(item.id, item);
  
  const waitTime = (item.startedAt - item.queuedAt) / 1000;
  console.log(`⚙️ Processing ${item.type} verification (ID: ${item.id}, Wait time: ${waitTime.toFixed(1)}s, Attempt: ${item.attempts}/${item.maxAttempts})`);
  
  try {
    // Execute verification function
    const result = await item.verificationFn();
    
    item.status = 'completed';
    item.completedAt = new Date();
    item.result = result;
    
    const processingTime = (item.completedAt - item.startedAt) / 1000;
    console.log(`✅ Completed ${item.type} verification (ID: ${item.id}, Processing time: ${processingTime.toFixed(1)}s)`);
    
    // Notify user if requested and wait time was significant
    if (item.notifyOnComplete && waitTime > QUEUE_CONFIG.notificationThreshold) {
      await notifyUser(item, 'completed');
    }
    
    // Log completion
    await logBulkOperation({
      operation: 'queue_complete',
      userId: item.userId,
      listId: item.listId,
      details: {
        queueId: item.id,
        type: item.type,
        waitTime: waitTime.toFixed(1),
        processingTime: processingTime.toFixed(1),
        attempts: item.attempts
      }
    });
    
  } catch (error) {
    console.error(`❌ Error processing ${item.type} verification (ID: ${item.id}):`, error.message);
    
    item.error = error.message;
    
    // Retry if attempts remaining
    if (item.attempts < item.maxAttempts) {
      console.log(`🔄 Retrying ${item.type} verification (ID: ${item.id}, Attempt ${item.attempts + 1}/${item.maxAttempts})`);
      
      // Re-queue with delay
      setTimeout(() => {
        item.status = 'queued';
        item.startedAt = null;
        activeJobs.delete(item.id);
        verificationQueue.unshift(item); // Add to front of queue
      }, QUEUE_CONFIG.retryDelay);
      
      return;
    }
    
    // Max attempts reached
    item.status = 'failed';
    item.completedAt = new Date();
    
    console.log(`💥 Failed ${item.type} verification after ${item.attempts} attempts (ID: ${item.id})`);
    
    // Notify user of failure
    if (item.notifyOnComplete) {
      await notifyUser(item, 'failed');
    }
    
    // Log failure
    await logBulkOperation({
      operation: 'queue_failed',
      userId: item.userId,
      listId: item.listId,
      details: {
        queueId: item.id,
        type: item.type,
        error: error.message,
        attempts: item.attempts
      }
    });
  }
  
  // Keep in active jobs for a while for status queries
  setTimeout(() => {
    activeJobs.delete(item.id);
  }, 300000); // 5 minutes
}

/**
 * Notify user of queue completion
 * 
 * @param {QueueItem} item - Queue item
 * @param {string} status - Completion status ('completed' or 'failed')
 */
async function notifyUser(item, status) {
  try {
    const db = admin.firestore();
    
    // Create notification document
    const notification = {
      userId: item.userId,
      type: 'verification_queue',
      status,
      queueId: item.id,
      listId: item.listId,
      verificationType: item.type,
      message: status === 'completed' 
        ? `Your ${item.type} verification request has been completed.`
        : `Your ${item.type} verification request failed after ${item.attempts} attempts.`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      metadata: {
        queuedAt: item.queuedAt,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        attempts: item.attempts,
        error: item.error
      }
    };
    
    await db.collection('notifications').add(notification);
    
    console.log(`📬 Notification sent to user ${item.userEmail} for queue item ${item.id}`);
    
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}

/**
 * Get queue statistics
 * 
 * @returns {Object} - Queue statistics
 */
function getQueueStats() {
  return {
    queueSize: verificationQueue.length,
    activeJobs: activeJobs.size,
    maxConcurrent: QUEUE_CONFIG.maxConcurrent,
    maxQueueSize: QUEUE_CONFIG.maxQueueSize,
    isProcessing,
    utilizationPercent: Math.round((activeJobs.size / QUEUE_CONFIG.maxConcurrent) * 100)
  };
}

/**
 * Clear completed jobs from memory
 */
function clearCompletedJobs() {
  const now = Date.now();
  const fiveMinutesAgo = now - 300000;
  
  let cleared = 0;
  activeJobs.forEach((item, id) => {
    if (item.completedAt && item.completedAt.getTime() < fiveMinutesAgo) {
      activeJobs.delete(id);
      cleared++;
    }
  });
  
  if (cleared > 0) {
    console.log(`🗑️ Cleared ${cleared} completed jobs from memory`);
  }
}

// Periodic cleanup of completed jobs
setInterval(clearCompletedJobs, 60000); // Every minute

module.exports = {
  enqueue,
  getQueueStatus,
  getUserQueueItems,
  getQueueStats,
  QUEUE_CONFIG
};
