// Form Submission Controller - handles form blocking/unblocking based on document verification

import { 
  FormVerificationState,
  DocumentVerification,
  SubmissionEligibility,
  BlockingReason,
  RequiredAction,
  VerificationResult
} from '../types/geminiDocumentVerification';
import { 
  GeminiErrorHandler, 
  ErrorCode 
} from '../utils/geminiErrorHandling';
import { geminiAuditLogger } from './geminiAuditLogger';

interface FormSession {
  formId: string;
  userId: string;
  formType: 'nfiu' | 'kyc';
  verificationState: FormVerificationState;
  lastActivity: Date;
  sessionData: any;
}

interface BlockingConfiguration {
  requireCACVerification: boolean;
  requireIndividualVerification: boolean;
  allowPartialSubmission: boolean;
  criticalFieldsOnly: boolean;
  minimumConfidenceThreshold: number;
}

export class FormSubmissionController {
  private formSessions: Map<string, FormSession> = new Map();
  private blockingConfigurations: Map<string, BlockingConfiguration> = new Map();
  private sessionTimeoutMs = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Initialize default blocking configurations
    this.initializeBlockingConfigurations();
    
    // Start session cleanup timer
    this.startSessionCleanup();
  }

  /**
   * Initialize form session
   */
  async initializeFormSession(
    formId: string,
    userId: string,
    formType: 'nfiu' | 'kyc',
    formData?: any
  ): Promise<FormVerificationState> {
    try {
      const verificationState: FormVerificationState = {
        formId,
        documentVerifications: [],
        canSubmit: false,
        blockingReasons: [],
        lastUpdated: new Date()
      };

      const session: FormSession = {
        formId,
        userId,
        formType,
        verificationState,
        lastActivity: new Date(),
        sessionData: formData || {}
      };

      this.formSessions.set(formId, session);

      // Determine required verifications based on form type
      await this.updateRequiredVerifications(session);

      return verificationState;

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to initialize form session',
        error
      );
    }
  }

  /**
   * Check if form session exists
   */
  hasFormSession(formId: string): boolean {
    return this.formSessions.has(formId);
  }

  /**
   * Update document verification result
   */
  async updateDocumentVerification(
    formId: string,
    documentType: string,
    verificationResult: VerificationResult
  ): Promise<FormVerificationState> {
    try {
      const session = this.getSession(formId);
      
      // Find or create document verification
      let docVerification = session.verificationState.documentVerifications
        .find(dv => dv.documentType === documentType);

      if (!docVerification) {
        docVerification = {
          documentType,
          status: 'pending',
          uploadTimestamp: new Date()
        };
        session.verificationState.documentVerifications.push(docVerification);
      }

      // Update verification result
      docVerification.status = verificationResult.success ? 'verified' : 'failed';
      docVerification.result = verificationResult;
      docVerification.verificationTimestamp = new Date();

      if (!verificationResult.success) {
        docVerification.error = 'Verification failed';
      }

      // Update session activity
      session.lastActivity = new Date();
      session.verificationState.lastUpdated = new Date();

      // Re-evaluate submission eligibility
      await this.evaluateSubmissionEligibility(session);

      // Log verification update
      await geminiAuditLogger.logVerificationAttempt({
        processingId: `form_${formId}`,
        userId: session.userId,
        verificationType: documentType as any,
        success: verificationResult.success,
        mismatches: verificationResult.mismatches || [],
        apiProvider: 'verifydata',
        timestamp: new Date()
      });

      return session.verificationState;

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to update document verification',
        error
      );
    }
  }

  /**
   * Check if form can be submitted
   */
  async checkSubmissionEligibility(formId: string): Promise<SubmissionEligibility> {
    try {
      const session = this.getSession(formId);
      const config = this.getBlockingConfiguration(session.formType);

      const blockingReasons: BlockingReason[] = [];
      const requiredActions: RequiredAction[] = [];

      // Check required document verifications
      if (config.requireCACVerification) {
        const cacVerification = session.verificationState.documentVerifications
          .find(dv => dv.documentType === 'cac');

        if (!cacVerification) {
          blockingReasons.push({
            type: 'document_missing',
            message: 'CAC document verification is required',
            documentType: 'cac'
          });
          requiredActions.push({
            type: 'upload_document',
            message: 'Please upload and verify your CAC document',
            documentType: 'cac'
          });
        } else if (cacVerification.status === 'failed') {
          blockingReasons.push({
            type: 'verification_failed',
            message: 'CAC document verification failed',
            documentType: 'cac'
          });
          requiredActions.push({
            type: 'fix_mismatch',
            message: 'Please resolve CAC document verification issues',
            documentType: 'cac'
          });
        } else if (cacVerification.status === 'processing') {
          blockingReasons.push({
            type: 'processing_error',
            message: 'CAC document verification is still processing',
            documentType: 'cac'
          });
        }
      }

      if (config.requireIndividualVerification) {
        const individualVerification = session.verificationState.documentVerifications
          .find(dv => dv.documentType === 'individual');

        if (!individualVerification) {
          blockingReasons.push({
            type: 'document_missing',
            message: 'Individual document verification is required',
            documentType: 'individual'
          });
          requiredActions.push({
            type: 'upload_document',
            message: 'Please upload and verify your identity document',
            documentType: 'individual'
          });
        } else if (individualVerification.status === 'failed') {
          blockingReasons.push({
            type: 'verification_failed',
            message: 'Individual document verification failed',
            documentType: 'individual'
          });
          requiredActions.push({
            type: 'fix_mismatch',
            message: 'Please resolve identity document verification issues',
            documentType: 'individual'
          });
        } else if (individualVerification.status === 'processing') {
          blockingReasons.push({
            type: 'processing_error',
            message: 'Individual document verification is still processing',
            documentType: 'individual'
          });
        }
      }

      // Check confidence thresholds
      for (const verification of session.verificationState.documentVerifications) {
        if (verification.result && verification.result.confidence < config.minimumConfidenceThreshold) {
          blockingReasons.push({
            type: 'verification_failed',
            message: `${verification.documentType} verification confidence too low`,
            documentType: verification.documentType
          });
          requiredActions.push({
            type: 'retry_processing',
            message: `Please re-upload ${verification.documentType} document for better verification`,
            documentType: verification.documentType
          });
        }
      }

      // Check critical mismatches
      if (config.criticalFieldsOnly) {
        for (const verification of session.verificationState.documentVerifications) {
          if (verification.result && verification.result.mismatches) {
            const criticalMismatches = verification.result.mismatches.filter(m => m.isCritical);
            if (criticalMismatches.length > 0) {
              blockingReasons.push({
                type: 'verification_failed',
                message: `Critical mismatches found in ${verification.documentType}`,
                documentType: verification.documentType,
                field: criticalMismatches[0].field
              });
              requiredActions.push({
                type: 'fix_mismatch',
                message: `Please resolve critical mismatches in ${verification.documentType}`,
                documentType: verification.documentType
              });
            }
          }
        }
      }

      const canSubmit = blockingReasons.length === 0;

      return {
        canSubmit,
        blockingReasons,
        requiredActions
      };

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to check submission eligibility',
        error
      );
    }
  }

  /**
   * Block form submission
   */
  async blockFormSubmission(
    formId: string,
    reason: string,
    documentType?: string
  ): Promise<void> {
    try {
      const session = this.getSession(formId);
      
      session.verificationState.canSubmit = false;
      
      if (!session.verificationState.blockingReasons.includes(reason)) {
        session.verificationState.blockingReasons.push(reason);
      }

      session.verificationState.lastUpdated = new Date();
      session.lastActivity = new Date();

      // Log blocking event
      await geminiAuditLogger.logFormBlocking({
        formId,
        userId: session.userId,
        reason,
        documentType: documentType || 'unknown',
        timestamp: new Date()
      });

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to block form submission',
        error
      );
    }
  }

  /**
   * Unblock form submission
   */
  async unblockFormSubmission(formId: string): Promise<void> {
    try {
      const session = this.getSession(formId);
      
      // Re-evaluate eligibility
      const eligibility = await this.checkSubmissionEligibility(formId);
      
      session.verificationState.canSubmit = eligibility.canSubmit;
      session.verificationState.blockingReasons = eligibility.blockingReasons.map(br => br.message);
      session.verificationState.lastUpdated = new Date();
      session.lastActivity = new Date();

    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to unblock form submission',
        error
      );
    }
  }

  /**
   * Get form verification state
   */
  getFormVerificationState(formId: string): FormVerificationState {
    const session = this.getSession(formId);
    return { ...session.verificationState };
  }

  /**
   * Update session data
   */
  async updateSessionData(formId: string, data: any): Promise<void> {
    const session = this.getSession(formId);
    session.sessionData = { ...session.sessionData, ...data };
    session.lastActivity = new Date();
  }

  /**
   * Get session data
   */
  getSessionData(formId: string): any {
    const session = this.getSession(formId);
    return { ...session.sessionData };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [formId, session] of this.formSessions.entries()) {
      if (now - session.lastActivity.getTime() > this.sessionTimeoutMs) {
        expiredSessions.push(formId);
      }
    }

    for (const formId of expiredSessions) {
      this.formSessions.delete(formId);
    }
  }

  /**
   * Get session or throw error
   */
  private getSession(formId: string): FormSession {
    const session = this.formSessions.get(formId);
    if (!session) {
      throw GeminiErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        `Form session not found for formId: ${formId}. Please initialize the session first using initializeFormSession().`,
        { formId, availableSessions: Array.from(this.formSessions.keys()) }
      );
    }
    return session;
  }

  /**
   * Get blocking configuration for form type
   */
  private getBlockingConfiguration(formType: string): BlockingConfiguration {
    return this.blockingConfigurations.get(formType) || this.blockingConfigurations.get('default')!;
  }

  /**
   * Initialize blocking configurations
   */
  private initializeBlockingConfigurations(): void {
    // Default configuration
    this.blockingConfigurations.set('default', {
      requireCACVerification: false,
      requireIndividualVerification: false,
      allowPartialSubmission: true,
      criticalFieldsOnly: true,
      minimumConfidenceThreshold: 70
    });

    // NFIU Corporate form configuration
    this.blockingConfigurations.set('nfiu_corporate', {
      requireCACVerification: true,
      requireIndividualVerification: false,
      allowPartialSubmission: false,
      criticalFieldsOnly: true,
      minimumConfidenceThreshold: 85
    });

    // NFIU Individual form configuration
    this.blockingConfigurations.set('nfiu_individual', {
      requireCACVerification: false,
      requireIndividualVerification: true,
      allowPartialSubmission: false,
      criticalFieldsOnly: true,
      minimumConfidenceThreshold: 85
    });

    // KYC Corporate form configuration
    this.blockingConfigurations.set('kyc_corporate', {
      requireCACVerification: true,
      requireIndividualVerification: false,
      allowPartialSubmission: false,
      criticalFieldsOnly: true,
      minimumConfidenceThreshold: 80
    });

    // KYC Individual form configuration
    this.blockingConfigurations.set('kyc_individual', {
      requireCACVerification: false,
      requireIndividualVerification: true,
      allowPartialSubmission: false,
      criticalFieldsOnly: true,
      minimumConfidenceThreshold: 80
    });
  }

  /**
   * Update required verifications based on form type
   */
  private async updateRequiredVerifications(session: FormSession): Promise<void> {
    const config = this.getBlockingConfiguration(`${session.formType}_${this.inferFormSubtype(session)}`);
    
    // Initialize required document verifications
    if (config.requireCACVerification) {
      session.verificationState.documentVerifications.push({
        documentType: 'cac',
        status: 'pending',
        uploadTimestamp: new Date()
      });
    }

    if (config.requireIndividualVerification) {
      session.verificationState.documentVerifications.push({
        documentType: 'individual',
        status: 'pending',
        uploadTimestamp: new Date()
      });
    }

    // Update blocking reasons
    await this.evaluateSubmissionEligibility(session);
  }

  /**
   * Infer form subtype (corporate/individual) from session data
   */
  private inferFormSubtype(session: FormSession): string {
    // Check session data for indicators
    if (session.sessionData?.companyName || session.sessionData?.rcNumber) {
      return 'corporate';
    }
    
    if (session.sessionData?.firstName || session.sessionData?.lastName || session.sessionData?.nin) {
      return 'individual';
    }

    // Default to individual
    return 'individual';
  }

  /**
   * Evaluate submission eligibility and update state
   */
  private async evaluateSubmissionEligibility(session: FormSession): Promise<void> {
    const eligibility = await this.checkSubmissionEligibility(session.formId);
    
    session.verificationState.canSubmit = eligibility.canSubmit;
    session.verificationState.blockingReasons = eligibility.blockingReasons.map(br => br.message);
  }

  /**
   * Start session cleanup timer
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredSessions().catch(error => {
        console.error('Session cleanup failed:', error);
      });
    }, 5 * 60 * 1000); // Run every 5 minutes
  }
}

// Export singleton instance
export const formSubmissionController = new FormSubmissionController();