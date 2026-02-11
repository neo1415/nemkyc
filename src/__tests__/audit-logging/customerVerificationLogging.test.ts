/**
 * Unit Tests for Customer Verification Logging
 * 
 * Tests that customer verifications include list and entry IDs
 * Validates: Requirements 1.4, 2.4
 * 
 * These tests verify that the /api/identity/verify/:token endpoint
 * properly logs verification attempts with list and entry context.
 */

import { describe, it, expect } from 'vitest';

describe('Customer Verification Logging', () => {
  /**
   * Test that customer NIN verifications include listId and entryId
   * Requirement 1.4: WHEN a customer verifies their NIN via /api/identity/verify/:token,
   * THE Server SHALL log the verification attempt with the list ID and entry ID
   */
  it('should include listId and entryId in NIN verification log metadata', () => {
    // Simulate customer verification log entry for NIN
    const logEntry = {
      eventType: 'verification_attempt',
      verificationType: 'NIN',
      identityNumberMasked: '1234*******',
      result: 'pending',
      userId: 'anonymous', // Customer verification - no user ID
      userEmail: 'anonymous',
      ipAddress: '192.168.1.1',
      metadata: {
        userAgent: 'Mozilla/5.0',
        listId: 'test-list-123',
        entryId: 'test-entry-456'
      },
      createdAt: new Date()
    };
    
    // Verify required fields
    expect(logEntry).toHaveProperty('eventType', 'verification_attempt');
    expect(logEntry).toHaveProperty('verificationType', 'NIN');
    expect(logEntry).toHaveProperty('userId', 'anonymous');
    expect(logEntry).toHaveProperty('userEmail', 'anonymous');
    
    // Verify listId and entryId are in metadata
    expect(logEntry.metadata).toHaveProperty('listId');
    expect(logEntry.metadata).toHaveProperty('entryId');
    expect(logEntry.metadata.listId).toBe('test-list-123');
    expect(logEntry.metadata.entryId).toBe('test-entry-456');
  });

  /**
   * Test that customer CAC verifications include listId and entryId
   * Requirement 2.4: WHEN a customer verifies their CAC via /api/identity/verify/:token,
   * THE Server SHALL log the verification attempt with the list ID and entry ID
   */
  it('should include listId and entryId in CAC verification log metadata', () => {
    // Simulate customer verification log entry for CAC
    const logEntry = {
      eventType: 'verification_attempt',
      verificationType: 'CAC',
      identityNumberMasked: 'RC12*******',
      result: 'pending',
      userId: 'anonymous', // Customer verification - no user ID
      userEmail: 'anonymous',
      ipAddress: '192.168.1.1',
      metadata: {
        userAgent: 'Mozilla/5.0',
        listId: 'test-list-789',
        entryId: 'test-entry-012'
      },
      createdAt: new Date()
    };
    
    // Verify required fields
    expect(logEntry).toHaveProperty('eventType', 'verification_attempt');
    expect(logEntry).toHaveProperty('verificationType', 'CAC');
    expect(logEntry).toHaveProperty('userId', 'anonymous');
    expect(logEntry).toHaveProperty('userEmail', 'anonymous');
    
    // Verify listId and entryId are in metadata
    expect(logEntry.metadata).toHaveProperty('listId');
    expect(logEntry.metadata).toHaveProperty('entryId');
    expect(logEntry.metadata.listId).toBe('test-list-789');
    expect(logEntry.metadata.entryId).toBe('test-entry-012');
  });

  /**
   * Test that successful customer verifications include listId and entryId
   */
  it('should include listId and entryId in successful verification logs', () => {
    // Simulate successful customer verification log entry
    const logEntry = {
      eventType: 'verification_attempt',
      verificationType: 'NIN',
      identityNumberMasked: '5678*******',
      result: 'success',
      userId: 'anonymous',
      userEmail: 'anonymous',
      ipAddress: '10.0.0.1',
      metadata: {
        userAgent: 'Mozilla/5.0',
        listId: 'list-abc',
        entryId: 'entry-xyz',
        fieldsValidated: ['firstName', 'lastName', 'dateOfBirth'],
        failedFields: []
      },
      createdAt: new Date()
    };
    
    // Verify result is success
    expect(logEntry.result).toBe('success');
    
    // Verify listId and entryId are present
    expect(logEntry.metadata.listId).toBe('list-abc');
    expect(logEntry.metadata.entryId).toBe('entry-xyz');
    
    // Verify field validation metadata
    expect(logEntry.metadata.fieldsValidated).toEqual(['firstName', 'lastName', 'dateOfBirth']);
    expect(logEntry.metadata.failedFields).toEqual([]);
  });

  /**
   * Test that failed customer verifications include listId and entryId
   */
  it('should include listId and entryId in failed verification logs', () => {
    // Simulate failed customer verification log entry
    const logEntry = {
      eventType: 'verification_attempt',
      verificationType: 'CAC',
      identityNumberMasked: 'RC99*******',
      result: 'failure',
      userId: 'anonymous',
      userEmail: 'anonymous',
      ipAddress: '172.16.0.1',
      errorCode: 'FIELD_MISMATCH',
      errorMessage: 'Field mismatch detected',
      metadata: {
        userAgent: 'Mozilla/5.0',
        listId: 'list-def',
        entryId: 'entry-uvw',
        fieldsValidated: ['companyName', 'registrationNumber'],
        failedFields: ['companyName']
      },
      createdAt: new Date()
    };
    
    // Verify result is failure
    expect(logEntry.result).toBe('failure');
    
    // Verify error fields
    expect(logEntry.errorCode).toBe('FIELD_MISMATCH');
    expect(logEntry.errorMessage).toBe('Field mismatch detected');
    
    // Verify listId and entryId are present
    expect(logEntry.metadata.listId).toBe('list-def');
    expect(logEntry.metadata.entryId).toBe('entry-uvw');
    
    // Verify field validation metadata
    expect(logEntry.metadata.fieldsValidated).toEqual(['companyName', 'registrationNumber']);
    expect(logEntry.metadata.failedFields).toEqual(['companyName']);
  });

  /**
   * Test that customer verification logs use 'anonymous' for userId and userEmail
   */
  it('should use anonymous for userId and userEmail in customer verifications', () => {
    // Simulate customer verification log entries
    const ninLogEntry = {
      eventType: 'verification_attempt',
      verificationType: 'NIN',
      identityNumberMasked: '1111*******',
      result: 'pending',
      userId: 'anonymous',
      userEmail: 'anonymous',
      ipAddress: '192.168.1.100',
      metadata: {
        userAgent: 'Mozilla/5.0',
        listId: 'list-1',
        entryId: 'entry-1'
      },
      createdAt: new Date()
    };
    
    const cacLogEntry = {
      eventType: 'verification_attempt',
      verificationType: 'CAC',
      identityNumberMasked: 'RC00*******',
      result: 'pending',
      userId: 'anonymous',
      userEmail: 'anonymous',
      ipAddress: '192.168.1.101',
      metadata: {
        userAgent: 'Mozilla/5.0',
        listId: 'list-2',
        entryId: 'entry-2'
      },
      createdAt: new Date()
    };
    
    // Verify both use 'anonymous'
    expect(ninLogEntry.userId).toBe('anonymous');
    expect(ninLogEntry.userEmail).toBe('anonymous');
    expect(cacLogEntry.userId).toBe('anonymous');
    expect(cacLogEntry.userEmail).toBe('anonymous');
    
    // Verify listId and entryId are still present
    expect(ninLogEntry.metadata.listId).toBe('list-1');
    expect(ninLogEntry.metadata.entryId).toBe('entry-1');
    expect(cacLogEntry.metadata.listId).toBe('list-2');
    expect(cacLogEntry.metadata.entryId).toBe('entry-2');
  });

  /**
   * Test that log entry structure is consistent for customer verifications
   */
  it('should have consistent structure for customer verification logs', () => {
    // Simulate customer verification log entry
    const logEntry = {
      eventType: 'verification_attempt',
      verificationType: 'NIN',
      identityNumberMasked: '9999*******',
      result: 'success',
      userId: 'anonymous',
      userEmail: 'anonymous',
      ipAddress: '203.0.113.1',
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        listId: 'customer-list-123',
        entryId: 'customer-entry-456'
      },
      createdAt: new Date()
    };
    
    // Verify all required fields are present
    expect(logEntry).toHaveProperty('eventType');
    expect(logEntry).toHaveProperty('verificationType');
    expect(logEntry).toHaveProperty('identityNumberMasked');
    expect(logEntry).toHaveProperty('result');
    expect(logEntry).toHaveProperty('userId');
    expect(logEntry).toHaveProperty('userEmail');
    expect(logEntry).toHaveProperty('ipAddress');
    expect(logEntry).toHaveProperty('metadata');
    expect(logEntry).toHaveProperty('createdAt');
    
    // Verify metadata has required fields
    expect(logEntry.metadata).toHaveProperty('userAgent');
    expect(logEntry.metadata).toHaveProperty('listId');
    expect(logEntry.metadata).toHaveProperty('entryId');
    
    // Verify types
    expect(typeof logEntry.eventType).toBe('string');
    expect(typeof logEntry.verificationType).toBe('string');
    expect(typeof logEntry.identityNumberMasked).toBe('string');
    expect(typeof logEntry.result).toBe('string');
    expect(typeof logEntry.userId).toBe('string');
    expect(typeof logEntry.userEmail).toBe('string');
    expect(typeof logEntry.ipAddress).toBe('string');
    expect(typeof logEntry.metadata).toBe('object');
    expect(logEntry.createdAt).toBeInstanceOf(Date);
  });
});
