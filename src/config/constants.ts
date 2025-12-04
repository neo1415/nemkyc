/**
 * Application Constants
 * Centralized configuration for the application
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nem-server-rhdb.onrender.com';

// Environment
export const IS_PRODUCTION = import.meta.env.VITE_NODE_ENV === 'production';
export const IS_DEVELOPMENT = import.meta.env.VITE_NODE_ENV === 'development';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  CSRF_TOKEN: '/csrf-token',
  EXCHANGE_TOKEN: '/api/exchange-token',
  REGISTER: '/api/register',
  LOGIN: '/api/login',
  
  // Forms
  SUBMIT_FORM: '/api/submit-form',
  FORMS: '/api/forms',
  
  // Claims
  UPDATE_CLAIM_STATUS: '/api/update-claim-status',
  
  // Email
  SEND_TO_USER: '/send-to-user',
  SEND_TO_ADMIN_CLAIMS: '/send-to-admin-and-claims',
  SEND_TO_ADMIN_COMPLIANCE: '/send-to-admin-and-compliance',
  
  // Events
  EVENTS_LOGS: '/api/events-logs',
  
  // MFA
  MFA_STATUS: '/api/auth/mfa-status',
  VERIFY_MFA: '/api/auth/verify-mfa',
} as const;

// Request Configuration
export const REQUEST_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 3 * 1024 * 1024, // 3MB
  ALLOWED_TYPES: ['.jpg', '.jpeg', '.png', '.pdf'],
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
} as const;

// Form Configuration
export const FORM_CONFIG = {
  AUTO_SAVE_DELAY: 1000, // 1 second
  DRAFT_EXPIRY_DAYS: 7,
} as const;

// Admin Roles
export const ADMIN_ROLES = ['super admin', 'admin', 'compliance', 'claims'] as const;

// Role Mappings
export const ROLE_MAPPINGS = {
  'superadmin': 'super admin',
  'super-admin': 'super admin',
  'super_admin': 'super admin',
  'super admin': 'super admin',
  'admin': 'admin',
  'compliance': 'compliance',
  'claims': 'claims',
  'default': 'default',
  'user': 'default',
  'regular': 'default',
} as const;
