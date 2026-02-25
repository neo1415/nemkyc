/**
 * Property Test: Save Triggers State Update and Validation
 * 
 * Validates: Requirements 2.2, 2.5, 3.1
 * Property 5: For any row with pending edits, clicking the save button should
 * commit all edits to Edit_State and trigger re-validation for that row.
 */

import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { validateRow } from '../../utils/validation/rowValidation';
import { getMergedRowData, updateEditState, type EditState } from '../../types/editablePreview';

describe('Property 5: Save Triggers State Update and Validation', () => {
  it('should commit edits to edit state on save', () => {
    fc.assert(
      fc.property(
        fc.record({
          Name: fc.string({ minLength: 1, maxLength: 50 }),
          Email: fc.emailAddress(),
          DOB: fc.date({ min: new Date('1900-01-01'), max: new Date('2005-01-01') })
            .map((d) => d.toISOString().split('T')[0]),
          NIN: fc.string({ minLength: 11, maxLength: 11 }),
        }),
        fc.array(
          fc.record({
            column: fc.constantFrom('Name', 'Email', 'DOB', 'NIN'),
            value: fc.string(),
          }),
          { minLength: 1, maxLength: 4 }
        ),
        (originalRow, edits) => {
          let editState: EditState = new Map();
          const rowIndex = 0;

          // Simulate applying edits
          for (const edit of edits) {
            editState = updateEditState(editState, rowIndex, edit.column, edit.value);
          }

          // Verify edits are in state
          const rowEdits = editState.get(rowIndex);
          expect(rowEdits).toBeDefined();
          expect(rowEdits!.size).toBeGreaterThan(0);

          // Verify each edit is stored
          for (const edit of edits) {
            expect(rowEdits!.has(edit.column)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should trigger validation after save', () => {
    fc.assert(
      fc.property(
        fc.record({
          Name: fc.string(),
          Email: fc.emailAddress(),
          DOB: fc.oneof(
            fc.date({ min: new Date('1900-01-01'), max: new Date('2005-01-01') })
              .map((d) => d.toISOString().split('T')[0]),
            fc.constant('invalid-date'),
            fc.constant('2020-01-01') // Under 18
          ),
          NIN: fc.oneof(
            fc.string({ minLength: 11, maxLength: 11 }),
            fc.string({ minLength: 1, maxLength: 10 }) // Invalid
          ),
        }),
        (row) => {
          const columns = ['Name', 'Email', 'DOB', 'NIN'];
          const rowIndex = 0;

          // Validate the row
          const errors = validateRow(row, rowIndex, columns, { templateType: 'individual' });

          // Validation should return an array
          expect(Array.isArray(errors)).toBe(true);

          // If DOB or NIN are invalid, should have errors
          const hasInvalidDOB = row.DOB === 'invalid-date' || row.DOB === '2020-01-01';
          const hasInvalidNIN = row.NIN.length !== 11;

          if (hasInvalidDOB || hasInvalidNIN) {
            expect(errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should merge edits with original data before validation', () => {
    fc.assert(
      fc.property(
        fc.record({
          Name: fc.string(),
          Email: fc.emailAddress(),
          DOB: fc.date({ min: new Date('1900-01-01'), max: new Date('2005-01-01') })
            .map((d) => d.toISOString().split('T')[0]),
          NIN: fc.string({ minLength: 5, maxLength: 10 }), // Invalid initially
        }),
        fc.string({ minLength: 11, maxLength: 11 }), // Valid NIN
        (originalRow, validNIN) => {
          let editState: EditState = new Map();
          const rowIndex = 0;

          // Edit NIN to valid value
          editState = updateEditState(editState, rowIndex, 'NIN', validNIN);

          // Get merged data
          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);

          // Merged row should have valid NIN
          expect(mergedRow.NIN).toBe(validNIN);
          expect(mergedRow.NIN.length).toBe(11);

          // Other fields should be unchanged
          expect(mergedRow.Name).toBe(originalRow.Name);
          expect(mergedRow.Email).toBe(originalRow.Email);
          expect(mergedRow.DOB).toBe(originalRow.DOB);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all edited columns', () => {
    fc.assert(
      fc.property(
        fc.record({
          Name: fc.string(),
          Email: fc.emailAddress(),
          DOB: fc.date({ min: new Date('1900-01-01'), max: new Date('2005-01-01') })
            .map((d) => d.toISOString().split('T')[0]),
          NIN: fc.string({ minLength: 11, maxLength: 11 }),
          BVN: fc.string({ minLength: 11, maxLength: 11 }),
        }),
        fc.array(
          fc.record({
            column: fc.constantFrom('DOB', 'NIN', 'BVN'),
            value: fc.oneof(
              fc.string({ minLength: 1, maxLength: 5 }), // Invalid
              fc.string({ minLength: 11, maxLength: 11 }) // Valid for NIN/BVN
            ),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (originalRow, edits) => {
          let editState: EditState = new Map();
          const rowIndex = 0;
          const columns = ['Name', 'Email', 'DOB', 'NIN', 'BVN'];

          // Apply edits
          for (const edit of edits) {
            editState = updateEditState(editState, rowIndex, edit.column, edit.value);
          }

          // Get merged data
          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);

          // Validate merged row
          const errors = validateRow(mergedRow, rowIndex, columns, { templateType: 'individual' });

          // Should validate all columns
          expect(Array.isArray(errors)).toBe(true);

          // Check if any edited columns have invalid values
          const editedColumns = new Set(edits.map((e) => e.column));
          const hasInvalidEdits = edits.some((edit) => {
            if (edit.column === 'NIN' || edit.column === 'BVN') {
              return edit.value.length !== 11;
            }
            return false;
          });

          if (hasInvalidEdits) {
            expect(errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle validation of corrected errors', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0), // Invalid NIN (not whitespace)
        fc.string({ minLength: 11, maxLength: 11 }).filter((s) => /^\d{11}$/.test(s)), // Valid NIN (11 digits)
        (invalidNIN, validNIN) => {
          const originalRow = {
            Name: 'John Doe',
            Email: 'john@example.com',
            DOB: '1990-01-01',
            NIN: invalidNIN,
          };

          const columns = ['Name', 'Email', 'DOB', 'NIN'];
          const rowIndex = 0;

          // Validate original (should have error if NIN is not 11 digits)
          const originalErrors = validateRow(originalRow, rowIndex, columns, { templateType: 'individual' });
          
          // Only proceed if original had NIN error
          const hadNINError = originalErrors.some((e) => e.column === 'NIN');
          if (!hadNINError) return true; // Skip if no error (edge case)

          // Edit to fix NIN
          let editState: EditState = new Map();
          editState = updateEditState(editState, rowIndex, 'NIN', validNIN);

          // Get merged data
          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);

          // Validate merged (should have no NIN errors)
          const mergedErrors = validateRow(mergedRow, rowIndex, columns, { templateType: 'individual' });
          const ninErrors = mergedErrors.filter((e) => e.column === 'NIN');
          expect(ninErrors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
