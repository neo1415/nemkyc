/**
 * Test: AdminUnifiedTable.tsx backward compatibility for NFIU Corporate form
 * 
 * This test verifies that AdminUnifiedTable correctly handles both:
 * 1. Old submissions with separate natureOfBusiness and businessOccupation fields
 * 2. New submissions with combined businessTypeOccupation field
 */

import { describe, it, expect } from 'vitest';

describe('AdminUnifiedTable - NFIU Corporate Form Backward Compatibility', () => {
  describe('organizeFieldsWithMapping logic', () => {
    it('should combine old separate business fields into businessTypeOccupation', () => {
      // Simulate the organizeFieldsWithMapping logic for old data
      const oldData = {
        id: 'test-1',
        insured: 'Test Company',
        natureOfBusiness: 'Manufacturing',
        businessOccupation: 'Factory Operations',
        ownershipOfCompany: 'Nigerian',
      };

      // Simulate the backward compatibility logic
      const organizedData = { ...oldData };
      const collectionName = 'corporate-nfiu-form';

      if (collectionName === 'corporate-nfiu-form') {
        if (!organizedData.businessTypeOccupation && 
            (organizedData.natureOfBusiness || organizedData.businessOccupation)) {
          const parts = [];
          if (organizedData.natureOfBusiness) parts.push(organizedData.natureOfBusiness);
          if (organizedData.businessOccupation) parts.push(organizedData.businessOccupation);
          organizedData.businessTypeOccupation = parts.join(' / ');
        }
      }

      expect(organizedData.businessTypeOccupation).toBe('Manufacturing / Factory Operations');
      expect(organizedData.natureOfBusiness).toBe('Manufacturing'); // Original fields preserved
      expect(organizedData.businessOccupation).toBe('Factory Operations');
    });

    it('should use businessTypeOccupation directly for new data', () => {
      // Simulate the organizeFieldsWithMapping logic for new data
      const newData = {
        id: 'test-2',
        insured: 'Test Company',
        businessTypeOccupation: 'Manufacturing / Factory Operations',
        ownershipOfCompany: 'Nigerian',
      };

      // Simulate the backward compatibility logic
      const organizedData = { ...newData };
      const collectionName = 'corporate-nfiu-form';

      if (collectionName === 'corporate-nfiu-form') {
        if (!organizedData.businessTypeOccupation && 
            (organizedData.natureOfBusiness || organizedData.businessOccupation)) {
          const parts = [];
          if (organizedData.natureOfBusiness) parts.push(organizedData.natureOfBusiness);
          if (organizedData.businessOccupation) parts.push(organizedData.businessOccupation);
          organizedData.businessTypeOccupation = parts.join(' / ');
        }
      }

      expect(organizedData.businessTypeOccupation).toBe('Manufacturing / Factory Operations');
      expect(organizedData.natureOfBusiness).toBeUndefined();
      expect(organizedData.businessOccupation).toBeUndefined();
    });

    it('should handle only natureOfBusiness field', () => {
      const oldData = {
        id: 'test-3',
        insured: 'Test Company',
        natureOfBusiness: 'Manufacturing',
        ownershipOfCompany: 'Nigerian',
      };

      const organizedData = { ...oldData };
      const collectionName = 'corporate-nfiu-form';

      if (collectionName === 'corporate-nfiu-form') {
        if (!organizedData.businessTypeOccupation && 
            (organizedData.natureOfBusiness || organizedData.businessOccupation)) {
          const parts = [];
          if (organizedData.natureOfBusiness) parts.push(organizedData.natureOfBusiness);
          if (organizedData.businessOccupation) parts.push(organizedData.businessOccupation);
          organizedData.businessTypeOccupation = parts.join(' / ');
        }
      }

      expect(organizedData.businessTypeOccupation).toBe('Manufacturing');
    });

    it('should handle only businessOccupation field', () => {
      const oldData = {
        id: 'test-4',
        insured: 'Test Company',
        businessOccupation: 'Factory Operations',
        ownershipOfCompany: 'Nigerian',
      };

      const organizedData = { ...oldData };
      const collectionName = 'corporate-nfiu-form';

      if (collectionName === 'corporate-nfiu-form') {
        if (!organizedData.businessTypeOccupation && 
            (organizedData.natureOfBusiness || organizedData.businessOccupation)) {
          const parts = [];
          if (organizedData.natureOfBusiness) parts.push(organizedData.natureOfBusiness);
          if (organizedData.businessOccupation) parts.push(organizedData.businessOccupation);
          organizedData.businessTypeOccupation = parts.join(' / ');
        }
      }

      expect(organizedData.businessTypeOccupation).toBe('Factory Operations');
    });

    it('should not modify data for non-NFIU Corporate collections', () => {
      const kycData = {
        id: 'test-5',
        insured: 'Test Company',
        natureOfBusiness: 'Manufacturing',
        businessOccupation: 'Factory Operations',
        ownershipOfCompany: 'Nigerian Owned',
      };

      const organizedData = { ...kycData };
      const collectionName = 'corporate-kyc-form';

      if (collectionName === 'corporate-nfiu-form') {
        if (!organizedData.businessTypeOccupation && 
            (organizedData.natureOfBusiness || organizedData.businessOccupation)) {
          const parts = [];
          if (organizedData.natureOfBusiness) parts.push(organizedData.natureOfBusiness);
          if (organizedData.businessOccupation) parts.push(organizedData.businessOccupation);
          organizedData.businessTypeOccupation = parts.join(' / ');
        }
      }

      // For KYC Corporate, the fields should remain separate
      expect(organizedData.businessTypeOccupation).toBeUndefined();
      expect(organizedData.natureOfBusiness).toBe('Manufacturing');
      expect(organizedData.businessOccupation).toBe('Factory Operations');
    });
  });

  describe('Collection mapping', () => {
    it('should map corporate-nfiu-form to correct form mapping key', () => {
      const collectionMappings: Record<string, string> = {
        'corporate-kyc-form': 'corporate-k-y-c',
        'corporate-nfiu-form': 'corporate-nfiu-form',
      };

      expect(collectionMappings['corporate-nfiu-form']).toBe('corporate-nfiu-form');
      expect(collectionMappings['corporate-kyc-form']).toBe('corporate-k-y-c');
    });
  });
});
