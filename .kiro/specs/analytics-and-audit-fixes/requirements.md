# Requirements Document

## Introduction

This specification addresses three critical issues in the analytics dashboard and audit logging system for the identity verification platform:

1. **Cost Tracker Missing Failed Verification Costs**: The CostTracker component incorrectly calculates total spending by excluding failed verification costs, while MetricsOverview correctly includes them.

2. **Budget Save Button No Feedback**: The Budget Configuration dialog provides no user feedback when the "Save Budget" button is clicked, leaving users uncertain whether their changes were saved.

3. **Audit Logs Show Wrong User**: The audit logs currently capture the broker's context (the person who created the identity list) instead of the customer's context (the person who actually performed the verification), making it impossible to track which customer verified their identity.

## Glossary

- **CostTracker**: Frontend component that displays current spending, budget utilization, and projected costs
- **MetricsOverview**: Frontend component that displays summary metrics including total cost across all verifications
- **Backend_Cost_API**: Backend API endpoint (`/api/analytics/cost-tracking`) that calculates and returns cost tracking data
- **AuditLogsViewer**: Frontend component that displays audit log entries in a searchable, filterable table
- **Audit_Logger**: Backend service (`auditLogger.cjs`) that creates audit log entries for verification attempts
- **Customer**: The end user who clicks a verification link and submits their identity information (NIN/CAC)
- **Broker**: The insurance agent who creates identity lists and sends verification links to customers
- **Identity_Entry**: A record in an identity list containing customer information (name, email, NIN/CAC) and a unique verification token
- **Verification_Token**: A unique token embedded in verification links that maps to a specific Identity_Entry
- **Failed_Verification**: A verification attempt where the API provider returns an error or the identity information doesn't match
- **Budget_Config**: User-configurable monthly spending limit stored in Firestore

## Requirements

### Requirement 1: Cost Tracker Accuracy

**User Story:** As a super admin, I want the Cost Tracker to show accurate total spending including both successful and failed verifications, so that I can monitor actual API costs.

#### Acceptance Criteria

1. WHEN the Backend_Cost_API calculates current spending, THE Backend_Cost_API SHALL include costs from both successful and failed verification attempts
2. WHEN a verification fails, THE Backend_Cost_API SHALL include the API provider's cost in the total spending calculation
3. WHEN the CostTracker displays current spending, THE CostTracker SHALL match the total cost shown in MetricsOverview
4. FOR ALL time periods, the sum of individual verification costs SHALL equal the total cost displayed in CostTracker

### Requirement 2: Budget Configuration Feedback

**User Story:** As a super admin, I want to receive clear feedback when I save budget configuration changes, so that I know whether my changes were successfully saved.

#### Acceptance Criteria

1. WHEN a user clicks the "Save Budget" button, THE System SHALL display a success toast notification if the save operation succeeds
2. WHEN a user clicks the "Save Budget" button, THE System SHALL display an error toast notification if the save operation fails
3. WHEN the save operation succeeds, THE System SHALL close the Budget Configuration dialog
4. WHEN the save operation fails, THE System SHALL keep the Budget Configuration dialog open and display the error message
5. WHEN a toast notification is displayed, THE System SHALL automatically dismiss it after 3 seconds

### Requirement 3: Customer Context in Audit Logs

**User Story:** As a super admin, I want audit logs to show which customer performed each verification, so that I can track customer verification activity and compliance.

#### Acceptance Criteria

1. WHEN a customer submits a verification through a token link, THE Audit_Logger SHALL capture the customer's name from the Identity_Entry
2. WHEN a customer submits a verification through a token link, THE Audit_Logger SHALL capture the customer's email from the Identity_Entry
3. WHEN creating an audit log entry, THE Audit_Logger SHALL use the verification token to look up the associated Identity_Entry
4. WHEN the AuditLogsViewer displays audit logs, THE AuditLogsViewer SHALL show the customer's name in the "User" column
5. WHEN the AuditLogsViewer displays audit logs, THE AuditLogsViewer SHALL show the customer's email in the expanded row details
6. FOR ALL customer-initiated verifications, the audit log SHALL contain customer information, not broker information

### Requirement 4: Audit Log Data Integrity

**User Story:** As a super admin, I want audit logs to contain complete and accurate information about each verification, so that I can perform compliance audits and troubleshooting.

#### Acceptance Criteria

1. WHEN a verification is performed, THE Audit_Logger SHALL record the verification type (NIN or CAC)
2. WHEN a verification is performed, THE Audit_Logger SHALL record the verification status (success or failure)
3. WHEN a verification is performed, THE Audit_Logger SHALL record the API provider cost
4. WHEN a verification is performed, THE Audit_Logger SHALL record the timestamp
5. WHEN a verification fails, THE Audit_Logger SHALL record the error message
6. FOR ALL audit log entries, all required fields SHALL be populated with valid data

### Requirement 5: Token-to-Customer Mapping

**User Story:** As a developer, I want a reliable mechanism to map verification tokens to customer information, so that audit logs can accurately attribute verifications to customers.

#### Acceptance Criteria

1. WHEN a verification request includes a token, THE System SHALL query the Identity_Entry collection using the token
2. WHEN an Identity_Entry is found, THE System SHALL extract the customer name, email, and verification type
3. WHEN an Identity_Entry is not found, THE System SHALL log an error and use "Unknown Customer" as the user name
4. WHEN passing customer context to the Audit_Logger, THE System SHALL include all available customer fields from the Identity_Entry
5. FOR ALL token-based verifications, the token SHALL be validated before extracting customer information
