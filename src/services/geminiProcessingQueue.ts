// Processing queue and concurrency management for Gemini Document Verification

import { DocumentVerificationResult, ProcessingStatus } from '@/types/geminiDocumentVerification';
import { geminiMonitoring } from './geminiMonitoring';

export interface QueuedDocument {
  id: string;
  file: File;
  documentType: 'CAC' | 'Individual';
  formData: any;
  priority: number;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  onComplete?: (result: DocumentVerificationResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface ProcessingWorker {
  id: string;
  busy: boolean;
  currentDocument?: QueuedDocument;
  startTime?: Date;
  processedCount: number;
}

export interface QueueStats {
  queueLength: number;
  activeWorkers: number;
  totalWorkers: number;
  processedToday: number;
  averageProcessingTime: number;
  errorRate: number;
}

export class GeminiProcessingQueue {
  private queue: QueuedDocument[] = [];
  private workers: ProcessingWorker[] = [];
  private processing = false;
  private maxConcurrentProcessing = 10;
  private maxQueueSize = 100;
  private processingHistory: Array<{
    timestamp: Date;
    processingTime: number;
    success: boolean;
  }> = [];

  constructor(maxConcurrentProcessing: number = 10) {
    this.maxConcurrentProcessing = maxConcurrentProcessing;
    this.initializeWorkers();
  }

  /**
   * Add document to processing queue
   */
  async enqueue(
    file: File,
    documentType: 'CAC' | 'Individual',
    formData: any,
    options: {
      priority?: number;
      maxRetries?: number;
      onComplete?: (result: DocumentVerificationResult) => void;
      onError?: (error: Error) => void;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<string> {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Processing queue is full. Please try again later.');
    }

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedDocument: QueuedDocument = {
      id: documentId,
      file,
      documentType,
      formData,
      priority: options.priority || 0,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      onComplete: options.onComplete,
      onError: options.onError,
      onProgress: options.onProgress
    };

    // Insert in priority order (higher priority first)
    const insertIndex = this.queue.findIndex(doc => doc.priority < queuedDocument.priority);
    if (insertIndex === -1) {
      this.queue.push(queuedDocument);
    } else {
      this.queue.splice(insertIndex, 0, queuedDocument);
    }

    // Update monitoring
    geminiMonitoring.updateQueueMetrics(this.queue.length, this.getActiveWorkerCount());

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return documentId;
  }

  /**
   * Remove document from queue
   */
  dequeue(documentId: string): boolean {
    const index = this.queue.findIndex(doc => doc.id === documentId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      geminiMonitoring.updateQueueMetrics(this.queue.length, this.getActiveWorkerCount());
      return true;
    }
    return false;
  }

  /**
   * Get queue position for a document
   */
  getQueuePosition(documentId: string): number {
    const index = this.queue.findIndex(doc => doc.id === documentId);
    return index === -1 ? -1 : index + 1;
  }

  /**
   * Get estimated wait time for a document
   */
  getEstimatedWaitTime(documentId: string): number {
    const position = this.getQueuePosition(documentId);
    if (position === -1) return 0;

    const averageProcessingTime = this.getAverageProcessingTime();
    const activeWorkers = this.getActiveWorkerCount();
    
    if (activeWorkers === 0) return 0;
    
    // Estimate based on position in queue and processing capacity
    const documentsAhead = position - 1;
    const estimatedTime = (documentsAhead / activeWorkers) * averageProcessingTime;
    
    return Math.max(0, estimatedTime);
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const activeWorkers = this.getActiveWorkerCount();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const processedToday = this.processingHistory.filter(
      record => record.timestamp >= today
    ).length;

    const recentHistory = this.processingHistory.slice(-100);
    const averageProcessingTime = recentHistory.length > 0
      ? recentHistory.reduce((sum, record) => sum + record.processingTime, 0) / recentHistory.length
      : 0;

    const errorRate = recentHistory.length > 0
      ? (recentHistory.filter(record => !record.success).length / recentHistory.length) * 100
      : 0;

    return {
      queueLength: this.queue.length,
      activeWorkers,
      totalWorkers: this.workers.length,
      processedToday,
      averageProcessingTime,
      errorRate
    };
  }

  /**
   * Get current queue contents
   */
  getQueueContents(): Array<{
    id: string;
    documentType: string;
    priority: number;
    timestamp: Date;
    retryCount: number;
    position: number;
    estimatedWaitTime: number;
  }> {
    return this.queue.map((doc, index) => ({
      id: doc.id,
      documentType: doc.documentType,
      priority: doc.priority,
      timestamp: doc.timestamp,
      retryCount: doc.retryCount,
      position: index + 1,
      estimatedWaitTime: this.getEstimatedWaitTime(doc.id)
    }));
  }

  /**
   * Get worker status
   */
  getWorkerStatus(): Array<{
    id: string;
    busy: boolean;
    currentDocument?: string;
    processingTime?: number;
    processedCount: number;
  }> {
    return this.workers.map(worker => ({
      id: worker.id,
      busy: worker.busy,
      currentDocument: worker.currentDocument?.id,
      processingTime: worker.startTime 
        ? Date.now() - worker.startTime.getTime()
        : undefined,
      processedCount: worker.processedCount
    }));
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.processing = false;
  }

  /**
   * Resume processing
   */
  resume(): void {
    if (!this.processing) {
      this.startProcessing();
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    // Notify all queued documents of cancellation
    this.queue.forEach(doc => {
      if (doc.onError) {
        doc.onError(new Error('Processing cancelled'));
      }
    });
    
    this.queue.length = 0;
    geminiMonitoring.updateQueueMetrics(0, this.getActiveWorkerCount());
  }

  /**
   * Configure queue settings
   */
  configure(settings: {
    maxConcurrentProcessing?: number;
    maxQueueSize?: number;
  }): void {
    if (settings.maxConcurrentProcessing !== undefined) {
      this.maxConcurrentProcessing = settings.maxConcurrentProcessing;
      this.adjustWorkerCount();
    }
    
    if (settings.maxQueueSize !== undefined) {
      this.maxQueueSize = settings.maxQueueSize;
    }
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.maxConcurrentProcessing; i++) {
      this.workers.push({
        id: `worker_${i}`,
        busy: false,
        processedCount: 0
      });
    }
  }

  /**
   * Adjust worker count based on configuration
   */
  private adjustWorkerCount(): void {
    const currentCount = this.workers.length;
    
    if (currentCount < this.maxConcurrentProcessing) {
      // Add workers
      for (let i = currentCount; i < this.maxConcurrentProcessing; i++) {
        this.workers.push({
          id: `worker_${i}`,
          busy: false,
          processedCount: 0
        });
      }
    } else if (currentCount > this.maxConcurrentProcessing) {
      // Remove idle workers
      this.workers = this.workers.slice(0, this.maxConcurrentProcessing);
    }
  }

  /**
   * Start processing queue
   */
  private async startProcessing(): Promise<void> {
    this.processing = true;

    while (this.processing && this.queue.length > 0) {
      const availableWorker = this.workers.find(worker => !worker.busy);
      
      if (!availableWorker) {
        // Wait for a worker to become available
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const document = this.queue.shift();
      if (!document) continue;

      // Assign document to worker
      availableWorker.busy = true;
      availableWorker.currentDocument = document;
      availableWorker.startTime = new Date();

      // Process document asynchronously
      this.processDocument(availableWorker, document).finally(() => {
        availableWorker.busy = false;
        availableWorker.currentDocument = undefined;
        availableWorker.startTime = undefined;
        availableWorker.processedCount++;
        
        geminiMonitoring.updateQueueMetrics(this.queue.length, this.getActiveWorkerCount());
      });

      // Update monitoring
      geminiMonitoring.updateQueueMetrics(this.queue.length, this.getActiveWorkerCount());
    }

    this.processing = false;
  }

  /**
   * Process a single document
   */
  private async processDocument(worker: ProcessingWorker, document: QueuedDocument): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Report progress
      if (document.onProgress) {
        document.onProgress(10); // Started processing
      }

      // Import the document processor dynamically to avoid circular dependencies
      const { geminiDocumentProcessor } = await import('./geminiDocumentProcessor');
      
      if (document.onProgress) {
        document.onProgress(30); // Initialized processor
      }

      // Process the document
      const result = await geminiDocumentProcessor.processDocument(
        document.file,
        document.documentType,
        document.formData
      );

      if (document.onProgress) {
        document.onProgress(100); // Completed
      }

      // Record success
      const processingTime = Date.now() - startTime;
      this.processingHistory.push({
        timestamp: new Date(),
        processingTime,
        success: true
      });

      // Notify completion
      if (document.onComplete) {
        document.onComplete(result);
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Record failure
      this.processingHistory.push({
        timestamp: new Date(),
        processingTime,
        success: false
      });

      // Handle retry logic
      if (document.retryCount < document.maxRetries) {
        document.retryCount++;
        
        // Re-queue with exponential backoff
        setTimeout(() => {
          this.queue.unshift(document); // Add to front for retry
        }, Math.pow(2, document.retryCount) * 1000);
        
        return;
      }

      // Max retries exceeded, notify error
      if (document.onError) {
        document.onError(error as Error);
      }
    }

    // Keep processing history manageable
    if (this.processingHistory.length > 1000) {
      this.processingHistory = this.processingHistory.slice(-1000);
    }
  }

  /**
   * Get number of active workers
   */
  private getActiveWorkerCount(): number {
    return this.workers.filter(worker => worker.busy).length;
  }

  /**
   * Get average processing time from history
   */
  private getAverageProcessingTime(): number {
    const recentHistory = this.processingHistory.slice(-50);
    if (recentHistory.length === 0) return 30000; // Default 30 seconds
    
    const totalTime = recentHistory.reduce((sum, record) => sum + record.processingTime, 0);
    return totalTime / recentHistory.length;
  }
}

// Singleton instance
export const geminiProcessingQueue = new GeminiProcessingQueue();