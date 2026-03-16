# Implementation Plan: NEM Smart Protection Claims

## Overview

This implementation plan creates 6 new claim forms that integrate with the existing claims system architecture. The implementation follows the established MotorClaim.tsx pattern and extends existing system components including form mappings, ticket ID generation, admin interface, email notifications, and file upload systems.

## Tasks

- [x] 1. Set up form mappings and ticket ID generation
  - [x] 1.1 Extend form mappings configuration for all 6 new claim types
    - Add Smart Motorist Protection, Smart Students Protection, Smart Traveller Protection, Smart Artisan Protection, Smart Generation Z Protection, and NEM Home Protection Policy schemas to formMappings.ts
    - Configure field definitions, sections, and validation rules for each claim type
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 1.2 Write property test for form mapping retrieval
    - **Property 1: Form Mapping Retrieval**
    - **Validates: Requirements 1.7**

  - [x] 1.3 Extend ticket ID generator for new claim types
    - Add prefixes SMP, SSP, STP, SAP, SGP, HOP to FORM_TYPE_PREFIXES mapping
    - Extend COLLECTIONS_TO_CHECK array for uniqueness validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 1.4 Write property tests for ticket ID generation
    - **Property 2: Ticket ID Generation Format**
    - **Validates: Requirements 2.7**

  - [ ]* 1.5 Write property test for ticket ID uniqueness
    - **Property 3: Ticket ID Uniqueness**
    - **Validates: Requirements 2.8**

- [x] 2. Implement React form components for personal accident claims
  - [x] 2.1 Create SmartMotoristProtectionClaim.tsx component
    - Follow MotorClaim.tsx pattern with Policy Information, Insured Details, Details of Loss, and Declaration sections
    - Implement conditional logic for doctor information fields
    - Support witnesses array field with name and address subfields
    - _Requirements: 3.1, 3.7, 3.8, 3.9, 4.1, 5.1, 5.2, 5.3_

  - [ ]* 2.2 Write property test for Smart Motorist Protection form rendering
    - **Property 4: Form Section Rendering**
    - **Validates: Requirements 3.7**

  - [x] 2.3 Create SmartStudentsProtectionClaim.tsx component
    - Follow MotorClaim.tsx pattern with educational institution specific fields
    - Implement conditional logic for school-related incidents
    - Support witnesses array field management
    - _Requirements: 3.2, 3.7, 3.8, 3.9, 4.1, 5.1, 5.2, 5.3_

  - [x] 2.4 Create SmartTravellerProtectionClaim.tsx component
    - Follow MotorClaim.tsx pattern with travel and destination specific fields
    - Implement conditional logic for international travel and medical emergencies
    - Support witnesses array field management
    - _Requirements: 3.3, 3.7, 3.8, 3.9, 4.1, 5.1, 5.2, 5.3_

  - [x] 2.5 Create SmartArtisanProtectionClaim.tsx component
    - Follow MotorClaim.tsx pattern with occupation and workplace specific fields
    - Implement conditional logic for tool-related injuries and workplace safety
    - Support witnesses array field management
    - _Requirements: 3.4, 3.7, 3.8, 3.9, 4.1, 5.1, 5.2, 5.3_

  - [x] 2.6 Create SmartGenerationZProtectionClaim.tsx component
    - Follow MotorClaim.tsx pattern with lifestyle and activity specific fields
    - Implement conditional logic for sports and recreational activities
    - Support witnesses array field management
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 4.1, 5.1, 5.2, 5.3_

  - [ ]* 2.7 Write property tests for personal accident form validation
    - **Property 5: Form Validation**
    - **Validates: Requirements 3.8**

  - [ ]* 2.8 Write property test for field type support
    - **Property 6: Field Type Support**
    - **Validates: Requirements 3.9**

  - [ ]* 2.9 Write property test for personal accident conditional logic
    - **Property 7: Personal Accident Form Conditional Logic**
    - **Validates: Requirements 4.1**

- [x] 3. Implement NEM Home Protection Policy form component
  - [x] 3.1 Create NEMHomeProtectionClaim.tsx component
    - Follow MotorClaim.tsx pattern with property damage specific fields
    - Implement conditional logic for property interest, ownership, insurance, and peril type
    - Support propertyItems array field with description, cost, purchaseDate, and valueAtLoss subfields
    - _Requirements: 3.5, 3.7, 3.8, 3.9, 4.2, 4.3, 4.4, 4.5, 5.4, 5.5, 5.6_

  - [ ]* 3.2 Write property test for conditional field hiding
    - **Property 8: Conditional Field Hiding**
    - **Validates: Requirements 4.6, 4.7**

  - [ ]* 3.3 Write property test for property items array management
    - **Property 9: Personal Accident Witnesses Array**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ]* 3.4 Write property test for array field validation
    - **Property 10: Array Field Validation**
    - **Validates: Requirements 5.7**

- [x] 4. Checkpoint - Ensure all form components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement file upload integration
  - [x] 5.1 Extend file upload system for new claim types
    - Support signature upload (required) for all 6 claim types
    - Support supporting documents upload (optional, multiple files) for all 6 claim types
    - Support conditional medical certificate upload for HOPP claims
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.2 Write property test for file upload support
    - **Property 11: File Upload Support**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 5.3 Write property test for file storage organization
    - **Property 12: File Storage Organization**
    - **Validates: Requirements 6.5**

  - [ ]* 5.4 Write property test for file upload validation
    - **Property 13: File Upload Validation**
    - **Validates: Requirements 6.6, 6.7**

- [x] 6. Extend admin interface for new claim types
  - [x] 6.1 Update AdminUnifiedTable.tsx to support new claim collections
    - Add collection mappings for all 6 new claim types
    - Ensure consistent table display and filtering functionality
    - _Requirements: 7.1, 7.6, 7.7_

  - [x] 6.2 Update FormViewer.tsx to display new form field types
    - Support array field formatting for witnesses and property items
    - Provide download links for file uploads
    - Maintain consistent styling across all claim types
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 6.3 Write property test for admin interface display
    - **Property 14: Admin Interface Display**
    - **Validates: Requirements 7.3, 7.4, 7.5**

  - [ ]* 6.4 Write property test for admin interface consistency
    - **Property 15: Admin Interface Consistency**
    - **Validates: Requirements 7.6, 7.7**

- [x] 7. Implement email notification system
  - [x] 7.1 Create email templates for all 6 new claim types
    - Add confirmation email templates for claimants
    - Add notification email templates for administrators
    - Follow existing email service patterns
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 7.2 Extend email service to handle new claim types
    - Update email sending logic to support new claim types
    - Ensure proper template selection based on form type
    - _Requirements: 8.7, 8.8_

  - [ ]* 7.3 Write property test for email notification sending
    - **Property 16: Email Notification Sending**
    - **Validates: Requirements 8.7, 8.8**

- [x] 8. Set up database collections and data storage
  - [x] 8.1 Create Firestore collections for all 6 new claim types
    - Create smart-motorist-protection-claims collection
    - Create smart-students-protection-claims collection
    - Create smart-traveller-protection-claims collection
    - Create smart-artisan-protection-claims collection
    - Create smart-generation-z-protection-claims collection
    - Create nem-home-protection-claims collection
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 8.2 Extend user submissions service for new collections
    - Add new collections to FORM_COLLECTIONS array
    - Ensure real-time subscription capabilities
    - Support analytics and dashboard integration
    - _Requirements: 9.7, 9.8_

  - [ ]* 8.3 Write property test for data storage integrity
    - **Property 17: Data Storage Integrity**
    - **Validates: Requirements 9.7, 9.8**

- [ ] 9. Implement validation and error handling
  - [x] 9.1 Extend validation engine for new form types
    - Implement field-level validation for all supported field types
    - Add form-level validation before submission
    - Support conditional field validation based on visibility
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 9.2 Implement comprehensive error handling
    - Add user-friendly error messages for validation failures
    - Implement network error handling with retry options
    - Prevent duplicate submissions with proper loading states
    - _Requirements: 10.6, 10.7, 10.8_

  - [ ]* 9.3 Write property test for field validation rules
    - **Property 18: Field Validation Rules**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

  - [ ]* 9.4 Write property test for error message display
    - **Property 19: Error Message Display**
    - **Validates: Requirements 10.6, 10.7, 10.8**

- [ ] 10. Extend PDF generation and mobile responsiveness
  - [ ] 10.1 Extend PDF generator for new claim types
    - Add PDF generation support for all 6 new claim types
    - Handle array fields with proper formatting in PDFs
    - Include all form sections with consistent styling
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [ ]* 10.2 Write property test for PDF generation support
    - **Property 20: PDF Generation Support**
    - **Validates: Requirements 11.7, 11.8**

  - [ ] 10.3 Ensure mobile responsiveness for all new forms
    - Implement responsive design for screen widths below 768px
    - Optimize touch-friendly controls and file upload interface
    - Ensure array field management works on mobile devices
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 10.4 Write property test for mobile responsiveness
    - **Property 21: Mobile Responsiveness**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**

- [ ] 11. Implement form parsing and performance optimization
  - [ ] 11.1 Extend form parser for new claim schemas
    - Parse all 6 new claim form schemas into valid FormMapping objects
    - Validate schema structure during parsing
    - Return descriptive error messages for invalid schemas
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 11.2 Extend pretty printer for new form data
    - Format claim form data into human-readable display format
    - Handle array fields with proper spacing
    - Format conditional fields based on visibility state
    - _Requirements: 13.4, 13.5, 13.6, 13.7_

  - [ ]* 11.3 Write property test for form schema parsing
    - **Property 22: Form Schema Parsing**
    - **Validates: Requirements 13.1, 13.2, 13.3**

  - [ ]* 11.4 Write property test for data formatting
    - **Property 23: Data Formatting**
    - **Validates: Requirements 13.4, 13.5, 13.6**

  - [ ]* 11.5 Write property test for round-trip parsing
    - **Property 24: Round-trip Parsing**
    - **Validates: Requirements 13.7**

  - [ ] 11.6 Implement performance optimizations
    - Ensure forms render within 2 seconds on standard connections
    - Complete form submissions within 5 seconds under normal conditions
    - Handle concurrent submissions without data corruption
    - Implement proper loading states and progress indicators
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 11.7 Write property test for performance requirements
    - **Property 25: Performance Requirements**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7**

- [x] 12. Integration and routing setup
  - [x] 12.1 Update App.tsx routing for new claim forms
    - Add routes for all 6 new claim form components
    - Ensure proper navigation and URL structure
    - Maintain consistency with existing routing patterns

  - [x] 12.2 Wire all components together
    - Connect form components with form mappings
    - Integrate ticket ID generation with form submissions
    - Connect admin interface with new collections
    - Integrate email notifications with form submissions
    - Connect file uploads with form components

  - [ ]* 12.3 Write integration tests for complete workflows
    - Test end-to-end claim submission workflows
    - Test admin processing workflows
    - Test file upload and retrieval workflows

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All components follow the established MotorClaim.tsx pattern for consistency
- The implementation leverages existing system architecture for seamless integration