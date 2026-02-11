/**
 * Health Monitoring Service
 * 
 * Monitors the health of external APIs (Datapro) and tracks system metrics.
 * 
 * Features:
 * - Periodic health checks (every 5 minutes)
 * - API status tracking (up/down)
 * - Error rate monitoring
 * - Cost tracking
 * - Alert generation
 * - Firestore persistence
 */

const https = require('https');
const { URL } = require('url');

// Configuration
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ERROR_RATE_THRESHOLD = 0.10; // 10%
const DATAPRO_API_URL = process.env.DATAPRO_API_URL || 'https://api.datapronigeria.com';
const DATAPRO_SERVICE_ID = process.env.DATAPRO_SERVICE_ID;

// In-memory state
let healthCheckInterval = null;
let db = null;

/**
 * Initialize health monitoring
 * @param {object} firestoreDb - Firestore database instance
 */
function initializeHealthMonitor(firestoreDb) {
  db = firestoreDb;
  
  console.log('[HealthMonitor] Initializing health monitoring...');
  
  // Run initial health check
  performHealthCheck();
  
  // Schedule periodic health checks
  healthCheckInterval = setInterval(() => {
    performHealthCheck();
  }, HEALTH_CHECK_INTERVAL);
  
  console.log('[HealthMonitor] Health monitoring initialized. Checks every 5 minutes.');
}

/**
 * Stop health monitoring
 */
function stopHealthMonitor() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('[HealthMonitor] Health monitoring stopped.');
  }
}

/**
 * Perform health check on Datapro API
 */
async function performHealthCheck() {
  if (!db) {
    console.error('[HealthMonitor] Database not initialized');
    return;
  }
  
  const timestamp = new Date();
  console.log(`[HealthMonitor] Performing health check at ${timestamp.toISOString()}`);
  
  try {
    // Check if API is configured
    if (!DATAPRO_SERVICE_ID) {
      await saveHealthStatus({
        service: 'datapro',
        status: 'not_configured',
        message: 'DATAPRO_SERVICE_ID not configured',
        timestamp,
        responseTime: null
      });
      return;
    }
    
    // Ping the API with a simple request
    const startTime = Date.now();
    const result = await pingDataproAPI();
    const responseTime = Date.now() - startTime;
    
    if (result.success) {
      console.log(`[HealthMonitor] Datapro API is UP (${responseTime}ms)`);
      
      await saveHealthStatus({
        service: 'datapro',
        status: 'up',
        message: 'API is responding normally',
        timestamp,
        responseTime
      });
    } else {
      console.error(`[HealthMonitor] Datapro API is DOWN: ${result.error}`);
      
      await saveHealthStatus({
        service: 'datapro',
        status: 'down',
        message: result.error,
        timestamp,
        responseTime,
        errorCode: result.errorCode
      });
      
      // Generate alert
      await generateAlert({
        type: 'api_down',
        service: 'datapro',
        message: `Datapro API is down: ${result.error}`,
        timestamp,
        severity: 'critical'
      });
    }
  } catch (error) {
    console.error(`[HealthMonitor] Health check failed: ${error.message}`);
    
    await saveHealthStatus({
      service: 'datapro',
      status: 'error',
      message: `Health check failed: ${error.message}`,
      timestamp,
      responseTime: null
    });
  }
}

/**
 * Ping Datapro API to check if it's responding
 * @returns {Promise<{success: boolean, error?: string, errorCode?: string}>}
 */
function pingDataproAPI() {
  return new Promise((resolve) => {
    // Use a test NIN for health check (this will fail validation but confirms API is responding)
    const testNIN = '12345678901';
    const url = `${DATAPRO_API_URL}/verifynin/?regNo=${testNIN}`;
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'SERVICEID': DATAPRO_SERVICE_ID,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout for health checks
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Any response (even error) means API is up
        // We're just checking if the API is reachable
        if (res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401) {
          resolve({ success: true });
        } else if (res.statusCode === 87 || res.statusCode === 88) {
          resolve({ 
            success: false, 
            error: `API returned error code ${res.statusCode}`,
            errorCode: res.statusCode.toString()
          });
        } else {
          resolve({ 
            success: false, 
            error: `Unexpected status code: ${res.statusCode}`,
            errorCode: res.statusCode.toString()
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ 
        success: false, 
        error: `Network error: ${error.message}`,
        errorCode: 'NETWORK_ERROR'
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        success: false, 
        error: 'Request timeout',
        errorCode: 'TIMEOUT'
      });
    });
    
    req.end();
  });
}

/**
 * Save health status to Firestore
 * @param {object} status - Health status data
 */
async function saveHealthStatus(status) {
  if (!db) return;
  
  try {
    await db.collection('api-health-status').add({
      ...status,
      createdAt: new Date()
    });
    
    // Also update the latest status document
    await db.collection('api-health-status').doc('latest').set({
      ...status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error(`[HealthMonitor] Failed to save health status: ${error.message}`);
  }
}

/**
 * Generate alert for critical issues
 * @param {object} alert - Alert data
 */
async function generateAlert(alert) {
  if (!db) return;
  
  try {
    await db.collection('system-alerts').add({
      ...alert,
      acknowledged: false,
      createdAt: new Date()
    });
    
    console.log(`[HealthMonitor] Alert generated: ${alert.type} - ${alert.message}`);
  } catch (error) {
    console.error(`[HealthMonitor] Failed to generate alert: ${error.message}`);
  }
}

/**
 * Get current API health status
 * @returns {Promise<object|null>} Latest health status
 */
async function getHealthStatus() {
  if (!db) return null;
  
  try {
    const doc = await db.collection('api-health-status').doc('latest').get();
    
    if (doc.exists) {
      return doc.data();
    }
    
    return null;
  } catch (error) {
    console.error(`[HealthMonitor] Failed to get health status: ${error.message}`);
    return null;
  }
}

/**
 * Get health status history
 * @param {number} limit - Number of records to retrieve
 * @returns {Promise<Array>} Health status history
 */
async function getHealthHistory(limit = 100) {
  if (!db) return [];
  
  try {
    const snapshot = await db.collection('api-health-status')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`[HealthMonitor] Failed to get health history: ${error.message}`);
    return [];
  }
}

/**
 * Calculate error rate from recent verifications
 * @param {number} hours - Number of hours to look back
 * @returns {Promise<{errorRate: number, total: number, failed: number}>}
 */
async function calculateErrorRate(hours = 24) {
  if (!db) return { errorRate: 0, total: 0, failed: 0 };
  
  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Query verification audit logs
    const snapshot = await db.collection('verification-audit-logs')
      .where('timestamp', '>=', cutoffTime)
      .get();
    
    let total = 0;
    let failed = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      total++;
      
      if (data.success === false || data.status === 'failed') {
        failed++;
      }
    });
    
    const errorRate = total > 0 ? failed / total : 0;
    
    console.log(`[HealthMonitor] Error rate (last ${hours}h): ${(errorRate * 100).toFixed(2)}% (${failed}/${total})`);
    
    // Check if error rate exceeds threshold
    if (errorRate > ERROR_RATE_THRESHOLD && total >= 10) {
      await generateAlert({
        type: 'high_error_rate',
        service: 'datapro',
        message: `Error rate is ${(errorRate * 100).toFixed(2)}% (threshold: ${ERROR_RATE_THRESHOLD * 100}%)`,
        timestamp: new Date(),
        severity: 'warning',
        details: { errorRate, total, failed, hours }
      });
    }
    
    return { errorRate, total, failed };
  } catch (error) {
    console.error(`[HealthMonitor] Failed to calculate error rate: ${error.message}`);
    return { errorRate: 0, total: 0, failed: 0 };
  }
}

/**
 * Get API usage statistics
 * @param {string} period - 'day' or 'month'
 * @returns {Promise<{calls: number, cost: number}>}
 */
async function getAPIUsage(period = 'day') {
  if (!db) return { calls: 0, cost: 0 };
  
  try {
    const now = new Date();
    let cutoffTime;
    
    if (period === 'day') {
      cutoffTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      cutoffTime = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const snapshot = await db.collection('api-usage')
      .where('timestamp', '>=', cutoffTime)
      .where('service', '==', 'datapro')
      .get();
    
    let calls = 0;
    let cost = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      calls += data.count || 1;
      cost += data.cost || 0;
    });
    
    console.log(`[HealthMonitor] API usage (${period}): ${calls} calls, ₦${cost.toFixed(2)}`);
    
    // Check budget limits
    await checkBudgetLimits(period, calls, cost);
    
    return { calls, cost };
  } catch (error) {
    console.error(`[HealthMonitor] Failed to get API usage: ${error.message}`);
    return { calls: 0, cost: 0 };
  }
}

/**
 * Check if API usage is approaching budget limits
 * @param {string} period - 'day' or 'month'
 * @param {number} calls - Number of API calls
 * @param {number} cost - Total cost
 */
async function checkBudgetLimits(period, calls, cost) {
  // Budget limits (configurable via environment variables)
  const DAILY_CALL_LIMIT = parseInt(process.env.DAILY_API_CALL_LIMIT) || 1000;
  const MONTHLY_CALL_LIMIT = parseInt(process.env.MONTHLY_API_CALL_LIMIT) || 20000;
  const DAILY_COST_LIMIT = parseFloat(process.env.DAILY_API_COST_LIMIT) || 10000; // ₦10,000
  const MONTHLY_COST_LIMIT = parseFloat(process.env.MONTHLY_API_COST_LIMIT) || 200000; // ₦200,000
  
  const callLimit = period === 'day' ? DAILY_CALL_LIMIT : MONTHLY_CALL_LIMIT;
  const costLimit = period === 'day' ? DAILY_COST_LIMIT : MONTHLY_COST_LIMIT;
  
  const callUsagePercent = (calls / callLimit) * 100;
  const costUsagePercent = (cost / costLimit) * 100;
  
  // Alert at 80% usage
  if (callUsagePercent >= 80 && callUsagePercent < 100) {
    await generateAlert({
      type: 'budget_warning',
      service: 'datapro',
      message: `API call usage is at ${callUsagePercent.toFixed(1)}% of ${period}ly limit (${calls}/${callLimit} calls)`,
      timestamp: new Date(),
      severity: 'warning',
      details: { period, calls, callLimit, callUsagePercent }
    });
  }
  
  if (costUsagePercent >= 80 && costUsagePercent < 100) {
    await generateAlert({
      type: 'budget_warning',
      service: 'datapro',
      message: `API cost is at ${costUsagePercent.toFixed(1)}% of ${period}ly budget (₦${cost.toFixed(2)}/₦${costLimit.toFixed(2)})`,
      timestamp: new Date(),
      severity: 'warning',
      details: { period, cost, costLimit, costUsagePercent }
    });
  }
  
  // Critical alert at 100% usage
  if (callUsagePercent >= 100) {
    await generateAlert({
      type: 'budget_exceeded',
      service: 'datapro',
      message: `API call limit EXCEEDED for ${period} (${calls}/${callLimit} calls)`,
      timestamp: new Date(),
      severity: 'critical',
      details: { period, calls, callLimit, callUsagePercent }
    });
  }
  
  if (costUsagePercent >= 100) {
    await generateAlert({
      type: 'budget_exceeded',
      service: 'datapro',
      message: `API cost budget EXCEEDED for ${period} (₦${cost.toFixed(2)}/₦${costLimit.toFixed(2)})`,
      timestamp: new Date(),
      severity: 'critical',
      details: { period, cost, costLimit, costUsagePercent }
    });
  }
}

/**
 * Get unacknowledged alerts
 * @returns {Promise<Array>} List of unacknowledged alerts
 */
async function getUnacknowledgedAlerts() {
  if (!db) return [];
  
  try {
    const snapshot = await db.collection('system-alerts')
      .where('acknowledged', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`[HealthMonitor] Failed to get alerts: ${error.message}`);
    return [];
  }
}

/**
 * Acknowledge an alert
 * @param {string} alertId - Alert document ID
 * @param {string} acknowledgedBy - User ID who acknowledged
 */
async function acknowledgeAlert(alertId, acknowledgedBy) {
  if (!db) return;
  
  try {
    await db.collection('system-alerts').doc(alertId).update({
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date()
    });
    
    console.log(`[HealthMonitor] Alert ${alertId} acknowledged by ${acknowledgedBy}`);
  } catch (error) {
    console.error(`[HealthMonitor] Failed to acknowledge alert: ${error.message}`);
  }
}

module.exports = {
  initializeHealthMonitor,
  stopHealthMonitor,
  performHealthCheck,
  getHealthStatus,
  getHealthHistory,
  calculateErrorRate,
  getAPIUsage,
  getUnacknowledgedAlerts,
  acknowledgeAlert
};
