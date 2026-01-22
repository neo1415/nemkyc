/**
 * Verification Configuration
 * 
 * Configuration for identity verification services.
 * Switch between mock and production modes.
 */

export type VerificationMode = 'mock' | 'production';

export interface VerificationConfig {
  mode: VerificationMode;
  ninBvnApiUrl?: string;
  ninBvnApiKey?: string;
  cacApiUrl?: string;
  cacApiKey?: string;
  termiiApiUrl?: string;
  termiiApiKey?: string;
}

// Current configuration - set to 'mock' for development
export const verificationConfig: VerificationConfig = {
  mode: 'mock', // Change to 'production' when ready to integrate real APIs
  
  // NIN/BVN API Configuration (Paystack or similar)
  // TODO: Add real API URL and key when ready
  ninBvnApiUrl: process.env.NIN_BVN_API_URL || 'https://api.paystack.co/identity',
  ninBvnApiKey: process.env.NIN_BVN_API_KEY || '',
  
  // CAC API Configuration
  // TODO: Add real API URL and key when ready
  cacApiUrl: process.env.CAC_API_URL || '',
  cacApiKey: process.env.CAC_API_KEY || '',
  
  // Termii API Configuration (for WhatsApp/SMS notifications)
  // TODO: Add real API URL and key when ready
  termiiApiUrl: process.env.TERMII_API_URL || 'https://api.ng.termii.com/api',
  termiiApiKey: process.env.TERMII_API_KEY || '',
};

/**
 * Check if verification is in production mode
 */
export function isProductionMode(): boolean {
  return verificationConfig.mode === 'production';
}

/**
 * Check if all required API credentials are configured
 */
export function hasRequiredCredentials(): boolean {
  if (verificationConfig.mode === 'mock') {
    return true; // Mock mode doesn't need credentials
  }
  
  return !!(
    verificationConfig.ninBvnApiKey &&
    verificationConfig.cacApiKey
  );
}
