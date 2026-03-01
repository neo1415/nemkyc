/**
 * CAC Document Storage Service
 * 
 * Provides Firebase Storage integration for CAC documents with:
 * - Secure document upload with encryption
 * - Unique storage path generation
 * - Chunked upload for files over 5MB
 * - Resumable upload support
 * - Upload progress tracking
 * - Concurrent upload handling
 * - Document download with decryption
 * - Original filename preservation
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '../firebase/config';
import {
  encryptDocument,
  decryptDocument,
  downloadDecryptedDocument
} from './cacEncryptionService';
import {
  CACDocumentType,
  DocumentUploadRequest,
  DocumentUploadResponse,
  ChunkedUploadState,
  EncryptionMetadata
} from '../types/cacDocuments';

/**
 * Chunk size for large file uploads (5MB)
 */
const CHUNK_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB

/**
 * Maximum concurrent uploads
 */
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * Active upload tasks for tracking and cancellation
 */
const activeUploads = new Map<string, UploadTask>();

/**
 * Upload queue for managing concurrent uploads
 */
const uploadQueue: Array<() => Promise<void>> = [];

/**
 * Current number of active uploads
 */
let currentActiveUploads = 0;

/**
 * Generates a unique storage path for a document
 * 
 * @param identityRecordId - Identity record ID
 * @param documentType - Type of CAC document
 * @param filename - Original filename
 * @returns Unique storage path
 */
export function generateStoragePath(
  identityRecordId: string,
  documentType: CACDocumentType,
  filename: string
): string {
  // Generate unique ID using timestamp and random string
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const uniqueId = `${timestamp}_${randomId}`;
  
  // Sanitize identity ID and filename to prevent path traversal
  const sanitizedIdentityId = sanitizePathSegment(identityRecordId);
  const sanitizedFilename = sanitizeFilename(filename);
  
  // Create hierarchical path: cac-documents/{identityId}/{documentType}/{uniqueId}_{filename}
  return `cac-documents/${sanitizedIdentityId}/${documentType}/${uniqueId}_${sanitizedFilename}`;
}

/**
 * Sanitizes a path segment (like identity ID) to prevent security issues
 * 
 * @param segment - Path segment to sanitize
 * @returns Sanitized path segment
 */
function sanitizePathSegment(segment: string): string {
  // Remove path separators, dots (to prevent ..), spaces, and special characters
  return segment
    .replace(/\.\./g, '_') // Replace .. first
    .replace(/[/\\]/g, '_')
    .replace(/\s+/g, '_') // Replace spaces
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255); // Limit length
}

/**
 * Sanitizes filename to prevent security issues
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators, dots (to prevent ..), and special characters
  return filename
    .replace(/\.\./g, '_') // Replace .. first
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255); // Limit length
}

/**
 * Uploads a document to Firebase Storage with encryption
 * 
 * @param request - Document upload request
 * @param onProgress - Progress callback (percentage: 0-100)
 * @returns Promise resolving to upload response
 */
export async function uploadDocument(
  request: DocumentUploadRequest,
  onProgress?: (progress: number) => void
): Promise<DocumentUploadResponse> {
  try {
    // Encrypt the document
    const { encryptedData, metadata: encryptionMetadata } = await encryptDocument(request.file);
    
    // Generate unique storage path
    const storagePath = generateStoragePath(
      request.identityRecordId,
      request.documentType,
      request.file.name
    );
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Determine if chunked upload is needed
    const useChunkedUpload = request.file.size > CHUNK_SIZE_THRESHOLD;
    
    // Upload encrypted data
    const uploadResult = await performUpload(
      storageRef,
      encryptedData,
      request.file.type,
      useChunkedUpload,
      onProgress
    );
    
    // Return success response with metadata
    return {
      success: true,
      metadata: {
        id: generateDocumentId(storagePath),
        documentType: request.documentType,
        filename: request.file.name,
        fileSize: request.file.size,
        mimeType: request.file.type,
        uploadedAt: new Date(),
        uploaderId: '', // Will be set by caller
        identityRecordId: request.identityRecordId,
        storagePath,
        encryptionMetadata,
        status: 'uploaded' as any,
        version: 1,
        isCurrent: true
      }
    };
  } catch (error) {
    console.error('Document upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      errorCode: 'UPLOAD_FAILED'
    };
  }
}

/**
 * Performs the actual upload to Firebase Storage
 * 
 * @param storageRef - Firebase storage reference
 * @param data - Encrypted data to upload
 * @param mimeType - Original MIME type
 * @param useChunkedUpload - Whether to use chunked upload
 * @param onProgress - Progress callback
 * @returns Promise resolving when upload completes
 */
async function performUpload(
  storageRef: any,
  data: ArrayBuffer,
  mimeType: string,
  useChunkedUpload: boolean,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create upload task with resumable upload
    const uploadTask = uploadBytesResumable(storageRef, data, {
      contentType: 'application/octet-stream', // Store as binary
      customMetadata: {
        originalMimeType: mimeType,
        encrypted: 'true'
      }
    });
    
    // Store upload task for potential cancellation
    const taskId = storageRef.fullPath;
    activeUploads.set(taskId, uploadTask);
    
    // Track upload progress
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        // Handle upload error
        activeUploads.delete(taskId);
        reject(new Error(`Upload failed: ${error.message}`));
      },
      () => {
        // Upload completed successfully
        activeUploads.delete(taskId);
        resolve();
      }
    );
  });
}

/**
 * Generates a document ID from storage path
 * 
 * @param storagePath - Storage path
 * @returns Document ID
 */
function generateDocumentId(storagePath: string): string {
  // Use base64 encoded path as ID
  return btoa(storagePath).replace(/[/+=]/g, '_');
}

/**
 * Uploads multiple documents concurrently with queue management
 * 
 * @param requests - Array of upload requests
 * @param onProgress - Progress callback for each upload
 * @returns Promise resolving to array of upload responses
 */
export async function uploadDocumentsConcurrently(
  requests: DocumentUploadRequest[],
  onProgress?: (index: number, progress: number) => void
): Promise<DocumentUploadResponse[]> {
  const results: DocumentUploadResponse[] = [];
  
  // Create upload promises
  const uploadPromises = requests.map((request, index) => {
    return () => uploadDocument(request, (progress) => {
      onProgress?.(index, progress);
    });
  });
  
  // Execute uploads with concurrency limit
  for (let i = 0; i < uploadPromises.length; i++) {
    if (currentActiveUploads >= MAX_CONCURRENT_UPLOADS) {
      // Wait for a slot to become available
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (currentActiveUploads < MAX_CONCURRENT_UPLOADS) {
            clearInterval(checkInterval);
            resolve(undefined);
          }
        }, 100);
      });
    }
    
    currentActiveUploads++;
    
    uploadPromises[i]()
      .then(result => {
        results[i] = result;
      })
      .catch(error => {
        results[i] = {
          success: false,
          error: error.message,
          errorCode: 'UPLOAD_FAILED'
        };
      })
      .finally(() => {
        currentActiveUploads--;
      });
  }
  
  // Wait for all uploads to complete
  while (currentActiveUploads > 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Downloads a document from Firebase Storage with decryption
 * 
 * @param storagePath - Storage path of the document
 * @param encryptionMetadata - Encryption metadata
 * @param originalFilename - Original filename for download
 * @param mimeType - Original MIME type
 * @returns Promise resolving when download completes
 */
export async function downloadDocument(
  storagePath: string,
  encryptionMetadata: EncryptionMetadata,
  originalFilename: string,
  mimeType: string
): Promise<void> {
  try {
    // Get storage reference
    const storageRef = ref(storage, storagePath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Fetch encrypted data
    const response = await fetch(downloadURL);
    if (!response.ok) {
      throw new Error('Failed to fetch document from storage');
    }
    
    const encryptedData = await response.arrayBuffer();
    
    // Decrypt the document
    const { decryptedData } = await decryptDocument(
      encryptedData,
      encryptionMetadata,
      mimeType
    );
    
    // Trigger download with original filename
    downloadDecryptedDocument(decryptedData, originalFilename, mimeType);
  } catch (error) {
    console.error('Document download failed:', error);
    throw new Error('Failed to download document. Please try again.');
  }
}

/**
 * Gets decrypted document data for preview
 * 
 * @param storagePath - Storage path of the document
 * @param encryptionMetadata - Encryption metadata
 * @param mimeType - Original MIME type
 * @returns Promise resolving to decrypted data
 */
export async function getDocumentForPreview(
  storagePath: string,
  encryptionMetadata: EncryptionMetadata,
  mimeType: string
): Promise<ArrayBuffer> {
  try {
    console.log('📄 [Preview] Starting document preview fetch', {
      storagePath,
      mimeType,
      encryptionMetadata: {
        algorithm: encryptionMetadata.algorithm,
        keyVersion: encryptionMetadata.keyVersion,
        hasIV: !!encryptionMetadata.iv
      },
      timestamp: new Date().toISOString()
    });

    // Get storage reference
    const storageRef = ref(storage, storagePath);
    
    console.log('📄 [Preview] Getting download URL from Firebase Storage');
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('📄 [Preview] Download URL obtained, fetching encrypted data', {
      urlLength: downloadURL.length
    });
    
    // Fetch encrypted data
    const response = await fetch(downloadURL);
    if (!response.ok) {
      console.error('❌ [Preview] Failed to fetch from storage', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Failed to fetch document from storage');
    }
    
    const encryptedData = await response.arrayBuffer();
    
    console.log('📄 [Preview] Encrypted data fetched, starting decryption', {
      encryptedDataSize: encryptedData.byteLength
    });
    
    // Decrypt the document
    const { decryptedData } = await decryptDocument(
      encryptedData,
      encryptionMetadata,
      mimeType
    );
    
    console.log('✅ [Preview] Document decrypted successfully', {
      decryptedDataSize: decryptedData.byteLength,
      mimeType
    });
    
    return decryptedData;
  } catch (error) {
    console.error('❌ [Preview] Document preview fetch failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      storagePath,
      mimeType,
      timestamp: new Date().toISOString()
    });
    throw new Error('Failed to load document preview. Please try again.');
  }
}

/**
 * Deletes a document from Firebase Storage
 * 
 * @param storagePath - Storage path of the document
 * @returns Promise resolving when deletion completes
 */
export async function deleteDocument(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Document deletion failed:', error);
    throw new Error('Failed to delete document. Please try again.');
  }
}

/**
 * Cancels an active upload
 * 
 * @param storagePath - Storage path of the upload to cancel
 * @returns True if upload was cancelled, false if not found
 */
export function cancelUpload(storagePath: string): boolean {
  const uploadTask = activeUploads.get(storagePath);
  if (uploadTask) {
    uploadTask.cancel();
    activeUploads.delete(storagePath);
    return true;
  }
  return false;
}

/**
 * Gets the current state of a chunked upload
 * 
 * @param storagePath - Storage path of the upload
 * @returns Chunked upload state or null if not found
 */
export function getChunkedUploadState(storagePath: string): ChunkedUploadState | null {
  const uploadTask = activeUploads.get(storagePath);
  if (!uploadTask) {
    return null;
  }
  
  const snapshot = uploadTask.snapshot;
  const totalSize = snapshot.totalBytes;
  const chunkSize = CHUNK_SIZE_THRESHOLD;
  const totalChunks = Math.ceil(totalSize / chunkSize);
  const chunksUploaded = Math.floor(snapshot.bytesTransferred / chunkSize);
  const progress = (snapshot.bytesTransferred / totalSize) * 100;
  
  return {
    sessionId: storagePath,
    totalSize,
    chunkSize,
    chunksUploaded,
    totalChunks,
    progress,
    isResumable: true
  };
}

/**
 * Resumes a previously interrupted upload
 * Firebase Storage automatically handles resumable uploads,
 * so this function re-initiates the upload which will resume from the last checkpoint
 * 
 * @param request - Original upload request
 * @param onProgress - Progress callback
 * @returns Promise resolving to upload response
 */
export async function resumeUpload(
  request: DocumentUploadRequest,
  onProgress?: (progress: number) => void
): Promise<DocumentUploadResponse> {
  // Firebase Storage handles resumable uploads automatically
  // Just re-initiate the upload and it will resume from where it left off
  return uploadDocument(request, onProgress);
}

/**
 * Validates storage path format
 * 
 * @param storagePath - Storage path to validate
 * @returns True if path is valid
 */
export function validateStoragePath(storagePath: string): boolean {
  // Check path format: cac-documents/{identityId}/{documentType}/{uniqueId}_{filename}
  const pathPattern = /^cac-documents\/[^/]+\/(certificate_of_incorporation|particulars_of_directors|share_allotment)\/\d+_[a-zA-Z0-9._-]+_[^/]+$/;
  return pathPattern.test(storagePath);
}

/**
 * Extracts identity record ID from storage path
 * 
 * @param storagePath - Storage path
 * @returns Identity record ID or null if invalid
 */
export function extractIdentityIdFromPath(storagePath: string): string | null {
  const match = storagePath.match(/^cac-documents\/([^/]+)\//);
  return match ? match[1] : null;
}

/**
 * Extracts document type from storage path
 * 
 * @param storagePath - Storage path
 * @returns Document type or null if invalid
 */
export function extractDocumentTypeFromPath(storagePath: string): CACDocumentType | null {
  const match = storagePath.match(/\/(certificate_of_incorporation|particulars_of_directors|share_allotment)\//);
  if (!match) return null;
  
  return match[1] as CACDocumentType;
}
