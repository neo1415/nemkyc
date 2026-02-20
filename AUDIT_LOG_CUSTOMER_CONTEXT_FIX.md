# Audit Log Customer Context Fix

## Issue
Audit logs were showing broker context (broker email, broker ID) instead of customer context (customer name, customer email) for verifications. This made it difficult to track which customer performed which verification.

Additionally, device information (IP address, user agent) was showing "bulk_operation" for bulk verifications instead of indicating it was a broker-initiated operation.

## Root Cause
The `logVerificationComplete()` function was calling `lookupBrokerInfo()` and using the broker's information for audit logging, overriding the customer information passed in the parameters.

## Fix Applied

### 1. Updated `logVerificationComplete()` Function (Lines 168-240)
**Changed**: The function now uses customer information from parameters for audit logging, while still tracking broker information for cost attribution.

**Key Changes**:
- Added `userType` parameter (defaults to 'customer')
- Audit logs now use `userId`, `userEmail`, `userName` from parameters (customer info)
- API usage tracking still uses broker info for cost attribution
- Broker information is stored in metadata for reference

**Before**:
```javascript
// Log verification attempt with complete data (single entry)
await logVerificationAttempt({
  verificationType,
  identityNumber,
  userId: brokerInfo.userId,  // ❌ Broker context
  userEmail: brokerInfo.userEmail,  // ❌ Broker context
  userName: brokerInfo.userName,  // ❌ Broker context
  userType: 'customer',
  // ...
});
```

**After**:
```javascript
// Log verification attempt with CUSTOMER context (not broker)
await logVerificationAttempt({
  verificationType,
  identityNumber,
  userId: userId,  // ✅ Customer name/ID from params
  userEmail: userEmail,  // ✅ Customer email from params
  userName: userName,  // ✅ Customer name from params
  userType: userType,  // ✅ Customer or broker
  // ...
  metadata: {
    ...metadata,
    listId,
    entryId,
    brokerUserId: brokerInfo.userId,  // ✅ Track broker for reference
    brokerEmail: brokerInfo.userEmail
  }
});
```

### 2. Updated Bulk Verification Logging (Lines 11877-12050)
**Changed**: Bulk verification now extracts customer name from entry data and logs with customer context.

**Key Changes**:
- Extract customer name from `verificationData` (firstName + lastName for NIN, companyName for CAC)
- Set `userId` and `userName` to customer name (not broker ID)
- Added `userType: 'customer'` to mark as customer verification
- Added `initiatedBy: userId` in metadata to track which broker initiated the bulk operation

**Before**:
```javascript
await logVerificationComplete(db, {
  // ...
  userId,  // ❌ Broker UID
  userName: 'Bulk Operation',  // ❌ Generic label
  ipAddress: 'bulk_operation',
  metadata: {
    bulkOperation: true
  }
});
```

**After**:
```javascript
// Extract customer name from entry data
let customerName = 'anonymous';
if (verificationData.firstName && verificationData.lastName) {
  customerName = `${verificationData.firstName} ${verificationData.lastName}`;
}

await logVerificationComplete(db, {
  // ...
  userId: customerName,  // ✅ Customer name
  userName: customerName,  // ✅ Customer name for display
  userType: 'customer',  // ✅ Mark as customer verification
  ipAddress: 'bulk_operation',
  metadata: {
    bulkOperation: true,
    initiatedBy: userId  // ✅ Track broker who initiated
  }
});
```

### 3. Updated Token-Based Verification Logging (Lines 10340-10600)
**Changed**: Added `userType: 'customer'` parameter to all token-based verification logging calls.

**Locations Updated**:
- NIN verification success (Line ~10350)
- NIN verification failure (Line ~10385)
- CAC verification success (Line ~10545)
- CAC verification failure (Line ~10580)

### 4. Updated Demo Endpoint Logging (Lines 4525-4590)
**Changed**: Added `userType: 'broker'` to demo/test endpoint logging to explicitly mark these as broker-initiated tests.

## Impact

### What Changed
1. **Audit logs now show customer information**:
   - User column: Customer name (e.g., "John Doe" or "ABC Company Ltd")
   - Email: Customer email address
   - User Type: "customer" (or "broker" for demo endpoints)

2. **Broker information is preserved**:
   - Stored in `metadata.brokerUserId` and `metadata.brokerEmail`
   - API usage tracking still attributes costs to the correct broker

3. **Bulk operations are clearly marked**:
   - `metadata.bulkOperation: true`
   - `metadata.initiatedBy` contains broker UID who started the bulk operation
   - IP address shows "bulk_operation" to indicate server-side processing

### What Didn't Change
- API usage tracking and cost attribution (still uses broker context)
- Cost tracking dashboard (still shows broker costs correctly)
- Token-based verification flow (customers still verify via email links)

## Device Information & IP Address

### Token-Based Verifications (Customer Direct)
- **IP Address**: Customer's actual IP (`req.ip`)
- **User Agent**: Customer's browser/device
- **Context**: Customer information (name, email)

### Bulk Verifications (Broker-Initiated)
- **IP Address**: "bulk_operation" (indicates server-side processing)
- **User Agent**: Not captured (server-side operation)
- **Context**: Customer information with broker tracked in metadata

This is correct because:
- Token-based: Customer clicks link → makes HTTP request → their IP/device captured
- Bulk: Broker initiates → server processes → no customer device involved

## Testing Recommendations

1. **Test token-based verification**:
   - Create identity entry
   - Send verification link to customer
   - Customer completes verification
   - Check audit logs show customer name and email

2. **Test bulk verification**:
   - Upload CSV with customer data
   - Run bulk verification
   - Check audit logs show customer names (not "Bulk Operation")
   - Verify `metadata.initiatedBy` contains broker UID

3. **Test demo endpoints**:
   - Use demo NIN/CAC verification
   - Check audit logs show broker context with `userType: 'broker'`

## Files Modified
- `server.js` (Lines 168-240, 4525-4590, 10340-10600, 11877-12050)

## Related Requirements
- Requirement 3.1: Audit logs must capture customer context
- Requirement 3.2: Customer name and email must be displayed
- Requirement 3.6: User type must distinguish between customer and broker
- Requirement 5.2: Customer data extraction must handle field variations
