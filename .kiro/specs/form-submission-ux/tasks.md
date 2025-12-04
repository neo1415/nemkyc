# Implementation Plan: Form Submission UX Consistency

## Task List

- [x] 1. Create core infrastructure components

  - Create reusable hooks and components for consistent form submission UX
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3_

- [x] 1.1 Create FormLoadingModal component




  - Build enhanced loading modal with different states (validating, submitting, post-auth)
  - Support custom messages and progress indicators
  - Ensure accessibility (ARIA labels, keyboard navigation)


  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_


- [x] 1.2 Create useEnhancedFormSubmit hook

  - Implement state management for validation, submission, and loading
  - Integrate with existing useAuthRequiredSubmit hook

  - Handle authentication flow automatically
  - Provide clear loading messages for each state
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1_

- [x] 1.3 Create formSummaryGenerator utility


  - Implement automatic summary generation from form data
  - Handle different data types (strings, dates, booleans, arrays, objects)
  - Filter out empty/null values
  - Format values appropriately (dates as DD/MM/YYYY, etc.)
  - Support conditional field display
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 7.4_





- [ ] 1.4 Create FormSummaryDialog component
  - Build reusable summary dialog with sections
  - Support custom renderers for flexibility
  - Display all form data in organized sections
  - Show "Edit Form" and "Submit" buttons
  - Handle loading state during submission
  - Ensure responsive design for mobile and desktop
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 7.2, 7.3_





- [ ] 2. Update Motor Claims form (reference implementation)
  - Migrate Motor Claims to use new components as proof of concept
  - Verify no regressions in existing functionality

  - _Requirements: All requirements (validation)_


- [ ] 2.1 Integrate new components into Motor Claims
  - Replace existing loading states with FormLoadingModal



  - Use useEnhancedFormSubmit hook
  - Update summary dialog to use FormSummaryDialog component
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.1_

- [ ] 2.2 Test Motor Claims complete flow
  - Test authenticated submission flow
  - Test unauthenticated submission flow (sign in redirect)
  - Test validation errors and recovery
  - Test summary display and edit functionality
  - Verify loading states appear immediately
  - _Requirements: All requirements_

- [ ] 3. Update Individual KYC form
  - Migrate Individual KYC to use new components
  - Generate comprehensive summary
  - _Requirements: All requirements_

- [x] 3.1 Integrate new components into Individual KYC



  - Import and use useEnhancedFormSubmit hook
  - Add FormLoadingModal for immediate feedback
  - Create comprehensive summary sections
  - Use FormSummaryDialog component
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 4.1_

- [ ] 3.2 Generate comprehensive summary for Individual KYC
  - Define summary sections (Personal Info, Account Details, Documents, Declaration)
  - Map all form fields to summary display
  - Handle conditional fields (source of income "Other", etc.)
  - Format dates, BVN, and other special fields
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 3.3 Test Individual KYC complete flow
  - Test all submission scenarios
  - Verify immediate loading feedback
  - Verify comprehensive summary display
  - Test post-authentication flow

  - _Requirements: All requirements_


- [ ] 4. Update Corporate KYC form
  - Migrate Corporate KYC to use new components
  - Generate comprehensive summary




  - _Requirements: All requirements_

- [ ] 4.1 Integrate new components into Corporate KYC
  - Import and use useEnhancedFormSubmit hook
  - Add FormLoadingModal
  - Create comprehensive summary sections
  - Use FormSummaryDialog component
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1_

- [ ] 4.2 Generate comprehensive summary for Corporate KYC
  - Define summary sections
  - Map all form fields to summary display
  - Handle conditional fields
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_


- [ ] 4.3 Test Corporate KYC complete flow
  - Test all submission scenarios

  - Verify consistency with Individual KYC
  - _Requirements: All requirements_





- [ ] 5. Update CDD forms (Individual, Corporate, Agents, Brokers, Partners)
  - Migrate all CDD forms to use new components
  - Generate comprehensive summaries
  - _Requirements: All requirements_


- [x] 5.1 Integrate new components into Individual CDD




  - Use useEnhancedFormSubmit hook
  - Add FormLoadingModal
  - Create comprehensive summary






  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 5.2 Integrate new components into Corporate CDD
  - Use useEnhancedFormSubmit hook
  - Add FormLoadingModal
  - Create comprehensive summary
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 5.3 Integrate new components into Agents CDD
  - Use useEnhancedFormSubmit hook
  - Add FormLoadingModal
  - Create comprehensive summary
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 5.4 Integrate new components into Brokers CDD
  - Use useEnhancedFormSubmit hook
  - Add FormLoadingModal
  - Create comprehensive summary
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 5.5 Integrate new components into Partners CDD
  - Use useEnhancedFormSubmit hook
  - Add FormLoadingModal
  - Create comprehensive summary
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 5.6 Test all CDD forms
  - Test each CDD form's complete flow
  - Verify consistency across all CDD forms
  - _Requirements: All requirements_

- [ ] 6. Update remaining Claims forms
  - Migrate all other claims forms to use new components
  - Generate comprehensive summaries
  - _Requirements: All requirements_

- [ ] 6.1 Update Fire & Special Perils Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.2 Update Burglary Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.3 Update All Risk Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.4 Update Goods in Transit Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.5 Update Money Insurance Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.6 Update Employers Liability Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.7 Update Public Liability Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.8 Update Professional Indemnity Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.9 Update Fidelity Guarantee Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.10 Update Contractors Plant & Machinery Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.11 Update Group Personal Accident Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.12 Update Rent Assurance Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 6.13 Update Combined GPA Employers Liability Claim
  - Integrate new components
  - Create comprehensive summary
  - Test complete flow
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [ ] 7. Final integration testing and polish
  - Comprehensive testing across all forms
  - Performance optimization
  - Documentation
  - _Requirements: All requirements_

- [ ] 7.1 Cross-form consistency testing
  - Test same user flow across different form types
  - Verify identical loading behavior
  - Verify identical summary structure
  - Verify identical error handling
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7.2 Performance testing and optimization
  - Measure time to show loading modal (target: < 50ms)
  - Measure summary generation time (target: < 200ms)
  - Optimize if needed
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 7.3 Error scenario testing
  - Test validation errors across all forms
  - Test network errors and retry
  - Test server errors
  - Verify error recovery works
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.4 Accessibility audit
  - Test keyboard navigation
  - Test screen reader support
  - Verify ARIA labels
  - Test with reduced motion preference
  - _Requirements: All requirements (accessibility)_

- [ ] 7.5 Create documentation
  - Document useEnhancedFormSubmit hook usage
  - Document FormSummaryDialog component usage
  - Create migration guide for remaining forms
  - Add examples to component library
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

