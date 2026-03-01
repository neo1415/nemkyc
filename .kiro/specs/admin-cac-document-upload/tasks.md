# Implementation Plan: Admin CAC Document Upload with Role-Based Access Control

## Overview

This implementation plan extends the existing CAC document management system to enable authorized users (admins, super_admins, compliance officers, and brokers) to upload and manage CAC documents on behalf of customers with role-based access control. The system introduces four distinct permission levels: Admin/Super Admin (full access to all records), Compliance (full access to all records including upload capability), Broker (upload and view access only to records they created), and Default (no access). All operations maintain existing security measures including AES-256-GCM encryption, comprehensive audit logging with role and ownership context, and access control while adding ownership-based scoping where brokers can only access records they created.

## Tasks

- [ ] 1. Enhance access control service with role-based permissions
  - [ ] 1.1 Extend cacAccessControl service in src/services/cacAccessControl.ts
    - Add isComplianceRole() function to check for compliance role
    - Add canViewDocument() function with role and ownership checks (admin/super_admin/compliance: all records, broker: own records only)
    - Add canUploadDocument() function with role and ownership checks (admin/super_admin/compliance: all records, broker: own records only)
    - Implement ownership verification for broker role (user.uid === ownerId)
    - Return clear permission error messages for each denial scenario
    - Integrate with existing isAdminRole() and isBrokerRole() functions
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.9, 2.10, 3.3, 3.4, 3.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [ ]* 1.2 Write unit tests for enhanced access control in src/__tests__/admin-cac-upload/accessControl.test.ts
    - Test admin can view all records
    - Test super_admin can view all records
    - Test compliance can view all records
    - Test broker can view own records
    - Test broker cannot view other records
    - Test admin can upload to all records
    - Test super_admin can upload to all records
    - Test compliance can upload to all records
    - Test broker can upload to own records
    - Test broker cannot upload to other records
    - Test default role denied access
    - Test permission error messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.3 Write property-based test for role-based access control in src/__tests__/admin-cac-upload/roleBasedAccessControl.property.test.ts
    - **Property 1: Role-Based Access Control**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.9, 2.10, 3.3, 3.4, 3.5, 6.5, 6.6, 8.7, 8.8, 8.9, 8.10**
    - Test that admin, super_admin, and compliance always have full access (view and upload) to all records
    - Test that broker has full access only when user.uid === record.ownerId
    - Test that default role never has access
    - Use fast-check to generate various user role and ownership combinations

- [ ] 2. Enhance audit logging with role and ownership context
  - [ ] 2.1 Extend CACAuditLogEntry interface in src/services/cacAuditLogger.ts
    - Add userRole field to capture user's role at time of action
    - Add ownerId field to capture record owner
    - Add isOwner boolean field to indicate if user is the owner
    - Add initiatedBy field ('admin' | 'broker' | 'compliance' | 'customer')
    - Update existing logging functions to include new fields
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.8_

  - [ ] 2.2 Implement new logging functions with context in src/services/cacAuditLogger.ts
    - Create logDocumentUploadWithContext() function
    - Create logDocumentViewWithContext() function
    - Create logAccessDenialWithContext() function
    - Include all role and ownership fields in log entries (userRole, ownerId, isOwner, initiatedBy)
    - Log compliance uploads with 'compliance' as initiatedBy
    - Ensure backward compatibility with existing logs
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.9_

  - [ ]* 2.3 Write unit tests for enhanced audit logging in src/__tests__/admin-cac-upload/auditLogging.test.ts
    - Test upload logging includes userRole, ownerId, isOwner, initiatedBy
    - Test view logging includes role and ownership context
    - Test access denial logging includes detailed reason
    - Test broker ownership flag is correct
    - Test admin uploads marked as 'admin' initiated
    - Test super_admin uploads marked as 'admin' initiated
    - Test compliance uploads marked as 'compliance' initiated
    - Test broker uploads marked as 'broker' initiated
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.8_

  - [ ]* 2.4 Write property-based test for permission verification audit logging in src/__tests__/admin-cac-upload/permissionVerificationAuditLogging.property.test.ts
    - **Property 2: Permission Verification Audit Logging**
    - **Validates: Requirements 1.7, 4.4, 4.6**
    - Test that every permission check creates an audit log entry
    - Test that log contains userId, userRole, identityRecordId, ownerId, action, result
    - Use fast-check to generate various permission check scenarios

  - [ ]* 2.5 Write property-based test for complete upload audit logging in src/__tests__/admin-cac-upload/completeUploadAuditLogging.property.test.ts
    - **Property 8: Complete Upload Audit Logging**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.8, 4.9**
    - Test that every upload creates audit log with all required fields
    - Test fields: eventType, action, documentId, documentType, identityRecordId, userId, userEmail, userName, userRole, ownerId, isOwner, initiatedBy, result, timestamp
    - Use fast-check to generate various upload scenarios

  - [ ]* 2.6 Write property-based test for ownership context in audit logs in src/__tests__/admin-cac-upload/ownershipContextAuditLogs.property.test.ts
    - **Property 9: Ownership Context in Audit Logs**
    - **Validates: Requirements 4.5, 4.6**
    - Test that broker actions always log ownership status (isOwner field)
    - Test that ownerId is always included in audit logs
    - Use fast-check to generate various broker action scenarios

- [ ] 3. Create Firestore indexes for role-based queries
  - [ ] 3.1 Update firestore.indexes.json file
    - Add composite index for cac-document-audit-logs: userRole + createdAt
    - Add composite index for cac-document-audit-logs: ownerId + createdAt
    - Add composite index for cac-document-audit-logs: isOwner + userRole + createdAt
    - Add composite index for cac-document-metadata: ownerId + isCurrent + uploadedAt
    - Add composite index for cac-document-metadata: uploaderRole + uploadedAt
    - _Requirements: 4.7, 5.4_

  - [ ]* 3.2 Write tests for Firestore indexes in src/__tests__/admin-cac-upload/firestoreIndexes.test.ts
    - Test query by userRole performs efficiently
    - Test query by ownerId performs efficiently
    - Test query by isOwner + userRole performs efficiently
    - Test query by uploaderRole performs efficiently
    - Verify no missing index warnings
    - _Requirements: 4.7, 5.4_

- [ ] 4. Update Firestore security rules for role-based access
  - [ ] 4.1 Update firestore.rules file
    - Add isAdminOrCompliance() helper function (combines admin, super_admin, and compliance)
    - Add isOwner(ownerId) helper function
    - Update cac-document-metadata read rules: admin/super_admin/compliance (all records), broker (own records only)
    - Update cac-document-metadata write rules: admin/super_admin/compliance (all records), broker (own records only)
    - Update cac-document-audit-logs read rules: admin/super_admin/compliance (all records), broker (own records only)
    - Update identity-lists entries rules: admin/super_admin/compliance (all records), broker (own records only)
    - _Requirements: 4.1, 4.2, 4.3, 5.4_

  - [ ]* 4.2 Write tests for Firestore security rules in src/__tests__/admin-cac-upload/firestoreSecurityRules.test.ts
    - Test admin can read/write all metadata
    - Test super_admin can read/write all metadata
    - Test compliance can read/write all metadata
    - Test broker can read/write own records only
    - Test broker cannot read/write other records
    - Test audit log read access by role (admin/super_admin/compliance: all, broker: own only)
    - Test audit log immutability (no updates/deletes)
    - _Requirements: 4.1, 4.2, 4.3, 5.4_

- [ ] 5. Update Firebase Storage security rules for ownership-based access
  - [ ] 5.1 Update storage.rules file
    - Add getUserRole() helper function
    - Add isAdminOrCompliance() helper function (combines admin, super_admin, and compliance)
    - Add isBroker() helper function
    - Add getOwnerIdFromPath() helper to extract ownerId from storage path
    - Update cac-documents read rules: admin/super_admin/compliance (all documents), broker (own documents only)
    - Update cac-documents write rules: admin/super_admin/compliance (all documents), broker (own documents only)
    - Maintain admin-only delete rules
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 5.2 Write tests for Storage security rules in src/__tests__/admin-cac-upload/storageSecurityRules.test.ts
    - Test admin can read/write/delete all documents
    - Test super_admin can read/write/delete all documents
    - Test compliance can read/write all documents
    - Test broker can read/write own documents only
    - Test broker cannot read/write other documents
    - Test path-based ownership extraction works correctly
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Implement enhanced CAC Upload Dialog component
  - [ ] 6.1 Create CACUploadDialog component in src/components/identity/CACUploadDialog.tsx
    - Accept identityRecordId and ownerId as props
    - Check user permissions on mount using canViewDocument() and canUploadDocument()
    - Display role badge (Admin Access, Compliance Access, Your Record, Access Denied)
    - Show all three document slots (Certificate of Incorporation, Particulars of Directors, Share Allotment)
    - Display existing documents with preview and download buttons for authorized users
    - Display upload fields for missing documents when user has upload permissions (admin/super_admin/compliance: all records, broker: own records only)
    - Show upload progress indicators with percentage
    - Display success messages after upload completion
    - Display error messages with specific failure reasons
    - Update display in real-time as documents are uploaded
    - Subscribe to Firestore updates for real-time sync
    - Unsubscribe on component unmount
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 6.2 Write unit tests for CACUploadDialog in src/__tests__/admin-cac-upload/CACUploadDialog.test.tsx
    - Test dialog opens with three document slots
    - Test admin view shows upload fields for missing documents
    - Test super_admin view shows upload fields for missing documents
    - Test compliance view shows upload fields for missing documents
    - Test broker view (own record) shows upload fields
    - Test broker view (not owner) shows access denied message
    - Test default role shows access denied message
    - Test role badges display correctly (Admin Access, Compliance Access, Your Record)
    - Test existing document display with metadata
    - Test preview and download buttons for authorized users
    - Test upload progress indicator updates
    - Test success message displays after upload
    - Test error message displays on failure
    - Test real-time updates when documents uploaded
    - Test component unsubscribes on unmount
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 6.3 Write property-based test for metadata display completeness in src/__tests__/admin-cac-upload/metadataDisplayCompleteness.property.test.tsx
    - **Property 12: Metadata Display Completeness**
    - **Validates: Requirements 2.6, 8.5**
    - Test that uploaded documents always display filename, upload date, and uploader email/name
    - Use fast-check to generate various document metadata

  - [ ]* 6.4 Write property-based test for conditional upload field display in src/__tests__/admin-cac-upload/conditionalUploadFieldDisplay.property.test.tsx
    - **Property 13: Conditional Upload Field Display**
    - **Validates: Requirements 2.3, 2.4, 12.1, 12.2**
    - Test that upload field displays if and only if: document is missing AND user has upload permissions (admin/super_admin/compliance: all records, broker: own records only)
    - Use fast-check to generate various document status and permission combinations

  - [ ]* 6.5 Write property-based test for preview and download button display in src/__tests__/admin-cac-upload/previewDownloadButtonDisplay.property.test.tsx
    - **Property 14: Preview and Download Button Display**
    - **Validates: Requirements 2.2, 8.1, 8.3**
    - Test that preview/download buttons display if and only if user has view permissions
    - Use fast-check to generate various permission scenarios

- [ ] 7. Implement Document Status Indicator component
  - [ ] 7.1 Create DocumentStatusIndicator component in src/components/identity/DocumentStatusIndicator.tsx
    - Accept identityRecordId and ownerId as props
    - Query document metadata to count uploaded documents
    - Display count as "X/3 documents uploaded"
    - Show green checkmark when all 3 documents uploaded
    - Show warning icon when documents missing
    - Make indicator clickable for authorized users
    - Check user permissions before allowing click
    - Open CACUploadDialog on click for authorized users
    - Show access denied message for unauthorized users
    - Display tooltip showing which specific documents are missing
    - Update in real-time when documents uploaded
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [ ]* 7.2 Write unit tests for DocumentStatusIndicator in src/__tests__/admin-cac-upload/DocumentStatusIndicator.test.tsx
    - Test count display accuracy (0/3, 1/3, 2/3, 3/3)
    - Test green checkmark for complete status
    - Test warning icon for incomplete status
    - Test clickability for admin (all records)
    - Test clickability for compliance (all records)
    - Test clickability for broker (own records only)
    - Test non-clickable for broker (other records)
    - Test tooltip shows missing documents
    - Test real-time updates
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9_

  - [ ]* 7.3 Write property-based test for document status count accuracy in src/__tests__/admin-cac-upload/documentStatusCountAccuracy.property.test.ts
    - **Property 10: Document Status Count Accuracy**
    - **Validates: Requirements 6.1**
    - Test that count always equals number of documents with status='uploaded'
    - Use fast-check to generate various document status combinations

  - [ ]* 7.4 Write property-based test for status indicator tooltip completeness in src/__tests__/admin-cac-upload/statusIndicatorTooltipCompleteness.property.test.tsx
    - **Property 11: Document Status Indicator Tooltip Completeness**
    - **Validates: Requirements 6.9**
    - Test that tooltip always lists all document types where status ≠ 'uploaded'
    - Use fast-check to generate various document status combinations

- [ ] 8. Integrate with IdentityListDetail page
  - [ ] 8.1 Update IdentityListDetail page in src/pages/admin/IdentityListDetail.tsx
    - Add DocumentStatusIndicator column to identity records table
    - Pass identityRecordId and ownerId to DocumentStatusIndicator
    - Handle dialog open/close state
    - Ensure ownerId field exists on identity records
    - Add migration for existing records without ownerId
    - _Requirements: 6.4, 6.8, 13.1_

  - [ ]* 8.2 Write integration tests for IdentityListDetail in src/__tests__/admin-cac-upload/identityListDetailIntegration.test.tsx
    - Test DocumentStatusIndicator displays in table
    - Test clicking indicator opens dialog for authorized users
    - Test clicking indicator shows access denied for unauthorized users
    - Test status updates after document upload
    - Test multiple records with different ownership
    - _Requirements: 6.4, 6.8, 13.1_

- [ ] 9. Implement document upload service with role-based validation
  - [ ] 9.1 Extend cacStorageService in src/services/cacStorageService.ts
    - Add uploadDocumentWithRole() function accepting user role and ownerId
    - Validate user permissions before upload using canUploadDocument() (admin/super_admin/compliance: all records, broker: own records only)
    - Call existing file validation (type, size)
    - Call existing encryption service
    - Upload to Firebase Storage with existing path structure
    - Create metadata with uploaderRole, uploaderEmail, ownerId, uploadSource fields
    - Log upload with role and ownership context
    - Return detailed error messages for permission failures
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 9.2 Write unit tests for role-based upload service in src/__tests__/admin-cac-upload/roleBasedUploadService.test.ts
    - Test admin can upload to any record
    - Test super_admin can upload to any record
    - Test compliance can upload to any record
    - Test broker can upload to own records
    - Test broker cannot upload to other records (permission denied)
    - Test file validation still enforced
    - Test encryption still applied
    - Test metadata includes role and ownership fields
    - Test audit logging includes role context
    - Test error messages for permission failures
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 9.3 Write property-based test for file type validation in src/__tests__/admin-cac-upload/fileTypeValidation.property.test.ts
    - **Property 3: File Type Validation**
    - **Validates: Requirements 3.1**
    - Test that only PDF, JPEG, PNG files are accepted
    - Test that other file types are rejected with descriptive error
    - Use fast-check to generate various file types

  - [ ]* 9.4 Write property-based test for file size validation in src/__tests__/admin-cac-upload/fileSizeValidation.property.test.ts
    - **Property 4: File Size Validation**
    - **Validates: Requirements 3.2**
    - Test that files ≤ 10MB are accepted
    - Test that files > 10MB are rejected with size limit error
    - Use fast-check to generate various file sizes

  - [ ]* 9.5 Write property-based test for document encryption in src/__tests__/admin-cac-upload/documentEncryption.property.test.ts
    - **Property 5: Document Encryption Before Storage**
    - **Validates: Requirements 3.6, 5.7**
    - Test that all uploaded documents are encrypted using AES-256-GCM
    - Test that stored version differs from original
    - Use fast-check to generate various document content

  - [ ]* 9.6 Write property-based test for storage path format in src/__tests__/admin-cac-upload/storagePathFormat.property.test.ts
    - **Property 6: Storage Path Format Consistency**
    - **Validates: Requirements 3.7, 5.6**
    - Test that all uploads use format: cac-documents/{ownerId}/{documentType}/{uniqueId}_{filename}
    - Use fast-check to generate various upload scenarios

  - [ ]* 9.7 Write property-based test for complete document metadata in src/__tests__/admin-cac-upload/completeDocumentMetadata.property.test.ts
    - **Property 7: Complete Document Metadata Creation**
    - **Validates: Requirements 3.8**
    - Test that metadata always contains all required fields
    - Test fields: documentId, documentType, filename, fileSize, mimeType, uploadedAt, uploaderId, uploaderEmail, uploaderRole, identityRecordId, ownerId, storagePath, encryptionMetadata, status, version, isCurrent, uploadSource
    - Use fast-check to generate various upload scenarios

- [ ] 10. Implement document preview and download with role-based access
  - [ ] 10.1 Extend existing CACDocumentPreview component in src/components/identity/CACDocumentPreview.tsx
    - Check user permissions before allowing preview using canViewDocument() (admin/super_admin/compliance: all records, broker: own records only)
    - Check user permissions before allowing download using canViewDocument() (admin/super_admin/compliance: all records, broker: own records only)
    - Display access denied message for unauthorized users
    - Log preview events with role and ownership context
    - Log download events with role and ownership context
    - Maintain existing preview functionality for authorized users
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11_

  - [ ]* 10.2 Write unit tests for role-based preview/download in src/__tests__/admin-cac-upload/roleBasedPreviewDownload.test.tsx
    - Test admin can preview/download all documents
    - Test super_admin can preview/download all documents
    - Test compliance can preview/download all documents
    - Test broker can preview/download own documents
    - Test broker cannot preview/download other documents
    - Test access denied messages display correctly
    - Test preview events logged with role context
    - Test download events logged with role context
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11_

- [ ] 11. Implement validation error handling with clear messages
  - [ ] 11.1 Extend cacErrorHandler in src/services/cacErrorHandler.ts
    - Add role-specific error messages for permission failures
    - Add ownership-specific error messages for broker access denials
    - Maintain existing validation error messages
    - Ensure error messages provide actionable guidance
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 11.2 Write unit tests for validation error handling in src/__tests__/admin-cac-upload/validationErrorHandling.test.ts
    - Test invalid file type error message
    - Test file size exceeded error message
    - Test corrupted file error message
    - Test permission denied error messages by role
    - Test ownership mismatch error message for brokers
    - Test error messages provide actionable guidance
    - Test validation errors display before upload begins
    - Test error clears when valid file selected
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 11.3 Write property-based test for validation failure audit logging in src/__tests__/admin-cac-upload/validationFailureAuditLogging.property.test.ts
    - **Property 15: Validation Failure Audit Logging**
    - **Validates: Requirements 9.7**
    - Test that every validation failure creates audit log entry
    - Test log contains validation rule that failed, file details, user info, timestamp
    - Use fast-check to generate various validation failure scenarios

- [ ] 12. Implement upload progress and feedback
  - [ ] 12.1 Add progress tracking to CACUploadDialog component
    - Display progress indicator showing upload percentage
    - Disable upload button during upload
    - Allow cancellation of in-progress uploads
    - Show individual progress for concurrent uploads
    - Display success message with document name on completion
    - Display error message with specific failure reason on error
    - Provide "Retry" button for failed uploads
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 12.2 Write unit tests for upload progress in src/__tests__/admin-cac-upload/uploadProgress.test.tsx
    - Test progress indicator displays during upload
    - Test progress percentage updates correctly
    - Test upload button disables during upload
    - Test cancellation works
    - Test multiple uploads show individual progress
    - Test success message displays on completion
    - Test error message displays on failure
    - Test retry button appears after failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 13. Implement concurrent upload handling
  - [ ] 13.1 Add concurrent upload support to CACUploadDialog
    - Allow selection of multiple files for different document types
    - Handle concurrent uploads efficiently
    - Display individual progress for each upload
    - Continue processing other uploads if one fails
    - Display summary of upload results (successes and failures)
    - Limit concurrent uploads to prevent resource exhaustion
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 13.2 Write unit tests for concurrent uploads in src/__tests__/admin-cac-upload/concurrentUploads.test.tsx
    - Test multiple file selection works
    - Test concurrent uploads process efficiently
    - Test individual progress indicators display
    - Test one failure doesn't stop others
    - Test upload results summary displays
    - Test concurrency limit enforced
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 13.3 Write property-based test for concurrent upload separate logging in src/__tests__/admin-cac-upload/concurrentUploadSeparateLogging.property.test.ts
    - **Property 20: Concurrent Upload Separate Logging**
    - **Validates: Requirements 11.7**
    - Test that each concurrent upload generates its own audit log entry with unique timestamp
    - Use fast-check to generate various concurrent upload scenarios

- [ ] 14. Implement document replacement with version history
  - [ ] 14.1 Add replacement functionality to CACUploadDialog
    - Hide upload field for already uploaded documents
    - Provide explicit "Replace" button for uploaded documents
    - Show confirmation dialog before allowing replacement
    - Display warning message about replacement
    - Archive previous version before uploading new version
    - Maintain version history for replaced documents
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 14.2 Write unit tests for document replacement in src/__tests__/admin-cac-upload/documentReplacement.test.tsx
    - Test upload field hidden for uploaded documents
    - Test replace button displays for uploaded documents
    - Test confirmation dialog appears before replacement
    - Test warning message displays
    - Test previous version archived
    - Test version history maintained
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.7_

  - [ ]* 14.3 Write property-based test for document replacement version archival in src/__tests__/admin-cac-upload/documentReplacementVersionArchival.property.test.ts
    - **Property 16: Document Replacement Version Archival**
    - **Validates: Requirements 12.5, 12.7**
    - Test that replacement always creates version history entry for old document
    - Test that old document's isCurrent flag is set to false
    - Use fast-check to generate various replacement scenarios

  - [ ]* 14.4 Write property-based test for replacement audit logging in src/__tests__/admin-cac-upload/replacementAuditLogging.property.test.ts
    - **Property 17: Replacement Audit Logging**
    - **Validates: Requirements 12.6**
    - Test that replacement always creates audit log with both old and new document IDs
    - Use fast-check to generate various replacement scenarios

- [ ] 15. Implement error recovery and retry mechanism
  - [ ] 15.1 Add retry functionality to CACUploadDialog
    - Retain selected file after upload failure
    - Display "Retry" button for failed uploads
    - Implement exponential backoff for retry attempts
    - Display retry attempt count
    - Suggest manual intervention after 3 failed attempts
    - Log retry attempts with success/failure status
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 15.2 Write unit tests for error recovery in src/__tests__/admin-cac-upload/errorRecovery.test.tsx
    - Test file retained after failure
    - Test retry button displays
    - Test retry with same file works
    - Test retry counter displays
    - Test manual intervention suggested after 3 failures
    - Test retry attempts logged
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6, 14.7_

  - [ ]* 15.3 Write property-based test for exponential backoff retry timing in src/__tests__/admin-cac-upload/exponentialBackoffRetryTiming.property.test.ts
    - **Property 18: Exponential Backoff Retry Timing**
    - **Validates: Requirements 14.4**
    - Test that delay between attempt N and N+1 is greater than delay between N-1 and N
    - Use fast-check to generate various retry sequences

  - [ ]* 15.4 Write property-based test for retry attempt audit logging in src/__tests__/admin-cac-upload/retryAttemptAuditLogging.property.test.ts
    - **Property 19: Retry Attempt Audit Logging**
    - **Validates: Requirements 14.7**
    - Test that every retry creates audit log entry with attempt number and result
    - Use fast-check to generate various retry scenarios

- [ ] 16. Implement real-time status updates
  - [ ] 16.1 Add real-time sync to CACUploadDialog and DocumentStatusIndicator
    - Subscribe to Firestore updates for identity record documents
    - Update dialog display when documents uploaded by other users
    - Update status indicator when documents uploaded
    - Display notification when another user uploads document
    - Handle concurrent uploads by multiple users gracefully
    - Unsubscribe from updates when components unmount
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [ ]* 16.2 Write unit tests for real-time updates in src/__tests__/admin-cac-upload/realTimeUpdates.test.tsx
    - Test dialog subscribes to Firestore updates
    - Test dialog updates when documents uploaded
    - Test status indicator updates when documents uploaded
    - Test notification displays when other user uploads
    - Test concurrent uploads handled gracefully
    - Test unsubscribe on unmount
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 17. Implement responsive UI design
  - [ ] 17.1 Create responsive styles in src/styles/admin-cac-upload.css
    - Implement responsive modal layout for CACUploadDialog
    - Stack document sections vertically on mobile
    - Provide touch-friendly upload buttons and controls
    - Support screens as small as 320px wide
    - Optimize layout for tablet devices (481px - 768px)
    - Ensure mobile file selection from device storage works
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 17.2 Write responsive UI tests in src/__tests__/admin-cac-upload/responsiveUI.test.tsx
    - Test modal adapts to screen size
    - Test vertical stacking on mobile
    - Test touch-friendly controls
    - Test minimum width support (320px)
    - Test tablet layout optimization
    - Test mobile file selection
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Run all unit tests for admin CAC upload feature
  - Run all property-based tests (20 properties)
  - Fix any failing tests
  - Ensure code coverage meets requirements
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Implement data migration for existing identity records
  - [ ] 19.1 Create migration script in scripts/migrate-identity-records-owner.cjs
    - Add ownerId field to existing identity records
    - Add ownerEmail field to existing identity records
    - Add ownerRole field to existing identity records
    - Default ownerId to first admin user or "system"
    - Query existing records without ownerId
    - Update records in batches
    - Log migration progress
    - Include rollback capability
    - _Requirements: 13.1, 13.2_

  - [ ]* 19.2 Write migration tests in scripts/__tests__/migrateIdentityRecordsOwner.test.cjs
    - Test migration adds ownerId to records
    - Test migration adds ownerEmail to records
    - Test migration adds ownerRole to records
    - Test default values applied correctly
    - Test batch processing works
    - Test rollback functionality
    - Test idempotency (running multiple times)
    - _Requirements: 13.1, 13.2_

- [ ] 20. Implement data migration for existing CAC documents
  - [ ] 20.1 Create migration script in scripts/migrate-cac-documents-metadata.cjs
    - Add uploaderRole field to existing document metadata
    - Add uploaderEmail field to existing document metadata
    - Add uploadSource field to existing document metadata
    - Default uploaderRole to "admin" for existing documents
    - Default uploadSource to "admin" for existing documents
    - Query existing documents without new fields
    - Update metadata in batches
    - Log migration progress
    - Include rollback capability
    - _Requirements: 13.1, 13.2_

  - [ ]* 20.2 Write migration tests in scripts/__tests__/migrateCACDocumentsMetadata.test.cjs
    - Test migration adds uploaderRole field
    - Test migration adds uploaderEmail field
    - Test migration adds uploadSource field
    - Test default values applied correctly
    - Test batch processing works
    - Test rollback functionality
    - Test idempotency
    - _Requirements: 13.1, 13.2_

- [ ] 21. Implement comprehensive integration tests
  - [ ]* 21.1 Write end-to-end integration test in src/__tests__/admin-cac-upload/e2e.test.ts
    - Test complete admin upload flow (select file → validate → encrypt → upload → store metadata → log audit → update UI)
    - Test complete super_admin upload flow
    - Test complete compliance upload flow (full access to all records)
    - Test complete broker upload flow for own record
    - Test broker access denial for other record
    - Test concurrent uploads by multiple users
    - Test document replacement flow
    - Test error recovery flow
    - Test real-time updates across users
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 11.1, 12.1, 14.1, 15.1_

  - [ ]* 21.2 Write security integration test in src/__tests__/admin-cac-upload/securityIntegration.test.ts
    - Test that all uploads are encrypted
    - Test that access control is enforced for all operations
    - Test that audit logging captures all events with role context
    - Test that unauthorized access attempts are blocked and logged
    - Test that Firestore rules prevent unauthorized access
    - Test that Storage rules prevent unauthorized access
    - _Requirements: 3.6, 4.1, 4.2, 4.3, 5.1, 5.7_

  - [ ]* 21.3 Write performance integration test in src/__tests__/admin-cac-upload/performanceIntegration.test.ts
    - Test upload time for 10MB file (target: < 30 seconds)
    - Test concurrent upload of 3 documents (target: < 60 seconds)
    - Test real-time update latency (target: < 2 seconds)
    - Test audit log write performance (target: < 500ms, non-blocking)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 22. Create user documentation
  - [ ] 22.1 Create admin user guide in docs/ADMIN_CAC_UPLOAD_GUIDE.md
    - Document how admins upload documents on behalf of customers
    - Document role-based access levels
    - Document how to view and download documents
    - Document how to replace documents
    - Document error messages and troubleshooting
    - Include screenshots and examples
    - _Requirements: 1.1, 2.1, 3.1, 8.1, 11.1, 12.1_

  - [ ] 22.2 Create broker user guide in docs/BROKER_CAC_UPLOAD_GUIDE.md
    - Document how brokers upload documents for their own records
    - Document ownership-based access restrictions
    - Document how to identify which records they own
    - Document error messages for access denials
    - Include examples and troubleshooting
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1_

  - [ ] 22.3 Create compliance user guide in docs/COMPLIANCE_CAC_ACCESS_GUIDE.md
    - Document full access (view and upload) for compliance role
    - Document how to view, download, and upload documents for all records
    - Document how to generate compliance reports
    - Document audit log access
    - Include examples and best practices
    - _Requirements: 1.2, 1.3, 4.1, 5.4, 8.1_

  - [ ] 22.4 Create developer documentation in docs/ADMIN_CAC_UPLOAD_DEVELOPER_GUIDE.md
    - Document role-based access control implementation
    - Document ownership-based scoping
    - Document enhanced audit logging
    - Document data models with new fields
    - Document Firestore and Storage security rules
    - Include code examples
    - _Requirements: 1.1, 4.1, 5.1, 13.1_

- [ ] 23. Create deployment documentation
  - [ ] 23.1 Create deployment checklist in docs/ADMIN_CAC_UPLOAD_DEPLOYMENT_CHECKLIST.md
    - List Firestore indexes to create
    - List Firestore security rules to deploy
    - List Firebase Storage rules to deploy
    - List migration scripts to run
    - List environment variables to configure
    - List monitoring to enable
    - List user training to complete
    - _Requirements: 3.5, 4.1, 5.4, 13.1, 13.2, 13.4_

  - [ ] 23.2 Create rollback plan in docs/ADMIN_CAC_UPLOAD_ROLLBACK_PLAN.md
    - Document rollback triggers
    - Document rollback procedures for code
    - Document rollback procedures for security rules
    - Document rollback procedures for data migrations
    - Document data preservation during rollback
    - Document verification after rollback
    - _Requirements: 13.1, 13.2_

- [ ] 24. Final checkpoint - Comprehensive testing and validation
  - Run complete test suite (unit, property-based, integration, security, performance)
  - Verify all 15 requirements are covered by implementation
  - Verify all 20 properties are tested
  - Verify code coverage meets or exceeds 80%
  - Run security audit tools
  - Run performance profiling
  - Verify documentation is complete
  - Fix any issues found
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Final integration and deployment preparation
  - [ ] 25.1 Verify integration with existing CAC document system
    - Verify existing customer upload flow still works
    - Verify existing document preview still works
    - Verify existing document download still works
    - Verify existing encryption service compatibility
    - Verify existing storage service compatibility
    - Verify existing metadata service compatibility
    - Verify existing audit logging compatibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [ ] 25.2 Perform user acceptance testing
    - Test admin upload flow with real users
    - Test broker upload flow with real users
    - Test compliance view flow with real users
    - Gather feedback on UI/UX
    - Verify error messages are clear
    - Verify performance is acceptable
    - Document any issues found
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 7.1, 8.1, 9.1, 10.1_

  - [ ] 25.3 Prepare production deployment
    - Create production deployment plan
    - Schedule deployment window
    - Prepare rollback procedures
    - Set up monitoring and alerting
    - Prepare communication to users
    - Train support team on new features
    - Prepare incident response plan
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 26. Final verification and sign-off
  - Verify all 15 requirements are implemented
  - Verify all 20 properties are tested and passing
  - Verify all tests pass (unit, property-based, integration, security, performance)
  - Verify documentation is complete and accurate
  - Verify security measures are in place and tested
  - Verify performance meets requirements
  - Verify monitoring is operational
  - Verify migration scripts are tested
  - Verify rollback procedures are documented
  - Obtain stakeholder sign-off
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties (20 properties total)
- Unit tests validate specific examples and edge cases
- Integration tests validate cross-component interactions
- Security tests validate protection against unauthorized access
- Performance tests validate system meets speed requirements
- Checkpoints ensure incremental validation
- Documentation tasks ensure knowledge transfer
- Migration tasks ensure existing data compatibility
- The feature reuses existing CAC document infrastructure (encryption, storage, metadata services)
- Role-based access control introduces four permission levels: Admin/Super Admin (full access), Compliance (full access including uploads), Broker (own records only), Default (no access)
- Ownership-based scoping ensures brokers can only access records they created
- Compliance role has full access (view and upload) to all identity records across the system
- Enhanced audit logging captures role and ownership context for all operations
- Real-time updates ensure UI reflects current state across multiple users
- Responsive design ensures usability on mobile, tablet, and desktop devices

