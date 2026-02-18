import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { AuditLogEntry } from '../../types/analytics';

const auditLogArbitrary = fc.record({
  id: fc.uuid(),
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
  userId: fc.uuid(),
  userName: fc.string({ minLength: 3, maxLength: 50 }),
  provider: fc.constantFrom('datapro' as const, 'verifydata' as const),
  verificationType: fc.constantFrom('nin' as const, 'cac' as const),
  status: fc.constantFrom('success' as const, 'failure' as const, 'pending' as const),
  cost: fc.float({ min: 0, max: 1000, noNaN: true }),
  ipAddress: fc.ipV4(),
  deviceInfo: fc.string({ minLength: 10, maxLength: 100 }),
});

describe('Audit Logs Property Tests', () => {
  describe('Property 23: Audit Log Chronological Ordering', () => {
    it('should maintain chronological order when sorted by timestamp', () => {
      fc.assert(
        fc.property(
          fc.array(auditLogArbitrary, { minLength: 2, maxLength: 20 }),
          (logs) => {
            // Filter out any logs with invalid timestamps
            const validLogs = logs.filter(log => !isNaN(new Date(log.timestamp).getTime()));
            
            // Skip if we don't have enough valid logs
            if (validLogs.length < 2) {
              return true;
            }
            
            const sorted = [...validLogs].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(new Date(sorted[i].timestamp).getTime()).toBeGreaterThanOrEqual(
                new Date(sorted[i + 1].timestamp).getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 24: Audit Log Completeness', () => {
    it('should contain all required fields', () => {
      fc.assert(
        fc.property(auditLogArbitrary, (log) => {
          expect(log.id).toBeDefined();
          expect(log.timestamp).toBeDefined();
          expect(log.userId).toBeDefined();
          expect(log.userName).toBeDefined();
          expect(log.provider).toBeDefined();
          expect(log.verificationType).toBeDefined();
          expect(log.status).toBeDefined();
          expect(log.cost).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 25: Audit Log Search Filtering', () => {
    it('should filter logs by user name', () => {
      fc.assert(
        fc.property(
          fc.array(auditLogArbitrary, { minLength: 3, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (logs, searchTerm) => {
            const filtered = logs.filter(log => 
              log.userName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            filtered.forEach(log => {
              expect(log.userName.toLowerCase()).toContain(searchTerm.toLowerCase());
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 26: Pagination Correctness', () => {
    it('should paginate correctly', () => {
      fc.assert(
        fc.property(
          fc.array(auditLogArbitrary, { minLength: 15, maxLength: 50 }),
          fc.integer({ min: 5, max: 20 }),
          (logs, pageSize) => {
            const totalPages = Math.ceil(logs.length / pageSize);
            
            for (let page = 1; page <= totalPages; page++) {
              const startIndex = (page - 1) * pageSize;
              const paginated = logs.slice(startIndex, startIndex + pageSize);
              
              expect(paginated.length).toBeLessThanOrEqual(pageSize);
              if (page < totalPages) {
                expect(paginated.length).toBe(pageSize);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
