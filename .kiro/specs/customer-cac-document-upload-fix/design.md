# Customer CAC Document Upload Bugfix Design

## Overview

The customer CAC verification page is currently incomplete and non-functional. Customers can only enter their CAC registration number but cannot upload the three required CAC documents mandated by NAICOM and CAMA 2020 regulations. This design document outlines the fix to enable customers to upload Certificate of Incorporation, Particulars of Directors, and Share Allotment documents during the verification process.

The fix involves:
- Adding three file upload fields to the customer verification page
- Implementing client-side validation (file type, size)
- Uploading documents BEFORE submitting CAC number for verification
- Encrypting documents with AES-256-GCM before storage
- Storing encrypted documents in Firebase Storage with proper security rules
- Creating metadata in Firestore for audit trail and document management

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a customer accesses the CAC verification page and cannot upload the three required documents
- **Property (P)**: The desired behavior - customers can upload all three CAC documents with validation, encryption, and secure storage
- **Preservation**: Existing NIN verification flow, admin document management features, encryption utilities, and audit logging that must remain unchanged
- **CustomerVerificationPage**: The React component in `src/pages/public/CustomerVerificationPage.tsx` that handles customer identity verification
- **Document Upload Endpoint**: The backend API endpoint `POST /api/identity/verify/:token/upload-document` that handles document uploads with encryption
- **AES-256-GCM**: Advanced Encryption Standard with 256-bit key in Galois/Counter Mode - the encryption algorithm used for document security
- **Firebase Storage**: Cloud storage service where encrypted documents are stored with path `/cac-documents/{entryId}/{documentType}/{documentId}_{filename}`
- **Firestore Collection**: The `cac-documents` collection that stores document metadata including encryption details and audit information
- **Verification Token**: Time-limited token sent to customers via email that authorizes document uploads and verification

## Bug Details

### Fault Condition

The bug manifests when a customer receives a CAC verification link, accesses the verification page, and attempts to complete the verification process. The `CustomerVerificationPage` component displays only a CAC number input field without any document upload fields, preventing customers from submitting the three required CAC documents (Certificate of Incorporation, Particulars of Directors, Share Allotment).

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { verificationType: string, pageState: string }
  OUTPUT: boolean
  
  RETURN input.verificationType == 'CAC'
         AND input.pageState == 'valid'
         AND documentUploadFieldsNotDisplayed()
         AND requiredDocumentsCannotBeUploaded()
END FUNCTION
```

### Examples

- **Example 1**: Customer receives CAC verification email, clicks link, sees only CAC number input field, cannot upload Certificate of Incorporation → Verification incomplete
- **Example 2**: Customer enters valid CAC number RC123456, clicks "Verify CAC" button, system submits without required documents → Regulatory non-compliance
- **Example 3**: Customer attempts to complete verification, realizes documents cannot be uploaded, contacts broker for assistance → Poor user experience
- **Edge Case**: Customer with expired token attempts to upload documents → System should prevent upload and display appropriate error message

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- NIN verification flow must continue to work exactly as before (single input field, no document uploads)
- Admin CAC document management features in the dashboard must remain functional (preview, download, access control)
- Existing admin document preview component (`CACDocumentPreview.tsx`) must continue to work for viewing customer-uploaded documents
- Admin access control must remain: only admin, super_admin, and compliance roles can preview/download customer documents
- Existing encryption utilities (`server-utils/encryption.cjs`) must continue to work for all use cases
- Audit logging infrastructure must continue to log all verification attempts AND document access (view, download)
- Firebase Storage rules for other document types (KYC, CDD, claims) must remain unchanged
- Token validation logic for both NIN and CAC must remain unchanged
- VerifyData API integration for CAC number verification must remain unchanged

**Scope:**
All inputs that do NOT involve CAC verification (NIN verification, admin uploads, other form submissions) should be completely unaffected by this fix. This includes:
- NIN verification page behavior
- Admin dashboard document management
- KYC/CDD form submissions
- Claims form submissions
- Bulk verification workflows

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Incomplete Frontend Implementation**: The `CustomerVerificationPage.tsx` component has state variables for CAC documents (`cacDocuments`, `documentErrors`) and a document selection handler (`handleDocumentSelect`), but the UI only renders document upload fields in the form. The verification flow attempts to upload documents before CAC verification, but the upload endpoint may not be fully functional.

2. **Missing Backend Validation**: The backend endpoint `POST /api/identity/verify/:token/upload-document` exists but may lack proper token validation, file validation, or encryption implementation for customer uploads.

3. **Incomplete Storage Rules**: Firebase Storage rules may not properly authorize customer document uploads via the backend (using admin SDK with `uploadedBy == 'customer'` metadata).

4. **Previous Spec Misdirection**: The previous spec `.kiro/specs/cac-document-upload-management/` was designed for admin uploads in the dashboard, not customer uploads during verification, leading to incomplete customer-facing implementation.

## Correctness Properties

Property 1: Fault Condition - Customer CAC Document Upload

_For any_ customer accessing the CAC verification page with a valid token, the fixed CustomerVerificationPage component SHALL display three file upload fields (Certificate of Incorporation, Particulars of Directors, Share Allotment) with client-side validation (file type: PDF/JPEG/PNG, file size: max 10MB), upload all three documents to the backend with AES-256-GCM encryption before submitting the CAC number for verification, and display clear visual feedback (filename, size, checkmarks for success, error messages for validation failures).

**Validates: Requirements 2.1, 2.2, 2.3, 2.6**

Property 2: Preservation - Non-CAC Verification Behavior

_For any_ customer accessing the verification page with verificationType != 'CAC' (i.e., NIN verification), the fixed code SHALL produce exactly the same behavior as the original code, displaying only the NIN input field without document upload fields, and preserving all existing NIN verification functionality including validation, API calls, and success/failure handling.

**Validates: Requirements 3.1, 3.2, 3.3**

## Admin Document Access

### Admin Preview and Download

Admins need to be able to preview and download customer-uploaded CAC documents from the dashboard. The existing `CACDocumentPreview.tsx` component from the previous spec should work for this purpose.

**Access Control Requirements:**
- Only users with roles: `admin`, `super_admin`, or `compliance` can access documents
- Access is enforced at both frontend (UI hiding) and backend (API authorization) levels
- All document access (preview, download) is logged to audit trail

**Integration Points:**
- Identity dashboard should display document status indicators showing which documents are uploaded
- Clicking on an uploaded document should open the preview modal (existing `CACDocumentPreview.tsx`)
- Preview modal should show document with download button (for authorized users only)
- Backend endpoint `GET /api/cac-documents/:documentId` should handle document retrieval with decryption
- Backend should verify user role before returning document data

**Preservation Note:**
The admin document preview/download functionality from the previous spec (`.kiro/specs/cac-document-upload-management/`) should continue to work. The existing components (`CACDocumentPreview.tsx`, `cacStorageService.ts`, `cacAccessControl.ts`) handle this and should NOT be modified unless there are integration issues.

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/public/CustomerVerificationPage.tsx`

**Component**: `CustomerVerificationPage`

**Specific Changes**:
1. **Document Upload UI**: The three file upload fields are already rendered in the JSX (lines 760-880), so no changes needed to the UI structure. Verify that the fields are properly displayed and functional.

2. **Upload Flow Integration**: The `handleVerify` function already includes document upload logic (lines 300-330), uploading each document before CAC verification. Verify this logic works correctly and handles errors properly.

3. **Validation Logic**: The `handleDocumentSelect` function (lines 260-290) already validates file type and size. Verify validation messages are clear and user-friendly.

4. **Button State**: The verify button is already disabled until all documents are uploaded for CAC verification (line 920). Verify this logic works correctly.

5. **Visual Feedback**: The UI already displays filename, size, checkmarks, and error messages. Verify these are displayed correctly and provide clear feedback.

**File**: `server.js`

**Endpoint**: `POST /api/identity/verify/:token/upload-document`

**Specific Changes**:
1. **Token Validation**: Verify the endpoint properly validates the token, checks expiration, and ensures verificationType is 'CAC'

2. **File Validation**: Verify the endpoint validates file type (PDF, JPEG, PNG only) and file size (max 10MB)

3. **Encryption**: Verify the endpoint encrypts the file buffer using `encryptData()` from `server-utils/encryption.cjs` before uploading to Firebase Storage

4. **Storage Path**: Verify the endpoint uses the correct path format: `/cac-documents/{entryId}/{documentType}/{documentId}_{filename}`

5. **Metadata Creation**: Verify the endpoint creates a document in the `cac-documents` Firestore collection with:
   - `documentId`: Unique identifier
   - `entryId`: Identity entry ID from token
   - `documentType`: One of certificate_of_incorporation, particulars_of_directors, share_allotment
   - `fileName`: Original filename
   - `fileSize`: File size in bytes
   - `contentType`: MIME type
   - `encryptionIV`: Initialization vector for decryption
   - `storagePath`: Full path in Firebase Storage
   - `uploadedBy`: 'customer'
   - `uploadedAt`: Timestamp
   - `uploadedByToken`: Token used for upload

6. **Identity Entry Update**: Verify the endpoint updates the identity entry with document references in a `documents` field

7. **Audit Logging**: Verify the endpoint logs document upload events using the existing audit logger

**File**: `server.js` (Admin Document Access)

**Endpoint**: `GET /api/cac-documents/:documentId`

**Specific Changes**:
1. **Authorization**: Verify the endpoint checks user role (admin, super_admin, or compliance only)
2. **Document Retrieval**: Fetch document metadata from Firestore `cac-documents` collection
3. **Decryption**: Decrypt the document using `decryptData()` from `server-utils/encryption.cjs` with stored IV
4. **Response**: Return decrypted document with proper content-type headers
5. **Audit Logging**: Log document access (view/download) with user ID, document ID, and timestamp

**Note**: This endpoint may already exist from the previous spec. Verify it works correctly with customer-uploaded documents.

**File**: `storage.rules`

**Path**: `/cac-documents/{identityId}/{documentType}/{fileName}`

**Specific Changes**:
The storage rules already include proper authorization for customer uploads (lines 330-360). The rules allow:
- Create: When `request.resource.metadata.uploadedBy == 'customer'` (backend sets this metadata)
- Validation: File type (PDF, JPEG, PNG) and size (10MB max)
- Document type: Must be one of the three required types

Verify these rules work correctly when the backend uploads with admin SDK.

### Implementation Notes

- The frontend implementation appears complete based on code review
- The backend endpoint exists but needs verification of proper implementation
- The storage rules are already configured for customer uploads
- The main issue is likely incomplete backend implementation or missing error handling
- Testing should focus on end-to-end flow: token validation → file upload → encryption → storage → metadata creation → verification

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate a customer accessing the CAC verification page with a valid token and attempting to upload documents. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Document Upload UI Test**: Access CAC verification page, verify three upload fields are displayed (may pass on unfixed code if UI is already implemented)
2. **File Validation Test**: Select invalid file type (e.g., .txt), verify error message is displayed (may pass if validation is implemented)
3. **Document Upload API Test**: Upload valid document via API endpoint, verify encryption and storage (will fail on unfixed code if backend is incomplete)
4. **End-to-End Upload Test**: Complete full upload flow for all three documents, verify metadata creation (will fail on unfixed code)

**Expected Counterexamples**:
- Backend endpoint returns 500 error due to missing encryption implementation
- Documents are stored without encryption
- Metadata is not created in Firestore
- Identity entry is not updated with document references
- Possible causes: incomplete backend implementation, missing error handling, incorrect storage path

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := CustomerVerificationPage_fixed(input)
  ASSERT documentUploadFieldsDisplayed(result)
  ASSERT allThreeDocumentsCanBeUploaded(result)
  ASSERT documentsEncryptedBeforeStorage(result)
  ASSERT metadataCreatedInFirestore(result)
  ASSERT verifyButtonDisabledUntilAllUploaded(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT CustomerVerificationPage_original(input) = CustomerVerificationPage_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-CAC inputs

**Test Plan**: Observe behavior on UNFIXED code first for NIN verification and other flows, then write property-based tests capturing that behavior.

**Test Cases**:
1. **NIN Verification Preservation**: Verify NIN verification page displays only NIN input field, no document uploads
2. **Admin Document Management Preservation**: Verify admin dashboard document features continue to work
3. **Token Validation Preservation**: Verify token validation works for both NIN and CAC
4. **Audit Logging Preservation**: Verify all verification attempts are logged correctly

### Unit Tests

- Test document file selection handler with valid files (PDF, JPEG, PNG)
- Test document file selection handler with invalid files (wrong type, too large)
- Test document upload API endpoint with valid token and files
- Test document upload API endpoint with expired/invalid token
- Test document upload API endpoint with invalid file types
- Test encryption of document buffers before storage
- Test metadata creation in Firestore with correct fields
- Test identity entry update with document references
- Test verify button disabled state based on document upload status

### Property-Based Tests

- Generate random file types and sizes, verify validation works correctly
- Generate random CAC verification scenarios, verify documents are always uploaded before verification
- Generate random token states (valid, expired, used), verify proper authorization
- Test that all CAC verifications require exactly three documents
- Test that NIN verifications never require documents

### Integration Tests

- Test full CAC verification flow: token validation → document upload → encryption → storage → metadata creation → CAC verification → success
- Test error recovery: failed upload → retry → success
- Test partial upload: upload 2 documents → verify button disabled → upload 3rd → verify button enabled
- Test concurrent uploads: upload all 3 documents simultaneously
- Test storage rules: verify customer uploads are authorized via backend metadata
- Test audit trail: verify all document uploads are logged with proper context
- Test admin document access: admin views document → preview displays → download works → audit log created
- Test admin access control: non-admin user cannot access documents → 403 error returned
- Test admin preview with customer documents: verify existing `CACDocumentPreview.tsx` component works with customer-uploaded documents
