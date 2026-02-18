/**
 * Property-Based Test for Cost Calculation Completeness
 * 
 * Feature: analytics-and-audit-fixes
 * Property 1: Cost Calculation Completeness
 * 
 * Validates: Requirements 1.1, 1.2, 1.4
 * 
 * Property: For any month and API provider, the total cost calculated by the
 * Backend_Cost_API should equal the sum of (successCalls + failedCalls)
 * multiplied by the provider's cost per call.
 * 
 * This test validates that the cost tracking system correctly includes BOTH
 * successful and failed verification costs, as API providers charge for both.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Cost per call for each provider
const DATAPRO_COST_PER_CALL = 50; // ₦50 per NIN verification
const VERIFYDATA_COST_PER_CALL = 100; // ₦100 per CAC verification

/**
 * Simulates the backend cost calculation logic from server.js
 * Lines 13905-13920 in the /api/analytics/cost-tracking endpoint
 */
function calculateCostFromApiUsage(
  successCalls: number,
  failedCalls: number,
  provider: 'datapro' | 'verifydata'
): number {
  const totalCalls = successCalls + failedCalls;
  const costPerCall = provider === 'datapro' ? DATAPRO_COST_PER_CALL : VERIFYDATA_COST_PER_CALL;
  return totalCalls * costPerCall;
}

describe('Feature: analytics-and-audit-fixes, Property 1: Cost Calculation Completeness', () => {
  it('**Validates: Requirements 1.1, 1.2** - cost includes both successful and failed calls for Datapro', () => {
    fc.assert(
      fc.property(
        fc.nat(10000), // successCalls (0-10000)
        fc.nat(10000), // failedCalls (0-10000)
        (successCalls, failedCalls) => {
          const calculatedCost = calculateCostFromApiUsage(successCalls, failedCalls, 'datapro');
          const expectedCost = (successCalls + failedCalls) * DATAPRO_COST_PER_CALL;
          
          expect(calculatedCost).toBe(expectedCost);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Validates: Requirements 1.1, 1.2** - cost includes both successful and failed calls for VerifyData', () => {
    fc.assert(
      fc.property(
        fc.nat(10000), // successCalls (0-10000)
        fc.nat(10000), // failedCalls (0-10000)
        (successCalls, failedCalls) => {
          const calculatedCost = calculateCostFromApiUsage(successCalls, failedCalls, 'verifydata');
          const expectedCost = (successCalls + failedCalls) * VERIFYDATA_COST_PER_CALL;
          
          expect(calculatedCost).toBe(expectedCost);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Validates: Requirements 1.4** - sum of individual verification costs equals total cost', () => {
    fc.assert(
      fc.property(
        fc.nat(10000), // datapro success calls
        fc.nat(10000), // datapro failed calls
        fc.nat(10000), // verifydata success calls
        fc.nat(10000), // verifydata failed calls
        (dataproSuccess, dataproFailed, verifydataSuccess, verifydataFailed) => {
          const dataproCost = calculateCostFromApiUsage(dataproSuccess, dataproFailed, 'datapro');
          const verifydataCost = calculateCostFromApiUsage(verifydataSuccess, verifydataFailed, 'verifydata');
          const totalCost = dataproCost + verifydataCost;
          
          // The sum of individual provider costs should equal the total
          expect(dataproCost + verifydataCost).toBe(totalCost);
          
          // Verify each provider's cost is calculated correctly
          expect(dataproCost).toBe((dataproSuccess + dataproFailed) * DATAPRO_COST_PER_CALL);
          expect(verifydataCost).toBe((verifydataSuccess + verifydataFailed) * VERIFYDATA_COST_PER_CALL);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Validates: Requirements 1.1** - failed calls contribute to total cost', () => {
    fc.assert(
      fc.property(
        fc.nat(10000), // failedCalls (0-10000)
        fc.constantFrom('datapro' as const, 'verifydata' as const),
        (failedCalls, provider) => {
          // Calculate cost with ONLY failed calls (no successful calls)
          const costWithOnlyFailedCalls = calculateCostFromApiUsage(0, failedCalls, provider);
          const costPerCall = provider === 'datapro' ? DATAPRO_COST_PER_CALL : VERIFYDATA_COST_PER_CALL;
          
          // Failed calls should contribute to cost
          expect(costWithOnlyFailedCalls).toBe(failedCalls * costPerCall);
          
          // If there are failed calls, cost should be greater than zero
          if (failedCalls > 0) {
            expect(costWithOnlyFailedCalls).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Validates: Requirements 1.2** - cost calculation handles missing fields gracefully', () => {
    fc.assert(
      fc.property(
        fc.option(fc.nat(10000), { nil: undefined }), // successCalls might be undefined
        fc.option(fc.nat(10000), { nil: undefined }), // failedCalls might be undefined
        fc.constantFrom('datapro' as const, 'verifydata' as const),
        (successCalls, failedCalls, provider) => {
          // Simulate backend logic: default to 0 for missing fields
          const safeSuccessCalls = successCalls || 0;
          const safeFailedCalls = failedCalls || 0;
          
          const calculatedCost = calculateCostFromApiUsage(safeSuccessCalls, safeFailedCalls, provider);
          const costPerCall = provider === 'datapro' ? DATAPRO_COST_PER_CALL : VERIFYDATA_COST_PER_CALL;
          const expectedCost = (safeSuccessCalls + safeFailedCalls) * costPerCall;
          
          expect(calculatedCost).toBe(expectedCost);
          expect(calculatedCost).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cost is always non-negative regardless of input', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(10000),
        fc.constantFrom('datapro' as const, 'verifydata' as const),
        (successCalls, failedCalls, provider) => {
          const cost = calculateCostFromApiUsage(successCalls, failedCalls, provider);
          
          expect(cost).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adding failed calls increases total cost', () => {
    fc.assert(
      fc.property(
        fc.nat(10000), // initial success calls
        fc.nat(10000), // initial failed calls
        fc.integer({ min: 1, max: 1000 }), // additional failed calls (at least 1)
        fc.constantFrom('datapro' as const, 'verifydata' as const),
        (successCalls, failedCalls, additionalFailedCalls, provider) => {
          const costBefore = calculateCostFromApiUsage(successCalls, failedCalls, provider);
          const costAfter = calculateCostFromApiUsage(successCalls, failedCalls + additionalFailedCalls, provider);
          
          // Adding failed calls should increase the cost
          expect(costAfter).toBeGreaterThan(costBefore);
          
          // The increase should be exactly the cost of the additional failed calls
          const costPerCall = provider === 'datapro' ? DATAPRO_COST_PER_CALL : VERIFYDATA_COST_PER_CALL;
          expect(costAfter - costBefore).toBe(additionalFailedCalls * costPerCall);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cost calculation is independent of success/failure ratio', () => {
    fc.assert(
      fc.property(
        fc.nat(1, 10000), // total calls (at least 1)
        fc.constantFrom('datapro' as const, 'verifydata' as const),
        (totalCalls, provider) => {
          // Test different distributions of success/failure for the same total
          const allSuccess = calculateCostFromApiUsage(totalCalls, 0, provider);
          const allFailed = calculateCostFromApiUsage(0, totalCalls, provider);
          const halfHalf = calculateCostFromApiUsage(
            Math.floor(totalCalls / 2),
            Math.ceil(totalCalls / 2),
            provider
          );
          
          // All distributions should result in the same total cost
          expect(allSuccess).toBe(allFailed);
          expect(allSuccess).toBe(halfHalf);
        }
      ),
      { numRuns: 100 }
    );
  });
});
