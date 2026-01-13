/**
 * Integration Tests for Identity Remediation System
 * 
 * Feature: identity-remediation
 * 
 * Tests:
 * - End-to-end batch upload flow
 * - Email sending with mock SMTP
 * - Verification flow with mock Paystack
 * - Admin approval workflow
 * 
 * **Validates: Requirements 1.x, 3.x, 4.x, 5.x**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  RemediationBatch,
  RemediationRecord,
  RemediationRecordStatus,
  RemediationAuditLog,
  ParsedUploadRow,
  CreateBatchRequest,
  VerificationSubmitRequest,
  VerificationEmailData,
} from '../../types/remediation';
import { generateSecureToken, generateTokenWithExpiration, isTokenExpired } from '../../utils/tokenUtils';
import { generateVerificationEmail } from '../../templates/verificationEmail';

// ========== Mock Implementations ==========

/**
 * Mock Firestore database for testing
 */
class MockFirestore {
  private batches: Map<string, RemediationBatch> = new Map();
  private records: Map<string, RemediationRecord> = new Map();
  private auditLogs: RemediationAuditLog[] = [];

  reset() {
    this.batches.clear();
    this.records.clear();
    this.auditLogs = [];
  }

  createBatch(batch: RemediationBatch): void {
    this.batches.set(batch.id, batch);
  }

  getBatch(id: string): RemediationBatch | undefined {
    return this.batches.get(id);
  }

  updateBatch(id: string, updates: Partial<RemediationBatch>): void {
    const batch = this.batches.get(id);
    if (batch) {
      this.batches.set(id, { ...batch, ...updates, updatedAt: new Date() });
    }
  }

  createRecord(record: RemediationRecord): void {
    this.records.set(record.id, record);
  }

  getRecord(id: string): RemediationRecord | undefined {
    return this.records.get(id);
  }

  getRecordByToken(token: string): RemediationRecord | undefined {
    return Array.from(this.records.values()).find(r => r.token === token);
  }

  updateRecord(id: string, updates: Partial<RemediationRecord>): void {
    const record = this.records.get(id);
    if (record) {
      this.records.set(id, { ...record, ...updates, updatedAt: new Date() });
    }
  }

  getRecordsByBatch(batchId: string): RemediationRecord[] {
    return Array.from(this.records.values()).filter(r => r.batchId === batchId);
  }

  getRecordsByStatus(batchId: string, status: RemediationRecordStatus): RemediationRecord[] {
    return this.getRecordsByBatch(batchId).filter(r => r.status === status);
  }

  addAuditLog(log: RemediationAuditLog): void {
    this.auditLogs.push(log);
  }

  getAuditLogs(batchId?: string, recordId?: string): RemediationAuditLog[] {
    return this.auditLogs.filter(log => {
      if (batchId && log.batchId !== batchId) return false;
      if (recordId && log.recordId !== recordId) return false;
      return true;
    });
  }
}

/**
 * Mock SMTP service for testing email sending
 */
class MockSMTPService {
  private sentEmails: Array<{
    to: string;
    subject: string;
    html: string;
    text: string;
    sentAt: Date;
  }> = [];
  private failureEmails: Set<string> = new Set();

  reset() {
    this.sentEmails = [];
    this.failureEmails.clear();
  }

  setFailureEmail(email: string) {
    this.failureEmails.add(email);
  }

  async sendEmail(to: string, subject: string, html: string, text: string): Promise<{ success: boolean; error?: string }> {
    if (this.failureEmails.has(to)) {
      return { success: false, error: 'SMTP delivery failed: mailbox not found' };
    }
    this.sentEmails.push({ to, subject, html, text, sentAt: new Date() });
    return { success: true };
  }

  getSentEmails() {
    return this.sentEmails;
  }

  getEmailsSentTo(email: string) {
    return this.sentEmails.filter(e => e.to === email);
  }
}

/**
 * Mock Paystack verification service
 */
class MockPaystackService {
  private verificationResults: Map<string, { success: boolean; name?: string; error?: string }> = new Map();

  reset() {
    this.verificationResults.clear();
  }

  setVerificationResult(identityNumber: string, result: { success: boolean; name?: string; error?: string }) {
    this.verificationResults.set(identityNumber, result);
  }

  async verifyNIN(nin: string): Promise<{ success: boolean; data?: { firstName: string; lastName: string }; error?: string }> {
    const result = this.verificationResults.get(nin);
    if (!result) {
      return { success: false, error: 'Identity not found' };
    }
    if (result.success && result.name) {
      const [firstName, ...lastParts] = result.name.split(' ');
      return { success: true, data: { firstName, lastName: lastParts.join(' ') } };
    }
    return { success: false, error: result.error || 'Verification failed' };
  }

  async verifyCAC(cacNumber: string, companyName: string): Promise<{ success: boolean; data?: { companyName: string }; error?: string }> {
    const result = this.verificationResults.get(cacNumber);
    if (!result) {
      return { success: false, error: 'Company not found' };
    }
    if (result.success && result.name) {
      return { success: true, data: { companyName: result.name } };
    }
    return { success: false, error: result.error || 'Verification failed' };
  }
}

// ========== Helper Functions ==========

/**
 * Calculate fuzzy name match score (simplified version)
 */
function calculateNameMatchScore(name1: string, name2: string): number {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  if (n1 === n2) return 100;
  
  // Simple Levenshtein-based similarity
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(n1, n2);
  return Math.round((1 - distance / maxLen) * 100);
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a mock parsed upload row
 */
function createMockUploadRow(overrides: Partial<ParsedUploadRow> = {}): ParsedUploadRow {
  return {
    customerName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+2341234567890',
    policyNumber: `POL-${generateId()}`,
    brokerName: 'Test Broker Ltd',
    identityType: 'individual',
    isValid: true,
    errors: [],
    rowNumber: 1,
    ...overrides,
  };
}

// ========== Integration Service ==========

/**
 * Simulates the remediation service that coordinates all operations
 */
class RemediationService {
  constructor(
    private db: MockFirestore,
    private smtp: MockSMTPService,
    private paystack: MockPaystackService
  ) {}

  /**
   * Create a new batch with records
   */
  async createBatch(request: CreateBatchRequest, adminId: string): Promise<{ batchId: string; recordCount: number }> {
    const batchId = generateId();
    const now = new Date();
    
    // Create batch
    const batch: RemediationBatch = {
      id: batchId,
      name: request.name,
      description: request.description,
      status: 'pending',
      totalRecords: request.records.length,
      pendingCount: request.records.length,
      emailSentCount: 0,
      verifiedCount: 0,
      failedCount: 0,
      reviewRequiredCount: 0,
      expirationDays: request.expirationDays,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
      originalFileName: request.originalFileName,
    };
    
    this.db.createBatch(batch);
    
    // Create records with tokens
    for (const row of request.records) {
      const { token, expiresAt } = generateTokenWithExpiration(request.expirationDays);
      const record: RemediationRecord = {
        id: generateId(),
        batchId,
        customerName: row.customerName,
        email: row.email,
        phone: row.phone,
        policyNumber: row.policyNumber,
        brokerName: row.brokerName,
        identityType: row.identityType,
        existingName: row.existingName,
        existingDob: row.existingDob,
        token,
        tokenExpiresAt: expiresAt,
        status: 'pending',
        resendCount: 0,
        createdAt: now,
        updatedAt: now,
        verificationAttempts: 0,
      };
      this.db.createRecord(record);
    }
    
    // Create audit log
    this.db.addAuditLog({
      id: generateId(),
      batchId,
      action: 'batch_created',
      actorType: 'admin',
      actorId: adminId,
      details: { recordCount: request.records.length, name: request.name },
      timestamp: now,
    });
    
    return { batchId, recordCount: request.records.length };
  }

  /**
   * Send verification emails for a batch
   */
  async sendEmails(batchId: string, adminId: string, recordIds?: string[]): Promise<{ sent: number; failed: number }> {
    const batch = this.db.getBatch(batchId);
    if (!batch) throw new Error('Batch not found');
    
    let records = this.db.getRecordsByBatch(batchId);
    if (recordIds) {
      records = records.filter(r => recordIds.includes(r.id));
    } else {
      records = records.filter(r => r.status === 'pending');
    }
    
    let sent = 0;
    let failed = 0;
    
    for (const record of records) {
      const expirationDate = record.tokenExpiresAt.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      
      const emailData: VerificationEmailData = {
        customerName: record.customerName,
        policyNumber: record.policyNumber,
        brokerName: record.brokerName,
        verificationUrl: `https://nemforms.com/verify/${record.token}`,
        expirationDate,
      };
      
      const template = generateVerificationEmail(emailData);
      const result = await this.smtp.sendEmail(record.email, template.subject, template.html, template.text);
      
      if (result.success) {
        this.db.updateRecord(record.id, { status: 'email_sent', emailSentAt: new Date() });
        sent++;
      } else {
        this.db.updateRecord(record.id, { status: 'email_failed', emailError: result.error });
        failed++;
      }
      
      // Create audit log
      this.db.addAuditLog({
        id: generateId(),
        batchId,
        recordId: record.id,
        action: 'emails_sent',
        actorType: 'admin',
        actorId: adminId,
        details: { success: result.success, error: result.error },
        timestamp: new Date(),
      });
    }
    
    // Update batch counts
    const allRecords = this.db.getRecordsByBatch(batchId);
    this.db.updateBatch(batchId, {
      emailSentCount: allRecords.filter(r => r.status === 'email_sent').length,
      pendingCount: allRecords.filter(r => r.status === 'pending').length,
      status: 'in_progress',
    });
    
    return { sent, failed };
  }

  /**
   * Validate a verification token
   */
  validateToken(token: string): { valid: boolean; record?: RemediationRecord; expired?: boolean; used?: boolean } {
    const record = this.db.getRecordByToken(token);
    
    if (!record) {
      return { valid: false };
    }
    
    if (record.tokenUsedAt) {
      return { valid: false, used: true, record };
    }
    
    if (isTokenExpired(record.tokenExpiresAt)) {
      this.db.updateRecord(record.id, { status: 'link_expired' });
      return { valid: false, expired: true, record };
    }
    
    return { valid: true, record };
  }

  /**
   * Submit identity verification
   */
  async submitVerification(
    token: string,
    request: VerificationSubmitRequest,
    ipAddress: string
  ): Promise<{ success: boolean; verified?: boolean; matchScore?: number; error?: string; attemptsRemaining?: number }> {
    const validation = this.validateToken(token);
    
    if (!validation.valid) {
      if (validation.expired) return { success: false, error: 'Link has expired' };
      if (validation.used) return { success: false, error: 'Already verified' };
      return { success: false, error: 'Invalid token' };
    }
    
    const record = validation.record!;
    
    // Check max attempts
    if (record.verificationAttempts >= 3) {
      return { success: false, error: 'Maximum attempts exceeded', attemptsRemaining: 0 };
    }
    
    // Increment attempts
    this.db.updateRecord(record.id, {
      verificationAttempts: record.verificationAttempts + 1,
      lastAttemptAt: new Date(),
    });
    
    // Verify with Paystack
    let verificationResult: { success: boolean; name?: string; error?: string };
    
    if (record.identityType === 'individual') {
      const result = await this.paystack.verifyNIN(request.identityNumber);
      verificationResult = {
        success: result.success,
        name: result.data ? `${result.data.firstName} ${result.data.lastName}` : undefined,
        error: result.error,
      };
    } else {
      const result = await this.paystack.verifyCAC(request.identityNumber, request.companyName || '');
      verificationResult = {
        success: result.success,
        name: result.data?.companyName,
        error: result.error,
      };
    }
    
    // Create audit log for attempt
    this.db.addAuditLog({
      id: generateId(),
      batchId: record.batchId,
      recordId: record.id,
      action: verificationResult.success ? 'verification_success' : 'verification_failed',
      actorType: 'customer',
      details: { identityType: record.identityType, success: verificationResult.success },
      timestamp: new Date(),
      ipAddress,
    });
    
    if (!verificationResult.success) {
      const attemptsRemaining = 3 - (record.verificationAttempts + 1);
      if (attemptsRemaining <= 0) {
        this.db.updateRecord(record.id, { status: 'verification_failed', lastAttemptError: verificationResult.error });
      }
      return { success: false, error: verificationResult.error, attemptsRemaining };
    }
    
    // Calculate name match score
    const matchScore = calculateNameMatchScore(record.customerName, verificationResult.name || '');
    
    // Determine status based on match score
    let newStatus: RemediationRecordStatus = 'verified';
    if (matchScore < 80) {
      newStatus = 'review_required';
    }
    
    this.db.updateRecord(record.id, {
      status: newStatus,
      submittedIdentityNumber: request.identityNumber,
      submittedCompanyName: request.companyName,
      verifiedAt: new Date(),
      nameMatchScore: matchScore,
      tokenUsedAt: new Date(),
    });
    
    // Update batch counts
    this.updateBatchCounts(record.batchId);
    
    return { success: true, verified: newStatus === 'verified', matchScore };
  }

  /**
   * Approve or reject a record requiring review
   */
  approveOrRejectRecord(
    recordId: string,
    approved: boolean,
    adminId: string,
    comment: string
  ): { success: boolean; error?: string } {
    const record = this.db.getRecord(recordId);
    
    if (!record) {
      return { success: false, error: 'Record not found' };
    }
    
    if (record.status !== 'review_required') {
      return { success: false, error: 'Record is not pending review' };
    }
    
    const newStatus: RemediationRecordStatus = approved ? 'approved' : 'rejected';
    
    this.db.updateRecord(recordId, {
      status: newStatus,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewComment: comment,
    });
    
    // Create audit log
    this.db.addAuditLog({
      id: generateId(),
      batchId: record.batchId,
      recordId,
      action: approved ? 'record_approved' : 'record_rejected',
      actorType: 'admin',
      actorId: adminId,
      details: { comment, previousStatus: record.status },
      timestamp: new Date(),
    });
    
    // Update batch counts
    this.updateBatchCounts(record.batchId);
    
    return { success: true };
  }

  /**
   * Resend verification link
   */
  resendLink(recordId: string, adminId: string, expirationDays: number = 7): { success: boolean; newToken?: string; error?: string } {
    const record = this.db.getRecord(recordId);
    
    if (!record) {
      return { success: false, error: 'Record not found' };
    }
    
    const { token, expiresAt } = generateTokenWithExpiration(expirationDays);
    
    this.db.updateRecord(recordId, {
      token,
      tokenExpiresAt: expiresAt,
      tokenUsedAt: undefined,
      status: 'pending',
      resendCount: record.resendCount + 1,
    });
    
    // Create audit log
    this.db.addAuditLog({
      id: generateId(),
      batchId: record.batchId,
      recordId,
      action: 'link_resent',
      actorType: 'admin',
      actorId: adminId,
      details: { resendCount: record.resendCount + 1 },
      timestamp: new Date(),
    });
    
    return { success: true, newToken: token };
  }

  private updateBatchCounts(batchId: string): void {
    const records = this.db.getRecordsByBatch(batchId);
    this.db.updateBatch(batchId, {
      pendingCount: records.filter(r => r.status === 'pending').length,
      emailSentCount: records.filter(r => r.status === 'email_sent').length,
      verifiedCount: records.filter(r => r.status === 'verified' || r.status === 'approved').length,
      failedCount: records.filter(r => r.status === 'verification_failed' || r.status === 'rejected').length,
      reviewRequiredCount: records.filter(r => r.status === 'review_required').length,
    });
  }
}

// ========== Integration Tests ==========

describe('Integration Tests: Identity Remediation System', () => {
  let db: MockFirestore;
  let smtp: MockSMTPService;
  let paystack: MockPaystackService;
  let service: RemediationService;
  const adminId = 'admin-123';

  beforeEach(() => {
    db = new MockFirestore();
    smtp = new MockSMTPService();
    paystack = new MockPaystackService();
    service = new RemediationService(db, smtp, paystack);
  });

  describe('End-to-End Batch Upload Flow', () => {
    it('should create a batch with multiple records and generate unique tokens', async () => {
      const records = [
        createMockUploadRow({ customerName: 'John Doe', email: 'john@example.com', rowNumber: 1 }),
        createMockUploadRow({ customerName: 'Jane Smith', email: 'jane@example.com', rowNumber: 2 }),
        createMockUploadRow({ customerName: 'Bob Wilson', email: 'bob@example.com', rowNumber: 3 }),
      ];

      const request: CreateBatchRequest = {
        name: 'Test Batch',
        description: 'Integration test batch',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          phone: r.phone,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'test.xlsx',
      };

      const result = await service.createBatch(request, adminId);

      expect(result.batchId).toBeDefined();
      expect(result.recordCount).toBe(3);

      // Verify batch was created correctly
      const batch = db.getBatch(result.batchId);
      expect(batch).toBeDefined();
      expect(batch!.status).toBe('pending');
      expect(batch!.totalRecords).toBe(3);
      expect(batch!.pendingCount).toBe(3);

      // Verify records were created with unique tokens
      const createdRecords = db.getRecordsByBatch(result.batchId);
      expect(createdRecords.length).toBe(3);
      
      const tokens = new Set(createdRecords.map(r => r.token));
      expect(tokens.size).toBe(3); // All tokens unique

      // Verify audit log was created
      const logs = db.getAuditLogs(result.batchId);
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('batch_created');
    });

    it('should handle batch with mixed identity types', async () => {
      const records = [
        createMockUploadRow({ identityType: 'individual', rowNumber: 1 }),
        createMockUploadRow({ identityType: 'corporate', rowNumber: 2 }),
      ];

      const request: CreateBatchRequest = {
        name: 'Mixed Batch',
        expirationDays: 14,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'mixed.csv',
      };

      const result = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(result.batchId);

      expect(createdRecords.filter(r => r.identityType === 'individual').length).toBe(1);
      expect(createdRecords.filter(r => r.identityType === 'corporate').length).toBe(1);
    });
  });

  describe('Email Sending with Mock SMTP', () => {
    it('should send emails to all pending records and update statuses', async () => {
      // Create batch
      const records = [
        createMockUploadRow({ email: 'user1@example.com', rowNumber: 1 }),
        createMockUploadRow({ email: 'user2@example.com', rowNumber: 2 }),
      ];

      const request: CreateBatchRequest = {
        name: 'Email Test Batch',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'email-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);

      // Send emails
      const emailResult = await service.sendEmails(batchId, adminId);

      expect(emailResult.sent).toBe(2);
      expect(emailResult.failed).toBe(0);

      // Verify emails were sent
      const sentEmails = smtp.getSentEmails();
      expect(sentEmails.length).toBe(2);
      expect(sentEmails.map(e => e.to).sort()).toEqual(['user1@example.com', 'user2@example.com'].sort());

      // Verify record statuses updated
      const updatedRecords = db.getRecordsByBatch(batchId);
      expect(updatedRecords.every(r => r.status === 'email_sent')).toBe(true);
      expect(updatedRecords.every(r => r.emailSentAt !== undefined)).toBe(true);

      // Verify batch status updated
      const batch = db.getBatch(batchId);
      expect(batch!.status).toBe('in_progress');
      expect(batch!.emailSentCount).toBe(2);
    });

    it('should handle email failures and update status accordingly', async () => {
      // Set up failure for one email
      smtp.setFailureEmail('fail@example.com');

      const records = [
        createMockUploadRow({ email: 'success@example.com', rowNumber: 1 }),
        createMockUploadRow({ email: 'fail@example.com', rowNumber: 2 }),
      ];

      const request: CreateBatchRequest = {
        name: 'Partial Failure Batch',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'partial-fail.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const emailResult = await service.sendEmails(batchId, adminId);

      expect(emailResult.sent).toBe(1);
      expect(emailResult.failed).toBe(1);

      // Verify statuses
      const updatedRecords = db.getRecordsByBatch(batchId);
      const successRecord = updatedRecords.find(r => r.email === 'success@example.com');
      const failRecord = updatedRecords.find(r => r.email === 'fail@example.com');

      expect(successRecord!.status).toBe('email_sent');
      expect(failRecord!.status).toBe('email_failed');
      expect(failRecord!.emailError).toBeDefined();
    });

    it('should include all required fields in email content', async () => {
      const records = [
        createMockUploadRow({
          customerName: 'Test Customer',
          email: 'test@example.com',
          policyNumber: 'POL-12345',
          brokerName: 'Premium Brokers',
          rowNumber: 1,
        }),
      ];

      const request: CreateBatchRequest = {
        name: 'Content Test Batch',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'content-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      await service.sendEmails(batchId, adminId);

      const sentEmails = smtp.getSentEmails();
      expect(sentEmails.length).toBe(1);

      const email = sentEmails[0];
      expect(email.html).toContain('Test Customer');
      expect(email.html).toContain('POL-12345');
      expect(email.html).toContain('Premium Brokers');
      expect(email.html).toContain('/verify/');
      expect(email.html).toContain('NEM Insurance');
    });
  });

  describe('Verification Flow with Mock Paystack', () => {
    it('should successfully verify individual identity with matching name', async () => {
      // Set up Paystack mock
      paystack.setVerificationResult('12345678901', { success: true, name: 'John Doe' });

      const records = [
        createMockUploadRow({
          customerName: 'John Doe',
          email: 'john@example.com',
          identityType: 'individual',
          rowNumber: 1,
        }),
      ];

      const request: CreateBatchRequest = {
        name: 'Verification Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'verify-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const token = createdRecords[0].token;

      // Submit verification
      const result = await service.submitVerification(
        token,
        { identityNumber: '12345678901' },
        '192.168.1.1'
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      expect(result.matchScore).toBe(100);

      // Verify record updated
      const updatedRecord = db.getRecordByToken(token);
      expect(updatedRecord!.status).toBe('verified');
      expect(updatedRecord!.submittedIdentityNumber).toBe('12345678901');
      expect(updatedRecord!.verifiedAt).toBeDefined();
    });

    it('should flag record for review when name match is below threshold', async () => {
      // Set up Paystack mock with different name
      paystack.setVerificationResult('12345678901', { success: true, name: 'Jonathan Doe' });

      const records = [
        createMockUploadRow({
          customerName: 'John Doe',
          email: 'john@example.com',
          identityType: 'individual',
          rowNumber: 1,
        }),
      ];

      const request: CreateBatchRequest = {
        name: 'Review Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'review-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const token = createdRecords[0].token;

      const result = await service.submitVerification(
        token,
        { identityNumber: '12345678901' },
        '192.168.1.1'
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(false);
      expect(result.matchScore).toBeLessThan(80);

      const updatedRecord = db.getRecordByToken(token);
      expect(updatedRecord!.status).toBe('review_required');
    });

    it('should handle verification failure and track attempts', async () => {
      // Set up Paystack mock to fail
      paystack.setVerificationResult('00000000000', { success: false, error: 'Identity not found' });

      const records = [
        createMockUploadRow({
          customerName: 'Test User',
          email: 'test@example.com',
          identityType: 'individual',
          rowNumber: 1,
        }),
      ];

      const request: CreateBatchRequest = {
        name: 'Failure Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'failure-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const token = createdRecords[0].token;

      // First attempt
      let result = await service.submitVerification(token, { identityNumber: '00000000000' }, '192.168.1.1');
      expect(result.success).toBe(false);
      expect(result.attemptsRemaining).toBe(2);

      // Second attempt
      result = await service.submitVerification(token, { identityNumber: '00000000000' }, '192.168.1.1');
      expect(result.attemptsRemaining).toBe(1);

      // Third attempt
      result = await service.submitVerification(token, { identityNumber: '00000000000' }, '192.168.1.1');
      expect(result.attemptsRemaining).toBe(0);

      // Verify record marked as failed
      const updatedRecord = db.getRecordByToken(token);
      expect(updatedRecord!.status).toBe('verification_failed');
      expect(updatedRecord!.verificationAttempts).toBe(3);
    });

    it('should verify corporate identity with CAC number', async () => {
      paystack.setVerificationResult('RC123456', { success: true, name: 'Test Company Ltd' });

      const records = [
        createMockUploadRow({
          customerName: 'Test Company Ltd',
          email: 'company@example.com',
          identityType: 'corporate',
          rowNumber: 1,
        }),
      ];

      const request: CreateBatchRequest = {
        name: 'Corporate Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'corporate-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const token = createdRecords[0].token;

      const result = await service.submitVerification(
        token,
        { identityNumber: 'RC123456', companyName: 'Test Company Ltd' },
        '192.168.1.1'
      );

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);

      const updatedRecord = db.getRecordByToken(token);
      expect(updatedRecord!.submittedCompanyName).toBe('Test Company Ltd');
    });

    it('should reject expired tokens', async () => {
      const records = [createMockUploadRow({ rowNumber: 1 })];

      const request: CreateBatchRequest = {
        name: 'Expiry Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'expiry-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const record = createdRecords[0];

      // Manually expire the token
      db.updateRecord(record.id, { tokenExpiresAt: new Date(Date.now() - 1000) });

      const result = await service.submitVerification(
        record.token,
        { identityNumber: '12345678901' },
        '192.168.1.1'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Link has expired');
    });
  });

  describe('Admin Approval Workflow', () => {
    it('should allow admin to approve a record requiring review', async () => {
      paystack.setVerificationResult('12345678901', { success: true, name: 'Different Name' });

      const records = [
        createMockUploadRow({
          customerName: 'Original Name',
          email: 'test@example.com',
          identityType: 'individual',
          rowNumber: 1,
        }),
      ];

      const request: CreateBatchRequest = {
        name: 'Approval Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'approval-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const token = createdRecords[0].token;

      // Submit verification (will require review due to name mismatch)
      await service.submitVerification(token, { identityNumber: '12345678901' }, '192.168.1.1');

      const recordBeforeApproval = db.getRecordByToken(token);
      expect(recordBeforeApproval!.status).toBe('review_required');

      // Admin approves
      const approvalResult = service.approveOrRejectRecord(
        recordBeforeApproval!.id,
        true,
        adminId,
        'Name variation is acceptable'
      );

      expect(approvalResult.success).toBe(true);

      const recordAfterApproval = db.getRecord(recordBeforeApproval!.id);
      expect(recordAfterApproval!.status).toBe('approved');
      expect(recordAfterApproval!.reviewedBy).toBe(adminId);
      expect(recordAfterApproval!.reviewComment).toBe('Name variation is acceptable');

      // Verify audit log
      const logs = db.getAuditLogs(batchId, recordBeforeApproval!.id);
      const approvalLog = logs.find(l => l.action === 'record_approved');
      expect(approvalLog).toBeDefined();
    });

    it('should allow admin to reject a record requiring review', async () => {
      paystack.setVerificationResult('12345678901', { success: true, name: 'Completely Different' });

      const records = [
        createMockUploadRow({
          customerName: 'Original Name',
          email: 'test@example.com',
          identityType: 'individual',
          rowNumber: 1,
        }),
      ];

      const request: CreateBatchRequest = {
        name: 'Rejection Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'rejection-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const token = createdRecords[0].token;

      await service.submitVerification(token, { identityNumber: '12345678901' }, '192.168.1.1');

      const recordBeforeReject = db.getRecordByToken(token);

      // Admin rejects
      const rejectResult = service.approveOrRejectRecord(
        recordBeforeReject!.id,
        false,
        adminId,
        'Name does not match at all'
      );

      expect(rejectResult.success).toBe(true);

      const recordAfterReject = db.getRecord(recordBeforeReject!.id);
      expect(recordAfterReject!.status).toBe('rejected');
      expect(recordAfterReject!.reviewComment).toBe('Name does not match at all');
    });

    it('should not allow approval of non-review records', async () => {
      const records = [createMockUploadRow({ rowNumber: 1 })];

      const request: CreateBatchRequest = {
        name: 'Invalid Approval Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'invalid-approval.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);

      // Try to approve a pending record
      const result = service.approveOrRejectRecord(
        createdRecords[0].id,
        true,
        adminId,
        'Trying to approve pending'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Record is not pending review');
    });

    it('should update batch counts after approval/rejection', async () => {
      paystack.setVerificationResult('12345678901', { success: true, name: 'Different Name' });

      const records = [
        createMockUploadRow({ customerName: 'Original 1', email: 'test1@example.com', rowNumber: 1 }),
        createMockUploadRow({ customerName: 'Original 2', email: 'test2@example.com', rowNumber: 2 }),
      ];

      const request: CreateBatchRequest = {
        name: 'Batch Count Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'count-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);

      // Submit verifications for both
      await service.submitVerification(createdRecords[0].token, { identityNumber: '12345678901' }, '192.168.1.1');
      await service.submitVerification(createdRecords[1].token, { identityNumber: '12345678901' }, '192.168.1.1');

      // Approve one, reject one
      const updatedRecords = db.getRecordsByBatch(batchId);
      service.approveOrRejectRecord(updatedRecords[0].id, true, adminId, 'Approved');
      service.approveOrRejectRecord(updatedRecords[1].id, false, adminId, 'Rejected');

      const batch = db.getBatch(batchId);
      expect(batch!.verifiedCount).toBe(1); // approved counts as verified
      expect(batch!.failedCount).toBe(1); // rejected counts as failed
      expect(batch!.reviewRequiredCount).toBe(0);
    });
  });

  describe('Link Resend Workflow', () => {
    it('should generate new token and invalidate old one on resend', async () => {
      const records = [createMockUploadRow({ rowNumber: 1 })];

      const request: CreateBatchRequest = {
        name: 'Resend Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'resend-test.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const originalToken = createdRecords[0].token;

      // Resend link
      const resendResult = service.resendLink(createdRecords[0].id, adminId);

      expect(resendResult.success).toBe(true);
      expect(resendResult.newToken).toBeDefined();
      expect(resendResult.newToken).not.toBe(originalToken);

      // Verify old token is invalid
      const oldTokenValidation = service.validateToken(originalToken);
      expect(oldTokenValidation.valid).toBe(false);

      // Verify new token is valid
      const newTokenValidation = service.validateToken(resendResult.newToken!);
      expect(newTokenValidation.valid).toBe(true);
    });

    it('should increment resend count on each resend', async () => {
      const records = [createMockUploadRow({ rowNumber: 1 })];

      const request: CreateBatchRequest = {
        name: 'Resend Count Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'resend-count.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);
      const recordId = createdRecords[0].id;

      expect(db.getRecord(recordId)!.resendCount).toBe(0);

      service.resendLink(recordId, adminId);
      expect(db.getRecord(recordId)!.resendCount).toBe(1);

      service.resendLink(recordId, adminId);
      expect(db.getRecord(recordId)!.resendCount).toBe(2);

      service.resendLink(recordId, adminId);
      expect(db.getRecord(recordId)!.resendCount).toBe(3);
    });

    it('should create audit log for resend operations', async () => {
      const records = [createMockUploadRow({ rowNumber: 1 })];

      const request: CreateBatchRequest = {
        name: 'Resend Audit Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'resend-audit.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      const createdRecords = db.getRecordsByBatch(batchId);

      service.resendLink(createdRecords[0].id, adminId);

      const logs = db.getAuditLogs(batchId, createdRecords[0].id);
      const resendLog = logs.find(l => l.action === 'link_resent');
      
      expect(resendLog).toBeDefined();
      expect(resendLog!.actorType).toBe('admin');
      expect(resendLog!.actorId).toBe(adminId);
    });
  });

  describe('Complete End-to-End Flow', () => {
    it('should handle complete remediation workflow from upload to verification', async () => {
      // Setup Paystack mock
      paystack.setVerificationResult('11111111111', { success: true, name: 'John Doe' });
      paystack.setVerificationResult('22222222222', { success: true, name: 'Jane Smith' });

      // Step 1: Create batch
      const records = [
        createMockUploadRow({ customerName: 'John Doe', email: 'john@example.com', rowNumber: 1 }),
        createMockUploadRow({ customerName: 'Jane Smith', email: 'jane@example.com', rowNumber: 2 }),
      ];

      const request: CreateBatchRequest = {
        name: 'Complete Flow Test',
        expirationDays: 7,
        records: records.map(r => ({
          customerName: r.customerName,
          email: r.email,
          policyNumber: r.policyNumber,
          brokerName: r.brokerName,
          identityType: r.identityType,
        })),
        originalFileName: 'complete-flow.xlsx',
      };

      const { batchId } = await service.createBatch(request, adminId);
      let batch = db.getBatch(batchId);
      expect(batch!.status).toBe('pending');

      // Step 2: Send emails
      await service.sendEmails(batchId, adminId);
      batch = db.getBatch(batchId);
      expect(batch!.status).toBe('in_progress');
      expect(batch!.emailSentCount).toBe(2);

      // Step 3: Customers verify
      const createdRecords = db.getRecordsByBatch(batchId);
      
      await service.submitVerification(createdRecords[0].token, { identityNumber: '11111111111' }, '192.168.1.1');
      await service.submitVerification(createdRecords[1].token, { identityNumber: '22222222222' }, '192.168.1.2');

      // Step 4: Verify final state
      batch = db.getBatch(batchId);
      expect(batch!.verifiedCount).toBe(2);
      expect(batch!.pendingCount).toBe(0);

      const finalRecords = db.getRecordsByBatch(batchId);
      expect(finalRecords.every(r => r.status === 'verified')).toBe(true);

      // Verify audit trail
      const logs = db.getAuditLogs(batchId);
      expect(logs.some(l => l.action === 'batch_created')).toBe(true);
      expect(logs.filter(l => l.action === 'emails_sent').length).toBe(2);
      expect(logs.filter(l => l.action === 'verification_success').length).toBe(2);
    });
  });
});
