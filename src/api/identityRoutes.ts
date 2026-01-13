/**
 * Identity Collection System API Routes
 * 
 * This module contains all API endpoint definitions for the Identity Collection System.
 * These routes handle:
 * - List management (create, read, delete)
 * - Entry operations (send links, resend, verify)
 * - Activity logging
 * - Export functionality
 * 
 * Note: These routes are designed to be integrated with the Express server.
 * The actual implementation will call these endpoints from the frontend.
 */

// API Endpoint Definitions for Identity Collection System
// Base URL: /api/identity

export const IDENTITY_API_ENDPOINTS = {
  // List Management
  LISTS: '/api/identity/lists',
  LIST_DETAIL: (listId: string) => `/api/identity/lists/${listId}`,
  LIST_ENTRIES: (listId: string) => `/api/identity/lists/${listId}/entries`,
  LIST_SEND: (listId: string) => `/api/identity/lists/${listId}/send`,
  LIST_EXPORT: (listId: string) => `/api/identity/lists/${listId}/export`,
  LIST_ACTIVITY: (listId: string) => `/api/identity/lists/${listId}/activity`,
  
  // Entry Operations
  ENTRY_RESEND: (entryId: string) => `/api/identity/entries/${entryId}/resend`,
  
  // Public Verification (no auth required)
  VERIFY_TOKEN: (token: string) => `/api/identity/verify/${token}`,
} as const;

/**
 * API Request/Response type definitions
 */

// Create List Request
export interface CreateListRequestBody {
  name: string;
  columns: string[];
  emailColumn: string;
  entries: Record<string, unknown>[];
  originalFileName: string;
}

// Send Links Request
export interface SendLinksRequestBody {
  entryIds: string[];
  verificationType: 'NIN' | 'CAC';
}

// Verification Submit Request
export interface VerifySubmitRequestBody {
  identityNumber: string;
  companyName?: string;
}

// Query Parameters
export interface ListEntriesQueryParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ActivityQueryParams {
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Resend Link Response
export interface ResendLinkResponseBody {
  success: boolean;
  newExpiresAt: string;
  resendCount: number;
  warning?: string;
}
