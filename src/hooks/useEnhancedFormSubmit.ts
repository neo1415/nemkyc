import { useState, useEffect, useRef } from 'react';
import { useGuestIdentity } from '@/contexts/GuestIdentityContext';
import type { GuestIdentity } from '@/components/auth/GuestIdentityDialog';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { matchCACData, matchNINData, normalizeNINVerificationData } from '../utils/verificationMatcher';
import { getCSRFToken } from '../utils/csrfToken';
import { getGuestSessionHeaders } from '../utils/guestSession';
import {
  describeReattachFields,
  mergePendingFormData,
  readPendingFileFields,
  stripFilesFromPayload,
} from '../utils/pendingSubmission';
import type { User as FirebaseUser } from 'firebase/auth';

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

interface VerificationMismatchData {
  mismatches: string[];
  warnings: string[];
  identityType: 'NIN' | 'CAC';
}

interface UseEnhancedFormSubmitReturn {
  // State
  isValidating: boolean;
  isSubmitting: boolean;
  showSummary: boolean;
  showSuccess: boolean;
  showError: boolean;
  errorMessage: string;
  showLoading: boolean;
  loadingMessage: string;
  showVerificationMismatch: boolean;
  verificationMismatchData: VerificationMismatchData | null;
  
  // Actions
  handleSubmit: (data: any) => Promise<void>;
  setShowSummary: (show: boolean) => void;
  confirmSubmit: () => Promise<void>;
  closeSuccess: () => void;
  closeError: () => void;
  closeVerificationMismatch: () => void;
  
  // Data
  formData: any;
}

// Helper function to generate nonce
const generateNonce = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (
  url: string,
  data: any,
  method: string = 'POST',
  skipCSRF: boolean = false,
  firebaseUser?: FirebaseUser | null,
) => {
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
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-idempotency-key': idempotencyKey,
    'x-request-id': idempotencyKey,
  };

  if (!skipCSRF) {
    headers['CSRF-Token'] = await getCSRFToken();
  }

  if (firebaseUser) {
    headers.Authorization = `Bearer ${await firebaseUser.getIdToken()}`;
  } else {
    Object.assign(headers, await getGuestSessionHeaders());
  }

  return fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: JSON.stringify({ ...data, idempotencyKey }),
  });
};

const getResponseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const errorData = await response.json().catch(() => ({}));

  if (response.status === 429) {
    return errorData.message || 'Too many attempts were made. Please wait a few minutes and try again.';
  }

  if (response.status >= 500) {
    return errorData.message || 'The service is temporarily unavailable. Please wait a moment and try again.';
  }

  return errorData.message || errorData.error || fallback;
};

type IdentityMatch = { matches: boolean; mismatches: string[]; warnings: string[] };

type IdentityCheckOutcome =
  | { kind: 'matched'; match: IdentityMatch; data?: any }
  | { kind: 'mismatch'; match: IdentityMatch }
  // The check could not run (provider outage, limit, network). Never the customer's fault, so the
  // submission goes through flagged for manual review instead of being lost.
  | { kind: 'unavailable'; reason: string };

/** What the customer typed, in the shape the backend matcher expects. */
const enteredIdentityDetails = (formData: any, identityType: 'NIN' | 'CAC') =>
  identityType === 'NIN'
    ? {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      }
    : {
        companyName: formData.insured || formData.companyName,
        registrationDate: formData.dateOfIncorporationRegistration || formData.incorporationDate,
        address: formData.officeAddress || formData.registeredCompanyAddress || formData.registeredAddress || formData.companyAddress,
      };

/**
 * Checks the NIN/RC number against the registry. The backend compares it with what the customer
 * typed and, for guests, returns only the verdict; registry data never reaches the browser.
 * Throws only for problems the customer can fix (e.g. an invalid number).
 */
const checkIdentity = async (
  identityNumber: string,
  identityType: 'NIN' | 'CAC',
  formData: any,
  firebaseUser?: FirebaseUser | null,
): Promise<IdentityCheckOutcome> => {
  const endpoint = identityType === 'NIN'
    ? `${API_BASE_URL}/api/autofill/verify-nin`
    : `${API_BASE_URL}/api/autofill/verify-cac`;
  const entered = enteredIdentityDetails(formData, identityType);
  const payload = identityType === 'NIN'
    ? { nin: identityNumber, match: entered, formId: 'submission-check' }
    : { rc_number: identityNumber, match: entered, formId: 'submission-check' };

  let response: Response;
  try {
    const authHeader: Record<string, string> = firebaseUser
      ? { Authorization: `Bearer ${await firebaseUser.getIdToken()}` }
      : await getGuestSessionHeaders();
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } catch {
    return { kind: 'unavailable', reason: 'network error' };
  }

  if (response.status === 429 || response.status >= 500) {
    return { kind: 'unavailable', reason: response.status === 429 ? 'rate limited' : `service error ${response.status}` };
  }
  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, `${identityType} verification failed. Please check the number and try again.`));
  }

  const result = await response.json().catch(() => null);
  if (!result?.status) {
    return { kind: 'unavailable', reason: result?.message || 'no result' };
  }

  let match: IdentityMatch | undefined = result.match;
  if (!match && result.data) {
    // Older backend that still returns the record instead of a verdict.
    match = identityType === 'NIN'
      ? matchNINData(entered, normalizeNINVerificationData(result.data))
      : matchCACData(
          { insured: entered.companyName, dateOfIncorporationRegistration: entered.registrationDate, officeAddress: entered.address },
          result.data,
        );
  }
  if (!match) return { kind: 'unavailable', reason: 'no verdict' };
  return match.matches ? { kind: 'matched', match, data: result.data } : { kind: 'mismatch', match };
};

type PendingSubmissionState = 'ready' | 'needs-review';

type VerifiedDocumentRequirement = { field: string; label: string; required?: boolean };
const VERIFIED_DOCUMENT_REQUIREMENTS: Record<string, VerifiedDocumentRequirement[]> = {
  'Individual CDD': [{ field: 'identification', label: 'means of identification' }],
  'Agents CDD': [
    { field: 'agentId', label: 'agent identification' },
    { field: 'naicomCertificate', label: 'NAICOM certificate' },
  ],
  'Corporate CDD': [
    { field: 'cac', label: 'CAC certificate' },
    { field: 'identification', label: 'Director 1 identification' },
  ],
  'NAICOM Corporate CDD': [
    { field: 'cac', label: 'CAC certificate' },
    { field: 'identification', label: 'Director 1 identification' },
    { field: 'cacForm', label: 'NAICOM licence certificate' },
  ],
  'Partners CDD': [
    { field: 'certificateOfIncorporation', label: 'certificate of incorporation' },
    { field: 'directorId1', label: 'Director 1 identification' },
    { field: 'directorId2', label: 'Director 2 identification', required: false },
    { field: 'cacStatusReport', label: 'CAC status report' },
  ],
  'NAICOM Partners CDD': [
    { field: 'certificateOfIncorporation', label: 'certificate of incorporation' },
    { field: 'directorId1', label: 'Director 1 identification' },
    { field: 'directorId2', label: 'Director 2 identification', required: false },
    { field: 'cacStatusReport', label: 'CAC status report' },
    { field: 'naicomLicenseCertificate', label: 'NAICOM licence certificate' },
  ],
  'Brokers CDD': [
    { field: 'Incorporation', label: 'certificate of incorporation' },
    { field: 'identification', label: 'Director 1 identification' },
    { field: 'identification2', label: 'Director 2 identification', required: false },
    { field: 'NAICOMForm', label: 'NAICOM licence certificate', required: false },
  ],
};

const persistPendingSubmission = (
  formData: any,
  formType: string,
  resumeState: PendingSubmissionState = 'ready',
) => {
  // Raw File/Blob values cannot survive JSON; strip them and remember which
  // fields need to be attached again when the submission resumes.
  const { formData: serialisableFormData, pendingFileFields } = stripFilesFromPayload(formData);
  sessionStorage.setItem('pendingSubmission', JSON.stringify({
    formData: serialisableFormData,
    pendingFileFields,
    formType,
    timestamp: Date.now(),
    resumeState,
  }));
};

/** Product wording for a form's document fields, used in the re-attach prompt. */
const documentLabelsFor = (formType: string): Record<string, string> =>
  Object.fromEntries(
    (VERIFIED_DOCUMENT_REQUIREMENTS[formType] || []).map(({ field, label }) => [field, label]),
  );

const markPendingSubmissionForReview = () => {
  const raw = sessionStorage.getItem('pendingSubmission');
  if (!raw) return;

  try {
    const pending = JSON.parse(raw);
    sessionStorage.setItem('pendingSubmission', JSON.stringify({
      ...pending,
      resumeState: 'needs-review',
    }));
  } catch {
    sessionStorage.removeItem('pendingSubmission');
  }
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
  const { user, firebaseUser } = useAuth();
  const { requestGuestIdentity } = useGuestIdentity();
  const navigate = useNavigate();
  
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<any>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showVerificationMismatch, setShowVerificationMismatch] = useState(false);
  const [verificationMismatchData, setVerificationMismatchData] = useState<VerificationMismatchData | null>(null);

  // Computed state
  const showLoading = isValidating || isSubmitting;
  
  // Ref to track if we've already processed a pending submission
  const hasProcessedPending = useRef(false);
  // Ref to prevent duplicate submissions
  const isSubmittingRef = useRef(false);

  /**
   * Runs the submit-time NIN/CAC check. Returns the payload to submit, or null when the customer
   * has to correct a mismatch (the mismatch dialog is then showing).
   */
  const applyIdentityCheck = async (payload: any, identityNumber: string, identityType: 'NIN' | 'CAC') => {
    const outcome = await checkIdentity(identityNumber, identityType, payload, firebaseUser);
    if (outcome.kind === 'mismatch') {
      markPendingSubmissionForReview();
      setVerificationMismatchData({
        mismatches: outcome.match.mismatches,
        warnings: outcome.match.warnings,
        identityType,
      });
      setShowVerificationMismatch(true);
      onError?.(new Error('Verification data mismatch'));
      return null;
    }
    if (outcome.kind === 'unavailable') {
      console.warn(`${identityType} check unavailable (${outcome.reason}); submitting for manual review`);
      return {
        ...payload,
        verified: false,
        reviewRequired: true,
        reviewReasons: [...(payload.reviewReasons || []), `${identityType} check not completed (${outcome.reason})`],
      };
    }
    outcome.match.warnings.forEach((warning) => toast.warning(warning));
    return { ...payload, ...(outcome.data ? { verificationData: outcome.data } : {}), verified: true };
  };

  // Reset submission guard when summary dialog closes
  useEffect(() => {
    if (!showSummary && !isSubmitting) {
      isSubmittingRef.current = false;
    }
  }, [showSummary, isSubmitting]);

  // Check for pending submission on mount and process it
  useEffect(() => {
    const checkAndProcessPendingSubmission = async () => {
      // Prevent duplicate processing using ref
      if (hasProcessedPending.current) {
        console.log('⏭️  Skipping duplicate pending submission check');
        return;
      }
      
      const pendingData = sessionStorage.getItem('pendingSubmission');
      
      // Wait for the actual Firebase credential as well as the application profile.
      // On sign-in these two values can settle on different renders; submitting in
      // between them sends neither a reliable bearer token nor (cross-site) cookie.
      if (pendingData && user && firebaseUser) {
        const parsedPending = JSON.parse(pendingData);
        const {
          formData: savedFormData,
          formType: savedFormType,
          timestamp,
          resumeState = 'ready',
        } = parsedPending;
        const pendingFileFields = readPendingFileFields(parsedPending);

        // Only process if it's for this form type and not expired (30 minutes)
        if (savedFormType === formType && Date.now() - timestamp < 30 * 60 * 1000) {
          if (resumeState === 'needs-review') {
            setFormData(savedFormData);
            return;
          }

          // Documents attached before sign-in were lost in transit; ask for them
          // again rather than submitting the form without them.
          if (pendingFileFields.length > 0) {
            markPendingSubmissionForReview();
            setFormData(savedFormData);
            toast.error(describeReattachFields(pendingFileFields, documentLabelsFor(formType)));
            return;
          }

          // Mark as processed to prevent duplicates
          hasProcessedPending.current = true;
          
          console.log('🎯 Processing pending submission for', formType);
          
          // Get the CURRENT identity number from savedFormData (not from the stale verificationData)
          let currentIdentityNumber: string | undefined;
          let currentIdentityType: 'NIN' | 'CAC' | undefined;
          let currentIsVerified = verificationData?.isVerified || false;

          if (['Individual KYC', 'Individual NFIU', 'Individual CDD', 'Agents CDD'].includes(formType)) {
            currentIdentityNumber = savedFormData.NIN || savedFormData.NINNumber;
            currentIdentityType = 'NIN';
          } else if ([
            'Corporate KYC', 'Corporate NFIU', 'Corporate CDD', 'NAICOM Corporate CDD',
            'Partners CDD', 'NAICOM Partners CDD', 'Brokers CDD'
          ].includes(formType)) {
            currentIdentityNumber = savedFormData.cacNumber || savedFormData.incorporationNumber || savedFormData.registrationNumber;
            currentIdentityType = 'CAC';
          }

          // Check if we need to verify identity for this form
          const needsVerification = 
            currentIdentityNumber &&
            currentIdentityType &&
            !currentIsVerified;

          if (needsVerification) {
            setLoadingMessage('Verifying identity...');
            setIsSubmitting(true);

            try {
              const enrichedFormData = await applyIdentityCheck(savedFormData, currentIdentityNumber!, currentIdentityType!);
              if (!enrichedFormData) {
                setIsSubmitting(false);
                return;
              }

              // Now proceed with form submission
              setLoadingMessage('Processing your submission...');
              const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/submit-form`, {
                formData: enrichedFormData,
                formType: savedFormType,
                userEmail: user.email,
                userUid: user.uid
              }, 'POST', false, firebaseUser);

              if (!response.ok) {
                throw new Error(await getResponseErrorMessage(response, 'We could not submit your form. Please check your details and try again.'));
              }

              // Clear pending submission after successful submit
              sessionStorage.removeItem('pendingSubmission');
              sessionStorage.removeItem('pendingSubmissionKey');
              setIsSubmitting(false);
              setShowSuccess(true);
              toast.success('Form submitted successfully!');
              onSuccess?.();
            } catch (error: any) {
              console.error('❌ Error processing pending submission:', error);
              markPendingSubmissionForReview();
              setIsSubmitting(false);
              setErrorMessage(error.message || 'Failed to verify identity or submit form. Please try again.');
              setShowError(true);
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
              }, 'POST', false, firebaseUser);

              if (!response.ok) {
                throw new Error(await getResponseErrorMessage(response, 'We could not submit your form. Please check your details and try again.'));
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
              markPendingSubmissionForReview();
              setIsSubmitting(false);
              setErrorMessage(error.message || 'Failed to submit form. Please try again.');
              setShowError(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firebaseUser, formType]);

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
      const documentRequirements = VERIFIED_DOCUMENT_REQUIREMENTS[formType] || [];
      const reviewReasons: string[] = [];
      for (const requirement of documentRequirements) {
        if (requirement.required === false && !data[requirement.field]) continue;
        const verificationStatus = data[`${requirement.field}VerificationStatus`];
        const verificationResult = data[`${requirement.field}Verification`];
        if (verificationStatus === 'verified' && verificationResult?.isMatch === true) continue;
        if (verificationStatus === 'failed') {
          const reasons = (verificationResult?.mismatches || [])
            .filter((m: any) => m.isCritical)
            .map((m: any) => m.reason)
            .join('; ');
          throw new Error(
            `The ${requirement.label} does not match the details you entered${reasons ? `: ${reasons}` : ''}. Please correct the form or upload the right document.`,
          );
        }
        if (verificationStatus === 'uploading' || verificationStatus === 'processing') {
          throw new Error(`We are still checking the ${requirement.label}. Please wait a moment and try again.`);
        }
        if (!data[requirement.field]) {
          throw new Error(`Please upload the ${requirement.label} before reviewing your submission.`);
        }
        // Inconclusive, or verification never produced a result: never block the customer for our
        // failure. Flag the submission so compliance checks the document by hand.
        data[`${requirement.field}ReviewRequired`] = true;
        reviewReasons.push(`${requirement.label}: automatic check ${verificationStatus === 'inconclusive' ? 'inconclusive' : 'not completed'}`);
      }
      if (reviewReasons.length > 0) {
        data.reviewRequired = true;
        data.reviewReasons = reviewReasons;
      }

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
      setErrorMessage(error.message || 'Validation failed');
      setShowError(true);
      onError?.(error);
    }
  };

  /**
   * Confirm submission from summary dialog
   */
  const confirmSubmit = async () => {
    if (!formData) {
      console.log('⏭️  No form data available');
      return;
    }

    // Prevent duplicate submissions - check FIRST before any other logic
    if (isSubmittingRef.current) {
      console.log('⏭️  Submission already in progress, skipping duplicate');
      return;
    }

    // Mark as submitting immediately
    isSubmittingRef.current = true;

    // Forms can be completed as a guest, but the final durable submission must
    // belong to an authenticated account. Save the already-validated payload,
    // redirect to authentication, and resume automatically on this form page.
    let guestIdentity: GuestIdentity | null = null;
    if (!user) {
      // Guests are not sent to a registration page. They give a name and email; the backend creates
      // the account, binds the submission to it and emails a set-your-password link.
      const choice = await requestGuestIdentity({ formLabel: formType });
      if (!choice) {
        isSubmittingRef.current = false;
        return;
      }
      if (choice.kind === 'signed-in') {
        // AuthContext will pick up the session shortly; the resume effect submits the saved payload.
        persistPendingSubmission(formData, formType);
        isSubmittingRef.current = false;
        setShowSummary(false);
        toast.info('Signed in. Submitting your form...');
        return;
      }
      guestIdentity = choice.identity;
    } else if (!firebaseUser) {
      persistPendingSubmission(formData, formType);
      isSubmittingRef.current = false;
      setShowSummary(false);
      setErrorMessage('Your secure sign-in is still being completed. Please wait a moment and submit again.');
      setShowError(true);
      return;
    }

    /**
     * Posts the submission for either an authenticated user or a guest. When the backend reports
     * that the guest email already belongs to an account, the dialog asks for that account's
     * password; a successful sign-in defers the submission to the resume effect.
     */
    const postSubmission = async (payloadFormData: any): Promise<{ deferred: boolean }> => {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/submit-form`, {
        formData: payloadFormData,
        formType,
        userEmail: user?.email ?? guestIdentity?.email,
        userUid: user?.uid,
        ...(guestIdentity ? { guest: guestIdentity } : {}),
      }, 'POST', false, firebaseUser);
      if (response.ok) return { deferred: false };

      if (response.status === 409 && guestIdentity) {
        const body = await response.clone().json().catch(() => null);
        if (body?.code === 'ACCOUNT_EXISTS') {
          const retry = await requestGuestIdentity({
            formLabel: formType,
            accountExists: true,
            initialIdentity: guestIdentity,
          });
          if (retry?.kind === 'signed-in') {
            persistPendingSubmission(payloadFormData, formType);
            setShowSummary(false);
            toast.info('Signed in. Submitting your form...');
            return { deferred: true };
          }
          throw new Error('This email already has an account. Sign in to submit, or use a different email.');
        }
      }
      throw new Error(await getResponseErrorMessage(response, 'We could not submit your form. Please check your details and try again.'));
    };

    // Preserve uploaded document URLs from the previous attempt while allowing
    // corrected field values from this attempt to replace older values. Values
    // present in the current form always win; a null placeholder left in the
    // stored payload (a stripped File) never overwrites a re-attached document.
    let submissionFormData = formData;
    const recoverablePending = sessionStorage.getItem('pendingSubmission');
    if (recoverablePending) {
      try {
        const parsedPending = JSON.parse(recoverablePending);
        if (parsedPending.formType === formType && parsedPending.formData) {
          submissionFormData = mergePendingFormData(parsedPending.formData, formData);
        }
      } catch {
        // Malformed legacy recovery data will be replaced below.
      }
    }
    persistPendingSubmission(submissionFormData, formType);
    setFormData(submissionFormData);

    // Get the CURRENT identity number from formData (not from the stale verificationData)
    let currentIdentityNumber: string | undefined;
    let currentIdentityType: 'NIN' | 'CAC' | undefined;
    let currentIsVerified = verificationData?.isVerified || false;

    if (['Individual KYC', 'Individual NFIU', 'Individual CDD', 'Agents CDD'].includes(formType)) {
      currentIdentityNumber = submissionFormData.NIN || submissionFormData.NINNumber;
      currentIdentityType = 'NIN';
    } else if ([
      'Corporate KYC', 'Corporate NFIU', 'Corporate CDD', 'NAICOM Corporate CDD',
      'Partners CDD', 'NAICOM Partners CDD', 'Brokers CDD'
    ].includes(formType)) {
      currentIdentityNumber = submissionFormData.cacNumber || submissionFormData.incorporationNumber || submissionFormData.registrationNumber;
      currentIdentityType = 'CAC';
    }

    // Only verify for KYC/NFIU forms that have identity numbers and are not already verified
    const needsVerification = 
      currentIdentityNumber &&
      currentIdentityType &&
      !currentIsVerified;

    if (needsVerification) {
      setShowSummary(false);
      setLoadingMessage('Verifying identity...');
      setIsSubmitting(true);

      try {
        const enrichedFormData = await applyIdentityCheck(submissionFormData, currentIdentityNumber!, currentIdentityType!);
        if (!enrichedFormData) {
          setIsSubmitting(false);
          isSubmittingRef.current = false;
          return;
        }
        // Now proceed with form submission
        setLoadingMessage('Submitting your form...');
        const outcome = await postSubmission(enrichedFormData);
        if (outcome.deferred) {
          setIsSubmitting(false);
          isSubmittingRef.current = false;
          return;
        }

        setIsSubmitting(false);
        isSubmittingRef.current = false; // Reset submission guard
        sessionStorage.removeItem('pendingSubmissionKey');
        sessionStorage.removeItem('pendingSubmission');
        setShowSuccess(true);
        toast.success('Form submitted successfully!');
        onSuccess?.();
      } catch (error: any) {
        console.error('❌ Verification or submission error:', error);
        markPendingSubmissionForReview();
        setIsSubmitting(false);
        isSubmittingRef.current = false; // Reset submission guard
        setErrorMessage(error.message || 'Failed to verify identity or submit form. Please try again.');
        setShowError(true);
        onError?.(error);
      }
    } else {
      // No verification needed, proceed directly with submission
      setShowSummary(false);
      setLoadingMessage('Submitting your form...');
      setIsSubmitting(true);

      try {
        const outcome = await postSubmission(submissionFormData);
        if (outcome.deferred) {
          setIsSubmitting(false);
          isSubmittingRef.current = false;
          return;
        }

        setIsSubmitting(false);
        isSubmittingRef.current = false; // Reset submission guard
        sessionStorage.removeItem('pendingSubmissionKey');
        sessionStorage.removeItem('pendingSubmission');
        setShowSuccess(true);
        toast.success('Form submitted successfully!');
        onSuccess?.();
      } catch (error: any) {
        markPendingSubmissionForReview();
        setIsSubmitting(false);
        isSubmittingRef.current = false; // Reset submission guard
        setErrorMessage(error.message || 'Failed to submit form. Please try again.');
        setShowError(true);
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

  /**
   * Close error modal
   */
  const closeError = () => {
    setShowError(false);
    setErrorMessage('');
  };

  /**
   * Close verification mismatch modal
   */
  const closeVerificationMismatch = () => {
    setShowVerificationMismatch(false);
    setVerificationMismatchData(null);
  };

  return {
    // State
    isValidating,
    isSubmitting,
    showSummary,
    showSuccess,
    showError,
    errorMessage,
    showLoading,
    loadingMessage,
    showVerificationMismatch,
    verificationMismatchData,
    
    // Actions
    handleSubmit,
    setShowSummary,
    confirmSubmit,
    closeSuccess,
    closeError,
    closeVerificationMismatch,
    
    // Data
    formData
  };
};
