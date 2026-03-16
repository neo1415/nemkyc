# Requirements Document

## Introduction

This document specifies the requirements for implementing 6 new NEM Insurance claim forms based on Claude's extracted schemas. The forms include 5 personal accident protection forms (Smart Motorist Protection, Smart Students Protection, Smart Traveller Protection, Smart Artisan Protection, Smart Generation Z Protection) and 1 property damage form (NEM Home Protection Policy). These forms will integrate seamlessly with the existing claims system architecture, maintaining consistency with current patterns while supporting unique field structures and conditional logic.

## Glossary

- **Claims_System**: The existing NEM Insurance claims processing application
- **Form_Schema**: JSON configuration defining form structure, fields, and validation rules
- **Form_Component**: React component that renders a specific claim form type
- **Ticket_ID**: Unique identifier for each claim submission (format: PREFIX-XXXXXXXX)
- **Admin_Interface**: Administrative dashboard for viewing and managing claim submissions
- **File_Upload_System**: Firebase Storage integration for document attachments
- **Email_Service**: Automated notification system for claim submissions
- **Conditional_Field**: Form field that appears/disappears based on other field values
- **Array_Field**: Form field that allows multiple entries (witnesses, property items)
- **Personal_Accident_Form**: Claim form type for individual injury coverage
- **Property_Damage_Form**: Claim form type for property loss coverage
- **Form_Mapping**: Configuration object that defines form structure and behavior
- **PDF_Generator**: Service that creates PDF documents from form submissions
- **Validation_Engine**: System that validates form data before submission
- **Mobile_Interface**: Responsive design for mobile device compatibility

## Requirements

### Requirement 1: Form Schema Integration

**User Story:** As a system administrator, I want to integrate 6 new form schemas into the existing form mappings configuration, so that the system can recognize and process the new claim types.

#### Acceptance Criteria

1. THE Form_Mapping_System SHALL add Smart Motorist Protection schema to formMappings.ts with form type "Smart Motorist Protection"
2. THE Form_Mapping_System SHALL add Smart Students Protection schema to formMappings.ts with form type "Smart Students Protection"  
3. THE Form_Mapping_System SHALL add Smart Traveller Protection schema to formMappings.ts with form type "Smart Traveller Protection"
4. THE Form_Mapping_System SHALL add Smart Artisan Protection schema to formMappings.ts with form type "Smart Artisan Protection"
5. THE Form_Mapping_System SHALL add NEM Home Protection Policy schema to formMappings.ts with form type "NEM Home Protection Policy"
6. THE Form_Mapping_System SHALL add Smart Generation Z Protection schema to formMappings.ts with form type "Smart Generation Z Protection"
7. WHEN getFormMapping is called with any new form type, THE Form_Mapping_System SHALL return the corresponding schema configuration
8. WHEN getAvailableFormTypes is called, THE Form_Mapping_System SHALL include all 6 new form types in the returned array

### Requirement 2: Ticket ID Generation Enhancement

**User Story:** As a claims processor, I want unique ticket IDs generated for each new claim type, so that I can easily identify and track different claim categories.

#### Acceptance Criteria

1. THE Ticket_ID_Generator SHALL add prefix "SMP" for Smart Motorist Protection claims
2. THE Ticket_ID_Generator SHALL add prefix "SSP" for Smart Students Protection claims
3. THE Ticket_ID_Generator SHALL add prefix "STP" for Smart Traveller Protection claims
4. THE Ticket_ID_Generator SHALL add prefix "SAP" for Smart Artisan Protection claims
5. THE Ticket_ID_Generator SHALL add prefix "HOP" for NEM Home Protection Policy claims
6. THE Ticket_ID_Generator SHALL add prefix "SGP" for Smart Generation Z Protection claims
7. WHEN generateTicketId is called with any new form type, THE Ticket_ID_Generator SHALL return a unique 8-digit ID with the correct prefix
8. THE Ticket_ID_Generator SHALL check uniqueness across all existing collections including the 6 new claim collections

### Requirement 3: React Form Component Creation

**User Story:** As a user, I want to submit claims through intuitive web forms for each protection type, so that I can easily report incidents and provide necessary information.

#### Acceptance Criteria

1. THE Claims_System SHALL create SmartMotoristProtectionClaim.tsx component following MotorClaim.tsx pattern
2. THE Claims_System SHALL create SmartStudentsProtectionClaim.tsx component following MotorClaim.tsx pattern
3. THE Claims_System SHALL create SmartTravellerProtectionClaim.tsx component following MotorClaim.tsx pattern
4. THE Claims_System SHALL create SmartArtisanProtectionClaim.tsx component following MotorClaim.tsx pattern
5. THE Claims_System SHALL create NEMHomeProtectionClaim.tsx component following MotorClaim.tsx pattern
6. THE Claims_System SHALL create SmartGenerationZProtectionClaim.tsx component following MotorClaim.tsx pattern
7. WHEN a user accesses any new claim form, THE Form_Component SHALL render all required sections: Policy Information, Insured Details, Details of Loss, Declaration & Signature
8. WHEN a user submits any new claim form, THE Form_Component SHALL validate all required fields before submission
9. THE Form_Component SHALL support all field types: text, date, time, email, tel, radio, select, textarea, currency, file, array, checkbox

### Requirement 4: Conditional Field Logic Implementation

**User Story:** As a user filling out claim forms, I want relevant fields to appear dynamically based on my previous answers, so that I only see applicable questions and the form remains user-friendly.

#### Acceptance Criteria

1. WHEN doctorNameAddress field is not empty in any personal accident form, THE Form_Component SHALL show isUsualDoctor field
2. WHEN propertyInterest equals "Other" in HOPP form, THE Form_Component SHALL show propertyInterestOther field
3. WHEN isSoleOwner equals "No" in HOPP form, THE Form_Component SHALL show otherOwnerDetails field
4. WHEN hasOtherInsurance equals "Yes" in HOPP form, THE Form_Component SHALL show otherInsurerDetails field
5. WHEN perilType equals "Flood/Water/Storm/Lightning/Explosion/Accident" in HOPP form, THE Form_Component SHALL show medicalCertificateRequired field
6. THE Form_Component SHALL hide conditional fields when their trigger conditions are not met
7. THE Form_Component SHALL clear values of hidden conditional fields when they become hidden

### Requirement 5: Array Field Management

**User Story:** As a user, I want to add multiple witnesses to accident claims and multiple property items to home protection claims, so that I can provide comprehensive information about incidents.

#### Acceptance Criteria

1. THE Personal_Accident_Form SHALL provide witnesses array field with name and address subfields
2. THE Personal_Accident_Form SHALL allow users to add unlimited witness entries
3. THE Personal_Accident_Form SHALL allow users to remove individual witness entries
4. THE Property_Damage_Form SHALL provide propertyItems array field with description, cost, purchaseDate, and valueAtLoss subfields
5. THE Property_Damage_Form SHALL allow users to add unlimited property item entries
6. THE Property_Damage_Form SHALL allow users to remove individual property item entries
7. WHEN array fields are submitted, THE Form_Component SHALL validate that each entry contains all required subfields

### Requirement 6: File Upload Integration

**User Story:** As a user, I want to upload supporting documents and signatures with my claim, so that I can provide evidence and complete the legal requirements for claim processing.

#### Acceptance Criteria

1. THE File_Upload_System SHALL support signature upload (required) for all 6 new claim types
2. THE File_Upload_System SHALL support supporting documents upload (optional, multiple files) for all 6 new claim types
3. THE File_Upload_System SHALL support medical certificate upload (conditional, single file) for HOPP claims only
4. WHEN perilType requires medical certificate in HOPP, THE File_Upload_System SHALL make medical certificate upload required
5. THE File_Upload_System SHALL store uploaded files in Firebase Storage with organized folder structure
6. THE File_Upload_System SHALL validate file types and sizes before upload
7. THE File_Upload_System SHALL provide upload progress indicators for user feedback

### Requirement 7: Admin Interface Integration

**User Story:** As an administrator, I want to view and manage all new claim types through the existing admin interface, so that I can process claims efficiently using familiar tools.

#### Acceptance Criteria

1. THE Admin_Interface SHALL extend AdminUnifiedTable.tsx to support all 6 new claim types
2. THE Admin_Interface SHALL extend FormViewer.tsx to display all new form field types correctly
3. WHEN an admin views any new claim type, THE Admin_Interface SHALL display all form sections with proper formatting
4. WHEN an admin views array fields, THE Admin_Interface SHALL format witnesses and property items as readable lists
5. WHEN an admin views file uploads, THE Admin_Interface SHALL provide download links for all attached documents
6. THE Admin_Interface SHALL maintain consistent styling and behavior across all claim types
7. THE Admin_Interface SHALL support filtering and searching for new claim types

### Requirement 8: Email Notification System

**User Story:** As a stakeholder, I want to receive automated email notifications when new claims are submitted, so that I can respond promptly to customer needs.

#### Acceptance Criteria

1. THE Email_Service SHALL create email templates for Smart Motorist Protection claim submissions
2. THE Email_Service SHALL create email templates for Smart Students Protection claim submissions
3. THE Email_Service SHALL create email templates for Smart Traveller Protection claim submissions
4. THE Email_Service SHALL create email templates for Smart Artisan Protection claim submissions
5. THE Email_Service SHALL create email templates for NEM Home Protection Policy claim submissions
6. THE Email_Service SHALL create email templates for Smart Generation Z Protection claim submissions
7. WHEN any new claim is submitted, THE Email_Service SHALL send confirmation email to the claimant
8. WHEN any new claim is submitted, THE Email_Service SHALL send notification email to administrators

### Requirement 9: Database Schema Implementation

**User Story:** As a system architect, I want proper Firestore collections created for each new claim type, so that data is organized and queryable for reporting and processing.

#### Acceptance Criteria

1. THE Claims_System SHALL create "smart-motorist-protection-claims" Firestore collection
2. THE Claims_System SHALL create "smart-students-protection-claims" Firestore collection
3. THE Claims_System SHALL create "smart-traveller-protection-claims" Firestore collection
4. THE Claims_System SHALL create "smart-artisan-protection-claims" Firestore collection
5. THE Claims_System SHALL create "nem-home-protection-claims" Firestore collection
6. THE Claims_System SHALL create "smart-generation-z-protection-claims" Firestore collection
7. WHEN claims are submitted, THE Claims_System SHALL store complete form data with proper field mapping
8. THE Claims_System SHALL maintain data consistency and referential integrity across all collections

### Requirement 10: Validation and Error Handling

**User Story:** As a user, I want clear validation messages and error handling when filling out claim forms, so that I can correct mistakes and successfully submit my claim.

#### Acceptance Criteria

1. THE Validation_Engine SHALL validate all required fields before form submission
2. THE Validation_Engine SHALL validate email format for email fields
3. THE Validation_Engine SHALL validate phone number format for telephone fields
4. THE Validation_Engine SHALL validate date format and logical date ranges
5. THE Validation_Engine SHALL validate currency amounts for positive values
6. WHEN validation fails, THE Validation_Engine SHALL display specific error messages for each invalid field
7. WHEN network errors occur, THE Claims_System SHALL display user-friendly error messages with retry options
8. THE Claims_System SHALL prevent duplicate submissions through proper loading states and form disabling

### Requirement 11: PDF Generation Compatibility

**User Story:** As an administrator, I want to generate PDF documents from submitted claims, so that I can create official records and share claim information with stakeholders.

#### Acceptance Criteria

1. THE PDF_Generator SHALL support rendering Smart Motorist Protection claims to PDF format
2. THE PDF_Generator SHALL support rendering Smart Students Protection claims to PDF format
3. THE PDF_Generator SHALL support rendering Smart Traveller Protection claims to PDF format
4. THE PDF_Generator SHALL support rendering Smart Artisan Protection claims to PDF format
5. THE PDF_Generator SHALL support rendering NEM Home Protection Policy claims to PDF format
6. THE PDF_Generator SHALL support rendering Smart Generation Z Protection claims to PDF format
7. WHEN generating PDFs, THE PDF_Generator SHALL include all form sections with proper formatting
8. WHEN generating PDFs, THE PDF_Generator SHALL handle array fields by displaying all entries in readable format

### Requirement 12: Mobile Responsiveness

**User Story:** As a mobile user, I want to access and complete claim forms on my smartphone or tablet, so that I can submit claims conveniently from any location.

#### Acceptance Criteria

1. THE Mobile_Interface SHALL render all 6 new claim forms responsively on screen widths below 768px
2. THE Mobile_Interface SHALL maintain form usability with touch-friendly input controls
3. THE Mobile_Interface SHALL optimize file upload interface for mobile devices
4. THE Mobile_Interface SHALL ensure array field management works smoothly on touch devices
5. WHEN users access forms on mobile devices, THE Mobile_Interface SHALL provide appropriate keyboard types for different input fields
6. THE Mobile_Interface SHALL maintain consistent styling and branding across all device sizes
7. THE Mobile_Interface SHALL ensure conditional field logic works correctly on mobile devices

### Requirement 13: Form Parser and Pretty Printer Integration

**User Story:** As a developer, I want robust parsing and formatting capabilities for claim form data, so that data can be reliably processed and displayed across different system components.

#### Acceptance Criteria

1. THE Form_Parser SHALL parse all 6 new claim form schemas into valid FormMapping objects
2. THE Form_Parser SHALL validate schema structure and field definitions during parsing
3. WHEN invalid schema is provided, THE Form_Parser SHALL return descriptive error messages
4. THE Pretty_Printer SHALL format claim form data into human-readable display format
5. THE Pretty_Printer SHALL handle array fields by formatting multiple entries with proper spacing
6. THE Pretty_Printer SHALL format conditional fields appropriately based on their visibility state
7. FOR ALL valid claim form schemas, parsing then pretty printing then parsing SHALL produce equivalent FormMapping objects (round-trip property)

### Requirement 14: Performance and Scalability

**User Story:** As a system user, I want claim forms to load and submit quickly even during peak usage periods, so that I can complete my tasks efficiently without delays.

#### Acceptance Criteria

1. WHEN any new claim form loads, THE Claims_System SHALL render the form within 2 seconds on standard broadband connections
2. WHEN form data is submitted, THE Claims_System SHALL complete submission within 5 seconds under normal conditions
3. THE Claims_System SHALL handle concurrent submissions from multiple users without data corruption
4. THE Claims_System SHALL implement proper loading states during form submission to prevent user confusion
5. WHEN file uploads are in progress, THE Claims_System SHALL show progress indicators and allow cancellation
6. THE Claims_System SHALL optimize form rendering by lazy-loading non-critical components
7. THE Claims_System SHALL implement proper error recovery for network timeouts and connection issues