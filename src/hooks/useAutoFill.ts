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
import { useAuth } from '../contexts/AuthContext';

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
  requireAuth?: boolean; // New: Whether to require authentication for auto-fill
  fieldPrefix?: string; // Optional prefix for nested fields (e.g., "directors.0.")
}

/**
 * Hook return value
 */
export interface UseAutoFillReturn {
  state: AutoFillState;
  attachToField: (inputElement: HTMLInputElement) => void;
  clearAutoFill: () => void;
  executeAutoFillNIN: (nin: string) => Promise<void>;
  executeAutoFillCAC: (rcNumber: string) => Promise<void>;
}

/**
 * useAutoFill Hook
 * 
 * Manages auto-fill state and provides functions for form integration
 */
export function useAutoFill(config: UseAutoFillConfig): UseAutoFillReturn {
  const { formElement, identifierType, userId, formId, userName, userEmail, reactHookFormSetValue, requireAuth = true, fieldPrefix } = config;
  
  // Get authentication status
  const { user } = useAuth();
  const isAuthenticated = user !== null && user !== undefined;

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
    // Don't initialize if formElement is null
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
      fieldPrefix, // Pass the field prefix to the engine
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
  }, [formElement, userId, formId, userName, userEmail, reactHookFormSetValue, fieldPrefix]);

  /**
   * Attach auto-fill trigger to an input field
   */
  const attachToField = useCallback((inputElement: HTMLInputElement) => {
    console.log('[useAutoFill] ===== ATTACH TO FIELD CALLBACK START =====');
    console.log('[useAutoFill] Input element:', inputElement);
    console.log('[useAutoFill] Input element ID:', inputElement?.id);
    console.log('[useAutoFill] Identifier type:', identifierType);
    console.log('[useAutoFill] Require auth:', requireAuth);
    console.log('[useAutoFill] Is authenticated:', isAuthenticated);
    console.log('[useAutoFill] Form element:', formElement);
    
    if (!inputElement) {
      console.warn('[useAutoFill] ❌ Cannot attach to null input element');
      return;
    }

    // Don't attach if form element is not available
    if (!formElement) {
      console.warn('[useAutoFill] ❌ Form element not available, skipping attachment');
      return;
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      console.log('[useAutoFill] ⚠️ Authentication required but user is not authenticated. Skipping auto-fill attachment.');
      // Don't attach trigger handler for anonymous users
      return;
    }

    // Detach previous handler if exists
    if (triggerHandlerRef.current) {
      console.log('[useAutoFill] Detaching previous handler...');
      triggerHandlerRef.current.detachFromField();
    }

    console.log('[useAutoFill] Creating new InputTriggerHandler...');
    // Create new trigger handler
    const handler = new InputTriggerHandler({
      identifierType,
      userId,
      formId,
      onVerificationStart: () => {
        console.log('[useAutoFill] onVerificationStart callback fired');
        setState(prev => ({
          ...prev,
          status: 'loading',
          error: null
        }));
      },
      onVerificationComplete: async (success: boolean, data?: any) => {
        console.log('[useAutoFill] onVerificationComplete callback fired, success:', success);
        console.log('[useAutoFill] Identifier type:', identifierType);
        console.log('[useAutoFill] Data received:', data);
        
        if (success && data && engineRef.current) {
          // Execute auto-fill with the verified data
          if (identifierType === IdentifierType.NIN) {
            console.log('[useAutoFill] Executing NIN auto-fill...');
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
          } else if (identifierType === IdentifierType.CAC) {
            console.log('[useAutoFill] Executing CAC auto-fill...');
            const rcNumber = inputElement.value.trim();
            const result = await engineRef.current.executeAutoFillCAC(rcNumber);
            
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

    console.log('[useAutoFill] Calling handler.attachToField...');
    handler.attachToField(inputElement);
    triggerHandlerRef.current = handler;
    console.log('[useAutoFill] ✅ Handler attached and stored in ref');
    console.log('[useAutoFill] ===== ATTACH TO FIELD CALLBACK END =====');
  }, [identifierType, userId, formId, requireAuth, isAuthenticated, formElement]);

  /**
   * Execute NIN auto-fill manually
   */
  const executeAutoFillNIN = useCallback(async (nin: string) => {
    if (!engineRef.current) {
      console.warn('[useAutoFill] Engine not initialized');
      return;
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      console.warn('[useAutoFill] Authentication required for auto-fill');
      setState(prev => ({
        ...prev,
        status: 'error',
        error: { code: 'AUTH_REQUIRED', message: 'Please sign in to use auto-fill' }
      }));
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
  }, [requireAuth, isAuthenticated]);

  /**
   * Execute CAC auto-fill manually
   * Note: The VerifyData API only needs the RC number - it returns company name and other details
   */
  const executeAutoFillCAC = useCallback(async (rcNumber: string) => {
    if (!engineRef.current) {
      console.warn('[useAutoFill] Engine not initialized');
      return;
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      console.warn('[useAutoFill] Authentication required for auto-fill');
      setState(prev => ({
        ...prev,
        status: 'error',
        error: { code: 'AUTH_REQUIRED', message: 'Please sign in to use auto-fill' }
      }));
      return;
    }

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    const result = await engineRef.current.executeAutoFillCAC(rcNumber);

    setState(prev => ({
      ...prev,
      status: result.success ? 'success' : 'error',
      error: result.error || null,
      autoFilledFields: result.populatedFields,
      populatedFieldCount: result.populatedFieldCount,
      cached: result.cached
    }));
  }, [requireAuth, isAuthenticated]);

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
