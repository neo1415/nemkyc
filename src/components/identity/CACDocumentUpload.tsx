/**
 * CAC Document Upload Component
 * 
 * Provides upload interface for three required CAC documents:
 * - Certificate of Incorporation
 * - Particulars of Directors
 * - Share Allotment (Status Update)
 * 
 * Features:
 * - Three distinct upload fields for each document type
 * - Filename and file size display after selection
 * - Upload progress indicator with percentage
 * - Success indicator on completion
 * - Error messages with failure reasons
 * - Drag-and-drop file selection
 * - Replace button for already uploaded documents
 * - Integration with validation, encryption, storage, and audit logging services
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { validateCACDocumentFile, validateFileContent } from '../../utils/cacFileValidator';
import { uploadDocument } from '../../services/cacStorageService';
import { storeDocumentMetadata } from '../../services/cacMetadataService';
import { logDocumentUpload } from '../../services/cacAuditLogger';
import { useAuth } from '../../contexts/AuthContext';
import {
  CACDocumentType,
  DocumentUploadRequest,
  UploadProgressState,
  CACDocumentMetadata,
  DocumentStatus,
} from '../../types/cacDocuments';

/**
 * Props for individual document upload field
 */
interface DocumentUploadFieldProps {
  documentType: CACDocumentType;
  label: string;
  identityRecordId: string;
  existingDocument?: CACDocumentMetadata | null;
  onUploadSuccess: (metadata: CACDocumentMetadata) => void;
  onUploadError: (error: string) => void;
}

/**
 * Individual document upload field component
 */
function DocumentUploadField({
  documentType,
  label,
  identityRecordId,
  existingDocument,
  onUploadSuccess,
  onUploadError,
}: DocumentUploadFieldProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    progress: 0,
    isUploading: false,
    error: null,
    isComplete: false,
    isCancelled: false,
  });

  // Reset state
  const resetState = () => {
    setSelectedFile(null);
    setUploadProgress({
      progress: 0,
      isUploading: false,
      error: null,
      isComplete: false,
      isCancelled: false,
    });
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Reset previous state
    resetState();

    // Validate file
    const validation = validateCACDocumentFile(file);
    if (!validation.isValid) {
      setUploadProgress({
        progress: 0,
        isUploading: false,
        error: validation.error || 'File validation failed',
        isComplete: false,
        isCancelled: false,
      });
      onUploadError(validation.error || 'File validation failed');
      return;
    }

    // Validate file content
    const contentValidation = await validateFileContent(file);
    if (!contentValidation.isValid) {
      setUploadProgress({
        progress: 0,
        isUploading: false,
        error: contentValidation.error || 'File content validation failed',
        isComplete: false,
        isCancelled: false,
      });
      onUploadError(contentValidation.error || 'File content validation failed');
      return;
    }

    // File is valid, set it
    setSelectedFile(file);
  }, [onUploadError]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileSelect,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    disabled: uploadProgress.isUploading || uploadProgress.isComplete,
  });

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploadProgress({
      progress: 0,
      isUploading: true,
      error: null,
      isComplete: false,
      isCancelled: false,
    });

    try {
      // Create upload request
      const uploadRequest: DocumentUploadRequest = {
        file: selectedFile,
        documentType,
        identityRecordId,
        isReplacement: !!existingDocument,
        replacementReason: existingDocument ? 'Document updated by user' : undefined,
      };

      // Upload document with progress tracking
      const uploadResponse = await uploadDocument(uploadRequest, (progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          progress,
        }));
      });

      if (!uploadResponse.success || !uploadResponse.metadata) {
        throw new Error(uploadResponse.error || 'Upload failed');
      }

      // Add user information to metadata
      const metadata: CACDocumentMetadata = {
        ...uploadResponse.metadata,
        uploaderId: user.uid,
        status: DocumentStatus.UPLOADED,
      };

      // Store metadata in Firestore
      await storeDocumentMetadata(metadata);

      // Log upload event
      await logDocumentUpload({
        documentId: metadata.id,
        documentType: metadata.documentType,
        identityRecordId: metadata.identityRecordId,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        userName: user.name || user.email || 'Unknown User',
        userRole: (user as any).role || 'broker',
        fileName: metadata.filename,
        fileSize: metadata.fileSize,
      });

      // Update state to complete
      setUploadProgress({
        progress: 100,
        isUploading: false,
        error: null,
        isComplete: true,
        isCancelled: false,
      });

      // Notify parent
      onUploadSuccess(metadata);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress({
        progress: 0,
        isUploading: false,
        error: errorMessage,
        isComplete: false,
        isCancelled: false,
      });
      onUploadError(errorMessage);
    }
  };

  // Handle replace
  const handleReplace = () => {
    resetState();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Determine if document is uploaded
  const isUploaded = uploadProgress.isComplete || !!existingDocument;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        border: uploadProgress.error ? '2px solid' : '1px solid',
        borderColor: uploadProgress.error
          ? 'error.main'
          : isUploaded
          ? 'success.main'
          : 'grey.300',
      }}
    >
      {/* Document Type Label */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {label}
        </Typography>
        {isUploaded && (
          <Chip
            icon={<CheckIcon />}
            label="Uploaded"
            color="success"
            size="small"
          />
        )}
      </Box>

      {/* Upload Area or File Info */}
      {!selectedFile && !isUploaded ? (
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.400',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag & drop a file here, or click to select'}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Accepted: PDF, JPEG, PNG (Max 10MB)
          </Typography>
        </Box>
      ) : isUploaded && existingDocument ? (
        // Existing document info
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FileIcon color="primary" />
            <Typography variant="body2">
              <strong>{existingDocument.filename}</strong>
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ({formatFileSize(existingDocument.fileSize)})
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
            Uploaded: {existingDocument.uploadedAt.toLocaleString()}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReplace}
            size="small"
          >
            Replace Document
          </Button>
        </Box>
      ) : (
        // Selected file info
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FileIcon color="primary" />
            <Typography variant="body2">
              <strong>{selectedFile?.name}</strong>
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ({formatFileSize(selectedFile?.size || 0)})
            </Typography>
            {!uploadProgress.isUploading && !uploadProgress.isComplete && (
              <IconButton size="small" onClick={resetState}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {/* Upload Progress */}
          {uploadProgress.isUploading && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.progress}
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {Math.round(uploadProgress.progress)}%
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Uploading...
              </Typography>
            </Box>
          )}

          {/* Success Indicator */}
          {uploadProgress.isComplete && (
            <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
              Document uploaded successfully!
            </Alert>
          )}

          {/* Error Message */}
          {uploadProgress.error && (
            <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
              {uploadProgress.error}
            </Alert>
          )}

          {/* Upload Button */}
          {!uploadProgress.isUploading && !uploadProgress.isComplete && (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUpload}
              disabled={!selectedFile}
              fullWidth
            >
              Upload Document
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}

/**
 * Props for CAC Document Upload component
 */
interface CACDocumentUploadProps {
  identityRecordId: string;
  existingDocuments?: {
    certificateOfIncorporation?: CACDocumentMetadata | null;
    particularsOfDirectors?: CACDocumentMetadata | null;
    shareAllotment?: CACDocumentMetadata | null;
  };
  onUploadComplete?: () => void;
}

/**
 * Main CAC Document Upload Component
 * 
 * Provides three distinct upload fields for:
 * 1. Certificate of Incorporation
 * 2. Particulars of Directors
 * 3. Share Allotment (Status Update)
 */
export function CACDocumentUpload({
  identityRecordId,
  existingDocuments,
  onUploadComplete,
}: CACDocumentUploadProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    [key in CACDocumentType]?: CACDocumentMetadata;
  }>({
    [CACDocumentType.CERTIFICATE_OF_INCORPORATION]:
      existingDocuments?.certificateOfIncorporation || undefined,
    [CACDocumentType.PARTICULARS_OF_DIRECTORS]:
      existingDocuments?.particularsOfDirectors || undefined,
    [CACDocumentType.SHARE_ALLOTMENT]:
      existingDocuments?.shareAllotment || undefined,
  });

  const [globalError, setGlobalError] = useState<string | null>(null);

  // Handle successful upload
  const handleUploadSuccess = (metadata: CACDocumentMetadata) => {
    setUploadedDocuments((prev) => ({
      ...prev,
      [metadata.documentType]: metadata,
    }));
    setGlobalError(null);

    // Check if all documents are uploaded
    const allUploaded =
      uploadedDocuments[CACDocumentType.CERTIFICATE_OF_INCORPORATION] &&
      uploadedDocuments[CACDocumentType.PARTICULARS_OF_DIRECTORS] &&
      uploadedDocuments[CACDocumentType.SHARE_ALLOTMENT];

    if (allUploaded && onUploadComplete) {
      onUploadComplete();
    }
  };

  // Handle upload error
  const handleUploadError = (error: string) => {
    setGlobalError(error);
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        CAC Document Upload
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Please upload the following three required CAC documents for this corporate client:
      </Typography>

      {/* Global Error */}
      {globalError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGlobalError(null)}>
          {globalError}
        </Alert>
      )}

      {/* Upload Fields */}
      <DocumentUploadField
        documentType={CACDocumentType.CERTIFICATE_OF_INCORPORATION}
        label="Certificate of Incorporation"
        identityRecordId={identityRecordId}
        existingDocument={uploadedDocuments[CACDocumentType.CERTIFICATE_OF_INCORPORATION]}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      <DocumentUploadField
        documentType={CACDocumentType.PARTICULARS_OF_DIRECTORS}
        label="Particulars of Directors"
        identityRecordId={identityRecordId}
        existingDocument={uploadedDocuments[CACDocumentType.PARTICULARS_OF_DIRECTORS]}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      <DocumentUploadField
        documentType={CACDocumentType.SHARE_ALLOTMENT}
        label="Share Allotment (Status Update)"
        identityRecordId={identityRecordId}
        existingDocument={uploadedDocuments[CACDocumentType.SHARE_ALLOTMENT]}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      {/* Completion Status */}
      {uploadedDocuments[CACDocumentType.CERTIFICATE_OF_INCORPORATION] &&
        uploadedDocuments[CACDocumentType.PARTICULARS_OF_DIRECTORS] &&
        uploadedDocuments[CACDocumentType.SHARE_ALLOTMENT] && (
          <Alert severity="success" icon={<CheckIcon />}>
            All required CAC documents have been uploaded successfully!
          </Alert>
        )}
    </Box>
  );
}
