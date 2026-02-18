/**
 * Property-Based Tests for Filtering Logic
 * 
 * Feature: api-analytics-dashboard
 * Properties: 7, 8, 9, 10, 11, 13
 * 
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  applyDateRangeFilter,
  applyProviderFilter,
  applyStatusFilter,
  combineFilters,
  validateDateRange,
  getDefaultFilters,
} from '../../services/analytics/filterUtils';
import type { FilterState } from '../../types/analytics';

describe('Feature: api-analytics-dashboard, Property 7: Date Range Filtering', () => {
  it('all returned records have timestamps within the specified date range', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            value: fc.nat(),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-31') }),
        fc.date({ min: new Date('2020-01-02'), max: new Date('2030-12-31') }),
        (data, start, end) => {
          // Ensure start <= end
          if (start > end) [start, end] = [end, start];

          const dataWithDates = data.map((item) => ({
            ...item,
            timestamp: item.date,
          }));

          const filtered = applyDateRangeFilter(dataWithDates, start, end);

          filtered.forEach((item) => {
            expect(item.timestamp).toBeInstanceOf(Date);
            expect(item.timestamp!.getTime()).toBeGreaterThanOrEqual(start.getTime());
            expect(item.timestamp!.getTime()).toBeLessThanOrEqual(end.getTime());
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering is inclusive of start and end dates', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');

    const data = [
      { timestamp: new Date('2026-01-01'), value: 1 }, // Should be included
      { timestamp: new Date('2026-01-31'), value: 2 }, // Should be included
      { timestamp: new Date('2025-12-31'), value: 3 }, // Should be excluded
      { timestamp: new Date('2026-02-01'), value: 4 }, // Should be excluded
    ];

    const filtered = applyDateRangeFilter(data, start, end);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].value).toBe(1);
    expect(filtered[1].value).toBe(2);
  });
});

describe('Feature: api-analytics-dashboard, Property 8: Provider Filtering', () => {
  it('all returned records match the selected provider exactly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            provider: fc.constantFrom('datapro', 'verifydata'),
            value: fc.nat(),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        fc.constantFrom('datapro', 'verifydata'),
        (data, selectedProvider) => {
          const filtered = applyProviderFilter(data, selectedProvider);

          filtered.forEach((item) => {
            expect(item.provider).toBe(selectedProvider);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('"all" provider returns all records', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            provider: fc.constantFrom('datapro', 'verifydata'),
            value: fc.nat(),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (data) => {
          const filtered = applyProviderFilter(data, 'all');
          expect(filtered).toHaveLength(data.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: api-analytics-dashboard, Property 9: Status Filtering', () => {
  it('all returned records match the selected status exactly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: fc.constantFrom('success', 'failure'),
            value: fc.nat(),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        fc.constantFrom('success', 'failure'),
        (data, selectedStatus) => {
          const filtered = applyStatusFilter(data, selectedStatus);

          filtered.forEach((item) => {
            expect(item.status).toBe(selectedStatus);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('"all" status returns all records', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: fc.constantFrom('success', 'failure'),
            value: fc.nat(),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (data) => {
          const filtered = applyStatusFilter(data, 'all');
          expect(filtered).toHaveLength(data.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles success boolean field correctly', () => {
    const data = [
      { success: true, value: 1 },
      { success: false, value: 2 },
      { success: true, value: 3 },
    ];

    const successFiltered = applyStatusFilter(data, 'success');
    expect(successFiltered).toHaveLength(2);

    const failureFiltered = applyStatusFilter(data, 'failure');
    expect(failureFiltered).toHaveLength(1);
  });
});

describe('Feature: api-analytics-dashboard, Property 10: Multi-Filter Combination', () => {
  it('all returned records satisfy ALL filter conditions simultaneously', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');

    const data = [
      { timestamp: new Date('2026-01-15'), provider: 'datapro', status: 'success', value: 1 },
      { timestamp: new Date('2026-01-20'), provider: 'datapro', status: 'failure', value: 2 },
      { timestamp: new Date('2026-01-25'), provider: 'verifydata', status: 'success', value: 3 },
      { timestamp: new Date('2025-12-15'), provider: 'datapro', status: 'success', value: 4 },
    ];

    const filters: FilterState = {
      dateRange: { start, end },
      provider: 'datapro',
      status: 'success',
    };

    const filtered = combineFilters(data, filters);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].value).toBe(1);
    expect(filtered[0].provider).toBe('datapro');
    expect(filtered[0].status).toBe('success');
    expect(filtered[0].timestamp!.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(filtered[0].timestamp!.getTime()).toBeLessThanOrEqual(end.getTime());
  });
});

describe('Feature: api-analytics-dashboard, Property 11: Filter Reset Completeness', () => {
  it('clearing all filters returns the complete unfiltered dataset', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            value: fc.nat(),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        (data) => {
          // Filter out any records with invalid dates
          const validData = data.filter(record => !isNaN(record.timestamp.getTime()));
          
          const defaultFilters = getDefaultFilters();
          // Set date range to include all data
          defaultFilters.dateRange.start = new Date('2020-01-01');
          defaultFilters.dateRange.end = new Date('2030-12-31');

          const filtered = combineFilters(validData, defaultFilters);

          expect(filtered).toHaveLength(validData.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: api-analytics-dashboard, Property 13: Date Range Validation', () => {
  it('rejects ranges where start_date > end_date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-02'), max: new Date('2030-12-31') }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-30') }),
        (date1, date2) => {
          // Ensure date1 > date2
          const start = date1 > date2 ? date1 : date2;
          const end = date1 > date2 ? date2 : date1;

          if (start > end) {
            const result = validateDateRange(start, end);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts valid date ranges where start <= end', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
        fc.date({ min: new Date('2020-01-02'), max: new Date('2025-12-31') }),
        (date1, date2) => {
          // Ensure date1 <= date2
          const start = date1 < date2 ? date1 : date2;
          const end = date1 < date2 ? date2 : date1;

          // Only test if range is within 1 year and not too far in future
          const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
          const now = new Date();
          const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
          
          if (end.getTime() - start.getTime() <= oneYearInMs && start <= oneYearFromNow) {
            const result = validateDateRange(start, end);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects date ranges exceeding one year', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2027-01-02'); // More than 1 year

    const result = validateDateRange(start, end);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceed one year');
  });

  it('accepts date ranges equal to one year', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-12-31'); // Exactly 1 year

    const result = validateDateRange(start, end);
    expect(result.valid).toBe(true);
  });
});
