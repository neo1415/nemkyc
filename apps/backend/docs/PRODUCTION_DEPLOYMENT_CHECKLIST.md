# Production Deployment Checklist

## Pre-Deployment Verification

### Environment Variables
- [ ] **DATAPRO_SERVICE_ID** is set in production environment
  - Verify value is correct merchant ID from Datapro
  - Test that value is not empty or placeholder
  - Confirm value matches Datapro account credentials

- [ ] **ENCRYPTION_KEY** is set in production environment
  - Verify key is 32-byte hex string (64 characters)
  - Confirm key is unique and not from documentation/examples
  - Test encryption/decryption works with the key
  - Ensure key is stored securely (not in code repository)

- [ ] **DATAPRO_API_URL** is set correctly
  - Default: `https://api.datapronigeria.com`
  - Verify URL is accessible from production server

- [ ] **NODE_ENV** is set to `production`

- [ ] **Firebase credentials** are configured
  - Service account JSON is available
  - Firestore database is accessible
  - Storage bucket is configured

### Code Quality & Testing
- [ ] **All unit tests pass**
  ```bash
  npm test -- --run
  ```
  - Encryption tests pass
  - Datapro client tests pass
  - Field matching tests pass
  - Integration tests pass

- [ ] **All property-based tests pass**
  - Property 29: Encryption Reversibility
  - Property 30: Field Matching Consistency
  - Property 31: Date Format Flexibility

- [ ] **No TypeScript errors**
  ```bash
  npm run build
  ```

- [ ] **No linting errors**
  ```bash
  npm run lint
  ```

### Security Audit
- [ ] **Security audit complete**
  - Review `.kiro/specs/identity-remediation/SECURITY_AUDIT_REPORT.md`
  - All critical issues resolved
  - All high-priority issues resolved
  - Medium/low issues documented with mitigation plans

- [ ] **Encryption implementation verified**
  - AES-256-GCM encryption in use
  - IV (initialization vector) is unique per encryption
  - Encrypted data includes IV for decryption
  - No plaintext identity numbers in database

- [ ] **API credentials secured**
  - DATAPRO_SERVICE_ID never exposed to frontend
  - No credentials in client-side code
  - No credentials in logs
  - Environment variables properly configured

- [ ] **Audit logging enabled**
  - All verification attempts logged
  - All API calls logged (with masked data)
  - All encryption/decryption operations logged
  - Logs stored in Firestore: `verification-audit-logs`

- [ ] **Rate limiting configured**
  - Datapro API rate limiter: max 50 requests/minute
  - Verification endpoint rate limiting enabled
  - Queue system operational for overflow requests

### Database Preparation
- [ ] **Database backup completed**
  - Export Firestore collections:
    - `identity-lists`
    - `identity-entries`
    - `identity-logs`
    - `users`
  - Store backup in secure location
  - Document backup timestamp and location
  - Test backup restoration procedure

- [ ] **Firestore security rules deployed**
  - Rules allow encrypted field writes only from backend
  - Rules enforce role-based access control
  - Rules tested with different user roles

- [ ] **Firestore indexes created**
  - Check `firestore.indexes.json` is deployed
  - Verify all required indexes exist

### Configuration Verification
- [ ] **Verification mode set correctly**
  - Check `src/config/verificationConfig.ts`
  - Mode should be `'datapro'` for production
  - Confirm mock mode is disabled

- [ ] **Server startup validation passes**
  - Server checks for DATAPRO_SERVICE_ID
  - Server checks for ENCRYPTION_KEY
  - Server logs warnings if credentials missing
  - Server prevents start if production mode without credentials

### Monitoring & Alerting
- [ ] **Health monitoring configured**
  - API health checks enabled (ping every 5 minutes)
  - Health status displayed in admin dashboard
  - Alerts configured for API downtime

- [ ] **Error rate monitoring configured**
  - Success/failure rates tracked
  - Alerts configured for error rate > 10%
  - Metrics displayed in admin dashboard

- [ ] **Cost monitoring configured**
  - API call tracking enabled
  - Cost projections calculated
  - Alerts configured for budget limits
  - Usage stats visible in admin dashboard

### Documentation
- [ ] **API documentation updated**
  - Datapro integration documented
  - Encryption approach documented
  - Error handling documented
  - Field matching logic documented

- [ ] **User guides available**
  - Admin user guide complete
  - Broker training materials complete
  - Customer support documentation ready

- [ ] **Deployment procedures documented**
  - Deployment steps clearly defined
  - Rollback plan documented
  - Emergency contacts listed

## Deployment Steps

### 1. Pre-Deployment
- [ ] Notify stakeholders of deployment window
- [ ] Schedule maintenance window if needed
- [ ] Prepare rollback plan
- [ ] Ensure backup is recent (< 24 hours old)

### 2. Deployment
- [ ] Deploy code to production server
- [ ] Set environment variables
- [ ] Restart application server
- [ ] Verify server starts successfully
- [ ] Check logs for startup errors

### 3. Post-Deployment Verification
- [ ] **Smoke tests**
  - [ ] Application loads successfully
  - [ ] Login works for all user roles
  - [ ] Identity lists dashboard accessible
  - [ ] Upload dialog opens
  - [ ] Template download works

- [ ] **Verification flow test**
  - [ ] Upload test list (small, 5-10 entries)
  - [ ] Send verification request
  - [ ] Customer page loads with token
  - [ ] Submit test NIN (if available)
  - [ ] Verify Datapro API is called
  - [ ] Check verification result stored correctly

- [ ] **Monitoring checks**
  - [ ] Health check shows API is up
  - [ ] Error rate is 0% or acceptable
  - [ ] API call tracking is working
  - [ ] Audit logs are being created

### 4. First 24 Hours Monitoring
- [ ] Monitor error rates every hour
- [ ] Monitor API call counts
- [ ] Monitor response times
- [ ] Check for any security alerts
- [ ] Review audit logs for anomalies
- [ ] Respond to any user-reported issues

## Rollback Criteria

Initiate rollback if any of the following occur:
- [ ] Error rate exceeds 25% for more than 15 minutes
- [ ] Datapro API consistently returns errors (> 50% failure rate)
- [ ] Security vulnerability discovered
- [ ] Data corruption detected
- [ ] Critical functionality broken
- [ ] Performance degradation (response time > 10 seconds)

## Sign-Off

- [ ] **Technical Lead**: _________________ Date: _______
- [ ] **Security Officer**: _________________ Date: _______
- [ ] **Product Owner**: _________________ Date: _______
- [ ] **Operations**: _________________ Date: _______

## Notes

- This checklist should be completed before production deployment
- All items must be checked before proceeding
- Document any deviations or issues in the notes section below
- Keep this checklist with deployment records

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Deployment Notes**:
