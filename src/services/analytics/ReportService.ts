/**
 * Report Service
 * 
 * Generates reports in multiple formats (PDF, Excel, CSV)
 * for the Analytics Dashboard.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.8
 */

import type {
  AnalyticsSummary,
  UsageDataPoint,
  BrokerUsage,
  AuditLogEntry,
} from '../../types/analytics';
import { brandingService } from './BrandingService';
import { pdfGenerator } from './PDFGenerator';
import { excelGenerator } from './ExcelGenerator';
import { csvGenerator } from './CSVGenerator';
import { dataFetcher } from './DataFetcher';

// Maximum report size limits
const MAX_REPORT_RECORDS = 10000;
const MAX_REPORT_SIZE_MB = 50;

export interface ReportData {
  summary?: AnalyticsSummary;
  usageData?: UsageDataPoint[];
  brokerUsage?: BrokerUsage[];
  auditLogs?: AuditLogEntry[];
}

export interface ReportMetadata {
  title: string;
  generatedAt: Date;
  generatedBy: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: {
    provider?: string;
    status?: string;
  };
}

export interface ReportMetadata {
  title: string;
  generatedAt: Date;
  generatedBy: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: {
    provider?: string;
    status?: string;
  };
  reportId?: string;
}

export type ProgressCallback = (status: string, progress: number) => void;

export class ReportService {
  /**
   * Generates unique report ID
   * 
   * Requirements: 9.6
   */
  generateReportId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `RPT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Fetches complete report data with pagination
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   */
  async fetchCompleteReportData(
    dateRange: { start: Date; end: Date },
    sections: string[],
    onProgress?: ProgressCallback
  ): Promise<ReportData> {
    const data: ReportData = {};

    try {
      // Fetch audit logs if needed
      if (sections.includes('audit-logs')) {
        onProgress?.('Fetching audit logs...', 25);
        data.auditLogs = await dataFetcher.fetchAllAuditLogs(
          dateRange.start,
          dateRange.end,
          {
            onProgress: (status, fetched, total) => {
              const progress = total ? Math.round((fetched / total) * 100) : 0;
              onProgress?.(`${status} (${fetched}${total ? `/${total}` : ''})`, 25 + (progress * 0.25));
            }
          }
        );
      }

      // Fetch broker attribution if needed
      if (sections.includes('broker-attribution')) {
        onProgress?.('Fetching broker attribution...', 50);
        data.brokerUsage = await dataFetcher.fetchAllBrokerAttribution(
          dateRange.start,
          dateRange.end,
          {
            onProgress: (status, fetched, total) => {
              const progress = total ? Math.round((fetched / total) * 100) : 0;
              onProgress?.(`${status} (${fetched}${total ? `/${total}` : ''})`, 50 + (progress * 0.25));
            }
          }
        );
      }

      // Note: summary and usageData are typically already available from the dashboard
      // and don't require pagination, so they can be passed in directly

      onProgress?.('Data fetching complete', 100);
      return data;
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw new Error(`Failed to fetch complete report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a PDF report with charts and tables
   * 
   * Requirements: 8.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10
   */
  async generatePDFReport(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    this.validateReportSize(data);

    try {
      onProgress?.('Loading branding assets...', 10);
      const branding = await brandingService.getBranding();

      onProgress?.('Generating PDF...', 30);
      const blob = await pdfGenerator.generate(
        data,
        metadata,
        sections,
        {
          branding,
          includeTableOfContents: sections.length > 1,
          includeCharts: false, // Charts not yet implemented
          mode: 'structured',
        }
      );

      onProgress?.('PDF generation complete', 100);
      return blob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a visual PDF report by capturing the dashboard appearance
   * This creates a pixel-perfect PDF of what's visible on screen
   * 
   * Requirements: 8.1, 2.1, 2.2, 2.8, 2.9
   */
  async generateVisualPDFReport(
    dashboardElement: HTMLElement,
    metadata: ReportMetadata,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    try {
      onProgress?.('Loading branding assets...', 10);
      const branding = await brandingService.getBranding();

      onProgress?.('Capturing dashboard...', 30);
      onProgress?.('Generating visual PDF...', 50);
      
      const blob = await pdfGenerator.generateVisualPDF(
        dashboardElement,
        metadata,
        {
          branding,
          includeTableOfContents: false,
          includeCharts: true,
          mode: 'visual',
        }
      );

      onProgress?.('Visual PDF generation complete', 100);
      return blob;
    } catch (error) {
      console.error('Error generating visual PDF:', error);
      throw new Error(`Visual PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates an Excel report with multiple sheets
   * 
   * Requirements: 8.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11
   */
  async generateExcelReport(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    this.validateReportSize(data);

    try {
      onProgress?.('Loading branding assets...', 10);
      const branding = await brandingService.getBranding();

      onProgress?.('Generating Excel workbook...', 30);
      const blob = await excelGenerator.generate(
        data,
        metadata,
        sections,
        {
          branding,
          includeCharts: false, // Charts not yet implemented
        }
      );

      onProgress?.('Excel generation complete', 100);
      return blob;
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw new Error(`Excel generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a CSV report with raw data
   * 
   * Requirements: 8.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
   */
  async generateCSVReport(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    this.validateReportSize(data);

    try {
      onProgress?.('Loading branding assets...', 10);
      const branding = await brandingService.getBranding();

      onProgress?.('Generating CSV...', 30);
      const blob = csvGenerator.generate(data, metadata, sections, branding);

      onProgress?.('CSV generation complete', 100);
      return blob;
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw new Error(`CSV generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates report size to prevent memory issues
   * 
   * Requirements: 8.8
   */
  private validateReportSize(data: ReportData): void {
    let totalRecords = 0;

    if (data.usageData) totalRecords += data.usageData.length;
    if (data.brokerUsage) totalRecords += data.brokerUsage.length;
    if (data.auditLogs) totalRecords += data.auditLogs.length;

    if (totalRecords > MAX_REPORT_RECORDS) {
      throw new Error(
        `Report too large: ${totalRecords} records exceeds maximum of ${MAX_REPORT_RECORDS}. Please reduce date range or select fewer sections.`
      );
    }

    // Estimate size (rough calculation)
    const estimatedSizeMB = (totalRecords * 500) / (1024 * 1024); // Assume ~500 bytes per record
    if (estimatedSizeMB > MAX_REPORT_SIZE_MB) {
      throw new Error(
        `Report too large: estimated ${estimatedSizeMB.toFixed(1)}MB exceeds maximum of ${MAX_REPORT_SIZE_MB}MB. Please reduce date range or use CSV format.`
      );
    }
  }

  /**
   * Downloads a blob as a file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const reportService = new ReportService();
