/**
 * Filter Persistence Utilities
 * 
 * Saves and loads filter state to/from browser session storage.
 * 
 * Requirements: 4.6
 */

import type { FilterState } from '../../types/analytics';
import { getDefaultFilters } from './filterUtils';

const STORAGE_KEY = 'analytics_dashboard_filters';

/**
 * Saves filter state to session storage
 * 
 * @param filters - Filter state to save
 * 
 * Requirements: 4.6
 */
export function saveFiltersToSession(filters: FilterState): void {
  try {
    // Validate dates before saving
    if (isNaN(filters.dateRange.start.getTime()) || isNaN(filters.dateRange.end.getTime())) {
      console.error('Failed to save filters to session storage: Invalid date values');
      return;
    }

    // Convert dates to ISO strings for storage
    const serializable = {
      dateRange: {
        start: filters.dateRange.start.toISOString(),
        end: filters.dateRange.end.toISOString(),
      },
      provider: filters.provider,
      status: filters.status,
      brokerId: filters.brokerId,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save filters to session storage:', error);
    // Fail silently - filter persistence is not critical
  }
}

/**
 * Loads filter state from session storage
 * 
 * @returns Loaded filter state or default filters if not found
 * 
 * Requirements: 4.6
 */
export function loadFiltersFromSession(): FilterState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return getDefaultFilters();
    }

    const parsed = JSON.parse(stored);

    // Convert ISO strings back to Date objects
    return {
      dateRange: {
        start: new Date(parsed.dateRange.start),
        end: new Date(parsed.dateRange.end),
      },
      provider: parsed.provider || 'all',
      status: parsed.status || 'all',
      brokerId: parsed.brokerId,
    };
  } catch (error) {
    console.error('Failed to load filters from session storage:', error);
    // Return defaults if loading fails
    return getDefaultFilters();
  }
}

/**
 * Clears saved filters from session storage
 */
export function clearSavedFilters(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear saved filters:', error);
  }
}

/**
 * Checks if filters are currently saved in session storage
 * 
 * @returns True if filters are saved, false otherwise
 */
export function hasFiltersSaved(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}
