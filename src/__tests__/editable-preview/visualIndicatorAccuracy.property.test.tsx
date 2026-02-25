/**
 * Property Test: Visual Indicator Accuracy
 * 
 * **Property 12: Visual Indicator Accuracy**
 * 
 * For any cell in the preview table, the visual indicator (background color, border, icon) 
 * should accurately reflect whether the cell is currently being edited, has been edited and 
 * saved, has validation errors, or is in a normal state, with distinct colors for each state.
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render } from '@testing-library/react';
import { EditablePreviewTable } from '../../components/identity/EditablePreviewTable';

describe('Property 12: Visual Indicator Accuracy', () => {
  it('should display checkmark icon for edited cells', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom('Date of Birth', 'NIN', 'BVN', 'Email', 'First Name', 'Last Name'),
        (rowIndex, column) => {
          const rows = [
            { 'Date of Birth': '01/01/1990', 'NIN': '12345678901', 'BVN': '98765432109', 'Email': 'test1@example.com', 'First Name': 'John', 'Last Name': 'Doe' },
            { 'Date of Birth': '15/03/1985', 'NIN': '11111111111', 'BVN': '22222222222', 'Email': 'test2@example.com', 'First Name': 'Jane', 'Last Name': 'Smith' },
            { 'Date of Birth': '20/07/1992', 'NIN': '33333333333', 'BVN': '44444444444', 'Email': 'test3@example.com', 'First Name': 'Bob', 'Last Name': 'Johnson' },
            { 'Date of Birth': '10/11/1988', 'NIN': '55555555555', 'BVN': '66666666666', 'Email': 'test4@example.com', 'First Name': 'Alice', 'Last Name': 'Williams' },
            { 'Date of Birth': '05/09/1995', 'NIN': '77777777777', 'BVN': '88888888888', 'Email': 'test5@example.com', 'First Name': 'Charlie', 'Last Name': 'Brown' },
          ];

          const columns = ['Date of Birth', 'NIN', 'BVN', 'Email', 'First Name', 'Last Name'];

          // Create edit state with one edited cell
          const editState = new Map();
          const rowEdits = new Map();
          rowEdits.set(column, 'edited value');
          editState.set(rowIndex, rowEdits);

          const { container } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
              editState={editState}
              validationState={new Map()}
              editingCell={null}
              onCellEdit={() => {}}
              onRowSave={() => {}}
              onRowCancel={() => {}}
              onCellEditStart={() => {}}
              onCellEditEnd={() => {}}
            />
          );

          // Check for checkmark icon (CheckCircleIcon)
          const checkmarkIcons = container.querySelectorAll('[data-testid="CheckCircleIcon"]');
          
          // Should have exactly one checkmark icon for the edited cell
          expect(checkmarkIcons.length).toBe(1);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should display error icon for cells with validation errors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom('Date of Birth', 'NIN', 'BVN'),
        (rowIndex, column) => {
          const rows = [
            { 'Date of Birth': '01/01/1990', 'NIN': '12345678901', 'BVN': '98765432109', 'Email': 'test1@example.com', 'First Name': 'John', 'Last Name': 'Doe' },
            { 'Date of Birth': '15/03/1985', 'NIN': '11111111111', 'BVN': '22222222222', 'Email': 'test2@example.com', 'First Name': 'Jane', 'Last Name': 'Smith' },
            { 'Date of Birth': '20/07/1992', 'NIN': '33333333333', 'BVN': '44444444444', 'Email': 'test3@example.com', 'First Name': 'Bob', 'Last Name': 'Johnson' },
            { 'Date of Birth': '10/11/1988', 'NIN': '55555555555', 'BVN': '66666666666', 'Email': 'test4@example.com', 'First Name': 'Alice', 'Last Name': 'Williams' },
            { 'Date of Birth': '05/09/1995', 'NIN': '77777777777', 'BVN': '88888888888', 'Email': 'test5@example.com', 'First Name': 'Charlie', 'Last Name': 'Brown' },
          ];

          const columns = ['Date of Birth', 'NIN', 'BVN', 'Email', 'First Name', 'Last Name'];

          // Create validation state with one error
          const validationState = new Map();
          validationState.set(rowIndex, [
            {
              rowIndex,
              rowNumber: rowIndex + 2,
              column,
              value: rows[rowIndex][column],
              errorType: 'TEST_ERROR',
              message: 'Test error',
            },
          ]);

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

          // Check for error icon (ErrorIcon)
          const errorIcons = container.querySelectorAll('[data-testid="ErrorIcon"]');
          
          // Should have exactly one error icon for the cell with error
          expect(errorIcons.length).toBe(1);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should display both checkmark and error icons when cell is edited and has error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom('Date of Birth', 'NIN', 'BVN'),
        fc.boolean(),
        fc.boolean(),
        (rowIndex, column, hasEdit, hasError) => {
          const rows = [
            { 'Date of Birth': '01/01/1990', 'NIN': '12345678901', 'BVN': '98765432109', 'Email': 'test1@example.com', 'First Name': 'John', 'Last Name': 'Doe' },
            { 'Date of Birth': '15/03/1985', 'NIN': '11111111111', 'BVN': '22222222222', 'Email': 'test2@example.com', 'First Name': 'Jane', 'Last Name': 'Smith' },
            { 'Date of Birth': '20/07/1992', 'NIN': '33333333333', 'BVN': '44444444444', 'Email': 'test3@example.com', 'First Name': 'Bob', 'Last Name': 'Johnson' },
            { 'Date of Birth': '10/11/1988', 'NIN': '55555555555', 'BVN': '66666666666', 'Email': 'test4@example.com', 'First Name': 'Alice', 'Last Name': 'Williams' },
            { 'Date of Birth': '05/09/1995', 'NIN': '77777777777', 'BVN': '88888888888', 'Email': 'test5@example.com', 'First Name': 'Charlie', 'Last Name': 'Brown' },
          ];

          const columns = ['Date of Birth', 'NIN', 'BVN', 'Email', 'First Name', 'Last Name'];

          // Create edit state
          const editState = new Map();
          if (hasEdit) {
            const rowEdits = new Map();
            rowEdits.set(column, 'edited value');
            editState.set(rowIndex, rowEdits);
          }

          // Create validation state
          const validationState = new Map();
          if (hasError) {
            validationState.set(rowIndex, [
              {
                rowIndex,
                rowNumber: rowIndex + 2,
                column,
                value: rows[rowIndex][column],
                errorType: 'TEST_ERROR',
                message: 'Test error',
              },
            ]);
          }

          const { container } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
              editState={editState}
              validationState={validationState}
              editingCell={null}
              onCellEdit={() => {}}
              onRowSave={() => {}}
              onRowCancel={() => {}}
              onCellEditStart={() => {}}
              onCellEditEnd={() => {}}
            />
          );

          const checkmarkIcons = container.querySelectorAll('[data-testid="CheckCircleIcon"]');
          const errorIcons = container.querySelectorAll('[data-testid="ErrorIcon"]');

          // Both icons can be displayed if cell is both edited and has error
          if (hasEdit && hasError) {
            // Both icons should be present
            expect(checkmarkIcons.length).toBe(1);
            expect(errorIcons.length).toBe(1);
          } else if (hasEdit) {
            expect(checkmarkIcons.length).toBe(1);
            expect(errorIcons.length).toBe(0);
          } else if (hasError) {
            expect(errorIcons.length).toBe(1);
            expect(checkmarkIcons.length).toBe(0);
          } else {
            expect(checkmarkIcons.length).toBe(0);
            expect(errorIcons.length).toBe(0);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should apply distinct visual states for edited vs error vs normal cells', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { hasEdit: true, hasError: false, expectedIcon: 'CheckCircleIcon' },
          { hasEdit: false, hasError: true, expectedIcon: 'ErrorIcon' },
          { hasEdit: false, hasError: false, expectedIcon: null },
        ),
        (state) => {
          const rows = [
            { 'Date of Birth': '01/01/1990', 'NIN': '12345678901', 'Email': 'test@example.com', 'First Name': 'John', 'Last Name': 'Doe' },
          ];

          const columns = ['Date of Birth', 'NIN', 'Email', 'First Name', 'Last Name'];

          // Create edit state
          const editState = new Map();
          if (state.hasEdit) {
            const rowEdits = new Map();
            rowEdits.set('NIN', 'edited value');
            editState.set(0, rowEdits);
          }

          // Create validation state
          const validationState = new Map();
          if (state.hasError) {
            validationState.set(0, [
              {
                rowIndex: 0,
                rowNumber: 2,
                column: 'NIN',
                value: rows[0]['NIN'],
                errorType: 'TEST_ERROR',
                message: 'Test error',
              },
            ]);
          }

          const { container } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
              editState={editState}
              validationState={validationState}
              editingCell={null}
              onCellEdit={() => {}}
              onRowSave={() => {}}
              onRowCancel={() => {}}
              onCellEditStart={() => {}}
              onCellEditEnd={() => {}}
            />
          );

          if (state.expectedIcon) {
            const icons = container.querySelectorAll(`[data-testid="${state.expectedIcon}"]`);
            expect(icons.length).toBeGreaterThan(0);
          } else {
            const checkmarkIcons = container.querySelectorAll('[data-testid="CheckCircleIcon"]');
            const errorIcons = container.querySelectorAll('[data-testid="ErrorIcon"]');
            // Normal cells in NIN column should have no icons
            // (Email and name columns may have their own styling but no edit/error icons)
            expect(checkmarkIcons.length).toBe(0);
            expect(errorIcons.length).toBe(0);
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});
