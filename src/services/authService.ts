// Authentication service - moved from direct Firebase to backend API calls
import { toast } from 'sonner';

const API_BASE_URL = 'https://nem-server-rhdb.onrender.com';

export interface AuthResponse {
  success: boolean;
  customToken?: string;
  role?: string;
  requireMFA?: boolean;
  requireMFAEnrollment?: boolean;
  message?: string;
  loginCount?: number;
  user?: {
    uid: string;
    email: string;
    displayName: string;
  };
  error?: string;
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

// Token exchange with backend - frontend handles Firebase auth, backend verifies and logs
export const exchangeToken = async (idToken: string): Promise<AuthResponse> => {
  try {
    console.log('📤 Exchanging token with backend');
    
    // For token exchange, we don't need CSRF token since user isn't authenticated yet
    const response = await fetch(`${API_BASE_URL}/api/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No CSRF token needed for initial authentication
      },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      let errorMessage = 'Authentication failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('❌ Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });
      } catch (parseError) {
        // If we can't parse JSON, it might be HTML (CORS error)
        const textResponse = await response.text();
        console.error('❌ Token exchange failed with non-JSON response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: textResponse.substring(0, 200) + '...'
        });
        
        if (response.status === 403 && textResponse.includes('<!DOCTYPE')) {
          errorMessage = 'CORS error - origin not allowed. Please check server configuration.';
        }
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    const result = await response.json();
    console.log('✅ Token exchange result:', result);
    
    // Return the complete result from backend
    return result;

  } catch (error) {
    console.error('Token exchange error:', error);
    let errorMessage = 'Authentication failed';
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error - unable to connect to server. Please check your connection.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Register via backend with event logging
export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string, 
  role: string = 'user',
  dateOfBirth?: string
): Promise<AuthResponse> => {
  try {
    console.log('📤 Attempting registration via backend:', { email, displayName, role });
    
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/register`, {
      email,
      password,
      displayName,
      role,
      dateOfBirth
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Registration failed:', result.error);
      toast.error(result.error || 'Registration failed');
      return { success: false, error: result.error };
    }

    console.log('✅ Registration successful:', { email, displayName, role });
    toast.success('Registration successful!');
    
    return {
      success: true,
      user: result.user
    };

  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Export auth service
export const authService = {
  exchangeToken,
  registerUser
};
