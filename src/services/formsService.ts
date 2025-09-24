// Backend forms service - migrated from direct Firebase to backend API calls
import { toast } from 'sonner';

const API_BASE_URL = 'https://nem-server-rhdb.onrender.com';

export interface FormSubmission {
  id: string;
  [key: string]: any;
}

export const FORM_COLLECTIONS = {
  'Individual KYC': 'individual-kyc',
  'Corporate KYC': 'corporate-kyc',
  'Individual KYC Form': 'Individual-kyc-form',
  'Corporate KYC Form': 'corporate-kyc-form',
  'Agents KYC': 'agents-kyc',
  'Brokers KYC': 'brokers-kyc',
  'NAICOM Partners CDD': 'naicom-partners-cdd',
  'User Roles': 'userroles',
  'Burglary Claims': 'burglary-claims',
  'All Risk Claims': 'all-risk-claims'
};

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/csrf-token`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, method: string = 'GET', data?: any) => {
  const csrfToken = await getCSRFToken();
  const timestamp = Date.now().toString();
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken,
      'x-timestamp': timestamp,
    },
    credentials: 'include',
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  return fetch(url, config);
};

// Get form data from backend with event logging
export const getFormData = async (collectionName: string): Promise<FormSubmission[]> => {
  try {
    console.log(`📤 Fetching forms from backend: ${collectionName}`);
    
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/forms/${collectionName}?viewerUid=current-user`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch form data');
    }

    const result = await response.json();
    console.log(`✅ Forms fetched successfully from backend: ${collectionName}`, result.data?.length);
    return result.data || [];
  } catch (error) {
    console.error(`Error fetching data from ${collectionName}:`, error);
    toast.error(`Failed to fetch ${collectionName} data`);
    return [];
  }
};

// Get all forms data from backend
export const getAllFormsData = async (): Promise<Record<string, FormSubmission[]>> => {
  const allData: Record<string, FormSubmission[]> = {};
  
  for (const [formName, collectionName] of Object.entries(FORM_COLLECTIONS)) {
    try {
      allData[formName] = await getFormData(collectionName);
    } catch (error) {
      console.error(`Error fetching ${formName}:`, error);
      allData[formName] = [];
    }
  }
  
  return allData;
};

// Update form status via backend with event logging
export const updateFormStatus = async (collectionName: string, docId: string, status: string, userEmail?: string, formType?: string) => {
  try {
    console.log(`📤 Updating form status via backend: ${collectionName}/${docId} to ${status}`);
    
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/forms/${collectionName}/${docId}/status`,
      'PUT',
      {
        status,
        updaterUid: 'current-user', // This should be actual user UID
        userEmail,
        formType,
        comment: `Status updated to ${status}`
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update form status');
    }

    console.log(`✅ Form status updated successfully via backend`);
    toast.success('Form status updated successfully');
  } catch (error) {
    console.error('Error updating form status:', error);
    toast.error('Failed to update form status');
    throw error;
  }
};
