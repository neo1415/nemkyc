/**
 * CAC Document File Validator
 * 
 * Validates file types, sizes, and content for CAC document uploads.
 * Ensures only appropriate files are accepted and prevents malicious uploads.
 */

import { FileValidationResult } from '../types/cacDocuments';

/**
 * Allowed MIME types for CAC documents
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = ['.pdf', '.jpeg', '.jpg', '.png'];

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Error codes for validation failures
 */
export enum ValidationErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_MIME_TYPE = 'INVALID_MIME_TYPE',
  MALICIOUS_CONTENT = 'MALICIOUS_CONTENT',
  EMPTY_FILE = 'EMPTY_FILE',
  INVALID_FILE = 'INVALID_FILE'
}

/**
 * Validates a file for CAC document upload
 * 
 * @param file - File to validate
 * @returns Validation result with error details if invalid
 */
export function validateCACDocumentFile(file: File): FileValidationResult {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
      errorCode: ValidationErrorCode.INVALID_FILE
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty. Please select a valid document.',
      errorCode: ValidationErrorCode.EMPTY_FILE
    };
  }

  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate file type by extension
  const extensionValidation = validateFileExtension(file);
  if (!extensionValidation.isValid) {
    return extensionValidation;
  }

  // Validate MIME type
  const mimeValidation = validateMimeType(file);
  if (!mimeValidation.isValid) {
    return mimeValidation;
  }

  // Return success with metadata
  return {
    isValid: true,
    metadata: {
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type
    }
  };
}

/**
 * Validates file size
 * 
 * @param file - File to validate
 * @returns Validation result
 */
function validateFileSize(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB. Please select a smaller file.`,
      errorCode: ValidationErrorCode.FILE_TOO_LARGE
    };
  }

  return { isValid: true };
}

/**
 * Validates file extension
 * 
 * @param file - File to validate
 * @returns Validation result
 */
function validateFileExtension(file: File): FileValidationResult {
  const filename = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => filename.endsWith(ext));

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Invalid file type. Please select a PDF or image file (JPEG, PNG).`,
      errorCode: ValidationErrorCode.INVALID_FILE_TYPE
    };
  }

  return { isValid: true };
}

/**
 * Validates MIME type
 * 
 * @param file - File to validate
 * @returns Validation result
 */
function validateMimeType(file: File): FileValidationResult {
  const mimeType = file.type.toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: `Invalid file format. Please select a PDF or image file (JPEG, PNG).`,
      errorCode: ValidationErrorCode.INVALID_MIME_TYPE
    };
  }

  return { isValid: true };
}

/**
 * Validates file content to prevent malicious uploads
 * This performs basic checks on file headers/magic numbers
 * 
 * @param file - File to validate
 * @returns Promise resolving to validation result
 */
export async function validateFileContent(file: File): Promise<FileValidationResult> {
  try {
    // Read first few bytes to check file signature
    const buffer = await readFileHeader(file, 8);
    const bytes = new Uint8Array(buffer);

    // Check for valid file signatures
    const isValidPDF = checkPDFSignature(bytes);
    const isValidJPEG = checkJPEGSignature(bytes);
    const isValidPNG = checkPNGSignature(bytes);

    if (!isValidPDF && !isValidJPEG && !isValidPNG) {
      return {
        isValid: false,
        error: 'File content does not match the file type. The file may be corrupted or malicious.',
        errorCode: ValidationErrorCode.MALICIOUS_CONTENT
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Unable to validate file content. Please try again.',
      errorCode: ValidationErrorCode.INVALID_FILE
    };
  }
}

/**
 * Reads the first N bytes of a file
 * 
 * @param file - File to read
 * @param bytes - Number of bytes to read
 * @returns Promise resolving to ArrayBuffer
 */
function readFileHeader(file: File, bytes: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const blob = file.slice(0, bytes);

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Checks if bytes match PDF signature
 * PDF files start with %PDF
 * 
 * @param bytes - File header bytes
 * @returns True if valid PDF signature
 */
function checkPDFSignature(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && // %
         bytes[1] === 0x50 && // P
         bytes[2] === 0x44 && // D
         bytes[3] === 0x46;   // F
}

/**
 * Checks if bytes match JPEG signature
 * JPEG files start with FF D8 FF
 * 
 * @param bytes - File header bytes
 * @returns True if valid JPEG signature
 */
function checkJPEGSignature(bytes: Uint8Array): boolean {
  return bytes[0] === 0xFF &&
         bytes[1] === 0xD8 &&
         bytes[2] === 0xFF;
}

/**
 * Checks if bytes match PNG signature
 * PNG files start with 89 50 4E 47 0D 0A 1A 0A
 * 
 * @param bytes - File header bytes
 * @returns True if valid PNG signature
 */
function checkPNGSignature(bytes: Uint8Array): boolean {
  return bytes[0] === 0x89 &&
         bytes[1] === 0x50 && // P
         bytes[2] === 0x4E && // N
         bytes[3] === 0x47 && // G
         bytes[4] === 0x0D &&
         bytes[5] === 0x0A &&
         bytes[6] === 0x1A &&
         bytes[7] === 0x0A;
}

/**
 * Gets a user-friendly error message for a validation error code
 * 
 * @param errorCode - Validation error code
 * @returns User-friendly error message
 */
export function getValidationErrorMessage(errorCode: ValidationErrorCode): string {
  switch (errorCode) {
    case ValidationErrorCode.INVALID_FILE_TYPE:
      return 'Please select a PDF or image file (JPEG, PNG).';
    case ValidationErrorCode.FILE_TOO_LARGE:
      return 'File size exceeds 10MB. Please select a smaller file.';
    case ValidationErrorCode.INVALID_MIME_TYPE:
      return 'Invalid file format. Please select a PDF or image file.';
    case ValidationErrorCode.MALICIOUS_CONTENT:
      return 'File content validation failed. The file may be corrupted.';
    case ValidationErrorCode.EMPTY_FILE:
      return 'File is empty. Please select a valid document.';
    case ValidationErrorCode.INVALID_FILE:
      return 'Invalid file. Please select a valid document.';
    default:
      return 'File validation failed. Please try again.';
  }
}
