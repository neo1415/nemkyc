'use strict';

module.exports = function register(app, ctx) {
  const {
    db,
    isValidEmail,
    logAuditSecurityEvent,
    requireAuth,
    requireSuperAdmin,
    sanitizeEmail,
    sanitizeEmailSubject,
    transporter,
  } = ctx;

// ============= ANALYTICS API =============

/**
 * Analytics API Health Check
 * 
 * GET /api/analytics/health
 * 
 * Response:
 * - status: 'healthy' or 'unhealthy'
 * - timestamp: Current server time
 * - services: Status of dependent services
 */
app.get('/api/analytics/health', async (req, res) => {
  try {
    // Check Firestore connectivity
    const healthCheck = await db.collection('health-check').doc('test').get();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        firestore: 'connected',
        analytics: 'operational'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Get analytics dashboard overview
 * 
 * GET /api/analytics/overview?month=YYYY-MM
 * 
 * Query parameters:
 * - month: Month in YYYY-MM format (optional, defaults to current month)
 * 
 * Response:
 * - totalCalls: Total API calls in period
 * - successfulCalls: Successful API calls
 * - failedCalls: Failed API calls
 * - totalCost: Total cost in period
 * - successRate: Success rate percentage
 * - avgResponseTime: Average response time in ms
 * - comparison: Comparison with previous period
 * 
 * Security: Super admin only, rate limited
 * Performance: Cached for 2 minutes
 */
app.get('/api/analytics/overview', requireAuth, requireSuperAdmin, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Input validation
    const month = req.query.month || new Date().toISOString().substring(0, 7);
    
    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        error: 'Invalid month format',
        message: 'Month must be in YYYY-MM format'
      });
    }
    
    // Validate month is not in the future
    const requestedDate = new Date(month + '-01');
    const now = new Date();
    if (requestedDate > now) {
      return res.status(400).json({
        error: 'Invalid month',
        message: 'Cannot request data for future months'
      });
    }
    
    console.log(`📊 Super Admin ${req.user.email} fetching analytics overview for ${month}`);
    
    // Log to audit system
    await logAuditSecurityEvent({
      eventType: 'analytics_access',
      severity: 'low',
      description: `Super Admin ${req.user.email} accessed analytics overview for ${month}`,
      userId: req.user.uid,
      ipAddress: req.ip,
      metadata: {
        month,
        userEmail: req.user.email,
        userAgent: req.get('user-agent')
      }
    });
    
    // Query api-usage collection for the month
    const snapshot = await db.collection('api-usage')
      .where('period', '==', 'monthly')
      .where('month', '==', month)
      .get();
    
    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalCalls += data.totalCalls || 0;
      successfulCalls += data.successCalls || 0;
      failedCalls += data.failedCalls || 0;
    });
    
    // Calculate costs and provider breakdown from api-usage-logs
    // Query individual call logs for accurate provider breakdown
    let usageLogsSnapshot;
    let dataproCalls = 0;
    let verifydataCalls = 0;
    let dataproSuccessCalls = 0;
    let verifydataSuccessCalls = 0;
    let dataproCost = 0;
    let verifydataCost = 0;
    let totalCostFromLogs = 0;
    
    try {
      usageLogsSnapshot = await db.collection('api-usage-logs')
        .where('month', '==', month)
        .get();
      
      usageLogsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Count calls by provider and track successful calls
        if (data.apiProvider === 'datapro') {
          dataproCalls++;
          if (data.success) {
            dataproSuccessCalls++;
            dataproCost += 100; // ₦100 per successful NIN verification
          }
        } else if (data.apiProvider === 'verifydata') {
          verifydataCalls++;
          if (data.success) {
            verifydataSuccessCalls++;
            verifydataCost += 100; // ₦100 per successful CAC verification
          }
        }
        
        // Sum actual costs from logs (uses stored cost field if available)
        if (data.cost !== undefined && data.cost !== null) {
          totalCostFromLogs += data.cost;
        }
      });
    } catch (error) {
      console.error('Error querying api-usage-logs by month:', error);
      console.log('Skipping detailed cost breakdown - using estimation from api-usage collection');
      // Don't throw - just use the aggregated data from api-usage collection
      // The costs will be estimated below based on call counts
    }
    
    // Use calculated cost from logs if available, otherwise fall back to estimation
    const totalCost = totalCostFromLogs > 0 
      ? totalCostFromLogs 
      : dataproCost + verifydataCost; // Use calculated costs based on successful calls only
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    
    // Get previous month for comparison
    const prevMonthDate = new Date(month + '-01');
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toISOString().substring(0, 7);
    
    const prevSnapshot = await db.collection('api-usage')
      .where('period', '==', 'monthly')
      .where('month', '==', prevMonth)
      .get();
    
    let prevTotalCalls = 0;
    let prevSuccessfulCalls = 0;
    
    prevSnapshot.forEach(doc => {
      const data = doc.data();
      prevTotalCalls += data.totalCalls || 0;
      prevSuccessfulCalls += data.successCalls || 0;
    });
    
    const callsChange = prevTotalCalls > 0 
      ? ((totalCalls - prevTotalCalls) / prevTotalCalls) * 100 
      : 0;
    
    const prevSuccessRate = prevTotalCalls > 0 
      ? (prevSuccessfulCalls / prevTotalCalls) * 100 
      : 0;
    
    const successRateChange = prevSuccessRate > 0 
      ? successRate - prevSuccessRate 
      : 0;
    
    
    res.status(200).json({
      totalCalls,
      successfulCalls,
      failedCalls,
      dataproCalls,
      verifydataCalls,
      dataproCost, // Use calculated cost (only successful calls)
      verifydataCost, // Use calculated cost (only successful calls)
      totalCost,
      successRate: parseFloat(successRate.toFixed(2)),
      failureRate: parseFloat(((failedCalls / totalCalls) * 100 || 0).toFixed(2)),
      periodStart: new Date(month + '-01'),
      periodEnd: new Date(month + '-01'),
      avgResponseTime: 0, // Not tracked yet
      previousPeriodComparison: {
        callsChange: parseFloat(callsChange.toFixed(2)),
        costChange: 0, // Not calculated yet
        successRateChange: parseFloat(successRateChange.toFixed(2))
      },
      metadata: {
        requestTime: Date.now() - startTime,
        cached: false,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching analytics overview:', error);
    
    // Log error to audit system
    await logAuditSecurityEvent({
      eventType: 'analytics_error',
      severity: 'medium',
      description: `Analytics overview fetch failed for ${req.query.month}`,
      userId: req.user?.uid || 'unknown',
      ipAddress: req.ip,
      metadata: {
        error: error.message,
        month: req.query.month,
        userEmail: req.user?.email
      }
    }).catch(err => console.error('Failed to log error:', err));
    
    res.status(500).json({
      error: 'Failed to fetch analytics overview',
      message: error.message,
      requestId: `req_${Date.now()}`
    });
  }
});

/**
 * Get daily usage data for charts
 * 
 * GET /api/analytics/daily-usage?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Query parameters:
 * - startDate: Start date in YYYY-MM-DD format (required)
 * - endDate: End date in YYYY-MM-DD format (required)
 * 
 * Response:
 * - dailyData: Array of daily usage objects with date, totalCalls, successfulCalls, failedCalls
 * - metadata: Request metadata including timing info
 * 
 * Security: Super admin only, rate limited
 * Performance: Limited to 365 days max range
 */
app.get('/api/analytics/daily-usage', requireAuth, requireSuperAdmin, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { startDate, endDate } = req.query;
    
    // Input validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'startDate and endDate are required',
        example: '/api/analytics/daily-usage?startDate=2024-01-01&endDate=2024-01-31'
      });
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }
    
    // Validate date range
    const start = new Date(startDate + 'T00:00:00Z'); // Parse as UTC midnight
    const end = new Date(endDate + 'T23:59:59Z'); // Parse as UTC end of day
    const now = new Date();
    
    if (start > end) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before or equal to endDate'
      });
    }
    
    // Allow endDate to be today or in the past (compare dates only, not time)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    // Allow endDate to be up to tomorrow (to account for timezone differences)
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
    
    if (endDateOnly > tomorrowMidnight) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'endDate cannot be more than 1 day in the future'
      });
    }
    
    // Validate date range is not too large (max 365 days)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      return res.status(400).json({
        error: 'Date range too large',
        message: 'Maximum date range is 365 days'
      });
    }
    
    console.log(`📊 Super Admin ${req.user.email} fetching daily usage from ${startDate} to ${endDate}`);
    
    // Log to audit system
    await logAuditSecurityEvent({
      eventType: 'analytics_access',
      severity: 'low',
      description: `Super Admin ${req.user.email} accessed daily usage analytics`,
      userId: req.user.uid,
      ipAddress: req.ip,
      metadata: {
        startDate,
        endDate,
        userEmail: req.user.email,
        userAgent: req.get('user-agent')
      }
    });
    
    // Query api-usage-logs for the date range
    let logsSnapshot;
    try {
      logsSnapshot = await db.collection('api-usage-logs')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();
    } catch (error) {
      console.error('Error querying api-usage-logs by date range:', error);
      return res.status(500).json({
        error: 'Database query failed',
        message: 'Unable to query analytics data. This endpoint requires Firestore composite indexes. Please check Firebase console.'
      });
    }
    
    // Aggregate by date
    const dailyStatsMap = new Map();
    
    logsSnapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date;
      
      if (!date) return; // Skip if no date field
      
      if (!dailyStatsMap.has(date)) {
        dailyStatsMap.set(date, {
          date,
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          dataproCalls: 0,
          verifydataCalls: 0,
          dataproSuccessCalls: 0,
          verifydataSuccessCalls: 0,
          dataproCost: 0,
          verifydataCost: 0,
          totalCost: 0
        });
      }
      
      const stats = dailyStatsMap.get(date);
      stats.totalCalls++;
      
      if (data.success) {
        stats.successfulCalls++;
      } else {
        stats.failedCalls++;
      }
      
      // Count by provider and calculate costs
      // Only successful calls are charged: ₦100 per successful verification
      if (data.apiProvider === 'datapro') {
        stats.dataproCalls++;
        if (data.success) {
          stats.dataproSuccessCalls++;
          stats.dataproCost += 100; // ₦100 per successful NIN verification
          stats.totalCost += 100;
        }
      } else if (data.apiProvider === 'verifydata') {
        stats.verifydataCalls++;
        if (data.success) {
          stats.verifydataSuccessCalls++;
          stats.verifydataCost += 100; // ₦100 per successful CAC verification
          stats.totalCost += 100;
        }
      }
    });
    
    // Convert map to array and fill in missing dates
    const dailyData = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      
      if (dailyStatsMap.has(dateKey)) {
        dailyData.push(dailyStatsMap.get(dateKey));
      } else {
        // Add entry with zero counts for days with no data
        dailyData.push({
          date: dateKey,
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          dataproCalls: 0,
          verifydataCalls: 0,
          dataproSuccessCalls: 0,
          verifydataSuccessCalls: 0,
          dataproCost: 0,
          verifydataCost: 0,
          totalCost: 0
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sort chronologically (should already be sorted, but ensure it)
    dailyData.sort((a, b) => a.date.localeCompare(b.date));
    
    res.status(200).json({
      dailyData,
      metadata: {
        totalDays: dailyData.length,
        requestTime: Date.now() - startTime,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching daily usage:', error);
    
    // Log error to audit system
    await logAuditSecurityEvent({
      eventType: 'analytics_error',
      severity: 'medium',
      description: `Daily usage fetch failed`,
      userId: req.user?.uid || 'unknown',
      ipAddress: req.ip,
      metadata: {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        userEmail: req.user?.email
      }
    }).catch(err => console.error('Failed to log error:', err));
    
    res.status(500).json({
      error: 'Failed to fetch daily usage',
      message: error.message,
      requestId: `req_${Date.now()}`
    });
  }
});

/**
 * Get user attribution data - shows all users who create lists and send links
 * 
 * GET /api/analytics/user-attribution?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&sortBy=calls&order=desc
 * 
 * Query parameters:
 * - startDate: Start date in YYYY-MM-DD format (required)
 * - endDate: End date in YYYY-MM-DD format (required)
 * - sortBy: Sort field - 'calls', 'cost', 'successRate', or 'role' (optional)
 * - order: Sort order - 'asc' or 'desc' (optional, default: 'desc')
 * - limit: Maximum number of users to return (optional, default: 100, max: 1000)
 * 
 * Response:
 * - users: Array of user attribution objects with role information
 * - metadata: Request metadata including timing and pagination info
 * 
 * Security: Super admin only, rate limited
 * Performance: Query limited to prevent memory issues
 */
app.get('/api/analytics/user-attribution', requireAuth, requireSuperAdmin, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { startDate, endDate, sortBy = 'calls', order = 'desc', limit = 100 } = req.query;
    
    // Input validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'startDate and endDate are required',
        example: '/api/analytics/user-attribution?startDate=2024-01-01&endDate=2024-01-31'
      });
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }
    
    // Validate date range
    const start = new Date(startDate + 'T00:00:00Z'); // Parse as UTC midnight
    const end = new Date(endDate + 'T23:59:59Z'); // Parse as UTC end of day
    const now = new Date();
    
    if (start > end) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before or equal to endDate'
      });
    }
    
    // Allow endDate to be today or in the past (compare dates only, not time)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    // Allow endDate to be up to tomorrow (to account for timezone differences)
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
    
    if (endDateOnly > tomorrowMidnight) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'endDate cannot be more than 1 day in the future'
      });
    }
    
    // Validate date range is not too large (max 1 year)
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      return res.status(400).json({
        error: 'Date range too large',
        message: 'Maximum date range is 365 days'
      });
    }
    
    // Validate sortBy
    const validSortFields = ['calls', 'cost', 'successRate', 'role'];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        error: 'Invalid sortBy parameter',
        message: `sortBy must be one of: ${validSortFields.join(', ')}`
      });
    }
    
    // Validate order
    if (order !== 'asc' && order !== 'desc') {
      return res.status(400).json({
        error: 'Invalid order parameter',
        message: 'order must be either "asc" or "desc"'
      });
    }
    
    // Validate and sanitize limit
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    
    console.log(`📊 Super Admin ${req.user.email} fetching user attribution from ${startDate} to ${endDate}`);
    
    // Log to audit system
    await logAuditSecurityEvent({
      eventType: 'analytics_access',
      severity: 'low',
      description: `Super Admin ${req.user.email} accessed user attribution analytics`,
      userId: req.user.uid,
      ipAddress: req.ip,
      metadata: {
        startDate,
        endDate,
        sortBy,
        order,
        limit: parsedLimit,
        userEmail: req.user.email,
        userAgent: req.get('user-agent')
      }
    });
    
    // Query api-usage-logs for the date range with limit
    // Use date field for filtering (more reliable than timestamp)
    let logsSnapshot;
    try {
      logsSnapshot = await db.collection('api-usage-logs')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .limit(10000) // Hard limit to prevent memory issues
        .get();
      
      console.log(`📊 [UserAttribution] Query returned ${logsSnapshot.size} api-usage-logs documents for ${startDate} to ${endDate}`);
    } catch (error) {
      console.error('Error querying api-usage-logs by date:', error);
      return res.status(500).json({
        error: 'Database query failed',
        message: 'Unable to query analytics data. This endpoint requires Firestore composite indexes. Please check Firebase console.'
      });
    }
    
    // Check if we hit the limit
    const hitLimit = logsSnapshot.size >= 10000;
    if (hitLimit) {
      console.warn(`⚠️ User attribution query hit 10000 record limit for ${startDate} to ${endDate}`);
    }
    
    // First, aggregate by listId (not userId, since customer verifications have userId = null)
    const listStatsMap = new Map();
    const listToUserIdMap = new Map(); // NEW: Track userId for fallback attribution
    
    console.log(`📊 [UserAttribution] Processing ${logsSnapshot.size} api-usage-logs documents`);
    
    logsSnapshot.forEach(doc => {
      const data = doc.data();
      const listId = data.listId || 'unknown';
      const userId = data.userId; // NEW: Capture userId for fallback
      
      if (!listStatsMap.has(listId)) {
        listStatsMap.set(listId, {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          dataproCalls: 0,
          verifydataCalls: 0,
          totalCost: 0  // NEW: Track actual cost from logs
        });
      }
      
      const stats = listStatsMap.get(listId);
      stats.totalCalls++;
      
      if (data.success) {
        stats.successfulCalls++;
      } else {
        stats.failedCalls++;
      }
      
      // Track by provider
      if (data.apiProvider === 'datapro') {
        stats.dataproCalls++;
      } else if (data.apiProvider === 'verifydata') {
        stats.verifydataCalls++;
      }
      
      // NEW: Sum actual cost from logs (only count costs > 0 for successful calls)
      if (data.cost !== undefined && data.cost !== null && data.cost > 0) {
        stats.totalCost += data.cost;
      }
      
      // NEW: Store userId for fallback attribution
      if (!listToUserIdMap.has(listId)) {
        listToUserIdMap.set(listId, new Set());
      }
      if (userId) {
        listToUserIdMap.get(listId).add(userId);
      }
    });
    
    console.log(`📊 [UserAttribution] Aggregated into ${listStatsMap.size} unique lists`);
    
    // Now look up createdBy for each listId and aggregate by user
    const userStatsMap = new Map();
    
    console.log(`📊 [UserAttribution] Looking up createdBy for ${listStatsMap.size} lists`);
    
    for (const [listId, stats] of listStatsMap.entries()) {
      console.log(`📊 [UserAttribution] Processing listId: ${listId}, calls: ${stats.totalCalls}, cost: ${stats.totalCost}`);
      
      let attributedUserId = null;
      
      // Try list-based attribution first (skip 'unknown' listIds)
      if (listId !== 'unknown') {
        try {
          const listDoc = await db.collection('identity-lists').doc(listId).get();
          if (listDoc.exists) {
            const listData = listDoc.data();
            attributedUserId = listData.createdBy;
            console.log(`✅ [UserAttribution] List ${listId} created by: ${attributedUserId}`);
          } else {
            console.log(`⚠️ [UserAttribution] List ${listId} not found in identity-lists collection`);
          }
        } catch (err) {
          console.error(`❌ [UserAttribution] Error fetching list ${listId}:`, err);
        }
      }
      
      // NEW: Fallback to userId from api-usage-logs if list lookup failed
      if (!attributedUserId) {
        const userIds = listToUserIdMap.get(listId);
        if (userIds && userIds.size === 1) {
          // Single userId for this listId - use it
          attributedUserId = Array.from(userIds)[0];
          console.log(`🔄 [UserAttribution] Using fallback attribution for listId ${listId} -> userId ${attributedUserId}`);
        } else if (userIds && userIds.size > 1) {
          // Multiple userIds - attribute to each proportionally
          // For now, use the first one and log a warning
          attributedUserId = Array.from(userIds)[0];
          console.warn(`⚠️ [UserAttribution] Multiple userIds for listId ${listId}, using first: ${attributedUserId}`);
        } else {
          // No userId available - use 'unknown'
          attributedUserId = 'unknown';
          console.warn(`⚠️ [UserAttribution] No attribution available for listId ${listId}, using 'unknown'`);
        }
      }
      
      // Aggregate to userStatsMap (no more continue statements that drop entries)
      if (!userStatsMap.has(attributedUserId)) {
        userStatsMap.set(attributedUserId, {
          userId: attributedUserId,
          brokerId: attributedUserId, // Frontend expects brokerId
          userName: 'Loading...', // User attribution - not broker-specific
          userEmail: 'Loading...', // User attribution - not broker-specific
          userRole: 'unknown',
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          dataproCalls: 0,
          verifydataCalls: 0,
          totalCost: 0
        });
      }
      
      const userStats = userStatsMap.get(attributedUserId);
      userStats.totalCalls += stats.totalCalls;
      userStats.successfulCalls += stats.successfulCalls;
      userStats.failedCalls += stats.failedCalls;
      userStats.dataproCalls += stats.dataproCalls;
      userStats.verifydataCalls += stats.verifydataCalls;
      userStats.totalCost += stats.totalCost;  // NEW: Accumulate actual cost from logs
      
      console.log(`📊 [UserAttribution] User ${attributedUserId} now has ${userStats.totalCalls} calls, cost: ${userStats.totalCost}`);
    }
    
    // Fetch user details including role and lastActivity
    const users = [];
    
    console.log(`📊 [UserAttribution] Looking up details for ${userStatsMap.size} users`);
    
    for (const [userId, data] of userStatsMap.entries()) {
      console.log(`[UserAttribution] Processing userId: ${userId}, calls: ${data.totalCalls}, cost: ${data.totalCost}`);
      
      try {
        // Get user profile from users collection
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(`[UserAttribution] Found user in users collection:`, { email: userData.email, role: userData.role });
          data.userName = userData.displayName || userData.email || 'Unknown';
          data.userEmail = userData.email || 'unknown@example.com';
          data.userRole = userData.role || 'broker'; // Default to broker if role not set
        } else {
          console.log(`[UserAttribution] User ${userId} NOT found in users collection`);
          // User not found in users collection - keep defaults
          data.userName = 'Unknown';
          data.userEmail = 'unknown@example.com';
          data.userRole = 'unknown';
        }
        
        // Get lastActivity from userroles collection (session data)
        // userroles uses userId as document ID, so we can fetch directly
        const userRoleDoc = await db.collection('userroles').doc(userId).get();
        
        if (userRoleDoc.exists) {
          const sessionData = userRoleDoc.data();
          console.log(`[UserAttribution] Found session data with lastActivity:`, sessionData.lastActivity);
          data.lastActivity = sessionData.lastActivity || null;
          
          // If user not found in users collection, try to get info from userroles
          if (!userDoc.exists && sessionData.email) {
            console.log(`[UserAttribution] Using data from userroles:`, { email: sessionData.email, role: sessionData.role });
            data.userName = sessionData.name || sessionData.email || 'Unknown';
            data.userEmail = sessionData.email || 'unknown@example.com';
            data.userRole = sessionData.role || 'broker';
          }
        } else {
          console.log(`[UserAttribution] No session data found for userId: ${userId}`);
          data.lastActivity = null;
        }
      } catch (err) {
        console.error(`[UserAttribution] Error fetching user ${userId}:`, err);
        data.lastActivity = null;
      }
      
      // Calculate total cost from stored cost field if available, otherwise estimate
      // Use actual cost from logs (already accumulated above)
      // If no cost data available, fall back to estimation
      if (data.totalCost === 0 && (data.dataproCalls > 0 || data.verifydataCalls > 0)) {
        // Fallback: Estimate cost if cost field not available in logs
        data.totalCost = (data.dataproCalls * 100) + (data.verifydataCalls * 100); // Both cost ₦100
      }
      
      data.successRate = data.totalCalls > 0 
        ? parseFloat(((data.successfulCalls / data.totalCalls) * 100).toFixed(2))
        : 0;
      
      users.push(data);
    }
    
    // Sort users
    users.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'cost':
          aVal = a.totalCost;
          bVal = b.totalCost;
          break;
        case 'successRate':
          aVal = a.successRate;
          bVal = b.successRate;
          break;
        case 'role':
          // For string comparison
          return order === 'asc' 
            ? a.userRole.localeCompare(b.userRole) 
            : b.userRole.localeCompare(a.userRole);
        case 'calls':
        default:
          aVal = a.totalCalls;
          bVal = b.totalCalls;
          break;
      }
      
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    // Apply limit
    const limitedUsers = users.slice(0, parsedLimit);
    
    console.log(`📊 [UserAttribution] Returning ${limitedUsers.length} users (total found: ${users.length})`);
    
    res.status(200).json({ 
      users: limitedUsers,
      metadata: {
        totalUsers: users.length,
        returnedUsers: limitedUsers.length,
        hitQueryLimit: hitLimit,
        requestTime: Date.now() - startTime,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching broker usage:', error);
    
    // Log error to audit system
    await logAuditSecurityEvent({
      eventType: 'analytics_error',
      severity: 'medium',
      description: `Broker usage fetch failed`,
      userId: req.user?.uid || 'unknown',
      ipAddress: req.ip,
      metadata: {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        userEmail: req.user?.email
      }
    }).catch(err => console.error('Failed to log error:', err));
    
    res.status(500).json({
      error: 'Failed to fetch broker usage',
      message: error.message,
      requestId: `req_${Date.now()}`
    });
  }
});

/**
 * Get cost tracking data with budget monitoring
 * 
 * GET /api/analytics/cost-tracking?month=YYYY-MM
 * 
 * Query parameters:
 * - month: Month in YYYY-MM format (optional, defaults to current month)
 * 
 * Response:
 * - currentSpend: Current month spending
 * - projectedSpend: Projected end-of-month spending
 * - budget: Monthly budget limit
 * - alertLevel: 'none', 'warning', or 'critical'
 * - dailyAverage: Average daily spending
 * - breakdown: Cost breakdown by provider
 * - metadata: Request metadata
 * 
 * Security: Super admin only, rate limited
 */
app.get('/api/analytics/cost-tracking', requireAuth, requireSuperAdmin, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const month = req.query.month || new Date().toISOString().substring(0, 7);
    
    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        error: 'Invalid month format',
        message: 'Month must be in YYYY-MM format'
      });
    }
    
    // Validate month is not in the future
    const requestedDate = new Date(month + '-01');
    const currentDate = new Date();
    if (requestedDate > currentDate) {
      return res.status(400).json({
        error: 'Invalid month',
        message: 'Cannot request data for future months'
      });
    }
    
    console.log(`💰 Super Admin ${req.user.email} fetching cost tracking for ${month}`);
    
    // Log to audit system
    await logAuditSecurityEvent({
      eventType: 'analytics_access',
      severity: 'low',
      description: `Super Admin ${req.user.email} accessed cost tracking`,
      userId: req.user.uid,
      ipAddress: req.ip,
      metadata: {
        month,
        userEmail: req.user.email,
        userAgent: req.get('user-agent')
      }
    });
    
    // Get budget config
    const budgetDoc = await db.collection('budget-config').doc('default').get();
    const budget = budgetDoc.exists ? budgetDoc.data().monthlyBudget || 100000 : 100000;
    const warningThreshold = budgetDoc.exists ? budgetDoc.data().warningThreshold || 0.8 : 0.8;
    const criticalThreshold = budgetDoc.exists ? budgetDoc.data().criticalThreshold || 0.95 : 0.95;
    
    // Query usage for the month
    const dataproSnapshot = await db.collection('api-usage')
      .where('period', '==', 'monthly')
      .where('month', '==', month)
      .where('apiProvider', '==', 'datapro')
      .get();
    
    const verifydataSnapshot = await db.collection('api-usage')
      .where('period', '==', 'monthly')
      .where('month', '==', month)
      .where('apiProvider', '==', 'verifydata')
      .get();
    
    let dataproCalls = 0;
    let verifydataCalls = 0;
    
    let dataproSuccessCalls = 0;
    let verifydataSuccessCalls = 0;
    
    dataproSnapshot.forEach(doc => {
      const data = doc.data();
      // Only count successful calls for cost calculation
      // Failed verifications cost ₦0 per pricing policy
      dataproSuccessCalls += (data.successCalls || 0);
      dataproCalls += (data.successCalls || 0) + (data.failedCalls || 0);
    });
    
    verifydataSnapshot.forEach(doc => {
      const data = doc.data();
      // Only count successful calls for cost calculation
      // Failed verifications cost ₦0 per pricing policy
      verifydataSuccessCalls += (data.successCalls || 0);
      verifydataCalls += (data.successCalls || 0) + (data.failedCalls || 0);
    });
    
    // Cost calculation: Only successful verifications are charged
    // Datapro: ₦100 per successful NIN verification
    // VerifyData: ₦100 per successful CAC verification
    // Failed verifications: ₦0
    const dataproCost = dataproSuccessCalls * 100;
    const verifydataCost = verifydataSuccessCalls * 100;
    const currentSpend = dataproCost + verifydataCost;
    
    // Calculate projection
    const now = new Date();
    const monthStart = new Date(month + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const dayOfMonth = now.getMonth() === monthStart.getMonth() && now.getFullYear() === monthStart.getFullYear()
      ? now.getDate()
      : daysInMonth;
    
    const dailyAverage = dayOfMonth > 0 ? currentSpend / dayOfMonth : 0;
    const projectedSpend = dailyAverage * daysInMonth;
    
    // Determine alert level
    let alertLevel = 'none';
    const spendRatio = currentSpend / budget;
    
    if (spendRatio >= criticalThreshold) {
      alertLevel = 'critical';
    } else if (spendRatio >= warningThreshold) {
      alertLevel = 'warning';
    }
    
    res.status(200).json({
      currentSpend,
      projectedSpend: parseFloat(projectedSpend.toFixed(2)),
      budget,
      alertLevel,
      dailyAverage: parseFloat(dailyAverage.toFixed(2)),
      breakdown: {
        datapro: dataproCost,
        verifydata: verifydataCost
      },
      metadata: {
        daysElapsed: dayOfMonth,
        daysInMonth,
        utilizationPercent: parseFloat(((currentSpend / budget) * 100).toFixed(2)),
        requestTime: Date.now() - startTime,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching cost tracking:', error);
    
    // Log error to audit system
    await logAuditSecurityEvent({
      eventType: 'analytics_error',
      severity: 'medium',
      description: `Cost tracking fetch failed`,
      userId: req.user?.uid || 'unknown',
      ipAddress: req.ip,
      metadata: {
        error: error.message,
        month: req.query.month,
        userEmail: req.user?.email
      }
    }).catch(err => console.error('Failed to log error:', err));
    
    res.status(500).json({
      error: 'Failed to fetch cost tracking',
      message: error.message,
      requestId: `req_${Date.now()}`
    });
  }
});

/**
 * Get budget configuration
 * 
 * GET /api/analytics/budget-config
 * 
 * Response:
 * - monthlyBudget: Monthly budget limit in Naira
 * - warningThreshold: Warning threshold (0.0 to 1.0)
 * - criticalThreshold: Critical threshold (0.0 to 1.0)
 */
app.get('/api/analytics/budget-config', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log(`⚙️ Super Admin ${req.user.email} fetching budget config`);
    
    const budgetDoc = await db.collection('budget-config').doc('default').get();
    
    if (!budgetDoc.exists) {
      // Return default config
      return res.status(200).json({
        monthlyBudget: 100000,
        warningThreshold: 0.8,
        criticalThreshold: 0.95
      });
    }
    
    res.status(200).json(budgetDoc.data());
    
  } catch (error) {
    console.error('❌ Error fetching budget config:', error);
    res.status(500).json({
      error: 'Failed to fetch budget config',
      message: error.message
    });
  }
});

/**
 * Update budget configuration
 * 
 * POST /api/analytics/budget-config
 * 
 * Body:
 * - monthlyBudget: Monthly budget limit in Naira
 * - warningThreshold: Warning threshold (0.0 to 1.0)
 * - criticalThreshold: Critical threshold (0.0 to 1.0)
 */
app.post('/api/analytics/budget-config', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { monthlyBudget, warningThreshold, criticalThreshold } = req.body;
    
    console.log(`⚙️ Super Admin ${req.user.email} updating budget config`);
    
    // Validate input
    if (typeof monthlyBudget !== 'number' || monthlyBudget <= 0) {
      return res.status(400).json({
        error: 'Invalid monthlyBudget',
        message: 'monthlyBudget must be a positive number'
      });
    }
    
    if (typeof warningThreshold !== 'number' || warningThreshold < 0 || warningThreshold > 1) {
      return res.status(400).json({
        error: 'Invalid warningThreshold',
        message: 'warningThreshold must be between 0 and 1'
      });
    }
    
    if (typeof criticalThreshold !== 'number' || criticalThreshold < 0 || criticalThreshold > 1) {
      return res.status(400).json({
        error: 'Invalid criticalThreshold',
        message: 'criticalThreshold must be between 0 and 1'
      });
    }
    
    if (warningThreshold >= criticalThreshold) {
      return res.status(400).json({
        error: 'Invalid thresholds',
        message: 'warningThreshold must be less than criticalThreshold'
      });
    }
    
    // Save to Firestore
    await db.collection('budget-config').doc('default').set({
      monthlyBudget,
      warningThreshold,
      criticalThreshold,
      updatedAt: new Date(),
      updatedBy: req.user.uid
    }, { merge: true });
    
    res.status(200).json({
      success: true,
      message: 'Budget configuration updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating budget config:', error);
    res.status(500).json({
      error: 'Failed to update budget config',
      message: error.message
    });
  }
});

/**
 * Check budget usage and send alerts to super admins
 * 
 * This function checks current month's spending against budget limits
 * and sends email alerts when 50% or 90% thresholds are reached.
 * 
 * Should be called periodically (e.g., every hour) via cron job or scheduled function.
 */
async function checkBudgetAlertsAndNotify() {
  try {
    console.log('🔔 Checking budget alerts...');
    
    // Get budget configuration
    const budgetDoc = await db.collection('budget-config').doc('default').get();
    const budgetConfig = budgetDoc.exists ? budgetDoc.data() : {
      monthlyBudget: 100000,
      warningThreshold: 0.8,
      criticalThreshold: 0.95
    };
    
    // Get current month's spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const logsSnapshot = await db.collection('api-usage-logs')
      .where('timestamp', '>=', startOfMonth)
      .where('timestamp', '<=', endOfMonth)
      .get();
    
    let totalCost = 0;
    logsSnapshot.forEach(doc => {
      const log = doc.data();
      if (log.cost && typeof log.cost === 'number') {
        totalCost += log.cost;
      }
    });
    
    const utilization = totalCost / budgetConfig.monthlyBudget;
    const utilizationPercent = (utilization * 100).toFixed(1);
    
    console.log(`💰 Current spending: ₦${totalCost.toFixed(2)} / ₦${budgetConfig.monthlyBudget} (${utilizationPercent}%)`);
    
    // Check if we need to send alerts
    const alertsDoc = await db.collection('budget-alerts').doc('current-month').get();
    const alertsData = alertsDoc.exists ? alertsDoc.data() : {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      alert50Sent: false,
      alert90Sent: false
    };
    
    // Reset alerts if it's a new month
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (alertsData.month !== currentMonth) {
      alertsData.month = currentMonth;
      alertsData.alert50Sent = false;
      alertsData.alert90Sent = false;
    }
    
    let alertSent = false;
    
    // Check 90% threshold (critical)
    if (utilization >= 0.90 && !alertsData.alert90Sent) {
      await sendBudgetAlert(90, totalCost, budgetConfig.monthlyBudget, utilizationPercent);
      alertsData.alert90Sent = true;
      alertsData.alert90SentAt = new Date();
      alertSent = true;
      console.log('🚨 90% budget alert sent');
    }
    // Check 50% threshold (warning)
    else if (utilization >= 0.50 && !alertsData.alert50Sent) {
      await sendBudgetAlert(50, totalCost, budgetConfig.monthlyBudget, utilizationPercent);
      alertsData.alert50Sent = true;
      alertsData.alert50SentAt = new Date();
      alertSent = true;
      console.log('⚠️ 50% budget alert sent');
    }
    
    // Save alert status
    if (alertSent) {
      await db.collection('budget-alerts').doc('current-month').set(alertsData, { merge: true });
    }
    
    return { success: true, utilization: utilizationPercent, alertSent };
    
  } catch (error) {
    console.error('❌ Error checking budget alerts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send budget alert email to all super admin users
 */
async function sendBudgetAlert(threshold, currentSpending, budgetLimit, utilizationPercent) {
  try {
    // Get all super admin users (normalized roles)
    const usersSnapshot = await db.collection('userroles')
      .where('normalizedRole', '==', 'super_admin')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No super admin users found to send budget alert');
      return;
    }
    
    const superAdminEmails = [];
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      if (user.email) {
        superAdminEmails.push(user.email);
      }
    });
    
    if (superAdminEmails.length === 0) {
      console.log('⚠️ No super admin emails found');
      return;
    }
    
    const alertLevel = threshold >= 90 ? 'CRITICAL' : 'WARNING';
    const alertColor = threshold >= 90 ? '#d32f2f' : '#ed6c02';
    const alertIcon = threshold >= 90 ? '🚨' : '⚠️';
    
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${alertColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
          .alert-box { background-color: white; border-left: 4px solid ${alertColor}; padding: 15px; margin: 15px 0; }
          .stats { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .stat-label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #800020; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${alertIcon} Budget ${alertLevel} Alert</h1>
            <p>API Usage Budget Threshold Reached</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2 style="margin-top: 0; color: ${alertColor};">${threshold}% Budget Threshold Reached</h2>
              <p>Your monthly API usage budget has reached ${utilizationPercent}% utilization.</p>
            </div>
            
            <div class="stats">
              <h3>Current Month Budget Status</h3>
              <div class="stat-row">
                <span class="stat-label">Current Spending:</span>
                <span>₦${currentSpending.toFixed(2)}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Monthly Budget:</span>
                <span>₦${budgetLimit.toFixed(2)}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Utilization:</span>
                <span style="color: ${alertColor}; font-weight: bold;">${utilizationPercent}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Remaining Budget:</span>
                <span>₦${(budgetLimit - currentSpending).toFixed(2)}</span>
              </div>
            </div>
            
            <div style="margin: 20px 0;">
              <h3>Recommended Actions:</h3>
              <ul>
                ${threshold >= 90 ? `
                  <li><strong>Review current API usage immediately</strong></li>
                  <li>Consider temporarily pausing non-critical verification operations</li>
                  <li>Increase monthly budget if additional spending is justified</li>
                ` : `
                  <li>Monitor API usage closely for the remainder of the month</li>
                  <li>Review verification patterns to identify optimization opportunities</li>
                  <li>Plan budget adjustments for next month if needed</li>
                `}
                <li>Check the Analytics Dashboard for detailed usage breakdown</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://kyc.nem-insurance.com'}/admin/analytics" class="button">
                View Analytics Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated alert from NEM Insurance KYC System</p>
            <p>You are receiving this because you are a Super Admin</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send email to all super admins
    const sanitizedEmails = superAdminEmails.map(email => sanitizeEmail(email)).filter(email => isValidEmail(email));
    
    if (sanitizedEmails.length === 0) {
      console.error('❌ No valid super admin emails after sanitization');
      return;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: sanitizedEmails.join(', '),
      subject: sanitizeEmailSubject(`${alertIcon} ${alertLevel}: API Budget ${threshold}% Threshold Reached`),
      html: emailContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Budget alert email sent to ${sanitizedEmails.length} super admin(s)`);
    
  } catch (error) {
    console.error('❌ Error sending budget alert email:', error);
    throw error;
  }
}

// Check budget alerts every hour
setInterval(async () => {
  await checkBudgetAlertsAndNotify();
}, 60 * 60 * 1000).unref(); // 1 hour

// Also check on server startup (after a 1 minute delay to let everything initialize)
setTimeout(async () => {
  await checkBudgetAlertsAndNotify();
}, 60 * 1000).unref();

/**
 * Manual endpoint to trigger budget alert check (for testing)
 * POST /api/analytics/check-budget-alerts
 */
app.post('/api/analytics/check-budget-alerts', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log(`🔔 Super Admin ${req.user.email} manually triggering budget alert check`);
    const result = await checkBudgetAlertsAndNotify();
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in manual budget alert check:', error);
    res.status(500).json({
      error: 'Failed to check budget alerts',
      message: error.message
    });
  }
});

/**
 * Export analytics report data
 * 
 * GET /api/analytics/export?format=csv&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&sections=overview,brokers,costs
 * 
 * Query parameters:
 * - format: Report format - 'pdf', 'excel', or 'csv'
 * - startDate: Start date in YYYY-MM-DD format
 * - endDate: End date in YYYY-MM-DD format
 * - sections: Comma-separated list of sections to include
 * 
 * Response: JSON data for report generation (frontend handles file creation)
 */
app.get('/api/analytics/export', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { format, startDate, endDate, sections } = req.query;
    
    if (!format || !startDate || !endDate || !sections) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'format, startDate, endDate, and sections are required'
      });
    }
    
    console.log(`📄 Super Admin ${req.user.email} exporting ${format} report from ${startDate} to ${endDate}`);
    
    const sectionList = sections.split(',');
    const reportData = {
      format,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.email,
      sections: {}
    };
    
    // Fetch data for each requested section
    if (sectionList.includes('overview')) {
      // Get overview data
      let logsSnapshot;
      try {
        logsSnapshot = await db.collection('api-usage-logs')
          .where('timestamp', '>=', new Date(startDate))
          .where('timestamp', '<=', new Date(endDate + 'T23:59:59'))
          .get();
      } catch (error) {
        console.error('Error querying api-usage-logs for export overview:', error);
        return res.status(500).json({
          error: 'Database query failed',
          message: 'Unable to query analytics data for export. This requires Firestore composite indexes.'
        });
      }
      
      let totalCalls = 0;
      let successfulCalls = 0;
      let failedCalls = 0;
      
      logsSnapshot.forEach(doc => {
        totalCalls++;
        if (doc.data().success) {
          successfulCalls++;
        } else {
          failedCalls++;
        }
      });
      
      reportData.sections.overview = {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(2) : 0
      };
    }
    
    if (sectionList.includes('brokers')) {
      // Get broker usage data (reuse logic from broker-usage endpoint)
      let logsSnapshot;
      try {
        logsSnapshot = await db.collection('api-usage-logs')
          .where('timestamp', '>=', new Date(startDate))
          .where('timestamp', '<=', new Date(endDate + 'T23:59:59'))
          .get();
      } catch (error) {
        console.error('Error querying api-usage-logs for export brokers:', error);
        return res.status(500).json({
          error: 'Database query failed',
          message: 'Unable to query analytics data for export. This requires Firestore composite indexes.'
        });
      }
      
      const brokerMap = new Map();
      
      logsSnapshot.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || 'unknown';
        
        if (!brokerMap.has(userId)) {
          brokerMap.set(userId, {
            userId,
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            totalCost: 0
          });
        }
        
        const broker = brokerMap.get(userId);
        broker.totalCalls++;
        
        if (data.success) {
          broker.successfulCalls++;
        } else {
          broker.failedCalls++;
        }
        
        if (data.apiProvider === 'datapro') {
          broker.totalCost += 100; // Datapro NIN costs ₦100
        } else if (data.apiProvider === 'verifydata') {
          broker.totalCost += 100;
        }
      });
      
      reportData.sections.brokers = Array.from(brokerMap.values());
    }
    
    if (sectionList.includes('costs')) {
      // Get cost data
      let logsSnapshot;
      try {
        logsSnapshot = await db.collection('api-usage-logs')
          .where('timestamp', '>=', new Date(startDate))
          .where('timestamp', '<=', new Date(endDate + 'T23:59:59'))
          .get();
      } catch (error) {
        console.error('Error querying api-usage-logs for export costs:', error);
        return res.status(500).json({
          error: 'Database query failed',
          message: 'Unable to query analytics data for export. This requires Firestore composite indexes.'
        });
      }
      
      let dataproCalls = 0;
      let verifydataCalls = 0;
      
      logsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.apiProvider === 'datapro') {
          dataproCalls++;
        } else if (data.apiProvider === 'verifydata') {
          verifydataCalls++;
        }
      });
      
      reportData.sections.costs = {
        datapro: {
          calls: dataproCalls,
          cost: dataproCalls * 100 // Datapro NIN costs ₦100
        },
        verifydata: {
          calls: verifydataCalls,
          cost: verifydataCalls * 100
        },
        total: (dataproCalls * 100) + (verifydataCalls * 100)
      };
    }
    
    res.status(200).json(reportData);
    
  } catch (error) {
    console.error('❌ Error exporting report:', error);
    res.status(500).json({
      error: 'Failed to export report',
      message: error.message
    });
  }
});

/**
 * Get audit logs with filtering and pagination
 * 
 * GET /api/analytics/audit-logs?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&provider=datapro&status=success&limit=100
 * 
 * Query parameters:
 * - startDate: Start date (YYYY-MM-DD) - optional, defaults to 30 days ago
 * - endDate: End date (YYYY-MM-DD) - optional, defaults to today
 * - provider: API provider filter ('datapro' or 'verifydata') - optional
 * - status: Status filter ('success', 'failure', 'pending') - optional
 * - eventType: Event type filter ('api_call', 'verification_attempt', etc.) - optional
 * - limit: Max results (default: 100, max: 1000)
 * 
 * Security: Super admin only
 */
app.get('/api/analytics/audit-logs', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      provider,
      status,
      eventType,
      limit = 100
    } = req.query;
    
    // Default date range: last 30 days
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
    const start = startDate ? new Date(startDate + 'T00:00:00') : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    console.log(`📋 Super Admin ${req.user.email} fetching audit logs from ${start.toISOString()} to ${end.toISOString()}`);
    
    // Build query
    let query = db.collection('verification-audit-logs')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .orderBy('createdAt', 'desc')
      .limit(Math.min(parseInt(limit), 1000));
    
    // Apply event type filter if specified
    if (eventType) {
      query = db.collection('verification-audit-logs')
        .where('eventType', '==', eventType)
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .orderBy('createdAt', 'desc')
        .limit(Math.min(parseInt(limit), 1000));
    }
    
    const snapshot = await query.get();
    
    // Process and filter results
    const logs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to ISO string for JSON serialization
      let timestamp = new Date().toISOString();
      if (data.createdAt) {
        try {
          timestamp = data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString();
        } catch (e) {
          console.error('Error converting timestamp:', e);
        }
      }
      
      // Determine success from status code if not explicitly set
      const isSuccess = data.success !== undefined 
        ? data.success 
        : data.statusCode >= 200 && data.statusCode < 300;
      
      // Skip non-verification events first (security_event, bulk_operation, encryption_operation, etc.)
      if (data.eventType !== 'api_call' && data.eventType !== 'verification_attempt') {
        return;
      }
      
      // Handle different event types with appropriate field mappings
      let logProvider = 'unknown';
      let logVerificationType = 'unknown';
      
      if (data.eventType === 'api_call') {
        // API calls have apiName as provider
        logProvider = data.apiName || 'unknown';
        logVerificationType = data.verificationType || 'unknown';
      } else if (data.eventType === 'verification_attempt') {
        // Verification attempts don't have provider, infer from verificationType
        logVerificationType = data.verificationType || 'unknown';
        // Infer provider: NIN uses Datapro, CAC uses VerifyData
        if (logVerificationType.toLowerCase() === 'nin') {
          logProvider = 'datapro';
        } else if (logVerificationType.toLowerCase() === 'cac') {
          logProvider = 'verifydata';
        } else {
          logProvider = 'unknown';
        }
      }
      
      // Apply additional filters (can't use multiple where clauses on different fields without composite index)
      if (provider && logProvider.toLowerCase() !== provider.toLowerCase()) {
        return;
      }
      if (status) {
        const logStatus = data.result || (isSuccess ? 'success' : 'failure');
        if (logStatus !== status) {
          return;
        }
      }
      
      logs.push({
        id: doc.id,
        timestamp,
        eventType: data.eventType || 'unknown',
        userId: data.userId || 'unknown',
        userName: data.userName || 'Unknown User',
        userEmail: data.userEmail || 'N/A',
        provider: logProvider,
        verificationType: logVerificationType,
        status: data.result || (isSuccess ? 'success' : 'failure'),
        cost: data.cost || 0, // Read cost from top-level field (correct location)
        ipAddress: data.ipAddress || 'unknown',
        deviceInfo: data.metadata?.userAgent || 'unknown',
        errorMessage: data.errorMessage || null,
        requestData: data.requestDataMasked || null,
        responseData: data.responseDataMasked || null
      });
    });
    
    // Log access
    await logAuditSecurityEvent({
      eventType: 'analytics_access',
      severity: 'low',
      description: `Super Admin ${req.user.email} accessed audit logs`,
      userId: req.user.uid,
      ipAddress: req.ip,
      metadata: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        resultCount: logs.length,
        filters: { provider, status, eventType }
      }
    });
    
    res.json({
      logs,
      total: logs.length,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      filters: { provider, status, eventType }
    });
    
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: error.message
    });
  }
});

// ============= END ANALYTICS API =============
};
