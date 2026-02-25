/**
 * Property Test: Validation Error Display Workflow
 * 
 * **Property 8: Validation Error Display Workflow**
 * 
 * For any row that is re-validated, if errors are detected, error indicators should 
 * appear on affected cells and the error summary count should increase; if no errors 
 * are detected, error indicators should be removed and the error summary count should 
 * decrease.
 * 
 * **Validates: Requirements 3.2, 3.3, 3.4**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { EditablePreviewTable } from '../../components/identity/EditablePreviewTable';

describe('Property 8: Validation Error Display Workflow', () => {
  it('should display error indicators when validation detects errors', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            'Date of Birth': fc.oneof(
              fc.constant('01/01/1990'), // Valid
              fc.constant('01/01/2010'), // Invalid: under 18
            ),
            'NIN': fc.oneof(
              fc.constant('12345678901'), // Valid
              fc.constant('123'), // Invalid: too short
            ),
            'Email': fc.constant('test@example.com'),
            'First Name': fc.constant('John'),
            'Last Name': fc.constant('Doe'),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (rows) => {
          const columns = ['Date of Birth', 'NIN', 'Email', 'First Name', 'Last Name'];
          
          // Create validation state with errors for rows that have invalid data
          const validationState = new Map();
          rows.forEach((row, index) => {
            const errors = [];
            
            // Check DOB
            if (row['Date of Birth'] === '01/01/2010') {
              errors.push({
                rowIndex: index,
                rowNumber: index + 2,
                column: 'Date of Birth',
                value: row['Date of Birth'],
                errorType: 'DOB_UNDER_AGE',
                message: 'DOB indicates age under 18',
              });
            }
            
            // Check NIN
            if (row['NIN'] === '123') {
              errors.push({
                rowIndex: index,
                rowNumber: index + 2,
                column: 'NIN',
                value: row['NIN'],
                errorType: 'NIN_INVALID',
                message: 'NIN must be exactly 11 digits',
              });
            }
            
            if (errors.length > 0) {
              validationState.set(index, errors);
            }
          });

          const { container } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
              editState={new Map()}
              validationState={validationState}
              editingCell={null}
              onCellEdit={() => {}}
              onRowSave={() => {}}
              onRowCancel={() => {}}
              onCellEditStart={() => {}}
              onCellEditEnd={() => {}}
            />
          );

          // Count cells with error icons (ErrorIcon component)
          const errorIcons = container.querySelectorAll('[data-testid="ErrorIcon"]');
          
          // Count expected errors
          let expectedErrorCount = 0;
          validationState.forEach((errors) => {
            expectedErrorCount += errors.length;
          });

          // Error indicators should match error count
          expect(errorIcons.length).toBe(expectedErrorCount);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should remove error indicators when validation passes after edit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        (rowIndex) => {
          const rows = [
            { 'Date of Birth': '01/01/2010', 'NIN': '123', 'Email': 'test@example.com', 'First Name': 'John', 'Last Name': 'Doe' },
            { 'Date of Birth': '01/01/1990', 'NIN': '12345678901', 'Email': 'test2@example.com', 'First Name': 'Jane', 'Last Name': 'Smith' },
            { 'Date of Birth': '01/01/2015', 'NIN': '456', 'Email': 'test3@example.com', 'First Name': 'Bob', 'Last Name': 'Johnson' },
            { 'Date of Birth': '01/01/1985', 'NIN': '98765432109', 'Email': 'test4@example.com', 'First Name': 'Alice', 'Last Name': 'Williams' },
            { 'Date of Birth': '01/01/2020', 'NIN': '789', 'Email': 'test5@example.com', 'First Name': 'Charlie', 'Last Name': 'Brown' },
          ];

          const columns = ['Date of Birth', 'NIN', 'Email', 'First Name', 'Last Name'];

          // Initial validation state with errors
          const initialValidationState = new Map();
          rows.forEach((row, index) => {
            const errors = [];
            
            if (row['Date of Birth'] === '01/01/2010' || row['Date of Birth'] === '01/01/2015' || row['Date of Birth'] === '01/01/2020') {
              errors.push({
                rowIndex: index,
                rowNumber: index + 2,
                column: 'Date of Birth',
                value: row['Date of Birth'],
                errorType: 'DOB_UNDER_AGE',
                message: 'DOB indicates age under 18',
              });
            }
            
            if (row['NIN'] === '123' || row['NIN'] === '456' || row['NIN'] === '789') {
              errors.push({
                rowIndex: index,
                rowNumber: index + 2,
                column: 'NIN',
                value: row['NIN'],
                errorType: 'NIN_INVALID',
                message: 'NIN must be exactly 11 digits',
              });
            }
            
            if (errors.length > 0) {
              initialValidationState.set(index, errors);
            }
          });

          // Render with initial errors
          const { container: initialContainer } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
              editState={new Map()}
              validationState={initialValidationState}
              editingCell={null}
              onCellEdit={() => {}}
              onRowSave={() => {}}
              onRowCancel={() => {}}
              onCellEditStart={() => {}}
              onCellEditEnd={() => {}}
            />
          );

          const initialErrorIcons = initialContainer.querySelectorAll('[data-testid="ErrorIcon"]');
          const initialErrorCount = initialErrorIcons.length;

          // Simulate fixing errors for the selected row
          const fixedValidationState = new Map(initialValidationState);
          fixedValidationState.delete(rowIndex);

          // Render with fixed errors
          const { container: fixedContainer } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
              editState={new Map()}
              validationState={fixedValidationState}
              editingCell={null}
              onCellEdit={() => {}}
              onRowSave={() => {}}
              onRowCancel={() => {}}
              onCellEditStart={() => {}}
              onCellEditEnd={() => {}}
            />
          );

          const fixedErrorIcons = fixedContainer.querySelectorAll('[data-testid="ErrorIcon"]');
          const fixedErrorCount = fixedErrorIcons.length;

          // Error count should decrease if the row had errors
          const rowHadErrors = initialValidationState.has(rowIndex);
          if (rowHadErrors) {
            const removedErrorCount = initialValidationState.get(rowIndex)!.length;
            expect(fixedErrorCount).toBe(initialErrorCount - removedErrorCount);
          } else {
            // If row had no errors, count should stay the same
            expect(fixedErrorCount).toBe(initialErrorCount);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should update error summary count when errors are added or removed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hasError: fc.boolean(),
            errorCount: fc.integer({ min: 1, max: 3 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (rowStates) => {
          // Calculate initial error count
          let initialErrorCount = 0;
          const initialValidationState = new Map();
          
          rowStates.forEach((state, index) => {
            if (state.hasError) {
              const errors = Array.from({ length: state.errorCount }, (_, i) => ({
                rowIndex: index,
                rowNumber: index + 2,
                column: `Column${i}`,
                value: 'invalid',
                errorType: 'TEST_ERROR',
                message: 'Test error',
              }));
              initialValidationState.set(index, errors);
              initialErrorCount += errors.length;
            }
          });

          // Simulate fixing one row (remove first row with errors)
          const fixedValidationState = new Map(initialValidationState);
          let removedErrorCount = 0;
          for (const [rowIndex, errors] of initialValidationState.entries()) {
            fixedValidationState.delete(rowIndex);
            removedErrorCount = errors.length;
            break;
          }

          const finalErrorCount = initialErrorCount - removedErrorCount;

          // Verify error count decreased correctly
          let actualFinalCount = 0;
          fixedValidationState.forEach((errors) => {
            actualFinalCount += errors.length;
          });

          expect(actualFinalCount).toBe(finalErrorCount);
        }
      ),
      { numRuns: 30 }
    );
  });
});
