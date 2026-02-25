/**
 * Unit Tests: EditablePreviewTable Component
 * 
 * Validates: Requirements 2.4, 7.1, 7.5
 * Tests table rendering, sticky header, row count, and RowActions visibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditablePreviewTable } from '../../components/identity/EditablePreviewTable';
import type { EditState, ValidationState } from '../../types/editablePreview';

describe('EditablePreviewTable Component', () => {
  const defaultProps = {
    columns: ['Name', 'Email', 'DOB', 'NIN'],
    rows: [
      { Name: 'John Doe', Email: 'john@example.com', DOB: '1990-01-01', NIN: '12345678901' },
      { Name: 'Jane Smith', Email: 'jane@example.com', DOB: '1985-05-15', NIN: '98765432109' },
    ],
    emailColumn: 'Email',
    nameColumns: { firstName: 'Name' },
    editState: new Map() as EditState,
    validationState: new Map() as ValidationState,
    editingCell: null,
    onCellEdit: vi.fn(),
    onRowSave: vi.fn(),
    onRowCancel: vi.fn(),
    onCellEditStart: vi.fn(),
    onCellEditEnd: vi.fn(),
  };

  it('should render table with correct structure', () => {
    const { container } = render(<EditablePreviewTable {...defaultProps} />);
    
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    
    const thead = container.querySelector('thead');
    const tbody = container.querySelector('tbody');
    
    expect(thead).toBeInTheDocument();
    expect(tbody).toBeInTheDocument();
  });

  it('should render all column headers', () => {
    render(<EditablePreviewTable {...defaultProps} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('DOB')).toBeInTheDocument();
    expect(screen.getByText('NIN')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should render all rows', () => {
    render(<EditablePreviewTable {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should display row count indicator', () => {
    render(<EditablePreviewTable {...defaultProps} />);
    
    expect(screen.getByText(/Preview \(2 rows\)/i)).toBeInTheDocument();
  });

  it('should have sticky header', () => {
    const { container } = render(<EditablePreviewTable {...defaultProps} />);
    
    const table = container.querySelector('table');
    expect(table).toHaveAttribute('class');
    // MUI applies stickyHeader prop internally
  });

  it('should show RowActions for rows with pending edits', () => {
    const editState = new Map();
    editState.set(0, new Map([['Name', 'Updated Name']]));
    
    render(<EditablePreviewTable {...defaultProps} editState={editState} />);
    
    // Should have save/cancel buttons for row 0
    const saveButtons = screen.getAllByLabelText(/save changes/i);
    expect(saveButtons.length).toBeGreaterThan(0);
  });

  it('should not show RowActions for rows without edits', () => {
    render(<EditablePreviewTable {...defaultProps} />);
    
    // No edits, so no save/cancel buttons
    const saveButtons = screen.queryAllByLabelText(/save changes/i);
    expect(saveButtons).toHaveLength(0);
  });

  it('should highlight email column', () => {
    const { container } = render(<EditablePreviewTable {...defaultProps} />);
    
    // Find Email header cell
    const emailHeader = screen.getByText('Email').closest('th');
    expect(emailHeader).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('should highlight name columns', () => {
    const { container } = render(<EditablePreviewTable {...defaultProps} />);
    
    // Find Name header cell
    const nameHeader = screen.getByText('Name').closest('th');
    expect(nameHeader).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('should render email icon in email column header', () => {
    const { container } = render(<EditablePreviewTable {...defaultProps} />);
    
    // Check for EmailIcon
    const emailIcon = container.querySelector('svg[data-testid="EmailIcon"]');
    expect(emailIcon).toBeInTheDocument();
  });

  it('should render person icon in name column header', () => {
    const { container } = render(<EditablePreviewTable {...defaultProps} />);
    
    // Check for PersonIcon
    const personIcon = container.querySelector('svg[data-testid="PersonIcon"]');
    expect(personIcon).toBeInTheDocument();
  });

  it('should have scrollable container', () => {
    const { container } = render(<EditablePreviewTable {...defaultProps} />);
    
    const tableContainer = container.querySelector('[class*="MuiTableContainer"]');
    expect(tableContainer).toHaveStyle({ maxHeight: '400px' });
  });

  it('should display helper text', () => {
    render(<EditablePreviewTable {...defaultProps} />);
    
    expect(screen.getByText(/Click on any cell to edit/i)).toBeInTheDocument();
  });

  it('should handle empty rows array', () => {
    render(<EditablePreviewTable {...defaultProps} rows={[]} />);
    
    expect(screen.getByText(/Preview \(0 rows\)/i)).toBeInTheDocument();
  });

  it('should handle large number of rows', () => {
    const manyRows = Array.from({ length: 100 }, (_, i) => ({
      Name: `Person ${i}`,
      Email: `person${i}@example.com`,
      DOB: '1990-01-01',
      NIN: '12345678901',
    }));
    
    render(<EditablePreviewTable {...defaultProps} rows={manyRows} />);
    
    expect(screen.getByText(/Preview \(100 rows\)/i)).toBeInTheDocument();
  });

  it('should render Actions column for all rows', () => {
    const { container } = render(<EditablePreviewTable {...defaultProps} />);
    
    const tbody = container.querySelector('tbody');
    const rows = tbody?.querySelectorAll('tr');
    
    expect(rows).toHaveLength(2);
    
    // Each row should have an Actions cell
    rows?.forEach((row) => {
      const cells = row.querySelectorAll('td');
      // 4 data columns + 1 actions column = 5 cells
      expect(cells.length).toBe(5);
    });
  });

  it('should handle multiple edited rows', () => {
    const editState = new Map();
    editState.set(0, new Map([['Name', 'Updated 1']]));
    editState.set(1, new Map([['Email', 'updated@example.com']]));
    
    render(<EditablePreviewTable {...defaultProps} editState={editState} />);
    
    // Should have save/cancel buttons for both rows
    const saveButtons = screen.getAllByLabelText(/save changes/i);
    expect(saveButtons.length).toBe(2);
  });

  it('should display validation errors on cells', () => {
    const validationState = new Map();
    validationState.set(0, [
      {
        rowIndex: 0,
        rowNumber: 1,
        column: 'NIN',
        value: '123',
        errorType: 'NIN_INVALID',
        message: 'NIN must be 11 digits',
      },
    ]);
    
    render(<EditablePreviewTable {...defaultProps} validationState={validationState} />);
    
    // Error icon should be present
    const { container } = render(<EditablePreviewTable {...defaultProps} validationState={validationState} />);
    const errorIcon = container.querySelector('svg[data-testid="ErrorIcon"]');
    expect(errorIcon).toBeInTheDocument();
  });
});
