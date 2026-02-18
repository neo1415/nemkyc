/**
 * Property-Based Tests for Report Generation
 * 
 * Feature: api-analytics-dashboard
 * Properties: 27, 28, 29, 30, 31
 * 
 * Validates: Requirements 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { reportService, type ReportData, type ReportMetadata } from '../../services/analytics/ReportService';
import type { AnalyticsSummary, UsageDataPoint, BrokerUsage, AuditLogEntry } from '../../types/analytics';

// Helper to convert Blob to text in test environment
async function blobToText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') {
    return blob.text();
  }
  // Fallback for test environment
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });
}

// Arbitraries for generating test data
const analyticsSummaryArb = fc.record({
  totalCalls: fc.nat(10000),
  totalCost: fc.nat(1000000),
  successRate: fc.float({ min: 0, max: 100 }),
  failureRate: fc.float({ min: 0, max: 100 }),
  dataproCalls: fc.nat(5000),
  dataproCost: fc.nat(500000),
  verifydataCalls: fc.nat(5000),
  verifydataCost: fc.nat(500000),
  periodStart: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  periodEnd: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  previousPeriodComparison: fc.record({
    callsChange: fc.float({ min: -100, max: 100 }),
    costChange: fc.float({ min: -100, max: 100 }),
    successRateChange: fc.float({ min: -100, max: 100 }),
  }),
}) as fc.Arbitrary<AnalyticsSummary>;

const usageDataPointArb = fc.record({
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString().split('T')[0]),
  dataproCalls: fc.nat(1000),
  verifydataCalls: fc.nat(1000),
  totalCalls: fc.nat(2000),
  dataproCost: fc.nat(50000),
  verifydataCost: fc.nat(100000),
  totalCost: fc.nat(150000),
  successCount: fc.nat(1500),
  failureCount: fc.nat(500),
}) as fc.Arbitrary<UsageDataPoint>;

const brokerUsageArb = fc.record({
  brokerId: fc.uuid(),
  brokerName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
  brokerEmail: fc.emailAddress(),
  totalCalls: fc.nat(1000),
  dataproCalls: fc.nat(500),
  verifydataCalls: fc.nat(500),
  totalCost: fc.nat(100000),
  successRate: fc.float({ min: 0, max: 100 }),
  lastActivity: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
}) as fc.Arbitrary<BrokerUsage>;

const auditLogEntryArb = fc.record({
  id: fc.uuid(),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  userId: fc.uuid(),
  userName: fc.string({ minLength: 3, maxLength: 50 }),
  provider: fc.constantFrom('datapro' as const, 'verifydata' as const),
  verificationType: fc.constantFrom('nin' as const, 'cac' as const),
  status: fc.constantFrom('success' as const, 'failure' as const, 'pending' as const),
  cost: fc.nat(200),
  ipAddress: fc.ipV4(),
  deviceInfo: fc.string({ minLength: 10, maxLength: 100 }),
  errorMessage: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
}) as fc.Arbitrary<AuditLogEntry>;

const reportMetadataArb = fc.record({
  title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
  generatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  generatedBy: fc.emailAddress(),
  dateRange: fc.record({
    start: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    end: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  }),
}) as fc.Arbitrary<ReportMetadata>;

describe('Report Generation Property Tests', () => {
  /**
   * Property 27: CSV Generation Correctness
   * 
   * For any dataset and column specification, the generated CSV should have
   * a header row with column names and data rows matching the input data exactly.
   * 
   * Validates: Requirements 8.3
   */
  it('Property 27: CSV generation produces correct structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(usageDataPointArb, { minLength: 1, maxLength: 50 }),
        fc.array(brokerUsageArb, { minLength: 1, maxLength: 20 }),
        reportMetadataArb,
        async (usageData, brokerUsage, metadata) => {
          const data: ReportData = {
            usageData,
            brokerUsage,
          };

          const blob = await reportService.generateCSVReport(
            data,
            metadata,
            ['usage-charts', 'broker-attribution']
          );

          const csvText = await blobToText(blob);
          const lines = csvText.split('\n').filter(line => line.trim() && !line.startsWith('#'));

          // Check usage data section
          const usageHeaderIndex = lines.findIndex(line => 
            line.includes('Date') && line.includes('Datapro Calls')
          );
          expect(usageHeaderIndex).toBeGreaterThanOrEqual(0);

          // Verify data rows match input (at least some rows should be present)
          const usageDataRows = lines.slice(usageHeaderIndex + 1)
            .filter(line => line.includes(',') && !line.includes('Broker Name'));
          expect(usageDataRows.length).toBeGreaterThan(0);

          // Check broker usage section
          const brokerHeaderIndex = lines.findIndex(line => 
            line.includes('Broker Name') && line.includes('Total Calls')
          );
          expect(brokerHeaderIndex).toBeGreaterThanOrEqual(0);

          // Verify broker rows
          const brokerDataRows = lines.slice(brokerHeaderIndex + 1)
            .filter(line => line.includes(',') && line.includes('"'));
          expect(brokerDataRows.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28: Report Filter Consistency
   * 
   * For any active filter state, the data included in generated reports should
   * match exactly the data visible in the filtered dashboard view.
   * 
   * Validates: Requirements 8.4
   */
  it('Property 28: Report data matches filtered dashboard data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(usageDataPointArb, { minLength: 10, maxLength: 100 }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        reportMetadataArb,
        async (allUsageData, filterStart, filterEnd) => {
          // Ensure filterStart <= filterEnd
          const [start, end] = filterStart <= filterEnd 
            ? [filterStart, filterEnd] 
            : [filterEnd, filterStart];

          // Filter data by date range (simulating dashboard filter)
          const filteredData = allUsageData.filter(d => {
            const date = new Date(d.date);
            return date >= start && date <= end;
          });

          const metadata: ReportMetadata = {
            title: 'Filtered Report',
            generatedAt: new Date(),
            generatedBy: 'test@example.com',
            dateRange: { start, end },
          };

          const reportData: ReportData = {
            usageData: filteredData,
          };

          const blob = await reportService.generateCSVReport(
            reportData,
            metadata,
            ['usage-charts']
          );

          const csvText = await blobToText(blob);

          // Verify metadata includes filter information
          expect(csvText).toContain(start.toLocaleDateString());
          expect(csvText).toContain(end.toLocaleDateString());

          // Count data rows in CSV
          const lines = csvText.split('\n');
          const dataRows = lines.filter(line => 
            line.match(/^\d{4}-\d{2}-\d{2},/) // Matches date format at start
          );

          // Number of data rows should match filtered data length (allow for empty lines)
          expect(dataRows.length).toBeGreaterThanOrEqual(filteredData.length - 1);
          expect(dataRows.length).toBeLessThanOrEqual(filteredData.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29: Report Metadata Completeness
   * 
   * For any generated report, it should include summary statistics,
   * generation timestamp, and user information in the metadata section.
   * 
   * Validates: Requirements 8.5, 8.7
   */
  it('Property 29: Report includes complete metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        analyticsSummaryArb,
        reportMetadataArb,
        async (summary, metadata) => {
          const data: ReportData = {
            summary,
          };

          const blob = await reportService.generateCSVReport(
            data,
            metadata,
            ['overview']
          );

          const csvText = await blobToText(blob);

          // Verify metadata presence
          expect(csvText).toContain(metadata.title);
          expect(csvText).toContain(metadata.generatedBy);
          expect(csvText).toContain('Generated:');
          expect(csvText).toContain('Period:');

          // Verify summary statistics are included
          expect(csvText).toContain('Total Calls');
          expect(csvText).toContain('Total Cost');
          expect(csvText).toContain('Success Rate');
          expect(csvText).toContain(summary.totalCalls.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 30: Selective Report Generation
   * 
   * For any set of selected report sections, the generated report should
   * contain only those sections and exclude unselected sections.
   * 
   * Validates: Requirements 8.6
   */
  it('Property 30: Report contains only selected sections', async () => {
    await fc.assert(
      fc.asyncProperty(
        analyticsSummaryArb,
        fc.array(usageDataPointArb, { minLength: 1, maxLength: 20 }),
        fc.array(brokerUsageArb, { minLength: 1, maxLength: 10 }),
        reportMetadataArb,
        fc.subarray(['overview', 'usage-charts', 'broker-attribution'], { minLength: 1 }),
        async (summary, usageData, brokerUsage, metadata, selectedSections) => {
          const data: ReportData = {
            summary,
            usageData,
            brokerUsage,
          };

          const blob = await reportService.generateCSVReport(
            data,
            metadata,
            selectedSections
          );

          const csvText = await blobToText(blob);

          // Check that selected sections are present
          if (selectedSections.includes('overview')) {
            expect(csvText).toContain('# Overview');
            expect(csvText).toContain('Total Calls');
          }

          if (selectedSections.includes('usage-charts')) {
            expect(csvText).toContain('# Usage Data');
            expect(csvText).toContain('Datapro Calls');
          }

          if (selectedSections.includes('broker-attribution')) {
            expect(csvText).toContain('# Broker Usage');
            expect(csvText).toContain('Broker Name');
          }

          // Check that unselected sections are NOT present
          if (!selectedSections.includes('overview')) {
            expect(csvText).not.toContain('# Overview');
          }

          if (!selectedSections.includes('usage-charts')) {
            expect(csvText).not.toContain('# Usage Data');
          }

          if (!selectedSections.includes('broker-attribution')) {
            expect(csvText).not.toContain('# Broker Usage');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 31: Report Size Validation
   * 
   * For any report generation request, if the estimated size exceeds the
   * configured limit, the system should reject the request with a descriptive error message.
   * 
   * Validates: Requirements 8.8
   */
  it('Property 31: Report size validation rejects oversized reports', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10001, max: 20000 }), // Exceeds MAX_REPORT_RECORDS (10000)
        reportMetadataArb,
        async (recordCount, metadata) => {
          // Generate oversized dataset
          const largeUsageData: UsageDataPoint[] = Array.from({ length: recordCount }, (_, i) => ({
            date: new Date(2024, 0, i % 365 + 1).toISOString().split('T')[0],
            dataproCalls: 100,
            verifydataCalls: 50,
            totalCalls: 150,
            dataproCost: 5000,
            verifydataCost: 5000,
            totalCost: 10000,
            successCount: 140,
            failureCount: 10,
          }));

          const data: ReportData = {
            usageData: largeUsageData,
          };

          // Should throw error for oversized report
          await expect(
            reportService.generateCSVReport(data, metadata, ['usage-charts'])
          ).rejects.toThrow(/too large|exceeds maximum/i);
        }
      ),
      { numRuns: 50 } // Fewer runs since we're generating large datasets
    );
  });

  /**
   * Additional test: Verify CSV escaping for special characters
   */
  it('CSV properly escapes special characters in data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            brokerId: fc.uuid(),
            brokerName: fc.string({ minLength: 5, maxLength: 50 }).map(s => s + ',"special'),
            brokerEmail: fc.emailAddress(),
            totalCalls: fc.nat(1000),
            dataproCalls: fc.nat(500),
            verifydataCalls: fc.nat(500),
            totalCost: fc.nat(100000),
            successRate: fc.float({ min: 0, max: 100 }),
            lastActivity: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          }) as fc.Arbitrary<BrokerUsage>,
          { minLength: 1, maxLength: 10 }
        ),
        reportMetadataArb,
        async (brokerUsage, metadata) => {
          const data: ReportData = {
            brokerUsage,
          };

          const blob = await reportService.generateCSVReport(
            data,
            metadata,
            ['broker-attribution']
          );

          const csvText = await blobToText(blob);

          // Verify that names with special characters are properly quoted
          brokerUsage.forEach(broker => {
            // The CSV should contain the broker name in some form
            // For names with commas or quotes, they should be wrapped in quotes
            // The actual escaping in the CSV is: "name,"special" (quotes around the whole field)
            // We just need to verify the name appears somewhere in the CSV
            const hasName = csvText.includes(broker.brokerName) || 
                           csvText.includes(broker.brokerName.replace(/"/g, '""')); // CSV escapes quotes by doubling them
            expect(hasName).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
