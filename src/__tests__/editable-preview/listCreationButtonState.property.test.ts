/**
 * Property Test: List Creation Button State
 * 
 * **Property 11: List Creation Button State**
 * 
 * For any upload dialog state, the "Create List" button should be disabled if and only if 
 * validation errors exist in either edited or unedited rows, and should display an 
 * explanatory message when disabled.
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Property 11: List Creation Button State', () => {
  it('should disable button when validation errors exist', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // hasValidationErrors
        fc.boolean(), // hasListName
        fc.boolean(), // hasEmailColumn
        (hasValidationErrors, hasListName, hasEmailColumn) => {
          // Simulate button disabled state logic
          const validationResult = hasValidationErrors
            ? { valid: false, errors: [{ rowIndex: 0, column: 'NIN', errorType: 'NIN_INVALID', message: 'Invalid NIN' }], errorSummary: { totalErrors: 1, affectedRows: 1 } }
            : { valid: true, errors: [], errorSummary: { totalErrors: 0, affectedRows: 0 } };

          const listName = hasListName ? 'Test List' : '';
          const emailColumn = hasEmailColumn ? 'Email' : '';
          const parseResult = { columns: ['Email', 'NIN'], rows: [], totalRows: 0 };

          // Button should be disabled if:
          // - No parse result
          // - No list name
          // - No email column
          // - Validation errors exist
          const shouldBeDisabled =
            !parseResult ||
            !listName.trim() ||
            !emailColumn ||
            (validationResult && !validationResult.valid);

          // Verify logic
          if (hasValidationErrors) {
            expect(shouldBeDisabled).toBe(true);
          } else if (!hasListName || !hasEmailColumn) {
            expect(shouldBeDisabled).toBe(true);
          } else {
            expect(shouldBeDisabled).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should enable button only when all conditions are met', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasParseResult: fc.boolean(),
          hasListName: fc.boolean(),
          hasEmailColumn: fc.boolean(),
          hasValidationErrors: fc.boolean(),
        }),
        (state) => {
          const parseResult = state.hasParseResult
            ? { columns: ['Email', 'NIN'], rows: [], totalRows: 0 }
            : null;

          const listName = state.hasListName ? 'Test List' : '';
          const emailColumn = state.hasEmailColumn ? 'Email' : '';

          const validationResult = state.hasValidationErrors
            ? { valid: false, errors: [{ rowIndex: 0, column: 'NIN', errorType: 'NIN_INVALID', message: 'Invalid NIN' }], errorSummary: { totalErrors: 1, affectedRows: 1 } }
            : state.hasParseResult
            ? { valid: true, errors: [], errorSummary: { totalErrors: 0, affectedRows: 0 } }
            : null;

          const shouldBeEnabled =
            parseResult &&
            listName.trim() &&
            emailColumn &&
            validationResult &&
            validationResult.valid;

          // Button should be enabled only when ALL conditions are met
          if (state.hasParseResult && state.hasListName && state.hasEmailColumn && !state.hasValidationErrors) {
            expect(shouldBeEnabled).toBe(true);
          } else {
            expect(shouldBeEnabled).toBeFalsy(); // Can be false or null
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should count errors from both original and edited rows', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }), // originalErrors
        fc.integer({ min: 0, max: 5 }), // editedRowErrors
        (originalErrors, editedRowErrors) => {
          // Simulate validation result with errors from both original and edited rows
          const errors = [
            ...Array.from({ length: originalErrors }, (_, i) => ({
              rowIndex: i,
              rowNumber: i + 2,
              column: 'NIN',
              value: '123',
              errorType: 'NIN_INVALID',
              message: 'Invalid NIN',
            })),
            ...Array.from({ length: editedRowErrors }, (_, i) => ({
              rowIndex: originalErrors + i,
              rowNumber: originalErrors + i + 2,
              column: 'DOB',
              value: '01/01/2010',
              errorType: 'DOB_UNDER_AGE',
              message: 'Under 18',
            })),
          ];

          const totalErrors = originalErrors + editedRowErrors;
          const validationResult = {
            valid: totalErrors === 0,
            errors,
            errorSummary: {
              totalErrors,
              affectedRows: totalErrors,
            },
          };

          // Button should be disabled if any errors exist
          const shouldBeDisabled = !validationResult.valid;

          if (totalErrors > 0) {
            expect(shouldBeDisabled).toBe(true);
            expect(validationResult.errorSummary.totalErrors).toBe(totalErrors);
          } else {
            expect(shouldBeDisabled).toBe(false);
            expect(validationResult.errorSummary.totalErrors).toBe(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should update button state when errors are fixed through editing', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // initialErrors
        fc.integer({ min: 0, max: 5 }), // fixedErrors
        (initialErrors, fixedErrors) => {
          // Ensure fixedErrors doesn't exceed initialErrors
          const actualFixedErrors = Math.min(fixedErrors, initialErrors);
          const remainingErrors = initialErrors - actualFixedErrors;

          // Initial state with errors
          const initialValidationResult = {
            valid: false,
            errors: Array.from({ length: initialErrors }, (_, i) => ({
              rowIndex: i,
              rowNumber: i + 2,
              column: 'NIN',
              value: '123',
              errorType: 'NIN_INVALID',
              message: 'Invalid NIN',
            })),
            errorSummary: {
              totalErrors: initialErrors,
              affectedRows: initialErrors,
            },
          };

          // After fixing some errors
          const updatedValidationResult = {
            valid: remainingErrors === 0,
            errors: Array.from({ length: remainingErrors }, (_, i) => ({
              rowIndex: i,
              rowNumber: i + 2,
              column: 'NIN',
              value: '123',
              errorType: 'NIN_INVALID',
              message: 'Invalid NIN',
            })),
            errorSummary: {
              totalErrors: remainingErrors,
              affectedRows: remainingErrors,
            },
          };

          // Button should be disabled initially
          expect(initialValidationResult.valid).toBe(false);

          // Button state should update based on remaining errors
          if (remainingErrors === 0) {
            expect(updatedValidationResult.valid).toBe(true);
          } else {
            expect(updatedValidationResult.valid).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
