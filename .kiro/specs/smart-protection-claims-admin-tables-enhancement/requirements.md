# Requirements Document

## Introduction

This specification fixes critical data display issues in the Smart Protection Claims admin tables where hardcoded column definitions reference fields that don't exist in the actual forms, causing N/A values to appear throughout the admin tables and FormViewer. The admin table files contain column definitions for fields like title, dateOfBirth, gender, occupation, institutionName, etc., but these fields are NOT collected in the actual claim forms. The solution requires removing non-existent field columns, adding columns for fields that ARE in the forms but missing from the tables, and updating FormData interfaces to match the actual form structure.

## Glossary

- **Admin_Tables**: The admin table components (AdminSmartArtisanProtectionClaimsTable.tsx and AdminSmartStudentsProtectionClaimsTable.tsx) with hardcoded column definitions
- **Form_Fields**: The actual fields collected in the claim forms (SmartArtisanProtectionClaim.tsx and SmartStudentsProtectionClaim.tsx)
- **Column_Definitions**: The hardcoded `columns` array in admin table files that defines which fields to display
- **FormData_Interface**: TypeScript interface in admin table files that should match the actual form structure
- **FormViewer**: Component that displays detailed form submissions and relies on correct field mappings
- **CSV_Export**: Functionality that exports table data with headers matching the column definitions

## Requirements

### Requirement 1: Replace Simple Table Wrappers

**User Story:** As an admin user, I want full-featured admin tables for Smart Protection Claims, so that I can manage claims with the same functionality as other admin tables.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL replace AdminSmartMotoristProtectionClaimsTable with complete DataGrid implementation
2. THE Smart_Protection_Claims_System SHALL replace AdminSmartStudentsProtectionClaimsTable with complete DataGrid implementation  
3. THE Smart_Protection_Claims_System SHALL replace AdminSmartTravellerProtectionClaimsTable with complete DataGrid implementation
4. THE Smart_Protection_Claims_System SHALL replace AdminSmartArtisanProtectionClaimsTable with complete DataGrid implementation
5. THE Smart_Protection_Claims_System SHALL replace AdminSmartGenerationZProtectionClaimsTable with complete DataGrid implementation
6. THE Smart_Protection_Claims_System SHALL replace AdminNEMHomeProtectionClaimsTable with complete DataGrid implementation

### Requirement 2: Complete DataGrid Implementation

**User Story:** As an admin user, I want comprehensive data display in Smart Protection Claims tables, so that I can view all form fields in organized columns.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL display all form fields as DataGrid columns based on form mappings
2. THE Smart_Protection_Claims_System SHALL render Policy Information fields (policyNumber, periodOfCoverFrom, periodOfCoverTo)
3. THE Smart_Protection_Claims_System SHALL render Insured Details fields (nameOfInsured, title, dateOfBirth, gender, address, phone, email)
4. THE Smart_Protection_Claims_System SHALL render Details of Loss fields (accidentDate, accidentTime, accidentLocation, accidentDescription, injuryDescription)
5. THE Smart_Protection_Claims_System SHALL render form-specific fields for each claim type (institutionName for students, passportNumber for travellers, occupation for artisans, etc.)
6. THE Smart_Protection_Claims_System SHALL render System Information fields (status, submittedAt, submittedBy, createdAt)

### Requirement 3: Action Buttons and Navigation

**User Story:** As an admin user, I want action buttons for each claim record, so that I can view details and manage records effectively.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL provide View action button for each record
2. THE Smart_Protection_Claims_System SHALL provide Delete action button for each record
3. WHEN View action is clicked, THE Smart_Protection_Claims_System SHALL navigate to FormViewer with correct collection and record ID
4. WHEN Delete action is clicked, THE Smart_Protection_Claims_System SHALL show confirmation dialog
5. WHEN delete is confirmed, THE Smart_Protection_Claims_System SHALL remove record from Firestore and update table display

### Requirement 4: Search and Filtering Capabilities

**User Story:** As an admin user, I want to search and filter Smart Protection Claims, so that I can quickly find specific records.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL provide search text input for filtering records
2. THE Smart_Protection_Claims_System SHALL provide status filter dropdown (all, pending, approved, rejected)
3. WHEN search text is entered, THE Smart_Protection_Claims_System SHALL filter records matching any field value
4. WHEN status filter is changed, THE Smart_Protection_Claims_System SHALL filter records by status value
5. THE Smart_Protection_Claims_System SHALL apply both search and status filters simultaneously

### Requirement 5: CSV Export Functionality

**User Story:** As an admin user, I want to export Smart Protection Claims data to CSV, so that I can analyze data externally or create reports.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL provide Export CSV button in table header
2. WHEN Export CSV is clicked, THE Smart_Protection_Claims_System SHALL generate CSV with all form fields as columns
3. THE Smart_Protection_Claims_System SHALL include all filtered records in CSV export
4. THE Smart_Protection_Claims_System SHALL format dates consistently in DD/MM/YYYY format
5. THE Smart_Protection_Claims_System SHALL handle array fields (witnesses) by formatting as readable text
6. THE Smart_Protection_Claims_System SHALL download CSV file with descriptive filename including date

### Requirement 6: Data Formatting and Display

**User Story:** As an admin user, I want properly formatted data display in Smart Protection Claims tables, so that information is readable and consistent.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL format dates in DD/MM/YYYY format consistently
2. THE Smart_Protection_Claims_System SHALL display "N/A" for null, undefined, or empty field values
3. THE Smart_Protection_Claims_System SHALL format witnesses array as readable text with names and addresses
4. THE Smart_Protection_Claims_System SHALL handle conditional fields based on form logic
5. THE Smart_Protection_Claims_System SHALL display status values with appropriate color coding (approved=green, rejected=red, pending=yellow)

### Requirement 7: Status Management

**User Story:** As an admin user, I want to manage claim status, so that I can approve or reject claims as needed.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL display current status for each claim record
2. THE Smart_Protection_Claims_System SHALL allow status updates through FormViewer integration
3. THE Smart_Protection_Claims_System SHALL reflect status changes immediately in table display
4. THE Smart_Protection_Claims_System SHALL maintain status change audit trail
5. THE Smart_Protection_Claims_System SHALL validate status transitions according to business rules

### Requirement 8: Performance and User Experience

**User Story:** As an admin user, I want responsive and performant Smart Protection Claims tables, so that I can work efficiently with large datasets.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL load data with loading indicators
2. THE Smart_Protection_Claims_System SHALL implement pagination with configurable page sizes (10, 25, 50, 100)
3. THE Smart_Protection_Claims_System SHALL provide sorting capabilities for all columns
4. THE Smart_Protection_Claims_System SHALL implement row hover effects for better user experience
5. THE Smart_Protection_Claims_System SHALL handle errors gracefully with user-friendly messages
6. THE Smart_Protection_Claims_System SHALL maintain consistent theming with burgundy and gold color scheme

### Requirement 9: Collection-Specific Field Handling

**User Story:** As an admin user, I want each Smart Protection Claims table to display fields specific to its claim type, so that I can see relevant information for each protection type.

#### Acceptance Criteria

1. WHEN viewing Smart Motorist Protection Claims, THE Smart_Protection_Claims_System SHALL display standard accident-related fields
2. WHEN viewing Smart Students Protection Claims, THE Smart_Protection_Claims_System SHALL display institutionName, studentId, and courseOfStudy fields
3. WHEN viewing Smart Traveller Protection Claims, THE Smart_Protection_Claims_System SHALL display passportNumber, travelDestination, and travelPurpose fields
4. WHEN viewing Smart Artisan Protection Claims, THE Smart_Protection_Claims_System SHALL display occupation, employerName, toolsInvolved, and safetyMeasures fields
5. WHEN viewing Smart Generation Z Protection Claims, THE Smart_Protection_Claims_System SHALL display lifestyle and sportsActivities fields
6. WHEN viewing NEM Home Protection Claims, THE Smart_Protection_Claims_System SHALL display propertyAddress, propertyType, perilType, and estimatedLoss fields

### Requirement 10: Integration with Existing Systems

**User Story:** As an admin user, I want Smart Protection Claims tables to integrate seamlessly with existing admin functionality, so that the user experience is consistent across all admin tables.

#### Acceptance Criteria

1. THE Smart_Protection_Claims_System SHALL integrate with existing FormViewer component for detailed record viewing
2. THE Smart_Protection_Claims_System SHALL use existing authentication and authorization systems
3. THE Smart_Protection_Claims_System SHALL maintain consistent navigation patterns with other admin tables
4. THE Smart_Protection_Claims_System SHALL use existing toast notification system for user feedback
5. THE Smart_Protection_Claims_System SHALL follow existing error handling patterns and user experience guidelines