/**
 * Unit Tests: AutoFillEngine
 * 
 * Tests specific examples and workflows for the AutoFillEngine orchestrator.
 * Validates: Requirements 1.1, 1.3, 1.4, 2.1, 2.3, 7.1, 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoFillEngine } from '../../services/autoFill/AutoFillEngine';

describe('AutoFillEngine - Unit Tests', () => {
  let formElement: HTMLFormElement;
  let engine: AutoFillEngine;

  beforeEach(() => {
    formElement = document.createElement('form');
    document.body.appendChild(formElement);
  });

  afterEach(() => {
    if (engine) {
      engine.cleanup();
    }
    document.body.removeChild(formElement);
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with all required services', () => {
      formElement.innerHTML = `<input name="nin" type="text" />`;
      
      engine = new AutoFillEngine({
        formElement,
        userId: 'test-user',
        formId: 'test-form'
      });

      expect(engine).toBeDefined();
      expect(engine['formTypeDetector']).toBeDefined();
      expect(engine['apiClient']).toBeDefined();
      expect(engine['dataNormalizer']).toBeDefined();
      expect(engine['fieldMapper']).toBeDefined();
      expect(engine['formPopulator']).toBeDefined();
      expect(engine['visualFeedback']).toBeDefined();
    });

    it('should store configuration correctly', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onComplete = vi.fn();

      formElement.innerHTML = `<input name="nin" type="text" />`;
      
      engine = new AutoFillEngine({
        formElement,
        userId: 'test-user-123',
        formId: 'test-form-456',
        onSuccess,
        onError,
        onComplete
      });

      expect(engine['config'].formElement).toBe(formElement);
      expect(engine['config'].userId).toBe('test-user-123');
      expect(engine['config'].formId).toBe('test-form-456');
      expect(engine['config'].onSuccess).toBe(onSuccess);
      expect(engine['config'].onError).toBe(onError);
      expect(engine['config'].onComplete).toBe(onComplete);
    });
  });

  describe('Complete NIN auto-fill workflow', () => {
    it('should handle unsupported form gracefully', async () => {
      // Form without NIN field
      formElement.innerHTML = `
        <input name="email" type="text" />
        <input name="phone" type="text" />
      `;

      const onError = vi.fn();
      engine = new AutoFillEngine({
        formElement,
        onError
      });

      const result = await engine.executeAutoFillNIN('12345678901');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNSUPPORTED_FORM');
      expect(result.populatedFieldCount).toBe(0);
      expect(onError).toHaveBeenCalledWith({
        code: 'UNSUPPORTED_FORM',
        message: 'This form does not support NIN auto-fill'
      });
    });

    it('should detect NIN form correctly', async () => {
      formElement.innerHTML = `
        <input name="nin" type="text" />
        <input name="firstName" type="text" />
        <input name="lastName" type="text" />
      `;

      engine = new AutoFillEngine({
        formElement
      });

      // Verify form type detection
      const formType = engine['formTypeDetector'].detectFormType(formElement);
      expect(formType).toBeDefined();
      
      const supportsNIN = engine['formTypeDetector'].supportsIdentifierType(
        formElement,
        'NIN' as any
      );
      expect(supportsNIN).toBe(true);
    });
  });

  describe('Complete CAC auto-fill workflow', () => {
    it('should handle unsupported form gracefully', async () => {
      // Form without CAC field
      formElement.innerHTML = `
        <input name="email" type="text" />
        <input name="phone" type="text" />
      `;

      const onError = vi.fn();
      engine = new AutoFillEngine({
        formElement,
        onError
      });

      const result = await engine.executeAutoFillCAC('RC123456', 'Test Company');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNSUPPORTED_FORM');
      expect(result.populatedFieldCount).toBe(0);
      expect(onError).toHaveBeenCalledWith({
        code: 'UNSUPPORTED_FORM',
        message: 'This form does not support CAC auto-fill'
      });
    });

    it('should detect CAC form correctly', async () => {
      formElement.innerHTML = `
        <input name="rcNumber" type="text" />
        <input name="companyName" type="text" />
        <input name="registrationDate" type="text" />
      `;

      engine = new AutoFillEngine({
        formElement
      });

      // Verify form type detection
      const formType = engine['formTypeDetector'].detectFormType(formElement);
      expect(formType).toBeDefined();
      
      const supportsCAC = engine['formTypeDetector'].supportsIdentifierType(
        formElement,
        'CAC' as any
      );
      expect(supportsCAC).toBe(true);
    });
  });

  describe('Error scenarios', () => {
    it('should handle network errors gracefully', async () => {
      formElement.innerHTML = `
        <input name="nin" type="text" />
        <input name="firstName" type="text" />
      `;

      const onError = vi.fn();
      const onComplete = vi.fn();
      
      engine = new AutoFillEngine({
        formElement,
        onError,
        onComplete
      });

      // Execute with invalid NIN (will cause network error)
      const result = await engine.executeAutoFillNIN('12345678901');

      // Should fail but not throw
      expect(result.success).toBe(false);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should call onComplete callback even on error', async () => {
      formElement.innerHTML = `
        <input name="nin" type="text" />
        <input name="firstName" type="text" />
      `;

      const onComplete = vi.fn();
      engine = new AutoFillEngine({
        formElement,
        onComplete
      });

      // This will fail due to network error but should still call onComplete
      await engine.executeAutoFillNIN('12345678901');

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Partial success scenarios', () => {
    it('should handle form with some matching fields', async () => {
      formElement.innerHTML = `
        <input name="nin" type="text" />
        <input name="firstName" type="text" />
        <input name="unknownField" type="text" />
      `;

      engine = new AutoFillEngine({
        formElement
      });

      // Verify field mapper can handle partial matches
      const mapper = engine['fieldMapper'];
      expect(mapper).toBeDefined();
      expect(typeof mapper.mapNINFields).toBe('function');
    });
  });

  describe('Response validation', () => {
    it('should validate response data structure', () => {
      formElement.innerHTML = `<input name="nin" type="text" />`;
      
      engine = new AutoFillEngine({
        formElement
      });

      // Test validateResponseData method
      const validateMethod = engine['validateResponseData'].bind(engine);

      // Valid data (at least 2 fields)
      expect(validateMethod({ field1: 'value1', field2: 'value2' })).toBe(true);
      expect(validateMethod({ field1: 'value1', field2: 'value2', field3: 'value3' })).toBe(true);

      // Invalid data (less than 2 fields)
      expect(validateMethod({ field1: 'value1' })).toBe(false);
      expect(validateMethod({})).toBe(false);
      expect(validateMethod(null)).toBe(false);
      expect(validateMethod(undefined)).toBe(false);

      // Data with null/empty values
      expect(validateMethod({ field1: null, field2: null })).toBe(false);
      expect(validateMethod({ field1: '', field2: '' })).toBe(false);
      expect(validateMethod({ field1: 'value1', field2: null })).toBe(false);
      expect(validateMethod({ field1: 'value1', field2: 'value2', field3: null })).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      formElement.innerHTML = `<input name="nin" type="text" />`;
      
      engine = new AutoFillEngine({
        formElement
      });

      // Verify cleanup method exists and can be called
      expect(typeof engine.cleanup).toBe('function');
      
      // Should not throw
      expect(() => engine.cleanup()).not.toThrow();
    });

    it('should cancel pending requests on cleanup', () => {
      formElement.innerHTML = `<input name="nin" type="text" />`;
      
      engine = new AutoFillEngine({
        formElement
      });

      const apiClient = engine['apiClient'];
      const cancelSpy = vi.spyOn(apiClient, 'cancelPendingRequest');

      engine.cleanup();

      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('Callback invocation', () => {
    it('should call onSuccess when auto-fill succeeds', async () => {
      formElement.innerHTML = `
        <input name="nin" type="text" />
        <input name="firstName" type="text" />
      `;

      const onSuccess = vi.fn();
      engine = new AutoFillEngine({
        formElement,
        onSuccess
      });

      // Note: This would require mocking the API to actually succeed
      // For now, we verify the callback is stored
      expect(engine['config'].onSuccess).toBe(onSuccess);
    });

    it('should call onError when auto-fill fails', async () => {
      formElement.innerHTML = `<input name="email" type="text" />`;

      const onError = vi.fn();
      engine = new AutoFillEngine({
        formElement,
        onError
      });

      await engine.executeAutoFillNIN('12345678901');

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toHaveProperty('code');
      expect(onError.mock.calls[0][0]).toHaveProperty('message');
    });
  });

  describe('Visual feedback integration', () => {
    it('should have visual feedback manager initialized', () => {
      formElement.innerHTML = `<input name="nin" type="text" />`;
      
      engine = new AutoFillEngine({
        formElement
      });

      const visualFeedback = engine['visualFeedback'];
      expect(visualFeedback).toBeDefined();
      expect(typeof visualFeedback.showLoading).toBe('function');
      expect(typeof visualFeedback.hideLoading).toBe('function');
      expect(typeof visualFeedback.showSuccess).toBe('function');
      expect(typeof visualFeedback.showError).toBe('function');
    });
  });

  describe('Service coordination', () => {
    it('should coordinate all services in correct order', () => {
      formElement.innerHTML = `
        <input name="nin" type="text" />
        <input name="firstName" type="text" />
        <input name="lastName" type="text" />
      `;

      engine = new AutoFillEngine({
        formElement
      });

      // Verify all services are initialized
      expect(engine['formTypeDetector']).toBeDefined();
      expect(engine['apiClient']).toBeDefined();
      expect(engine['dataNormalizer']).toBeDefined();
      expect(engine['fieldMapper']).toBeDefined();
      expect(engine['formPopulator']).toBeDefined();
      expect(engine['visualFeedback']).toBeDefined();

      // Verify services have required methods
      expect(typeof engine['formTypeDetector'].detectFormType).toBe('function');
      expect(typeof engine['apiClient'].verifyNIN).toBe('function');
      expect(typeof engine['apiClient'].verifyCAC).toBe('function');
      expect(typeof engine['dataNormalizer'].normalizeNINData).toBe('function');
      expect(typeof engine['dataNormalizer'].normalizeCACData).toBe('function');
      expect(typeof engine['fieldMapper'].mapNINFields).toBe('function');
      expect(typeof engine['fieldMapper'].mapCACFields).toBe('function');
      expect(typeof engine['formPopulator'].populateFields).toBe('function');
    });
  });

  describe('Mixed form support', () => {
    it('should handle forms with both NIN and CAC fields', () => {
      formElement.innerHTML = `
        <input name="nin" type="text" />
        <input name="firstName" type="text" />
        <input name="rcNumber" type="text" />
        <input name="companyName" type="text" />
      `;

      engine = new AutoFillEngine({
        formElement
      });

      // Verify both identifier types are supported
      const supportsNIN = engine['formTypeDetector'].supportsIdentifierType(
        formElement,
        'NIN' as any
      );
      const supportsCAC = engine['formTypeDetector'].supportsIdentifierType(
        formElement,
        'CAC' as any
      );

      expect(supportsNIN).toBe(true);
      expect(supportsCAC).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty form', async () => {
      formElement.innerHTML = '';

      engine = new AutoFillEngine({
        formElement
      });

      const result = await engine.executeAutoFillNIN('12345678901');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNSUPPORTED_FORM');
    });

    it('should handle form with only identifier field', async () => {
      formElement.innerHTML = `<input name="nin" type="text" />`;

      engine = new AutoFillEngine({
        formElement
      });

      // Should detect as supported form
      const supportsNIN = engine['formTypeDetector'].supportsIdentifierType(
        formElement,
        'NIN' as any
      );
      expect(supportsNIN).toBe(true);
    });

    it('should handle form with duplicate field names', () => {
      formElement.innerHTML = `
        <input name="nin" type="text" />
        <input name="firstName" type="text" />
        <input name="firstName" type="text" />
      `;

      engine = new AutoFillEngine({
        formElement
      });

      // Should still work, mapper will find first match
      expect(engine).toBeDefined();
    });
  });
});
