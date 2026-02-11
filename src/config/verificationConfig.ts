/**
 * Verification Configuration
 * 
 * Configuration for identity verification services.
 * Switch between mock, datapro, and paystack modes.
 */

export type VerificationMode = 'mock' | 'datapro' | 'paystack' | 'production';

export interface VerificationConfig {
  mode: VerificationMode;
  
  // Datapro API Configuration (NIN verification)
  dataproApiUrl?: string;
  dataproServiceId?: string;
  
  // VerifyData API Configuration (CAC verification)
  verifydataApiUrl?: string;
  verifydataSecretKey?: string;
  
  // Paystack API Configuration (legacy NIN/BVN verification)
  ninBvnApiUrl?: string;
  ninBvnApiKey?: string;
  
  // CAC API Configuration (legacy)
  cacApiUrl?: string;
  cacApiKey?: string;
  
  // Termii API Configuration (WhatsApp/SMS notifications)
  termiiApiUrl?: string;
  termiiApiKey?: string;
}

// Current configuration - set to 'mock' for development
export const verificationConfig: VerificationConfig = {
  mode: (process.env.VERIFICATION_MODE as VerificationMode) || 'mock', // Options: 'mock' | 'datapro' | 'paystack' | 'production'
  
  // Datapro API Configuration (NIN verification)
  // Base URL: https://api.datapronigeria.com
  // Endpoint: /verifynin/?regNo={NIN}
  // Authentication: SERVICEID header
  dataproApiUrl: process.env.DATAPRO_API_URL || 'https://api.datapronigeria.com',
  dataproServiceId: process.env.DATAPRO_SERVICE_ID || '',
  
  // VerifyData API Configuration (CAC verification)
  // Base URL: https://vd.villextra.com
  // Endpoint: /api/v1/cac/verify
  // Authentication: secret-key header
  verifydataApiUrl: process.env.VERIFYDATA_API_URL || 'https://vd.villextra.com',
  verifydataSecretKey: process.env.VERIFYDATA_SECRET_KEY || '',
  
  // Paystack API Configuration (legacy NIN/BVN verification)
  // TODO: Add real API URL and key when ready
  ninBvnApiUrl: process.env.NIN_BVN_API_URL || 'https://api.paystack.co/identity',
  ninBvnApiKey: process.env.NIN_BVN_API_KEY || '',
  
  // CAC API Configuration (legacy)
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
  return verificationConfig.mode === 'production' || verificationConfig.mode === 'datapro' || verificationConfig.mode === 'paystack';
}

/**
 * Check if using Datapro API
 */
export function isDataproMode(): boolean {
  return verificationConfig.mode === 'datapro';
}

/**
 * Check if using Paystack API
 */
export function isPaystackMode(): boolean {
  return verificationConfig.mode === 'paystack';
}

/**
 * Check if using mock verification
 */
export function isMockMode(): boolean {
  return verificationConfig.mode === 'mock';
}

/**
 * Check if all required API credentials are configured
 */
export function hasRequiredCredentials(): boolean {
  if (verificationConfig.mode === 'mock') {
    return true; // Mock mode doesn't need credentials
  }
  
  if (verificationConfig.mode === 'datapro') {
    // Datapro mode requires Datapro credentials for NIN and VerifyData credentials for CAC
    return !!(
      verificationConfig.dataproApiUrl &&
      verificationConfig.dataproServiceId &&
      verificationConfig.verifydataApiUrl &&
      verificationConfig.verifydataSecretKey
    );
  }
  
  if (verificationConfig.mode === 'paystack') {
    return !!(
      verificationConfig.ninBvnApiKey &&
      verificationConfig.cacApiKey
    );
  }
  
  // Production mode requires all credentials
  return !!(
    verificationConfig.dataproServiceId &&
    verificationConfig.verifydataSecretKey &&
    verificationConfig.ninBvnApiKey &&
    verificationConfig.cacApiKey
  );
}
