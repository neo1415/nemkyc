import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getCSRFToken } from '../utils/csrfToken';
import { secureStorageRemove } from '../utils/secureStorage';
import type { User as FirebaseUser } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const CLAIM_DRAFT_KEYS: Record<string, string> = {
  'All Risk Claim': 'allRiskClaim',
  'Burglary Claim': 'burglaryClaimForm',
  'Combined GPA Employers Liability Claim': 'combinedGPAEmployersLiabilityClaim',
  'Contractors Plant & Machinery Claim': 'contractors-claim',
  'Employers Liability Claim': 'employersLiabilityClaim',
  'Fidelity Guarantee Claim': 'fidelityGuaranteeClaim',
  'Fire Special Perils Claim': 'fireSpecialPerilsClaim',
  'Goods In Transit Claim': 'goodsInTransitClaim',
  'Group Personal Accident Claim': 'groupPersonalAccidentClaim',
  'Money Insurance Claim': 'moneyInsuranceClaim',
  'Professional Indemnity Claim': 'professionalIndemnity',
  'Public Liability Claim': 'publicLiability',
  'Rent Assurance Claim': 'rentAssuranceClaim',
};

const savePendingSubmission = (formData: any, formType: string, currentStep = 0, resumeState = 'ready') => {
  sessionStorage.setItem('pendingSubmission', JSON.stringify({
    formData,
    formType,
    timestamp: Date.now(),
    currentStep,
    resumeState,
  }));
};

const markPendingForReview = () => {
  const raw = sessionStorage.getItem('pendingSubmission');
  if (!raw) return;
  try {
    sessionStorage.setItem('pendingSubmission', JSON.stringify({
      ...JSON.parse(raw),
      resumeState: 'needs-review',
    }));
  } catch {
    sessionStorage.removeItem('pendingSubmission');
  }
};

const clearDraftForFormType = (formType: string) => {
  const draftKey = CLAIM_DRAFT_KEYS[formType];
  if (draftKey) secureStorageRemove(`formDraft_${draftKey}`);
};

const getSubmissionError = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (response.status === 429) {
    return data.message || 'Too many submissions were attempted. Please wait a few minutes and try again.';
  }
  if (response.status >= 500) {
    return data.message || 'The submission service is temporarily unavailable. Your form has been saved; please try again shortly.';
  }
  return data.message || data.error || 'We could not submit this claim. Please review the form and try again.';
};

interface PendingSubmission {
  formData: any;
  formType: string;
  submitFunction: (data: any) => Promise<void>;
}

// Helper function to generate nonce
const generateNonce = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, data: any, method: string = 'POST', firebaseUser?: FirebaseUser | null) => {
  const csrfToken = await getCSRFToken();
  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  const idempotencyKey =
    data?.idempotencyKey ||
    sessionStorage.getItem('pendingSubmissionKey') ||
    `idemp_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

  if (!sessionStorage.getItem('pendingSubmissionKey')) {
    sessionStorage.setItem('pendingSubmissionKey', idempotencyKey);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-idempotency-key': idempotencyKey,
    'x-request-id': idempotencyKey,
  };
  if (firebaseUser) headers.Authorization = `Bearer ${await firebaseUser.getIdToken()}`;

  return fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: JSON.stringify({ ...data, idempotencyKey }),
  });
};

export const useAuthRequiredSubmit = (currentStep?: number) => {
  const { user, firebaseUser } = useAuth();
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
        const { formData, formType, timestamp, resumeState = 'ready' } = JSON.parse(pendingData);
        
        // Check if submission is not expired (30 minutes)
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          if (resumeState === 'needs-review') return;
          console.log('🎯 Processing pending submission on form page');
          setIsSubmitting(true);
          
          try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/submit-form`, {
              formData,
              formType,
              userEmail: user.email,
              userUid: user.uid
            }, 'POST', firebaseUser);

            if (!response.ok) {
              throw new Error(await getSubmissionError(response));
            }

            // Clear pending submission after successful submit
            sessionStorage.removeItem('pendingSubmission');
            sessionStorage.removeItem('pendingSubmissionKey');
            clearDraftForFormType(formType);
            setIsSubmitting(false);
            setShowSuccess(true);
            toast.success('Form submitted successfully!');
          } catch (error) {
            console.error('Error processing pending submission:', error);
            markPendingForReview();
            setIsSubmitting(false);
            toast.error(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
          }
        } else {
          // Expired submission
          sessionStorage.removeItem('pendingSubmission');
        }
      }
    };

    checkAndProcessPendingSubmission();
  }, [user, firebaseUser]);

  const handleSubmitWithAuth = async (
    formData: any,
    formType: string,
    submitFunction?: (data: any) => Promise<void>
  ): Promise<boolean> => {
    if (!user) {
      // Store pending submission with current step
      savePendingSubmission(formData, formType, typeof currentStep === 'number' ? currentStep : 0);
      
      navigate('/auth/signin');
      return false;
    }

    try {
      setIsSubmitting(true);
      savePendingSubmission(formData, formType, typeof currentStep === 'number' ? currentStep : 0);
      
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/submit-form`, {
        formData,
        formType,
        userEmail: user.email,
        userUid: user.uid
      }, 'POST', firebaseUser);

      if (!response.ok) {
        throw new Error(await getSubmissionError(response));
      }

      sessionStorage.removeItem('pendingSubmission');
      sessionStorage.removeItem('pendingSubmissionKey');
      setIsSubmitting(false);
      setShowSuccess(true);
      toast.success('Form submitted successfully!');
      return true;
    } catch (error) {
      markPendingForReview();
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
  
  // NFIU Forms
  if (formTypeLower.includes('individual nfiu')) {
    return '/nfiu/individual';
  }
  if (formTypeLower.includes('corporate nfiu')) {
    return '/nfiu/corporate';
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
  
  // Claims Forms - Smart Protection Claims (check specific types first)
  if (formTypeLower.includes('smart motorist protection')) {
    return '/claims/smart-motorist-protection';
  }
  if (formTypeLower.includes('smart students protection')) {
    return '/claims/smart-students-protection';
  }
  if (formTypeLower.includes('smart traveller protection')) {
    return '/claims/smart-traveller-protection';
  }
  if (formTypeLower.includes('smart artisan protection')) {
    return '/claims/smart-artisan-protection';
  }
  if (formTypeLower.includes('smart generation z protection')) {
    return '/claims/smart-generation-z-protection';
  }
  if (formTypeLower.includes('nem home protection')) {
    return '/claims/nem-home-protection';
  }
  
  // Other Claims Forms
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
  
  // Agricultural Claims - Batch 1
  if (formTypeLower.includes('farm property and produce insurance') || (formTypeLower.includes('farm') && (formTypeLower.includes('property') || formTypeLower.includes('produce')))) {
    return '/claims/farm-property-produce';
  }
  if (formTypeLower.includes('livestock')) {
    return '/claims/livestock';
  }
  if (formTypeLower.includes('poultry')) {
    return '/claims/poultry';
  }
  if (formTypeLower.includes('fishery and fish farm insurance') || formTypeLower.includes('fishery') || formTypeLower.includes('fish farm')) {
    return '/claims/fishery-fish-farm';
  }
  if (formTypeLower.includes('yield index insurance')) {
    return '/claims/yield-index-insurance';
  }
  if (formTypeLower.includes('multi-perils crop insurance') || formTypeLower.includes('multi perils crop insurance')) {
    return '/claims/multi-perils-crop';
  }
  
  // Default fallback
  return '/dashboard';
};
