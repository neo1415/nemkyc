// Progress Indicator Component - shows real-time processing progress

import React from 'react';
import { ProcessingStatus } from '../../types/geminiDocumentVerification';

interface ProgressIndicatorProps {
  status: ProcessingStatus;
  progress: number;
  message: string;
  stage?: string;
  estimatedTimeRemaining?: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status,
  progress,
  message,
  stage,
  estimatedTimeRemaining,
  className = ''
}) => {
  const getStatusColor = (status: ProcessingStatus): string => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ProcessingStatus): string => {
    switch (status) {
      case 'uploading':
        return '📤';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${Math.round(remainingSeconds)}s`;
  };

  return (
    <div className={`progress-indicator ${className}`}>
      <div className="flex items-center space-x-3 mb-2">
        <span className="text-2xl" role="img" aria-label={status}>
          {getStatusIcon(status)}
        </span>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {stage || status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">
              {progress}%
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {message}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(status)}`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Processing progress: ${progress}%`}
        />
      </div>
      
      {/* Estimated Time Remaining */}
      {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Estimated time remaining: {formatTime(estimatedTimeRemaining)}
        </div>
      )}
      
      {/* Loading Animation for Active States */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="flex justify-center mt-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};