// Document Upload Section Component - drag-and-drop interface with real-time verification

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { documentProcessor } from '../../services/geminiDocumentProcessor';
import { formSubmissionController } from '../../services/geminiFormSubmissionController';
import { mismatchAnalyzer } from '../../services/geminiMismatchAnalyzer';
import { 
  ProcessingResult, 
  VerificationResult, 
  MismatchAnalysis 
} from '../../types/geminiDocumentVerification';

interface DocumentUploadSectionProps {
  formId: string;
  documentType: 'cac' | 'individual';
  formData?: any;
  onVerificationComplete?: (result: VerificationResult) => void;
  onStatusChange?: (status: 'idle' | 'uploading' | 'processing' | 'verified' | 'failed') => void;
  onFileSelect?: (file: File) => void; // New: for form integration
  onFileRemove?: () => void; // New: for form integration
  currentFile?: File | null; // New: for showing existing file
  verificationResult?: VerificationResult | null; // New: for restoring verification state
  disabled?: boolean;
  className?: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'verified' | 'failed';
  file?: File;
  progress: number;
  result?: ProcessingResult;
  analysis?: MismatchAnalysis;
  error?: string;
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  formId,
  documentType,
  formData,
  onVerificationComplete,
  onStatusChange,
  onFileSelect,
  onFileRemove,
  currentFile,
  verificationResult,
  disabled = false,
  className = ''
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Debug: Log component state changes (for development only)
  React.useEffect(() => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 DocumentUploadSection state changed:', {
        status: uploadState.status,
        progress: uploadState.progress,
        hasFile: !!uploadState.file,
        fileName: uploadState.file?.name,
        disabled,
        documentType,
        hasFormData: !!formData,
        hasError: !!uploadState.error
      });
    }
  }, [uploadState, disabled, documentType, formData]);

  // Check for existing file on mount or when currentFile changes
  React.useEffect(() => {
    if (currentFile && uploadState.status === 'idle' && !uploadState.file) {
      // Check if we have a verification result to restore
      if (verificationResult && verificationResult.isMatch) {
        // Restore the file AND verification state
        setUploadState({
          status: 'verified',
          file: currentFile,
          progress: 100,
          result: {
            success: true,
            verificationResult: verificationResult,
            processingId: `restored_${Date.now()}`
          }
        });
        onStatusChange?.('verified');
      } else {
        // Restore the file but show as uploaded (not verified)
        setUploadState({
          status: 'idle',
          file: currentFile,
          progress: 0
        });
      }
    } else if (!currentFile && uploadState.file && uploadState.status !== 'uploading' && uploadState.status !== 'processing' && uploadState.status !== 'verified') {
      // Only reset to idle if we're not in the middle of processing or already verified
      // This prevents race conditions during the upload/verification workflow
      setUploadState({
        status: 'idle',
        progress: 0
      });
      onStatusChange?.('idle');
    }
  }, [currentFile, verificationResult, uploadState.status, uploadState.file, onStatusChange]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) {
      return;
    }

    // Validate file size (5MB limit as mentioned in UI)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      setUploadState({
        status: 'failed',
        file,
        progress: 0,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5MB limit. Please upload a smaller file.`
      });
      onStatusChange?.('failed');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      setUploadState({
        status: 'failed',
        file,
        progress: 0,
        error: `File type not supported. Please upload a PDF, JPG, or PNG file. Current file type: ${file.type || 'unknown'}`
      });
      onStatusChange?.('failed');
      return;
    }

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Starting document upload:', {
        fileName: file.name,
        fileSize: file.size,
        documentType,
        formId,
        hasFormData: !!formData
      });
    }

    // Start with uploading state and show progress immediately
    setUploadState({
      status: 'uploading',
      file,
      progress: 5
    });

    onStatusChange?.('uploading');

    try {
      // Simulate upload progress with more visible steps
      await new Promise(resolve => setTimeout(resolve, 800));
      setUploadState(prev => ({ ...prev, progress: 15 }));

      await new Promise(resolve => setTimeout(resolve, 600));
      setUploadState(prev => ({ ...prev, progress: 25 }));

      await new Promise(resolve => setTimeout(resolve, 400));
      setUploadState(prev => ({ ...prev, progress: 35 }));

      // Start processing
      setUploadState(prev => ({ ...prev, status: 'processing', progress: 45 }));
      onStatusChange?.('processing');

      // Simulate OCR processing progress with longer delays
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadState(prev => ({ ...prev, progress: 55 }));

      await new Promise(resolve => setTimeout(resolve, 800));
      setUploadState(prev => ({ ...prev, progress: 65 }));

      // Process document with error handling
      let result: ProcessingResult;
      try {
        result = await documentProcessor.processDocument(file, documentType, formData);
      } catch (processingError) {
        console.error('❌ Document processor failed:', processingError);
        
        // Check if it's a rate limit error and provide better messaging
        if (processingError instanceof Error && (
          processingError.message.includes('Rate limit exceeded') ||
          processingError.message.includes('Too many requests') ||
          processingError.message.includes('429') ||
          processingError.message.includes('quota') ||
          processingError.message.includes('RESOURCE_EXHAUSTED')
        )) {
          throw new Error('Service is temporarily busy. Please wait a few minutes and try again.');
        }
        
        // Check for other specific error types that should be shown to user
        if (processingError instanceof Error) {
          if (processingError.message.includes('network') || processingError.message.includes('connection')) {
            throw new Error('Connection issue. Please check your internet and try again.');
          } else if (processingError.message.includes('timeout')) {
            throw new Error('Processing took too long. Please try again with a smaller file.');
          } else if (processingError.message.includes('invalid') || processingError.message.includes('corrupt')) {
            throw new Error('Document appears to be corrupted or invalid. Please try uploading a different file.');
          } else if (processingError.message.includes('unsupported') || processingError.message.includes('format')) {
            throw new Error('Document format not supported. Please upload a PDF, JPG, or PNG file.');
          }
        }
        
        // For unknown errors, don't use fallback - show the actual error to user
        throw new Error(processingError instanceof Error ? processingError.message : 'Document processing failed. Please try again.');
      }

      // Simulate verification progress
      setUploadState(prev => ({ ...prev, progress: 80 }));
      await new Promise(resolve => setTimeout(resolve, 600));

      if (result.success) {
        // Only log detailed info in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Document processing successful:', {
            hasVerificationResult: !!result.verificationResult,
            isMatch: result.verificationResult?.isMatch,
            confidence: result.verificationResult?.confidence,
            mismatchCount: result.verificationResult?.mismatches?.length || 0
          });
          
          // Log verification matching details
          if (result.verificationResult) {
            console.log('🔍 Verification result:', {
              success: result.verificationResult.success,
              isMatch: result.verificationResult.isMatch,
              confidence: result.verificationResult.confidence,
              mismatchCount: result.verificationResult.mismatches?.length || 0
            });
            
            if (result.verificationResult.mismatches && result.verificationResult.mismatches.length > 0) {
              console.log('📋 Mismatches found:', result.verificationResult.mismatches.map(m => ({
                field: m.field,
                isCritical: m.isCritical,
                reason: m.reason
              })));
            }
          }
        }

        // Analyze mismatches if any
        let analysis: MismatchAnalysis | undefined;
        if (result.verificationResult?.mismatches && result.verificationResult.mismatches.length > 0) {
          analysis = mismatchAnalyzer.analyzeMismatches(result.verificationResult.mismatches);
        }

        // ALWAYS save the file first, regardless of verification result
        // This ensures the file is available for Firebase Storage upload during form submission
        onFileSelect?.(file);

        // Check verification result BEFORE updating form session
        if (result.verificationResult) {
          if (!result.verificationResult.isMatch) {
            // Document doesn't match - show specific mismatch reasons
            const mismatchReasons = result.verificationResult.mismatches
              ?.filter((m: any) => m.isCritical)
              ?.map((m: any) => m.reason)
              ?.join(', ') || 'Document data does not match form data';
            
            setUploadState({
              status: 'failed',
              file,
              progress: 100,
              result,
              analysis,
              error: `Verification failed: ${mismatchReasons}`
            });

            onStatusChange?.('failed');
            return;
          }
        }

        // Update form submission controller if verification was performed and session exists
        if (result.verificationResult) {
          try {
            // Check if session exists before trying to update
            if (formSubmissionController.hasFormSession(formId)) {
              await formSubmissionController.updateDocumentVerification(
                formId,
                documentType,
                result.verificationResult
              );
            } else {
              // Only log in development mode
              if (process.env.NODE_ENV === 'development') {
                console.log('No form session found for formId:', formId, '- skipping form controller update');
              }
              // Don't fail - document verification can work without form session
            }
          } catch (sessionError) {
            // If session update fails, log error but don't fail the verification
            console.error('❌ Form session update failed:', sessionError);
            // Only log in development mode
            if (process.env.NODE_ENV === 'development') {
              console.log('Continuing with verification despite session update failure');
            }
            // Don't return early - continue to show success
          }
        }

        // Final progress update with longer delay
        setUploadState(prev => ({ ...prev, progress: 95 }));
        await new Promise(resolve => setTimeout(resolve, 800));

        // SUCCESS CASE: Show success UI when isMatch is true
        // Set the verified state with all necessary data
        const verifiedState: UploadState = {
          status: 'verified',
          file,
          progress: 100,
          result,
          analysis
        };
        
        setUploadState(verifiedState);
        onStatusChange?.('verified');
        
        // Only call onVerificationComplete if there was actual verification against form data
        if (result.verificationResult) {
          onVerificationComplete?.(result.verificationResult);
        }

        // Log successful completion
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Workflow completed successfully:', {
            processingId: result.processingId,
            processingTime: Date.now() - new Date().getTime(),
            hasVerificationResult: !!result.verificationResult
          });
        }

      } else {
        // Processing failed - show specific error message
        let errorMessage = result.error?.message || 'Document processing failed';
        
        // Provide user-friendly error messages
        if (result.error?.code === 'OCR_FAILED') {
          errorMessage = 'Could not extract text from document. Please ensure the document is clear and readable.';
        } else if (result.error?.code === 'VERIFICATION_FAILED') {
          errorMessage = result.error.message || 'Document verification failed. Please check that the document matches your form data.';
        } else if (result.error?.code === 'UNSUPPORTED_FORMAT') {
          errorMessage = 'Document format not supported. Please upload a PDF, JPG, or PNG file.';
        } else if (result.error?.code === 'FILE_TOO_LARGE') {
          errorMessage = 'Document file is too large. Please upload a smaller file.';
        } else if (result.error?.code === 'CORRUPTED_FILE') {
          errorMessage = 'Document appears to be corrupted. Please try uploading a different file.';
        } else if (result.error?.code === 'PROCESSING_TIMEOUT') {
          errorMessage = 'Document processing timed out. Please try again with a smaller file.';
        } else if (result.error?.message?.includes('Rate limit exceeded') || 
                   result.error?.message?.includes('Too many requests') ||
                   result.error?.message?.includes('429') ||
                   result.error?.message?.includes('quota') ||
                   result.error?.message?.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'Service is temporarily busy. Please wait a few minutes and try again.';
        }
        
        throw new Error(errorMessage);
      }

    } catch (error) {
      // Always log errors for debugging, but keep them concise
      console.error('❌ Document processing failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name,
        documentType
      });
      
      let errorMessage = error instanceof Error ? error.message : 'Document processing failed. Please try again.';
      
      // Provide user-friendly error messages for common issues
      if (errorMessage.includes('Rate limit exceeded') || 
          errorMessage.includes('Too many requests') || 
          errorMessage.includes('429') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Service is temporarily busy. Please wait a few minutes and try again.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Processing took too long. Please try again with a smaller file.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        errorMessage = 'Connection issue. Please check your internet and try again.';
      }
      
      setUploadState({
        status: 'failed',
        file,
        progress: 0,
        error: errorMessage
      });
      
      onStatusChange?.('failed');
    }
  }, [disabled, documentType, formId, formData, onFileSelect, onStatusChange, onVerificationComplete]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      // Show error if no files were dropped
      setUploadState({
        status: 'failed',
        progress: 0,
        error: 'No files detected. Please try dropping a file again.'
      });
      onStatusChange?.('failed');
      return;
    }
    
    if (files.length > 1) {
      // Show error if multiple files were dropped
      setUploadState({
        status: 'failed',
        progress: 0,
        error: 'Please drop only one file at a time.'
      });
      onStatusChange?.('failed');
      return;
    }
    
    handleFileSelect(files[0]);
  }, [disabled, handleFileSelect, onStatusChange]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      // User cancelled file selection - no error needed
      return;
    }
    
    if (files.length > 1) {
      // Multiple files selected (shouldn't happen with single file input, but just in case)
      setUploadState({
        status: 'failed',
        progress: 0,
        error: 'Please select only one file.'
      });
      onStatusChange?.('failed');
      e.target.value = '';
      return;
    }
    
    handleFileSelect(files[0]);
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  }, [handleFileSelect, onStatusChange]);

  // Handle click to select file
  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }
    
    if (uploadState.status !== 'idle') {
      return;
    }
    
    fileInputRef.current?.click();
  }, [disabled, uploadState.status]);

  // Retry upload
  const handleRetry = useCallback(() => {
    if (uploadState.file) {
      handleFileSelect(uploadState.file);
    } else {
      setUploadState({ status: 'idle', progress: 0 });
      onStatusChange?.('idle');
    }
  }, [uploadState.file, handleFileSelect, onStatusChange]);

  // Get status icon
  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return (
          <div className="relative">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <div className="absolute inset-0 w-10 h-10 border-3 border-blue-200 border-t-transparent rounded-full animate-spin" 
                 style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
          </div>
        );
      case 'verified':
        // Check if verification actually succeeded (isMatch: true)
        const isVerificationSuccess = uploadState.result?.verificationResult?.isMatch === true;
        
        if (isVerificationSuccess) {
          // SUCCESS: Show green checkmark
          return <CheckCircle className="w-10 h-10 text-green-500" />;
        } else if (uploadState.error) {
          // WARNING: Show yellow alert for low confidence or other warnings
          return <AlertCircle className="w-10 h-10 text-yellow-500" />;
        } else {
          // Default verified state
          return <CheckCircle className="w-10 h-10 text-green-500" />;
        }
      case 'failed':
        return <XCircle className="w-10 h-10 text-red-500" />;
      default:
        return <Upload className="w-10 h-10 text-gray-400" />;
    }
  };

  // Get status message
  const getStatusMessage = () => {
    switch (uploadState.status) {
      case 'uploading':
        if (uploadState.progress < 20) {
          return 'Starting upload...';
        } else if (uploadState.progress < 40) {
          return 'Uploading document...';
        } else {
          return 'Upload complete, preparing for processing...';
        }
      case 'processing':
        if (uploadState.progress < 60) {
          return 'Extracting text from document...';
        } else if (uploadState.progress < 80) {
          return 'Verifying document data...';
        } else if (uploadState.progress < 95) {
          return 'Finalizing verification...';
        } else {
          return 'Almost complete...';
        }
      case 'verified':
        // Check if verification actually succeeded (isMatch: true)
        const isVerificationSuccess = uploadState.result?.verificationResult?.isMatch === true;
        
        if (isVerificationSuccess) {
          // SUCCESS: Show success message
          return 'Document successfully verified';
        } else if (uploadState.error) {
          // WARNING: Show warning message
          return 'Document processed with warnings';
        } else {
          // Default verified message
          return 'Document successfully verified';
        }
      case 'failed':
        return getDetailedErrorMessage();
      default:
        return `Upload your ${documentType === 'cac' ? 'CAC certificate' : 'identification document'} here or click to browse`;
    }
  };

  // Get detailed error message based on error type
  const getDetailedErrorMessage = () => {
    if (!uploadState.error) {
      return 'Document processing failed';
    }

    // Check if it's a verification failure with specific field mismatches
    if (uploadState.result?.verificationResult?.mismatches) {
      const mismatches = uploadState.result.verificationResult.mismatches;
      const criticalMismatches = mismatches.filter(m => m.isCritical);
      
      if (criticalMismatches.length > 0) {
        const fieldNames = criticalMismatches.map(m => m.field).join(', ');
        return `Document verification failed: ${fieldNames} ${criticalMismatches.length > 1 ? 'do not match' : 'does not match'} your form data`;
      }
    }

    // Return the original error message if it's already descriptive
    return uploadState.error;
  };

  // Get border color based on status
  const getBorderColor = () => {
    switch (uploadState.status) {
      case 'verified':
        // Check if verification actually succeeded (isMatch: true)
        const isVerificationSuccess = uploadState.result?.verificationResult?.isMatch === true;
        
        if (isVerificationSuccess) {
          // SUCCESS: Green border
          return 'border-green-300';
        } else if (uploadState.error) {
          // WARNING: Yellow border for low confidence or warnings
          return 'border-yellow-300';
        } else {
          // Default verified state - green
          return 'border-green-300';
        }
      case 'failed':
        return 'border-red-300';
      case 'processing':
      case 'uploading':
        return 'border-blue-300';
      default:
        return 'border-gray-300 hover:border-gray-400';
    }
  };

  // Format value for display (handles Date objects and strings)
  const formatValueForDisplay = (value: any): string => {
    if (!value) return 'N/A';
    
    // If it's a Date object, format it as YYYY-MM-DD using local time
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return 'Invalid Date';
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // If it's a string that looks like a date in YYYY-MM-DD format, keep it as is
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    
    // If it's a string that looks like DD/MM/YYYY, convert to YYYY-MM-DD
    if (typeof value === 'string') {
      const ddmmyyyyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        return `${year}-${month}-${day}`;
      }
    }
    
    // For everything else, convert to string
    return String(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div
        ref={dropZoneRef}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${getBorderColor()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${uploadState.status === 'idle' ? 'hover:bg-gray-50' : ''}
          ${(uploadState.status === 'uploading' || uploadState.status === 'processing') ? 'animate-pulse' : ''}
        `}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={uploadState.status === 'verified' ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {getStatusMessage()}
            </p>
            
            {uploadState.status === 'idle' && (
              <p className="text-sm text-gray-500 mt-2">
                Upload your {documentType === 'cac' ? 'CAC certificate' : 'identification document'} for verification. 
                Supports PDF, JPG, PNG files up to 5MB
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
            <div className="w-full max-w-md">
              <div className="bg-gray-200 rounded-full h-4 mb-3 shadow-inner">
                <div 
                  className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                    uploadState.status === 'uploading' ? 'bg-blue-500' : 'bg-green-500'
                  } ${uploadState.progress > 0 ? 'shadow-sm' : ''}`}
                  style={{ 
                    width: `${Math.max(uploadState.progress, 5)}%`,
                    background: uploadState.status === 'uploading' 
                      ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' 
                      : 'linear-gradient(90deg, #10b981, #34d399)'
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-700 font-medium">
                <span>{uploadState.progress}% complete</span>
                <span className="text-right">
                  {uploadState.status === 'uploading' ? 
                    (uploadState.progress < 20 ? 'Starting upload...' :
                     uploadState.progress < 40 ? 'Uploading file...' : 'Upload complete') :
                   uploadState.progress < 60 ? 'Reading document...' :
                   uploadState.progress < 80 ? 'Verifying data...' : 'Almost done...'}
                </span>
              </div>
            </div>
          )}

          {/* File Info */}
          {uploadState.file && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{uploadState.file.name}</span>
              <span>({(uploadState.file.size / (1024 * 1024)).toFixed(1)} MB)</span>
            </div>
          )}

          {/* Success Actions - Show when verified and isMatch is true */}
          {uploadState.status === 'verified' && uploadState.result?.verificationResult?.isMatch === true && (
            <div className="mt-4 space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Document verified successfully
                </p>
                <p className="text-xs text-green-700 mt-1">
                  File is ready for submission
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadState({ status: 'idle', progress: 0 });
                  onFileRemove?.();
                  onStatusChange?.('idle');
                }}
                className="text-sm text-red-600 hover:text-red-800 hover:underline transition-colors"
              >
                Remove and upload different document
              </button>
            </div>
          )}
        </div>
      </div>



      {/* Low Confidence Warning */}
      {uploadState.status === 'verified' && uploadState.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900">Verification Warning</h4>
              <p className="text-sm text-yellow-700 mt-1">{uploadState.error}</p>
              
              <button
                onClick={handleRetry}
                className="mt-3 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded transition-colors"
              >
                Try Different Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadState.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Document Verification Failed</h4>
              <p className="text-sm text-red-700 mt-1">{getDetailedErrorMessage()}</p>
              
              {/* Show specific field mismatches if available */}
              {uploadState.result?.verificationResult?.mismatches && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-red-800">Issues found:</p>
                  {uploadState.result.verificationResult.mismatches
                    .filter(m => m.isCritical)
                    .map((mismatch, index) => (
                      <div key={index} className="bg-red-100 rounded p-2">
                        <p className="text-sm font-medium text-red-800">{mismatch.field}</p>
                        <p className="text-xs text-red-700">{mismatch.reason}</p>
                        {(mismatch as any).expectedValue && (mismatch as any).extractedValue && (
                          <div className="text-xs text-red-600 mt-1">
                            <span>Expected: {formatValueForDisplay((mismatch as any).expectedValue)}</span><br />
                            <span>Found: {formatValueForDisplay((mismatch as any).extractedValue)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
              
              <button
                onClick={handleRetry}
                className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mismatch Details */}
      {uploadState.analysis && uploadState.analysis.totalMismatches > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900">
                {uploadState.analysis.totalMismatches} Issue{uploadState.analysis.totalMismatches > 1 ? 's' : ''} Found
              </h4>
              
              <div className="mt-2 space-y-2">
                {uploadState.analysis.fieldAnalyses.map((field, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium text-yellow-800">
                      {field.field}: {field.severity} issue
                    </p>
                    <p className="text-yellow-700">{field.explanation}</p>
                    <p className="text-yellow-600 text-xs mt-1">{field.suggestedResolution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};