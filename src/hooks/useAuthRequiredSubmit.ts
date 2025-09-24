import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://nem-server-rhdb.onrender.com';

interface PendingSubmission {
  formData: any;
  formType: string;
  submitFunction: (data: any) => Promise<void>;
}

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/csrf-token`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, data: any, method: string = 'POST') => {
  const csrfToken = await getCSRFToken();
  const timestamp = Date.now().toString();
  
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken,
      'x-timestamp': timestamp,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
};

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
      sessionStorage.setItem('pendingSubmission', JSON.stringify({
        formData,
        formType,
        timestamp: Date.now()
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
export const processPendingSubmissionUtil = async (userEmail: string, userUid?: string) => {
  const stored = sessionStorage.getItem('pendingSubmission');
  if (stored && userEmail) {
    const { formData, formType, timestamp } = JSON.parse(stored);
    
    if (Date.now() - timestamp < 30 * 60 * 1000) {
      sessionStorage.removeItem('pendingSubmission');
      
      try {
        sessionStorage.setItem('submissionInProgress', 'true');
        
        const csrfToken = await getCSRFToken();
        const response = await fetch(`${API_BASE_URL}/api/submit-form`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken,
            'x-timestamp': Date.now().toString(),
          },
          credentials: 'include',
          body: JSON.stringify({
            formData,
            formType,
            userEmail,
            userUid
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Form submission failed');
        }

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