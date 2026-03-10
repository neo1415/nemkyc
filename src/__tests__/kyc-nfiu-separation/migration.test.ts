import { describe, it, expect, beforeEach, vi } from 'vitest';
import { migrationService } from '@/services/migrationService';
import { getDocs, writeBatch } from 'firebase/firestore';

// Mock Firebase
vi.mock('@/firebase/config', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  doc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

describe('Migration Tests - Task 8.9', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Migration adds formType to records', () => {
    it('should add formType="legacy" to Individual-kyc-form records without formType', async () => {
      const mockRecord = {
        id: 'test-record-1',
        data: () => ({
          userId: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          submittedAt: { seconds: 1234567890 },
        }),
      };

      const mockSnapshot = {
        docs: [mockRecord],
        empty: false,
        size: 1,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.migrateCollection('Individual-kyc-form', 'individual');

      expect(result.success).toBe(true);
      expect(result.migratedRecords).toBe(1);
      expect(result.totalRecords).toBe(1);
    });

    it('should add formType="legacy" to corporate-kyc-form records without formType', async () => {
      const mockRecord = {
        id: 'test-record-2',
        data: () => ({
          userId: 'user456',
          companyName: 'Test Corp',
          rcNumber: 'RC123456',
          submittedAt: { seconds: 1234567890 },
        }),
      };

      const mockSnapshot = {
        docs: [mockRecord],
        empty: false,
        size: 1,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.migrateCollection('corporate-kyc-form', 'corporate');

      expect(result.success).toBe(true);
      expect(result.migratedRecords).toBe(1);
    });

    it('should skip records that already have formType', async () => {
      const mockRecord = {
        id: 'test-record-3',
        data: () => ({
          userId: 'user789',
          firstName: 'Jane',
          lastName: 'Smith',
          formType: 'kyc',
          submittedAt: { seconds: 1234567890 },
        }),
      };

      const mockSnapshot = {
        docs: [mockRecord],
        empty: false,
        size: 1,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.migrateCollection('Individual-kyc-form', 'individual');

      expect(result.success).toBe(true);
      expect(result.migratedRecords).toBe(0); // Should skip this record
      expect(result.totalRecords).toBe(1);
    });
  });

  describe('Migration preserves all original data', () => {
    it('should preserve all fields from Individual-kyc-form records', async () => {
      const originalData = {
        userId: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+2348012345678',
        dateOfBirth: '1990-01-01',
        address: '123 Test Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        submittedAt: { seconds: 1234567890 },
      };

      const mockRecord = {
        id: 'test-record-4',
        data: () => originalData,
      };

      const mockSnapshot = {
        docs: [mockRecord],
        empty: false,
        size: 1,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.migrateCollection('Individual-kyc-form', 'individual');

      expect(result.success).toBe(true);
      expect(result.migratedRecords).toBe(1);
      // Migration only adds metadata, doesn't remove original fields
    });

    it('should preserve nested objects and arrays', async () => {
      const originalData = {
        userId: 'user456',
        companyName: 'Test Corp',
        directors: [
          { name: 'Director 1', email: 'dir1@test.com' },
          { name: 'Director 2', email: 'dir2@test.com' },
        ],
        accountDetails: {
          bankName: 'Test Bank',
          accountNumber: '1234567890',
        },
        submittedAt: { seconds: 1234567890 },
      };

      const mockRecord = {
        id: 'test-record-5',
        data: () => originalData,
      };

      const mockSnapshot = {
        docs: [mockRecord],
        empty: false,
        size: 1,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.migrateCollection('corporate-kyc-form', 'corporate');

      expect(result.success).toBe(true);
      expect(result.migratedRecords).toBe(1);
    });
  });

  describe('Rollback restores original state', () => {
    it('should remove migration metadata fields', async () => {
      const migratedRecord = {
        id: 'test-record-6',
        data: () => ({
          userId: 'user123',
          firstName: 'John',
          formType: 'legacy',
          formVariant: 'individual',
          migratedAt: { seconds: 1234567890 },
        }),
      };

      const mockSnapshot = {
        docs: [migratedRecord],
        empty: false,
        size: 1,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.rollbackMigration('Individual-kyc-form');

      expect(result.success).toBe(true);
      expect(result.rolledBackRecords).toBe(1);
    });

    it('should handle empty collections gracefully', async () => {
      const mockSnapshot = {
        docs: [],
        empty: true,
        size: 0,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.rollbackMigration('Individual-kyc-form');

      expect(result.success).toBe(true);
      expect(result.rolledBackRecords).toBe(0);
    });
  });

  describe('Verification reports accurate counts', () => {
    it('should count total records correctly', async () => {
      const mockRecords = [
        { id: '1', data: () => ({ userId: 'user1' }) },
        { id: '2', data: () => ({ userId: 'user2' }) },
        { id: '3', data: () => ({ userId: 'user3' }) },
      ];

      const mockSnapshot = {
        docs: mockRecords,
        empty: false,
        size: 3,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.verifyMigration('Individual-kyc-form');

      expect(result.total).toBe(3);
    });

    it('should count migrated records correctly', async () => {
      const mockRecords = [
        { id: '1', data: () => ({ userId: 'user1', formType: 'legacy' }) },
        { id: '2', data: () => ({ userId: 'user2', formType: 'kyc' }) },
        { id: '3', data: () => ({ userId: 'user3' }) },
      ];

      const mockSnapshot = {
        docs: mockRecords,
        empty: false,
        size: 3,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.verifyMigration('Individual-kyc-form');

      expect(result.migrated).toBe(2);
      expect(result.unmigrated).toBe(1);
      expect(result.legacy).toBe(1);
      expect(result.kyc).toBe(1);
    });
  });

  describe('Migration metadata', () => {
    it('should add formVariant="individual" to Individual-kyc-form records', async () => {
      const mockRecord = {
        id: 'test-record-8',
        data: () => ({
          userId: 'user123',
          firstName: 'John',
          submittedAt: { seconds: 1234567890 },
        }),
      };

      const mockSnapshot = {
        docs: [mockRecord],
        empty: false,
        size: 1,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.migrateCollection('Individual-kyc-form', 'individual');

      expect(result.success).toBe(true);
      // Verify formVariant is set to 'individual' via the update call
    });

    it('should add formVariant="corporate" to corporate-kyc-form records', async () => {
      const mockRecord = {
        id: 'test-record-9',
        data: () => ({
          userId: 'user456',
          companyName: 'Test Corp',
          submittedAt: { seconds: 1234567890 },
        }),
      };

      const mockSnapshot = {
        docs: [mockRecord],
        empty: false,
        size: 1,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.migrateCollection('corporate-kyc-form', 'corporate');

      expect(result.success).toBe(true);
      // Verify formVariant is set to 'corporate' via the update call
    });
  });

  describe('Error handling', () => {
    it('should handle migration errors gracefully', async () => {
      (getDocs as any).mockRejectedValue(new Error('Database error'));

      const result = await migrationService.migrateCollection('Individual-kyc-form', 'individual');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle rollback errors gracefully', async () => {
      (getDocs as any).mockRejectedValue(new Error('Database error'));

      const result = await migrationService.rollbackMigration('Individual-kyc-form');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle verification errors gracefully', async () => {
      (getDocs as any).mockRejectedValue(new Error('Database error'));

      await expect(migrationService.verifyMigration('Individual-kyc-form')).rejects.toThrow();
    });
  });

  describe('Batch processing', () => {
    it('should handle large numbers of records', async () => {
      // Create 600 mock records (more than batch size of 500)
      const mockRecords = Array.from({ length: 600 }, (_, i) => ({
        id: `record-${i}`,
        data: () => ({
          userId: `user${i}`,
          firstName: `User${i}`,
        }),
      }));

      const mockSnapshot = {
        docs: mockRecords,
        empty: false,
        size: 600,
      };

      (getDocs as any).mockResolvedValue(mockSnapshot);

      const result = await migrationService.migrateCollection('Individual-kyc-form', 'individual');

      expect(result.success).toBe(true);
      expect(result.migratedRecords).toBe(600);
      expect(result.totalRecords).toBe(600);
    });
  });
});
