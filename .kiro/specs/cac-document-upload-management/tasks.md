# Implementation Plan: CAC Document Upload Management

## Overview

This implementation plan covers the development of CAC (Corporate Affairs Commission) document upload and management capabilities for corporate clients. The system will collect, securely store, and manage three mandatory CAC documents: Certificate of Incorporation, Particulars of Directors, and Share Allotment (Status Update). The feature integrates with existing identity collection infrastructure while adding document-specific security, validation, and access control mechanisms.

## Tasks

- [x] 1. Set up CAC document data models and types
  - Create TypeScript interfaces for CAC document metadata in src/types/cacDocuments.ts
  - Define document types enum (Certificate_of_Incorporation, Particulars_of_Directors, Share_Allotment)
  - Define document status types (uploaded, missing, pending, failed)
  - Define upload progress state types
  - Define document metadata interface (filename, size, MIME type, upload timestamp, uploader ID, storage path, encryption metadata)
  - Define document version history interface
  - _Requirements: 1.1, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 2. Implement file validation utilities
  - [x] 2.1 Create file validator utility in src/utils/cacFileValidator.ts
    - Implement file type validation (PDF, JPEG, PNG)
    - Implement file size validation (10MB limit)
    - Implement MIME type verification
    - Implement file content validation to prevent malicious uploads
    - Return detailed validation error messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 12.1, 12.6_

  - [x] 2.2 Write unit tests for file validator in src/__tests__/cac-documents/fileValidator.test.ts
    - Test valid file types (PDF, JPEG, PNG)
    - Test invalid file types rejection
    - Test file size validation (under and over 10MB)
    - Test MIME type verification
    - Test error message formatting
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.3 Write property-based tests for file validator in src/__tests__/cac-documents/fileValidator.property.test.ts
    - **Property 1: File type validation consistency**
    - **Validates: Requirements 2.1, 2.2**
    - Test that valid file types always pass validation
    - Test that invalid file types always fail validation
    - Use fast-check to generate various file type combinations


  - [x] 2.4 Write property-based tests for file size validation in src/__tests__/cac-documents/fileSizeValidation.property.test.ts
    - **Property 2: File size boundary validation**
    - **Validates: Requirements 2.2, 2.4**
    - Test that files under 10MB always pass
    - Test that files over 10MB always fail
    - Use fast-check to generate various file sizes

- [x] 3. Implement document encryption service
  - [x] 3.1 Create CAC document encryption wrapper in src/services/cacEncryptionService.ts
    - Integrate with existing server-utils/encryption.cjs
    - Implement document encryption before upload
    - Implement document decryption for viewing/download
    - Handle encryption errors with proper error messages
    - Clear sensitive data from memory after operations
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 12.4_

  - [x] 3.2 Write unit tests for encryption service in src/__tests__/cac-documents/encryptionService.test.ts
    - Test document encryption
    - Test document decryption
    - Test encryption error handling
    - Test decryption error handling
    - Test memory cleanup
    - _Requirements: 3.1, 3.4, 12.4_

  - [x] 3.3 Write property-based tests for encryption in src/__tests__/cac-documents/encryption.property.test.ts
    - **Property 3: Encryption round-trip consistency**
    - **Validates: Requirements 3.1, 3.4**
    - Test that encrypt(decrypt(data)) === data for all valid inputs
    - Use fast-check to generate various document content

  - [x] 3.4 Write security tests for encryption in src/__tests__/cac-documents/encryptionSecurity.test.ts
    - Test that encrypted data differs from plaintext
    - Test that same plaintext produces different ciphertext (due to IV)
    - Test that tampering with encrypted data causes decryption failure
    - Test that invalid IV causes decryption failure
    - _Requirements: 3.1, 3.2, 12.4_

- [ ] 4. Implement Firebase Storage integration
  - [x] 4.1 Create storage service in src/services/cacStorageService.ts
    - Implement secure document upload to Firebase Storage
    - Generate unique storage paths for each document
    - Implement chunked upload for files over 5MB
    - Implement resumable upload support
    - Implement upload progress tracking
    - Handle concurrent uploads efficiently
    - Implement document download with decryption
    - Preserve original filenames during download
    - _Requirements: 3.2, 3.3, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3_

  - [x] 4.2 Write unit tests for storage service in src/__tests__/cac-documents/storageService.test.ts
    - Test document upload
    - Test chunked upload for large files
    - Test upload progress tracking
    - Test document download
    - Test filename preservation
    - Test error handling for upload failures
    - Test error handling for download failures
    - _Requirements: 3.2, 8.1, 8.3, 9.1, 9.3_

  - [x] 4.3 Write property-based tests for storage paths in src/__tests__/cac-documents/storagePaths.property.test.ts
    - **Property 4: Storage path uniqueness**
    - **Validates: Requirements 3.3**
    - Test that each document gets a unique storage path
    - Use fast-check to generate various document metadata

  - [x] 4.4 Write integration tests for storage in src/__tests__/cac-documents/storageIntegration.test.ts
    - Test complete upload-download cycle
    - Test resumable upload after interruption
    - Test concurrent uploads
    - Test storage quota handling
    - _Requirements: 8.2, 8.4, 12.5_


- [x] 5. Implement Firestore metadata management
  - [x] 5.1 Create metadata service in src/services/cacMetadataService.ts
    - Implement document metadata storage in Firestore
    - Link documents to identity records
    - Implement version history tracking
    - Implement metadata queries with indexes
    - Handle metadata updates for document replacement
    - _Requirements: 3.6, 3.7, 11.3, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 5.2 Write unit tests for metadata service in src/__tests__/cac-documents/metadataService.test.ts
    - Test metadata creation
    - Test metadata retrieval
    - Test metadata updates
    - Test version history tracking
    - Test identity record linking
    - _Requirements: 3.6, 3.7, 11.3, 14.1_

  - [x] 5.3 Write property-based tests for metadata in src/__tests__/cac-documents/metadata.property.test.ts
    - **Property 5: Metadata completeness**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**
    - Test that all required metadata fields are always present
    - Use fast-check to generate various document scenarios

  - [x] 5.4 Write integration tests for metadata queries in src/__tests__/cac-documents/metadataQueries.test.ts
    - Test querying documents by identity record
    - Test querying documents by type
    - Test querying documents by upload date
    - Test version history retrieval
    - _Requirements: 14.7_

- [x] 6. Implement access control and permissions
  - [x] 6.1 Create access control service in src/services/cacAccessControl.ts
    - Integrate with existing AuthContext
    - Implement permission checking for document viewing
    - Implement permission checking for document downloading
    - Implement role-based access (admin, super_admin, broker owner)
    - Return clear permission error messages
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 12.3_

  - [x] 6.2 Write unit tests for access control in src/__tests__/cac-documents/accessControl.test.ts
    - Test admin access
    - Test super_admin access
    - Test broker owner access
    - Test unauthorized user access denial
    - Test permission error messages
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 12.3_

  - [x] 6.3 Write property-based tests for access control in src/__tests__/cac-documents/accessControl.property.test.ts
    - **Property 6: Access control consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Test that authorized users always have access
    - Test that unauthorized users never have access
    - Use fast-check to generate various user role combinations

  - [x] 6.4 Write security tests for access control in src/__tests__/cac-documents/accessControlSecurity.test.ts
    - Test that access checks cannot be bypassed
    - Test that failed access attempts are logged
    - Test that permission checks occur before document operations
    - _Requirements: 4.1, 4.3, 5.7_

- [x] 7. Implement audit logging
  - [x] 7.1 Create audit logging service in src/services/cacAuditLogger.ts
    - Integrate with existing audit logging infrastructure
    - Log document upload events
    - Log document view events
    - Log document download events
    - Log failed access attempts with reasons
    - Include user ID, document ID, timestamp, and action type
    - Store logs in Firestore with queryable indexes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 7.2 Write unit tests for audit logging in src/__tests__/cac-documents/auditLogging.test.ts
    - Test upload event logging
    - Test view event logging
    - Test download event logging
    - Test failed access logging
    - Test log data completeness
    - _Requirements: 5.1, 5.2, 5.3, 5.7_

  - [x] 7.3 Write property-based tests for audit logging in src/__tests__/cac-documents/auditLogging.property.test.ts
    - **Property 7: Audit log completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**
    - Test that every document operation generates an audit log
    - Use fast-check to generate various operation sequences


  - [x] 7.4 Write integration tests for audit trail in src/__tests__/cac-documents/auditTrail.test.ts
    - Test complete audit trail for document lifecycle
    - Test audit log queries by user
    - Test audit log queries by document
    - Test audit log queries by time range
    - _Requirements: 5.4, 5.6_

- [x] 8. Implement document upload UI component
  - [x] 8.1 Create CAC document upload component in src/components/identity/CACDocumentUpload.tsx
    - Create three distinct upload fields for each document type
    - Display filename and file size after selection
    - Show upload progress indicator with percentage
    - Display success indicator on completion
    - Display error messages with failure reasons
    - Integrate with existing UploadDialog component
    - Support drag-and-drop file selection
    - Show "Replace" button for already uploaded documents
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 11.1, 11.2_

  - [x] 8.2 Write unit tests for upload component in src/__tests__/cac-documents/CACDocumentUpload.test.tsx
    - Test rendering of three upload fields
    - Test file selection handling
    - Test filename and size display
    - Test progress indicator display
    - Test success indicator display
    - Test error message display
    - Test replace button functionality
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1_

  - [x] 8.3 Write property-based tests for upload UI in src/__tests__/cac-documents/uploadUI.property.test.tsx
    - **Property 8: Upload progress accuracy**
    - **Validates: Requirements 1.3, 8.5**
    - Test that progress indicator always reflects actual upload progress
    - Use fast-check to generate various upload scenarios

  - [x] 8.4 Write integration tests for upload flow in src/__tests__/cac-documents/uploadFlow.test.tsx
    - Test complete upload flow for all three documents
    - Test concurrent uploads
    - Test upload cancellation
    - Test upload retry after failure
    - _Requirements: 1.1, 8.4, 8.6_

- [x] 9. Implement document preview component
  - [x] 9.1 Create document preview component in src/components/identity/CACDocumentPreview.tsx
    - Display documents in modal dialog
    - Render PDF documents using PDF viewer
    - Display images with zoom controls
    - Show loading indicator while fetching
    - Display error message on preview failure
    - Include download button for authorized users
    - Implement lazy loading for document lists
    - Cache decrypted documents for session
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.1, 10.2_

  - [x] 9.2 Write unit tests for preview component in src/__tests__/cac-documents/CACDocumentPreview.test.tsx
    - Test modal rendering
    - Test PDF rendering
    - Test image rendering with zoom
    - Test loading indicator
    - Test error message display
    - Test download button visibility for authorized users
    - Test download button hidden for unauthorized users
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 9.3 Write property-based tests for preview in src/__tests__/cac-documents/preview.property.test.tsx
    - **Property 9: Preview authorization consistency**
    - **Validates: Requirements 6.4, 6.7**
    - Test that preview access always respects authorization
    - Use fast-check to generate various user permission scenarios

  - [ ] 9.4 Write performance tests for preview in src/__tests__/cac-documents/previewPerformance.test.ts
    - Test preview loading time for files under 5MB
    - Test lazy loading behavior
    - Test caching effectiveness
    - Test thumbnail generation performance
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_


- [x] 10. Implement document status display in dashboard
  - [x] 10.1 Update IdentityListsDashboard component in src/pages/admin/IdentityListsDashboard.tsx
    - Add document status indicators for each document type
    - Display green checkmark for uploaded documents
    - Display red X for missing documents
    - Show upload timestamps for uploaded documents
    - Make status indicators clickable to preview documents
    - Update status in real-time when documents are uploaded
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 10.2 Write unit tests for dashboard updates in src/__tests__/cac-documents/dashboardStatus.test.tsx
    - Test status indicator rendering
    - Test uploaded document indicator
    - Test missing document indicator
    - Test timestamp display
    - Test clickable status indicators
    - Test real-time status updates
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_

  - [x] 10.3 Write property-based tests for status display in src/__tests__/cac-documents/statusDisplay.property.test.tsx
    - **Property 10: Status indicator accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Test that status indicators always reflect actual document state
    - Use fast-check to generate various document state combinations

  - [x] 10.4 Write integration tests for dashboard in src/__tests__/cac-documents/dashboardIntegration.test.tsx
    - Test complete document lifecycle in dashboard
    - Test status updates after upload
    - Test status updates after replacement
    - Test preview opening from status indicator
    - _Requirements: 7.5, 7.6, 7.7_

- [x] 11. Implement document replacement functionality
  - [x] 11.1 Create document replacement service in src/services/cacReplacementService.ts
    - Implement document replacement logic
    - Archive previous version with timestamp
    - Update metadata for new version
    - Maintain version history
    - Log replacement events
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 11.2 Write unit tests for replacement service in src/__tests__/cac-documents/replacementService.test.ts
    - Test document replacement
    - Test version archiving
    - Test metadata updates
    - Test version history maintenance
    - Test replacement logging
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [x] 11.3 Write property-based tests for replacement in src/__tests__/cac-documents/replacement.property.test.ts
    - **Property 11: Version history integrity**
    - **Validates: Requirements 11.3, 11.5**
    - Test that version history always maintains complete record
    - Use fast-check to generate various replacement sequences

  - [x] 11.4 Write integration tests for replacement in src/__tests__/cac-documents/replacementIntegration.test.ts
    - Test complete replacement flow
    - Test multiple replacements
    - Test version history retrieval
    - Test audit trail for replacements
    - _Requirements: 11.4, 11.5, 11.6_

- [x] 12. Implement error handling and user feedback
  - [x] 12.1 Create error handling service in src/services/cacErrorHandler.ts
    - Implement specific error messages for validation failures
    - Implement network error messages with retry option
    - Implement permission error messages
    - Implement security error messages
    - Implement storage quota error messages
    - Provide actionable guidance in error messages
    - Log all errors for debugging
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 12.2 Write unit tests for error handling in src/__tests__/cac-documents/errorHandling.test.ts
    - Test validation error messages
    - Test network error messages
    - Test permission error messages
    - Test security error messages
    - Test storage quota error messages
    - Test error logging
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 12.3 Write property-based tests for error messages in src/__tests__/cac-documents/errorMessages.property.test.ts
    - **Property 12: Error message clarity**
    - **Validates: Requirements 12.1, 12.6**
    - Test that error messages always provide actionable guidance
    - Use fast-check to generate various error scenarios


  - [x] 12.4 Write integration tests for error recovery in src/__tests__/cac-documents/errorRecovery.test.ts
    - Test retry after network failure
    - Test recovery from validation errors
    - Test recovery from permission errors
    - Test error state cleanup
    - _Requirements: 12.2, 12.3, 8.6_

- [x] 13. Implement responsive UI design
  - [x] 13.1 Create responsive styles in src/styles/cac-documents.css
    - Implement responsive layout for upload fields
    - Implement responsive modal for previews
    - Implement mobile-friendly status indicators
    - Implement touch-friendly controls
    - Support screens as small as 320px
    - Optimize preview rendering for mobile
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 13.2 Write responsive UI tests in src/__tests__/cac-documents/responsiveUI.test.tsx
    - Test layout on different screen sizes
    - Test modal responsiveness
    - Test mobile status indicators
    - Test touch controls
    - Test minimum width support (320px)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 13.3 Write property-based tests for responsive behavior in src/__tests__/cac-documents/responsive.property.test.tsx
    - **Property 13: Responsive layout consistency**
    - **Validates: Requirements 15.1, 15.5**
    - Test that layout remains usable at all screen sizes
    - Use fast-check to generate various viewport dimensions

  - [x] 13.4 Write mobile-specific tests in src/__tests__/cac-documents/mobileUI.test.tsx
    - Test mobile file selection
    - Test camera integration for document capture
    - Test mobile preview rendering
    - Test mobile upload progress
    - _Requirements: 15.6, 15.7_

- [x] 14. Implement backend API endpoints
  - [x] 14.1 Create CAC document API routes in server.js
    - Implement POST /api/cac-documents/upload endpoint
    - Implement GET /api/cac-documents/:documentId endpoint
    - Implement GET /api/cac-documents/identity/:identityId endpoint
    - Implement PUT /api/cac-documents/:documentId/replace endpoint
    - Implement DELETE /api/cac-documents/:documentId endpoint
    - Integrate with authentication middleware
    - Integrate with access control
    - Integrate with audit logging
    - _Requirements: 3.2, 3.6, 4.1, 5.1, 11.2_

  - [x] 14.2 Write unit tests for API endpoints in server-utils/__tests__/cacDocumentAPI.test.cjs
    - Test upload endpoint
    - Test get document endpoint
    - Test get documents by identity endpoint
    - Test replace endpoint
    - Test delete endpoint
    - Test authentication enforcement
    - Test authorization enforcement
    - _Requirements: 3.2, 4.1, 4.2_

  - [x] 14.3 Write property-based tests for API in server-utils/__tests__/cacDocumentAPI.property.test.cjs
    - **Property 14: API authentication consistency**
    - **Validates: Requirements 4.1, 4.2**
    - Test that all endpoints enforce authentication
    - Use fast-check to generate various request scenarios

  - [x] 14.4 Write integration tests for API in server-utils/__tests__/cacDocumentAPIIntegration.test.cjs
    - Test complete upload-retrieve-delete flow
    - Test concurrent API requests
    - Test rate limiting
    - Test error responses
    - _Requirements: 3.2, 8.4_

- [x] 15. Implement Firebase Storage security rules
  - [x] 15.1 Update storage.rules file
    - Add rules for CAC document storage paths
    - Enforce authentication for all document operations
    - Enforce authorization based on user roles
    - Prevent direct access to encrypted documents
    - Allow only authorized file types
    - Enforce file size limits
    - _Requirements: 3.2, 4.1, 4.2, 13.4_

  - [x] 15.2 Write security rules tests in src/__tests__/cac-documents/storageRules.test.ts
    - Test authenticated user access
    - Test unauthenticated user denial
    - Test role-based access
    - Test file type restrictions
    - Test file size restrictions
    - _Requirements: 4.1, 4.2, 13.4_


  - [x] 15.3 Write property-based tests for security rules in src/__tests__/cac-documents/storageRulesSecurity.property.test.ts
    - **Property 15: Security rules enforcement**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Test that security rules always prevent unauthorized access
    - Use fast-check to generate various access attempt scenarios

- [x] 16. Implement Firestore security rules and indexes
  - [x] 16.1 Update firestore.rules file
    - Add rules for CAC document metadata collection
    - Add rules for audit logs collection
    - Enforce authentication and authorization
    - Prevent unauthorized metadata access
    - _Requirements: 3.6, 4.1, 5.4_

  - [x] 16.2 Update firestore.indexes.json file
    - Add composite indexes for document queries
    - Add indexes for audit log queries
    - Add indexes for version history queries
    - Optimize query performance
    - _Requirements: 5.4, 14.7_

  - [x] 16.3 Write Firestore rules tests in src/__tests__/cac-documents/firestoreRules.test.ts
    - Test metadata access rules
    - Test audit log access rules
    - Test query performance with indexes
    - _Requirements: 3.6, 4.1, 5.4_

- [x] 17. Checkpoint - Ensure all tests pass
  - Run all unit tests for CAC document feature
  - Run all property-based tests
  - Run all integration tests
  - Fix any failing tests
  - Ensure code coverage meets requirements
  - Ensure all tests pass, ask the user if questions arise.

- [-] 18. Implement performance optimization
  - [x] 18.1 Create performance optimization service in src/services/cacPerformanceOptimizer.ts
    - Implement document caching strategy
    - Implement thumbnail generation for images
    - Implement lazy loading for document lists
    - Implement request batching for multiple documents
    - Implement connection pooling for Firebase
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 18.2 Write performance tests in src/__tests__/cac-documents/performance.test.ts
    - Test document loading time (under 3 seconds for files under 5MB)
    - Test caching effectiveness
    - Test lazy loading behavior
    - Test thumbnail generation speed
    - Test concurrent request handling
    - _Requirements: 10.3, 10.1, 10.2, 10.4, 10.6_

  - [ ] 18.3 Write property-based tests for caching in src/__tests__/cac-documents/caching.property.test.ts
    - **Property 16: Cache consistency**
    - **Validates: Requirements 10.2**
    - Test that cached documents always match source documents
    - Use fast-check to generate various caching scenarios

  - [ ] 18.4 Write load tests in src/__tests__/cac-documents/loadTesting.test.ts
    - Test system under high concurrent upload load
    - Test system under high concurrent download load
    - Test system under high concurrent preview load
    - Test memory usage during operations
    - _Requirements: 8.4, 10.6_

- [ ] 19. Implement comprehensive integration tests
  - [ ] 19.1 Write end-to-end integration tests in src/__tests__/cac-documents/e2e.test.ts
    - Test complete document lifecycle (upload, view, download, replace, delete)
    - Test multi-user scenarios
    - Test permission enforcement across all operations
    - Test audit trail completeness
    - Test error recovery scenarios
    - _Requirements: 1.1, 3.1, 4.1, 5.1, 6.1, 9.1, 11.1_

  - [ ] 19.2 Write cross-component integration tests in src/__tests__/cac-documents/crossComponent.test.tsx
    - Test upload component with storage service
    - Test preview component with encryption service
    - Test dashboard with metadata service
    - Test access control with audit logging
    - _Requirements: 1.7, 6.1, 7.1, 13.1_

  - [ ] 19.3 Write property-based integration tests in src/__tests__/cac-documents/integration.property.test.ts
    - **Property 17: End-to-end data integrity**
    - **Validates: Requirements 3.1, 3.4, 9.1**
    - Test that uploaded documents can always be retrieved unchanged
    - Use fast-check to generate various document upload scenarios


  - [ ] 19.4 Write security integration tests in src/__tests__/cac-documents/securityIntegration.test.ts
    - Test that encryption is enforced for all uploads
    - Test that access control is enforced for all operations
    - Test that audit logging captures all events
    - Test that unauthorized access attempts are blocked and logged
    - _Requirements: 3.1, 4.1, 5.1, 5.7_

- [ ] 20. Implement comprehensive security tests
  - [ ] 20.1 Write security vulnerability tests in src/__tests__/cac-documents/securityVulnerabilities.test.ts
    - Test protection against malicious file uploads
    - Test protection against path traversal attacks
    - Test protection against injection attacks
    - Test protection against CSRF attacks
    - Test protection against XSS attacks
    - _Requirements: 2.6, 3.2, 4.1_

  - [ ] 20.2 Write property-based security tests in src/__tests__/cac-documents/security.property.test.ts
    - **Property 18: Security enforcement universality**
    - **Validates: Requirements 3.1, 4.1, 4.3**
    - Test that security measures are enforced for all operations
    - Use fast-check to generate various attack scenarios

  - [ ] 20.3 Write penetration tests in src/__tests__/cac-documents/penetrationTesting.test.ts
    - Test unauthorized document access attempts
    - Test privilege escalation attempts
    - Test data tampering attempts
    - Test replay attack prevention
    - _Requirements: 4.1, 4.3, 5.7_

  - [ ] 20.4 Write encryption security tests in src/__tests__/cac-documents/encryptionSecurityAdvanced.test.ts
    - Test key rotation handling
    - Test encryption algorithm strength
    - Test IV uniqueness enforcement
    - Test authentication tag verification
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 21. Implement comprehensive performance tests
  - [ ] 21.1 Write upload performance tests in src/__tests__/cac-documents/uploadPerformance.test.ts
    - Test upload speed for various file sizes
    - Test chunked upload performance
    - Test concurrent upload performance
    - Test upload progress accuracy
    - Test memory usage during uploads
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [ ] 21.2 Write download performance tests in src/__tests__/cac-documents/downloadPerformance.test.ts
    - Test download speed for various file sizes
    - Test concurrent download performance
    - Test decryption performance
    - Test memory usage during downloads
    - _Requirements: 9.1, 9.2, 10.3_

  - [ ] 21.3 Write preview performance tests in src/__tests__/cac-documents/previewPerformanceAdvanced.test.ts
    - Test preview generation time
    - Test thumbnail generation time
    - Test lazy loading effectiveness
    - Test cache hit rates
    - Test memory usage during preview
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ] 21.4 Write property-based performance tests in src/__tests__/cac-documents/performance.property.test.ts
    - **Property 19: Performance consistency**
    - **Validates: Requirements 10.3**
    - Test that operations complete within time limits for all valid inputs
    - Use fast-check to generate various file size and type combinations

- [ ] 22. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Run all security tests
  - Run all performance tests
  - Fix any failing tests
  - Ensure code coverage meets requirements
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Implement documentation
  - [ ] 23.1 Create user documentation in docs/CAC_DOCUMENT_UPLOAD_GUIDE.md
    - Document how to upload CAC documents
    - Document how to preview documents
    - Document how to download documents
    - Document how to replace documents
    - Document error messages and troubleshooting
    - Include screenshots and examples
    - _Requirements: 1.1, 6.1, 9.1, 11.1, 12.1_

  - [ ] 23.2 Create admin documentation in docs/CAC_DOCUMENT_ADMIN_GUIDE.md
    - Document access control configuration
    - Document audit log queries
    - Document security best practices
    - Document troubleshooting common issues
    - Document performance optimization tips
    - _Requirements: 4.1, 5.4, 12.7_


  - [ ] 23.3 Create developer documentation in docs/CAC_DOCUMENT_DEVELOPER_GUIDE.md
    - Document API endpoints and parameters
    - Document data models and types
    - Document encryption implementation
    - Document storage structure
    - Document testing strategy
    - Include code examples
    - _Requirements: 3.1, 3.2, 14.1, 14.2_

  - [ ] 23.4 Create deployment documentation in docs/CAC_DOCUMENT_DEPLOYMENT_GUIDE.md
    - Document environment variables required
    - Document Firebase configuration
    - Document security rules deployment
    - Document index deployment
    - Document monitoring and alerting setup
    - _Requirements: 3.5, 13.4, 16.1, 16.2_

  - [ ] 23.5 Write API documentation tests in src/__tests__/cac-documents/apiDocumentation.test.ts
    - Test that all documented endpoints exist
    - Test that all documented parameters are accepted
    - Test that all documented responses are returned
    - Test that examples in documentation work
    - _Requirements: 14.1_

- [ ] 24. Implement monitoring and alerting
  - [ ] 24.1 Create monitoring service in src/services/cacMonitoringService.ts
    - Implement upload success/failure rate tracking
    - Implement download success/failure rate tracking
    - Implement preview performance tracking
    - Implement storage usage tracking
    - Implement error rate tracking
    - Implement security event tracking
    - _Requirements: 12.7_

  - [ ] 24.2 Write monitoring tests in src/__tests__/cac-documents/monitoring.test.ts
    - Test metric collection
    - Test metric aggregation
    - Test alert triggering
    - Test metric reporting
    - _Requirements: 12.7_

  - [ ] 24.3 Write property-based tests for monitoring in src/__tests__/cac-documents/monitoring.property.test.ts
    - **Property 20: Monitoring completeness**
    - **Validates: Requirements 12.7**
    - Test that all operations are monitored
    - Use fast-check to generate various operation sequences

  - [ ] 24.4 Create monitoring dashboard documentation in docs/CAC_DOCUMENT_MONITORING_GUIDE.md
    - Document available metrics
    - Document alert thresholds
    - Document troubleshooting based on metrics
    - Document performance baselines
    - _Requirements: 12.7_

- [ ] 25. Implement data migration utilities
  - [ ] 25.1 Create migration script in scripts/migrate-cac-documents.cjs
    - Implement script to migrate existing documents to new structure
    - Implement encryption for unencrypted documents
    - Implement metadata generation for existing documents
    - Implement version history initialization
    - Include rollback capability
    - _Requirements: 3.1, 14.1_

  - [ ] 25.2 Write migration tests in scripts/__tests__/migrateCACDocuments.test.cjs
    - Test migration of unencrypted documents
    - Test metadata generation
    - Test version history initialization
    - Test rollback functionality
    - Test idempotency (running migration multiple times)
    - _Requirements: 3.1, 14.1_

  - [ ] 25.3 Write property-based migration tests in scripts/__tests__/migrateCACDocuments.property.test.cjs
    - **Property 21: Migration data integrity**
    - **Validates: Requirements 3.1, 3.4**
    - Test that migrated documents are identical to originals
    - Use fast-check to generate various document states

  - [ ] 25.4 Create migration documentation in docs/CAC_DOCUMENT_MIGRATION_GUIDE.md
    - Document migration prerequisites
    - Document migration steps
    - Document rollback procedure
    - Document verification steps
    - Document troubleshooting
    - _Requirements: 3.1_

- [ ] 26. Implement backup and recovery utilities
  - [ ] 26.1 Create backup script in scripts/backup-cac-documents.cjs
    - Implement document backup to secure location
    - Implement metadata backup
    - Implement audit log backup
    - Include encryption for backups
    - Include backup verification
    - _Requirements: 3.1, 3.2_

  - [ ] 26.2 Create recovery script in scripts/recover-cac-documents.cjs
    - Implement document recovery from backup
    - Implement metadata recovery
    - Implement audit log recovery
    - Include recovery verification
    - Include partial recovery capability
    - _Requirements: 3.1, 3.2_


  - [ ] 26.3 Write backup and recovery tests in scripts/__tests__/backupRecovery.test.cjs
    - Test backup creation
    - Test backup verification
    - Test recovery from backup
    - Test recovery verification
    - Test partial recovery
    - _Requirements: 3.1, 3.2_

  - [ ] 26.4 Write property-based backup tests in scripts/__tests__/backupRecovery.property.test.cjs
    - **Property 22: Backup-recovery round-trip integrity**
    - **Validates: Requirements 3.1, 3.4**
    - Test that backup(recover(data)) === data for all documents
    - Use fast-check to generate various document collections

  - [ ] 26.5 Create backup documentation in docs/CAC_DOCUMENT_BACKUP_GUIDE.md
    - Document backup schedule recommendations
    - Document backup storage requirements
    - Document recovery procedures
    - Document disaster recovery plan
    - _Requirements: 3.1, 3.2_

- [ ] 27. Implement compliance reporting
  - [ ] 27.1 Create compliance reporting service in src/services/cacComplianceReporter.ts
    - Implement report generation for document upload compliance
    - Implement report generation for access control compliance
    - Implement report generation for audit trail compliance
    - Implement report generation for encryption compliance
    - Generate reports in PDF and CSV formats
    - _Requirements: 5.4, 5.6_

  - [ ] 27.2 Write compliance reporting tests in src/__tests__/cac-documents/complianceReporting.test.ts
    - Test upload compliance report generation
    - Test access control compliance report generation
    - Test audit trail compliance report generation
    - Test encryption compliance report generation
    - Test report format validation
    - _Requirements: 5.4, 5.6_

  - [ ] 27.3 Write property-based tests for compliance reports in src/__tests__/cac-documents/complianceReporting.property.test.ts
    - **Property 23: Compliance report accuracy**
    - **Validates: Requirements 5.4, 5.6**
    - Test that compliance reports accurately reflect system state
    - Use fast-check to generate various system states

  - [ ] 27.4 Create compliance documentation in docs/CAC_DOCUMENT_COMPLIANCE_GUIDE.md
    - Document regulatory requirements
    - Document compliance verification procedures
    - Document report interpretation
    - Document remediation procedures for non-compliance
    - _Requirements: 5.4, 5.6_

- [ ] 28. Final checkpoint - Comprehensive testing
  - Run complete test suite (unit, property-based, integration, security, performance)
  - Verify all requirements are covered by tests
  - Verify code coverage meets or exceeds 80%
  - Run security audit tools
  - Run performance profiling
  - Fix any issues found
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 29. Final integration and deployment preparation
  - [ ] 29.1 Integrate CAC document feature with existing identity collection flow
    - Update identity list creation to include CAC document fields
    - Update identity record detail view to show CAC documents
    - Update email templates to mention CAC document requirements
    - Update tour/onboarding to include CAC document upload
    - _Requirements: 1.7, 7.6, 13.1, 13.2, 13.3_

  - [ ] 29.2 Write integration tests for identity flow in src/__tests__/cac-documents/identityFlowIntegration.test.ts
    - Test CAC document upload in identity creation flow
    - Test CAC document display in identity detail view
    - Test CAC document requirements in email notifications
    - Test tour integration
    - _Requirements: 1.7, 7.6, 13.1_

  - [ ] 29.3 Create deployment checklist in docs/CAC_DOCUMENT_DEPLOYMENT_CHECKLIST.md
    - List all environment variables to configure
    - List all Firebase rules to deploy
    - List all indexes to create
    - List all monitoring to enable
    - List all documentation to publish
    - List all user training to complete
    - _Requirements: 3.5, 13.4, 16.1, 16.2_

  - [ ] 29.4 Create rollback plan in docs/CAC_DOCUMENT_ROLLBACK_PLAN.md
    - Document rollback triggers
    - Document rollback procedures
    - Document data preservation during rollback
    - Document verification after rollback
    - _Requirements: 3.1, 3.2_

- [ ] 30. Final verification and sign-off
  - Verify all requirements are implemented
  - Verify all tests pass
  - Verify documentation is complete
  - Verify security measures are in place
  - Verify performance meets requirements
  - Verify monitoring is operational
  - Verify backup and recovery procedures are tested
  - Obtain stakeholder sign-off
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are REQUIRED - no optional tasks per user request
- All test tasks must be implemented and pass
- Property-based tests use fast-check library
- Integration tests cover cross-component interactions
- Security tests verify protection against common vulnerabilities
- Performance tests verify system meets speed requirements
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Documentation tasks ensure knowledge transfer
- Migration and backup tasks ensure data safety
- Compliance reporting ensures regulatory adherence

