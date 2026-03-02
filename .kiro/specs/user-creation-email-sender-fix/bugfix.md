# Bugfix Requirements Document

## Introduction

The user creation process fails to send welcome emails due to an Office 365 "SendAsDenied" error caused by using an incorrect sender address (`noreply@nemforms.com`) that differs from the authenticated SMTP account (`kyc@nem-insurance.com`). This results in users being created successfully with a success toast displayed, even though the welcome email never reaches them. The fix must align the sender address with the working NIN/CAC verification email pattern and ensure atomicity of the user creation operation.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a new user is created THEN the system attempts to send a welcome email using `process.env.SMTP_FROM || 'noreply@nemforms.com'` as the sender address

1.2 WHEN the welcome email is sent with sender address `noreply@nemforms.com` THEN Office 365 rejects it with "SendAsDenied; kyc@nem-insurance.com not allowed to send as noreply@nemforms.com" error

1.3 WHEN the welcome email fails to send THEN the user creation still completes successfully and displays a success toast to the admin

1.4 WHEN the email sending fails THEN the newly created user never receives their welcome email with login credentials

### Expected Behavior (Correct)

2.1 WHEN a new user is created THEN the system SHALL send the welcome email using `'"NEM Insurance" <kyc@nem-insurance.com>'` as the sender address (matching the working NIN/CAC email pattern)

2.2 WHEN the welcome email is sent with the correct sender address THEN Office 365 SHALL accept and deliver the email without "SendAsDenied" errors

2.3 WHEN the welcome email fails to send THEN the system SHALL roll back the user creation and password generation operations

2.4 WHEN all operations (user creation, password generation, email sending) complete successfully THEN the system SHALL display a success toast to the admin

2.5 WHEN any operation fails THEN the system SHALL display an error message indicating which operation failed

### Unchanged Behavior (Regression Prevention)

3.1 WHEN NIN verification emails are sent THEN the system SHALL CONTINUE TO use `'"NEM Insurance" <kyc@nem-insurance.com>'` as the sender address

3.2 WHEN CAC verification emails are sent THEN the system SHALL CONTINUE TO use `'"NEM Insurance" <kyc@nem-insurance.com>'` as the sender address

3.3 WHEN the `sendEmailWithRetry` function is called for other email types THEN the system SHALL CONTINUE TO function with the updated sender address pattern

3.4 WHEN user creation succeeds with email delivery THEN the system SHALL CONTINUE TO create the user account with the correct role and permissions

3.5 WHEN the generated password meets security requirements THEN the system SHALL CONTINUE TO generate secure passwords using the existing password generation logic
