import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PendingSubmission {
  formData: any;
  formType: string;
  submitFunction: (data: any) => Promise<void>;
}

export const useAuthRequiredSubmit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitWithAuth = async (
    formData: any,
    formType: string,
    submitFunction?: (data: any) => Promise<void>
  ) => {
    if (!user) {
      // Store pending submission and redirect to sign-in page first 
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formData,
        formType,
        timestamp: Date.now()
      }));
      
      // Redirect to sign-in page (they can signup from there if needed)
      navigate('/auth/signin');
      return;
    }

    // User is authenticated, proceed with direct submission using submission service
    try {
      setIsSubmitting(true);
      const { submitFormWithNotifications } = await import('../services/submissionService');
      await submitFormWithNotifications(formData, formType, user.email || '');
      setIsSubmitting(false);
      setShowSuccess(true);
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  const proceedToSignup = () => {
    // This function is no longer needed since we redirect directly
    setShowAuthDialog(false);
    navigate('/auth/signup');
  };

  const dismissAuthDialog = () => {
    setShowAuthDialog(false);
    setPendingSubmission(null);
  };

  return {
    handleSubmitWithAuth,
    showAuthDialog,
    showSuccess,
    setShowSuccess,
    isSubmitting,
    proceedToSignup,
    dismissAuthDialog,
    formType: pendingSubmission?.formType || ''
  };
};

// Utility function that can be called outside of React components
export const processPendingSubmissionUtil = async (userEmail: string) => {
  const stored = sessionStorage.getItem('pendingSubmission');
  if (stored && userEmail) {
    const { formData, formType, timestamp } = JSON.parse(stored);
    
    // Check if submission is not too old (30 minutes)
    if (Date.now() - timestamp < 30 * 60 * 1000) {
      sessionStorage.removeItem('pendingSubmission');
      
      // Import the submission service dynamically
      const { submitFormWithNotifications } = await import('../services/submissionService');
      await submitFormWithNotifications(formData, formType, userEmail);
      return true;
    } else {
      sessionStorage.removeItem('pendingSubmission');
    }
  }
  return false;
};