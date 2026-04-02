# Requirements Document: Staging Environment Infrastructure

## Introduction

This document specifies requirements for implementing a complete staging/development environment infrastructure for the NEM Insurance platform. The current system operates with a single production Firebase project, causing test data pollution, real email notifications during testing, and security vulnerabilities from exposed credentials. This feature will establish separate environments (development, staging, production) with proper isolation, secrets management, and safe testing capabilities.

## Glossary

- **Environment**: A complete isolated instance of the application infrastructure (development, staging, or production)
- **Firebase_Project**: A Google Firebase project containing Firestore database, Authentication, Storage, and Hosting services
- **Backend_Server**: The Express.js Node server running on Render that handles API requests, email notifications, and third-party integrations
- **CI/CD_Pipeline**: GitHub Actions workflows that automate building, testing, and deploying code
- **Secrets_Manager**: GitHub Secrets storage for sensitive configuration values like API keys and credentials
- **Email_Sandbox**: A testing mode where emails are intercepted and not sent to real recipients
- **Mock_API_Mode**: A testing mode where third-party API calls return simulated responses without making real requests
- **Environment_Variable**: Configuration value that changes between environments (e.g., API URLs, Firebase credentials)
- **Service_Account**: Firebase Admin SDK credentials used by the backend server to access Firebase services
- **Third_Party_API**: External services integrated into the platform (Datapro NIN verification, VerifyData CAC verification, Gemini OCR)
- **Data_Isolation**: Ensuring test data in staging never mixes with production data
- **Deployment_Target**: The specific environment where code is deployed (dev, staging, or production)
- **Configuration_File**: Files containing environment-specific settings (.env files, firebase.json, .firebaserc)
- **SMTP_Server**: Email server used to send notifications (currently Office 365)
- **API_Endpoint**: Backend server URL that the frontend calls for data operations
- **Storage_Bucket**: Firebase Cloud Storage location for uploaded files and documents
- **Firestore_Database**: NoSQL database storing application data (claims, KYC forms, user roles)
- **Authentication_Service**: Firebase Authentication managing user sign-in and sessions
- **Hosting_Service**: Firebase Hosting serving the frontend React application
- **Render_Service**: Cloud platform hosting the backend Node.js server
- **GitHub_Actions**: CI/CD automation platform running build and deployment workflows
- **Environment_Promotion**: Process of moving tested code from staging to production

## Requirements

### Requirement 1: Separate Firebase Projects for Each Environment

**User Story:** As a developer, I want separate Firebase projects for development, staging, and production, so that test activities never affect production data or users.

#### Acceptance Criteria

1. THE System SHALL create three distinct Firebase projects: development, staging, and production
2. WHEN a Firebase project is created, THE System SHALL configure Firestore, Authentication, Storage, and Hosting services
3. THE System SHALL ensure each Firebase_Project has isolated Firestore_Database instances with no data sharing
4. THE System SHALL ensure each Firebase_Project has isolated Authentication_Service instances with separate user accounts
5. THE System SHALL ensure each Firebase_Project has isolated Storage_Bucket instances for uploaded files
6. THE System SHALL configure Firebase project names following the pattern: nem-insurance-{environment}
7. THE System SHALL update .firebaserc configuration file to reference all three Firebase projects
8. THE System SHALL generate separate Service_Account credentials for each Firebase_Project

### Requirement 2: Environment-Specific Configuration Management

**User Story:** As a developer, I want environment-specific configuration files with proper secrets management, so that credentials are never exposed in version control.

#### Acceptance Criteria

1. THE System SHALL create separate environment files: .env.development, .env.staging, .env.production
2. THE System SHALL remove .env.production from version control and add it to .gitignore
3. THE System SHALL ensure .env.example contains all required variables without sensitive values
4. WHEN an environment file is created, THE System SHALL include all Firebase configuration variables (API key, auth domain, project ID, storage bucket, messaging sender ID, app ID, measurement ID)
5. WHEN an environment file is created, THE System SHALL include backend API URL pointing to the correct Backend_Server for that environment
6. WHEN an environment file is created, THE System SHALL include SMTP configuration for the Email_Sandbox mode
7. WHEN an environment file is created, THE System SHALL include Third_Party_API configuration with appropriate mode settings
8. THE System SHALL store all production secrets in GitHub Secrets_Manager
9. THE System SHALL store all staging secrets in GitHub Secrets_Manager
10. THE System SHALL ensure development environment uses mock credentials that can be committed to version control

### Requirement 3: Staging Backend Server Deployment

**User Story:** As a developer, I want a separate staging backend server, so that I can test API changes without affecting production users.

#### Acceptance Criteria

1. THE System SHALL create a new Render_Service instance for the staging Backend_Server
2. WHEN the staging Backend_Server is created, THE System SHALL configure it with staging Firebase Service_Account credentials
3. WHEN the staging Backend_Server is created, THE System SHALL configure it with staging environment variables
4. THE System SHALL ensure the staging Backend_Server connects to the staging Firebase_Project
5. THE System SHALL configure the staging Backend_Server URL as an Environment_Variable for the staging frontend
6. THE System SHALL ensure the staging Backend_Server has Email_Sandbox mode enabled by default
7. THE System SHALL ensure the staging Backend_Server has Mock_API_Mode enabled for Third_Party_API calls
8. THE System SHALL configure CORS settings on the staging Backend_Server to allow staging frontend origin
9. THE System SHALL ensure the staging Backend_Server has separate health monitoring and logging

### Requirement 4: Email Sandboxing for Testing

**User Story:** As a developer, I want emails to be intercepted in staging environments, so that test form submissions never send real notifications to actual administrators.

#### Acceptance Criteria

1. WHEN EMAIL_RECIPIENTS_MODE is set to 'sandbox', THE Backend_Server SHALL intercept all outgoing emails
2. WHEN an email is intercepted in sandbox mode, THE Backend_Server SHALL log the email details (recipient, subject, body) to console
3. WHEN an email is intercepted in sandbox mode, THE Backend_Server SHALL store the email in a Firestore collection named 'sandbox-emails'
4. WHEN EMAIL_RECIPIENTS_MODE is set to 'sandbox', THE Backend_Server SHALL only send emails to addresses listed in SANDBOX_ALLOWED_RECIPIENTS environment variable
5. WHEN EMAIL_RECIPIENTS_MODE is set to 'production', THE Backend_Server SHALL send emails to actual recipients
6. THE System SHALL set EMAIL_RECIPIENTS_MODE to 'sandbox' in development and staging environments
7. THE System SHALL set EMAIL_RECIPIENTS_MODE to 'production' in production environment
8. THE System SHALL provide an admin interface to view intercepted sandbox emails

### Requirement 5: Mock API Mode for Third-Party Services

**User Story:** As a developer, I want third-party API calls to return mock responses in staging, so that I can test integrations without incurring costs or using real verification services.

#### Acceptance Criteria

1. WHEN VERIFICATION_MODE is set to 'mock', THE Backend_Server SHALL return simulated responses for Datapro NIN verification requests
2. WHEN VERIFICATION_MODE is set to 'mock', THE Backend_Server SHALL return simulated responses for VerifyData CAC verification requests
3. WHEN VERIFICATION_MODE is set to 'mock', THE Backend_Server SHALL return simulated responses for Gemini OCR document verification requests
4. WHEN a mock API response is returned, THE Backend_Server SHALL log that a mock response was used
5. WHEN VERIFICATION_MODE is set to 'production', THE Backend_Server SHALL make actual API calls to Third_Party_API services
6. THE System SHALL set VERIFICATION_MODE to 'mock' in development and staging environments
7. THE System SHALL set VERIFICATION_MODE to 'production' in production environment
8. THE System SHALL ensure mock responses include realistic data structures matching actual API responses
9. THE System SHALL ensure mock responses include both success and error scenarios for testing

### Requirement 6: Multi-Environment CI/CD Pipeline

**User Story:** As a developer, I want automated deployments to staging and production environments, so that code changes can be safely tested before reaching production users.

#### Acceptance Criteria

1. WHEN code is pushed to the 'develop' branch, THE CI/CD_Pipeline SHALL build and deploy to the development Firebase_Project
2. WHEN code is pushed to the 'staging' branch, THE CI/CD_Pipeline SHALL build and deploy to the staging Firebase_Project
3. WHEN code is pushed to the 'main' branch, THE CI/CD_Pipeline SHALL build and deploy to the production Firebase_Project
4. WHEN the CI/CD_Pipeline builds for an environment, THE System SHALL inject environment-specific variables from GitHub Secrets_Manager
5. WHEN the CI/CD_Pipeline deploys to staging, THE System SHALL use the staging Firebase Service_Account
6. WHEN the CI/CD_Pipeline deploys to production, THE System SHALL use the production Firebase Service_Account
7. THE System SHALL create separate GitHub Actions workflow files for each environment
8. THE System SHALL ensure pull requests trigger preview deployments to Firebase Hosting preview channels
9. THE System SHALL run automated tests before deploying to any environment
10. WHEN a deployment fails, THE CI/CD_Pipeline SHALL send notifications and halt the deployment

### Requirement 7: Data Isolation Between Environments

**User Story:** As a developer, I want complete data isolation between environments, so that staging tests never affect production data and vice versa.

#### Acceptance Criteria

1. THE System SHALL ensure development Firestore_Database is completely separate from staging and production
2. THE System SHALL ensure staging Firestore_Database is completely separate from development and production
3. THE System SHALL ensure production Firestore_Database is completely separate from development and staging
4. THE System SHALL ensure each environment's Storage_Bucket is isolated with no cross-environment access
5. THE System SHALL ensure each environment's Authentication_Service has separate user accounts
6. WHEN a user signs in to staging, THE System SHALL authenticate against the staging Firebase_Project only
7. WHEN a user signs in to production, THE System SHALL authenticate against the production Firebase_Project only
8. THE System SHALL configure Firestore security rules separately for each environment
9. THE System SHALL configure Storage security rules separately for each environment
10. THE System SHALL ensure backend servers connect only to their designated Firebase_Project

### Requirement 8: Secrets Management and Security Fixes

**User Story:** As a security administrator, I want all sensitive credentials removed from version control and stored securely, so that API keys and passwords are never exposed publicly.

#### Acceptance Criteria

1. THE System SHALL remove .env.production from git history using git filter-branch or BFG Repo-Cleaner
2. THE System SHALL add .env.production, .env.staging, and .env.development to .gitignore
3. THE System SHALL ensure .env.example contains placeholder values only, never real credentials
4. WHEN production credentials are needed, THE System SHALL retrieve them from GitHub Secrets_Manager
5. WHEN staging credentials are needed, THE System SHALL retrieve them from GitHub Secrets_Manager
6. THE System SHALL rotate all exposed API keys (Firebase, Datapro, VerifyData, Gemini)
7. THE System SHALL generate new Firebase Service_Account credentials for all environments
8. THE System SHALL generate new SMTP passwords for all environments
9. THE System SHALL document the process for adding new secrets to GitHub Secrets_Manager
10. THE System SHALL ensure no sensitive values are logged to console or files in production

### Requirement 9: Environment-Specific Frontend Configuration

**User Story:** As a developer, I want the frontend to automatically connect to the correct backend and Firebase project based on the deployment environment, so that staging frontend never calls production APIs.

#### Acceptance Criteria

1. WHEN the frontend is built for development, THE System SHALL use development Firebase configuration
2. WHEN the frontend is built for staging, THE System SHALL use staging Firebase configuration
3. WHEN the frontend is built for production, THE System SHALL use production Firebase configuration
4. WHEN the frontend is built for an environment, THE System SHALL set VITE_API_BASE_URL to the correct Backend_Server URL
5. THE System SHALL create a Vite build mode for each environment (development, staging, production)
6. THE System SHALL ensure the frontend displays the current environment name in the UI for non-production environments
7. WHEN a user accesses staging, THE System SHALL show a visible banner indicating "STAGING ENVIRONMENT"
8. THE System SHALL ensure API calls from staging frontend only reach staging Backend_Server
9. THE System SHALL ensure API calls from production frontend only reach production Backend_Server
10. THE System SHALL configure CORS on backend servers to reject requests from unauthorized origins

### Requirement 10: Staging Environment Testing Workflow

**User Story:** As a developer, I want a documented workflow for testing changes in staging before production deployment, so that bugs are caught before affecting real users.

#### Acceptance Criteria

1. THE System SHALL provide documentation for the staging testing workflow
2. THE System SHALL document how to deploy code to staging environment
3. THE System SHALL document how to verify staging deployment was successful
4. THE System SHALL document how to test form submissions in staging without sending real emails
5. THE System SHALL document how to verify mock API responses in staging
6. THE System SHALL document how to promote tested code from staging to production
7. THE System SHALL document how to rollback a production deployment if issues are found
8. THE System SHALL document how to access staging environment URLs (frontend and backend)
9. THE System SHALL document how to view sandbox emails in staging
10. THE System SHALL document how to add test users to staging Firebase Authentication

### Requirement 11: Backend Server Environment Variables Configuration

**User Story:** As a DevOps engineer, I want all backend environment variables properly configured for each environment, so that the server operates correctly with the right credentials and settings.

#### Acceptance Criteria

1. WHEN the Backend_Server starts, THE System SHALL validate all required environment variables are present
2. WHEN a required environment variable is missing, THE Backend_Server SHALL log an error and refuse to start
3. THE System SHALL configure Firebase Admin SDK variables (TYPE, PROJECT_ID, PRIVATE_KEY, CLIENT_EMAIL, etc.) for each environment
4. THE System SHALL configure SMTP variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS) for each environment
5. THE System SHALL configure Third_Party_API variables (DATAPRO_SERVICE_ID, VERIFYDATA_SECRET_KEY, GEMINI_API_KEY) for each environment
6. THE System SHALL configure security variables (ENCRYPTION_KEY, EVENTS_IP_SALT, SERVER_API_KEY) uniquely for each environment
7. THE System SHALL configure CORS variables (ADDITIONAL_ALLOWED_ORIGINS) to allow correct frontend origins
8. THE System SHALL configure FRONTEND_URL variable to point to the correct frontend URL for each environment
9. THE System SHALL ensure staging Backend_Server uses different encryption keys than production
10. THE System SHALL document all required environment variables in backend-package/.env.example

### Requirement 12: Firebase Hosting Configuration for Multiple Environments

**User Story:** As a developer, I want Firebase Hosting configured for each environment with appropriate URLs, so that users can access staging and production sites separately.

#### Acceptance Criteria

1. THE System SHALL configure Firebase Hosting for the development Firebase_Project
2. THE System SHALL configure Firebase Hosting for the staging Firebase_Project
3. THE System SHALL configure Firebase Hosting for the production Firebase_Project
4. WHEN Firebase Hosting is configured, THE System SHALL set up custom domains if available
5. THE System SHALL configure staging Firebase Hosting to use a subdomain (e.g., staging.nemforms.com)
6. THE System SHALL configure production Firebase Hosting to use the main domain (nemforms.com)
7. THE System SHALL update firebase.json to support multi-environment hosting configuration
8. THE System SHALL configure hosting rewrites to serve the React SPA correctly in all environments
9. THE System SHALL configure hosting headers for security (CSP, HSTS) in all environments
10. THE System SHALL ensure Firebase Hosting serves the correct build artifacts for each environment

### Requirement 13: Monitoring and Logging for Staging Environment

**User Story:** As a developer, I want comprehensive logging in staging environment, so that I can debug issues and verify system behavior before production deployment.

#### Acceptance Criteria

1. WHEN the staging Backend_Server processes a request, THE System SHALL log request details (method, path, user, timestamp)
2. WHEN the staging Backend_Server encounters an error, THE System SHALL log the full error stack trace
3. WHEN a mock API response is returned in staging, THE System SHALL log which API was mocked and the response data
4. WHEN an email is intercepted in staging, THE System SHALL log the email recipient, subject, and body
5. THE System SHALL configure staging Backend_Server to use verbose logging mode
6. THE System SHALL ensure staging logs are accessible via Render dashboard
7. THE System SHALL configure log retention for staging environment (minimum 7 days)
8. THE System SHALL ensure staging health monitor tracks API response times and error rates
9. THE System SHALL configure alerts for staging Backend_Server downtime
10. THE System SHALL provide a way to download staging logs for local analysis

### Requirement 14: Environment Promotion and Rollback Procedures

**User Story:** As a DevOps engineer, I want documented procedures for promoting code between environments and rolling back failed deployments, so that production deployments are safe and reversible.

#### Acceptance Criteria

1. THE System SHALL document the process for promoting code from development to staging
2. THE System SHALL document the process for promoting code from staging to production
3. THE System SHALL document required testing steps before promoting to production
4. THE System SHALL document the rollback process for production deployments
5. THE System SHALL document how to identify which version is currently deployed in each environment
6. THE System SHALL ensure GitHub releases are tagged for production deployments
7. THE System SHALL document how to deploy a specific version to an environment
8. THE System SHALL document how to verify a deployment was successful
9. THE System SHALL document emergency hotfix procedures that bypass staging
10. THE System SHALL document who has authorization to deploy to production

### Requirement 15: Cost Management for Staging Environment

**User Story:** As a project manager, I want staging environment costs minimized while maintaining functionality, so that testing infrastructure doesn't incur unnecessary expenses.

#### Acceptance Criteria

1. THE System SHALL use Firebase Spark (free) plan for development environment
2. THE System SHALL use Firebase Blaze (pay-as-you-go) plan for staging with spending limits
3. THE System SHALL configure Render free tier or minimal paid tier for staging Backend_Server
4. WHEN staging Backend_Server is idle, THE System SHALL allow it to spin down to save costs
5. THE System SHALL use Mock_API_Mode in staging to avoid Third_Party_API charges
6. THE System SHALL configure Firestore usage limits for staging to prevent runaway costs
7. THE System SHALL configure Storage usage limits for staging to prevent runaway costs
8. THE System SHALL document monthly cost estimates for staging infrastructure
9. THE System SHALL configure billing alerts for staging Firebase_Project
10. THE System SHALL document process for cleaning up old staging data to reduce storage costs
