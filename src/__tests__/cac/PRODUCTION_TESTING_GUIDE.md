# CAC Verification Production Testing Guide

## Task 64.4: Test CAC with Production Credentials

This guide provides instructions for testing CAC verification with real VerifyData API credentials.

## Prerequisites

### 1. Obtain Test Credentials from NEM Insurance

Contact NEM Insurance to obtain:
- **VERIFYDATA_SECRET_KEY**: Your merchant secret key for VerifyData API
- **Test RC Numbers**: A list of valid RC numbers for testing (if available)
- **API Documentation**: Latest VerifyData API documentation

### 2. Configure Environment Variables

Add the following to your `.env.production` file:

```env
# VerifyData CAC Verification API
VERIFYDATA_API_URL=https://vd.villextra.com
VERIFYDATA_SECRET_KEY=your-secret-key-here

# Encryption Key (32 bytes in hex = 64 characters)
ENCRYPTION_KEY=your-encryption-key-here
```

**IMPORTANT**: Never commit these credentials to version control!

### 3. Verify Configuration

Run the configuration validation script:

```bash
node -e "
const secretKey = process.env.VERIFYDATA_SECRET_KEY;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!secretKey) {
  console.error('❌ VERIFYDATA_SECRET_KEY not set');
  process.exit(1);
}

if (!encryptionKey) {
  console.error('❌ ENCRYPTION_KEY not set');
  process.exit(1);
}

if (encryptionKey.length !== 64) {
  console.error('❌ ENCRYPTION_KEY must be 64 characters (32 bytes in hex)');
  process.exit(1);
}

console.log('✅ Configuration valid');
console.log('✅ VERIFYDATA_SECRET_KEY: Set');
console.log('✅ ENCRYPTION_KEY: Set (64 chars)');
"
```

## Testing Procedure

### Step 1: Test Single CAC Verification

1. **Prepare Test Data**

Create a test CSV file with a valid RC number:

```csv
Company Name,Company Address,Email Address,Company Type,Phone Number,Policy Number,Registration Number,Registration Date,Business Address,CAC
ACME CORPORATION LIMITED,123 Business Street Lagos,test@acme.com,Private Limited Company,08123456789,POL-2024-001,RC123456,15/03/2010,123 Business Street Lagos,RC123456
```

2. **Upload Test List**

- Navigate to Identity Collection page
- Click "Upload New List"
- Select the test CSV file
- Verify preview shows correct data
- Click "Create List"

3. **Send Verification Request**

- Select the test entry
- Click "Request CAC"
- Verify email is sent successfully
- Check email inbox for verification link

4. **Complete Verification**

- Click verification link in email
- Verify company information is displayed correctly
- Enter the RC number
- Submit verification
- Verify success message is displayed

5. **Verify Results**

- Return to admin portal
- Verify entry status is "verified"
- Check verification details show:
  - Company Name matches
  - Registration Number matches
  - Registration Date matches
  - Company Status is "Verified"

### Step 2: Test Error Scenarios

#### Test Invalid RC Number

1. Upload a list with an invalid RC number (e.g., "RC999999999")
2. Send verification request
3. Complete verification
4. Verify error message: "RC number not found in CAC database"
5. Verify entry status is "verification_failed"

#### Test Field Mismatch

1. Upload a list with incorrect company name
2. Send verification request
3. Complete verification
4. Verify error message: "The company information provided does not match CAC records"
5. Verify failed fields are logged

#### Test Expired Token

1. Generate a verification link
2. Wait for token to expire (or manually expire in database)
3. Try to access the link
4. Verify error message: "This link has expired"

### Step 3: Test Bulk Verification

1. **Prepare Bulk Test Data**

Create a CSV file with 10-20 valid RC numbers:

```csv
Company Name,Company Address,Email Address,Company Type,Phone Number,Policy Number,Registration Number,Registration Date,Business Address,CAC
Company 1,Address 1,test1@example.com,Private Limited Company,08123456789,POL-001,RC123456,15/03/2010,Address 1,RC123456
Company 2,Address 2,test2@example.com,Private Limited Company,08123456790,POL-002,RC123457,16/03/2010,Address 2,RC123457
...
```

2. **Upload and Verify**

- Upload the bulk test file
- Click "Verify All Unverified"
- Monitor progress bar
- Verify completion summary shows:
  - Total processed
  - Successful verifications
  - Failed verifications
  - Skipped entries

3. **Verify Rate Limiting**

- Verify bulk verification respects rate limits (50 requests per minute)
- Verify requests are queued when limit exceeded
- Verify no errors due to rate limiting

### Step 4: Test Security Measures

#### Verify Encryption

1. **Check Database**

- Open Firestore console
- Navigate to identity-entries collection
- Select a verified entry
- Verify CAC field is encrypted:
  ```json
  {
    "CAC": {
      "encrypted": "base64-encrypted-data",
      "iv": "base64-iv-data"
    }
  }
  ```

2. **Verify No Plaintext**

- Search Firestore for plaintext RC numbers
- Verify no results found
- Check verification details
- Verify registration numbers are encrypted

#### Verify SECRET_KEY Not Exposed

1. **Check Frontend**

- Open browser developer tools
- Go to Network tab
- Trigger a verification
- Inspect all API requests
- Verify VERIFYDATA_SECRET_KEY is NOT in any request/response

2. **Check Logs**

- Review server logs
- Verify SECRET_KEY is not logged
- Verify RC numbers are masked (e.g., "RC12****")

#### Verify Audit Logs

1. **Check Audit Log Creation**

- Navigate to Firestore console
- Open verification-audit-logs collection
- Verify logs exist for each verification
- Verify logs contain:
  - Timestamp
  - Action (cac_verification)
  - Entry ID
  - Masked RC number
  - Result (success/failed)
  - Source (CAC)

2. **Verify Log Content**

- Verify RC numbers are masked
- Verify no SECRET_KEY in logs
- Verify no sensitive company data in logs

### Step 5: Test Performance

#### Single Verification Performance

1. **Measure Response Time**

- Use browser developer tools
- Trigger single verification
- Measure time from submit to response
- Verify response time < 5 seconds

2. **Check API Response Time**

- Review server logs
- Check VerifyData API response times
- Verify average response time < 3 seconds

#### Bulk Verification Performance

1. **Measure Throughput**

- Upload list with 100 entries
- Start bulk verification
- Measure total time
- Calculate throughput (entries per second)
- Verify throughput > 1 entry per second

2. **Monitor Resource Usage**

- Monitor server CPU usage
- Monitor memory usage
- Verify no memory leaks
- Verify CPU usage is reasonable

### Step 6: Test Notifications

#### Customer Notifications

1. **Verification Success**

- Complete successful verification
- Verify customer receives success email
- Check email content is user-friendly

2. **Verification Failure**

- Trigger verification failure
- Verify customer receives error email
- Verify email contains:
  - User-friendly error message
  - Broker contact information
  - Clear next steps

#### Staff Notifications

1. **Verification Failure**

- Trigger verification failure
- Verify staff receives notification email
- Verify email contains:
  - Technical error details
  - Failed fields
  - Link to entry in admin portal

## Test Results Documentation

### Test Execution Checklist

- [ ] Single CAC verification successful
- [ ] Invalid RC number handled correctly
- [ ] Field mismatch detected correctly
- [ ] Expired token handled correctly
- [ ] Bulk verification successful
- [ ] Rate limiting works correctly
- [ ] CAC numbers encrypted in database
- [ ] SECRET_KEY not exposed to frontend
- [ ] RC numbers masked in logs
- [ ] Audit logs created correctly
- [ ] Single verification performance acceptable
- [ ] Bulk verification performance acceptable
- [ ] Customer notifications sent correctly
- [ ] Staff notifications sent correctly

### Issues Found

Document any issues found during testing:

| Issue # | Description | Severity | Status | Notes |
|---------|-------------|----------|--------|-------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Single verification time | < 5s | | |
| Bulk verification throughput | > 1 entry/s | | |
| API response time (avg) | < 3s | | |
| Rate limit enforcement | 50 req/min | | |

### Security Verification

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| CAC encrypted in DB | Yes | | |
| SECRET_KEY not exposed | Yes | | |
| RC numbers masked in logs | Yes | | |
| Audit logs created | Yes | | |

## Troubleshooting

### Common Issues

#### 1. "VERIFYDATA_SECRET_KEY not configured"

**Solution**: Ensure SECRET_KEY is set in environment variables:
```bash
export VERIFYDATA_SECRET_KEY=your-key-here
```

#### 2. "Invalid secret key (FF)"

**Solution**: Verify SECRET_KEY is correct. Contact VerifyData support if needed.

#### 3. "Insufficient balance (IB)"

**Solution**: Top up VerifyData account balance.

#### 4. "Rate limit exceeded"

**Solution**: Wait for rate limit window to reset (1 minute) or reduce request rate.

#### 5. "Network error"

**Solution**: 
- Check internet connection
- Verify VerifyData API is accessible
- Check firewall settings

### Debug Mode

Enable debug logging:

```bash
export DEBUG=verifydata:*
npm start
```

This will log detailed information about:
- API requests (with masked data)
- Response parsing
- Field matching
- Error handling

## Production Deployment Checklist

Before deploying to production:

- [ ] All tests passed successfully
- [ ] No critical issues found
- [ ] Performance metrics meet requirements
- [ ] Security measures verified
- [ ] Credentials configured correctly
- [ ] Backup plan in place
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Rollback plan prepared

## Support Contacts

- **VerifyData Support**: [support email/phone]
- **NEM Insurance IT**: [contact information]
- **Development Team**: [contact information]

## Additional Resources

- [VerifyData API Documentation](https://vd.villextra.com/docs)
- [CAC Verification Implementation Summary](.kiro/specs/identity-remediation/CAC_IMPLEMENTATION_SUMMARY.md)
- [Security Documentation](.kiro/specs/identity-remediation/SECURITY_DOCUMENTATION.md)
- [Production Deployment Checklist](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
