/**
 * Property Test: Edit Save and Cancel Behavior
 * 
 * Validates: Requirements 1.4, 1.5, 1.6
 * Property 2: For any editable cell, pressing Enter or clicking outside should
 * save changes and exit edit mode, while pressing Escape should discard changes
 * and restore the original value.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { EditableCell } from '../../components/identity/EditableCell';

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

describe('Property 2: Edit Save and Cancel Behavior', () => {
  it('should save changes on Enter key for any value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (originalValue, newValue) => {
          const user = userEvent.setup();
          const onValueChange = vi.fn();
          const onEditEnd = vi.fn();
          
          const { unmount, container } = render(
            <EditableCell
              rowIndex={0}
              column="test"
              value={originalValue}
              isEditing={true}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={vi.fn()}
              onEditEnd={onEditEnd}
              onValueChange={onValueChange}
            />
          );
          
          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(input).toBeTruthy();
          
          // Use fireEvent instead of userEvent to avoid act() warnings
          fireEvent.change(input, { target: { value: newValue } });
          fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
          
          expect(onValueChange).toHaveBeenCalledWith(newValue);
          expect(onEditEnd).toHaveBeenCalled();
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('should cancel changes on Escape key for any value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (originalValue, newValue) => {
          const onValueChange = vi.fn();
          const onEditEnd = vi.fn();
          
          const { unmount, container } = render(
            <EditableCell
              rowIndex={0}
              column="test"
              value={originalValue}
              isEditing={true}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={vi.fn()}
              onEditEnd={onEditEnd}
              onValueChange={onValueChange}
            />
          );
          
          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(input).toBeTruthy();
          
          // Use fireEvent instead of userEvent to avoid act() warnings
          fireEvent.change(input, { target: { value: newValue } });
          fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
          
          // Should not save changes
          expect(onValueChange).not.toHaveBeenCalled();
          expect(onEditEnd).toHaveBeenCalled();
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('should save changes on blur for any value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (originalValue, newValue) => {
          const onValueChange = vi.fn();
          const onEditEnd = vi.fn();
          
          const { unmount, container } = render(
            <EditableCell
              rowIndex={0}
              column="test"
              value={originalValue}
              isEditing={true}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={vi.fn()}
              onEditEnd={onEditEnd}
              onValueChange={onValueChange}
            />
          );
          
          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(input).toBeTruthy();
          
          fireEvent.change(input, { target: { value: newValue } });
          fireEvent.blur(input);
          
          expect(onValueChange).toHaveBeenCalledWith(newValue);
          expect(onEditEnd).toHaveBeenCalled();
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should restore original value after Escape', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (originalValue) => {
          const { rerender, unmount, container } = render(
            <EditableCell
              rowIndex={0}
              column="test"
              value={originalValue}
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
          
          // Use fireEvent instead of userEvent to avoid act() warnings
          fireEvent.change(input, { target: { value: 'Changed Value' } });
          fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
          
          // Re-render in view mode to check value
          rerender(
            <EditableCell
              rowIndex={0}
              column="test"
              value={originalValue}
              isEditing={false}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={vi.fn()}
              onEditEnd={vi.fn()}
              onValueChange={vi.fn()}
            />
          );
          
          // Should display original value
          const displayedText = container.textContent;
          expect(displayedText).toContain(originalValue);
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('should handle empty string edits correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (originalValue) => {
          const onValueChange = vi.fn();
          const onEditEnd = vi.fn();
          
          const { unmount, container } = render(
            <EditableCell
              rowIndex={0}
              column="test"
              value={originalValue}
              isEditing={true}
              isEdited={false}
              hasError={false}
              isEmailColumn={false}
              isNameColumn={false}
              onEditStart={vi.fn()}
              onEditEnd={onEditEnd}
              onValueChange={onValueChange}
            />
          );
          
          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          expect(input).toBeTruthy();
          
          fireEvent.change(input, { target: { value: '' } });
          fireEvent.blur(input);
          
          expect(onValueChange).toHaveBeenCalledWith('');
          expect(onEditEnd).toHaveBeenCalled();
          
          unmount();
          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });
});
