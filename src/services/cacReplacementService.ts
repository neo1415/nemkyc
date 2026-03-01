/**
 * CAC Document Replacement Service
 * 
 * Orchestrates the document replacement process with:
 * - Document replacement logic
 * - Archive previous version with timestamp
 * - Update metadata for new version
 * - Maintain version history
 * - Log replacement events
 * - Handle errors gracefully
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import {
  CACDocumentMetadata,
  CACDocumentType,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentStatus
} from '../types/cacDocuments';
import {
  getDocumentMetadata,
  handleDocumentReplacement,
  getLatestVersionNumber
} from './cacMetadataService';
import { uploadDocument, deleteDocument } from './cacStorageService';
import {
  logDocumentUpload,
  DocumentAction,
  CACDocumentType as AuditDocumentType
} from './cacAuditLogger';

/**
 * Parameters for document replacement
 */
export interface ReplaceDocumentParams {
  /** Existing document ID to replace */
  existingDocumentId: string;
  /** New file to upload */
  newFile: File;
  /** User ID performing the replacement */
  userId: string;
  /** User email for audit logging */
  userEmail: string;
  /** User name for audit logging */
  userName: string;
  /** User role for audit logging */
  userRole: string;
  /** Reason for replacement (optional) */
  replacementReason?: string;
  /** Progress callback */
  onProgress?: (progress: number) => void;
}

/**
 * Result of document replacement operation
 */
export interface ReplaceDocumentResult {
  /** Whether replacement was successful */
  success: boolean;
  /** New document metadata (if successful) */
  newMetadata?: CACDocumentMetadata;
  /** Old document metadata (if successful) */
  oldMetadata?: CACDocumentMetadata;
  /** Error message (if failed) */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: string;
}

/**
 * Replaces an existing CAC document with a new version
 * 
 * This function orchestrates the complete replacement process:
 * 1. Validates the existing document exists
 * 2. Uploads the new document
 * 3. Archives the previous version with timestamp
 * 4. Updates metadata for the new version
 * 5. Maintains version history
 * 6. Logs the replacement event
 * 7. Handles errors gracefully
 * 
 * @param params - Replacement parameters
 * @returns Promise resolving to replacement result
 */
export async function replaceDocument(
  params: ReplaceDocumentParams
): Promise<ReplaceDocumentResult> {
  try {
    // Step 1: Retrieve existing document metadata
    const oldMetadata = await getDocumentMetadata(params.existingDocumentId);
    
    if (!oldMetadata) {
      return {
        success: false,
        error: 'Document not found. The document may have been deleted.',
        errorCode: 'DOCUMENT_NOT_FOUND'
      };
    }

    // Step 2: Validate that the document is current
    if (!oldMetadata.isCurrent) {
      return {
        success: false,
        error: 'Cannot replace a non-current document version.',
        errorCode: 'NOT_CURRENT_VERSION'
      };
    }

    // Step 3: Upload the new document
    const uploadRequest: DocumentUploadRequest = {
      file: params.newFile,
      documentType: oldMetadata.documentType,
      identityRecordId: oldMetadata.identityRecordId,
      isReplacement: true,
      replacementReason: params.replacementReason
    };

    const uploadResponse = await uploadDocument(uploadRequest, params.onProgress);

    if (!uploadResponse.success || !uploadResponse.metadata) {
      return {
        success: false,
        error: uploadResponse.error || 'Failed to upload new document',
        errorCode: uploadResponse.errorCode || 'UPLOAD_FAILED'
      };
    }

    // Step 4: Update metadata with user information
    const newMetadata: CACDocumentMetadata = {
      ...uploadResponse.metadata,
      uploaderId: params.userId
    };

    // Step 5: Handle document replacement (archive old, update metadata, store version history)
    await handleDocumentReplacement(
      oldMetadata,
      newMetadata,
      params.replacementReason
    );

    // Step 6: Log the replacement event
    await logDocumentUpload({
      documentId: newMetadata.id,
      documentType: mapDocumentType(newMetadata.documentType),
      identityRecordId: newMetadata.identityRecordId,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      userRole: params.userRole,
      fileName: newMetadata.filename,
      fileSize: newMetadata.fileSize
    });

    // Step 7: Return success result
    return {
      success: true,
      newMetadata,
      oldMetadata
    };
  } catch (error) {
    console.error('Document replacement failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Document replacement failed',
      errorCode: 'REPLACEMENT_FAILED'
    };
  }
}

/**
 * Validates that a document can be replaced
 * 
 * @param documentId - Document ID to validate
 * @returns Promise resolving to validation result
 */
export async function canReplaceDocument(
  documentId: string
): Promise<{ canReplace: boolean; reason?: string }> {
  try {
    const metadata = await getDocumentMetadata(documentId);
    
    if (!metadata) {
      return {
        canReplace: false,
        reason: 'Document not found'
      };
    }

    if (!metadata.isCurrent) {
      return {
        canReplace: false,
        reason: 'Cannot replace a non-current document version'
      };
    }

    if (metadata.status !== DocumentStatus.UPLOADED) {
      return {
        canReplace: false,
        reason: `Cannot replace document with status: ${metadata.status}`
      };
    }

    return { canReplace: true };
  } catch (error) {
    console.error('Failed to validate document replacement:', error);
    return {
      canReplace: false,
      reason: 'Failed to validate document'
    };
  }
}

/**
 * Gets the replacement history for a document
 * 
 * @param documentId - Document ID
 * @returns Promise resolving to array of replacement events
 */
export async function getReplacementHistory(
  documentId: string
): Promise<Array<{
  version: number;
  replacedAt: Date;
  replacedBy: string;
  reason?: string;
}>> {
  try {
    const metadata = await getDocumentMetadata(documentId);
    
    if (!metadata) {
      return [];
    }

    // Get version history from metadata service
    const { getVersionHistory } = await import('./cacMetadataService');
    const versions = await getVersionHistory(documentId);

    // Filter to only replacement events (versions > 1)
    return versions
      .filter(v => v.version > 1)
      .map(v => ({
        version: v.version,
        replacedAt: v.createdAt,
        replacedBy: v.createdBy,
        reason: v.replacementReason
      }));
  } catch (error) {
    console.error('Failed to get replacement history:', error);
    return [];
  }
}

/**
 * Deletes an old document version from storage
 * This is typically called after archiving to free up storage space
 * 
 * @param storagePath - Storage path of the old document
 * @returns Promise resolving when deletion completes
 */
export async function deleteOldVersion(storagePath: string): Promise<void> {
  try {
    await deleteDocument(storagePath);
  } catch (error) {
    console.error('Failed to delete old document version:', error);
    // Don't throw - deletion failures shouldn't break the replacement process
    // The old version is already archived in metadata
  }
}

/**
 * Maps CACDocumentType to AuditDocumentType
 * (They are the same enum but imported from different modules)
 */
function mapDocumentType(type: CACDocumentType): AuditDocumentType {
  switch (type) {
    case CACDocumentType.CERTIFICATE_OF_INCORPORATION:
      return AuditDocumentType.CERTIFICATE_OF_INCORPORATION;
    case CACDocumentType.PARTICULARS_OF_DIRECTORS:
      return AuditDocumentType.PARTICULARS_OF_DIRECTORS;
    case CACDocumentType.SHARE_ALLOTMENT:
      return AuditDocumentType.SHARE_ALLOTMENT;
    default:
      return AuditDocumentType.CERTIFICATE_OF_INCORPORATION;
  }
}

/**
 * Batch replaces multiple documents
 * Useful for replacing all three CAC documents at once
 * 
 * @param replacements - Array of replacement parameters
 * @returns Promise resolving to array of replacement results
 */
export async function batchReplaceDocuments(
  replacements: ReplaceDocumentParams[]
): Promise<ReplaceDocumentResult[]> {
  const results: ReplaceDocumentResult[] = [];

  // Process replacements sequentially to avoid race conditions
  for (const replacement of replacements) {
    const result = await replaceDocument(replacement);
    results.push(result);
  }

  return results;
}

/**
 * Gets the current version number for a document
 * 
 * @param documentId - Document ID
 * @returns Promise resolving to current version number
 */
export async function getCurrentVersion(documentId: string): Promise<number> {
  try {
    const metadata = await getDocumentMetadata(documentId);
    return metadata?.version || 0;
  } catch (error) {
    console.error('Failed to get current version:', error);
    return 0;
  }
}

/**
 * Checks if a document has been replaced
 * 
 * @param documentId - Document ID
 * @returns Promise resolving to true if document has been replaced
 */
export async function hasBeenReplaced(documentId: string): Promise<boolean> {
  try {
    const version = await getCurrentVersion(documentId);
    return version > 1;
  } catch (error) {
    console.error('Failed to check replacement status:', error);
    return false;
  }
}
