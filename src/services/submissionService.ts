// Update the frontend submission service to use backend
import { toast } from 'sonner';
import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';

interface SubmissionData {
  [key: string]: any;
}

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CSRF_TOKEN}`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
};

// Helper function to make authenticated requests with fresh timestamp
const makeAuthenticatedRequest = async (url: string, data: any, method: string = 'POST') => {
  // Get fresh CSRF token and timestamp for each request to prevent "Request too old" error
  const csrfToken = await getCSRFToken();
  const timestamp = Date.now().toString();
  
  console.log(`📤 Making request to ${url} with timestamp: ${timestamp}`);
  
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

// Main submission function - now calls backend
export const submitFormWithNotifications = async (
  formData: SubmissionData,
  formType: string,
  userEmail: string,
  userUid?: string
) => {
  try {
    console.log('📤 Submitting form to backend:', { formType, userEmail, userUid });
    
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}${API_ENDPOINTS.SUBMIT_FORM}`, {
      formData,
      formType,
      userEmail,
      userUid
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Form submission failed');
    }

    const result = await response.json();
    console.log('✅ Form submitted successfully:', result);
    
    toast.success('Form submitted successfully!');
    return result;

  } catch (error) {
    console.error('Error submitting form:', error);
    toast.error('Failed to submit form. Please try again.');
    throw error;
  }
};
