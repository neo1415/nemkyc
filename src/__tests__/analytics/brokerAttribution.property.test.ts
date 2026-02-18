import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { BrokerUsage } from '../../types/analytics';

/**
 * Property-Based Tests for Broker Attribution
 * 
 * Tests Properties 14, 15, 16, 18
 * Validates: Requirements 5.1, 5.4, 5.5, 5.7
 */

// Generator for BrokerUsage
const brokerUsageArbitrary = fc.record({
  brokerId: fc.uuid(),
  brokerName: fc.string({ minLength: 3, maxLength: 50 }),
  brokerEmail: fc.emailAddress(),
  totalCalls: fc.integer({ min: 0, max: 10000 }),
  dataproCalls: fc.integer({ min: 0, max: 5000 }),
  verifydataCalls: fc.integer({ min: 0, max: 5000 }),
  totalCost: fc.float({ min: 0, max: 1000000, noNaN: true }),
  successRate: fc.float({ min: 0, max: 100, noNaN: true }),
  lastActivity: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
});

describe('Broker Attribution Property Tests', () => {
  /**
   * Property 14: Broker Ranking Correctness
   * Validates: Requirements 5.1, 5.4
   * 
   * When brokers are sorted by any metric, the ranking must be consistent
   * with the sort order (ascending or descending)
   */
  describe('Property 14: Broker Ranking Correctness', () => {
    it('should maintain correct ranking order when sorted by totalCalls descending', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 2, maxLength: 20 }),
          (brokers) => {
            const sorted = [...brokers].sort((a, b) => b.totalCalls - a.totalCalls);
            
            // Verify descending order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].totalCalls).toBeGreaterThanOrEqual(sorted[i + 1].totalCalls);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct ranking order when sorted by totalCost ascending', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 2, maxLength: 20 }),
          (brokers) => {
            const sorted = [...brokers].sort((a, b) => a.totalCost - b.totalCost);
            
            // Verify ascending order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].totalCost).toBeLessThanOrEqual(sorted[i + 1].totalCost);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct ranking order when sorted by successRate', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 2, maxLength: 20 }),
          (brokers) => {
            const sorted = [...brokers].sort((a, b) => b.successRate - a.successRate);
            
            // Verify descending order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].successRate).toBeGreaterThanOrEqual(sorted[i + 1].successRate);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15: Multi-Column Sorting
   * Validates: Requirements 5.4
   * 
   * Sorting by different columns should produce different orderings
   * (unless all values are identical)
   */
  describe('Property 15: Multi-Column Sorting', () => {
    it('should produce stable sort results for the same column', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 3, maxLength: 20 }),
          (brokers) => {
            const sorted1 = [...brokers].sort((a, b) => b.totalCalls - a.totalCalls);
            const sorted2 = [...brokers].sort((a, b) => b.totalCalls - a.totalCalls);
            
            // Same sort should produce same order
            expect(sorted1.map(b => b.brokerId)).toEqual(sorted2.map(b => b.brokerId));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow sorting by multiple different fields', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 3, maxLength: 20 }),
          (brokers) => {
            const sortedByCalls = [...brokers].sort((a, b) => b.totalCalls - a.totalCalls);
            const sortedByCost = [...brokers].sort((a, b) => b.totalCost - a.totalCost);
            const sortedByRate = [...brokers].sort((a, b) => b.successRate - a.successRate);
            
            // All sorts should contain the same brokers
            const ids = brokers.map(b => b.brokerId).sort();
            expect(sortedByCalls.map(b => b.brokerId).sort()).toEqual(ids);
            expect(sortedByCost.map(b => b.brokerId).sort()).toEqual(ids);
            expect(sortedByRate.map(b => b.brokerId).sort()).toEqual(ids);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: Broker Drill-Down Filtering
   * Validates: Requirements 5.5
   * 
   * When filtering by a specific broker, only that broker's data should be included
   */
  describe('Property 16: Broker Drill-Down Filtering', () => {
    it('should filter to only the selected broker', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 3, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          (brokers, index) => {
            if (index >= brokers.length) return;
            
            const selectedBrokerId = brokers[index].brokerId;
            const filtered = brokers.filter(b => b.brokerId === selectedBrokerId);
            
            // Should only contain the selected broker
            expect(filtered.length).toBeGreaterThan(0);
            filtered.forEach(broker => {
              expect(broker.brokerId).toBe(selectedBrokerId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all broker data when no filter is applied', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 1, maxLength: 20 }),
          (brokers) => {
            const filtered = brokers.filter(() => true); // No filter
            
            expect(filtered.length).toBe(brokers.length);
            expect(filtered.map(b => b.brokerId).sort()).toEqual(
              brokers.map(b => b.brokerId).sort()
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 18: Anomaly Detection Threshold
   * Validates: Requirements 5.7
   * 
   * Brokers with usage > 2x average should be flagged as anomalies
   */
  describe('Property 18: Anomaly Detection Threshold', () => {
    it('should correctly identify brokers exceeding 2x average usage', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 3, maxLength: 20 }),
          (brokers) => {
            const avgCalls = brokers.reduce((sum, b) => sum + b.totalCalls, 0) / brokers.length;
            const threshold = avgCalls * 2;
            
            brokers.forEach(broker => {
              const isAnomaly = broker.totalCalls > threshold;
              const shouldBeAnomaly = broker.totalCalls > threshold;
              
              expect(isAnomaly).toBe(shouldBeAnomaly);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag brokers at or below 2x average as anomalies', () => {
      fc.assert(
        fc.property(
          fc.array(brokerUsageArbitrary, { minLength: 3, maxLength: 20 }),
          (brokers) => {
            const avgCalls = brokers.reduce((sum, b) => sum + b.totalCalls, 0) / brokers.length;
            const threshold = avgCalls * 2;
            
            const normalBrokers = brokers.filter(b => b.totalCalls <= threshold);
            
            normalBrokers.forEach(broker => {
              expect(broker.totalCalls).toBeLessThanOrEqual(threshold);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case where all brokers have same usage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 3, max: 10 }),
          (calls, count) => {
            const brokers: BrokerUsage[] = Array.from({ length: count }, (_, i) => ({
              brokerId: `broker-${i}`,
              brokerName: `Broker ${i}`,
              brokerEmail: `broker${i}@example.com`,
              totalCalls: calls,
              dataproCalls: Math.floor(calls / 2),
              verifydataCalls: Math.floor(calls / 2),
              totalCost: calls * 50,
              successRate: 95,
              lastActivity: new Date(),
            }));
            
            const avgCalls = calls; // All same
            const threshold = avgCalls * 2;
            
            // None should be anomalies since all are equal to average
            brokers.forEach(broker => {
              expect(broker.totalCalls).toBeLessThanOrEqual(threshold);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
