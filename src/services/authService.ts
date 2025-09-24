// Authentication service - moved from direct Firebase to backend API calls
import { toast } from 'sonner';

const API_BASE_URL = 'https://nem-server-rhdb.onrender.com';

export interface AuthResponse {
  success: boolean;
  customToken?: string;
  role?: string;
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
    
    const response = await fetch(`${API_BASE_URL}/api/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Token exchange failed:', result.error);
      toast.error(result.error || 'Authentication failed');
      return { success: false, error: result.error };
    }

    console.log('✅ Token exchange successful:', { role: result.role });
    
    return {
      success: true,
      role: result.role,
      user: result.user
    };

  } catch (error) {
    console.error('Token exchange error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Register via backend with event logging
export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string, 
  role: string = 'user'
): Promise<AuthResponse> => {
  try {
    console.log('📤 Attempting registration via backend:', { email, displayName, role });
    
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/register`, {
      email,
      password,
      displayName,
      role
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