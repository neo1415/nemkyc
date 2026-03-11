// Real-time Updates Service - provides WebSocket-based status updates for document processing

import { 
  ProcessingStatus, 
  VerificationResult,
  ProcessedDocument 
} from '../types/geminiDocumentVerification';
import { GeminiErrorHandler } from '../utils/geminiErrorHandling';

interface StatusUpdate {
  documentId: string;
  status: ProcessingStatus;
  progress: number;
  message: string;
  timestamp: Date;
  metadata?: any;
}

interface ProgressIndicator {
  stage: string;
  progress: number;
  estimatedTimeRemaining?: number;
  message: string;
}

export class GeminiRealtimeUpdates {
  private subscribers: Map<string, Set<(update: StatusUpdate) => void>> = new Map();
  private documentStatuses: Map<string, StatusUpdate> = new Map();

  /**
   * Subscribe to status updates for a document
   */
  subscribe(documentId: string, callback: (update: StatusUpdate) => void): () => void {
    if (!this.subscribers.has(documentId)) {
      this.subscribers.set(documentId, new Set());
    }
    
    this.subscribers.get(documentId)!.add(callback);
    
    // Send current status if available
    const currentStatus = this.documentStatuses.get(documentId);
    if (currentStatus) {
      callback(currentStatus);
    }
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(documentId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(documentId);
        }
      }
    };
  }

  /**
   * Update document processing status
   */
  updateStatus(
    documentId: string, 
    status: ProcessingStatus, 
    progress: number = 0,
    message: string = '',
    metadata?: any
  ): void {
    const update: StatusUpdate = {
      documentId,
      status,
      progress: Math.max(0, Math.min(100, progress)),
      message,
      timestamp: new Date(),
      metadata
    };

    this.documentStatuses.set(documentId, update);
    
    // Notify all subscribers
    const subscribers = this.subscribers.get(documentId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error(`Error in status update callback for ${documentId}:`, error);
        }
      });
    }
  }

  /**
   * Update processing progress with detailed information
   */
  updateProgress(
    documentId: string,
    stage: string,
    progress: number,
    message: string,
    estimatedTimeRemaining?: number
  ): void {
    const indicator: ProgressIndicator = {
      stage,
      progress: Math.max(0, Math.min(100, progress)),
      estimatedTimeRemaining,
      message
    };

    this.updateStatus(
      documentId,
      'processing',
      progress,
      `${stage}: ${message}`,
      { progressIndicator: indicator }
    );
  }

  /**
   * Mark document as upload started
   */
  startUpload(documentId: string, fileName: string): void {
    this.updateStatus(
      documentId,
      'uploading',
      0,
      `Starting upload of ${fileName}`,
      { fileName, stage: 'upload' }
    );
  }

  /**
   * Update upload progress
   */
  updateUploadProgress(documentId: string, progress: number): void {
    this.updateStatus(
      documentId,
      'uploading',
      progress,
      `Uploading... ${progress}%`,
      { stage: 'upload' }
    );
  }

  /**
   * Mark upload as complete and start processing
   */
  startProcessing(documentId: string): void {
    this.updateStatus(
      documentId,
      'processing',
      0,
      'Processing document...',
      { stage: 'processing' }
    );
  }

  /**
   * Update OCR extraction progress
   */
  updateOCRProgress(documentId: string, progress: number): void {
    this.updateProgress(
      documentId,
      'OCR Extraction',
      progress,
      'Extracting text from document...'
    );
  }

  /**
   * Update verification progress
   */
  updateVerificationProgress(documentId: string, progress: number): void {
    this.updateProgress(
      documentId,
      'Verification',
      progress,
      'Verifying against official records...'
    );
  }

  /**
   * Mark processing as complete
   */
  completeProcessing(
    documentId: string, 
    result: VerificationResult,
    processingTime: number
  ): void {
    const message = result.isMatch 
      ? 'Document verification successful'
      : `Document verification failed: ${result.mismatches?.length || 0} mismatches found`;

    this.updateStatus(
      documentId,
      'completed',
      100,
      message,
      { 
        result,
        processingTime,
        stage: 'complete'
      }
    );
  }

  /**
   * Mark processing as failed
   */
  failProcessing(documentId: string, error: string): void {
    this.updateStatus(
      documentId,
      'failed',
      0,
      `Processing failed: ${error}`,
      { 
        error,
        stage: 'error'
      }
    );
  }

  /**
   * Get current status for a document
   */
  getStatus(documentId: string): StatusUpdate | undefined {
    return this.documentStatuses.get(documentId);
  }

  /**
   * Clear status for a document
   */
  clearStatus(documentId: string): void {
    this.documentStatuses.delete(documentId);
    this.subscribers.delete(documentId);
  }

  /**
   * Get user-friendly error messages
   */
  getUserFriendlyMessage(status: ProcessingStatus, error?: string): string {
    switch (status) {
      case 'uploading':
        return 'Uploading your document...';
      
      case 'processing':
        return 'Processing your document. This may take a few moments...';
      
      case 'completed':
        return 'Document processing completed successfully!';
      
      case 'failed':
        if (error?.includes('size')) {
          return 'File is too large. Please use a smaller file.';
        }
        if (error?.includes('format')) {
          return 'File format not supported. Please use PDF or image files.';
        }
        if (error?.includes('network')) {
          return 'Network error. Please check your connection and try again.';
        }
        if (error?.includes('authentication')) {
          return 'Authentication failed. Please contact support.';
        }
        return 'Processing failed. Please try again or contact support.';
      
      default:
        return 'Processing your document...';
    }
  }

  /**
   * Get progress indicator component data
   */
  getProgressIndicator(documentId: string): ProgressIndicator | null {
    const status = this.getStatus(documentId);
    if (!status || !status.metadata?.progressIndicator) {
      return null;
    }
    
    return status.metadata.progressIndicator;
  }

  /**
   * Create WebSocket connection for real-time updates (if available)
   */
  createWebSocketConnection(documentId: string): WebSocket | null {
    if (typeof WebSocket === 'undefined') {
      return null; // Not in browser environment
    }

    try {
      const ws = new WebSocket(`ws://localhost:3001/ws/document/${documentId}`);
      
      ws.onopen = () => {
        console.log(`WebSocket connected for document ${documentId}`);
      };
      
      ws.onmessage = (event) => {
        try {
          const update: StatusUpdate = JSON.parse(event.data);
          this.updateStatus(
            update.documentId,
            update.status,
            update.progress,
            update.message,
            update.metadata
          );
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log(`WebSocket disconnected for document ${documentId}`);
      };
      
      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return null;
    }
  }

  /**
   * Cleanup resources for a document
   */
  cleanup(documentId: string): void {
    this.clearStatus(documentId);
  }

  /**
   * Get all active document statuses
   */
  getAllStatuses(): Map<string, StatusUpdate> {
    return new Map(this.documentStatuses);
  }
}

// Export singleton instance
export const geminiRealtimeUpdates = new GeminiRealtimeUpdates();