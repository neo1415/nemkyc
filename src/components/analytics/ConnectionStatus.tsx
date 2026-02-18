import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { connectionMonitor } from '@/utils/errorHandling';

interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Connection Status Indicator Component
 * Displays real-time connection status with visual indicator
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showLabel = true,
}) => {
  const [connected, setConnected] = useState(connectionMonitor.getStatus());

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = connectionMonitor.subscribe(setConnected);

    // Start periodic connectivity checks
    connectionMonitor.startPeriodicCheck(30000); // Check every 30 seconds

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {connected ? (
        <>
          <Wifi className="h-4 w-4 text-green-600" />
          {showLabel && (
            <span className="text-sm text-green-600">Connected</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-600" />
          {showLabel && (
            <span className="text-sm text-red-600">Disconnected</span>
          )}
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
