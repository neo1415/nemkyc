# Design Document: Identity Collection System

## Overview

The Identity Collection System is a flexible solution for collecting missing NIN/CAC information from legacy insurance customers. It accepts any CSV/Excel file structure, creates dynamic tables, and appends verified identity data back to the original data. The system supports role-based access control with a dedicated broker role for external partners.

Key design principles:
1. **Flexibility** - Accept any file structure, auto-detect emails, support template and flexible modes
2. **Simplicity** - User-friendly naming, intuitive workflow
3. **Data integrity** - Preserve original data, append verification results
4. **Enterprise features** - Audit logging, progress tracking, secure links
5. **Access Control** - Role-based permissions with broker isolation

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Admin/Broker Portal (Role-Based)                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Upload Page    │  │  List Dashboard │  │  List Detail    │     │
│  │  (Any CSV/Excel)│  │  (Filtered)     │  │  (Dynamic Table)│     │
│  │  + Templates    │  │  by Role        │  │  + Actions      │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│  ┌────────┴────────────────────┴────────────────────┴────────┐     │
│  │              Role Check Middleware                         │     │
│  │  - Broker: sees only own lists (createdBy = uid)          │     │
│  │  - Admin/Compliance/Super Admin: sees all lists           │     │
│  └────────────────────────────────────────────────────────────┘     │
└───────────┼────────────────────┼────────────────────┼───────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend API (server.js)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ /api/identity/  │  │ /api/identity/  │  │ /api/identity/  │     │
│  │ lists           │  │ entries         │  │ verify/:token   │     │
│  │ + Role Filter   │  │ + Role Filter   │  │ (Public)        │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│  ┌────────┴────────────────────┴────────────────────┴────────┐     │
│  │              Email Service (Dynamic Templates)             │     │
│  │        (Nodemailer + Rate Limiting + NIN/CAC Logic)        │     │
│  └────────────────────────────────────────────────────────────┘     │
└───────────┼────────────────────┼────────────────────┼───────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Firestore Database                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ identity-lists  │  │ identity-entries│  │ identity-logs   │     │
│  │ (+ createdBy)   │  │ (dynamic data)  │  │ (activity)      │     │
│  │ (+ listType)    │  │ (+ listType)    │  │                 │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│  ┌─────────────────┐                                                │
│  │ users           │  (role: default, broker, compliance, claims,   │
│  │ (+ role field)  │   admin, super_admin)                          │
│  └─────────────────┘                                                │
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

## Role-Based Access Control

### User Roles
1. **default** - Regular users, no identity collection access
2. **broker** - Can upload lists, send verification requests, view only own data
3. **compliance** - Can view all lists and entries, full identity collection access
4. **claims** - No identity collection access
5. **admin** - Full access to all lists, entries, and user management
6. **super_admin** - Full system access

### Access Matrix

| Role | View Own Lists | View All Lists | Upload Lists | Send Verification | Manage Users | Delete Lists |
|------|---------------|----------------|--------------|-------------------|--------------|--------------|
| default | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| broker | ✅ | ❌ | ✅ | ✅ (own only) | ❌ | ✅ (own only) |
| compliance | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| claims | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Implementation Strategy
- Backend endpoints filter queries by `createdBy` field when user role is "broker"
- Frontend conditionally renders features based on user role
- Firestore security rules enforce role-based access at database level

## Components and Interfaces

### Upload Templates

The system supports two upload modes:

#### Template Mode (Structured)
Enforces specific column requirements for automatic client type detection.

**Individual Client Template:**
- **Required columns:** title, first name, last name, phone number, email, address, gender
- **Optional columns:** date of birth, occupation, nationality
- **Detection:** System checks for presence of "first name", "last name", "gender" columns

**Corporate Client Template:**
- **Required columns:** company name, company address, email address, company type, phone number
- **Detection:** System checks for presence of "company name", "company type" columns

#### Flexible Mode (Legacy)
Accepts any column structure, auto-detects email and name columns dynamically.

**Mode Selection:**
- Template mode validates required columns and auto-detects list type (Individual/Corporate)
- Flexible mode preserves all columns without validation
- System maintains backward compatibility with existing flexible uploads

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
Modal for uploading and previewing files with template support.

```typescript
interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (listId: string) => void;
}

// Features:
// - Drag & drop or click to upload
// - Mode selector: Template Mode / Flexible Mode
// - Template info display showing required columns
// - Preview table with first 10 rows
// - Auto-detected email column highlighted
// - Auto-detected list type (Individual/Corporate) in template mode
// - Validation errors for missing required columns
// - Option to manually select email column if not detected
// - Name input for the list
// - Confirm/Cancel buttons
```

#### 3. ListDetailPage.tsx
Full view of a customer list with all functionality (role-filtered).

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
// - Role-based filtering: brokers see only their lists
// - List type indicator (Individual/Corporate/Flexible)
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

#### Authentication & Authorization
All identity endpoints require authentication. Role-based filtering applied:
- **Broker role:** Can only access lists where `createdBy === user.uid`
- **Admin/Compliance/Super Admin:** Can access all lists
- **Default/Claims:** No access to identity endpoints

#### List Management
```typescript
// Create list from uploaded file
POST /api/identity/lists
Headers: { Authorization: Bearer <token> }
Body: { 
  name, 
  columns: string[], 
  entries: object[], 
  emailColumn: string,
  listType?: 'individual' | 'corporate' | 'flexible',
  uploadMode: 'template' | 'flexible'
}
Response: { listId, entryCount }
// Sets createdBy to authenticated user's UID

// Get all lists with stats (role-filtered)
GET /api/identity/lists
Headers: { Authorization: Bearer <token> }
Response: { lists: ListSummary[] }
// Brokers see only their lists, admins see all

// Get single list with all entries (role-filtered)
GET /api/identity/lists/:listId
Headers: { Authorization: Bearer <token> }
Query: { status?, search?, page?, limit? }
Response: { list: ListDetail, entries: Entry[], total }
// Returns 403 if broker tries to access another user's list

// Delete list (role-filtered)
DELETE /api/identity/lists/:listId
Headers: { Authorization: Bearer <token> }
Response: { success: boolean }
// Returns 403 if broker tries to delete another user's list

// Export list to CSV (role-filtered)
GET /api/identity/lists/:listId/export
Headers: { Authorization: Bearer <token> }
Response: CSV file download
```

#### Entry Operations
```typescript
// Send verification links to selected entries (role-filtered)
POST /api/identity/lists/:listId/send
Headers: { Authorization: Bearer <token> }
Body: { entryIds: string[], verificationType: 'NIN' | 'CAC' }
Response: { sent: number, failed: number, errors: Error[] }
// Returns 403 if broker tries to send for another user's list

// Resend link for single entry (role-filtered)
POST /api/identity/entries/:entryId/resend
Headers: { Authorization: Bearer <token> }
Response: { success, newExpiresAt }
// Returns 403 if broker tries to resend for another user's entry

// Get activity log (role-filtered)
GET /api/identity/lists/:listId/activity
Headers: { Authorization: Bearer <token> }
Query: { action?, startDate?, endDate?, page?, limit? }
Response: { logs: ActivityLog[] }
```

#### User Management (Admin only)
```typescript
// Update user role
PATCH /api/users/:userId/role
Headers: { Authorization: Bearer <token> }
Body: { role: 'default' | 'broker' | 'compliance' | 'claims' | 'admin' | 'super_admin' }
Response: { success: boolean }
// Requires admin or super_admin role
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
  
  // Template info
  listType: 'individual' | 'corporate' | 'flexible';  // Detected or flexible
  uploadMode: 'template' | 'flexible';                // Upload mode used
  
  // Stats
  totalEntries: number;
  verifiedCount: number;
  pendingCount: number;
  failedCount: number;
  
  // Metadata
  createdBy: string;             // Creator UID (for broker filtering)
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

### Property 13: Broker Access Isolation
*For any* user with role "broker", they must only be able to access lists where `createdBy` equals their UID. Attempts to access other lists must return 403 Forbidden.

**Validates: Requirements 11.3, 11.4, 11.7, 11.9**

### Property 14: Admin Access Universality
*For any* user with role "admin", "super_admin", or "compliance", they must be able to access all lists regardless of `createdBy` value.

**Validates: Requirements 11.5**

### Property 15: Role Assignment on Registration
*For any* new user registration where userType is "broker", the user's role field must be set to "broker". For any registration where userType is "regular" or undefined, the role must be set to "default".

**Validates: Requirements 12.2, 12.3, 12.6, 12.7**

### Property 16: Template Validation - Individual
*For any* file uploaded in template mode, if it contains columns matching Individual template (first name, last name, email, phone number, address, gender), then all 7 required columns must be present or validation must fail.

**Validates: Requirements 15.1, 15.5, 15.8, 15.9**

### Property 17: Template Validation - Corporate
*For any* file uploaded in template mode, if it contains columns matching Corporate template (company name, company address, email address, company type, phone number), then all 5 required columns must be present or validation must fail.

**Validates: Requirements 15.3, 15.6, 15.8, 15.9**

### Property 18: List Type Auto-Detection
*For any* file uploaded in template mode, the system must correctly identify listType as "individual" if Individual template columns are present, "corporate" if Corporate template columns are present, or return an error if neither match.

**Validates: Requirements 15.5, 15.6, 15.7**

### Property 19: Email Template Dynamic Content
*For any* verification email sent, if verificationType is "NIN", the email must contain "Individual Clients" and "National Identification Number (NIN)". If verificationType is "CAC", the email must contain "Corporate Clients" and "Corporate Affairs Commission (CAC) Registration Number".

**Validates: Requirements 14.1, 14.2, 14.4, 14.7**

### Property 20: Backward Compatibility
*For any* file uploaded in flexible mode, the system must accept any column structure and not enforce template validation, maintaining compatibility with existing uploads.

**Validates: Requirements 15.10**

## Error Handling

### File Upload Errors
- Invalid file format: "Please upload a valid Excel (.xlsx) or CSV file"
- File too large (>10MB): "File size exceeds 10MB limit"
- Empty file: "The uploaded file contains no data"
- No email column detected: Prompt to manually select email column
- Missing required columns (template mode): "Missing required columns: [list]. Please ensure your file matches the template."
- Ambiguous list type (template mode): "Could not determine if this is Individual or Corporate data. Please check column names."

### Token Errors
- Expired: "This link has expired. Please contact your insurance provider for a new link."
- Already used: "Your information has already been submitted. Thank you."
- Invalid: "This link is not valid. Please check the link or contact your insurance provider."

### Verification Errors
- Invalid NIN format: "Please enter a valid 11-digit NIN"
- Invalid CAC: "Please enter both CAC number and company name"
- API error: "Verification service temporarily unavailable. Please try again."
- Max attempts: "Maximum attempts reached. Please contact your insurance provider."

### Authorization Errors
- Broker accessing another user's list: "403 Forbidden - You do not have permission to access this resource"
- Non-admin changing user roles: "403 Forbidden - Only administrators can change user roles"

### Email Errors
- Invalid email: Mark entry as "email_failed"
- SMTP error: Retry up to 3 times, then mark as "email_failed"
- Rate limit: Queue remaining emails

## Email Template

The system uses a dynamic email template that adjusts based on verification type:

```typescript
interface EmailTemplateParams {
  verificationType: 'NIN' | 'CAC';
  customerName?: string;
  verificationLink: string;
  expiresAt: Date;
}

function generateEmailContent(params: EmailTemplateParams): string {
  const { verificationType, customerName, verificationLink, expiresAt } = params;
  
  const greeting = "Dear Client";
  
  const clientTypeText = verificationType === 'NIN' 
    ? "For Individual Clients: National Identification Number (NIN)"
    : "For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number";
  
  const documentType = verificationType === 'NIN' ? 'NIN' : 'CAC Registration Number';
  
  return `
${greeting},

We write to inform you that, in line with the directives of the National Insurance Commission (NAICOM) and ongoing regulatory requirements on Know Your Customer (KYC) and data integrity, all insurance companies are mandated to obtain and update the identification details of their clients.

Accordingly, we kindly request your cooperation in providing the following, as applicable:

${clientTypeText}

To ensure confidentiality and data protection, we have provided a secured link through which the required information can be safely submitted. Kindly access the link below and complete the request at your earliest convenience:

${verificationLink}

This link will expire on ${expiresAt.toLocaleDateString()}.

Please note that failure to update these details may affect the continued administration of your policy, in line with regulatory guidelines.

We appreciate your understanding and continued support as we work to remain fully compliant with NAICOM regulations. Should you require any clarification or assistance, please do not hesitate to contact us via:

Email: nemsupport@nem-insurance.com
Telephone: 0201-4489570-2

Thank you for your cooperation.

Yours faithfully,
NEM Insurance
  `;
}
```

**Key Features:**
- Dynamic greeting: "Dear Client"
- Conditional client type text based on NIN vs CAC
- Includes full regulatory context
- Secure link with expiration date
- Contact information for support
- Professional closing

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

