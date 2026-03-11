import React from 'react';
import { XCircle, AlertTriangle, FileText, RefreshCw } from 'lucide-react';

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

interface DocumentVerificationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error: DocumentVerificationError;
  documentType?: 'cac' | 'nin' | 'document';
}

export const DocumentVerificationErrorModal: React.FC<DocumentVerificationErrorModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  error,
  documentType = 'document'
}) => {
  if (!isOpen) return null;

  const getErrorTitle = () => {
    switch (error.code) {
      case 'OCR_FAILED':
        return 'Could Not Read Document';
      case 'VERIFICATION_FAILED':
        return 'Document Verification Failed';
      case 'DATA_MISMATCH':
        return 'Document Data Mismatch';
      case 'UNSUPPORTED_FORMAT':
        return 'Unsupported File Format';
      case 'FILE_TOO_LARGE':
        return 'File Too Large';
      case 'CORRUPTED_FILE':
        return 'Corrupted File';
      case 'PROCESSING_TIMEOUT':
        return 'Processing Timeout';
      default:
        return 'Document Processing Failed';
    }
  };

  const getErrorIcon = () => {
    switch (error.code) {
      case 'OCR_FAILED':
      case 'CORRUPTED_FILE':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'VERIFICATION_FAILED':
      case 'DATA_MISMATCH':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'PROCESSING_TIMEOUT':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getHelpfulSuggestions = () => {
    switch (error.code) {
      case 'OCR_FAILED':
        return [
          'Ensure the document is clear and not blurry',
          'Check that the text is not too small or faded',
          'Try scanning at a higher resolution',
          'Make sure the document is well-lit in the photo'
        ];
      case 'VERIFICATION_FAILED':
      case 'DATA_MISMATCH':
        return [
          'Double-check that you uploaded the correct document',
          'Verify that the information in your form matches the document exactly',
          'Check for typos in names, dates, or numbers',
          'Ensure the document belongs to the person/company in the form'
        ];
      case 'UNSUPPORTED_FORMAT':
        return [
          'Use PDF, PNG, or JPEG format only',
          'Convert your document to a supported format',
          'Avoid using HEIC, WEBP, or other uncommon formats'
        ];
      case 'FILE_TOO_LARGE':
        return [
          'Compress your document to reduce file size',
          'Use a lower resolution when scanning',
          `Keep file size under ${documentType === 'cac' ? '50MB' : '10MB'}`
        ];
      case 'CORRUPTED_FILE':
        return [
          'Try uploading the document again',
          'Re-scan or re-photograph the document',
          'Check that the file opens correctly on your device'
        ];
      case 'PROCESSING_TIMEOUT':
        return [
          'Try uploading a smaller file',
          'Ensure you have a stable internet connection',
          'Try again during off-peak hours'
        ];
      default:
        return [
          'Check your internet connection',
          'Try uploading the document again',
          'Contact support if the problem persists'
        ];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start space-x-3 mb-4">
            {getErrorIcon()}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {getErrorTitle()}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {error.message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Specific field errors */}
          {error.details && error.details.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Issues Found:
              </h4>
              <div className="space-y-2">
                {error.details.map((detail, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                    {detail.field && (
                      <p className="text-sm font-medium text-red-800">
                        {detail.field}
                      </p>
                    )}
                    {detail.reason && (
                      <p className="text-sm text-red-700 mt-1">
                        {detail.reason}
                      </p>
                    )}
                    {detail.expected && detail.actual && (
                      <div className="text-xs text-red-600 mt-2 space-y-1">
                        <div>
                          <span className="font-medium">Expected:</span> {detail.expected}
                        </div>
                        <div>
                          <span className="font-medium">Found:</span> {detail.actual}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Helpful suggestions */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              What you can try:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {getHelpfulSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {onRetry && (
              <button
                onClick={() => {
                  onRetry();
                  onClose();
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};