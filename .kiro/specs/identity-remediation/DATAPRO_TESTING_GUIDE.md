# Datapro NIN Verification - Testing Guide

## Overview

This guide explains how to test the Datapro NIN verification integration in both development and production environments.

## Understanding Verification Modes

The system supports multiple verification modes:

- **`mock`** - Simulated verification (no real API calls, instant responses)
- **`datapro`** - Real Datapro API for NIN verification
- **`paystack`** - Legacy Paystack API (not currently implemented)
- **`production`** - All production APIs enabled

## Prerequisites

### 1. Obtain Datapro Credentials

You need a **SERVICEID** (also called MERCHANT ID) from Datapro Nigeria:

**How to get it:**
- Visit: https://api.datapronigeria.com
- Contact: devops@datapronigeria.net
- Register as a merchant
- You'll receive your SERVICEID via email

**From the Datapro API Documentation:**
> "Once your request is received, an Admin will profile you on the system. Instantly an email containing your MERCHANT ID will be sent to you."

⚠️ **IMPORTANT:** Keep your SERVICEID secret! Never commit it to version control.

### 2. Understand the API

**Datapro NIN Verification API:**
- **Base URL:** `https://api.datapronigeria.com`
- **Endpoint:** `/verifynin/?regNo={NIN}`
- **Method:** `GET`
- **Authentication:** `SERVICEID` header
- **Response Codes:**
  - `200` - Results found (successful)
  - `400` - Bad request
  - `401` - Authorization failed
  - `87` - Invalid SERVICE ID
  - `88` - Network error

**Test NIN from Documentation:**
- NIN: `92957425574`
- Expected: JOHN BULL, Male, DOB: 12-May-1969

## Development Testing Setup

### Step 1: Configure Environment Variables

Edit your `.env.local` file:

```env
# Set verification mode to datapro
VERIFICATION_MODE=datapro

# Add your Datapro credentials
DATAPRO_API_URL=https://api.datapronigeria.com
DATAPRO_SERVICE_ID=your_actual_serviceid_here
```

### Step 2: Start Development Server

```bash
# Start backend server
npm run dev

# The server will log the verification mode on startup:
# 🔍 Verification mode: datapro
```

### Step 3: Test the Integration

#### Option A: Use the Customer Verification Page

1. Create an identity verification list in the admin dashboard
2. Upload entries with test NIns
3. Send verification requests
4. Open the verification link
5. Enter a test NIN (e.g., `92957425574`)
6. Verify the response matches expected data

#### Option B: Use the Demo Pages

Navigate to:
- `/demo/nin-verification` - Test NIN verification
- `/demo/cac-verification` - Test CAC verification

#### Option C: Direct API Testing

```bash
# Test the Datapro client directly
curl -X GET "https://api.datapronigeria.com/verifynin/?regNo=92957425574" \
  -H "SERVICEID: your_serviceid_here"
```

### Step 4: Monitor Logs

The system logs all verification attempts:

**Backend logs show:**
```
[Datapro] Verifying NIN: 92957425574
[Datapro] API Response: 200 - Results Found
[Datapro] Match score: 95%
```

**Check audit logs in:**
- Admin Dashboard → Remediation → Audit Logs
- Look for events: `identity_verification_success`, `identity_verification_failed`

## Testing Scenarios

### 1. Successful Verification

**Test NIN:** `92957425574` (from Datapro docs)

**Expected Result:**
- Status: Success
- Name: JOHN BULL
- Gender: Male
- DOB: 12-May-1969
- Match score: 95%+

### 2. Invalid NIN Format

**Test NIN:** `12345` (too short)

**Expected Result:**
- Error: "Please enter a valid 11-digit NIN"
- No API call made (frontend validation)

### 3. NIN Not Found

**Test NIN:** `00000000000` (invalid)

**Expected Result:**
- Status: Failed
- Error: "NIN not found in database"
- Response code: 400 or custom error

### 4. Field Mismatch

**Test:** Enter a valid NIN that doesn't match the stored customer data

**Expected Result:**
- Status: Failed
- Error: "Identity verification failed. The information provided does not match our records."
- Match score: < 70%

### 5. API Authentication Error

**Test:** Use invalid SERVICEID

**Expected Result:**
- Status: Failed
- Error: "Verification service authentication failed"
- Response code: 87

### 6. Network Error

**Test:** Disconnect internet or use invalid API URL

**Expected Result:**
- Status: Failed
- Error: "Unable to connect to verification service"
- Response code: 88

### 7. Rate Limiting

**Test:** Make multiple rapid verification requests

**Expected Result:**
- After 10 requests/minute: Rate limit error
- Queue system activates
- Requests processed sequentially

### 8. Bulk Verification

**Test:** Upload 50+ entries and run bulk verification

**Expected Result:**
- Progress tracking shows completion percentage
- Rate limiting prevents API overload
- All entries processed successfully
- Results stored in database

## Mock Mode vs Datapro Mode

### Mock Mode (`VERIFICATION_MODE=mock`)

**Behavior:**
- Instant responses (no network delay)
- Predictable test data
- No API costs
- No rate limiting
- Test NIns: `11111111111`, `22222222221`, `33333333331`

**Use for:**
- Local development
- Unit testing
- CI/CD pipelines
- Demo presentations

### Datapro Mode (`VERIFICATION_MODE=datapro`)

**Behavior:**
- Real API calls to Datapro
- Network latency (1-3 seconds)
- Real data from NIMC database
- API costs per verification
- Rate limiting enforced

**Use for:**
- Integration testing
- Staging environment
- Production environment
- Real customer verifications

## Demo Mode Toggle

The customer verification page has a **Demo Mode** toggle:

**When enabled:**
- Uses mock verification regardless of `VERIFICATION_MODE`
- Shows "Demo Mode (simulated verification)" banner
- Useful for testing without consuming API credits

**When disabled:**
- Uses the configured `VERIFICATION_MODE`
- Real API calls if mode is `datapro`

## Security Considerations

### 1. SERVICEID Protection

✅ **DO:**
- Store SERVICEID in environment variables
- Use `.env.local` for development (not committed)
- Use Render/hosting platform environment variables for production
- Rotate SERVICEID periodically

❌ **DON'T:**
- Commit SERVICEID to Git
- Expose SERVICEID in frontend code
- Log SERVICEID in application logs
- Share SERVICEID in documentation

### 2. Data Encryption

All NIN data is encrypted at rest:
- Uses AES-256-GCM encryption
- Encryption key stored in `ENCRYPTION_KEY` environment variable
- NIns encrypted before database storage
- Decrypted only when needed for verification

### 3. Audit Logging

All verification attempts are logged:
- Timestamp
- User ID (broker)
- Entry ID
- Verification result
- Match score
- Error details (if any)

## Production Deployment

### Backend (Render)

1. Go to Render dashboard
2. Select your backend service
3. Navigate to "Environment" tab
4. Add environment variables:
   ```
   VERIFICATION_MODE=datapro
   DATAPRO_SERVICE_ID=your_actual_serviceid
   DATAPRO_API_URL=https://api.datapronigeria.com
   ```
5. Save and redeploy

### Frontend (Firebase Hosting)

1. Update `.env.production`:
   ```env
   VERIFICATION_MODE=datapro
   ```
2. Build production bundle:
   ```bash
   npm run build
   ```
3. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

## Monitoring & Troubleshooting

### Check Verification Mode

**Backend startup logs:**
```
🔍 Verification mode: datapro
✅ Datapro credentials configured
```

**Health check endpoint:**
```bash
curl http://localhost:3001/api/health
```

Response includes:
```json
{
  "verificationMode": "datapro",
  "dataproConfigured": true
}
```

### Common Issues

#### Issue: "SERVICEID not configured"

**Solution:**
- Check `DATAPRO_SERVICE_ID` is set in environment
- Restart server after adding environment variable
- Verify no typos in variable name

#### Issue: "Authorization failed (87)"

**Solution:**
- Verify SERVICEID is correct
- Contact Datapro to confirm account is active
- Check for whitespace in SERVICEID value

#### Issue: "Network error (88)"

**Solution:**
- Check internet connectivity
- Verify `DATAPRO_API_URL` is correct
- Check firewall/proxy settings
- Confirm Datapro API is operational

#### Issue: Rate limit exceeded

**Solution:**
- Wait for rate limit window to reset (1 minute)
- Use queue system for bulk operations
- Contact Datapro to increase rate limits

## API Usage Tracking

The system tracks API usage:

**Metrics collected:**
- Total verifications
- Success rate
- Average response time
- Error rate by type
- Cost estimation

**View metrics:**
- Admin Dashboard → Analytics
- Audit Logs → Filter by verification events

## Cost Estimation

**Datapro API Pricing:**
- Contact Datapro for current pricing
- Typical: ₦50-100 per verification
- Bulk discounts may be available

**Optimize costs:**
- Use mock mode for development
- Cache verification results (24 hours)
- Implement retry logic with exponential backoff
- Monitor failed verifications to avoid wasted calls

## Testing Checklist

Before deploying to production:

- [ ] Obtained valid SERVICEID from Datapro
- [ ] Configured environment variables correctly
- [ ] Tested successful verification with known NIN
- [ ] Tested error scenarios (invalid NIN, network error)
- [ ] Verified field matching logic works correctly
- [ ] Tested bulk verification with 50+ entries
- [ ] Confirmed rate limiting works as expected
- [ ] Verified encryption of NIN data at rest
- [ ] Checked audit logs are being created
- [ ] Tested demo mode toggle functionality
- [ ] Monitored API response times
- [ ] Reviewed security measures (no SERVICEID exposure)
- [ ] Tested on staging environment
- [ ] Prepared rollback plan

## Support

**Datapro Support:**
- Email: devops@datapronigeria.net
- Website: https://datapronigeria.com
- Portal: https://api.datapronigeria.com

**Internal Support:**
- Check audit logs for detailed error information
- Review server logs for API response details
- Contact development team for integration issues

## Next Steps

1. **Get SERVICEID** - Contact Datapro to register
2. **Test in Development** - Use mock mode first, then datapro mode
3. **Deploy to Staging** - Test with real API in staging environment
4. **Monitor Performance** - Track API response times and success rates
5. **Deploy to Production** - Roll out to production with monitoring
6. **Optimize** - Review usage patterns and optimize costs

---

**Last Updated:** February 6, 2026
**Version:** 1.0
