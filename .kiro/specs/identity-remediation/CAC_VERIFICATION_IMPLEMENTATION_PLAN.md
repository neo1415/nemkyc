js         # Same security
src/utils/verificationErrors.ts             # Error handling
src/templates/verificationEmail.ts          # Email templates
src/pages/admin/IdentityListDetail.tsx      # Admin UI
src/components/identity/UploadDialog.tsx    # Upload UI
... (all other UI components)
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-07  
**Author**: Development Team  
**Status**: Ready for Review
        # Add VerifyData credentials
.env.example                                # Document VerifyData variables
```

### Reused Files (20+)
```
server-utils/encryption.cjs                 # Encrypt CAC numbers
server-utils/auditLogger.cjs                # Log CAC verifications
server-utils/verificationQueue.cjs          # Queue CAC verifications
server-utils/healthMonitor.cjs              # Monitor VerifyData API
server-utils/apiUsageTracker.cjs            # Track CAC API calls
server-utils/securityMiddleware.c Structure

### New Files (3)
```
server-services/
  verifydataClient.cjs          # Main CAC verification client
  __mocks__/
    verifydataClient.cjs        # Mock for testing
  __tests__/
    verifydataClient.test.cjs   # Unit tests
```

### Modified Files (5)
```
server.js                                    # Add CAC verification logic
src/config/verificationConfig.ts            # Add VerifyData config
server-utils/rateLimiter.cjs                # Add VerifyData rate limiter
.env.local                          otation needed)

### Risk 5: Data Encryption Failure
- **Mitigation**: Comprehensive testing, error handling
- **Impact**: Critical (NDPR violation)

---

## Next Steps

1. **Review this plan** with team/client
2. **Obtain VerifyData credentials** from NEM Insurance
3. **Create tasks in tasks.md** based on this plan
4. **Begin implementation** following task order
5. **Test thoroughly** at each phase
6. **Deploy to staging** for client review
7. **Deploy to production** after approval

---

## Appendix: FileRisk 1: VerifyData API Downtime
- **Mitigation**: Health monitoring, fallback to mock mode
- **Impact**: Low (can switch to mock)

### Risk 2: Field Matching Inaccuracies
- **Mitigation**: Comprehensive normalization, flexible matching
- **Impact**: Medium (manual review needed)

### Risk 3: Rate Limit Exceeded
- **Mitigation**: Queue system, rate limiter
- **Impact**: Low (requests queued)

### Risk 4: Secret Key Exposure
- **Mitigation**: Environment variables, never log
- **Impact**: Critical (immediate key rss Criteria

### Functional
- ✅ CAC verification works end-to-end
- ✅ Field matching accurate (>95% accuracy)
- ✅ Error handling comprehensive
- ✅ Bulk verification efficient
- ✅ Notifications sent correctly

### Non-Functional
- ✅ Response time < 5 seconds (95th percentile)
- ✅ Uptime > 99.5%
- ✅ Zero data breaches
- ✅ NDPR compliant
- ✅ All tests passing

### User Experience
- ✅ Clear error messages
- ✅ Fast verification
- ✅ Reliable notifications
- ✅ Easy to use admin interface

---

## Risk Mitigation

### pment
4. Re-test thoroughly
5. Re-deploy

---

## Cost Estimation

### Development Time
- **VerifyData Client**: 2-3 hours
- **Mock & Tests**: 1-2 hours
- **Configuration**: 30 minutes
- **Rate Limiter**: 30 minutes
- **Server Endpoints**: 2-3 hours
- **Integration Tests**: 2-3 hours
- **Documentation**: 1 hour
- **Total**: 10-13 hours (1.5-2 days)

### API Costs
- **VerifyData**: Cost per CAC verification (TBD from client)
- **Monitoring**: Same infrastructure as Datapro (no additional cost)

---

## Succe for errors

### Post-Deployment
- [ ] Monitor API health
- [ ] Monitor error rates
- [ ] Monitor API costs
- [ ] Verify notifications working
- [ ] Collect user feedback

---

## Rollback Plan

### If VerifyData API Issues
1. Switch `VERIFICATION_MODE` to `mock` in environment variables
2. Restart server
3. CAC verifications will use mock service
4. No data loss - all encrypted data preserved

### If Critical Bugs
1. Revert to previous deployment
2. Restore database from backup (if needed)
3. Fix bugs in develol unit tests passing
- [ ] All integration tests passing
- [ ] Security audit complete
- [ ] Code review complete
- [ ] Documentation updated
- [ ] `VERIFYDATA_SECRET_KEY` obtained from client
- [ ] `VERIFYDATA_API_URL` configured
- [ ] Backup database

### Deployment
- [ ] Deploy to staging environment
- [ ] Test with real VerifyData API (if test credentials available)
- [ ] Verify encryption working
- [ ] Verify rate limiting working
- [ ] Verify audit logging working
- [ ] Deploy to production
- [ ] Monitorntegration Tests
- ✅ End-to-end verification flow
- ✅ Bulk verification
- ✅ Encryption/decryption
- ✅ Rate limiting
- ✅ Audit logging
- ✅ Notifications

### Mock Testing
- ✅ All success scenarios
- ✅ All error codes
- ✅ Network errors
- ✅ Timeout errors
- ✅ Field mismatches

### Manual Testing
- ✅ Upload CAC list
- ✅ Send verification requests
- ✅ Customer submits CAC
- ✅ Verify results in admin portal
- ✅ Test error scenarios
- ✅ Test bulk verification

---

## Deployment Checklist

### Pre-Deployment
- [ ] Almiter for VerifyData API
- ✅ Separate rate limit bucket from Datapro
- ✅ Queue requests if limit exceeded
- ✅ Log rate limit hits

### 5. Error Handling
- ✅ No sensitive data in error messages
- ✅ User-friendly messages for customers
- ✅ Technical details for staff only
- ✅ Proper error codes for all scenarios

---

## Testing Strategy

### Unit Tests
- ✅ VerifyData client functions
- ✅ Field matching logic
- ✅ Company name normalization
- ✅ RC number normalization
- ✅ Date parsing
- ✅ Error handling

### Ikey to frontend
- ✅ Never log secret key (even masked)
- ✅ Validate secret key on server startup

### 2. Data Encryption
- ✅ Encrypt CAC numbers at rest (same as NIN)
- ✅ Use existing AES-256-GCM encryption
- ✅ Decrypt only in memory for API calls
- ✅ Clear decrypted values after use

### 3. Audit Logging
- ✅ Log all CAC verification attempts
- ✅ Log all API calls (with masked RC numbers)
- ✅ Log field matching results
- ✅ Store logs in Firestore: `verification-audit-logs`

### 4. Rate Limiting
- ✅ Implement rate licryption/decryption
7. Audit logging
8. Notifications

### Phase 7: Documentation (1 hour)
**Files to Update**:
- `docs/API_DOCUMENTATION.md` - Add VerifyData API docs
- `docs/ADMIN_USER_GUIDE.md` - Add CAC verification guide
- `docs/BROKER_TRAINING_GUIDE.md` - Add CAC data requirements
- `.kiro/specs/identity-remediation/VERIFYDATA_INTEGRATION_SUMMARY.md` - New doc

---

## Security Considerations

### 1. Credential Management
- ✅ Store `VERIFYDATA_SECRET_KEY` in environment variables
- ✅ Never expose secret ();
  const result = await verifydataClient.verifyCAC(decryptedCAC);
  // ... handle result
}
```

### Phase 6: Integration Testing (2-3 hours)
**Test Files**:
- `src/__tests__/cac/verifydataClient.test.ts`
- `src/__tests__/cac/fieldMatching.test.ts`
- `src/__tests__/cac/verificationFlow.test.ts`
- `src/__tests__/cac/integration.test.ts`

**Test Scenarios**:
1. End-to-end CAC verification flow
2. Bulk CAC verification
3. Error scenarios (all error codes)
4. Field matching (all variations)
5. Rate limiting
6. Entions

2. `POST /api/identity/lists/:listId/bulk-verify`
   - Add CAC verification logic
   - Process CAC entries separately
   - Use VerifyData rate limiter
   - Track CAC API calls

**Logic Pattern**:
```javascript
if (verificationType === 'NIN') {
  // Use dataproClient.verifyNIN()
  await applyDataproRateLimit();
  const result = await dataproClient.verifyNIN(decryptedNIN);
  // ... handle result
} else if (verificationType === 'CAC') {
  // Use verifydataClient.verifyCAC()
  await applyVerifydataRateLimitnges**:
1. Add `applyVerifydataRateLimit()` function
2. Same pattern as `applyDataproRateLimit()`
3. Max 50 requests per minute (adjust based on VerifyData limits)
4. Use separate rate limit bucket for VerifyData

### Phase 5: Update Server Endpoints (2-3 hours)
**File**: `server.js`

**Endpoints to Update**:
1. `POST /api/identity/verify/:token`
   - Add CAC verification branch
   - Decrypt CAC number
   - Call `verifydataClient.verifyCAC()`
   - Perform field matching
   - Store results
   - Send notificahing (all variations)
- Company name normalization
- RC number normalization
- Date parsing

### Phase 3: Update Configuration (30 minutes)
**Files**:
- `src/config/verificationConfig.ts`
- `.env.local`
- `.env.example`
- `backend-package/.env.example`

**Changes**:
1. Add VerifyData config interface
2. Add environment variables
3. Add validation for VerifyData credentials
4. Update `hasRequiredCredentials()` function

### Phase 4: Update Rate Limiter (30 minutes)
**File**: `server-utils/rateLimiter.cjs`

**Chath backoff

### Phase 2: Create Mock and Tests (1-2 hours)
**Files**:
- `server-services/__mocks__/verifydataClient.cjs`
- `server-services/__tests__/verifydataClient.test.cjs`

**Mock Scenarios**:
1. Successful verification with matching fields
2. CAC not found
3. Invalid secret key (FF)
4. Insufficient balance (IB)
5. Network errors
6. Timeout errors
7. Field mismatches (company name, RC number, date)

**Test Coverage**:
- All success scenarios
- All error codes
- Retry logic
- Timeout handling
- Field matcies)
- 30-second timeout
- Comprehensive error handling for all status codes
- Structured logging with masked RC numbers
- Response parsing and validation

**Error Handling**:
- HTTP 200 + success: true → Success
- HTTP 200 + success: false → CAC not found
- HTTP 400 + statusCode "FF" → Invalid secret key
- HTTP 400 + statusCode "IB" → Insufficient balance
- HTTP 400 + statusCode "BR" → Contact administrator
- HTTP 400 + statusCode "EE" → No active service
- HTTP 500 → Server error
- Network errors → Retry wilds(apiData, excelData)` - Field matching logic
4. `normalizeCompanyName(name)` - Company name normalization
5. `normalizeRCNumber(rcNumber)` - RC number normalization
6. `parseRegistrationDate(date)` - Date parsing (reuse from Datapro)
7. `getUserFriendlyError(statusCode, details)` - Error messages
8. `getTechnicalError(statusCode, details)` - Technical error details

**Key Features**:
- POST request with JSON body
- Secret key in request body (not header)
- Retry logic with exponential backoff (max 3 retr"RC" prefix
  - Remove spaces and dashes
  - Convert to uppercase
  - Trim whitespace

parseRegistrationDate(dateStr)
  - Reuse existing parseDate() function
  - Handle ISO 8601 format
  - Return YYYY-MM-DD format
```

---

## Implementation Tasks

### Phase 1: Create VerifyData Client (2-3 hours)
**File**: `server-services/verifydataClient.cjs`

**Functions to implement**:
1. `verifyCAC(rcNumber)` - Main verification function
2. `maskRCNumber(rcNumber)` - Mask for logging (show first 4 chars)
3. `matchCACFieISO 8601
   - Same date parsing logic as NIN DOB

4. **Company Status** (validation)
   - Must be "Verified" or similar active status
   - Reject if "Dissolved", "Inactive", etc.

5. **Type of Entity** (optional)
   - Store for reference
   - Not used in matching

### Normalization Functions Needed
```javascript
normalizeCompanyName(name)
  - Convert to lowercase
  - Trim whitespace
  - Replace "limited" with "ltd"
  - Replace "plc" variations
  - Remove extra spaces

normalizeRCNumber(rcNumber)
  - Remove tegy

### Fields to Match (from VerifyData response)
1. **Company Name** (required)
   - Normalize: "ABC Ltd" === "ABC Limited" === "ABC LTD"
   - Case-insensitive comparison
   - Trim whitespace
   - Handle variations: Ltd, Limited, PLC, Plc, etc.

2. **Registration Number** (required)
   - Normalize: "RC123456" === "123456"
   - Remove "RC" prefix if present
   - Exact match after normalization

3. **Registration Date** (required)
   - Flexible format matching
   - Support: DD/MM/YYYY, DD-MMM-YYYY, YYYY-MM-DD, - Add `VERIFYDATA_SECRET_KEY`

### 🆕 New Components to Create
1. **VerifyData Client** (`server-services/verifydataClient.cjs`)
   - Main API client for CAC verification
   - Mirror structure of `dataproClient.cjs`

2. **VerifyData Mock** (`server-services/__mocks__/verifydataClient.cjs`)
   - Mock for testing
   - Realistic test data

3. **VerifyData Tests** (`server-services/__tests__/verifydataClient.test.cjs`)
   - Unit tests for CAC client
   - Mirror Datapro test structure

---

## Field Matching Stras to Modify
1. **Rate Limiter** (`server-utils/rateLimiter.cjs`)
   - Add `applyVerifydataRateLimit()` function
   - Same pattern as Datapro rate limiter

2. **Verification Config** (`src/config/verificationConfig.ts`)
   - Add VerifyData API URL and secret key fields

3. **Server Endpoints** (`server.js`)
   - Add CAC verification logic to existing endpoints
   - Route to VerifyData client based on verificationType

4. **Environment Variables** (`.env.local`, `.env.example`)
   - Add `VERIFYDATA_API_URL`
   Handling Framework** (`src/utils/verificationErrors.ts`)
   - Reuse same error message patterns
   - Add VerifyData-specific error codes

### 🔧 Component** (`server-utils/apiUsageTracker.cjs`)
   - Track CAC API calls
   - Same cost monitoring

6. **Security Middleware** (`server-utils/securityMiddleware.cjs`)
   - Same authentication/authorization
   - Same NDPR compliance

7. **All UI Components**
   - No changes needed - already support CAC type
   - Upload dialog, list detail, verification page all ready

8. **Email Templates** (`src/templates/verificationEmail.ts`)
   - Already support CAC type
   - Dynamic content based on verificationType

9. **Error .cjs`)
   - Encrypt CAC numbers same as NIN
   - Same AES-256-GCM algorithm
   - Same IV generation

2. **Audit Logging** (`server-utils/auditLogger.cjs`)
   - Log CAC verifications with same format
   - Track all API calls

3. **Queue System** (`server-utils/verificationQueue.cjs`)
   - Queue CAC verifications during bulk processing
   - Same queue management logic

4. **Health Monitoring** (`server-utils/healthMonitor.cjs`)
   - Monitor VerifyData API health
   - Same health check patterns

5. **API Usage Trackinges)
1. **Encryption** (`server-utils/encryptionsponseData` | `success` + `data` |
| **Success Code** | `ResponseCode: "00"` | `statusCode: 200` + `success: true` |
| **Data Type** | Individual (names, DOB, gender) | Company (name, RC number, reg date) |
| **Field Matching** | First/Last Name, DOB, Gender | Company Name, RC Number, Reg Date |

---

## Infrastructure Reuse Analysis

### ✅ Components to Reuse (No Chang`secretKey`) |
| **Request Format** | Query param `?regNo={NIN}` | JSON body `{rcNumber, secretKey}` |
| **Response Structure** | `ResponseInfo` + `Reerver error

---

## Comparison: Datapro NIN vs VerifyData CAC

| Aspect | Datapro NIN | VerifyData CAC |
|--------|-------------|----------------|
| **Method** | GET | POST |
| **Auth Location** | Header (`SERVICEID`) | Body ( StatusCode "IB"**: Insufficient wallet balance
- **HTTP 400 - StatusCode "BR"**: Contact administrator
- **HTTP 400 - StatusCode "EE"**: No active service
- **HTTP 500**: SionDate": "2024-04-23",
    "natureOfBusiness": null,
    "amlReport": null,
    "adverseMediaReport": null
  },
  "links": []
}
```

### Error Responses
- **HTTP 400 - StatusCode "FF"**: Invalid secret key or not authorized
- **HTTP 400 -"2026-02-06T10:47:36.001Z",
    "typeOfEntity": "PRIVATE_COMPANY_LIMITED_BY_SHARES",
    "registrat"registrationNumber": "RC123456",
    "companyStatus": "Verified",
    "requestedAt": "2026-02-06T10:47:35.775Z",
    "country": "Nigeria",
    "createdAt": "2026-02-06T10:47:36.001Z",
    "lastModifiedAt": ull,
    "isConsent": true,
    "type": "basic_company_check",
    "searchTerm": "RC123456",
    "name": "TEST COMPANY LTD",
    {
    "id": "217383828",
    "status": "found",
    "businessId": "328973289",
    "parentId": n
### Request Format
```json
{
  "rcNumber": "RC123456",
  "secretKey": "your_secret_key_here"
}
```

### Response Format (Success - HTTP 200)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "success",
  "data": api/ValidateRcNumber/Initiate`
- **Method**: POST
- **Authentication**: Secret Key in request body
- **Purpose**: Verify Nigerian company registration numbers (RC numbers)
structure, ensuring consistency, maintainability, and enterprise-grade quality.

---

## API Specifications

### VerifyData CAC API
- **Provider**: VerifyData (villextra.com)
- **Base URL**: `https://vd.villextra.com`
- **Endpoint**: `/orate Affairs Commission) verification API into the existing identity remediation system. The implementation leverages 90% of the existing Datapro NIN verification infraion)

---

## Executive Summary

This document outlines the implementation plan for integrating VerifyData's CAC (Corp-3 days (senior developer)  
**Risk Level**: Low (90% code reuse from Datapro NIN implementatta API Integration

**Status**: Planning Phase  
**Priority**: High  
**Estimated Effort**: 2on Plan
## VerifyDaification Implementati# CAC Ver