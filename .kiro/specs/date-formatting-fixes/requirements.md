# Requirements Document

## Introduction

This specification addresses date formatting issues throughout the application where dates from API responses are not properly parsed before being formatted, resulting in "Invalid Date" displays. The primary issue occurs when the server returns Date objects that get serialized to JSON, and the frontend attempts to format them without proper parsing. This affects verification link expiration messages, form viewers, and other date displays across the application.

## Glossary

- **Date_Formatter**: A utility function that safely formats dates from various input types
- **API_Response**: Data returned from server endpoints that may contain serialized dates
- **Firebase_Timestamp**: Firestore timestamp objects with toDate() method
- **ISO_String**: Date string in ISO 8601 format (e.g., "2024-02-18T10:30:00.000Z")
- **Serialized_Date**: Date object converted to JSON string representation
- **Frontend**: Client-side React application
- **Backend**: Server-side Express API

## Requirements

### Requirement 1: Safe Date Formatting Utility

**User Story:** As a developer, I want a centralized date formatting utility, so that all date displays handle various formats consistently and safely.

#### Acceptance Criteria

1. THE Date_Formatter SHALL accept Date objects, ISO strings, Firebase Timestamps, serialized dates, and null/undefined values as input
2. WHEN an invalid date value is provided, THE Date_Formatter SHALL return a fallback string instead of "Invalid Date"
3. WHEN a Firebase Timestamp is provided, THE Date_Formatter SHALL call toDate() before formatting
4. WHEN a serialized date string is provided, THE Date_Formatter SHALL parse it to a Date object before formatting
5. THE Date_Formatter SHALL provide consistent formatting options (short date, long date, date with time)

### Requirement 2: Verification Link Expiration Display

**User Story:** As an admin, I want to see properly formatted expiration dates when resending verification links, so that I know when the links will expire.

#### Acceptance Criteria

1. WHEN a verification link is resent successfully, THE System SHALL display the expiration date in a readable format
2. WHEN the API returns a date in the response, THE Frontend SHALL parse it before formatting
3. IF the expiration date cannot be parsed, THEN THE System SHALL display "N/A" instead of "Invalid Date"
4. THE System SHALL display dates in the format "Month Day, Year" (e.g., "February 18, 2026")

### Requirement 3: Form Viewer Date Handling

**User Story:** As a user viewing form submissions, I want all dates to display correctly, so that I can understand when events occurred.

#### Acceptance Criteria

1. WHEN displaying dates in FormViewer, THE System SHALL handle Date objects, ISO strings, and Firebase Timestamps
2. WHEN a date field is empty or invalid, THE System SHALL display "N/A" instead of "Invalid Date"
3. WHEN displaying time fields, THE System SHALL format them consistently as HH:MM
4. THE System SHALL apply the same date formatting logic to both admin and user form viewers

### Requirement 4: Identity List Date Columns

**User Story:** As an admin viewing identity lists, I want date columns to display correctly, so that I can track when links were sent and when verifications occurred.

#### Acceptance Criteria

1. WHEN displaying "Link Sent At" column, THE System SHALL format dates consistently
2. WHEN displaying "Verified At" column, THE System SHALL format dates consistently
3. WHEN a date value is missing, THE System SHALL display "-" instead of "Invalid Date"
4. THE System SHALL handle both Firebase Timestamps and serialized dates from the API

### Requirement 5: Comprehensive Date Audit

**User Story:** As a developer, I want to identify all date formatting locations in the codebase, so that I can ensure consistent handling everywhere.

#### Acceptance Criteria

1. THE System SHALL audit all uses of toLocaleDateString() in the codebase
2. THE System SHALL audit all uses of toLocaleTimeString() in the codebase
3. THE System SHALL audit all date formatting in API response handlers
4. THE System SHALL replace direct date formatting calls with the safe Date_Formatter utility
5. THE System SHALL document any edge cases or special date handling requirements

### Requirement 6: API Response Date Handling

**User Story:** As a developer, I want API responses to include dates in a format that can be reliably parsed by the frontend, so that date displays work correctly.

#### Acceptance Criteria

1. WHEN the backend returns dates in API responses, THE System SHALL use ISO string format
2. WHEN the frontend receives API responses with dates, THE System SHALL parse them before use
3. THE System SHALL handle cases where dates are already Date objects (for backward compatibility)
4. THE System SHALL log warnings when date parsing fails to aid debugging

### Requirement 7: Error Handling and Fallbacks

**User Story:** As a user, I want to see meaningful fallback text when dates cannot be displayed, so that I'm not confused by "Invalid Date" messages.

#### Acceptance Criteria

1. WHEN a date cannot be parsed, THE System SHALL display "N/A" for optional fields
2. WHEN a date cannot be parsed, THE System SHALL display "Not set" for fields that should have values
3. WHEN a date parsing error occurs, THE System SHALL log the error for debugging
4. THE System SHALL never display "Invalid Date" to end users
