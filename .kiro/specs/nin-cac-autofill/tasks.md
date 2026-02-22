# Implementation Plan: NIN/CAC Auto-Fill

## Overview

This implementation plan breaks down the NIN/CAC auto-fill feature into discrete, incremental coding tasks. The approach follows a bottom-up strategy: build core utilities first, then compose them into higher-level components, and finally integrate with existing forms. Each task builds on previous work, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up core data structures and types
  - Create TypeScript interfaces for auto-fill state, API responses, field mappings, and audit logs
  - Define enums for identifier types, form types, and error types
  - Set up configuration types for auto-fill settings
  - _Requirements: All requirements (foundational)_

- [x] 2. Implement data normalization utilities
  - [x] 2.1 Create normalizeGender function
    - Handle M/Male/MALE → male, F/Female/FEMALE → female conversions
    - Return empty string for invalid values
    - _Requirements: 4.1_
  
  - [x] 2.2 Write property test for gender normalization
    - **Property 4: Gender Normalization Consistency**
    - **Validates: Requirements 4.1**
  
  - [x] 2.3 Create normalizeDate function
    - Parse DD/MM/YYYY, DD-MMM-YYYY, YYYY-MM-DD formats
    - Output ISO 8601 format (YYYY-MM-DD)
    - Handle invalid dates gracefully
    - _Requirements: 4.2, 2.6_
  
  - [x] 2.4 Write property test for date normalization
    - **Property 5: Multi-Format Date Parsing**
    - **Validates: Requirements 4.2**
  
  - [x] 2.5 Create normalizePhone function
    - Handle +234 prefix conversion
    - Remove non-digit characters
    - Validate 11-digit format
    - _Requirements: 4.3_
  
  - [x] 2.6 Write property test for phone normalization
    - **Property 6: Phone Number Normalization**
    - **Validates: Requirements 4.3**
  
  - [x] 2.7 Create normalizeString function
    - Trim whitespace
    - Remove extra spaces
    - Apply lowercase conversion
    - _Requirements: 4.4_
  
  - [x] 2.8 Write property test for text normalization
    - **Property 7: Text Normalization Consistency**
    - **Validates: Requirements 4.4**
  
  - [x] 2.9 Create normalizeCompanyName function
    - Standardize Ltd/Limited/PLC variations
    - Apply string normalization
    - _Requirements: 2.4, 4.5_
  
  - [x] 2.10 Write property test for company name normalization
    - **Property 8: Company Name Standardization**
    - **Validates: Requirements 2.4, 4.5**
  
  - [x] 2.11 Create normalizeRCNumber function
    - Remove RC prefix if present
    - Normalize format
    - _Requirements: 2.5_
  
  - [x] 2.12 Write property test for RC number normalization
    - **Property 9: RC Prefix Removal**
    - **Validates: Requirements 2.5**

- [-] 3. Implement DataNormalizer service
  - [x] 3.1 Create DataNormalizer class
    - Implement normalizeNINData method using individual normalizers
    - Implement normalizeCACData method using individual normalizers
    - Handle normalization errors gracefully (skip field, log error)
    - _Requirements: 1.4, 4.6_
  
  - [ ] 3.2 Write property test for normalization error isolation
    - **Property 25: Normalization Error Isolation**
    - **Validates: Requirements 4.6**
  
  - [ ] 3.3 Write unit tests for DataNormalizer
    - Test with complete NIN response data
    - Test with complete CAC response data
    - Test with partial/missing data
    - Test error handling
    - _Requirements: 1.4_

- [-] 4. Implement field name matching utilities
  - [x] 4.1 Create generateFieldVariations function
    - Generate camelCase, snake_case, Title Case, space-separated variations
    - Generate common abbreviations (dateOfBirth → dob)
    - _Requirements: 3.2_
  
  - [ ] 4.2 Write property test for field variation generation
    - **Property 10: Field Name Variation Matching**
    - **Validates: Requirements 3.1, 3.2**
  
  - [x] 4.3 Create findFormField function
    - Search form for field by name variations
    - Implement exact match priority
    - Implement fuzzy matching with Levenshtein distance
    - Handle nested form structures
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [ ] 4.4 Write property test for exact match priority
    - **Property 13: Exact Match Priority**
    - **Validates: Requirements 3.5**
  
  - [ ] 4.5 Write property test for nested form traversal
    - **Property 12: Nested Form Traversal**
    - **Validates: Requirements 3.4**

- [x] 5. Implement FieldMapper service
  - [x] 5.1 Create FieldMapper class
    - Implement mapNINFields method
    - Implement mapCACFields method
    - Use findFormField for each API response field
    - Skip missing fields gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 5.2 Write property test for missing field handling
    - **Property 11: Missing Field Graceful Handling**
    - **Validates: Requirements 3.3**
  
  - [x] 5.3 Write property test for mapping success rate
    - **Property 14: High Mapping Success Rate**
    - **Validates: Requirements 3.6**
  
  - [x] 5.4 Write unit tests for FieldMapper
    - Test with individual-kyc form structure
    - Test with corporate-kyc form structure
    - Test with brokers-kyc form structure
    - Test with forms missing some fields
    - Test with nested form structures
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 6. Checkpoint - Ensure normalization and mapping tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement API client wrapper
  - [x] 7.1 Create VerificationAPIClient class
    - Wrap existing dataproClient and verifydataClient
    - Implement verifyNIN method with timeout (5 seconds)
    - Implement verifyCAC method with timeout (5 seconds)
    - Implement request cancellation using AbortController
    - Standardize error responses
    - _Requirements: 1.1, 2.1, 9.1, 9.2_
  
  - [x] 7.2 Write property test for API timeout
    - **Property 26: API Request Timeout**
    - **Validates: Requirements 9.1, 9.2**
  
  - [x] 7.3 Write property test for request cancellation
    - **Property 28: Request Cancellation on Identifier Change**
    - **Validates: Requirements 9.5**
  
  - [x] 7.4 Write unit tests for VerificationAPIClient
    - Test successful NIN verification
    - Test successful CAC verification
    - Test network errors
    - Test API errors (400, 401, 404, 429, 500)
    - Test timeout scenarios
    - Test request cancellation
    - _Requirements: 1.1, 2.1, 7.5, 7.6, 7.7, 9.1, 9.2_

- [x] 8. Implement FormTypeDetector service
  - [x] 8.1 Create FormTypeDetector class
    - Implement detectFormType method (scan for NIN/CAC fields)
    - Implement supportsIdentifierType method
    - Implement getIdentifierField method
    - _Requirements: 5.1, 5.2, 5.3, 5.6_
  
  - [x] 8.2 Write property test for form type detection
    - **Property 15: Form Type Detection Accuracy**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5**
  
  - [x] 8.3 Write property test for mixed form support
    - **Property 16: Mixed Form Support**
    - **Validates: Requirements 5.3**
  
  - [x] 8.4 Write unit tests for FormTypeDetector
    - Test with individual-kyc form
    - Test with corporate-kyc form
    - Test with brokers-kyc form (mixed)
    - Test with form containing no identifier fields
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [-] 9. Implement FormPopulator service
  - [x] 9.1 Create FormPopulator class
    - Implement populateFields method for React controlled components
    - Implement populateFields method for uncontrolled components
    - Check for user modifications before populating
    - Mark fields as auto-filled
    - Trigger field validation after population
    - _Requirements: 1.3, 2.3, 9.4, 10.1, 10.3_
  
  - [x] 9.2 Write property test for user data preservation
    - **Property 27: User Data Preservation**
    - **Validates: Requirements 9.4**
  
  - [x] 9.3 Write property test for validation integration
    - **Property 29: Validation Integration**
    - **Validates: Requirements 10.1, 10.2**
  
  - [x] 9.4 Write property test for React state management
    - **Property 30: React State Management**
    - **Validates: Requirements 10.3**
  
  - [x] 9.5 Write unit tests for FormPopulator
    - Test populating controlled components
    - Test populating uncontrolled components
    - Test skipping user-modified fields
    - Test validation triggering
    - Test auto-fill marker application
    - _Requirements: 1.3, 2.3, 9.4, 10.1, 10.3_

- [x] 10. Implement VisualFeedbackManager service
  - [x] 10.1 Create VisualFeedbackManager class
    - Implement showLoading method (spinner on identifier field)
    - Implement hideLoading method
    - Implement showSuccess method (toast notification)
    - Implement showError method (error message display)
    - Implement markFieldAutoFilled method (visual indicator)
    - Implement removeAutoFillMarker method
    - Implement disableField and enableField methods
    - _Requirements: 1.2, 1.5, 1.7, 2.2, 2.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_
  
  - [x] 10.2 Write property test for loading indicator display
    - **Property 17: Loading Indicator Display**
    - **Validates: Requirements 1.2, 2.2, 6.1, 6.2**
  
  - [x] 10.3 Write property test for auto-fill visual markers
    - **Property 18: Auto-Fill Visual Markers**
    - **Validates: Requirements 6.3**
  
  - [x] 10.4 Write property test for marker removal on edit
    - **Property 20: Auto-Fill Marker Removal on Edit**
    - **Validates: Requirements 6.7**
  
  - [x] 10.5 Write unit tests for VisualFeedbackManager
    - Test loading indicator display/hide
    - Test success notification
    - Test error message display
    - Test auto-fill marker application/removal
    - Test field disable/enable
    - _Requirements: 1.2, 1.5, 1.7, 2.2, 2.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

- [x] 11. Checkpoint - Ensure service layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 12. Implement database-backed caching and audit integration
  - [x] 12.1 Create backend auto-fill verification endpoints
    - Create POST /api/autofill/verify-nin endpoint
    - Create POST /api/autofill/verify-cac endpoint
    - Check Firestore verified-identities collection before API calls (cache check)
    - If cache hit: return cached data with cost = 0
    - If cache miss: call Datapro/VerifyData API, store result in database
    - Use existing auditLogger.logVerificationAttempt with metadata.source = 'auto-fill'
    - Use existing apiUsageTracker.trackDataproAPICall / trackVerifydataAPICall
    - Apply existing verificationRateLimiter middleware
    - Encrypt identity numbers before storing (use existing encryptData function)
    - _Requirements: 8.1, 8.3, 12.4, 12.5_
  
  - [x] 12.2 Create Firestore verified-identities collection schema
    - Define collection structure for cached verification data
    - Add Firestore indexes for efficient querying
    - Document data model in firestore.indexes.json
    - _Requirements: 12.4, 12.5_
  
  - [x] 12.3 Update VerificationAPIClient to call new endpoints
    - Update verifyNIN to call /api/autofill/verify-nin
    - Update verifyCAC to call /api/autofill/verify-cac
    - Pass userId and formId parameters for audit logging
    - Handle cached vs fresh responses
    - Remove sessionStorage caching logic (incorrect approach)
    - _Requirements: 8.1, 8.3, 12.4, 12.5_
  
  - [x] 12.4 Delete incorrect implementations
    - Delete src/services/autoFill/VerificationCache.ts (sessionStorage-based)
    - Delete src/services/autoFill/AutoFillAuditLogger.ts (duplicate of existing)
    - Delete .kiro/specs/nin-cac-autofill/TASK_12_INTEGRATION_SUMMARY.md (incorrect)
    - _Requirements: N/A_
  
  - [ ] 12.4 Write property test for audit log completeness
    - **Property 35: Audit Log Completeness**
    - **Validates: Requirements 8.1, 8.3**
  
  - [ ] 12.5 Write property test for modification tracking
    - **Property 36: Modification Tracking**
    - **Validates: Requirements 8.2**
  
  - [ ] 12.6 Write property test for sensitive data masking
    - **Property 37: Sensitive Data Masking in Logs**
    - **Validates: Requirements 8.4, 12.3**
  
  - [ ] 12.7 Write unit tests for AutoFillAuditLogger
    - Test log entry creation
    - Test identifier masking
    - Test modification tracking
    - Test error logging
    - Test source: 'auto-fill' metadata
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 12.3_
  
  - [ ] 12.8 Write unit tests for VerificationCache
    - Test cache hit/miss scenarios
    - Test cache expiration (30 minutes)
    - Test duplicate prevention
    - Test cache clearing on form submission
    - Test sessionStorage integration
    - _Requirements: 12.4, 12.5_

- [-] 13. Implement InputTriggerHandler
  - [x] 13.1 Create InputTriggerHandler class
    - Implement attachToField method (listen for onBlur)
    - Implement detachFromField method (cleanup)
    - Implement validateIdentifier method (NIN: 11 digits, CAC: alphanumeric)
    - Implement triggerVerification method (orchestrate verification flow)
    - Prevent duplicate API calls for same identifier
    - Cancel pending requests on identifier change
    - _Requirements: 1.1, 2.1, 9.5_
  
  - [x] 13.2 Write property test for API trigger
    - **Property 1: API Trigger on Identifier Completion**
    - **Validates: Requirements 1.1, 2.1**
  
  - [x] 13.3 Write unit tests for InputTriggerHandler
    - Test onBlur event handling
    - Test identifier validation
    - Test duplicate call prevention
    - Test request cancellation
    - _Requirements: 1.1, 2.1, 9.5_

- [-] 14. Implement AutoFillEngine (main orchestrator)
  - [x] 14.1 Create AutoFillEngine class
    - Integrate all services (FormTypeDetector, VerificationAPIClient, DataNormalizer, FieldMapper, FormPopulator, VisualFeedbackManager, AutoFillAuditLogger)
    - Implement executeAutoFill method (main workflow)
    - Handle verification response validation
    - Handle null/empty values in responses
    - Coordinate error handling across services
    - Implement session data cleanup
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.3, 7.1, 7.2, 7.3, 12.4, 12.5_
  
  - [x] 14.2 Write property test for real-time field population
    - **Property 2: Real-Time Field Population**
    - **Validates: Requirements 1.3, 2.3**
  
  - [x] 14.3 Write property test for normalization before population
    - **Property 3: Normalization Before Population**
    - **Validates: Requirements 1.4**
  
  - [x] 14.4 Write property test for response validation
    - **Property 23: Response Validation Before Population**
    - **Validates: Requirements 7.1**
  
  - [x] 14.5 Write property test for null value handling
    - **Property 24: Null and Empty Value Handling**
    - **Validates: Requirements 7.3**
  
  - [x] 14.6 Write property test for error handling
    - **Property 22: Error Handling and Recovery**
    - **Validates: Requirements 1.7, 6.5, 7.5, 7.6, 7.7**
  
  - [x] 14.7 Write property test for session data cleanup
    - **Property 40: Session Data Cleanup**
    - **Validates: Requirements 12.4, 12.5**
  
  - [x] 14.8 Write unit tests for AutoFillEngine
    - Test complete NIN auto-fill workflow
    - Test complete CAC auto-fill workflow
    - Test error scenarios
    - Test partial success scenarios
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.3, 7.1, 7.2, 7.3_

- [x] 15. Checkpoint - Ensure core engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Create React hook for auto-fill
  - [x] 16.1 Create useAutoFill custom hook
    - Manage auto-fill state (status, error, autoFilledFields)
    - Expose attachToField function for form integration
    - Expose clearAutoFill function for cleanup
    - Handle component unmount cleanup
    - _Requirements: 10.3, 12.5_
  
  - [x] 16.2 Write unit tests for useAutoFill hook
    - Test hook initialization
    - Test state updates during auto-fill
    - Test cleanup on unmount
    - _Requirements: 10.3, 12.5_

- [ ] 17. Create AutoFillConfig component
  - [x] 17.1 Create AutoFillConfig component
    - Load configuration from environment or config file
    - Provide configuration context to child components
    - Support enabling/disabling auto-fill per form type
    - Support custom field mappings
    - _Requirements: 11.1, 11.2, 11.5_
  
  - [x] 17.2 Write property test for configuration-based activation
    - **Property 33: Configuration-Based Activation**
    - **Validates: Requirements 11.1, 11.2**
  
  - [x] 17.3 Write property test for custom mapping priority
    - **Property 34: Custom Mapping Priority**
    - **Validates: Requirements 11.5**

- [ ] 18. Integrate with individual KYC forms
  - [x] 18.1 Add auto-fill to individual-kyc form
    - Import useAutoFill hook
    - Attach to NIN field
    - Add visual feedback components
    - Test with real form structure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 18.2 Add auto-fill to Individual-kyc-form
    - Same integration as 18.1
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 18.3 Write integration tests for individual forms
    - Test complete auto-fill workflow
    - Test user editing auto-filled fields
    - Test error scenarios
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 19. Integrate with corporate KYC forms
  - [x] 19.1 Add auto-fill to corporate-kyc form
    - Import useAutoFill hook
    - Attach to CAC/RC field
    - Add visual feedback components
    - Test with real form structure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 19.2 Add auto-fill to corporate-kyc-form
    - Same integration as 19.1
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 19.3 Write integration tests for corporate forms
    - Test complete auto-fill workflow
    - Test user editing auto-filled fields
    - Test error scenarios
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 20. Integrate with role-specific forms
  - [ ] 20.1 Add auto-fill to brokers-kyc form
    - Support both NIN and CAC fields (mixed form)
    - Test with real form structure
    - _Requirements: 5.3_
  
  - [ ] 20.2 Add auto-fill to agentsCDD form
    - Determine form type and integrate appropriately
    - _Requirements: 1.1, 2.1_
  
  - [ ] 20.3 Add auto-fill to partnersCDD form
    - Determine form type and integrate appropriately
    - _Requirements: 1.1, 2.1_
  
  - [ ] 20.4 Write integration tests for role-specific forms
    - Test brokers-kyc with both NIN and CAC
    - Test agentsCDD auto-fill
    - Test partnersCDD auto-fill
    - _Requirements: 5.3_

- [ ] 21. Integrate with claims forms
  - [ ] 21.1 Add auto-fill to motor-claims form
    - Determine if NIN field exists and integrate
    - Test with real form structure
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 21.2 Write integration tests for claims forms
    - Test motor-claims auto-fill
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 22. Checkpoint - Ensure form integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Add submission metadata tracking
  - [ ] 23.1 Modify form submission handlers
    - Include auto-fill metadata in submission payload
    - Track which fields were auto-filled vs manually entered
    - _Requirements: 8.5_
  
  - [ ] 23.2 Write property test for submission metadata
    - **Property 38: Submission Metadata**
    - **Validates: Requirements 8.5**

- [ ] 24. Add error message localization
  - [ ] 24.1 Create error message constants
    - Define user-friendly messages for all error types
    - Ensure no API credentials exposed in messages
    - _Requirements: 1.7, 6.5, 12.6_
  
  - [ ] 24.2 Write property test for credential protection
    - **Property 41: Credential Protection in Errors**
    - **Validates: Requirements 12.6**

- [ ] 25. Add accessibility features
  - [ ] 25.1 Add ARIA labels and announcements
    - Add ARIA labels to loading indicators
    - Add ARIA live regions for success/error messages
    - Add ARIA labels to auto-filled field markers
    - Ensure keyboard navigation works
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [ ] 25.2 Write accessibility tests
    - Test screen reader announcements
    - Test keyboard navigation
    - Test focus management
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 26. Add field editability verification
  - [ ] 26.1 Write property test for field editability
    - **Property 21: Field Editability Preservation**
    - **Validates: Requirements 1.6**

- [ ] 27. Add graceful degradation tests
  - [ ] 27.1 Write property test for graceful degradation
    - **Property 31: Graceful Degradation**
    - **Validates: Requirements 10.5**

- [ ] 28. Add field mapping flexibility tests
  - [ ] 28.1 Write property test for field mapping flexibility
    - **Property 32: Field Mapping Flexibility**
    - **Validates: Requirements 10.6**

- [ ] 29. Add success notification tests
  - [ ] 29.1 Write property test for success notification
    - **Property 19: Success Notification Display**
    - **Validates: Requirements 1.5, 2.7, 6.4**

- [ ] 30. Add error logging tests
  - [ ] 30.1 Write property test for error logging
    - **Property 39: Error Logging**
    - **Validates: Requirements 8.6**

- [ ] 31. Final checkpoint - Run all tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 32. Create documentation
  - [ ] 32.1 Create developer documentation
    - Document API interfaces
    - Document configuration options
    - Document integration steps for new forms
    - _Requirements: All_
  
  - [ ] 32.2 Create user documentation
    - Document auto-fill feature for end users
    - Document what to do when auto-fill fails
    - _Requirements: 1.1, 2.1, 6.4, 6.5_

## Notes

- All tasks are required for complete implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- The implementation follows a bottom-up approach: utilities → services → orchestrator → React integration → form integration
