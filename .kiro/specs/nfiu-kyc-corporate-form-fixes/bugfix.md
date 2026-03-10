# Bugfix Requirements Document

## Introduction

Multiple configuration and validation issues exist in the NFIU and KYC corporate forms that cause incorrect field requirements, missing validations, and inconsistent data display across the admin dashboard. These issues affect data entry accuracy, user experience, and administrative reporting capabilities.

The bugs manifest in several areas:
- Form field configurations not matching requirements (required vs optional, field types)
- Missing validation logic for modified fields
- Admin dashboard components not properly displaying or exporting the modified field structure

## Bug Analysis

### Current Behavior (Defect)

#### Form Configuration Issues

1.1 WHEN the NFIU Corporate form is rendered THEN the Website field displays a red asterisk indicating it is mandatory

1.2 WHEN the NFIU Corporate form is rendered THEN the Ownership of Company field is displayed as a text input field

1.3 WHEN the NFIU Corporate form is rendered THEN Business Type and Occupation are displayed as two separate fields (`natureOfBusiness` and `businessOccupation`)

1.4 WHEN formConfigs.ts is loaded THEN unused imports (`yup`, `genderOptions`) are present in the file

#### Validation Issues

1.5 WHEN a user submits the NFIU Corporate form with modified fields THEN no validation logic executes for the ownership type select field

1.6 WHEN a user submits the NFIU Corporate form with the combined business type/occupation field THEN no validation logic executes for this field

#### Admin Dashboard Display Issues

1.7 WHEN FormViewer.tsx displays NFIU Corporate form data THEN field mappings do not account for renamed/combined fields, resulting in missing or incorrect data display

1.8 WHEN FormViewer.tsx displays the ownership field THEN the select field value is not properly formatted for display

1.9 WHEN AdminUnifiedTable.tsx renders NFIU Corporate form data THEN table columns do not reflect the new field structure

1.10 WHEN AdminUnifiedTable.tsx attempts to sort or filter by renamed fields THEN the functionality may break due to incorrect field references

1.11 WHEN CSVGenerator.ts exports NFIU Corporate form data THEN the combined business type/occupation field is not properly handled in the export

1.12 WHEN CSVGenerator.ts exports NFIU Corporate form data THEN field labels do not match the updated field names

1.13 WHEN PDFGenerator.ts generates reports for NFIU Corporate forms THEN new select fields are not properly formatted

1.14 WHEN PDFGenerator.ts generates reports for NFIU Corporate forms THEN the combined business type/occupation field is not properly displayed

### Expected Behavior (Correct)

#### Form Configuration Fixes

2.1 WHEN the NFIU Corporate form is rendered THEN the Website field SHALL be marked as optional (`required: false`) without a red asterisk

2.2 WHEN the NFIU Corporate form is rendered THEN the Ownership of Company field SHALL be displayed as a select dropdown with options: "Nigerian", "Foreign", "Both" and marked as optional (`required: false`)

2.3 WHEN the NFIU Corporate form is rendered THEN Business Type and Occupation SHALL be combined into a single field labeled "Business Type/Occupation" and marked as mandatory (`required: true`)

2.4 WHEN formConfigs.ts is loaded THEN unused imports (`yup`, `genderOptions`) SHALL be removed from the file

#### Validation Fixes

2.5 WHEN a user submits the NFIU Corporate form with the ownership field THEN validation logic SHALL verify the value is one of: "Nigerian", "Foreign", or "Both" (if provided, since it's optional)

2.6 WHEN a user submits the NFIU Corporate form with the business type/occupation field THEN validation logic SHALL verify the field is not empty and contains valid text

#### Admin Dashboard Display Fixes

2.7 WHEN FormViewer.tsx displays NFIU Corporate form data THEN field mappings SHALL correctly handle renamed/combined fields and display all data accurately

2.8 WHEN FormViewer.tsx displays the ownership field THEN the select field value SHALL be properly formatted and displayed with the correct label

2.9 WHEN AdminUnifiedTable.tsx renders NFIU Corporate form data THEN table columns SHALL reflect the new field structure with correct column headers

2.10 WHEN AdminUnifiedTable.tsx attempts to sort or filter by fields THEN the functionality SHALL work correctly with updated field references

2.11 WHEN CSVGenerator.ts exports NFIU Corporate form data THEN the combined business type/occupation field SHALL be properly included in the export with correct data

2.12 WHEN CSVGenerator.ts exports NFIU Corporate form data THEN field labels SHALL match the updated field names

2.13 WHEN PDFGenerator.ts generates reports for NFIU Corporate forms THEN new select fields SHALL be properly formatted with readable values

2.14 WHEN PDFGenerator.ts generates reports for NFIU Corporate forms THEN the combined business type/occupation field SHALL be properly displayed with correct label and value

### Unchanged Behavior (Regression Prevention)

#### KYC Corporate Form Preservation

3.1 WHEN the KYC Corporate form is rendered THEN the system SHALL CONTINUE TO display all fields correctly as currently configured

3.2 WHEN the KYC Corporate form is submitted THEN the system SHALL CONTINUE TO validate all fields using existing validation logic

#### Other NFIU Corporate Fields Preservation

3.3 WHEN the NFIU Corporate form is rendered THEN all fields other than Website, Ownership, and Business Type/Occupation SHALL CONTINUE TO display with their current configuration

3.4 WHEN the NFIU Corporate form is submitted THEN all fields other than Website, Ownership, and Business Type/Occupation SHALL CONTINUE TO validate using existing validation logic

#### Admin Dashboard Other Forms Preservation

3.5 WHEN FormViewer.tsx displays non-NFIU Corporate form data THEN the system SHALL CONTINUE TO display all fields correctly using existing field mappings

3.6 WHEN AdminUnifiedTable.tsx renders non-NFIU Corporate form data THEN the system SHALL CONTINUE TO display table columns correctly with existing column definitions

3.7 WHEN CSVGenerator.ts exports non-NFIU Corporate form data THEN the system SHALL CONTINUE TO generate CSV files correctly with existing field labels

3.8 WHEN PDFGenerator.ts generates reports for non-NFIU Corporate forms THEN the system SHALL CONTINUE TO format and display all fields correctly

#### Date Handling Preservation

3.9 WHEN any form with date fields is rendered THEN the system SHALL CONTINUE TO use consistent date handling across all forms

3.10 WHEN any form with date fields is submitted THEN the system SHALL CONTINUE TO validate and store dates using existing date handling logic
