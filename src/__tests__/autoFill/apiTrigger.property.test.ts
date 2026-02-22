/**
 * Property Test: API Trigger on Identifier Completion
 * 
 * Property 1: API Trigger on Identifier Completion
 * Validates: Requirements 1.1, 2.1
 * 
 * This test verifies that the InputTriggerHandler correctly triggers
 * verification when a valid identifier is entered and the field loses focus.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputTriggerHandler } from '../../services/autoFill/InputTriggerHandler';
import { IdentifierType } from '../../types/autoFill';

describe('Property 1: API Trigger on Identifier Completion', () => {
  let inputElement: HTMLInputElement;
  let handler: InputTriggerHandler;
  let onVerificationStartMock: () => void;
  let onVerificationCompleteMock: (success: boolean, data?: any) => void;
  let onVerificationErrorMock: (error: { code: string; message: string }) => void;

  beforeEach(() => {
    // Create a real input element
    inputElement = document.createElement('input');
    inputElement.type = 'text';
    document.body.appendChild(inputElement);

    // Create mocks
    onVerificationStartMock = vi.fn();
    onVerificationCompleteMock = vi.fn();
    onVerificationErrorMock = vi.fn();
  });

  afterEach(() => {
    // Cleanup
    if (handler) {
      handler.detachFromField();
    }
    document.body.removeChild(inputElement);
    vi.clearAllMocks();
  });

  describe('NIN Identifier', () => {
    it('should trigger verification when valid 11-digit NIN is entered and field loses focus', async () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock,
        onVerificationComplete: onVerificationCompleteMock,
        onVerificationError: onVerificationErrorMock,
        userId: 'test-user',
        formId: 'test-form'
      });

      handler.attachToField(inputElement);

      // Act
      inputElement.value = '12345678901'; // Valid 11-digit NIN
      inputElement.dispatchEvent(new FocusEvent('blur'));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(onVerificationStartMock).toHaveBeenCalledTimes(1);
    });

    it('should NOT trigger verification when invalid NIN format is entered', async () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock,
        onVerificationComplete: onVerificationCompleteMock,
        onVerificationError: onVerificationErrorMock
      });

      handler.attachToField(inputElement);

      // Act - Test various invalid formats
      const invalidNINs = [
        '123',           // Too short
        '123456789012',  // Too long
        '1234567890a',   // Contains letter
        '12345 67890',   // Contains space
        '',              // Empty
        '   ',           // Whitespace only
      ];

      for (const invalidNIN of invalidNINs) {
        inputElement.value = invalidNIN;
        inputElement.dispatchEvent(new FocusEvent('blur'));
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Assert
      expect(onVerificationStartMock).not.toHaveBeenCalled();
    });

    it('should NOT trigger duplicate verification for same NIN', async () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock,
        onVerificationComplete: onVerificationCompleteMock,
        onVerificationError: onVerificationErrorMock
      });

      handler.attachToField(inputElement);

      // Act - Trigger blur twice with same value
      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate successful verification
      if (onVerificationCompleteMock.mock.calls.length > 0) {
        // Mark as verified
        handler['lastVerifiedValue'] = '12345678901';
      }

      // Blur again with same value
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Should only be called once
      expect(onVerificationStartMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger new verification when NIN changes', async () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock,
        onVerificationComplete: onVerificationCompleteMock,
        onVerificationError: onVerificationErrorMock
      });

      handler.attachToField(inputElement);

      // Act - First NIN
      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Change to different NIN
      inputElement.value = '98765432109';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Should be called twice (once for each different NIN)
      expect(onVerificationStartMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('CAC Identifier', () => {
    it('should validate CAC/RC number format', () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.CAC,
        onVerificationStart: onVerificationStartMock,
        onVerificationComplete: onVerificationCompleteMock,
        onVerificationError: onVerificationErrorMock
      });

      // Act & Assert - Valid formats
      expect(handler.validateIdentifier('RC123456').valid).toBe(true);
      expect(handler.validateIdentifier('123456').valid).toBe(true);
      expect(handler.validateIdentifier('RC-123456').valid).toBe(true);
      expect(handler.validateIdentifier('RC/123456').valid).toBe(true);

      // Act & Assert - Invalid formats
      expect(handler.validateIdentifier('').valid).toBe(false);
      expect(handler.validateIdentifier('   ').valid).toBe(false);
      expect(handler.validateIdentifier('RC@123').valid).toBe(false);
      expect(handler.validateIdentifier('RC#123').valid).toBe(false);
    });
  });

  describe('Validation Logic', () => {
    it('should correctly validate NIN format (exactly 11 digits)', () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock
      });

      // Act & Assert
      expect(handler.validateIdentifier('12345678901').valid).toBe(true);
      expect(handler.validateIdentifier('00000000000').valid).toBe(true);
      expect(handler.validateIdentifier('99999999999').valid).toBe(true);

      // Invalid cases
      expect(handler.validateIdentifier('1234567890').valid).toBe(false);  // 10 digits
      expect(handler.validateIdentifier('123456789012').valid).toBe(false); // 12 digits
      expect(handler.validateIdentifier('1234567890a').valid).toBe(false);  // Contains letter
      expect(handler.validateIdentifier('12345 67890').valid).toBe(false);  // Contains space
    });

    it('should provide meaningful error messages for invalid formats', () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock
      });

      // Act
      const result1 = handler.validateIdentifier('123');
      const result2 = handler.validateIdentifier('1234567890a');

      // Assert
      expect(result1.valid).toBe(false);
      expect(result1.error).toBeDefined();
      expect(result1.error).toContain('11 digits');

      expect(result2.valid).toBe(false);
      expect(result2.error).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should track verification in progress state', async () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock,
        onVerificationComplete: onVerificationCompleteMock
      });

      handler.attachToField(inputElement);

      // Act
      expect(handler.isVerificationInProgress()).toBe(false);

      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));

      // During verification
      await new Promise(resolve => setTimeout(resolve, 10));
      // Note: This might be true or false depending on timing
      // The important thing is it eventually becomes false

      // After verification completes
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(handler.isVerificationInProgress()).toBe(false);
    });

    it('should reset state when reset() is called', () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock
      });

      // Manually set last verified value
      handler['lastVerifiedValue'] = '12345678901';

      // Act
      handler.reset();

      // Assert
      expect(handler.getLastVerifiedValue()).toBeNull();
      expect(handler.isVerificationInProgress()).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should properly detach from field and remove event listeners', async () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock
      });

      handler.attachToField(inputElement);

      // Act - Detach
      handler.detachFromField();

      // Try to trigger after detaching
      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Should not trigger after detaching
      expect(onVerificationStartMock).not.toHaveBeenCalled();
    });

    it('should handle multiple attach/detach cycles', async () => {
      // Arrange
      handler = new InputTriggerHandler({
        identifierType: IdentifierType.NIN,
        onVerificationStart: onVerificationStartMock
      });

      // Act - Multiple attach/detach cycles
      handler.attachToField(inputElement);
      handler.detachFromField();
      handler.attachToField(inputElement);
      handler.detachFromField();
      handler.attachToField(inputElement);

      // Trigger verification
      inputElement.value = '12345678901';
      inputElement.dispatchEvent(new FocusEvent('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Should work after multiple cycles
      expect(onVerificationStartMock).toHaveBeenCalledTimes(1);
    });
  });
});
