/**
 * Analytics Dashboard Type Definitions
 * 
 * Type definitions for the API Analytics & Cost Tracking Dashboard
 */

export interface AnalyticsSummary {
  totalCalls: number;
  totalCost: number;
  successRate: number;
  failureRate: number;
  dataproCalls: number;
  dataproCost: number;
  verifydataCalls: number;
  verifydataCost: number;
  periodStart: Date;
  periodEnd: Date;
  previousPeriodComparison: {
    callsChange: number;
    costChange: number;
    successRateChange: number;
  };
}

export interface UsageDataPoint {
  date: string;
  dataproCalls: number;
  verifydataCalls: number;
  totalCalls: number;
  dataproCost: number;
  verifydataCost: number;
  totalCost: number;
  successCount: number;
  failureCount: number;
}

export interface BrokerUsage {
  userId?: string; // Backend returns userId
  brokerId: string;
  brokerName: string;
  brokerEmail: string;
  userRole?: string;
  totalCalls: number;
  dataproCalls: number;
  verifydataCalls: number;
  totalCost: number;
  successRate: number;
  lastActivity: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date | string;
  userId: string;
  userName: string;
  userType?: 'user' | 'customer' | 'system';
  userEmail?: string;
  provider: 'datapro' | 'verifydata' | string;
  verificationType: 'nin' | 'cac' | string;
  status: 'success' | 'failure' | 'pending' | string;
  cost: number;
  ipAddress: string;
  deviceInfo: string;
  errorMessage?: string | null;
  requestData?: Record<string, any> | null;
  responseData?: Record<string, any> | null;
}

export interface BudgetConfig {
  monthlyLimit: number;
  warningThreshold: number; // percentage (e.g., 80)
  criticalThreshold: number; // percentage (e.g., 100)
  notificationEnabled: boolean;
}

export interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
  };
  provider: 'all' | 'datapro' | 'verifydata';
  status: 'all' | 'success' | 'failure';
  brokerId?: string;
}

export interface CostTrackingData {
  currentSpending: number;
  budgetLimit: number;
  utilization: number;
  projectedCost: number;
  alertLevel: 'normal' | 'warning' | 'critical';
  daysElapsed: number;
  daysInMonth: number;
}
