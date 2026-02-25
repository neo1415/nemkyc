# Requirements Document

## Introduction

This feature enhances the identity collection Excel/CSV upload system with comprehensive client-side and server-side validation to prevent data entry errors before list creation. The system will validate Date of Birth (DOB), National Identification Number (NIN), and Bank Verification Number (BVN) fields, providing clear error messages and preventing submission until all errors are corrected.

## Glossary

- **Upload_System**: The identity collection Excel/CSV file upload and parsing system
- **Validation_Engine**: The component responsible for validating uploaded identity data
- **Error_Reporter**: The component that displays validation errors to users
- **DOB**: Date of Birth field in identity records
- **NIN**: National Identification Number - an 11-digit unique identifier
- **BVN**: Bank Verification Number - an 11-digit unique identifier
- **Excel_Serial**: Excel's internal date representation as a numeric value
- **Error_Report**: A downloadable file containing validation errors with row numbers

## Requirements

### Requirement 1: Date of Birth Validation

**User Story:** As a broker uploading identity data, I want the system to validate birth years, so that I don't accidentally enter typos like "21998" instead of "1998".

#### Acceptance Criteria

1. WHEN a DOB is parsed from the uploaded file, THE Validation_Engine SHALL extract the year component from any supported date format
2. WHEN the extracted year is not exactly 4 digits, THE Validation_Engine SHALL reject the record with error "Invalid DOB - Year must be 4 digits between 1900-[current_year]"
3. WHEN the extracted year is less than 1900 OR greater than the current year, THE Validation_Engine SHALL reject the record with error "Invalid DOB - Year must be 4 digits between 1900-[current_year]"
4. WHEN a valid DOB is provided, THE Validation_Engine SHALL calculate the person's age as (current_year - birth_year)
5. WHEN the calculated age is less than 18 years, THE Validation_Engine SHALL reject the record with error "DOB indicates age under 18"
6. THE Validation_Engine SHALL support date formats including DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, and Excel_Serial numbers

### Requirement 2: NIN Format Validation

**User Story:** As a broker uploading identity data, I want the system to validate NIN format, so that I don't submit invalid identification numbers.

#### Acceptance Criteria

1. WHEN a NIN value is provided, THE Validation_Engine SHALL trim leading and trailing whitespace
2. WHEN the trimmed NIN length is not exactly 11 characters, THE Validation_Engine SHALL reject the record with error "NIN must be exactly 11 digits"
3. WHEN the NIN contains any non-digit characters, THE Validation_Engine SHALL reject the record with error "NIN must be exactly 11 digits"
4. THE Validation_Engine SHALL validate NIN using the regular expression pattern /^\d{11}$/

### Requirement 3: BVN Format Validation

**User Story:** As a broker uploading identity data, I want the system to validate BVN format, so that I don't submit invalid bank verification numbers.

#### Acceptance Criteria

1. WHEN a BVN value is provided, THE Validation_Engine SHALL trim leading and trailing whitespace
2. WHEN the trimmed BVN length is not exactly 11 characters, THE Validation_Engine SHALL reject the record with error "BVN must be exactly 11 digits"
3. WHEN the BVN contains any non-digit characters, THE Validation_Engine SHALL reject the record with error "BVN must be exactly 11 digits"
4. THE Validation_Engine SHALL validate BVN using the regular expression pattern /^\d{11}$/

### Requirement 4: Comprehensive Error Display

**User Story:** As a broker who uploaded a file with errors, I want to see all validation errors clearly, so that I can fix them efficiently.

#### Acceptance Criteria

1. WHEN validation errors are detected, THE Error_Reporter SHALL display a summary showing the total number of errors and affected rows
2. WHEN displaying validation errors, THE Error_Reporter SHALL show each error with its row number, column name, and specific error message
3. WHEN validation errors exist, THE Upload_System SHALL disable the "Create List" button
4. WHEN validation errors exist, THE Error_Reporter SHALL display a message instructing the user to fix errors and re-upload
5. WHEN all validation passes, THE Upload_System SHALL enable the "Create List" button and display a success message

### Requirement 5: Error Report Generation

**User Story:** As a broker who uploaded a file with errors, I want to download an error report, so that I can systematically fix all issues offline.

#### Acceptance Criteria

1. WHEN validation errors exist, THE Error_Reporter SHALL display a "Download Error Report" button
2. WHEN the user clicks "Download Error Report", THE Upload_System SHALL generate an Excel file containing error details
3. THE generated error report SHALL include all original data columns from the uploaded file
4. THE generated error report SHALL include a "Validation Errors" column showing specific error messages for each row
5. THE generated error report SHALL include only rows that contain validation errors
6. THE generated error report SHALL use the same filename as the original upload with "_errors" appended

### Requirement 6: Client-Side Validation

**User Story:** As a broker uploading identity data, I want immediate validation feedback, so that I can quickly identify and fix errors.

#### Acceptance Criteria

1. WHEN a file is uploaded, THE Validation_Engine SHALL perform validation on the client side before any server communication
2. WHEN client-side validation completes, THE Upload_System SHALL display results within 2 seconds for files containing up to 1000 records
3. THE Validation_Engine SHALL validate all rows in the uploaded file, not just the preview rows
4. WHEN validation is in progress, THE Upload_System SHALL display a loading indicator with progress information

### Requirement 7: Server-Side Validation

**User Story:** As a system administrator, I want server-side validation as a security backup, so that invalid data cannot bypass client-side checks.

#### Acceptance Criteria

1. WHEN the "Create List" button is clicked, THE Upload_System SHALL send data to the server for validation
2. THE server Validation_Engine SHALL perform the same validation rules as the client side
3. WHEN server-side validation detects errors that passed client-side validation, THE Upload_System SHALL display the server errors
4. WHEN server-side validation passes, THE Upload_System SHALL proceed with list creation

### Requirement 8: Template Compatibility

**User Story:** As a broker using different identity templates, I want validation to work with both Individual and Corporate templates, so that all my uploads are validated consistently.

#### Acceptance Criteria

1. THE Validation_Engine SHALL detect whether the uploaded file uses the Individual or Corporate template
2. WHEN the Individual template is detected, THE Validation_Engine SHALL validate DOB, NIN, and BVN fields
3. WHEN the Corporate template is detected, THE Validation_Engine SHALL validate DOB and BVN fields for directors, and skip NIN validation
4. THE Validation_Engine SHALL preserve existing template detection and auto-detection functionality

### Requirement 9: Backward Compatibility

**User Story:** As a system maintainer, I want the validation enhancement to preserve existing functionality, so that current features continue working.

#### Acceptance Criteria

1. THE Upload_System SHALL maintain existing Excel and CSV parsing functionality
2. THE Upload_System SHALL maintain existing phone number formatting functionality
3. THE Upload_System SHALL maintain existing preview table functionality showing the first 10 rows
4. THE Upload_System SHALL maintain existing date formatting from Excel_Serial numbers
5. WHEN validation is added, THE Upload_System SHALL not break any existing upload workflows
