# CAC Verification Data Fields

## Overview
This document lists all the data fields returned by the VerifyData CAC verification API and provides guidance for CSV template updates.

## Important Notes
- **CAC Number = RC Number**: These are the same thing. RC stands for "Registration Certificate" number.
- The API endpoint is: `https://vd.villextra.com/api/ValidateRcNumber/Initiate`

## Data Fields Returned by VerifyData API

When you verify a CAC/RC number, the government database returns the following fields:

### 1. Company Name (`name`)
- **Description**: Official registered name of the company
- **Example**: "NEM Insurance Plc"
- **Required for matching**: Yes
- **CSV Template**: Should include a "Company Name" column

### 2. Registration Number (`registrationNumber`)
- **Description**: The RC number (same as CAC number)
- **Example**: "RC69420"
- **Required for matching**: Yes
- **CSV Template**: Should include "RC Number" or "CAC Number" column

### 3. Company Status (`companyStatus`)
- **Description**: Current status of the company
- **Possible Values**: "ACTIVE", "INACTIVE", "VERIFIED", "REGISTERED", "DISSOLVED", etc.
- **Validation**: Accepts any valid CAC status (ACTIVE, INACTIVE, VERIFIED, REGISTERED)
- **Note**: INACTIVE companies are still valid registered entities - they just aren't currently trading
- **Required for matching**: Yes (must be a valid status)
- **CSV Template**: Optional - status is validated against CAC database, not user input

### 4. Registration Date (`registrationDate`)
- **Description**: Date when the company was registered with CAC
- **Format**: Various formats supported (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD)
- **Example**: "14-12-1998" or "14/12/1998"
- **Required for matching**: Yes
- **CSV Template**: Should include "Registration Date" column

### 5. Type of Entity (`typeOfEntity`)
- **Description**: Legal structure of the business
- **Possible Values**: "Limited Liability Company", "Public Limited Company", "Business Name", etc.
- **Required for matching**: No (informational only)
- **CSV Template**: Optional - can be added for reference

## Recommended CSV Template Columns for CAC Verification

### Required Columns (for field matching):
1. **Email** - Customer email address (required for sending verification links)
2. **Company Name** - Official registered company name
3. **RC Number** or **CAC Number** - Registration certificate number
4. **Registration Date** - Date company was registered

### Optional Columns (for additional context):
5. **Business Address** - Physical address of the business
6. **Company Status** - Current status (will be verified against CAC database)
7. **Type of Entity** - Legal structure of the business

## Field Matching Logic

When a customer verifies their CAC, the system will:

1. **Company Name**: Case-insensitive comparison with normalization
   - Removes extra spaces
   - Handles "Ltd", "Limited", "PLC" variations
   - Example: "NEM INSURANCE PLC" matches "Nem Insurance Plc"

2. **RC Number**: Exact match after normalization
   - Removes spaces and special characters
   - Case-insensitive
   - Example: "RC 69420" matches "rc69420"

3. **Registration Date**: Flexible date format matching
   - Supports DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD formats
   - Example: "14-12-1998" matches "14/12/1998"

4. **Business Address**: Partial match (if provided)
   - Checks if key address components are present
   - Not a strict requirement

## Current Issues Fixed

✅ **Empty Response Handling**: When RC number doesn't exist, shows user-friendly message
✅ **String "null" Handling**: Converts API's string "null" to actual null values
✅ **Date Format Support**: Supports DD-MM-YYYY format from CAC database
✅ **Case-Insensitive Matching**: Company names match regardless of case
✅ **Rate Limiting**: Fixed import error for VerifyData rate limiter

## Next Steps

1. Update your CSV template to include the required columns listed above
2. Test with real CAC data to ensure field matching works correctly
3. Consider adding optional columns for better data quality
4. Document the expected format for each column in your broker training guide
