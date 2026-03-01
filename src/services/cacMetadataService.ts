/**
 * CAC Document Metadata Service
 * 
 * Provides Firestore integration for CAC document metadata with:
 * - Document metadata storage in Firestore
 * - Linking documents to identity records
 * - Version history tracking
 * - Metadata queries with indexes
 * - Metadata updates for document replacement
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  DocumentReference,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  CACDocumentMetadata,
  CACDocumentType,
  DocumentStatus,
  DocumentVersionHistory,
  CACDocumentRecord,
  DocumentStatusSummary
} from '../types/cacDocuments';

/**
 * Firestore collection names
 */
const COLLECTIONS = {
  METADATA: 'cac-document-metadata',
  VERSION_HISTORY: 'cac-document-version-history',
  AUDIT_LOGS: 'cac-document-audit-logs'
};

/**
 * Converts Firestore Timestamp to Date
 */
function timestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
}

/**
 * Converts Date to Firestore Timestamp
 */
function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Stores document metadata in Firestore
 * 
 * @param metadata - Document metadata to store
 * @returns Promise resolving when metadata is stored
 */
export async function storeDocumentMetadata(
  metadata: CACDocumentMetadata
): Promise<void> {
  try {
    const metadataRef = doc(db, COLLECTIONS.METADATA, metadata.id);
    
    // Convert Date objects to Firestore Timestamps
    const firestoreData = {
      ...metadata,
      uploadedAt: dateToTimestamp(metadata.uploadedAt),
      createdAt: dateToTimestamp(new Date()),
      updatedAt: dateToTimestamp(new Date())
    };
    
    await setDoc(metadataRef, firestoreData);
  } catch (error) {
    console.error('Failed to store document metadata:', error);
    throw new Error('Failed to store document metadata. Please try again.');
  }
}

/**
 * Retrieves document metadata from Firestore
 * 
 * @param documentId - Document ID
 * @returns Promise resolving to document metadata or null if not found
 */
export async function getDocumentMetadata(
  documentId: string
): Promise<CACDocumentMetadata | null> {
  try {
    const metadataRef = doc(db, COLLECTIONS.METADATA, documentId);
    const metadataSnap = await getDoc(metadataRef);
    
    if (!metadataSnap.exists()) {
      return null;
    }
    
    const data = metadataSnap.data();
    
    // Convert Firestore Timestamps to Date objects
    return {
      ...data,
      uploadedAt: timestampToDate(data.uploadedAt),
      status: data.status as DocumentStatus
    } as CACDocumentMetadata;
  } catch (error) {
    console.error('Failed to retrieve document metadata:', error);
    throw new Error('Failed to retrieve document metadata. Please try again.');
  }
}

/**
 * Updates document metadata in Firestore
 * 
 * @param documentId - Document ID
 * @param updates - Partial metadata updates
 * @returns Promise resolving when metadata is updated
 */
export async function updateDocumentMetadata(
  documentId: string,
  updates: Partial<CACDocumentMetadata>
): Promise<void> {
  try {
    const metadataRef = doc(db, COLLECTIONS.METADATA, documentId);
    
    // Convert Date objects to Firestore Timestamps
    const firestoreUpdates: any = { ...updates };
    if (updates.uploadedAt) {
      firestoreUpdates.uploadedAt = dateToTimestamp(updates.uploadedAt);
    }
    firestoreUpdates.updatedAt = dateToTimestamp(new Date());
    
    await setDoc(metadataRef, firestoreUpdates, { merge: true });
  } catch (error) {
    console.error('Failed to update document metadata:', error);
    throw new Error('Failed to update document metadata. Please try again.');
  }
}

/**
 * Deletes document metadata from Firestore
 * 
 * @param documentId - Document ID
 * @returns Promise resolving when metadata is deleted
 */
export async function deleteDocumentMetadata(
  documentId: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Delete metadata
    const metadataRef = doc(db, COLLECTIONS.METADATA, documentId);
    batch.delete(metadataRef);
    
    // Delete version history
    const versionHistoryQuery = query(
      collection(db, COLLECTIONS.VERSION_HISTORY),
      where('documentId', '==', documentId)
    );
    const versionHistorySnap = await getDocs(versionHistoryQuery);
    versionHistorySnap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to delete document metadata:', error);
    throw new Error('Failed to delete document metadata. Please try again.');
  }
}

/**
 * Queries documents by identity record ID
 * 
 * @param identityRecordId - Identity record ID
 * @returns Promise resolving to array of document metadata
 */
export async function getDocumentsByIdentityRecord(
  identityRecordId: string
): Promise<CACDocumentMetadata[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.METADATA),
      where('identityRecordId', '==', identityRecordId),
      where('isCurrent', '==', true),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnap = await getDocs(q);
    
    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        uploadedAt: timestampToDate(data.uploadedAt),
        status: data.status as DocumentStatus
      } as CACDocumentMetadata;
    });
  } catch (error) {
    console.error('Failed to query documents by identity record:', error);
    throw new Error('Failed to query documents. Please try again.');
  }
}

/**
 * Queries documents by document type
 * 
 * @param documentType - Document type
 * @param identityRecordId - Optional identity record ID filter
 * @returns Promise resolving to array of document metadata
 */
export async function getDocumentsByType(
  documentType: CACDocumentType,
  identityRecordId?: string
): Promise<CACDocumentMetadata[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('documentType', '==', documentType),
      where('isCurrent', '==', true),
      orderBy('uploadedAt', 'desc')
    ];
    
    if (identityRecordId) {
      constraints.unshift(where('identityRecordId', '==', identityRecordId));
    }
    
    const q = query(collection(db, COLLECTIONS.METADATA), ...constraints);
    const querySnap = await getDocs(q);
    
    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        uploadedAt: timestampToDate(data.uploadedAt),
        status: data.status as DocumentStatus
      } as CACDocumentMetadata;
    });
  } catch (error) {
    console.error('Failed to query documents by type:', error);
    throw new Error('Failed to query documents. Please try again.');
  }
}

/**
 * Queries documents by upload date range
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @param identityRecordId - Optional identity record ID filter
 * @returns Promise resolving to array of document metadata
 */
export async function getDocumentsByDateRange(
  startDate: Date,
  endDate: Date,
  identityRecordId?: string
): Promise<CACDocumentMetadata[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('uploadedAt', '>=', dateToTimestamp(startDate)),
      where('uploadedAt', '<=', dateToTimestamp(endDate)),
      orderBy('uploadedAt', 'desc')
    ];
    
    if (identityRecordId) {
      constraints.unshift(where('identityRecordId', '==', identityRecordId));
    }
    
    const q = query(collection(db, COLLECTIONS.METADATA), ...constraints);
    const querySnap = await getDocs(q);
    
    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        uploadedAt: timestampToDate(data.uploadedAt),
        status: data.status as DocumentStatus
      } as CACDocumentMetadata;
    });
  } catch (error) {
    console.error('Failed to query documents by date range:', error);
    throw new Error('Failed to query documents. Please try again.');
  }
}

/**
 * Stores version history entry in Firestore
 * 
 * @param documentId - Document ID
 * @param versionHistory - Version history entry
 * @returns Promise resolving when version history is stored
 */
export async function storeVersionHistory(
  documentId: string,
  versionHistory: DocumentVersionHistory
): Promise<void> {
  try {
    const versionId = `${documentId}_v${versionHistory.version}`;
    const versionRef = doc(db, COLLECTIONS.VERSION_HISTORY, versionId);
    
    // Convert Date objects to Firestore Timestamps
    const firestoreData = {
      documentId,
      version: versionHistory.version,
      metadata: {
        ...versionHistory.metadata,
        uploadedAt: dateToTimestamp(versionHistory.metadata.uploadedAt)
      },
      createdAt: dateToTimestamp(versionHistory.createdAt),
      createdBy: versionHistory.createdBy,
      replacementReason: versionHistory.replacementReason || null,
      previousVersion: versionHistory.previousVersion || null
    };
    
    await setDoc(versionRef, firestoreData);
  } catch (error) {
    console.error('Failed to store version history:', error);
    throw new Error('Failed to store version history. Please try again.');
  }
}

/**
 * Retrieves version history for a document
 * 
 * @param documentId - Document ID
 * @returns Promise resolving to array of version history entries
 */
export async function getVersionHistory(
  documentId: string
): Promise<DocumentVersionHistory[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.VERSION_HISTORY),
      where('documentId', '==', documentId),
      orderBy('version', 'desc')
    );
    
    const querySnap = await getDocs(q);
    
    return querySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        version: data.version,
        metadata: {
          ...data.metadata,
          uploadedAt: timestampToDate(data.metadata.uploadedAt),
          status: data.metadata.status as DocumentStatus
        },
        createdAt: timestampToDate(data.createdAt),
        createdBy: data.createdBy,
        replacementReason: data.replacementReason || undefined,
        previousVersion: data.previousVersion || undefined
      } as DocumentVersionHistory;
    });
  } catch (error) {
    console.error('Failed to retrieve version history:', error);
    throw new Error('Failed to retrieve version history. Please try again.');
  }
}

/**
 * Gets a specific version of a document
 * 
 * @param documentId - Document ID
 * @param version - Version number
 * @returns Promise resolving to version history entry or null if not found
 */
export async function getDocumentVersion(
  documentId: string,
  version: number
): Promise<DocumentVersionHistory | null> {
  try {
    const versionId = `${documentId}_v${version}`;
    const versionRef = doc(db, COLLECTIONS.VERSION_HISTORY, versionId);
    const versionSnap = await getDoc(versionRef);
    
    if (!versionSnap.exists()) {
      return null;
    }
    
    const data = versionSnap.data();
    return {
      version: data.version,
      metadata: {
        ...data.metadata,
        uploadedAt: timestampToDate(data.metadata.uploadedAt),
        status: data.metadata.status as DocumentStatus
      },
      createdAt: timestampToDate(data.createdAt),
      createdBy: data.createdBy,
      replacementReason: data.replacementReason || undefined,
      previousVersion: data.previousVersion || undefined
    } as DocumentVersionHistory;
  } catch (error) {
    console.error('Failed to retrieve document version:', error);
    throw new Error('Failed to retrieve document version. Please try again.');
  }
}

/**
 * Gets complete document record including version history
 * 
 * @param documentId - Document ID
 * @returns Promise resolving to complete document record or null if not found
 */
export async function getDocumentRecord(
  documentId: string
): Promise<CACDocumentRecord | null> {
  try {
    const metadata = await getDocumentMetadata(documentId);
    if (!metadata) {
      return null;
    }
    
    const versions = await getVersionHistory(documentId);
    
    return {
      current: metadata,
      versions,
      versionCount: versions.length
    };
  } catch (error) {
    console.error('Failed to retrieve document record:', error);
    throw new Error('Failed to retrieve document record. Please try again.');
  }
}

/**
 * Handles document replacement by updating metadata and storing version history
 * 
 * @param oldMetadata - Old document metadata
 * @param newMetadata - New document metadata
 * @param replacementReason - Reason for replacement
 * @returns Promise resolving when replacement is complete
 */
export async function handleDocumentReplacement(
  oldMetadata: CACDocumentMetadata,
  newMetadata: CACDocumentMetadata,
  replacementReason?: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Archive old version
    const oldVersionHistory: DocumentVersionHistory = {
      version: oldMetadata.version,
      metadata: oldMetadata,
      createdAt: oldMetadata.uploadedAt,
      createdBy: oldMetadata.uploaderId,
      replacementReason
    };
    
    await storeVersionHistory(oldMetadata.id, oldVersionHistory);
    
    // Update old metadata to mark as not current
    await updateDocumentMetadata(oldMetadata.id, {
      isCurrent: false
    });
    
    // Store new metadata with incremented version
    const updatedNewMetadata = {
      ...newMetadata,
      version: oldMetadata.version + 1,
      isCurrent: true
    };
    
    await storeDocumentMetadata(updatedNewMetadata);
    
    // Store new version in history
    const newVersionHistory: DocumentVersionHistory = {
      version: updatedNewMetadata.version,
      metadata: updatedNewMetadata,
      createdAt: new Date(),
      createdBy: newMetadata.uploaderId,
      replacementReason,
      previousVersion: oldMetadata.version
    };
    
    await storeVersionHistory(newMetadata.id, newVersionHistory);
  } catch (error) {
    console.error('Failed to handle document replacement:', error);
    throw new Error('Failed to handle document replacement. Please try again.');
  }
}

/**
 * Gets document status summary for an identity record
 * 
 * @param identityRecordId - Identity record ID
 * @returns Promise resolving to document status summary
 */
export async function getDocumentStatusSummary(
  identityRecordId: string
): Promise<DocumentStatusSummary> {
  try {
    const documents = await getDocumentsByIdentityRecord(identityRecordId);
    
    // Initialize status summary
    const summary: DocumentStatusSummary = {
      identityRecordId,
      certificateOfIncorporation: DocumentStatus.MISSING,
      particularsOfDirectors: DocumentStatus.MISSING,
      shareAllotment: DocumentStatus.MISSING,
      uploadTimestamps: {},
      isComplete: false
    };
    
    // Update status for each document type
    documents.forEach((doc) => {
      switch (doc.documentType) {
        case CACDocumentType.CERTIFICATE_OF_INCORPORATION:
          summary.certificateOfIncorporation = doc.status;
          summary.uploadTimestamps[CACDocumentType.CERTIFICATE_OF_INCORPORATION] = doc.uploadedAt;
          break;
        case CACDocumentType.PARTICULARS_OF_DIRECTORS:
          summary.particularsOfDirectors = doc.status;
          summary.uploadTimestamps[CACDocumentType.PARTICULARS_OF_DIRECTORS] = doc.uploadedAt;
          break;
        case CACDocumentType.SHARE_ALLOTMENT:
          summary.shareAllotment = doc.status;
          summary.uploadTimestamps[CACDocumentType.SHARE_ALLOTMENT] = doc.uploadedAt;
          break;
      }
    });
    
    // Check if all documents are uploaded
    summary.isComplete =
      summary.certificateOfIncorporation === DocumentStatus.UPLOADED &&
      summary.particularsOfDirectors === DocumentStatus.UPLOADED &&
      summary.shareAllotment === DocumentStatus.UPLOADED;
    
    return summary;
  } catch (error) {
    console.error('Failed to get document status summary:', error);
    throw new Error('Failed to get document status summary. Please try again.');
  }
}

/**
 * Links a document to an identity record
 * 
 * @param documentId - Document ID
 * @param identityRecordId - Identity record ID
 * @returns Promise resolving when link is created
 */
export async function linkDocumentToIdentityRecord(
  documentId: string,
  identityRecordId: string
): Promise<void> {
  try {
    await updateDocumentMetadata(documentId, {
      identityRecordId
    });
  } catch (error) {
    console.error('Failed to link document to identity record:', error);
    throw new Error('Failed to link document to identity record. Please try again.');
  }
}

/**
 * Batch stores multiple document metadata entries
 * 
 * @param metadataList - Array of document metadata
 * @returns Promise resolving when all metadata is stored
 */
export async function batchStoreDocumentMetadata(
  metadataList: CACDocumentMetadata[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    metadataList.forEach((metadata) => {
      const metadataRef = doc(db, COLLECTIONS.METADATA, metadata.id);
      const firestoreData = {
        ...metadata,
        uploadedAt: dateToTimestamp(metadata.uploadedAt),
        createdAt: dateToTimestamp(new Date()),
        updatedAt: dateToTimestamp(new Date())
      };
      batch.set(metadataRef, firestoreData);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Failed to batch store document metadata:', error);
    throw new Error('Failed to batch store document metadata. Please try again.');
  }
}

/**
 * Gets the latest version number for a document
 * 
 * @param documentId - Document ID
 * @returns Promise resolving to latest version number
 */
export async function getLatestVersionNumber(
  documentId: string
): Promise<number> {
  try {
    const versions = await getVersionHistory(documentId);
    if (versions.length === 0) {
      return 0;
    }
    return Math.max(...versions.map((v) => v.version));
  } catch (error) {
    console.error('Failed to get latest version number:', error);
    return 0;
  }
}
