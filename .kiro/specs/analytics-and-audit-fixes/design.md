# Design Document

## Overview

This design addresses three critical bugs in the analytics and audit logging system:

1. **Cost Tracker Calculation Bug**: The backend `/api/analytics/cost-tracking` endpoint only counts `successCalls` when calculating costs, excluding failed verification costs. This causes CostTracker to show ₦50 when the actual cost is ₦100 (including failed verifications).

2. **Missing User Feedback**: The CostTracker component's `handleSaveBudget` function calls `onUpdateBudget` but provides no visual feedback to users about success or failure.

3. **Wrong User Context in Audit Logs**: The audit logging captures broker context instead of customer context because the verification endpoint doesn't properly extract and pass customer information from the Identity_Entry to the audit logger.

## Architecture

### Component Interaction Flow

```
Customer clicks verification link with token
    ↓
POST /api/identity/verify/:token
    ↓
Query identity-entries collection by token
    ↓
Extract customer info from entry.data
    ↓
Call verification API (Datapro/VerifyData)
    ↓
Log to audit system with customer context
    ↓
Track API usage with correct cost
```

### Data Flow for Cost Tracking

```
api-usage collection
    ↓
Query by month + apiProvider
    ↓
Sum successCalls + failedCalls  ← FIX: Currently only sums successCalls
    ↓
Calculate cost (calls × price per call)
    ↓
Return to frontend
```

## Components and Interfaces

### Backend: Cost Tracking API

**File**: `server.js`
**Endpoint**: `GET /api/analytics/cost-tracking`

**Current Implementation** (Lines 13881-13889):
```javascript
dataproSnapshot.forEach(doc => {
  // Only count successful calls for cost calculation
  dataproCalls += doc.data().successCalls || 0;
});

verifydataSnapshot.forEach(doc => {
  // Only count successful calls for cost calculation
  verifydataCalls += doc.data().successCalls || 0;
});
```

**Fixed Implementation**:
```javascript
dataproSnapshot.forEach(doc => {
  const data = doc.data();
  // Count both successful and failed calls for accurate cost tracking
  dataproCalls += (data.successCalls || 0) + (data.failedCalls || 0);
});

verifydataSnapshot.forEach(doc => {
  const data = doc.data();
  // Count both successful and failed calls for accurate cost tracking
  verifydataCalls += (data.successCalls || 0) + (data.failedCalls || 0);
});
```

**Rationale**: API providers charge for both successful and failed verification attempts. The current implementation creates a discrepancy where MetricsOverview (which queries audit logs) shows the correct total, but CostTracker (which queries api-usage) shows only successful call costs.

### Frontend: Budget Save Feedback

**File**: `src/components/analytics/CostTracker.tsx`

**Current Implementation** (Lines 67-74):
```typescript
const handleSaveBudget = () => {
  if (onUpdateBudget && budgetConfig) {
    onUpdateBudget({
      ...budgetConfig,
      monthlyLimit,
    });
    setIsDialogOpen(false);
  }
};
```

**Fixed Implementation**:
```typescript
const handleSaveBudget = async () => {
  if (onUpdateBudget && budgetConfig) {
    try {
      await onUpdateBudget({
        ...budgetConfig,
        monthlyLimit,
      });
      toast.success('Budget configuration saved successfully');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save budget configuration');
      console.error('Budget save error:', error);
    }
  }
};
```

**Required Changes**:
1. Make `handleSaveBudget` async
2. Wrap `onUpdateBudget` call in try-catch
3. Import `toast` from 'sonner'
4. Display success toast on successful save
5. Display error toast on failure
6. Only close dialog on success

### Backend: Customer Context in Audit Logs

**File**: `server.js`
**Endpoint**: `POST /api/identity/verify/:token`

**Current Implementation** (Lines 10207-10217, 10337):
```javascript
// Extract user name for audit logging
let userName = 'anonymous';
if (firstName && lastName) {
  userName = `${firstName} ${lastName}`;
} else if (firstName) {
  userName = firstName;
} else if (lastName) {
  userName = lastName;
}

// Later in logVerificationComplete call:
userId: userName,  // ← This is correct
userEmail: entry.email || 'anonymous',  // ← This is correct
userName: userName,  // ← This is correct
```

**Issue**: The code is actually extracting customer information correctly from `entry.data`. The problem is that `entry.data` might not contain the customer information, or the extraction logic might be failing.

**Root Cause Analysis**:
Looking at the CustomerVerificationPage (lines 130-160), the token validation returns `entryInfo` which includes customer data. The issue is that when the identity entry is created, the customer data fields (firstName, lastName, email) need to be properly stored in the `data` field of the identity entry document.

**Fix Location**: The issue is in how identity entries are created when brokers upload CSV files. We need to ensure that customer information is properly stored in the `data` field.

**File**: `server.js` (identity entry creation endpoint)

**Required Changes**:
1. Ensure CSV upload properly maps customer fields to `entry.data`
2. Verify that `entry.data.firstName`, `entry.data.lastName`, and `entry.email` are populated
3. Add fallback logic to extract customer info from other fields if primary fields are missing

## Data Models

### Identity Entry Document

**Collection**: `identity-entries`

**Current Schema**:
```typescript
{
  listId: string;
  token: string;
  status: 'pending' | 'verified' | 'failed';
  verificationType: 'NIN' | 'CAC';
  email?: string;
  data: {
    firstName?: string;
    lastName?: string;
    first_name?: string;
    last_name?: string;
    'First Name'?: string;
    'Last Name'?: string;
    companyName?: string;
    company_name?: string;
    'Company Name'?: string;
    // ... other fields
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Required Fields for Audit Logging**:
- `data.firstName` or `data.first_name` or `data['First Name']` (for NIN)
- `data.lastName` or `data.last_name` or `data['Last Name']` (for NIN)
- `data.companyName` or `data.company_name` or `data['Company Name']` (for CAC)
- `email` (top-level field)

### API Usage Document

**Collection**: `api-usage`

**Schema**:
```typescript
{
  period: 'monthly';
  month: string; // YYYY-MM format
  apiProvider: 'datapro' | 'verifydata';
  successCalls: number;
  failedCalls: number;
  totalCalls: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Cost Calculation**:
- Datapro (NIN): ₦50 per call (success or failure)
- VerifyData (CAC): ₦100 per call (success or failure)
- Total cost = (successCalls + failedCalls) × price per call

### Audit Log Entry

**Collection**: `verification-audit-logs`

**Schema**:
```typescript
{
  eventType: 'verification_attempt';
  verificationType: 'NIN' | 'CAC';
  identityNumberMasked: string;
  userId: string; // Should be customer name
  userEmail: string; // Should be customer email
  userName: string; // Should be customer name
  userType: 'customer';
  ipAddress: string;
  result: 'success' | 'failure' | 'error';
  errorCode?: string;
  errorMessage?: string;
  apiProvider: 'datapro' | 'verifydata';
  cost: number;
  metadata: {
    userAgent: string;
    listId: string;
    entryId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cost Calculation Completeness

*For any* month and API provider, the total cost calculated by the Backend_Cost_API should equal the sum of (successCalls + failedCalls) multiplied by the provider's cost per call.

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Cost Consistency Across Components

*For any* time period, the total cost displayed in CostTracker should equal the total cost displayed in MetricsOverview.

**Validates: Requirements 1.3**

### Property 3: Customer Context in Audit Logs

*For any* customer-initiated verification through a token link, the audit log entry should contain the customer's name and email from the Identity_Entry, not the broker's information.

**Validates: Requirements 3.1, 3.2, 3.6, 5.2, 5.4**

### Property 4: Customer Info Display in AuditLogsViewer

*For any* audit log entry with customer information, the AuditLogsViewer should display the customer's name in the "User" column and the customer's email in the expanded row details.

**Validates: Requirements 3.4, 3.5**

### Property 5: Audit Log Completeness

*For any* verification attempt, the audit log entry should contain all required fields: verificationType, status, cost, timestamp, and customer information (name and email).

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**

## Error Handling

### Cost Tracking Errors

**Scenario**: API usage documents are missing or malformed
**Handling**: 
- Default to 0 for missing `successCalls` or `failedCalls`
- Log warning to console
- Continue calculation with available data

**Scenario**: Month parameter is invalid
**Handling**:
- Return 400 error with clear message
- Validate month format (YYYY-MM)
- Reject future months

### Budget Save Errors

**Scenario**: Network failure during save
**Handling**:
- Display error toast with message "Failed to save budget configuration"
- Keep dialog open
- Log error to console
- Allow user to retry

**Scenario**: Invalid budget value
**Handling**:
- Validate on frontend before sending
- Display error toast if validation fails
- Prevent API call for invalid values

### Audit Logging Errors

**Scenario**: Identity entry not found for token
**Handling**:
- Log error to console
- Use "Unknown Customer" as userName
- Use "anonymous" as userEmail
- Continue with verification (don't block customer)

**Scenario**: Customer data fields are missing
**Handling**:
- Try multiple field name variations (firstName, first_name, 'First Name')
- Fall back to "anonymous" if all variations are missing
- Log warning about missing customer data
- Continue with audit logging

**Scenario**: Audit logging fails
**Handling**:
- Log error to console
- Don't throw exception (don't block verification)
- Continue with verification flow

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:
- **Unit tests**: Verify specific examples, edge cases, and UI interactions
- **Property tests**: Verify universal properties across all inputs

### Unit Tests

**Cost Tracking**:
- Test cost calculation with only successful calls
- Test cost calculation with only failed calls
- Test cost calculation with both successful and failed calls
- Test cost calculation with missing fields (defaults to 0)
- Test cost calculation for different providers (Datapro vs VerifyData)

**Budget Save Feedback** (Examples from Requirements 2.1-2.4):
- Test success toast is displayed on successful save
- Test error toast is displayed on failed save
- Test dialog closes on success
- Test dialog remains open on failure

**Customer Context Extraction**:
- Test extraction with standard field names (firstName, lastName)
- Test extraction with alternate field names (first_name, last_name)
- Test extraction with Excel-style field names ('First Name', 'Last Name')
- Test extraction for CAC (companyName variations)
- Test fallback to "anonymous" when fields are missing (edge case from Requirement 5.3)
- Test error message logging when Identity_Entry not found (edge case from Requirement 4.5)

### Property-Based Tests

Each property test must run a minimum of 100 iterations and include a comment tag referencing the design property.

**Property 1: Cost Calculation Completeness**
- Tag: `Feature: analytics-and-audit-fixes, Property 1: Cost calculation includes both successful and failed calls`
- Generate random api-usage documents with varying successCalls and failedCalls
- Verify calculated cost equals (successCalls + failedCalls) × price
- Run for both Datapro (₦50) and VerifyData (₦100) providers
- **Validates: Requirements 1.1, 1.2, 1.4**

**Property 2: Cost Consistency Across Components**
- Tag: `Feature: analytics-and-audit-fixes, Property 2: Cost consistency between CostTracker and MetricsOverview`
- Generate random verification data
- Calculate cost using both CostTracker logic and MetricsOverview logic
- Verify both calculations produce the same result
- **Validates: Requirements 1.3**

**Property 3: Customer Context in Audit Logs**
- Tag: `Feature: analytics-and-audit-fixes, Property 3: Customer context in audit logs`
- Generate random identity entries with customer data (name, email)
- Simulate verification submission
- Verify audit log contains customer name and email, not broker information
- **Validates: Requirements 3.1, 3.2, 3.6, 5.2, 5.4**

**Property 4: Customer Info Display in AuditLogsViewer**
- Tag: `Feature: analytics-and-audit-fixes, Property 4: Customer info display in AuditLogsViewer`
- Generate random audit log entries with customer information
- Render AuditLogsViewer component
- Verify customer name appears in "User" column
- Verify customer email appears in expanded row details
- **Validates: Requirements 3.4, 3.5**

**Property 5: Audit Log Completeness**
- Tag: `Feature: analytics-and-audit-fixes, Property 5: Audit log completeness`
- Generate random verification attempts (both successful and failed)
- Create audit log entries
- Verify all required fields are present: verificationType, status, cost, timestamp, userName, userEmail
- Verify no required fields are null or undefined
- **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**

### Integration Tests

**End-to-End Cost Tracking**:
1. Create test verifications (successful and failed)
2. Query cost tracking API
3. Verify total cost includes both types
4. Verify CostTracker and MetricsOverview show same value

**End-to-End Budget Save**:
1. Open Budget Configuration dialog
2. Change budget value
3. Click Save
4. Verify toast appears
5. Verify dialog closes (on success) or stays open (on failure)
6. Verify budget value is persisted

**End-to-End Audit Logging**:
1. Create identity entry with customer data
2. Submit verification through token link
3. Query audit logs
4. Verify customer name and email appear in logs
5. Verify broker information does not appear

### Manual Testing Checklist

- [ ] Verify CostTracker shows ₦100 when there are both successful (₦50) and failed (₦50) verifications
- [ ] Verify MetricsOverview shows ₦100 for the same data
- [ ] Click "Save Budget" and verify success toast appears
- [ ] Simulate save failure and verify error toast appears
- [ ] Submit customer verification and check audit logs show customer name, not broker name
- [ ] Verify audit logs show customer email in expanded details
- [ ] Test with different CSV field name variations (firstName vs first_name vs 'First Name')
