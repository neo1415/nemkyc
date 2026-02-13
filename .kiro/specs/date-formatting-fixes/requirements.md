# Requirements Document: Date Formatting Fixes

## Introduction

This specification addresses critical date formatting and JSON parsing issues discovered in the application. The primary issues include:

1. **"Invalid Date" in verification link resend messages** - When admins resend verification links, the success message shows "Invalid Date" for the expiration
2. **Datapro API JSON parsing failures** - The Datapro API sometimes returns empty responses causing "Unexpected end of JSON input" errors
3. **Inconsistent date formatting** - Multiple places use different date formatting approaches without validation
4. **CAC verification susceptibility** - The same JSON parsing issue affects CAC verification since it uses similar API patterns

These issues cause verification failures and poor user experience. The root causes are:
- Backend returning Date objects that serialize inconsistently
- Frontend not validating dates before formatting
- API response parser not handling empty/malformed responses
- No centralized date formatting utilities

## Glossary

- **Date_Formatter**: A utility module responsible for consistently formatting dates across the application
- **Date_Validator**: A utility module that validates date values before formatting
- **API_Response_Parser**: A utility module that safely parses JSON responses with proper error handling
- **Verification_Link**: A time-limited URL sent to users for identity verification
- **Datapro_API**: An external API service used for NIN (National Identity Number) verification
- **Verifydata_API**: An external API service used for CAC (Corporate Affairs Commission) verification
- **ISO_String**: A standardized date format (ISO 8601) used for date serialization
- **Firestore_Timestamp**: Firebase's timestamp object that requires conversion to JavaScript Date
- **Frontend**: The React/TypeScript client application
- **Backend**: The Node.js Express server application

## Requirements

### Requirement 1: Date Validation

**User Story:** As a developer, I want all date values validated before formatting, so that users never see "Invalid Date" in the UI.

#### Acceptance Criteria

1. THE Date_Validator SHALL verify that a value is a valid date before any formatting operation
2. WHEN a date value is null or undefined, THE Date_Validator SHALL return a default fallback value
3. WHEN a date value cannot be parsed, THE Date_Validator SHALL return a default fallback value
4. WHEN a Firestore_Timestamp is provided, THE Date_Validator SHALL convert it to a JavaScript Date
5. WHEN an ISO_String is provided, THE Date_Validator SHALL parse it to a JavaScript Date
6. THE Date_Validator SHALL check for NaN after date parsing using isNaN(date.getTime())

### Requirement 2: Consistent Date Formatting

**User Story:** As a user, I want dates displayed consistently throughout the application, so that I can easily understand temporal information.

#### Acceptance Criteria

1. THE Date_Formatter SHALL provide a single function for formatting dates to locale strings
2. THE Date_Formatter SHALL accept configuration options for date format (short, long, full)
3. WHEN formatting dates for display, THE Date_Formatter SHALL use the Date_Validator first
4. THE Date_Formatter SHALL support both date-only and date-time formatting
5. THE Date_Formatter SHALL use consistent locale settings across all date displays
6. THE Date_Formatter SHALL handle Firestore_Timestamp objects automatically

### Requirement 3: Verification Link Expiration Display

**User Story:** As an admin, I want to see valid expiration dates when resending verification links, so that I can inform users accurately.

#### Acceptance Criteria

1. WHEN the Backend returns newExpiresAt as an ISO_String, THE Frontend SHALL parse it correctly
2. WHEN displaying the expiration date, THE Frontend SHALL validate the date before formatting
3. IF the date is invalid, THE Frontend SHALL display a fallback message without showing "Invalid Date"
4. THE Frontend SHALL use the Date_Formatter utility for all expiration date displays
5. THE Backend SHALL consistently return dates as ISO_String format in JSON responses

### Requirement 4: JSON Response Parsing

**User Story:** As a developer, I want robust JSON parsing for API responses, so that empty or malformed responses don't crash the application.

#### Acceptance Criteria

1. WHEN the API_Response_Parser receives an empty response body, THE system SHALL handle it gracefully without throwing errors
2. WHEN the response body is an empty string, THE API_Response_Parser SHALL return a structured error response
3. WHEN JSON.parse fails, THE API_Response_Parser SHALL catch the error and return a structured error response
4. THE API_Response_Parser SHALL check if data is empty or whitespace-only before calling JSON.parse
5. THE API_Response_Parser SHALL log parsing errors with sufficient context for debugging
6. WHEN a parsing error occurs, THE API_Response_Parser SHALL return an error object with errorCode 'PARSE_ERROR'
7. THE API_Response_Parser SHALL include the raw response length in error logs

### Requirement 5: Datapro and Verifydata API Error Handling

**User Story:** As a system administrator, I want detailed error information when external API calls fail, so that I can diagnose and resolve issues quickly.

#### Acceptance Criteria

1. WHEN the Datapro_API returns an empty response, THE system SHALL log the error with request context including NIN (masked)
2. WHEN the Verifydata API returns an empty response, THE system SHALL log the error with request context including CAC number (masked)
3. WHEN JSON parsing fails for external API responses, THE system SHALL return a user-friendly error message
4. THE system SHALL include the HTTP status code and response length in error responses
5. THE system SHALL mask sensitive data (NIN, CAC) in error logs
6. WHEN a PARSE_ERROR occurs, THE system SHALL include the original parse error message in details
7. THE system SHALL retry the request if the error is a parsing error (up to MAX_RETRIES)
8. WHEN retrying after a parse error, THE system SHALL log each retry attempt

### Requirement 6: Backend Date Serialization

**User Story:** As a backend developer, I want consistent date serialization in API responses, so that the frontend can reliably parse dates.

#### Acceptance Criteria

1. THE Backend SHALL convert all Date objects to ISO_String format before sending JSON responses
2. THE Backend SHALL document the date format in API response type definitions
3. WHEN creating Firestore_Timestamp objects, THE Backend SHALL use admin.firestore.Timestamp.fromDate()
4. THE Backend SHALL not send raw Date objects in JSON responses
5. THE Backend SHALL validate dates before serialization

### Requirement 7: Frontend Date Parsing

**User Story:** As a frontend developer, I want a reliable way to parse dates from API responses, so that date displays are always valid.

#### Acceptance Criteria

1. THE Frontend SHALL use the Date_Validator for all dates received from API responses
2. THE Frontend SHALL handle both ISO_String and Firestore_Timestamp formats
3. WHEN parsing fails, THE Frontend SHALL display a user-friendly fallback message
4. THE Frontend SHALL not call toLocaleDateString() without prior validation
5. THE Frontend SHALL use the Date_Formatter utility for all date displays

### Requirement 8: Error Message Consistency

**User Story:** As a user, I want clear error messages when date-related operations fail, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN a date cannot be formatted, THE system SHALL display "Date unavailable" instead of "Invalid Date"
2. WHEN a verification link expiration cannot be determined, THE system SHALL display "Expiration date unavailable"
3. THE system SHALL log the underlying error for debugging while showing user-friendly messages
4. THE system SHALL not expose technical error details to end users
5. THE system SHALL provide actionable error messages when possible

### Requirement 9: Type Safety

**User Story:** As a developer, I want TypeScript type definitions for date-related utilities, so that I catch errors at compile time.

#### Acceptance Criteria

1. THE Date_Formatter SHALL have complete TypeScript type definitions
2. THE Date_Validator SHALL have complete TypeScript type definitions
3. THE API_Response_Parser SHALL have complete TypeScript type definitions
4. THE system SHALL define types for date format options
5. THE system SHALL define types for API response structures containing dates
6. THE system SHALL use strict null checks for date-related functions

### Requirement 10: Testing Coverage

**User Story:** As a developer, I want comprehensive tests for date formatting utilities, so that I can refactor with confidence.

#### Acceptance Criteria

1. THE system SHALL include unit tests for Date_Validator with various input types
2. THE system SHALL include unit tests for Date_Formatter with various format options
3. THE system SHALL include unit tests for API_Response_Parser with empty and malformed responses
4. THE system SHALL include integration tests for the verification link resend flow
5. THE system SHALL include tests for Firestore_Timestamp conversion
6. THE system SHALL include property-based tests for date validation and formatting

### Requirement 11: Verifydata Client Consistency

**User Story:** As a developer, I want the Verifydata client (used for CAC verification) to have the same robust error handling as Datapro, so that both verification types are equally reliable.

#### Acceptance Criteria

1. THE Verifydata client SHALL use the same JSON parsing approach as the Datapro client
2. THE Verifydata client SHALL check for empty responses before parsing
3. THE Verifydata client SHALL return structured error responses with errorCode 'PARSE_ERROR'
4. THE Verifydata client SHALL mask sensitive CAC numbers in logs
5. THE Verifydata client SHALL include response length in error logs
6. THE Verifydata client SHALL handle all the same error cases as the Datapro client
