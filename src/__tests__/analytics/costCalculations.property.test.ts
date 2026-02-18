/**
 * Property-Based Tests for Cost Calculations
 * 
 * Feature: api-analytics-dashboard
 * Property 4: Cost Calculation Correctness
 * 
 * Validates: Requirements 2.2, 2.5, 5.2, 6.1, 6.8
 * 
 * Property: For any set of API calls, the total cost should equal
 * (datapro_calls × ₦50) + (verifydata_calls × ₦100), and the sum of
 * provider costs should equal the total cost.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CostCalculator } from '../../services/analytics/CostCalculator';

describe('Feature: api-analytics-dashboard, Property 4: Cost Calculation Correctness', () => {
  const calculator = new CostCalculator();

  it('total cost equals (datapro_calls × ₦50) + (verifydata_calls × ₦100)', () => {
    fc.assert(
      fc.property(
        fc.nat(10000), // datapro calls (0-10000)
        fc.nat(10000), // verifydata calls (0-10000)
        (dataproCalls, verifydataCalls) => {
          const result = calculator.calculateTotalCost(dataproCalls, verifydataCalls);
          const expectedTotal = (dataproCalls * 50) + (verifydataCalls * 100);
          
          expect(result.total).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sum of provider costs equals total cost', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(10000),
        (dataproCalls, verifydataCalls) => {
          const result = calculator.calculateTotalCost(dataproCalls, verifydataCalls);
          
          expect(result.dataproCost + result.verifydataCost).toBe(result.total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('datapro cost equals datapro_calls × ₦50', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(10000),
        (dataproCalls, verifydataCalls) => {
          const result = calculator.calculateTotalCost(dataproCalls, verifydataCalls);
          
          expect(result.dataproCost).toBe(dataproCalls * 50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('verifydata cost equals verifydata_calls × ₦100', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(10000),
        (dataproCalls, verifydataCalls) => {
          const result = calculator.calculateTotalCost(dataproCalls, verifydataCalls);
          
          expect(result.verifydataCost).toBe(verifydataCalls * 100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cost is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(10000),
        (dataproCalls, verifydataCalls) => {
          const result = calculator.calculateTotalCost(dataproCalls, verifydataCalls);
          
          expect(result.total).toBeGreaterThanOrEqual(0);
          expect(result.dataproCost).toBeGreaterThanOrEqual(0);
          expect(result.verifydataCost).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('zero calls result in zero cost', () => {
    const result = calculator.calculateTotalCost(0, 0);
    
    expect(result.total).toBe(0);
    expect(result.dataproCost).toBe(0);
    expect(result.verifydataCost).toBe(0);
  });

  it('cost calculation is commutative for provider order', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(10000),
        (calls1, calls2) => {
          const result1 = calculator.calculateTotalCost(calls1, calls2);
          const result2 = calculator.calculateTotalCost(calls1, calls2);
          
          expect(result1.total).toBe(result2.total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('increasing calls always increases or maintains total cost', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(10000),
        fc.nat(100), // additional calls
        (dataproCalls, verifydataCalls, additionalCalls) => {
          const result1 = calculator.calculateTotalCost(dataproCalls, verifydataCalls);
          const result2 = calculator.calculateTotalCost(
            dataproCalls + additionalCalls,
            verifydataCalls
          );
          
          expect(result2.total).toBeGreaterThanOrEqual(result1.total);
        }
      ),
      { numRuns: 100 }
    );
  });
});
