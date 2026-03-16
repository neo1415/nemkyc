# Form Schemas Reference

## Farm Property and Produce Insurance Claim Form (FPP)

### Complete JSON Schema

```json
{
  "ticketPrefix": "FPP",
  "formType": "Farm Property and Produce Insurance Claim",
  "sections": [
    {
      "id": "policy-insured-details",
      "title": "Section 1: Policy & Insured Details",
      "fields": {
        "policyNumber": {
          "type": "string",
          "required": true,
          "label": "Policy Number"
        },
        "periodOfCoverFrom": {
          "type": "date",
          "required": true,
          "label": "Period of Cover From"
        },
        "periodOfCoverTo": {
          "type": "date",
          "required": true,
          "label": "Period of Cover To"
        },
        "insuredName": {
          "type": "string",
          "required": true,
          "label": "Name of Insured"
        },
        "address": {
          "type": "textarea",
          "required": true,
          "label": "Address"
        },
        "phone": {
          "type": "tel",
          "required": true,
          "label": "Phone Number"
        },
        "email": {
          "type": "email",
          "required": false,
          "label": "Email"
        }
      }
    },
    {
      "id": "cause-of-loss",
      "title": "Section 2: Cause of Loss",
      "fields": {
        "dateOfLoss": {
          "type": "date",
          "required": true,
          "label": "Date of Loss"
        },
        "timeOfLoss": {
          "type": "time",
          "required": true,
          "label": "Time of Loss"
        },
        "causeOfLoss": {
          "type": "select",
          "required": true,
          "label": "Cause of Loss",
          "options": [
            "Fire",
            "Flood",
            "Storm",
            "Drought",
            "Outbreak of Pest and Disease",
            "Theft",
            "Vandalism",
            "Other"
          ]
        },
        "pestDiseaseSpecification": {
          "type": "text",
          "required": false,
          "label": "Please specify the pest or disease",
          "conditional": {
            "dependsOn": "causeOfLoss",
            "value": "Outbreak of Pest and Disease"
          }
        },
        "lossDescription": {
          "type": "textarea",
          "required": true,
          "label": "Description of Loss",
          "maxLength": 2500
        }
      }
    },
    {
      "id": "property-lost-damaged",
      "title": "Section 3: Property Lost or Damaged",
      "fields": {
        "damagedItems": {
          "type": "array",
          "required": true,
          "minItems": 1,
          "label": "Damaged Items",
          "itemSchema": {
            "itemDescription": {
              "type": "text",
              "required": true,
              "label": "Item Description"
            },
            "numberOrQuantity": {
              "type": "text",
              "required": true,
              "label": "Number or Quantity"
            },
            "valueBeforeLoss": {
              "type": "currency",
              "required": true,
              "label": "Value Before Loss (₦)"
            },
            "salvageValue": {
              "type": "currency",
              "required": true,
              "label": "Salvage Value (₦)"
            }
          }
        }
      }
    },
    {
      "id": "declaration-signature",
      "title": "Section 4: Declaration & Signature",
      "fields": {
        "agreeToDataPrivacy": {
          "type": "boolean",
          "required": true,
          "label": "I agree to the data privacy terms"
        },
        "declarationTrue": {
          "type": "boolean",
          "required": true,
          "label": "I/We declare that the statements above are true"
        },
        "signature": {
          "type": "text",
          "required": true,
          "label": "Full Name (Digital Signature)"
        },
        "signatureUpload": {
          "type": "file",
          "required": true,
          "label": "Signature Upload",
          "accept": ".pdf,.jpg,.jpeg,.png",
          "maxSize": "5MB"
        },
        "receiptsAndInvoices": {
          "type": "file",
          "required": false,
          "multiple": true,
          "label": "Receipts and Invoices",
          "accept": ".pdf,.jpg,.jpeg,.png",
          "maxSize": "5MB",
          "maxFiles": 10
        }
      }
    }
  ]
}
```

## Livestock Insurance Claim Form (LIV)

### Complete JSON Schema

```json
{
  "ticketPrefix": "LIV",
  "formType": "Livestock Insurance Claim",
  "sections": [
    {
      "id": "policy-insured-details",
      "title": "Section 1: Policy & Insured Details",
      "fields": {
        "policyNumber": {
          "type": "string",
          "required": true,
          "label": "Policy Number"
        },
        "periodOfCoverFrom": {
          "type": "date",
          "required": true,
          "label": "Period of Cover From"
        },
        "periodOfCoverTo": {
          "type": "date",
          "required": true,
          "label": "Period of Cover To"
        },
        "insuredName": {
          "type": "string",
          "required": true,
          "label": "Name of Insured"
        },
        "address": {
          "type": "textarea",
          "required": true,
          "label": "Address"
        },
        "phone": {
          "type": "tel",
          "required": true,
          "label": "Phone Number"
        },
        "email": {
          "type": "email",
          "required": false,
          "label": "Email"
        }
      }
    },
    {
      "id": "cause-of-loss",
      "title": "Section 2: Cause of Loss",
      "fields": {
        "dateOfLoss": {
          "type": "date",
          "required": true,
          "label": "Date of Loss"
        },
        "timeOfLoss": {
          "type": "time",
          "required": true,
          "label": "Time of Loss"
        },
        "causeOfDeath": {
          "type": "select",
          "required": true,
          "label": "Cause of Death",
          "options": [
            "Accident",
            "Fire",
            "Flood",
            "Storm",
            "Lightning",
            "Outbreak of Pest and Disease",
            "Theft",
            "Attack by Wild Animals",
            "Other cause of loss not listed"
          ]
        },
        "diseaseSpecification": {
          "type": "text",
          "required": false,
          "label": "Please specify the disease",
          "conditional": {
            "dependsOn": "causeOfDeath",
            "value": "Outbreak of Pest and Disease"
          }
        },
        "otherCauseExplanation": {
          "type": "textarea",
          "required": false,
          "label": "Please explain the cause",
          "maxLength": 2500,
          "conditional": {
            "dependsOn": "causeOfDeath",
            "value": "Other cause of loss not listed"
          }
        }
      }
    },
    {
      "id": "claim-details",
      "title": "Section 3: Claim Details",
      "fields": {
        "livestockType": {
          "type": "select",
          "required": true,
          "label": "Type of Livestock",
          "options": [
            "Cattle",
            "Sheep",
            "Goats",
            "Pigs",
            "Poultry",
            "Other"
          ]
        },
        "numberOfAnimals": {
          "type": "number",
          "required": true,
          "label": "Number of Animals Lost",
          "min": 1
        },
        "ageOfAnimals": {
          "type": "text",
          "required": true,
          "label": "Age of Animals"
        },
        "valuePerAnimal": {
          "type": "currency",
          "required": true,
          "label": "Value per Animal (₦)"
        },
        "totalClaimValue": {
          "type": "currency",
          "required": true,
          "label": "Total Claim Value (₦)"
        },
        "circumstancesOfLoss": {
          "type": "textarea",
          "required": true,
          "label": "Circumstances of Loss",
          "maxLength": 2500
        }
      }
    },
    {
      "id": "declaration-signature",
      "title": "Section 4: Declaration & Signature",
      "fields": {
        "agreeToDataPrivacy": {
          "type": "boolean",
          "required": true,
          "label": "I agree to the data privacy terms"
        },
        "declarationTrue": {
          "type": "boolean",
          "required": true,
          "label": "I/We declare that the statements above are true"
        },
        "signature": {
          "type": "text",
          "required": true,
          "label": "Full Name (Digital Signature)"
        },
        "signatureUpload": {
          "type": "file",
          "required": true,
          "label": "Signature Upload",
          "accept": ".pdf,.jpg,.jpeg,.png",
          "maxSize": "5MB"
        },
        "medicalPostMortemReports": {
          "type": "file",
          "required": false,
          "multiple": true,
          "label": "Medical/Post-Mortem Reports",
          "accept": ".pdf,.jpg,.jpeg,.png",
          "maxSize": "5MB",
          "maxFiles": 10
        },
        "receiptsInvoicesMortalityRecords": {
          "type": "file",
          "required": false,
          "multiple": true,
          "label": "Receipts/Invoices/Mortality Records",
          "accept": ".pdf,.jpg,.jpeg,.png",
          "maxSize": "5MB",
          "maxFiles": 10
        }
      }
    }
  ]
}
```

## Field Type Definitions

### Standard Types

- **string**: Single-line text input
- **textarea**: Multi-line text input with character limit
- **email**: Email input with validation
- **tel**: Phone number input
- **date**: Date picker component
- **time**: Time input
- **number**: Numeric input with min/max validation
- **currency**: Numeric input formatted as currency (₦)
- **boolean**: Checkbox input
- **select**: Dropdown selection
- **file**: File upload input
- **array**: Dynamic array of items with add/remove functionality

### Conditional Fields

Fields with `conditional` property only display when the dependency condition is met:

```typescript
{
  "conditional": {
    "dependsOn": "fieldName",  // The field to watch
    "value": "expectedValue"    // The value that triggers display
  }
}
```

### Array Fields

Array fields allow users to add/remove multiple items:

```typescript
{
  "type": "array",
  "minItems": 1,
  "itemSchema": {
    // Schema for each item in the array
  }
}
```

### File Upload Fields

File upload fields support single or multiple files:

```typescript
{
  "type": "file",
  "multiple": true,        // Allow multiple files
  "accept": ".pdf,.jpg",   // Allowed file types
  "maxSize": "5MB",        // Max size per file
  "maxFiles": 10           // Max number of files (for multiple)
}
```

## Data Privacy and Declaration Text

### Data Privacy Policy

```
i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.

ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2023.

iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.
```

### Declaration Text

```
1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.

2. I/We agree to provide additional information to NEM Insurance, if required.

3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.
```

## Validation Rules

### Required Fields

All fields marked with `"required": true` must be filled before form submission.

### Conditional Required Fields

Fields with conditional display are only required when visible (i.e., when their dependency condition is met).

### Array Minimum Items

Array fields with `"minItems": 1` require at least one item to be added.

### File Upload Validation

- File type must match `accept` pattern
- File size must not exceed `maxSize`
- Total number of files must not exceed `maxFiles` (for multiple uploads)

### Email Validation

Email fields must match standard email format: `user@domain.com`

### Phone Validation

Phone fields should accept various formats but store in consistent format.

### Date Validation

- Dates must be valid calendar dates
- Date ranges (from/to) should be validated for logical order

### Currency Validation

- Must be positive numbers
- Formatted with ₦ symbol
- Stored as string to preserve precision

## Storage Paths

### File Upload Paths

```
claims/farm-property-produce/{ticketId}/signatureUpload/{filename}
claims/farm-property-produce/{ticketId}/receiptsAndInvoices/{filename}

claims/livestock/{ticketId}/signatureUpload/{filename}
claims/livestock/{ticketId}/medicalPostMortemReports/{filename}
claims/livestock/{ticketId}/receiptsInvoicesMortalityRecords/{filename}
```

### Firestore Collections

```
formSubmissions/
  {submissionId}/
    ticketId: "FPP-YYYYMMDD-XXXX"
    formType: "Farm Property and Produce Insurance Claim"
    status: "processing" | "approved" | "rejected" | "pending"
    submittedAt: Timestamp
    submittedBy: userId
    formData: { ... }
```

## Ticket ID Format

- **FPP**: `FPP-YYYYMMDD-XXXX` (e.g., FPP-20240115-A1B2)
- **LIV**: `LIV-YYYYMMDD-XXXX` (e.g., LIV-20240115-C3D4)

Where:
- `YYYY`: Year
- `MM`: Month
- `DD`: Day
- `XXXX`: Random alphanumeric identifier
