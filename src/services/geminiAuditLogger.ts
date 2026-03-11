// Audit Logger Service - handles comprehensive event tracking for Gemini document verification

import { 
  DocumentUploadEvent,
  OCRProcessingEvent,
  VerificationEvent,
  FormBlockingEvent,
  APIErrorEvent
} from '../types/geminiDocumentVerification';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: string;
  userId?: string;
  sessionId?: string;
  documentId?: string;
  formId?: string;
  eventData: any;
  sensitiveDataMasked: boolean;
  ipAddress?: string;
  userAgent?: string;
  processingTime?: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'document_processing' | 'verification' | 'form_interaction' | 'api_call' | 'security' | 'system';
  retentionPeriod: number; // in years
  complianceFlags: string[];
}

interface AuditConfiguration {
  enableSensitiveDataMasking: boolean;
  retentionPeriodYears: number;
  enableRealTimeAlerts: boolean;
  enableIntegrityChecking: boolean;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
  maxLogSize: number; // in MB
  archiveAfterDays: number;
}

interface DataMaskingRules {
  [fieldName: string]: (value: any) => string;
}

export class GeminiAuditLogger {
  private config: AuditConfiguration;
  private logBuffer: AuditLogEntry[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private integrityHashes: Map<string, string> = new Map();

  constructor(config?: Partial<AuditConfiguration>) {
    this.config = {
      enableSensitiveDataMasking: true,
      retentionPeriodYears: 7,
      enableRealTimeAlerts: true,
      enableIntegrityChecking: true,
      logLevel: 'info',
      maxLogSize: 100, // 100MB
      archiveAfterDays: 365,
      ...config
    };

    // Start buffer flush interval
    this.startBufferFlush();
  }

  /**
   * Data masking rules for sensitive information
   */
  private dataMaskingRules: DataMaskingRules = {
    // Personal identifiers
    nin: (value: string) => value ? `***${value.slice(-4)}` : '***',
    bvn: (value: string) => value ? `***${value.slice(-4)}` : '***',
    phoneNumber: (value: string) => value ? `***${value.slice(-4)}` : '***',
    email: (value: string) => {
      if (!value || !value.includes('@')) return '***@***.***';
      const [local, domain] = value.split('@');
      return `${local.charAt(0)}***@${domain}`;
    },
    
    // Document content
    documentContent: () => '[DOCUMENT_CONTENT_MASKED]',
    extractedText: () => '[EXTRACTED_TEXT_MASKED]',
    
    // Financial information
    accountNumber: (value: string) => value ? `***${value.slice(-4)}` : '***',
    
    // Addresses (partial masking)
    address: (value: string) => {
      if (!value) return '***';
      const words = value.split(' ');
      if (words.length <= 2) return '***';
      return `${words[0]} *** ${words[words.length - 1]}`;
    },
    
    // Names (partial masking for audit purposes)
    fullName: (value: string) => {
      if (!value) return '***';
      const names = value.split(' ');
      if (names.length === 1) return `${names[0].charAt(0)}***`;
      return `${names[0]} ${names[names.length - 1].charAt(0)}***`;
    },
    
    // Company information
    companyName: (value: string) => {
      if (!value) return '***';
      const words = value.split(' ');
      return words.length > 1 ? `${words[0]} ***` : `${value.charAt(0)}***`;
    }
  };

  /**
   * Log document upload event
   */
  async logDocumentUpload(event: DocumentUploadEvent): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      eventType: 'DOCUMENT_UPLOAD',
      userId: event.userId,
      sessionId: event.sessionId,
      documentId: event.documentId,
      formId: event.formId,
      eventData: this.maskSensitiveData({
        fileName: event.fileName,
        fileSize: event.fileSize,
        mimeType: event.mimeType,
        documentType: event.documentType,
        uploadMethod: event.uploadMethod || 'web_upload',
        clientInfo: event.clientInfo
      }),
      sensitiveDataMasked: this.config.enableSensitiveDataMasking,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      severity: 'info',
      category: 'document_processing',
      retentionPeriod: this.config.retentionPeriodYears,
      complianceFlags: ['NDPR', 'GDPR', 'DOCUMENT_RETENTION']
    };

    await this.writeAuditLog(auditEntry);
  }

  /**
   * Log OCR processing event
   */
  async logOCRProcessing(event: OCRProcessingEvent): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      eventType: 'OCR_PROCESSING',
      userId: event.userId,
      sessionId: event.sessionId,
      documentId: event.documentId,
      eventData: this.maskSensitiveData({
        processingStartTime: event.processingStartTime,
        processingEndTime: event.processingEndTime,
        processingDuration: event.processingDuration,
        ocrProvider: event.ocrProvider || 'gemini',
        extractionSuccess: event.extractionSuccess,
        confidence: event.confidence,
        fieldsExtracted: event.fieldsExtracted,
        apiCallsCount: event.apiCallsCount,
        errorDetails: event.errorDetails
      }),
      sensitiveDataMasked: this.config.enableSensitiveDataMasking,
      processingTime: event.processingDuration,
      severity: event.extractionSuccess ? 'info' : 'warning',
      category: 'document_processing',
      retentionPeriod: this.config.retentionPeriodYears,
      complianceFlags: ['PROCESSING_AUDIT', 'API_USAGE']
    };

    await this.writeAuditLog(auditEntry);
  }

  /**
   * Log verification attempt
   */
  async logVerificationAttempt(event: VerificationEvent): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      eventType: 'VERIFICATION_ATTEMPT',
      userId: event.userId,
      sessionId: event.sessionId,
      documentId: event.documentId,
      formId: event.formId,
      eventData: this.maskSensitiveData({
        verificationType: event.verificationType,
        verificationProvider: event.verificationProvider,
        verificationStartTime: event.verificationStartTime,
        verificationEndTime: event.verificationEndTime,
        verificationDuration: event.verificationDuration,
        verificationSuccess: event.verificationSuccess,
        confidence: event.confidence,
        mismatchCount: event.mismatchCount,
        criticalMismatchCount: event.criticalMismatchCount,
        canProceed: event.canProceed,
        requiresManualReview: event.requiresManualReview,
        apiCallsCount: event.apiCallsCount,
        fallbackUsed: event.fallbackUsed,
        errorDetails: event.errorDetails
      }),
      sensitiveDataMasked: this.config.enableSensitiveDataMasked,
      processingTime: event.verificationDuration,
      severity: event.verificationSuccess ? 'info' : 'warning',
      category: 'verification',
      retentionPeriod: this.config.retentionPeriodYears,
      complianceFlags: ['VERIFICATION_AUDIT', 'COMPLIANCE_CHECK']
    };

    await this.writeAuditLog(auditEntry);
  }

  /**
   * Log form blocking event
   */
  async logFormBlocking(event: FormBlockingEvent): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      eventType: 'FORM_BLOCKING',
      userId: event.userId,
      sessionId: event.sessionId,
      documentId: event.documentId,
      formId: event.formId,
      eventData: {
        blockingReason: event.blockingReason,
        blockingType: event.blockingType,
        blockingDuration: event.blockingDuration,
        canOverride: event.canOverride,
        overrideRequirements: event.overrideRequirements,
        userGuidance: event.userGuidance,
        automaticUnblockConditions: event.automaticUnblockConditions
      },
      sensitiveDataMasked: false, // No sensitive data in blocking events
      severity: event.blockingType === 'critical' ? 'critical' : 'warning',
      category: 'form_interaction',
      retentionPeriod: this.config.retentionPeriodYears,
      complianceFlags: ['FORM_SECURITY', 'USER_EXPERIENCE']
    };

    await this.writeAuditLog(auditEntry);
  }

  /**
   * Log API error
   */
  async logAPIError(event: APIErrorEvent): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      eventType: 'API_ERROR',
      userId: event.userId,
      sessionId: event.sessionId,
      documentId: event.documentId,
      eventData: {
        apiProvider: event.apiProvider,
        apiEndpoint: event.apiEndpoint,
        httpMethod: event.httpMethod,
        statusCode: event.statusCode,
        errorCode: event.errorCode,
        errorMessage: event.errorMessage,
        requestDuration: event.requestDuration,
        retryAttempt: event.retryAttempt,
        maxRetries: event.maxRetries,
        willRetry: event.willRetry,
        rateLimitHit: event.rateLimitHit,
        quotaExceeded: event.quotaExceeded
      },
      sensitiveDataMasked: false, // API errors don't contain sensitive data
      processingTime: event.requestDuration,
      severity: event.statusCode >= 500 ? 'error' : 'warning',
      category: 'api_call',
      retentionPeriod: this.config.retentionPeriodYears,
      complianceFlags: ['API_MONITORING', 'ERROR_TRACKING']
    };

    await this.writeAuditLog(auditEntry);

    // Send real-time alert for critical API errors
    if (this.config.enableRealTimeAlerts && event.statusCode >= 500) {
      await this.sendRealTimeAlert(auditEntry);
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    details: any,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      eventType: `SECURITY_${eventType.toUpperCase()}`,
      userId,
      sessionId,
      eventData: details,
      sensitiveDataMasked: false,
      severity,
      category: 'security',
      retentionPeriod: this.config.retentionPeriodYears,
      complianceFlags: ['SECURITY_AUDIT', 'INCIDENT_TRACKING']
    };

    await this.writeAuditLog(auditEntry);

    // Send immediate alert for security events
    if (this.config.enableRealTimeAlerts && severity === 'critical') {
      await this.sendRealTimeAlert(auditEntry);
    }
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    eventType: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    details: any
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      eventType: `SYSTEM_${eventType.toUpperCase()}`,
      eventData: details,
      sensitiveDataMasked: false,
      severity,
      category: 'system',
      retentionPeriod: this.config.retentionPeriodYears,
      complianceFlags: ['SYSTEM_MONITORING']
    };

    await this.writeAuditLog(auditEntry);
  }

  /**
   * Mask sensitive data according to rules
   */
  private maskSensitiveData(data: any): any {
    if (!this.config.enableSensitiveDataMasking) {
      return data;
    }

    const masked = { ...data };
    
    for (const [field, maskingFunction] of Object.entries(this.dataMaskingRules)) {
      if (masked[field] !== undefined) {
        masked[field] = maskingFunction(masked[field]);
      }
    }

    return masked;
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Write audit log entry
   */
  private async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    // Add to buffer
    this.logBuffer.push(entry);

    // Calculate integrity hash if enabled
    if (this.config.enableIntegrityChecking) {
      const hash = await this.calculateIntegrityHash(entry);
      this.integrityHashes.set(entry.id, hash);
    }

    // Immediate write for critical events
    if (entry.severity === 'critical') {
      await this.flushBuffer();
    }

    // Console log for development
    console.log(`[GeminiDocumentVerification] ${entry.eventType}:`, {
      id: entry.id,
      timestamp: entry.timestamp,
      severity: entry.severity,
      category: entry.category,
      userId: entry.userId,
      documentId: entry.documentId,
      ...entry.eventData
    });
  }

  /**
   * Start buffer flush interval
   */
  private startBufferFlush(): void {
    this.bufferFlushInterval = setInterval(async () => {
      if (this.logBuffer.length > 0) {
        await this.flushBuffer();
      }
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Flush log buffer to persistent storage
   */
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // In production, this would write to a secure audit database
      // For now, we'll simulate the write operation
      await this.writeToAuditDatabase(logsToFlush);
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-add logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * Write logs to audit database (simulated)
   */
  private async writeToAuditDatabase(logs: AuditLogEntry[]): Promise<void> {
    // In production, this would:
    // 1. Connect to secure audit database
    // 2. Write logs with encryption
    // 3. Verify write integrity
    // 4. Update retention policies
    
    // Simulate database write
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`[AUDIT] Flushed ${logs.length} audit log entries to database`);
  }

  /**
   * Calculate integrity hash for audit entry
   */
  private async calculateIntegrityHash(entry: AuditLogEntry): Promise<string> {
    // In production, this would use a proper cryptographic hash
    const entryString = JSON.stringify(entry);
    let hash = 0;
    for (let i = 0; i < entryString.length; i++) {
      const char = entryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Send real-time alert for critical events
   */
  private async sendRealTimeAlert(entry: AuditLogEntry): Promise<void> {
    // In production, this would:
    // 1. Send email/SMS alerts to administrators
    // 2. Post to monitoring systems (Slack, PagerDuty, etc.)
    // 3. Update dashboard alerts
    
    console.warn(`[ALERT] Critical audit event: ${entry.eventType}`, {
      id: entry.id,
      timestamp: entry.timestamp,
      severity: entry.severity,
      details: entry.eventData
    });
  }

  /**
   * Verify audit log integrity
   */
  async verifyIntegrity(logId: string): Promise<boolean> {
    if (!this.config.enableIntegrityChecking) {
      return true;
    }

    const storedHash = this.integrityHashes.get(logId);
    if (!storedHash) {
      return false;
    }

    // In production, this would:
    // 1. Retrieve the log entry from database
    // 2. Recalculate its hash
    // 3. Compare with stored hash
    
    return true; // Simulated verification
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(timeRange: { start: Date; end: Date }): Promise<any> {
    // In production, this would query the audit database
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsByCategory: {},
      eventsBySeverity: {},
      integrityViolations: 0,
      retentionCompliance: 100
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }
    
    // Flush remaining logs
    await this.flushBuffer();
    
    console.log('[AUDIT] Gemini Audit Logger shutdown complete');
  }
}

// Export singleton instance
export const geminiAuditLogger = new GeminiAuditLogger();