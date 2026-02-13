# Implementation Plan: Date Formatting Fixes

## Overview

This implementation plan addresses date formatting and JSON parsing issues by creating centralized utilities and updating existing code to use them. The approach is incremental: create utilities first, add tests, then migrate existing code.

## Tasks

- [x] 1. Create Date Validator utility (Backend)
  - Create `server-utils/dateValidator.cjs` with CommonJS exports
  - Implement `validateDate(value, options)` function
  - Implement `isValidDate(value)` function
  - Implement `normalizeDate(value)` function
  - Handle Date objects, ISO strings, Firestore Timestamps, numbers, null/undefined
  - Check for NaN using `isNaN(date.getTime())`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 1.1 Write property test for Date Validator (Backend)
  - **Property 1: Date Validator Handles All Input Types**
  - **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6**
  - Test with various input types (Date, string, number, Firestore Timestamp, null, undefined, invalid values)
  - Ensure validator never returns invalid Date that produces NaN
  - Use fast-check with minimum 100 iterations

- [x] 1.2 Write unit tests for Date Validator edge cases (Backend)
  - Test null and undefined inputs return fallback
  - Test Firestore Timestamp conversion
  - Test ISO string parsing
  - Test invalid Date objects
  - _Requirements: 1.2, 1.4, 1.5_

- [x] 2. Create Date Validator utility (Frontend)
  - Create `src/utils/dateValidator.ts` with TypeScript types
  - Implement same functions as backend version
  - Add TypeScript interfaces: `DateValidatorOptions`, `DateValidationResult`
  - Handle Firestore Timestamp objects from Firebase
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2.1 Write property test for Date Validator (Frontend)
  - **Property 1: Date Validator Handles All Input Types**
  - **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 1.6**
  - Same tests as backend version
  - Use fast-check with minimum 100 iterations

- [x] 3. Create Date Formatter utility (Backend)
  - Create `server-utils/dateFormatter.cjs`
  - Implement `formatDate(value, options)` function
  - Implement `formatDateShort(value)`, `formatDateLong(value)`, `formatDateTime(value)` helpers
  - Use Date Validator before formatting
  - Support format styles: short, medium, long, full
  - Return fallback string for invalid dates (default: "Date unavailable")
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3.1 Write property tests for Date Formatter (Backend)
  - **Property 2: Date Formatter Always Validates Before Formatting**
  - **Validates: Requirements 2.3, 3.2, 7.4**
  - **Property 3: Formatted Output Never Contains "Invalid Date"**
  - **Validates: Requirements 3.3, 8.1**
  - **Property 4: Date Formatting Consistency**
  - **Validates: Requirements 2.5**
  - Use fast-check with minimum 100 iterations per property

- [x] 3.2 Write unit tests for Date Formatter (Backend)
  - Test each format style (short, medium, long, full)
  - Test date-only vs date-time formatting
  - Test Firestore Timestamp formatting
  - Test fallback message for invalid dates
  - _Requirements: 2.4, 2.6, 3.3_

- [x] 4. Create Date Formatter utility (Frontend)
  - Create `src/utils/dateFormatter.ts`
  - Implement same functions as backend version
  - Add TypeScript interfaces: `DateFormatOptions`, `DateFormatStyle`
  - Use Date Validator before formatting
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4.1 Write property tests for Date Formatter (Frontend)
  - **Property 2: Date Formatter Always Validates Before Formatting**
  - **Validates: Requirements 2.3, 3.2, 7.4**
  - **Property 3: Formatted Output Never Contains "Invalid Date"**
  - **Validates: Requirements 3.3, 8.1**
  - **Property 5: Date Formatter Supports Multiple Formats**
  - **Validates: Requirements 2.4**
  - **Property 6: Firestore Timestamp Formatting**
  - **Validates: Requirements 2.6**
  - Use fast-check with minimum 100 iterations per property

- [x] 5. Create JSON Parser utility (Backend)
  - Create `server-utils/jsonParser.cjs`
  - Implement `safeJSONParse(jsonString, context)` function
  - Implement `isValidJSON(jsonString)` function
  - Check for empty/whitespace-only strings before parsing
  - Wrap JSON.parse in try-catch
  - Return structured error with errorCode 'PARSE_ERROR' or 'EMPTY_RESPONSE'
  - Include response length in error details
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

- [x] 5.1 Write property test for JSON Parser
  - **Property 10: JSON Parser Handles Malformed Input**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**
  - Test with empty strings, whitespace, malformed JSON
  - Ensure no exceptions thrown
  - Ensure consistent error structure
  - Use fast-check with minimum 100 iterations

- [x] 5.2 Write unit tests for JSON Parser
  - Test empty string returns EMPTY_RESPONSE error
  - Test whitespace-only string returns EMPTY_RESPONSE error
  - Test malformed JSON returns PARSE_ERROR error
  - Test valid JSON returns success with data
  - Test error includes response length
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [x] 6. Update Datapro Client to use JSON Parser
  - Import `safeJSONParse` from `server-utils/jsonParser.cjs`
  - Replace `JSON.parse(data)` at line ~217 with `safeJSONParse(data, context)`
  - Add context object with: source, nin (masked), statusCode, responseLength
  - Check parse result before accessing data
  - Return parse error if parsing fails
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 5.1, 5.3, 5.4, 5.6_

- [x] 6.1 Write property test for Datapro Client error handling
  - **Property 14: Parse Errors Trigger Retries**
  - **Validates: Requirements 5.7**
  - Mock API to return empty/malformed responses
  - Verify retries occur up to MAX_RETRIES
  - Use fast-check with minimum 100 iterations

- [x] 6.2 Write unit tests for Datapro Client JSON parsing
  - Test empty response handling
  - Test malformed JSON response handling
  - Test error response structure
  - Test sensitive data masking in logs
  - _Requirements: 5.1, 5.2, 5.5_

- [-] 7. Update Verifydata Client to use JSON Parser
  - Import `safeJSONParse` from `server-utils/jsonParser.cjs`
  - Replace `JSON.parse(data)` at lines ~217 and ~270 with `safeJSONParse(data, context)`
  - Add context object with: source, rcNumber (masked), statusCode, responseLength
  - Check parse result before accessing data
  - Return parse error if parsing fails
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 5.2, 5.3, 5.4, 5.6, 11.1, 11.2, 11.3_

- [ ] 7.1 Write property test for API client consistency
  - **Property 15: Both API Clients Handle Errors Identically**
  - **Validates: Requirements 11.6**
  - Test same error scenarios for both clients
  - Verify error structures match
  - Use fast-check with minimum 100 iterations

- [ ] 7.2 Write unit tests for Verifydata Client JSON parsing
  - Test empty response handling
  - Test malformed JSON response handling
  - Test error response structure matches Datapro
  - Test sensitive data masking in logs
  - _Requirements: 5.2, 11.4_

- [x] 8. Update Backend date serialization in server.js
  - Find all API responses that return Date objects
  - Convert Date objects to ISO strings using `.toISOString()`
  - Update line ~11255 in resend verification endpoint
  - Update any other endpoints returning dates
  - _Requirements: 3.5, 6.1, 6.4, 6.5_

- [ ] 8.1 Write property test for backend date serialization
  - **Property 8: Backend Serializes Dates as ISO Strings**
  - **Validates: Requirements 3.5, 6.1, 6.4**
  - **Property 9: Backend Validates Dates Before Serialization**
  - **Validates: Requirements 6.5**
  - Test API responses contain ISO strings, not Date objects
  - Use fast-check with minimum 100 iterations

- [x] 9. Update TypeScript type definitions
  - Update `src/api/identityRoutes.ts`
  - Change `newExpiresAt` type from `Date` to `string` with JSDoc comment "ISO 8601 date string"
  - Add JSDoc comments to other date fields in API response types
  - _Requirements: 6.2, 9.5_

- [x] 10. Checkpoint - Ensure all utility tests pass
  - Run all tests for Date Validator, Date Formatter, and JSON Parser
  - Verify no regressions in Datapro and Verifydata clients
  - Ensure all tests pass, ask the user if questions arise

- [-] 11. Update IdentityListDetail.tsx to use Date Formatter
  - Import `formatDateLong` and `formatDateTime` from `@/utils/dateFormatter`
  - Replace line ~670: use `formatDateLong(result.newExpiresAt)` instead of `new Date(result.newExpiresAt).toLocaleDateString()`
  - Replace line ~497: use `formatDate(value)` instead of `date.toLocaleDateString()`
  - Replace line ~578: use `formatDate(value)` instead of `date.toLocaleDateString()`
  - Replace line ~1437: use `formatDateTime(log.timestamp)` instead of `new Date(log.timestamp).toLocaleString()`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.3, 7.5_

- [ ] 11.1 Write property test for frontend date parsing
  - **Property 7: Frontend Parses ISO Strings Correctly**
  - **Validates: Requirements 3.1**
  - Test various ISO strings parse and format correctly
  - Use fast-check with minimum 100 iterations

- [ ] 11.2 Write integration test for verification link resend
  - Test end-to-end flow: backend returns ISO string, frontend formats it
  - Verify "Invalid Date" never appears in success message
  - Test with various date values
  - _Requirements: 3.1, 3.2, 3.3, 10.4_

- [x] 12. Update other frontend files using toLocaleDateString
  - Search for all uses of `toLocaleDateString()` and `toLocaleString()`
  - Replace with appropriate `formatDate()`, `formatDateShort()`, `formatDateLong()`, or `formatDateTime()` calls
  - Priority files:
    - `src/pages/dashboard/UserFormViewer.tsx` (lines 252, 255, 260)
    - `src/services/pdfService.ts` (lines 187, 190, 285, 287)
    - `src/services/emailService.ts` (line 128)
    - `src/pages/cdd/IndividualCDD.tsx` (line 712)
  - _Requirements: 7.1, 7.3, 7.5_

- [x] 13. Update backend files using toLocaleDateString
  - Search for all uses of `toLocaleDateString()` in server.js
  - Replace with `formatDate()` or `formatDateLong()` from dateFormatter.cjs
  - Priority locations:
    - Line ~2258: Decision date in email
    - Line ~7091: Expiration date formatting
    - Line ~9497: Expiration date formatting
    - Line ~11205: Expiration date formatting
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 14. Update email templates to use Date Formatter
  - Update `src/templates/verificationEmail.ts`
  - Replace `expiresAt.toLocaleDateString()` calls with `formatDateLong(expiresAt)`
  - Ensure dates are validated before formatting
  - _Requirements: 2.3, 3.3, 7.3_

- [x] 15. Final checkpoint - Run all tests
  - Run full test suite: `npm test`
  - Verify all property tests pass (minimum 100 iterations each)
  - Verify all unit tests pass
  - Verify no "Invalid Date" appears in any UI
  - Ensure all tests pass, ask the user if questions arise

- [x] 16. Manual testing verification
  - Test verification link resend flow in admin panel
  - Verify expiration date displays correctly
  - Test with Datapro API (NIN verification)
  - Test with Verifydata API (CAC verification)
  - Verify error messages are user-friendly when APIs return empty responses
  - Verify no "Invalid Date" appears anywhere in the UI

## Notes

- All tasks are required for comprehensive testing and quality assurance
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The implementation is incremental: utilities first, then migrate existing code
- Both frontend (TypeScript) and backend (CommonJS) need date utilities
- JSON parser is backend-only since frontend uses fetch API which handles JSON parsing
