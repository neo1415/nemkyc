# CAC Verification Production Deployment Checklist

## Task 65.1: Deploy CAC Verification to Production

### Pre-Deployment Checklist

#### 1. Environment Variables Configuration

**CRITICAL: Verify VERIFYDATA_SECRET_KEY is set in production environment**

On your production server (Render.com), ensure the following environment variables are configured:

```bash
# VerifyData API Configuration (REQUIRED)
VERIFYDATA_API_URL=https://vd.villextra.com
VERIFYDATA_SECRET_KEY=<your_actual_secret_key_here>

# Verification Mode (REQUIRED)
VERIFICATION_MODE=production  # or 'datapro' to enable both NIN and CAC

# Encryption Key (REQUIRED for NDPR compliance)
ENCRYPTION_KEY=<your_64_character_hex_key>

# Datapro API Configuration (if using VERIFICATION_MODE=datapro or production)
DATAPRO_API_URL=https://api.datapronigeria.com
DATAPRO_SERVICE_ID=<your_datapro_service_id>

# Frontend URL for verification links
FRONTEND_URL=https://nemforms.com
```

**How to set environment variables on Render.com:**
1. Go to your Render dashboard
2. Select your web service (nem-server-rhdb)
3. Navigate to "Environment" tab
4. Add/update the environment variables listed above
5. Click "Save Changes"
6. Render will automatically redeploy with new variables

#### 2. Verify API Credentials

**VerifyData Secret Key:**
- Log in to https://vd.villextra.com
- Navigate to API Settings or Developer section
- Copy your secret key
- Ensure it's added to production environment variables

**Test API Access (Optional):**
```bash
# Test VerifyData API with curl (replace YOUR_SECRET_KEY)
curl -X POST https://vd.villextra.com/api/ValidateRcNumber/Initiate \
  -H "Content-Type: application/json" \
  -d '{
    "rcNumber": "RC123456",
    "secretKey": "YOUR_SECRET_KEY"
  }'
```

#### 3. Code Verification

**Verify VerifyData Client is Production-Ready:**
- ✅ File exists: `server-services/verifydataClient.cjs`
- ✅ Retry logic implemented (max 3 retries)
- ✅ 30-second timeout configured
- ✅ Rate limiting applied (50 requests/minute)
- ✅ RC number masking in logs
- ✅ Comprehensive error handling
- ✅ Field matching logic for CAC data

**Verify Server Integration:**
- ✅ CAC verification endpoint exists in `server.js`
- ✅ Encryption/decryption for CAC numbers
- ✅ Audit logging for CAC verifications
- ✅ API usage tracking for VerifyData calls
- ✅ Error notifications for failed verifications

#### 4. Security Verification

**CRITICAL Security Checks:**
- ✅ VERIFYDATA_SECRET_KEY never exposed to frontend
- ✅ CAC numbers encrypted at rest (AES-256-GCM)
- ✅ RC numbers masked in all logs
- ✅ Rate limiting prevents API abuse
- ✅ HTTPS enforced for all API calls
- ✅ CORS configured correctly
- ✅ Authentication required for all admin endpoints

#### 5. Testing Verification

**Run All Tests Before Deployment:**
```bash
# Run CAC verification tests
npm test -- src/__tests__/cac/

# Run VerifyData client tests
npm test -- server-services/__tests__/verifydataClient.test.cjs

# Run integration tests
npm test -- src/__tests__/cac/integration.test.ts

# Run security tests
npm test -- src/__tests__/cac/security.test.ts

# Run performance tests
npm test -- src/__tests__/cac/performance.test.ts
```

**Expected Results:**
- All tests should pass
- No security warnings
- Performance within acceptable limits

### Deployment Steps

#### Step 1: Backup Current Production

```bash
# Backup Firestore data (if needed)
# Use Firebase Console > Firestore > Import/Export
# Or use Firebase CLI:
firebase firestore:export gs://nem-customer-feedback-8d3fb.appspot.com/backups/pre-cac-deployment
```

#### Step 2: Set Environment Variables

1. Log in to Render.com dashboard
2. Navigate to your service: `nem-server-rhdb`
3. Go to "Environment" tab
4. Add/update these variables:
   ```
   VERIFYDATA_API_URL=https://vd.villextra.com
   VERIFYDATA_SECRET_KEY=<your_actual_secret_key>
   VERIFICATION_MODE=production
   ```
5. Click "Save Changes"

#### Step 3: Deploy Code

**Option A: Automatic Deployment (Recommended)**
```bash
# Push to main branch (if auto-deploy is enabled)
git add .
git commit -m "Deploy CAC verification to production"
git push origin main
```

**Option B: Manual Deployment**
1. Go to Render dashboard
2. Click "Manual Deploy" > "Deploy latest commit"
3. Wait for deployment to complete

#### Step 4: Verify Deployment

**Check Deployment Status:**
1. Go to Render dashboard
2. Check "Events" tab for deployment status
3. Look for "Deploy succeeded" message
4. Check "Logs" tab for any errors

**Verify Environment Variables:**
```bash
# Check logs for configuration validation
# Look for these messages in Render logs:
# ✅ VerifyData API configured: https://vd.villextra.com
# ✅ Verification mode: production
# ✅ VERIFYDATA_SECRET_KEY is set
```

#### Step 5: Smoke Test

**Test CAC Verification Endpoint:**
1. Log in to production admin portal: https://nemforms.com
2. Navigate to Identity Collection
3. Upload a test list with CAC data
4. Select an entry and click "Request CAC"
5. Verify email is sent
6. Open verification link
7. Submit CAC number
8. Verify success/failure response

**Check Logs:**
```bash
# In Render dashboard, check logs for:
# [VerifydataClient] Verifying RC number: RC12****
# [VerifydataClient] Response status: 200
# [VerifydataClient] Verification successful
```

### Post-Deployment Monitoring

#### Monitor for First 24 Hours (Task 65.2)

**Key Metrics to Watch:**

1. **Error Rates**
   - Check Render logs for VerifyData API errors
   - Monitor error rate < 10%
   - Look for patterns in failures

2. **API Call Counts**
   - Track number of CAC verifications
   - Monitor API usage against limits
   - Check for unexpected spikes

3. **Response Times**
   - Average response time < 5 seconds
   - 95th percentile < 10 seconds
   - Timeout rate < 1%

4. **User Feedback**
   - Monitor support emails
   - Check for user complaints
   - Track verification success rate

**Monitoring Tools:**

1. **Render Dashboard**
   - Go to "Metrics" tab
   - Monitor CPU, memory, response times
   - Check for errors in "Logs" tab

2. **Firebase Console**
   - Check Firestore for verification records
   - Monitor API usage in verification-audit-logs
   - Check error rates in identity-entries collection

3. **Health Monitor Endpoint**
   ```bash
   # Check health status
   curl https://nem-server-rhdb.onrender.com/api/health/status
   
   # Check VerifyData API health
   curl https://nem-server-rhdb.onrender.com/api/health/verifydata
   ```

4. **API Usage Dashboard**
   - Log in to admin portal
   - Navigate to API Usage section
   - Check VerifyData call counts and costs

### Rollback Plan

**If Issues Occur:**

1. **Immediate Rollback**
   ```bash
   # Option 1: Revert to previous deployment
   # In Render dashboard:
   # - Go to "Events" tab
   # - Find previous successful deployment
   # - Click "Redeploy"
   
   # Option 2: Switch to mock mode
   # In Render dashboard > Environment:
   VERIFICATION_MODE=mock
   # Click "Save Changes" to redeploy
   ```

2. **Restore from Backup (if needed)**
   ```bash
   # Use Firebase Console > Firestore > Import/Export
   # Or Firebase CLI:
   firebase firestore:import gs://nem-customer-feedback-8d3fb.appspot.com/backups/pre-cac-deployment
   ```

3. **Notify Users**
   - Send email to brokers about temporary issues
   - Update status page (if available)
   - Provide ETA for resolution

### Success Criteria

**Deployment is successful if:**
- ✅ All environment variables are set correctly
- ✅ Server starts without errors
- ✅ CAC verification endpoint responds
- ✅ Test verification completes successfully
- ✅ Logs show no critical errors
- ✅ Error rate < 10%
- ✅ Response times < 5 seconds average
- ✅ No user complaints in first hour

### Troubleshooting

**Common Issues:**

1. **"VERIFYDATA_SECRET_KEY not configured"**
   - Solution: Add VERIFYDATA_SECRET_KEY to Render environment variables
   - Redeploy after adding

2. **"Invalid secret key (FF)"**
   - Solution: Verify secret key is correct
   - Check for extra spaces or quotes
   - Get new key from VerifyData dashboard

3. **"Insufficient balance (IB)"**
   - Solution: Top up VerifyData account balance
   - Contact VerifyData support

4. **"Network error"**
   - Solution: Check VerifyData API status
   - Verify VERIFYDATA_API_URL is correct
   - Check Render outbound network connectivity

5. **High error rate**
   - Check VerifyData API status
   - Review logs for patterns
   - Consider switching to mock mode temporarily

### Contact Information

**Support Contacts:**
- VerifyData Support: support@villextra.com
- Render Support: https://render.com/support
- Internal DevOps: devops@nem-insurance.com

### Deployment Completion

**After successful deployment:**
- ✅ Mark task 65.1 as complete
- ✅ Begin 24-hour monitoring (task 65.2)
- ✅ Document any issues encountered
- ✅ Update team on deployment status

---

## Deployment Log

**Date:** _________________
**Deployed By:** _________________
**Deployment Time:** _________________
**Deployment Status:** ☐ Success ☐ Failed ☐ Rolled Back

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Issues Encountered:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Resolution:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
