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
 * Calculate cost for an API call
 * 
 * Based on Datapro documentation, they charge for ALL API calls (both success and failure).
 * 
 * @param {string} apiProvider - API provider ('datapro' or 'verifydata')
 * @param {boolean} success - Whether the call succeeded
 * @returns {number} Cost in Naira (₦50 for Datapro, ₦100 for VerifyData - charged regardless of success/failure)
 */
function calculateCost(apiProvider, success) {
  // Datapro and VerifyData charge for ALL API calls, not just successful ones
  // This is confirmed in their API documentation
  if (apiProvider === 'datapro') {
    return 50;
  } else if (apiProvider === 'verifydata') {
    return 100;
  }
  
  return 0;
}

/**
 * Look up broker information from listId
 * 
 * @param {Object} db - Firestore database instance
 * @param {string} listId - Identity list ID
 * @returns {Promise<{userId: string, userName: string, userEmail: string}>} Broker information
 */
async function lookupBrokerInfo(db, listId) {
  try {
    if (!listId) {
      return {
        userId: 'unknown',
        userName: 'Unknown User',
        userEmail: 'unknown'
      };
    }
    
    // Query identity-lists collection to get the broker who created the list
    const listDoc = await db.collection('identity-lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return {
        userId: 'unknown',
        userName: 'Unknown User',
        userEmail: 'unknown'
      };
    }
    
    const listData = listDoc.data();
    const createdBy = listData.createdBy;
    
    if (!createdBy) {
      return {
        userId: 'unknown',
        userName: 'Unknown User',
        userEmail: 'unknown'
      };
    }
    
    // Query userroles collection to get broker name and email
    const userDoc = await db.collection('userroles').doc(createdBy).get();
    
    if (!userDoc.exists) {
      return {
        userId: createdBy,
        userName: 'Unknown User',
        userEmail: 'unknown'
      };
    }
    
    const userData = userDoc.data();
    
    return {
      userId: createdBy,
      userName: userData.name || userData.displayName || 'Unknown User',
      userEmail: userData.email || 'unknown'
    };
    
  } catch (error) {
    console.error('[APIUsageTracker] Error looking up broker info:', error);
    return {
      userId: 'unknown',
      userName: 'Unknown User',
      userEmail: 'unknown'
    };
  }
}

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
    
    // Calculate cost for this API call
    const cost = calculateCost('datapro', callData.success);
    
    // Look up broker information if listId is provided
    const brokerInfo = await lookupBrokerInfo(db, callData.listId);
    
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
    
    // Store individual call log for audit with complete data
    await db.collection('api-usage-logs').add({
      apiProvider: 'datapro',
      apiType: 'nin_verification',
      ninMasked: callData.nin,
      success: callData.success,
      errorCode: callData.errorCode || null,
      userId: brokerInfo.userId,
      userName: brokerInfo.userName,
      userEmail: brokerInfo.userEmail,
      listId: callData.listId || null,
      entryId: callData.entryId || null,
      cost: cost,
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
    
    // Calculate cost for this API call
    const cost = calculateCost('verifydata', callData.success);
    
    // Look up broker information if listId is provided
    const brokerInfo = await lookupBrokerInfo(db, callData.listId);
    
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
    
    // Store individual call log for audit with complete data
    await db.collection('api-usage-logs').add({
      apiProvider: 'verifydata',
      apiType: 'cac_verification',
      rcNumberMasked: callData.rcNumber,
      success: callData.success,
      errorCode: callData.errorCode || null,
      userId: brokerInfo.userId,
      userName: brokerInfo.userName,
      userEmail: brokerInfo.userEmail,
      listId: callData.listId || null,
      entryId: callData.entryId || null,
      cost: cost,
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
      
      // Calculate cost: ALL calls are charged (success and failure)
      // Datapro: ₦50 per call
      // VerifyData: ₦100 per call
      const costPerCall = apiProvider === 'datapro' ? 50 : 100;
      const estimatedCost = totalCalls * costPerCall; // Changed from successCalls to totalCalls
      
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
  checkUsageLimits,
  calculateCost,
  lookupBrokerInfo
};
