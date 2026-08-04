# Verification Queue System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                 │
│                                                                      │
│  User clicks "Verify All Unverified" button                         │
│  Request: POST /api/identity/lists/:listId/bulk-verify              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LOAD CHECK                                      │
│                                                                      │
│  Check current system load:                                          │
│  - Queue utilization ≥ 80%?                                          │
│  - Queue size > 50?                                                  │
│  - Request size > 20 entries?                                        │
└──────────────┬────────────────────────────┬─────────────────────────┘
               │                            │
        LOW LOAD                     HIGH LOAD
               │                            │
               ▼                            ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   IMMEDIATE PROCESSING   │    │    QUEUE REQUEST         │
│                          │    │                          │
│  - Create job ID         │    │  - Add to queue          │
│  - Start processing      │    │  - Assign priority       │
│  - Return job ID         │    │  - Calculate position    │
│  - Poll for progress     │    │  - Estimate wait time    │
└──────────────┬───────────┘    └──────────┬───────────────┘
               │                            │
               │                            ▼
               │                 ┌──────────────────────────┐
               │                 │   RETURN QUEUE INFO      │
               │                 │                          │
               │                 │  Response:               │
               │                 │  - queueId               │
               │                 │  - position: 5/20        │
               │                 │  - estimatedWait: 10s    │
               │                 │  - statusUrl             │
               │                 └──────────┬───────────────┘
               │                            │
               │                            ▼
               │                 ┌──────────────────────────┐
               │                 │   QUEUE PROCESSOR        │
               │                 │                          │
               │                 │  - Process FIFO          │
               │                 │  - Max 10 concurrent     │
               │                 │  - Retry on failure      │
               │                 │  - Update status         │
               │                 └──────────┬───────────────┘
               │                            │
               └────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VERIFICATION EXECUTION                            │
│                                                                      │
│  executeBulkVerification():                                          │
│  1. Process entries in batches (10 at a time)                       │
│  2. Call Datapro API for each entry                                 │
│  3. Update entry status (verified/failed)                           │
│  4. Track progress (processed/verified/failed/skipped)              │
│  5. Update list statistics                                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPLETION                                      │
│                                                                      │
│  - Mark job as complete                                              │
│  - Send notification to user                                         │
│  - Update Firestore with results                                     │
│  - Clean up after 5 minutes                                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Queue State Machine

```
┌─────────┐
│ QUEUED  │ ◄─── Initial state when request is queued
└────┬────┘
     │
     │ Queue processor picks up item
     │
     ▼
┌─────────────┐
│ PROCESSING  │ ◄─── Item is being processed
└────┬────┬───┘
     │    │
     │    │ Error occurs
     │    │
     │    ▼
     │  ┌─────────┐
     │  │ RETRY   │ ◄─── Retry up to 3 times
     │  └────┬────┘
     │       │
     │       │ Max retries reached
     │       │
     │       ▼
     │  ┌─────────┐
     │  │ FAILED  │ ◄─── Terminal state (error)
     │  └─────────┘
     │
     │ Success
     │
     ▼
┌───────────┐
│ COMPLETED │ ◄─── Terminal state (success)
└───────────┘
```

## Priority Queue Structure

```
┌─────────────────────────────────────────────────────────┐
│                    VERIFICATION QUEUE                    │
│                                                          │
│  Priority 10 (High)                                      │
│  ┌────────────────────────────────────────────────┐     │
│  │ Item 1: Urgent verification (20 entries)      │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Priority 5 (Medium)                                     │
│  ┌────────────────────────────────────────────────┐     │
│  │ Item 2: Standard verification (50 entries)    │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Priority 0 (Normal)                                     │
│  ┌────────────────────────────────────────────────┐     │
│  │ Item 3: Bulk verification (100 entries)       │     │
│  ├────────────────────────────────────────────────┤     │
│  │ Item 4: Bulk verification (75 entries)        │     │
│  ├────────────────────────────────────────────────┤     │
│  │ Item 5: Bulk verification (150 entries)       │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Queue Size: 5 items                                     │
│  Max Size: 1000 items                                    │
└─────────────────────────────────────────────────────────┘
```

## Concurrent Processing

```
┌─────────────────────────────────────────────────────────┐
│              ACTIVE JOBS (Max 10 concurrent)             │
│                                                          │
│  Slot 1: ████████████████████ Processing (80%)          │
│  Slot 2: ████████████████████ Processing (80%)          │
│  Slot 3: ████████████████████ Processing (80%)          │
│  Slot 4: ████████████████████ Processing (80%)          │
│  Slot 5: ████████████████████ Processing (80%)          │
│  Slot 6: ████████████████████ Processing (80%)          │
│  Slot 7: ████████████████████ Processing (80%)          │
│  Slot 8: ████████████████████ Processing (80%)          │
│  Slot 9: ░░░░░░░░░░░░░░░░░░░░ Available                 │
│  Slot 10: ░░░░░░░░░░░░░░░░░░░ Available                 │
│                                                          │
│  Utilization: 80% (8/10 slots in use)                   │
│  Status: HIGH LOAD - New requests will be queued        │
└─────────────────────────────────────────────────────────┘
```

## Notification Flow

```
┌─────────────────────────────────────────────────────────┐
│                    QUEUE ITEM                            │
│                                                          │
│  Status: QUEUED                                          │
│  Position: 5/20                                          │
│  Estimated Wait: 10 seconds                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Wait time > 5 seconds
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              IN-APP NOTIFICATION                         │
│                                                          │
│  🕐 Verification Queued                                  │
│  Your request is queued. Position: 5/20                 │
│  Estimated wait: 10s                                     │
│                                                          │
│  [View Status]                                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Processing starts
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              IN-APP NOTIFICATION                         │
│                                                          │
│  ⚙️ Processing Verification                              │
│  Your verification request is being processed...         │
│                                                          │
│  [View Progress]                                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Processing completes
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              IN-APP NOTIFICATION                         │
│                                                          │
│  ✅ Verification Complete                                │
│  Your verification request has been completed.           │
│                                                          │
│  Processed: 50 | Verified: 45 | Failed: 5               │
│                                                          │
│  [View Results] [Dismiss]                                │
└─────────────────────────────────────────────────────────┘
```

## System Capacity

```
┌─────────────────────────────────────────────────────────┐
│                  SYSTEM CAPACITY                         │
│                                                          │
│  Max Concurrent Jobs:        10                          │
│  Max Queue Size:             1000 items                  │
│  Avg Verification Time:      2 seconds                   │
│  Throughput:                 ~300 verifications/minute   │
│                                                          │
│  Current Load:                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Active Jobs:    8/10  (80%)                     │    │
│  │ Queue Size:     20/1000 (2%)                    │    │
│  │ Status:         HIGH LOAD                       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Load Thresholds:                                        │
│  - Normal:    < 80% utilization, < 50 queued             │
│  - High:      ≥ 80% utilization OR > 50 queued           │
│  - Critical:  ≥ 95% utilization OR > 500 queued          │
└─────────────────────────────────────────────────────────┘
```

## Error Handling & Retry

```
┌─────────────────────────────────────────────────────────┐
│                    RETRY LOGIC                           │
│                                                          │
│  Attempt 1: ❌ Failed (Network error)                    │
│             ⏱️ Wait 2 seconds                            │
│                                                          │
│  Attempt 2: ❌ Failed (API timeout)                      │
│             ⏱️ Wait 2 seconds                            │
│                                                          │
│  Attempt 3: ✅ Success                                   │
│                                                          │
│  Max Attempts: 3                                         │
│  Retry Delay: 2000ms                                     │
│  Success Rate: 33% (1/3)                                 │
└─────────────────────────────────────────────────────────┘

If all attempts fail:
┌─────────────────────────────────────────────────────────┐
│              FAILURE NOTIFICATION                        │
│                                                          │
│  ❌ Verification Failed                                  │
│  Your verification request failed after 3 attempts.      │
│                                                          │
│  Error: Network timeout                                  │
│                                                          │
│  [Retry] [Contact Support]                               │
└─────────────────────────────────────────────────────────┘
```

## Monitoring Dashboard (Admin)

```
┌─────────────────────────────────────────────────────────┐
│              QUEUE MONITORING DASHBOARD                  │
│                                                          │
│  Real-time Statistics:                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Queue Size:         20 items                    │    │
│  │ Active Jobs:        8/10 (80%)                  │    │
│  │ Avg Wait Time:      12 seconds                  │    │
│  │ Throughput:         280 verifications/min       │    │
│  │ Success Rate:       95%                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Queue Health:                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Status:    ⚠️ HIGH LOAD                         │    │
│  │ Trend:     📈 Increasing                        │    │
│  │ Action:    Consider scaling                     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Recent Activity:                                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 10:30:15 - Item queued (user: broker@nem.com)  │    │
│  │ 10:30:12 - Item completed (50 verified)        │    │
│  │ 10:30:08 - Item processing started             │    │
│  │ 10:30:05 - Item queued (user: admin@nem.com)   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```
