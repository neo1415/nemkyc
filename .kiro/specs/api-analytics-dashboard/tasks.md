# Implementation Plan: API Analytics & Cost Tracking Dashboard

## Overview

This implementation plan breaks down the API Analytics & Cost Tracking Dashboard into discrete coding tasks. The dashboard will be built using React + TypeScript, leveraging existing shadcn/ui components and Recharts for visualizations. The implementation follows an incremental approach, building core functionality first, then adding advanced features, and finally implementing testing and polish.

## Tasks

- [x] 1. Set up project structure and core types
  - Create directory structure: `src/pages/admin/analytics/`, `src/components/analytics/`, `src/services/analytics/`, `src/hooks/analytics/`
  - Define TypeScript interfaces in `src/types/analytics.ts` for AnalyticsSummary, UsageDataPoint, UserAttribution (renamed from BrokerUsage, add userRole field), AuditLogEntry (add userType, userEmail fields), BudgetConfig, FilterState
  - Create constants file `src/config/analyticsConfig.ts` with API costs (₦50 Datapro, ₦100 VerifyData), update intervals, pagination defaults
  - _Requirements: 2.5, 6.8_

- [x] 2. Implement core data services and utilities
  - [x] 2.1 Create CostCalculator utility class
    - Implement `calculateTotalCost()` method with fixed rates
    - Implement `calculateBudgetUtilization()` method
    - Implement `getAlertLevel()` method for threshold checking
    - _Requirements: 2.2, 2.5, 6.1, 6.2, 6.8_
  
  - [x] 2.2 Write property test for cost calculations
    - **Property 4: Cost Calculation Correctness**
    - **Validates: Requirements 2.2, 2.5, 5.2, 6.1, 6.8**
  
  - [x] 2.3 Create AnalyticsService class
    - Implement `fetchAnalyticsSummary()` to aggregate data from Firestore
    - Implement `fetchUsageTimeSeries()` for chart data
    - Implement `fetchUserAttribution()` (renamed from fetchBrokerUsage) for attribution metrics - query by listId, lookup identity-lists.createdBy, aggregate by user, fetch user role
    - Implement `fetchAuditLogs()` with pagination - include userType and userEmail fields
    - Implement `calculateProjectedCost()` for budget projections
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.9, 5.10, 5.11, 6.3, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4_
  
  - [x] 2.4 Write property tests for analytics calculations
    - **Property 5: Success Rate Calculation**
    - **Property 6: Period Comparison Calculation**
    - **Property 17: Average Calculation**
    - **Property 19: Budget Utilization Calculation**
    - **Property 20: Cost Projection Formula**
    - **Validates: Requirements 2.3, 2.4, 2.6, 5.3, 5.6, 6.2, 6.3, 6.7**

- [x] 2.5 Update backend endpoint from /api/analytics/broker-usage to /api/analytics/user-attribution
  - Rename endpoint in server.js
  - Update implementation to query by listId instead of userId
  - Add lookup of identity-lists.createdBy for each listId
  - Aggregate by createdBy user
  - Fetch user role from users collection
  - Add support for sorting by role
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.9, 5.10, 5.11_

- [x] 2.6 Update frontend to use new /api/analytics/user-attribution endpoint
  - Update AnalyticsAPI.ts to call /api/analytics/user-attribution instead of /api/analytics/broker-usage
  - Update response handling to use 'users' instead of 'brokers'
  - Update all references from BrokerUsage to UserAttribution
  - Update component props and state to use userAttribution
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.11_

- [x] 3. Implement filtering and data processing logic
  - [x] 3.1 Create filtering utility functions
    - Implement `applyDateRangeFilter()` function
    - Implement `applyProviderFilter()` function
    - Implement `applyStatusFilter()` function
    - Implement `combineFilters()` function with AND logic
    - Implement `validateDateRange()` function
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_
  
  - [x] 3.2 Write property tests for filtering logic
    - **Property 7: Date Range Filtering**
    - **Property 8: Provider Filtering**
    - **Property 9: Status Filtering**
    - **Property 10: Multi-Filter Combination**
    - **Property 11: Filter Reset Completeness**
    - **Property 13: Date Range Validation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7**
  
  - [x] 3.3 Implement filter persistence
    - Create `saveFiltersToSession()` function
    - Create `loadFiltersFromSession()` function
    - _Requirements: 4.6_
  
  - [x] 3.4 Write property test for filter persistence
    - **Property 12: Filter Persistence Round-Trip**
    - **Validates: Requirements 4.6**

- [x] 4. Create custom React hooks for data management
  - [x] 4.1 Implement useAnalyticsDashboard hook
    - Set up state management for summary, timeSeries, userAttribution (renamed from brokerUsage)
    - Implement data fetching logic with error handling
    - Implement filter application logic
    - Return loading, error, and refetch states
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.2 Implement useRealtimeUpdates hook
    - Set up Firestore snapshot listeners
    - Implement update batching to prevent excessive re-renders
    - Handle connection status tracking
    - Implement cleanup on unmount
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 4.3 Implement useBudgetMonitoring hook
    - Fetch and manage budget configuration
    - Calculate utilization and alert levels
    - Provide budget update functions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 5. Build access control and authentication
  - [x] 5.1 Create SuperAdminRoute component
    - Check user role from AuthContext
    - Redirect non-super-admins to unauthorized page
    - Log access attempts to audit logs
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [x] 5.2 Write property tests for access control
    - **Property 1: Access Control Validation**
    - **Property 2: Access Audit Logging**
    - **Property 3: Permission Re-validation on Auth Changes**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**

- [x] 6. Checkpoint - Ensure core services and hooks work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Build MetricsOverview component
  - [x] 7.1 Create MetricsOverview component
    - Display total API calls card with period comparison
    - Display total cost card with budget utilization
    - Display success rate card with trend indicator
    - Display provider breakdown card (Datapro vs VerifyData)
    - Use shadcn/ui Card components
    - Implement responsive grid layout
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 7.2 Write unit tests for MetricsOverview
    - Test zero state rendering
    - Test metrics display with mock data
    - Test period comparison indicators
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 8. Build UsageCharts component
  - [x] 8.1 Create chart components using Recharts
    - Create DailyCallsLineChart component
    - Create CostComparisonBarChart component
    - Create SuccessFailurePieChart component
    - Create CostTrendsAreaChart component
    - Implement responsive chart sizing
    - Add interactive tooltips with exact values
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 8.2 Write unit tests for chart components
    - Test chart rendering with mock data
    - Test empty state handling
    - Test tooltip content
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 9. Build UserAttributionTable component
  - [x] 9.1 Create UserAttributionTable component
    - Display user list with columns: Name, Email, Role, Total Calls, Cost, Success Rate, Last Activity
    - Implement column sorting functionality (including role sorting)
    - Implement row expansion for detailed view
    - Implement pagination controls
    - Add CSV export button
    - Highlight users exceeding normal usage patterns
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.11_
  
  - [x] 9.2 Write property tests for user attribution
    - **Property 14: User Ranking Correctness**
    - **Property 15: Multi-Column Sorting**
    - **Property 16: User Drill-Down Filtering**
    - **Property 18: Anomaly Detection Threshold**
    - **Property 18a: User Attribution Aggregation by ListId**
    - **Property 18b: User Role Display**
    - **Validates: Requirements 5.1, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11**
  
  - [x] 9.3 Write unit tests for UserAttributionTable
    - Test sorting by different columns (including role)
    - Test row expansion
    - Test pagination
    - Test anomaly highlighting
    - Test role display
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.11_

- [x] 10. Build CostTracker component
  - [x] 10.1 Create CostTracker component
    - Display current month spending
    - Display budget utilization progress bar
    - Display projected end-of-month cost
    - Show warning indicator at 80% utilization
    - Show critical alert at 100% utilization
    - Add budget configuration modal
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 10.2 Write property tests for budget monitoring
    - **Property 21: Budget Alert Thresholds**
    - **Property 22: Budget Configuration Persistence**
    - **Validates: Requirements 6.4, 6.5, 6.6**
  
  - [x] 10.3 Write unit tests for CostTracker
    - Test warning indicator display
    - Test critical alert display
    - Test budget configuration modal
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 11. Build AuditLogsViewer component
  - [x] 11.1 Create AuditLogsViewer component
    - Display logs table with required columns including User column
    - User column displays: name+email for logged-in users, "Customer"/customer name for anonymous, "System" for system actions
    - Implement search functionality (including user name and email search)
    - Implement date range filter
    - Implement status filter dropdown
    - Implement provider filter dropdown
    - Implement user type filter (user/customer/system)
    - Implement row expansion for full details
    - Implement pagination controls
    - Make User column sortable
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 11.2 Write property tests for audit log operations
    - **Property 23: Audit Log Chronological Ordering**
    - **Property 24: Audit Log Completeness**
    - **Property 24a: Audit Log User Type Display**
    - **Property 24b: Audit Log User Column Sorting**
    - **Property 24c: Audit Log User Search**
    - **Property 25: Audit Log Search Filtering (General)**
    - **Property 26: Pagination Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
  
  - [x] 11.3 Write unit tests for AuditLogsViewer
    - Test search filtering (including user search)
    - Test date range filtering
    - Test status and provider filtering
    - Test user type filtering
    - Test pagination
    - Test row expansion
    - Test User column display for different user types
    - Test User column sorting
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 11.4 Update audit log data collection to include user information
  - Update audit logging in server.js to capture userType (user/customer/system)
  - Ensure userName and userEmail are captured for all log entries
  - For customer verifications, extract customer name from verification data
  - For system actions, set userType to 'system' and userName to 'System'
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 12. Checkpoint - Ensure all dashboard components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement report generation functionality
  - [x] 13.1 Create ReportService class
    - Implement `generatePDFReport()` using jsPDF library
    - Implement `generateExcelReport()` using xlsx library
    - Implement `generateCSVReport()` function
    - Implement report size validation
    - _Requirements: 9.1, 9.2, 9.3, 9.8_
  
  - [x] 13.2 Create ReportGenerator component
    - Add format selection radio buttons (PDF, Excel, CSV)
    - Add section selection checkboxes
    - Add date range picker for report
    - Add generate button with loading state
    - Implement download trigger
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [x] 13.3 Write property tests for report generation
    - **Property 27: CSV Generation Correctness**
    - **Property 28: Report Filter Consistency**
    - **Property 29: Report Metadata Completeness**
    - **Property 30: Selective Report Generation**
    - **Property 31: Report Size Validation**
    - **Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7, 9.8**
  
  - [x] 13.4 Write unit tests for ReportGenerator
    - Test format selection
    - Test section selection
    - Test report generation with filters
    - Test size limit validation
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.8_

- [x] 14. Build main dashboard page and layout
  - [x] 14.1 Create AdminAnalyticsDashboard page component
    - Set up page layout with header and navigation
    - Add filter controls section (date range, provider, status)
    - Integrate MetricsOverview component
    - Integrate UsageCharts component
    - Integrate UserAttributionTable component (renamed from BrokerAttributionTable)
    - Integrate CostTracker component
    - Integrate AuditLogsViewer component
    - Integrate ReportGenerator component
    - Implement responsive layout (mobile, tablet, desktop)
    - _Requirements: 2.1-2.7, 3.1-3.7, 4.1-4.7, 5.1-5.12, 6.1-6.8, 7.1-7.8, 8.1-8.6, 9.1-9.8, 11.1-11.7_
  
  - [x] 14.2 Add route protection
    - Wrap route with SuperAdminRoute component
    - Add route to App.tsx router configuration
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 14.3 Write integration tests for dashboard page
    - Test full dashboard load
    - Test filter application across all components
    - Test real-time updates
    - _Requirements: 2.1-2.7, 4.1-4.7, 10.1-10.7_

- [x] 15. Implement error handling and user feedback
  - [x] 15.1 Create error handling utilities
    - Create ErrorBoundary component for React errors
    - Create error toast notification system
    - Create connection status indicator component
    - Implement retry logic for failed operations
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [x] 15.2 Write property tests for error handling
    - **Property 32: Error Message Inclusion**
    - **Property 33: Error Logging Completeness**
    - **Validates: Requirements 13.2, 13.5**
  
  - [x] 15.3 Write unit tests for error handling
    - Test error boundary catches errors
    - Test error toast displays
    - Test retry functionality
    - Test connection status indicator
    - _Requirements: 13.1, 13.3, 13.4, 13.6_

- [x] 16. Add Firestore indexes and optimize queries
  - [x] 16.1 Create Firestore composite indexes
    - Add index for `api-usage`: (date, provider)
    - Add index for `api-usage-logs`: (listId, timestamp) - NEW for user attribution
    - Add index for `api-usage-logs`: (userId, timestamp) - KEEP for backward compatibility
    - Add index for `verification-audit-logs`: (timestamp, status, provider)
    - Add index for `verification-audit-logs`: (userType, timestamp) - NEW for user type filtering
    - Update `firestore.indexes.json` file
    - _Requirements: 12.2, 12.5_
  
  - [x] 16.2 Implement query optimization
    - Add query result caching in browser storage
    - Implement pagination for large datasets
    - Add loading indicators during data fetch
    - _Requirements: 12.3, 12.4, 12.6, 12.7_

- [x] 17. Implement mobile-responsive design
  - [x] 17.1 Add responsive CSS and layout adjustments
    - Create mobile-optimized chart layouts
    - Implement responsive grid for metrics cards
    - Add touch-friendly controls for mobile
    - Implement collapsible sections for mobile
    - Test on mobile, tablet, and desktop viewports
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 18. Final checkpoint and integration testing
  - [x] 18.1 Run full test suite
    - Execute all unit tests
    - Execute all property-based tests
    - Execute integration tests
    - Verify test coverage meets goals (>80% for business logic)
    - _Requirements: All_
  
  - [x] 18.2 Manual testing and polish
    - Test complete user workflows
    - Verify real-time updates work correctly
    - Test report generation for all formats
    - Verify mobile responsiveness
    - Test error scenarios and recovery
    - _Requirements: All_

- [x] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All test tasks are required for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses backend-first architecture with authenticated API endpoints
- Backend endpoints use existing utilities (apiUsageTracker.cjs, auditLogger.cjs)
