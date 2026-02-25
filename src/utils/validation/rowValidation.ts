/**
 * Row Validation Utility
 * 
 * Validates a single row of identity data.
 * Used for re-validation after inline edits in the preview table.
 */

import {
  validateDOB,
  validateNIN,
  validateBVN,
  findDOBColumn,
  findNINColumn,
  findBVNColumn,
  type ValidationError,
  type ValidationOptions,
} from './identityValidation';

/**
 * Validate a single row of identity data
 * 
 * @param row - Data row to validate
 * @param rowIndex - 0-based row index
 * @param columns - Column names
 * @param options - Validation options
 * @returns Array of validation errors for this row
 */
export function validateRow(
  row: Record<string, any>,
  rowIndex: number,
  columns: string[],
  options: ValidationOptions
): ValidationError[] {
  const errors: ValidationError[] = [];
  const currentYear = options.currentYear || new Date().getFullYear();

  // Detect relevant columns
  const dobColumn = findDOBColumn(columns);
  const ninColumn = findNINColumn(columns);
  const bvnColumn = findBVNColumn(columns);

  // Validate DOB (all templates)
  if (dobColumn && row[dobColumn]) {
    const error = validateDOB(row[dobColumn], rowIndex, dobColumn, currentYear);
    if (error) errors.push(error);
  }

  // Validate NIN (Individual template only)
  if (options.templateType === 'individual' && ninColumn && row[ninColumn]) {
    const error = validateNIN(row[ninColumn], rowIndex, ninColumn);
    if (error) errors.push(error);
  }

  // Validate BVN (all templates)
  if (bvnColumn && row[bvnColumn]) {
    const error = validateBVN(row[bvnColumn], rowIndex, bvnColumn);
    if (error) errors.push(error);
  }

  return errors;
}
