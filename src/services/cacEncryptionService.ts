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
    console.log('🔐 [Encryption] Starting backend encryption call', {
      dataLength: data.length,
      timestamp: new Date().toISOString()
    });

    // Use absolute URL in production to avoid routing issues
    const baseUrl = window.location.origin;
    let apiUrl = `${baseUrl}/api/cac-documents/encrypt`;
    
    // In production, try the direct server URL first if we're on the main domain
    if (baseUrl.includes('nemforms.com')) {
      apiUrl = `https://nem-server-rhdb.onrender.com/api/cac-documents/encrypt`;
      console.log('🔐 [Encryption] Using direct server URL for production:', apiUrl);
    } else {
      console.log('🔐 [Encryption] Using relative URL:', apiUrl);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data }),
      credentials: 'include' // Include cookies for authentication
    });
    
    console.log('🔐 [Encryption] Backend response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Encryption] Backend returned error', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Encryption service returned ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ [Encryption] Backend encryption successful', {
      hasEncrypted: !!result.encrypted,
      hasIV: !!result.iv,
      encryptedLength: result.encrypted?.length || 0,
      ivLength: result.iv?.length || 0
    });

    if (!result.encrypted || !result.iv) {
      console.error('❌ [Encryption] Invalid response - missing data', result);
      throw new Error('Invalid encryption response');
    }
    
    return result;
  } catch (error) {
    console.error('❌ [Encryption] Backend encryption call failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
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
    console.log('🔓 [Decryption] Starting backend decryption call', {
      encryptedDataLength: encryptedData.length,
      ivLength: iv.length,
      timestamp: new Date().toISOString()
    });

    // Use absolute URL in production to avoid routing issues
    const baseUrl = window.location.origin;
    let apiUrl = `${baseUrl}/api/cac-documents/decrypt`;
    
    // In production, try the direct server URL first if we're on the main domain
    if (baseUrl.includes('nemforms.com')) {
      apiUrl = `https://nem-server-rhdb.onrender.com/api/cac-documents/decrypt`;
      console.log('🔓 [Decryption] Using direct server URL for production:', apiUrl);
    } else {
      console.log('🔓 [Decryption] Using relative URL:', apiUrl);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ encryptedData, iv }),
      credentials: 'include' // Include cookies for authentication
    });
    
    console.log('🔓 [Decryption] Backend response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Decryption] Backend returned error', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500), // Limit error text length
        url: response.url
      });
      
      throw new Error(`Decryption service returned ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log('🔍 [Decryption] Response content type:', contentType);
    
    // Get response text first to check if it's HTML
    const responseText = await response.text();
    console.log('🔍 [Decryption] Response text preview:', responseText.substring(0, 200));
    
    // Check if response is HTML (common production issue)
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html') || 
        responseText.includes('<HTML') || responseText.startsWith('<')) {
      console.error('❌ [Decryption] Received HTML response instead of JSON - server routing issue', {
        contentType,
        responsePreview: responseText.substring(0, 500),
        url: response.url
      });
      
      // Try fallback URL patterns for production
      const fallbackUrls = [
        `${baseUrl}/api/cac-documents/decrypt`,
        `/api/cac-documents/decrypt`
      ].filter(url => url !== apiUrl); // Remove the URL we already tried
      
      console.log('🔄 [Decryption] Trying fallback URLs due to HTML response...');
      
      for (const fallbackUrl of fallbackUrls) {
        if (fallbackUrl === apiUrl) continue; // Skip the one we already tried
        
        try {
          console.log('🔄 [Decryption] Trying fallback URL:', fallbackUrl);
          
          const fallbackResponse = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ encryptedData, iv }),
            credentials: 'include'
          });
          
          if (fallbackResponse.ok) {
            const fallbackText = await fallbackResponse.text();
            console.log('🔍 [Decryption] Fallback response preview:', fallbackText.substring(0, 200));
            
            // Check if fallback response is also HTML
            if (fallbackText.includes('<!DOCTYPE') || fallbackText.includes('<html') || 
                fallbackText.includes('<HTML') || fallbackText.startsWith('<')) {
              console.log('❌ [Decryption] Fallback URL also returned HTML:', fallbackUrl);
              continue;
            }
            
            try {
              const result = JSON.parse(fallbackText);
              if (result.decrypted) {
                console.log('✅ [Decryption] Fallback URL worked:', fallbackUrl);
                return result.decrypted;
              }
            } catch (parseError) {
              console.log('❌ [Decryption] Fallback URL returned invalid JSON:', fallbackUrl);
              continue;
            }
          }
        } catch (fallbackError) {
          console.log('❌ [Decryption] Fallback URL failed:', fallbackUrl, fallbackError);
        }
      }
      
      throw new Error('Decryption service is currently unavailable. The server appears to be misconfigured or down. Please try again later or contact support.');
    }
    
    // Check content type for non-HTML responses
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ [Decryption] Non-JSON response received', {
        contentType,
        responseText: responseText.substring(0, 500)
      });
      throw new Error('Decryption service returned invalid response format');
    }
    
    // Parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [Decryption] Failed to parse JSON response', {
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        responseText: responseText.substring(0, 500)
      });
      throw new Error('Decryption service returned invalid JSON response');
    }
    
    console.log('✅ [Decryption] Backend decryption successful', {
      hasDecryptedData: !!result.decrypted,
      decryptedDataLength: result.decrypted?.length || 0
    });

    if (!result.decrypted) {
      console.error('❌ [Decryption] Invalid response - missing decrypted data', result);
      throw new Error('Invalid decryption response');
    }
    
    return result.decrypted;
  } catch (error) {
    console.error('❌ [Decryption] Backend decryption call failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to decryption service. Please check your internet connection and try again.');
    }
    
    if (error instanceof Error && error.message.includes('JSON')) {
      throw new Error('Decryption service returned invalid response. Please try again or contact support.');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Decryption service unavailable');
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
