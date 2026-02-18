/**
 * Cost Calculator Utility
 * 
 * Calculates API costs, budget utilization, and alert levels
 * for the Analytics Dashboard.
 * 
 * Requirements: 2.2, 2.5, 6.1, 6.2, 6.8
 */

import { API_COSTS, BUDGET_THRESHOLDS } from '../../config/analyticsConfig';
import type { BudgetConfig } from '../../types/analytics';

export class CostCalculator {
  private readonly DATAPRO_COST = API_COSTS.DATAPRO; // ₦50 per call
  private readonly VERIFYDATA_COST = API_COSTS.VERIFYDATA; // ₦100 per call

  /**
   * Calculates total cost for given usage
   * 
   * Formula: (dataproCalls × ₦50) + (verifydataCalls × ₦100)
   * 
   * @param dataproCalls - Number of Datapro (NIN) verification calls
   * @param verifydataCalls - Number of VerifyData (CAC) verification calls
   * @returns Object with total cost and breakdown by provider
   * 
   * Requirements: 2.2, 2.5, 6.1, 6.8
   */
  calculateTotalCost(
    dataproCalls: number,
    verifydataCalls: number
  ): {
    total: number;
    dataproCost: number;
    verifydataCost: number;
  } {
    const dataproCost = dataproCalls * this.DATAPRO_COST;
    const verifydataCost = verifydataCalls * this.VERIFYDATA_COST;
    const total = dataproCost + verifydataCost;

    return {
      total,
      dataproCost,
      verifydataCost,
    };
  }

  /**
   * Calculates budget utilization percentage
   * 
   * Formula: (currentSpending / budgetLimit) × 100
   * 
   * @param currentSpending - Current spending amount
   * @param budgetLimit - Budget limit amount
   * @returns Utilization percentage (0-100+)
   * 
   * Requirements: 6.2
   */
  calculateBudgetUtilization(
    currentSpending: number,
    budgetLimit: number
  ): number {
    if (budgetLimit <= 0) {
      return 0;
    }
    return (currentSpending / budgetLimit) * 100;
  }

  /**
   * Determines alert level based on budget utilization
   * 
   * Alert levels:
   * - normal: utilization < warningThreshold
   * - warning: utilization >= warningThreshold && < criticalThreshold
   * - critical: utilization >= criticalThreshold
   * 
   * @param utilization - Budget utilization percentage
   * @param config - Budget configuration with thresholds
   * @returns Alert level: 'normal', 'warning', or 'critical'
   * 
   * Requirements: 6.4, 6.5
   */
  getAlertLevel(
    utilization: number,
    config: BudgetConfig
  ): 'normal' | 'warning' | 'critical' {
    if (utilization >= config.criticalThreshold) {
      return 'critical';
    }
    if (utilization >= config.warningThreshold) {
      return 'warning';
    }
    return 'normal';
  }

  /**
   * Calculates projected end-of-month cost based on current spending
   * 
   * Formula: (currentSpending / daysElapsed) × totalDaysInMonth
   * 
   * @param currentSpending - Current spending amount
   * @param daysElapsed - Number of days elapsed in the month
   * @param totalDaysInMonth - Total days in the month
   * @returns Projected cost for the full month
   * 
   * Requirements: 6.3, 6.7
   */
  calculateProjectedCost(
    currentSpending: number,
    daysElapsed: number,
    totalDaysInMonth: number
  ): number {
    if (daysElapsed <= 0) {
      return 0;
    }
    const dailyAverage = currentSpending / daysElapsed;
    return dailyAverage * totalDaysInMonth;
  }

  /**
   * Calculates success rate percentage
   * 
   * Formula: (successfulCalls / totalCalls) × 100
   * 
   * @param successfulCalls - Number of successful calls
   * @param totalCalls - Total number of calls
   * @returns Success rate percentage (0-100)
   * 
   * Requirements: 2.3, 5.3
   */
  calculateSuccessRate(
    successfulCalls: number,
    totalCalls: number
  ): number {
    if (totalCalls <= 0) {
      return 0;
    }
    return (successfulCalls / totalCalls) * 100;
  }

  /**
   * Calculates percentage change between two periods
   * 
   * Formula: ((current - previous) / previous) × 100
   * 
   * @param current - Current period value
   * @param previous - Previous period value
   * @returns Percentage change (positive = increase, negative = decrease)
   * 
   * Requirements: 2.6
   */
  calculatePercentageChange(
    current: number,
    previous: number
  ): number {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  /**
   * Formats currency amount in Nigerian Naira
   * 
   * @param amount - Amount to format
   * @returns Formatted currency string (e.g., "₦7,500")
   */
  formatCurrency(amount: number): string {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Formats percentage with specified decimal places
   * 
   * @param percentage - Percentage value
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted percentage string (e.g., "85.50%")
   */
  formatPercentage(percentage: number, decimals: number = 2): string {
    return `${percentage.toFixed(decimals)}%`;
  }
}

// Export singleton instance
export const costCalculator = new CostCalculator();
