# Bulk Verification Duplicate Prevention - Integration Tests

## Overview

These integration tests validate the complete duplicate prevention system end-to-end, including:
- Cross-list duplicate detection
- Confirmation modal flow with analysis
- Polling lifecycle management
- Cost savings tracking and audit logging

## Test Files

1. **duplicatePrevention.integration.test.ts** - Tests duplicate detection across lists
2. **confirmationModal.integration.test.ts** - Tests analysis endpoint and confirmation flow
3. **pollingLifecycle.integration.test.ts** - Tests polling behavior and completion signals
4. **costSavings.integration.test.ts** - Tests cost calculation and savings tracking

## Prerequisites

### 1. Firebase Configuration

These tests require a Firebase project with proper configuration:

- **Environment Variables**: Ensure `.env.local` contains valid Firebase credentials:
  ```
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  ```

### 2. Firestore Rules

The Firestore rules must allow test writes. For testing purposes, you may need to temporarily relax rules or use Firebase Admin SDK with service account credentials.

**Current Limitation**: The tests are designed to run against a real Firebase instance but require backend API authentication. Direct client-side writes to `identity-entries` and `identity-activity-logs` are restricted by security rules.

### 3. Backend Server

The integration tests make HTTP requests to the backend API endpoints:
- `POST /api/identity/lists/:listId/analyze-bulk-verify`
- `POST /api/identity/lists/:listId/bulk-verify`
- `GET /api/identity/bulk-verify/:jobId/status`

**The backend server must be running** for these tests to pass.

### 4. Firestore Indexes

Required indexes are defined in `firestore.indexes.json` and must be deployed:

```bash
firebase deploy --only firestore:indexes
```

Key index for duplicate detection:
```json
{
  "collectionGroup": "identity-entries",
  "fields": [
    { "fieldPath": "identityType", "order": "ASCENDING" },
    { "fieldPath": "identityValue", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

## Running the Tests

### Option 1: Run All Integration Tests

```bash
npm test src/__tests__/bulk-verification-duplicate-prevention --run
```

### Option 2: Run Individual Test Files

```bash
# Duplicate prevention
npm test src/__tests__/bulk-verification-duplicate-prevention/duplicatePrevention.integration.test.ts --run

# Confirmation modal
npm test src/__tests__/bulk-verification-duplicate-prevention/confirmationModal.integration.test.ts --run

# Polling lifecycle
npm test src/__tests__/bulk-verification-duplicate-prevention/pollingLifecycle.integration.test.ts --run

# Cost savings
npm test src/__tests__/bulk-verification-duplicate-prevention/costSavings.integration.test.ts --run
```

## Test Environment Setup

### For Local Development

1. **Start the backend server**:
   ```bash
   node server.js
   ```

2. **Ensure Firebase emulators are running** (optional, for isolated testing):
   ```bash
   firebase emulators:start
   ```

3. **Update environment variables** to point to emulators if using them:
   ```
   VITE_FIREBASE_AUTH_DOMAIN=localhost
   FIRESTORE_EMULATOR_HOST=localhost:8080
   ```

### For CI/CD

These tests should be run in a dedicated test environment with:
- Test Firebase project
- Test backend server
- Proper authentication credentials
- Cleanup scripts to remove test data after runs

## Known Issues

### Permission Errors

If you see `PERMISSION_DENIED` errors, it means:
1. The Firestore rules are blocking client-side writes (by design for security)
2. The tests need to use the backend API exclusively (which they do)
3. The backend server may not be running or accessible

**Solution**: Ensure the backend server is running and accessible at the expected URL.

### Test Data Cleanup

The tests include `afterEach` hooks to clean up test data, but if tests fail mid-execution, orphaned data may remain. Run the cleanup script periodically:

```bash
node scripts/delete-verified-test-records.js
```

## Test Coverage

These integration tests validate:

✅ Requirements 1.1-1.4: Cross-list duplicate detection
✅ Requirements 3.1-3.6: Confirmation modal flow
✅ Requirements 4.1-4.3: Polling lifecycle
✅ Requirements 6.2, 6.4: Cost savings tracking

## Troubleshooting

### Tests Timeout

If tests timeout waiting for bulk verification to complete:
- Check backend server logs for errors
- Verify API provider credentials are configured
- Increase timeout values in test files

### Firestore Connection Issues

If tests can't connect to Firestore:
- Verify Firebase credentials in `.env.local`
- Check network connectivity
- Ensure Firebase project is active

### Backend API Errors

If API calls return errors:
- Check backend server is running on expected port
- Verify environment variables are loaded
- Check server logs for detailed error messages

## Future Improvements

1. **Use Firebase Admin SDK**: Rewrite tests to use Admin SDK for direct Firestore access, bypassing security rules
2. **Mock Backend API**: Create mock server for faster, isolated testing
3. **Parallel Execution**: Optimize tests to run in parallel with isolated data
4. **Emulator Support**: Full support for Firebase emulators for offline testing
