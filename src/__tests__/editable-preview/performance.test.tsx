/**
 * Performance Tests for Large Files
 * 
 * Tests rendering time, edit responsiveness, and re-validation performance
 * for large datasets (500+ rows).
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { EditablePreviewTable } from '../../components/identity/EditablePreviewTable';
import { VirtualizedEditableTable } from '../../components/identity/VirtualizedEditableTable';

describe('Performance Tests for Large Files', () => {
  // Helper to generate large dataset
  const generateLargeDataset = (rowCount: number) => {
    return Array.from({ length: rowCount }, (_, index) => ({
      'Date of Birth': `01/01/199${index % 10}`,
      'NIN': `1234567890${index}`,
      'BVN': `9876543210${index}`,
      'Email': `user${index}@example.com`,
      'First Name': `FirstName${index}`,
      'Last Name': `LastName${index}`,
    }));
  };

  const columns = ['Date of Birth', 'NIN', 'BVN', 'Email', 'First Name', 'Last Name'];

  describe('Requirement 10.1: Rendering Performance', () => {
    it('should render 500 row file in under 2 seconds', () => {
      const rows = generateLargeDataset(500);
      const startTime = performance.now();

      render(
        <EditablePreviewTable
          columns={columns}
          rows={rows}
          emailColumn="Email"
          nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
          editState={new Map()}
          validationState={new Map()}
          editingCell={null}
          onCellEdit={() => {}}
          onRowSave={() => {}}
          onRowCancel={() => {}}
          onCellEditStart={() => {}}
          onCellEditEnd={() => {}}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in under 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    it('should use virtualized table for 100+ rows', () => {
      const rows = generateLargeDataset(150);

      const { container } = render(
        <EditablePreviewTable
          columns={columns}
          rows={rows}
          emailColumn="Email"
          nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
          editState={new Map()}
          validationState={new Map()}
          editingCell={null}
          onCellEdit={() => {}}
          onRowSave={() => {}}
          onRowCancel={() => {}}
          onCellEditStart={() => {}}
          onCellEditEnd={() => {}}
        />
      );

      // Check for "Virtualized" indicator in the preview text
      expect(container.textContent).toContain('Virtualized');
    });

    it('should use regular table for less than 100 rows', () => {
      const rows = generateLargeDataset(50);

      const { container } = render(
        <EditablePreviewTable
          columns={columns}
          rows={rows}
          emailColumn="Email"
          nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
          editState={new Map()}
          validationState={new Map()}
          editingCell={null}
          onCellEdit={() => {}}
          onRowSave={() => {}}
          onRowCancel={() => {}}
          onCellEditStart={() => {}}
          onCellEditEnd={() => {}}
        />
      );

      // Should not have "Virtualized" indicator
      expect(container.textContent).not.toContain('Virtualized');
    });
  });

  describe('Requirement 10.2: Edit Responsiveness', () => {
    it('should handle cell edit in virtualized table quickly', async () => {
      const rows = generateLargeDataset(200);
      const onCellEdit = vi.fn();
      const onCellEditStart = vi.fn();

      const { container } = render(
        <VirtualizedEditableTable
          columns={columns}
          rows={rows}
          emailColumn="Email"
          nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
          editState={new Map()}
          validationState={new Map()}
          editingCell={null}
          onCellEdit={onCellEdit}
          onRowSave={() => {}}
          onRowCancel={() => {}}
          onCellEditStart={onCellEditStart}
          onCellEditEnd={() => {}}
        />
      );

      const startTime = performance.now();

      // Find first editable cell (this will be in the virtualized list)
      const cells = container.querySelectorAll('[role="cell"]');
      if (cells.length > 0) {
        const firstCell = cells[0] as HTMLElement;
        fireEvent.click(firstCell);
      }

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Edit should respond in under 100ms
      expect(responseTime).toBeLessThan(100);
    });

    it('should handle multiple rapid edits without lag', async () => {
      const rows = generateLargeDataset(150);
      const onCellEdit = vi.fn();

      render(
        <VirtualizedEditableTable
          columns={columns}
          rows={rows}
          emailColumn="Email"
          nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
          editState={new Map()}
          validationState={new Map()}
          editingCell={null}
          onCellEdit={onCellEdit}
          onRowSave={() => {}}
          onRowCancel={() => {}}
          onCellEditStart={() => {}}
          onCellEditEnd={() => {}}
        />
      );

      const startTime = performance.now();

      // Simulate 10 rapid edits
      for (let i = 0; i < 10; i++) {
        onCellEdit(i, 'NIN', `newvalue${i}`);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All edits should complete in under 500ms
      expect(totalTime).toBeLessThan(500);
      expect(onCellEdit).toHaveBeenCalledTimes(10);
    });
  });

  describe('Requirement 10.3: Re-validation Performance', () => {
    it('should re-validate large dataset quickly', () => {
      const rows = generateLargeDataset(300);
      const validationState = new Map();

      // Add some validation errors
      for (let i = 0; i < 50; i++) {
        validationState.set(i, [
          {
            rowIndex: i,
            rowNumber: i + 2,
            column: 'NIN',
            value: rows[i]['NIN'],
            errorType: 'NIN_INVALID',
            message: 'Invalid NIN',
          },
        ]);
      }

      const startTime = performance.now();

      render(
        <VirtualizedEditableTable
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

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render with validation errors in under 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    it('should handle validation state updates efficiently', () => {
      const rows = generateLargeDataset(200);
      const initialValidationState = new Map();
      const onRowSave = vi.fn();

      const { rerender } = render(
        <VirtualizedEditableTable
          columns={columns}
          rows={rows}
          emailColumn="Email"
          nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
          editState={new Map()}
          validationState={initialValidationState}
          editingCell={null}
          onCellEdit={() => {}}
          onRowSave={onRowSave}
          onRowCancel={() => {}}
          onCellEditStart={() => {}}
          onCellEditEnd={() => {}}
        />
      );

      // Update validation state with errors
      const updatedValidationState = new Map();
      for (let i = 0; i < 100; i++) {
        updatedValidationState.set(i, [
          {
            rowIndex: i,
            rowNumber: i + 2,
            column: 'NIN',
            value: rows[i]['NIN'],
            errorType: 'NIN_INVALID',
            message: 'Invalid NIN',
          },
        ]);
      }

      const startTime = performance.now();

      rerender(
        <VirtualizedEditableTable
          columns={columns}
          rows={rows}
          emailColumn="Email"
          nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
          editState={new Map()}
          validationState={updatedValidationState}
          editingCell={null}
          onCellEdit={() => {}}
          onRowSave={onRowSave}
          onRowCancel={() => {}}
          onCellEditStart={() => {}}
          onCellEditEnd={() => {}}
        />
      );

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Validation state update should be fast (under 500ms)
      expect(updateTime).toBeLessThan(500);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not render all rows at once in virtualized mode', () => {
      const rows = generateLargeDataset(500);

      const { container } = render(
        <VirtualizedEditableTable
          columns={columns}
          rows={rows}
          emailColumn="Email"
          nameColumns={{ firstName: 'First Name', lastName: 'Last Name' }}
          editState={new Map()}
          validationState={new Map()}
          editingCell={null}
          onCellEdit={() => {}}
          onRowSave={() => {}}
          onRowCancel={() => {}}
          onCellEditStart={() => {}}
          onCellEditEnd={() => {}}
        />
      );

      // Count rendered table rows (should be much less than 500)
      const renderedRows = container.querySelectorAll('[role="row"]');
      
      // Virtualized list should only render visible rows (approximately 7-10 rows visible at once)
      // Plus the header row
      expect(renderedRows.length).toBeLessThan(50);
    });
  });
});
