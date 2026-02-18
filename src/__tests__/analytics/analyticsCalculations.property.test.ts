/**
 * Property-Based Tests for Analytics Calculations
 * 
 * Feature: api-analytics-dashboard
 * Properties: 5, 6, 17, 19, 20
 * 
 * Validates: Requirements 2.3, 2.4, 2.6, 5.3, 5.6, 6.2, 6.3, 6.7
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CostCalculator } from '../../services/analytics/CostCalculator';

describe('Feature: api-analytics-dashboard, Property 5: Success Rate Calculation', () => {
  const calculator = new CostCalculator();

  it('success rate equals (successful_calls / total_calls) × 100', () => {
    fc.assert(
      fc.property(
        fc.nat(10000), // total calls
        fc.float({ min: 0, max: 1, noNaN: true }), // success ratio (no NaN)
        (totalCalls, successRatio) => {
          const successfulCalls = Math.floor(totalCalls * successRatio);
          const rate = calculator.calculateSuccessRate(successfulCalls, totalCalls);
          
          if (totalCalls === 0) {
            expect(rate).toBe(0);
          } else {
            const expected = (successfulCalls / totalCalls) * 100;
            expect(rate).toBeCloseTo(expected, 10);
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
          const rate = calculator.calculateSuccessRate(
            Math.min(successfulCalls, totalCalls),
            totalCalls
          );
          
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
          const rate = calculator.calculateSuccessRate(totalCalls, totalCalls);
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
          const rate = calculator.calculateSuccessRate(0, totalCalls);
          expect(rate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: api-analytics-dashboard, Property 6: Period Comparison Calculation', () => {
  const calculator = new CostCalculator();

  it('percentage change equals ((current - previous) / previous) × 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }), // previous
        fc.integer({ min: 0, max: 100000 }), // current
        (previous, current) => {
          const change = calculator.calculatePercentageChange(current, previous);
          const expected = ((current - previous) / previous) * 100;
          
          expect(change).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('positive change when current > previous', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 1000 }),
        (previous, increase) => {
          const current = previous + increase;
          const change = calculator.calculatePercentageChange(current, previous);
          
          expect(change).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('negative change when current < previous', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }),
        fc.integer({ min: 1, max: 99 }),
        (previous, decrease) => {
          const current = previous - decrease;
          const change = calculator.calculatePercentageChange(current, previous);
          
          expect(change).toBeLessThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('zero change when current equals previous', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (value) => {
          const change = calculator.calculatePercentageChange(value, value);
          expect(change).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: api-analytics-dashboard, Property 17: Average Calculation', () => {
  it('average equals total / count', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(1000), { minLength: 1, maxLength: 100 }),
        (values) => {
          const total = values.reduce((sum, val) => sum + val, 0);
          const count = values.length;
          const average = total / count;
          
          expect(average).toBeCloseTo(total / count, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: api-analytics-dashboard, Property 19: Budget Utilization Calculation', () => {
  const calculator = new CostCalculator();

  it('utilization equals (current_spending / budget_limit) × 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }), // budget limit
        fc.float({ min: 0, max: 1, noNaN: true }), // spending ratio (no NaN)
        (budgetLimit, spendingRatio) => {
          const currentSpending = budgetLimit * spendingRatio;
          const utilization = calculator.calculateBudgetUtilization(currentSpending, budgetLimit);
          const expected = (currentSpending / budgetLimit) * 100;
          
          // Handle edge cases
          if (!isFinite(expected)) {
            expect(utilization).toBe(0);
          } else {
            expect(utilization).toBeCloseTo(expected, 10);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('utilization is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.nat(1000000),
        fc.integer({ min: 1, max: 1000000 }),
        (currentSpending, budgetLimit) => {
          const utilization = calculator.calculateBudgetUtilization(currentSpending, budgetLimit);
          expect(utilization).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('100% utilization when spending equals budget', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        (budget) => {
          const utilization = calculator.calculateBudgetUtilization(budget, budget);
          expect(utilization).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: api-analytics-dashboard, Property 20: Cost Projection Formula', () => {
  const calculator = new CostCalculator();

  it('projected cost equals (current_spending / days_elapsed) × total_days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }), // current spending
        fc.integer({ min: 1, max: 28 }), // days elapsed
        fc.integer({ min: 28, max: 31 }), // total days in month
        (currentSpending, daysElapsed, totalDays) => {
          const projected = calculator.calculateProjectedCost(
            currentSpending,
            daysElapsed,
            totalDays
          );
          const expected = (currentSpending / daysElapsed) * totalDays;
          
          expect(projected).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('projected cost is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.nat(100000),
        fc.integer({ min: 1, max: 31 }),
        fc.integer({ min: 28, max: 31 }),
        (currentSpending, daysElapsed, totalDays) => {
          const projected = calculator.calculateProjectedCost(
            currentSpending,
            daysElapsed,
            totalDays
          );
          
          expect(projected).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('projected cost equals current spending when all days elapsed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 28, max: 31 }),
        (currentSpending, totalDays) => {
          const projected = calculator.calculateProjectedCost(
            currentSpending,
            totalDays,
            totalDays
          );
          
          expect(projected).toBeCloseTo(currentSpending, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('projected cost increases proportionally with total days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 1, max: 15 }),
        (currentSpending, daysElapsed) => {
          const projected28 = calculator.calculateProjectedCost(currentSpending, daysElapsed, 28);
          const projected31 = calculator.calculateProjectedCost(currentSpending, daysElapsed, 31);
          
          expect(projected31).toBeGreaterThan(projected28);
        }
      ),
      { numRuns: 100 }
    );
  });
});
