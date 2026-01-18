import { toast } from 'sonner';
import { auth } from '../firebase/config';
import { exchangeToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface UserRole {
  id: string;
  name: string;
  email: string;
  role: string;
  dateCreated?: any;
  dateModified?: any;
}

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/csrf-token`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
};

// Helper function to generate nonce
const generateNonce = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Helper function to make authenticated requests (with auto session refresh)
const makeAuthenticatedRequest = async (url: string, method: string = 'GET', data?: any) => {
  const doFetch = async () => {
    const csrfToken = await getCSRFToken();
    const timestamp = Date.now().toString();
    const nonce = generateNonce();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken,
        'x-timestamp': timestamp,
        'x-nonce': nonce,
      },
      credentials: 'include',
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    return fetch(url, config);
  };

  // First attempt
  let response = await doFetch();
  if (response.status !== 401) {
    return response;
  }

  // If unauthorized due to missing/expired session, refresh backend session once
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return response; // Not logged in on client, propagate 401
    }
    const idToken = await currentUser.getIdToken(true);
    await exchangeToken(idToken); // sets fresh httpOnly session cookie

    // Retry once with a fresh CSRF token
    response = await doFetch();
    return response;
  } catch (err) {
    return response;
  }
};

// Get all users from backend with event logging
export const getAllUsers = async (): Promise<UserRole[]> => {
  try {
    console.log('📤 Fetching users from backend');
    
    // Backend will verify session token from cookies - no need to pass viewerUid
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/users`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    const result = await response.json();
    console.log('✅ Users fetched successfully from backend', result.data?.length);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to fetch users');
    return [];
  }
};

// Update user role via backend with event logging
export const updateUserRole = async (userId: string, newRole: string): Promise<void> => {
  try {
    console.log(`📤 Updating user role via backend: ${userId} to ${newRole}`);
    
    // Backend will verify session token and extract updater UID from there
    // Using PATCH as specified in requirements, but PUT also works (both endpoints exist)
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/users/${userId}/role`,
      'PATCH',
      { role: newRole }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user role');
    }

    console.log('✅ User role updated successfully via backend');
    toast.success('User role updated successfully');
  } catch (error) {
    console.error('Error updating user role:', error);
    toast.error('Failed to update user role');
    throw error;
  }
};

// Delete user via backend with event logging
export const deleteUser = async (userId: string, userName: string): Promise<void> => {
  try {
    console.log(`📤 Deleting user via backend: ${userId} (${userName})`);
    
    // Backend will verify session token and extract deleter UID from there
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/users/${userId}`,
      'DELETE',
      { userName }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    console.log('✅ User deleted successfully via backend');
    toast.success('User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('Failed to delete user');
    throw error;
  }
};
