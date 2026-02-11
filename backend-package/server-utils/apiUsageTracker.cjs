/**
 * API Usage Tracker
 * 
 * Tracks Datapro API calls for cost monitoring and alerting.
 * Stores usage data in Firestore collection: api-usage
 * 
 * Features:
 * - Track API calls per day/month
 * - Store success/failure counts
 * - Calculate costs based on API pricing
 * - Alert when approaching limits
 * - Generate usage reports
 */

/**
 * Track a Datapro API call
 * 
 * @param {Object} db - Firestore database instance
 * @param {Object} callData - API call data
 * @param {string} callData.nin - Masked NIN (first 4 digits only)
 * @param {boolean} callData.success - Whether the call succeeded
 * @param {string} callData.errorCode - Error code if failed
 * @param {string} callData.userId - User ID who initiated the call
 * @param {string} callData.listId - List ID if part of bulk verification
 * @param {string} callData.entryId - Entry ID being verified
 * @returns {Promise<void>}
 */
async function trackDataproAPICall(db, callData) {
  try {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const monthKey = dateKey.substring(0, 7); // YYYY-MM
    
    // Create usage document ID based on date
    const dailyDocId = `datapro-${dateKey}`;
    const monthlyDocId = `datapro-${monthKey}`;
    
    // Update daily usage
    const dailyRef = db.collection('api-usage').doc(dailyDocId);
    const dailyDoc = await dailyRef.get();
    
    if (dailyDoc.exists) {
      // Increment counters
      await dailyRef.update({
        totalCalls: (dailyDoc.data().totalCalls || 0) + 1,
        successCalls: (dailyDoc.data().successCalls || 0) + (callData.success ? 1 : 0),
        failedCalls: (dailyDoc.data().failedCalls || 0) + (callData.success ? 0 : 1),
        lastCallAt: now,
        updatedAt: now
      });
    } else {
      // Create new daily document
      await dailyRef.set({
        apiProvider: 'datapro',
        apiType: 'nin_verification',
        period: 'daily',
        date: dateKey,
        totalCalls: 1,
        successCalls: callData.success ? 1 : 0,
        failedCalls: callData.success ? 0 : 1,
        createdAt: now,
        lastCallAt: now,
        updatedAt: now
      });
    }
    
    // Update monthly usage
    const monthlyRef = db.collection('api-usage').doc(monthlyDocId);
    const monthlyDoc = await monthlyRef.get();
    
    if (monthlyDoc.exists) {
      // Increment counters
      await monthlyRef.update({
        totalCalls: (monthlyDoc.data().totalCalls || 0) + 1,
        successCalls: (monthlyDoc.data().successCalls || 0) + (callData.success ? 1 : 0),
        failedCalls: (monthlyDoc.data().failedCalls || 0) + (callData.success ? 0 : 1),
        lastCallAt: now,
        updatedAt: now
      });
    } else {
      // Create new monthly document
      await monthlyRef.set({
        apiProvider: 'datapro',
        apiType: 'nin_verification',
        period: 'monthly',
        month: monthKey,
        totalCalls: 1,
        successCalls: callData.success ? 1 : 0,
        failedCalls: callData.success ? 0 : 1,
        createdAt: now,
        lastCallAt: now,
        updatedAt: now
      });
    }
    
    // Store individual call log for audit
    await db.collection('api-usage-logs').add({
      apiProvider: 'datapro',
      apiType: 'nin_verification',
      ninMasked: callData.nin,
      success: callData.success,
      errorCode: callData.errorCode || null,
      userId: callData.userId || null,
      listId: callData.listId || null,
      entryId: callData.entryId || null,
      timestamp: now,
      date: dateKey,
      month: monthKey
    });
    
    console.log(`[APIUsageTracker] Tracked Datapro API call: ${callData.success ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (error) {
    console.error('[APIUsageTracker] Error tracking API call:', error);
    // Don't throw - tracking failure shouldn't break the main flow
  }
}

/**
 * Get API usage statistics for a date range
 * 
 * @param {Object} db - Firestore database instance
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Usage statistics
 */
async function getAPIUsageStats(db, startDate, endDate) {
  try {
    const usageSnapshot = await db.collection('api-usage')
      .where('apiProvider', '==', 'datapro')
      .where('period', '==', 'daily')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc')
      .get();
    
    let totalCalls = 0;
    let successCalls = 0;
    let failedCalls = 0;
    const dailyStats = [];
    
    usageSnapshot.forEach(doc => {
      const data = doc.data();
      totalCalls += data.totalCalls || 0;
      successCalls += data.successCalls || 0;
      failedCalls += data.failedCalls || 0;
      
      dailyStats.push({
        date: data.date,
        totalCalls: data.totalCalls || 0,
        successCalls: data.successCalls || 0,
        failedCalls: data.failedCalls || 0,
        successRate: data.totalCalls > 0 
          ? Math.round((data.successCalls / data.totalCalls) * 100) 
          : 0
      });
    });
    
    return {
      startDate,
      endDate,
      totalCalls,
      successCalls,
      failedCalls,
      successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
      dailyStats
    };
    
  } catch (error) {
    console.error('[APIUsageTracker] Error fetching usage stats:', error);
    throw error;
  }
}

/**
 * Get monthly API usage summary
 * 
 * @param {Object} db - Firestore database instance
 * @param {string} month - Month (YYYY-MM)
 * @returns {Promise<Object>} Monthly usage summary
 */
async function getMonthlyUsageSummary(db, month) {
  try {
    const monthlyDocId = `datapro-${month}`;
    const monthlyDoc = await db.collection('api-usage').doc(monthlyDocId).get();
    
    if (!monthlyDoc.exists) {
      return {
        month,
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        successRate: 0,
        estimatedCost: 0
      };
    }
    
    const data = monthlyDoc.data();
    const totalCalls = data.totalCalls || 0;
    const successCalls = data.successCalls || 0;
    const failedCalls = data.failedCalls || 0;
    
    // Estimate cost (assuming ₦50 per successful call - adjust based on actual pricing)
    const costPerCall = 50; // NGN
    const estimatedCost = successCalls * costPerCall;
    
    return {
      month,
      totalCalls,
      successCalls,
      failedCalls,
      successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
      estimatedCost,
      currency: 'NGN'
    };
    
  } catch (error) {
    console.error('[APIUsageTracker] Error fetching monthly summary:', error);
    throw error;
  }
}

/**
 * Check if usage is approaching limits and send alerts
 * 
 * @param {Object} db - Firestore database instance
 * @param {number} monthlyLimit - Monthly call limit
 * @param {number} alertThreshold - Percentage threshold for alerts (default: 80)
 * @returns {Promise<Object>} Alert status
 */
async function checkUsageLimits(db, monthlyLimit = 10000, alertThreshold = 80) {
  try {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
    
    const summary = await getMonthlyUsageSummary(db, currentMonth);
    const usagePercent = (summary.totalCalls / monthlyLimit) * 100;
    
    const alert = {
      month: currentMonth,
      totalCalls: summary.totalCalls,
      monthlyLimit,
      usagePercent: Math.round(usagePercent),
      shouldAlert: usagePercent >= alertThreshold,
      alertLevel: usagePercent >= 95 ? 'critical' : usagePercent >= alertThreshold ? 'warning' : 'normal',
      message: null
    };
    
    if (usagePercent >= 95) {
      alert.message = `CRITICAL: API usage at ${alert.usagePercent}% of monthly limit (${summary.totalCalls}/${monthlyLimit} calls)`;
      console.error(`[APIUsageTracker] ${alert.message}`);
    } else if (usagePercent >= alertThreshold) {
      alert.message = `WARNING: API usage at ${alert.usagePercent}% of monthly limit (${summary.totalCalls}/${monthlyLimit} calls)`;
      console.warn(`[APIUsageTracker] ${alert.message}`);
    }
    
    return alert;
    
  } catch (error) {
    console.error('[APIUsageTracker] Error checking usage limits:', error);
    throw error;
  }
}

module.exports = {
  trackDataproAPICall,
  getAPIUsageStats,
  getMonthlyUsageSummary,
  checkUsageLimits
};
