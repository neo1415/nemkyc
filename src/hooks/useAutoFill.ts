/**
 * useAutoFill Hook
 * 
 * Custom React hook for managing auto-fill state and functionality.
 * Provides a simple interface for integrating auto-fill into forms.
 * 
 * Features:
 * - Manages auto-fill state (status, error, autoFilledFields)
 * - Exposes attachToField function for form integration
 * - Exposes clearAutoFill function for cleanup
 * - Handles component unmount cleanup
 * 
 * Requirements: 10.3, 12.5
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AutoFillEngine, AutoFillEngineConfig } from '../services/autoFill/AutoFillEngine';
import { InputTriggerHandler, InputTriggerConfig } from '../services/autoFill/InputTriggerHandler';
import { IdentifierType } from '../types/autoFill';

/**
 * Auto-fill state
 */
export interface AutoFillState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: { code: string; message: string } | null;
  autoFilledFields: string[];
  populatedFieldCount: number;
  cached?: boolean;
}

/**
 * Hook configuration
 */
export interface UseAutoFillConfig {
  formElement: HTMLFormElement | null;
  identifierType: IdentifierType;
  userId?: string;
  formId?: string;
  userName?: string;
  userEmail?: string;
  reactHookFormSetValue?: (name: string, value: any) => void;
}

/**
 * Hook return value
 */
export interface UseAutoFillReturn {
  state: AutoFillState;
  attachToField: (inputElement: HTMLInputElement) => void;
  clearAutoFill: () => void;
  executeAutoFillNIN: (nin: string) => Promise<void>;
  executeAutoFillCAC: (rcNumber: string, companyName: string) => Promise<void>;
}

/**
 * useAutoFill Hook
 * 
 * Manages auto-fill state and provides functions for form integration
 */
export function useAutoFill(config: UseAutoFillConfig): UseAutoFillReturn {
  const { formElement, identifierType, userId, formId, userName, userEmail, reactHookFormSetValue } = config;

  // State
  const [state, setState] = useState<AutoFillState>({
    status: 'idle',
    error: null,
    autoFilledFields: [],
    populatedFieldCount: 0
  });

  // Refs to persist instances across renders
  const engineRef = useRef<AutoFillEngine | null>(null);
  const triggerHandlerRef = useRef<InputTriggerHandler | null>(null);

  // Initialize engine when form element is available
  useEffect(() => {
    if (!formElement) {
      return;
    }

    // Create engine
    const engine = new AutoFillEngine({
      formElement,
      userId,
      formId,
      userName,
      userEmail,
      reactHookFormSetValue,
      onSuccess: (populatedFieldCount: number) => {
        setState(prev => ({
          ...prev,
          status: 'success',
          populatedFieldCount,
          error: null
        }));
      },
      onError: (error: { code: string; message: string }) => {
        setState(prev => ({
          ...prev,
          status: 'error',
          error,
          populatedFieldCount: 0
        }));
      },
      onComplete: () => {
        // Optional: Additional cleanup or logging
      }
    });

    engineRef.current = engine;

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
      }
    };
  }, [formElement, userId, formId, userName, userEmail, reactHookFormSetValue]);

  /**
   * Attach auto-fill trigger to an input field
   */
  const attachToField = useCallback((inputElement: HTMLInputElement) => {
    if (!inputElement) {
      console.warn('[useAutoFill] Cannot attach to null input element');
      return;
    }

    // Detach previous handler if exists
    if (triggerHandlerRef.current) {
      triggerHandlerRef.current.detachFromField();
    }

    // Create new trigger handler
    const handler = new InputTriggerHandler({
      identifierType,
      userId,
      formId,
      onVerificationStart: () => {
        setState(prev => ({
          ...prev,
          status: 'loading',
          error: null
        }));
      },
      onVerificationComplete: async (success: boolean, data?: any) => {
        if (success && data && engineRef.current) {
          // Execute auto-fill with the verified data
          if (identifierType === IdentifierType.NIN) {
            const nin = inputElement.value.trim();
            const result = await engineRef.current.executeAutoFillNIN(nin);
            
            setState(prev => ({
              ...prev,
              status: result.success ? 'success' : 'error',
              error: result.error || null,
              autoFilledFields: result.populatedFields,
              populatedFieldCount: result.populatedFieldCount,
              cached: result.cached
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: { code: 'VERIFICATION_FAILED', message: 'Verification failed' }
          }));
        }
      },
      onVerificationError: (error: { code: string; message: string }) => {
        setState(prev => ({
          ...prev,
          status: 'error',
          error
        }));
      }
    });

    handler.attachToField(inputElement);
    triggerHandlerRef.current = handler;
  }, [identifierType, userId, formId]);

  /**
   * Execute NIN auto-fill manually
   */
  const executeAutoFillNIN = useCallback(async (nin: string) => {
    if (!engineRef.current) {
      console.warn('[useAutoFill] Engine not initialized');
      return;
    }

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    const result = await engineRef.current.executeAutoFillNIN(nin);

    setState(prev => ({
      ...prev,
      status: result.success ? 'success' : 'error',
      error: result.error || null,
      autoFilledFields: result.populatedFields,
      populatedFieldCount: result.populatedFieldCount,
      cached: result.cached
    }));
  }, []);

  /**
   * Execute CAC auto-fill manually
   */
  const executeAutoFillCAC = useCallback(async (rcNumber: string, companyName: string) => {
    if (!engineRef.current) {
      console.warn('[useAutoFill] Engine not initialized');
      return;
    }

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    const result = await engineRef.current.executeAutoFillCAC(rcNumber, companyName);

    setState(prev => ({
      ...prev,
      status: result.success ? 'success' : 'error',
      error: result.error || null,
      autoFilledFields: result.populatedFields,
      populatedFieldCount: result.populatedFieldCount,
      cached: result.cached
    }));
  }, []);

  /**
   * Clear auto-fill state and cleanup
   */
  const clearAutoFill = useCallback(() => {
    // Detach trigger handler
    if (triggerHandlerRef.current) {
      triggerHandlerRef.current.detachFromField();
      triggerHandlerRef.current = null;
    }

    // Reset state
    setState({
      status: 'idle',
      error: null,
      autoFilledFields: [],
      populatedFieldCount: 0
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (triggerHandlerRef.current) {
        triggerHandlerRef.current.detachFromField();
      }
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, []);

  return {
    state,
    attachToField,
    clearAutoFill,
    executeAutoFillNIN,
    executeAutoFillCAC
  };
}
