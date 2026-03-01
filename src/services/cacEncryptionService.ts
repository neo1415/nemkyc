/**
 * CAC Document Encryption Service
 * 
 * Provides encryption and decryption for CAC documents before storage.
 * Integrates with existing server-utils/encryption.cjs for consistent encryption.
 * 
 * This service handles:
 * - Document encryption before upload to Firebase Storage
 * - Document decryption for viewing/downloading
 * - Secure memory cleanup after operations
 * - Error handling with proper logging
 */

import { EncryptionMetadata } from '../types/cacDocuments';

/**
 * Encryption result containing encrypted data and metadata
 */
export interface EncryptionResult {
  /** Encrypted file data as ArrayBuffer */
  encryptedData: ArrayBuffer;
  /** Encryption metadata for storage */
  metadata: EncryptionMetadata;
}

/**
 * Decryption result containing decrypted data
 */
export interface DecryptionResult {
  /** Decrypted file data as ArrayBuffer */
  decryptedData: ArrayBuffer;
  /** Original MIME type */
  mimeType: string;
}

/**
 * Current encryption key version
 * Increment this when rotating encryption keys
 */
const CURRENT_KEY_VERSION = 'v1';

/**
 * Encryption algorithm used
 */
const ALGORITHM = 'AES-256-GCM';

/**
 * Encrypts a file for secure storage
 * 
 * @param file - File to encrypt
 * @returns Promise resolving to encryption result
 * @throws Error if encryption fails
 */
export async function encryptDocument(file: File): Promise<EncryptionResult> {
  try {
    // Read file as ArrayBuffer
    const fileData = await readFileAsArrayBuffer(file);
    
    // Convert ArrayBuffer to base64 string for encryption
    const base64Data = arrayBufferToBase64(fileData);
    
    // Call backend encryption service
    const encryptionResponse = await callBackendEncryption(base64Data);
    
    // Convert encrypted base64 back to ArrayBuffer
    const encryptedData = base64ToArrayBuffer(encryptionResponse.encrypted);
    
    // Create encryption metadata
    const metadata: EncryptionMetadata = {
      algorithm: ALGORITHM,
      keyVersion: CURRENT_KEY_VERSION,
      iv: encryptionResponse.iv,
      authTag: encryptionResponse.authTag || ''
    };
    
    // Clear sensitive data from memory
    clearSensitiveData(base64Data);
    
    return {
      encryptedData,
      metadata
    };
  } catch (error) {
    console.error('Document encryption failed:', error);
    throw new Error('Failed to encrypt document. Please try again.');
  }
}

/**
 * Decrypts a document for viewing or downloading
 * 
 * @param encryptedData - Encrypted document data
 * @param metadata - Encryption metadata
 * @param mimeType - Original MIME type
 * @returns Promise resolving to decryption result
 * @throws Error if decryption fails
 */
export async function decryptDocument(
  encryptedData: ArrayBuffer,
  metadata: EncryptionMetadata,
  mimeType: string
): Promise<DecryptionResult> {
  try {
    // Validate metadata
    if (!metadata.iv || !metadata.algorithm) {
      throw new Error('Invalid encryption metadata');
    }
    
    // Convert ArrayBuffer to base64 string
    const base64Encrypted = arrayBufferToBase64(encryptedData);
    
    // Call backend decryption service
    const decryptedBase64 = await callBackendDecryption(
      base64Encrypted,
      metadata.iv
    );
    
    // Convert decrypted base64 back to ArrayBuffer
    const decryptedData = base64ToArrayBuffer(decryptedBase64);
    
    // Clear sensitive data from memory
    clearSensitiveData(decryptedBase64);
    
    return {
      decryptedData,
      mimeType
    };
  } catch (error) {
    console.error('Document decryption failed:', error);
    throw new Error('Failed to decrypt document. The file may be corrupted.');
  }
}

/**
 * Calls backend encryption service
 * 
 * @param data - Base64 encoded data to encrypt
 * @returns Promise resolving to encryption response
 */
async function callBackendEncryption(data: string): Promise<{
  encrypted: string;
  iv: string;
  authTag?: string;
}> {
  try {
    const response = await fetch('/api/cac-documents/encrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) {
      throw new Error(`Encryption service returned ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.encrypted || !result.iv) {
      throw new Error('Invalid encryption response');
    }
    
    return result;
  } catch (error) {
    console.error('Backend encryption call failed:', error);
    throw new Error('Encryption service unavailable');
  }
}

/**
 * Calls backend decryption service
 * 
 * @param encryptedData - Base64 encoded encrypted data
 * @param iv - Initialization vector
 * @returns Promise resolving to decrypted base64 data
 */
async function callBackendDecryption(
  encryptedData: string,
  iv: string
): Promise<string> {
  try {
    const response = await fetch('/api/cac-documents/decrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ encryptedData, iv })
    });
    
    if (!response.ok) {
      throw new Error(`Decryption service returned ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.decrypted) {
      throw new Error('Invalid decryption response');
    }
    
    return result.decrypted;
  } catch (error) {
    console.error('Backend decryption call failed:', error);
    throw new Error('Decryption service unavailable');
  }
}

/**
 * Reads a file as ArrayBuffer
 * 
 * @param file - File to read
 * @returns Promise resolving to ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    
    reader.onerror = () => reject(reader.error);
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Converts ArrayBuffer to base64 string
 * 
 * @param buffer - ArrayBuffer to convert
 * @returns Base64 encoded string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts base64 string to ArrayBuffer
 * 
 * @param base64 - Base64 encoded string
 * @returns ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Clears sensitive data from memory
 * Best effort to prevent sensitive data from lingering in memory
 * 
 * @param data - Sensitive data to clear
 */
function clearSensitiveData(data: string | ArrayBuffer | null): void {
  if (typeof data === 'string') {
    // Overwrite string (limited in JavaScript due to immutability)
    data = '';
  } else if (data instanceof ArrayBuffer) {
    // Overwrite ArrayBuffer with zeros
    const view = new Uint8Array(data);
    view.fill(0);
  }
  
  // Allow garbage collection
  data = null;
}

/**
 * Validates encryption metadata
 * 
 * @param metadata - Metadata to validate
 * @returns True if metadata is valid
 */
export function validateEncryptionMetadata(
  metadata: EncryptionMetadata
): boolean {
  return !!(
    metadata &&
    metadata.algorithm &&
    metadata.keyVersion &&
    metadata.iv &&
    metadata.algorithm === ALGORITHM
  );
}

/**
 * Creates a Blob from decrypted data
 * Useful for creating download links or previews
 * 
 * @param decryptedData - Decrypted document data
 * @param mimeType - MIME type of the document
 * @returns Blob containing the decrypted data
 */
export function createBlobFromDecryptedData(
  decryptedData: ArrayBuffer,
  mimeType: string
): Blob {
  return new Blob([decryptedData], { type: mimeType });
}

/**
 * Creates a download URL from decrypted data
 * Remember to revoke the URL after use with URL.revokeObjectURL()
 * 
 * @param decryptedData - Decrypted document data
 * @param mimeType - MIME type of the document
 * @returns Object URL for downloading
 */
export function createDownloadURL(
  decryptedData: ArrayBuffer,
  mimeType: string
): string {
  const blob = createBlobFromDecryptedData(decryptedData, mimeType);
  return URL.createObjectURL(blob);
}

/**
 * Triggers a download of decrypted data
 * 
 * @param decryptedData - Decrypted document data
 * @param filename - Filename for download
 * @param mimeType - MIME type of the document
 */
export function downloadDecryptedDocument(
  decryptedData: ArrayBuffer,
  filename: string,
  mimeType: string
): void {
  const url = createDownloadURL(decryptedData, mimeType);
  
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    // Clean up the object URL
    URL.revokeObjectURL(url);
  }
}
