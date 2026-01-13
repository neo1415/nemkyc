# Design Document: Identity Collection System

## Overview

The Identity Collection System is a flexible solution for collecting missing NIN/CAC information from legacy insurance customers. It accepts any CSV/Excel file structure, creates dynamic tables, and appends verified identity data back to the original data.

Key design principles:
1. **Flexibility** - Accept any file structure, auto-detect emails
2. **Simplicity** - User-friendly naming, intuitive workflow
3. **Data integrity** - Preserve original data, append verification results
4. **Enterprise features** - Audit logging, progress tracking, secure links

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Admin Portal                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Upload Page    │  │  List Dashboard │  │  List Detail    │     │
│  │  (Any CSV/Excel)│  │  (All Lists)    │  │  (Dynamic Table)│     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
└───────────┼────────────────────┼────────────────────┼───────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend API (server.js)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ /api/identity/  │  │ /api/identity/  │  │ /api/identity/  │     │
│  │ lists           │  │ entries         │  │ verify/:token   │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│  ┌────────┴────────────────────┴────────────────────┴────────┐     │
│  │                    Email Service                           │     │
│  │              (Nodemailer + Rate Limiting)                  │     │
│  └────────────────────────────────────────────────────────────┘     │
└───────────┼────────────────────┼────────────────────┼───────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Firestore Database                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ identity-lists  │  │ identity-entries│  │ identity-logs   │     │
│  │ (metadata)      │  │ (dynamic data)  │  │ (activity)      │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Customer Page (Public)                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  /verify/:token - Simple NIN/CAC submission form             │   │
│  │  (No login required, token-based access)                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Paystack Verification API                       │
│  (Existing endpoints: /api/verify/nin, /api/verify/cac)             │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. IdentityListsDashboard.tsx
Main page showing all uploaded customer lists.

```typescript
// Features:
// - Card/table view of all lists with progress indicators
// - Upload new list button
// - Quick stats: total lists, total entries, overall completion %
// - Click list to view details
// - Delete list with confirmation
```

#### 2. UploadDialog.tsx
Modal for uploading and previewing files.

```typescript
interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (listId: string) => void;
}

// Features:
// - Drag & drop or click to upload
// - Preview table with first 10 rows
// - Auto-detected email column highlighted
// - Option to manually select email column if not detected
// - Name input for the list
// - Confirm/Cancel buttons
```

#### 3. ListDetailPage.tsx
Full view of a customer list with all functionality.

```typescript
interface ListDetailPageProps {
  listId: string;
}

// Features:
// - Dynamic table showing ALL columns from original file
// - Added columns: Status, NIN, CAC, Verified At, Link Sent At
// - Checkbox selection for entries
// - "Request NIN" and "Request CAC" buttons (enabled when entries selected)
// - Search across all columns
// - Filter by status dropdown
// - Export button
// - Activity log panel
```

#### 4. SendConfirmDialog.tsx
Confirmation before sending verification emails.

```typescript
interface SendConfirmDialogProps {
  entries: Entry[];
  verificationType: 'NIN' | 'CAC';
  onConfirm: () => void;
  onCancel: () => void;
}

// Features:
// - Shows count of selected entries
// - Lists all email addresses that will receive links
// - Verification type indicator
// - Send / Cancel buttons
```

#### 5. CustomerVerifyPage.tsx
Public page for customers to submit their identity.

```typescript
// Features:
// - NEM Insurance branding
// - Prominently displays customer name (from auto-detected name columns)
// - Shows policy number if available
// - Informs customer that NIN/CAC will be validated against displayed name
// - NIN input (11 digits) OR CAC input (number + company name)
// - Submit button
// - Success/error/expired states
// - Demo mode toggle for testing
```

### Backend API Endpoints

#### List Management
```typescript
// Create list from uploaded file
POST /api/identity/lists
Body: { name, columns: string[], entries: object[], emailColumn: string }
Response: { listId, entryCount }

// Get all lists with stats
GET /api/identity/lists
Response: { lists: ListSummary[] }

// Get single list with all entries
GET /api/identity/lists/:listId
Query: { status?, search?, page?, limit? }
Response: { list: ListDetail, entries: Entry[], total }

// Delete list
DELETE /api/identity/lists/:listId
Response: { success: boolean }

// Export list to CSV
GET /api/identity/lists/:listId/export
Response: CSV file download
```

#### Entry Operations
```typescript
// Send verification links to selected entries
POST /api/identity/lists/:listId/send
Body: { entryIds: string[], verificationType: 'NIN' | 'CAC' }
Response: { sent: number, failed: number, errors: Error[] }

// Resend link for single entry
POST /api/identity/entries/:entryId/resend
Response: { success, newExpiresAt }

// Get activity log
GET /api/identity/lists/:listId/activity
Query: { action?, startDate?, endDate?, page?, limit? }
Response: { logs: ActivityLog[] }
```

#### Customer Verification (Public)
```typescript
// Validate token and get entry info
GET /api/identity/verify/:token
Response: { valid, entryInfo?: { name?, policyNumber? }, verificationType, expired?, used? }

// Submit verification
POST /api/identity/verify/:token
Body: { identityNumber, companyName? }
Response: { success, error? }
```

## Data Models

### Firestore Collections

#### identity-lists
```typescript
interface IdentityList {
  id: string;                    // Auto-generated
  name: string;                  // Admin-provided name
  
  // Schema info (preserves original structure)
  columns: string[];             // Original column names in order
  emailColumn: string;           // Which column contains emails
  nameColumns: {                 // Auto-detected name columns
    firstName?: string;          // Column name for first name
    middleName?: string;         // Column name for middle name
    lastName?: string;           // Column name for last name
    fullName?: string;           // Column name for full/combined name
    insured?: string;            // Column name for insured name
  };
  policyColumn?: string;         // Auto-detected policy number column
  
  // Stats
  totalEntries: number;
  verifiedCount: number;
  pendingCount: number;
  failedCount: number;
  
  // Metadata
  createdBy: string;             // Admin UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  originalFileName: string;
}
```

#### identity-entries
```typescript
interface IdentityEntry {
  id: string;                    // Auto-generated
  listId: string;                // Reference to list
  
  // Original data (dynamic - all columns from file)
  data: Record<string, any>;     // { "Column A": "value", "Column B": "value", ... }
  
  // Extracted fields
  email: string;                 // Extracted from emailColumn
  displayName?: string;          // Combined name from name columns
  policyNumber?: string;         // Extracted policy number if available
  
  // Verification tracking
  verificationType?: 'NIN' | 'CAC';
  status: 'pending' | 'link_sent' | 'verified' | 'failed' | 'email_failed';
  
  // Token
  token?: string;
  tokenExpiresAt?: Timestamp;
  
  // Results (appended data)
  nin?: string;                  // Verified NIN
  cac?: string;                  // Verified CAC number
  cacCompanyName?: string;       // Verified company name
  verifiedAt?: Timestamp;
  
  // Tracking
  linkSentAt?: Timestamp;
  resendCount: number;
  verificationAttempts: number;
  lastAttemptAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### identity-logs
```typescript
interface ActivityLog {
  id: string;
  listId: string;
  entryId?: string;
  
  action: 'list_created' | 'list_deleted' | 'links_sent' | 'link_resent' | 
          'verification_success' | 'verification_failed' | 'export_generated';
  
  details: {
    count?: number;              // For bulk actions
    email?: string;              // For individual actions
    error?: string;              // For failures
  };
  
  actorType: 'admin' | 'customer' | 'system';
  actorId?: string;
  
  timestamp: Timestamp;
  ipAddress?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

### Property 1: Column Preservation
*For any* uploaded file, the created list must preserve all original column names in their exact order, and each entry must contain values for all columns.

**Validates: Requirements 1.2**

### Property 2: Email Auto-Detection
*For any* uploaded file with a column containing "email" (case-insensitive), the system must correctly identify and extract that column as the email source.

**Validates: Requirements 1.3**

### Property 2.1: Name Auto-Detection
*For any* uploaded file, the system must correctly identify name columns by searching left to right for:
- Columns containing "first" AND "name" (case-insensitive)
- Columns containing "last" AND "name" (case-insensitive)
- Columns containing "middle" AND "name" (case-insensitive)
- Columns containing "insured" (case-insensitive)
- Columns containing "full" AND "name" (case-insensitive)
- Columns containing just "name" (case-insensitive, as fallback)

**Validates: Requirements 1.5, 1.6**

### Property 3: Token Uniqueness and Security
*For any* generated verification token:
- It must be unique across all tokens in the system
- It must be at least 32 bytes of cryptographic randomness (URL-safe encoded)
- It must have a valid expiration timestamp

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: Status Consistency
*For any* entry, the status must accurately reflect its current state:
- "pending" if no link has been sent
- "link_sent" if email was sent successfully
- "verified" if identity was verified
- "failed" if max attempts exceeded
- "email_failed" if email sending failed

**Validates: Requirements 5.3, 5.4, 6.6, 6.8**

### Property 5: Data Append Integrity
*For any* successful verification, the NIN or CAC value must be appended to the entry while preserving all original data fields.

**Validates: Requirements 7.1, 7.2**

### Property 6: Export Completeness
*For any* list export, the generated file must contain:
- All original columns in original order
- All verification columns (Status, NIN, CAC, Verified At)
- All entries regardless of status

**Validates: Requirements 7.3, 7.4, 7.5**

### Property 7: Token Expiration Handling
*For any* token that has passed its expiration timestamp, accessing the verification page must return an "expired" status.

**Validates: Requirements 4.4**

### Property 8: Token Invalidation on Resend
*For any* link resend operation, the old token must become invalid and a new unique token must be generated.

**Validates: Requirements 8.2**

### Property 9: Rate Limiting Enforcement
*For any* email sending operation, the number of emails sent per minute must not exceed 50.

**Validates: Requirements 5.5**

### Property 10: Identity Input Validation
*For any* identity submission:
- If verification type is NIN: the input must be exactly 11 digits
- If verification type is CAC: both CAC number and company name must be provided

**Validates: Requirements 6.3, 6.4**

### Property 11: Resend Count Tracking
*For any* resend operation on an entry, the resendCount must increment by exactly 1.

**Validates: Requirements 8.3, 8.5**

### Property 12: Activity Log Completeness
*For any* significant action (upload, send, verify, resend, delete), an activity log entry must be created with timestamp, action type, and relevant details.

**Validates: Requirements 9.1, 9.3**

## Error Handling

### File Upload Errors
- Invalid file format: "Please upload a valid Excel (.xlsx) or CSV file"
- File too large (>10MB): "File size exceeds 10MB limit"
- Empty file: "The uploaded file contains no data"
- No email column detected: Prompt to manually select email column

### Token Errors
- Expired: "This link has expired. Please contact your insurance provider for a new link."
- Already used: "Your information has already been submitted. Thank you."
- Invalid: "This link is not valid. Please check the link or contact your insurance provider."

### Verification Errors
- Invalid NIN format: "Please enter a valid 11-digit NIN"
- Invalid CAC: "Please enter both CAC number and company name"
- API error: "Verification service temporarily unavailable. Please try again."
- Max attempts: "Maximum attempts reached. Please contact your insurance provider."

### Email Errors
- Invalid email: Mark entry as "email_failed"
- SMTP error: Retry up to 3 times, then mark as "email_failed"
- Rate limit: Queue remaining emails

## Testing Strategy

### Unit Tests
- File parsing (CSV, Excel)
- Email column detection
- Token generation and validation
- Input validation (NIN format, CAC fields)

### Property-Based Tests
Using **fast-check** library:
- Column preservation across parse/serialize
- Token uniqueness across large batches
- Status transitions are valid
- Data integrity after verification append

Each property test runs minimum 100 iterations.

**Test File Structure:**
```
src/
  __tests__/
    identity/
      fileParser.test.ts         # Properties 1, 2
      tokenGeneration.test.ts    # Properties 3, 7, 8
      statusTracking.test.ts     # Property 4
      dataIntegrity.test.ts      # Properties 5, 6
      emailService.test.ts       # Property 9
      verification.test.ts       # Property 10
      resendTracking.test.ts     # Property 11
      activityLog.test.ts        # Property 12
```

### Integration Tests
- End-to-end upload flow
- Email sending with mock SMTP
- Verification flow with mock Paystack
- Export generation

