# Identity Remediation System - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Datapro NIN Verification Integration](#datapro-nin-verification-integration)
4. [Encryption & Security](#encryption--security)
5. [Error Handling](#error-handling)
6. [Field Matching Logic](#field-matching-logic)
7. [API Endpoints](#api-endpoints)
8. [Rate Limiting](#rate-limiting)
9. [Monitoring & Health Checks](#monitoring--health-checks)

---

## Overview

The Identity Remediation System provides a secure, NDPR-compliant platform for collecting and verifying National Identification Numbers (NIN) and Corporate Affairs Commission (CAC) registration numbers from insurance customers.

### Key Features

- **Role-Based Access Control**: Broker, Compliance, Admin, Super Admin roles
- **Real NIN Verification**: Integration with Datapro API
- **NDPR Compliance**: AES-256-GCM encryption for all PII at rest
- **Field-Level Validation**: Match NIN data against customer records
- **Bulk Processing**: Verify multiple entries efficiently
- **Comprehensive Audit Trail**: All operations logged

### Technology Stack

- **Backend**: Node.js with Express
- **Database**: Google Cloud Firestore
- **Encryption**: AES-256-GCM (crypto module)
- **Verification API**: Datapro NIN Verification Service
- **Email**: Nodemailer with Gmail SMTP

---

## Authentication & Authorization

### Authentication

All API endpoints (except public verification pages) require authentication using Firebase Authentication tokens.

**Request Header:**
```
Authorization: Bearer <firebase_id_token>
```

### Authorization Roles

| Role | Permissions |
|------|-------------|
| `default` | No identity collection access |
| `broker` | Upload lists, send verification requests, view only own data |
| `compliance` | View all lists and entries, full identity collection access |
| `claims` | No identity collection access |
| `admin` | Full access to all lists, entries, and user management |
| `super_admin` | Full system access |

### Role-Based Filtering

- **Brokers**: Can only access lists where `createdBy === user.uid`
- **Admin/Compliance/Super Admin**: Can access all lists
- **Unauthorized Access**: Returns `403 Forbidden`

---

## Datapro NIN Verification Integration

### Overview

The system integrates with the Datapro NIN Verification API to validate National Identification Numbers against the NIMC (National Identity Management Commission) database.

### API Configuration

**Base URL**: `https://api.datapronigeria.com`

**Endpoint**: `/verifynin/?regNo={NIN}`

**Method**: `GET`

**Authentication**: Header `SERVICEID` (merchant ID from Datapro)

### Environment Variables

```bash
# Datapro API Configuration
DATAPRO_SERVICE_ID=your_merchant_id_from_datapro
DATAPRO_API_URL=https://api.datapronigeria.com

# Verification Mode
VERIFICATION_MODE=mock  # Options: mock, datapro
```

### Request Flow

1. **Decrypt NIN**: Retrieve encrypted NIN from Firestore and decrypt in memory
2. **Apply Rate Limiting**: Check if within rate limit (50 requests/minute)
3. **Make API Call**: Send GET request to Datapro with SERVICEID header
4. **Parse Response**: Extract ResponseInfo and ResponseData
5. **Validate Fields**: Match against customer data from Excel
6. **Store Results**: Save verification details to Firestore
7. **Clear Memory**: Remove decrypted NIN from memory
8. **Send Notifications**: Email customer and staff with results

### Response Structure

**Success Response (200):**
```json
{
  "ResponseInfo": {
    "ResponseCode": "00",
    "Parameter": "12345678901",
    "Source": "NIMC",
    "Message": "Results Found",
    "Timestamp": "21/10/2018 8:36:12PM"
  },
  "ResponseData": {
    "FirstName": "JOHN",
    "MiddleName": null,
    "LastName": "BULL",
    "Gender": "Male",
    "DateOfBirth": "12-May-1969",
    "PhoneNumber": "08123456789",
    "birthdate": "20/01/1980",
    "birthlga": "Kosofe",
    "birthstate": "LAGOS",
    "photo": "---Base64 Encoded---",
    "signature": "---Base64 Encoded---",
    "trackingId": "100083737345"
  }
}
```

### Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success - NIN found | Parse and validate fields |
| 400 | Bad request - Invalid NIN format | Return user-friendly error |
| 401 | Authorization failed | Return service unavailable error |
| 87 | Invalid service ID | Return service unavailable error |
| 88 | Network error | Retry with exponential backoff (max 3 attempts) |

### Retry Logic

- **Max Retries**: 3 attempts
- **Backoff Strategy**: Exponential (1s, 2s, 4s)
- **Timeout**: 30 seconds per request
- **Retryable Errors**: Network errors (code 88), timeouts

### Data Extraction

The system extracts and validates the following fields from the Datapro response:

- `FirstName` → Compared with Excel "First Name"
- `LastName` → Compared with Excel "Last Name"
- `Gender` → Compared with Excel "Gender"
- `DateOfBirth` → Compared with Excel "Date of Birth"
- `PhoneNumber` → Optional comparison (loose matching)

**Note**: `MiddleName` is NOT validated (not in Excel template)

**Privacy**: `photo` and `signature` are NOT stored (data minimization)

---

## Encryption & Security

### NDPR Compliance

All Personally Identifiable Information (PII) is encrypted at rest using AES-256-GCM encryption to comply with Nigeria Data Protection Regulation (NDPR).

### Encryption Algorithm

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes)
- **Auth Tag Size**: 128 bits (16 bytes)

### Key Management

**Encryption Key Generation:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Environment Variable:**
```bash
ENCRYPTION_KEY=your_64_character_hex_string_here
```

**Security Requirements:**
- Store key in environment variables (never in code)
- Use different keys for development, staging, production
- Rotate keys periodically (recommended: every 90 days)
- Never log or expose the encryption key

### Encryption Process

**Encrypt Data:**
```javascript
const { encryptData } = require('./server-utils/encryption.cjs');

const plaintext = '12345678901'; // NIN
const { encrypted, iv } = encryptData(plaintext);

// Store in Firestore
await db.collection('identity-entries').doc(entryId).update({
  nin: { encrypted, iv }
});
```

**Decrypt Data:**
```javascript
const { decryptData } = require('./server-utils/encryption.cjs');

// Retrieve from Firestore
const entry = await db.collection('identity-entries').doc(entryId).get();
const { encrypted, iv } = entry.data().nin;

// Decrypt in memory
const plaintext = decryptData(encrypted, iv);

// Use for verification
await verifyNIN(plaintext);

// Clear from memory
plaintext = null;
```

### Encrypted Fields

The following fields are encrypted before storage:

- `nin` - National Identification Number
- `bvn` - Bank Verification Number
- `cac` - Corporate Affairs Commission number

### Security Best Practices

1. **Never Log Plaintext**: All logs mask sensitive data (e.g., `1234*******`)
2. **Decrypt Only in Memory**: Never store decrypted values
3. **Clear After Use**: Set variables to `null` after verification
4. **Backend Only**: Decryption only happens on server, never in frontend
5. **Audit Trail**: All encryption/decryption operations logged
6. **Unique IVs**: Each encryption uses a unique initialization vector

---

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid input format
2. **Authentication Errors**: Invalid or expired tokens
3. **Authorization Errors**: Insufficient permissions
4. **API Errors**: Datapro API failures
5. **Network Errors**: Connectivity issues
6. **Field Mismatch Errors**: Data doesn't match records

### Error Response Format

```json
{
  "success": false,
  "error": "User-friendly error message",
  "errorCode": "ERROR_CODE",
  "details": {
    "additionalInfo": "value"
  }
}
```

### Error Codes

| Code | User Message | Technical Details |
|------|--------------|-------------------|
| `INVALID_INPUT` | NIN is required. Please provide a valid NIN. | Missing NIN parameter |
| `INVALID_FORMAT` | Invalid NIN format. Please check and try again. | NIN not 11 digits |
| `NOT_CONFIGURED` | Verification service is not configured. Please contact support. | DATAPRO_SERVICE_ID not set |
| `BAD_REQUEST` | Invalid NIN format. Please check and try again. | Datapro returned 400 |
| `UNAUTHORIZED` | Verification service unavailable. Please contact support. | Datapro returned 401 |
| `INVALID_SERVICE_ID` | Verification service unavailable. Please contact support. | Datapro returned 87 |
| `NETWORK_ERROR` | Network error. Please try again later. | Datapro returned 88 or timeout |
| `NIN_NOT_FOUND` | NIN not found in NIMC database. Please verify your NIN and try again. | ResponseCode !== "00" |
| `FIELD_MISMATCH` | The information provided does not match our records. Please contact your broker. | Field validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many verification requests. Please try again later. | Exceeded 50 requests/minute |
| `MAX_RETRIES_EXCEEDED` | Network error. Please try again later. | All 3 retry attempts failed |

### Customer Notifications

When verification fails, the system sends two types of notifications:

**Customer Email** (User-Friendly):
- Clear explanation of what went wrong
- Next steps (contact broker)
- Broker contact information
- Professional, empathetic tone

**Staff Email** (Technical):
- Full error details
- Failed fields list
- API response codes
- Link to entry in admin portal
- Sent to: Compliance, Admin, Broker roles

---

## Field Matching Logic

### Overview

After receiving data from Datapro API, the system validates that the information matches the customer data uploaded in the Excel file.

### Validated Fields

| Field | Required | Matching Strategy |
|-------|----------|-------------------|
| First Name | ✅ Yes | Case-insensitive, whitespace trimmed |
| Last Name | ✅ Yes | Case-insensitive, whitespace trimmed |
| Gender | ✅ Yes | Normalized (M/Male → male, F/Female → female) |
| Date of Birth | ✅ Yes | Flexible format matching |
| Phone Number | ⚠️ Optional | Loose matching (people change numbers) |

### Field Normalization

**String Normalization:**
```javascript
function normalizeString(str) {
  return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

// Example:
normalizeString('  JOHN  DOE  ') === normalizeString('john doe') // true
```

**Gender Normalization:**
```javascript
function normalizeGender(gender) {
  const normalized = gender.toLowerCase().trim();
  if (normalized === 'm' || normalized === 'male') return 'male';
  if (normalized === 'f' || normalized === 'female') return 'female';
  return normalized;
}

// Examples:
normalizeGender('M') === normalizeGender('Male') // true
normalizeGender('F') === normalizeGender('FEMALE') // true
```

**Date Normalization:**

Supports multiple date formats:
- `DD/MM/YYYY` (e.g., "04/01/1980")
- `DD-MMM-YYYY` (e.g., "12-May-1969")
- `YYYY-MM-DD` (e.g., "1980-01-04")
- `YYYY/MM/DD` (e.g., "1980/01/04")

All dates are normalized to `YYYY-MM-DD` format for comparison.

```javascript
parseDate('04/01/1980') === parseDate('1980-01-04') // true
parseDate('12-May-1969') === parseDate('1969-05-12') // true
```

**Phone Normalization:**
```javascript
function normalizePhone(phone) {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');
  
  // Handle +234 prefix (Nigeria country code)
  if (normalized.startsWith('234')) {
    normalized = '0' + normalized.substring(3);
  }
  
  return normalized;
}

// Examples:
normalizePhone('+234 708 927 3645') === normalizePhone('07089273645') // true
normalizePhone('0708-927-3645') === normalizePhone('07089273645') // true
```

### Match Result Format

```javascript
{
  matched: boolean,
  failedFields: string[],
  details: {
    firstName: {
      api: "JOHN",
      excel: "John",
      matched: true
    },
    lastName: {
      api: "BULL",
      excel: "Bull",
      matched: true
    },
    gender: {
      api: "Male",
      excel: "M",
      matched: true
    },
    dateOfBirth: {
      api: "12-May-1969",
      excel: "12/05/1969",
      apiParsed: "1969-05-12",
      excelParsed: "1969-05-12",
      matched: true
    },
    phoneNumber: {
      api: "08123456789",
      excel: "0812 345 6789",
      matched: true,
      optional: true
    }
  }
}
```

### Validation Rules

1. **All Required Fields Must Match**: If any required field fails, verification fails
2. **Phone Number is Optional**: Mismatch is logged but doesn't fail verification
3. **Case-Insensitive**: Name comparisons ignore case
4. **Whitespace Tolerant**: Extra spaces are trimmed
5. **Format Flexible**: Dates can be in multiple formats

---

## API Endpoints

### List Management

#### Create List
```
POST /api/identity/lists
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "name": "Q1 2024 Individual Clients",
  "columns": ["First Name", "Last Name", "Email", "NIN", ...],
  "entries": [
    { "First Name": "John", "Last Name": "Doe", "Email": "john@example.com", ... }
  ],
  "emailColumn": "Email",
  "listType": "individual",
  "uploadMode": "template"
}

Response:
{
  "success": true,
  "listId": "abc123",
  "entryCount": 150
}
```

#### Get All Lists
```
GET /api/identity/lists
Authorization: Bearer <token>

Response:
{
  "success": true,
  "lists": [
    {
      "id": "abc123",
      "name": "Q1 2024 Individual Clients",
      "totalEntries": 150,
      "verifiedCount": 120,
      "pendingCount": 30,
      "createdAt": "2024-01-15T10:00:00Z",
      "createdBy": "user123"
    }
  ]
}
```

#### Get Single List
```
GET /api/identity/lists/:listId
Authorization: Bearer <token>
Query Parameters:
  - status: pending|link_sent|verified|failed
  - search: search term
  - page: page number
  - limit: items per page

Response:
{
  "success": true,
  "list": { ... },
  "entries": [ ... ],
  "total": 150
}
```

#### Delete List
```
DELETE /api/identity/lists/:listId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "List deleted successfully"
}
```

### Verification Operations

#### Send Verification Links
```
POST /api/identity/lists/:listId/send
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "entryIds": ["entry1", "entry2", "entry3"],
  "verificationType": "NIN"
}

Response:
{
  "success": true,
  "sent": 3,
  "failed": 0,
  "errors": []
}
```

#### Bulk Verify
```
POST /api/identity/lists/:listId/bulk-verify
Authorization: Bearer <token>

Response:
{
  "success": true,
  "processed": 100,
  "verified": 85,
  "failed": 10,
  "skipped": 5,
  "details": [
    {
      "entryId": "entry1",
      "status": "verified",
      "message": "Verification successful"
    }
  ]
}
```

#### Customer Verification (Public)
```
GET /api/identity/verify/:token

Response:
{
  "valid": true,
  "entryInfo": {
    "name": "John Doe",
    "policyNumber": "POL123456"
  },
  "verificationType": "NIN",
  "expired": false,
  "used": false
}

POST /api/identity/verify/:token
Content-Type: application/json

Body:
{
  "identityNumber": "12345678901"
}

Response:
{
  "success": true,
  "message": "Verification successful"
}
```

### User Management (Admin Only)

#### Update User Role
```
PATCH /api/users/:userId/role
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "role": "broker"
}

Response:
{
  "success": true,
  "message": "User role updated successfully"
}
```

---

## Rate Limiting

### Datapro API Rate Limit

- **Limit**: 50 requests per minute
- **Window**: Rolling 60-second window
- **Strategy**: Token bucket algorithm
- **Overflow**: Requests queued or rejected with 429 status

### Implementation

```javascript
const { applyDataproRateLimit } = require('./server-utils/rateLimiter.cjs');

async function verifyNIN(nin) {
  try {
    await applyDataproRateLimit();
    // Proceed with API call
  } catch (error) {
    return {
      success: false,
      error: 'Too many verification requests. Please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    };
  }
}
```

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

---

## Monitoring & Health Checks

### API Health Check

The system monitors Datapro API health:

- **Frequency**: Every 5 minutes
- **Endpoint**: `/verifynin/?regNo=test`
- **Timeout**: 10 seconds
- **Alert**: If 3 consecutive failures

### Metrics Tracked

1. **Success Rate**: Percentage of successful verifications
2. **Error Rate**: Percentage of failed verifications (by error code)
3. **Response Time**: Average API response time
4. **API Calls**: Daily/monthly usage counts
5. **Cost**: Estimated monthly cost based on usage

### Health Check Endpoint

```
GET /api/health/datapro
Authorization: Bearer <token>

Response:
{
  "status": "healthy",
  "lastCheck": "2024-01-15T10:00:00Z",
  "responseTime": 1250,
  "successRate": 95.5,
  "errorRate": 4.5
}
```

### Alerts

Alerts are triggered when:

- API is down (3 consecutive failures)
- Error rate > 10%
- Response time > 5 seconds average
- Daily API calls > 80% of limit
- Monthly cost projection > budget

---

## Best Practices

### For Developers

1. **Always Encrypt PII**: Use `encryptData()` before storing NIns/BVNs/CACs
2. **Never Log Plaintext**: Use `maskNIN()` for logging
3. **Clear Sensitive Data**: Set to `null` after use
4. **Handle All Error Codes**: Provide user-friendly messages
5. **Test with Mocks**: Use mock mode for development
6. **Monitor Rate Limits**: Track API usage to avoid overages

### For Administrators

1. **Rotate Encryption Keys**: Every 90 days
2. **Monitor API Health**: Check dashboard daily
3. **Review Error Logs**: Investigate high error rates
4. **Track Costs**: Monitor monthly API usage
5. **Backup Database**: Before encryption migrations
6. **Test Rollback Plan**: Ensure you can switch to mock mode

### For Brokers

1. **Use Templates**: Download and fill Excel templates
2. **Verify Data**: Ensure names, dates, and NIns are correct
3. **Check Emails**: Verify email addresses before sending
4. **Monitor Progress**: Track verification status in dashboard
5. **Handle Errors**: Contact customers when verification fails

---

## Support

### Technical Support

- **Email**: nemsupport@nem-insurance.com
- **Phone**: 0201-4489570-2

### Datapro Support

- **Email**: devops@datapronigeria.net
- **Documentation**: Contact Datapro for full API docs

### Security Issues

Report security vulnerabilities to: security@nem-insurance.com

---

## Changelog

### Version 3.0 (January 2024)
- Added Datapro NIN verification integration
- Implemented AES-256-GCM encryption for NDPR compliance
- Added field-level validation
- Implemented bulk verification
- Added comprehensive error handling
- Added rate limiting and monitoring

### Version 2.0 (December 2023)
- Added broker role and access control
- Implemented Excel template system
- Added onboarding tour
- Enhanced error notifications

### Version 1.0 (November 2023)
- Initial release
- Basic list management
- Mock verification
- Email notifications

---

**Last Updated**: January 2024  
**Version**: 3.0  
**Status**: Production Ready
