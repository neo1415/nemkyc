# Form Viewer Implementation Guide

This document serves as a comprehensive guide for implementing form viewers and PDF generation across all form types, based on the Corporate CDD implementation.

## Overview

The form viewer system handles displaying submitted form data in a clean, organized format and generating professional PDFs. It must accommodate both legacy data structures and new data structures due to ongoing refactoring.

## Core Requirements

### Data Structure Handling
- **Legacy vs New Data**: Forms have undergone structural changes, particularly for directors/partners data
- **Legacy Format**: Directors stored as flat fields (firstName, firstName2, lastName, lastName2, etc.)
- **New Format**: Directors stored as array of objects in `directors` field
- **Must support both formats seamlessly**

### Form Type Detection
- **NAICOM Forms**: Detected by presence of uploaded license certificate (naicomLicenseCertificate field not empty)
- **Regular Forms**: When license certificate field is empty or missing
- **Display appropriate headers and sections based on form type**

### Empty Field Handling
- **Text/Select Fields**: Display \"N/A\" for empty or missing values
- **File Fields**: Display \"Document not uploaded\" for missing files
- **Date Fields**: Display \"N/A\" for empty dates
- **Never show empty strings or undefined values**

## Implementation DOs

### ✅ Data Processing
1. **Create helper functions for data extraction**
   ```typescript
   const extractDirectorsData = (data: any) => {
     // Handle both legacy and new formats
     if (data.directors && Array.isArray(data.directors)) {
       return data.directors; // New format
     }
     // Extract legacy format
     const directors = [];
     if (data.firstName) {
       directors.push({
         firstName: data.firstName || '',
         lastName: data.lastName || '',
         // ... other fields
       });
     }
     return directors;
   };
   ```

2. **Implement form type detection**
   ```typescript
   const isNaicomForm = (data: any) => {
     return data.naicomLicenseCertificate && data.naicomLicenseCertificate.trim() !== '';
   };
   ```

3. **Create value formatting function**
   ```typescript
   const formatValue = (value: any, isFile: boolean = false) => {
     if (!value || value === '') {
       return isFile ? 'Document not uploaded' : 'N/A';
     }
     return value;
   };
   ```

### ✅ UI Structure
1. **Remove unnecessary system fields from display**
   - formId
   - status/completed tags
   - updatedAt/createdAt in main view
   - declaration fields
   - dataPrivacyAgreement fields

2. **Organize data into logical sections**
   - Company Information
   - Directors Information (numbered, not grouped)
   - Banking Information
   - Document Uploads
   - System Information (at bottom)

3. **Use consistent styling**
   - Clean card-based layout
   - Proper spacing and typography
   - File links with download functionality
   - Professional appearance

### ✅ PDF Generation
1. **Professional branding**
   - NEM Insurance company name and address
   - Professional layout with proper spacing
   - Burgundy (#800020) lines/borders
   - White background

2. **Structured content**
   - Mirror the viewer layout exactly
   - Same sections and organization
   - Same field formatting
   - Same empty value handling

3. **Technical implementation**
   - Use jsPDF and html2canvas
   - Proper page breaks
   - Consistent fonts and sizing
   - High-quality rendering

## Implementation DON'Ts

### ❌ Data Handling
1. **Don't assume data structure**
   - Never assume fields exist without checking
   - Don't hardcode field names for legacy vs new formats
   - Don't ignore empty field handling

2. **Don't mix data processing with UI**
   - Keep data extraction in separate functions
   - Don't inline complex data transformations in JSX

### ❌ UI/UX
1. **Don't group directors into sub-sections**
   - No \"Personal Information\", \"Contact Information\" groupings
   - Just use \"Director 1\", \"Director 2\", etc.

2. **Don't include irrelevant fields**
   - Remove title/gender for directors (form-specific)
   - Remove system-only fields from user view
   - Don't show internal tracking fields

3. **Don't show raw empty values**
   - Never display empty strings
   - Never show \"undefined\" or \"null\"
   - Always format empty values appropriately

### ❌ PDF Generation
1. **Don't create different layouts**
   - PDF must match viewer layout exactly
   - Don't rearrange or reorganize content
   - Don't change field formatting

2. **Don't ignore branding**
   - Always include NEM Insurance branding
   - Use consistent colors (burgundy for lines)
   - Maintain professional appearance

## Step-by-Step Implementation Process

### Phase 1: Data Analysis
1. Examine the form's data structure
2. Identify legacy vs new format differences
3. Determine special form type detection logic
4. List all fields that should be displayed

### Phase 2: Viewer Implementation
1. Create data extraction helper functions
2. Implement form type detection
3. Build UI sections with proper formatting
4. Handle file downloads and empty values
5. Remove unnecessary system fields

### Phase 3: PDF Generation
1. Create PDF generation function
2. Mirror viewer layout exactly
3. Add professional branding
4. Implement proper styling (burgundy lines, white background)
5. Test with various data scenarios

### Phase 4: Testing
1. Test with legacy data format
2. Test with new data format
3. Test with empty/missing fields
4. Test PDF generation quality
5. Verify all form type variations

## Form-Specific Considerations

### Directors/Partners Fields
- **Corporate CDD**: Directors array vs flat fields
- **Partners CDD**: Partners array vs flat fields
- **Handle field name variations** (firstName vs fname, etc.)

### Document Fields
- **Always check if file URL exists**
- **Provide download links for valid files**
- **Show appropriate \"not uploaded\" message**

### Form Type Detection
- **NAICOM**: Based on license certificate upload
- **Individual vs Corporate**: Based on form structure
- **Claims vs KYC vs CDD**: Based on form type field

## Error Prevention

1. **Always check data existence before accessing**
2. **Use optional chaining and nullish coalescing**
3. **Provide fallback values for all displays**
4. **Test with minimal/empty datasets**
5. **Validate PDF generation doesn't break with missing data**

## Code Reusability

1. **Create shared utilities for common operations**
2. **Use consistent naming conventions across forms**
3. **Implement generic helper functions where possible**
4. **Maintain consistent UI patterns**

This guide ensures consistent, professional form viewers across all form types while handling data structure evolution and providing excellent user experience.
