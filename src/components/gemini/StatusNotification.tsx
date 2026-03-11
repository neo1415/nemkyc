// Status Notification Component - shows user-friendly status messages

import React from 'react';
import { ProcessingStatus, VerificationResult } from '../../types/geminiDocumentVerification';

interface StatusNotificationProps {
  status: ProcessingStatus;
  message: string;
  result?: VerificationResult;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const StatusNotification: React.FC<StatusNotificationProps> = ({
  status,
  message,
  result,
  onDismiss,
  onRetry,
  className = ''
}) => {
  const getNotificationStyle = (status: ProcessingStatus): string => {
    switch (status) {
      case 'completed':
        return result?.isMatch 
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'processing':
      case 'uploading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (status: ProcessingStatus): string => {
    switch (status) {
      case 'completed':
        return result?.isMatch ? '✅' : '⚠️';
      case 'failed':
        return '❌';
      case 'processing':
      case 'uploading':
        return '⏳';
      default:
        return 'ℹ️';
    }
  };

  const getTitle = (status: ProcessingStatus): string => {
    switch (status) {
      case 'completed':
        return result?.isMatch ? 'Verification Successful' : 'Verification Issues Found';
      case 'failed':
        return 'Processing Failed';
      case 'processing':
        return 'Processing Document';
      case 'uploading':
        return 'Uploading Document';
      default:
        return 'Document Status';
    }
  };

  const renderMismatchSummary = () => {
    if (!result || result.isMatch || !result.mismatches) return null;

    const criticalCount = result.mismatches.filter(m => m.isCritical).length;
    const totalCount = result.mismatches.length;

    return (
      <div className="mt-3 space-y-2">
        <div className="text-sm">
          <strong>Issues found:</strong> {totalCount} total
          {criticalCount > 0 && (
            <span className="text-red-600 ml-2">
              ({criticalCount} critical)
            </span>
          )}
        </div>
        
        {result.mismatches.slice(0, 3).map((mismatch, index) => (
          <div key={index} className="text-xs bg-white bg-opacity-50 p-2 rounded">
            <div className="font-medium">
              {mismatch.field.charAt(0).toUpperCase() + mismatch.field.slice(1)}
              {mismatch.isCritical && (
                <span className="text-red-600 ml-1">*</span>
              )}
            </div>
            <div className="text-gray-600">
              Expected: {mismatch.expectedValue}
            </div>
            <div className="text-gray-600">
              Found: {mismatch.extractedValue}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Similarity: {mismatch.similarity}%
            </div>
          </div>
        ))}
        
        {result.mismatches.length > 3 && (
          <div className="text-xs text-gray-600">
            ... and {result.mismatches.length - 3} more issues
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    const buttons = [];

    if (status === 'failed' && onRetry) {
      buttons.push(
        <button
          key="retry"
          onClick={onRetry}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      );
    }

    if (onDismiss) {
      buttons.push(
        <button
          key="dismiss"
          onClick={onDismiss}
          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors ml-2"
        >
          Dismiss
        </button>
      );
    }

    return buttons.length > 0 ? (
      <div className="mt-3 flex justify-end">
        {buttons}
      </div>
    ) : null;
  };

  return (
    <div className={`notification border rounded-lg p-4 ${getNotificationStyle(status)} ${className}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl flex-shrink-0" role="img" aria-label={status}>
          {getIcon(status)}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">
            {getTitle(status)}
          </div>
          
          <div className="text-sm mt-1">
            {message}
          </div>
          
          {result && (
            <div className="mt-2 text-xs">
              <div>Confidence: {result.confidence}%</div>
              {result.processingTime && (
                <div>Processing time: {result.processingTime}ms</div>
              )}
            </div>
          )}
          
          {renderMismatchSummary()}
          {renderActionButtons()}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};