# PDF Uniformity Fix - KYC/CDD Forms

## Objective
Standardize all KYC and CDD form viewer PDFs to have the same professional format with NEM Insurance branding.

## Standard PDF Format (Based on Corporate KYC)

### Header Elements
1. **NEM INSURANCE PLC** (20pt, Burgundy #800020)
2. **Corporate Head Office** address
3. **Lagos Head Office** address
4. **Burgundy horizontal line** separator
5. **Form Title** (16pt)
6. **Form content** with proper pagination

### Technical Implementation
- Uses `html2canvas` to capture form content
- Uses `jsPDF` to generate PDF with custom header
- Automatic page splitting for long forms
- Consistent burgundy (#800020) branding
- Professional layout with proper spacing

## Status of All KYC/CDD Viewers

### ✅ Already Using Standard Format
1. **CorporateKYCViewer.tsx** - ✅ Standard (reference implementation)
2. **IndividualKYCViewer.tsx** - ✅ Standard
3. **IndividualCDDViewer.tsx** - ✅ Standard
4. **CorporateCDDViewer.tsx** - ✅ Standard
5. **PartnersCDDViewer.tsx** - ✅ Standard
6. **AgentsCDDViewer.tsx** - ✅ Standard

### ✅ Updated to Standard Format
7. **BrokersCDDViewer.tsx** - ✅ NOW STANDARD (was using old pdfService)

## Changes Made to BrokersCDDViewer

### Before
- Used old `pdfService` with `generateFormPDF` and `downloadPDF`
- Different header format
- Required logo image import
- Less consistent branding

### After
- Uses `html2canvas` and `jsPDF` (same as all others)
- Standard NEM Insurance header with addresses
- Burgundy branding consistent with other forms
- Automatic page splitting for long content
- PDF filename: `Brokers_CDD_{companyName}.pdf`

### Code Changes
```typescript
// OLD imports
import { generateFormPDF, downloadPDF } from '@/services/pdfService';
import logoImage from '../../assets/NEMs-Logo.jpg';

// NEW imports
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
```

### PDF Generation
- Added `id="brokers-cdd-pdf-content"` wrapper around form content
- Implemented standard `generatePDF` function with NEM header
- Matches Corporate KYC implementation exactly

## Benefits of Uniformity

1. **Professional Appearance** - All forms have consistent branding
2. **User Experience** - Users see the same format across all forms
3. **Maintainability** - Single pattern to maintain
4. **Quality** - html2canvas produces better quality than old service
5. **Flexibility** - Easy to update branding across all forms

## PDF Features (All Forms)

- ✅ NEM Insurance PLC header
- ✅ Corporate and Lagos office addresses
- ✅ Burgundy branding (#800020)
- ✅ Automatic page splitting
- ✅ High quality (scale: 2)
- ✅ Proper filename with form type and identifier
- ✅ Loading state during generation
- ✅ Error handling

## Testing Checklist

For each form viewer:
1. ✅ Open form viewer
2. ✅ Click "Download PDF" button
3. ✅ Verify PDF has NEM Insurance header
4. ✅ Verify burgundy branding
5. ✅ Verify office addresses present
6. ✅ Verify form content is complete
7. ✅ Verify multi-page forms split correctly
8. ✅ Verify filename is descriptive

## Forms Verified

- ✅ Corporate KYC
- ✅ Individual KYC
- ✅ Individual CDD
- ✅ Corporate CDD
- ✅ Partners CDD
- ✅ Agents CDD
- ✅ **Brokers CDD** (newly updated)

## No Breaking Changes

- All existing functionality preserved
- PDF generation still works the same from user perspective
- Only internal implementation changed for Brokers
- All other forms unchanged (already using standard format)
