# Requirements Document: KYC-NFIU Separation

## Introduction

The current KYC system combines fields for both regulatory compliance (NFIU reporting) and business onboarding (KYC) purposes, creating complexity for users who only need to complete one type of form. This feature REFACTORS the existing KYC forms to separate them into distinct NFIU and KYC modules, each with appropriate field requirements based on their specific regulatory and business purposes.

This is a REFACTORING project, not a greenfield implementation. The system already has complete UI/UX, form submission flows with authentication, autofill capabilities, and audit logging infrastructure. We will preserve all existing functionality while splitting the forms and modernizing the component architecture for better code reusability.

The separation applies to both Individual and Corporate forms, with each module having its own navigation entry, data collection structure, and validation rules. The system will maintain backward compatibility with existing data while providing a clearer, more focused user experience.

## Glossary

- **NFIU**: Nigerian Financial Intelligence Unit - regulatory body requiring specific financial reporting data
- **KYC**: Know Your Customer - business onboarding process for customer verification
- **CDD**: Customer Due Diligence - existing separate compliance module
- **System**: The insurance platform application
- **Form_Module**: A distinct section containing either NFIU or KYC forms (Individual and Corporate variants)
- **Navigation_Component**: UI elements (Navbar, Sidebar, AdminSidebar) that provide access to different modules
- **Data_Collection**: Firestore collections storing form submissions
- **Field_Configuration**: The set of fields, validation rules, and mandatory/optional settings for a form
- **Migration_Service**: Backend service that handles data transformation from legacy to new structure
- **Existing_Auth_Flow**: The current authentication system where users can fill forms without authentication, then authenticate on submit
- **Audit_Logger**: The existing server-utils/auditLogger.cjs infrastructure for comprehensive event logging
- **Document_Upload**: File upload functionality for identity verification documents (NIN/BVN for individuals, CAC documents for corporate)
- **Reusable_Component**: Modern form components following 2024/2025 best practices to reduce code duplication
- **AutoFill_Engine**: The existing autofill system in src/services/autoFill/ that populates form fields from NIN/CAC verification APIs

## Requirements

### Requirement 1: NFIU Module Creation

**User Story:** As a compliance officer, I want a dedicated NFIU reporting module, so that I can collect only the fields required for Nigerian Financial Intelligence Unit reporting without unnecessary business fields.

#### Acceptance Criteria

1. THE System SHALL create an NFIU Form_Module with Individual and Corporate form variants by refactoring existing KYC forms
2. WHEN rendering NFIU Individual forms, THE System SHALL include fields: First Name, Middle Name (optional), Last Name, DOB, Place of Birth, Nationality, Occupation, NIN, BVN, Tax ID, ID Type, ID Number, ID Issuing Body, ID Date of Issue, ID Expiry Date (optional), Email (optional), Phone (optional), Source of Income
3. WHEN rendering NFIU Corporate forms, THE System SHALL include Company Information fields: Insured (mandatory), Office Address (mandatory), Ownership of Company-Nigerian (present), Website (present), Incorporation/Registration Number (mandatory), Incorporation State (mandatory), Date of Incorporation/Registration (mandatory), Company's Contact Number (mandatory), Tax Identification Number (mandatory), Email Address of the Company (mandatory), Business Type/Occupation (mandatory), Premium Payment Source (mandatory)
4. THE System SHALL NOT include Name of Contact Person field in NFIU Corporate forms
5. THE System SHALL NOT include Estimated Turnover field in NFIU Corporate forms
6. THE System SHALL NOT include Office Location field in NFIU Corporate forms
7. WHEN rendering NFIU Corporate forms, THE System SHALL include Director/Signatory fields: First Name (mandatory), Middle Name (optional), Last Name (mandatory), Date of Birth (mandatory), Place of Birth (mandatory), Nationality (mandatory), Occupation (mandatory), Email Address (optional), Phone Number (optional), Bank Verification Number/BVN (mandatory), National Identification Number/NIN (mandatory), Residential Address (mandatory), Tax ID Number (optional), ID Type (mandatory), Identification Number (mandatory), Issuing Body/Country (mandatory), Date of Issue (mandatory), Date of Expiry (optional), Source of Income (mandatory)
8. WHEN rendering NFIU Corporate forms, THE System SHALL include Account Details section with Naira Account fields: Bank Name (mandatory), Account Number (mandatory), Bank Branch (mandatory), Account Opening Date (mandatory)
9. WHEN rendering NFIU Corporate forms, THE System SHALL include Account Details section with Domiciliary Account fields: Bank Name (optional), Account Number (optional), Bank Branch (optional), Account Opening Date (optional)
10. THE System SHALL mark BVN as mandatory in NFIU Individual forms
11. THE System SHALL mark BVN as mandatory for Directors/Signatories in NFIU Corporate forms
12. THE System SHALL mark Tax ID as mandatory in NFIU Corporate Company Information section
13. THE System SHALL mark Tax ID as optional for Directors/Signatories in NFIU Corporate forms
14. THE System SHALL support Document_Upload for NFIU Individual forms (NIN/BVN verification documents)
15. THE System SHALL support Document_Upload for NFIU Corporate forms (CAC documents and director identification)

### Requirement 2: KYC Module Creation

**User Story:** As a business user, I want a dedicated KYC onboarding module, so that I can complete customer verification without being confused by regulatory reporting fields.

#### Acceptance Criteria

1. THE System SHALL refactor existing KYC forms into a focused KYC Form_Module with Individual and Corporate form variants
2. WHEN rendering KYC Individual forms, THE System SHALL include fields: First Name, Middle Name (optional), Last Name, DOB, Place of Birth, Nationality, Occupation, NIN, Tax ID (optional), ID Type, ID Number, ID Issuing Body, ID Date of Issue, ID Expiry Date (optional), Email (optional), Phone (optional), Source of Income
3. WHEN rendering KYC Corporate forms, THE System SHALL include Company Information fields: Insured (mandatory), Office Address (mandatory), Ownership of Company-Nigerian (present), Website (present), Incorporation/Registration Number (mandatory), Incorporation State (mandatory), Date of Incorporation/Registration (mandatory), Name of Contact Person (mandatory), Company's Contact Number (mandatory), Tax Identification Number (optional), Contact Person's Email Address (mandatory), Business Type/Occupation (mandatory), Estimated Turnover (mandatory)
4. THE System SHALL NOT include Premium Payment Source field in KYC Corporate forms
5. THE System SHALL NOT include Office Location field in KYC Corporate forms
6. WHEN rendering KYC Corporate forms, THE System SHALL include Director/Signatory fields: First Name (mandatory), Middle Name (optional), Last Name (mandatory), Date of Birth (mandatory), Place of Birth (mandatory), Nationality (mandatory), Occupation (mandatory), Email Address (optional), Phone Number (optional), National Identification Number/NIN (mandatory), ID Type (mandatory), Identification Number (mandatory), Issuing Body/Country (mandatory), Date of Issue (mandatory), Date of Expiry (optional), Source of Income (mandatory)
7. THE System SHALL NOT include BVN field in KYC Individual forms
8. THE System SHALL NOT include BVN field for Directors/Signatories in KYC Corporate forms
9. THE System SHALL NOT include Residential Address field for Directors/Signatories in KYC Corporate forms (company address is sufficient)
10. THE System SHALL NOT include Tax ID Number field for Directors/Signatories in KYC Corporate forms
11. THE System SHALL NOT include Account Details section in KYC Corporate forms
12. THE System SHALL mark Tax ID as optional in KYC Corporate Company Information section
13. THE System SHALL support Document_Upload for KYC Individual forms (NIN verification documents)
14. THE System SHALL support Document_Upload for KYC Corporate forms (CAC documents and director identification)

### Requirement 2.1: Corporate Form Field Specification Reference

**User Story:** As a developer, I want a comprehensive field-by-field specification for Corporate NFIU and KYC forms, so that I can implement the exact field requirements without ambiguity.

#### Acceptance Criteria

1. THE System SHALL implement Corporate NFIU and KYC forms according to the following field specifications:

**SECTION 1: COMPANY INFORMATION**

| Field | NFIU | KYC |
|-------|------|-----|
| INSURED | MANDATORY | MANDATORY |
| OFFICE ADDRESS | MANDATORY | MANDATORY |
| OWNERSHIP OF COMPANY-NIGERIAN | Present | Present |
| WEBSITE | Present | Present |
| INCORPORATION/REGISTRATION NUMBER | MANDATORY | MANDATORY |
| INCORPORATION STATE | MANDATORY | MANDATORY |
| DATE OF INCORPORATION/REGISTRATION | MANDATORY | MANDATORY |
| NAME OF CONTACT PERSON | NOT APPLICABLE | MANDATORY |
| COMPANY'S CONTACT NUMBER | MANDATORY | MANDATORY |
| TAX IDENTIFICATION NUMBER | MANDATORY | Optional |
| EMAIL ADDRESS | EMAIL ADDRESS OF THE COMPANY - MANDATORY | CONTACT PERSON'S EMAIL ADDRESS - MANDATORY |
| BUSINESS TYPE/OCCUPATION | MANDATORY | MANDATORY |
| ESTIMATED TURNOVER | NOT APPLICABLE | MANDATORY |
| PREMIUM PAYMENT SOURCE | MANDATORY | NOT APPLICABLE |
| OFFICE LOCATION | NOT APPLICABLE | NOT APPLICABLE |
| NAME OF BRANCH OFFICE | NOT APPLICABLE | NOT APPLICABLE |

**SECTION 2: DIRECTOR/SIGNATORY INFORMATION**

| Field | NFIU | KYC |
|-------|------|-----|
| FIRST NAME | MANDATORY | MANDATORY |
| MIDDLE NAME | Optional | Optional |
| LAST NAME | MANDATORY | MANDATORY |
| DATE OF BIRTH | MANDATORY | MANDATORY |
| PLACE OF BIRTH | MANDATORY | MANDATORY |
| NATIONALITY | MANDATORY | MANDATORY |
| OCCUPATION | MANDATORY | MANDATORY |
| EMAIL ADDRESS | Optional | Optional |
| PHONE NUMBER | Optional | Optional |
| BANK VERIFICATION NUMBER (BVN) | MANDATORY | NOT APPLICABLE |
| NATIONAL IDENTIFICATION NUMBER (NIN) | MANDATORY | MANDATORY |
| RESIDENTIAL ADDRESS | MANDATORY | NOT APPLICABLE |
| TAX ID NUMBER | Optional | NOT APPLICABLE |
| ID TYPE | MANDATORY | MANDATORY |
| IDENTIFICATION NUMBER | MANDATORY | MANDATORY |
| ISSUING BODY/COUNTRY | MANDATORY | MANDATORY |
| DATE OF ISSUE | MANDATORY | MANDATORY |
| DATE OF EXPIRY | Optional | Optional |
| SOURCE OF INCOME | MANDATORY | MANDATORY |

**SECTION 3: ACCOUNT DETAILS**

| Field | NFIU | KYC |
|-------|------|-----|
| **NAIRA ACCOUNT** | | |
| BANK NAME | MANDATORY | NOT APPLICABLE |
| ACCOUNT NUMBER | MANDATORY | NOT APPLICABLE |
| BANK BRANCH | MANDATORY | NOT APPLICABLE |
| ACCOUNT OPENING DATE | MANDATORY | NOT APPLICABLE |
| **DOMICILIARY ACCOUNT** | | |
| BANK NAME | Optional | NOT APPLICABLE |
| ACCOUNT NUMBER | Optional | NOT APPLICABLE |
| BANK BRANCH | Optional | NOT APPLICABLE |
| ACCOUNT OPENING DATE | Optional | NOT APPLICABLE |

**SECTION 4: DOCUMENT UPLOAD**

| Field | NFIU | KYC |
|-------|------|-----|
| COMPANY DOCUMENT VERIFICATION | MANDATORY | Present |

2. WHEN implementing form configurations, THE System SHALL use "NOT APPLICABLE" to indicate fields that should not be rendered in that form type
3. WHEN implementing form configurations, THE System SHALL use "MANDATORY" to indicate required fields with validation
4. WHEN implementing form configurations, THE System SHALL use "Optional" or "Present" to indicate non-required fields
5. THE System SHALL ensure Email Address field labels differ between NFIU ("EMAIL ADDRESS OF THE COMPANY") and KYC ("CONTACT PERSON'S EMAIL ADDRESS")
6. THE System SHALL ensure all "NOT APPLICABLE" fields are completely removed from form rendering, validation, schema, and data storage for that form type
7. THE System SHALL remove "Office Location" field from both NFIU and KYC Corporate forms (including form UI, schema, validation, dashboard tables, PDF generation, and all references)
8. THE System SHALL remove "Name of Branch Office" field from both NFIU and KYC Corporate forms (including form UI, schema, validation, dashboard tables, PDF generation, and all references)

### Requirement 3: Navigation Structure Update

**User Story:** As a user, I want clear navigation showing KYC, NFIU, CDD, and Claims as separate options, so that I can easily find and access the appropriate form for my needs.

#### Acceptance Criteria

1. THE Navigation_Component SHALL display four distinct form categories: KYC, NFIU, CDD, and Claims
2. WHEN a user clicks on KYC in Navigation_Component, THE System SHALL display options for Individual KYC and Corporate KYC
3. WHEN a user clicks on NFIU in Navigation_Component, THE System SHALL display options for Individual NFIU and Corporate NFIU
4. THE System SHALL update Navbar component to include NFIU menu alongside KYC menu
5. THE System SHALL update Sidebar component to include NFIU items alongside KYC items
6. THE System SHALL update AdminSidebar component to include NFIU items alongside KYC items
7. THE System SHALL maintain existing CDD and Claims navigation entries

### Requirement 4: Routing Configuration

**User Story:** As a developer, I want proper routing for NFIU and KYC modules, so that users can access forms via distinct URLs and bookmarks work correctly.

#### Acceptance Criteria

1. THE System SHALL create routes: /nfiu, /nfiu/individual, /nfiu/corporate
2. THE System SHALL maintain existing routes: /kyc, /kyc/individual, /kyc/corporate
3. THE System SHALL create admin routes: /admin/nfiu/individual, /admin/nfiu/corporate
4. THE System SHALL maintain existing admin routes: /admin/kyc/individual, /admin/kyc/corporate
5. WHEN a user navigates to /nfiu routes, THE System SHALL render NFIU-specific forms with NFIU Field_Configuration
6. WHEN a user navigates to /kyc routes, THE System SHALL render KYC-specific forms with KYC Field_Configuration

### Requirement 5: Data Collection Separation

**User Story:** As a database administrator, I want separate Firestore collections for NFIU and KYC data, so that data is organized by purpose and queries are efficient.

#### Acceptance Criteria

1. THE System SHALL create new Data_Collection: individual-nfiu-form
2. THE System SHALL create new Data_Collection: corporate-nfiu-form
3. THE System SHALL maintain existing Data_Collection: Individual-kyc-form (with updated schema)
4. THE System SHALL maintain existing Data_Collection: corporate-kyc-form (with updated schema)
5. WHEN a user submits an NFIU Individual form, THE System SHALL store data in individual-nfiu-form collection
6. WHEN a user submits an NFIU Corporate form, THE System SHALL store data in corporate-nfiu-form collection
7. WHEN a user submits a KYC Individual form, THE System SHALL store data in Individual-kyc-form collection
8. WHEN a user submits a KYC Corporate form, THE System SHALL store data in corporate-kyc-form collection

### Requirement 6: Form Component Refactoring

**User Story:** As a developer, I want modern reusable form components following 2024/2025 best practices, so that NFIU and KYC forms share common UI elements while maintaining distinct field configurations and reducing code duplication.

#### Acceptance Criteria

1. THE System SHALL create modern Reusable_Component implementations: FormField, FormTextarea, FormSelect, FormDatePicker, FormFileUpload following 2024/2025 React best practices
2. THE System SHALL create a Field_Configuration system that defines which fields appear in each form type
3. WHEN rendering forms, THE System SHALL apply Field_Configuration to determine field visibility and validation rules
4. THE System SHALL reduce individual form file length by at least 30% through component extraction and reuse
5. THE System SHALL create separate page components: IndividualNFIU.tsx, CorporateNFIU.tsx
6. THE System SHALL refactor existing page components: IndividualKYC.tsx, CorporateKYC.tsx to use new Reusable_Component architecture
7. THE System SHALL preserve all existing form functionality including multi-step navigation, draft saving, and validation
8. THE System SHALL maintain compatibility with existing useFormDraft, useEnhancedFormSubmit, and MultiStepForm hooks

### Requirement 7: Dashboard Integration

**User Story:** As an administrator, I want dashboards to display NFIU and KYC submissions separately, so that I can monitor and manage each type of submission independently.

#### Acceptance Criteria

1. WHEN rendering AdminDashboard, THE System SHALL display NFIU submissions in a separate section from KYC submissions
2. WHEN a user clicks on an NFIU Individual submission, THE System SHALL navigate to /admin/nfiu/individual
3. WHEN a user clicks on an NFIU Corporate submission, THE System SHALL navigate to /admin/nfiu/corporate
4. THE System SHALL update UserDashboard to show user's NFIU and KYC submissions separately
5. THE System SHALL create admin table components: AdminIndividualNFIUTable, AdminCorporateNFIUTable
6. THE System SHALL maintain existing admin table components with updated data sources

### Requirement 8: Data Migration Strategy

**User Story:** As a system administrator, I want existing KYC data to be accessible in the new structure, so that historical records remain available and no data is lost.

#### Acceptance Criteria

1. THE Migration_Service SHALL identify existing records in Individual-kyc-form and corporate-kyc-form collections
2. WHEN Migration_Service processes existing records, THE System SHALL preserve all original data
3. THE System SHALL add a metadata field "formType" with values "legacy", "kyc", or "nfiu" to all records
4. WHEN displaying legacy records in admin dashboards, THE System SHALL show them in both KYC and NFIU views with a "legacy" indicator
5. THE System SHALL NOT modify or delete existing records during migration
6. THE Migration_Service SHALL create a migration log documenting all processed records

### Requirement 9: Validation Rule Differentiation

**User Story:** As a form user, I want appropriate validation based on whether I'm completing NFIU or KYC forms, so that I only provide mandatory fields relevant to my form type.

#### Acceptance Criteria

1. WHEN validating NFIU Individual forms, THE System SHALL require: First Name, Last Name, DOB, Place of Birth, Nationality, Occupation, NIN, BVN, Tax ID, ID Type, ID Number, ID Issuing Body, ID Date of Issue, Source of Income
2. WHEN validating NFIU Corporate forms, THE System SHALL require Company Information fields: Insured, Office Address, Incorporation/Registration Number, Incorporation State, Date of Incorporation/Registration, Company's Contact Number, Tax Identification Number, Email Address of the Company, Business Type/Occupation, Premium Payment Source
3. WHEN validating NFIU Corporate forms, THE System SHALL require Director/Signatory fields: First Name, Last Name, Date of Birth, Place of Birth, Nationality, Occupation, BVN, NIN, Residential Address, ID Type, Identification Number, Issuing Body/Country, Date of Issue, Source of Income
4. WHEN validating NFIU Corporate forms, THE System SHALL require Naira Account Details: Bank Name, Account Number, Bank Branch, Account Opening Date
5. WHEN validating KYC Individual forms, THE System SHALL require: First Name, Last Name, DOB, Place of Birth, Nationality, Occupation, NIN, ID Type, ID Number, ID Issuing Body, ID Date of Issue, Source of Income
6. WHEN validating KYC Corporate forms, THE System SHALL require Company Information fields: Insured, Office Address, Incorporation/Registration Number, Incorporation State, Date of Incorporation/Registration, Name of Contact Person, Company's Contact Number, Contact Person's Email Address, Business Type/Occupation, Estimated Turnover
7. WHEN validating KYC Corporate forms, THE System SHALL require Director/Signatory fields: First Name, Last Name, Date of Birth, Place of Birth, Nationality, Occupation, NIN, ID Type, Identification Number, Issuing Body/Country, Date of Issue, Source of Income
8. THE System SHALL NOT validate BVN field in KYC forms as it should not be present
9. THE System SHALL NOT validate Account Details in KYC Corporate forms as this section should not be present
10. THE System SHALL NOT validate Residential Address for Directors/Signatories in KYC Corporate forms as this field should not be present
11. THE System SHALL NOT validate Tax ID Number for Directors/Signatories in KYC Corporate forms as this field should not be present
12. THE System SHALL display field-specific error messages indicating which fields are required for the current form type
13. THE System SHALL prevent form submission IF required fields for the current form type are missing

### Requirement 10: Firestore Security Rules Update

**User Story:** As a security administrator, I want Firestore security rules updated for new collections, so that data access is properly controlled and audited.

#### Acceptance Criteria

1. THE System SHALL create security rules for individual-nfiu-form collection matching existing KYC collection patterns
2. THE System SHALL create security rules for corporate-nfiu-form collection matching existing KYC collection patterns
3. WHEN a user attempts to read NFIU data, THE System SHALL verify user authentication and authorization
4. WHEN a user attempts to write NFIU data, THE System SHALL verify user authentication and validate data structure
5. THE System SHALL maintain existing security rules for Individual-kyc-form and corporate-kyc-form collections

### Requirement 11: AutoFill Integration

**User Story:** As a form user, I want NIN and CAC autofill to work in both NFIU and KYC forms, so that I can quickly populate verified data regardless of form type.

#### Acceptance Criteria

1. THE System SHALL preserve existing AutoFill_Engine functionality from src/services/autoFill/
2. WHEN a user enters a valid NIN in NFIU Individual forms, THE System SHALL trigger autofill for matching fields using existing VerificationAPIClient
3. WHEN a user enters a valid NIN in KYC Individual forms, THE System SHALL trigger autofill for matching fields using existing VerificationAPIClient
4. WHEN a user enters a valid CAC number in NFIU Corporate forms, THE System SHALL trigger autofill for matching fields using existing VerificationAPIClient
5. WHEN a user enters a valid CAC number in KYC Corporate forms, THE System SHALL trigger autofill for matching fields using existing VerificationAPIClient
6. THE System SHALL use existing FieldMapper to map autofill data to appropriate fields based on Field_Configuration for each form type
7. THE System SHALL NOT attempt to autofill fields that don't exist in the current form type (e.g., BVN in KYC forms, Contact Person Name in NFIU forms, Estimated Turnover in NFIU forms, Premium Payment Source in KYC forms, Residential Address for Directors in KYC forms)
8. THE System SHALL preserve existing VisualFeedbackManager for autofill status indicators
9. THE System SHALL maintain compatibility with existing InputTriggerHandler for detecting autofill triggers
10. THE System SHALL use existing DataNormalizer for formatting autofilled data
11. WHEN autofilling NFIU Corporate forms, THE System SHALL populate "Email Address of the Company" field from CAC data
12. WHEN autofilling KYC Corporate forms, THE System SHALL populate "Contact Person's Email Address" field from CAC data
13. THE System SHALL handle field label differences between NFIU and KYC forms in the FieldMapper configuration

### Requirement 12: Index Page Update

**User Story:** As a visitor, I want the landing page to show both KYC and NFIU options, so that I can understand what forms are available and choose the appropriate one.

#### Acceptance Criteria

1. WHEN rendering the Index page, THE System SHALL display a KYC card with description and links to Individual/Corporate KYC
2. WHEN rendering the Index page, THE System SHALL display an NFIU card with description and links to Individual/Corporate NFIU
3. THE System SHALL maintain existing CDD and Claims cards on the Index page
4. THE System SHALL provide clear descriptions differentiating KYC (customer onboarding) from NFIU (regulatory reporting)

### Requirement 13: Form Submission Service Update

**User Story:** As a developer, I want form submission services to handle both NFIU and KYC submissions, so that data is correctly routed to appropriate collections with proper validation.

#### Acceptance Criteria

1. THE System SHALL create submission service functions: submitIndividualNFIU, submitCorporateNFIU
2. THE System SHALL update existing submission service functions: submitIndividualKYC, submitCorporateKYC
3. WHEN submitIndividualNFIU is called, THE System SHALL validate against NFIU Individual Field_Configuration and save to individual-nfiu-form collection
4. WHEN submitCorporateNFIU is called, THE System SHALL validate against NFIU Corporate Field_Configuration and save to corporate-nfiu-form collection
5. WHEN submission services save data, THE System SHALL include metadata: formType, submissionDate, userId, formVersion
6. IF submission validation fails, THEN THE System SHALL return detailed error messages indicating which fields failed validation
7. THE System SHALL preserve Existing_Auth_Flow where users can fill forms without authentication, then authenticate on submit
8. WHEN a user submits a form without authentication, THE System SHALL prompt for authentication before saving data
9. THE System SHALL maintain compatibility with existing useEnhancedFormSubmit hook and FormLoadingModal components

### Requirement 14: Admin Table Filtering

**User Story:** As an administrator, I want to filter submissions by form type (NFIU vs KYC), so that I can focus on specific types of submissions when reviewing data.

#### Acceptance Criteria

1. WHEN rendering admin tables, THE System SHALL provide a filter option for formType
2. WHEN a user selects "NFIU" filter, THE System SHALL display only NFIU submissions
3. WHEN a user selects "KYC" filter, THE System SHALL display only KYC submissions
4. WHEN a user selects "Legacy" filter, THE System SHALL display only legacy submissions
5. THE System SHALL maintain existing filters (date range, status, etc.) alongside formType filter
6. THE System SHALL display formType as a column in admin tables

### Requirement 15: Documentation and Help Text

**User Story:** As a form user, I want clear help text explaining the difference between NFIU and KYC forms, so that I can choose the correct form for my needs.

#### Acceptance Criteria

1. WHEN rendering the NFIU forms selection page, THE System SHALL display help text: "NFIU forms are for regulatory reporting to the Nigerian Financial Intelligence Unit. Complete these forms for compliance purposes."
2. WHEN rendering the KYC forms selection page, THE System SHALL display help text: "KYC forms are for customer onboarding and verification. Complete these forms to establish a business relationship."
3. THE System SHALL provide tooltips on NFIU-specific fields (BVN, Account Details) explaining why they are required
4. THE System SHALL provide tooltips on KYC-specific fields (Contact Person, Estimated Turnover) explaining their purpose
5. WHEN a user hovers over field labels, THE System SHALL display contextual help text where applicable

### Requirement 16: Comprehensive Audit Logging

**User Story:** As a compliance officer, I want comprehensive audit logs for all form actions, so that I can track who did what, when, where, and from which device for regulatory compliance and security monitoring.

#### Acceptance Criteria

1. THE System SHALL extend existing Audit_Logger infrastructure (server-utils/auditLogger.cjs) to log all NFIU and KYC form events
2. WHEN a user views an NFIU or KYC form, THE System SHALL log: userId, userRole, formType, ipAddress, location (if available), deviceInfo, userAgent, timestamp
3. WHEN a user submits an NFIU or KYC form, THE System SHALL log: userId, userRole, formType, submissionId, ipAddress, location (if available), deviceInfo, userAgent, timestamp, formData (masked sensitive fields)
4. WHEN a user uploads a document, THE System SHALL log: userId, userRole, documentType, fileName, fileSize, ipAddress, location (if available), deviceInfo, timestamp
5. WHEN an admin views form submissions, THE System SHALL log: adminUserId, adminRole, formType, submissionId, action (view/edit/approve/reject), ipAddress, location (if available), deviceInfo, timestamp
6. WHEN an admin modifies form data, THE System SHALL log: adminUserId, adminRole, formType, submissionId, changedFields, oldValues (masked), newValues (masked), ipAddress, location (if available), deviceInfo, timestamp
7. THE System SHALL capture device information including: browser, OS, device type (mobile/tablet/desktop), screen resolution
8. THE System SHALL attempt to capture location using IP geolocation services where available
9. THE System SHALL store all audit logs in the existing verification-audit-logs Firestore collection
10. THE System SHALL mask sensitive data (NIN, BVN, account numbers) in audit logs using existing maskSensitiveData function
11. THE System SHALL provide audit log query capabilities filtered by: userId, formType, dateRange, action, ipAddress
12. THE System SHALL maintain audit log retention for at least 7 years for regulatory compliance
