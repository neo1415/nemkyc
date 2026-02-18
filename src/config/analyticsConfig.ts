/**
 * Analytics Dashboard Configuration
 * 
 * Constants and configuration values for the API Analytics Dashboard
 */

// API Cost Rates (in Nigerian Naira)
export const API_COSTS = {
  DATAPRO: 50, // ₦50 per NIN verification call
  VERIFYDATA: 100, // ₦100 per CAC verification call
} as const;

// Update Intervals (in milliseconds)
export const UPDATE_INTERVALS = {
  DASHBOARD_REFRESH: 30000, // 30 seconds - auto-refresh dashboard metrics
  REALTIME_POLL: 30000, // 30 seconds - poll for real-time updates
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  AUDIT_LOGS_PAGE_SIZE: 50,
  BROKER_USAGE_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Budget Alert Thresholds (percentages)
export const BUDGET_THRESHOLDS = {
  WARNING: 80, // Show warning at 80% utilization
  CRITICAL: 100, // Show critical alert at 100% utilization
  DEFAULT_MONTHLY_LIMIT: 100000, // Default budget limit: ₦100,000
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: {
    DATAPRO: '#3b82f6', // Blue
    VERIFYDATA: '#10b981', // Green
    SUCCESS: '#22c55e', // Green
    FAILURE: '#ef4444', // Red
    WARNING: '#f59e0b', // Amber
    CRITICAL: '#dc2626', // Red
  },
  ANIMATION_DURATION: 300, // milliseconds
} as const;

// Date Format Strings
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  API: 'yyyy-MM-dd',
  MONTH: 'yyyy-MM',
  TIMESTAMP: 'MMM dd, yyyy HH:mm:ss',
} as const;

// Report Configuration
export const REPORT_CONFIG = {
  MAX_RECORDS: 10000, // Maximum records per report
  FORMATS: ['pdf', 'excel', 'csv'] as const,
  SECTIONS: [
    'overview',
    'usage-charts',
    'broker-attribution',
    'cost-tracking',
    'audit-logs',
  ] as const,
} as const;

// Filter Defaults
export const FILTER_DEFAULTS = {
  PROVIDER: 'all' as const,
  STATUS: 'all' as const,
  DATE_RANGE_DAYS: 30, // Default to last 30 days
} as const;
