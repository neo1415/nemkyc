import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/analytics/AnalyticsAPI';
import type { BudgetConfig } from '../../types/analytics';

interface CostTrackingData {
  currentSpending: number;
  budgetLimit: number;
  utilization: number;
  projectedCost: number;
  alertLevel: 'normal' | 'warning' | 'critical';
  daysElapsed: number;
  daysInMonth: number;
}

/**
 * Hook for budget monitoring and configuration
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 * 
 * Fetches budget configuration and cost tracking data,
 * calculates utilization and alert levels, and provides
 * functions to update budget settings.
 */
export function useBudgetMonitoring(month?: string) {
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [costTracking, setCostTracking] = useState<CostTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch budget data
  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [config, tracking] = await Promise.all([
        analyticsAPI.fetchBudgetConfig(),
        analyticsAPI.fetchCostTracking(month)
      ]);

      setBudgetConfig(config);
      setCostTracking(tracking);
    } catch (err) {
      console.error('Error fetching budget data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBudgetData();
  }, [month]);

  // Update budget configuration
  const updateBudgetConfig = async (newConfig: BudgetConfig): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await analyticsAPI.updateBudgetConfig(newConfig);
      
      // Refresh data after update
      await fetchBudgetData();
    } catch (err) {
      console.error('Error updating budget config:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculate utilization percentage
  const getUtilization = (): number => {
    if (!costTracking) return 0;
    return costTracking.utilization;
  };

  // Get alert level
  const getAlertLevel = (): 'normal' | 'warning' | 'critical' => {
    if (!costTracking) return 'normal';
    return costTracking.alertLevel;
  };

  // Check if warning threshold exceeded
  const isWarning = (): boolean => {
    return getAlertLevel() === 'warning';
  };

  // Check if critical threshold exceeded
  const isCritical = (): boolean => {
    return getAlertLevel() === 'critical';
  };

  // Get projected overage amount
  const getProjectedOverage = (): number => {
    if (!costTracking || !budgetConfig) return 0;
    const overage = costTracking.projectedCost - budgetConfig.monthlyLimit;
    return Math.max(0, overage);
  };

  // Get remaining budget
  const getRemainingBudget = (): number => {
    if (!costTracking || !budgetConfig) return 0;
    return Math.max(0, budgetConfig.monthlyLimit - costTracking.currentSpending);
  };

  return {
    budgetConfig,
    costTracking,
    loading,
    error,
    updateBudgetConfig,
    refetch: fetchBudgetData,
    getUtilization,
    getAlertLevel,
    isWarning,
    isCritical,
    getProjectedOverage,
    getRemainingBudget
  };
}
