# Requirements Document: Analytics Data Fixes

## Introduction

This specification addresses critical data integrity and accuracy issues in the API Analytics Dashboard. The system currently suffers from missing timestamps, duplicate audit entries, incorrect cost tracking, poor user attribution, broken aggregations, non-functional filters, and incorrect calculations. These issues prevent administrators from accurately monitoring API usage, tracking costs, and attributing usage to the correct users and brokers.

## Glossary

- **API_Usage_Tracker**: The system component responsible for logging API calls to the api-usage-logs collection
- **Audit_Logger**: The system component responsible for logging verification attempts to the verification-audit-logs collection
- **Analytics_Dashboard**: The frontend interface displaying API usage metrics, costs, and audit logs
- **Analytics_API**: The backend endpoints serving aggregated analytics data
- **Verification_Provider**: External API services (Datapro for NIN, VerifyData for CAC)
- **Broker**: A user who creates identity lists and initiates verifications
- **Customer**: An end-user who verifies their identity via a broker-provided link
- **Identity_List**: A collection of records created by a broker for verification
- **Cost_Per_Call**: Fixed cost for API calls (₦50 for Datapro, ₦100 for VerifyData)

## Requirements

### Requirement 1: Timestamp Storage

**User Story:** As an administrator, I want to see when each API call occurred, so that I can track usage patterns over time.

#### Acceptance Criteria

1. WHEN an API call is logged, THE API_Usage_Tracker SHALL store a timestamp field with the current date and time
2. WHEN retrieving API usage records, THE System SHALL return the timestamp in ISO 8601 format
3. WHEN displaying the user attribution table, THE Analytics_Dashboard SHALL show the lastActivity timestamp for each user
4. THE timestamp field SHALL be indexed in the api-usage-logs collection for efficient querying

### Requirement 2: Single Audit Log Entry Per Verification

**User Story:** As an administrator, I want to see one audit log entry per verification attempt, so that I can accurately count verification attempts.

#### Acceptance Criteria

1. WHEN a verification is performed, THE System SHALL create exactly one audit log entry
2. THE audit log entry SHALL contain complete user information (userName, userEmail, userId)
3. THE System SHALL NOT create duplicate entries with "Unknown User" information
4. WHEN both logVerificationAttempt() and trackDataproAPICall()/trackVerifydataAPICall() are called, THE System SHALL consolidate logging into a single entry

### Requirement 3: Cost Storage and Tracking

**User Story:** As an administrator, I want to see the actual cost of each verification, so that I can track total spending accurately.

#### Acceptance Criteria

1. WHEN a Datapro verification succeeds (HTTP 200 with ResponseCode "00"), THE System SHALL store a cost of ₦50
2. WHEN a VerifyData verification succeeds (HTTP 200 with "success": true), THE System SHALL store a cost of ₦100
3. WHEN a verification fails (HTTP 400, 401, 500, or error status codes), THE System SHALL store a cost of ₦0
4. THE cost field SHALL be stored in both verification-audit-logs and api-usage-logs collections
5. WHEN displaying audit logs, THE Analytics_Dashboard SHALL show the actual cost (₦50, ₦100, or ₦0) for each verification

### Requirement 4: User Attribution Data Capture

**User Story:** As an administrator, I want to see which broker created each identity list, so that I can attribute API usage to the correct user.

#### Acceptance Criteria

1. WHEN logging an API call, THE API_Usage_Tracker SHALL look up the identity list's createdBy field
2. THE API_Usage_Tracker SHALL store the broker's userName and userEmail from the users collection
3. WHEN the createdBy user is found, THE System SHALL store their information instead of "unknown"
4. WHEN displaying the user attribution table, THE Analytics_Dashboard SHALL show actual broker names and emails

### Requirement 5: Provider Breakdown Aggregation

**User Story:** As an administrator, I want to see accurate call counts by provider, so that I can understand which verification services are being used most.

#### Acceptance Criteria

1. WHEN the overview endpoint is called, THE Analytics_API SHALL query the api-usage-logs collection
2. THE Analytics_API SHALL aggregate calls by provider field (Datapro, VerifyData)
3. THE Analytics_API SHALL return the total count of calls for each provider
4. WHEN displaying the overview metrics, THE Analytics_Dashboard SHALL show non-zero counts for providers with usage

### Requirement 6: Time-Series Chart Data

**User Story:** As an administrator, I want to see usage trends over time in charts, so that I can identify patterns and anomalies.

#### Acceptance Criteria

1. WHEN the analytics endpoint is called with a date range, THE Analytics_API SHALL return daily usage data
2. THE daily usage data SHALL include date, totalCalls, successfulCalls, and failedCalls for each day
3. THE data SHALL be sorted chronologically by date
4. WHEN the Analytics_Dashboard receives chart data, THE System SHALL display it in line charts
5. WHEN no data exists for the date range, THE System SHALL return an empty array instead of null

### Requirement 7: Broker Attribution in Audit Logs

**User Story:** As an administrator, I want to see which broker created the list for each verification, so that I can attribute customer verifications to the correct broker.

#### Acceptance Criteria

1. WHEN a customer verifies via a link, THE System SHALL look up the identity list's createdBy field
2. THE Audit_Logger SHALL store the broker's information (userName, userEmail, userId) in the audit log
3. THE audit log SHALL distinguish between the broker (list creator) and the customer (person verifying)
4. WHEN displaying audit logs, THE Analytics_Dashboard SHALL show the broker's name instead of "anonymous"

### Requirement 8: Total Cost Calculation

**User Story:** As an administrator, I want to see accurate total costs, so that I can track spending correctly.

#### Acceptance Criteria

1. WHEN calculating total cost for a user, THE System SHALL sum the cost of only successful API calls (where cost > 0)
2. THE cost calculation SHALL use the stored cost field from api-usage-logs
3. WHEN displaying user attribution, THE Analytics_Dashboard SHALL show correct individual and total costs
4. THE total cost SHALL equal the sum of all individual user costs
5. WHEN a call fails, THE System SHALL NOT include its ₦0 cost in spending calculations

### Requirement 9: Filter Functionality

**User Story:** As an administrator, I want to filter analytics data by date range, provider, and status, so that I can analyze specific subsets of data.

#### Acceptance Criteria

1. WHEN a date range filter is applied, THE Analytics_Dashboard SHALL pass startDate and endDate parameters to the Analytics_API
2. WHEN a provider filter is applied, THE Analytics_Dashboard SHALL pass the provider parameter to the Analytics_API
3. WHEN a status filter is applied, THE Analytics_Dashboard SHALL pass the status parameter to the Analytics_API
4. THE Analytics_API SHALL apply all provided filters to database queries
5. WHEN filters are changed, THE Analytics_Dashboard SHALL refresh all displayed data

### Requirement 10: Success Rate Calculation

**User Story:** As an administrator, I want to see accurate success rates, so that I can monitor API reliability.

#### Acceptance Criteria

1. THE success rate SHALL be calculated as (successfulCalls / totalCalls) * 100
2. WHEN totalCalls is zero, THE System SHALL return a success rate of 0
3. THE success rate SHALL be rounded to two decimal places
4. WHEN displaying metrics, THE Analytics_Dashboard SHALL show the success rate as a percentage
