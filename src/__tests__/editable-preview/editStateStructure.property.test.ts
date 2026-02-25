/**
 * Property Test: Edit State Structure and Tracking
 * 
 * Validates: Requirements 4.1, 4.2, 4.6
 * Property 9: For any cell that is edited and saved, the Edit_State should store
 * both the original value and the new value, maintaining this data until the
 * dialog is closed or the list is created.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  updateEditState,
  clearRowEditState,
  hasRowEdits,
  isCellEdited,
  getMergedRowData,
  type EditState,
} from '../../types/editablePreview';

describe('Property 9: Edit State Structure and Tracking', () => {
  it('should maintain edit state structure across multiple edits', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            rowIndex: fc.integer({ min: 0, max: 100 }),
            column: fc.string({ minLength: 1, maxLength: 20 }),
            value: fc.oneof(
              fc.string(),
              fc.integer(),
              fc.double(),
              fc.boolean(),
              fc.constant(null)
            ),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (edits) => {
          let editState: EditState = new Map();

          // Apply all edits
          for (const edit of edits) {
            editState = updateEditState(
              editState,
              edit.rowIndex,
              edit.column,
              edit.value
            );
          }

          // Verify structure: EditState should be Map<rowIndex, Map<column, value>>
          expect(editState).toBeInstanceOf(Map);

          // Verify each row's edit map
          for (const [rowIndex, rowEdits] of editState.entries()) {
            expect(typeof rowIndex).toBe('number');
            expect(rowEdits).toBeInstanceOf(Map);

            // Verify each cell edit
            for (const [column, value] of rowEdits.entries()) {
              expect(typeof column).toBe('string');
              // Value can be any type
            }
          }

          // Verify hasRowEdits works correctly
          const editedRows = new Set(edits.map((e) => e.rowIndex));
          for (const rowIndex of editedRows) {
            expect(hasRowEdits(editState, rowIndex)).toBe(true);
          }

          // Verify isCellEdited works correctly
          for (const edit of edits) {
            expect(isCellEdited(editState, edit.rowIndex, edit.column)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve original values when merging with edit state', () => {
    fc.assert(
      fc.property(
        fc.record({
          col1: fc.string(),
          col2: fc.integer(),
          col3: fc.string(),
        }),
        fc.array(
          fc.record({
            column: fc.constantFrom('col1', 'col2', 'col3'),
            value: fc.oneof(fc.string(), fc.integer()),
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

          // Get merged data
          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);

          // Verify edited columns have new values
          const editedColumns = new Set(edits.map((e) => e.column));
          for (const edit of edits) {
            // Get the last edit for this column (in case of multiple edits)
            const lastEdit = edits.filter((e) => e.column === edit.column).pop();
            expect(mergedRow[edit.column]).toBe(lastEdit?.value);
          }

          // Verify unedited columns have original values
          for (const col of Object.keys(originalRow)) {
            if (!editedColumns.has(col)) {
              expect(mergedRow[col]).toBe(originalRow[col]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear row edits correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            rowIndex: fc.integer({ min: 0, max: 20 }),
            column: fc.string({ minLength: 1, maxLength: 10 }),
            value: fc.string(),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        fc.integer({ min: 0, max: 20 }),
        (edits, rowToClear) => {
          let editState: EditState = new Map();

          // Apply all edits
          for (const edit of edits) {
            editState = updateEditState(
              editState,
              edit.rowIndex,
              edit.column,
              edit.value
            );
          }

          // Clear specific row
          editState = clearRowEditState(editState, rowToClear);

          // Verify row is cleared
          expect(hasRowEdits(editState, rowToClear)).toBe(false);

          // Verify other rows are not affected
          const otherEditedRows = new Set(
            edits.filter((e) => e.rowIndex !== rowToClear).map((e) => e.rowIndex)
          );
          for (const rowIndex of otherEditedRows) {
            expect(hasRowEdits(editState, rowIndex)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple edits to the same cell', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.array(fc.string(), { minLength: 2, maxLength: 10 }),
        (rowIndex, column, values) => {
          let editState: EditState = new Map();

          // Apply multiple edits to same cell
          for (const value of values) {
            editState = updateEditState(editState, rowIndex, column, value);
          }

          // Verify only the last value is stored
          const rowEdits = editState.get(rowIndex);
          expect(rowEdits).toBeDefined();
          expect(rowEdits!.get(column)).toBe(values[values.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
