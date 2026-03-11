// Hook for managing real-time document processing updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProcessingStatus, VerificationResult } from '../types/geminiDocumentVerification';
import { geminiRealtimeUpdates } from '../services/geminiRealtimeUpdates';

interface StatusUpdate {
  documentId: string;
  status: ProcessingStatus;
  progress: number;
  message: string;
  timestamp: Date;
  metadata?: any;
}

interface UseGeminiRealtimeUpdatesReturn {
  status: ProcessingStatus | null;
  progress: number;
  message: string;
  result: VerificationResult | null;
  error: string | null;
  isProcessing: boolean;
  isComplete: boolean;
  isFailed: boolean;
  startTracking: (documentId: string) => void;
  stopTracking: () => void;
  retry: () => void;
  clearStatus: () => void;
}

export const useGeminiRealtimeUpdates = (
  initialDocumentId?: string
): UseGeminiRealtimeUpdatesReturn => {
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(initialDocumentId || null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Derived states
  const isProcessing = status === 'processing' || status === 'uploading';
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';

  // Handle status updates
  const handleStatusUpdate = useCallback((update: StatusUpdate) => {
    setStatus(update.status);
    setProgress(update.progress);
    setMessage(update.message);
    
    // Extract result from metadata if available
    if (update.metadata?.result) {
      setResult(update.metadata.result);
    }
    
    // Extract error from metadata if available
    if (update.metadata?.error) {
      setError(update.metadata.error);
    } else if (update.status === 'failed') {
      setError(update.message);
    } else {
      setError(null);
    }
  }, []);

  // Start tracking a document
  const startTracking = useCallback((documentId: string) => {
    // Stop previous tracking
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }

    setCurrentDocumentId(documentId);
    
    // Subscribe to updates
    unsubscribeRef.current = geminiRealtimeUpdates.subscribe(
      documentId,
      handleStatusUpdate
    );
    
    // Try to establish WebSocket connection
    wsRef.current = geminiRealtimeUpdates.createWebSocketConnection(documentId);
    
    // Get current status if available
    const currentStatus = geminiRealtimeUpdates.getStatus(documentId);
    if (currentStatus) {
      handleStatusUpdate(currentStatus);
    } else {
      // Reset state for new document
      setStatus(null);
      setProgress(0);
      setMessage('');
      setResult(null);
      setError(null);
    }
  }, [handleStatusUpdate]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setCurrentDocumentId(null);
  }, []);

  // Retry processing
  const retry = useCallback(() => {
    if (currentDocumentId) {
      // Clear error state
      setError(null);
      setStatus('uploading');
      setProgress(0);
      setMessage('Retrying...');
      setResult(null);
      
      // Trigger retry (this would typically involve re-uploading the file)
      // The actual retry logic would be handled by the parent component
    }
  }, [currentDocumentId]);

  // Clear status
  const clearStatus = useCallback(() => {
    setStatus(null);
    setProgress(0);
    setMessage('');
    setResult(null);
    setError(null);
    
    if (currentDocumentId) {
      geminiRealtimeUpdates.clearStatus(currentDocumentId);
    }
  }, [currentDocumentId]);

  // Auto-start tracking if initial document ID is provided
  useEffect(() => {
    if (initialDocumentId) {
      startTracking(initialDocumentId);
    }
    
    return () => {
      stopTracking();
    };
  }, [initialDocumentId, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    status,
    progress,
    message,
    result,
    error,
    isProcessing,
    isComplete,
    isFailed,
    startTracking,
    stopTracking,
    retry,
    clearStatus
  };
};

// Hook for managing multiple document updates
export const useGeminiMultipleUpdates = () => {
  const [documentStatuses, setDocumentStatuses] = useState<Map<string, StatusUpdate>>(new Map());
  
  const updateDocumentStatus = useCallback((documentId: string, update: StatusUpdate) => {
    setDocumentStatuses(prev => new Map(prev.set(documentId, update)));
  }, []);
  
  const removeDocument = useCallback((documentId: string) => {
    setDocumentStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(documentId);
      return newMap;
    });
  }, []);
  
  const clearAllStatuses = useCallback(() => {
    setDocumentStatuses(new Map());
  }, []);
  
  return {
    documentStatuses,
    updateDocumentStatus,
    removeDocument,
    clearAllStatuses
  };
};