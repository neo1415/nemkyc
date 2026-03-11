// Main orchestrator service that coordinates all Gemini Document Verification components

import { DocumentVerificationResult, ProcessingStatus, ExtractedDocumentData } from '@/types/geminiDocumentVerification';
import { geminiOCREngine } from './geminiOCREngine';
import { geminiDocumentProcessor } from './geminiDocumentProcessor';
import { geminiVerificationMatcher } from './geminiVerificationMatcher';
import { geminiMismatchAnalyzer } from './geminiMismatchAnalyzer';
import { geminiFormSubmissionController } from './geminiFormSubmissionController';
import { geminiAuditLogger } from './geminiAuditLogger';
import { geminiRealtimeUpdates } from './geminiRealtimeUpdates';
import { geminiErrorRecovery } from './geminiErrorRecovery';
import { geminiMonitoring } from './geminiMonitoring';
import { geminiCacheService } from './geminiCacheService';
import { geminiProcessingQueue } from './geminiProcessingQueue';
import { documentSecurity } from './geminiDocumentSecurity';
import { geminiDataPrivacy } from './geminiDataPrivacy';
import { GeminiErrorHandler, ErrorCode } from '@/utils/geminiErrorHandling';

export interface VerificationRequest {
  file: File;
  documentType: 'CAC' | 'Individual';
  formData: any;
  userId: string;
  sessionId: string;
  priority?: number;
  onProgress?: (progress: number) => void;
  onStatusUpdate?: (status: ProcessingStatus) => void;
}

export interface VerificationConfig {
  enableCaching: boolean;
  enableRealTimeUpdates: boolean;
  enableAuditLogging: boolean;
  enableErrorRecovery: boolean;
  enableMonitoring: boolean;
  enableSecurity: boolean;
  enablePrivacyCompliance: boolean;
  maxConcurrentProcessing: number;
  processingTimeout: number;
}

export class GeminiOrchestrator {
  private config: VerificationConfig = {
    enableCaching: true,
    enableRealTimeUpdates: true,
    enableAuditLogging: true,
    enableErrorRecovery: true,
    enableMonitoring: true,
    enableSecurity: true,
    enablePrivacyCompliance: true,
    maxConcurrentProcessing: 10,
    processingTimeout: 300000 // 5 minutes
  };

  private initialized = false;

  /**
   * Initialize the orchestrator and all components
   */
  async initialize(config?: Partial<VerificationConfig>): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Update configuration
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Configure processing queue
      geminiProcessingQueue.configure({
        maxConcurrentProcessing: this.config.maxConcurrentProcessing
      });

      // Initialize monitoring if enabled
      if (this.config.enableMonitoring) {
        geminiMonitoring.onAlert((alert) => {
          console.warn('Gemini Alert:', alert);
          // In production, this would integrate with alerting systems
        });
      }

      // Preload cache if enabled
      if (this.config.enableCaching) {
        await geminiCacheService.preloadCommonData();
      }

      this.initialized = true;
      console.log('Gemini Document Verification system initialized');

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to initialize Gemini orchestrator',
        error
      );
    }
  }

  /**
   * Process document verification request
   */
  async processVerification(request: VerificationRequest): Promise<DocumentVerificationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let documentHash: string | null = null;

    try {
      // Validate request
      await this.validateRequest(request);

      // Check user permissions
      if (this.config.enableSecurity) {
        await this.checkUserPermissions(request);
      }

      // Record consent and data processing
      if (this.config.enablePrivacyCompliance) {
        await this.recordDataProcessing(request);
      }

      // Generate document hash for caching
      if (this.config.enableCaching) {
        documentHash = await geminiCacheService.generateDocumentHash(request.file);
        
        // Check cache first
        const cachedResult = geminiCacheService.getCachedDocumentResult(documentHash);
        if (cachedResult) {
          await this.logCacheHit(request, cachedResult);
          return cachedResult;
        }
      }

      // Queue document for processing
      const documentId = await geminiProcessingQueue.enqueue(
        request.file,
        request.documentType,
        request.formData,
        {
          priority: request.priority,
          onProgress: request.onProgress,
          onComplete: (result) => this.handleProcessingComplete(request, result),
          onError: (error) => this.handleProcessingError(request, error)
        }
      );

      // Start real-time updates if enabled
      if (this.config.enableRealTimeUpdates) {
        geminiRealtimeUpdates.startStatusUpdates(documentId, request.onStatusUpdate);
      }

      // Wait for processing to complete or timeout
      const result = await this.waitForProcessing(documentId);

      // Cache result if successful
      if (this.config.enableCaching && result.success && documentHash) {
        geminiCacheService.cacheDocumentResult(documentHash, result);
      }

      // Record metrics
      if (this.config.enableMonitoring) {
        geminiMonitoring.recordProcessing(result);
      }

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Handle error with recovery if enabled
      if (this.config.enableErrorRecovery) {
        const recoveryResult = await geminiErrorRecovery.attemptRecovery(
          error as any,
          { request, processingTime }
        );

        if (recoveryResult.recovered && recoveryResult.result) {
          return recoveryResult.result;
        }
      }

      // Record error metrics
      if (this.config.enableMonitoring) {
        geminiMonitoring.recordError(error as any, { request });
      }

      throw error;
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
    metrics: any;
    issues: string[];
  } {
    const components: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {
      ocr_engine: 'healthy',
      document_processor: 'healthy',
      verification_matcher: 'healthy',
      form_controller: 'healthy',
      audit_logger: 'healthy',
      cache_service: 'healthy',
      processing_queue: 'healthy',
      security_service: 'healthy'
    };

    // Check processing queue health
    const queueStats = geminiProcessingQueue.getStats();
    if (queueStats.errorRate > 20) {
      components.processing_queue = 'degraded';
    }
    if (queueStats.errorRate > 50) {
      components.processing_queue = 'unhealthy';
    }

    // Check cache health
    const cacheStats = geminiCacheService.getStats();
    if (cacheStats.hitRate < 30) {
      components.cache_service = 'degraded';
    }

    // Get overall monitoring health
    const monitoringHealth = this.config.enableMonitoring 
      ? geminiMonitoring.getHealthStatus()
      : { status: 'healthy' as const, issues: [], metrics: {} };

    // Determine overall status
    const componentStatuses = Object.values(components);
    const hasUnhealthy = componentStatuses.includes('unhealthy');
    const hasDegraded = componentStatuses.includes('degraded');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hasUnhealthy || monitoringHealth.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (hasDegraded || monitoringHealth.status === 'degraded') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      components,
      metrics: {
        queue: queueStats,
        cache: cacheStats,
        monitoring: monitoringHealth.metrics
      },
      issues: monitoringHealth.issues
    };
  }

  /**
   * Get system metrics and statistics
   */
  getSystemMetrics(): {
    processing: any;
    cache: any;
    queue: any;
    monitoring: any;
  } {
    return {
      processing: this.config.enableMonitoring ? geminiMonitoring.getMetrics() : null,
      cache: this.config.enableCaching ? geminiCacheService.getStats() : null,
      queue: geminiProcessingQueue.getStats(),
      monitoring: this.config.enableMonitoring ? geminiMonitoring.generateReport() : null
    };
  }

  /**
   * Configure the orchestrator
   */
  configure(config: Partial<VerificationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Apply configuration to components
    if (config.maxConcurrentProcessing !== undefined) {
      geminiProcessingQueue.configure({
        maxConcurrentProcessing: config.maxConcurrentProcessing
      });
    }
  }

  /**
   * Shutdown the orchestrator and cleanup resources
   */
  async shutdown(): Promise<void> {
    try {
      // Clear processing queue
      geminiProcessingQueue.clear();

      // Clear caches
      if (this.config.enableCaching) {
        geminiCacheService.clearAll();
      }

      // Stop real-time updates
      if (this.config.enableRealTimeUpdates) {
        geminiRealtimeUpdates.stopAllUpdates();
      }

      this.initialized = false;
      console.log('Gemini Document Verification system shutdown complete');

    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * Validate verification request
   */
  private async validateRequest(request: VerificationRequest): Promise<void> {
    if (!request.file) {
      throw GeminiErrorHandler.createError(
        ErrorCode.CORRUPTED_FILE,
        'No file provided for verification'
      );
    }

    if (!['CAC', 'Individual'].includes(request.documentType)) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNSUPPORTED_FORMAT,
        'Invalid document type'
      );
    }

    if (!request.userId || !request.sessionId) {
      throw GeminiErrorHandler.createError(
        ErrorCode.API_AUTHENTICATION_FAILED,
        'User ID and session ID are required'
      );
    }

    // Validate file size and format
    const result = await geminiDocumentProcessor.validateFile(request.file, request.documentType);
    if (!result.success) {
      throw GeminiErrorHandler.createError(
        result.error?.code || ErrorCode.CORRUPTED_FILE,
        result.error?.message || 'File validation failed'
      );
    }
  }

  /**
   * Check user permissions for document processing
   */
  private async checkUserPermissions(request: VerificationRequest): Promise<void> {
    const hasPermission = await documentSecurity.checkPermission(
      {
        userId: request.userId,
        role: 'user', // This would be determined from session
        permissions: [],
        sessionId: request.sessionId
      },
      'document',
      'upload'
    );

    if (!hasPermission) {
      throw GeminiErrorHandler.createError(
        ErrorCode.API_AUTHENTICATION_FAILED,
        'Insufficient permissions for document processing'
      );
    }
  }

  /**
   * Record data processing for privacy compliance
   */
  private async recordDataProcessing(request: VerificationRequest): Promise<void> {
    await geminiDataPrivacy.recordDataProcessing({
      userId: request.userId,
      documentId: `pending_${Date.now()}`,
      processingPurpose: 'Document verification for KYC/NFIU compliance',
      legalBasis: 'contract',
      dataTypes: ['document_content', 'extracted_data', 'verification_results'],
      retentionPeriod: 2555 // 7 years
    });
  }

  /**
   * Log cache hit for monitoring
   */
  private async logCacheHit(request: VerificationRequest, result: DocumentVerificationResult): Promise<void> {
    if (this.config.enableAuditLogging) {
      await geminiAuditLogger.logEvent({
        type: 'cache_hit',
        userId: request.userId,
        documentType: request.documentType,
        details: {
          documentId: result.documentId,
          cacheHit: true
        }
      });
    }
  }

  /**
   * Handle processing completion
   */
  private async handleProcessingComplete(
    request: VerificationRequest,
    result: DocumentVerificationResult
  ): Promise<void> {
    // Log completion
    if (this.config.enableAuditLogging) {
      await geminiAuditLogger.logEvent({
        type: 'processing_completed',
        userId: request.userId,
        documentType: request.documentType,
        details: {
          documentId: result.documentId,
          success: result.success,
          processingTime: result.processingTime
        }
      });
    }

    // Update form submission state
    await geminiFormSubmissionController.updateVerificationStatus(
      request.userId,
      result.documentId,
      result.success ? 'verified' : 'failed'
    );
  }

  /**
   * Handle processing error
   */
  private async handleProcessingError(request: VerificationRequest, error: Error): Promise<void> {
    // Log error
    if (this.config.enableAuditLogging) {
      await geminiAuditLogger.logEvent({
        type: 'processing_error',
        userId: request.userId,
        documentType: request.documentType,
        details: {
          error: error.message,
          timestamp: new Date()
        }
      });
    }
  }

  /**
   * Wait for processing to complete
   */
  private async waitForProcessing(documentId: string): Promise<DocumentVerificationResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(GeminiErrorHandler.createError(
          ErrorCode.PROCESSING_TIMEOUT,
          'Document processing timeout'
        ));
      }, this.config.processingTimeout);

      // In production, this would use proper event handling
      // For now, simulate processing completion
      setTimeout(() => {
        clearTimeout(timeout);
        resolve({
          documentId,
          success: true,
          processingStatus: ProcessingStatus.COMPLETED,
          extractedData: null,
          verificationResult: null,
          confidence: 85,
          processingTime: 5000,
          metadata: {
            orchestrated: true,
            timestamp: new Date().toISOString()
          }
        });
      }, 2000);
    });
  }
}

// Singleton instance
export const geminiOrchestrator = new GeminiOrchestrator();