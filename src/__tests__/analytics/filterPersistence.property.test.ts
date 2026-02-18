/**
 * Property-Based Tests for Filter Persistence
 * 
 * Feature: api-analytics-dashboard
 * Property 12: Filter Persistence Round-Trip
 * 
 * Validates: Requirements 4.6
 * 
 * Property: For any filter configuration, saving to session storage
 * and then loading should produce an equivalent filter state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  saveFiltersToSession,
  loadFiltersFromSession,
  clearSavedFilters,
} from '../../services/analytics/filterPersistence';
import type { FilterState } from '../../types/analytics';

describe('Feature: api-analytics-dashboard, Property 12: Filter Persistence Round-Trip', () => {
  beforeEach(() => {
    // Clear session storage before each test
    clearSavedFilters();
  });

  it('saving and loading filters produces equivalent state', () => {
    fc.assert(
      fc.property(
        fc.record({
          dateRange: fc.record({
            start: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            end: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          }),
          provider: fc.constantFrom('all', 'datapro', 'verifydata'),
          status: fc.constantFrom('all', 'success', 'failure'),
          brokerId: fc.option(fc.string(), { nil: undefined }),
        }),
        (filters) => {
          // Skip if dates are invalid
          if (isNaN(filters.dateRange.start.getTime()) || isNaN(filters.dateRange.end.getTime())) {
            return;
          }

          // Ensure start <= end
          if (filters.dateRange.start > filters.dateRange.end) {
            [filters.dateRange.start, filters.dateRange.end] = [
              filters.dateRange.end,
              filters.dateRange.start,
            ];
          }

          // Save filters
          saveFiltersToSession(filters as FilterState);

          // Load filters
          const loaded = loadFiltersFromSession();

          // Compare dates (timestamps should be equal)
          expect(loaded.dateRange.start.getTime()).toBe(filters.dateRange.start.getTime());
          expect(loaded.dateRange.end.getTime()).toBe(filters.dateRange.end.getTime());

          // Compare other fields
          expect(loaded.provider).toBe(filters.provider);
          expect(loaded.status).toBe(filters.status);
          expect(loaded.brokerId).toBe(filters.brokerId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('date objects are preserved through serialization', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (start, end) => {
          // Skip if dates are invalid
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return;
          }

          // Ensure start <= end
          if (start > end) [start, end] = [end, start];

          const filters: FilterState = {
            dateRange: { start, end },
            provider: 'all',
            status: 'all',
          };

          saveFiltersToSession(filters);
          const loaded = loadFiltersFromSession();

          // Dates should be Date objects
          expect(loaded.dateRange.start).toBeInstanceOf(Date);
          expect(loaded.dateRange.end).toBeInstanceOf(Date);

          // Timestamps should match
          expect(loaded.dateRange.start.getTime()).toBe(start.getTime());
          expect(loaded.dateRange.end.getTime()).toBe(end.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('optional brokerId is preserved correctly', () => {
    const filtersWithBroker: FilterState = {
      dateRange: {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-31'),
      },
      provider: 'datapro',
      status: 'success',
      brokerId: 'broker123',
    };

    saveFiltersToSession(filtersWithBroker);
    const loaded = loadFiltersFromSession();

    expect(loaded.brokerId).toBe('broker123');
  });

  it('missing brokerId remains undefined', () => {
    const filtersWithoutBroker: FilterState = {
      dateRange: {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-31'),
      },
      provider: 'datapro',
      status: 'success',
    };

    saveFiltersToSession(filtersWithoutBroker);
    const loaded = loadFiltersFromSession();

    expect(loaded.brokerId).toBeUndefined();
  });

  it('multiple save/load cycles preserve state', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            dateRange: fc.record({
              start: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
              end: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            }),
            provider: fc.constantFrom('all', 'datapro', 'verifydata'),
            status: fc.constantFrom('all', 'success', 'failure'),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (filtersList) => {
          let lastFilters: FilterState | null = null;

          filtersList.forEach((filters) => {
            // Ensure start <= end
            if (filters.dateRange.start > filters.dateRange.end) {
              [filters.dateRange.start, filters.dateRange.end] = [
                filters.dateRange.end,
                filters.dateRange.start,
              ];
            }

            saveFiltersToSession(filters as FilterState);
            lastFilters = filters as FilterState;
          });

          // Load should return the last saved filters
          const loaded = loadFiltersFromSession();

          expect(loaded.dateRange.start.getTime()).toBe(lastFilters!.dateRange.start.getTime());
          expect(loaded.dateRange.end.getTime()).toBe(lastFilters!.dateRange.end.getTime());
          expect(loaded.provider).toBe(lastFilters!.provider);
          expect(loaded.status).toBe(lastFilters!.status);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('clearing filters removes saved state', () => {
    const filters: FilterState = {
      dateRange: {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-31'),
      },
      provider: 'datapro',
      status: 'success',
    };

    saveFiltersToSession(filters);
    clearSavedFilters();

    // Loading after clear should return defaults
    const loaded = loadFiltersFromSession();

    // Should not match the saved filters
    expect(loaded.provider).not.toBe(filters.provider);
    expect(loaded.status).not.toBe(filters.status);
  });

  it('handles corrupted storage gracefully', () => {
    // Manually corrupt the storage
    sessionStorage.setItem('analytics_dashboard_filters', 'invalid json {');

    // Should return defaults without throwing
    const loaded = loadFiltersFromSession();

    expect(loaded.provider).toBe('all');
    expect(loaded.status).toBe('all');
    expect(loaded.dateRange.start).toBeInstanceOf(Date);
    expect(loaded.dateRange.end).toBeInstanceOf(Date);
  });
});
