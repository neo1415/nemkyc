/**
 * Property Test: Original Value Preservation During Editing
 * 
 * **Validates: Requirements 9.1, 9.2**
 * 
 * Property 16: Original Value Preservation During Editing
 * For any cell being edited, the original value should remain unchanged 
 * in the data store until the user explicitly saves the changes.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getMergedRowData } from '../../types/editablePreview';

describe('Property 16: Original Value Preservation During Editing', () => {
  it('should preserve original values when editing', () => {
    fc.assert(
      fc.property(
        fc.record({
          DOB: fc.string({ minLength: 8, maxLength: 10 }),
          NIN: fc.string({ minLength: 11, maxLength: 11 }),
          Email: fc.emailAddress(),
        }),
        fc.string({ minLength: 8, maxLength: 10 }),
        (originalRow, newDOB) => {
          const rowIndex = 0;
          const editState = new Map<number, Map<string, any>>();

          // Original row should be unchanged
          const originalDOB = originalRow.DOB;

          // Simulate editing (not yet saved)
          editState.set(rowIndex, new Map([['DOB', newDOB]]));

          // Original row should still have original value
          expect(originalRow.DOB).toBe(originalDOB);

          // Merged data should have new value
          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);
          expect(mergedRow.DOB).toBe(newDOB);

          // But original row is still unchanged
          expect(originalRow.DOB).toBe(originalDOB);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not mutate original data during edit state updates', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            DOB: fc.string({ minLength: 8, maxLength: 10 }),
            NIN: fc.string({ minLength: 11, maxLength: 11 }),
            Email: fc.emailAddress(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.integer({ min: 0, max: 9 }),
        fc.string({ minLength: 8, maxLength: 10 }),
        (originalRows, rowIndex, newValue) => {
          if (rowIndex >= originalRows.length) return;

          const editState = new Map<number, Map<string, any>>();
          const originalValue = originalRows[rowIndex].DOB;

          // Add edit to state
          editState.set(rowIndex, new Map([['DOB', newValue]]));

          // Original array should be unchanged
          expect(originalRows[rowIndex].DOB).toBe(originalValue);

          // Get merged data
          const mergedRow = getMergedRowData(originalRows[rowIndex], rowIndex, editState);

          // Merged has new value
          expect(mergedRow.DOB).toBe(newValue);

          // Original still unchanged
          expect(originalRows[rowIndex].DOB).toBe(originalValue);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve original values for unedited columns', () => {
    fc.assert(
      fc.property(
        fc.record({
          DOB: fc.string({ minLength: 8, maxLength: 10 }),
          NIN: fc.string({ minLength: 11, maxLength: 11 }),
          BVN: fc.string({ minLength: 11, maxLength: 11 }),
          Email: fc.emailAddress(),
        }),
        fc.string({ minLength: 8, maxLength: 10 }),
        (originalRow, newDOB) => {
          const rowIndex = 0;
          const editState = new Map<number, Map<string, any>>();

          // Edit only DOB
          editState.set(rowIndex, new Map([['DOB', newDOB]]));

          // Get merged data
          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);

          // Edited column has new value
          expect(mergedRow.DOB).toBe(newDOB);

          // Unedited columns have original values
          expect(mergedRow.NIN).toBe(originalRow.NIN);
          expect(mergedRow.BVN).toBe(originalRow.BVN);
          expect(mergedRow.Email).toBe(originalRow.Email);

          // Original row is completely unchanged
          expect(originalRow.DOB).not.toBe(newDOB);
          expect(originalRow.NIN).toBe(mergedRow.NIN);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve original values when edit state is cleared', () => {
    fc.assert(
      fc.property(
        fc.record({
          DOB: fc.string({ minLength: 8, maxLength: 10 }),
          NIN: fc.string({ minLength: 11, maxLength: 11 }),
        }),
        fc.string({ minLength: 8, maxLength: 10 }),
        (originalRow, newDOB) => {
          const rowIndex = 0;
          const editState = new Map<number, Map<string, any>>();
          const originalDOB = originalRow.DOB;

          // Add edit
          editState.set(rowIndex, new Map([['DOB', newDOB]]));

          // Clear edit (cancel)
          editState.delete(rowIndex);

          // Get merged data (should be original)
          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);

          // Should have original value
          expect(mergedRow.DOB).toBe(originalDOB);
          expect(originalRow.DOB).toBe(originalDOB);
        }
      ),
      { numRuns: 50 }
    );
  });
});
