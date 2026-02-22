# Requirements Document

## Introduction

The API Analytics Report Generator currently produces basic reports with minimal data and formatting. This enhancement will transform it into a professional, comprehensive reporting system that captures all dashboard data, includes NEM Insurance branding, and provides enhanced formatting across all export formats (PDF, Excel, CSV).

## Glossary

- **Report_Generator**: The UI component that allows users to configure and generate analytics reports
- **Report_Service**: The backend service that generates reports in multiple formats
- **Analytics_Dashboard**: The admin dashboard displaying all API usage, cost, and audit data
- **NEM_Branding**: Visual identity elements including logo, colors, and professional formatting
- **Paginated_Data**: Data that is loaded in chunks (e.g., audit logs) that must be fully captured in reports
- **Broker_Attribution**: User-level breakdown of API usage and costs
- **Cost_Projection**: Estimated future costs based on current usage trends
- **Budget_Utilization**: Percentage of monthly budget consumed

## Requirements

### Requirement 1: Comprehensive Data Capture

**User Story:** As a super admin, I want reports to include ALL data visible on the analytics dashboard, so that I have complete records for analysis and auditing.

#### Acceptance Criteria

1. WHEN generating a report with overview section, THE Report_Service SHALL include all metrics from AnalyticsSummary (total calls, costs, success rates, provider breakdowns, and period comparisons)
2. WHEN generating a report with daily usage section, THE Report_Service SHALL include all UsageDataPoint records within the date range with complete fields (calls, costs, success/failure counts per provider)
3. WHEN generating a report with broker attribution section, THE Report_Service SHALL include all BrokerUsage records with complete fields (broker name, email, calls, costs, success rate, last activity)
4. WHEN generating a report with cost tracking section, THE Report_Service SHALL include current spending, budget limit, utilization percentage, projected costs, alert level, and days elapsed/remaining
5. WHEN generating a report with audit logs section, THE Report_Service SHALL fetch ALL audit log entries within the date range, not just the visible paginated subset
6. WHEN audit logs exceed pagination limits, THE Report_Service SHALL make multiple API calls to retrieve all records within the date range

### Requirement 2: Professional PDF Branding and Formatting

**User Story:** As a super admin, I want PDF reports to include NEM Insurance branding and professional formatting, so that reports are presentation-ready for stakeholders.

#### Acceptance Criteria

1. WHEN generating a PDF report, THE Report_Service SHALL include the NEM logo from `/public/Nem-insurance-Logo.jpg` at normal size in the top-left corner of the first page
2. WHEN generating a PDF report, THE Report_Service SHALL include "NEM Insurance - API Analytics Report" as the main title with NEM burgundy color (#800020)
3. WHEN generating a PDF report, THE Report_Service SHALL include page headers on all pages with the NEM logo and report title
4. WHEN generating a PDF report, THE Report_Service SHALL include page footers on all pages with page numbers and generation timestamp
5. WHEN generating a PDF report with multiple sections, THE Report_Service SHALL include a table of contents on the second page with section names and page numbers
6. WHEN generating a PDF report, THE Report_Service SHALL use NEM brand colors for tables and charts (burgundy #800020 for headers, gold #FFD700 for highlights, brown #8B4513 and golden #DAA520 for accents)
7. WHEN generating a PDF report, THE Report_Service SHALL apply proper spacing between sections (minimum 15pt) and page breaks before major sections
8. WHEN generating a PDF report with usage data, THE Report_Service SHALL include charts/visualizations for daily trends using NEM colors
9. WHEN generating a PDF report with cost tracking, THE Report_Service SHALL include a visual budget utilization gauge or progress bar
10. WHEN generating a PDF report with broker attribution, THE Report_Service SHALL format the table with alternating row colors using NEM color scheme

### Requirement 3: Enhanced Excel Formatting

**User Story:** As a super admin, I want Excel reports to have professional formatting and multiple organized sheets, so that data is easy to analyze and present.

#### Acceptance Criteria

1. WHEN generating an Excel report, THE Report_Service SHALL include "NEM Insurance - API Analytics Report" as the title in the first row of the Summary sheet with NEM burgundy background (#800020) and white text
2. WHEN generating an Excel report, THE Report_Service SHALL create a Summary sheet as the first sheet with key metrics and metadata
3. WHEN generating an Excel report, THE Report_Service SHALL create separate sheets for each data section (Overview, Daily Usage, Broker Attribution, Cost Tracking, Audit Logs)
4. WHEN generating an Excel report, THE Report_Service SHALL format all sheet headers with NEM burgundy background (#800020) and white bold text
5. WHEN generating an Excel report, THE Report_Service SHALL auto-size all columns to fit content
6. WHEN generating an Excel report, THE Report_Service SHALL format currency fields with Nigerian Naira symbol (₦) and two decimal places
7. WHEN generating an Excel report, THE Report_Service SHALL format percentage fields with percent symbol and one decimal place
8. WHEN generating an Excel report, THE Report_Service SHALL format date/timestamp fields in consistent format (YYYY-MM-DD HH:mm:ss)
9. WHEN generating an Excel report with usage data, THE Report_Service SHALL include embedded charts showing daily trends
10. WHEN generating an Excel report with cost tracking, THE Report_Service SHALL include a visual budget utilization chart
11. WHEN generating an Excel report, THE Report_Service SHALL apply alternating row colors (white and light gold #FFF8DC) for better readability

### Requirement 4: Enhanced CSV Formatting

**User Story:** As a super admin, I want CSV reports to have clear structure and complete metadata, so that data can be easily imported into other systems.

#### Acceptance Criteria

1. WHEN generating a CSV report, THE Report_Service SHALL include "NEM Insurance - API Analytics Report" as the first line
2. WHEN generating a CSV report, THE Report_Service SHALL include complete metadata in comment lines at the top (generation date, generated by, date range, filters applied)
3. WHEN generating a CSV report, THE Report_Service SHALL include clear section headers prefixed with "#" to separate different data sections
4. WHEN generating a CSV report, THE Report_Service SHALL include column descriptions in comment lines before each section
5. WHEN generating a CSV report, THE Report_Service SHALL properly escape all fields containing commas, quotes, or newlines
6. WHEN generating a CSV report, THE Report_Service SHALL format dates in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) for consistency
7. WHEN generating a CSV report, THE Report_Service SHALL include all fields from each data type without truncation

### Requirement 5: Complete Audit Log Capture

**User Story:** As a super admin, I want reports to include ALL audit logs within the date range, so that I have complete audit trails for compliance.

#### Acceptance Criteria

1. WHEN generating a report with audit logs, THE Report_Service SHALL fetch all audit log pages from the backend API until no more records exist
2. WHEN fetching paginated audit logs, THE Report_Service SHALL use cursor-based or offset-based pagination to retrieve all records
3. WHEN audit log retrieval encounters an error, THE Report_Service SHALL retry up to 3 times before failing
4. WHEN audit log count exceeds 10,000 records, THE Report_Service SHALL warn the user and suggest narrowing the date range
5. WHEN generating a report with audit logs, THE Report_Service SHALL include all audit log fields (timestamp, user, provider, type, status, cost, IP address, device info, error messages)
6. WHEN generating a report with audit logs, THE Report_Service SHALL sort audit logs by timestamp in descending order (newest first)

### Requirement 6: Complete Broker Attribution Data

**User Story:** As a super admin, I want reports to include ALL broker attribution data, so that I can see usage patterns for every broker.

#### Acceptance Criteria

1. WHEN generating a report with broker attribution, THE Report_Service SHALL fetch all broker records from the backend API, not just the visible subset
2. WHEN broker attribution data is paginated, THE Report_Service SHALL retrieve all pages until no more records exist
3. WHEN generating a report with broker attribution, THE Report_Service SHALL include brokers with zero activity if they exist in the system
4. WHEN generating a report with broker attribution, THE Report_Service SHALL sort brokers by total cost in descending order
5. WHEN generating a report with broker attribution, THE Report_Service SHALL include calculated fields (success rate, average cost per call)

### Requirement 7: Cost Tracking and Projections

**User Story:** As a super admin, I want reports to include detailed cost tracking with projections, so that I can forecast budget needs.

#### Acceptance Criteria

1. WHEN generating a report with cost tracking, THE Report_Service SHALL include current month spending, budget limit, and utilization percentage
2. WHEN generating a report with cost tracking, THE Report_Service SHALL include projected end-of-month cost based on current daily average
3. WHEN generating a report with cost tracking, THE Report_Service SHALL include days elapsed and days remaining in the current month
4. WHEN generating a report with cost tracking, THE Report_Service SHALL include budget alert level (normal, warning, critical)
5. WHEN generating a report with cost tracking, THE Report_Service SHALL include cost breakdown by provider (Datapro vs VerifyData)
6. WHEN generating a report with cost tracking, THE Report_Service SHALL include comparison to previous month's spending

### Requirement 8: Report Generation Performance

**User Story:** As a super admin, I want reports to generate efficiently even with large datasets, so that I don't experience long wait times.

#### Acceptance Criteria

1. WHEN generating a report with less than 1,000 audit logs, THE Report_Service SHALL complete generation within 5 seconds
2. WHEN generating a report with 1,000-5,000 audit logs, THE Report_Service SHALL complete generation within 15 seconds
3. WHEN generating a report with more than 5,000 audit logs, THE Report_Service SHALL show a progress indicator during generation
4. WHEN report generation exceeds 30 seconds, THE Report_Service SHALL provide status updates to the user
5. WHEN report data fetching fails, THE Report_Service SHALL provide clear error messages indicating which data section failed
6. WHEN report generation is in progress, THE Report_Service SHALL disable the generate button and show a loading spinner

### Requirement 9: Report Metadata and Traceability

**User Story:** As a super admin, I want reports to include complete metadata, so that I can track when and by whom reports were generated.

#### Acceptance Criteria

1. WHEN generating any report, THE Report_Service SHALL include the generation timestamp in the report metadata
2. WHEN generating any report, THE Report_Service SHALL include the name and email of the user who generated the report
3. WHEN generating any report, THE Report_Service SHALL include the date range filter applied
4. WHEN generating any report, THE Report_Service SHALL include any additional filters applied (provider, status, broker)
5. WHEN generating any report, THE Report_Service SHALL include the report format (PDF, Excel, CSV) in the metadata
6. WHEN generating any report, THE Report_Service SHALL include a unique report ID for tracking purposes

### Requirement 10: Logo Integration

**User Story:** As a super admin, I want the NEM Insurance logo to appear correctly in all report formats, so that reports are properly branded.

#### Acceptance Criteria

1. WHEN generating a PDF report, THE Report_Service SHALL load the logo from `/public/Nem-insurance-Logo.jpg` and embed it at normal size (not scaled down excessively)
2. WHEN the logo file is not found, THE Report_Service SHALL display "NEM Insurance" text in burgundy color as a fallback
3. WHEN generating an Excel report, THE Report_Service SHALL attempt to embed the logo in the Summary sheet header
4. WHEN logo embedding fails in Excel, THE Report_Service SHALL continue report generation with text-only branding
5. WHEN generating a CSV report, THE Report_Service SHALL include "NEM Insurance" in the title line (logos not supported in CSV)
