# Implementation Plan: KYC-NFIU Separation

## Overview

This implementation plan breaks down the KYC-NFIU separation feature into actionable coding tasks. This is a REFACTORING project that preserves all existing functionality while modernizing the component architecture and providing clearer separation of concerns. The implementation follows a 10-phase approach over 6 weeks, targeting a 30%+ code reduction through component reusability.

## Key Implementation Principles

- Preserve all existing functionality (auth flow, autofill, document uploads, audit logging)
- Use modern React patterns with reusable components
- Configuration-driven field system for form behavior
- Comprehensive audit trail for all form interactions
- Backward compatibility with existing data

## Tasks

- [x] 1. Phase 1: Foundation - Reusable Components and Configuration System
  - [x] 1.1 Create FormField component with validation and accessibility
    - Implement FormField.tsx with React Hook Form integration
    - Support text, email, tel, number input types
    - Include error display, tooltips, and ARIA labels
    - Add maxLength validation and disabled state support
    - _Requirements: 6.1, 6.3_

  - [x] 1.2 Create FormSelect component with shadcn/ui integration
    - Implement FormSelect.tsx using shadcn/ui Select component
    - Support dynamic options array
    - Include placeholder and tooltip support
    - Add error state handling
    - _Requirements: 6.1, 6.3_

  - [x] 1.3 Create FormDatePicker component with date-fns
    - Implement FormDatePicker.tsx using shadcn/ui Calendar
    - Support minDate and maxDate constraints
    - Format dates consistently across forms
    - Include accessibility features
    - _Requirements: 6.1, 6.3_


  - [x] 1.4 Create FormFileUpload component with validation
    - Implement FormFileUpload.tsx with file type and size validation
    - Support accept prop for file type restrictions
    - Display file preview and removal functionality
    - Include upload progress indicators
    - _Requirements: 6.1, 6.3, 1.7, 2.8_

  - [x] 1.5 Create FormTextarea component for long-text fields
    - Implement FormTextarea.tsx with character count
    - Support maxLength validation
    - Include resize handling
    - Add accessibility features
    - _Requirements: 6.1, 6.3_

  - [x] 1.6 Write unit tests for reusable form components
    - Test FormField rendering and validation
    - Test FormSelect options and selection
    - Test FormDatePicker date constraints
    - Test FormFileUpload file validation
    - Test FormTextarea character limits
    - _Requirements: 6.1_

  - [x] 1.7 Create field configuration system with TypeScript interfaces
    - Define FieldConfig interface in src/types/formConfig.ts
    - Define FormConfig interface with sections array
    - Create validation schema generator utility
    - Add conditional field support
    - _Requirements: 6.2, 6.3_

  - [x] 1.8 Create NFIU Individual field configuration
    - Implement nfiuIndividualConfig in src/config/formConfigs.ts
    - Include all required NFIU Individual fields with BVN and Tax ID as mandatory
    - Define validation rules for each field
    - Add tooltips for NFIU-specific fields
    - _Requirements: 1.2, 1.6, 15.3_

  - [x] 1.9 Update NFIU Corporate field configuration with exact client specifications
    - Update nfiuCorporateConfig in src/config/formConfigs.ts
    - **REMOVE**: Office Location field (completely remove from config)
    - **REMOVE**: Name of Branch Office field (completely remove from config)
    - **REMOVE**: Name of Contact Person field (NOT APPLICABLE for NFIU)
    - **REMOVE**: Estimated Turnover field (NOT APPLICABLE for NFIU)
    - **ENSURE MANDATORY**: Company's Contact Number, Tax Identification Number, Email Address of the Company (label: "Email Address of the Company"), Premium Payment Source
    - **ENSURE MANDATORY for Directors**: BVN, Residential Address
    - **ENSURE OPTIONAL for Directors**: Tax ID Number
    - **ENSURE Account Details section exists** with Naira Account (all fields mandatory) and Domiciliary Account (all fields optional)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.1, 15.3_

  - [x] 1.10 Create KYC Individual field configuration
    - Implement kycIndividualConfig in src/config/formConfigs.ts
    - Exclude BVN field, mark Tax ID as optional
    - Define KYC-specific validation rules
    - Add tooltips for KYC-specific fields
    - _Requirements: 2.2, 2.5, 2.7, 15.4_

  - [x] 1.11 Update KYC Corporate field configuration with exact client specifications
    - Update kycCorporateConfig in src/config/formConfigs.ts
    - **REMOVE**: Office Location field (completely remove from config)
    - **REMOVE**: Name of Branch Office field (completely remove from config)
    - **REMOVE**: Premium Payment Source field (NOT APPLICABLE for KYC)
    - **REMOVE**: Account Details section (NOT APPLICABLE for KYC)
    - **REMOVE from Directors**: BVN field (NOT APPLICABLE for KYC)
    - **REMOVE from Directors**: Residential Address field (NOT APPLICABLE for KYC)
    - **REMOVE from Directors**: Tax ID Number field (NOT APPLICABLE for KYC)
    - **ENSURE MANDATORY**: Name of Contact Person, Company's Contact Number, Contact Person's Email Address (label: "Contact Person's Email Address"), Estimated Turnover
    - **ENSURE OPTIONAL**: Tax Identification Number (company level)
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.1, 15.4_


  - [x] 1.12 Create FormRenderer component for configuration-driven rendering
    - Implement FormRenderer.tsx that accepts FormConfig
    - Map field types to appropriate form components
    - Support conditional field rendering
    - Integrate with MultiStepForm for section navigation
    - _Requirements: 6.3, 6.7_

  - [x] 1.13 Update unit tests for field configurations with exact specifications
    - Test NFIU Individual config has BVN field
    - Test KYC Individual config excludes BVN field
    - **Test NFIU Corporate config has Account Details section**
    - **Test NFIU Corporate config has Premium Payment Source field**
    - **Test NFIU Corporate config has "Email Address of the Company" field (mandatory)**
    - **Test NFIU Corporate config does NOT have Name of Contact Person field**
    - **Test NFIU Corporate config does NOT have Estimated Turnover field**
    - **Test NFIU Corporate config does NOT have Office Location field**
    - **Test NFIU Corporate config does NOT have Name of Branch Office field**
    - **Test NFIU Corporate directors have BVN field (mandatory)**
    - **Test NFIU Corporate directors have Residential Address field (mandatory)**
    - **Test NFIU Corporate directors have Tax ID Number field (optional)**
    - **Test KYC Corporate config does NOT have Account Details section**
    - **Test KYC Corporate config does NOT have Premium Payment Source field**
    - **Test KYC Corporate config has Name of Contact Person field (mandatory)**
    - **Test KYC Corporate config has Estimated Turnover field (mandatory)**
    - **Test KYC Corporate config has "Contact Person's Email Address" field (mandatory)**
    - **Test KYC Corporate config does NOT have Office Location field**
    - **Test KYC Corporate config does NOT have Name of Branch Office field**
    - **Test KYC Corporate directors do NOT have BVN field**
    - **Test KYC Corporate directors do NOT have Residential Address field**
    - **Test KYC Corporate directors do NOT have Tax ID Number field**
    - Test validation schema generation
    - _Requirements: 6.2, 6.3, 2.1_

- [ ] 2. Phase 2: NFIU Forms Creation and Field Updates
  - [x] 2.1 Create IndividualNFIU page component
    - Implement src/pages/nfiu/IndividualNFIU.tsx using FormRenderer
    - Integrate with useForm and React Hook Form
    - Connect to nfiuIndividualConfig
    - Implement form submission with useEnhancedFormSubmit
    - Save to individual-nfiu-form collection
    - _Requirements: 1.1, 1.2, 5.1, 5.5, 13.3_

  - [x] 2.2 Integrate AutoFill Engine in IndividualNFIU with authentication-based UI
    - Initialize useAutoFill hook with formType 'nfiu-individual' and requireAuth=true
    - Import useAuth hook to check authentication status
    - Display authentication-based messaging: "Your NIN will be verified when you submit" (anonymous) vs "Enter your NIN and press Tab to auto-fill" (authenticated)
    - Add format validation using validateNINFormat from src/utils/identityFormatValidator.ts
    - Display format validation feedback (checkmark for valid, error message for invalid)
    - Set up NIN field blur listener for autofill trigger (authenticated users only)
    - Configure FieldMapper to respect NFIU field configuration
    - Preserve existing VisualFeedbackManager integration
    - _Requirements: 11.2, 11.6, 11.7, 11.8, Autofill Security: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.3 Integrate document upload in IndividualNFIU
    - Add FormFileUpload for identification document
    - Connect to existing document upload service
    - Implement file validation (PDF, JPG, PNG, max 3MB)
    - Store document URLs in submission data
    - _Requirements: 1.7_

  - [x] 2.4 Integrate draft saving in IndividualNFIU
    - Connect to useFormDraft hook with key 'individualNFIU'
    - Auto-save draft on field changes
    - Load draft on component mount
    - Clear draft on successful submission
    - _Requirements: 6.7, 6.8_

  - [x] 2.5 Add audit logging to IndividualNFIU
    - Log form view event on component mount
    - Log form submission event on submit
    - Log document upload events
    - Include device info, IP address, and location
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.7_

  - [x] 2.6 Update CorporateNFIU page component with exact field specifications
    - Update src/pages/nfiu/CorporateNFIU.tsx to use updated nfiuCorporateConfig
    - **REMOVE**: Office Location field from form UI
    - **REMOVE**: Name of Branch Office field from form UI
    - **REMOVE**: Name of Contact Person field from form UI
    - **REMOVE**: Estimated Turnover field from form UI
    - **ENSURE**: "Email Address of the Company" field is present and mandatory
    - **ENSURE**: Premium Payment Source field is present and mandatory
    - **ENSURE**: Tax Identification Number field is mandatory at company level
    - **ENSURE**: Directors section includes BVN field (mandatory)
    - **ENSURE**: Directors section includes Residential Address field (mandatory)
    - **ENSURE**: Directors section includes Tax ID Number field (optional)
    - **ENSURE**: Account Details section is present with Naira Account (mandatory) and Domiciliary Account (optional)
    - Save to corporate-nfiu-form collection
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 5.2, 5.6, 13.4_

  - [x] 2.7 Update AutoFill integration in CorporateNFIU with field mapping for exact specifications
    - Update useAutoFill hook with formType 'nfiu-corporate' and requireAuth=true
    - Update FieldMapper to map CAC data to "Email Address of the Company" field (not "Contact Person's Email Address")
    - Ensure FieldMapper does NOT attempt to populate Name of Contact Person field (removed)
    - Ensure FieldMapper does NOT attempt to populate Estimated Turnover field (removed)
    - Ensure FieldMapper does NOT attempt to populate Office Location field (removed)
    - Ensure FieldMapper does NOT attempt to populate Name of Branch Office field (removed)
    - Configure FieldMapper for corporate fields including Premium Payment Source
    - Preserve existing CAC document upload integration
    - _Requirements: 11.4, 11.6, 11.7, 11.9, 11.12, 11.13, 2.1, Autofill Security: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.8 Integrate document upload in CorporateNFIU
    - Add CAC document upload using existing CACDocumentUpload component
    - Add director identification document uploads
    - Implement file validation for all documents
    - Store all document URLs in submission data
    - _Requirements: 1.8_

  - [x] 2.9 Integrate draft saving in CorporateNFIU
    - Connect to useFormDraft hook with key 'corporateNFIU'
    - Handle directors array in draft data
    - Handle account details in draft data
    - Clear draft on successful submission
    - _Requirements: 6.7, 6.8_

  - [x] 2.10 Add audit logging to CorporateNFIU
    - Log form view event on component mount
    - Log form submission event on submit
    - Log CAC document upload events
    - Log director document upload events
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [x] 2.11 Create NFIULanding page component
    - Implement src/pages/nfiu/NFIULanding.tsx
    - Display cards for Individual NFIU and Corporate NFIU
    - Add help text explaining NFIU purpose
    - Link to /nfiu/individual and /nfiu/corporate
    - _Requirements: 12.2, 15.1_

  - [x] 2.12 Write integration tests for NFIU forms
    - Test IndividualNFIU form rendering
    - Test CorporateNFIU form rendering
    - Test form submission flow
    - Test autofill integration
    - Test document upload integration
    - _Requirements: 1.1, 1.2, 1.3_


- [ ] 3. Phase 3: KYC Forms Refactoring with Autofill Security UI
  - [x] 3.1 Refactor IndividualKYC to use FormRenderer with authentication-based autofill UI
    - Update src/pages/kyc/IndividualKYC.tsx to use new component architecture
    - Replace inline field definitions with kycIndividualConfig
    - **ADD AUTOFILL SECURITY UI (CRITICAL GAP FIX)**:
      - Import useAuth hook from '@/contexts/AuthContext' to check authentication status
      - Check authentication: `const { user } = useAuth(); const isAuthenticated = user !== null && user !== undefined;`
      - Display authentication-based messaging for NIN field:
        - Anonymous: "Your NIN will be verified when you submit"
        - Authenticated: "Enter your NIN and press Tab to auto-fill"
      - Add format validation using validateNINFormat from src/utils/identityFormatValidator.ts
      - Display format validation feedback (checkmark icon for valid, error message for invalid)
      - Update useAutoFill hook call to include requireAuth=true parameter
      - Add visual indicators: loading spinner during verification, success checkmark, error states
    - Maintain existing submission to Individual-kyc-form collection
    - Preserve all existing functionality (draft saving, multi-step navigation, document upload)
    - _Requirements: 2.1, 2.2, 6.6, 13.2, Autofill Security: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 Update AutoFill integration in IndividualKYC
    - Update useAutoFill hook with formType 'kyc-individual' and requireAuth=true
    - Ensure FieldMapper skips BVN field for KYC forms
    - Verify autofill only populates fields present in KYC config
    - Test NIN autofill functionality for authenticated users
    - Verify anonymous users see appropriate messaging
    - _Requirements: 11.3, 11.7, Autofill Security: 1.1, 1.2, 1.3_

  - [x] 3.3 Update document upload in IndividualKYC
    - Verify FormFileUpload integration works with refactored component
    - Ensure document URLs are saved correctly
    - Test file validation
    - _Requirements: 2.8_

  - [x] 3.4 Update audit logging in IndividualKYC
    - Ensure form view logging includes formType 'kyc'
    - Ensure form submission logging includes formType 'kyc'
    - Verify device info and IP capture
    - _Requirements: 16.2, 16.3_

  - [ ] 3.5 Update CorporateKYC to use FormRenderer with exact field specifications and authentication-based autofill UI
    - Update src/pages/kyc/CorporateKYC.tsx to use updated kycCorporateConfig
    - **REMOVE**: Office Location field from form UI
    - **REMOVE**: Name of Branch Office field from form UI
    - **REMOVE**: Premium Payment Source field from form UI
    - **REMOVE**: Account Details section from form UI
    - **REMOVE from Directors**: BVN field from form UI
    - **REMOVE from Directors**: Residential Address field from form UI
    - **REMOVE from Directors**: Tax ID Number field from form UI
    - **ENSURE**: Name of Contact Person field is present and mandatory
    - **ENSURE**: "Contact Person's Email Address" field is present and mandatory
    - **ENSURE**: Estimated Turnover field is present and mandatory
    - **ENSURE**: Tax Identification Number field is optional at company level
    - **ADD AUTOFILL SECURITY UI**: Import useAuth hook to check authentication status
    - **ADD AUTOFILL SECURITY UI**: Display authentication-based messaging for CAC field: "Your CAC will be verified when you submit" (anonymous) vs "Enter your CAC and press Tab to auto-fill" (authenticated)
    - **ADD AUTOFILL SECURITY UI**: Add format validation using validateCACFormat from src/utils/identityFormatValidator.ts
    - **ADD AUTOFILL SECURITY UI**: Display format validation feedback (checkmark for valid, error message for invalid)
    - **ADD AUTOFILL SECURITY UI**: Update useAutoFill hook call to include requireAuth=true
    - Maintain existing submission to corporate-kyc-form collection
    - _Requirements: 2.1, 2.3, 2.4, 2.6, 2.1, 6.6, 13.2, Autofill Security: 5.1, 5.2, 5.3, 5.4_

  - [ ] 3.6 Update AutoFill integration in CorporateKYC with field mapping for exact specifications
    - Update useAutoFill hook with formType 'kyc-corporate' and requireAuth=true
    - Update FieldMapper to map CAC data to "Contact Person's Email Address" field (not "Email Address of the Company")
    - Ensure FieldMapper does NOT attempt to populate Premium Payment Source field (removed)
    - Ensure FieldMapper does NOT attempt to populate Office Location field (removed)
    - Ensure FieldMapper does NOT attempt to populate Name of Branch Office field (removed)
    - Ensure FieldMapper does NOT attempt to populate Account Details fields (section removed)
    - Ensure FieldMapper does NOT attempt to populate BVN fields for directors (removed)
    - Ensure FieldMapper does NOT attempt to populate Residential Address for directors (removed)
    - Ensure FieldMapper does NOT attempt to populate Tax ID Number for directors (removed)
    - Verify CAC autofill functionality for authenticated users
    - Verify anonymous users see appropriate messaging
    - Test field mapping accuracy
    - _Requirements: 11.5, 11.7, 11.12, 11.13, 2.1, Autofill Security: 1.1, 1.2, 1.3_

  - [x] 3.7 Update document upload in CorporateKYC
    - Verify CACDocumentUpload component integration
    - Ensure director document uploads work correctly
    - Test file validation for all documents
    - _Requirements: 2.9_

  - [x] 3.8 Update audit logging in CorporateKYC
    - Ensure form view logging includes formType 'kyc'
    - Ensure form submission logging includes formType 'kyc'
    - Log CAC document uploads
    - _Requirements: 16.2, 16.3, 16.4_


  - [x] 3.9 Write regression tests for refactored KYC forms
    - Test IndividualKYC form rendering matches original
    - Test CorporateKYC form rendering matches original
    - Test form submission still works
    - Test autofill still works
    - Test document upload still works
    - Verify no functionality was lost in refactoring
    - _Requirements: 6.6, 13.7, 13.8_

  - [x] 3.10 Complete autofill security testing (Tasks 17-18 from kyc-autofill-security spec)
    - Run all autofill security tests: npm test -- src/__tests__/kyc-autofill-security/
    - Verify authentication enforcement works in both KYC and NFIU forms
    - Verify format validation works in both KYC and NFIU forms
    - Verify UI messaging displays correctly for authenticated vs anonymous users
    - Test security scenarios: authentication bypass attempts, rate limit bypass attempts
    - Verify sensitive data (NIN, CAC) is never logged in plaintext
    - Verify authentication tokens are validated on every request
    - Final checkpoint: ensure all autofill security tests pass
    - _Requirements: Autofill Security: 3.1, 3.2, 4.1, 4.2, 8.1, 8.2, 8.3_

- [ ] 4. Phase 4: Navigation and Routing Updates
  - [x] 4.1 Update Navbar component with NFIU menu
    - Add NFIU dropdown menu to src/components/layout/Navbar.tsx
    - Include Individual NFIU and Corporate NFIU menu items
    - Maintain existing KYC, CDD, and Claims menus
    - _Requirements: 3.1, 3.4_

  - [x] 4.2 Update Sidebar component with NFIU section
    - Add NFIU section to src/components/layout/Sidebar.tsx
    - Include Individual NFIU and Corporate NFIU items
    - Maintain existing sections
    - _Requirements: 3.1, 3.5_

  - [x] 4.3 Update AdminSidebar component with NFIU section
    - Add NFIU Management section to src/components/admin/AdminSidebar.tsx
    - Include Individual NFIU and Corporate NFIU admin items
    - Maintain existing sections
    - _Requirements: 3.1, 3.6_

  - [x] 4.4 Add NFIU routes to App.tsx
    - Add /nfiu route for NFIULanding
    - Add /nfiu/individual route for IndividualNFIU
    - Add /nfiu/corporate route for CorporateNFIU
    - Add /admin/nfiu/individual route for admin view
    - Add /admin/nfiu/corporate route for admin view
    - _Requirements: 4.1, 4.3_

  - [x] 4.5 Verify existing KYC routes still work
    - Test /kyc route navigation
    - Test /kyc/individual route navigation
    - Test /kyc/corporate route navigation
    - Test /admin/kyc/individual route navigation
    - Test /admin/kyc/corporate route navigation
    - _Requirements: 4.2, 4.4_

  - [x] 4.6 Update Index page with NFIU card
    - Add NFIU card to src/pages/Index.tsx
    - Include description: "NFIU forms are for regulatory reporting to the Nigerian Financial Intelligence Unit"
    - Link to /nfiu landing page
    - Maintain existing KYC, CDD, and Claims cards
    - _Requirements: 12.1, 12.2, 12.3, 15.1_


  - [x] 4.7 Update KYC landing page with help text
    - Update src/pages/kyc/KYCLanding.tsx (if exists) or create it
    - Add description: "KYC forms are for customer onboarding and verification"
    - Clarify difference from NFIU forms
    - _Requirements: 12.4, 15.2_

  - [x] 4.8 Write navigation tests
    - Test NFIU menu items appear in Navbar
    - Test NFIU items appear in Sidebar
    - Test NFIU items appear in AdminSidebar
    - Test all routes navigate correctly
    - Test Index page displays all cards
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Phase 5: Dashboard Updates with Field-Specific Display
  - [ ] 5.1 Update AdminIndividualNFIUTable component
    - Update src/components/admin/AdminIndividualNFIUTable.tsx (or src/pages/admin/AdminIndividualNFIUTable.tsx)
    - Query individual-nfiu-form collection
    - Display submission data in table format
    - Include status, submission date, user info columns
    - Add formType column showing "NFIU"
    - **ENSURE**: Display BVN column (NFIU-specific)
    - **ENSURE**: Display Tax ID column (NFIU-specific, mandatory)
    - _Requirements: 7.5, 14.6, 2.1_

  - [ ] 5.2 Update AdminCorporateNFIUTable component with NFIU-specific fields
    - Update src/components/admin/AdminCorporateNFIUTable.tsx (or src/pages/admin/AdminCorporateNFIUTable.tsx)
    - Query corporate-nfiu-form collection
    - Display submission data in table format
    - Include company name, status, submission date columns
    - Add formType column showing "NFIU"
    - **ENSURE**: Display "Email Address of the Company" column (not "Contact Person's Email")
    - **ENSURE**: Display Premium Payment Source column (NFIU-specific)
    - **ENSURE**: Display Tax ID column (NFIU-specific, mandatory)
    - **ENSURE**: Display Account Details indicator (NFIU-specific)
    - **DO NOT DISPLAY**: Name of Contact Person column (not in NFIU)
    - **DO NOT DISPLAY**: Estimated Turnover column (not in NFIU)
    - **DO NOT DISPLAY**: Office Location column (removed from both)
    - **DO NOT DISPLAY**: Name of Branch Office column (removed from both)
    - _Requirements: 7.5, 14.6, 2.1_

  - [x] 5.3 Update AdminDashboard with NFIU section
    - Add NFIU submissions section to src/pages/admin/AdminDashboard.tsx
    - Include tabs for Individual and Corporate NFIU
    - Add formType filter dropdown (All, KYC, NFIU, Legacy)
    - Implement filter logic to show/hide sections
    - _Requirements: 7.1, 14.1, 14.2, 14.3, 14.4_

  - [ ] 5.4 Update formType column in existing KYC admin tables with field-specific display
    - Update AdminIndividualKYCTable to display formType
    - Update AdminCorporateKYCTable to display formType
    - Show "KYC" or "Legacy" based on formType field
    - **ENSURE AdminCorporateKYCTable**: Display "Contact Person's Email Address" column (not "Email Address of the Company")
    - **ENSURE AdminCorporateKYCTable**: Display Name of Contact Person column (KYC-specific)
    - **ENSURE AdminCorporateKYCTable**: Display Estimated Turnover column (KYC-specific)
    - **ENSURE AdminCorporateKYCTable**: Display Tax ID column as optional
    - **DO NOT DISPLAY in AdminCorporateKYCTable**: Premium Payment Source column (not in KYC)
    - **DO NOT DISPLAY in AdminCorporateKYCTable**: Account Details indicator (not in KYC)
    - **DO NOT DISPLAY in AdminCorporateKYCTable**: Office Location column (removed from both)
    - **DO NOT DISPLAY in AdminCorporateKYCTable**: Name of Branch Office column (removed from both)
    - **DO NOT DISPLAY in AdminCorporateKYCTable**: Director BVN column (not in KYC)
    - **DO NOT DISPLAY in AdminCorporateKYCTable**: Director Residential Address column (not in KYC)
    - **DO NOT DISPLAY in AdminCorporateKYCTable**: Director Tax ID column (not in KYC)
    - _Requirements: 14.6, 2.1_

  - [x] 5.5 Implement formType filtering in admin tables
    - Add filter state management in AdminDashboard
    - Filter individual-nfiu-form queries by formType
    - Filter corporate-nfiu-form queries by formType
    - Filter Individual-kyc-form queries by formType
    - Filter corporate-kyc-form queries by formType
    - Maintain existing filters (date range, status)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_


  - [x] 5.6 Update UserDashboard to show NFIU submissions
    - Add NFIU submissions section to src/pages/dashboard/UserDashboard.tsx
    - Query individual-nfiu-form and corporate-nfiu-form for current user
    - Display NFIU submissions separately from KYC submissions
    - Use existing SubmissionCard component with formType prop
    - _Requirements: 7.4_

  - [x] 5.7 Add click handlers for NFIU submissions in admin dashboard
    - Navigate to /admin/nfiu/individual when clicking Individual NFIU submission
    - Navigate to /admin/nfiu/corporate when clicking Corporate NFIU submission
    - _Requirements: 7.2, 7.3_

  - [x] 5.8 Write dashboard integration tests
    - Test AdminDashboard displays NFIU section
    - Test formType filter works correctly
    - Test UserDashboard displays NFIU submissions
    - Test navigation from admin tables
    - Test formType column displays correctly
    - _Requirements: 7.1, 7.4, 14.1, 14.2, 14.3_

- [ ] 6. Phase 6: Validation Rules and PDF Generation Updates
  - [ ] 6.1 Update validation rules for NFIU Corporate forms with exact specifications
    - Update src/utils/formValidation.ts
    - **ENSURE MANDATORY validation**: Company's Contact Number, Tax Identification Number, Email Address of the Company, Premium Payment Source
    - **ENSURE MANDATORY validation for Directors**: BVN, Residential Address
    - **ENSURE OPTIONAL validation for Directors**: Tax ID Number
    - **ENSURE MANDATORY validation for Naira Account**: Bank Name, Account Number, Bank Branch, Account Opening Date
    - **ENSURE OPTIONAL validation for Domiciliary Account**: All fields optional
    - **REMOVE validation**: Office Location, Name of Branch Office, Name of Contact Person, Estimated Turnover
    - _Requirements: 9.2, 9.3, 9.4, 2.1_

  - [ ] 6.2 Update validation rules for KYC Corporate forms with exact specifications
    - Update src/utils/formValidation.ts
    - **ENSURE MANDATORY validation**: Name of Contact Person, Company's Contact Number, Contact Person's Email Address, Estimated Turnover
    - **ENSURE OPTIONAL validation**: Tax Identification Number (company level)
    - **ENSURE MANDATORY validation for Directors**: NIN (but NOT BVN, NOT Residential Address, NOT Tax ID)
    - **REMOVE validation**: Premium Payment Source, Account Details section, Office Location, Name of Branch Office
    - **REMOVE validation for Directors**: BVN, Residential Address, Tax ID Number
    - _Requirements: 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 2.1_

  - [ ] 6.3 Create validation schema generator that handles form-type-specific rules
    - Update generateValidationSchema function in src/utils/formValidation.ts
    - Accept formType parameter ('nfiu-corporate' or 'kyc-corporate')
    - Generate different validation schemas based on formType
    - Handle conditional field validation (e.g., Premium Payment Source "Other" requires text input)
    - Return appropriate yup schema for each form type
    - _Requirements: 9.12, 9.13, 2.1_

  - [ ] 6.4 Update NFIU Corporate PDF template with exact field specifications
    - Update PDF generation template for NFIU Corporate forms
    - **INCLUDE in PDF**: Email Address of the Company, Premium Payment Source, Tax ID (mandatory)
    - **INCLUDE in PDF for Directors**: BVN, Residential Address, Tax ID Number (optional)
    - **INCLUDE in PDF**: Account Details section (Naira Account mandatory, Domiciliary Account optional)
    - **EXCLUDE from PDF**: Office Location, Name of Branch Office, Name of Contact Person, Estimated Turnover
    - Ensure proper formatting and labeling
    - _Requirements: 2.1_

  - [ ] 6.5 Update KYC Corporate PDF template with exact field specifications
    - Update PDF generation template for KYC Corporate forms
    - **INCLUDE in PDF**: Name of Contact Person, Contact Person's Email Address, Estimated Turnover, Tax ID (optional)
    - **EXCLUDE from PDF**: Premium Payment Source, Account Details section, Office Location, Name of Branch Office
    - **EXCLUDE from PDF for Directors**: BVN, Residential Address, Tax ID Number
    - Ensure proper formatting and labeling
    - _Requirements: 2.1_

  - [ ] 6.6 Update AutoFill FieldMapper to handle different email field labels
    - Update src/services/autoFill/FieldMapper.ts
    - Add logic to detect form type (NFIU vs KYC)
    - Map CAC email data to "Email Address of the Company" for NFIU Corporate
    - Map CAC email data to "Contact Person's Email Address" for KYC Corporate
    - Skip fields not present in current form type
    - _Requirements: 11.12, 11.13, 2.1_

  - [ ] 6.7 Update AutoFill FieldMapper to skip removed fields
    - Update src/services/autoFill/FieldMapper.ts
    - Add skip logic for Office Location field (both NFIU and KYC)
    - Add skip logic for Name of Branch Office field (both NFIU and KYC)
    - Add skip logic for Name of Contact Person field (NFIU only)
    - Add skip logic for Estimated Turnover field (NFIU only)
    - Add skip logic for Premium Payment Source field (KYC only)
    - Add skip logic for Account Details fields (KYC only)
    - Add skip logic for Director BVN field (KYC only)
    - Add skip logic for Director Residential Address field (KYC only)
    - Add skip logic for Director Tax ID field (KYC only)
    - _Requirements: 11.7, 2.1_

- [ ] 7. Phase 7: Audit Logging Extensions
  - [x] 7.1 Extend auditLogger.cjs with form event functions
    - Add logFormView function to server-utils/auditLogger.cjs
    - Add logFormSubmission function
    - Add logDocumentUpload function
    - Add logAdminAction function
    - Add maskFormData helper function
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.10_

  - [x] 7.2 Create client-side auditService
    - Implement src/services/auditService.ts
    - Create logFormView method
    - Create logFormSubmission method
    - Create logDocumentUpload method
    - Integrate with device detection utilities
    - _Requirements: 16.2, 16.3, 16.4_

  - [x] 7.3 Create device detection utilities
    - Implement src/utils/deviceDetection.ts
    - Create getDeviceInfo function (browser, OS, device type, screen resolution)
    - Create getLocationFromIP function using IP geolocation API
    - Handle errors gracefully
    - _Requirements: 16.7, 16.8_

  - [x] 7.4 Create audit log API endpoints
    - Add POST /api/audit/form-view endpoint in server.js
    - Add POST /api/audit/form-submission endpoint
    - Add POST /api/audit/document-upload endpoint
    - Add POST /api/audit/admin-action endpoint
    - Call corresponding auditLogger functions
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_


  - [x] 7.5 Integrate audit logging into all form components
    - Call auditService.logFormView in IndividualNFIU on mount
    - Call auditService.logFormView in CorporateNFIU on mount
    - Call auditService.logFormView in IndividualKYC on mount
    - Call auditService.logFormView in CorporateKYC on mount
    - Call auditService.logFormSubmission on all form submissions
    - Call auditService.logDocumentUpload on all document uploads
    - _Requirements: 16.2, 16.3, 16.4_

  - [x] 7.6 Add audit logging to admin actions
    - Log admin view events when viewing submissions
    - Log admin edit events when modifying submissions
    - Log admin approve/reject events
    - Include changed fields and masked old/new values
    - _Requirements: 16.5, 16.6, 16.10_

  - [x] 7.7 Update verification-audit-logs schema
    - Add formType field to audit log entries
    - Add formVariant field
    - Add submissionId field
    - Add action field
    - Add deviceInfo object
    - Add location object
    - _Requirements: 16.2, 16.3, 16.4, 16.5, 16.7, 16.8_

  - [x] 7.8 Create audit log query interface
    - Implement audit log query service in src/services/auditLogService.ts
    - Support filtering by userId, formType, dateRange, action, ipAddress
    - Return masked sensitive data
    - Restrict access to super admins only
    - _Requirements: 16.11_

  - [ ]* 7.9 Write audit logging tests
    - Test logFormView captures all required fields
    - Test logFormSubmission captures all required fields
    - Test logDocumentUpload captures all required fields
    - Test logAdminAction captures all required fields
    - Test sensitive data masking
    - Test device info capture
    - Test audit log queries
    - _Requirements: 16.2, 16.3, 16.4, 16.5, 16.7, 16.10, 16.11_

- [ ] 8. Checkpoint - Verify core functionality with field specifications
  - Ensure all tests pass, ask the user if questions arise.
  - Verify NFIU Corporate forms have all required fields (Email Address of the Company, Premium Payment Source, Tax ID, Director BVN, Director Residential Address, Account Details)
  - Verify NFIU Corporate forms do NOT have removed fields (Office Location, Name of Branch Office, Name of Contact Person, Estimated Turnover)
  - Verify KYC Corporate forms have all required fields (Name of Contact Person, Contact Person's Email Address, Estimated Turnover)
  - Verify KYC Corporate forms do NOT have removed fields (Office Location, Name of Branch Office, Premium Payment Source, Account Details, Director BVN, Director Residential Address, Director Tax ID)

- [ ] 9. Phase 8: Data Migration
  - [x] 9.1 Create migration service
    - Implement src/services/migrationService.ts
    - Create migrateExistingRecords function
    - Create createMigrationLog function
    - Create verifyMigration function
    - Use Firestore batch writes for efficiency
    - _Requirements: 8.1, 8.6_

  - [x] 9.2 Implement migration logic for Individual-kyc-form
    - Query all records in Individual-kyc-form collection
    - Add formType: 'legacy' to records without formType
    - Add formVariant: 'individual'
    - Add migratedAt timestamp
    - Preserve all original data
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 9.3 Implement migration logic for corporate-kyc-form
    - Query all records in corporate-kyc-form collection
    - Add formType: 'legacy' to records without formType
    - Add formVariant: 'corporate'
    - Add migratedAt timestamp
    - Preserve all original data
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 9.4 Create migration script
    - Implement scripts/migrate-kyc-data.ts
    - Call migrationService.migrateExistingRecords
    - Create migration log
    - Verify migration integrity
    - Display summary report
    - _Requirements: 8.1, 8.6_

  - [x] 9.5 Create rollback script
    - Implement scripts/rollback-migration.ts
    - Restore original data from originalData field
    - Remove migration metadata
    - Verify rollback integrity
    - _Requirements: 8.5_

  - [x] 9.6 Create migration verification script
    - Implement scripts/verify-migration.ts
    - Count total records
    - Count migrated records
    - Count unmigrated records
    - Report any inconsistencies
    - _Requirements: 8.1, 8.5_

  - [x] 9.7 Test migration on development data
    - Run migration script on development environment
    - Verify all records have formType field
    - Verify no data loss
    - Test rollback script
    - Verify rollback restores original state
    - _Requirements: 8.2, 8.5_


  - [x] 9.8 Update admin dashboards to display legacy records
    - Show legacy records in both KYC and NFIU views
    - Add "legacy" indicator badge
    - Filter legacy records when formType filter is set to "Legacy"
    - _Requirements: 8.4_

  - [x] 9.9 Write migration tests
    - Test migration adds formType to records
    - Test migration preserves all original data
    - Test rollback restores original state
    - Test verification reports accurate counts
    - _Requirements: 8.2, 8.3, 8.5_

- [ ] 10. Phase 9: Firestore Security Rules and Indexes
  - [x] 10.1 Create security rules for individual-nfiu-form collection
    - Add rules to firestore.rules
    - Allow authenticated users to read their own submissions
    - Allow authenticated users to create submissions
    - Allow admins to read all submissions
    - Allow admins to update submissions
    - Validate formType and formVariant on create
    - _Requirements: 10.1, 10.3, 10.4_

  - [x] 10.2 Create security rules for corporate-nfiu-form collection
    - Add rules to firestore.rules
    - Mirror individual-nfiu-form rules
    - Validate formType and formVariant on create
    - _Requirements: 10.2, 10.3, 10.4_

  - [x] 10.3 Update security rules for Individual-kyc-form collection
    - Add formType validation to existing rules
    - Ensure backward compatibility
    - _Requirements: 10.5_

  - [x] 10.4 Update security rules for corporate-kyc-form collection
    - Add formType validation to existing rules
    - Ensure backward compatibility
    - _Requirements: 10.5_

  - [x] 10.5 Create Firestore indexes for NFIU collections
    - Add index for individual-nfiu-form: userId + submittedAt
    - Add index for individual-nfiu-form: status + submittedAt
    - Add index for corporate-nfiu-form: userId + submittedAt
    - Add index for corporate-nfiu-form: status + submittedAt
    - Update firestore.indexes.json
    - _Requirements: 5.1, 5.2_

  - [x] 10.6 Create Firestore indexes for KYC collections with formType
    - Add index for Individual-kyc-form: formType + submittedAt
    - Add index for corporate-kyc-form: formType + submittedAt
    - Update firestore.indexes.json
    - _Requirements: 5.3, 5.4_


  - [x] 10.7 Create Firestore indexes for audit logs
    - Add index for verification-audit-logs: formType + createdAt
    - Add index for verification-audit-logs: userId + eventType + createdAt
    - Update firestore.indexes.json
    - _Requirements: 16.9, 16.11_

  - [x] 10.8 Test Firestore security rules
    - Test unauthenticated users cannot read NFIU data
    - Test unauthenticated users cannot write NFIU data
    - Test users can only read their own submissions
    - Test admins can read all submissions
    - Test formType validation on create
    - _Requirements: 10.3, 10.4_

  - [x] 10.9 Deploy security rules to development
    - Deploy firestore.rules to development environment
    - Verify rules work as expected
    - Test with different user roles
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 10.10 Deploy indexes to development
    - Deploy firestore.indexes.json to development environment
    - Wait for index creation to complete
    - Verify queries work efficiently
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 11. Phase 10: Comprehensive Testing
  - [ ]* 11.1 Write property test for NFIU form required field validation
    - **Property 1: NFIU Form Required Field Validation**
    - **Validates: Requirements 1.6, 9.1, 9.6**
    - Test that NFIU Individual submissions are rejected if any required field is missing
    - Generate random form data with missing required fields
    - Verify specific error messages for missing fields

  - [ ]* 11.2 Write property test for KYC form optional field validation
    - **Property 2: KYC Form Optional Field Validation**
    - **Validates: Requirements 2.5, 2.7, 9.3**
    - Test that KYC Individual submissions succeed without BVN or Tax ID
    - Generate random form data without optional fields
    - Verify submission saves to Individual-kyc-form collection

  - [ ]* 11.3 Write property test for form data collection routing
    - **Property 3: Form Data Collection Routing**
    - **Validates: Requirements 5.5, 5.6, 5.7, 5.8, 13.3, 13.4**
    - Test that submissions are routed to correct collections based on formType
    - Generate random submissions for all 4 form types
    - Verify each submission is in the correct collection

  - [ ]* 11.4 Write property test for submission metadata completeness
    - **Property 4: Submission Metadata Completeness**
    - **Validates: Requirements 13.5**
    - Test that all submissions include required metadata fields
    - Generate random submissions
    - Verify formType, formVariant, submissionDate, userId, formVersion are present

  - [ ]* 11.5 Write property test for field configuration enforcement
    - **Property 5: Field Configuration Enforcement**
    - **Validates: Requirements 6.3**
    - Test that rendered forms match field configuration
    - Verify NFIU forms show BVN and Account Details
    - Verify KYC forms exclude BVN and Account Details

  - [ ]* 11.6 Write property test for multi-step navigation preservation
    - **Property 6: Multi-Step Navigation Preservation**
    - **Validates: Requirements 6.7**
    - Test that navigating forward and backward preserves form data
    - Generate random form data
    - Navigate through all steps and verify data preservation

  - [ ]* 11.7 Write property test for draft saving round-trip
    - **Property 7: Draft Saving Round-Trip**
    - **Validates: Requirements 6.7, 6.8**
    - Test that saved drafts restore all form fields
    - Generate random form data
    - Save draft, reload, and verify all fields match

  - [ ]* 11.8 Write property test for migration data preservation
    - **Property 8: Migration Data Preservation**
    - **Validates: Requirements 8.2, 8.5**
    - Test that migration preserves all original field values
    - Generate random legacy records
    - Run migration and verify no data loss

  - [ ]* 11.9 Write property test for migration metadata addition
    - **Property 9: Migration Metadata Addition**
    - **Validates: Requirements 8.3**
    - Test that migrated records have formType set to "legacy"
    - Generate random legacy records
    - Run migration and verify formType field

  - [ ]* 11.10 Write property test for AutoFill field mapping accuracy
    - **Property 10: AutoFill Field Mapping Accuracy**
    - **Validates: Requirements 11.6, 11.7**
    - Test that autofill only populates fields present in form configuration
    - Generate random NIN/CAC verification responses
    - Verify autofill skips fields not in current form

  - [ ]* 11.11 Write property test for AutoFill trigger consistency
    - **Property 11: AutoFill Trigger Consistency**
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5**
    - Test that valid NIN/CAC triggers autofill
    - Generate random valid NIN/CAC numbers
    - Verify autofill API call and field population

  - [ ]* 11.12 Write property test for security rule authentication enforcement
    - **Property 12: Security Rule Authentication Enforcement**
    - **Validates: Requirements 10.3, 10.4, 10.5**
    - Test that unauthenticated users cannot access NFIU/KYC data
    - Attempt reads and writes without authentication
    - Verify all operations are denied

  - [ ]* 11.13 Write property test for admin table filtering accuracy
    - **Property 13: Admin Table Filtering Accuracy**
    - **Validates: Requirements 14.2, 14.3, 14.4**
    - Test that formType filter shows only matching records
    - Generate random submissions with different formTypes
    - Verify filter results match selected formType

  - [ ]* 11.14 Write property test for existing filter preservation
    - **Property 14: Existing Filter Preservation**
    - **Validates: Requirements 14.5**
    - Test that multiple filters work together correctly
    - Apply date range, status, and formType filters
    - Verify results match all filter criteria

  - [ ]* 11.15 Write property test for authentication flow preservation
    - **Property 15: Authentication Flow Preservation**
    - **Validates: Requirements 13.7, 13.8**
    - Test that unauthenticated users are prompted to authenticate on submit
    - Fill form without authentication
    - Verify authentication prompt and successful submission after auth

  - [ ]* 11.16 Write property test for validation error message specificity
    - **Property 16: Validation Error Message Specificity**
    - **Validates: Requirements 9.5, 13.6**
    - Test that validation errors identify specific fields
    - Generate invalid form data
    - Verify error messages specify which fields failed and why

  - [ ]* 11.17 Write property test for audit log completeness (form views)
    - **Property 17: Audit Log Completeness for Form Views**
    - **Validates: Requirements 16.2**
    - Test that form view logs contain all required fields
    - Generate random form view events
    - Verify userId, userRole, formType, formVariant, ipAddress, deviceInfo, userAgent, timestamp

  - [ ]* 11.18 Write property test for audit log completeness (form submissions)
    - **Property 18: Audit Log Completeness for Form Submissions**
    - **Validates: Requirements 16.3**
    - Test that form submission logs contain all required fields
    - Generate random form submissions
    - Verify userId, userRole, formType, formVariant, submissionId, ipAddress, deviceInfo, userAgent, timestamp, masked formData

  - [ ]* 11.19 Write property test for audit log completeness (document uploads)
    - **Property 19: Audit Log Completeness for Document Uploads**
    - **Validates: Requirements 16.4**
    - Test that document upload logs contain all required fields
    - Generate random document uploads
    - Verify userId, userRole, documentType, fileName, fileSize, ipAddress, deviceInfo, timestamp

  - [ ]* 11.20 Write property test for audit log completeness (admin actions)
    - **Property 20: Audit Log Completeness for Admin Actions**
    - **Validates: Requirements 16.5, 16.6**
    - Test that admin action logs contain all required fields
    - Generate random admin actions
    - Verify adminUserId, adminRole, formType, submissionId, action, ipAddress, deviceInfo, timestamp

  - [ ]* 11.21 Write property test for audit log device information capture
    - **Property 21: Audit Log Device Information Capture**
    - **Validates: Requirements 16.7**
    - Test that deviceInfo contains browser, OS, and deviceType
    - Generate random audit log entries
    - Verify deviceInfo structure and content

  - [ ]* 11.22 Write property test for audit log storage location
    - **Property 22: Audit Log Storage Location**
    - **Validates: Requirements 16.9**
    - Test that all audit logs are stored in verification-audit-logs collection
    - Generate random audit events
    - Verify all logs are in correct collection

  - [ ]* 11.23 Write property test for sensitive data masking in audit logs
    - **Property 23: Sensitive Data Masking in Audit Logs**
    - **Validates: Requirements 16.10**
    - Test that sensitive fields are masked in audit logs
    - Generate random form data with NIN, BVN, account numbers
    - Verify sensitive fields show only first 4 characters

  - [ ]* 11.24 Write property test for audit log query capability
    - **Property 24: Audit Log Query Capability**
    - **Validates: Requirements 16.11**
    - Test that audit log queries filter correctly
    - Generate random audit logs with various attributes
    - Query with different filter combinations and verify results

  - [ ]* 11.25 Write integration test for NFIU Individual submission flow
    - Test complete flow from form load to submission
    - Fill all required fields
    - Upload document
    - Submit form
    - Verify data in individual-nfiu-form collection
    - Verify audit logs created

  - [ ]* 11.26 Write integration test for NFIU Corporate submission flow
    - Test complete flow including directors and account details
    - Fill company information
    - Add directors with BVN
    - Add account details
    - Upload CAC documents
    - Submit form
    - Verify data in corporate-nfiu-form collection

  - [ ]* 11.27 Write integration test for KYC Individual submission flow
    - Test complete flow without BVN field
    - Fill all required fields (excluding BVN)
    - Upload document
    - Submit form
    - Verify data in Individual-kyc-form collection
    - Verify formType is 'kyc'

  - [ ]* 11.28 Write integration test for KYC Corporate submission flow
    - Test complete flow without BVN and Account Details
    - Fill company information
    - Add directors (without BVN)
    - Add Contact Person and Estimated Turnover
    - Upload CAC documents
    - Submit form
    - Verify data in corporate-kyc-form collection

  - [ ]* 11.29 Write integration test for AutoFill in NFIU forms
    - Enter valid NIN in NFIU Individual form
    - Verify autofill populates all matching fields including BVN-related fields
    - Enter valid CAC in NFIU Corporate form
    - Verify autofill populates company fields

  - [ ]* 11.30 Write integration test for AutoFill in KYC forms
    - Enter valid NIN in KYC Individual form
    - Verify autofill populates matching fields
    - Verify autofill does NOT attempt to populate BVN field
    - Enter valid CAC in KYC Corporate form
    - Verify autofill works correctly

  - [ ]* 11.31 Write integration test for admin dashboard filtering
    - Create test submissions of all types (NFIU, KYC, Legacy)
    - Apply "NFIU" filter
    - Verify only NFIU submissions displayed
    - Apply "KYC" filter
    - Verify only KYC submissions displayed
    - Apply "Legacy" filter
    - Verify only Legacy submissions displayed

  - [ ]* 11.32 Write integration test for migration process
    - Create test legacy records
    - Run migration service
    - Verify formType added to all records
    - Verify original data preserved
    - Run rollback
    - Verify original state restored

  - [ ]* 11.33 Write E2E test for complete NFIU Individual user journey
    - Navigate to /nfiu/individual
    - Fill form with valid data
    - Trigger NIN autofill
    - Upload identification document
    - Submit form
    - Verify success message
    - Check UserDashboard shows submission
    - Verify admin can see submission

  - [ ]* 11.34 Write E2E test for complete KYC Individual user journey
    - Navigate to /kyc/individual
    - Fill form without BVN field
    - Trigger NIN autofill
    - Upload identification document
    - Submit form
    - Verify success message
    - Check UserDashboard shows submission

  - [ ]* 11.35 Perform manual QA testing
    - Test all navigation paths
    - Test all form submissions
    - Test autofill functionality
    - Test document uploads
    - Test admin dashboards
    - Test filtering and searching
    - Test on different browsers
    - Test on mobile devices
    - Document any issues found

  - [ ]* 11.36 Perform accessibility testing
    - Test keyboard navigation on all forms
    - Test screen reader compatibility
    - Verify ARIA labels are present
    - Check color contrast ratios
    - Test focus indicators
    - Verify error announcements
    - Document accessibility compliance

  - [ ]* 11.37 Perform performance testing
    - Measure form rendering time
    - Measure form submission time
    - Measure autofill response time
    - Measure admin dashboard load time
    - Measure migration script execution time
    - Verify all metrics meet requirements
    - Document performance results

- [ ] 12. Checkpoint - Verify all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Phase 11: Documentation and Deployment
  - [ ] 13.1 Update user documentation
    - Document NFIU vs KYC differences
    - Create user guide for NFIU Individual form
    - Create user guide for NFIU Corporate form
    - Update existing KYC form guides
    - Add screenshots and examples
    - _Requirements: 15.1, 15.2_

  - [ ] 13.2 Update admin documentation
    - Document new admin dashboard features
    - Document formType filtering
    - Document audit log querying
    - Create troubleshooting guide
    - _Requirements: 14.1, 16.11_

  - [ ] 13.3 Create migration guide
    - Document migration process
    - Document rollback procedure
    - Create pre-migration checklist
    - Create post-migration verification steps
    - Document troubleshooting steps
    - _Requirements: 8.1, 8.5, 8.6_

  - [ ] 13.4 Create deployment checklist
    - List all deployment steps
    - Include security rules deployment
    - Include index deployment
    - Include migration execution
    - Include verification steps
    - Include rollback triggers

  - [ ] 13.5 Deploy to staging environment
    - Deploy frontend code
    - Deploy backend code
    - Deploy security rules
    - Deploy indexes
    - Run migration script
    - Verify all functionality

  - [ ] 13.6 Perform staging verification
    - Test all form submissions
    - Test autofill functionality
    - Test admin dashboards
    - Test audit logging
    - Verify migration completed successfully
    - Check for any errors or issues

  - [ ] 13.7 Create production deployment plan
    - Schedule deployment window
    - Notify stakeholders
    - Prepare rollback plan
    - Assign deployment roles
    - Create communication plan

  - [ ] 13.8 Execute production deployment
    - Deploy frontend code
    - Deploy backend code
    - Deploy security rules
    - Deploy indexes
    - Run migration script
    - Monitor for errors

  - [ ] 13.9 Perform production verification
    - Test NFIU Individual form submission
    - Test NFIU Corporate form submission
    - Test KYC Individual form submission
    - Test KYC Corporate form submission
    - Verify admin dashboards work
    - Verify audit logs are being created
    - Check migration completed successfully

  - [ ] 13.10 Monitor production for 48 hours
    - Monitor error logs
    - Monitor form submission success rates
    - Monitor autofill success rates
    - Monitor performance metrics
    - Address any issues immediately
    - Document any incidents

  - [ ] 13.11 Create completion report
    - Document all completed tasks
    - Report code reduction achieved
    - Report test coverage achieved
    - Document any deviations from plan
    - List lessons learned
    - Provide recommendations for future improvements

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation preserves all existing functionality while modernizing the architecture
- Code reduction target: 30%+ through component reusability
- Timeline: 8 weeks across 13 phases (updated to reflect new validation and PDF generation tasks)

## Implementation Timeline

- **Week 1**: Phase 1 (Foundation - Field Configurations)
- **Week 2**: Phase 2 (NFIU Forms with Field Updates)
- **Week 3**: Phase 3 (KYC Refactoring with Field Updates)
- **Week 4**: Phase 4 (Navigation) + Phase 5 (Dashboards with Field-Specific Display)
- **Week 5**: Phase 6 (Validation Rules and PDF Generation) + Phase 7 (Audit Logging)
- **Week 6**: Phase 8 (Data Migration) + Phase 9 (Security Rules)
- **Week 7**: Phase 10 (Firestore) + Phase 11 (Comprehensive Testing)
- **Week 8**: Phase 12 (Final Testing) + Phase 13 (Documentation and Deployment)

## Success Criteria

- All 4 form types (NFIU Individual, NFIU Corporate, KYC Individual, KYC Corporate) are accessible
- **NFIU Corporate forms include**: Email Address of the Company (mandatory), Premium Payment Source (mandatory), Tax ID (mandatory), Director BVN (mandatory), Director Residential Address (mandatory), Director Tax ID (optional), Account Details section
- **NFIU Corporate forms exclude**: Office Location, Name of Branch Office, Name of Contact Person, Estimated Turnover
- **KYC Corporate forms include**: Name of Contact Person (mandatory), Contact Person's Email Address (mandatory), Estimated Turnover (mandatory), Tax ID (optional)
- **KYC Corporate forms exclude**: Office Location, Name of Branch Office, Premium Payment Source, Account Details section, Director BVN, Director Residential Address, Director Tax ID
- All existing functionality is preserved
- AutoFill works for all form types with correct field mapping
- Document uploads work for all form types
- Audit logging captures all required events
- Migration completes without data loss
- Code reduction of at least 30% achieved
- All tests pass with >80% coverage
- Forms work on mobile devices
- Forms are accessible to screen reader users
- PDF generation includes correct fields for each form type
- Admin dashboards display correct fields for each form type
