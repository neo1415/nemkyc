# Bugfix Requirements Document

## Introduction

The `/api/analytics/user-attribution` endpoint is failing to properly aggregate API usage data across multiple lists to their respective users. While the endpoint correctly queries 11 api-usage-logs documents and aggregates them into 7 unique lists, the subsequent list-to-user aggregation logic is failing, resulting in only 1 user being returned with 1 call and cost: 0, instead of showing all 11 calls attributed to Daniel with actual costs.

This is a critical analytics bug affecting the admin dashboard's ability to track API usage and costs by user, which impacts billing accuracy and usage monitoring. The bug occurs during the list lookup and user aggregation phase (lines 16450-16550 in server.js), where the code attempts to:
1. Look up each list's `createdBy` field from the `identity-lists` collection
2. Aggregate statistics by userId/createdBy
3. Fetch user details and calculate costs

The root cause appears to be that the aggregation loop is silently failing or skipping most entries due to missing lists in the `identity-lists` collection, missing `createdBy` fields, or the `continue` statement causing premature loop exits.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the endpoint queries api-usage-logs for date range 2026-02-01 to 2026-03-01 and finds 11 documents across 7 unique listIds THEN the system only returns 1 user with 1 call and cost: 0 instead of aggregating all 11 calls

1.2 WHEN a listId from api-usage-logs does not exist in the identity-lists collection THEN the system logs a warning and continues to the next iteration, silently dropping those API calls from the aggregation

1.3 WHEN a listId equals 'unknown' THEN the system skips that entry with a continue statement, losing those API calls from the final user attribution

1.4 WHEN the cost field in api-usage-logs documents is 0 or missing THEN the system shows cost: 0 in the final output instead of calculating the actual cost based on successful API calls

1.5 WHEN errors occur during list lookup (e.g., Firestore permission issues, network errors) THEN the system catches the error, logs it, and continues to the next iteration, silently dropping those API calls

### Expected Behavior (Correct)

2.1 WHEN the endpoint queries api-usage-logs for date range 2026-02-01 to 2026-03-01 and finds 11 documents across 7 unique listIds THEN the system SHALL aggregate all 11 calls to the correct user (Daniel) with accurate cost calculation

2.2 WHEN a listId from api-usage-logs does not exist in the identity-lists collection THEN the system SHALL still include those API calls in the aggregation by using the userId field directly from the api-usage-logs document as a fallback

2.3 WHEN a listId equals 'unknown' THEN the system SHALL attempt to use the userId field from the api-usage-logs document to attribute the calls, or aggregate them under an 'unknown' user category if userId is also unavailable

2.4 WHEN the cost field in api-usage-logs documents is 0 or missing THEN the system SHALL calculate the actual cost based on the success status and apiProvider fields (₦100 per successful call for both datapro and verifydata)

2.5 WHEN errors occur during list lookup THEN the system SHALL log the error but still include those API calls in the aggregation using fallback attribution methods (userId from api-usage-logs)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the endpoint receives valid date range parameters (startDate and endDate in YYYY-MM-DD format) THEN the system SHALL CONTINUE TO validate the date format and range constraints

3.2 WHEN the endpoint queries api-usage-logs by date field THEN the system SHALL CONTINUE TO use the date field for filtering and return all matching documents

3.3 WHEN the endpoint aggregates api-usage-logs by listId THEN the system SHALL CONTINUE TO create a Map with statistics (totalCalls, successfulCalls, failedCalls, dataproCalls, verifydataCalls, totalCost) for each unique listId

3.4 WHEN the endpoint fetches user details from the users and userroles collections THEN the system SHALL CONTINUE TO populate userName, userEmail, userRole, and lastActivity fields

3.5 WHEN the endpoint sorts and limits the results THEN the system SHALL CONTINUE TO apply the sortBy, order, and limit parameters correctly

3.6 WHEN the endpoint calculates success rate THEN the system SHALL CONTINUE TO compute it as (successfulCalls / totalCalls) * 100

3.7 WHEN the endpoint returns the response THEN the system SHALL CONTINUE TO include metadata with totalUsers, returnedUsers, hitQueryLimit, requestTime, and generatedAt fields
