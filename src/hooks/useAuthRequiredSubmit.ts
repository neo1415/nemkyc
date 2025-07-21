import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { submitFormWithNotifications } from '../services/submissionService';


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

  // Check for post-authentication success state
  useEffect(() => {
    const checkPostAuthStates = async () => {
      const submissionInProgress = sessionStorage.getItem('submissionInProgress');
      const postAuthSuccess = sessionStorage.getItem('postAuthSuccess');
      
      if (submissionInProgress) {
        // Show loading modal first
        setIsSubmitting(true);
        setShowSuccess(true);
      } else if (postAuthSuccess) {
        sessionStorage.removeItem('postAuthSuccess');
        setShowSuccess(true);
      }
    };

    checkPostAuthStates();
  }, [user]);

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

  const closeSuccessModal = () => {
    setShowSuccess(false);
    setIsSubmitting(false);
  };

  return {
    handleSubmitWithAuth,
    showAuthDialog,
    showSuccess,
    setShowSuccess: closeSuccessModal,
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
      
      try {
        // Set flag to show loading modal
        sessionStorage.setItem('submissionInProgress', 'true');
        
        // Import the submission service dynamically
        const { submitFormWithNotifications } = await import('../services/submissionService');
        await submitFormWithNotifications(formData, formType, userEmail);
        
        // Clear loading and set success flag
        sessionStorage.removeItem('submissionInProgress');
        sessionStorage.setItem('postAuthSuccess', 'true');
        return true;
      } catch (error) {
        sessionStorage.removeItem('submissionInProgress');
        console.error('Error submitting form after authentication:', error);
        throw error;
      }
    } else {
      sessionStorage.removeItem('pendingSubmission');
    }
  }
  return false;
};
