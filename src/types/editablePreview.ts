/**
 * Types for Editable Preview Table
 * 
 * Defines the data structures for managing inline editing state,
 * validation state, and cell editing in the preview table.
 */

import type { ValidationError } from '../utils/validation/identityValidation';

/**
 * Edit State - Tracks all cell modifications
 * Structure: Map<rowIndex, Map<columnName, newValue>>
 * Only stores modified cells to minimize memory usage
 */
export type EditState = Map<number, Map<string, any>>;

/**
 * Validation State - Tracks validation results per row
 * Structure: Map<rowIndex, ValidationError[]>
 * Updated after each row save
 */
export type ValidationState = Map<number, ValidationError[]>;

/**
 * Editing Cell - Tracks currently active edit
 * Only one cell can be edited at a time
 */
export interface EditingCell {
  rowIndex: number;
  column: string;
}

/**
 * Helper function to get merged row data
 * Combines original row data with edits from EditState
 */
export function getMergedRowData(
  originalRow: Record<string, any>,
  rowIndex: number,
  editState: EditState
): Record<string, any> {
  const rowEdits = editState.get(rowIndex);
  if (!rowEdits || rowEdits.size === 0) {
    return originalRow;
  }

  return {
    ...originalRow,
    ...Object.fromEntries(rowEdits),
  };
}

/**
 * Helper function to update edit state for a cell
 */
export function updateEditState(
  editState: EditState,
  rowIndex: number,
  column: string,
  value: any
): EditState {
  const newEditState = new Map(editState);
  
  if (!newEditState.has(rowIndex)) {
    newEditState.set(rowIndex, new Map());
  }
  
  const rowEdits = newEditState.get(rowIndex)!;
  rowEdits.set(column, value);
  
  return newEditState;
}

/**
 * Helper function to clear edit state for a row
 */
export function clearRowEditState(
  editState: EditState,
  rowIndex: number
): EditState {
  const newEditState = new Map(editState);
  newEditState.delete(rowIndex);
  return newEditState;
}

/**
 * Helper function to clear all edit state
 */
export function clearEditState(): EditState {
  return new Map();
}

/**
 * Helper function to check if a row has pending edits
 */
export function hasRowEdits(
  editState: EditState,
  rowIndex: number
): boolean {
  const rowEdits = editState.get(rowIndex);
  return rowEdits !== undefined && rowEdits.size > 0;
}

/**
 * Helper function to check if a specific cell has been edited
 */
export function isCellEdited(
  editState: EditState,
  rowIndex: number,
  column: string
): boolean {
  const rowEdits = editState.get(rowIndex);
  return rowEdits !== undefined && rowEdits.has(column);
}

/**
 * Helper function to get all edited rows
 */
export function getEditedRows(editState: EditState): number[] {
  return Array.from(editState.keys());
}

/**
 * Helper function to get merged data for all rows
 */
export function getAllMergedData(
  originalRows: Record<string, any>[],
  editState: EditState
): Record<string, any>[] {
  return originalRows.map((row, index) => 
    getMergedRowData(row, index, editState)
  );
}
