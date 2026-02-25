/**
 * Property Test: Row Action Button Visibility
 * 
 * Validates: Requirements 2.1, 2.4
 * Property 4: For any row in the preview table, save and cancel buttons should
 * be visible if and only if that row has pending edits.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { EditablePreviewTable } from '../../components/identity/EditablePreviewTable';
import type { EditState, ValidationState } from '../../types/editablePreview';

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

describe('Property 4: Row Action Button Visibility', () => {
  it('should show actions only for rows with edits', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }),
        fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 10 }),
        (rowCount, editedRowIndices) => {
          const columns = ['Name', 'Email', 'Age'];
          const rows = Array.from({ length: rowCount }, (_, i) => ({
            Name: `Person ${i}`,
            Email: `person${i}@example.com`,
            Age: 25 + i,
          }));

          // Create edit state for specified rows
          const editState: EditState = new Map();
          const uniqueEditedRows = Array.from(new Set(editedRowIndices.filter((idx) => idx < rowCount)));
          
          uniqueEditedRows.forEach((rowIdx) => {
            const rowEdits = new Map();
            rowEdits.set('Name', `Updated ${rowIdx}`);
            editState.set(rowIdx, rowEdits);
          });

          const { unmount } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              editState={editState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={vi.fn()}
              onCellEditEnd={vi.fn()}
            />
          );

          // Count save buttons (one per edited row)
          const saveButtons = screen.queryAllByLabelText(/save changes/i);
          expect(saveButtons.length).toBe(uniqueEditedRows.length);

          // Count cancel buttons (one per edited row)
          const cancelButtons = screen.queryAllByLabelText(/cancel changes/i);
          expect(cancelButtons.length).toBe(uniqueEditedRows.length);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not show actions when no edits exist', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (rowCount) => {
          const columns = ['Name', 'Email'];
          const rows = Array.from({ length: rowCount }, (_, i) => ({
            Name: `Person ${i}`,
            Email: `person${i}@example.com`,
          }));

          const { unmount } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              editState={new Map() as EditState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={vi.fn()}
              onCellEditEnd={vi.fn()}
            />
          );

          // No save/cancel buttons should be visible
          const saveButtons = screen.queryAllByLabelText(/save changes/i);
          expect(saveButtons).toHaveLength(0);

          const cancelButtons = screen.queryAllByLabelText(/cancel changes/i);
          expect(cancelButtons).toHaveLength(0);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show actions for all edited rows regardless of position', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            rowIndex: fc.integer({ min: 0, max: 15 }),
            column: fc.constantFrom('Name', 'Email', 'Age'),
            value: fc.string(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (edits) => {
          const columns = ['Name', 'Email', 'Age'];
          const rows = Array.from({ length: 16 }, (_, i) => ({
            Name: `Person ${i}`,
            Email: `person${i}@example.com`,
            Age: 25,
          }));

          // Build edit state
          const editState: EditState = new Map();
          for (const edit of edits) {
            if (!editState.has(edit.rowIndex)) {
              editState.set(edit.rowIndex, new Map());
            }
            editState.get(edit.rowIndex)!.set(edit.column, edit.value);
          }

          const { unmount } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              editState={editState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={vi.fn()}
              onCellEditEnd={vi.fn()}
            />
          );

          // Number of save buttons should equal number of edited rows
          const editedRowCount = editState.size;
          const saveButtons = screen.queryAllByLabelText(/save changes/i);
          expect(saveButtons.length).toBe(editedRowCount);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle single row with multiple column edits', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.array(
          fc.record({
            column: fc.constantFrom('Name', 'Email', 'Age', 'Phone'),
            value: fc.string(),
          }),
          { minLength: 1, maxLength: 4 }
        ),
        (targetRow, columnEdits) => {
          const columns = ['Name', 'Email', 'Age', 'Phone'];
          const rows = Array.from({ length: 11 }, (_, i) => ({
            Name: `Person ${i}`,
            Email: `person${i}@example.com`,
            Age: 25,
            Phone: '1234567890',
          }));

          // Edit multiple columns in one row
          const editState: EditState = new Map();
          const rowEdits = new Map();
          for (const edit of columnEdits) {
            rowEdits.set(edit.column, edit.value);
          }
          editState.set(targetRow, rowEdits);

          const { unmount } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              editState={editState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={vi.fn()}
              onCellEditEnd={vi.fn()}
            />
          );

          // Should show exactly one set of action buttons (for the one edited row)
          const saveButtons = screen.queryAllByLabelText(/save changes/i);
          expect(saveButtons.length).toBe(1);

          const cancelButtons = screen.queryAllByLabelText(/cancel changes/i);
          expect(cancelButtons.length).toBe(1);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should update visibility when edit state changes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        (rowToEdit) => {
          const columns = ['Name', 'Email'];
          const rows = Array.from({ length: 6 }, (_, i) => ({
            Name: `Person ${i}`,
            Email: `person${i}@example.com`,
          }));

          // Initially no edits
          const { rerender, unmount } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              editState={new Map() as EditState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={vi.fn()}
              onCellEditEnd={vi.fn()}
            />
          );

          // No buttons initially
          expect(screen.queryAllByLabelText(/save changes/i)).toHaveLength(0);

          // Add edit
          const editState: EditState = new Map();
          editState.set(rowToEdit, new Map([['Name', 'Updated']]));

          rerender(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn="Email"
              editState={editState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={vi.fn()}
              onCellEditEnd={vi.fn()}
            />
          );

          // Should now have buttons
          expect(screen.queryAllByLabelText(/save changes/i)).toHaveLength(1);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });
});
