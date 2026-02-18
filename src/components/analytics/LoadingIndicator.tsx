import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadingStateManager } from '@/services/analytics/queryOptimization';

interface LoadingIndicatorProps {
  operationId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

/**
 * Loading Indicator Component
 * Shows loading state for analytics operations
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  operationId,
  className,
  size = 'md',
  text = 'Loading...',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (operationId) {
      // Check specific operation
      setIsLoading(loadingStateManager.isOperationLoading(operationId));
    }

    // Subscribe to loading state changes
    const unsubscribe = loadingStateManager.subscribe((loading) => {
      if (operationId) {
        setIsLoading(loadingStateManager.isOperationLoading(operationId));
      } else {
        setIsLoading(loading);
      }
    });

    return unsubscribe;
  }, [operationId]);

  if (!isLoading) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

export default LoadingIndicator;
