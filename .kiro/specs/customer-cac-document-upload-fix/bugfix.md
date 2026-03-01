# Bugfix Requirements Document

## Introduction

The customer CAC verification page is incomplete and non-functional. When customers receive a CAC verification link via email and access the verification page, they can only enter their CAC registration number but have no way to upload the three required CAC documents mandated by NAICOM and CAMA 2020 regulations:

1. Certificate of Incorporation
2. Particulars of Directors
3. Share Allotment (Status Update)

This bug prevents customers from completing the CAC verification process, blocking regulatory compliance. The root cause is that a previous spec (`.kiro/specs/cac-document-upload-management/`) was incorrectly designed for admin uploads in the dashboard, when the actual requirement is for customers to upload their own documents during the verification process.

**Impact**: Customers cannot complete CAC verification, preventing policy issuance and regulatory compliance.

**Affected Component**: Customer verification page (`src/pages/public/CustomerVerificationPage.tsx`)

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a customer receives a CAC verification link and accesses the verification page THEN the system displays only a CAC number input field without any document upload fields

1.2 WHEN a customer attempts to complete CAC verification THEN the system cannot accept the three required CAC documents (Certificate of Incorporation, Particulars of Directors, Share Allotment)

1.3 WHEN a customer clicks the "Verify CAC" button without document uploads THEN the system submits only the CAC number without the mandatory supporting documents

1.4 WHEN the backend receives a CAC verification request THEN the system has no endpoint to handle customer document uploads with encryption and validation

### Expected Behavior (Correct)

2.1 WHEN a customer receives a CAC verification link and accesses the verification page THEN the system SHALL display three document upload fields for Certificate of Incorporation, Particulars of Directors, and Share Allotment (Status Update)

2.2 WHEN a customer selects a document file THEN the system SHALL validate the file type (PDF, JPEG, PNG only) and file size (max 10MB per file) before allowing upload

2.3 WHEN a customer uploads all three required documents and enters their CAC registration number THEN the system SHALL encrypt each document with AES-256-GCM before transmission to the backend

2.4 WHEN the backend receives customer document uploads THEN the system SHALL store encrypted documents in Firebase Storage with proper customer-scoped permissions and create audit trail entries

2.5 WHEN a customer clicks "Verify CAC" with all documents uploaded THEN the system SHALL submit the CAC number to VerifyData API for verification AND associate the uploaded documents with the verification record

2.6 WHEN document upload fails due to validation errors THEN the system SHALL display clear error messages indicating the specific issue (file type, file size, missing documents)

2.7 WHEN the verification token is expired or invalid THEN the system SHALL prevent document uploads and display an appropriate error message

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer accesses the verification page with a valid token THEN the system SHALL CONTINUE TO display company information (name, registration date, policy number) as currently implemented

3.2 WHEN a customer enters a CAC registration number THEN the system SHALL CONTINUE TO validate the format and call the VerifyData API as currently implemented

3.3 WHEN the VerifyData API returns CAC verification results THEN the system SHALL CONTINUE TO process and store the verification data as currently implemented

3.4 WHEN admin users access the CAC document management features in the dashboard THEN the system SHALL CONTINUE TO function with existing admin document upload capabilities (from previous spec)

3.5 WHEN documents are stored in Firebase Storage THEN the system SHALL CONTINUE TO use the existing encryption utilities (`server-utils/encryption.cjs`) for AES-256-GCM encryption

3.6 WHEN verification audit logs are created THEN the system SHALL CONTINUE TO use the existing audit logging infrastructure

3.7 WHEN Firebase Storage rules evaluate access requests THEN the system SHALL CONTINUE TO enforce existing security rules for admin uploads while adding new rules for customer uploads
