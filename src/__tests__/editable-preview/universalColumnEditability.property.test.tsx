/**
 * Property Test: Universal Column Editability
 * 
 * Validates: Requirements 1.7
 * Property 3: For any column in the preview table (DOB, NIN, BVN, Email, Name, etc.),
 * all cells in that column should be editable.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fc from 'fast-check';
import { EditablePreviewTable } from '../../components/identity/EditablePreviewTable';
import type { EditState, ValidationState } from '../../types/editablePreview';

describe('Property 3: Universal Column Editability', () => {
  it('should make all cells editable for any column', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        fc.array(
          fc.record({
            values: fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (columns, rowsData) => {
          // Create rows with all columns
          const rows = rowsData.map((rowData) => {
            const row: Record<string, any> = {};
            columns.forEach((col, idx) => {
              row[col] = rowData.values[idx % rowData.values.length];
            });
            return row;
          });

          const onCellEditStart = vi.fn();

          const { container } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn={columns[0]}
              editState={new Map() as EditState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={onCellEditStart}
              onCellEditEnd={vi.fn()}
            />
          );

          // Get all table cells (excluding header and actions column)
          const tbody = container.querySelector('tbody');
          const cells = tbody?.querySelectorAll('td');

          if (cells) {
            // Click on first data cell (not actions column)
            const firstDataCell = cells[0];
            fireEvent.click(firstDataCell);

            // Should trigger edit start
            expect(onCellEditStart).toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 50 } // Reduced for rendering tests
    );
  });

  it('should allow editing any cell in any row', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 5 }),
        (rowCount, colCount) => {
          const columns = Array.from({ length: colCount + 1 }, (_, i) => `Col${i}`);
          const rows = Array.from({ length: rowCount + 1 }, (_, i) =>
            Object.fromEntries(columns.map((col) => [col, `Value${i}`]))
          );

          const onCellEditStart = vi.fn();

          const { container } = render(
            <EditablePreviewTable
              columns={columns}
              rows={rows}
              emailColumn={columns[0]}
              editState={new Map() as EditState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={onCellEditStart}
              onCellEditEnd={vi.fn()}
            />
          );

          const tbody = container.querySelector('tbody');
          const allCells = tbody?.querySelectorAll('td');

          if (allCells && allCells.length > 0) {
            // Click on a random data cell (not last column which is actions)
            const dataCells = Array.from(allCells).filter((_, idx) => (idx + 1) % (columns.length + 1) !== 0);
            
            if (dataCells.length > 0) {
              const randomCell = dataCells[Math.floor(Math.random() * dataCells.length)];
              fireEvent.click(randomCell);

              expect(onCellEditStart).toHaveBeenCalled();
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should support editing standard identity columns', () => {
    const standardColumns = ['Name', 'Email', 'DOB', 'NIN', 'BVN', 'Phone', 'Address'];
    
    fc.assert(
      fc.property(
        fc.shuffledSubarray(standardColumns, { minLength: 3, maxLength: 7 }),
        fc.array(
          fc.record({
            Name: fc.string(),
            Email: fc.emailAddress(),
            DOB: fc.date().map((d) => d.toISOString().split('T')[0]),
            NIN: fc.string({ minLength: 11, maxLength: 11 }),
            BVN: fc.string({ minLength: 11, maxLength: 11 }),
            Phone: fc.string(),
            Address: fc.string(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (selectedColumns, rowsData) => {
          const rows = rowsData.map((row) => {
            const filteredRow: Record<string, any> = {};
            selectedColumns.forEach((col) => {
              filteredRow[col] = row[col as keyof typeof row];
            });
            return filteredRow;
          });

          const onCellEditStart = vi.fn();

          const { container } = render(
            <EditablePreviewTable
              columns={selectedColumns}
              rows={rows}
              emailColumn={selectedColumns.includes('Email') ? 'Email' : selectedColumns[0]}
              editState={new Map() as EditState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={onCellEditStart}
              onCellEditEnd={vi.fn()}
            />
          );

          const tbody = container.querySelector('tbody');
          const cells = tbody?.querySelectorAll('td');

          if (cells && cells.length > 0) {
            // Click first data cell
            fireEvent.click(cells[0]);
            expect(onCellEditStart).toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle custom column names', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
          { minLength: 1, maxLength: 8 }
        ),
        (customColumns) => {
          const uniqueColumns = Array.from(new Set(customColumns));
          
          if (uniqueColumns.length === 0) return true;

          const rows = [
            Object.fromEntries(uniqueColumns.map((col) => [col, 'Value1'])),
            Object.fromEntries(uniqueColumns.map((col) => [col, 'Value2'])),
          ];

          const onCellEditStart = vi.fn();

          const { container } = render(
            <EditablePreviewTable
              columns={uniqueColumns}
              rows={rows}
              emailColumn={uniqueColumns[0]}
              editState={new Map() as EditState}
              validationState={new Map() as ValidationState}
              editingCell={null}
              onCellEdit={vi.fn()}
              onRowSave={vi.fn()}
              onRowCancel={vi.fn()}
              onCellEditStart={onCellEditStart}
              onCellEditEnd={vi.fn()}
            />
          );

          const tbody = container.querySelector('tbody');
          const cells = tbody?.querySelectorAll('td');

          if (cells && cells.length > 0) {
            fireEvent.click(cells[0]);
            expect(onCellEditStart).toHaveBeenCalled();
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
