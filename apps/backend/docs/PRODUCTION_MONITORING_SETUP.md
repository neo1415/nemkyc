# Production Monitoring Setup Guide

## Overview

This document provides comprehensive instructions for setting up monitoring and alerting for the Identity Collection System in production. The monitoring system tracks API health, error rates, costs, and system performance.

## Monitoring Components

### 1. API Health Monitoring
### 2. Error Rate Monitoring
### 3. Cost Monitoring
### 4. Performance Monitoring
### 5. Security Monitoring

---

## 1. API Health Monitoring

### Purpose
Monitor the availability and responsiveness of the Datapro API to ensure verification services are operational.

### Implementation

The health monitoring is already implemented in `server-utils/healthMonitor.cjs`. This section covers configuration and alert setup.

#### Configuration

**Environment Variables** (add to `.env`):
```bash
# Health Check Configuration
HEALTH_CHECK_INTERVAL=300000  # 5 minutes in milliseconds
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_ALERT_EMAIL=ops@nem-insurance.com
```

#### Alert Configuration

**Option A: Email Alerts (Built-in)**

The health monitor already sends email alerts. Configure SMTP settings:

```bash
# SMTP Configuration for Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@nem-insurance.com
SMTP_PASS=your-app-password
ALERT_EMAIL_TO=ops@nem-insurance.com,tech-lead@nem-insurance.com
```

**Option B: Slack Alerts**

Add Slack webhook integration:

1. Create Slack webhook:
   - Go to Slack App settings
   - Create incoming webhook
   - Copy webhook URL

2. Add to environment:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   SLACK_ALERT_CHANNEL=#production-alerts
   ```

3. Update `server-utils/healthMonitor.cjs` to send Slack notifications:
   ```javascript
   async function sendSlackAlert(message) {
     if (!process.env.SLACK_WEBHOOK_URL) return;
     
     try {
       await fetch(process.env.SLACK_WEBHOOK_URL, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           channel: process.env.SLACK_ALERT_CHANNEL || '#production-alerts',
           text: message,
           username: 'Health Monitor',
           icon_emoji: ':warning:'
         })
       });
     } catch (error) {
       console.error('Failed to send Slack alert:', error);
     }
   }
   ```

**Option C: PagerDuty Integration**

For critical alerts that require immediate response:

1. Create PagerDuty integration:
   - Go to PagerDuty service
   - Add integration
   - Copy integration key

2. Add to environment:
   ```bash
   PAGERDUTY_INTEGRATION_KEY=your-integration-key
   PAGERDUTY_ENABLED=true
   ```

3. Install PagerDuty client:
   ```bash
   npm install @pagerduty/pdjs
   ```

4. Add PagerDuty alerting to health monitor:
   ```javascript
   const { event } = require('@pagerduty/pdjs');
   
   async function sendPagerDutyAlert(severity, summary, details) {
     if (!process.env.PAGERDUTY_ENABLED) return;
     
     try {
       await event({
         data: {
           routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
           event_action: 'trigger',
           payload: {
             summary: summary,
             severity: severity, // 'critical', 'error', 'warning', 'info'
             source: 'identity-collection-system',
             custom_details: details
           }
         }
       });
     } catch (error) {
       console.error('Failed to send PagerDuty alert:', error);
     }
   }
   ```

#### Testing Health Monitoring

```bash
# Test health check manually
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "datapro": {
      "status": "up",
      "responseTime": 245
    },
    "firestore": {
      "status": "up"
    }
  }
}
```

**Test Alert Delivery**:
1. Temporarily set invalid Datapro API URL
2. Wait for health check to run (5 minutes)
3. Verify alert is received via email/Slack/PagerDuty
4. Restore correct API URL
5. Verify recovery alert is received

---

## 2. Error Rate Monitoring

### Purpose
Track verification success and failure rates to identify issues early.

### Implementation

#### Firestore Collection Structure

Create collection: `verification-metrics`

Document structure:
```javascript
{
  date: "2024-01-15",
  hour: 10,
  totalAttempts: 150,
  successCount: 135,
  failureCount: 15,
  errorRate: 10.0,
  errorTypes: {
    "field_mismatch": 8,
    "nin_not_found": 4,
    "api_error": 3
  },
  timestamp: Timestamp
}
```

#### Tracking Script

Add to `server-utils/errorRateMonitor.cjs`:

```javascript
const admin = require('firebase-admin');

class ErrorRateMonitor {
  constructor() {
    this.db = admin.firestore();
    this.currentHourMetrics = {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      errorTypes: {}
    };
  }

  recordVerificationAttempt(success, errorType = null) {
    this.currentHourMetrics.totalAttempts++;
    
    if (success) {
      this.currentHourMetrics.successCount++;
    } else {
      this.currentHourMetrics.failureCount++;
      if (errorType) {
        this.currentHourMetrics.errorTypes[errorType] = 
          (this.currentHourMetrics.errorTypes[errorType] || 0) + 1;
      }
    }
  }

  async saveMetrics() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hour = now.getHours();
    
    const errorRate = this.currentHourMetrics.totalAttempts > 0
      ? (this.currentHourMetrics.failureCount / this.currentHourMetrics.totalAttempts) * 100
      : 0;

    await this.db.collection('verification-metrics').add({
      date,
      hour,
      ...this.currentHourMetrics,
      errorRate,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Check if error rate exceeds threshold
    if (errorRate > 10) {
      await this.sendErrorRateAlert(errorRate);
    }

    // Reset metrics for next hour
    this.currentHourMetrics = {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      errorTypes: {}
    };
  }

  async sendErrorRateAlert(errorRate) {
    const message = `⚠️ High Error Rate Alert: ${errorRate.toFixed(2)}% verification failures in the last hour`;
    
    // Send email alert
    // Send Slack alert
    // Send PagerDuty alert if critical (> 25%)
    
    console.error(message);
  }

  startMonitoring() {
    // Save metrics every hour
    setInterval(() => this.saveMetrics(), 60 * 60 * 1000);
  }
}

module.exports = new ErrorRateMonitor();
```

#### Integration

Update verification endpoints in `server.js`:

```javascript
const errorRateMonitor = require('./server-utils/errorRateMonitor.cjs');

// In verification endpoint
try {
  const result = await verifyNIN(nin, entryData);
  errorRateMonitor.recordVerificationAttempt(true);
  // ... handle success
} catch (error) {
  errorRateMonitor.recordVerificationAttempt(false, error.type);
  // ... handle error
}
```

#### Alert Thresholds

Configure alert levels:

```bash
# Error Rate Alert Thresholds
ERROR_RATE_WARNING=10    # Send warning at 10%
ERROR_RATE_CRITICAL=25   # Send critical alert at 25%
ERROR_RATE_CHECK_INTERVAL=3600000  # Check every hour
```

#### Dashboard Display

The error rate metrics are already displayed in the admin dashboard via `server-utils/healthMonitor.cjs`. Ensure the dashboard component is rendering the data:

```typescript
// In src/pages/admin/AdminDashboard.tsx or similar
const [errorRate, setErrorRate] = useState(0);

useEffect(() => {
  const fetchMetrics = async () => {
    const response = await fetch('/api/health');
    const data = await response.json();
    setErrorRate(data.errorRate || 0);
  };
  
  fetchMetrics();
  const interval = setInterval(fetchMetrics, 60000); // Update every minute
  
  return () => clearInterval(interval);
}, []);
```

---

## 3. Cost Monitoring

### Purpose
Track API call costs to prevent budget overruns and optimize usage.

### Implementation

#### Cost Tracking Configuration

```bash
# Cost Configuration
DATAPRO_COST_PER_CALL=100  # Cost in Naira per successful API call (failed calls = ₦0)
MONTHLY_BUDGET_LIMIT=500000  # Monthly budget in Naira
DAILY_BUDGET_LIMIT=20000  # Daily budget in Naira
COST_ALERT_THRESHOLD=0.8  # Alert at 80% of budget
```

#### Firestore Collection

Collection: `api-usage`

Document structure:
```javascript
{
  date: "2024-01-15",
  callCount: 450,
  costNaira: 22500,
  callsByType: {
    "nin_verification": 400,
    "bvn_verification": 50
  },
  timestamp: Timestamp
}
```

#### Cost Tracking Implementation

The cost tracking is already implemented in `server-utils/apiUsageTracker.cjs`. Ensure it's properly configured:

```javascript
// In server-utils/apiUsageTracker.cjs
const COST_PER_CALL = parseFloat(process.env.DATAPRO_COST_PER_CALL) || 100;
const MONTHLY_BUDGET = parseFloat(process.env.MONTHLY_BUDGET_LIMIT) || 500000;
const DAILY_BUDGET = parseFloat(process.env.DAILY_BUDGET_LIMIT) || 20000;

async function checkBudgetLimits() {
  const today = new Date().toISOString().split('T')[0];
  const dailyUsage = await getDailyUsage(today);
  const monthlyUsage = await getMonthlyUsage();
  
  const dailyCost = dailyUsage * COST_PER_CALL;
  const monthlyCost = monthlyUsage * COST_PER_CALL;
  
  // Check daily limit
  if (dailyCost >= DAILY_BUDGET * 0.8) {
    await sendCostAlert('daily', dailyCost, DAILY_BUDGET);
  }
  
  // Check monthly limit
  if (monthlyCost >= MONTHLY_BUDGET * 0.8) {
    await sendCostAlert('monthly', monthlyCost, MONTHLY_BUDGET);
  }
}
```

#### Cost Projection

Add cost projection calculation:

```javascript
async function calculateCostProjection() {
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();
  
  const monthlyUsage = await getMonthlyUsage();
  const monthlyCost = monthlyUsage * COST_PER_CALL;
  
  // Project end-of-month cost
  const projectedCost = (monthlyCost / currentDay) * daysInMonth;
  
  return {
    currentCost: monthlyCost,
    projectedCost: projectedCost,
    budget: MONTHLY_BUDGET,
    percentageUsed: (monthlyCost / MONTHLY_BUDGET) * 100,
    projectedPercentage: (projectedCost / MONTHLY_BUDGET) * 100
  };
}
```

#### Dashboard Display

Ensure cost metrics are displayed in admin dashboard:

```typescript
// In admin dashboard component
const [costMetrics, setCostMetrics] = useState(null);

useEffect(() => {
  const fetchCostMetrics = async () => {
    const response = await fetch('/api/usage/metrics');
    const data = await response.json();
    setCostMetrics(data);
  };
  
  fetchCostMetrics();
  const interval = setInterval(fetchCostMetrics, 300000); // Update every 5 minutes
  
  return () => clearInterval(interval);
}, []);
```

---

## 4. Performance Monitoring

### Purpose
Track system performance to ensure responsive user experience.

### Metrics to Track

1. **API Response Times**
   - Datapro API response time
   - Verification endpoint response time
   - Bulk verification processing time

2. **Database Performance**
   - Firestore read/write latency
   - Query execution time

3. **Server Resources**
   - CPU usage
   - Memory usage
   - Disk usage

### Implementation

#### Response Time Tracking

Add middleware to track response times:

```javascript
// In server.js
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (> 5 seconds)
    if (duration > 5000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Track metrics
    trackResponseTime(req.path, duration);
  });
  
  next();
});
```

#### Performance Alerts

Configure alerts for slow performance:

```bash
# Performance Alert Thresholds
RESPONSE_TIME_WARNING=5000   # Warn if response > 5 seconds
RESPONSE_TIME_CRITICAL=10000 # Critical if response > 10 seconds
```

---

## 5. Security Monitoring

### Purpose
Monitor for security threats and unauthorized access attempts.

### Metrics to Track

1. **Failed Login Attempts**
2. **Unauthorized Access Attempts**
3. **Suspicious Activity Patterns**
4. **Encryption/Decryption Errors**

### Implementation

The security monitoring is already implemented via `server-utils/auditLogger.cjs`. Ensure alerts are configured:

```bash
# Security Alert Configuration
SECURITY_ALERT_EMAIL=security@nem-insurance.com
FAILED_LOGIN_THRESHOLD=5  # Alert after 5 failed attempts
SUSPICIOUS_ACTIVITY_ENABLED=true
```

---

## Alert Testing Checklist

Before going live, test all alert mechanisms:

### API Health Alerts
- [ ] Test API down alert (simulate Datapro API failure)
- [ ] Test API recovery alert
- [ ] Verify email delivery
- [ ] Verify Slack notification (if configured)
- [ ] Verify PagerDuty alert (if configured)

### Error Rate Alerts
- [ ] Test warning threshold (10% error rate)
- [ ] Test critical threshold (25% error rate)
- [ ] Verify alert contains error breakdown
- [ ] Verify alert delivery to all channels

### Cost Alerts
- [ ] Test daily budget alert (80% threshold)
- [ ] Test monthly budget alert (80% threshold)
- [ ] Verify cost projection calculation
- [ ] Verify alert delivery

### Performance Alerts
- [ ] Test slow response alert (> 5 seconds)
- [ ] Test critical response alert (> 10 seconds)
- [ ] Verify alert contains request details

### Security Alerts
- [ ] Test failed login alert
- [ ] Test unauthorized access alert
- [ ] Verify alert delivery to security team

---

## Monitoring Dashboard

### Admin Dashboard Components

Ensure the following metrics are visible in the admin dashboard:

1. **System Health Status**
   - API status (up/down)
   - Last health check time
   - Response time

2. **Error Rate**
   - Current hour error rate
   - 24-hour trend
   - Error type breakdown

3. **Cost Metrics**
   - Today's cost
   - Month-to-date cost
   - Projected month-end cost
   - Budget remaining

4. **Performance Metrics**
   - Average response time
   - Slow request count
   - Active verification count

5. **Recent Alerts**
   - List of recent alerts
   - Alert severity
   - Alert timestamp

### Dashboard Refresh Rate

Configure dashboard refresh intervals:

```typescript
// Refresh intervals
const HEALTH_CHECK_INTERVAL = 60000;      // 1 minute
const ERROR_RATE_INTERVAL = 300000;       // 5 minutes
const COST_METRICS_INTERVAL = 300000;     // 5 minutes
const PERFORMANCE_INTERVAL = 60000;       // 1 minute
```

---

## Monitoring Maintenance

### Daily Tasks
- [ ] Review error rate trends
- [ ] Check cost usage vs budget
- [ ] Review performance metrics
- [ ] Check for any alerts

### Weekly Tasks
- [ ] Review alert history
- [ ] Analyze error patterns
- [ ] Review cost trends
- [ ] Update alert thresholds if needed

### Monthly Tasks
- [ ] Generate monitoring report
- [ ] Review and optimize alert rules
- [ ] Update budget limits for next month
- [ ] Archive old metrics data

---

## Troubleshooting

### Alerts Not Being Received

**Check:**
1. SMTP configuration is correct
2. Slack webhook URL is valid
3. PagerDuty integration key is correct
4. Email addresses are correct
5. Check spam/junk folders

### Metrics Not Updating

**Check:**
1. Monitoring services are running
2. Firestore permissions are correct
3. No errors in server logs
4. Dashboard is fetching data correctly

### False Alerts

**Check:**
1. Alert thresholds are appropriate
2. No network issues causing false positives
3. Monitoring intervals are correct

---

## Emergency Response

### High Error Rate (> 25%)

1. Check Datapro API status
2. Review recent error logs
3. Check for data quality issues
4. Consider switching to mock mode if critical
5. Notify technical team immediately

### Budget Exceeded

1. Review API call patterns
2. Check for unusual activity
3. Implement rate limiting if needed
4. Notify management
5. Consider temporary suspension if necessary

### API Down

1. Check Datapro API status page
2. Contact Datapro support
3. Switch to mock mode temporarily
4. Notify users of service disruption
5. Monitor for recovery

---

**Last Updated**: [Date]

**Monitoring Owner**: [Name/Team]

**Next Review Date**: [Date]
