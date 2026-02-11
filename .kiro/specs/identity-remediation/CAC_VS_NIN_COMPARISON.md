# CAC vs NIN Verification: Side-by-Side Comparison

**Purpose**: Quick reference for developers implementing CAC verification  
**Status**: Reference Document  

---

## API Comparison

| Feature | Datapro NIN | VerifyData CAC |
|---------|-------------|----------------|
| **Provider** | Datapro Nigeria | VerifyData (villextra.com) |
| **Base URL** | `https://api.datapronigeria.com` | `https://vd.villextra.com` |
| **Endpoint** | `/verifynin/` | `/api/ValidateRcNumber/Initiate` |
| **HTTP Method** | GET | POST |
| **Auth Method** | Header | Request Body |
| **Auth Key Name** | `SERVICEID` | `secretKey` |
| **Request Format** | Query param: `?regNo={NIN}` | JSON: `{rcNumber, secretKey}` |
| **Timeout** | 30 seconds | 30 seconds |
| **Max Retries** | 3 | 3 |
| **Rate Limit** | 50/minute | 50/minute (TBD) |

---

## Request Format Comparison

### Datapro NIN Request
```javascript
// GET request
const url = `${DATAPRO_API_URL}/verifynin/?regNo=${nin}`;
const headers = {
  'SERVICEID': DATAPRO_SERVICE_ID,
  'Content-Type': 'application/json'
};
const response = await httpsGet(url, headers, timeout);
```

### VerifyData CAC Request
```javascript
// POST request
const url = `${VERIFYDATA_API_URL}/api/ValidateRcNumber/Initiate`;
const body = {
  rcNumber: rcNumber,
  secretKey: VERIFYDATA_SECRET_KEY
};
const response = await httpsPost(url, body, timeout);
```

---

## Response Structure Comparison

### Datapro NIN Response (Success)
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
    "PhoneNumber": "08123456789"
  }
}
```

### VerifyData CAC Response (Success)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "success",
  "data": {
    "name": "TEST COMPANY LTD",
    "registrationNumber": "RC123456",
    "companyStatus": "Verified",
    "registrationDate": "2024-04-23",
    "typeOfEntity": "PRIVATE_COMPANY_LIMITED_BY_SHARES"
  }
}
```

---

## Error Code Comparison

### Datapro NIN Error Codes
| Code | Meaning | User Message |
|------|---------|--------------|
| 400 | Bad request | "Invalid NIN format. Please check and try again." |
| 401 | Authorization failed | "Verification service unavailable. Please contact support." |
| 87 | Invalid service ID | "Verification service unavailable. Please contact support." |
| 88 | Network error | "Network error. Please try again later." |
| ResponseCode != "00" | NIN not found | "NIN not found in NIMC database." |

### VerifyData CAC Error Codes
| Code | StatusCode | Meaning | User Message |
|------|------------|---------|--------------|
| 400 | FF | Invalid secret key | "Verification service unavailable. Please contact support." |
| 400 | IB | Insufficient balance | "Verification service unavailable. Please contact support." |
| 400 | BR | Contact administrator | "Verification service unavailable. Please contact support." |
| 400 | EE | No active service | "Verification service unavailable. Please contact support." |
| 500 | - | Server error | "Network error. Please try again later." |
| 200 | - | success: false | "RC number not found in CAC database." |

---

## Field Matching Comparison

### NIN Field Matching
| Field | Required | Normalization | Notes |
|-------|----------|---------------|-------|
| First Name | ✅ Yes | Lowercase, trim, remove extra spaces | Case-insensitive |
| Last Name | ✅ Yes | Lowercase, trim, remove extra spaces | Case-insensitive |
| Gender | ✅ Yes | M/Male → male, F/Female → female | Normalized |
| Date of Birth | ✅ Yes | Parse to YYYY-MM-DD | Multiple formats |
| Phone Number | ❌ No | Remove non-digits, handle +234 | Optional (people change numbers) |

### CAC Field Matching
| Field | Required | Normalization | Notes |
|-------|----------|---------------|-------|
| Company Name | ✅ Yes | Lowercase, trim, Ltd/Limited/PLC | Handle variations |
| Registration Number | ✅ Yes | Remove RC prefix, uppercase | Exact match after normalization |
| Registration Date | ✅ Yes | Parse to YYYY-MM-DD | Multiple formats |
| Company Status | ✅ Yes | Must be "Verified" or active | Reject dissolved/inactive |
| Type of Entity | ❌ No | Store for reference | Not used in matching |

---

## Normalization Functions Comparison

### NIN Normalization
```javascript
// Name normalization
normalizeString(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Gender normalization
normalizeGender(gender) {
  const normalized = normalizeString(gender);
  if (normalized === 'm' || normalized === 'male') return 'male';
  if (normalized === 'f' || normalized === 'female') return 'female';
  return normalized;
}

// Phone normalization
normalizePhone(phone) {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('234')) {
    normalized = '0' + normalized.substring(3);
  }
  return normalized;
}
```

### CAC Normalization
```javascript
// Company name normalization
normalizeCompanyName(name) {
  let normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');
  // Handle Ltd/Limited variations
  normalized = normalized.replace(/\blimited\b/g, 'ltd');
  normalized = normalized.replace(/\bplc\b/g, 'ltd');
  return normalized;
}

// RC number normalization
normalizeRCNumber(rcNumber) {
  let normalized = rcNumber.toUpperCase().trim();
  // Remove RC prefix if present
  normalized = normalized.replace(/^RC/, '');
  // Remove spaces and dashes
  normalized = normalized.replace(/[\s-]/g, '');
  return normalized;
}
```

---

## Code Reuse Matrix

| Component | NIN (Datapro) | CAC (VerifyData) | Reuse % |
|-----------|---------------|------------------|---------|
| **API Client** | `dataproClient.cjs` | `verifydataClient.cjs` | 80% (structure) |
| **Encryption** | `encryption.cjs` | Same file | 100% |
| **Audit Logging** | `auditLogger.cjs` | Same file | 100% |
| **Queue System** | `verificationQueue.cjs` | Same file | 100% |
| **Health Monitor** | `healthMonitor.cjs` | Same file | 100% |
| **API Usage Tracker** | `apiUsageTracker.cjs` | Same file | 100% |
| **Rate Limiter** | `applyDataproRateLimit()` | `applyVerifydataRateLimit()` | 95% (pattern) |
| **Security Middleware** | `securityMiddleware.cjs` | Same file | 100% |
| **Error Framework** | `verificationErrors.ts` | Same file | 100% |
| **Email Templates** | `verificationEmail.ts` | Same file | 100% |
| **UI Components** | All identity components | Same components | 100% |
| **Server Routing** | `server.js` | Same file (add CAC branch) | 95% |

**Overall Code Reuse**: ~90%

---

## Implementation Checklist

### ✅ What's Already Done (NIN)
- [x] Encryption infrastructure
- [x] Audit logging system
- [x] Queue management
- [x] Health monitoring
- [x] API usage tracking
- [x] Rate limiting pattern
- [x] Security middleware
- [x] Error handling framework
- [x] Email templates
- [x] All UI components
- [x] Server endpoint structure
- [x] Testing infrastructure

### ⏳ What Needs to be Done (CAC)
- [ ] Create `verifydataClient.cjs` (mirror Datapro structure)
- [ ] Create `verifydataClient` mock
- [ ] Create `verifydataClient` tests
- [ ] Add VerifyData config to `verificationConfig.ts`
- [ ] Add `applyVerifydataRateLimit()` to `rateLimiter.cjs`
- [ ] Add CAC routing to `server.js`
- [ ] Add VerifyData credentials to `.env`
- [ ] Create CAC integration tests
- [ ] Update documentation
- [ ] Test with production API

---

## Testing Strategy Comparison

### NIN Testing (Already Done)
- ✅ Unit tests for Datapro client
- ✅ Unit tests for field matching
- ✅ Integration tests for verification flow
- ✅ Property-based tests
- ✅ Mock API for testing
- ✅ Security tests
- ✅ Performance tests

### CAC Testing (To Do)
- [ ] Unit tests for VerifyData client (mirror NIN tests)
- [ ] Unit tests for CAC field matching (mirror NIN tests)
- [ ] Integration tests for CAC flow (mirror NIN tests)
- [ ] Property-based tests (reuse patterns)
- [ ] Mock API for testing (mirror NIN mock)
- [ ] Security tests (reuse NIN tests)
- [ ] Performance tests (reuse NIN tests)

---

## Environment Variables Comparison

### NIN (Datapro)
```bash
# Datapro NIN Verification
DATAPRO_API_URL=https://api.datapronigeria.com
DATAPRO_SERVICE_ID=your_service_id_here
```

### CAC (VerifyData)
```bash
# VerifyData CAC Verification
VERIFYDATA_API_URL=https://vd.villextra.com
VERIFYDATA_SECRET_KEY=your_secret_key_here
```

### Shared
```bash
# Encryption (used by both)
ENCRYPTION_KEY=your_32_byte_hex_key_here

# Verification Mode
VERIFICATION_MODE=mock  # or 'datapro' or 'production'
```

---

## Security Comparison

| Security Measure | NIN | CAC | Implementation |
|------------------|-----|-----|----------------|
| **Encryption at Rest** | ✅ | ✅ | AES-256-GCM |
| **Credential Storage** | ✅ | ✅ | Environment variables |
| **Frontend Exposure** | ❌ Never | ❌ Never | Backend only |
| **Logging Safety** | ✅ Masked | ✅ Masked | First 4 chars only |
| **Audit Trail** | ✅ | ✅ | Firestore logs |
| **Rate Limiting** | ✅ | ✅ | 50/minute |
| **NDPR Compliance** | ✅ | ✅ | Full compliance |

---

## Performance Comparison

| Metric | NIN (Datapro) | CAC (VerifyData) | Target |
|--------|---------------|------------------|--------|
| **Single Verification** | ~2-3 seconds | ~2-3 seconds (estimated) | < 5 seconds |
| **Bulk (100 entries)** | ~3-4 minutes | ~3-4 minutes (estimated) | < 5 minutes |
| **Rate Limit** | 50/minute | 50/minute (TBD) | No 429 errors |
| **Timeout** | 30 seconds | 30 seconds | No timeouts |
| **Retry Success** | >95% | >95% (target) | >90% |

---

## Quick Reference: Key Differences

### 🔴 Critical Differences (Must Handle)
1. **HTTP Method**: GET vs POST
2. **Auth Location**: Header vs Body
3. **Request Format**: Query param vs JSON body
4. **Response Structure**: Different JSON structure
5. **Error Codes**: Different error code system
6. **Field Types**: Individual vs Company data

### 🟡 Important Differences (Must Normalize)
1. **Company Name**: Handle Ltd/Limited/PLC variations
2. **RC Number**: Handle RC prefix
3. **Company Status**: Validate active status
4. **Date Format**: Same flexible parsing

### 🟢 Similarities (Reuse Code)
1. **Encryption**: Same AES-256-GCM
2. **Logging**: Same audit trail
3. **Queue**: Same queue system
4. **Monitoring**: Same health checks
5. **UI**: Same components
6. **Security**: Same NDPR compliance

---

## Developer Quick Start

### To Implement CAC Verification:

1. **Copy Datapro client structure**
   ```bash
   cp server-services/dataproClient.cjs server-services/verifydataClient.cjs
   ```

2. **Modify for POST request**
   - Change `httpsGet` to `httpsPost`
   - Move auth from header to body
   - Update request format

3. **Update field matching**
   - Replace name matching with company name matching
   - Replace NIN with RC number
   - Replace DOB with registration date

4. **Add to server routing**
   ```javascript
   if (verificationType === 'CAC') {
     await applyVerifydataRateLimit();
     result = await verifydataClient.verifyCAC(cac);
   }
   ```

5. **Test thoroughly**
   - Copy NIN tests
   - Update for CAC data
   - Run all tests

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-07  
**Purpose**: Developer Reference  
**Status**: Complete
