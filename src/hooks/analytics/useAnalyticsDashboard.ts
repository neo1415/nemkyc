/**
 * useAnalyticsDashboard Hook
 * 
 * Custom React hook for fetching and managing analytics dashboard data.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4
 */

import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../../services/analytics/AnalyticsAPI';
import { formatDateForAPI, formatMonthForAPI } from '../../services/analytics/filterUtils';
import type {
  AnalyticsSummary,
  BrokerUsage,
  CostTrackingData,
  FilterState,
  UsageDataPoint,
} from '../../types/analytics';

interface UseAnalyticsDashboardResult {
  summary: AnalyticsSummary | null;
  userAttribution: BrokerUsage[];
  costTracking: CostTrackingData | null;
  dailyUsage: UsageDataPoint[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching analytics dashboard data
 * 
 * @param filters - Current filter state
 * @returns Dashboard data, loading state, error, and refetch function
 */
export function useAnalyticsDashboard(filters: FilterState): UseAnalyticsDashboardResult {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [userAttribution, setUserAttribution] = useState<BrokerUsage[]>([]);
  const [costTracking, setCostTracking] = useState<CostTrackingData | null>(null);
  const [dailyUsage, setDailyUsage] = useState<UsageDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Format dates for API
      const startDate = formatDateForAPI(filters.dateRange.start);
      const endDate = formatDateForAPI(filters.dateRange.end);
      const month = formatMonthForAPI(filters.dateRange.end);

      // Fetch all dashboard data from backend
      const [overviewData, userData, costData, usageData] = await Promise.all([
        analyticsAPI.fetchOverview(month),
        analyticsAPI.fetchUserAttribution(startDate, endDate),
        analyticsAPI.fetchCostTracking(month),
        analyticsAPI.fetchDailyUsage(startDate, endDate),
      ]);

      setSummary(overviewData);
      setUserAttribution(userData);
      setCostTracking(costData);
      setDailyUsage(usageData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    userAttribution,
    costTracking,
    dailyUsage,
    loading,
    error,
    refetch,
  };
}
