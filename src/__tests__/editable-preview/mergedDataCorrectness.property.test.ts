/**
 * Property Test: Merged Data Correctness
 * 
 * Validates: Requirements 4.4, 4.5, 9.3, 9.4, 9.5
 * Property 10: For any row when creating the list, the merged row data should
 * contain edited values for modified columns and original values for unmodified
 * columns, preserving data types.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  getMergedRowData,
  getAllMergedData,
  updateEditState,
  type EditState,
} from '../../types/editablePreview';

describe('Property 10: Merged Data Correctness', () => {
  it('should merge edited and original values correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          email: fc.emailAddress(),
          age: fc.integer({ min: 18, max: 100 }),
          nin: fc.string({ minLength: 11, maxLength: 11 }),
        }),
        fc.array(
          fc.record({
            column: fc.constantFrom('name', 'email', 'age', 'nin'),
            value: fc.oneof(
              fc.string(),
              fc.integer({ min: 18, max: 100 })
            ),
          }),
          { minLength: 1, maxLength: 4 }
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

          // Verify all original columns exist
          for (const col of Object.keys(originalRow)) {
            expect(mergedRow).toHaveProperty(col);
          }

          // Verify edited columns have new values
          const editMap = new Map(edits.map((e) => [e.column, e.value]));
          for (const [column, value] of editMap.entries()) {
            expect(mergedRow[column]).toBe(value);
          }

          // Verify unedited columns have original values
          const editedColumns = new Set(edits.map((e) => e.column));
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

  it('should preserve data types in merged data', () => {
    fc.assert(
      fc.property(
        fc.record({
          stringCol: fc.string(),
          numberCol: fc.integer(),
          boolCol: fc.boolean(),
          nullCol: fc.constant(null),
        }),
        (originalRow) => {
          const editState: EditState = new Map();
          const rowIndex = 0;

          // No edits - should preserve all types
          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);

          expect(typeof mergedRow.stringCol).toBe('string');
          expect(typeof mergedRow.numberCol).toBe('number');
          expect(typeof mergedRow.boolCol).toBe('boolean');
          expect(mergedRow.nullCol).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty edit state correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          col1: fc.string(),
          col2: fc.integer(),
          col3: fc.boolean(),
        }),
        (originalRow) => {
          const editState: EditState = new Map();
          const rowIndex = 0;

          const mergedRow = getMergedRowData(originalRow, rowIndex, editState);

          // Should return exact copy of original
          expect(mergedRow).toEqual(originalRow);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should merge all rows correctly with getAllMergedData', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string(),
            email: fc.emailAddress(),
            age: fc.integer({ min: 18, max: 100 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.array(
          fc.record({
            rowIndex: fc.integer({ min: 0, max: 19 }),
            column: fc.constantFrom('name', 'email', 'age'),
            value: fc.oneof(fc.string(), fc.integer({ min: 18, max: 100 })),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (originalRows, edits) => {
          let editState: EditState = new Map();

          // Apply edits
          for (const edit of edits) {
            if (edit.rowIndex < originalRows.length) {
              editState = updateEditState(
                editState,
                edit.rowIndex,
                edit.column,
                edit.value
              );
            }
          }

          // Get all merged data
          const mergedData = getAllMergedData(originalRows, editState);

          // Verify same number of rows
          expect(mergedData.length).toBe(originalRows.length);

          // Verify each row
          for (let i = 0; i < originalRows.length; i++) {
            const originalRow = originalRows[i];
            const mergedRow = mergedData[i];

            // All original columns should exist
            for (const col of Object.keys(originalRow)) {
              expect(mergedRow).toHaveProperty(col);
            }

            // Check if row has edits
            const rowEdits = editState.get(i);
            if (rowEdits) {
              // Verify edited columns
              for (const [column, value] of rowEdits.entries()) {
                expect(mergedRow[column]).toBe(value);
              }

              // Verify unedited columns
              for (const col of Object.keys(originalRow)) {
                if (!rowEdits.has(col)) {
                  expect(mergedRow[col]).toBe(originalRow[col]);
                }
              }
            } else {
              // No edits - should match original
              expect(mergedRow).toEqual(originalRow);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mutate original row data', () => {
    fc.assert(
      fc.property(
        fc.record({
          col1: fc.string(),
          col2: fc.integer(),
        }),
        fc.string(),
        (originalRow, newValue) => {
          let editState: EditState = new Map();
          const rowIndex = 0;

          // Store original values
          const originalCol1 = originalRow.col1;
          const originalCol2 = originalRow.col2;

          // Edit col1
          editState = updateEditState(editState, rowIndex, 'col1', newValue);

          // Get merged data
          getMergedRowData(originalRow, rowIndex, editState);

          // Verify original row is unchanged
          expect(originalRow.col1).toBe(originalCol1);
          expect(originalRow.col2).toBe(originalCol2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
