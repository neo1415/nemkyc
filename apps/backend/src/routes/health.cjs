'use strict';

module.exports = function register(app, ctx) {
  const {
    acknowledgeAlert,
    calculateErrorRate,
    db,
    getHealthHistory,
    getHealthStatus,
    getUnacknowledgedAlerts,
    requireAdmin,
    requireAuth,
    requireSuperAdmin,
  } = ctx;

// ============= HEALTH MONITORING API =============

/**
 * Get current API health status
 * 
 * GET /api/health/status
 * 
 * Response:
 * - service: Service name (e.g., 'datapro')
 * - status: 'up', 'down', 'not_configured', 'error'
 * - message: Status message
 * - timestamp: Last check timestamp
 * - responseTime: Response time in milliseconds
 */
app.get('/api/health/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log(`🏥 Admin ${req.user.email} checking API health status`);
    
    const status = await getHealthStatus();
    
    if (!status) {
      return res.status(200).json({
        service: 'datapro',
        status: 'unknown',
        message: 'No health check data available yet',
        timestamp: new Date()
      });
    }
    
    res.status(200).json(status);
    
  } catch (error) {
    console.error('❌ Error getting health status:', error);
    res.status(500).json({
      error: 'Failed to get health status',
      message: error.message
    });
  }
});

/**
 * Get health status history
 * 
 * GET /api/health/history?limit=100
 * 
 * Query parameters:
 * - limit: Number of records to retrieve (default: 100)
 * 
 * Response: Array of health status records
 */
app.get('/api/health/history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    console.log(`🏥 Admin ${req.user.email} retrieving health history (limit: ${limit})`);
    
    const history = await getHealthHistory(limit);
    
    res.status(200).json({
      history,
      count: history.length
    });
    
  } catch (error) {
    console.error('❌ Error getting health history:', error);
    res.status(500).json({
      error: 'Failed to get health history',
      message: error.message
    });
  }
});

/**
 * Get error rate statistics
 * 
 * GET /api/health/error-rate?hours=24
 * 
 * Query parameters:
 * - hours: Number of hours to look back (default: 24)
 * 
 * Response:
 * - errorRate: Error rate as decimal (0.0 to 1.0)
 * - total: Total verification attempts
 * - failed: Failed verification attempts
 */
app.get('/api/health/error-rate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    
    console.log(`📊 Admin ${req.user.email} checking error rate (last ${hours}h)`);
    
    const stats = await calculateErrorRate(hours);
    
    res.status(200).json({
      ...stats,
      hours,
      errorRatePercent: (stats.errorRate * 100).toFixed(2)
    });
    
  } catch (error) {
    console.error('❌ Error calculating error rate:', error);
    res.status(500).json({
      error: 'Failed to calculate error rate',
      message: error.message
    });
  }
});

/**
 * Get API usage statistics
 * 
 * GET /api/health/usage?period=day
 * 
 * Query parameters:
 * - period: 'day' or 'month' (default: 'day')
 * 
 * Response:
 * - calls: Number of API calls
 * - cost: Total cost
 * - period: Period queried
 */
app.get('/api/health/usage', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log(`💰 Super Admin ${req.user.email} checking API usage (all-time)`);
    
    // Query api-usage-logs collection for all-time data (consistent with analytics dashboard)
    const logsSnapshot = await db.collection('api-usage-logs')
      .get();
    
    let totalCalls = 0;
    let totalCost = 0;
    
    logsSnapshot.forEach(doc => {
      const data = doc.data();
      totalCalls++;
      totalCost += data.cost || 0;
    });
    
    res.status(200).json({
      calls: totalCalls,
      cost: totalCost,
      period: 'all-time'
    });
    
  } catch (error) {
    console.error('❌ Error getting API usage:', error);
    res.status(500).json({
      error: 'Failed to get API usage',
      message: error.message
    });
  }
});

/**
 * Get unacknowledged alerts
 * 
 * GET /api/health/alerts
 * 
 * Response: Array of unacknowledged alerts
 */
app.get('/api/health/alerts', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log(`🚨 Admin ${req.user.email} retrieving unacknowledged alerts`);
    
    const alerts = await getUnacknowledgedAlerts();
    
    res.status(200).json({
      alerts,
      count: alerts.length
    });
    
  } catch (error) {
    console.error('❌ Error getting alerts:', error);
    res.status(500).json({
      error: 'Failed to get alerts',
      message: error.message
    });
  }
});

/**
 * Acknowledge an alert
 * 
 * POST /api/health/alerts/:alertId/acknowledge
 * 
 * Response: Success message
 */
app.post('/api/health/alerts/:alertId/acknowledge', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    console.log(`✅ Admin ${req.user.email} acknowledging alert ${alertId}`);
    
    await acknowledgeAlert(alertId, req.user.uid);
    
    res.status(200).json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
    
  } catch (error) {
    console.error('❌ Error acknowledging alert:', error);
    res.status(500).json({
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

// ============= END HEALTH MONITORING API =============
};
