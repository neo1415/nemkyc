// Authentication service - moved from direct Firebase to backend API calls
import { toast } from 'sonner';
import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';

export interface AuthResponse {
  success: boolean;
  customToken?: string;
  role?: string;
  requireMFA?: boolean;
  requireMFAEnrollment?: boolean;
  requireEmailVerification?: boolean;
  message?: string;
  loginCount?: number;
  email?: string;
  user?: {
    uid: string;
    email: string;
    displayName: string;
  };
  error?: string;
}

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  try {
    console.log('🔑 Fetching CSRF token from:', `${API_BASE_URL}${API_ENDPOINTS.CSRF_TOKEN}`);
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CSRF_TOKEN}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('❌ CSRF token fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to get security token (${response.status})`);
    }
    
    const data = await response.json();
    
    if (!data.csrfToken) {
      console.error('❌ CSRF token missing from response:', data);
      throw new Error('Security token not received from server');
    }
    
    console.log('✅ CSRF token received successfully');
    return data.csrfToken;
  } catch (error) {
    console.error('❌ CSRF token error:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
    }
    
    throw error;
  }
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, data: any, method: string = 'POST', skipCSRF: boolean = false) => {
  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-timestamp': timestamp,
    'x-nonce': nonce,
  };
  
  // Only fetch CSRF token if not skipped
  if (!skipCSRF) {
    const csrfToken = await getCSRFToken();
    headers['CSRF-Token'] = csrfToken;
  }
  
  return fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });
};

// Helper function to generate nonce
const generateNonce = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Token exchange with backend - frontend handles Firebase auth, backend verifies and logs
export const exchangeToken = async (idToken: string): Promise<AuthResponse> => {
  try {
    console.log('📤 Exchanging token with backend');
    
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    
    // For token exchange, we don't need CSRF token since user isn't authenticated yet
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EXCHANGE_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
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
    
    // Store session token in localStorage for localhost cross-port authentication
    if (result.success && result.sessionToken) {
      localStorage.setItem('__session', result.sessionToken);
      console.log('🔑 Session token stored in localStorage for cross-port auth');
    }
    
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
    
    // Skip CSRF for registration - it's a public endpoint and user isn't authenticated yet
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
      email,
      password,
      displayName,
      role,
      dateOfBirth
    }, 'POST', true); // skipCSRF = true

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Registration failed:', result);
      
      // Extract user-friendly error message from backend response
      let errorMessage = 'Registration failed';
      
      if (result.details && Array.isArray(result.details) && result.details.length > 0) {
        // Format validation errors into a readable message
        // Show the first error message (most relevant)
        errorMessage = result.details[0].message;
        
        // If there are multiple errors, append count
        if (result.details.length > 1) {
          errorMessage += ` (and ${result.details.length - 1} more issue${result.details.length > 2 ? 's' : ''})`;
        }
        
        console.log('📋 Validation errors:', result.details.map((d: any) => d.message));
      } else if (result.error) {
        errorMessage = result.error;
      } else if (result.message) {
        errorMessage = result.message;
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    console.log('✅ Registration successful:', { email, displayName, role });
    toast.success('Registration successful!');
    
    return {
      success: true,
      user: result.user
    };

  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed';
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Export auth service
export const authService = {
  exchangeToken,
  registerUser
};
