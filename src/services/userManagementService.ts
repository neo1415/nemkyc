/**
 * User Management Service
 * 
 * Frontend service for user management API calls.
 * Handles communication with backend user management endpoints.
 */

import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ========== Type Definitions ==========

export interface CreateUserRequest {
  fullName: string;
  email: string;
  role: UserRole;
}

export interface CreateUserResponse {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    role: string;
  };
  error?: string;
  code?: string;
}

export interface ListUsersQuery {
  role?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Disabled' | 'Unknown';
  createdAt: string;
  createdBy: string;
  mustChangePassword: boolean;
}

export interface ListUsersResponse {
  success: boolean;
  users: User[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalUsers: number;
  };
  error?: string;
  code?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  redirectUrl?: string;
  role?: string;
  error?: string;
  code?: string;
  details?: string[];
}

export type UserRole = 'default' | 'broker' | 'admin' | 'compliance' | 'claims' | 'super admin';

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: any;
}

// ========== Service Functions ==========

/**
 * Create a new user account
 * 
 * @param data - User creation data
 * @returns Promise with creation result
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  try {
    const response = await axios.post<CreateUserResponse>(
      `${API_BASE_URL}/api/users/create`,
      data,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * List users with filtering and pagination
 * 
 * @param filters - Query filters
 * @returns Promise with user list
 */
export async function listUsers(filters: ListUsersQuery = {}): Promise<ListUsersResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await axios.get<ListUsersResponse>(
      `${API_BASE_URL}/api/users/list?${params.toString()}`,
      {
        withCredentials: true
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update user role
 * 
 * @param userId - User ID
 * @param newRole - New role to assign
 * @returns Promise with update result
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/${userId}/role`,
      { newRole },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Toggle user account status (enable/disable)
 * 
 * @param userId - User ID
 * @param disabled - Whether to disable the account
 * @returns Promise with update result
 */
export async function toggleUserStatus(userId: string, disabled: boolean): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/${userId}/status`,
      { disabled },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Reset user password (admin-initiated)
 * 
 * @param userId - User ID
 * @returns Promise with reset result
 */
export async function resetUserPassword(userId: string): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/users/${userId}/reset-password`,
      {},
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Change own password (user-initiated)
 * 
 * @param data - Password change data
 * @returns Promise with change result
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  try {
    const response = await axios.post<ChangePasswordResponse>(
      `${API_BASE_URL}/api/users/change-password`,
      data,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

// ========== Error Handling ==========

/**
 * Handle API errors and return standardized error response
 * 
 * @param error - Error from axios
 * @returns Standardized error response
 */
function handleApiError(error: unknown): any {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    if (axiosError.response?.data) {
      // Return error from server
      return axiosError.response.data;
    }
    
    if (axiosError.request) {
      // Request made but no response
      return {
        success: false,
        error: 'No response from server. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    }
  }
  
  // Unknown error
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR'
  };
}

export default {
  createUser,
  listUsers,
  updateUserRole,
  toggleUserStatus,
  resetUserPassword,
  changePassword
};
