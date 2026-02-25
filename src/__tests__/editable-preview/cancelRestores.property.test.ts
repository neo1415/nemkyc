/**
 * Property Test: Cancel Restores Original Values
 * 
 * Validates: Requirements 2.3, 4.3
 * Property 6: For any row with pending edits, clicking the cancel button should
 * revert all cells in that row to their original values and remove changes from
 * Edit_State.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  getMergedRowData,
  updateEditState,
  clearRowEditState,
  hasRowEdits,
  type EditState,
} from '../../types/editablePreview';

describe('Property 6: Cancel Restores Original Values', () => {
  it('should remove all edits from edit state on cancel', () => {
    fc.assert(
      fc.property(
        fc.record({
          Name: fc.string(),
          Email: fc.emailAddress(),
          Age: fc.integer({ min: 18, max: 100 }),
        }),
        fc.array(
          fc.record({
            column: fc.constantFrom('Name', 'Email', 'Age'),
            value: fc.oneof(fc.string(), fc.integer({ min: 18, max: 100 })),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (originalRow, edits) => {
          let editState: EditState = new Map();
          const rowIndex = 0;

          // Apply edits
          for (const edit of edits) {
            editState = updateEditState(editState, rowIndex, edit.column, edit.value);
          }

          // Verify edits exist
          expect(hasRowEdits(editState, rowIndex)).toBe(true);

          // Cancel (clear edits)
          editState = clearRowEditState(editState, rowIndex);

          // Verify edits are removed
          expect(hasRowEdits(editState, rowIndex)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore original values after cancel', () => {
    fc.assert(
      fc.property(
        fc.record({
          col1: fc.string(),
          col2: fc.integer(),
          col3: fc.boolean(),
        }),
        fc.array(
          fc.record({
            column: fc.constantFrom('col1', 'col2', 'col3'),
            value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (originalRow, edits) => {
          let editState: EditState = new Map();
          const rowIndex = 0;

          // Store original values
          const originalValues = { ...originalRow };

          // Apply edits
          for (const edit of edits) {
            editState = updateEditState(editState, rowIndex, edit.column, edit.value);
          }

          // Get merged data (with edits)
          const mergedWithEdits = getMergedRowData(originalRow, rowIndex, editState);

          // Verify edits are applied
          const editedColumns = new Set(edits.map((e) => e.column));
          for (const col of editedColumns) {
            // At least one edited column should differ from original
            // (unless edit happened to be same value)
          }

          // Cancel edits
          editState = clearRowEditState(editState, rowIndex);

          // Get merged data (after cancel)
          const mergedAfterCancel = getMergedRowData(originalRow, rowIndex, editState);

          // Should match original exactly
          expect(mergedAfterCancel).toEqual(originalValues);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not affect other rows when canceling', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            Name: fc.string(),
            Email: fc.emailAddress(),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        fc.integer({ min: 0, max: 9 }),
        fc.array(
          fc.record({
            rowIndex: fc.integer({ min: 0, max: 9 }),
            column: fc.constantFrom('Name', 'Email'),
            value: fc.string(),
          }),
          { minLength: 3, maxLength: 15 }
        ),
        (rows, rowToCancel, edits) => {
          if (rowToCancel >= rows.length) return true;

          let editState: EditState = new Map();

          // Apply edits to multiple rows
          for (const edit of edits) {
            if (edit.rowIndex < rows.length) {
              editState = updateEditState(
                editState,
                edit.rowIndex,
                edit.column,
                edit.value
              );
            }
          }

          // Store which rows had edits before cancel
          const editedRowsBefore = new Set(
            edits.filter((e) => e.rowIndex < rows.length).map((e) => e.rowIndex)
          );

          // Cancel specific row
          editState = clearRowEditState(editState, rowToCancel);

          // Verify canceled row has no edits
          expect(hasRowEdits(editState, rowToCancel)).toBe(false);

          // Verify other edited rows still have edits
          for (const rowIndex of editedRowsBefore) {
            if (rowIndex !== rowToCancel) {
              expect(hasRowEdits(editState, rowIndex)).toBe(true);
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle canceling multiple times', () => {
    fc.assert(
      fc.property(
        fc.record({
          Name: fc.string(),
          Email: fc.emailAddress(),
        }),
        fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
        (originalRow, values) => {
          let editState: EditState = new Map();
          const rowIndex = 0;

          // Apply and cancel multiple times
          for (const value of values) {
            // Apply edit
            editState = updateEditState(editState, rowIndex, 'Name', value);
            expect(hasRowEdits(editState, rowIndex)).toBe(true);

            // Cancel
            editState = clearRowEditState(editState, rowIndex);
            expect(hasRowEdits(editState, rowIndex)).toBe(false);
          }

          // Final state should have no edits
          expect(hasRowEdits(editState, rowIndex)).toBe(false);

          // Merged data should equal original
          const merged = getMergedRowData(originalRow, rowIndex, editState);
          expect(merged).toEqual(originalRow);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve data types after cancel', () => {
    fc.assert(
      fc.property(
        fc.record({
          stringCol: fc.string(),
          numberCol: fc.integer(),
          boolCol: fc.boolean(),
          nullCol: fc.constant(null),
        }),
        (originalRow) => {
          let editState: EditState = new Map();
          const rowIndex = 0;

          // Apply edits (changing types)
          editState = updateEditState(editState, rowIndex, 'stringCol', 123);
          editState = updateEditState(editState, rowIndex, 'numberCol', 'changed');
          editState = updateEditState(editState, rowIndex, 'boolCol', 'true');

          // Cancel
          editState = clearRowEditState(editState, rowIndex);

          // Get merged data
          const merged = getMergedRowData(originalRow, rowIndex, editState);

          // Types should be preserved
          expect(typeof merged.stringCol).toBe('string');
          expect(typeof merged.numberCol).toBe('number');
          expect(typeof merged.boolCol).toBe('boolean');
          expect(merged.nullCol).toBe(null);

          // Values should match original
          expect(merged).toEqual(originalRow);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle canceling with no edits', () => {
    fc.assert(
      fc.property(
        fc.record({
          Name: fc.string(),
          Email: fc.emailAddress(),
        }),
        fc.integer({ min: 0, max: 10 }),
        (originalRow, rowIndex) => {
          let editState: EditState = new Map();

          // No edits applied
          expect(hasRowEdits(editState, rowIndex)).toBe(false);

          // Cancel (should be no-op)
          editState = clearRowEditState(editState, rowIndex);

          // Still no edits
          expect(hasRowEdits(editState, rowIndex)).toBe(false);

          // Merged data should equal original
          const merged = getMergedRowData(originalRow, rowIndex, editState);
          expect(merged).toEqual(originalRow);
        }
      ),
      { numRuns: 100 }
    );
  });
});
