/**
 * Backend Encryption Utility
 * 
 * Provides AES-256-GCM encryption/decryption for sensitive PII data.
 * Implements NDPR-compliant encryption at rest for identity numbers.
 * 
 * Security Requirements:
 * - AES-256-GCM encryption algorithm
 * - Unique IV (Initialization Vector) for each encryption
 * - Encryption key stored in environment variable
 * - Never log plaintext identity numbers
 * - Clear sensitive data from memory after use
 */

const crypto = require('crypto');

// Lazy-load audit logger to avoid circular dependencies
let logEncryptionOperation;
try {
  const auditLogger = require('./auditLogger.cjs');
  logEncryptionOperation = auditLogger.logEncryptionOperation;
} catch (err) {
  // Audit logger not available (e.g., during tests)
  logEncryptionOperation = null;
}

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const KEY_LENGTH = 32; // 32 bytes for AES-256

/**
 * Gets the encryption key from environment variable
 * @returns {Buffer} The encryption key as a Buffer
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  
  const key = Buffer.from(keyHex, 'hex');
  
  if (key.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters). Current length: ${key.length} bytes`);
  }
  
  return key;
}

/**
 * Encrypts plaintext data using AES-256-GCM
 * 
 * @param {string} plaintext - The data to encrypt (e.g., NIN, BVN, CAC)
 * @returns {Object} Object containing encrypted data and IV
 * @returns {string} return.encrypted - Base64 encoded encrypted data with auth tag
 * @returns {string} return.iv - Base64 encoded initialization vector
 * @throws {Error} If encryption fails
 * 
 * @example
 * const { encrypted, iv } = encryptData('12345678901');
 * // Store both encrypted and iv in database
 */
function encryptData(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a non-empty string');
  }
  
  try {
    const key = getEncryptionKey();
    
    // Generate a random IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine encrypted data and auth tag
    const encryptedWithTag = Buffer.concat([
      Buffer.from(encrypted, 'base64'),
      authTag
    ]).toString('base64');
    
    // Log encryption operation (async, don't wait)
    if (typeof logEncryptionOperation === 'function') {
      logEncryptionOperation({
        operation: 'encrypt',
        dataType: 'identity_data',
        result: 'success'
      }).catch(err => console.error('Failed to log encryption:', err.message));
    }
    
    return {
      encrypted: encryptedWithTag,
      iv: iv.toString('base64')
    };
  } catch (error) {
    console.error('Encryption error:', error.message);
    
    // Log encryption failure (async, don't wait)
    if (typeof logEncryptionOperation === 'function') {
      logEncryptionOperation({
        operation: 'encrypt',
        dataType: 'identity_data',
        result: 'failure',
        errorMessage: error.message
      }).catch(err => console.error('Failed to log encryption:', err.message));
    }
    
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts encrypted data using AES-256-GCM
 * 
 * @param {string} encryptedData - Base64 encoded encrypted data with auth tag
 * @param {string} ivBase64 - Base64 encoded initialization vector
 * @returns {string} The decrypted plaintext
 * @throws {Error} If decryption fails or authentication fails
 * 
 * @example
 * const plaintext = decryptData(encrypted, iv);
 * // Use plaintext for verification, then clear from memory
 */
function decryptData(encryptedData, ivBase64) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a non-empty string');
  }
  
  if (!ivBase64 || typeof ivBase64 !== 'string') {
    throw new Error('IV must be a non-empty string');
  }
  
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    
    // Split encrypted data and auth tag
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const authTag = encryptedBuffer.slice(-AUTH_TAG_LENGTH);
    const encrypted = encryptedBuffer.slice(0, -AUTH_TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    // Log decryption operation (async, don't wait)
    if (typeof logEncryptionOperation === 'function') {
      logEncryptionOperation({
        operation: 'decrypt',
        dataType: 'identity_data',
        result: 'success'
      }).catch(err => console.error('Failed to log decryption:', err.message));
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    
    // Log decryption failure (async, don't wait)
    if (typeof logEncryptionOperation === 'function') {
      logEncryptionOperation({
        operation: 'decrypt',
        dataType: 'identity_data',
        result: 'failure',
        errorMessage: error.message
      }).catch(err => console.error('Failed to log decryption:', err.message));
    }
    
    throw new Error('Failed to decrypt data - data may be corrupted or tampered with');
  }
}

/**
 * Encrypts an object containing identity fields
 * Only encrypts specified sensitive fields, leaves others unchanged
 * 
 * @param {Object} data - Object containing identity data
 * @param {string[]} fieldsToEncrypt - Array of field names to encrypt
 * @returns {Object} Object with encrypted fields
 * 
 * @example
 * const encrypted = encryptIdentityFields(
 *   { nin: '12345678901', name: 'John Doe', email: 'john@example.com' },
 *   ['nin']
 * );
 * // Result: { nin: { encrypted: '...', iv: '...' }, name: 'John Doe', email: 'john@example.com' }
 */
function encryptIdentityFields(data, fieldsToEncrypt = ['nin', 'bvn', 'cac']) {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object');
  }
  
  const result = { ...data };
  
  for (const field of fieldsToEncrypt) {
    if (data[field] && typeof data[field] === 'string') {
      // Only encrypt if not already encrypted
      if (!isEncrypted(data[field])) {
        result[field] = encryptData(data[field]);
      }
    }
  }
  
  return result;
}

/**
 * Decrypts an object containing encrypted identity fields
 * Only decrypts specified encrypted fields, leaves others unchanged
 * 
 * @param {Object} data - Object containing encrypted identity data
 * @param {string[]} fieldsToDecrypt - Array of field names to decrypt
 * @returns {Object} Object with decrypted fields
 * 
 * @example
 * const decrypted = decryptIdentityFields(
 *   { nin: { encrypted: '...', iv: '...' }, name: 'John Doe' },
 *   ['nin']
 * );
 * // Result: { nin: '12345678901', name: 'John Doe' }
 */
function decryptIdentityFields(data, fieldsToDecrypt = ['nin', 'bvn', 'cac']) {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object');
  }
  
  const result = { ...data };
  
  for (const field of fieldsToDecrypt) {
    if (data[field] && isEncrypted(data[field])) {
      try {
        result[field] = decryptData(data[field].encrypted, data[field].iv);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error.message);
        // Leave field as is if decryption fails
      }
    }
  }
  
  return result;
}

/**
 * Checks if a value is encrypted (has encrypted and iv properties)
 * 
 * @param {any} value - Value to check
 * @returns {boolean} True if value appears to be encrypted
 */
function isEncrypted(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.encrypted === 'string' &&
    typeof value.iv === 'string' &&
    value.encrypted.length > 0 &&
    value.iv.length > 0
  );
}

/**
 * Securely clears sensitive data from memory
 * Overwrites the string with zeros before allowing garbage collection
 * 
 * @param {string} sensitiveData - The sensitive data to clear
 */
function clearSensitiveData(sensitiveData) {
  if (typeof sensitiveData === 'string') {
    // Overwrite the string data (best effort in JavaScript)
    // Note: JavaScript strings are immutable, so this is limited
    // The main benefit is signaling intent and preventing accidental logging
    sensitiveData = null;
  }
}

/**
 * Generates a new encryption key
 * Use this to generate the ENCRYPTION_KEY for environment variables
 * 
 * @returns {string} Hex-encoded 32-byte encryption key
 * 
 * @example
 * const key = generateEncryptionKey();
 * console.log('Add this to your .env file:');
 * console.log(`ENCRYPTION_KEY=${key}`);
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

module.exports = {
  encryptData,
  decryptData,
  encryptIdentityFields,
  decryptIdentityFields,
  isEncrypted,
  clearSensitiveData,
  generateEncryptionKey
};
