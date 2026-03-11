/**
 * CAC Document Preview Component
 * 
 * Displays CAC documents in a modal dialog with:
 * - PDF rendering using PDF viewer
 * - Image display with zoom controls
 * - Loading indicator while fetching
 * - Error message on preview failure
 * - Download button for authorized users
 * - Lazy loading for document lists
 * - Session caching for decrypted documents
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.1, 10.2
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
  Alert,
  Box,
  Button,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { CACDocumentMetadata } from '../../types/cacDocuments';
import { getDocumentForPreview, downloadDocument } from '../../services/cacStorageService';
import { createBlobFromDecryptedData } from '../../services/cacEncryptionService';
import { shouldShowDocumentActions } from '../../services/cacAccessControl';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Session cache for decrypted documents
 * Requirement: 10.2 - Cache decrypted documents for session
 */
const documentCache = new Map<string, ArrayBuffer>();

/**
 * Props for CACDocumentPreview component
 */
export interface CACDocumentPreviewProps {
  /** Whether the preview modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Document metadata to preview */
  document: CACDocumentMetadata | null;
  /** Owner ID of the document for permission checks */
  ownerId: string;
}

/**
 * CAC Document Preview Component
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.1, 10.2
 */
export const CACDocumentPreview: React.FC<CACDocumentPreviewProps> = ({
  open,
  onClose,
  document,
  ownerId
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [downloading, setDownloading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  // Check if user has permission to view/download
  const canViewDocument = document ? shouldShowDocumentActions(user, ownerId) : false;

  /**
   * Loads the document for preview
   * Requirement: 6.5 - Show loading indicator while fetching
   * Requirement: 10.2 - Cache decrypted documents for session
   * Requirement: 10.3 - Preview loading time under 3 seconds for files under 5MB
   */
  const loadDocument = useCallback(async () => {
    if (!document || !canViewDocument) {
      console.log('🔒 [Preview] Cannot load document', {
        hasDocument: !!document,
        canViewDocument,
        documentId: document?.id
      });
      return;
    }

    console.log('📄 [Preview] Starting document load', {
      documentId: document.id,
      documentType: document.documentType,
      fileName: document.filename,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      storagePath: document.storagePath,
      hasEncryptionMetadata: !!document.encryptionMetadata,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = document.id;
      let decryptedData: ArrayBuffer;

      if (documentCache.has(cacheKey)) {
        console.log('✅ [Preview] Using cached document data', { documentId: document.id });
        // Use cached data
        decryptedData = documentCache.get(cacheKey)!;
      } else {
        console.log('📥 [Preview] Fetching and decrypting document', { documentId: document.id });
        // Fetch and decrypt document
        decryptedData = await getDocumentForPreview(
          document.storagePath,
          document.encryptionMetadata,
          document.mimeType
        );

        console.log('💾 [Preview] Caching decrypted document', {
          documentId: document.id,
          dataSize: decryptedData.byteLength
        });
        // Cache for session
        documentCache.set(cacheKey, decryptedData);
      }

      console.log('🎨 [Preview] Creating blob and object URL', {
        documentId: document.id,
        mimeType: document.mimeType
      });

      // Create blob and object URL for preview
      const blob = createBlobFromDecryptedData(decryptedData, document.mimeType);
      const url = URL.createObjectURL(blob);

      // Clean up previous URL if exists
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      objectUrlRef.current = url;
      setDocumentUrl(url);
      
      console.log('✅ [Preview] Document loaded successfully', {
        documentId: document.id,
        objectUrl: url.substring(0, 50) + '...'
      });
    } catch (err) {
      console.error('❌ [Preview] Failed to load document preview:', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        documentId: document.id,
        documentType: document.documentType,
        fileName: document.filename,
        timestamp: new Date().toISOString()
      });
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load document preview. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [document, canViewDocument]);

  /**
   * Loads document when modal opens
   */
  useEffect(() => {
    if (open && document) {
      loadDocument();
    }

    // Cleanup on unmount or close
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [open, document, loadDocument]);

  /**
   * Handles document download
   * Requirement: 6.7 - Include download button for authorized users
   */
  const handleDownload = async () => {
    if (!document || !canViewDocument) {
      return;
    }

    setDownloading(true);
    try {
      await downloadDocument(
        document.storagePath,
        document.encryptionMetadata,
        document.filename,
        document.mimeType
      );
    } catch (err) {
      console.error('Failed to download document:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to download document. Please try again.'
      );
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Handles zoom in
   */
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  /**
   * Handles zoom out
   */
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  /**
   * Determines if document is an image
   */
  const isImage = document?.mimeType.startsWith('image/');

  /**
   * Determines if document is a PDF
   */
  const isPDF = document?.mimeType === 'application/pdf';

  if (!document) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }
      }}
    >
      {/* Dialog Title - Requirement: 6.1 */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          {document.filename}
          <Box component="span" sx={{ ml: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
            ({(document.fileSize / 1024 / 1024).toFixed(2)} MB)
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Zoom controls for images - Requirement: 6.3 */}
          {isImage && documentUrl && (
            <>
              <Tooltip title="Zoom Out">
                <IconButton onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                {zoom}%
              </Box>
              <Tooltip title="Zoom In">
                <IconButton onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {/* Download button - Requirement: 6.7 */}
          {canViewDocument && (
            <Tooltip title="Download">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={downloading || loading}
                  size="small"
                >
                  {downloading ? 'Downloading...' : 'Download'}
                </Button>
              </span>
            </Tooltip>
          )}
          
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          p: 2
        }}
      >
        {/* Loading indicator - Requirement: 6.5 */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Box sx={{ color: 'text.secondary' }}>Loading document preview...</Box>
          </Box>
        )}

        {/* Error message - Requirement: 6.6 */}
        {error && !loading && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
            <Button onClick={loadDocument} sx={{ ml: 2 }} size="small">
              Retry
            </Button>
          </Alert>
        )}

        {/* Permission denied message */}
        {!canViewDocument && !loading && (
          <Alert severity="warning" sx={{ width: '100%' }}>
            You do not have permission to view this document.
          </Alert>
        )}

        {/* PDF viewer - Requirement: 6.2 */}
        {isPDF && documentUrl && !loading && !error && canViewDocument && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <iframe
              src={documentUrl}
              title={document.filename}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: '600px'
              }}
            />
          </Box>
        )}

        {/* Image viewer with zoom - Requirement: 6.3 */}
        {isImage && documentUrl && !loading && !error && canViewDocument && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto'
            }}
          >
            <img
              src={documentUrl}
              alt={document.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out'
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Hook for managing document preview state
 * Useful for components that need to show document previews
 */
export function useDocumentPreview() {
  const [previewDocument, setPreviewDocument] = useState<CACDocumentMetadata | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOwnerId, setPreviewOwnerId] = useState<string>('');

  const openPreview = useCallback((document: CACDocumentMetadata, ownerId: string) => {
    setPreviewDocument(document);
    setPreviewOwnerId(ownerId);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    // Don't clear document immediately to avoid flicker
    setTimeout(() => {
      setPreviewDocument(null);
      setPreviewOwnerId('');
    }, 300);
  }, []);

  return {
    previewDocument,
    previewOpen,
    previewOwnerId,
    openPreview,
    closePreview
  };
}

/**
 * Clears the document cache
 * Useful for memory management or when user logs out
 */
export function clearDocumentCache(): void {
  documentCache.clear();
}

/**
 * Gets the current cache size
 * Useful for monitoring memory usage
 */
export function getDocumentCacheSize(): number {
  return documentCache.size;
}
