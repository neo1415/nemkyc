// Error handling utilities for Gemini Document Verification

export enum ErrorCode {
  // File validation errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  TOO_MANY_PAGES = 'TOO_MANY_PAGES',
  CORRUPTED_FILE = 'CORRUPTED_FILE',

  // OCR processing errors
  OCR_FAILED = 'OCR_FAILED',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  PARSING_ERROR = 'PARSING_ERROR',

  // API errors
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_AUTHENTICATION_FAILED = 'API_AUTHENTICATION_FAILED',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',

  // Verification errors
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  DATA_MISMATCH = 'DATA_MISMATCH',
  OFFICIAL_RECORDS_UNAVAILABLE = 'OFFICIAL_RECORDS_UNAVAILABLE',

  // Processing errors
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  PROCESSING_INTERRUPTED = 'PROCESSING_INTERRUPTED',
  CONCURRENT_LIMIT_EXCEEDED = 'CONCURRENT_LIMIT_EXCEEDED',

  // System errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface GeminiError {
  code: ErrorCode;
  message: string;
  details?: any;
  retryable: boolean;
  userMessage: string;
  timestamp: Date;
}

export class GeminiErrorHandler {
  /**
   * Create a standardized error object
   */
  static createError(
    code: ErrorCode,
    message: string,
    details?: any,
    retryable: boolean = false
  ): GeminiError {
    return {
      code,
      message,
      details,
      retryable,
      userMessage: this.getUserMessage(code),
      timestamp: new Date()
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(code: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.FILE_TOO_LARGE]: 'The file you uploaded is too large. Please use a smaller file.',
      [ErrorCode.UNSUPPORTED_FORMAT]: 'This file format is not supported. Please upload a PDF, PNG, or JPEG file.',
      [ErrorCode.TOO_MANY_PAGES]: 'The PDF has too many pages. Please use a document with fewer than 1000 pages.',
      [ErrorCode.CORRUPTED_FILE]: 'The file appears to be corrupted. Please try uploading a different file.',
      
      [ErrorCode.OCR_FAILED]: 'We could not read the text from your document. Please ensure the document is clear and try again.',
      [ErrorCode.EXTRACTION_FAILED]: 'We could not extract the required information from your document. Please check if it\'s a valid document.',
      [ErrorCode.INVALID_RESPONSE]: 'There was an issue processing your document. Please try again.',
      [ErrorCode.PARSING_ERROR]: 'There was an error reading the document data. Please try again.',
      
      [ErrorCode.API_UNAVAILABLE]: 'The document processing service is temporarily unavailable. Please try again later.',
      [ErrorCode.API_RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
      [ErrorCode.API_AUTHENTICATION_FAILED]: 'Authentication failed. Please contact support.',
      [ErrorCode.API_QUOTA_EXCEEDED]: 'Service quota exceeded. Please try again later.',
      
      [ErrorCode.VERIFICATION_FAILED]: 'Document verification failed. Please check your document and try again.',
      [ErrorCode.DATA_MISMATCH]: 'The information in your document does not match our records. Please upload the correct document.',
      [ErrorCode.OFFICIAL_RECORDS_UNAVAILABLE]: 'Official records are temporarily unavailable. Please try again later.',
      
      [ErrorCode.PROCESSING_TIMEOUT]: 'Document processing took too long. Please try again with a smaller or clearer document.',
      [ErrorCode.PROCESSING_INTERRUPTED]: 'Document processing was interrupted. Please try again.',
      [ErrorCode.CONCURRENT_LIMIT_EXCEEDED]: 'Too many documents are being processed. Please wait and try again.',
      
      [ErrorCode.STORAGE_ERROR]: 'There was an error saving your document. Please try again.',
      [ErrorCode.DATABASE_ERROR]: 'There was a database error. Please try again.',
      [ErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your connection and try again.',
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again or contact support.'
    };

    return messages[code] || 'An error occurred. Please try again.';
  }

  /**
   * Handle API errors and convert to GeminiError
   */
  static handleApiError(error: any): GeminiError {
    // Handle fetch API errors with cause structure
    if (error.cause && error.cause.status) {
      const status = error.cause.status;
      
      switch (status) {
        case 401:
          return this.createError(
            ErrorCode.API_AUTHENTICATION_FAILED,
            'API authentication failed',
            error.cause.data
          );
        case 429:
          return this.createError(
            ErrorCode.API_RATE_LIMITED,
            'API rate limit exceeded',
            error.cause.data,
            true
          );
        case 503:
          return this.createError(
            ErrorCode.API_UNAVAILABLE,
            'API service unavailable',
            error.cause.data,
            true
          );
        default:
          return this.createError(
            ErrorCode.API_UNAVAILABLE,
            `API error: ${status}`,
            error.cause.data,
            status >= 500
          );
      }
    }

    // Handle axios-style errors (legacy support)
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          return this.createError(
            ErrorCode.API_AUTHENTICATION_FAILED,
            'API authentication failed',
            error.response.data
          );
        case 429:
          return this.createError(
            ErrorCode.API_RATE_LIMITED,
            'API rate limit exceeded',
            error.response.data,
            true
          );
        case 503:
          return this.createError(
            ErrorCode.API_UNAVAILABLE,
            'API service unavailable',
            error.response.data,
            true
          );
        default:
          return this.createError(
            ErrorCode.API_UNAVAILABLE,
            `API error: ${status}`,
            error.response.data,
            status >= 500
          );
      }
    }

    if (error.code === 'ECONNABORTED') {
      return this.createError(
        ErrorCode.PROCESSING_TIMEOUT,
        'Request timeout',
        error,
        true
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return this.createError(
        ErrorCode.NETWORK_ERROR,
        'Network connection error',
        error,
        true
      );
    }

    return this.createError(
      ErrorCode.UNKNOWN_ERROR,
      error.message || 'Unknown error',
      error
    );
  }

  /**
   * Determine if error should trigger retry
   */
  static shouldRetry(error: GeminiError, attemptCount: number, maxAttempts: number): boolean {
    if (attemptCount >= maxAttempts) {
      return false;
    }

    return error.retryable;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static getRetryDelay(attemptCount: number, baseDelay: number = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attemptCount), 30000); // Max 30 seconds
  }

  /**
   * Log error for debugging and monitoring
   */
  static logError(error: GeminiError, context?: any): void {
    const logData = {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      timestamp: error.timestamp,
      context
    };

    // In production, this would integrate with your logging service
    console.error('[GeminiDocumentVerification]', logData);
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: GeminiError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error 
        ? GeminiErrorHandler.handleApiError(error)
        : error as GeminiError;

      GeminiErrorHandler.logError(lastError, { attempt: attempt + 1, maxAttempts });

      if (!GeminiErrorHandler.shouldRetry(lastError, attempt, maxAttempts)) {
        throw lastError;
      }

      if (attempt < maxAttempts - 1) {
        const delay = GeminiErrorHandler.getRetryDelay(attempt, baseDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}