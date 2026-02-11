# CAC Verification Implementation Summary

**Status**: Ready for Implementation  
**Phase**: Phase 4 - VerifyData CAC Integration  
**Estimated Effort**: 1.5-2 days (senior developer)  
**Code Reuse**: 90% from Datapro NIN implementation  

---

## Quick Overview

We're adding CAC (Corporate Affairs Commission) verification using VerifyData API. The implementation leverages 90% of the existing Datapro NIN infrastructure, ensuring consistency and minimizing new code.

---

## Key Differences: Datapro NIN vs VerifyData CAC

| Aspect | Datapro (NIN) | VerifyData (CAC) |
|--------|---------------|------------------|
| **Method** | GET | POST |
| **Auth** | Header: `SERVICEID` | Body: `secretKey` |
| **Request** | Query param: `?regNo={NIN}` | JSON: `{rcNumber, secretKey}` |
| **Response** | `ResponseInfo` + `ResponseData` | `success` + `data` |
| **Data** | Individual (names, DOB) | Company (name, RC#, date) |
| **Matching** | First/Last Name, DOB, Gender | Company Name, RC#, Reg Date |

---

## What We're Reusing (No Changes Needed)

✅ **Encryption** (`server-utils/encryption.cjs`)  
✅ **Audit Logging** (`server-utils/auditLogger.cjs`)  
✅ **Queue System** (`server-utils/verificationQueue.cjs`)  
✅ **Health Monitoring** (`server-utils/healthMonitor.cjs`)  
✅ **API Usage Tracking** (`server-utils/apiUsageTracker.cjs`)  
✅ **Security Middleware** (`server-utils/securityMiddleware.cjs`)  
✅ **All UI Components** (already support CAC type)  
✅ **Email Templates** (already support CAC type)  
✅ **Error Framework** (`src/utils/verificationErrors.ts`)  

---

## What We're Creating (New Files)

### 1. VerifyData Client
**File**: `server-services/verifydataClient.cjs`  
**Purpose**: Main API client for CAC verification  
**Pattern**: Mirror `dataproClient.cjs` structure  

**Key Functions**:
- `verifyCAC(rcNumber)` - Main verification
- `maskRCNumber(rcNumber)` - Logging safety
- `matchCACFields(apiData, excelData)` - Field matching
- `normalizeCompanyName(name)` - Handle Ltd/Limited/PLC
- `normalizeRCNumber(rcNumber)` - Remove RC prefix

### 2. VerifyData Mock
**File**: `server-services/__mocks__/verifydataClient.cjs`  
**Purpose**: Testing mock  
**Pattern**: Mirror Datapro mock  

### 3. VerifyData Tests
**File**: `server-services/__tests__/verifydataClient.test.cjs`  
**Purpose**: Unit tests  
**Pattern**: Mirror Datapro tests  

---

## What We're Modifying (Small Changes)

### 1. Verification Config
**File**: `src/config/verificationConfig.ts`  
**Change**: Add VerifyData URL and secret key fields  

### 2. Rate Limiter
**File**: `server-utils/rateLimiter.cjs`  
**Change**: Add `applyVerifydataRateLimit()` function  

### 3. Server Endpoints
**File**: `server.js`  
**Change**: Add CAC verification routing  
```javascript
if (verificationType === 'NIN') {
  await applyDataproRateLimit();
  result = await dataproClient.verifyNIN(nin);
} else if (verificationType === 'CAC') {
  await applyVerifydataRateLimit();
  result = await verifydataClient.verifyCAC(cac);
}
```

### 4. Environment Variables
**Files**: `.env.local`, `.env.example`  
**Change**: Add VerifyData credentials  
```
VERIFYDATA_API_URL=https://vd.villextra.com
VERIFYDATA_SECRET_KEY=your_secret_key_here
```

---

## Field Matching Strategy

### Company Name Matching
- **Normalize**: "ABC Ltd" === "ABC Limited" === "ABC LTD"
- **Case-insensitive**: "ABC" === "abc"
- **Trim whitespace**: " ABC " === "ABC"

### RC Number Matching
- **Normalize prefix**: "RC123456" === "123456"
- **Case-insensitive**: "RC123456" === "rc123456"
- **Exact match** after normalization

### Registration Date Matching
- **Flexible formats**: DD/MM/YYYY, DD-MMM-YYYY, YYYY-MM-DD, ISO 8601
- **Reuse** existing `parseDate()` function from Datapro

### Company Status Validation
- **Must be**: "Verified" or similar active status
- **Reject**: "Dissolved", "Inactive", etc.

---

## Implementation Tasks (10 Tasks)

### Phase 1: Create VerifyData Client (Tasks 56)
- 56.1: Create API client
- 56.2: Implement utility functions
- 56.3: Implement field matching
- 56.4: Implement error handling
- 56.5: Add logging

### Phase 2: Create Mock and Tests (Task 57)
- 57.1: Create mock
- 57.2: Write client tests
- 57.3: Write field matching tests

### Phase 3: Update Configuration (Task 58)
- 58.1: Update verification config
- 58.2: Update environment variables
- 58.3: Validate configuration

### Phase 4: Update Rate Limiter (Task 59)
- 59.1: Add VerifyData rate limiting

### Phase 5: Update Server Endpoints (Task 60)
- 60.1: Update customer verification endpoint
- 60.2: Update bulk verification endpoint
- 60.3: Add routing logic

### Phase 6: Update Monitoring (Task 61)
- 61.1: Add health checks
- 61.2: Add usage tracking

### Phase 7: Integration Testing (Task 62)
- 62.1: Create integration tests
- 62.2: Test workflow
- 62.3: Test error scenarios
- 62.4: Test mixed NIN/CAC lists

### Phase 8: Documentation (Task 63)
- 63.1: Update API docs
- 63.2: Update admin guide
- 63.3: Update broker training
- 63.4: Create integration summary

### Phase 9: Final Testing (Task 64)
- 64.1: Test complete workflow
- 64.2: Test security
- 64.3: Test performance
- 64.4: Test with production API

### Phase 10: Production Launch (Task 65)
- 65.1: Deploy to production
- 65.2: Monitor first 24 hours
- 65.3: Gather feedback

---

## Security Checklist

- [ ] CAC numbers encrypted at rest (AES-256-GCM)
- [ ] VERIFYDATA_SECRET_KEY in environment variables only
- [ ] Secret key never exposed to frontend
- [ ] Secret key never logged (even masked)
- [ ] RC numbers masked in logs (first 4 chars only)
- [ ] Audit logs for all CAC verifications
- [ ] Rate limiting for VerifyData API
- [ ] Same NDPR compliance as NIN verification

---

## Testing Checklist

- [ ] Unit tests for VerifyData client
- [ ] Unit tests for CAC field matching
- [ ] Integration tests for CAC workflow
- [ ] Test all error scenarios
- [ ] Test mixed NIN/CAC lists
- [ ] Test with mock API
- [ ] Test with production API (if credentials available)
- [ ] Security testing (encryption, logging, etc.)
- [ ] Performance testing (single + bulk)

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Code review complete
- [ ] Security audit complete
- [ ] Documentation updated
- [ ] VERIFYDATA_SECRET_KEY obtained from client
- [ ] VERIFYDATA_API_URL configured
- [ ] Backup database
- [ ] Deploy to staging
- [ ] Test with real API
- [ ] Deploy to production
- [ ] Monitor for 24 hours

---

## Success Criteria

### Functional
- ✅ CAC verification works end-to-end
- ✅ Field matching accurate (>95%)
- ✅ Error handling comprehensive
- ✅ Bulk verification efficient
- ✅ Notifications sent correctly

### Non-Functional
- ✅ Response time < 5 seconds (95th percentile)
- ✅ Uptime > 99.5%
- ✅ Zero data breaches
- ✅ NDPR compliant
- ✅ All tests passing

---

## Risk Mitigation

| Risk | Mitigation | Impact |
|------|------------|--------|
| VerifyData API downtime | Health monitoring, fallback to mock | Low |
| Field matching inaccuracies | Comprehensive normalization | Medium |
| Rate limit exceeded | Queue system, rate limiter | Low |
| Secret key exposure | Environment variables, never log | Critical |
| Data encryption failure | Comprehensive testing | Critical |

---

## Next Steps

1. ✅ **Review this plan** with team/client
2. ⏳ **Obtain VerifyData credentials** from NEM Insurance (email sent)
3. ⏳ **Begin implementation** following tasks 56-65 in tasks.md
4. ⏳ **Test thoroughly** at each phase
5. ⏳ **Deploy to staging** for client review
6. ⏳ **Deploy to production** after approval

---

## Key Advantages

1. **Consistency**: Same patterns as NIN verification
2. **Maintainability**: One codebase, two APIs
3. **Security**: Same NDPR-compliant encryption
4. **Monitoring**: Same audit trails and health checks
5. **UX**: No UI changes needed
6. **Testing**: Reuse test infrastructure
7. **Speed**: 90% code reuse = faster implementation
8. **Quality**: Proven patterns = lower risk

---

## File Structure

### New Files (3)
```
server-services/
  verifydataClient.cjs          # Main CAC client
  __mocks__/
    verifydataClient.cjs        # Mock for testing
  __tests__/
    verifydataClient.test.cjs   # Unit tests
```

### Modified Files (5)
```
server.js                                    # Add CAC routing
src/config/verificationConfig.ts            # Add VerifyData config
server-utils/rateLimiter.cjs                # Add VerifyData rate limiter
.env.local                                  # Add credentials
.env.example                                # Document variables
```

### Reused Files (20+)
```
server-utils/encryption.cjs                 # Encrypt CAC
server-utils/auditLogger.cjs                # Log CAC
server-utils/verificationQueue.cjs          # Queue CAC
server-utils/healthMonitor.cjs              # Monitor VerifyData
server-utils/apiUsageTracker.cjs            # Track CAC calls
... (all other infrastructure)
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-07  
**Status**: Ready for Implementation  
**Tasks**: See tasks.md (Tasks 56-65)
