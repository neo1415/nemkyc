/**
 * Property-Based Tests for Filter Parameter Passing
 * 
 * Tests Property 17: Filter Parameter Passing
 * Validates: Requirements 9.1, 9.2, 9.3
 * 
 * Property 17: For any filter applied in the Analytics Dashboard (date range, provider, or status),
 * the API request should include the corresponding query parameters.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { analyticsAPI } from '../../services/analytics/AnalyticsAPI';

describe('Property 17: Filter Parameter Passing', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  it('should pass date range filters to overview endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (date) => {
          const month = date.toISOString().substring(0, 7); // YYYY-MM format
          
          // Mock successful response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              totalCalls: 100,
              successfulCalls: 90,
              failedCalls: 10,
              totalCost: 5000,
              successRate: 90,
              providerBreakdown: { datapro: 50, verifydata: 50 }
            })
          });

          await analyticsAPI.fetchOverview(month);

          // Verify fetch was called with correct URL including month parameter
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`month=${month}`),
            expect.any(Object)
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should pass date range filters to user attribution endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (startDateObj, endDateObj) => {
          // Clear previous mock calls
          vi.clearAllMocks();
          
          // Ensure start is before end
          const [start, end] = startDateObj <= endDateObj 
            ? [startDateObj, endDateObj] 
            : [endDateObj, startDateObj];
          
          const startDate = start.toISOString().split('T')[0]; // YYYY-MM-DD
          const endDate = end.toISOString().split('T')[0];
          
          // Mock successful response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ users: [] })
          });

          await analyticsAPI.fetchUserAttribution(startDate, endDate);

          // Verify fetch was called with correct URL including date parameters
          const fetchCall = (global.fetch as any).mock.calls[0][0];
          expect(fetchCall).toContain(`startDate=${startDate}`);
          expect(fetchCall).toContain(`endDate=${endDate}`);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should pass provider filter to audit logs endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('datapro', 'verifydata', 'all'),
        async (provider) => {
          // Mock successful response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ logs: [] })
          });

          await analyticsAPI.fetchAuditLogs({ provider });

          // Verify fetch was called with correct URL including provider parameter
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`provider=${provider}`),
            expect.any(Object)
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should pass status filter to audit logs endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('success', 'failure', 'pending', 'all'),
        async (status) => {
          // Mock successful response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ logs: [] })
          });

          await analyticsAPI.fetchAuditLogs({ status });

          // Verify fetch was called with correct URL including status parameter
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`status=${status}`),
            expect.any(Object)
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should pass multiple filters simultaneously to audit logs endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.constantFrom('datapro', 'verifydata'),
        fc.constantFrom('success', 'failure', 'pending'),
        async (startDateObj, endDateObj, provider, status) => {
          // Clear previous mock calls
          vi.clearAllMocks();
          
          // Ensure start is before end
          const [start, end] = startDateObj <= endDateObj 
            ? [startDateObj, endDateObj] 
            : [endDateObj, startDateObj];
          
          const startDate = start.toISOString().split('T')[0];
          const endDate = end.toISOString().split('T')[0];
          
          // Mock successful response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ logs: [] })
          });

          await analyticsAPI.fetchAuditLogs({
            startDate,
            endDate,
            provider,
            status
          });

          // Verify fetch was called with all filter parameters
          const fetchCall = (global.fetch as any).mock.calls[0][0];
          expect(fetchCall).toContain(`startDate=${startDate}`);
          expect(fetchCall).toContain(`endDate=${endDate}`);
          expect(fetchCall).toContain(`provider=${provider}`);
          expect(fetchCall).toContain(`status=${status}`);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should pass sort parameters to user attribution endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('calls', 'cost', 'successRate', 'role'),
        fc.constantFrom('asc', 'desc'),
        async (sortBy, order) => {
          // Clear previous mock calls
          vi.clearAllMocks();
          
          const startDate = '2024-01-01';
          const endDate = '2024-12-31';
          
          // Mock successful response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ users: [] })
          });

          await analyticsAPI.fetchUserAttribution(startDate, endDate, sortBy as any, order as any);

          // Verify fetch was called with sort parameters
          const fetchCall = (global.fetch as any).mock.calls[0][0];
          expect(fetchCall).toContain(`sortBy=${sortBy}`);
          expect(fetchCall).toContain(`order=${order}`);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should pass limit parameter to audit logs endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        async (limit) => {
          // Mock successful response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ logs: [] })
          });

          await analyticsAPI.fetchAuditLogs({ limit });

          // Verify fetch was called with limit parameter
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`limit=${limit}`),
            expect.any(Object)
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle optional filters gracefully (not include undefined parameters)', async () => {
    // Mock successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: [] })
    });

    await analyticsAPI.fetchAuditLogs({});

    // Verify fetch was called without any filter parameters
    const fetchCall = (global.fetch as any).mock.calls[0][0];
    expect(fetchCall).not.toContain('startDate=undefined');
    expect(fetchCall).not.toContain('endDate=undefined');
    expect(fetchCall).not.toContain('provider=undefined');
    expect(fetchCall).not.toContain('status=undefined');
  });

  it('should include authentication headers with all filter requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('datapro', 'verifydata'),
        async (provider) => {
          // Mock session token
          const mockToken = 'test-session-token';
          localStorage.setItem('__session', mockToken);
          
          // Mock successful response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ logs: [] })
          });

          await analyticsAPI.fetchAuditLogs({ provider });

          // Verify fetch was called with authentication headers
          const fetchOptions = (global.fetch as any).mock.calls[0][1];
          expect(fetchOptions.headers).toHaveProperty('Authorization', `Bearer ${mockToken}`);
          expect(fetchOptions.credentials).toBe('include');
          
          // Cleanup
          localStorage.removeItem('__session');
        }
      ),
      { numRuns: 5 }
    );
  });
});
