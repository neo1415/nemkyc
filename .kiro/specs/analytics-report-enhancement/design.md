# Design Document: Analytics Report Enhancement

## Overview

This design enhances the API Analytics Report Generator to produce professional, comprehensive reports with NEM Insurance branding. The enhancement addresses three main areas:

1. **Complete Data Capture**: Fetch and include ALL dashboard data, handling pagination for audit logs and broker attribution
2. **Professional Branding**: Integrate NEM logo and color scheme across all report formats
3. **Enhanced Formatting**: Improve visual presentation with charts, proper spacing, and structured layouts

The design maintains the existing three-format approach (PDF, Excel, CSV) while significantly improving the quality and completeness of each format.

## Architecture

### Current Architecture

```
ReportGenerator (UI Component)
    ↓
ReportService (Report Generation)
    ↓
jsPDF / ExcelJS / CSV Generation
```

### Enhanced Architecture

```
ReportGenerator (UI Component)
    ↓
ReportService (Report Generation)
    ├─→ DataFetcher (New: Handles pagination)
    ├─→ BrandingService (New: Logo and colors)
    ├─→ PDFGenerator (Enhanced: Charts, TOC, branding)
    ├─→ ExcelGenerator (Enhanced: Multi-sheet, charts, formatting)
    └─→ CSVGenerator (Enhanced: Structure, metadata)
```

### Key Components

1. **DataFetcher**: New service to handle paginated data retrieval
2. **BrandingService**: New service to manage NEM branding assets
3. **Enhanced Generators**: Improved PDF, Excel, and CSV generation with formatting

## Components and Interfaces

### 1. DataFetcher Service

```typescript
interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  cursor?: string;
  offset?: number;
}

class DataFetcher {
  /**
   * Fetches all audit logs within date range, handling pagination
   */
  async fetchAllAuditLogs(
    startDate: string,
    endDate: string,
    maxRecords: number = 10000
  ): Promise<AuditLogEntry[]>

  /**
   * Fetches all broker attribution data, handling pagination
   */
  async fetchAllBrokerAttribution(
    startDate: string,
    endDate: string
  ): Promise<BrokerUsage[]>

  /**
   * Generic pagination handler with retry logic
   */
  private async fetchPaginated<T>(
    fetchFn: (cursor?: string, offset?: number) => Promise<PaginatedResponse<T>>,
    maxRecords: number
  ): Promise<T[]>
}
```

### 2. BrandingService

```typescript
interface NEMBranding {
  logo: {
    path: string;
    width: number;
    height: number;
    base64?: string;
  };
  colors: {
    primary: string;      // Burgundy #800020
    secondary: string;    // Gold #FFD700
    accent1: string;      // Brown #8B4513
    accent2: string;      // Golden #DAA520
    lightGold: string;    // Light Gold #FFF8DC
  };
  title: string;
}

class BrandingService {
  /**
   * Loads NEM logo from file system
   */
  async loadLogo(): Promise<string | null>

  /**
   * Gets NEM color palette
   */
  getColors(): NEMBranding['colors']

  /**
   * Gets formatted report title
   */
  getReportTitle(): string

  /**
   * Converts hex color to RGB for PDF
   */
  hexToRGB(hex: string): { r: number; g: number; b: number }
}
```

### 3. Enhanced PDFGenerator

```typescript
interface PDFGeneratorOptions {
  branding: NEMBranding;
  includeTableOfContents: boolean;
  includeCharts: boolean;
}

class PDFGenerator {
  /**
   * Generates complete PDF with branding and formatting
   */
  async generate(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    options: PDFGeneratorOptions
  ): Promise<Blob>

  /**
   * Adds branded header to page
   */
  private addPageHeader(doc: jsPDF, pageNumber: number): void

  /**
   * Adds branded footer to page
   */
  private addPageFooter(doc: jsPDF, pageNumber: number, totalPages: number): void

  /**
   * Generates table of contents
   */
  private generateTableOfContents(doc: jsPDF, sections: SectionInfo[]): void

  /**
   * Adds usage trend chart
   */
  private addUsageChart(doc: jsPDF, data: UsageDataPoint[], yPosition: number): number

  /**
   * Adds budget utilization gauge
   */
  private addBudgetGauge(doc: jsPDF, utilization: number, yPosition: number): number

  /**
   * Formats table with NEM colors
   */
  private formatTable(
    doc: jsPDF,
    headers: string[],
    rows: string[][],
    yPosition: number
  ): number
}
```

### 4. Enhanced ExcelGenerator

```typescript
interface ExcelGeneratorOptions {
  branding: NEMBranding;
  includeCharts: boolean;
}

class ExcelGenerator {
  /**
   * Generates complete Excel workbook with formatting
   */
  async generate(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    options: ExcelGeneratorOptions
  ): Promise<Blob>

  /**
   * Creates summary sheet with key metrics
   */
  private createSummarySheet(
    workbook: ExcelJS.Workbook,
    data: ReportData,
    metadata: ReportMetadata
  ): void

  /**
   * Formats sheet headers with NEM branding
   */
  private formatSheetHeader(
    sheet: ExcelJS.Worksheet,
    title: string,
    branding: NEMBranding
  ): void

  /**
   * Applies NEM color scheme to sheet
   */
  private applyBrandedFormatting(
    sheet: ExcelJS.Worksheet,
    branding: NEMBranding
  ): void

  /**
   * Adds usage trend chart to sheet
   */
  private addUsageChart(
    sheet: ExcelJS.Worksheet,
    data: UsageDataPoint[]
  ): void

  /**
   * Adds budget utilization chart to sheet
   */
  private addBudgetChart(
    sheet: ExcelJS.Worksheet,
    costData: CostTrackingData
  ): void

  /**
   * Auto-sizes all columns in sheet
   */
  private autoSizeColumns(sheet: ExcelJS.Worksheet): void
}
```

### 5. Enhanced CSVGenerator

```typescript
interface CSVGeneratorOptions {
  includeMetadata: boolean;
  includeSectionHeaders: boolean;
  includeColumnDescriptions: boolean;
}

class CSVGenerator {
  /**
   * Generates structured CSV with metadata
   */
  async generate(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    options: CSVGeneratorOptions
  ): Promise<Blob>

  /**
   * Adds metadata header to CSV
   */
  private addMetadataHeader(metadata: ReportMetadata): string

  /**
   * Adds section with header and data
   */
  private addSection(
    sectionName: string,
    headers: string[],
    rows: string[][],
    description?: string
  ): string

  /**
   * Escapes CSV field value
   */
  private escapeCSVField(value: string): string

  /**
   * Formats date in ISO 8601 format
   */
  private formatDate(date: Date): string
}
```

### 6. Enhanced ReportService

```typescript
class ReportService {
  private dataFetcher: DataFetcher;
  private brandingService: BrandingService;
  private pdfGenerator: PDFGenerator;
  private excelGenerator: ExcelGenerator;
  private csvGenerator: CSVGenerator;

  /**
   * Generates PDF report with complete data and branding
   */
  async generatePDFReport(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    onProgress?: (status: string) => void
  ): Promise<Blob>

  /**
   * Generates Excel report with complete data and branding
   */
  async generateExcelReport(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    onProgress?: (status: string) => void
  ): Promise<Blob>

  /**
   * Generates CSV report with complete data and structure
   */
  async generateCSVReport(
    data: ReportData,
    metadata: ReportMetadata,
    sections: string[],
    onProgress?: (status: string) => void
  ): Promise<Blob>

  /**
   * Fetches complete report data, handling pagination
   */
  private async fetchCompleteReportData(
    baseData: ReportData,
    sections: string[],
    metadata: ReportMetadata,
    onProgress?: (status: string) => void
  ): Promise<ReportData>

  /**
   * Generates unique report ID
   */
  private generateReportId(): string
}
```

## Data Models

### Extended ReportData

```typescript
interface ReportData {
  summary?: AnalyticsSummary;
  usageData?: UsageDataPoint[];
  brokerUsage?: BrokerUsage[];
  costTracking?: CostTrackingData;
  auditLogs?: AuditLogEntry[];
  // New fields for completeness
  totalRecords?: {
    usageData: number;
    brokerUsage: number;
    auditLogs: number;
  };
}
```

### Extended ReportMetadata

```typescript
interface ReportMetadata {
  // Existing fields
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
    brokerId?: string;
  };
  // New fields
  reportId: string;
  format: 'pdf' | 'excel' | 'csv';
  sections: string[];
  dataCompleteness: {
    auditLogsFetched: number;
    brokersFetched: number;
    paginationUsed: boolean;
  };
}
```

### SectionInfo (for Table of Contents)

```typescript
interface SectionInfo {
  name: string;
  title: string;
  pageNumber: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Report Data Completeness

*For any* report generation request with selected sections, all data fields specified in the requirements for those sections should be present in the generated report output, regardless of format.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Pagination Completeness

*For any* report generation that includes audit logs or broker attribution, if the data is paginated, all pages should be fetched until no more records exist or the maximum record limit is reached.

**Validates: Requirements 1.5, 1.6, 5.1, 6.1, 6.2**

### Property 3: PDF Branding Consistency

*For any* PDF report generated, the NEM logo (or fallback text) should appear on the first page, and all pages should have headers with branding and footers with page numbers and timestamps.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 10.1, 10.2**

### Property 4: PDF Formatting Consistency

*For any* PDF report generated, all tables should use NEM brand colors, have proper spacing between sections (minimum 15pt), and use alternating row colors for readability.

**Validates: Requirements 2.6, 2.7, 2.10**

### Property 5: Excel Structure Consistency

*For any* Excel report generated with multiple sections, each selected section should have its own worksheet, and all worksheets should have the Summary sheet as the first sheet.

**Validates: Requirements 3.2, 3.3**

### Property 6: Excel Formatting Consistency

*For any* Excel report generated, all sheet headers should have NEM burgundy background with white bold text, all columns should be auto-sized, currency fields should use ₦ symbol with 2 decimals, percentage fields should use % with 1 decimal, dates should use consistent format, and alternating row colors should be applied.

**Validates: Requirements 3.4, 3.5, 3.6, 3.7, 3.8, 3.11**

### Property 7: CSV Structure and Formatting

*For any* CSV report generated, the file should start with the NEM title, include metadata in comment lines, have section headers prefixed with "#", properly escape special characters (commas, quotes, newlines), format dates in ISO 8601, and include all fields without truncation.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

### Property 8: Audit Log Retrieval Completeness

*For any* report generation that includes audit logs, all audit log entries within the date range should be fetched (handling pagination), include all required fields, and be sorted by timestamp in descending order.

**Validates: Requirements 5.1, 5.2, 5.5, 5.6**

### Property 9: Audit Log Retry Behavior

*For any* audit log retrieval that encounters a network error, the system should retry up to 3 times before failing.

**Validates: Requirements 5.3**

### Property 10: Broker Attribution Completeness

*For any* report generation that includes broker attribution, all broker records should be fetched (handling pagination), include brokers with zero activity, be sorted by total cost descending, and include all calculated fields (success rate, average cost per call).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 11: Cost Tracking Completeness

*For any* report generation that includes cost tracking, the output should include current spending, budget limit, utilization percentage, projected end-of-month cost, days elapsed/remaining, alert level, cost breakdown by provider, and comparison to previous month.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 12: Report Metadata Completeness

*For any* report generated in any format, the metadata should include generation timestamp, user name and email, date range, applied filters, report format, and a unique report ID.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

### Property 13: Error Message Clarity

*For any* report generation that fails during data fetching, the error message should clearly indicate which data section failed to fetch.

**Validates: Requirements 8.5**

## Error Handling

### 1. Logo Loading Failures

- **Scenario**: Logo file not found at `/public/Nem-insurance-Logo.jpg`
- **Handling**: Use fallback text "NEM Insurance" in burgundy color
- **User Impact**: Report still generates with text-only branding

### 2. Pagination Failures

- **Scenario**: API call fails during pagination
- **Handling**: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- **User Impact**: If all retries fail, show error indicating incomplete data

### 3. Large Dataset Warnings

- **Scenario**: Audit logs exceed 10,000 records
- **Handling**: Show warning dialog suggesting date range reduction
- **User Impact**: User can choose to proceed or adjust filters

### 4. Report Generation Timeout

- **Scenario**: Generation takes longer than 30 seconds
- **Handling**: Show progress updates every 5 seconds
- **User Impact**: User sees status messages like "Fetching audit logs (page 3 of 10)..."

### 5. Chart Generation Failures

- **Scenario**: Chart library fails to generate visualization
- **Handling**: Log error and continue without chart, include data in table format
- **User Impact**: Report generates without visual charts but with complete data

### 6. Excel Logo Embedding Failures

- **Scenario**: Logo cannot be embedded in Excel workbook
- **Handling**: Continue with text-only branding in header
- **User Impact**: Report generates without logo image

### 7. Memory Constraints

- **Scenario**: Report data exceeds browser memory limits
- **Handling**: Validate data size before generation, suggest CSV format for large datasets
- **User Impact**: User receives clear guidance on format selection

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Logo Loading**: Test logo file loading and fallback behavior
2. **Color Conversion**: Test hex to RGB conversion for PDF colors
3. **CSV Escaping**: Test special character escaping (commas, quotes, newlines)
4. **Date Formatting**: Test ISO 8601 date formatting
5. **Report ID Generation**: Test uniqueness of report IDs
6. **Section Selection**: Test report generation with different section combinations
7. **Empty Data Handling**: Test report generation with empty datasets
8. **Large Number Formatting**: Test currency and percentage formatting with edge values

### Property-Based Tests

Property tests will verify universal properties across all inputs. Each test should run a minimum of 100 iterations.

**Test Configuration**: Use `fast-check` library for TypeScript property-based testing.

#### Property Test 1: Report Data Completeness
```typescript
// Feature: analytics-report-enhancement, Property 1: Report Data Completeness
// For any report generation request with selected sections, all data fields 
// specified in the requirements for those sections should be present in the 
// generated report output, regardless of format.
```

#### Property Test 2: Pagination Completeness
```typescript
// Feature: analytics-report-enhancement, Property 2: Pagination Completeness
// For any report generation that includes audit logs or broker attribution, 
// if the data is paginated, all pages should be fetched until no more records 
// exist or the maximum record limit is reached.
```

#### Property Test 3: PDF Branding Consistency
```typescript
// Feature: analytics-report-enhancement, Property 3: PDF Branding Consistency
// For any PDF report generated, the NEM logo (or fallback text) should appear 
// on the first page, and all pages should have headers with branding and footers 
// with page numbers and timestamps.
```

#### Property Test 4: PDF Formatting Consistency
```typescript
// Feature: analytics-report-enhancement, Property 4: PDF Formatting Consistency
// For any PDF report generated, all tables should use NEM brand colors, have 
// proper spacing between sections (minimum 15pt), and use alternating row colors 
// for readability.
```

#### Property Test 5: Excel Structure Consistency
```typescript
// Feature: analytics-report-enhancement, Property 5: Excel Structure Consistency
// For any Excel report generated with multiple sections, each selected section 
// should have its own worksheet, and all worksheets should have the Summary sheet 
// as the first sheet.
```

#### Property Test 6: Excel Formatting Consistency
```typescript
// Feature: analytics-report-enhancement, Property 6: Excel Formatting Consistency
// For any Excel report generated, all sheet headers should have NEM burgundy 
// background with white bold text, all columns should be auto-sized, currency 
// fields should use ₦ symbol with 2 decimals, percentage fields should use % 
// with 1 decimal, dates should use consistent format, and alternating row colors 
// should be applied.
```

#### Property Test 7: CSV Structure and Formatting
```typescript
// Feature: analytics-report-enhancement, Property 7: CSV Structure and Formatting
// For any CSV report generated, the file should start with the NEM title, include 
// metadata in comment lines, have section headers prefixed with "#", properly 
// escape special characters, format dates in ISO 8601, and include all fields 
// without truncation.
```

#### Property Test 8: Audit Log Retrieval Completeness
```typescript
// Feature: analytics-report-enhancement, Property 8: Audit Log Retrieval Completeness
// For any report generation that includes audit logs, all audit log entries within 
// the date range should be fetched (handling pagination), include all required 
// fields, and be sorted by timestamp in descending order.
```

#### Property Test 9: Audit Log Retry Behavior
```typescript
// Feature: analytics-report-enhancement, Property 9: Audit Log Retry Behavior
// For any audit log retrieval that encounters a network error, the system should 
// retry up to 3 times before failing.
```

#### Property Test 10: Broker Attribution Completeness
```typescript
// Feature: analytics-report-enhancement, Property 10: Broker Attribution Completeness
// For any report generation that includes broker attribution, all broker records 
// should be fetched (handling pagination), include brokers with zero activity, be 
// sorted by total cost descending, and include all calculated fields.
```

#### Property Test 11: Cost Tracking Completeness
```typescript
// Feature: analytics-report-enhancement, Property 11: Cost Tracking Completeness
// For any report generation that includes cost tracking, the output should include 
// current spending, budget limit, utilization percentage, projected cost, days 
// elapsed/remaining, alert level, provider breakdown, and previous month comparison.
```

#### Property Test 12: Report Metadata Completeness
```typescript
// Feature: analytics-report-enhancement, Property 12: Report Metadata Completeness
// For any report generated in any format, the metadata should include generation 
// timestamp, user name and email, date range, applied filters, report format, and 
// a unique report ID.
```

#### Property Test 13: Error Message Clarity
```typescript
// Feature: analytics-report-enhancement, Property 13: Error Message Clarity
// For any report generation that fails during data fetching, the error message 
// should clearly indicate which data section failed to fetch.
```

### Integration Tests

Integration tests will verify end-to-end report generation:

1. **Complete PDF Generation**: Generate PDF with all sections and verify output
2. **Complete Excel Generation**: Generate Excel with all sections and verify workbook structure
3. **Complete CSV Generation**: Generate CSV with all sections and verify file structure
4. **Pagination Integration**: Test with mock paginated API responses
5. **Logo Integration**: Test with actual logo file and missing logo scenarios
6. **Performance Testing**: Measure generation time with various dataset sizes

### Manual Testing Checklist

1. **Visual Inspection**: Review generated PDFs for branding and layout quality
2. **Excel Functionality**: Open Excel files and verify charts, formatting, and formulas
3. **CSV Import**: Import CSV into Excel/Google Sheets to verify structure
4. **Cross-Browser Testing**: Test report generation in Chrome, Firefox, Safari
5. **Large Dataset Testing**: Generate reports with 5,000+ audit logs
6. **Error Scenarios**: Test with network failures, missing logo, invalid data

## Implementation Notes

### PDF Chart Generation

For PDF charts, we'll use a canvas-based approach:
1. Create an off-screen canvas element
2. Use Chart.js to render the chart to canvas
3. Convert canvas to base64 image
4. Embed image in PDF using jsPDF

### Excel Chart Generation

ExcelJS supports chart generation natively:
1. Define chart type (line, bar, pie)
2. Specify data range
3. Configure chart styling with NEM colors
4. Position chart in worksheet

### Logo Handling

Logo loading strategy:
1. Attempt to load from `/public/Nem-insurance-Logo.jpg`
2. Convert to base64 for embedding
3. Cache base64 string for subsequent reports
4. Fall back to text if loading fails

### Pagination Strategy

For audit logs and broker attribution:
1. Check if API response includes pagination metadata
2. Use cursor-based pagination if available (preferred)
3. Fall back to offset-based pagination if needed
4. Implement exponential backoff for retries
5. Track progress and update UI

### Performance Optimization

1. **Lazy Loading**: Only fetch data for selected sections
2. **Streaming**: Process large datasets in chunks
3. **Web Workers**: Consider using Web Workers for heavy processing
4. **Caching**: Cache branding assets (logo, colors) between reports
5. **Progress Callbacks**: Provide real-time status updates to UI

### Browser Compatibility

- **jsPDF**: Compatible with all modern browsers
- **ExcelJS**: Compatible with all modern browsers
- **File Download**: Use Blob API with fallback for older browsers
- **Canvas API**: Required for PDF charts, supported in all modern browsers
