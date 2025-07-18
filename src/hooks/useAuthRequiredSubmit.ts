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

  const handleSubmitWithAuth = async (
    formData: any,
    formType: string,
    submitFunction: (data: any) => Promise<void>
  ) => {
    if (!user) {
      // Store pending submission and show auth dialog
      setPendingSubmission({ formData, formType, submitFunction });
      setShowAuthDialog(true);
      return;
    }

    // User is authenticated, proceed with submission
    await submitFunction(formData);
  };

  const proceedToSignup = () => {
    if (pendingSubmission) {
      // Store pending submission in sessionStorage to persist across navigation
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formData: pendingSubmission.formData,
        formType: pendingSubmission.formType,
        timestamp: Date.now()
      }));
    }
    setShowAuthDialog(false);
    navigate('/auth/signup');
  };

  const dismissAuthDialog = () => {
    setShowAuthDialog(false);
    setPendingSubmission(null);
  };

  // Function to be called after successful authentication
  const processPendingSubmission = async () => {
    const stored = sessionStorage.getItem('pendingSubmission');
    if (stored && user) {
      const { formData, formType, timestamp } = JSON.parse(stored);
      
      // Check if submission is not too old (30 minutes)
      if (Date.now() - timestamp < 30 * 60 * 1000) {
        sessionStorage.removeItem('pendingSubmission');
        
        // Import the submission service dynamically
        const { submitFormWithNotifications } = await import('../services/submissionService');
        await submitFormWithNotifications(formData, formType, user.email);
      } else {
        sessionStorage.removeItem('pendingSubmission');
      }
    }
  };

  return {
    handleSubmitWithAuth,
    showAuthDialog,
    proceedToSignup,
    dismissAuthDialog,
    processPendingSubmission,
    formType: pendingSubmission?.formType || ''
  };
};