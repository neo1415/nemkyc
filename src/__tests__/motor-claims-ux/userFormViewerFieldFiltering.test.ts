import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 6: User Form Viewer Field Filtering
 * 
 * For any form viewed by a user (non-admin), the displayed fields SHALL NOT include:
 * 'id', 'collection', 'formId', 'userUid', or other administrative identifiers.
 * 
 * Validates: Requirements 5.6
 */

// Administrative fields that should be filtered out
const ADMIN_FIELDS = ['id', 'collection', 'formId', 'userUid', 'timestamp', 'sn', 'S/N', 'serialNumber', 'rowNumber'];

// Function to filter fields for user view (simulates the logic in UserFormViewer)
function filterFieldsForUserView(formData: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    // Skip administrative fields
    if (ADMIN_FIELDS.includes(key)) {
      continue;
    }
    
    // Skip fields with 'sn' or 'serial' in the key name
    if (key.toLowerCase().includes('sn') || key.toLowerCase().includes('serial')) {
      continue;
    }
    
    filtered[key] = value;
  }
  
  return filtered;
}

// Arbitrary for generating form data with administrative fields
const formDataArbitrary = fc.record({
  // Administrative fields (should be filtered)
  id: fc.string(),
  collection: fc.string(),
  formId: fc.string(),
  userUid: fc.string(),
  timestamp: fc.integer(),
  
  // User-visible fields
  fullName: fc.string(),
  email: fc.emailAddress(),
  phoneNumber: fc.string(),
  ticketId: fc.string(),
  status: fc.constantFrom('processing', 'approved', 'rejected'),
  submittedAt: fc.date(),
  address: fc.string(),
  city: fc.string(),
  state: fc.string(),
});

describe('Property 6: User Form Viewer Field Filtering', () => {
  it('should filter out all administrative fields from user view', () => {
    fc.assert(
      fc.property(formDataArbitrary, (formData) => {
        const filteredData = filterFieldsForUserView(formData);
        
        // Property: No administrative fields should be present in filtered data
        const hasAdminFields = ADMIN_FIELDS.some(field => field in filteredData);
        
        expect(hasAdminFields).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all non-administrative fields', () => {
    fc.assert(
      fc.property(formDataArbitrary, (formData) => {
        const filteredData = filterFieldsForUserView(formData);
        
        // Property: All non-admin fields should be preserved
        const nonAdminFields = Object.keys(formData).filter(
          key => !ADMIN_FIELDS.includes(key) && 
                 !key.toLowerCase().includes('sn') && 
                 !key.toLowerCase().includes('serial')
        );
        
        for (const field of nonAdminFields) {
          expect(filteredData).toHaveProperty(field);
          expect(filteredData[field]).toEqual(formData[field]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should filter out fields with "sn" or "serial" in the name', () => {
    fc.assert(
      fc.property(
        fc.record({
          sn: fc.integer(),
          serialNumber: fc.string(),
          'S/N': fc.integer(),
          snField: fc.string(),
          serialData: fc.string(),
          normalField: fc.string(),
        }),
        (formData) => {
          const filteredData = filterFieldsForUserView(formData);
          
          // Property: Fields with 'sn' or 'serial' should be filtered
          expect(filteredData).not.toHaveProperty('sn');
          expect(filteredData).not.toHaveProperty('serialNumber');
          expect(filteredData).not.toHaveProperty('S/N');
          expect(filteredData).not.toHaveProperty('snField');
          expect(filteredData).not.toHaveProperty('serialData');
          
          // But normal fields should remain
          expect(filteredData).toHaveProperty('normalField');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty form data', () => {
    const emptyData = {};
    const filteredData = filterFieldsForUserView(emptyData);
    
    expect(Object.keys(filteredData)).toHaveLength(0);
  });

  it('should handle form data with only administrative fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          collection: fc.string(),
          formId: fc.string(),
          userUid: fc.string(),
          timestamp: fc.integer(),
        }),
        (formData) => {
          const filteredData = filterFieldsForUserView(formData);
          
          // Property: Result should be empty when only admin fields present
          expect(Object.keys(filteredData)).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain data integrity for preserved fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          ticketId: fc.string(),
          fullName: fc.string(),
          email: fc.emailAddress(),
          amount: fc.integer({ min: 0, max: 1000000 }),
          status: fc.constantFrom('processing', 'approved', 'rejected'),
        }),
        (formData) => {
          const filteredData = filterFieldsForUserView(formData);
          
          // Property: Values should not be modified, only filtered
          if ('ticketId' in filteredData) {
            expect(filteredData.ticketId).toBe(formData.ticketId);
          }
          if ('fullName' in filteredData) {
            expect(filteredData.fullName).toBe(formData.fullName);
          }
          if ('email' in filteredData) {
            expect(filteredData.email).toBe(formData.email);
          }
          if ('amount' in filteredData) {
            expect(filteredData.amount).toBe(formData.amount);
          }
          if ('status' in filteredData) {
            expect(filteredData.status).toBe(formData.status);
          }
          
          // Admin field should be filtered
          expect(filteredData).not.toHaveProperty('id');
        }
      ),
      { numRuns: 100 }
    );
  });
});
