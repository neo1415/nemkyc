import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface DocumentVerificationError {
  code: string;
  message: string;
  details?: {
    field?: string;
    expected?: string;
    actual?: string;
    reason?: string;
  }[];
}

interface UseDocumentVerificationErrorReturn {
  showError: (error: DocumentVerificationError, documentType?: 'cac' | 'nin' | 'document') => void;
  showErrorModal: boolean;
  currentError: DocumentVerificationError | null;
  closeErrorModal: () => void;
}

export const useDocumentVerificationError = (): UseDocumentVerificationErrorReturn => {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [currentError, setCurrentError] = useState<DocumentVerificationError | null>(null);

  const getDetailedErrorMessage = (error: DocumentVerificationError): string => {
    switch (error.code) {
      case 'OCR_FAILED':
        return 'Could not extract text from document. Please ensure the document is clear and readable.';
      case 'VERIFICATION_FAILED':
        if (error.details && error.details.length > 0) {
          const fields = error.details.map(d => d.field).filter(Boolean).join(', ');
          return `Document verification failed: ${fields} ${error.details.length > 1 ? 'do not match' : 'does not match'} your form data.`;
        }
        return 'Document verification failed. Please check that the document matches your form data.';
      case 'DATA_MISMATCH':
        return 'The information in your document does not match the form data. Please verify all details are correct.';
      case 'UNSUPPORTED_FORMAT':
        return 'Document format not supported. Please upload a PDF, JPG, or PNG file.';
      case 'FILE_TOO_LARGE':
        return 'Document file is too large. Please upload a smaller file.';
      case 'CORRUPTED_FILE':
        return 'Document appears to be corrupted. Please try uploading a different file.';
      case 'PROCESSING_TIMEOUT':
        return 'Document processing timed out. Please try again with a smaller file.';
      case 'API_UNAVAILABLE':
        return 'Document processing service is temporarily unavailable. Please try again later.';
      case 'API_RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.';
      case 'NETWORK_ERROR':
        return 'Network connection error. Please check your connection and try again.';
      default:
        return error.message || 'Document processing failed. Please try again.';
    }
  };

  const showError = (error: DocumentVerificationError, documentType: 'cac' | 'nin' | 'document' = 'document') => {
    const detailedMessage = getDetailedErrorMessage(error);
    
    // Show toast notification
    toast({
      title: 'Document Verification Failed',
      description: detailedMessage,
      variant: 'destructive',
      duration: 8000, // Show longer for error messages
    });

    // Set error for modal if needed
    setCurrentError(error);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setCurrentError(null);
  };

  return {
    showError,
    showErrorModal,
    currentError,
    closeErrorModal
  };
};