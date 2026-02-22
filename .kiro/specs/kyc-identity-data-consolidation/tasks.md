# Implementation Plan: KYC Identity Data Consolidation

## Overview

This implementation plan breaks down the KYC identity data consolidation feature into discrete coding tasks. The system will merge encrypted NIN/CAC data from identity-entries into KYC/CDD/Claims form records using a multi-stage matching algorithm, with comprehensive audit trails and dry-run preview capabilities.

The implementation follows an incremental approach: core utilities first, then matching engine, data consolidation logic, audit logging, orchestration, and finally the admin interface. Each major component includes property-based tests to validate correctness properties from the design document.

## Tasks

- [ ] 1. Set up core data models and utilities
  - Create TypeScript interfaces for IdentityEntry, FormRecord, EncryptedField, ConsolidationJob, ConsolidationReport, MatchResult, AuditLogEntry
  - Create utility functions for field normalization (email lowercase, whitespace trimming)
  - Create validation functions for encrypted field structure (base64 validation)
  - Set up Firestore collection references and constants
  - _Requirements: 1.6, 1.7, 2.5, 11.1, 11.2_

- [ ]* 1.1 Write property tests for field normalization
  - **Property 6: Email normalization**
  - **Validates: Requirements 1.6, 1.7**

- [ ]* 1.2 Write property tests for encrypted field validation
  - **Property 8: Encrypted data validation**
  - **Validates: Requirements 2.5, 11.1, 11.2**

- [ ] 2. Implement Matching Engine
  - [ ] 2.1 Create MatchingEngine class with findMatches method
    - Implement email matching strategy (primary)
    - Implement name+DOB matching strategy (secondary fallback)
    - Implement policy number matching strategy (tertiary fallback)
    - Handle multiple identity entries for same form record (select most recent)
    - Handle single identity entry matching multiple form records (return all)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property test for email matching
    - **Property 1: Email matching correctness**
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Write property test for name-DOB fallback
    - **Property 2: Fallback to name-DOB matching**
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Write property test for policy number fallback
    - **Property 3: Fallback to policy number matching**
    - **Validates: Requirements 1.3**

  - [ ]* 2.5 Write property test for most recent selection
    - **Property 4: Most recent identity entry selection**
    - **Validates: Requirements 1.4**

  - [ ]* 2.6 Write property test for complete match results
    - **Property 5: Complete match results**
    - **Validates: Requirements 1.5**

- [ ] 3. Implement Data Consolidator
  - [ ] 3.1 Create DataConsolidator class with consolidateRecord method
    - Implement encrypted field transfer logic (NIN, CAC, BVN)
    - Implement existing data check (idempotency)
    - Implement validation for encrypted data structure
    - Implement dry-run preview generation
    - Add metadata fields (consolidatedAt, consolidatedFrom)
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 4.1, 4.2, 4.3, 11.1, 11.2, 11.6_

  - [ ]* 3.2 Write property test for encrypted field preservation
    - **Property 7: Encrypted field preservation**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 3.3 Write property test for existing data preservation
    - **Property 12: Existing data preservation**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 3.4 Write property test for idempotent execution
    - **Property 13: Idempotent execution**
    - **Validates: Requirements 4.5**

  - [ ]* 3.5 Write property test for invalid data handling
    - **Property 9: Invalid data handling**
    - **Validates: Requirements 2.6, 10.2**

  - [ ]* 3.6 Write property test for write verification
    - **Property 37: Write verification**
    - **Validates: Requirements 11.6**

- [ ] 4. Checkpoint - Ensure core matching and consolidation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Audit Logger
  - [ ] 5.1 Create AuditLogger class with logOperation and logBatch methods
    - Implement audit log entry creation with all required fields
    - Implement batch logging for performance
    - Create Firestore collection structure for consolidation-audit-logs
    - Add indexes for jobId and timestamp
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 12.3_

  - [ ]* 5.2 Write property test for match audit completeness
    - **Property 15: Match audit completeness**
    - **Validates: Requirements 5.1**

  - [ ]* 5.3 Write property test for update audit completeness
    - **Property 16: Update audit completeness**
    - **Validates: Requirements 5.2**

  - [ ]* 5.4 Write property test for failed match audit logging
    - **Property 17: Failed match audit logging**
    - **Validates: Requirements 5.3**

  - [ ]* 5.5 Write property test for error audit logging
    - **Property 18: Error audit logging**
    - **Validates: Requirements 5.4**

  - [ ]* 5.6 Write property test for admin attribution
    - **Property 19: Admin attribution**
    - **Validates: Requirements 5.5, 12.3**

  - [ ]* 5.7 Write property test for skip audit logging
    - **Property 14: Skip audit logging**
    - **Validates: Requirements 4.4**

- [ ] 6. Implement Consolidation Orchestrator
  - [ ] 6.1 Create ConsolidationOrchestrator class with job management
    - Implement startConsolidation method with job creation
    - Implement getJobStatus method for progress tracking
    - Implement pauseJob and resumeJob methods
    - Implement getJobReport method
    - Create Firestore collection for consolidation-jobs
    - _Requirements: 7.6, 10.7_

  - [ ] 6.2 Implement batch processing logic
    - Process form records in batches of 500
    - Implement Firestore batch writes
    - Implement retry logic with exponential backoff (3 attempts)
    - Implement rate limiting to avoid quota issues
    - Track last processed document for resumption
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.4_

  - [ ] 6.3 Implement progress tracking and reporting
    - Update job status every 100 records
    - Calculate estimated completion time
    - Generate consolidation report with all required sections
    - _Requirements: 7.5, 5.8, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [ ]* 6.4 Write property test for batch size limit
    - **Property 26: Batch size limit**
    - **Validates: Requirements 7.1**

  - [ ]* 6.5 Write property test for retry behavior
    - **Property 27: Retry behavior**
    - **Validates: Requirements 7.3, 10.4**

  - [ ]* 6.6 Write property test for progress reporting frequency
    - **Property 28: Progress reporting frequency**
    - **Validates: Requirements 7.5**

  - [ ]* 6.7 Write property test for pause and resume consistency
    - **Property 29: Pause and resume consistency**
    - **Validates: Requirements 7.6, 10.7**

  - [ ]* 6.8 Write property test for report accuracy
    - **Property 21: Report accuracy**
    - **Validates: Requirements 5.8**

  - [ ]* 6.9 Write property test for report completeness
    - **Property 33: Report completeness**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9**

- [ ] 7. Implement error handling and recovery
  - [ ] 7.1 Create error classification system
    - Define ValidationError, TransientError, CriticalError classes
    - Implement error handler with retry/skip/halt logic
    - Implement transaction rollback mechanism
    - Implement failed records tracking
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 7.2 Write property test for transaction rollback
    - **Property 38: Transaction rollback on failure**
    - **Validates: Requirements 10.1**

  - [ ]* 7.3 Write property test for validation error handling
    - **Property 36: Validation error handling**
    - **Validates: Requirements 11.5, 10.3**

  - [ ]* 7.4 Write property test for failed record tracking
    - **Property 39: Failed record tracking**
    - **Validates: Requirements 10.6**

  - [ ]* 7.5 Write property test for critical error halting
    - **Property 40: Critical error halting**
    - **Validates: Requirements 10.5**

- [ ] 8. Checkpoint - Ensure orchestration and error handling tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement dry-run mode
  - [ ] 9.1 Add dry-run flag support throughout consolidation flow
    - Modify DataConsolidator to skip writes in dry-run mode
    - Generate preview data (before/after states)
    - Ensure audit logs marked with dryRun flag
    - Verify no database modifications occur
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 9.2 Write property test for dry run non-modification
    - **Property 22: Dry run non-modification**
    - **Validates: Requirements 6.1**

  - [ ]* 9.3 Write property test for dry run report generation
    - **Property 23: Dry run report generation**
    - **Validates: Requirements 6.2, 6.4**

  - [ ]* 9.4 Write property test for dry run audit trail
    - **Property 24: Dry run audit trail**
    - **Validates: Requirements 6.3**

  - [ ]* 9.5 Write property test for issue detection
    - **Property 25: Issue detection in report**
    - **Validates: Requirements 6.5**

- [ ] 10. Implement multi-collection support
  - [ ] 10.1 Create collection configuration and selection logic
    - Define supported collections list (individual-kyc, corporate-kyc, etc.)
    - Implement collection filtering based on user selection
    - Handle collection-specific field mappings if needed
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 10.2 Write property test for multi-collection support
    - **Property 10: Multi-collection support**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

  - [ ]* 10.3 Write property test for collection selection filtering
    - **Property 11: Collection selection filtering**
    - **Validates: Requirements 3.10**

- [ ] 11. Implement validation and security checks
  - [ ] 11.1 Add comprehensive validation logic
    - Validate identity entry status is "verified"
    - Validate form record document IDs
    - Validate encrypted field structure (base64 strings)
    - _Requirements: 11.3, 11.4, 11.5_

  - [ ]* 11.2 Write property test for verified status requirement
    - **Property 35: Verified status requirement**
    - **Validates: Requirements 11.3**

- [ ] 12. Implement backend API endpoints
  - [ ] 12.1 Create Express/Firebase Functions endpoints
    - POST /api/consolidation/start - Start consolidation job
    - GET /api/consolidation/status/:jobId - Get job status
    - POST /api/consolidation/pause/:jobId - Pause job
    - POST /api/consolidation/resume/:jobId - Resume job
    - GET /api/consolidation/report/:jobId - Get job report
    - Add authentication middleware (verify Firebase token)
    - Add role-based access control (super-admin or data-admin)
    - _Requirements: 12.1, 12.2, 12.5, 12.6_

  - [ ]* 12.2 Write property test for role-based access control
    - **Property 30: Role-based access control**
    - **Validates: Requirements 8.7, 12.2**

  - [ ]* 12.3 Write property test for unauthorized access logging
    - **Property 31: Unauthorized access logging**
    - **Validates: Requirements 12.5**

  - [ ]* 12.4 Write property test for session expiration enforcement
    - **Property 32: Session expiration enforcement**
    - **Validates: Requirements 12.6**

- [ ] 13. Checkpoint - Ensure backend API and security tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement Admin Interface - Control Panel
  - [ ] 14.1 Create ConsolidationControlPanel React component
    - Add collection selection checkboxes (all 8 collections)
    - Add dry-run mode toggle
    - Add start consolidation button
    - Add pause/resume buttons
    - Implement role-based rendering (show only for authorized users)
    - Wire up API calls to backend endpoints
    - _Requirements: 8.1, 8.2, 8.3, 8.7_

  - [ ]* 14.2 Write unit tests for control panel UI elements
    - Test that start button exists
    - Test that collection checkboxes exist
    - Test that dry-run toggle exists
    - Test role-based access control

- [ ] 15. Implement Admin Interface - Progress Monitor
  - [ ] 15.1 Create ProgressMonitor React component
    - Display progress bar (0-100%)
    - Display records processed count
    - Display estimated time remaining
    - Display current collection being processed
    - Implement real-time updates (polling every 2 seconds)
    - _Requirements: 8.4_

  - [ ]* 15.2 Write property test for progress display updates
    - **Property 8.4: Real-time progress display**
    - Test that progress state changes are reflected in UI

- [ ] 16. Implement Admin Interface - Report Viewer
  - [ ] 16.1 Create ReportViewer React component
    - Display summary statistics (matched, updated, skipped, failed)
    - Display breakdown by collection
    - Display breakdown by match strategy
    - Display unmatched identity entries list
    - Display errors list
    - Display potential duplicates list
    - Add CSV export button
    - Add JSON export button
    - _Requirements: 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [ ]* 16.2 Write property test for export format validity
    - **Property 34: Export format validity**
    - **Validates: Requirements 8.6**

  - [ ]* 16.3 Write unit tests for report viewer display
    - Test that all report sections are rendered
    - Test CSV export functionality
    - Test JSON export functionality

- [ ] 17. Implement report export functionality
  - [ ] 17.1 Create report export utilities
    - Implement CSV generation from ConsolidationReport
    - Implement JSON generation from ConsolidationReport
    - Add download trigger functionality
    - _Requirements: 8.6_

- [ ] 18. Add Firestore security rules
  - [ ] 18.1 Update firestore.rules for new collections
    - Add rules for consolidation-jobs collection (admin write, admin read)
    - Add rules for consolidation-audit-logs collection (admin write, admin read)
    - Ensure encrypted fields in form records can only be written by backend service account
    - _Requirements: 5.7, 12.4_

- [ ] 19. Checkpoint - Ensure admin interface and integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Integration and end-to-end testing
  - [ ]* 20.1 Write integration test for complete consolidation flow
    - Set up test Firestore with sample data
    - Run dry-run consolidation
    - Verify report accuracy
    - Run live consolidation
    - Verify form records updated
    - Verify audit trail completeness
    - Run consolidation again (idempotency test)
    - Verify no changes on second run

  - [ ]* 20.2 Write integration test for error scenarios
    - Test with invalid encrypted data
    - Test with missing required fields
    - Test with network errors (mock)
    - Verify error handling and recovery

  - [ ]* 20.3 Write integration test for multi-collection processing
    - Test with multiple collections selected
    - Verify all collections processed
    - Verify report breakdown by collection

- [ ] 21. Performance optimization and testing
  - [ ]* 21.1 Run performance tests with large datasets
    - Test with 1,000 identity entries × 10,000 form records
    - Measure execution time, memory usage, Firestore operations
    - Verify performance targets met (1,000 records in under 2 minutes)

  - [ ] 21.2 Optimize batch processing if needed
    - Adjust batch sizes based on performance results
    - Optimize Firestore queries with indexes
    - Implement connection pooling if needed

- [ ] 22. Documentation and deployment preparation
  - [ ] 22.1 Create admin user guide
    - Document how to access consolidation interface
    - Document how to select collections
    - Document dry-run vs live mode
    - Document how to interpret reports
    - Document error resolution steps

  - [ ] 22.2 Create deployment checklist
    - Verify Firestore indexes created
    - Verify security rules deployed
    - Verify backend service account permissions
    - Verify environment variables configured
    - Create rollback plan

- [ ] 23. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements covered
  - Verify all correctness properties tested
  - Verify admin interface functional
  - Verify security controls in place

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, UI components, and edge cases
- Integration tests verify end-to-end flows and component interactions
- The implementation uses TypeScript for type safety and Firebase/Firestore for backend
- All encrypted data operations preserve encryption throughout (no decryption during transfer)
- The system supports idempotent execution (can run multiple times safely)
- Comprehensive audit trails enable compliance and debugging
