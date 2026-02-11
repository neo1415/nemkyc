# CAC Verification Monitoring Guide

## Task 65.2: Monitor First 24 Hours

This guide provides detailed instructions for monitoring CAC verification during the critical first 24 hours after production deployment.

---

## Monitoring Dashboard

### 1. Render.com Dashboard

**Access:** https://dashboard.render.com

**Key Metrics to Monitor:**

#### CPU Usage
- **Normal:** < 50%
- **Warning:** 50-80%
- **Critical:** > 80%
- **Action if critical:** Check for infinite loops or heavy processing

#### Memory Usage
- **Normal:** < 70%
- **Warning:** 70-85%
- **Critical:** > 85%
- **Action if critical:** Check for memory leaks, restart service if needed

#### Response Times
- **Normal:** < 2 seconds average
- **Warning:** 2-5 seconds
- **Critical:** > 5 seconds
- **Action if critical:** Check VerifyData API response times, optimize queries

#### Error Rate
- **Normal:** < 5%
- **Warning:** 5-10%
- **Critical:** > 10%
- **Action if critical:** Review error logs, consider rollback

**How to Access:**
1. Log in to Render dashboard
2. Select service: `nem-server-rhdb`
3. Click "Metrics" tab
4. Set time range to "Last 24 hours"

---

### 2. Application Logs

**Access:** Render Dashboard > Logs tab

**Key Log Patterns to Watch:**

#### Success Patterns
```
✅ [VerifydataClient] Verifying RC number: RC12****
✅ [VerifydataClient] Response status: 200
✅ [VerifydataClient] Verification successful for RC: RC12****
✅ [VerifydataClient] Field matching result: MATCHED
```

#### Warning Patterns
```
⚠️  [VerifydataClient] Retrying after 1000ms...
⚠️  [VerifydataClient] Verification failed: RC number not found
⚠️  [VerifydataClient] Field matching result: FAILED
⚠️  [VerifydataClient] Failed fields: Company Name, Registration Date
```

#### Error Patterns (CRITICAL)
```
❌ [VerifydataClient] VERIFYDATA_SECRET_KEY not configured
❌ [VerifydataClient] Invalid secret key (FF)
❌ [VerifydataClient] Insufficient balance (IB)
❌ [VerifydataClient] All 3 attempts failed for RC: RC12****
❌ [VerifydataClient] Rate limit exceeded
```

**Monitoring Commands:**
```bash
# Filter for VerifyData logs
# In Render logs, search for: [VerifydataClient]

# Count successful verifications
# Search for: "Verification successful"

# Count failed verifications
# Search for: "Verification failed"

# Check for errors
# Search for: "ERROR" or "❌"
```

---

### 3. Firebase Console

**Access:** https://console.firebase.google.com

**Collections to Monitor:**

#### identity-entries
- **Purpose:** Track verification status
- **Key Fields:**
  - `status`: Should be "verified" or "verification_failed"
  - `verificationDetails`: Contains match results
  - `verificationAttempts`: Should be ≤ 3
  - `verificationType`: Should be "CAC"

**Query Examples:**
```javascript
// Count CAC verifications in last 24 hours
db.collection('identity-entries')
  .where('verificationType', '==', 'CAC')
  .where('verifiedAt', '>=', new Date(Date.now() - 24*60*60*1000))
  .get()

// Count failed CAC verifications
db.collection('identity-entries')
  .where('verificationType', '==', 'CAC')
  .where('status', '==', 'verification_failed')
  .get()

// Check verification attempts
db.collection('identity-entries')
  .where('verificationType', '==', 'CAC')
  .where('verificationAttempts', '>', 1)
  .get()
```

#### verification-audit-logs
- **Purpose:** Audit trail of all verifications
- **Key Fields:**
  - `action`: Should be "cac_verification"
  - `result`: "success" or "failure"
  - `errorCode`: Error code if failed
  - `timestamp`: Verification time

**Query Examples:**
```javascript
// Count CAC verifications by result
db.collection('verification-audit-logs')
  .where('action', '==', 'cac_verification')
  .where('timestamp', '>=', new Date(Date.now() - 24*60*60*1000))
  .get()

// Get error distribution
db.collection('verification-audit-logs')
  .where('action', '==', 'cac_verification')
  .where('result', '==', 'failure')
  .get()
```

#### api-usage
- **Purpose:** Track API call counts and costs
- **Key Fields:**
  - `service`: Should be "verifydata"
  - `callCount`: Number of API calls
  - `successCount`: Successful calls
  - `failureCount`: Failed calls
  - `estimatedCost`: Cost in NGN

**Query Examples:**
```javascript
// Get today's VerifyData usage
db.collection('api-usage')
  .where('service', '==', 'verifydata')
  .where('date', '==', new Date().toISOString().split('T')[0])
  .get()

// Calculate success rate
const usage = await db.collection('api-usage')
  .where('service', '==', 'verifydata')
  .orderBy('timestamp', 'desc')
  .limit(1)
  .get();

const data = usage.docs[0].data();
const successRate = (data.successCount / data.callCount) * 100;
console.log(`Success Rate: ${successRate.toFixed(2)}%`);
```

---

### 4. Health Monitor API

**Endpoints:**

#### Overall Health Status
```bash
curl https://nem-server-rhdb.onrender.com/api/health/status
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "datapro": {
      "status": "healthy",
      "lastCheck": "2024-01-15T10:29:00Z",
      "responseTime": 1234
    },
    "verifydata": {
      "status": "healthy",
      "lastCheck": "2024-01-15T10:29:00Z",
      "responseTime": 2345
    }
  },
  "errorRate": {
    "last1Hour": 2.5,
    "last24Hours": 3.1
  }
}
```

#### VerifyData Specific Health
```bash
curl https://nem-server-rhdb.onrender.com/api/health/verifydata
```

**Expected Response:**
```json
{
  "service": "verifydata",
  "status": "healthy",
  "lastCheck": "2024-01-15T10:29:00Z",
  "responseTime": 2345,
  "errorRate": 2.1,
  "callCount": 150,
  "successCount": 147,
  "failureCount": 3
}
```

#### API Usage Stats
```bash
curl -H "Authorization: Bearer <admin_token>" \
  https://nem-server-rhdb.onrender.com/api/admin/api-usage/verifydata
```

**Expected Response:**
```json
{
  "service": "verifydata",
  "today": {
    "callCount": 150,
    "successCount": 147,
    "failureCount": 3,
    "successRate": 98.0,
    "estimatedCost": 7500
  },
  "thisMonth": {
    "callCount": 450,
    "successCount": 441,
    "failureCount": 9,
    "successRate": 98.0,
    "estimatedCost": 22500
  }
}
```

---

## Monitoring Schedule

### Hour 0-1 (Critical)
**Check every 15 minutes**

- ✅ Verify first verification completes successfully
- ✅ Check error logs for critical issues
- ✅ Monitor response times
- ✅ Verify API credentials working
- ✅ Check for any user complaints

**Actions:**
- If any critical errors: Rollback immediately
- If high error rate (>20%): Investigate and consider rollback
- If slow response times (>10s): Check VerifyData API status

### Hour 1-6 (High Priority)
**Check every 30 minutes**

- ✅ Monitor error rate (should be < 10%)
- ✅ Check API call counts
- ✅ Review failed verifications
- ✅ Monitor response times
- ✅ Check for patterns in errors

**Actions:**
- If error rate 10-20%: Investigate root cause
- If error rate >20%: Consider rollback
- Document any issues for resolution

### Hour 6-24 (Standard)
**Check every 2 hours**

- ✅ Monitor overall health
- ✅ Check API usage and costs
- ✅ Review user feedback
- ✅ Verify no degradation in performance
- ✅ Check for any alerts

**Actions:**
- Address any non-critical issues
- Optimize if needed
- Prepare summary report

---

## Alert Thresholds

### Critical Alerts (Immediate Action Required)

1. **Error Rate > 20%**
   - **Action:** Rollback to previous version
   - **Notification:** Email + SMS to DevOps team

2. **VERIFYDATA_SECRET_KEY Invalid**
   - **Action:** Verify credentials, update if needed
   - **Notification:** Email to DevOps team

3. **Insufficient Balance**
   - **Action:** Top up VerifyData account
   - **Notification:** Email to Finance + DevOps

4. **Service Down**
   - **Action:** Check Render status, restart if needed
   - **Notification:** Email + SMS to DevOps team

### Warning Alerts (Action Within 1 Hour)

1. **Error Rate 10-20%**
   - **Action:** Investigate root cause
   - **Notification:** Email to DevOps team

2. **Response Time > 5 seconds**
   - **Action:** Check VerifyData API status
   - **Notification:** Email to DevOps team

3. **High API Usage (>80% of limit)**
   - **Action:** Monitor closely, prepare to increase limit
   - **Notification:** Email to Finance + DevOps

4. **Memory Usage > 85%**
   - **Action:** Check for memory leaks, restart if needed
   - **Notification:** Email to DevOps team

### Info Alerts (Monitor)

1. **Error Rate 5-10%**
   - **Action:** Monitor, document patterns
   - **Notification:** Log only

2. **Response Time 2-5 seconds**
   - **Action:** Monitor, optimize if persistent
   - **Notification:** Log only

3. **Retry Rate > 10%**
   - **Action:** Check network stability
   - **Notification:** Log only

---

## Metrics to Track

### Success Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Success Rate | > 95% | 90-95% | < 90% |
| Average Response Time | < 2s | 2-5s | > 5s |
| Error Rate | < 5% | 5-10% | > 10% |
| Timeout Rate | < 1% | 1-3% | > 3% |
| Retry Rate | < 5% | 5-10% | > 10% |

### API Usage Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Daily Call Count | < 500 | 500-800 | > 800 |
| Monthly Call Count | < 15,000 | 15,000-20,000 | > 20,000 |
| Daily Cost | < ₦25,000 | ₦25,000-₦40,000 | > ₦40,000 |
| Monthly Cost | < ₦750,000 | ₦750,000-₦1,000,000 | > ₦1,000,000 |

### Performance Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| CPU Usage | < 50% | 50-80% | > 80% |
| Memory Usage | < 70% | 70-85% | > 85% |
| Disk Usage | < 80% | 80-90% | > 90% |
| Network Latency | < 100ms | 100-200ms | > 200ms |

---

## Monitoring Checklist

### Hourly Checks (First 6 Hours)

- [ ] Check Render logs for errors
- [ ] Verify error rate < 10%
- [ ] Check response times < 5s
- [ ] Review failed verifications
- [ ] Monitor API call counts
- [ ] Check for user complaints

### Every 2 Hours (Hour 6-24)

- [ ] Review overall health status
- [ ] Check API usage and costs
- [ ] Verify no performance degradation
- [ ] Review user feedback
- [ ] Check for any alerts
- [ ] Document any issues

### End of 24 Hours

- [ ] Generate summary report
- [ ] Calculate success rate
- [ ] Review total API usage and costs
- [ ] Document lessons learned
- [ ] Identify improvement areas
- [ ] Update team on status

---

## Reporting Template

### 24-Hour Monitoring Report

**Deployment Date:** _________________
**Monitoring Period:** _________________ to _________________
**Monitored By:** _________________

#### Overall Status
☐ Successful ☐ Issues Encountered ☐ Rolled Back

#### Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total Verifications | _____ | ☐ Good ☐ Warning ☐ Critical |
| Success Rate | _____% | ☐ Good ☐ Warning ☐ Critical |
| Error Rate | _____% | ☐ Good ☐ Warning ☐ Critical |
| Average Response Time | _____s | ☐ Good ☐ Warning ☐ Critical |
| Total API Calls | _____ | ☐ Good ☐ Warning ☐ Critical |
| Total Cost | ₦_____ | ☐ Good ☐ Warning ☐ Critical |

#### Issues Encountered

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

#### Actions Taken

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

#### User Feedback

Positive:
_________________________________________________________________

Negative:
_________________________________________________________________

#### Recommendations

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

#### Next Steps

- [ ] Continue monitoring for another 24 hours
- [ ] Gather user feedback (Task 65.3)
- [ ] Optimize based on findings
- [ ] Update documentation
- [ ] Schedule team review

---

## Contact Information

**Escalation Path:**

1. **Level 1:** DevOps Team
   - Email: devops@nem-insurance.com
   - Response Time: 15 minutes

2. **Level 2:** Technical Lead
   - Email: tech-lead@nem-insurance.com
   - Response Time: 30 minutes

3. **Level 3:** CTO
   - Email: cto@nem-insurance.com
   - Response Time: 1 hour

**External Support:**

- **VerifyData Support:** support@villextra.com
- **Render Support:** https://render.com/support
- **Firebase Support:** https://firebase.google.com/support

---

## Automated Monitoring Scripts

### Script 1: Check Error Rate
```bash
#!/bin/bash
# check-error-rate.sh

# Get logs from last hour
curl -s "https://nem-server-rhdb.onrender.com/api/health/verifydata" | \
  jq '.errorRate'

# Alert if > 10%
if [ $(echo "$errorRate > 10" | bc) -eq 1 ]; then
  echo "ALERT: Error rate is $errorRate%"
  # Send email alert
fi
```

### Script 2: Monitor API Usage
```bash
#!/bin/bash
# monitor-api-usage.sh

# Get today's usage
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://nem-server-rhdb.onrender.com/api/admin/api-usage/verifydata" | \
  jq '.today'

# Alert if > 80% of daily limit
if [ $(echo "$callCount > 640" | bc) -eq 1 ]; then
  echo "ALERT: API usage is $callCount calls (80% of limit)"
  # Send email alert
fi
```

### Script 3: Check Response Times
```bash
#!/bin/bash
# check-response-times.sh

# Get average response time
curl -s "https://nem-server-rhdb.onrender.com/api/health/verifydata" | \
  jq '.responseTime'

# Alert if > 5000ms
if [ $responseTime -gt 5000 ]; then
  echo "ALERT: Response time is ${responseTime}ms"
  # Send email alert
fi
```

---

## End of Monitoring Period

**After 24 hours:**
1. ✅ Complete monitoring report
2. ✅ Mark task 65.2 as complete
3. ✅ Begin gathering feedback (task 65.3)
4. ✅ Schedule team review meeting
5. ✅ Update documentation with findings
