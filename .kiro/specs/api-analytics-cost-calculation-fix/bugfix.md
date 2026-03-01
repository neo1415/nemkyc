# Bugfix Requirements Document

## Introduction

The API analytics dashboard displays incorrect cost values in audit logs and the cost tracker component. Audit logs show ₦50 for all API verifications regardless of success or failure status, while the cost tracker incorrectly counts failed verifications as ₦100, resulting in inflated total costs. The root cause is that the backend API client functions (`dataproClient.verifyNIN()` and `verifydataClient.verifyCACNumber()`) do not return a `cost` field in their response objects, causing downstream components to use undefined or default values. This bug affects cost tracking accuracy and could lead to incorrect billing analysis.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a successful NIN verification is performed via Datapro THEN the audit log displays ₦50 instead of ₦100

1.2 WHEN a failed NIN verification is performed via Datapro THEN the audit log displays ₦50 instead of ₦0

1.3 WHEN a successful CAC verification is performed via VerifyData THEN the audit log displays ₦50 instead of ₦100

1.4 WHEN a failed CAC verification is performed via VerifyData THEN the audit log displays ₦50 instead of ₦0

1.5 WHEN the cost tracker aggregates costs for multiple verifications THEN it counts failed verifications as ₦100 instead of ₦0

1.6 WHEN `dataproClient.verifyNIN()` completes a verification THEN the response object does not include a `cost` field

1.7 WHEN `verifydataClient.verifyCACNumber()` completes a verification THEN the response object does not include a `cost` field

1.8 WHEN the server attempts to read `dataproResult.cost` in server.js line 11345 THEN it receives `undefined` and defaults to 0

1.9 WHEN audit logs are fetched and displayed THEN the cost value is derived from incorrect or missing metadata

### Expected Behavior (Correct)

2.1 WHEN a successful NIN verification is performed via Datapro THEN the audit log SHALL display ₦100

2.2 WHEN a failed NIN verification is performed via Datapro THEN the audit log SHALL display ₦0

2.3 WHEN a successful CAC verification is performed via VerifyData THEN the audit log SHALL display ₦100

2.4 WHEN a failed CAC verification is performed via VerifyData THEN the audit log SHALL display ₦0

2.5 WHEN the cost tracker aggregates costs for multiple verifications THEN it SHALL count only successful verifications at ₦100 each and failed verifications at ₦0

2.6 WHEN `dataproClient.verifyNIN()` completes a verification THEN the response object SHALL include `cost: 100` for success and `cost: 0` for failure

2.7 WHEN `verifydataClient.verifyCACNumber()` completes a verification THEN the response object SHALL include `cost: 100` for success and `cost: 0` for failure

2.8 WHEN the server reads the cost from API client responses THEN it SHALL receive the correct cost value (100 or 0) based on verification success status

2.9 WHEN audit logs are fetched and displayed THEN the cost value SHALL be accurately retrieved from the stored metadata

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Metrics Overview component calculates total costs THEN it SHALL CONTINUE TO display the correct total cost (currently showing ₦100 correctly)

3.2 WHEN verification responses include other fields (success, data, responseInfo) THEN these fields SHALL CONTINUE TO be returned and processed correctly

3.3 WHEN audit logs store non-cost metadata (listId, entryId, provider, etc.) THEN this metadata SHALL CONTINUE TO be stored and retrieved correctly

3.4 WHEN the `logAPICall()` function in auditLogger.cjs is invoked THEN it SHALL CONTINUE TO log all other audit information correctly

3.5 WHEN successful verifications are performed THEN the verification data and results SHALL CONTINUE TO be processed and stored correctly

3.6 WHEN failed verifications are performed THEN the error handling and user feedback SHALL CONTINUE TO work correctly

3.7 WHEN the cost calculator utility is used for other cost calculations THEN it SHALL CONTINUE TO function correctly

3.8 WHEN analytics queries filter by date range, provider, or user THEN the filtering logic SHALL CONTINUE TO work correctly
