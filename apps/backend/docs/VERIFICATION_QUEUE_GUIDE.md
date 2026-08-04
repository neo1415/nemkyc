# Verification Queue System

## Overview

The Verification Queue System automatically manages verification requests during high system load. When the system is processing many verifications concurrently, new requests are queued and processed in the background, ensuring system stability and optimal performance.

## Features

- **Automatic Queuing**: Requests are automatically queued when system utilization exceeds 80% or queue size exceeds 50 items
- **Priority Support**: Higher priority requests are processed first
- **Background Processing**: Queued requests are processed automatically without user intervention
- **Progress Tracking**: Real-time status updates for queued requests
- **User Notifications**: Users are notified when their queued requests complete
- **Retry Logic**: Failed requests are automatically retried up to 3 times
- **Pause/Resume**: Bulk verification jobs can be paused and resumed

## How It Works

### 1. Request Submission

When a user initiates a bulk verification:

```typescript
POST /api/identity/lists/:listId/bulk-verify
```

The system checks current load:
- **Low Load**: Request is processed immediately
- **High Load**: Request is queued for later processing

### 2. Queue Processing

The queue processor:
- Processes up to 10 requests concurrently
- Maintains FIFO order with priority support
- Automatically retries failed requests
- Sends notifications on completion

### 3. Status Tracking

Users can check their queue status:

```typescript
GET /api/identity/queue/status/:queueId
```

Response includes:
- Current status (queued, processing, completed, failed)
- Position in queue
- Estimated wait time
- Processing results (when complete)

## API Endpoints

### Get Queue Status

```http
GET /api/identity/queue/status/:queueId
```

**Response:**
```json
{
  "queueId": "queue_123_abc",
  "status": "queued",
  "position": 5,
  "queueSize": 20,
  "estimatedWaitTime": 10,
  "queuedAt": "2024-01-15T10:30:00Z"
}
```

### Get User Queue Items

```http
GET /api/identity/queue/user
```

**Response:**
```json
{
  "items": [
    {
      "queueId": "queue_123_abc",
      "type": "bulk",
      "status": "queued",
      "position": 5,
      "queuedAt": "2024-01-15T10:30:00Z",
      "listId": "list_456"
    }
  ],
  "total": 1
}
```

### Get Queue Statistics (Admin Only)

```http
GET /api/identity/queue/stats
```

**Response:**
```json
{
  "queueSize": 20,
  "activeJobs": 8,
  "maxConcurrent": 10,
  "maxQueueSize": 1000,
  "isProcessing": true,
  "utilizationPercent": 80
}
```

## Configuration

Queue configuration is defined in `server-utils/verificationQueue.cjs`:

```javascript
const QUEUE_CONFIG = {
  maxConcurrent: 10,           // Maximum concurrent verifications
  maxQueueSize: 1000,          // Maximum queue size
  retryAttempts: 3,            // Number of retry attempts
  retryDelay: 2000,            // Delay between retries (ms)
  processingInterval: 100,     // Queue processing interval (ms)
  notificationThreshold: 5     // Notify user if queue time > X seconds
};
```

## User Experience

### When Request is Queued

Users see a notification:

```
Your bulk verification request has been queued.

Position: 5/20
Estimated wait: 10 seconds

You will be notified when it completes.
```

### Notification on Completion

Users receive a notification in the system:

```
Your bulk verification request has been completed.

Processed: 50 entries
Verified: 45 entries
Failed: 5 entries
```

## Frontend Integration

### Using the Queue Hook

```typescript
import { useVerificationQueue } from '@/hooks/useVerificationQueue';

function MyComponent() {
  const { 
    userQueueItems, 
    getQueueStatus, 
    pollQueueStatus 
  } = useVerificationQueue();

  // Poll queue status
  useEffect(() => {
    if (queueId) {
      const stopPolling = pollQueueStatus(queueId, (status) => {
        console.log('Queue status:', status);
      });

      return () => stopPolling.then(stop => stop());
    }
  }, [queueId]);

  return (
    <div>
      {userQueueItems.map(item => (
        <QueueNotification key={item.queueId} queueId={item.queueId} />
      ))}
    </div>
  );
}
```

### Queue Notification Component

```typescript
import { QueueNotification } from '@/components/identity/QueueNotification';

<QueueNotification
  queueId={queueId}
  onComplete={() => {
    // Refresh data
    fetchList();
  }}
  onError={(error) => {
    // Handle error
    console.error(error);
  }}
/>
```

## Performance Considerations

### High Load Detection

The system considers load "high" when:
- Utilization ≥ 80% (8+ concurrent jobs out of 10 max)
- OR Queue size > 50 items

### Queuing Threshold

Requests are queued only if:
- System is under high load
- AND request has > 20 entries

Small requests (≤ 20 entries) are always processed immediately.

### Processing Optimization

- Batch processing: 10 entries processed concurrently
- Delay between batches: 500ms to avoid API rate limits
- Automatic retry: Up to 3 attempts with 2-second delay
- Job cleanup: Completed jobs removed after 5 minutes

## Monitoring

### Admin Dashboard

Admins can monitor queue health:

```typescript
const stats = await getQueueStats();

console.log(`Queue Size: ${stats.queueSize}`);
console.log(`Active Jobs: ${stats.activeJobs}`);
console.log(`Utilization: ${stats.utilizationPercent}%`);
```

### Alerts

The system logs warnings when:
- Queue size exceeds 100 items
- Utilization stays above 90% for extended periods
- Requests fail after all retry attempts

## Troubleshooting

### Queue Not Processing

**Symptoms**: Items stuck in "queued" status

**Solutions**:
1. Check server logs for errors
2. Verify queue processor is running
3. Restart server if needed

### High Wait Times

**Symptoms**: Estimated wait time > 60 seconds

**Solutions**:
1. Increase `maxConcurrent` in configuration
2. Optimize verification API calls
3. Consider scaling horizontally

### Queue Full Errors

**Symptoms**: "Queue is full" error message

**Solutions**:
1. Increase `maxQueueSize` in configuration
2. Process queue faster (increase concurrency)
3. Implement queue persistence (Redis)

## Future Enhancements

### Planned Features

1. **Redis Integration**: Persistent queue storage
2. **Priority Levels**: User-defined priority levels
3. **Queue Analytics**: Historical queue performance metrics
4. **Email Notifications**: Email users when queued requests complete
5. **Webhook Support**: Notify external systems of completion

### Scalability

For production deployments with high load:

1. **Use Redis**: Replace in-memory queue with Redis
2. **Horizontal Scaling**: Run multiple queue processors
3. **Load Balancing**: Distribute requests across servers
4. **Monitoring**: Implement comprehensive monitoring (Prometheus, Grafana)

## Best Practices

1. **Monitor Queue Size**: Keep queue size < 100 for optimal performance
2. **Adjust Concurrency**: Tune `maxConcurrent` based on API rate limits
3. **Set Priorities**: Use priority for time-sensitive requests
4. **Handle Failures**: Implement proper error handling and user notifications
5. **Test Under Load**: Regularly test system behavior under high load

## Support

For issues or questions:
- Check server logs: `server.js` console output
- Review queue stats: `GET /api/identity/queue/stats`
- Contact support: nemsupport@nem-insurance.com
