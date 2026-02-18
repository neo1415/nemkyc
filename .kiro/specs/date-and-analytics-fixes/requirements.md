# Requirements Document

## Introduction

This specification addresses two critical production issues affecting the identity verification system:

1. "Date unavailable" appearing throughout the AdminUnifiedTable UI when displaying verification records
2. Analytics API endpoints (/api/analytics/overview, /api/analytics/cost-tracking, /api/analytics/user-attribution) returning 500 errors

These issues have been impacting production for over a week, preventing administrators from viewing verification records properly and accessing critical analytics data.

## Glossary

- **AdminUnifiedTable**: React component that displays verification records in a data grid format
- **dateFormatter**: Centralized utility module for formatting dates with validation and fallback handling
- **dateValidator**: Utility module for validating date values from various sources (Firestore Timestamps, Date objects, strings, numbers)
- **Analytics_API**: Backend REST API endpoints that provide usage statistics, cost tracking, and user attribution data
- **api-usage-logs**: Firestore collection storing individual API call records with timestamp, date, and month fields
- **Firestore_Timestamp**: Firebase Firestore timestamp object with toDate() method
- **Empty_Object**: JavaScript object {} returned by Firestore for null/undefined date fields

## Requirements

### Requirement 1: Standardize Date Formatting in AdminUnifiedTable

**User Story:** As an administrator, I want to see properly formatted dates in the verification records table, so that I can understand when verifications occurred.

#### Acceptance Criteria

1. WHEN AdminUnifiedTable displays a date field, THE System SHALL use the centralized dateFormatter utility
2. WHEN a date value is invalid or missing, THE System SHALL display "Date unavailable" as the fallback message
3. WHEN Firestore returns an empty object {} for a date field, THE dateValidator SHALL treat it as invalid
4. WHEN a Firestore Timestamp is provided, THE dateFormatter SHALL convert it using toDate() before formatting
5. THE AdminUnifiedTable SHALL NOT implement its own custom formatDate function

### Requirement 2: Handle Firestore Empty Objects Gracefully

**User Story:** As a developer, I want the date validation system to handle Firestore's empty object responses, so that invalid dates are properly detected and handled.

#### Acceptance Criteria

1. WHEN dateValidator receives an empty object {}, THE System SHALL return isValid: false
2. WHEN dateValidator receives an object with no toDate method and no valid date properties, THE System SHALL return isValid: false
3. WHEN dateValidator encounters an object that is not a Date, Timestamp, string, or number, THE System SHALL return isValid: false
4. WHEN dateFormatter receives an invalid date value, THE System SHALL return the configured fallback string

### Requirement 3: Add Error Handling to Analytics API Endpoints

**User Story:** As a super administrator, I want analytics API endpoints to return meaningful error messages instead of 500 errors, so that I can understand what went wrong.

#### Acceptance Criteria

1. WHEN an analytics API endpoint encounters an error, THE System SHALL return a structured error response with error type and message
2. WHEN a Firestore query fails, THE System SHALL log the specific query parameters and error details
3. WHEN date parameter validation fails, THE System SHALL return a 400 error with validation details
4. WHEN a Firestore index is missing, THE System SHALL return a 500 error with index creation instructions
5. THE System SHALL NOT expose internal error stack traces to API clients

### Requirement 4: Validate Date Parameters Before Querying

**User Story:** As a developer, I want all date inputs validated before creating Firestore queries, so that invalid date strings don't cause query failures.

#### Acceptance Criteria

1. WHEN an analytics endpoint receives startDate and endDate parameters, THE System SHALL validate they match YYYY-MM-DD format
2. WHEN creating a Date object from a string parameter, THE System SHALL verify the resulting Date is valid
3. WHEN constructing date range queries, THE System SHALL ensure startDate is before or equal to endDate
4. WHEN appending time strings to dates (e.g., 'T23:59:59'), THE System SHALL validate the final date string is valid
5. IF date validation fails, THEN THE System SHALL return a 400 error before executing any Firestore queries

### Requirement 5: Improve Analytics API Error Logging

**User Story:** As a developer, I want detailed error logs for analytics API failures, so that I can quickly identify and fix the root cause.

#### Acceptance Criteria

1. WHEN an analytics query fails, THE System SHALL log the collection name, query parameters, and error message
2. WHEN a date parsing error occurs, THE System SHALL log the original date string and the parsing attempt
3. WHEN a Firestore query returns an error, THE System SHALL log whether it's an index error, permission error, or other error type
4. THE System SHALL include request IDs in error logs to correlate client requests with server errors
5. THE System SHALL log the user email and IP address for failed analytics requests to the audit system

### Requirement 6: Document Required Firestore Indexes

**User Story:** As a developer, I want clear documentation of required Firestore composite indexes, so that I can ensure they exist before deploying.

#### Acceptance Criteria

1. THE System SHALL document all composite indexes required for analytics queries
2. WHEN an index is missing, THE error message SHALL include the exact index configuration needed
3. THE documentation SHALL specify which queries require which indexes
4. THE System SHALL provide firestore.indexes.json entries for all required indexes
5. THE documentation SHALL explain how to create indexes using Firebase CLI or console

### Requirement 7: Add Defensive Date Validation Throughout

**User Story:** As a developer, I want consistent date validation across all date handling code, so that edge cases are handled uniformly.

#### Acceptance Criteria

1. WHEN any component receives a date value, THE System SHALL validate it using dateValidator before processing
2. WHEN a date value is null, undefined, or an empty object, THE System SHALL treat it as invalid
3. WHEN a date string is in an unexpected format, THE System SHALL attempt parsing and validate the result
4. WHEN a Firestore Timestamp has a toDate method, THE System SHALL call it and validate the resulting Date
5. THE System SHALL handle all date edge cases: null, undefined, {}, invalid strings, NaN timestamps, and malformed objects

### Requirement 8: Ensure Consistent Field Names in Analytics Queries

**User Story:** As a developer, I want analytics queries to use consistent field names that match the api-usage-logs schema, so that queries return correct results.

#### Acceptance Criteria

1. WHEN querying api-usage-logs by month, THE System SHALL use the 'month' field
2. WHEN querying api-usage-logs by date range, THE System SHALL use the 'date' field for YYYY-MM-DD comparisons
3. WHEN querying api-usage-logs by timestamp range, THE System SHALL use the 'timestamp' field for Date object comparisons
4. THE System SHALL NOT mix field names within a single query (e.g., don't query by both 'date' and 'timestamp')
5. THE documentation SHALL specify which field to use for which type of query

### Requirement 9: Add Try-Catch Blocks Around All Firestore Queries

**User Story:** As a developer, I want all Firestore queries wrapped in try-catch blocks, so that query failures don't crash the API endpoint.

#### Acceptance Criteria

1. WHEN executing a Firestore query, THE System SHALL wrap it in a try-catch block
2. WHEN a query fails, THE System SHALL catch the error and return a structured error response
3. WHEN multiple queries are executed sequentially, THE System SHALL handle each query's errors independently
4. WHEN a query succeeds but data processing fails, THE System SHALL catch and handle the processing error
5. THE System SHALL ensure no unhandled promise rejections occur in analytics endpoints

### Requirement 10: Return Meaningful Error Messages Instead of 500 Errors

**User Story:** As a super administrator, I want clear error messages when analytics requests fail, so that I can take corrective action.

#### Acceptance Criteria

1. WHEN date parameters are invalid, THE System SHALL return "Invalid date format" with expected format
2. WHEN a date range is invalid, THE System SHALL return "Invalid date range" with the specific issue
3. WHEN a Firestore index is missing, THE System SHALL return "Missing database index" with index details
4. WHEN a query times out, THE System SHALL return "Query timeout" with suggestions to narrow the date range
5. WHEN an unexpected error occurs, THE System SHALL return "Internal server error" with a request ID for support
