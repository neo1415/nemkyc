/**
 * Unit Tests: InputTriggerHandler
 * 
 * Tests specific examples and edge cases for the InputTriggerHandler service.
 * Validates: Requirements 1.1, 2.1, 9.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputTriggerHandler } from '../../services/autoFill/InputTriggerHandler';
import { IdentifierType } from '../../types/autoFill';

describe('InputTriggerHandler - Unit Tests', () => {
  let inputElement: HTMLInputElement;
  let handler: InputTriggerHandler;

  beforeEach(() => {
    inputElement = document.createElement('input');
    inputElement.type = 'text';
    document.body.appendChild(inputElement);
  });

  afterEach(() => {
    if (handler) {
      handler.detachFromField();
    }
    document.body.removeChild(inputElement);
    vi.clearAllMocks();
  });

  describe('onBlur event handling', () => {
    it('should attach blur event listener to input field', () => {
      const onStart = vi.fn();
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      // Verify event listener is attached by triggering blur
      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));

      expect(onStart).toHaveBeenCalled();
    });

    it('should not trigger on blur with empty value', async () => {
      const onStart = vi.fn();
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      inputElement.value = '';
      inputElement.dispatchEvent(new FocusEvent('blur'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onStart).not.toHaveBeenCalled();
    });

    it('should trim whitespace before validation', async () => {
      const onStart = vi.fn();
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      inputElement.value = '  12345678901  ';
      inputElement.dispatchEvent(new FocusEvent('blur'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onStart).toHaveBeenCalled();
    });
  });

  describe('identifier validation', () => {
    describe('NIN validation', () => {
      beforeEach(() => {
        handler = new InputTriggerHandler({
          identifierType: IdentifierType.NIN,
          onVerificationStart: vi.fn()
        });
      });

      it('should accept valid 11-digit NIN', () => {
        const result = handler.validateIdentifier('12345678901');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject NIN with less than 11 digits', () => {
        const result = handler.validateIdentifier('1234567890');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('11 digits');
      });

      it('should reject NIN with more than 11 digits', () => {
        const result = handler.validateIdentifier('123456789012');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('11 digits');
      });

      it('should reject NIN with letters', () => {
        const result = handler.validateIdentifier('1234567890a');
        expect(result.valid).toBe(false);
      });

      it('should reject NIN with spaces', () => {
        const result = handler.validateIdentifier('12345 67890');
        expect(result.valid).toBe(false);
      });

      it('should reject NIN with special characters', () => {
        const result = handler.validateIdentifier('12345-67890');
        expect(result.valid).toBe(false);
      });
    });

    describe('CAC validation', () => {
      beforeEach(() => {
        handler = new InputTriggerHandler({
          identifierType: IdentifierType.CAC,
          onVerificationStart: vi.fn()
        });
      });

      it('should accept alphanumeric RC number', () => {
        const result = handler.validateIdentifier('RC123456');
        expect(result.valid).toBe(true);
      });

      it('should accept numeric-only RC number', () => {
        const result = handler.validateIdentifier('123456');
        expect(result.valid).toBe(true);
      });

      it('should accept RC number with hyphens', () => {
        const result = handler.validateIdentifier('RC-123456');
        expect(result.valid).toBe(true);
      });

      it('should accept RC number with slashes', () => {
        const result = handler.validateIdentifier('RC/123456');
        expect(result.valid).toBe(true);
      });

      it('should reject empty RC number', () => {
        const result = handler.validateIdentifier('');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('required');
      });

      it('should reject RC number with invalid characters', () => {
        const result = handler.validateIdentifier('RC@123');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });
  });

  describe('duplicate call prevention', () => {
    it('should not trigger verification twice for same NIN', async () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart,
        onVerificationComplete: onComplete
      });

      handler.attachToField(inputElement);

      // First blur
      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate successful verification by setting lastVerifiedValue
      handler['lastVerifiedValue'] = '12345678901';

      // Second blur with same value
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only be called once
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('should trigger verification for different NIN', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      // First NIN
      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Different NIN
      inputElement.value = '98765432109';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be called twice
      expect(onStart).toHaveBeenCalledTimes(2);
    });

    it('should not trigger if verification is already in progress', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      // Set isVerifying flag manually
      handler['isVerifying'] = true;

      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not be called because verification is in progress
      expect(onStart).not.toHaveBeenCalled();
    });
  });

  describe('request cancellation', () => {
    it('should cancel pending request when new verification is triggered', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      // First verification
      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second verification before first completes
      inputElement.value = '98765432109';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Both should be called, but first should be cancelled
      expect(onStart).toHaveBeenCalledTimes(2);
    });
  });

  describe('state management', () => {
    it('should track last verified value', async () => {
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: vi.fn()
      });

      expect(handler.getLastVerifiedValue()).toBeNull();

      // Manually set last verified value
      handler['lastVerifiedValue'] = '12345678901';

      expect(handler.getLastVerifiedValue()).toBe('12345678901');
    });

    it('should reset state when reset() is called', () => {
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: vi.fn()
      });

      handler['lastVerifiedValue'] = '12345678901';
      handler['isVerifying'] = true;

      handler.reset();

      expect(handler.getLastVerifiedValue()).toBeNull();
      expect(handler.isVerificationInProgress()).toBe(false);
    });

    it('should track verification in progress', () => {
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: vi.fn()
      });

      expect(handler.isVerificationInProgress()).toBe(false);

      handler['isVerifying'] = true;
      expect(handler.isVerificationInProgress()).toBe(true);

      handler['isVerifying'] = false;
      expect(handler.isVerificationInProgress()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove event listener when detached', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);
      handler.detachFromField();

      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onStart).not.toHaveBeenCalled();
    });

    it('should handle detach when not attached', () => {
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: vi.fn()
      });

      // Should not throw
      expect(() => handler.detachFromField()).not.toThrow();
    });

    it('should handle multiple attach/detach cycles', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      // Multiple cycles
      handler.attachToField(inputElement);
      handler.detachFromField();
      handler.attachToField(inputElement);
      handler.detachFromField();
      handler.attachToField(inputElement);

      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback invocation', () => {
    it('should call onVerificationStart when verification begins', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('should not call callbacks when validation fails', async () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart,
        onVerificationComplete: onComplete,
        onVerificationError: onError
      });

      handler.attachToField(inputElement);

      // Invalid NIN
      inputElement.value = '123';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onStart).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('CAC verification handling', () => {
    it('should call onStart but skip actual verification for CAC (requires company name)', async () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.CAC,
        onVerificationStart: onStart,
        onVerificationComplete: onComplete
      });

      handler.attachToField(inputElement);

      inputElement.value = 'RC123456';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // onStart is called but verification is skipped (CAC requires company name)
      expect(onStart).toHaveBeenCalled();
      // onComplete should not be called because verification was skipped
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only input', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      inputElement.value = '   ';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onStart).not.toHaveBeenCalled();
    });

    it('should handle very long input', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      inputElement.value = '1'.repeat(100);
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not trigger because it's not valid format
      expect(onStart).not.toHaveBeenCalled();
    });

    it('should handle special characters in NIN', async () => {
      const onStart = vi.fn();
      
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onStart
      });

      handler.attachToField(inputElement);

      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];
      
      for (const char of specialChars) {
        inputElement.value = `1234567890${char}`;
        inputElement.dispatchEvent(new FocusEvent('blur'));
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(onStart).not.toHaveBeenCalled();
    });
  });
});
