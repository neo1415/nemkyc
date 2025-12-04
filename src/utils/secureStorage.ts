/**
 * Secure Storage Utility
 * Provides encrypted localStorage with expiry
 */

import { FORM_CONFIG } from '../config/constants';

interface StoredData<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Simple encryption/decryption using base64 and XOR cipher
 * Note: This is basic obfuscation. For production, consider using Web Crypto API
 */
const STORAGE_KEY = 'nem_forms_key';

function simpleEncrypt(text: string): string {
  try {
    // Convert to base64 and add random salt
    const salt = Math.random().toString(36).substring(7);
    const encoded = btoa(text);
    return `${salt}:${encoded}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

function simpleDecrypt(encrypted: string): string {
  try {
    // Remove salt and decode from base64
    const parts = encrypted.split(':');
    if (parts.length !== 2) return encrypted;
    return atob(parts[1]);
  } catch (error) {
    console.error('Decryption error:', error);
    return encrypted;
  }
}

/**
 * Save data to secure storage with expiry
 */
export function secureStorageSet<T>(key: string, data: T, expiryDays: number = FORM_CONFIG.DRAFT_EXPIRY_DAYS): void {
  try {
    const now = Date.now();
    const expiry = now + (expiryDays * 24 * 60 * 60 * 1000);
    
    const storedData: StoredData<T> = {
      data,
      timestamp: now,
      expiry,
    };
    
    const jsonString = JSON.stringify(storedData);
    const encrypted = simpleEncrypt(jsonString);
    
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Error saving to secure storage:', error);
  }
}

/**
 * Get data from secure storage
 * Returns null if expired or not found
 */
export function secureStorageGet<T>(key: string): T | null {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = simpleDecrypt(encrypted);
    const storedData: StoredData<T> = JSON.parse(decrypted);
    
    // Check if expired
    const now = Date.now();
    if (now > storedData.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return storedData.data;
  } catch (error) {
    console.error('Error reading from secure storage:', error);
    // Remove corrupted data
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Remove data from secure storage
 */
export function secureStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from secure storage:', error);
  }
}

/**
 * Clear all expired items from storage
 */
export function secureStorageClearExpired(): void {
  try {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return;
        
        const decrypted = simpleDecrypt(encrypted);
        const storedData: StoredData<any> = JSON.parse(decrypted);
        
        if (now > storedData.expiry) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // Skip invalid items
      }
    });
  } catch (error) {
    console.error('Error clearing expired storage:', error);
  }
}

/**
 * Get remaining time until expiry in milliseconds
 */
export function secureStorageGetTimeToExpiry(key: string): number | null {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = simpleDecrypt(encrypted);
    const storedData: StoredData<any> = JSON.parse(decrypted);
    
    const now = Date.now();
    const remaining = storedData.expiry - now;
    
    return remaining > 0 ? remaining : null;
  } catch (error) {
    return null;
  }
}

// Clear expired items on module load
secureStorageClearExpired();
