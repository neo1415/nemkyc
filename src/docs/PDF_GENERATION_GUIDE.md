# PDF Generation System Documentation

## Overview

The NEM Insurance PDF generation system provides a dynamic, professional PDF generator that can convert any form submission into a properly formatted, printable document. The system is designed to be flexible, maintainable, and easy to extend for new form types.

## Architecture

### Core Components

1. **DynamicPDFGenerator** (`src/components/pdf/DynamicPDFGenerator.tsx`)
   - Main PDF generation class
   - Handles layout, formatting, and content organization
   - Uses jsPDF library for PDF creation

2. **PDF Blueprints** (`src/config/pdfBlueprints.ts`)
   - Mapping configurations for different form types
   - Defines field organization, labels, and special handling rules
   - Easy to extend for new form types

3. **Dynamic PDF Service** (`src/services/dynamicPdfService.ts`)
   - Service layer for PDF operations
   - Provides download, preview, and generation functions
   - Integrates with existing app infrastructure

## How It Works

### 1. Form Type Detection

The system automatically detects form types using multiple strategies:

```typescript
// Priority order for detection:
1. Explicit formType field in submission data
2. Collection name from database
3. Heuristic detection based on field presence
4. Fallback to generic form handling
```

### 2. Blueprint Selection

Based on the detected form type, the system selects an appropriate blueprint:

- **Money Insurance Claims**: Specialized layout for money insurance forms
- **Rent Assurance Claims**: Includes special declaration text and formatting
- **Generic Forms**: Fallback blueprint for unknown form types

### 3. Dynamic Field Mapping

The system maps form fields to appropriate sections and applies formatting rules:

```typescript
// Field types supported:
- text: Regular text fields
- textarea: Multi-line text with proper wrapping
- date: Formatted as DD/MM/YYYY
- currency: Formatted with ₦ symbol and thousands separators
- boolean: Rendered as checked/unchecked boxes
- array: Tables or lists depending on content
- object: Nested field display
```

### 4. PDF Layout Generation

The PDF follows a standardized layout:

1. **Header**: Company logo and letterhead information
2. **Title**: Form name in uppercase
3. **Policy Meta**: Policy number and coverage period
4. **Form Content**: Organized sections with proper formatting
5. **Footer Blocks**: Important notices, claims procedures, data privacy
6. **Declaration**: Signature block and legal declarations

## Adding New Form Types

### Step 1: Create Blueprint

Add a new blueprint to `src/config/pdfBlueprints.ts`:

```typescript
export const PDF_BLUEPRINTS: Record<string, PDFBlueprint> = {
  // ... existing blueprints
  
  'new-form-type': {
    title: 'New Form Type Title',
    sections: [
      {
        title: 'Section Name',
        fields: [
          { key: 'fieldKey', label: 'Field Label', type: 'text', section: 'Section Name' },
          // ... more fields
        ]
      }
    ],
    specialHandling: {
      rentAssuranceNote: false, // Set to true if special rent note needed
      directorHandling: false   // Set to true if director array handling needed
    }
  }
};
```

### Step 2: Update Form Type Detection

If the automatic detection doesn't work, add detection logic to `detectFormType()` method:

```typescript
private detectFormType(data: PDFSubmissionData): string {
  // Add custom detection logic
  if (data.specificField || data.collection === 'new-collection') {
    return 'new-form-type';
  }
  // ... existing logic
}
```

### Step 3: Test and Validate

1. Get a sample submission from the Form Details page
2. Test PDF generation with the new blueprint
3. Verify all fields are mapped correctly
4. Check layout and formatting

## Integration with Existing App

### Using in Form Viewer

The PDF generator integrates with the existing Form Viewer component:

```typescript
import { downloadDynamicPDF } from '../../services/dynamicPdfService';

// In your component:
const handleDownloadPDF = async () => {
  try {
    await downloadDynamicPDF(formData);
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
};
```

### Replacing Existing PDF Service

The new system can replace the existing `pdfService.ts`:

```typescript
// Old way:
import { generateFormPDF, downloadPDF } from '../../services/pdfService';

// New way:
import { downloadDynamicPDF } from '../../services/dynamicPdfService';
```

## Special Features

### Conditional Fields

Fields can be conditionally displayed based on other field values:

```typescript
{
  key: 'followUpField',
  label: 'Follow-up Question',
  type: 'text',
  section: 'Details',
  conditional: {
    dependsOn: 'triggerField',
    value: 'yes'
  }
}
```

### Director Handling

For corporate forms with director arrays, the system provides special handling:

```typescript
specialHandling: {
  directorHandling: true
}
```

This will:
- Convert flat director fields (firstName, firstName2, etc.) to structured arrays
- Display directors in numbered sections
- Handle missing director data gracefully

### Rent Assurance Special Note

For rent assurance forms, a special declaration paragraph is included:

```typescript
specialHandling: {
  rentAssuranceNote: true
}
```

## Testing Guidelines

### Visual Checks

1. **Header Layout**: Logo placement, company information alignment
2. **Policy Meta Box**: Proper positioning and formatting
3. **Section Organization**: Clear section headers, proper spacing
4. **Field Formatting**: Correct data types, currency formatting, date formats
5. **Page Breaks**: No orphaned labels, proper section breaks
6. **Footer Blocks**: All required notices present and formatted correctly

### Functional Checks

1. **Data Accuracy**: All submitted data appears in PDF
2. **Field Mapping**: Correct labels and organization
3. **Conditional Logic**: Hidden fields don't appear when conditions not met
4. **File Attachments**: Listed in attachments section (not embedded)
5. **Special Handling**: Form-specific features work correctly

## Sample Files

### Getting Sample Data

1. Navigate to Admin Dashboard
2. Open any form submission in Form Details
3. Use browser dev tools to inspect the `formData` object
4. Copy the object structure for testing

### Example Test Data

```typescript
const sampleMoneyInsuranceData = {
  policyNumber: "MI2024001",
  periodOfCoverFrom: "2024-01-01",
  periodOfCoverTo: "2024-12-31",
  companyName: "Sample Company Ltd",
  lossDate: "2024-03-15",
  lossAmount: 50000,
  moneyLocation: "safe",
  // ... more fields
};
```

## Troubleshooting

### Common Issues

1. **Missing Fields**: Check blueprint mapping and form mapping alignment
2. **Layout Issues**: Verify page break logic and spacing calculations
3. **Data Formatting**: Check field type detection and formatting functions
4. **Logo Not Showing**: Verify image path and format compatibility

### Debug Mode

Enable console logging to track PDF generation:

```typescript
console.log('PDF Generator: Detected form type:', formType);
console.log('PDF Generator: Using blueprint:', blueprint.title);
```

## Performance Considerations

1. **Large Forms**: Use page breaks efficiently for multi-page forms
2. **Image Assets**: Optimize logo size and format
3. **Memory Usage**: Generate PDFs on-demand, don't cache in memory
4. **Browser Compatibility**: Test across different browsers

## Future Enhancements

1. **Template Customization**: Allow per-client logo and styling
2. **Batch Generation**: Generate multiple PDFs at once
3. **Digital Signatures**: Integrate with digital signature providers
4. **Email Integration**: Direct email sending with PDF attachment
5. **Form Analytics**: Track PDF generation metrics

## API Reference

### Main Functions

```typescript
// Generate PDF blob
const pdfBlob = await generateDynamicPDF(submissionData);

// Download PDF file
await downloadDynamicPDF(submissionData, 'custom-filename.pdf');

// Create preview URL
const previewUrl = await createPDFPreviewURL(submissionData);
```

### Configuration Options

```typescript
interface PDFSubmissionData {
  [key: string]: any;
  formType?: string;          // Explicit form type
  policyNumber?: string;      // Policy number for header
  periodOfCoverFrom?: string; // Coverage start date
  periodOfCoverTo?: string;   // Coverage end date
  collection?: string;        // Database collection name
}
```

This documentation provides a comprehensive guide for understanding, using, and extending the PDF generation system.
