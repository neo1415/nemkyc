/**
 * Filter Utility Functions
 * 
 * Utilities for filtering analytics data by date range, provider, and status.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.7
 */

import type { FilterState } from '../../types/analytics';

/**
 * Applies date range filter to data
 * 
 * @param data - Array of data items with date field
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Filtered data within date range (inclusive)
 * 
 * Requirements: 4.1
 */
export function applyDateRangeFilter<T extends { date?: string; timestamp?: Date }>(
  data: T[],
  startDate: Date,
  endDate: Date
): T[] {
  return data.filter((item) => {
    const itemDate = item.timestamp || (item.date ? new Date(item.date) : null);
    if (!itemDate) return false;

    const date = itemDate instanceof Date ? itemDate : new Date(itemDate);
    return date >= startDate && date <= endDate;
  });
}

/**
 * Applies provider filter to data
 * 
 * @param data - Array of data items with provider field
 * @param provider - Provider to filter by ('all', 'datapro', or 'verifydata')
 * @returns Filtered data matching provider
 * 
 * Requirements: 4.2
 */
export function applyProviderFilter<T extends { provider?: string; apiProvider?: string }>(
  data: T[],
  provider: 'all' | 'datapro' | 'verifydata'
): T[] {
  if (provider === 'all') {
    return data;
  }

  return data.filter((item) => {
    const itemProvider = item.provider || item.apiProvider;
    return itemProvider === provider;
  });
}

/**
 * Applies status filter to data
 * 
 * @param data - Array of data items with status or success field
 * @param status - Status to filter by ('all', 'success', or 'failure')
 * @returns Filtered data matching status
 * 
 * Requirements: 4.3
 */
export function applyStatusFilter<T extends { status?: string; success?: boolean }>(
  data: T[],
  status: 'all' | 'success' | 'failure'
): T[] {
  if (status === 'all') {
    return data;
  }

  return data.filter((item) => {
    // Handle both status string and success boolean
    if (item.status !== undefined) {
      return item.status === status;
    }
    if (item.success !== undefined) {
      return status === 'success' ? item.success : !item.success;
    }
    return false;
  });
}

/**
 * Combines multiple filters with AND logic
 * 
 * @param data - Array of data items
 * @param filters - Filter state with all filter criteria
 * @returns Filtered data matching all criteria
 * 
 * Requirements: 4.4
 */
export function combineFilters<
  T extends {
    date?: string;
    timestamp?: Date;
    provider?: string;
    apiProvider?: string;
    status?: string;
    success?: boolean;
  }
>(data: T[], filters: FilterState): T[] {
  let filtered = data;

  // Apply date range filter
  filtered = applyDateRangeFilter(filtered, filters.dateRange.start, filters.dateRange.end);

  // Apply provider filter
  filtered = applyProviderFilter(filtered, filters.provider);

  // Apply status filter
  filtered = applyStatusFilter(filtered, filters.status);

  // Apply broker filter if specified
  if (filters.brokerId) {
    filtered = filtered.filter((item: any) => {
      return item.userId === filters.brokerId || item.brokerId === filters.brokerId;
    });
  }

  return filtered;
}

/**
 * Validates date range to prevent invalid selections
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Validation result with error message if invalid
 * 
 * Requirements: 4.7
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date
): { valid: boolean; error?: string } {
  // Check if dates are valid Date objects
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    return { valid: false, error: 'Start date is invalid' };
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    return { valid: false, error: 'End date is invalid' };
  }

  // Check if start date is before or equal to end date
  if (startDate > endDate) {
    return { valid: false, error: 'Start date must be before or equal to end date' };
  }

  // Check if date range is not too far in the future
  const now = new Date();
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  if (startDate > oneYearFromNow) {
    return { valid: false, error: 'Start date cannot be more than one year in the future' };
  }

  // Check if date range is not too large (max 1 year)
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  const rangeInMs = endDate.getTime() - startDate.getTime();

  if (rangeInMs > oneYearInMs) {
    return { valid: false, error: 'Date range cannot exceed one year' };
  }

  return { valid: true };
}

/**
 * Resets filters to default state
 * 
 * @returns Default filter state
 * 
 * Requirements: 4.5
 */
export function getDefaultFilters(): FilterState {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    dateRange: {
      start: thirtyDaysAgo,
      end: now,
    },
    provider: 'all',
    status: 'all',
  };
}

/**
 * Formats date for API requests (YYYY-MM-DD)
 * 
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats month for API requests (YYYY-MM)
 * 
 * @param date - Date to format
 * @returns Formatted month string
 */
export function formatMonthForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
