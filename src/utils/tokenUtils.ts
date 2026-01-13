/**
 * Token Generation and Validation Utilities
 * 
 * This module provides secure token generation for the Identity Remediation System.
 * Tokens are used for one-time verification links sent to customers.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { API_BASE_URL } from '../config/constants';

/**
 * Token length in bytes (32 bytes = 256 bits of entropy)
 * This provides cryptographically secure randomness for verification tokens
 */
const TOKEN_BYTE_LENGTH = 32;

/**
 * Default expiration period for verification tokens in days
 */
export const DEFAULT_EXPIRATION_DAYS = 7;

/**
 * Generates a cryptographically secure token using Web Crypto API
 * 
 * The token is:
 * - 32 bytes (256 bits) of cryptographic randomness
 * - URL-safe base64 encoded (replaces +, /, = with -, _, '')
 * - Suitable for use in verification URLs
 * 
 * @returns A URL-safe base64 encoded secure token string
 * 
 * Requirements: 2.1, 2.2
 */
export function generateSecureToken(): string {
  // Generate 32 bytes of cryptographically secure random data
  const randomBytes = new Uint8Array(TOKEN_BYTE_LENGTH);
  crypto.getRandomValues(randomBytes);
  
  // Convert to base64
  const base64 = btoa(String.fromCharCode(...randomBytes));
  
  // Make URL-safe by replacing non-URL-safe characters
  // + -> -
  // / -> _
  // = -> '' (remove padding)
  const urlSafeToken = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return urlSafeToken;
}

/**
 * Generates a complete verification URL for a given token
 * 
 * The URL follows the format: {base_url}/verify/{token}
 * 
 * @param token - The secure token to include in the URL
 * @param baseUrl - Optional base URL override (defaults to API_BASE_URL)
 * @returns The complete verification URL
 * 
 * Requirements: 2.4
 */
export function generateVerificationUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || API_BASE_URL;
  // Remove trailing slash if present
  const normalizedBase = base.replace(/\/$/, '');
  return `${normalizedBase}/verify/${token}`;
}

/**
 * Checks if a token has expired based on its expiration timestamp
 * 
 * @param expiresAt - The expiration date/timestamp of the token
 * @returns true if the token has expired, false otherwise
 * 
 * Requirements: 2.3
 */
export function isTokenExpired(expiresAt: Date | string | number): boolean {
  const expirationDate = expiresAt instanceof Date 
    ? expiresAt 
    : new Date(expiresAt);
  
  const now = new Date();
  return now > expirationDate;
}

/**
 * Calculates the expiration date for a token based on the number of days
 * 
 * @param days - Number of days until expiration (defaults to DEFAULT_EXPIRATION_DAYS)
 * @returns The expiration date
 * 
 * Requirements: 2.3
 */
export function calculateExpirationDate(days: number = DEFAULT_EXPIRATION_DAYS): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
}

/**
 * Validates that a token string has the expected format
 * 
 * A valid token should:
 * - Be a non-empty string
 * - Contain only URL-safe base64 characters (A-Z, a-z, 0-9, -, _)
 * - Have a minimum length corresponding to 32 bytes of data (~43 characters)
 * 
 * @param token - The token string to validate
 * @returns true if the token format is valid, false otherwise
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // URL-safe base64 pattern: only alphanumeric, dash, and underscore
  const urlSafeBase64Pattern = /^[A-Za-z0-9_-]+$/;
  
  // 32 bytes in base64 = ceil(32 * 8 / 6) = 43 characters (without padding)
  const minLength = 43;
  
  return token.length >= minLength && urlSafeBase64Pattern.test(token);
}

/**
 * Generates a token with its expiration date
 * 
 * This is a convenience function that combines token generation
 * with expiration date calculation.
 * 
 * @param expirationDays - Number of days until the token expires
 * @returns An object containing the token and its expiration date
 */
export function generateTokenWithExpiration(expirationDays: number = DEFAULT_EXPIRATION_DAYS): {
  token: string;
  expiresAt: Date;
} {
  return {
    token: generateSecureToken(),
    expiresAt: calculateExpirationDate(expirationDays),
  };
}
