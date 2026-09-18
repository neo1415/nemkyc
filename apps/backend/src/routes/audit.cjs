'use strict';

module.exports = function register(app, ctx) {
  const {
    getAuditLogStats,
    queryAuditLogs,
    requireAdmin,
    requireAuth,
  } = ctx;

// ============= AUDIT LOGGING API =============

/**
 * Get audit logs (Admin only)
 * 
 * Query parameters:
 * - eventType: Filter by event type (verification_attempt, api_call, encryption_operation, security_event, bulk_operation)
 * - userId: Filter by user ID
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * - limit: Limit number of results (default: 100, max: 1000)
 * 
 * Response:
 * - logs: Array of log entries
 * - total: Total number of logs
 */
app.get('/api/audit/logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventType, userId, startDate, endDate, limit } = req.query;
    
    console.log(`📋 Admin ${req.user.email} querying audit logs`);
    
    // Build filters
    const filters = {};
    
    if (eventType) filters.eventType = eventType;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = Math.min(1000, parseInt(limit) || 100);
    
    // Query audit logs
    const logs = await queryAuditLogs(filters);
    
    console.log(`✅ Retrieved ${logs.length} audit logs`);
    
    res.status(200).json({
      logs,
      total: logs.length
    });
    
  } catch (error) {
    console.error('❌ Error querying audit logs:', error);
    res.status(500).json({
      error: 'Failed to query audit logs',
      message: error.message
    });
  }
});

/**
 * Get audit log statistics (Admin only)
 * 
 * Query parameters:
 * - startDate: Start date for statistics (ISO 8601)
 * - endDate: End date for statistics (ISO 8601)
 * 
 * Response:
 * - total: Total number of logs
 * - byEventType: Count by event type
 * - byResult: Count by result (for verification attempts)
 * - byVerificationType: Count by verification type
 */
app.get('/api/audit/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log(`📊 Admin ${req.user.email} querying audit log statistics`);
    
    // Build filters
    const filters = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    
    // Get statistics
    const stats = await getAuditLogStats(filters);
    
    console.log(`✅ Retrieved audit log statistics`);
    
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('❌ Error getting audit log statistics:', error);
    res.status(500).json({
      error: 'Failed to get audit log statistics',
      message: error.message
    });
  }
});

// ============= END AUDIT LOGGING API =============
};
