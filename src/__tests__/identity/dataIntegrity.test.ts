/**
 * Property-Based Tests for Data Append Integrity
 * 
 * Feature: identity-remediation
 * Property 5: Data Append Integrity
 * 
 * Tests that verification data (NIN/CAC) is correctly appended to entries
 * while preserving all original data columns exactly as uploaded.
 * 
 * **Validates: Requirements 2.1, 2.2**
 */

import { describe, it, expect } from 'vitest';
import {
  appendVerificationData,
  validateDataPreservation,
  validateVerificationAppend,
  VerificationResult,
} from '../../utils/dataIntegrity';
import { IdentityEntry, VerificationType } from '../../types/remediation';

// ========== Test Fixtures ==========

function createMockEntry(
  data: Record<string, unknown>,
  overrides: Partial<IdentityEntry> = {}
): IdentityEntry {
  return {
    id: 'entry-123',
    listId: 'list-456',
    data,
    email: (data.email as string) || (data.Email as string) || 'test@example.com',
    status: 'pending',
    resendCount: 0,
    verificationAttempts: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function createMockVerificationResult(
  type: VerificationType,
  overrides: Partial<VerificationResult> = {}
): VerificationResult {
  return {
    verificationType: type,
    identityNumber: type === 'NIN' ? '12345678901' : 'RC123456',
    companyName: type === 'CAC' ? 'Test Company Ltd' : undefined,
    verifiedAt: new Date('2025-01-10'),
    ...overrides,
  };
}

// ========== Tests ==========

describe('Feature: identity-remediation, Property 5: Data Append Integrity', () => {
  describe('appendVerificationData', () => {
    it('should preserve all original data fields after NIN verification', () => {
      const originalData = {
        'Customer Name': 'John Doe',
        'Policy Number': 'POL-001',
        'Email': 'john@example.com',
        'Phone': '+234-800-123-4567',
      };
      
      const entry = createMockEntry(originalData);
      const result = createMockVerificationResult('NIN');
      
      const updatedEntry = appendVerificationData(entry, result);
      
      // All original keys must exist with same values
      expect(Object.keys(updatedEntry.data)).toEqual(Object.keys(originalData));
      for (const [key, value] of Object.entries(originalData)) {
        expect(updatedEntry.data[key]).toEqual(value);
      }
    });

    it('should preserve all original data fields after CAC verification', () => {
      const originalData = {
        'Company Name': 'ABC Corp',
        'RC Number': 'RC-PENDING',
        'Email': 'info@abccorp.com',
      };
      
      const entry = createMockEntry(originalData);
      const result = createMockVerificationResult('CAC');
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(Object.keys(updatedEntry.data)).toEqual(Object.keys(originalData));
      for (const [key, value] of Object.entries(originalData)) {
        expect(updatedEntry.data[key]).toEqual(value);
      }
    });

    it('should correctly append NIN to dedicated field', () => {
      const entry = createMockEntry({ name: 'Test User', email: 'test@test.com' });
      const result = createMockVerificationResult('NIN', { identityNumber: '98765432109' });
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(updatedEntry.nin).toBe('98765432109');
      expect(updatedEntry.data.nin).toBeUndefined();
      expect(updatedEntry.cac).toBeUndefined();
    });

    it('should correctly append CAC and company name to dedicated fields', () => {
      const entry = createMockEntry({ company: 'Test Corp', email: 'corp@test.com' });
      const result = createMockVerificationResult('CAC', {
        identityNumber: 'RC999888',
        companyName: 'Verified Corp Ltd',
      });
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(updatedEntry.cac).toBe('RC999888');
      expect(updatedEntry.cacCompanyName).toBe('Verified Corp Ltd');
      expect(updatedEntry.data.cac).toBeUndefined();
      expect(updatedEntry.nin).toBeUndefined();
    });

    it('should update status to verified', () => {
      const entry = createMockEntry({ name: 'Test' }, { status: 'link_sent' });
      const result = createMockVerificationResult('NIN');
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(updatedEntry.status).toBe('verified');
    });

    it('should set verifiedAt timestamp', () => {
      const entry = createMockEntry({ name: 'Test' });
      const verificationTime = new Date('2025-01-15T10:30:00Z');
      const result = createMockVerificationResult('NIN', { verifiedAt: verificationTime });
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(updatedEntry.verifiedAt).toEqual(verificationTime);
      expect(updatedEntry.updatedAt).toEqual(verificationTime);
    });

    it('should not mutate the original entry', () => {
      const originalData = { name: 'Original', value: 100 };
      const entry = createMockEntry(originalData);
      const originalEntryJson = JSON.stringify(entry);
      
      const result = createMockVerificationResult('NIN');
      appendVerificationData(entry, result);
      
      expect(JSON.stringify(entry)).toBe(originalEntryJson);
    });

    it('should handle entries with nested data objects', () => {
      const originalData = {
        name: 'Test User',
        metadata: { source: 'import', batch: 'batch-001' },
        address: { street: '123 Main St', city: 'Lagos' },
      };
      
      const entry = createMockEntry(originalData);
      const result = createMockVerificationResult('NIN');
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(updatedEntry.data.metadata).toEqual(originalData.metadata);
      expect(updatedEntry.data.address).toEqual(originalData.address);
    });

    it('should handle entries with array data', () => {
      const originalData = {
        name: 'Test User',
        policies: ['POL-001', 'POL-002'],
        contacts: [{ type: 'phone', value: '+234-800-111-2222' }],
      };
      
      const entry = createMockEntry(originalData);
      const result = createMockVerificationResult('CAC');
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(updatedEntry.data.policies).toEqual(originalData.policies);
      expect(updatedEntry.data.contacts).toEqual(originalData.contacts);
    });

    it('should handle entries with special characters in data', () => {
      const originalData = {
        'Customer Name': "O'Brien & Associates",
        'Notes': 'Special chars: <>&',
      };
      
      const entry = createMockEntry(originalData);
      const result = createMockVerificationResult('NIN');
      
      const updatedEntry = appendVerificationData(entry, result);
      
      for (const [key, value] of Object.entries(originalData)) {
        expect(updatedEntry.data[key]).toBe(value);
      }
    });

    it('should handle entries with null and falsy values', () => {
      const originalData = {
        name: 'Test User',
        middleName: null,
        age: 0,
        active: false,
        balance: '',
      };
      
      const entry = createMockEntry(originalData);
      const result = createMockVerificationResult('NIN');
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(updatedEntry.data.name).toBe('Test User');
      expect(updatedEntry.data.middleName).toBeNull();
      expect(updatedEntry.data.age).toBe(0);
      expect(updatedEntry.data.active).toBe(false);
      expect(updatedEntry.data.balance).toBe('');
    });

    it('should handle entries with many columns', () => {
      const originalData: Record<string, unknown> = {};
      for (let i = 1; i <= 50; i++) {
        originalData[`Column_${i}`] = `Value_${i}`;
      }
      
      const entry = createMockEntry(originalData);
      const result = createMockVerificationResult('NIN');
      
      const updatedEntry = appendVerificationData(entry, result);
      
      expect(Object.keys(updatedEntry.data).length).toBe(50);
      for (let i = 1; i <= 50; i++) {
        expect(updatedEntry.data[`Column_${i}`]).toBe(`Value_${i}`);
      }
    });
  });

  describe('validateDataPreservation', () => {
    it('should return true when all data is preserved', () => {
      const originalData = { name: 'Test', email: 'test@test.com', value: 123 };
      const originalEntry = createMockEntry(originalData);
      const updatedEntry = createMockEntry({ ...originalData }, { status: 'verified' });
      
      expect(validateDataPreservation(originalEntry, updatedEntry)).toBe(true);
    });

    it('should return false when a field is missing', () => {
      const originalEntry = createMockEntry({ name: 'Test', email: 'test@test.com', extra: 'field' });
      const updatedEntry = createMockEntry({ name: 'Test', email: 'test@test.com' });
      
      expect(validateDataPreservation(originalEntry, updatedEntry)).toBe(false);
    });

    it('should return false when a field value is changed', () => {
      const originalEntry = createMockEntry({ name: 'Test', value: 100 });
      const updatedEntry = createMockEntry({ name: 'Test', value: 200 });
      
      expect(validateDataPreservation(originalEntry, updatedEntry)).toBe(false);
    });

    it('should return false when extra fields are added', () => {
      const originalEntry = createMockEntry({ name: 'Test' });
      const updatedEntry = createMockEntry({ name: 'Test', newField: 'added' });
      
      expect(validateDataPreservation(originalEntry, updatedEntry)).toBe(false);
    });

    it('should handle nested object comparison', () => {
      const originalEntry = createMockEntry({ name: 'Test', nested: { a: 1, b: 2 } });
      const updatedEntry = createMockEntry({ name: 'Test', nested: { a: 1, b: 2 } });
      
      expect(validateDataPreservation(originalEntry, updatedEntry)).toBe(true);
    });

    it('should detect nested object changes', () => {
      const originalEntry = createMockEntry({ name: 'Test', nested: { a: 1, b: 2 } });
      const updatedEntry = createMockEntry({ name: 'Test', nested: { a: 1, b: 3 } });
      
      expect(validateDataPreservation(originalEntry, updatedEntry)).toBe(false);
    });
  });

  describe('validateVerificationAppend', () => {
    it('should return true for valid NIN verification', () => {
      const entry = createMockEntry(
        { name: 'Test' },
        { status: 'verified', verifiedAt: new Date(), nin: '12345678901' }
      );
      const result = createMockVerificationResult('NIN', { identityNumber: '12345678901' });
      
      expect(validateVerificationAppend(entry, result)).toBe(true);
    });

    it('should return true for valid CAC verification', () => {
      const entry = createMockEntry(
        { name: 'Test' },
        {
          status: 'verified',
          verifiedAt: new Date(),
          cac: 'RC123456',
          cacCompanyName: 'Test Company Ltd',
        }
      );
      const result = createMockVerificationResult('CAC', {
        identityNumber: 'RC123456',
        companyName: 'Test Company Ltd',
      });
      
      expect(validateVerificationAppend(entry, result)).toBe(true);
    });

    it('should return false if status is not verified', () => {
      const entry = createMockEntry(
        { name: 'Test' },
        { status: 'pending', nin: '12345678901' }
      );
      const result = createMockVerificationResult('NIN');
      
      expect(validateVerificationAppend(entry, result)).toBe(false);
    });

    it('should return false if verifiedAt is not set', () => {
      const entry = createMockEntry(
        { name: 'Test' },
        { status: 'verified', nin: '12345678901', verifiedAt: undefined }
      );
      const result = createMockVerificationResult('NIN');
      
      expect(validateVerificationAppend(entry, result)).toBe(false);
    });

    it('should return false if NIN does not match', () => {
      const entry = createMockEntry(
        { name: 'Test' },
        { status: 'verified', verifiedAt: new Date(), nin: '99999999999' }
      );
      const result = createMockVerificationResult('NIN', { identityNumber: '12345678901' });
      
      expect(validateVerificationAppend(entry, result)).toBe(false);
    });

    it('should return false if CAC does not match', () => {
      const entry = createMockEntry(
        { name: 'Test' },
        { status: 'verified', verifiedAt: new Date(), cac: 'RC999999' }
      );
      const result = createMockVerificationResult('CAC', { identityNumber: 'RC123456' });
      
      expect(validateVerificationAppend(entry, result)).toBe(false);
    });
  });

  describe('Integration: Full Verification Flow', () => {
    it('should pass all validations after appendVerificationData for NIN', () => {
      const originalData = {
        'Customer Name': 'John Doe',
        'Policy Number': 'POL-12345',
        'Email': 'john.doe@example.com',
      };
      
      const originalEntry = createMockEntry(originalData);
      const result = createMockVerificationResult('NIN', { identityNumber: '11122233344' });
      
      const updatedEntry = appendVerificationData(originalEntry, result);
      
      expect(validateDataPreservation(originalEntry, updatedEntry)).toBe(true);
      expect(validateVerificationAppend(updatedEntry, result)).toBe(true);
      expect(originalEntry.status).toBe('pending');
      expect(originalEntry.nin).toBeUndefined();
    });

    it('should pass all validations after appendVerificationData for CAC', () => {
      const originalData = {
        'Company Name': 'XYZ Industries',
        'Contact Email': 'contact@xyz.com',
      };
      
      const originalEntry = createMockEntry(originalData);
      const result = createMockVerificationResult('CAC', {
        identityNumber: 'RC777888',
        companyName: 'XYZ Industries Limited',
      });
      
      const updatedEntry = appendVerificationData(originalEntry, result);
      
      expect(validateDataPreservation(originalEntry, updatedEntry)).toBe(true);
      expect(validateVerificationAppend(updatedEntry, result)).toBe(true);
      expect(originalEntry.status).toBe('pending');
      expect(originalEntry.cac).toBeUndefined();
    });
  });
});
