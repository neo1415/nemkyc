/**
 * Secure Storage Utility
 * Provides encrypted localStorage with expiry using Web Crypto API
 */

import { FORM_CONFIG } from '../config/constants';

interface StoredData<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface EncryptedData {
  iv: number[];
  data: number[];
}

const STORAGE_KEY = 'nem_forms_key';
const SALT = 'nem-forms-secure-salt-2024'; // In production, this should be in env

/**
 * Derive an encryption key from a password/user ID
 * Uses PBKDF2 with 100,000 iterations for strong key derivation
 */
async function getDerivedKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // Import the password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive a key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get a consistent key for the current session
 * Uses a combination of storage key and browser fingerprint
 */
function getSessionKey(): string {
  // Create a semi-persistent key based on browser characteristics
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height
  ].join('|');
  
  return `${STORAGE_KEY}-${fingerprint}`;
}

/**
 * Encrypt text using AES-GCM
 */
async function encrypt(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Get encryption key
    const key = await getDerivedKey(getSessionKey());
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Return IV and encrypted data as JSON
    const result: EncryptedData = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
    
    return JSON.stringify(result);
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to base64 if crypto fails (shouldn't happen in modern browsers)
    return btoa(text);
  }
}

/**
 * Decrypt text using AES-GCM
 */
async function decrypt(encryptedText: string): Promise<string> {
  try {
    // Parse the encrypted data
    const { iv, data }: EncryptedData = JSON.parse(encryptedText);
    
    // Get decryption key
    const key = await getDerivedKey(getSessionKey());
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    // Try fallback base64 decode for old data
    try {
      return atob(encryptedText);
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }
}

/**
 * Save data to secure storage with expiry
 * Uses AES-GCM encryption for security
 */
export async function secureStorageSet<T>(key: string, data: T, expiryDays: number = FORM_CONFIG.DRAFT_EXPIRY_DAYS): Promise<void> {
  try {
    const now = Date.now();
    const expiry = now + (expiryDays * 24 * 60 * 60 * 1000);
    
    const storedData: StoredData<T> = {
      data,
      timestamp: now,
      expiry,
    };
    
    const jsonString = JSON.stringify(storedData);
    const encrypted = await encrypt(jsonString);
    
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Error saving to secure storage:', error);
  }
}

/**
 * Get data from secure storage
 * Returns null if expired or not found
 */
export async function secureStorageGet<T>(key: string): Promise<T | null> {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = await decrypt(encrypted);
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
 * Now async due to encryption
 */
export async function secureStorageClearExpired(): Promise<void> {
  try {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) continue;
        
        // Try to decrypt and check expiry
        const decrypted = await decrypt(encrypted);
        const storedData: StoredData<any> = JSON.parse(decrypted);
        
        if (now > storedData.expiry) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // Skip invalid items or remove corrupted data
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing expired storage:', error);
  }
}

/**
 * Get remaining time until expiry in milliseconds
 * Now async due to encryption
 */
export async function secureStorageGetTimeToExpiry(key: string): Promise<number | null> {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = await decrypt(encrypted);
    const storedData: StoredData<any> = JSON.parse(decrypted);
    
    const now = Date.now();
    const remaining = storedData.expiry - now;
    
    return remaining > 0 ? remaining : null;
  } catch (error) {
    return null;
  }
}

// Clear expired items on module load (async, runs in background)
secureStorageClearExpired().catch(err => {
  console.error('Failed to clear expired storage on load:', err);
});
