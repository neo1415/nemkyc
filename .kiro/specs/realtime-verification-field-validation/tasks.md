# Implementation Plan: Real-Time Verification Field Validation

## Overview

This implementation plan converts the real-time verification field validation design into actionable coding tasks. The system validates user-entered data against verification API responses in real-time, provides immediate field-level visual feedback on mismatched fields, and prevents form progression until all fields match verified data.

### Key Implementation Principles

1. **Separation of Concerns**: Verification (API call) and matching (field comparison) are separate operations
2. **Field-Level Errors**: Error messages appear on the specific mismatched fields, NOT on the CAC/NIN field
3. **No Matching Loops**: Matching runs once per trigger, updates state, and stops
4. **Cache-First**: Verification data is cached and reused for per-field revalidation
5. **Progressive Enhancement**: Works alongside existing autofill and submission-time validation

### Technology Stack

- **Language**: TypeScript
- **Framework**: React with React Hook Form
- **Testing**: Vitest + fast-check for property-based tests
- **State Management**: React hooks (useState, useEffect, useCallback)

## Tasks

- [x] 1. Set up core infrastructure and types
  - Create TypeScript interfaces for validation state, field configuration, and cache
  - Define error code enums and error message constants
  - Set up field validation configuration for all four form types
  - _Requirements: 12.1, 9.1, 10.1_

- [ ] 2. Implement VerificationCache service
  - [x] 2.1 Create VerificationCache class with Map-based storage
    - Implement set(), get(), has(), invalidate(), and clear() methods
    - Add timestamp tracking for cache entries
    - Store identifier type (CAC/NIN) with cached data
    - _Requirements: 7.1, 7.5_

  - [ ]* 2.2 Write property test for cache behavior
    - **Property 2: Cache Hit Prevents API Calls**
    - **Property 17: Verification Data Cached on Success**
    - **Property 19: Cache Persists During Session**
    - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**

  - [x] 2.3 Implement cache invalidation on identifier change
    - Clear cache entry when identifier field value changes
    - Reset all field validation states on invalidation
    - _Requirements: 7.3, 11.4_

  - [ ]* 2.4 Write property test for cache invalidation
    - **Property 18: Cache Invalidation on Identifier Change**
    - **Validates: Requirements 7.3**


- [ ] 3. Implement field matching logic
  - [x] 3.1 Create field comparison helper functions
    - Implement fieldMatches() function with normalization support
    - Add date comparison logic using existing date utilities
    - Add string similarity comparison (80% threshold)
    - _Requirements: 2.1, 15.1, 15.2_

  - [ ]* 3.2 Write property test for normalization
    - **Property 27: Normalization Applied to Comparisons**
    - **Validates: Requirements 9.2, 9.3, 9.4, 10.2, 10.3, 10.4**

  - [x] 3.3 Implement performAllFieldsMatching() function
    - Compare ALL configured fields against verification data
    - Convert verificationMatcher results to field-level states
    - Handle empty fields (trigger autofill, mark as matched)
    - Handle filled fields (compare and mark as matched/mismatched)
    - Return field states object with status, errorMessage, showCheckmark, showError
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 15.3, 15.4_

  - [ ]* 3.4 Write property test for field-by-field comparison
    - **Property 5: Field-by-Field Comparison**
    - **Property 7: Field State Reflects Match Status**
    - **Validates: Requirements 2.1, 2.3, 2.4**

  - [x] 3.5 Implement revalidateSingleField() function
    - Compare ONLY the specified field against cached verification data
    - Update ONLY that field's state
    - Handle cleared fields (mark as mismatched)
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 3.6 Write property test for single field revalidation
    - **Property 12: Revalidation on Field Modification**
    - **Property 13: Revalidation Updates Field State**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 4. Implement useRealtimeVerificationValidation hook
  - [x] 4.1 Create hook structure and state management
    - Define hook parameters interface (UseRealtimeVerificationValidationConfig)
    - Initialize state: fieldValidationStates, isVerificationTriggered, isVerifying, verificationError
    - Set up integration with useAutoFill hook
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 4.2 Implement verification trigger logic
    - Create attachToIdentifierField() function to attach blur listener
    - Trigger verification via useAutoFill on identifier field blur
    - Check authentication before triggering
    - Validate identifier format before API call
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ]* 4.3 Write property test for verification triggering
    - **Property 1: Verification Trigger on Blur**
    - **Property 3: Invalid Format Prevents API Calls**
    - **Property 4: Authentication Required for Verification**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**

  - [x] 4.4 Implement matching trigger on verification success
    - Listen to autoFill.state.status changes
    - When status is 'success', run performAllFieldsMatching() ONCE
    - Update all field states at once (no loop)
    - Handle both API and cache responses
    - _Requirements: 2.1, 7.2, 7.4_

  - [ ]* 4.5 Write property test for no matching loop
    - **Property 20: No Matching Loop on Cached Verification**
    - **Validates: Requirements 1.3, 7.2 (prevents cache + matching loop bug)**


  - [x] 4.6 Implement per-field revalidation with debouncing
    - Create revalidateField() function that uses cached data
    - Add 300ms debouncing for rapid field modifications
    - Reset debounce timer on each new modification
    - Execute revalidation once after debounce completes
    - _Requirements: 5.1, 5.4, 14.1, 14.2, 14.3_

  - [ ]* 4.7 Write property test for debouncing
    - **Property 38: Debouncing Applied to Revalidation**
    - **Property 39: Initial Verification Not Debounced**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

  - [x] 4.8 Implement getFieldValidationProps() function
    - Return props object with aria-invalid, aria-describedby, className, onBlur
    - Include red border class for mismatched fields
    - Attach onBlur handler that triggers revalidateField()
    - _Requirements: 3.1, 5.1, 17.1, 17.2_

  - [x] 4.9 Implement navigation blocking logic
    - Calculate canProceedToNextStep based on field states
    - Disable navigation if ANY field is mismatched
    - Enable navigation if all fields are matched or not_verified
    - Enable navigation if verification API error occurred
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 4.10 Write property test for navigation blocking
    - **Property 14: Navigation Blocked by Mismatches**
    - **Property 15: Navigation Enabled When Valid**
    - **Property 16: API Errors Allow Navigation**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5**

  - [x] 4.11 Implement error handling for verification API
    - Handle network errors, timeouts, rate limits, auth errors
    - Set verificationError state (shown on CAC/NIN field only)
    - Allow navigation for all API errors
    - Log errors for audit
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [x] 4.12 Implement clearValidation() function
    - Clear all field validation states
    - Clear verification error
    - Reset isVerificationTriggered flag
    - _Requirements: 11.1, 11.4, 11.5_

  - [x]* 4.13 Write unit tests for hook
    - Test hook initialization with different form types
    - Test state management across validation states
    - Test integration with useAutoFill
    - Test error recovery flows
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 5. Checkpoint - Ensure core logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement visual feedback components
  - [x] 6.1 Create FieldValidationIndicator component
    - Render green checkmark icon for matched fields
    - Render red error message below field for mismatched fields
    - Render nothing for not_verified or pending status
    - Include field label in error message
    - Do NOT reveal verified data values
    - _Requirements: 3.1, 3.2, 4.1, 4.2_

  - [ ]* 6.2 Write property test for visual feedback consistency
    - **Property 9: Visual Feedback Consistency**
    - **Property 10: State Transition Updates Visual Feedback**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [x] 6.3 Create IdentifierFieldError component
    - Render error messages for verification API failures only
    - Render loading indicator during verification
    - Render nothing when verification succeeds
    - Do NOT show matching errors (those appear on individual fields)
    - _Requirements: 1.4, 18.1, 18.2, 18.3, 18.4_


  - [x] 6.4 Create ValidationTooltip component
    - Render tooltip on disabled navigation buttons
    - Show list of mismatched field labels
    - Include message "Please correct the following fields:"
    - Make accessible with proper ARIA attributes
    - _Requirements: 6.3, 17.4_

  - [ ]* 6.5 Write unit tests for visual components
    - Test FieldValidationIndicator rendering for all states
    - Test IdentifierFieldError rendering for all error types
    - Test ValidationTooltip with different field lists
    - Test accessibility attributes
    - _Requirements: 3.1, 3.2, 3.3, 17.1, 17.2, 17.4_

- [x] 7. Implement accessibility features
  - [x] 7.1 Add ARIA attributes to validation states
    - Set aria-invalid="true" on mismatched fields
    - Associate error messages with fields using aria-describedby
    - Ensure proper ID generation for error message elements
    - _Requirements: 17.1, 17.2_

  - [x] 7.2 Add aria-live announcements for state changes
    - Create aria-live region for validation announcements
    - Announce when field becomes matched
    - Announce when field becomes mismatched
    - Announce when all fields are validated
    - _Requirements: 17.3_

  - [x] 7.3 Ensure keyboard navigation support
    - Test tab order through form fields
    - Test focus indicators on all interactive elements
    - Test keyboard access to tooltips
    - _Requirements: 17.5_

  - [ ]* 7.4 Write property test for accessibility
    - **Property 43: Accessibility Attributes on Mismatched Fields**
    - **Property 44: Validation State Changes Announced**
    - **Property 45: Accessible Navigation Blocking**
    - **Property 46: Keyboard Navigation Maintained**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**

- [x] 8. Integrate with Corporate KYC form
  - [x] 8.1 Add useRealtimeVerificationValidation hook to CorporateKYC
    - Configure with CAC field validation config
    - Attach to cacNumber field
    - Apply field validation props to company name, incorporation date, address fields
    - Add FieldValidationIndicator to each validated field
    - Add IdentifierFieldError to CAC field
    - _Requirements: 9.1, 9.5_

  - [x] 8.2 Integrate with MultiStepForm validation
    - Pass canProceedToNextStep to step validation
    - Add ValidationTooltip to navigation buttons
    - Ensure backward compatibility with existing validation
    - _Requirements: 13.1, 13.2, 13.4_

  - [ ]* 8.3 Write integration test for Corporate KYC
    - Test full verification flow with CAC number
    - Test field matching and error display
    - Test navigation blocking with mismatches
    - Test revalidation on field modification
    - Test cache behavior across re-renders
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Integrate with Corporate NFIU form
  - [x] 9.1 Add useRealtimeVerificationValidation hook to CorporateNFIU
    - Configure with CAC field validation config (uses incorporationNumber field)
    - Attach to incorporationNumber field
    - Apply field validation props to validated fields
    - Add visual feedback components
    - _Requirements: 9.5_

  - [x] 9.2 Integrate with MultiStepForm validation
    - Pass validation state to step validation
    - Add navigation blocking with tooltips
    - _Requirements: 13.1, 13.2_

  - [ ]* 9.3 Write integration test for Corporate NFIU
    - Test verification flow with incorporation number
    - Test field validation and navigation
    - _Requirements: 9.5_


- [x] 10. Integrate with Individual KYC form
  - [x] 10.1 Add useRealtimeVerificationValidation hook to IndividualKYC
    - Configure with NIN field validation config
    - Attach to NIN field
    - Apply field validation props to first name, last name, DOB, gender fields
    - Add visual feedback components
    - _Requirements: 10.1, 10.5_

  - [x] 10.2 Integrate with MultiStepForm validation
    - Pass validation state to step validation
    - Add navigation blocking with tooltips
    - _Requirements: 13.1, 13.2_

  - [ ]* 10.3 Write integration test for Individual KYC
    - Test full verification flow with NIN
    - Test field matching with name normalization
    - Test date of birth comparison
    - Test gender normalization (M/Male, F/Female)
    - Test navigation blocking
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Integrate with Individual NFIU form
  - [x] 11.1 Add useRealtimeVerificationValidation hook to IndividualNFIU
    - Configure with NIN field validation config
    - Attach to NIN field
    - Apply field validation props to validated fields
    - Add visual feedback components
    - _Requirements: 10.5_

  - [x] 11.2 Integrate with MultiStepForm validation
    - Pass validation state to step validation
    - Add navigation blocking with tooltips
    - _Requirements: 13.1, 13.2_

  - [ ]* 11.3 Write integration test for Individual NFIU
    - Test verification flow with NIN
    - Test field validation and navigation
    - _Requirements: 10.5_

- [ ] 12. Checkpoint - Ensure all form integrations work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement submission-time validation fallback
  - [ ] 13.1 Add final validation check before form submission
    - Perform validation check in form onSubmit handler
    - Compare all fields one final time
    - Detect any mismatches not caught by real-time validation
    - _Requirements: 16.1_

  - [ ] 13.2 Integrate with VerificationMismatchModal
    - Display modal if submission-time validation detects mismatches
    - Show all mismatched fields and their issues
    - Allow user to acknowledge and proceed
    - _Requirements: 16.2, 16.3, 16.4_

  - [ ] 13.3 Add audit logging for submission failures
    - Log all submission-time validation failures
    - Include user ID, form type, mismatched fields
    - Include timestamp and session information
    - _Requirements: 16.5_

  - [ ]* 13.4 Write unit tests for submission-time validation
    - Test final validation check logic
    - Test modal display on mismatch detection
    - Test audit logging
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 14. Write comprehensive property-based tests
  - [ ]* 14.1 Write property test for empty field autofill
    - **Property 6: Empty Fields Trigger Autofill**
    - **Property 21: Autofilled Fields Marked as Matched**
    - **Property 22: Cleared Autofilled Fields Become Mismatched**
    - **Validates: Requirements 2.2, 8.1, 8.2, 8.4**

  - [ ]* 14.2 Write property test for missing verification data
    - **Property 8: Missing Verification Data Skips Validation**
    - **Validates: Requirements 2.5**


  - [ ]* 14.3 Write property test for error message format
    - **Property 11: Error Messages Include Field Labels**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 14.4 Write property test for CAC field coverage
    - **Property 23: CAC Field Validation Coverage**
    - **Validates: Requirements 9.1**

  - [ ]* 14.5 Write property test for NIN field coverage
    - **Property 24: NIN Field Validation Coverage**
    - **Validates: Requirements 10.1**

  - [ ]* 14.6 Write property test for form type coverage
    - **Property 25: Form Type Coverage**
    - **Validates: Requirements 9.5, 10.5**

  - [ ]* 14.7 Write property test for verification matcher usage
    - **Property 26: Verification Matcher Utility Usage**
    - **Validates: Requirements 15.1, 15.2**

  - [ ]* 14.8 Write property test for match result processing
    - **Property 28: Match Results Processed to Field States**
    - **Validates: Requirements 15.3, 15.4, 15.5**

  - [ ]* 14.9 Write property test for error cleanup
    - **Property 29: Error Cleanup on Resolution**
    - **Property 30: State Reset on New Verification**
    - **Property 31: No Stale Errors on Form Re-entry**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

  - [ ]* 14.10 Write property test for hook integration
    - **Property 32: Hook Integration with useAutoFill**
    - **Property 33: Hook Uses Verification Matcher**
    - **Property 34: Hook Manages All Field States**
    - **Validates: Requirements 12.3, 12.4, 12.5**

  - [ ]* 14.11 Write property test for MultiStepForm integration
    - **Property 35: MultiStepForm Step Validation Integration**
    - **Property 36: MultiStepForm Backward Compatibility**
    - **Property 37: Unauthenticated Users Bypass Validation**
    - **Validates: Requirements 13.1, 13.2, 13.4, 13.5**

  - [ ]* 14.12 Write property test for submission validation
    - **Property 40: Final Validation at Submission**
    - **Property 41: Modal Acknowledgment Allows Submission**
    - **Property 42: Submission Failures Logged**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

- [ ] 15. Performance optimization and monitoring
  - [ ] 15.1 Add performance monitoring to hook
    - Track verification trigger to API call time (<300ms)
    - Track cache retrieval time (<100ms)
    - Track revalidation time (<200ms)
    - Track visual feedback update time (<200ms)
    - Log performance warnings when thresholds exceeded
    - _Requirements: 1.1, 1.2, 5.1, 14.5_

  - [ ] 15.2 Optimize field state updates with memoization
    - Use React.useMemo for expensive field state derivations
    - Use React.useCallback for validation functions
    - Prevent unnecessary re-renders with proper dependencies
    - _Requirements: Performance (design section)_

  - [ ]* 15.3 Write performance tests
    - Test verification trigger timing
    - Test cache retrieval timing
    - Test revalidation timing
    - Test that rapid field modifications don't cause performance issues
    - _Requirements: 1.1, 1.2, 5.1, 14.1, 14.5_

- [ ] 16. Error handling and edge cases
  - [ ] 16.1 Test and handle all API error scenarios
    - Network errors with retry capability
    - Timeouts with warning message
    - Rate limiting with countdown
    - Malformed responses with logging
    - Authentication errors with redirect
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 16.2 Test and handle cache corruption
    - Detect corrupted cache entries
    - Clear cache and retry verification
    - Log cache errors for debugging
    - _Requirements: 7.1, 7.5_

  - [ ] 16.3 Test and handle React Hook Form errors
    - Handle missing form methods gracefully
    - Handle field registration errors
    - Maintain form functionality on errors
    - _Requirements: 12.2_

  - [ ]* 16.4 Write unit tests for error scenarios
    - Test all API error types
    - Test cache corruption handling
    - Test integration error recovery
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_


- [ ] 17. Documentation and code quality
  - [ ] 17.1 Add comprehensive JSDoc comments
    - Document all hook parameters and return values
    - Document all component props
    - Document all utility functions
    - Include usage examples in comments
    - _Requirements: Developer documentation_

  - [ ] 17.2 Create developer documentation
    - Document hook usage with examples
    - Document field configuration format
    - Document integration steps for new forms
    - Document error handling patterns
    - _Requirements: Developer documentation_

  - [ ] 17.3 Create user-facing documentation
    - Document real-time validation behavior
    - Document error messages and their meanings
    - Document how to fix common validation issues
    - _Requirements: User documentation_

  - [ ] 17.4 Add TypeScript strict mode compliance
    - Ensure no 'any' types without justification
    - Add proper type guards where needed
    - Ensure all interfaces are properly exported
    - _Requirements: Code quality_

- [ ] 18. Final testing and validation
  - [ ] 18.1 Run all property-based tests with 100+ iterations
    - Verify all 46 properties pass
    - Document any edge cases discovered
    - Fix any issues found
    - _Requirements: All correctness properties_

  - [ ] 18.2 Run full integration test suite
    - Test all four forms end-to-end
    - Test with real verification API (staging)
    - Test with various user scenarios
    - Test accessibility with screen readers
    - _Requirements: All requirements_

  - [ ] 18.3 Perform manual UX testing
    - Test all 5 UX scenarios from design document
    - Verify error messages appear on correct fields
    - Verify no matching loops occur
    - Verify navigation blocking works correctly
    - _Requirements: UX flow scenarios_

  - [ ] 18.4 Run accessibility audit
    - Test with NVDA, JAWS, and VoiceOver
    - Test keyboard navigation
    - Run axe-core automated tests
    - Verify color contrast
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ] 18.5 Performance testing
    - Verify all performance targets are met
    - Test with slow network conditions
    - Test with rapid user interactions
    - Monitor memory usage
    - _Requirements: Performance targets_

- [ ] 19. Deployment preparation
  - [ ] 19.1 Add feature flag support
    - Create VITE_ENABLE_REALTIME_VALIDATION environment variable
    - Wrap hook usage in feature flag check
    - Ensure graceful degradation when disabled
    - _Requirements: Migration and rollout_

  - [ ] 19.2 Set up monitoring and analytics
    - Add analytics events for verification triggers
    - Track cache hit rate
    - Track validation failure rate
    - Track navigation blocking frequency
    - _Requirements: Success metrics_

  - [ ] 19.3 Create rollback plan
    - Document how to disable feature via flag
    - Document how to revert code changes
    - Document data migration if needed
    - _Requirements: Migration and rollout_

  - [ ] 19.4 Update staging environment
    - Deploy to staging with feature flag disabled
    - Enable flag for internal testing
    - Verify all functionality works
    - _Requirements: Rollout plan_

- [ ] 20. Final checkpoint - Production readiness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

### Task Execution Guidelines

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases

### Critical Implementation Details

1. **Error Placement**: Verification API errors appear on CAC/NIN field; matching errors appear on the specific mismatched fields
2. **No Loops**: Matching runs once per trigger (verification blur or field blur), updates state, and stops
3. **Cache First**: Per-field revalidation always uses cached data, never makes new API calls
4. **Progressive Enhancement**: Feature works alongside existing autofill and submission-time validation
5. **Accessibility**: All validation states must be accessible via screen readers and keyboard

### Testing Strategy

- **Unit Tests**: Specific examples, edge cases, component rendering, integration points
- **Property-Based Tests**: Universal properties across all inputs, state transitions, cache behavior
- **Integration Tests**: Full form flows, MultiStepForm integration, error recovery
- **Manual Tests**: UX scenarios, accessibility with screen readers, performance under load

### Success Criteria

- All 46 correctness properties pass with 100+ iterations
- All 5 UX scenarios work as documented
- No matching loops occur with cached verification
- Errors appear on correct fields (not on CAC/NIN field for matching errors)
- Navigation blocking works correctly
- Accessibility audit passes with no critical issues
- Performance targets met for all operations
- Cache hit rate >80% for duplicate verifications

