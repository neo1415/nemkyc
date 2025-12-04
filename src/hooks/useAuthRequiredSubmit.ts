import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE_URL = 'https://nem-server-rhdb.onrender.com';

interface PendingSubmission {
  formData: any;
  formType: string;
  submitFunction: (data: any) => Promise<void>;
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

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, data: any, method: string = 'POST') => {
  const csrfToken = await getCSRFToken();
  const timestamp = Date.now().toString();
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
      'x-idempotency-key': idempotencyKey,
      'x-request-id': idempotencyKey,
    },
    credentials: 'include',
    body: JSON.stringify({ ...data, idempotencyKey }),
  });
};

export const useAuthRequiredSubmit = (currentStep?: number) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldProcessSubmission, setShouldProcessSubmission] = useState(false);

  // Check for pending submission on mount and process it
  useEffect(() => {
    const checkAndProcessPendingSubmission = async () => {
      const pendingData = sessionStorage.getItem('pendingSubmission');
      
      if (pendingData && user) {
        const { formData, formType, timestamp } = JSON.parse(pendingData);
        
        // Check if submission is not expired (30 minutes)
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          console.log('🎯 Processing pending submission on form page');
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

            // Clear pending submission after successful submit
            sessionStorage.removeItem('pendingSubmission');
            setIsSubmitting(false);
            setShowSuccess(true);
            toast.success('Form submitted successfully!');
          } catch (error) {
            console.error('Error processing pending submission:', error);
            sessionStorage.removeItem('pendingSubmission');
            setIsSubmitting(false);
            toast.error('Failed to submit form. Please try again.');
          }
        } else {
          // Expired submission
          sessionStorage.removeItem('pendingSubmission');
        }
      }
    };

    checkAndProcessPendingSubmission();
  }, [user]);

  const handleSubmitWithAuth = async (
    formData: any,
    formType: string,
    submitFunction?: (data: any) => Promise<void>
  ) => {
    if (!user) {
      // Store pending submission with current step
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formData,
        formType,
        timestamp: Date.now(),
        currentStep: currentStep || 0
      }));
      
      navigate('/auth/signin');
      return;
    }

    try {
      setIsSubmitting(true);
      
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
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  const proceedToSignup = () => {
    setShowAuthDialog(false);
    navigate('/auth/signup');
  };

  const dismissAuthDialog = () => {
    setShowAuthDialog(false);
    setPendingSubmission(null);
  };

  const closeSuccessModal = () => {
    setShowSuccess(false);
    setIsSubmitting(false);
  };

  // Get the saved step from pending submission
  const getSavedStep = () => {
    const pendingData = sessionStorage.getItem('pendingSubmission');
    if (pendingData) {
      const { currentStep } = JSON.parse(pendingData);
      return currentStep || 0;
    }
    return 0;
  };

  return {
    handleSubmitWithAuth,
    showAuthDialog,
    showSuccess,
    setShowSuccess: closeSuccessModal,
    isSubmitting,
    proceedToSignup,
    dismissAuthDialog,
    formType: pendingSubmission?.formType || '',
    getSavedStep
  };
};

// Utility function to check if there's a pending submission (for redirect logic)
export const hasPendingSubmission = () => {
  return sessionStorage.getItem('pendingSubmission') !== null;
};

// Utility function to get form page URL from form type
export const getFormPageUrl = (formType: string) => {
  const formTypeLower = formType.toLowerCase();
  
  // KYC Forms
  if (formTypeLower.includes('individual kyc')) {
    return '/kyc/individual';
  }
  if (formTypeLower.includes('corporate kyc')) {
    return '/kyc/corporate';
  }
  
  // CDD Forms - IMPORTANT: Check NAICOM forms FIRST before generic forms
  if (formTypeLower.includes('naicom corporate')) {
    return '/cdd/naicom-corporate';
  }
  if (formTypeLower.includes('naicom partners')) {
    return '/cdd/naicom-partners';
  }
  if (formTypeLower.includes('individual cdd')) {
    return '/cdd/individual';
  }
  if (formTypeLower.includes('corporate cdd')) {
    return '/cdd/corporate';
  }
  if (formTypeLower.includes('brokers cdd')) {
    return '/cdd/brokers';
  }
  if (formTypeLower.includes('agents cdd')) {
    return '/cdd/agents';
  }
  if (formTypeLower.includes('partners cdd')) {
    return '/cdd/partners';
  }
  
  // Claims Forms
  if (formTypeLower.includes('employers liability') && !formTypeLower.includes('combined')) {
    return '/claims/employers-liability';
  }
  if (formTypeLower.includes('combined') && formTypeLower.includes('gpa')) {
    return '/claims/combined-gpa-employers-liability';
  }
  if (formTypeLower.includes('public liability')) {
    return '/claims/public-liability';
  }
  if (formTypeLower.includes('professional indemnity')) {
    return '/claims/professional-indemnity';
  }
  if (formTypeLower.includes('motor')) {
    return '/claims/motor';
  }
  if (formTypeLower.includes('fire')) {
    return '/claims/fire-special-perils';
  }
  if (formTypeLower.includes('burglary')) {
    return '/claims/burglary';
  }
  if (formTypeLower.includes('all risk') || formTypeLower.includes('allrisk')) {
    return '/claims/all-risk';
  }
  if (formTypeLower.includes('goods')) {
    return '/claims/goods-in-transit';
  }
  if (formTypeLower.includes('money')) {
    return '/claims/money-insurance';
  }
  if (formTypeLower.includes('fidelity')) {
    return '/claims/fidelity-guarantee';
  }
  if (formTypeLower.includes('contractors')) {
    return '/claims/contractors-plant-machinery';
  }
  if (formTypeLower.includes('group') && formTypeLower.includes('personal')) {
    return '/claims/group-personal-accident';
  }
  if (formTypeLower.includes('rent')) {
    return '/claims/rent-assurance';
  }
  
  // Default fallback
  return '/dashboard';
};
