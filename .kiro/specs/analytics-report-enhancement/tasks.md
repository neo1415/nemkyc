# Implementation Plan: Analytics Report Enhancement

## Overview

This implementation plan enhances the API Analytics Report Generator to produce professional, comprehensive reports with NEM Insurance branding. The work is organized into logical phases: data fetching infrastructure, branding services, PDF enhancements, Excel enhancements, CSV enhancements, and integration.

## Tasks

- [-] 1. Create data fetching infrastructure for pagination
  - [x] 1.1 Create DataFetcher service with pagination support
    - Implement `DataFetcher` class in `src/services/analytics/DataFetcher.ts`
    - Add `fetchAllAuditLogs()` method with pagination handling
    - Add `fetchAllBrokerAttribution()` method with pagination handling
    - Add generic `fetchPaginated()` helper with retry logic (3 attempts, exponential backoff)
    - Add progress callback support for UI updates
    - _Requirements: 1.5, 1.6, 5.1, 5.2, 5.3, 6.1, 6.2_
  
  - [ ] 1.2 Write property test for pagination completeness
    - **Property 2: Pagination Completeness**
    - **Validates: Requirements 1.5, 1.6, 5.1, 6.1, 6.2**
  
  - [ ] 1.3 Write unit tests for retry logic
    - Test exponential backoff timing
    - Test max retry limit (3 attempts)
    - Test error propagation after retries exhausted
    - _Requirements: 5.3_

- [-] 2. Create branding service for NEM assets
  - [x] 2.1 Create BrandingService with logo and color management
    - Implement `BrandingService` class in `src/services/analytics/BrandingService.ts`
    - Add `loadLogo()` method to load from `/public/Nem-insurance-Logo.jpg`
    - Add `getColors()` method returning NEM color palette
    - Add `getReportTitle()` method returning "NEM Insurance - API Analytics Report"
    - Add `hexToRGB()` helper for PDF color conversion
    - Implement logo caching to avoid repeated file loads
    - _Requirements: 2.1, 2.2, 10.1, 10.2_
  
  - [ ] 2.2 Write unit tests for branding service
    - Test logo loading success and failure scenarios
    - Test color palette retrieval
    - Test hex to RGB conversion
    - Test logo caching behavior
    - _Requirements: 2.1, 2.2, 10.1, 10.2_

- [-] 3. Enhance PDF generation with branding and formatting
  - [x] 3.1 Create PDFGenerator class with branded templates
    - Implement `PDFGenerator` class in `src/services/analytics/PDFGenerator.ts`
    - Add `generate()` method as main entry point
    - Add `addPageHeader()` method with logo and title
    - Add `addPageFooter()` method with page numbers and timestamp
    - Add `generateTableOfContents()` method for multi-section reports
    - Apply NEM colors to all table headers and elements
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 3.2 Add chart generation for PDF reports
    - Add `addUsageChart()` method using Chart.js and canvas
    - Add `addBudgetGauge()` method for cost tracking visualization
    - Implement canvas-to-base64 conversion for embedding
    - Apply NEM colors to charts
    - _Requirements: 2.8, 2.9_
  
  - [ ] 3.3 Implement branded table formatting
    - Add `formatTable()` method with NEM color scheme
    - Apply alternating row colors (white and light gold #FFF8DC)
    - Apply proper spacing between sections (minimum 15pt)
    - Add automatic page breaks before major sections
    - _Requirements: 2.6, 2.7, 2.10_
  
  - [ ] 3.4 Write property test for PDF branding consistency
    - **Property 3: PDF Branding Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 10.1, 10.2**
  
  - [ ] 3.5 Write property test for PDF formatting consistency
    - **Property 4: PDF Formatting Consistency**
    - **Validates: Requirements 2.6, 2.7, 2.10**
  
  - [ ] 3.6 Write unit tests for PDF chart generation
    - Test usage chart generation
    - Test budget gauge generation
    - Test chart color application
    - Test canvas-to-base64 conversion
    - _Requirements: 2.8, 2.9_

- [x] 4. Enhance Excel generation with branding and formatting
  - [x] 4.1 Create ExcelGenerator class with multi-sheet support
    - Implement `ExcelGenerator` class in `src/services/analytics/ExcelGenerator.ts`
    - Add `generate()` method as main entry point
    - Add `createSummarySheet()` method with key metrics
    - Add `formatSheetHeader()` method with NEM branding
    - Add `applyBrandedFormatting()` method for consistent styling
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 4.2 Implement Excel formatting with NEM colors
    - Apply burgundy (#800020) background to all headers with white bold text
    - Implement `autoSizeColumns()` method for all sheets
    - Format currency fields with ₦ symbol and 2 decimal places
    - Format percentage fields with % symbol and 1 decimal place
    - Format date/timestamp fields consistently (YYYY-MM-DD HH:mm:ss)
    - Apply alternating row colors (white and light gold #FFF8DC)
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.11_
  
  - [ ] 4.3 Add chart generation for Excel reports
    - Add `addUsageChart()` method using ExcelJS chart API
    - Add `addBudgetChart()` method for cost tracking
    - Apply NEM colors to Excel charts
    - Position charts appropriately in worksheets
    - _Requirements: 3.9, 3.10_
  
  - [ ] 4.4 Implement logo embedding in Excel
    - Add logo embedding to Summary sheet header
    - Implement graceful fallback to text-only if embedding fails
    - _Requirements: 10.3, 10.4_
  
  - [ ] 4.5 Write property test for Excel structure consistency
    - **Property 5: Excel Structure Consistency**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ] 4.6 Write property test for Excel formatting consistency
    - **Property 6: Excel Formatting Consistency**
    - **Validates: Requirements 3.4, 3.5, 3.6, 3.7, 3.8, 3.11**
  
  - [ ] 4.7 Write unit tests for Excel chart generation
    - Test usage chart creation
    - Test budget chart creation
    - Test chart color application
    - _Requirements: 3.9, 3.10_

- [ ] 5. Enhance CSV generation with structure and metadata
  - [x] 5.1 Create CSVGenerator class with structured output
    - Implement `CSVGenerator` class in `src/services/analytics/CSVGenerator.ts`
    - Add `generate()` method as main entry point
    - Add `addMetadataHeader()` method with complete metadata
    - Add `addSection()` method with headers and descriptions
    - Add `escapeCSVField()` method for proper escaping
    - Add `formatDate()` method for ISO 8601 formatting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ] 5.2 Write property test for CSV structure and formatting
    - **Property 7: CSV Structure and Formatting**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
  
  - [ ] 5.3 Write unit tests for CSV escaping
    - Test comma escaping
    - Test quote escaping
    - Test newline escaping
    - Test mixed special characters
    - _Requirements: 4.5_

- [x] 6. Update ReportService to use new infrastructure
  - [x] 6.1 Integrate DataFetcher into ReportService
    - Update `ReportService` class in `src/services/analytics/ReportService.ts`
    - Add `fetchCompleteReportData()` method using DataFetcher
    - Add progress callback support throughout generation pipeline
    - Add `generateReportId()` method for unique report IDs
    - Update all generation methods to fetch complete data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.6_
  
  - [x] 6.2 Update PDF generation to use PDFGenerator
    - Replace inline PDF generation with PDFGenerator class
    - Pass branding service to PDFGenerator
    - Add progress callbacks for long-running operations
    - Handle chart generation errors gracefully
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
  
  - [x] 6.3 Update Excel generation to use ExcelGenerator
    - Replace inline Excel generation with ExcelGenerator class
    - Pass branding service to ExcelGenerator
    - Add progress callbacks for long-running operations
    - Handle chart and logo embedding errors gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_
  
  - [x] 6.4 Update CSV generation to use CSVGenerator
    - Replace inline CSV generation with CSVGenerator class
    - Ensure all metadata and structure requirements are met
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 6.5 Write property test for report data completeness
    - **Property 1: Report Data Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  
  - [ ]* 6.6 Write property test for report metadata completeness
    - **Property 12: Report Metadata Completeness**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

- [x] 7. Enhance ReportGenerator UI component
  - [x] 7.1 Add progress indicator for long-running reports
    - Update `ReportGenerator` component in `src/components/analytics/ReportGenerator.tsx`
    - Add progress state and status message display
    - Show progress updates during data fetching and generation
    - Display estimated time remaining for large reports
    - _Requirements: 8.3, 8.4, 8.6_
  
  - [x] 7.2 Add large dataset warning dialog
    - Add warning when audit logs exceed 10,000 records
    - Suggest date range reduction or CSV format
    - Allow user to proceed or adjust filters
    - _Requirements: 5.4_
  
  - [x] 7.3 Improve error messaging
    - Display specific error messages for each data section failure
    - Show retry status during pagination failures
    - Provide actionable guidance for resolution
    - _Requirements: 8.5_
  
  - [ ]* 7.4 Write unit tests for UI progress indicators
    - Test progress display during generation
    - Test large dataset warning dialog
    - Test error message display
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 5.4_

- [x] 8. Implement complete data fetching for all sections
  - [x] 8.1 Update audit log fetching to handle pagination
    - Modify audit log fetching to use DataFetcher
    - Fetch all pages until no more records
    - Sort by timestamp descending
    - Include all audit log fields
    - _Requirements: 5.1, 5.2, 5.5, 5.6_
  
  - [x] 8.2 Update broker attribution fetching to handle pagination
    - Modify broker attribution fetching to use DataFetcher
    - Fetch all broker records including zero-activity brokers
    - Sort by total cost descending
    - Include all calculated fields (success rate, average cost per call)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 8.3 Ensure cost tracking includes all required fields
    - Verify current spending, budget limit, utilization are included
    - Add projected end-of-month cost calculation
    - Add days elapsed and days remaining
    - Add budget alert level
    - Add cost breakdown by provider
    - Add comparison to previous month
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 8.4 Write property test for audit log retrieval completeness
    - **Property 8: Audit Log Retrieval Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.5, 5.6**
  
  - [ ]* 8.5 Write property test for audit log retry behavior
    - **Property 9: Audit Log Retry Behavior**
    - **Validates: Requirements 5.3**
  
  - [ ]* 8.6 Write property test for broker attribution completeness
    - **Property 10: Broker Attribution Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
  
  - [ ]* 8.7 Write property test for cost tracking completeness
    - **Property 11: Cost Tracking Completeness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [x] 9. Add performance monitoring and optimization
  - [x] 9.1 Implement performance tracking
    - Add timing measurements for each generation phase
    - Log performance metrics for monitoring
    - Add performance thresholds (5s for <1000 logs, 15s for 1000-5000 logs)
    - _Requirements: 8.1, 8.2_
  
  - [x] 9.2 Optimize large dataset handling
    - Implement chunked processing for large datasets
    - Add memory usage monitoring
    - Suggest CSV format for very large reports
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 9.3 Write unit tests for performance monitoring
    - Test timing measurements
    - Test threshold detection
    - Test format suggestions for large datasets
    - _Requirements: 8.1, 8.2_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration testing and validation
  - [x] 11.1 Create integration test for complete PDF generation
    - Test PDF generation with all sections
    - Verify logo embedding or fallback
    - Verify NEM colors in tables and charts
    - Verify table of contents for multi-section reports
    - Verify page headers and footers on all pages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
  
  - [x] 11.2 Create integration test for complete Excel generation
    - Test Excel generation with all sections
    - Verify Summary sheet is first
    - Verify all sheets have proper formatting
    - Verify charts are embedded
    - Verify logo embedding or fallback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_
  
  - [x] 11.3 Create integration test for complete CSV generation
    - Test CSV generation with all sections
    - Verify metadata header
    - Verify section headers and structure
    - Verify special character escaping
    - Verify ISO 8601 date formatting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 11.4 Create integration test for pagination handling
    - Mock paginated API responses
    - Verify all pages are fetched
    - Verify retry logic on failures
    - Verify progress callbacks
    - _Requirements: 1.5, 1.6, 5.1, 5.2, 5.3, 6.1, 6.2_
  
  - [ ]* 11.5 Write property test for error message clarity
    - **Property 13: Error Message Clarity**
    - **Validates: Requirements 8.5**

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end report generation
- The NEM logo file must exist at `/public/Nem-insurance-Logo.jpg` before testing
- Use `fast-check` library for property-based testing in TypeScript
- All property tests should run minimum 100 iterations
- Chart generation requires Chart.js for PDF and ExcelJS native charts for Excel
- Progress callbacks enable real-time UI updates during long-running operations
