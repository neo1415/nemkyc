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



## New Features Design

### Broker Auto-Redirect on Login

**Implementation:**
- In `AuthContext.tsx`, after successful login, check user role
- If role === 'broker', redirect to `/admin/identity` with state flag `{ openUploadDialog: true }`
- In `IdentityListsDashboard.tsx`, check for state flag on mount
- If flag present, automatically open UploadDialog component
- Use React Router's `useLocation` and `useNavigate` hooks

**Code Flow:**
```typescript
// In AuthContext after login
if (userRole === 'broker') {
  navigate('/admin/identity', { state: { openUploadDialog: true } });
} else if (userRole === 'admin' || userRole === 'super_admin') {
  navigate('/admin/dashboard');
}

// In IdentityListsDashboard
const location = useLocation();
useEffect(() => {
  if (location.state?.openUploadDialog) {
    setUploadDialogOpen(true);
    // Clear state to prevent reopening on refresh
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location]);
```

### Downloadable Excel Templates

**Template Generation:**
- Use `xlsx` library to generate Excel files with pre-filled headers
- Create utility function `generateTemplate(type: 'individual' | 'corporate'): Blob`
- Add "Download Template" button/menu in UploadDialog

**Individual Template Columns:**
```typescript
const INDIVIDUAL_TEMPLATE_HEADERS = [
  'Title',
  'First Name',
  'Last Name',
  'Phone Number',
  'Email',
  'Address',
  'Gender',
  'Date of Birth',      // Optional
  'Occupation',         // Optional
  'Nationality',        // Optional
  'Policy Number',      // Required
  'BVN',               // Required
  'NIN',               // Optional
  'CAC'                // Optional
];
```

**Corporate Template Columns:**
```typescript
const CORPORATE_TEMPLATE_HEADERS = [
  'Company Name',
  'Company Address',
  'Email Address',
  'Company Type',
  'Phone Number',
  'Policy Number',          // Required
  'Registration Number',    // Required
  'Registration Date',      // Required
  'Business Address',       // Required
  'CAC'                    // Optional
];
```

**Template Generation Function:**
```typescript
function generateExcelTemplate(type: 'individual' | 'corporate'): Blob {
  const headers = type === 'individual' 
    ? INDIVIDUAL_TEMPLATE_HEADERS 
    : CORPORATE_TEMPLATE_HEADERS;
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
```

### Enhanced Data Model

**Updated IdentityEntry Interface:**
```typescript
interface IdentityEntry {
  // ... existing fields ...
  
  // New validation fields
  policyNumber: string;           // Required - for IES integration
  bvn?: string;                   // Required for Individual
  nin?: string;                   // Optional - pre-filled
  cac?: string;                   // Optional - pre-filled
  
  // Corporate-specific fields
  registrationNumber?: string;    // Required for Corporate
  registrationDate?: string;      // Required for Corporate
  businessAddress?: string;       // Required for Corporate
  
  // Verification details
  verificationDetails?: {
    fieldsValidated: string[];    // Which fields were checked
    failedFields?: string[];      // Which fields didn't match
    failureReason?: string;       // Human-readable error
  };
}
```

### Bulk Verification Feature

**Implementation:**
- Add "Verify All Unverified" button in ListDetailPage toolbar
- Create new endpoint: `POST /api/identity/lists/:listId/bulk-verify`
- Backend logic:
  1. Query all entries with status 'pending' or 'link_sent'
  2. Filter entries that have NIN, BVN, or CAC pre-filled
  3. For each entry, call appropriate verification API
  4. Update status based on result
  5. Return summary: { processed, verified, failed, skipped }

**Verification Logic:**
```typescript
async function bulkVerifyEntries(listId: string) {
  const entries = await getEntriesForBulkVerification(listId);
  const results = { processed: 0, verified: 0, failed: 0, skipped: 0 };
  
  for (const entry of entries) {
    if (entry.status === 'verified') {
      results.skipped++;
      continue;
    }
    
    if (entry.nin && entry.bvn) {
      const result = await verifyNIN(entry);
      updateEntryStatus(entry.id, result);
      results.processed++;
      result.success ? results.verified++ : results.failed++;
    } else if (entry.cac) {
      const result = await verifyCAC(entry);
      updateEntryStatus(entry.id, result);
      results.processed++;
      result.success ? results.verified++ : results.failed++;
    } else {
      results.skipped++;
    }
  }
  
  return results;
}
```

### Enhanced Verification Flow

**Field-Level Validation:**

**For NIN (Individual):**
- Customer sees: First Name, Last Name, Email, Date of Birth
- Customer inputs: NIN
- Backend validates against: First Name, Last Name, Date of Birth, Gender, BVN

**For CAC (Corporate):**
- Customer sees: Company Name, Registration Number, Registration Date
- Customer inputs: CAC
- Backend validates against: Company Name, Registration Number, Registration Date, Business Address

**Verification API Call Structure:**
```typescript
interface NINVerificationRequest {
  nin: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bvn: string;
}

interface CACVerificationRequest {
  cac: string;
  companyName: string;
  registrationNumber: string;
  registrationDate: string;
  businessAddress: string;
}
```

### Detailed Error Handling

**Error Response Structure:**
```typescript
interface VerificationError {
  success: false;
  errorType: 'field_mismatch' | 'api_error' | 'invalid_input';
  failedFields?: string[];
  message: string;
  customerMessage: string;
  staffMessage: string;
  brokerEmail?: string;
}
```

**Error Flow:**
1. Verification fails → Generate detailed error
2. Update entry status to 'verification_failed'
3. Store failure details in entry.verificationDetails
4. Send email to customer with user-friendly message
5. Send email to staff (compliance, admin, brokers) with technical details
6. Log error for audit trail

**Customer Error Email Template:**
```
Subject: Identity Verification Issue - Action Required

Dear [Customer Name],

We were unable to verify your identity information due to a mismatch in the details provided.

Issue: [User-friendly explanation of what didn't match]

Next Steps:
Please contact your broker at [broker_email] to resolve this issue. They will help ensure your information is correct.

Thank you for your cooperation.

NEM Insurance
```

**Staff Notification Email Template:**
```
Subject: Verification Failure Alert - [Customer Name]

A verification attempt has failed for the following customer:

Customer: [Name]
Policy Number: [Policy Number]
Verification Type: [NIN/CAC]

Failed Fields:
- [Field 1]: Expected [X], Got [Y]
- [Field 2]: Mismatch detected

Action Required:
Please verify that the data provided in the uploaded list is accurate and matches the customer's official documents.

View Details: [Link to entry in admin portal]
```

### Selection Logic Enhancement

**Smart Select All:**
```typescript
function handleSelectAll(checked: boolean) {
  if (checked) {
    // Only select entries that are NOT verified
    const selectableEntries = entries.filter(
      entry => entry.status !== 'verified'
    );
    setSelectedEntries(selectableEntries.map(e => e.id));
  } else {
    setSelectedEntries([]);
  }
}

// Disable action buttons if only verified entries selected
const hasUnverifiedSelected = selectedEntries.some(id => {
  const entry = entries.find(e => e.id === id);
  return entry && entry.status !== 'verified';
});
```

### UI/UX Updates

**Hide Flexible Mode:**
- In UploadDialog, remove the tab/toggle for "Flexible Mode"
- Keep the code but don't render the UI element
- Add comment: `// Flexible mode hidden but code retained for future use`

**NAICOM Compliance Message:**
```typescript
const NAICOM_MESSAGE = `
In compliance with the National Insurance Commission (NAICOM) and National Insurance 
and Insurers Regulatory Authority (NAIIRA) regulations, all insurance providers are 
mandated to collect and maintain accurate Know Your Customer (KYC) information.

Please ensure all required fields in the downloaded template are filled accurately 
and completely. This information is critical for regulatory compliance and policy 
administration.

Required documents must match official government-issued identification.
`;
```

Display this message prominently in the UploadDialog before template download.

### Onboarding Tour System

**Implementation using React Joyride:**

**Tour Steps Configuration:**
```typescript
const BROKER_TOUR_STEPS = [
  {
    target: '.welcome-message',
    content: 'Welcome to the Identity Collection System! Let us guide you through the process of collecting customer identity information.',
    placement: 'center',
  },
  {
    target: '.upload-button',
    content: 'Start by clicking here to upload a new customer list. You can download our pre-formatted template to ensure all required fields are included.',
  },
  {
    target: '.download-template-button',
    content: 'Download the Individual or Corporate template with all required column headers pre-filled.',
  },
  {
    target: '.list-table',
    content: 'After uploading, review your customer data here. All columns from your file are preserved.',
  },
  {
    target: '.select-all-checkbox',
    content: 'Select individual customers or use "Select All" to choose all unverified entries at once.',
  },
  {
    target: '.request-nin-button',
    content: 'Click "Request NIN" for individual clients or "Request CAC" for corporate clients to send verification emails.',
  },
  {
    target: '.status-column',
    content: 'Track verification progress here. Statuses include: Pending, Link Sent, Verified, and Verification Failed.',
  },
  {
    target: '.verify-all-button',
    content: 'If you\'ve pre-filled NIN/CAC/BVN in your upload, click here to verify all entries at once.',
  },
];
```

**Tour State Management:**
```typescript
interface OnboardingState {
  run: boolean;
  stepIndex: number;
  completed: boolean;
}

// Store completion in Firestore
interface UserDocument {
  // ... existing fields ...
  onboardingTourCompleted: boolean;
}

// Check on mount
useEffect(() => {
  if (userRole === 'broker' && !user.onboardingTourCompleted) {
    setTourState({ run: true, stepIndex: 0, completed: false });
  }
}, [user]);

// On tour completion
function handleTourComplete() {
  updateUserDocument(user.uid, { onboardingTourCompleted: true });
}
```

**Tour Styling:**
```typescript
const tourStyles = {
  options: {
    primaryColor: '#800020', // NEM Insurance brand color
    zIndex: 10000,
  },
  buttonNext: {
    backgroundColor: '#800020',
  },
  buttonBack: {
    color: '#800020',
  },
};
```

### API Integration Preparation

**Mock Mode Configuration:**
```typescript
interface VerificationConfig {
  mode: 'mock' | 'production';
  ninApiUrl?: string;
  cacApiUrl?: string;
  termiiApiKey?: string;
}

// In environment config
const VERIFICATION_CONFIG: VerificationConfig = {
  mode: process.env.VERIFICATION_MODE || 'mock',
  ninApiUrl: process.env.NIN_API_URL,
  cacApiUrl: process.env.CAC_API_URL,
  termiiApiKey: process.env.TERMII_API_KEY,
};

// Verification service with mock fallback
async function verifyNIN(data: NINVerificationRequest) {
  if (VERIFICATION_CONFIG.mode === 'mock') {
    return mockNINVerification(data);
  }
  return callNINAPI(data);
}
```

**Mock Implementation:**
```typescript
function mockNINVerification(data: NINVerificationRequest) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation logic
  const isValid = data.nin.length === 11 && data.nin.startsWith('1');
  
  return {
    success: isValid,
    message: isValid ? 'Verification successful' : 'NIN not found',
    data: isValid ? { verified: true, matchScore: 100 } : null,
  };
}
```

### Prevent Duplicate Verifications

**Entry Selection Filter:**
```typescript
// Filter out verified entries from selection
function getSelectableEntries(entries: IdentityEntry[]) {
  return entries.filter(entry => entry.status !== 'verified');
}

// Visual indicator for verified entries
function renderEntryRow(entry: IdentityEntry) {
  const isVerified = entry.status === 'verified';
  
  return (
    <TableRow 
      className={isVerified ? 'verified-entry' : ''}
      style={{ opacity: isVerified ? 0.6 : 1 }}
    >
      <TableCell>
        <Checkbox 
          disabled={isVerified}
          checked={selectedEntries.includes(entry.id)}
          onChange={() => handleSelectEntry(entry.id)}
        />
        {isVerified && <Tooltip title="Already verified" />}
      </TableCell>
      {/* ... other cells ... */}
    </TableRow>
  );
}
```

**Bulk Verification Skip Logic:**
```typescript
async function bulkVerify(listId: string) {
  const entries = await getEntries(listId);
  
  for (const entry of entries) {
    // Skip verified entries
    if (entry.status === 'verified') {
      logAudit({
        action: 'bulk_verify_skipped',
        entryId: entry.id,
        reason: 'already_verified',
      });
      continue;
    }
    
    // Proceed with verification
    await verifyEntry(entry);
  }
}
```

## Updated Correctness Properties

### Property 21: Template Download Completeness
*For any* template download request (Individual or Corporate), the generated Excel file must contain all required column headers in the first row, properly formatted.

**Validates: Requirements 17.3, 17.4, 17.7**

### Property 22: Bulk Verification Selectivity
*For any* bulk verification operation, the system must only process entries with status 'pending' or 'link_sent' that have NIN, BVN, or CAC pre-filled, and must skip all entries with status 'verified'.

**Validates: Requirements 19.3, 19.4, 19.5, 19.8, 19.9**

### Property 23: Field-Level Validation Completeness
*For any* NIN verification, the system must validate against First Name, Last Name, Date of Birth, Gender, and BVN. For any CAC verification, the system must validate against Company Name, Registration Number, Registration Date, and Business Address.

**Validates: Requirements 20.3, 20.6**

### Property 24: Error Notification Completeness
*For any* verification failure, the system must send an email to the customer with user-friendly error message and broker contact, AND send an email to all staff with roles 'compliance', 'admin', or 'broker' with technical details.

**Validates: Requirements 21.3, 21.4, 21.5**

### Property 25: Verified Entry Exclusion
*For any* "Select All" operation, the system must exclude all entries with status 'verified' from the selection. For any bulk verification operation, entries with status 'verified' must be skipped.

**Validates: Requirements 22.1, 22.2, 22.3, 27.1, 27.2, 27.6**

### Property 26: Broker Auto-Redirect
*For any* successful login where user role is 'broker', the system must redirect to `/admin/identity` and automatically open the Upload Dialog.

**Validates: Requirements 16.1, 16.2, 16.3**

### Property 27: Tour Completion Tracking
*For any* broker user, the onboarding tour must be shown only once (when onboardingTourCompleted is false), and upon completion or dismissal, the field must be updated to true.

**Validates: Requirements 25.3, 25.4, 25.6, 25.7**

## Updated Testing Strategy

### Additional Unit Tests
- Template generation (Individual and Corporate)
- Bulk verification logic
- Field-level validation
- Error message generation
- Selection filtering (exclude verified)

### Additional Property-Based Tests
```
src/
  __tests__/
    identity/
      templateGeneration.test.ts      # Property 21
      bulkVerification.test.ts        # Property 22
      fieldValidation.test.ts         # Property 23
      errorNotifications.test.ts      # Property 24
      verifiedExclusion.test.ts       # Property 25
      brokerRedirect.test.ts          # Property 26
      tourTracking.test.ts            # Property 27
```

### Integration Tests
- Complete broker workflow from login to verification
- Template download → fill → upload → verify flow
- Bulk verification with mixed entry statuses
- Error handling and notification flow
- Tour completion and persistence

