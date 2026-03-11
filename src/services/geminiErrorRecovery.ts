// Enhanced error recovery system for Gemini Document Verification

import { GeminiError, ErrorCode, GeminiErrorHandler } from '@/utils/geminiErrorHandling';
import { DocumentVerificationResult, ProcessingStatus } from '@/types/geminiDocumentVerification';

export interface RecoveryStrategy {
  name: string;
  description: string;
  canRecover: (error: GeminiError) => boolean;
  recover: (error: GeminiError, context: any) => Promise<DocumentVerificationResult | null>;
}

export interface OfflineModeConfig {
  enabled: boolean;
  allowManualEntry: boolean;
  showGuidance: boolean;
  retryOnReconnect: boolean;
}

export class GeminiErrorRecovery {
  private recoveryStrategies: RecoveryStrategy[] = [];
  private offlineMode: OfflineModeConfig = {
    enabled: true,
    allowManualEntry: true,
    showGuidance: true,
    retryOnReconnect: true
  };

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize built-in recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      {
        name: 'fallback_to_manual',
        description: 'Allow manual data entry when OCR fails',
        canRecover: (error) => [
          ErrorCode.OCR_FAILED,
          ErrorCode.EXTRACTION_FAILED,
          ErrorCode.INVALID_RESPONSE,
          ErrorCode.PARSING_ERROR
        ].includes(error.code),
        recover: this.recoverWithManualEntry.bind(this)
      },
      {
        name: 'retry_with_preprocessing',
        description: 'Retry with enhanced image preprocessing',
        canRecover: (error) => [
          ErrorCode.OCR_FAILED,
          ErrorCode.EXTRACTION_FAILED
        ].includes(error.code),
        recover: this.recoverWithPreprocessing.bind(this)
      },
      {
        name: 'fallback_api_provider',
        description: 'Switch to alternative verification provider',
        canRecover: (error) => [
          ErrorCode.API_UNAVAILABLE,
          ErrorCode.API_QUOTA_EXCEEDED,
          ErrorCode.OFFICIAL_RECORDS_UNAVAILABLE
        ].includes(error.code),
        recover: this.recoverWithFallbackProvider.bind(this)
      },
      {
        name: 'offline_mode',
        description: 'Enable offline mode for form completion',
        canRecover: (error) => [
          ErrorCode.NETWORK_ERROR,
          ErrorCode.API_UNAVAILABLE,
          ErrorCode.PROCESSING_TIMEOUT
        ].includes(error.code),
        recover: this.recoverWithOfflineMode.bind(this)
      },
      {
        name: 'cached_verification',
        description: 'Use cached verification results',
        canRecover: (error) => [
          ErrorCode.API_UNAVAILABLE,
          ErrorCode.NETWORK_ERROR,
          ErrorCode.API_RATE_LIMITED
        ].includes(error.code),
        recover: this.recoverWithCache.bind(this)
      }
    ];
  }

  /**
   * Attempt to recover from an error using available strategies
   */
  async attemptRecovery(
    error: GeminiError,
    context: any
  ): Promise<{
    recovered: boolean;
    result?: DocumentVerificationResult;
    strategy?: string;
    fallbackOptions?: string[];
  }> {
    // Try each recovery strategy
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          const result = await strategy.recover(error, context);
          if (result) {
            return {
              recovered: true,
              result,
              strategy: strategy.name
            };
          }
        } catch (recoveryError) {
          console.warn(`Recovery strategy ${strategy.name} failed:`, recoveryError);
        }
      }
    }

    // If no strategy worked, provide fallback options
    const fallbackOptions = this.getFallbackOptions(error);
    return {
      recovered: false,
      fallbackOptions
    };
  }

  /**
   * Get available fallback options for user
   */
  private getFallbackOptions(error: GeminiError): string[] {
    const options: string[] = [];

    if (this.offlineMode.allowManualEntry) {
      options.push('manual_entry');
    }

    if ([ErrorCode.API_UNAVAILABLE, ErrorCode.NETWORK_ERROR].includes(error.code)) {
      options.push('retry_later');
    }

    if ([ErrorCode.OCR_FAILED, ErrorCode.EXTRACTION_FAILED].includes(error.code)) {
      options.push('different_document');
      options.push('better_quality');
    }

    if ([ErrorCode.DATA_MISMATCH].includes(error.code)) {
      options.push('verify_information');
      options.push('contact_support');
    }

    return options;
  }

  /**
   * Recovery strategy: Manual data entry
   */
  private async recoverWithManualEntry(
    error: GeminiError,
    context: any
  ): Promise<DocumentVerificationResult | null> {
    if (!this.offlineMode.allowManualEntry) {
      return null;
    }

    return {
      documentId: context.documentId || 'manual-entry',
      success: false,
      processingStatus: ProcessingStatus.MANUAL_ENTRY_REQUIRED,
      extractedData: null,
      verificationResult: null,
      confidence: 0,
      processingTime: 0,
      error: {
        code: error.code,
        message: 'Manual entry required due to processing failure',
        recoverable: true,
        userGuidance: 'Please enter the document information manually below.'
      },
      metadata: {
        recoveryStrategy: 'manual_entry',
        originalError: error.code,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Recovery strategy: Enhanced preprocessing
   */
  private async recoverWithPreprocessing(
    error: GeminiError,
    context: any
  ): Promise<DocumentVerificationResult | null> {
    // This would implement enhanced image preprocessing
    // For now, return null to indicate strategy not available
    return null;
  }

  /**
   * Recovery strategy: Fallback API provider
   */
  private async recoverWithFallbackProvider(
    error: GeminiError,
    context: any
  ): Promise<DocumentVerificationResult | null> {
    // This would switch to DataPro or other verification providers
    // For now, return null to indicate strategy not available
    return null;
  }

  /**
   * Recovery strategy: Offline mode
   */
  private async recoverWithOfflineMode(
    error: GeminiError,
    context: any
  ): Promise<DocumentVerificationResult | null> {
    if (!this.offlineMode.enabled) {
      return null;
    }

    return {
      documentId: context.documentId || 'offline-mode',
      success: false,
      processingStatus: ProcessingStatus.OFFLINE_MODE,
      extractedData: null,
      verificationResult: null,
      confidence: 0,
      processingTime: 0,
      error: {
        code: ErrorCode.NETWORK_ERROR,
        message: 'Operating in offline mode',
        recoverable: true,
        userGuidance: 'You can continue filling the form. Verification will be completed when connection is restored.'
      },
      metadata: {
        recoveryStrategy: 'offline_mode',
        originalError: error.code,
        timestamp: new Date().toISOString(),
        retryOnReconnect: this.offlineMode.retryOnReconnect
      }
    };
  }

  /**
   * Recovery strategy: Use cached results
   */
  private async recoverWithCache(
    error: GeminiError,
    context: any
  ): Promise<DocumentVerificationResult | null> {
    // This would check for cached verification results
    // For now, return null to indicate no cache available
    return null;
  }

  /**
   * Get user guidance for error recovery
   */
  getUserGuidance(error: GeminiError, fallbackOptions: string[]): {
    title: string;
    message: string;
    actions: Array<{
      label: string;
      action: string;
      primary?: boolean;
    }>;
  } {
    const guidance = {
      title: 'Document Verification Issue',
      message: error.userMessage,
      actions: [] as Array<{
        label: string;
        action: string;
        primary?: boolean;
      }>
    };

    // Add actions based on available fallback options
    if (fallbackOptions.includes('manual_entry')) {
      guidance.actions.push({
        label: 'Enter Information Manually',
        action: 'manual_entry',
        primary: true
      });
    }

    if (fallbackOptions.includes('retry_later')) {
      guidance.actions.push({
        label: 'Try Again Later',
        action: 'retry_later'
      });
    }

    if (fallbackOptions.includes('different_document')) {
      guidance.actions.push({
        label: 'Upload Different Document',
        action: 'upload_different'
      });
    }

    if (fallbackOptions.includes('better_quality')) {
      guidance.actions.push({
        label: 'Upload Better Quality Image',
        action: 'upload_better_quality'
      });
    }

    if (fallbackOptions.includes('verify_information')) {
      guidance.actions.push({
        label: 'Verify Your Information',
        action: 'verify_info'
      });
    }

    if (fallbackOptions.includes('contact_support')) {
      guidance.actions.push({
        label: 'Contact Support',
        action: 'contact_support'
      });
    }

    // Always add retry option
    guidance.actions.push({
      label: 'Retry',
      action: 'retry'
    });

    return guidance;
  }

  /**
   * Configure offline mode settings
   */
  configureOfflineMode(config: Partial<OfflineModeConfig>): void {
    this.offlineMode = { ...this.offlineMode, ...config };
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Check if system is in offline mode
   */
  isOfflineMode(): boolean {
    return this.offlineMode.enabled && !navigator.onLine;
  }

  /**
   * Handle network reconnection
   */
  async handleReconnection(pendingOperations: any[]): Promise<void> {
    if (!this.offlineMode.retryOnReconnect) {
      return;
    }

    // Retry pending operations when network is restored
    for (const operation of pendingOperations) {
      try {
        // This would retry the original operation
        console.log('Retrying operation after reconnection:', operation);
      } catch (error) {
        console.error('Failed to retry operation after reconnection:', error);
      }
    }
  }
}

// Singleton instance
export const geminiErrorRecovery = new GeminiErrorRecovery();