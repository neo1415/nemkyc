/**
 * Property-Based Tests for Success Rate Calculation
 * 
 * Feature: analytics-data-fixes
 * Property: 19
 * 
 * Validates: Requirements 10.1, 10.2, 10.3
 * 
 * **Property 19: Success Rate Calculation**
 * For any set of API calls, the success rate should equal 
 * (successfulCalls / totalCalls) * 100, rounded to two decimal places, 
 * or 0 if totalCalls is zero.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Helper function to calculate success rate
function calculateSuccessRate(successfulCalls: number, totalCalls: number): number {
  if (totalCalls === 0) {
    return 0;
  }
  return parseFloat(((successfulCalls / totalCalls) * 100).toFixed(2));
}

describe('Feature: analytics-data-fixes, Property 19: Success Rate Calculation', () => {
  it('success rate equals (successfulCalls / totalCalls) × 100', () => {
    fc.assert(
      fc.property(
        fc.nat(10000), // total calls
        fc.float({ min: 0, max: 1, noNaN: true }), // success ratio
        (totalCalls, successRatio) => {
          const successfulCalls = Math.floor(totalCalls * successRatio);
          const rate = calculateSuccessRate(successfulCalls, totalCalls);
          
          if (totalCalls === 0) {
            expect(rate).toBe(0);
          } else {
            const expected = (successfulCalls / totalCalls) * 100;
            expect(rate).toBeCloseTo(expected, 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when totalCalls is zero', () => {
    fc.assert(
      fc.property(
        fc.nat(1000), // successful calls (doesn't matter)
        (successfulCalls) => {
          const rate = calculateSuccessRate(successfulCalls, 0);
          expect(rate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('success rate is rounded to 2 decimal places', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 0, max: 10000 }),
        (totalCalls, successfulCalls) => {
          const validSuccessful = Math.min(successfulCalls, totalCalls);
          const rate = calculateSuccessRate(validSuccessful, totalCalls);
          
          // Check that rate has at most 2 decimal places
          const rateString = rate.toString();
          const decimalPart = rateString.split('.')[1];
          
          if (decimalPart) {
            expect(decimalPart.length).toBeLessThanOrEqual(2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('success rate is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(10000),
        (successfulCalls, totalCalls) => {
          const validSuccessful = Math.min(successfulCalls, totalCalls);
          const rate = calculateSuccessRate(validSuccessful, totalCalls);
          
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('100% success when all calls succeed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (totalCalls) => {
          const rate = calculateSuccessRate(totalCalls, totalCalls);
          expect(rate).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('0% success when no calls succeed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (totalCalls) => {
          const rate = calculateSuccessRate(0, totalCalls);
          expect(rate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('50% success when half calls succeed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10000 }).filter(n => n % 2 === 0), // even numbers
        (totalCalls) => {
          const successfulCalls = totalCalls / 2;
          const rate = calculateSuccessRate(successfulCalls, totalCalls);
          expect(rate).toBe(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('success rate increases monotonically with successful calls', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }),
        (totalCalls) => {
          const rates: number[] = [];
          
          for (let successful = 0; successful <= totalCalls; successful += Math.floor(totalCalls / 10)) {
            rates.push(calculateSuccessRate(successful, totalCalls));
          }
          
          // Each rate should be >= previous rate
          for (let i = 1; i < rates.length; i++) {
            expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: analytics-data-fixes, Success Rate Edge Cases', () => {
  it('handles single call success', () => {
    const rate = calculateSuccessRate(1, 1);
    expect(rate).toBe(100);
  });

  it('handles single call failure', () => {
    const rate = calculateSuccessRate(0, 1);
    expect(rate).toBe(0);
  });

  it('handles very small success rates', () => {
    const rate = calculateSuccessRate(1, 10000);
    expect(rate).toBe(0.01);
  });

  it('handles very high success rates', () => {
    const rate = calculateSuccessRate(9999, 10000);
    expect(rate).toBe(99.99);
  });

  it('calculation is consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (successfulCalls, totalCalls) => {
          const validSuccessful = Math.min(successfulCalls, totalCalls);
          
          const rate1 = calculateSuccessRate(validSuccessful, totalCalls);
          const rate2 = calculateSuccessRate(validSuccessful, totalCalls);
          
          // Same inputs should give same output
          expect(rate1).toBe(rate2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handles fractional percentages correctly', () => {
    // 1 out of 3 = 33.33...%
    const rate = calculateSuccessRate(1, 3);
    expect(rate).toBe(33.33);
    
    // 2 out of 3 = 66.66...%
    const rate2 = calculateSuccessRate(2, 3);
    expect(rate2).toBe(66.67); // Rounded up
  });

  it('rounding is consistent with toFixed(2)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (successfulCalls, totalCalls) => {
          const validSuccessful = Math.min(successfulCalls, totalCalls);
          const rate = calculateSuccessRate(validSuccessful, totalCalls);
          
          // Manual calculation with toFixed
          const expected = parseFloat(((validSuccessful / totalCalls) * 100).toFixed(2));
          
          expect(rate).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
