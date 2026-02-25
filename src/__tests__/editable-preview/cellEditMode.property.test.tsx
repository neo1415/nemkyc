/**
 * Property Test: Cell Edit Mode Behavior
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 * Property 1: For any cell in the preview table, clicking the cell should enter
 * edit mode with an input field displaying the current value, and typing should
 * update the value in real-time.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { EditableCell } from '../../components/identity/EditableCell';

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

describe('Property 1: Cell Edit Mode Behavior', () => {
  it('should enter edit mode for any cell value', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.double(),
          fc.emailAddress(),
          fc.date().map((d) => d.toISOString().split('T')[0]),
          fc.constant(null),
          fc.constant('')
        ),
        (value) => {
          const onEditStart = vi.fn();
          
          const { container, unmount } = render(
            <EditableCell
              rowIndex={0}
              column="test"
              value={value}
              isEditing={false}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={onEditStart}
              onEditEnd={vi.fn()}
              onValueChange={vi.fn()}
            />
          );
          
          const cell = container.querySelector('td');
          expect(cell).toBeInTheDocument();
          
          fireEvent.click(cell!);
          
          expect(onEditStart).toHaveBeenCalledTimes(1);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display input field with current value in edit mode', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (value) => {
          const { unmount, container } = render(
            <EditableCell
              rowIndex={0}
              column="test"
              value={value}
              isEditing={true}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={vi.fn()}
              onEditEnd={vi.fn()}
              onValueChange={vi.fn()}
            />
          );
          
          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(input).toBeTruthy();
          expect(input.value).toBe(value);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update value in real-time when typing', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (initialValue, newValue) => {
          const { unmount, container } = render(
            <EditableCell
              rowIndex={0}
              column="test"
              value={initialValue}
              isEditing={true}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={vi.fn()}
              onEditEnd={vi.fn()}
              onValueChange={vi.fn()}
            />
          );
          
          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          
          // Type new value
          fireEvent.change(input, { target: { value: newValue } });
          
          // Input should reflect new value
          expect(input.value).toBe(newValue);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle any column name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string(),
        (columnName, value) => {
          const onEditStart = vi.fn();
          
          const { container, unmount } = render(
            <EditableCell
              rowIndex={0}
              column={columnName}
              value={value}
              isEditing={false}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={onEditStart}
              onEditEnd={vi.fn()}
              onValueChange={vi.fn()}
            />
          );
          
          const cell = container.querySelector('td');
          fireEvent.click(cell!);
          
          expect(onEditStart).toHaveBeenCalled();
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle any row index', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.string(),
        (rowIndex, value) => {
          const onEditStart = vi.fn();
          
          const { container, unmount } = render(
            <EditableCell
              rowIndex={rowIndex}
              column="test"
              value={value}
              isEditing={false}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={onEditStart}
              onEditEnd={vi.fn()}
              onValueChange={vi.fn()}
            />
          );
          
          const cell = container.querySelector('td');
          fireEvent.click(cell!);
          
          expect(onEditStart).toHaveBeenCalled();
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
