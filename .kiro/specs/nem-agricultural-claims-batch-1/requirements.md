# Requirements Document

## Introduction

This document specifies the requirements for implementing two NEM Insurance agricultural claim forms: Farm Property and Produce Insurance Claim Form (FPP) and Livestock Insurance Claim Form (LIV). These forms follow the established Smart Protection claim form patterns for submission flow, validation, and user experience.

## Glossary

- **FPP_Form**: Farm Property and Produce Insurance Claim Form with ticket prefix "FPP"
- **LIV_Form**: Livestock Insurance Claim Form with ticket prefix "LIV"
- **Smart_Protection_Pattern**: The established form implementation pattern used in NEMHomeProtectionClaim and SmartMotoristProtectionClaim
- **useAuthRequiredSubmit_Hook**: React hook that manages authenticated form submission with summary dialog
- **Summary_Dialog**: Modal that displays all form data for user review before final submission
- **Declaration_Section**: Form section containing data privacy policy checkbox and declaration checkbox
- **Signature_Field**: Text input field for digital signature (not a file upload)
- **File_Upload_Field**: Separate field for uploading document files
- **Conditional_Field**: Form field that shows/hides based on another field's value
- **Array_Field**: Form field that allows adding/removing multiple items
- **Admin_Table**: Administrative interface for viewing and managing submitted claims
- **Form_Viewer**: Component that displays submitted form data in read-only format
- **PDF_Generator**: Component that generates PDF documents from submitted form data
- **Form_Mapping**: Configuration that defines how form data is structured and displayed

## Requirements

### Requirement 1: Farm Property and Produce Claim Form Implementation

**User Story:** As a farmer with NEM Insurance, I want to submit a Farm Property and Produce insurance claim online, so that I can report damage to my farm property and produce efficiently.

#### Acceptance Criteria

1. THE FPP_Form SHALL have ticket prefix "FPP" for all submissions
2. THE FPP_Form SHALL contain exactly 4 sections: Policy & Insured Details, Cause of Loss, Property Lost or Damaged, Declaration & Signature
3. WHEN a user selects "Outbreak of Pest and Disease" as causeOfLoss, THE FPP_Form SHALL display pestDiseaseSpecification field
4. THE FPP_Form SHALL include damagedItems array field with itemDescription, numberOrQuantity, valueBeforeLoss, and salvageValue
5. THE FPP_Form SHALL require signatureUpload file field
6. THE FPP_Form SHALL include optional receiptsAndInvoices file field that accepts multiple files
7. THE FPP_Form SHALL follow Smart_Protection_Pattern for form submission flow
8. THE FPP_Form SHALL use useAuthRequiredSubmit_Hook for submission handling
9. THE FPP_Form SHALL display Summary_Dialog before final submission
10. THE FPP_Form SHALL include Declaration_Section with checkbox and privacy policy text

### Requirement 2: Livestock Insurance Claim Form Implementation

**User Story:** As a livestock farmer with NEM Insurance, I want to submit a Livestock insurance claim online, so that I can report the death or loss of my livestock efficiently.

#### Acceptance Criteria

1. THE LIV_Form SHALL have ticket prefix "LIV" for all submissions
2. THE LIV_Form SHALL contain exactly 4 sections: Policy & Insured Details, Cause of Loss, Claim Details, Declaration & Signature
3. WHEN a user selects "Outbreak of Pest and Disease" as causeOfDeath, THE LIV_Form SHALL display diseaseSpecification field
4. WHEN a user selects "Other cause of loss not listed" as causeOfDeath, THE LIV_Form SHALL display otherCauseExplanation field
5. THE LIV_Form SHALL require signatureUpload file field
6. THE LIV_Form SHALL include optional medicalPostMortemReports file field that accepts multiple files
7. THE LIV_Form SHALL include optional receiptsInvoicesMortalityRecords file field that accepts multiple files
8. THE LIV_Form SHALL follow Smart_Protection_Pattern for form submission flow
9. THE LIV_Form SHALL use useAuthRequiredSubmit_Hook for submission handling
10. THE LIV_Form SHALL display Summary_Dialog before final submission
11. THE LIV_Form SHALL include Declaration_Section with checkbox and privacy policy text

### Requirement 3: Form Validation and User Experience

**User Story:** As a user filling out an agricultural claim form, I want clear validation feedback, so that I can correct errors before submission.

#### Acceptance Criteria

1. WHEN a required field is empty, THE FPP_Form SHALL display an error message below the field
2. WHEN a required field is empty, THE LIV_Form SHALL display an error message below the field
3. THE FPP_Form SHALL use DatePicker component for all date fields
4. THE LIV_Form SHALL use DatePicker component for all date fields
5. WHEN a user adds items to damagedItems array, THE FPP_Form SHALL provide add and remove buttons
6. WHEN a user attempts to proceed to next step with validation errors, THE FPP_Form SHALL prevent navigation and highlight errors
7. WHEN a user attempts to proceed to next step with validation errors, THE LIV_Form SHALL prevent navigation and highlight errors
8. THE FPP_Form SHALL auto-save draft data to browser storage
9. THE LIV_Form SHALL auto-save draft data to browser storage

### Requirement 4: Signature Handling

**User Story:** As a user submitting a claim, I want to provide my digital signature, so that I can authenticate my claim submission.

#### Acceptance Criteria

1. THE Signature_Field SHALL be a text input field, not a file upload
2. THE FPP_Form SHALL include separate signatureUpload File_Upload_Field for signature document
3. THE LIV_Form SHALL include separate signatureUpload File_Upload_Field for signature document
4. THE Signature_Field SHALL be labeled "Full Name (Digital Signature)"
5. THE Signature_Field SHALL be required for form submission
6. THE signatureUpload File_Upload_Field SHALL be required for form submission

### Requirement 5: File Upload Functionality

**User Story:** As a user submitting a claim, I want to upload supporting documents, so that I can provide evidence for my claim.

#### Acceptance Criteria

1. THE FPP_Form SHALL accept multiple files for receiptsAndInvoices field
2. THE LIV_Form SHALL accept multiple files for medicalPostMortemReports field
3. THE LIV_Form SHALL accept multiple files for receiptsInvoicesMortalityRecords field
4. WHEN a file upload fails, THE FPP_Form SHALL display an error message
5. WHEN a file upload fails, THE LIV_Form SHALL display an error message
6. THE FPP_Form SHALL validate file types and sizes before upload
7. THE LIV_Form SHALL validate file types and sizes before upload

### Requirement 6: Form Submission and Success Handling

**User Story:** As a user who has completed a claim form, I want to review my information before submitting, so that I can ensure accuracy.

#### Acceptance Criteria

1. WHEN a user completes all required fields in FPP_Form, THE Summary_Dialog SHALL display all form data
2. WHEN a user completes all required fields in LIV_Form, THE Summary_Dialog SHALL display all form data
3. THE Summary_Dialog SHALL organize data by sections matching the form structure
4. WHEN a user confirms submission in Summary_Dialog, THE FPP_Form SHALL submit data to backend
5. WHEN a user confirms submission in Summary_Dialog, THE LIV_Form SHALL submit data to backend
6. WHEN submission succeeds, THE FPP_Form SHALL display success modal with confirmation message
7. WHEN submission succeeds, THE LIV_Form SHALL display success modal with confirmation message
8. WHEN submission succeeds, THE FPP_Form SHALL clear draft data from browser storage
9. WHEN submission succeeds, THE LIV_Form SHALL clear draft data from browser storage

### Requirement 7: Navigation Integration

**User Story:** As a user of the NEM Insurance platform, I want to access agricultural claim forms from the navigation menu, so that I can easily find and submit claims.

#### Acceptance Criteria

1. THE Navbar SHALL include navigation items for FPP_Form and LIV_Form
2. THE FPP_Form SHALL be accessible at route "/claims/farm-property-produce"
3. THE LIV_Form SHALL be accessible at route "/claims/livestock"
4. THE App.tsx SHALL register routes for both FPP_Form and LIV_Form
5. THE AdminDashboard SHALL include sidebar items for FPP_Form and LIV_Form admin tables

### Requirement 8: Admin Table Implementation

**User Story:** As an administrator, I want to view all submitted Farm Property and Produce claims in a table, so that I can manage and process claims efficiently.

#### Acceptance Criteria

1. THE AdminFarmPropertyProduceClaimsTable SHALL display all FPP_Form submissions
2. THE AdminFarmPropertyProduceClaimsTable SHALL show columns: Ticket ID, Policy Number, Insured Name, Date of Loss, Status, Submitted At
3. THE AdminFarmPropertyProduceClaimsTable SHALL allow filtering by status
4. THE AdminFarmPropertyProduceClaimsTable SHALL allow searching by ticket ID or policy number
5. WHEN an admin clicks a row, THE AdminFarmPropertyProduceClaimsTable SHALL open Form_Viewer
6. THE AdminFarmPropertyProduceClaimsTable SHALL allow status updates
7. THE AdminFarmPropertyProduceClaimsTable SHALL display loading state while fetching data
8. WHEN data fetch fails, THE AdminFarmPropertyProduceClaimsTable SHALL display error message

### Requirement 9: Livestock Admin Table Implementation

**User Story:** As an administrator, I want to view all submitted Livestock claims in a table, so that I can manage and process claims efficiently.

#### Acceptance Criteria

1. THE AdminLivestockClaimsTable SHALL display all LIV_Form submissions
2. THE AdminLivestockClaimsTable SHALL show columns: Ticket ID, Policy Number, Insured Name, Date of Loss, Status, Submitted At
3. THE AdminLivestockClaimsTable SHALL allow filtering by status
4. THE AdminLivestockClaimsTable SHALL allow searching by ticket ID or policy number
5. WHEN an admin clicks a row, THE AdminLivestockClaimsTable SHALL open Form_Viewer
6. THE AdminLivestockClaimsTable SHALL allow status updates
7. THE AdminLivestockClaimsTable SHALL display loading state while fetching data
8. WHEN data fetch fails, THE AdminLivestockClaimsTable SHALL display error message

### Requirement 10: Form Viewer Implementation

**User Story:** As an administrator, I want to view submitted claim details in a formatted layout, so that I can review all information clearly.

#### Acceptance Criteria

1. THE FarmPropertyProduceFormViewer SHALL display all FPP_Form fields organized by sections
2. THE LivestockFormViewer SHALL display all LIV_Form fields organized by sections
3. THE FarmPropertyProduceFormViewer SHALL format dates as "dd/MM/yyyy"
4. THE LivestockFormViewer SHALL format dates as "dd/MM/yyyy"
5. THE FarmPropertyProduceFormViewer SHALL display damagedItems array in a readable format
6. THE FarmPropertyProduceFormViewer SHALL show conditional fields only when applicable
7. THE LivestockFormViewer SHALL show conditional fields only when applicable
8. THE FarmPropertyProduceFormViewer SHALL provide download links for uploaded files
9. THE LivestockFormViewer SHALL provide download links for uploaded files

### Requirement 11: PDF Generation

**User Story:** As an administrator, I want to generate PDF documents from submitted claims, so that I can print or archive claim records.

#### Acceptance Criteria

1. THE FarmPropertyProducePDFGenerator SHALL generate PDF from FPP_Form data
2. THE LivestockPDFGenerator SHALL generate PDF from LIV_Form data
3. THE FarmPropertyProducePDFGenerator SHALL include all form sections in PDF
4. THE LivestockPDFGenerator SHALL include all form sections in PDF
5. THE FarmPropertyProducePDFGenerator SHALL format dates consistently in PDF
6. THE LivestockPDFGenerator SHALL format dates consistently in PDF
7. THE FarmPropertyProducePDFGenerator SHALL include NEM Insurance branding
8. THE LivestockPDFGenerator SHALL include NEM Insurance branding

### Requirement 12: Form Mapping Configuration

**User Story:** As a developer, I want form mappings configured for agricultural claims, so that the system can properly display and process the forms.

#### Acceptance Criteria

1. THE formMappings.ts SHALL include mapping for "farm-property-produce-claims"
2. THE formMappings.ts SHALL include mapping for "livestock-claims"
3. THE "farm-property-produce-claims" mapping SHALL define all FPP_Form fields with correct types
4. THE "livestock-claims" mapping SHALL define all LIV_Form fields with correct types
5. THE "farm-property-produce-claims" mapping SHALL mark conditional fields with dependencies
6. THE "livestock-claims" mapping SHALL mark conditional fields with dependencies
7. THE formMappings.ts SHALL specify which fields are editable in admin view

### Requirement 13: Round-Trip Data Integrity

**User Story:** As a system, I want to ensure data integrity throughout the submission and retrieval process, so that no information is lost or corrupted.

#### Acceptance Criteria

1. FOR ALL valid FPP_Form submissions, retrieving then displaying the data SHALL produce equivalent information
2. FOR ALL valid LIV_Form submissions, retrieving then displaying the data SHALL produce equivalent information
3. THE FPP_Form SHALL preserve array field data structure during submission
4. THE LIV_Form SHALL preserve conditional field data during submission
5. THE FPP_Form SHALL preserve file upload metadata during submission
6. THE LIV_Form SHALL preserve file upload metadata during submission
