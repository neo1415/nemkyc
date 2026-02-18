/**
 * Analytics API Client
 * 
 * Client for calling backend analytics API endpoints.
 * All data access goes through authenticated backend APIs.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 6.3, 7.1, 7.2
 */

import type {
  AnalyticsSummary,
  BrokerUsage,
  CostTrackingData,
  BudgetConfig,
  AuditLogEntry,
} from '../../types/analytics';
import { queryCache, generateCacheKey, queryBatcher } from './queryOptimization';
import { API_BASE_URL } from '../../config/constants';

export class AnalyticsAPI {
  private baseURL = `${API_BASE_URL}/api/analytics`;

  /**
   * Gets headers for authenticated requests
   * Includes Authorization header with session token from localStorage for localhost cross-port auth
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // For localhost cross-port authentication, send session token in Authorization header
    const sessionToken = localStorage.getItem('__session');
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    return headers;
  }

  /**
   * Fetches dashboard overview metrics
   * 
   * @param month - Month in YYYY-MM format (optional, defaults to current month)
   * @returns Analytics summary with metrics and comparisons
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   */
  async fetchOverview(month?: string): Promise<AnalyticsSummary> {
    const cacheKey = generateCacheKey('overview', { month: month || 'current' });
    
    // Check cache first
    const cached = queryCache.get<AnalyticsSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use query batcher to deduplicate concurrent requests
    return queryBatcher.execute(cacheKey, async () => {
      const params = month ? `?month=${month}` : '';
      const response = await fetch(`${this.baseURL}/overview${params}`, {
        headers: this.getHeaders(),
        credentials: 'include', // Include session cookie
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch overview' }));
        throw new Error(error.error || 'Failed to fetch overview');
      }

      const data = await response.json();
      
      // Cache the result for 2 minutes
      queryCache.set(cacheKey, data, 2 * 60 * 1000);
      
      return data;
    });
  }

  /**
   * Fetches user attribution data with usage metrics
   * 
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param sortBy - Sort field: 'calls', 'cost', 'successRate', or 'role'
   * @param order - Sort order: 'asc' or 'desc'
   * @returns Array of user attribution objects
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.11
   */
  async fetchUserAttribution(
    startDate: string,
    endDate: string,
    sortBy?: 'calls' | 'cost' | 'successRate' | 'role',
    order?: 'asc' | 'desc'
  ): Promise<BrokerUsage[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(sortBy && { sortBy }),
      ...(order && { order }),
    });

    const response = await fetch(`${this.baseURL}/user-attribution?${params}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch user attribution' }));
      throw new Error(error.error || 'Failed to fetch user attribution');
    }

    const data = await response.json();
    return data.users;
  }

  /**
   * Fetches cost tracking data with budget monitoring
   * 
   * @param month - Month in YYYY-MM format (optional, defaults to current month)
   * @returns Cost tracking data with projections and alert level
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7
   */
  async fetchCostTracking(month?: string): Promise<CostTrackingData> {
    const params = month ? `?month=${month}` : '';
    const response = await fetch(`${this.baseURL}/cost-tracking${params}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch cost tracking' }));
      throw new Error(error.error || 'Failed to fetch cost tracking');
    }

    const data = await response.json();
    
    // Map backend response to frontend interface
    return {
      currentSpending: data.currentSpend || 0,
      budgetLimit: data.budget || 100000,
      utilization: data.metadata?.utilizationPercent || 0,
      projectedCost: data.projectedSpend || 0,
      alertLevel: data.alertLevel === 'none' ? 'normal' : data.alertLevel,
      daysElapsed: data.metadata?.daysElapsed || 0,
      daysInMonth: data.metadata?.daysInMonth || 30
    };
  }

  /**
   * Fetches budget configuration
   * 
   * @returns Budget configuration with thresholds
   * 
   * Requirements: 6.6
   */
  async fetchBudgetConfig(): Promise<BudgetConfig> {
    const response = await fetch(`${this.baseURL}/budget-config`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch budget config' }));
      throw new Error(error.error || 'Failed to fetch budget config');
    }

    const data = await response.json();
    
    // Map backend response to frontend interface
    return {
      monthlyLimit: data.monthlyBudget || 100000,
      warningThreshold: (data.warningThreshold || 0.8) * 100, // Convert 0.8 to 80
      criticalThreshold: (data.criticalThreshold || 0.95) * 100, // Convert 0.95 to 95
      notificationEnabled: data.notificationEnabled !== false
    };
  }

  /**
   * Updates budget configuration
   * 
   * @param config - Budget configuration to save
   * 
   * Requirements: 6.6
   */
  async updateBudgetConfig(config: BudgetConfig): Promise<void> {
    // Map frontend interface to backend format
    const backendConfig = {
      monthlyBudget: config.monthlyLimit,
      warningThreshold: config.warningThreshold / 100, // Convert 80 to 0.8
      criticalThreshold: config.criticalThreshold / 100 // Convert 95 to 0.95
    };
    
    const response = await fetch(`${this.baseURL}/budget-config`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(backendConfig),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update budget config' }));
      throw new Error(error.error || 'Failed to update budget config');
    }
  }

  /**
   * Generates and downloads report
   * 
   * @param format - Report format: 'pdf', 'excel', or 'csv'
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param sections - Array of section names to include
   * @returns Report data as JSON (frontend will generate file)
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
   */
  async exportReport(
    format: 'pdf' | 'excel' | 'csv',
    startDate: string,
    endDate: string,
    sections: string[]
  ): Promise<any> {
    const params = new URLSearchParams({
      format,
      startDate,
      endDate,
      sections: sections.join(','),
    });

    const response = await fetch(`${this.baseURL}/export?${params}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to export report' }));
      throw new Error(error.error || 'Failed to export report');
    }

    return response.json();
  }

  /**
   * Fetches audit logs with filtering and pagination
   * 
   * @param filters - Filter criteria
   * @returns Array of audit log entries
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
   */
  async fetchAuditLogs(filters: {
    startDate?: string;
    endDate?: string;
    provider?: string;
    status?: string;
    eventType?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.status) params.append('status', filters.status);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${this.baseURL}/audit-logs?${params}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch audit logs' }));
      throw new Error(error.error || 'Failed to fetch audit logs');
    }

    const data = await response.json();
    return data.logs || [];
  }
}

// Export singleton instance
export const analyticsAPI = new AnalyticsAPI();
