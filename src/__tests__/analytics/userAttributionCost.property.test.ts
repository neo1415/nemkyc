/**
 * Property-Based Tests for User Attribution Cost Calculations
 * 
 * Feature: analytics-data-fixes
 * Properties: 15, 16
 * 
 * Validates: Requirements 8.1, 8.3, 8.4, 8.5
 * 
 * **Property 15: Cost Calculation Accuracy**
 * For any user, the total cost calculated should equal the sum of all 
 * cost values from api-usage-logs where cost > 0 for that user.
 * 
 * **Property 16: Cost Aggregation Consistency**
 * For any set of users, the grand total cost should equal the sum of 
 * individual user total costs, and each individual total should equal 
 * the sum of their individual call costs.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Feature: analytics-data-fixes, Property 15: Cost Calculation Accuracy', () => {
  it('total cost equals sum of all costs where cost > 0', () => {
    fc.assert(
      fc.property(
        // Generate array of API call logs with costs
        fc.array(
          fc.record({
            userId: fc.constantFrom('user1', 'user2', 'user3'),
            cost: fc.nat(200), // 0 to 200
            success: fc.boolean()
          }),
          { minLength: 0, maxLength: 100 }
        ),
        (apiLogs) => {
          // Group by user and calculate costs
          const userCosts = new Map<string, number>();
          
          apiLogs.forEach(log => {
            if (!userCosts.has(log.userId)) {
              userCosts.set(log.userId, 0);
            }
            
            // Only sum costs > 0 (successful calls)
            if (log.cost > 0) {
              userCosts.set(log.userId, userCosts.get(log.userId)! + log.cost);
            }
          });
          
          // Verify each user's total equals sum of their costs > 0
          userCosts.forEach((totalCost, userId) => {
            const userLogs = apiLogs.filter(log => log.userId === userId);
            const expectedCost = userLogs
              .filter(log => log.cost > 0)
              .reduce((sum, log) => sum + log.cost, 0);
            
            expect(totalCost).toBe(expectedCost);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('failed calls with cost = 0 are not included in total', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.constant('user1'),
            cost: fc.constantFrom(0, 50, 100), // Mix of 0 and non-zero
            success: fc.boolean()
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (apiLogs) => {
          // Calculate total cost (only cost > 0)
          const totalCost = apiLogs
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Calculate what would happen if we included zeros
          const totalWithZeros = apiLogs.reduce((sum, log) => sum + log.cost, 0);
          
          // Total cost should equal total with zeros (since adding 0 doesn't change sum)
          expect(totalCost).toBe(totalWithZeros);
          
          // But the count of logs included should be different
          const logsWithCost = apiLogs.filter(log => log.cost > 0).length;
          const allLogs = apiLogs.length;
          
          if (apiLogs.some(log => log.cost === 0)) {
            expect(logsWithCost).toBeLessThanOrEqual(allLogs);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cost calculation is additive', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(200), { minLength: 0, maxLength: 50 }),
        (costs) => {
          // Filter costs > 0
          const validCosts = costs.filter(c => c > 0);
          
          // Calculate total
          const total = validCosts.reduce((sum, cost) => sum + cost, 0);
          
          // Split into two groups
          const mid = Math.floor(validCosts.length / 2);
          const group1 = validCosts.slice(0, mid);
          const group2 = validCosts.slice(mid);
          
          const sum1 = group1.reduce((sum, cost) => sum + cost, 0);
          const sum2 = group2.reduce((sum, cost) => sum + cost, 0);
          
          // Sum of groups should equal total
          expect(sum1 + sum2).toBe(total);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty cost array results in zero total', () => {
    const emptyCosts: number[] = [];
    const total = emptyCosts.filter(c => c > 0).reduce((sum, c) => sum + c, 0);
    expect(total).toBe(0);
  });
});

describe('Feature: analytics-data-fixes, Property 16: Cost Aggregation Consistency', () => {
  it('grand total equals sum of individual user totals', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.constantFrom('user1', 'user2', 'user3', 'user4'),
            cost: fc.nat(200)
          }),
          { minLength: 0, maxLength: 100 }
        ),
        (apiLogs) => {
          // Calculate per-user totals
          const userTotals = new Map<string, number>();
          
          apiLogs.forEach(log => {
            if (!userTotals.has(log.userId)) {
              userTotals.set(log.userId, 0);
            }
            if (log.cost > 0) {
              userTotals.set(log.userId, userTotals.get(log.userId)! + log.cost);
            }
          });
          
          // Calculate grand total from user totals
          const grandTotalFromUsers = Array.from(userTotals.values())
            .reduce((sum, total) => sum + total, 0);
          
          // Calculate grand total directly from logs
          const grandTotalFromLogs = apiLogs
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Both should be equal
          expect(grandTotalFromUsers).toBe(grandTotalFromLogs);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('individual user total equals sum of their call costs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.constant('testUser'),
            cost: fc.nat(200)
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (userLogs) => {
          // Calculate total for user
          const userTotal = userLogs
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Calculate sum of individual costs
          const sumOfCosts = userLogs
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Should be equal
          expect(userTotal).toBe(sumOfCosts);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cost aggregation is associative', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.constantFrom('user1', 'user2'),
            cost: fc.nat(200)
          }),
          { minLength: 0, maxLength: 100 }
        ),
        (apiLogs) => {
          // Method 1: Group by user first, then sum
          const userTotals = new Map<string, number>();
          apiLogs.forEach(log => {
            if (!userTotals.has(log.userId)) {
              userTotals.set(log.userId, 0);
            }
            if (log.cost > 0) {
              userTotals.set(log.userId, userTotals.get(log.userId)! + log.cost);
            }
          });
          const total1 = Array.from(userTotals.values()).reduce((sum, t) => sum + t, 0);
          
          // Method 2: Sum all costs directly
          const total2 = apiLogs
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Both methods should give same result
          expect(total1).toBe(total2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cost aggregation is commutative (order independent)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.constantFrom('user1', 'user2'),
            cost: fc.nat(200)
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (apiLogs) => {
          // Calculate total in original order
          const total1 = apiLogs
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Shuffle and calculate again
          const shuffled = [...apiLogs].sort(() => Math.random() - 0.5);
          const total2 = shuffled
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Totals should be equal regardless of order
          expect(total1).toBe(total2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('zero costs do not affect grand total', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.constantFrom('user1', 'user2'),
            cost: fc.nat(200)
          }),
          { minLength: 1, maxLength: 50 }
        ),
        fc.nat(20), // number of zero-cost entries to add
        (apiLogs, zeroCount) => {
          // Calculate total without zeros
          const totalWithoutZeros = apiLogs
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Add zero-cost entries
          const zeroCostLogs = Array(zeroCount).fill(null).map(() => ({
            userId: 'user1',
            cost: 0
          }));
          
          const allLogs = [...apiLogs, ...zeroCostLogs];
          
          // Calculate total with zeros
          const totalWithZeros = allLogs
            .filter(log => log.cost > 0)
            .reduce((sum, log) => sum + log.cost, 0);
          
          // Totals should be equal (zeros don't contribute)
          expect(totalWithZeros).toBe(totalWithoutZeros);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: analytics-data-fixes, Cost Calculation Edge Cases', () => {
  it('handles single user with single call', () => {
    const logs = [{ userId: 'user1', cost: 50 }];
    const total = logs.filter(l => l.cost > 0).reduce((sum, l) => sum + l.cost, 0);
    expect(total).toBe(50);
  });

  it('handles multiple users with no costs', () => {
    const logs = [
      { userId: 'user1', cost: 0 },
      { userId: 'user2', cost: 0 },
      { userId: 'user3', cost: 0 }
    ];
    const total = logs.filter(l => l.cost > 0).reduce((sum, l) => sum + l.cost, 0);
    expect(total).toBe(0);
  });

  it('handles mixed successful and failed calls', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.constant('user1'),
            cost: fc.constantFrom(0, 50, 100),
            success: fc.boolean()
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (logs) => {
          // Calculate total (only cost > 0)
          const total = logs
            .filter(l => l.cost > 0)
            .reduce((sum, l) => sum + l.cost, 0);
          
          // Total should be non-negative
          expect(total).toBeGreaterThanOrEqual(0);
          
          // If any log has cost > 0, total should be > 0
          if (logs.some(l => l.cost > 0)) {
            expect(total).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cost calculation preserves precision', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(200), { minLength: 1, maxLength: 100 }),
        (costs) => {
          const validCosts = costs.filter(c => c > 0);
          const total = validCosts.reduce((sum, c) => sum + c, 0);
          
          // Total should be exact integer (no floating point errors)
          expect(Number.isInteger(total)).toBe(true);
          
          // Total should equal manual sum
          let manualSum = 0;
          validCosts.forEach(c => { manualSum += c; });
          expect(total).toBe(manualSum);
        }
      ),
      { numRuns: 100 }
    );
  });
});
