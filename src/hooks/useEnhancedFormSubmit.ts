import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface UseEnhancedFormSubmitOptions {
  formType: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  customValidation?: (data: any) => Promise<boolean>;
  verificationData?: {
    identityNumber?: string;
    identityType?: 'NIN' | 'CAC';
    isVerified?: boolean;
  };
}

interface UseEnhancedFormSubmitReturn {
  // State
  isValidating: boolean;
  isSubmitting: boolean;
  showSummary: boolean;
  showSuccess: boolean;
  showLoading: boolean;
  loadingMessage: string;
  
  // Actions
  handleSubmit: (data: any) => Promise<void>;
  setShowSummary: (show: boolean) => void;
  confirmSubmit: () => Promise<void>;
  closeSuccess: () => void;
  
  // Data
  formData: any;
}

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  const attempts = 3;
  let lastError: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
      if (!response.ok) throw new Error(`CSRF fetch failed: ${response.status}`);
      const data = await response.json();
      if (!data?.csrfToken) throw new Error('Missing CSRF token');
      return data.csrfToken;
    } catch (err) {
      lastError = err;
      await new Promise(res => setTimeout(res, 500 * Math.pow(2, i)));
    }
  }
  throw lastError || new Error('Unable to fetch CSRF token');
};

// Helper function to generate nonce
const generateNonce = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, data: any, method: string = 'POST') => {
  const csrfToken = await getCSRFToken();
  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  const idempotencyKey =
    data?.idempotencyKey ||
    sessionStorage.getItem('pendingSubmissionKey') ||
    `idemp_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken,
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-idempotency-key': idempotencyKey,
      'x-request-id': idempotencyKey,
    },
    credentials: 'include',
    body: JSON.stringify({ ...data, idempotencyKey }),
  });
};

// Helper function to verify identity number (NIN or CAC)
const verifyIdentity = async (identityNumber: string, identityType: 'NIN' | 'CAC', user: any) => {
  const endpoint = identityType === 'NIN' 
    ? `${API_BASE_URL}/api/autofill/verify-nin`
    : `${API_BASE_URL}/api/autofill/verify-cac`;
  
  const payload = identityType === 'NIN'
    ? { nin: identityNumber, userId: user.uid, userName: user.displayName, userEmail: user.email }
    : { rc_number: identityNumber, userId: user.uid, userName: user.displayName, userEmail: user.email };

  const response = await makeAuthenticatedRequest(endpoint, payload);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `${identityType} verification failed`);
  }
  
  return await response.json();
};

/**
 * Enhanced form submission hook with consistent UX
 * 
 * Features:
 * - Immediate loading feedback
 * - Validation state management
 * - Authentication flow handling
 * - Post-auth submission processing
 * - Comprehensive error handling
 * 
 * Usage:
 * ```tsx
 * const {
 *   handleSubmit,
 *   showSummary,
 *   setShowSummary,
 *   showLoading,
 *   loadingMessage,
 *   showSuccess,
 *   confirmSubmit,
 *   formData
 * } = useEnhancedFormSubmit({
 *   formType: 'Individual KYC',
 *   onSuccess: () => clearDraft()
 * });
 * ```
 */
export const useEnhancedFormSubmit = (
  options: UseEnhancedFormSubmitOptions
): UseEnhancedFormSubmitReturn => {
  const { formType, onSuccess, onError, customValidation, verificationData } = options;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Computed state
  const showLoading = isValidating || isSubmitting;
  
  // Ref to track if we've already processed a pending submission
  const hasProcessedPending = useRef(false);

  // Check for pending submission on mount and process it
  useEffect(() => {
    const checkAndProcessPendingSubmission = async () => {
      // Prevent duplicate processing using ref
      if (hasProcessedPending.current) {
        console.log('⏭️  Skipping duplicate pending submission check');
        return;
      }
      
      const pendingData = sessionStorage.getItem('pendingSubmission');
      
      if (pendingData && user) {
        // Add a small delay to ensure session cookie is set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { formData: savedFormData, formType: savedFormType, timestamp } = JSON.parse(pendingData);
        
        // Only process if it's for this form type and not expired (30 minutes)
        if (savedFormType === formType && Date.now() - timestamp < 30 * 60 * 1000) {
          // Mark as processed to prevent duplicates
          hasProcessedPending.current = true;
          
          console.log('🎯 Processing pending submission for', formType);
          
          // Check if we need to verify identity for this form
          const needsVerification = 
            (formType === 'Individual KYC' || formType === 'Corporate KYC') &&
            verificationData?.identityNumber &&
            !verificationData?.isVerified;

          if (needsVerification) {
            setLoadingMessage('Verifying identity...');
            setIsSubmitting(true);

            try {
              // Verify the identity number
              const verificationResult = await verifyIdentity(
                verificationData!.identityNumber!,
                verificationData!.identityType!,
                user
              );

              if (!verificationResult.status) {
                throw new Error(verificationResult.message || 'Identity verification failed');
              }

              // Verification succeeded, add verification data to formData
              const enrichedFormData = {
                ...savedFormData,
                verificationData: verificationResult.data,
                verified: true
              };

              // Now proceed with form submission
              setLoadingMessage('Processing your submission...');
              const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/submit-form`, {
                formData: enrichedFormData,
                formType: savedFormType,
                userEmail: user.email,
                userUid: user.uid
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Form submission failed');
              }

              // Clear pending submission after successful submit
              sessionStorage.removeItem('pendingSubmission');
              sessionStorage.removeItem('pendingSubmissionKey');
              setIsSubmitting(false);
              setShowSuccess(true);
              toast.success('Form submitted successfully!');
              onSuccess?.();
            } catch (error: any) {
              console.error('Error processing pending submission:', error);
              sessionStorage.removeItem('pendingSubmission');
              sessionStorage.removeItem('pendingSubmissionKey');
              setIsSubmitting(false);
              toast.error(error.message || 'Failed to verify identity or submit form. Please try again.');
              onError?.(error);
            }
          } else {
            // No verification needed, proceed directly
            setLoadingMessage('Processing your submission...');
            setIsSubmitting(true);
            
            try {
              const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/submit-form`, {
                formData: savedFormData,
                formType: savedFormType,
                userEmail: user.email,
                userUid: user.uid
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Form submission failed');
              }

              // Clear pending submission after successful submit
              sessionStorage.removeItem('pendingSubmission');
              sessionStorage.removeItem('pendingSubmissionKey');
              setIsSubmitting(false);
              setShowSuccess(true);
              toast.success('Form submitted successfully!');
              onSuccess?.();
            } catch (error: any) {
              console.error('Error processing pending submission:', error);
              sessionStorage.removeItem('pendingSubmission');
              sessionStorage.removeItem('pendingSubmissionKey');
              setIsSubmitting(false);
              toast.error(error.message || 'Failed to submit form. Please try again.');
              onError?.(error);
            }
          }
        } else if (savedFormType === formType) {
          // Expired submission for this form
          sessionStorage.removeItem('pendingSubmission');
          sessionStorage.removeItem('pendingSubmissionKey');
        }
      }
    };

    checkAndProcessPendingSubmission();
  }, [user, formType, onSuccess, onError, verificationData]);

  /**
   * Handle initial submit - shows loading immediately, then validates
   */
  const handleSubmit = async (data: any) => {
    console.log('useEnhancedFormSubmit handleSubmit called with data:', data);
    
    // Show loading immediately
    setLoadingMessage('Validating your submission...');
    setIsValidating(true);
    setFormData(data);

    try {
      // Custom validation if provided
      if (customValidation) {
        console.log('Running custom validation...');
        const isValid = await customValidation(data);
        if (!isValid) {
          console.log('Custom validation failed');
          setIsValidating(false);
          return;
        }
      }

      // Validation passed, show summary
      console.log('Validation passed, showing summary dialog');
      setIsValidating(false);
      setShowSummary(true);
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setIsValidating(false);
      toast.error(error.message || 'Validation failed');
      onError?.(error);
    }
  };

  /**
   * Confirm submission from summary dialog
   */
  const confirmSubmit = async () => {
    if (!formData) return;

    // Check authentication FIRST (preserve existing flow)
    if (!user) {
      // Store pending submission
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formData,
        formType,
        timestamp: Date.now()
      }));
      
      setShowSummary(false);
      navigate('/auth/signin');
      return;
    }

    // User is authenticated, now check if we need to verify identity
    // Only verify for KYC forms that have identity numbers
    const needsVerification = 
      (formType === 'Individual KYC' || formType === 'Corporate KYC') &&
      verificationData?.identityNumber &&
      !verificationData?.isVerified;

    if (needsVerification) {
      setShowSummary(false);
      setLoadingMessage('Verifying identity...');
      setIsSubmitting(true);

      try {
        // Verify the identity number
        const verificationResult = await verifyIdentity(
          verificationData!.identityNumber!,
          verificationData!.identityType!,
          user
        );

        if (!verificationResult.status) {
          throw new Error(verificationResult.message || 'Identity verification failed');
        }

        // Verification succeeded, add verification data to formData
        const enrichedFormData = {
          ...formData,
          verificationData: verificationResult.data,
          verified: true
        };

        // Now proceed with form submission
        setLoadingMessage('Submitting your form...');
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/submit-form`, {
          formData: enrichedFormData,
          formType,
          userEmail: user.email,
          userUid: user.uid
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Form submission failed');
        }

        setIsSubmitting(false);
        setShowSuccess(true);
        toast.success('Form submitted successfully!');
        onSuccess?.();
      } catch (error: any) {
        setIsSubmitting(false);
        toast.error(error.message || 'Failed to verify identity or submit form. Please try again.');
        onError?.(error);
      }
    } else {
      // No verification needed, proceed directly with submission
      setShowSummary(false);
      setLoadingMessage('Submitting your form...');
      setIsSubmitting(true);

      try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/submit-form`, {
          formData,
          formType,
          userEmail: user.email,
          userUid: user.uid
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Form submission failed');
        }

        setIsSubmitting(false);
        setShowSuccess(true);
        toast.success('Form submitted successfully!');
        onSuccess?.();
      } catch (error: any) {
        setIsSubmitting(false);
        toast.error(error.message || 'Failed to submit form. Please try again.');
        onError?.(error);
      }
    }
  };

  /**
   * Close success modal
   */
  const closeSuccess = () => {
    setShowSuccess(false);
    setFormData(null);
  };

  return {
    // State
    isValidating,
    isSubmitting,
    showSummary,
    showSuccess,
    showLoading,
    loadingMessage,
    
    // Actions
    handleSubmit,
    setShowSummary,
    confirmSubmit,
    closeSuccess,
    
    // Data
    formData
  };
};
