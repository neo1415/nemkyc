# Datapro NIN Verification API Integration - Summary

## Overview

This document summarizes the comprehensive plan for integrating the Datapro API for real NIN verification in the Identity Remediation system. The integration is designed to be **enterprise-ready**, **NDPR-compliant**, and **secure**.

## What You Asked For

✅ **Real NIN Verification**: Replace mock verification with Datapro API  
✅ **NDPR Compliance**: Encrypt all PII (NIN/BVN/CAC) at rest  
✅ **Backend-Only Security**: Never expose API keys or plaintext data to frontend  
✅ **Field Validation**: Match against Excel data (First Name, Last Name, Gender, DOB)  
✅ **Flexible Phone Matching**: Loose validation (people change numbers)  
✅ **User-Friendly Errors**: Clear, actionable messages for customers  
✅ **Technical Errors for Staff**: Detailed information for debugging  
✅ **Bulk Verification**: Process multiple NIns efficiently  
✅ **No Lint/Type Errors**: Clean, type-safe implementation  
✅ **Comprehensive Testing**: Unit, integration, and property-based tests  

## Key Features

### 1. Security & NDPR Compliance
- **AES-256-GCM Encryption**: All NIns/BVNs/CACs encrypted at rest
- **Unique IVs**: Each encryption uses a unique initialization vector
- **Environment Variables**: Encryption keys and API credentials never in code
- **Memory Safety**: Decrypt only in memory, clear immediately after use
- **No Logging**: Never log plaintext identity numbers
- **Audit Trail**: Comprehensive logging of all operations (with masked data)

### 2. Datapro API Integration
- **Base URL**: `https://api.datapronigeria.com`
- **Endpoint**: `/verifynin/?regNo={NIN}`
- **Authentication**: `SERVICEID` header (your merchant ID)
- **Response Handling**: Parse ResponseInfo and ResponseData
- **Error Codes**: Handle 200, 400, 401, 87, 88
- **Retry Logic**: 3 attempts with exponential backoff
- **Timeout**: 30 seconds per request
- **Rate Limiting**: Max 50 requests per minute

### 3. Field Validation
**Validated Fields** (from Datapro API vs Excel):
- ✅ First Name (case-insensitive, whitespace trimmed)
- ✅ Last Name (case-insensitive, whitespace trimmed)
- ✅ Gender (normalized: M/Male → male, F/Female → female)
- ✅ Date of Birth (flexible formats: DD/MM/YYYY, DD-MMM-YYYY, YYYY-MM-DD)
- ⚠️ Phone Number (optional, loose matching - people change numbers)

**NOT Validated**:
- ❌ Middle Name (not in Excel template)

### 4. Error Handling

**Customer-Facing Messages** (user-friendly):
- "Invalid NIN format. Please check and try again."
- "NIN not found. Please verify your NIN and try again."
- "The information provided does not match our records. Please contact your broker."
- "Verification service unavailable. Please contact support."
- "Network error. Please try again later."

**Staff-Facing Messages** (technical):
- Full error details
- Failed fields list
- API response codes
- Stack traces
- Link to entry in admin portal

### 5. Bulk Verification
- Process in batches of 10 concurrent requests
- 1-second delay between batches (rate limiting)
- Skip already-verified entries
- Track progress (X of Y processed)
- Return detailed summary: `{ processed, verified, failed, skipped }`
- Pause/resume functionality

### 6. Performance Optimization
- **Caching**: Cache successful verifications for 24 hours
- **Request Queuing**: Queue requests when rate limit reached
- **Exponential Backoff**: Retry with increasing delays
- **Response Time Monitoring**: Alert if > 5 seconds average

### 7. Monitoring & Alerting
- **Health Checks**: Ping API every 5 minutes
- **Success Rate Tracking**: Alert if < 90%
- **Error Rate Monitoring**: Track by error code
- **Usage Tracking**: Daily/monthly API call counts
- **Cost Estimation**: Project monthly costs
- **Dashboard**: Real-time status indicators

## Implementation Plan

The integration is broken down into **14 major tasks** (43-56) with **70+ subtasks**:

### Phase 1: Security Foundation (Tasks 43-44)
- Implement AES-256-GCM encryption utility
- Encrypt NIns/BVNs/CACs before storage
- Configure Datapro API credentials
- Validate configuration on startup

### Phase 2: API Integration (Tasks 45-46)
- Create Datapro API client
- Implement response parsing
- Implement field matching logic
- Update verification endpoints
- Add rate limiting

### Phase 3: Error Handling (Task 47)
- Create error message templates
- Update email templates
- Implement notification logic

### Phase 4: UI Updates (Task 48)
- Update list detail table
- Create verification details dialog
- Add retry button
- Update customer verification page

### Phase 5: Testing (Task 49)
- Unit tests (encryption, API client, field matching)
- Integration tests (end-to-end flows)
- Property-based tests (encryption, field matching, date formats)

### Phase 6: Security & Performance (Tasks 50-51)
- Security code review
- Audit logging
- Caching implementation
- Bulk verification optimization

### Phase 7: Monitoring & Documentation (Tasks 52-53)
- Health checks
- Error rate monitoring
- Cost tracking
- API documentation
- User guides

### Phase 8: Deployment (Tasks 54-56)
- Deployment checklist
- Rollback plan
- Load testing
- Production launch
- Post-launch monitoring

## Environment Variables Required

Add these to your `.env.local` and `.env.production`:

```bash
# Datapro API Configuration
DATAPRO_SERVICE_ID=your_merchant_id_from_datapro
DATAPRO_API_URL=https://api.datapronigeria.com

# Encryption Configuration (NDPR Compliance)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_character_hex_string_here

# Verification Mode
VERIFICATION_MODE=mock  # Change to 'datapro' for production
```

## Data Flow

### Upload Flow
```
1. Broker uploads Excel → Backend parses
2. Backend encrypts NIN with AES-256-GCM
3. Backend stores encrypted NIN + IV in Firestore
4. Plaintext NIN never stored
```

### Verification Flow
```
1. Customer enters NIN → Backend receives
2. Backend decrypts stored NIN from Firestore
3. Backend calls Datapro API with decrypted NIN
4. Backend receives ResponseData from Datapro
5. Backend validates fields (First Name, Last Name, Gender, DOB)
6. Backend stores results in entry.verificationDetails
7. Backend updates entry status (verified/failed)
8. Backend sends notifications (customer + staff)
9. Backend clears decrypted NIN from memory
10. Backend returns result to frontend
```

## Security Guarantees

✅ **No Plaintext Storage**: All NIns encrypted at rest  
✅ **No Frontend Exposure**: API keys never sent to client  
✅ **No Logging**: Plaintext NIns never logged  
✅ **Memory Safety**: Decrypted values cleared immediately  
✅ **Audit Trail**: All operations logged (with masked data)  
✅ **Rate Limiting**: Prevent abuse and cost overruns  
✅ **HTTPS Only**: All API calls over secure connection  
✅ **Environment Variables**: Credentials in env, never in code  

## Testing Strategy

### Unit Tests
- Encryption/decryption round-trip
- Field matching (names, gender, dates, phone)
- Error message mapping
- Rate limiting
- Cache operations

### Integration Tests
- End-to-end verification flow
- Bulk verification
- Error scenarios (all error codes)
- Notification sending
- Audit logging

### Property-Based Tests
- **Property 29**: Encryption reversibility (encrypt → decrypt = original)
- **Property 30**: Field matching consistency (identical names always match)
- **Property 31**: Date format flexibility (same date in different formats matches)

## Deployment Checklist

Before deploying to production:

- [ ] Set `DATAPRO_SERVICE_ID` environment variable
- [ ] Set `ENCRYPTION_KEY` environment variable (32-byte hex)
- [ ] Run database backup
- [ ] Run encryption migration script for existing data
- [ ] Update `verificationConfig.mode` to `'datapro'`
- [ ] Run all tests (unit, integration, property-based)
- [ ] Complete security audit
- [ ] Set up monitoring and alerts
- [ ] Load test with 100 concurrent verifications
- [ ] Prepare rollback plan
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Gather feedback

## Rollback Plan

If issues arise:

1. **Immediate**: Switch `VERIFICATION_MODE=mock` in environment
2. **Restart server**: Changes take effect immediately
3. **Monitor**: Verify mock mode is working
4. **Investigate**: Review logs and error reports
5. **Fix**: Address issues in development
6. **Redeploy**: When ready, switch back to `datapro` mode

## Cost Considerations

- **API Calls**: Track daily/monthly usage
- **Caching**: Reduce duplicate calls (24-hour cache)
- **Rate Limiting**: Prevent accidental overages
- **Monitoring**: Alert at 80% of monthly limit
- **Cost Dashboard**: Real-time cost projections

## Next Steps

1. **Review this plan** with your team
2. **Obtain Datapro credentials** (SERVICEID)
3. **Generate encryption key** (32-byte hex)
4. **Start with Task 43** (Encryption implementation)
5. **Test thoroughly** before production
6. **Deploy incrementally** (staging → production)
7. **Monitor closely** for first 24 hours

## Questions to Answer

Before starting implementation:

1. **Do you have the Datapro SERVICEID?** (Contact devops@datapronigeria.net)
2. **What is your monthly API call budget?** (For rate limiting)
3. **Who should receive error notifications?** (Email addresses for staff)
4. **What is your deployment timeline?** (When do you need this live?)
5. **Do you have a staging environment?** (For testing before production)

## Support

If you need help during implementation:

- **Datapro Support**: devops@datapronigeria.net
- **API Documentation**: Contact Datapro for full API docs
- **Security Questions**: Review NDPR compliance requirements
- **Technical Issues**: Check audit logs and error messages

---

**This integration is designed to be production-ready, secure, and compliant. All tasks are clearly defined with acceptance criteria and testing requirements. You can execute this plan with confidence.**

