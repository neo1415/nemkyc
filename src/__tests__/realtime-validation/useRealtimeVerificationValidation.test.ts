/**
 * Unit Tests for useRealtimeVerificationValidation Hook
 * 
 * Tests the core functionality of the real-time verification validation hook.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeVerificationValidation } from '@/hooks/useRealtimeVerificationValidation';
import { UseRealtimeVerificationValidationConfig, FieldValidationStatus } from '@/types/realtimeVerificationValidation';
import { CAC_FIELDS_CONFIG } from '@/config/realtimeValidationConfig';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'broker'
    }
  })
}));

vi.mock('./useAutoFill', () => ({
  useAutoFill: () => ({
    state: {
      status: 'idle',
      error: null,
      autoFilledFields: [],
      populatedFieldCount: 0
    },
    attachToField: vi.fn(),
    clearAutoFill: vi.fn(),
    executeAutoFillNIN: vi.fn(),
    executeAutoFillCAC: vi.fn()
  })
}));

vi.mock('@/services/VerificationCache', () => ({
  getVerificationCache: () => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    invalidate: vi.fn(),
    clear: vi.fn()
  })
}));

describe('useRealtimeVerificationValidation Hook', () => {
  let mockFormMethods: any;
  let config: UseRealtimeVerificationValidationConfig;

  beforeEach(() => {
    // Mock react-hook-form methods
    mockFormMethods = {
      getValues: vi.fn((fieldName?: string) => {
        if (fieldName) {
          return '';
        }
        return {
          insured: '',
          dateOfIncorporationRegistration: '',
          officeAddress: ''
        };
      }),
      setValue: vi.fn(),
      watch: vi.fn()
    };

    // Create test configuration
    config = {
      formType: 'Corporate KYC',
      identifierFieldName: 'cacNumber',
      identifierType: 'CAC',
      fieldsToValidate: CAC_FIELDS_CONFIG,
      formMethods: mockFormMethods,
      isAuthenticated: true
    };
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      expect(result.current.isVerificationTriggered).toBe(false);
      expect(result.current.isVerifying).toBe(false);
      expect(result.current.canProceedToNextStep).toBe(true);
      expect(result.current.verificationError).toBe(null);
      expect(result.current.verificationData).toBe(null);
    });

    it('should initialize field validation states for all configured fields', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      // Check that all fields have initial state
      for (const fieldConfig of CAC_FIELDS_CONFIG) {
        const fieldState = result.current.fieldValidationStates[fieldConfig.fieldName];
        expect(fieldState).toBeDefined();
        expect(fieldState.status).toBe(FieldValidationStatus.NOT_VERIFIED);
        expect(fieldState.errorMessage).toBe(null);
        expect(fieldState.showCheckmark).toBe(false);
        expect(fieldState.showError).toBe(false);
      }
    });
  });

  describe('getFieldValidationProps', () => {
    it('should return correct props for not verified field', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      const props = result.current.getFieldValidationProps('insured');

      expect(props['aria-invalid']).toBe(false);
      expect(props['aria-describedby']).toBeUndefined();
      expect(props.className).toBe('');
      expect(typeof props.onBlur).toBe('function');
    });

    it('should return correct props for mismatched field', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      // Manually set a field to mismatched state
      act(() => {
        result.current.fieldValidationStates['insured'] = {
          status: FieldValidationStatus.MISMATCHED,
          errorMessage: 'This company name doesn\'t match CAC records',
          showCheckmark: false,
          showError: true
        };
      });

      const props = result.current.getFieldValidationProps('insured');

      expect(props['aria-invalid']).toBe(true);
      expect(props['aria-describedby']).toBe('insured-validation-error');
      expect(props.className).toContain('border-red-500');
    });

    it('should return correct props for matched field', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      // Manually set a field to matched state
      act(() => {
        result.current.fieldValidationStates['insured'] = {
          status: FieldValidationStatus.MATCHED,
          errorMessage: null,
          showCheckmark: true,
          showError: false
        };
      });

      const props = result.current.getFieldValidationProps('insured');

      expect(props['aria-invalid']).toBe(false);
      expect(props['aria-describedby']).toBeUndefined();
      expect(props.className).toContain('border-green-500');
    });
  });

  describe('Navigation Blocking', () => {
    it('should allow navigation when verification not triggered', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      expect(result.current.canProceedToNextStep).toBe(true);
    });

    it('should allow navigation when verification API error occurred', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      // Simulate verification error
      act(() => {
        // This would normally be set by the useEffect watching autoFill.state
        (result.current as any).verificationError = 'Network error';
      });

      expect(result.current.canProceedToNextStep).toBe(true);
    });
  });

  describe('clearValidation', () => {
    it('should reset all validation state', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      // Set some state
      act(() => {
        result.current.fieldValidationStates['insured'] = {
          status: FieldValidationStatus.MISMATCHED,
          errorMessage: 'Error',
          showCheckmark: false,
          showError: true
        };
      });

      // Clear validation
      act(() => {
        result.current.clearValidation();
      });

      // Check that state is reset
      expect(result.current.isVerificationTriggered).toBe(false);
      expect(result.current.isVerifying).toBe(false);
      expect(result.current.verificationError).toBe(null);
      expect(result.current.verificationData).toBe(null);

      // Check that all fields are reset
      for (const fieldConfig of CAC_FIELDS_CONFIG) {
        const fieldState = result.current.fieldValidationStates[fieldConfig.fieldName];
        expect(fieldState.status).toBe(FieldValidationStatus.NOT_VERIFIED);
      }
    });
  });

  describe('Hook Return Interface', () => {
    it('should return all required properties and functions', () => {
      const { result } = renderHook(() => useRealtimeVerificationValidation(config));

      // Check state properties
      expect(result.current).toHaveProperty('fieldValidationStates');
      expect(result.current).toHaveProperty('isVerificationTriggered');
      expect(result.current).toHaveProperty('isVerifying');
      expect(result.current).toHaveProperty('canProceedToNextStep');
      expect(result.current).toHaveProperty('verificationError');
      expect(result.current).toHaveProperty('verificationData');

      // Check functions
      expect(typeof result.current.attachToIdentifierField).toBe('function');
      expect(typeof result.current.getFieldValidationProps).toBe('function');
      expect(typeof result.current.clearValidation).toBe('function');
      expect(typeof result.current.revalidateField).toBe('function');
    });
  });
});
