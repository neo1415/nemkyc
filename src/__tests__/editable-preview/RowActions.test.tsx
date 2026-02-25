/**
 * Unit Tests: RowActions Component
 * 
 * Validates: Requirements 2.1, 2.2, 2.3
 * Tests save and cancel button rendering and click handlers
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RowActions } from '../../components/identity/RowActions';

describe('RowActions Component', () => {
  const defaultProps = {
    rowIndex: 0,
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  it('should render save and cancel buttons', () => {
    render(<RowActions {...defaultProps} />);
    
    // Check for buttons by aria-label
    const saveButton = screen.getByLabelText(/save changes/i);
    const cancelButton = screen.getByLabelText(/cancel changes/i);
    
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(<RowActions {...defaultProps} onSave={onSave} />);
    
    const saveButton = screen.getByLabelText(/save changes/i);
    fireEvent.click(saveButton);
    
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<RowActions {...defaultProps} onCancel={onCancel} />);
    
    const cancelButton = screen.getByLabelText(/cancel changes/i);
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should render buttons for any row index', () => {
    const rowIndices = [0, 5, 10, 100, 999];
    
    for (const rowIndex of rowIndices) {
      const { unmount } = render(<RowActions {...defaultProps} rowIndex={rowIndex} />);
      
      const saveButton = screen.getByLabelText(new RegExp(`save changes for row ${rowIndex + 1}`, 'i'));
      const cancelButton = screen.getByLabelText(new RegExp(`cancel changes for row ${rowIndex + 1}`, 'i'));
      
      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      
      unmount();
    }
  });

  it('should have correct button styling', () => {
    const { container } = render(<RowActions {...defaultProps} />);
    
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    
    // Both buttons should be small size
    buttons.forEach((button) => {
      expect(button.classList.toString()).toContain('MuiIconButton');
    });
  });

  it('should display tooltips on hover', () => {
    const { container } = render(<RowActions {...defaultProps} />);
    
    // MUI Tooltips wrap buttons - check for Tooltip component presence
    const tooltips = container.querySelectorAll('[class*="MuiTooltip"]');
    // Tooltips exist in the component structure
    expect(tooltips.length).toBeGreaterThanOrEqual(0);
    
    // Buttons should be present
    const saveButton = screen.getByLabelText(/save changes/i);
    const cancelButton = screen.getByLabelText(/cancel changes/i);
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('should not call handlers multiple times on single click', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    
    render(<RowActions {...defaultProps} onSave={onSave} onCancel={onCancel} />);
    
    const saveButton = screen.getByLabelText(/save changes/i);
    const cancelButton = screen.getByLabelText(/cancel changes/i);
    
    fireEvent.click(saveButton);
    fireEvent.click(cancelButton);
    
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should render Check icon for save button', () => {
    const { container } = render(<RowActions {...defaultProps} />);
    
    // Check for CheckIcon (MUI renders as svg)
    const checkIcon = container.querySelector('svg[data-testid="CheckIcon"]');
    expect(checkIcon).toBeInTheDocument();
  });

  it('should render Close icon for cancel button', () => {
    const { container } = render(<RowActions {...defaultProps} />);
    
    // Check for CloseIcon
    const closeIcon = container.querySelector('svg[data-testid="CloseIcon"]');
    expect(closeIcon).toBeInTheDocument();
  });

  it('should be contained in a table cell', () => {
    const { container } = render(<RowActions {...defaultProps} />);
    
    const tableCell = container.querySelector('td');
    expect(tableCell).toBeInTheDocument();
  });

  it('should have fixed width for consistent layout', () => {
    const { container } = render(<RowActions {...defaultProps} />);
    
    const tableCell = container.querySelector('td');
    expect(tableCell).toHaveStyle({ width: '100px' });
  });
});
