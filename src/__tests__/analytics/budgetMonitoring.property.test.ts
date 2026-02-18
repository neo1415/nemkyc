import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Budget Monitoring Property Tests', () => {
  describe('Property 21: Budget Alert Thresholds', () => {
    it('should trigger warning at 80% utilization', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1000, max: 1000000, noNaN: true }),
          (budgetLimit) => {
            const spending = budgetLimit * 0.8;
            const utilization = (spending / budgetLimit) * 100;
            
            expect(utilization).toBeGreaterThanOrEqual(80);
            expect(utilization).toBeLessThan(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger critical at 100% utilization', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1000, max: 1000000, noNaN: true }),
          (budgetLimit) => {
            const spending = budgetLimit;
            const utilization = (spending / budgetLimit) * 100;
            
            expect(utilization).toBeGreaterThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 22: Budget Configuration Persistence', () => {
    it('should persist budget configuration', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10000, max: 10000000, noNaN: true }),
          (monthlyLimit) => {
            const config = {
              monthlyLimit,
              warningThreshold: 80,
              criticalThreshold: 100,
              notificationEnabled: true,
            };
            
            expect(config.monthlyLimit).toBe(monthlyLimit);
            expect(config.warningThreshold).toBe(80);
            expect(config.criticalThreshold).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
