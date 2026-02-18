# API Analytics & Cost Tracking Dashboard - Specification

## Overview

Build an admin dashboard to visualize API usage, costs, and generate downloadable reports. All the data is already being collected - we just need to surface it in a user-friendly interface.

---

## What Data We're Already Tracking

### ✅ Currently Collected (No Changes Needed):
1. **API Usage** (Firestore: `api-usage`, `api-usage-logs`)
   - Daily/monthly call counts
   - Success/failure rates
   - Per-provider breakdown (Datapro, VerifyData)
   - Individual call logs with timestamps

2. **Cost Data**
   - Estimated costs per call
   - Datapro: ₦50 per successful call
   - VerifyData: ₦100 per successful call

3. **User Attribution**
   - User ID who initiated verification
   - List ID (for bulk verifications)
   - Entry ID (specific record)

4. **Audit Logs** (Firestore: `verification-audit-logs`)
   - Verification type (NIN, CAC)
   - Result (success/failure)
   - Timestamps
   - IP addresses (masked)
   - Device/browser info

---

## Dashboard Requirements

### 1. **Overview Page** (Landing Page)

**Metrics Cards** (Top of page):
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ This Month      │ Today           │ Success Rate    │ Estimated Cost  │
│ 1,234 calls     │ 45 calls        │ 96.5%           │ ₦67,850         │
│ ↑ 12% vs last   │ ↓ 5% vs avg     │ ↑ 2.1%          │ ↑ ₦5,200        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Charts**:
- Line chart: Daily API calls (last 30 days)
- Bar chart: Calls by provider (Datapro vs VerifyData)
- Pie chart: Success vs Failed calls
- Area chart: Daily costs (last 30 days)

**Quick Stats Table**:
| Provider    | Today | This Week | This Month | Total Cost |
|-------------|-------|-----------|------------|------------|
| Datapro     | 25    | 180       | 850        | ₦42,500    |
| VerifyData  | 20    | 145       | 384        | ₦38,400    |

---

### 2. **Detailed Analytics Page**

**Filters** (Top bar):
```
Date Range: [Start Date] to [End Date]  |  Provider: [All/Datapro/VerifyData]  |  Status: [All/Success/Failed]
```

**Data Tables**:

#### Daily Breakdown Table:
| Date       | Total Calls | Success | Failed | Success Rate | Cost    |
|------------|-------------|---------|--------|--------------|---------|
| 2026-02-16 | 45          | 43      | 2      | 95.6%        | ₦2,150  |
| 2026-02-15 | 52          | 50      | 2      | 96.2%        | ₦2,500  |
| ...        | ...         | ...     | ...    | ...          | ...     |

#### Provider Comparison:
| Provider   | Total Calls | Success Rate | Avg Daily | Total Cost | Cost/Call |
|------------|-------------|--------------|-----------|------------|-----------|
| Datapro    | 850         | 96.5%        | 28        | ₦42,500    | ₦50       |
| VerifyData | 384         | 94.8%        | 13        | ₦38,400    | ₦100      |

---

### 3. **User/Broker Attribution Page**

**Purpose**: Answer "Who is using the API the most?"

**Top Users Table**:
| User Email              | Role   | Total Calls | Success | Failed | Total Cost |
|-------------------------|--------|-------------|---------|--------|------------|
| broker1@example.com     | Broker | 245         | 240     | 5      | ₦12,000    |
| broker2@example.com     | Broker | 189         | 185     | 4      | ₦9,250     |
| admin@neminsurance.com  | Admin  | 156         | 155     | 1      | ₦7,800     |

**By Identity List** (for bulk verifications):
| List Name           | Created By          | Total Calls | Cost    | Status    |
|---------------------|---------------------|-------------|---------|-----------|
| Corporate KYC Q1    | broker1@example.com | 120         | ₦6,000  | Completed |
| Individual CDD Feb  | broker2@example.com | 89          | ₦4,450  | In Progress |

**Charts**:
- Bar chart: Top 10 users by API usage
- Pie chart: Usage by role (Admin, Broker, Staff)

---

### 4. **Cost Tracking Page**

**Monthly Budget Tracker**:
```
┌─────────────────────────────────────────────────────────────┐
│ February 2026 Budget                                        │
│                                                             │
│ ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ₦67,850 / ₦100,000 (67.9%)                                 │
│                                                             │
│ Remaining: ₦32,150  |  Days Left: 12  |  Projected: ₦95,200│
└─────────────────────────────────────────────────────────────┘
```

**Cost Breakdown**:
- By Provider (Datapro vs VerifyData)
- By Verification Type (NIN vs CAC)
- By User/Broker
- By Time Period (Daily/Weekly/Monthly)

**Historical Comparison**:
| Month      | Total Calls | Total Cost | Avg Cost/Day | vs Previous |
|------------|-------------|------------|--------------|-------------|
| Feb 2026   | 1,234       | ₦67,850    | ₦2,394       | ↑ 12%       |
| Jan 2026   | 1,102       | ₦60,600    | ₦1,955       | ↑ 8%        |
| Dec 2025   | 1,020       | ₦56,100    | ₦1,810       | -           |

---

### 5. **Audit Logs Page**

**Purpose**: Detailed verification history with search/filter

**Filters**:
```
Date Range: [___] to [___]  |  User: [All Users ▼]  |  Type: [All/NIN/CAC ▼]  |  Result: [All/Success/Failed ▼]
Search: [Search by identity number (masked)...]
```

**Logs Table**:
| Timestamp           | Type | Identity (Masked) | User                | Result  | Error | IP Address    | Device  |
|---------------------|------|-------------------|---------------------|---------|-------|---------------|---------|
| 2026-02-16 14:32:15 | NIN  | 1234*******       | broker1@example.com | Success | -     | 192.168.x.x   | Desktop |
| 2026-02-16 14:30:22 | CAC  | RC69***           | admin@nem.com       | Failed  | E001  | 10.0.x.x      | Mobile  |

**Export Button**: Download as CSV/Excel

---

### 6. **Reports Page**

**Pre-built Reports**:

1. **Monthly Cost Report**
   - Summary of all API usage for the month
   - Breakdown by provider, user, verification type
   - Charts and graphs
   - Export as PDF

2. **User Activity Report**
   - Per-user breakdown of API usage
   - Cost attribution
   - Success rates
   - Export as Excel

3. **Budget vs Actual Report**
   - Compare budgeted vs actual spending
   - Forecast for end of month
   - Variance analysis
   - Export as PDF

4. **Audit Trail Report**
   - Complete verification history
   - Compliance-ready format
   - Includes all metadata
   - Export as CSV

**Report Generation**:
```
┌─────────────────────────────────────────────────────────────┐
│ Generate Report                                             │
│                                                             │
│ Report Type: [Monthly Cost Report ▼]                       │
│ Date Range:  [Feb 1, 2026] to [Feb 28, 2026]              │
│ Format:      [PDF ▼]                                        │
│                                                             │
│ [Generate Report]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Frontend Components Needed:

1. **`src/pages/admin/APIAnalyticsDashboard.tsx`**
   - Overview page with metrics cards and charts

2. **`src/pages/admin/APIDetailedAnalytics.tsx`**
   - Detailed tables with filters

3. **`src/pages/admin/APIUserAttribution.tsx`**
   - User/broker usage breakdown

4. **`src/pages/admin/APICostTracking.tsx`**
   - Budget tracking and cost analysis

5. **`src/pages/admin/APIAuditLogs.tsx`**
   - Searchable audit log viewer

6. **`src/pages/admin/APIReports.tsx`**
   - Report generation interface

### Services Needed:

1. **`src/services/apiAnalyticsService.ts`**
   ```typescript
   // Fetch usage stats
   getUsageStats(startDate, endDate, provider?)
   
   // Get monthly summary
   getMonthlySummary(month, provider?)
   
   // Get user attribution
   getUserAttribution(startDate, endDate)
   
   // Get audit logs
   getAuditLogs(filters)
   
   // Generate report
   generateReport(reportType, params)
   ```

2. **`src/services/reportGenerationService.ts`**
   ```typescript
   // Generate PDF report
   generatePDFReport(data, template)
   
   // Generate Excel report
   generateExcelReport(data, template)
   
   // Generate CSV export
   generateCSVExport(data)
   ```

### Backend Endpoints Needed:

Add to `server.js`:

```javascript
// Get usage statistics
app.get('/api/analytics/usage', async (req, res) => {
  const { startDate, endDate, provider } = req.query;
  const stats = await getAPIUsageStats(db, startDate, endDate, provider);
  res.json(stats);
});

// Get monthly summary
app.get('/api/analytics/monthly/:month', async (req, res) => {
  const { month } = req.params;
  const { provider } = req.query;
  const summary = await getMonthlyUsageSummary(db, month, provider);
  res.json(summary);
});

// Get user attribution
app.get('/api/analytics/users', async (req, res) => {
  const { startDate, endDate } = req.query;
  // Query api-usage-logs grouped by userId
  // Return aggregated data
});

// Get audit logs
app.get('/api/analytics/audit-logs', async (req, res) => {
  const filters = req.query;
  const logs = await queryAuditLogs(filters);
  res.json(logs);
});

// Generate report
app.post('/api/analytics/reports/generate', async (req, res) => {
  const { reportType, params } = req.body;
  // Generate report based on type
  // Return download URL or file
});
```

---

## Data Queries

### Query 1: User Attribution
```javascript
// Get API usage by user
const userUsage = await db.collection('api-usage-logs')
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate)
  .get();

// Group by userId and aggregate
const userStats = {};
userUsage.forEach(doc => {
  const data = doc.data();
  if (!userStats[data.userId]) {
    userStats[data.userId] = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      cost: 0
    };
  }
  userStats[data.userId].totalCalls++;
  if (data.success) {
    userStats[data.userId].successCalls++;
    const costPerCall = data.apiProvider === 'datapro' ? 50 : 100;
    userStats[data.userId].cost += costPerCall;
  } else {
    userStats[data.userId].failedCalls++;
  }
});
```

### Query 2: Daily Breakdown
```javascript
// Already available via getAPIUsageStats()
const stats = await getAPIUsageStats(db, startDate, endDate, provider);
// Returns dailyStats array with all needed data
```

### Query 3: Budget Tracking
```javascript
// Get current month usage
const currentMonth = new Date().toISOString().substring(0, 7);
const summary = await getMonthlyUsageSummary(db, currentMonth);

// Calculate projections
const daysInMonth = new Date(year, month, 0).getDate();
const currentDay = new Date().getDate();
const daysRemaining = daysInMonth - currentDay;
const avgDailyCost = summary.estimatedCost / currentDay;
const projectedCost = avgDailyCost * daysInMonth;
```

---

## Export Formats

### CSV Export (Audit Logs):
```csv
Timestamp,Type,Identity,User,Result,Error,IP,Device
2026-02-16 14:32:15,NIN,1234*******,broker1@example.com,Success,-,192.168.x.x,Desktop
2026-02-16 14:30:22,CAC,RC69***,admin@nem.com,Failed,E001,10.0.x.x,Mobile
```

### Excel Export (Cost Report):
- Sheet 1: Summary (metrics, charts)
- Sheet 2: Daily Breakdown
- Sheet 3: User Attribution
- Sheet 4: Provider Comparison

### PDF Report:
- Header with company logo
- Executive summary
- Charts and graphs
- Detailed tables
- Footer with generation date

---

## Access Control

**Who Can Access**:
- ✅ Admin users only
- ✅ Super Admin (full access)
- ❌ Brokers (no access to cost data)
- ❌ Staff (no access)

**Permissions**:
```typescript
// Check if user can access analytics
if (userRole !== 'admin' && userRole !== 'super_admin') {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

---

## UI/UX Considerations

### Charts Library:
Use **Recharts** (already in your project):
```typescript
import { LineChart, BarChart, PieChart, AreaChart } from 'recharts';
```

### Date Range Picker:
Use **react-datepicker** or **shadcn/ui date-range-picker**

### Tables:
Use **shadcn/ui Table** component with sorting/filtering

### Export Buttons:
```typescript
<Button onClick={() => exportToCSV(data)}>
  <Download className="mr-2" /> Export CSV
</Button>
```

---

## Implementation Priority

### Phase 1: Core Dashboard (Week 1)
1. ✅ Overview page with metrics cards
2. ✅ Basic charts (daily usage, provider breakdown)
3. ✅ Simple data tables

### Phase 2: Detailed Analytics (Week 2)
1. ✅ Detailed analytics page with filters
2. ✅ User attribution page
3. ✅ Audit logs viewer

### Phase 3: Cost Tracking (Week 3)
1. ✅ Budget tracking page
2. ✅ Cost projections
3. ✅ Historical comparisons

### Phase 4: Reports (Week 4)
1. ✅ Report generation interface
2. ✅ PDF/Excel export
3. ✅ Scheduled reports (optional)

---

## Success Metrics

After implementation, you should be able to answer:

✅ "How much did we spend on API calls this month?"
✅ "Which broker is using the most API calls?"
✅ "What's our success rate for NIN verifications?"
✅ "Are we on track to stay within budget?"
✅ "Show me all failed verifications from last week"
✅ "Generate a monthly cost report for finance"

---

## Next Steps

1. **Review this spec** - Does it cover your needs?
2. **Prioritize features** - What do you need first?
3. **Create implementation tasks** - Break down into smaller tasks
4. **Start with Phase 1** - Get basic dashboard working
5. **Iterate** - Add features based on feedback

Would you like me to create a detailed task list or start implementing the dashboard?
