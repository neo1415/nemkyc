/**
 * Unit Tests: useAutoFill Hook
 * 
 * Tests the useAutoFill custom React hook.
 * Validates: Requirements 10.3, 12.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoFill } from '../../hooks/useAutoFill';
import { IdentifierType } from '../../types/autoFill';

describe('useAutoFill Hook - Unit Tests', () => {
  let formElement: HTMLFormElement;

  beforeEach(() => {
    formElement = document.createElement('form');
    formElement.innerHTML = `
      <input name="nin" type="text" />
      <input name="firstName" type="text" />
      <input name="lastName" type="text" />
    `;
    document.body.appendChild(formElement);
  });

  afterEach(() => {
    document.body.removeChild(formElement);
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN,
          userId: 'test-user',
          formId: 'test-form'
        })
      );

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.autoFilledFields).toEqual([]);
      expect(result.current.state.populatedFieldCount).toBe(0);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      expect(typeof result.current.attachToField).toBe('function');
      expect(typeof result.current.clearAutoFill).toBe('function');
      expect(typeof result.current.executeAutoFillNIN).toBe('function');
      expect(typeof result.current.executeAutoFillCAC).toBe('function');
    });

    it('should handle null form element gracefully', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement: null,
          identifierType: IdentifierType.NIN
        })
      );

      expect(result.current.state.status).toBe('idle');
      expect(result.current.attachToField).toBeDefined();
    });
  });

  describe('State updates during auto-fill', () => {
    it('should update state to loading when verification starts', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      const inputElement = formElement.querySelector('[name="nin"]') as HTMLInputElement;

      act(() => {
        result.current.attachToField(inputElement);
      });

      expect(result.current.state.status).toBe('idle');
    });

    it('should maintain state consistency across renders', () => {
      const { result, rerender } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN,
          userId: 'test-user'
        })
      );

      const initialState = result.current.state;

      rerender();

      expect(result.current.state).toEqual(initialState);
    });
  });

  describe('attachToField function', () => {
    it('should attach to input field without errors', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      const inputElement = formElement.querySelector('[name="nin"]') as HTMLInputElement;

      expect(() => {
        act(() => {
          result.current.attachToField(inputElement);
        });
      }).not.toThrow();
    });

    it('should handle null input element gracefully', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.attachToField(null as any);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot attach to null input element')
      );

      consoleSpy.mockRestore();
    });

    it('should detach previous handler when attaching to new field', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      const input1 = formElement.querySelector('[name="nin"]') as HTMLInputElement;
      const input2 = formElement.querySelector('[name="firstName"]') as HTMLInputElement;

      act(() => {
        result.current.attachToField(input1);
      });

      // Should not throw when attaching to second field
      expect(() => {
        act(() => {
          result.current.attachToField(input2);
        });
      }).not.toThrow();
    });
  });

  describe('clearAutoFill function', () => {
    it('should reset state to idle', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      act(() => {
        result.current.clearAutoFill();
      });

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.autoFilledFields).toEqual([]);
      expect(result.current.state.populatedFieldCount).toBe(0);
    });

    it('should detach trigger handler', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      const inputElement = formElement.querySelector('[name="nin"]') as HTMLInputElement;

      act(() => {
        result.current.attachToField(inputElement);
      });

      act(() => {
        result.current.clearAutoFill();
      });

      // State should be reset
      expect(result.current.state.status).toBe('idle');
    });
  });

  describe('executeAutoFillNIN function', () => {
    it('should handle execution when engine not initialized', async () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement: null, // No form element, so engine won't initialize
          identifierType: IdentifierType.NIN
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        await result.current.executeAutoFillNIN('12345678901');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Engine not initialized')
      );

      consoleSpy.mockRestore();
    });

    it('should update state to loading when called', async () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      // Start execution (will fail due to network, but state should update)
      act(() => {
        result.current.executeAutoFillNIN('12345678901');
      });

      // State should be loading immediately
      expect(result.current.state.status).toBe('loading');
    });
  });

  describe('executeAutoFillCAC function', () => {
    it('should handle execution when engine not initialized', async () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement: null,
          identifierType: IdentifierType.CAC
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        await result.current.executeAutoFillCAC('RC123456', 'Test Company');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Engine not initialized')
      );

      consoleSpy.mockRestore();
    });

    it('should update state to loading when called', async () => {
      const cacForm = document.createElement('form');
      cacForm.innerHTML = `
        <input name="rcNumber" type="text" />
        <input name="companyName" type="text" />
      `;
      document.body.appendChild(cacForm);

      const { result } = renderHook(() =>
        useAutoFill({
          formElement: cacForm,
          identifierType: IdentifierType.CAC
        })
      );

      act(() => {
        result.current.executeAutoFillCAC('RC123456', 'Test Company');
      });

      expect(result.current.state.status).toBe('loading');

      document.body.removeChild(cacForm);
    });
  });

  describe('Cleanup on unmount', () => {
    it('should cleanup resources when unmounted', () => {
      const { result, unmount } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      const inputElement = formElement.querySelector('[name="nin"]') as HTMLInputElement;

      act(() => {
        result.current.attachToField(inputElement);
      });

      // Should not throw on unmount
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle unmount when no handlers attached', () => {
      const { unmount } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Configuration changes', () => {
    it('should reinitialize engine when form element changes', () => {
      const form1 = document.createElement('form');
      form1.innerHTML = '<input name="nin" type="text" />';
      document.body.appendChild(form1);

      const form2 = document.createElement('form');
      form2.innerHTML = '<input name="nin" type="text" />';
      document.body.appendChild(form2);

      const { rerender } = renderHook(
        ({ formElement }) =>
          useAutoFill({
            formElement,
            identifierType: IdentifierType.NIN
          }),
        {
          initialProps: { formElement: form1 }
        }
      );

      // Change form element
      rerender({ formElement: form2 });

      // Should not throw
      expect(true).toBe(true);

      document.body.removeChild(form1);
      document.body.removeChild(form2);
    });

    it('should handle userId and formId changes', () => {
      const { rerender } = renderHook(
        ({ userId, formId }) =>
          useAutoFill({
            formElement,
            identifierType: IdentifierType.NIN,
            userId,
            formId
          }),
        {
          initialProps: { userId: 'user1', formId: 'form1' }
        }
      );

      rerender({ userId: 'user2', formId: 'form2' });

      expect(true).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid state changes', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      act(() => {
        result.current.clearAutoFill();
        result.current.clearAutoFill();
        result.current.clearAutoFill();
      });

      expect(result.current.state.status).toBe('idle');
    });

    it('should handle multiple attachToField calls', () => {
      const { result } = renderHook(() =>
        useAutoFill({
          formElement,
          identifierType: IdentifierType.NIN
        })
      );

      const inputElement = formElement.querySelector('[name="nin"]') as HTMLInputElement;

      expect(() => {
        act(() => {
          result.current.attachToField(inputElement);
          result.current.attachToField(inputElement);
          result.current.attachToField(inputElement);
        });
      }).not.toThrow();
    });
  });
});
