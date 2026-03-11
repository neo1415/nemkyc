// Document Processor Service - orchestrates the complete document verification workflow

import { 
  ProcessedDocument, 
  ProcessingResult, 
  ProcessingStatusInfo,
  ProcessingStatus, 
  DocumentMetadata,
  ExtractedDocumentData,
  VerificationResult
} from '../types/geminiDocumentVerification';
import { 
  PROCESSING_LIMITS, 
  SUPPORTED_FILE_TYPES 
} from '../config/geminiDocumentVerification';
import { 
  DocumentValidator, 
  ValidationResult 
} from '../utils/geminiDocumentValidation';
import { 
  GeminiErrorHandler, 
  ErrorCode, 
  GeminiError 
} from '../utils/geminiErrorHandling';
import { geminiOCREngine } from './geminiOCREngine';
import { simpleVerificationMatcher } from './simpleVerificationMatcher';
import { geminiAuditLogger } from './geminiAuditLogger';

interface ProcessingJob {
  id: string;
  document: ProcessedDocument;
  verificationType: 'cac' | 'individual';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: ProcessingResult;
  error?: GeminiError;
}

export class DocumentProcessorService {
  private processingJobs: Map<string, ProcessingJob> = new Map();
  private activeProcessingCount: number = 0;
  private processingQueue: ProcessingJob[] = [];

  /**
   * Process a document for verification
   */
  async processDocument(
    file: File, 
    verificationType: 'cac' | 'individual',
    formData?: any
  ): Promise<ProcessingResult> {
    const processingId = this.generateProcessingId();
    const startTime = Date.now();

    console.log('🔄 Starting document processing:', {
      processingId,
      fileName: file.name,
      fileSize: file.size,
      verificationType,
      hasFormData: !!formData
    });

    try {
      // Validate file
      const validation = DocumentValidator.validateFile(file);
      if (!validation.isValid) {
        console.log('❌ File validation failed:', validation.errors);
        return {
          success: false,
          processingId,
          error: {
            code: ErrorCode.UNSUPPORTED_FORMAT,
            message: validation.errors.join(', '),
            details: validation,
            retryable: false
          }
        };
      }

      console.log('✅ File validation passed');

      // Check concurrent processing limit
      if (this.activeProcessingCount >= PROCESSING_LIMITS.concurrentProcessing) {
        throw GeminiErrorHandler.createError(
          ErrorCode.CONCURRENT_LIMIT_EXCEEDED,
          'Too many documents being processed simultaneously',
          { activeCount: this.activeProcessingCount, limit: PROCESSING_LIMITS.concurrentProcessing }
        );
      }

      // Create processed document
      const processedDocument = await this.preprocessDocument(file, processingId);
      console.log('✅ Document preprocessed successfully');

      // Create processing job
      const job: ProcessingJob = {
        id: processingId,
        document: processedDocument,
        verificationType,
        status: 'pending',
        startTime: new Date()
      };

      this.processingJobs.set(processingId, job);

      // Log document upload
      await geminiAuditLogger.logDocumentUpload({
        userId: 'current-user', // TODO: Get from auth context
        formId: formData?.formId || 'unknown',
        documentType: verificationType,
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date()
      });

      // Process document
      console.log('🔄 Starting document processing workflow...');
      const result = await this.executeProcessingWorkflow(job, formData);

      // Update job status
      job.status = result.success ? 'completed' : 'failed';
      job.endTime = new Date();
      job.result = result;

      console.log('✅ Document processing completed:', {
        processingId,
        success: result.success,
        hasVerificationResult: !!result.verificationResult,
        error: result.error?.message
      });

      return result;

    } catch (error) {
      console.error('❌ Document processing error:', error);
      
      const geminiError = error instanceof Error 
        ? GeminiErrorHandler.handleApiError(error)
        : error as GeminiError;

      // Log error
      await geminiAuditLogger.logAPIError({
        service: 'gemini',
        error: geminiError.message,
        retryAttempt: 0,
        timestamp: new Date()
      });

      return {
        success: false,
        processingId,
        error: {
          code: geminiError.code,
          message: geminiError.message,
          details: geminiError.details,
          retryable: geminiError.retryable
        }
      };
    }
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(processingId: string): Promise<ProcessingStatusInfo> {
    const job = this.processingJobs.get(processingId);
    
    if (!job) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        'Processing job not found',
        { processingId }
      );
    }

    const progress = this.calculateProgress(job);
    
    return {
      id: processingId,
      status: this.mapJobStatusToProcessingStatus(job.status),
      progress,
      message: this.getStatusMessage(job),
      startTime: job.startTime,
      endTime: job.endTime
    };
  }

  /**
   * Retry processing
   */
  async retryProcessing(processingId: string): Promise<ProcessingResult> {
    const job = this.processingJobs.get(processingId);
    
    if (!job) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        'Processing job not found',
        { processingId }
      );
    }

    if (job.status === 'processing') {
      throw GeminiErrorHandler.createError(
        ErrorCode.PROCESSING_INTERRUPTED,
        'Cannot retry job that is currently processing'
      );
    }

    // Reset job status
    job.status = 'pending';
    job.startTime = new Date();
    job.endTime = undefined;
    job.result = undefined;
    job.error = undefined;

    // Re-execute workflow
    return await this.executeProcessingWorkflow(job);
  }

  /**
   * Execute the complete processing workflow
   */
  private async executeProcessingWorkflow(
    job: ProcessingJob, 
    formData?: any
  ): Promise<ProcessingResult> {
    const timeoutMs = PROCESSING_LIMITS.timeoutSeconds.total * 1000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(GeminiErrorHandler.createError(
          ErrorCode.PROCESSING_TIMEOUT,
          'Processing workflow timed out'
        ));
      }, timeoutMs);
    });

    try {
      job.status = 'processing';
      this.activeProcessingCount++;

      const workflowPromise = this.runWorkflow(job, formData);
      const result = await Promise.race([workflowPromise, timeoutPromise]);

      return result;

    } finally {
      this.activeProcessingCount--;
    }
  }

  /**
   * Run the processing workflow
   */
  private async runWorkflow(job: ProcessingJob, formData?: any): Promise<ProcessingResult> {
    const { document, verificationType } = job;

    console.log('🔄 Running workflow for job:', job.id, 'type:', verificationType);

    try {
      // Step 1: OCR Extraction
      let extractedData: ExtractedDocumentData;
      
      console.log('📄 Starting OCR extraction...');
      
      if (verificationType === 'cac') {
        const ocrResult = await geminiOCREngine.extractCACData(document);
        
        console.log('📄 CAC OCR result:', {
          success: ocrResult.success,
          confidence: ocrResult.confidence,
          hasData: !!ocrResult.data,
          error: ocrResult.error
        });
        
        if (!ocrResult.success) {
          throw GeminiErrorHandler.createError(
            ErrorCode.OCR_FAILED,
            ocrResult.error || 'OCR extraction failed'
          );
        }
        
        extractedData = ocrResult.data!;
        
        // Log OCR processing
        await geminiAuditLogger.logOCRProcessing({
          processingId: job.id,
          userId: 'current-user', // TODO: Get from auth context
          documentType: verificationType,
          success: true,
          extractedFields: Object.keys(extractedData),
          confidence: ocrResult.confidence,
          processingTime: Date.now() - job.startTime.getTime(),
          apiCost: 0.01, // TODO: Calculate actual cost
          timestamp: new Date()
        });
        
      } else {
        const ocrResult = await geminiOCREngine.extractIndividualData(document);
        
        console.log('📄 Individual OCR result:', {
          success: ocrResult.success,
          confidence: ocrResult.confidence,
          hasData: !!ocrResult.data,
          error: ocrResult.error
        });
        
        if (!ocrResult.success) {
          throw GeminiErrorHandler.createError(
            ErrorCode.OCR_FAILED,
            ocrResult.error || 'OCR extraction failed'
          );
        }
        
        extractedData = ocrResult.data!;
        
        // Log OCR processing
        await geminiAuditLogger.logOCRProcessing({
          processingId: job.id,
          userId: 'current-user', // TODO: Get from auth context
          documentType: verificationType,
          success: true,
          extractedFields: Object.keys(extractedData),
          confidence: ocrResult.confidence,
          processingTime: Date.now() - job.startTime.getTime(),
          apiCost: 0.01, // TODO: Calculate actual cost
          timestamp: new Date()
        });
      }

      console.log('✅ OCR extraction completed successfully');

      // Step 2: Simple Verification (if form data provided)
      let verificationResult: VerificationResult | undefined;
      
      if (formData) {
        console.log('🔍 Starting verification with form data...');
        
        try {
          if (verificationType === 'cac') {
            verificationResult = await simpleVerificationMatcher.verifyCACDocument(
              extractedData as any,
              formData
            );
          } else {
            verificationResult = await simpleVerificationMatcher.verifyIndividualDocument(
              extractedData as any,
              formData
            );
          }

          console.log('🔍 Verification result:', {
            success: verificationResult?.success,
            isMatch: verificationResult?.isMatch,
            confidence: verificationResult?.confidence,
            mismatchCount: verificationResult?.mismatches?.length || 0,
            error: verificationResult?.error
          });

          // Check if verification failed
          if (verificationResult && !verificationResult.success) {
            throw GeminiErrorHandler.createError(
              ErrorCode.VERIFICATION_FAILED,
              verificationResult.error || 'Document verification failed',
              { verificationResult }
            );
          }

          // Log verification attempt
          await geminiAuditLogger.logVerificationAttempt({
            processingId: job.id,
            userId: 'current-user', // TODO: Get from auth context
            verificationType,
            success: verificationResult?.success || false,
            mismatches: verificationResult?.mismatches || [],
            apiProvider: 'gemini', // Using Gemini for document verification
            timestamp: new Date()
          });

        } catch (verificationError) {
          console.error('❌ Verification error:', verificationError);
          
          // Log verification failure
          await geminiAuditLogger.logVerificationAttempt({
            processingId: job.id,
            userId: 'current-user', // TODO: Get from auth context
            verificationType,
            success: false,
            mismatches: [],
            apiProvider: 'gemini',
            timestamp: new Date()
          });

          // Re-throw with better error message
          throw GeminiErrorHandler.createError(
            ErrorCode.VERIFICATION_FAILED,
            verificationError instanceof Error ? verificationError.message : 'Document verification failed',
            verificationError
          );
        }
      } else {
        console.log('ℹ️ No form data provided, skipping verification');
      }

      // Step 3: Cleanup temporary files
      await this.cleanupTemporaryFiles(document);

      const processingTime = Date.now() - job.startTime.getTime();

      console.log('✅ Workflow completed successfully:', {
        processingId: job.id,
        processingTime,
        hasVerificationResult: !!verificationResult
      });

      return {
        success: true,
        processingId: job.id,
        extractedData,
        verificationResult,
        error: undefined
      };

    } catch (error) {
      console.error('❌ Workflow error:', error);
      
      const geminiError = error instanceof Error 
        ? GeminiErrorHandler.handleApiError(error)
        : error as GeminiError;

      // Log processing error
      await geminiAuditLogger.logAPIError({
        service: 'gemini',
        error: geminiError.message,
        retryAttempt: 0,
        timestamp: new Date()
      });

      // Cleanup on error
      await this.cleanupTemporaryFiles(document);

      return {
        success: false,
        processingId: job.id,
        error: {
          code: geminiError.code,
          message: geminiError.message,
          details: geminiError.details,
          retryable: geminiError.retryable
        }
      };
    }
  }

  /**
   * Preprocess document for OCR
   */
  private async preprocessDocument(file: File, processingId: string): Promise<ProcessedDocument> {
    try {
      // Convert file to buffer (browser-compatible)
      const arrayBuffer = await file.arrayBuffer();
      const processedContent = new Uint8Array(arrayBuffer);

      // Extract metadata
      const metadata: DocumentMetadata = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        processingDuration: 0 // Will be updated later
      };

      // For PDFs, we could extract page count here
      if (file.type === 'application/pdf') {
        // TODO: Implement PDF page count extraction
        metadata.pageCount = 1; // Placeholder
      }

      return {
        id: processingId,
        originalFile: file,
        processedContent,
        metadata,
        processingTimestamp: new Date()
      };

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.CORRUPTED_FILE,
        'Failed to preprocess document',
        error
      );
    }
  }

  /**
   * Calculate processing progress
   */
  private calculateProgress(job: ProcessingJob): number {
    switch (job.status) {
      case 'pending':
        return 0;
      case 'processing':
        // Estimate progress based on elapsed time
        const elapsed = Date.now() - job.startTime.getTime();
        const estimated = PROCESSING_LIMITS.timeoutSeconds.total * 1000;
        return Math.min(Math.round((elapsed / estimated) * 80), 80); // Max 80% during processing
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Get status message
   */
  private getStatusMessage(job: ProcessingJob): string {
    switch (job.status) {
      case 'pending':
        return 'Document queued for processing';
      case 'processing':
        return 'Extracting text from document...';
      case 'completed':
        return 'Document processed successfully';
      case 'failed':
        return job.error?.userMessage || 'Processing failed';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Map job status to ProcessingStatus enum
   */
  private mapJobStatusToProcessingStatus(status: 'pending' | 'processing' | 'completed' | 'failed'): ProcessingStatus {
    switch (status) {
      case 'pending':
        return ProcessingStatus.PENDING;
      case 'processing':
        return ProcessingStatus.PROCESSING;
      case 'completed':
        return ProcessingStatus.COMPLETED;
      case 'failed':
        return ProcessingStatus.FAILED;
      default:
        return ProcessingStatus.PENDING;
    }
  }

  /**
   * Generate unique processing ID
   */
  private generateProcessingId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup temporary files and resources
   */
  private async cleanupTemporaryFiles(document: ProcessedDocument): Promise<void> {
    try {
      // In a real implementation, this would clean up temporary files from storage
      // For now, we'll just clear the buffer reference
      // document.processedContent = Buffer.alloc(0);
      
      // Schedule cleanup after 24 hours
      setTimeout(() => {
        this.processingJobs.delete(document.id);
      }, 24 * 60 * 60 * 1000);
      
    } catch (error) {
      // Log cleanup error but don't fail the main process
      console.warn('Failed to cleanup temporary files:', error);
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    const jobs = Array.from(this.processingJobs.values());
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      activeProcessingCount: this.activeProcessingCount,
      queueLength: this.processingQueue.length
    };
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessorService();