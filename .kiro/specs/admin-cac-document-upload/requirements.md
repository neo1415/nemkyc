# Requirements Document

## Introduction

This feature extends the existing CAC document management system to allow administrators to upload CAC documents on behalf of customers directly from the IdentityListDetail page. Currently, admins can only view existing CAC documents. This enhancement enables admins to complete missing document uploads when customers are unable to do so themselves, while maintaining all existing security measures including encryption, access control, and audit logging.

## Glossary

- **Admin_User**: A user with admin or super_admin role who can upload documents on behalf of customers and view all records
- **Compliance_User**: A user with compliance role who can view all CAC documents but cannot upload
- **Broker_User**: A user with broker role who can upload and view documents only for identity records they created
- **CAC_Upload_Dialog**: Extended dialog component that allows viewing and uploading CAC documents with role-based access control
- **Identity_Record**: A corporate client record in the identity list requiring CAC documents
- **Document_Upload_Service**: Service that handles admin-initiated document uploads
- **Admin_Audit_Logger**: Enhanced audit logger that tracks admin actions with customer context
- **Certificate_of_Incorporation**: First required CAC document
- **Particulars_of_Directors**: Second required CAC document
- **Share_Allotment**: Third required CAC document (Status Update)
- **Document_Status_Indicator**: UI component showing which documents are uploaded or missing
- **Upload_Permission_Validator**: Component that verifies admin permissions before allowing uploads
- **Existing_Document_Viewer**: Component that displays already uploaded documents with preview capability
- **Missing_Document_Uploader**: Component that provides upload fields for documents not yet uploaded

## Requirements

### Requirement 1: Role-Based Permission Verification

**User Story:** As a system administrator, I want only authorized users to upload and view CAC documents with appropriate access levels, so that document operations are properly controlled and audited.

#### Acceptance Criteria

1. WHEN a user opens the CAC documents dialog, THE Upload_Permission_Validator SHALL verify the user has admin, super_admin, compliance, or broker role
2. THE Upload_Permission_Validator SHALL allow upload capability for users with admin or super_admin roles
3. THE Upload_Permission_Validator SHALL allow view-only access for users with compliance role
4. THE Upload_Permission_Validator SHALL allow brokers to view and upload documents only for identity records they created
5. WHEN permission verification fails, THE CAC_Upload_Dialog SHALL display an access denied message
6. THE Upload_Permission_Validator SHALL integrate with the existing AuthContext for role verification
7. THE Admin_Audit_Logger SHALL log all permission verification attempts including denials

### Requirement 2: Extended CAC Documents Dialog with Scoped Access

**User Story:** As a user with appropriate permissions, I want to see existing documents and upload missing documents in a single dialog, with access scoped to my role, so that I can efficiently manage CAC documents within my authorization level.

#### Acceptance Criteria

1. WHEN a user clicks "View CAC Documents" on an Identity_Record, THE CAC_Upload_Dialog SHALL open displaying all three document slots
2. WHERE a document is already uploaded, THE Existing_Document_Viewer SHALL display the document with preview and download buttons
3. WHERE a document is missing AND user has upload permissions, THE Missing_Document_Uploader SHALL display an upload field for that document type
4. WHERE a document is missing AND user has view-only permissions, THE CAC_Upload_Dialog SHALL display "Missing" status without upload field
5. THE CAC_Upload_Dialog SHALL clearly indicate which documents are uploaded and which are missing
6. THE CAC_Upload_Dialog SHALL display upload timestamps and uploader information for existing documents
7. THE CAC_Upload_Dialog SHALL allow admins and super_admins to upload multiple missing documents in a single session
8. THE CAC_Upload_Dialog SHALL update the display in real-time as documents are uploaded
9. WHEN a broker accesses the dialog for a record they don't own, THE CAC_Upload_Dialog SHALL display an access denied message
10. WHEN a compliance user accesses the dialog, THE CAC_Upload_Dialog SHALL display view-only mode without upload fields

### Requirement 3: Role-Based Document Upload

**User Story:** As an authorized user, I want to upload missing CAC documents within my permission scope, so that I can complete document collection when customers cannot do so themselves.

#### Acceptance Criteria

1. WHEN an admin or super_admin selects a file for upload, THE Document_Upload_Service SHALL validate the file type is PDF, JPEG, or PNG
2. WHEN an admin or super_admin selects a file for upload, THE Document_Upload_Service SHALL validate the file size does not exceed 10MB
3. WHEN a broker selects a file for upload for a record they own, THE Document_Upload_Service SHALL validate and process the upload
4. WHEN a broker attempts to upload for a record they don't own, THE Document_Upload_Service SHALL deny the upload with permission error
5. WHEN a compliance user attempts to upload, THE Document_Upload_Service SHALL deny the upload with permission error
6. WHEN a file passes validation, THE Document_Upload_Service SHALL encrypt the document before storage
7. THE Document_Upload_Service SHALL store the encrypted document in Firebase Storage using the existing path structure
8. THE Document_Upload_Service SHALL create document metadata in Firestore including the uploader user ID and role
9. WHEN upload completes successfully, THE CAC_Upload_Dialog SHALL display a success message and update the document status
10. IF upload fails, THEN THE CAC_Upload_Dialog SHALL display a specific error message with retry option

### Requirement 4: Enhanced Audit Logging for Role-Based Uploads

**User Story:** As a compliance officer, I want all document operations to be clearly logged with user role and ownership context, so that I can track who accessed or uploaded documents and verify proper authorization.

#### Acceptance Criteria

1. WHEN a user uploads a document, THE Admin_Audit_Logger SHALL log the event with user ID, user role, customer identity record ID, and document type
2. THE Admin_Audit_Logger SHALL include a flag indicating whether the upload was admin-initiated, broker-initiated, or customer-initiated
3. THE Admin_Audit_Logger SHALL log the timestamp, user email, user role, and customer identity record details
4. WHEN a user views the CAC documents dialog, THE Admin_Audit_Logger SHALL log the view event with user role and customer context
5. WHEN a broker accesses a record they own, THE Admin_Audit_Logger SHALL log the access with ownership flag
6. WHEN a broker attempts to access a record they don't own, THE Admin_Audit_Logger SHALL log the denial with ownership mismatch reason
7. THE Admin_Audit_Logger SHALL store audit logs in Firestore with queryable indexes for user role and ownership filters
8. THE Admin_Audit_Logger SHALL distinguish between admin, broker, compliance, and customer uploads in log entries
9. THE Admin_Audit_Logger SHALL log failed upload attempts with the failure reason and user role

### Requirement 5: Reuse Existing Security Infrastructure

**User Story:** As a security administrator, I want admin uploads to use the same security measures as customer uploads, so that all documents are equally protected.

#### Acceptance Criteria

1. THE Document_Upload_Service SHALL use the existing cacEncryptionService for document encryption
2. THE Document_Upload_Service SHALL use the existing cacStorageService for Firebase Storage operations
3. THE Document_Upload_Service SHALL use the existing cacMetadataService for Firestore metadata storage
4. THE Document_Upload_Service SHALL use the existing cacAccessControl for permission verification
5. THE Document_Upload_Service SHALL use the existing cacFileValidator for file validation
6. THE Document_Upload_Service SHALL follow the same storage path structure as customer uploads
7. THE Document_Upload_Service SHALL apply the same encryption algorithm (AES-256-GCM) as customer uploads

### Requirement 6: Document Status Display with Role-Based Access

**User Story:** As a user, I want to see which CAC documents are missing for identity records I can access, so that I can quickly identify records needing document uploads within my authorization scope.

#### Acceptance Criteria

1. THE Document_Status_Indicator SHALL display the count of uploaded documents (e.g., "2/3 documents uploaded")
2. WHEN all three documents are uploaded, THE Document_Status_Indicator SHALL display a green checkmark or "Complete" status
3. WHEN documents are missing, THE Document_Status_Indicator SHALL display a warning icon or "Incomplete" status
4. THE Document_Status_Indicator SHALL be clickable to open the CAC_Upload_Dialog for authorized users
5. WHEN a broker views the list, THE Document_Status_Indicator SHALL only be clickable for records they own
6. WHEN an admin, super_admin, or compliance user views the list, THE Document_Status_Indicator SHALL be clickable for all records
7. THE Document_Status_Indicator SHALL update in real-time when documents are uploaded
8. THE Document_Status_Indicator SHALL integrate into the existing IdentityListDetail table structure
9. THE Document_Status_Indicator SHALL display tooltips showing which specific documents are missing
10. WHEN a broker clicks on a record they don't own, THE system SHALL display an access denied message

### Requirement 7: Upload Progress and Feedback

**User Story:** As an admin, I want clear feedback during document uploads, so that I know the upload status and can identify any issues.

#### Acceptance Criteria

1. WHEN an upload is in progress, THE CAC_Upload_Dialog SHALL display a progress indicator showing upload percentage
2. WHEN an upload completes successfully, THE CAC_Upload_Dialog SHALL display a success message with the document name
3. IF an upload fails, THEN THE CAC_Upload_Dialog SHALL display an error message with the specific failure reason
4. THE CAC_Upload_Dialog SHALL disable the upload button during upload to prevent duplicate submissions
5. THE CAC_Upload_Dialog SHALL allow cancellation of in-progress uploads
6. WHERE multiple documents are uploaded sequentially, THE CAC_Upload_Dialog SHALL show individual progress for each upload
7. THE CAC_Upload_Dialog SHALL provide a "Retry" button for failed uploads

### Requirement 8: Existing Document Preview and Download with Role-Based Access

**User Story:** As an authorized user, I want to preview and download existing documents within my access scope, so that I can verify document completeness and quality.

#### Acceptance Criteria

1. WHERE a document is already uploaded, THE Existing_Document_Viewer SHALL display a "Preview" button for authorized users
2. WHEN a user clicks the Preview button, THE Existing_Document_Viewer SHALL open the document in the existing CACDocumentPreview component
3. THE Existing_Document_Viewer SHALL display a "Download" button for each uploaded document to authorized users
4. WHEN a user clicks the Download button, THE Document_Upload_Service SHALL decrypt and download the document
5. THE Existing_Document_Viewer SHALL display document metadata including filename, upload date, and uploader
6. THE Existing_Document_Viewer SHALL use the existing cacAccessControl to verify user permissions based on role
7. WHEN a broker accesses documents for a record they own, THE Existing_Document_Viewer SHALL allow preview and download
8. WHEN a broker accesses documents for a record they don't own, THE Existing_Document_Viewer SHALL deny access
9. WHEN a compliance user accesses documents, THE Existing_Document_Viewer SHALL allow preview and download for all records
10. WHEN an admin or super_admin accesses documents, THE Existing_Document_Viewer SHALL allow preview and download for all records
11. THE Admin_Audit_Logger SHALL log preview and download events with user role and customer context

### Requirement 9: Validation Error Handling

**User Story:** As an admin, I want clear error messages when file validation fails, so that I can correct issues and successfully upload documents.

#### Acceptance Criteria

1. IF a file type is invalid, THEN THE CAC_Upload_Dialog SHALL display an error message indicating allowed file types (PDF, JPEG, PNG)
2. IF a file size exceeds 10MB, THEN THE CAC_Upload_Dialog SHALL display an error message indicating the size limit
3. IF a file is corrupted or unreadable, THEN THE CAC_Upload_Dialog SHALL display an error message indicating file corruption
4. THE CAC_Upload_Dialog SHALL display validation errors immediately upon file selection before upload begins
5. THE CAC_Upload_Dialog SHALL provide actionable guidance in error messages (e.g., "Please compress the PDF to under 10MB")
6. THE CAC_Upload_Dialog SHALL clear error messages when a new valid file is selected
7. THE Admin_Audit_Logger SHALL log validation failures with the specific validation rule that failed

### Requirement 10: Responsive UI Design

**User Story:** As an admin, I want the CAC upload dialog to work well on different screen sizes, so that I can upload documents from any device.

#### Acceptance Criteria

1. THE CAC_Upload_Dialog SHALL display in a responsive modal that adapts to screen size
2. WHEN viewed on mobile devices, THE CAC_Upload_Dialog SHALL stack document sections vertically
3. THE CAC_Upload_Dialog SHALL provide touch-friendly upload buttons and controls on mobile devices
4. THE CAC_Upload_Dialog SHALL maintain usability on screens as small as 320px wide
5. THE Existing_Document_Viewer SHALL display document previews in a mobile-friendly format
6. THE Missing_Document_Uploader SHALL support mobile file selection from device storage
7. THE CAC_Upload_Dialog SHALL optimize layout for tablet devices (481px - 768px width)

### Requirement 11: Concurrent Upload Handling

**User Story:** As an admin, I want to upload multiple missing documents efficiently, so that I can complete document collection quickly.

#### Acceptance Criteria

1. THE CAC_Upload_Dialog SHALL allow selection of multiple files for different document types simultaneously
2. WHEN multiple uploads are initiated, THE Document_Upload_Service SHALL handle concurrent uploads efficiently
3. THE CAC_Upload_Dialog SHALL display individual progress indicators for each concurrent upload
4. IF one upload fails, THEN THE CAC_Upload_Dialog SHALL continue processing other uploads
5. THE CAC_Upload_Dialog SHALL display a summary of upload results showing successes and failures
6. THE Document_Upload_Service SHALL limit concurrent uploads to prevent resource exhaustion
7. THE Admin_Audit_Logger SHALL log each upload separately with individual timestamps

### Requirement 12: Document Replacement Prevention

**User Story:** As a compliance officer, I want to prevent accidental replacement of existing documents, so that uploaded documents are not lost.

#### Acceptance Criteria

1. WHERE a document is already uploaded, THE CAC_Upload_Dialog SHALL NOT display an upload field for that document type
2. THE CAC_Upload_Dialog SHALL only show upload fields for missing documents
3. IF an admin needs to replace a document, THE CAC_Upload_Dialog SHALL require explicit confirmation
4. THE CAC_Upload_Dialog SHALL display a warning message before allowing document replacement
5. WHEN a document is replaced, THE Document_Upload_Service SHALL archive the previous version
6. THE Admin_Audit_Logger SHALL log document replacement events with both old and new document IDs
7. THE CAC_Upload_Dialog SHALL maintain version history for replaced documents

### Requirement 13: Integration with Existing Components

**User Story:** As a developer, I want the admin upload feature to integrate seamlessly with existing components, so that development time is minimized and consistency is maintained.

#### Acceptance Criteria

1. THE CAC_Upload_Dialog SHALL extend the existing CACDocumentUpload component
2. THE CAC_Upload_Dialog SHALL use the existing CACDocumentPreview component for document previews
3. THE Document_Upload_Service SHALL use the existing cacStorageService for storage operations
4. THE Document_Upload_Service SHALL use the existing cacMetadataService for metadata management
5. THE Document_Upload_Service SHALL use the existing cacEncryptionService for encryption operations
6. THE CAC_Upload_Dialog SHALL integrate with the existing useDocumentPreview hook
7. THE CAC_Upload_Dialog SHALL follow existing code organization and naming conventions

### Requirement 14: Error Recovery and Retry

**User Story:** As an admin, I want to retry failed uploads without re-selecting files, so that I can recover from temporary network issues.

#### Acceptance Criteria

1. WHEN an upload fails due to network issues, THE CAC_Upload_Dialog SHALL retain the selected file
2. THE CAC_Upload_Dialog SHALL display a "Retry" button for failed uploads
3. WHEN an admin clicks Retry, THE Document_Upload_Service SHALL attempt the upload again with the same file
4. THE Document_Upload_Service SHALL implement exponential backoff for retry attempts
5. THE CAC_Upload_Dialog SHALL display the number of retry attempts made
6. IF upload fails after 3 retry attempts, THEN THE CAC_Upload_Dialog SHALL suggest manual intervention
7. THE Admin_Audit_Logger SHALL log retry attempts with success or failure status

### Requirement 15: Real-Time Status Updates

**User Story:** As an admin, I want the document status to update immediately after upload, so that I can see the current state without refreshing.

#### Acceptance Criteria

1. WHEN a document upload completes, THE Document_Status_Indicator SHALL update in real-time without page refresh
2. THE CAC_Upload_Dialog SHALL subscribe to Firestore updates for the Identity_Record
3. WHEN document metadata changes, THE CAC_Upload_Dialog SHALL update the display automatically
4. THE Document_Status_Indicator SHALL reflect changes made by other admins in real-time
5. THE CAC_Upload_Dialog SHALL display a notification when another admin uploads a document for the same record
6. THE CAC_Upload_Dialog SHALL handle concurrent uploads by multiple admins gracefully
7. THE CAC_Upload_Dialog SHALL unsubscribe from updates when closed to prevent memory leaks
