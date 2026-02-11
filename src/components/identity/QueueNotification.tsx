import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { useVerificationQueue } from '../../hooks/useVerificationQueue';

interface QueueNotificationProps {
  queueId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function QueueNotification({ queueId, onComplete, onError }: QueueNotificationProps) {
  const { getQueueStatus, pollQueueStatus } = useVerificationQueue();
  const [status, setStatus] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initial status fetch
    getQueueStatus(queueId).then(setStatus);

    // Start polling
    const stopPolling = pollQueueStatus(queueId, (newStatus) => {
      setStatus(newStatus);

      // Call callbacks
      if (newStatus.status === 'completed' && onComplete) {
        onComplete();
      } else if (newStatus.status === 'failed' && onError) {
        onError(newStatus.error || 'Verification failed');
      }
    });

    return () => {
      stopPolling.then(stop => stop());
    };
  }, [queueId]);

  if (!status || dismissed) {
    return null;
  }

  const getIcon = () => {
    switch (status.status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getVariant = () => {
    switch (status.status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getTitle = () => {
    switch (status.status) {
      case 'queued':
        return 'Verification Queued';
      case 'processing':
        return 'Processing Verification';
      case 'completed':
        return 'Verification Complete';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'Verification Status';
    }
  };

  const getDescription = () => {
    switch (status.status) {
      case 'queued':
        return `Your request is queued. Position: ${status.position}/${status.queueSize}. Estimated wait: ${status.estimatedWaitTime}s`;
      case 'processing':
        return 'Your verification request is being processed...';
      case 'completed':
        return 'Your verification request has been completed successfully.';
      case 'failed':
        return `Verification failed: ${status.error || 'Unknown error'}`;
      default:
        return '';
    }
  };

  return (
    <Alert variant={getVariant()} className="mb-4">
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle>{getTitle()}</AlertTitle>
          <AlertDescription>{getDescription()}</AlertDescription>
          
          {status.status === 'queued' && status.estimatedWaitTime && (
            <div className="mt-2">
              <Progress value={0} className="h-2" />
            </div>
          )}
        </div>
        
        {(status.status === 'completed' || status.status === 'failed') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        )}
      </div>
    </Alert>
  );
}
