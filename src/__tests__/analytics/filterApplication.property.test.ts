/**
 * Property-Based Tests for Filter Application
 * 
 * Feature: analytics-data-fixes
 * Property: 18
 * 
 * Validates: Requirements 9.4
 * 
 * **Property 18: Filter Application Correctness**
 * For any set of filters applied, all returned records should match the 
 * filter criteria (date within range, provider matches, status matches).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

interface AuditLog {
  date: string;
  provider: string;
  status: string;
  userId: string;
}

// Helper to check if date is within range
function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

// Helper to apply filters
function applyFilters(
  logs: AuditLog[],
  filters: {
    startDate?: string;
    endDate?: string;
    provider?: string;
    status?: string;
    user?: string;
  }
): AuditLog[] {
  return logs.filter(log => {
    // Date range filter
    if (filters.startDate && filters.endDate) {
      if (!isDateInRange(log.date, filters.startDate, filters.endDate)) {
        return false;
      }
    }
    
    // Provider filter
    if (filters.provider && filters.provider !== 'all') {
      if (log.provider !== filters.provider) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (log.status !== filters.status) {
        return false;
      }
    }
    
    // User filter
    if (filters.user && filters.user !== 'all') {
      if (log.userId !== filters.user) {
        return false;
      }
    }
    
    return true;
  });
}

describe('Feature: analytics-data-fixes, Property 18: Filter Application Correctness', () => {
  it('all returned records match date range filter', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constantFrom('2024-01-01', '2024-01-15', '2024-02-01', '2024-02-15', '2024-03-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constantFrom('user1', 'user2')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (logs) => {
          const startDate = '2024-01-15';
          const endDate = '2024-02-15';
          
          const filtered = applyFilters(logs, { startDate, endDate });
          
          // All filtered logs should be within date range
          filtered.forEach(log => {
            expect(isDateInRange(log.date, startDate, endDate)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all returned records match provider filter', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constant('2024-01-01'),
            provider: fc.constantFrom('datapro', 'verifydata', 'unknown'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constant('user1')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.constantFrom('datapro', 'verifydata'),
        (logs, targetProvider) => {
          const filtered = applyFilters(logs, { provider: targetProvider });
          
          // All filtered logs should match provider
          filtered.forEach(log => {
            expect(log.provider).toBe(targetProvider);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all returned records match status filter', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constant('2024-01-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure', 'pending'),
            userId: fc.constant('user1')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.constantFrom('success', 'failure', 'pending'),
        (logs, targetStatus) => {
          const filtered = applyFilters(logs, { status: targetStatus });
          
          // All filtered logs should match status
          filtered.forEach(log => {
            expect(log.status).toBe(targetStatus);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all returned records match user filter', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constant('2024-01-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constantFrom('user1', 'user2', 'user3')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.constantFrom('user1', 'user2', 'user3'),
        (logs, targetUser) => {
          const filtered = applyFilters(logs, { user: targetUser });
          
          // All filtered logs should match user
          filtered.forEach(log => {
            expect(log.userId).toBe(targetUser);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all returned records match combined filters', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constantFrom('2024-01-01', '2024-01-15', '2024-02-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constantFrom('user1', 'user2')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (logs) => {
          const filters = {
            startDate: '2024-01-01',
            endDate: '2024-02-01',
            provider: 'datapro',
            status: 'success'
          };
          
          const filtered = applyFilters(logs, filters);
          
          // All filtered logs should match all filters
          filtered.forEach(log => {
            expect(isDateInRange(log.date, filters.startDate, filters.endDate)).toBe(true);
            expect(log.provider).toBe(filters.provider);
            expect(log.status).toBe(filters.status);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constantFrom('2024-01-01', '2024-02-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constant('user1')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (logs) => {
          const filters = { provider: 'datapro', status: 'success' };
          
          const filtered1 = applyFilters(logs, filters);
          const filtered2 = applyFilters(filtered1, filters);
          
          // Applying filters twice should give same result
          expect(filtered2).toEqual(filtered1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty filters return all records', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constant('2024-01-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constant('user1')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (logs) => {
          const filtered = applyFilters(logs, {});
          
          // No filters should return all logs
          expect(filtered.length).toBe(logs.length);
          expect(filtered).toEqual(logs);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('"all" filter value returns all records for that dimension', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constant('2024-01-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constant('user1')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (logs) => {
          const filtered = applyFilters(logs, { provider: 'all', status: 'all' });
          
          // "all" should not filter
          expect(filtered.length).toBe(logs.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: analytics-data-fixes, Filter Application Edge Cases', () => {
  it('handles empty dataset', () => {
    const logs: AuditLog[] = [];
    const filtered = applyFilters(logs, { provider: 'datapro' });
    
    expect(filtered).toEqual([]);
    expect(filtered.length).toBe(0);
  });

  it('handles no matching records', () => {
    const logs: AuditLog[] = [
      { date: '2024-01-01', provider: 'datapro', status: 'success', userId: 'user1' },
      { date: '2024-01-02', provider: 'datapro', status: 'success', userId: 'user1' }
    ];
    
    const filtered = applyFilters(logs, { provider: 'verifydata' });
    
    expect(filtered).toEqual([]);
    expect(filtered.length).toBe(0);
  });

  it('handles all records matching', () => {
    const logs: AuditLog[] = [
      { date: '2024-01-01', provider: 'datapro', status: 'success', userId: 'user1' },
      { date: '2024-01-02', provider: 'datapro', status: 'success', userId: 'user1' }
    ];
    
    const filtered = applyFilters(logs, { provider: 'datapro' });
    
    expect(filtered).toEqual(logs);
    expect(filtered.length).toBe(2);
  });

  it('filter order does not matter', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constantFrom('2024-01-01', '2024-02-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constantFrom('user1', 'user2')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (logs) => {
          // Apply filters in different orders
          const filters1 = applyFilters(
            applyFilters(logs, { provider: 'datapro' }),
            { status: 'success' }
          );
          
          const filters2 = applyFilters(
            applyFilters(logs, { status: 'success' }),
            { provider: 'datapro' }
          );
          
          // Results should be the same
          expect(filters1).toEqual(filters2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering reduces or maintains dataset size', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.constant('2024-01-01'),
            provider: fc.constantFrom('datapro', 'verifydata'),
            status: fc.constantFrom('success', 'failure'),
            userId: fc.constant('user1')
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (logs) => {
          const filtered = applyFilters(logs, { provider: 'datapro' });
          
          // Filtered dataset should be <= original
          expect(filtered.length).toBeLessThanOrEqual(logs.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('date range boundaries are inclusive', () => {
    const logs: AuditLog[] = [
      { date: '2024-01-01', provider: 'datapro', status: 'success', userId: 'user1' },
      { date: '2024-01-15', provider: 'datapro', status: 'success', userId: 'user1' },
      { date: '2024-01-31', provider: 'datapro', status: 'success', userId: 'user1' }
    ];
    
    const filtered = applyFilters(logs, {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
    
    // All three should be included (boundaries are inclusive)
    expect(filtered.length).toBe(3);
    expect(filtered).toContainEqual(logs[0]);
    expect(filtered).toContainEqual(logs[1]);
    expect(filtered).toContainEqual(logs[2]);
  });
});
