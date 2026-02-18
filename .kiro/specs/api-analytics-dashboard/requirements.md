# Requirements Document

## Introduction

The API Analytics & Cost Tracking Dashboard provides super admin users with comprehensive visibility into API usage patterns, cost tracking, and operational insights for Datapro (NIN verification) and VerifyData (CAC verification) services. This dashboard leverages existing data collection infrastructure to deliver actionable analytics, budget monitoring, and compliance reporting capabilities.

## Glossary

- **System**: The API Analytics & Cost Tracking Dashboard web application
- **Super_Admin**: User with elevated privileges to access analytics and cost data
- **API_Provider**: External verification service (Datapro or VerifyData)
- **Verification_Call**: A single API request to verify identity information
- **Cost_Entry**: Record of charges incurred for a verification call
- **Audit_Log**: Detailed record of verification attempts with metadata
- **Report**: Exportable document containing analytics data
- **Budget_Threshold**: Configurable spending limit that triggers alerts
- **Broker**: User who initiates verification requests on behalf of customers
- **Firestore**: Cloud database storing usage and audit data
- **Dashboard_Widget**: Visual component displaying metrics or charts
- **Date_Range_Filter**: User-selected time period for data analysis
- **Real_Time_Update**: Automatic refresh of displayed data without page reload

## Requirements

### Requirement 1: Super Admin Access Control

**User Story:** As a system administrator, I want to restrict dashboard access to super admin users only, so that sensitive cost and usage data remains confidential.

#### Acceptance Criteria

1. WHEN a user attempts to access the dashboard, THE System SHALL verify the user has super admin role
2. WHEN a non-super admin user attempts to access the dashboard, THE System SHALL redirect them to an unauthorized page
3. WHEN a super admin user accesses the dashboard, THE System SHALL load all analytics features
4. WHEN authentication state changes, THE System SHALL re-validate access permissions
5. THE System SHALL log all dashboard access attempts in audit logs

### Requirement 2: Overview Dashboard Metrics

**User Story:** As a super admin, I want to see key metrics at a glance, so that I can quickly understand current API usage and costs.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE System SHALL display total API calls for the current month
2. WHEN the dashboard loads, THE System SHALL display total costs for the current month
3. WHEN the dashboard loads, THE System SHALL display success rate percentage
4. WHEN the dashboard loads, THE System SHALL display failure rate percentage
5. WHEN the dashboard loads, THE System SHALL display cost breakdown by API provider
6. WHEN the dashboard loads, THE System SHALL display comparison metrics versus previous period
7. THE System SHALL update metrics automatically every 30 seconds

### Requirement 3: Data Visualization Charts

**User Story:** As a super admin, I want to visualize API usage trends over time, so that I can identify patterns and anomalies.

#### Acceptance Criteria

1. WHEN viewing the dashboard, THE System SHALL display a line chart showing daily API call volumes
2. WHEN viewing the dashboard, THE System SHALL display a bar chart comparing costs by API provider
3. WHEN viewing the dashboard, THE System SHALL display a pie chart showing success vs failure distribution
4. WHEN viewing the dashboard, THE System SHALL display a time series chart for cost trends
5. WHEN a user hovers over chart elements, THE System SHALL display detailed tooltips with exact values
6. WHEN chart data updates, THE System SHALL animate transitions smoothly
7. THE System SHALL support chart interactions including zoom and pan

### Requirement 4: Advanced Filtering Capabilities

**User Story:** As a super admin, I want to filter analytics data by multiple criteria, so that I can analyze specific segments of API usage.

#### Acceptance Criteria

1. WHEN a user selects a date range, THE System SHALL filter all displayed data to that period
2. WHEN a user selects an API provider filter, THE System SHALL show only data for that provider
3. WHEN a user selects a status filter, THE System SHALL show only successful or failed calls
4. WHEN a user applies multiple filters, THE System SHALL combine them with AND logic
5. WHEN a user clears filters, THE System SHALL restore the default view
6. THE System SHALL persist filter selections in browser session storage
7. THE System SHALL validate date ranges to prevent invalid selections

### Requirement 5: User Attribution Analytics

**User Story:** As a super admin, I want to see which users are creating lists and sending links, so that I can track all verification activity across all roles (brokers, admins, compliance, etc.).

#### Acceptance Criteria

1. WHEN viewing user attribution, THE System SHALL display a ranked list of all users who create identity lists by call volume
2. WHEN viewing user attribution, THE System SHALL display cost per user including both bulk verifications and customer verifications from their links
3. WHEN viewing user attribution, THE System SHALL display success rate per user
4. WHEN viewing user attribution, THE System SHALL display the user's role (broker, admin, compliance, etc.)
5. WHEN viewing user attribution, THE System SHALL allow sorting by different metrics (calls, cost, success rate, role)
6. WHEN a user clicks on a user entry, THE System SHALL display detailed usage history for that user
7. THE System SHALL calculate and display average calls per user
8. THE System SHALL identify and highlight users exceeding normal usage patterns
9. WHEN aggregating user attribution data, THE System SHALL query api-usage-logs grouped by listId
10. WHEN aggregating user attribution data, THE System SHALL look up identity-lists.createdBy to determine which user created each list
11. WHEN aggregating user attribution data, THE System SHALL fetch user details including role from the users collection
12. WHEN displaying user attribution, THE System SHALL show both Datapro and VerifyData call types per user

### Requirement 6: Cost Tracking and Budget Monitoring

**User Story:** As a super admin, I want to track costs against budgets and receive alerts, so that I can manage spending effectively.

#### Acceptance Criteria

1. WHEN viewing cost tracking, THE System SHALL display current month spending
2. WHEN viewing cost tracking, THE System SHALL display budget utilization percentage
3. WHEN viewing cost tracking, THE System SHALL display projected end-of-month costs
4. WHEN spending exceeds 80% of budget, THE System SHALL display a warning indicator
5. WHEN spending exceeds 100% of budget, THE System SHALL display a critical alert
6. THE System SHALL allow super admins to configure monthly budget thresholds
7. THE System SHALL calculate cost projections based on current daily average spending
8. THE System SHALL display cost breakdown by provider (₦50 per Datapro call, ₦100 per VerifyData call)

### Requirement 7: Audit Logs Viewer

**User Story:** As a super admin, I want to search and view detailed audit logs, so that I can investigate specific verification attempts and troubleshoot issues.

#### Acceptance Criteria

1. WHEN viewing audit logs, THE System SHALL display logs in reverse chronological order
2. WHEN viewing audit logs, THE System SHALL display timestamp, user, provider, status, and cost for each entry
3. WHEN a user searches audit logs, THE System SHALL filter results by search term
4. WHEN a user filters by date range, THE System SHALL show only logs within that period
5. WHEN a user clicks on a log entry, THE System SHALL display full details including IP address and device info
6. THE System SHALL support pagination for large log datasets
7. THE System SHALL allow filtering by verification status (success, failure, pending)
8. THE System SHALL allow filtering by API provider

### Requirement 8: Audit Logs User Column

**User Story:** As a super admin, I want to see who initiated each action in the audit logs, so that I can track accountability and investigate issues.

#### Acceptance Criteria

1. WHEN viewing audit logs, THE System SHALL display a "User" column showing who initiated the action
2. WHEN the action was initiated by a logged-in user, THE System SHALL display their name and email
3. WHEN the action was initiated by a customer (anonymous), THE System SHALL display "Customer" or the customer name from the verification data
4. WHEN the action was initiated by the system, THE System SHALL display "System"
5. THE System SHALL make the User column sortable and filterable
6. THE System SHALL allow searching audit logs by user name or email

### Requirement 9: Report Generation and Export

**User Story:** As a super admin, I want to generate and download reports in multiple formats, so that I can share data with finance and compliance teams.

#### Acceptance Criteria

1. WHEN a user requests a PDF report, THE System SHALL generate a formatted PDF with charts and tables
2. WHEN a user requests an Excel report, THE System SHALL generate an XLSX file with multiple sheets
3. WHEN a user requests a CSV report, THE System SHALL generate a CSV file with raw data
4. WHEN generating reports, THE System SHALL include all currently applied filters
5. WHEN generating reports, THE System SHALL include summary statistics and metadata
6. THE System SHALL allow users to select which data sections to include in reports
7. THE System SHALL include report generation timestamp and user information
8. THE System SHALL validate report size limits to prevent memory issues

### Requirement 10: Real-Time Data Updates

**User Story:** As a super admin, I want the dashboard to update automatically, so that I always see current data without manual refresh.

#### Acceptance Criteria

1. WHEN new API usage data is recorded, THE System SHALL update dashboard metrics within 30 seconds
2. WHEN viewing the dashboard, THE System SHALL establish a real-time connection to Firestore
3. WHEN connection is lost, THE System SHALL display a connection status indicator
4. WHEN connection is restored, THE System SHALL automatically resume real-time updates
5. THE System SHALL batch updates to prevent excessive re-rendering
6. THE System SHALL update only changed data sections rather than full page refresh
7. WHEN a user is interacting with filters, THE System SHALL pause automatic updates

### Requirement 11: Mobile-Responsive Design

**User Story:** As a super admin, I want to access the dashboard on mobile devices, so that I can monitor API usage while away from my desk.

#### Acceptance Criteria

1. WHEN viewing on mobile devices, THE System SHALL adapt layout to screen size
2. WHEN viewing on mobile devices, THE System SHALL display charts in mobile-optimized format
3. WHEN viewing on mobile devices, THE System SHALL provide touch-friendly controls
4. WHEN viewing on tablets, THE System SHALL use a two-column layout
5. WHEN viewing on desktop, THE System SHALL use a multi-column layout
6. THE System SHALL maintain functionality across all screen sizes
7. THE System SHALL optimize chart rendering for mobile performance

### Requirement 12: Data Aggregation and Performance

**User Story:** As a super admin, I want the dashboard to load quickly even with large datasets, so that I can access insights without delays.

#### Acceptance Criteria

1. WHEN loading the dashboard, THE System SHALL display initial metrics within 2 seconds
2. WHEN querying large date ranges, THE System SHALL use aggregated data collections
3. WHEN filtering data, THE System SHALL return results within 1 second
4. THE System SHALL cache frequently accessed data in browser storage
5. THE System SHALL use Firestore composite indexes for efficient queries
6. THE System SHALL implement pagination for large result sets
7. THE System SHALL display loading indicators during data fetch operations

### Requirement 13: Error Handling and User Feedback

**User Story:** As a super admin, I want clear error messages and feedback, so that I understand what's happening when issues occur.

#### Acceptance Criteria

1. WHEN a data fetch fails, THE System SHALL display a user-friendly error message
2. WHEN a report generation fails, THE System SHALL explain the failure reason
3. WHEN network connectivity is lost, THE System SHALL notify the user
4. WHEN an operation succeeds, THE System SHALL display a success confirmation
5. THE System SHALL log all errors to console for debugging
6. THE System SHALL provide retry options for failed operations
7. WHEN authentication expires, THE System SHALL prompt for re-authentication
