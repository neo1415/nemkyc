// Data Privacy and NDPR Compliance Service for Gemini Document Verification

import { GeminiError, ErrorCode, GeminiErrorHandler } from '@/utils/geminiErrorHandling';
import { ProcessedDocument } from '@/types/geminiDocumentVerification';

export interface DataProcessingRecord {
  id: string;
  userId: string;
  documentId: string;
  processingPurpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataTypes: string[];
  timestamp: Date;
  retentionPeriod: number; // in days
  consentId?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'document_processing' | 'data_storage' | 'verification_sharing';
  granted: boolean;
  timestamp: Date;
  expiryDate?: Date;
  withdrawnDate?: Date;
  ipAddress: string;
  userAgent: string;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  autoDelete: boolean;
  archiveBeforeDelete: boolean;
  legalRequirement?: string;
}

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: Array<{
    type: string;
    confidence: number;
    location: string;
    masked: boolean;
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export class GeminiDataPrivacy {
  private readonly retentionPolicies: DataRetentionPolicy[] = [
    {
      dataType: 'document_content',
      retentionPeriod: 2555, // 7 years for financial documents
      autoDelete: true,
      archiveBeforeDelete: true,
      legalRequirement: 'NDPR Article 17 - Right to erasure'
    },
    {
      dataType: 'verification_results',
      retentionPeriod: 2555, // 7 years
      autoDelete: true,
      archiveBeforeDelete: true,
      legalRequirement: 'Financial regulations compliance'
    },
    {
      dataType: 'processing_logs',
      retentionPeriod: 1095, // 3 years
      autoDelete: true,
      archiveBeforeDelete: false,
      legalRequirement: 'Audit trail requirements'
    },
    {
      dataType: 'consent_records',
      retentionPeriod: 2555, // 7 years after withdrawal
      autoDelete: false,
      archiveBeforeDelete: true,
      legalRequirement: 'Proof of consent compliance'
    }
  ];

  private readonly piiPatterns = {
    nin: {
      pattern: /\b\d{11}\b/g,
      confidence: 0.9,
      description: 'National Identification Number'
    },
    bvn: {
      pattern: /\b\d{11}\b/g,
      confidence: 0.8,
      description: 'Bank Verification Number'
    },
    email: {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      confidence: 0.95,
      description: 'Email address'
    },
    phone: {
      pattern: /(\+234|0)[789]\d{9}/g,
      confidence: 0.9,
      description: 'Nigerian phone number'
    },
    bankAccount: {
      pattern: /\b\d{10}\b/g,
      confidence: 0.7,
      description: 'Bank account number'
    },
    address: {
      pattern: /\b\d+\s+[A-Za-z\s,]+(?:street|road|avenue|close|crescent|way)\b/gi,
      confidence: 0.6,
      description: 'Physical address'
    }
  };

  /**
   * Record data processing activity for NDPR compliance
   */
  async recordDataProcessing(record: Omit<DataProcessingRecord, 'id' | 'timestamp'>): Promise<string> {
    try {
      const processingRecord: DataProcessingRecord = {
        id: this.generateRecordId(),
        timestamp: new Date(),
        ...record
      };

      // Validate legal basis
      this.validateLegalBasis(processingRecord);

      // Store processing record (in production, this would go to a secure database)
      await this.storeProcessingRecord(processingRecord);

      // Schedule data deletion based on retention policy
      this.scheduleDataDeletion(processingRecord);

      return processingRecord.id;

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.DATABASE_ERROR,
        'Failed to record data processing activity',
        error
      );
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(consent: Omit<ConsentRecord, 'id' | 'timestamp'>): Promise<string> {
    try {
      const consentRecord: ConsentRecord = {
        id: this.generateRecordId(),
        timestamp: new Date(),
        ...consent
      };

      // Store consent record
      await this.storeConsentRecord(consentRecord);

      // If consent is withdrawn, trigger data deletion process
      if (!consent.granted && consent.withdrawnDate) {
        await this.processConsentWithdrawal(consentRecord);
      }

      return consentRecord.id;

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.DATABASE_ERROR,
        'Failed to record consent',
        error
      );
    }
  }

  /**
   * Detect and mask PII in document content
   */
  async detectAndMaskPII(content: string, maskingLevel: 'partial' | 'full' = 'partial'): Promise<{
    maskedContent: string;
    detectionResult: PIIDetectionResult;
  }> {
    const detectedTypes: PIIDetectionResult['detectedTypes'] = [];
    let maskedContent = content;
    let hasPII = false;

    // Detect PII using patterns
    for (const [type, config] of Object.entries(this.piiPatterns)) {
      const matches = content.match(config.pattern);
      
      if (matches) {
        hasPII = true;
        
        for (const match of matches) {
          detectedTypes.push({
            type,
            confidence: config.confidence,
            location: `Position ${content.indexOf(match)}`,
            masked: true
          });

          // Apply masking
          const masked = this.maskValue(match, maskingLevel);
          maskedContent = maskedContent.replace(match, masked);
        }
      }
    }

    // Calculate risk level
    const riskLevel = this.calculatePIIRiskLevel(detectedTypes);

    // Generate recommendations
    const recommendations = this.generatePIIRecommendations(detectedTypes, riskLevel);

    const detectionResult: PIIDetectionResult = {
      hasPII,
      detectedTypes,
      riskLevel,
      recommendations
    };

    return { maskedContent, detectionResult };
  }

  /**
   * Check if user has valid consent for data processing
   */
  async checkConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<{
    hasConsent: boolean;
    consentRecord?: ConsentRecord;
    expiryDate?: Date;
  }> {
    try {
      const consentRecord = await this.getLatestConsent(userId, consentType);
      
      if (!consentRecord) {
        return { hasConsent: false };
      }

      // Check if consent is still valid
      const isValid = consentRecord.granted && 
                     !consentRecord.withdrawnDate &&
                     (!consentRecord.expiryDate || consentRecord.expiryDate > new Date());

      return {
        hasConsent: isValid,
        consentRecord,
        expiryDate: consentRecord.expiryDate
      };

    } catch (error) {
      console.error('Consent check failed:', error);
      return { hasConsent: false };
    }
  }

  /**
   * Process data subject rights request (NDPR Article 15-22)
   */
  async processDataSubjectRequest(request: {
    userId: string;
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
    details?: string;
  }): Promise<{
    requestId: string;
    status: 'received' | 'processing' | 'completed' | 'rejected';
    estimatedCompletion: Date;
    data?: any;
  }> {
    const requestId = this.generateRecordId();
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 30); // 30 days as per NDPR

    try {
      switch (request.requestType) {
        case 'access':
          return await this.processAccessRequest(requestId, request.userId, estimatedCompletion);
        
        case 'erasure':
          return await this.processErasureRequest(requestId, request.userId, estimatedCompletion);
        
        case 'portability':
          return await this.processPortabilityRequest(requestId, request.userId, estimatedCompletion);
        
        case 'rectification':
          return await this.processRectificationRequest(requestId, request.userId, estimatedCompletion);
        
        case 'restriction':
          return await this.processRestrictionRequest(requestId, request.userId, estimatedCompletion);
        
        default:
          throw new Error('Unsupported request type');
      }

    } catch (error) {
      return {
        requestId,
        status: 'rejected',
        estimatedCompletion
      };
    }
  }

  /**
   * Generate privacy impact assessment
   */
  generatePrivacyImpactAssessment(processingActivity: {
    purpose: string;
    dataTypes: string[];
    recipients: string[];
    retentionPeriod: number;
    securityMeasures: string[];
  }): {
    riskLevel: 'low' | 'medium' | 'high';
    risks: Array<{
      type: string;
      likelihood: number;
      impact: number;
      mitigation: string;
    }>;
    recommendations: string[];
    complianceStatus: 'compliant' | 'needs_review' | 'non_compliant';
  } {
    const risks = this.assessPrivacyRisks(processingActivity);
    const riskLevel = this.calculateOverallRiskLevel(risks);
    const recommendations = this.generatePrivacyRecommendations(risks, processingActivity);
    const complianceStatus = this.assessComplianceStatus(processingActivity, risks);

    return {
      riskLevel,
      risks,
      recommendations,
      complianceStatus
    };
  }

  /**
   * Validate legal basis for data processing
   */
  private validateLegalBasis(record: DataProcessingRecord): void {
    const validBases = ['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'];
    
    if (!validBases.includes(record.legalBasis)) {
      throw new Error('Invalid legal basis for data processing');
    }

    // Additional validation based on processing purpose
    if (record.processingPurpose.includes('marketing') && record.legalBasis !== 'consent') {
      throw new Error('Marketing activities require explicit consent');
    }
  }

  /**
   * Mask sensitive values
   */
  private maskValue(value: string, level: 'partial' | 'full'): string {
    if (level === 'full') {
      return '*'.repeat(value.length);
    }

    // Partial masking - show first and last characters
    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }

    const visibleChars = Math.max(1, Math.floor(value.length * 0.2));
    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    const middle = '*'.repeat(value.length - (visibleChars * 2));

    return start + middle + end;
  }

  /**
   * Calculate PII risk level
   */
  private calculatePIIRiskLevel(detectedTypes: PIIDetectionResult['detectedTypes']): PIIDetectionResult['riskLevel'] {
    if (detectedTypes.length === 0) return 'low';
    
    const highRiskTypes = ['nin', 'bvn', 'bankAccount'];
    const hasHighRisk = detectedTypes.some(d => highRiskTypes.includes(d.type));
    
    if (hasHighRisk) return 'critical';
    if (detectedTypes.length > 3) return 'high';
    if (detectedTypes.length > 1) return 'medium';
    return 'low';
  }

  /**
   * Generate PII handling recommendations
   */
  private generatePIIRecommendations(
    detectedTypes: PIIDetectionResult['detectedTypes'],
    riskLevel: PIIDetectionResult['riskLevel']
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('Implement additional encryption for highly sensitive data');
      recommendations.push('Restrict access to authorized personnel only');
      recommendations.push('Enable audit logging for all access attempts');
    }

    if (detectedTypes.some(d => d.type === 'nin' || d.type === 'bvn')) {
      recommendations.push('Verify user consent for processing government-issued identifiers');
    }

    if (detectedTypes.length > 0) {
      recommendations.push('Consider data minimization - only process necessary information');
      recommendations.push('Implement automatic data deletion after retention period');
    }

    return recommendations;
  }

  /**
   * Generate unique record ID
   */
  private generateRecordId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store processing record (mock implementation)
   */
  private async storeProcessingRecord(record: DataProcessingRecord): Promise<void> {
    // In production, this would store in a secure database
    console.log('Storing processing record:', record.id);
  }

  /**
   * Store consent record (mock implementation)
   */
  private async storeConsentRecord(record: ConsentRecord): Promise<void> {
    // In production, this would store in a secure database
    console.log('Storing consent record:', record.id);
  }

  /**
   * Schedule data deletion based on retention policy
   */
  private scheduleDataDeletion(record: DataProcessingRecord): void {
    const policy = this.retentionPolicies.find(p => 
      record.dataTypes.some(type => type.includes(p.dataType))
    );

    if (policy && policy.autoDelete) {
      const deletionDate = new Date(record.timestamp);
      deletionDate.setDate(deletionDate.getDate() + policy.retentionPeriod);

      // Schedule deletion (in production, this would use a job queue)
      console.log(`Scheduled deletion for ${record.id} on ${deletionDate}`);
    }
  }

  /**
   * Process consent withdrawal
   */
  private async processConsentWithdrawal(consent: ConsentRecord): Promise<void> {
    // Trigger data deletion process for withdrawn consent
    console.log(`Processing consent withdrawal for user ${consent.userId}`);
  }

  /**
   * Get latest consent record (mock implementation)
   */
  private async getLatestConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<ConsentRecord | null> {
    // In production, this would query the database
    return null;
  }

  /**
   * Process data access request
   */
  private async processAccessRequest(requestId: string, userId: string, estimatedCompletion: Date) {
    // Compile all data for the user
    return {
      requestId,
      status: 'processing' as const,
      estimatedCompletion,
      data: null // Would contain user's data in production
    };
  }

  /**
   * Process data erasure request
   */
  private async processErasureRequest(requestId: string, userId: string, estimatedCompletion: Date) {
    // Delete user's data
    return {
      requestId,
      status: 'processing' as const,
      estimatedCompletion
    };
  }

  /**
   * Process data portability request
   */
  private async processPortabilityRequest(requestId: string, userId: string, estimatedCompletion: Date) {
    // Export user's data in machine-readable format
    return {
      requestId,
      status: 'processing' as const,
      estimatedCompletion,
      data: null // Would contain exported data in production
    };
  }

  /**
   * Process rectification request
   */
  private async processRectificationRequest(requestId: string, userId: string, estimatedCompletion: Date) {
    return {
      requestId,
      status: 'processing' as const,
      estimatedCompletion
    };
  }

  /**
   * Process restriction request
   */
  private async processRestrictionRequest(requestId: string, userId: string, estimatedCompletion: Date) {
    return {
      requestId,
      status: 'processing' as const,
      estimatedCompletion
    };
  }

  /**
   * Assess privacy risks
   */
  private assessPrivacyRisks(activity: any): Array<{
    type: string;
    likelihood: number;
    impact: number;
    mitigation: string;
  }> {
    // Mock implementation - in production, this would be more sophisticated
    return [
      {
        type: 'Data breach',
        likelihood: 0.3,
        impact: 0.9,
        mitigation: 'Implement encryption and access controls'
      }
    ];
  }

  /**
   * Calculate overall risk level
   */
  private calculateOverallRiskLevel(risks: any[]): 'low' | 'medium' | 'high' {
    const maxRisk = Math.max(...risks.map(r => r.likelihood * r.impact));
    if (maxRisk > 0.7) return 'high';
    if (maxRisk > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Generate privacy recommendations
   */
  private generatePrivacyRecommendations(risks: any[], activity: any): string[] {
    return [
      'Implement data minimization principles',
      'Regular security assessments',
      'Staff training on data protection'
    ];
  }

  /**
   * Assess compliance status
   */
  private assessComplianceStatus(activity: any, risks: any[]): 'compliant' | 'needs_review' | 'non_compliant' {
    // Mock implementation
    return 'compliant';
  }
}

// Singleton instance
export const geminiDataPrivacy = new GeminiDataPrivacy();