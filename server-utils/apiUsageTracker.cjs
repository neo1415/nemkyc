/**
 * API Usage Tracker
 * 
 * Tracks Datapro and VerifyData API calls for cost monitoring and alerting.
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
    console.error('[APIUsageTracker] Error tracking Datapro API call:', error);
    // Don't throw - tracking failure shouldn't break the main flow
  }
}

/**
 * Track a VerifyData API call
 * 
 * @param {Object} db - Firestore database instance
 * @param {Object} callData - API call data
 * @param {string} callData.rcNumber - Masked RC number (first 4 chars only)
 * @param {boolean} callData.success - Whether the call succeeded
 * @param {string} callData.errorCode - Error code if failed
 * @param {string} callData.userId - User ID who initiated the call
 * @param {string} callData.listId - List ID if part of bulk verification
 * @param {string} callData.entryId - Entry ID being verified
 * @returns {Promise<void>}
 */
async function trackVerifydataAPICall(db, callData) {
  try {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const monthKey = dateKey.substring(0, 7); // YYYY-MM
    
    // Create usage document ID based on date
    const dailyDocId = `verifydata-${dateKey}`;
    const monthlyDocId = `verifydata-${monthKey}`;
    
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
        apiProvider: 'verifydata',
        apiType: 'cac_verification',
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
        apiProvider: 'verifydata',
        apiType: 'cac_verification',
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
      apiProvider: 'verifydata',
      apiType: 'cac_verification',
      rcNumberMasked: callData.rcNumber,
      success: callData.success,
      errorCode: callData.errorCode || null,
      userId: callData.userId || null,
      listId: callData.listId || null,
      entryId: callData.entryId || null,
      timestamp: now,
      date: dateKey,
      month: monthKey
    });
    
    console.log(`[APIUsageTracker] Tracked VerifyData API call: ${callData.success ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (error) {
    console.error('[APIUsageTracker] Error tracking VerifyData API call:', error);
    // Don't throw - tracking failure shouldn't break the main flow
  }
}

/**
 * Get API usage statistics for a date range
 * 
 * @param {Object} db - Firestore database instance
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} apiProvider - API provider ('datapro' or 'verifydata', optional - returns both if not specified)
 * @returns {Promise<Object>} Usage statistics
 */
async function getAPIUsageStats(db, startDate, endDate, apiProvider = null) {
  try {
    let query = db.collection('api-usage')
      .where('period', '==', 'daily')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc');
    
    if (apiProvider) {
      query = db.collection('api-usage')
        .where('apiProvider', '==', apiProvider)
        .where('period', '==', 'daily')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'asc');
    }
    
    const usageSnapshot = await query.get();
    
    if (apiProvider) {
      // Return stats for single provider
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
        apiProvider,
        startDate,
        endDate,
        totalCalls,
        successCalls,
        failedCalls,
        successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
        dailyStats
      };
    } else {
      // Return stats for all providers
      const statsByProvider = {
        datapro: {
          apiProvider: 'datapro',
          startDate,
          endDate,
          totalCalls: 0,
          successCalls: 0,
          failedCalls: 0,
          dailyStats: []
        },
        verifydata: {
          apiProvider: 'verifydata',
          startDate,
          endDate,
          totalCalls: 0,
          successCalls: 0,
          failedCalls: 0,
          dailyStats: []
        }
      };
      
      usageSnapshot.forEach(doc => {
        const data = doc.data();
        const provider = data.apiProvider;
        
        if (statsByProvider[provider]) {
          statsByProvider[provider].totalCalls += data.totalCalls || 0;
          statsByProvider[provider].successCalls += data.successCalls || 0;
          statsByProvider[provider].failedCalls += data.failedCalls || 0;
          
          statsByProvider[provider].dailyStats.push({
            date: data.date,
            totalCalls: data.totalCalls || 0,
            successCalls: data.successCalls || 0,
            failedCalls: data.failedCalls || 0,
            successRate: data.totalCalls > 0 
              ? Math.round((data.successCalls / data.totalCalls) * 100) 
              : 0
          });
        }
      });
      
      // Calculate success rates
      Object.keys(statsByProvider).forEach(provider => {
        const stats = statsByProvider[provider];
        stats.successRate = stats.totalCalls > 0 
          ? Math.round((stats.successCalls / stats.totalCalls) * 100) 
          : 0;
      });
      
      return statsByProvider;
    }
    
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
 * @param {string} apiProvider - API provider ('datapro' or 'verifydata', optional - returns both if not specified)
 * @returns {Promise<Object>} Monthly usage summary
 */
async function getMonthlyUsageSummary(db, month, apiProvider = null) {
  try {
    if (apiProvider) {
      // Get summary for specific provider
      const monthlyDocId = `${apiProvider}-${month}`;
      const monthlyDoc = await db.collection('api-usage').doc(monthlyDocId).get();
      
      if (!monthlyDoc.exists) {
        return {
          apiProvider,
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
      
      // Estimate cost based on provider
      // Datapro: ₦50 per successful call
      // VerifyData: ₦100 per successful call (adjust based on actual pricing)
      const costPerCall = apiProvider === 'datapro' ? 50 : 100;
      const estimatedCost = successCalls * costPerCall;
      
      return {
        apiProvider,
        month,
        totalCalls,
        successCalls,
        failedCalls,
        successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
        estimatedCost,
        currency: 'NGN'
      };
    } else {
      // Get summary for all providers
      const summaries = {};
      
      for (const provider of ['datapro', 'verifydata']) {
        const monthlyDocId = `${provider}-${month}`;
        const monthlyDoc = await db.collection('api-usage').doc(monthlyDocId).get();
        
        if (monthlyDoc.exists) {
          const data = monthlyDoc.data();
          const totalCalls = data.totalCalls || 0;
          const successCalls = data.successCalls || 0;
          const failedCalls = data.failedCalls || 0;
          
          const costPerCall = provider === 'datapro' ? 50 : 100;
          const estimatedCost = successCalls * costPerCall;
          
          summaries[provider] = {
            apiProvider: provider,
            month,
            totalCalls,
            successCalls,
            failedCalls,
            successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
            estimatedCost,
            currency: 'NGN'
          };
        } else {
          summaries[provider] = {
            apiProvider: provider,
            month,
            totalCalls: 0,
            successCalls: 0,
            failedCalls: 0,
            successRate: 0,
            estimatedCost: 0,
            currency: 'NGN'
          };
        }
      }
      
      return summaries;
    }
    
  } catch (error) {
    console.error('[APIUsageTracker] Error fetching monthly summary:', error);
    throw error;
  }
}

/**
 * Check if usage is approaching limits and send alerts
 * 
 * @param {Object} db - Firestore database instance
 * @param {string} apiProvider - API provider ('datapro' or 'verifydata')
 * @param {number} monthlyLimit - Monthly call limit
 * @param {number} alertThreshold - Percentage threshold for alerts (default: 80)
 * @returns {Promise<Object>} Alert status
 */
async function checkUsageLimits(db, apiProvider, monthlyLimit = 10000, alertThreshold = 80) {
  try {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
    
    const summary = await getMonthlyUsageSummary(db, currentMonth, apiProvider);
    const usagePercent = (summary.totalCalls / monthlyLimit) * 100;
    
    const alert = {
      apiProvider,
      month: currentMonth,
      totalCalls: summary.totalCalls,
      monthlyLimit,
      usagePercent: Math.round(usagePercent),
      shouldAlert: usagePercent >= alertThreshold,
      alertLevel: usagePercent >= 95 ? 'critical' : usagePercent >= alertThreshold ? 'warning' : 'normal',
      message: null
    };
    
    if (usagePercent >= 95) {
      alert.message = `CRITICAL: ${apiProvider.toUpperCase()} API usage at ${alert.usagePercent}% of monthly limit (${summary.totalCalls}/${monthlyLimit} calls)`;
      console.error(`[APIUsageTracker] ${alert.message}`);
    } else if (usagePercent >= alertThreshold) {
      alert.message = `WARNING: ${apiProvider.toUpperCase()} API usage at ${alert.usagePercent}% of monthly limit (${summary.totalCalls}/${monthlyLimit} calls)`;
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
  trackVerifydataAPICall,
  getAPIUsageStats,
  getMonthlyUsageSummary,
  checkUsageLimits
};
