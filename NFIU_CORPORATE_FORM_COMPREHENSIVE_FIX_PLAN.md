# NFIU Corporate Form - Comprehensive Fix Plan

## Issues Identified

### 1. **Director Field Validation Not Working**
- **Problem**: Mandatory fields in directors section not validating when clicking "Next"
- **Root Cause**: The validation schema generator (`generateValidationSchema`) doesn't handle nested arrays (directors)
- **Fix Required**: Add proper yup validation for directors array with all required fields

### 2. **Phone Number & Account Number Validation Missing**
- **Problem**: No validation for:
  - Phone numbers (should be digits only, max 15 characters)
  - Account numbers (should be digits only, exactly 10 digits for local, max 30 for foreign)
  - BVN (should be digits only, exactly 11 digits)
  - NIN (should be digits only, exactly 11 digits)
  - Tax ID (should be digits only, max 10 digits)
- **Fix Required**: Add proper regex validation and length constraints

### 3. **Error Messages Not Showing Under Fields**
- **Problem**: Validation errors not displaying below form fields
- **Root Cause**: Using generic FormRenderer instead of custom form components with proper error handling
- **Fix Required**: Use custom FormField components with lodash.get() for nested error paths

### 4. **File Upload UI Not Styled Properly**
- **Problem**: File upload section not matching Corporate CDD/KYC styling
- **Current**: Generic FileUpload component without proper layout
- **Expected**: Styled upload section with:
  - Clear labels with asterisks for required fields
  - File preview with checkmark when uploaded
  - Proper spacing and alignment
  - Error messages below upload area
- **Fix Required**: Match the file upload UI from Corporate CDD (lines 948-988)

### 5. **Declaration, Privacy Policy & Signature Section Missing**
- **Problem**: The declaration step was completely removed
- **Expected**: Should have a complete declaration step with:
  - Data Privacy section (3 points about data usage, NDPR compliance, third-party sharing)
  - Declaration section (3 points about truthfulness, additional info, document submission)
  - Checkbox for agreement (required)
  - Digital signature field (required, text input for full name)
- **Fix Required**: Add complete declaration step matching Corporate CDD (lines 1020-1078)

### 6. **Firebase Storage Permission Error**
- **Problem**: 403 Forbidden error when uploading to `corporate-nfiu/` path
- **Root Cause**: storage.rules doesn't have rules for corporate-nfiu or individual-nfiu paths
- **Fix Applied**: ✅ Added storage rules for both paths

## Detailed Fix Implementation

### Fix 1: Proper Validation Schema

Replace the auto-generated schema with a comprehensive yup schema:

```typescript
const corporateNFIUSchema = yup.object().shape({
  // Company Info
  insured: yup.string()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  officeAddress: yup.string()
    .required("Office address is required")
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address cannot exceed 500 characters"),
  ownershipOfCompany: yup.string(),
  website: yup.string()
    .url("Please enter a valid website URL"),
  incorporationNumber: yup.string()
    .required("Incorporation number is required")
    .matches(/^[A-Za-z0-9]+$/, "Incorporation number must contain only letters and numbers"),
  incorporationState: yup.string()
    .required("Incorporation state is required"),
  dateOfIncorporationRegistration: yup.date()
    .required("Date of incorporation is required")
    .test('not-future', 'Date