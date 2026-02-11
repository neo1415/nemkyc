/**
 * Frontend Encryption Utility
 * 
 * Provides AES-256-GCM encryption/decryption for sensitive data.
 * Note: Frontend encryption is primarily for data in transit.
 * Backend handles encryption at rest.
 */

/**
 * Encrypts data using AES-256-GCM
 * Note: This is a placeholder for frontend. Real encryption happens on backend.
 * Frontend should never have access to encryption keys.
 */
export async function encryptData(plaintext: string): Promise<{ encrypted: string; iv: string }> {
  // Frontend should not perform encryption - this is handled by backend
  // This function exists for type compatibility only
  throw new Error('Encryption must be performed on the backend for security');
}

/**
 * Decrypts data using AES-256-GCM
 * Note: This is a placeholder for frontend. Real decryption happens on backend.
 * Frontend should never have access to encryption keys.
 */
export async function decryptData(encrypted: string, iv: string): Promise<string> {
  // Frontend should not perform decryption - this is handled by backend
  // This function exists for type compatibility only
  throw new Error('Decryption must be performed on the backend for security');
}

/**
 * Type definitions for encrypted data
 */
export interface EncryptedData {
  encrypted: string;  // Base64 encoded encrypted data
  iv: string;         // Base64 encoded initialization vector
}

/**
 * Validates that data appears to be encrypted
 */
export function isEncrypted(data: any): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.encrypted === 'string' &&
    typeof data.iv === 'string' &&
    data.encrypted.length > 0 &&
    data.iv.length > 0
  );
}
