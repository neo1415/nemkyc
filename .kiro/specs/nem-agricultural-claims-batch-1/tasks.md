# Implementation Tasks

## Phase 1: Core Form Components

### Task 1: Create Farm Property and Produce Claim Form

- [x] 1.1 Create FarmPropertyProduceClaim.tsx component
- [x] 1.2 Define TypeScript interfaces for form data
- [x] 1.3 Create yup validation schema
- [x] 1.4 Implement Section 1: Policy & Insured Details
- [x] 1.5 Implement Section 2: Cause of Loss with conditional field
- [x] 1.6 Implement Section 3: Property Lost or Damaged with array field
- [x] 1.7 Implement Section 4: Declaration & Signature
- [x] 1.8 Integrate useEnhancedFormSubmit hook
- [x] 1.9 Implement renderSummary function
- [x] 1.10 Add auto-save draft functionality
- [x] 1.11 Configure step field mappings for validation
- [x] 1.12 Add file upload fields (signature, receipts)
- [x] 1.13 Test form validation
- [x] 1.14 Test conditional field visibility
- [x] 1.15 Test array field add/remove operations

### Task 2: Create Livestock Claim Form

- [x] 2.1 Create LivestockClaim.tsx component
- [x] 2.2 Define TypeScript interfaces for form data
- [x] 2.3 Create yup validation schema
- [x] 2.4 Implement Section 1: Policy & Insured Details
- [x] 2.5 Implement Section 2: Cause of Loss with conditional fields
- [x] 2.6 Implement Section 3: Claim Details
- [x] 2.7 Implement Section 4: Declaration & Signature
- [x] 2.8 Integrate useEnhancedFormSubmit hook
- [x] 2.9 Implement renderSummary function
- [x] 2.10 Add auto-save draft functionality
- [x] 2.11 Configure step field mappings for validation
- [x] 2.12 Add file upload fields (signature, reports, records)
- [x] 2.13 Test form validation
- [x] 2.14 Test conditional field visibility
- [x] 2.15 Test multiple file uploads

## Phase 2: Admin Tables

### Task 3: Create Farm Property and Produce Admin Table

- [x] 3.1 Create AdminFarmPropertyProduceClaimsTable.tsx component
- [x] 3.2 Define table columns (Ticket ID, Policy Number, Insured Name, Date of Loss, Status, Submitted At)
- [x] 3.3 Implement data fetching from Firestore
- [x] 3.4 Add status filter dropdown
- [x] 3.5 Add search functionality (ticket ID, policy number)
- [x] 3.6 Implement row click to open form viewer
- [x] 3.7 Add status update functionality
- [x] 3.8 Implement loading state
- [x] 3.9 Implement error handling
- [x] 3.10 Add pagination (50 per page)
- [x] 3.11 Test table rendering
- [x] 3.12 Test filtering and search
- [x] 3.13 Test status updates

### Task 4: Create Livestock Admin Table

- [x] 4.1 Create AdminLivestockClaimsTable.tsx component
- [x] 4.2 Define table columns (Ticket ID, Policy Number, Insured Name, Date of Loss, Status, Submitted At)
- [x] 4.3 Implement data fetching from Firestore
- [x] 4.4 Add status filter dropdown
- [x] 4.5 Add search functionality (ticket ID, policy number)
- [x] 4.6 Implement row click to open form viewer
- [x] 4.7 Add status update functionality
- [x] 4.8 Implement loading state
- [x] 4.9 Implement error handling
- [x] 4.10 Add pagination (50 per page)
- [x] 4.11 Test table rendering
- [x] 4.12 Test filtering and search
- [x] 4.13 Test status updates

## Phase 3: Form Viewers

### Task 5: Create Farm Property and Produce Form Viewer

- [x] 5.1 Create FarmPropertyProduceFormViewer.tsx component
- [x] 5.2 Implement Section 1: Policy & Insured Details display
- [x] 5.3 Implement Section 2: Cause of Loss display with conditional fields
- [x] 5.4 Implement Section 3: Property Lost or Damaged array display
- [x] 5.5 Implement Section 4: Declaration & Signature display
- [x] 5.6 Add file download links
- [x] 5.7 Format dates as dd/MM/yyyy
- [x] 5.8 Add styling and layout
- [x] 5.9 Test data display completeness
- [x] 5.10 Test conditional field rendering
- [x] 5.11 Test file download functionality

### Task 6: Create Livestock Form Viewer

- [x] 6.1 Create LivestockFormViewer.tsx component
- [x] 6.2 Implement Section 1: Policy & Insured Details display
- [x] 6.3 Implement Section 2: Cause of Loss display with conditional fields
- [x] 6.4 Implement Section 3: Claim Details display
- [x] 6.5 Implement Section 4: Declaration & Signature display
- [x] 6.6 Add file download links
- [x] 6.7 Format dates as dd/MM/yyyy
- [x] 6.8 Add styling and layout
- [x] 6.9 Test data display completeness
- [x] 6.10 Test conditional field rendering
- [x] 6.11 Test file download functionality

## Phase 4: PDF Generators

### Task 7: Create Farm Property and Produce PDF Generator

- [ ] 7.1 Create FarmPropertyProducePDFGenerator.tsx component
- [ ] 7.2 Add NEM Insurance branding/header
- [ ] 7.3 Implement Section 1: Policy & Insured Details in PDF
- [ ] 7.4 Implement Section 2: Cause of Loss in PDF
- [ ] 7.5 Implement Section 3: Property Lost or Damaged table in PDF
- [ ] 7.6 Implement Section 4: Declaration & Signature in PDF
- [ ] 7.7 Add footer with submission details
- [ ] 7.8 Format dates consistently
- [ ] 7.9 Test PDF generation
- [ ] 7.10 Test PDF layout and formatting

### Task 8: Create Livestock PDF Generator

- [ ] 8.1 Create LivestockPDFGenerator.tsx component
- [ ] 8.2 Add NEM Insurance branding/header
- [ ] 8.3 Implement Section 1: Policy & Insured Details in PDF
- [ ] 8.4 Implement Section 2: Cause of Loss in PDF
- [ ] 8.5 Implement Section 3: Claim Details table in PDF
- [ ] 8.6 Implement Section 4: Declaration & Signature in PDF
- [ ] 8.7 Add footer with submission details
- [ ] 8.8 Format dates consistently
- [ ] 8.9 Test PDF generation
- [ ] 8.10 Test PDF layout and formatting

## Phase 5: Configuration and Integration

### Task 9: Update Form Mappings

- [x] 9.1 Add farm-property-produce-claims mapping to formMappings.ts
- [x] 9.2 Define all FPP form fields with correct types
- [x] 9.3 Mark conditional fields with dependencies
- [x] 9.4 Specify editable fields
- [x] 9.5 Add livestock-claims mapping to formMappings.ts
- [x] 9.6 Define all LIV form fields with correct types
- [x] 9.7 Mark conditional fields with dependencies
- [x] 9.8 Specify editable fields
- [x] 9.9 Test form mapping configuration

### Task 10: Update Navigation and Routing

- [x] 10.1 Add FPP route to App.tsx
- [x] 10.2 Add LIV route to App.tsx
- [x] 10.3 Add FPP admin table route to App.tsx
- [x] 10.4 Add LIV admin table route to App.tsx
- [x] 10.5 Add FPP navigation item to Navbar.tsx
- [x] 10.6 Add LIV navigation item to Navbar.tsx
- [x] 10.7 Add FPP sidebar item to AdminDashboard.tsx
- [x] 10.8 Add LIV sidebar item to AdminDashboard.tsx
- [x] 10.9 Update useAuthRequiredSubmit with form page URLs
- [x] 10.10 Test navigation flow
- [x] 10.11 Test route accessibility

## Phase 6: Testing

### Task 11: Unit Tests

- [ ] 11.1 Write tests for FPP validation schema
- [ ] 11.2 Write tests for LIV validation schema
- [ ] 11.3 Write tests for FPP conditional field logic
- [ ] 11.4 Write tests for LIV conditional field logic
- [ ] 11.5 Write tests for FPP array field operations
- [ ] 11.6 Write tests for file upload validation
- [ ] 11.7 Write tests for ticket ID generation
- [ ] 11.8 Write tests for form data normalization

### Task 12: Integration Tests

- [ ] 12.1 Write test for FPP form submission flow
- [ ] 12.2 Write test for LIV form submission flow
- [ ] 12.3 Write test for FPP admin table data fetching
- [ ] 12.4 Write test for LIV admin table data fetching
- [ ] 12.5 Write test for FPP form viewer display
- [ ] 12.6 Write test for LIV form viewer display
- [ ] 12.7 Write test for FPP PDF generation
- [ ] 12.8 Write test for LIV PDF generation
- [ ] 12.9 Write test for file upload and download
- [ ] 12.10 Write test for status updates

### Task 13: Property-Based Tests

- [ ] 13.1 Write round-trip property test for FPP form data
- [ ] 13.2 Write round-trip property test for LIV form data
- [ ] 13.3 Write conditional field visibility property test
- [ ] 13.4 Write array field operations property test
- [ ] 13.5 Write validation consistency property test
- [ ] 13.6 Write file upload idempotence property test

### Task 14: End-to-End Tests

- [ ] 14.1 Write E2E test for complete FPP submission
- [ ] 14.2 Write E2E test for complete LIV submission
- [ ] 14.3 Write E2E test for admin workflow (FPP)
- [ ] 14.4 Write E2E test for admin workflow (LIV)
- [ ] 14.5 Write E2E test for file upload scenarios
- [ ] 14.6 Write E2E test for error scenarios
- [ ] 14.7 Write E2E test for draft save/restore

## Phase 7: Documentation and Deployment

### Task 15: Documentation

- [ ] 15.1 Document FPP form field definitions
- [ ] 15.2 Document LIV form field definitions
- [ ] 15.3 Document file upload requirements
- [ ] 15.4 Document admin table usage
- [ ] 15.5 Document PDF generation process
- [ ] 15.6 Update API documentation
- [ ] 15.7 Create user guide for forms
- [ ] 15.8 Create admin guide for claim management

### Task 16: Security and Performance

- [ ] 16.1 Update Firestore security rules for new collections
- [ ] 16.2 Update Storage security rules for file uploads
- [ ] 16.3 Test authentication requirements
- [ ] 16.4 Test authorization for admin access
- [ ] 16.5 Optimize form bundle size
- [ ] 16.6 Optimize admin table queries
- [ ] 16.7 Add performance monitoring
- [ ] 16.8 Run accessibility audit
- [ ] 16.9 Run security audit

### Task 17: Deployment

- [ ] 17.1 Review all code changes
- [ ] 17.2 Run full test suite
- [ ] 17.3 Test in staging environment
- [ ] 17.4 Verify file upload paths
- [ ] 17.5 Verify ticket ID generation
- [ ] 17.6 Test form submission end-to-end
- [ ] 17.7 Test admin workflows
- [ ] 17.8 Deploy to production
- [ ] 17.9 Monitor for errors
- [ ] 17.10 Verify production functionality
