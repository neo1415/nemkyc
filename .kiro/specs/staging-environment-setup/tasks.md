# Implementation Plan: Staging Environment Infrastructure

## Overview

This implementation plan establishes a complete multi-environment infrastructure for the NEM Insurance platform, transitioning from a single production Firebase project to a robust three-tier architecture (development, staging, production). The implementation addresses critical security vulnerabilities, enables safe testing workflows, and establishes automated CI/CD pipelines.

## Tasks

- [ ] 1. Repository cleanup and security fixes
  - [ ] 1.1 Remove sensitive files from git history and update .gitignore
    - Use BFG Repo-Cleaner or git filter-repo to remove .env.production, firestore.rules, storage.rules from git history
    - Add .env.production, .env.staging, .env.development to .gitignore
    - Verify sensitive files are no longer in git history
    - _Requirements: 8.1, 8.2_

  - [ ] 1.2 Create comprehensive .env.example files
    - Create .env.example in root directory with all frontend variables (VITE_FIREBASE_*, VITE_API_BASE_URL, VITE_NODE_ENV, VITE_STORAGE_SALT)
    - Create backend-package/.env.example with all backend variables (Firebase Admin SDK, SMTP, Third-Party APIs, Security)
    - Ensure all values are placeholders (your_api_key_here, example_value, etc.)
    - Document each variable's purpose with inline comments
    - _Requirements: 2.3, 8.3, 11.10_

  - [ ] 1.3 Organize documentation into docs folder
    - Move all markdown files from root to docs/ folder (already partially done)
    - Update any references to documentation paths in README files
    - Create docs/staging-environment/ subfolder for staging-specific documentation
    - _Requirements: 10.1_


- [ ] 2. Firebase projects creation and configuration
  - [ ] 2.1 Create development Firebase project
    - Create new Firebase project named "nem-insurance-dev" in Firebase Console
    - Enable Firestore Database (start in test mode, will apply rules later)
    - Enable Authentication with Email/Password provider
    - Enable Cloud Storage
    - Enable Firebase Hosting
    - Generate and download service account JSON for Firebase Admin SDK
    - Note down all Firebase configuration values (apiKey, authDomain, projectId, etc.)
    - _Requirements: 1.1, 1.2, 1.6, 1.8_

  - [ ] 2.2 Create staging Firebase project
    - Create new Firebase project named "nem-insurance-staging" in Firebase Console
    - Enable Firestore Database (start in test mode, will apply rules later)
    - Enable Authentication with Email/Password provider
    - Enable Cloud Storage
    - Enable Firebase Hosting
    - Generate and download service account JSON for Firebase Admin SDK
    - Note down all Firebase configuration values
    - Configure Blaze plan with spending limits ($10/month recommended)
    - Set up billing alerts at $5 and $10 thresholds
    - _Requirements: 1.1, 1.2, 1.6, 1.8, 15.2, 15.9_

  - [ ] 2.3 Update .firebaserc with all three projects
    - Edit .firebaserc to include development, staging, and production project aliases
    - Set "default" to production for backward compatibility
    - Add "development" alias pointing to nem-insurance-dev
    - Add "staging" alias pointing to nem-insurance-staging
    - _Requirements: 1.7_

  - [ ] 2.4 Deploy Firestore rules to all environments
    - Deploy firestore.rules to development: `firebase deploy --only firestore:rules --project development`
    - Deploy firestore.rules to staging: `firebase deploy --only firestore:rules --project staging`
    - Verify rules are active in Firebase Console for each project
    - _Requirements: 7.8_

  - [ ] 2.5 Deploy Storage rules to all environments
    - Deploy storage.rules to development: `firebase deploy --only storage --project development`
    - Deploy storage.rules to staging: `firebase deploy --only storage --project staging`
    - Verify rules are active in Firebase Console for each project
    - _Requirements: 7.9_

  - [ ] 2.6 Deploy Firestore indexes to all environments
    - Deploy firestore.indexes.json to development: `firebase deploy --only firestore:indexes --project development`
    - Deploy firestore.indexes.json to staging: `firebase deploy --only firestore:indexes --project staging`
    - Wait for index creation to complete (can take several minutes)
    - _Requirements: 1.2_


- [ ] 3. Environment configuration files creation
  - [ ] 3.1 Create .env.development for frontend
    - Create .env.development in root directory
    - Add all VITE_FIREBASE_* variables from development Firebase project
    - Set VITE_API_BASE_URL=http://localhost:3001
    - Set VITE_NODE_ENV=development
    - Generate and set VITE_STORAGE_SALT (64-char hex string)
    - This file can be committed to git (no sensitive production values)
    - _Requirements: 2.1, 2.4, 2.5, 2.10, 9.1, 9.4_

  - [ ] 3.2 Create .env.staging for frontend
    - Create .env.staging in root directory
    - Add all VITE_FIREBASE_* variables from staging Firebase project
    - Set VITE_API_BASE_URL to staging backend URL (will be created in task 4)
    - Set VITE_NODE_ENV=staging
    - Generate and set VITE_STORAGE_SALT (different from dev and prod)
    - Add to .gitignore (contains staging credentials)
    - _Requirements: 2.1, 2.4, 2.5, 9.2, 9.4_

  - [ ] 3.3 Create .env.production for frontend
    - Create .env.production in root directory (if not exists)
    - Add all VITE_FIREBASE_* variables from production Firebase project
    - Set VITE_API_BASE_URL=https://nem-server-rhdb.onrender.com
    - Set VITE_NODE_ENV=production
    - Set VITE_STORAGE_SALT (existing production value)
    - Ensure it's in .gitignore
    - _Requirements: 2.1, 2.4, 2.5, 9.3, 9.4_

  - [ ] 3.4 Create backend-package/.env.development
    - Create .env.development in backend-package directory
    - Add all Firebase Admin SDK variables from development service account JSON
    - Set NODE_ENV=development
    - Set PORT=3001
    - Set FRONTEND_URL=http://localhost:3000
    - Set EMAIL_RECIPIENTS_MODE=sandbox
    - Set VERIFICATION_MODE=mock
    - Set SMTP credentials (can use placeholder values for local dev)
    - Set mock/placeholder values for Third-Party API keys
    - Generate ENCRYPTION_KEY, EVENTS_IP_SALT, SERVER_API_KEY (dev-specific)
    - This file can be committed (no sensitive production values)
    - _Requirements: 2.1, 2.6, 2.7, 2.10, 3.3, 3.6, 3.7, 4.6, 5.6, 11.3, 11.4, 11.5, 11.6, 11.8_

  - [ ] 3.5 Create backend-package/.env.staging
    - Create .env.staging in backend-package directory
    - Add all Firebase Admin SDK variables from staging service account JSON
    - Set NODE_ENV=staging
    - Set PORT=3001
    - Set FRONTEND_URL to staging frontend URL (e.g., https://nem-insurance-staging.web.app)
    - Set EMAIL_RECIPIENTS_MODE=sandbox
    - Set VERIFICATION_MODE=mock
    - Set real SMTP credentials (from GitHub Secrets later)
    - Set mock/placeholder values for Third-Party API keys
    - Generate unique ENCRYPTION_KEY, EVENTS_IP_SALT, SERVER_API_KEY (staging-specific)
    - Set ADDITIONAL_ALLOWED_ORIGINS if needed
    - Add to .gitignore
    - _Requirements: 2.1, 2.6, 2.7, 3.3, 3.6, 3.7, 4.6, 5.6, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

  - [ ] 3.6 Update backend-package/.env.production
    - Verify all Firebase Admin SDK variables are correct for production
    - Verify NODE_ENV=production
    - Verify EMAIL_RECIPIENTS_MODE=production
    - Verify VERIFICATION_MODE=production
    - Verify all Third-Party API keys are production values
    - Ensure it's in .gitignore
    - _Requirements: 2.1, 2.6, 2.7, 3.3, 4.7, 5.7, 11.3, 11.4, 11.5, 11.6, 11.8_


- [ ] 4. Backend server setup on Render
  - [ ] 4.1 Create staging backend service on Render
    - Log in to Render dashboard
    - Create new Web Service
    - Connect to GitHub repository
    - Set service name: nem-server-staging
    - Set branch: staging (will create this branch later)
    - Set build command: npm install (if needed)
    - Set start command: node server.js
    - Set root directory: backend-package
    - Choose Free tier or Starter ($7/month) plan
    - Enable auto-deploy on push to staging branch
    - _Requirements: 3.1, 15.3_

  - [ ] 4.2 Configure staging backend environment variables in Render
    - In Render dashboard for nem-server-staging, add all environment variables from backend-package/.env.staging
    - Mark sensitive variables as "secret" (Firebase credentials, SMTP password, API keys)
    - Set NODE_ENV=staging
    - Set EMAIL_RECIPIENTS_MODE=sandbox
    - Set VERIFICATION_MODE=mock
    - Set FRONTEND_URL to staging frontend URL
    - Set ADDITIONAL_ALLOWED_ORIGINS to include staging frontend URL
    - _Requirements: 3.2, 3.3, 3.6, 3.7, 3.8, 11.1, 11.2, 11.7_

  - [ ] 4.3 Update .env.staging with staging backend URL
    - Once Render service is created, note the staging backend URL (e.g., https://nem-server-staging.onrender.com)
    - Update .env.staging: VITE_API_BASE_URL=https://nem-server-staging.onrender.com
    - Update backend-package/.env.staging: FRONTEND_URL with correct staging frontend URL
    - _Requirements: 3.5, 9.4_

  - [ ] 4.4 Verify production backend configuration
    - Review nem-server-rhdb service in Render dashboard
    - Verify NODE_ENV=production
    - Verify EMAIL_RECIPIENTS_MODE=production
    - Verify VERIFICATION_MODE=production
    - Verify FRONTEND_URL=https://nemforms.com
    - Verify all environment variables are correctly set
    - _Requirements: 3.3, 4.7, 5.7_


- [ ] 5. Email sandboxing implementation
  - [ ] 5.1 Implement email interception logic in backend server
    - Locate email sending code in backend-package/server.js (nodemailer usage)
    - Create new file: backend-package/server-utils/emailSandbox.cjs
    - Implement interceptEmail() function that checks EMAIL_RECIPIENTS_MODE
    - When mode is 'sandbox', log email to console with full details
    - When mode is 'sandbox', save email to Firestore 'sandbox-emails' collection
    - When mode is 'sandbox', check SANDBOX_ALLOWED_RECIPIENTS whitelist
    - When mode is 'production', send email normally via SMTP
    - Export functions: interceptEmail, sendEmail
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.2 Write unit tests for email sandboxing
    - Create backend-package/server-utils/__tests__/emailSandbox.test.cjs
    - Test email interception in sandbox mode
    - Test email logging to console
    - Test email storage in Firestore
    - Test allowed recipients whitelist
    - Test production mode sends real emails
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 5.3 Integrate email sandbox into all email sending endpoints
    - Find all nodemailer.sendMail() calls in server.js
    - Replace with emailSandbox.sendEmail() calls
    - Ensure all form submission endpoints use the new email function
    - Test locally with EMAIL_RECIPIENTS_MODE=sandbox
    - _Requirements: 4.1, 4.5_

  - [ ] 5.4 Create Firestore collection for sandbox emails
    - Create 'sandbox-emails' collection in development and staging Firebase projects
    - Add Firestore index for timestamp (descending) for efficient querying
    - Add Firestore index for formType + timestamp for filtering
    - Update firestore.indexes.json with new indexes
    - Deploy indexes to development and staging
    - _Requirements: 4.3_

  - [ ] 5.5 Create admin interface to view sandbox emails
    - Create new React component: src/pages/admin/SandboxEmails.tsx
    - Implement list view showing all intercepted emails (timestamp, recipient, subject, formType)
    - Implement detail view showing full email HTML content
    - Add filters: date range, form type, recipient
    - Add search by ticket ID
    - Add delete functionality for old emails
    - Add route in React Router for /admin/sandbox-emails
    - Restrict access to admin/super admin roles only
    - _Requirements: 4.8_

  - [ ]* 5.6 Write property test for email sandbox interception
    - **Property 4: Email sandbox interception**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Create test file: backend-package/server-utils/__tests__/emailSandbox.property.test.cjs
    - Use fast-check to generate random email data (recipient, subject, body)
    - Verify all emails are intercepted when EMAIL_RECIPIENTS_MODE=sandbox
    - Verify emails are logged to console
    - Verify emails are stored in Firestore
    - Run 100+ iterations with different email combinations
    - _Requirements: 4.1, 4.2, 4.3_


- [ ] 6. Mock API system implementation
  - [ ] 6.1 Create mock VerifyData CAC verification client
    - Create backend-package/server-services/__mocks__/verifydataClient.cjs
    - Implement mockVerifyCAC() function returning realistic CAC data
    - Include success responses for valid RC numbers (RC123456, RC789012, etc.)
    - Include error responses for invalid RC numbers
    - Simulate API latency (500-1500ms delay)
    - Match response structure of real VerifyData API
    - Export mockVerifyCAC function
    - _Requirements: 5.2, 5.8_

  - [ ] 6.2 Create mock Gemini OCR client
    - Create backend-package/server-services/__mocks__/geminiClient.cjs
    - Implement mockExtractDocumentData() function returning OCR results
    - Include extracted data based on document type (ID card, driver's license, etc.)
    - Include confidence scores (0.85-0.99)
    - Simulate processing time (1000-3000ms delay)
    - Match response structure of real Gemini API
    - Export mockExtractDocumentData function
    - _Requirements: 5.3, 5.8_

  - [ ] 6.3 Implement verification mode switching in backend
    - Locate Datapro NIN verification code in server.js
    - Add conditional logic: if VERIFICATION_MODE=mock, use mock client; else use real client
    - Locate VerifyData CAC verification code in server.js
    - Add conditional logic: if VERIFICATION_MODE=mock, use mock client; else use real client
    - Locate Gemini OCR code in server.js
    - Add conditional logic: if VERIFICATION_MODE=mock, use mock client; else use real client
    - Log when mock responses are used
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.4 Write unit tests for mock API clients
    - Create backend-package/server-services/__mocks__/__tests__/verifydataClient.test.cjs
    - Test mock CAC verification with valid RC numbers
    - Test mock CAC verification with invalid RC numbers
    - Create backend-package/server-services/__mocks__/__tests__/geminiClient.test.cjs
    - Test mock OCR extraction for different document types
    - Verify response structures match real APIs
    - _Requirements: 5.2, 5.3, 5.8_

  - [ ]* 6.5 Write property test for mock API response structure
    - **Property 7: Mock API response structure**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.8**
    - Create test file: backend-package/server-services/__mocks__/__tests__/mockAPI.property.test.cjs
    - Use fast-check to generate random NIN, RC numbers, document types
    - Verify mock responses have same structure as real API responses
    - Verify all required fields are present
    - Verify data types match (strings, numbers, booleans)
    - Run 100+ iterations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.8_

  - [ ] 6.6 Add mock API logging
    - In each mock client, add console.log statements indicating mock mode
    - Log format: "🎭 MOCK API: {API_NAME} verification for {identifier}"
    - Include response data in logs for debugging
    - Ensure logs only appear in development/staging, not production
    - _Requirements: 5.4, 13.3_


- [ ] 7. Frontend environment configuration
  - [ ] 7.1 Add environment indicator banner component
    - Create src/components/EnvironmentBanner.tsx
    - Display banner when VITE_NODE_ENV !== 'production'
    - Show environment name (DEVELOPMENT or STAGING) in bold text
    - Use yellow background for staging, blue for development
    - Position at top of page, full width, fixed position
    - _Requirements: 9.6, 9.7_

  - [ ] 7.2 Integrate environment banner into app layout
    - Import EnvironmentBanner in src/App.tsx or main layout component
    - Render banner at the top of the application
    - Ensure banner appears on all pages
    - Test in development mode (should show DEVELOPMENT banner)
    - _Requirements: 9.6, 9.7_

  - [ ] 7.3 Add build scripts for each environment
    - Update package.json scripts section
    - Ensure "dev" script uses .env.development: `vite --mode development`
    - Ensure "build:dev" script exists: `vite build --mode development`
    - Add "build:staging" script: `vite build --mode staging`
    - Ensure "build" script uses production: `vite build --mode production`
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [ ] 7.4 Verify Firebase initialization uses correct config
    - Review src/firebase.ts or Firebase initialization code
    - Ensure it reads from import.meta.env.VITE_FIREBASE_* variables
    - Verify all 7 Firebase config variables are used (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId)
    - Test locally with development config
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 7.5 Verify API client uses correct backend URL
    - Review API client code (axios configuration, fetch calls)
    - Ensure base URL comes from import.meta.env.VITE_API_BASE_URL
    - Verify all API calls use the base URL
    - Test locally that API calls go to localhost:3001
    - _Requirements: 9.4, 9.8_

  - [ ]* 7.6 Write property test for environment-specific API URL
    - **Property 9: Environment-specific API URL**
    - **Validates: Requirements 9.4**
    - Create test file: src/__tests__/environment.property.test.ts
    - Mock different VITE_API_BASE_URL values (localhost, staging, production)
    - Verify API client uses the correct URL for each environment
    - Test with fast-check generating different URL patterns
    - _Requirements: 9.4_

  - [ ]* 7.7 Write unit test for environment banner display
    - Create src/components/__tests__/EnvironmentBanner.test.tsx
    - Test banner shows in development mode
    - Test banner shows in staging mode
    - Test banner hidden in production mode
    - Test correct colors and text for each environment
    - _Requirements: 9.6, 9.7_


- [ ] 8. GitHub Secrets configuration
  - [ ] 8.1 Add development secrets to GitHub
    - Go to GitHub repository Settings > Secrets and variables > Actions
    - Add DEV_FIREBASE_SERVICE_ACCOUNT (paste development service account JSON)
    - Add DEV_VITE_FIREBASE_API_KEY
    - Add DEV_VITE_FIREBASE_AUTH_DOMAIN
    - Add DEV_VITE_FIREBASE_PROJECT_ID
    - Add DEV_VITE_FIREBASE_STORAGE_BUCKET
    - Add DEV_VITE_FIREBASE_MESSAGING_SENDER_ID
    - Add DEV_VITE_FIREBASE_APP_ID
    - Add DEV_VITE_FIREBASE_MEASUREMENT_ID
    - Add DEV_VITE_API_BASE_URL (http://localhost:3001 or dev backend URL)
    - Add DEV_VITE_STORAGE_SALT
    - _Requirements: 2.8, 6.4_

  - [ ] 8.2 Add staging secrets to GitHub
    - Add STAGING_FIREBASE_SERVICE_ACCOUNT (paste staging service account JSON)
    - Add STAGING_VITE_FIREBASE_API_KEY
    - Add STAGING_VITE_FIREBASE_AUTH_DOMAIN
    - Add STAGING_VITE_FIREBASE_PROJECT_ID
    - Add STAGING_VITE_FIREBASE_STORAGE_BUCKET
    - Add STAGING_VITE_FIREBASE_MESSAGING_SENDER_ID
    - Add STAGING_VITE_FIREBASE_APP_ID
    - Add STAGING_VITE_FIREBASE_MEASUREMENT_ID
    - Add STAGING_VITE_API_BASE_URL (staging backend URL from Render)
    - Add STAGING_VITE_STORAGE_SALT
    - _Requirements: 2.9, 6.4, 6.5_

  - [ ] 8.3 Verify production secrets in GitHub
    - Verify FIREBASE_SERVICE_ACCOUNT_NEM_CUSTOMER_FEEDBACK_8D3FB exists
    - Verify VITE_FIREBASE_API_KEY exists
    - Verify VITE_FIREBASE_AUTH_DOMAIN exists
    - Verify VITE_FIREBASE_PROJECT_ID exists
    - Verify VITE_FIREBASE_STORAGE_BUCKET exists
    - Verify VITE_FIREBASE_MESSAGING_SENDER_ID exists
    - Verify VITE_FIREBASE_APP_ID exists
    - Verify VITE_FIREBASE_MEASUREMENT_ID exists
    - Verify VITE_API_BASE_URL exists
    - Verify VITE_STORAGE_SALT exists
    - _Requirements: 2.8, 6.4, 6.6_

  - [ ] 8.4 Document secrets management process
    - Create docs/staging-environment/SECRETS_MANAGEMENT.md
    - Document how to add new secrets to GitHub
    - Document naming convention (DEV_, STAGING_, no prefix for production)
    - Document how to rotate secrets
    - Document which secrets are required for each environment
    - _Requirements: 8.9_


- [ ] 9. CI/CD pipeline implementation
  - [ ] 9.1 Create GitHub Actions workflow for development deployment
    - Create .github/workflows/deploy-development.yml
    - Trigger on push to 'develop' branch
    - Add job: checkout code, setup Node.js, install dependencies
    - Add step: create .env file from DEV_* secrets
    - Add step: run tests (npm test)
    - Add step: build frontend (npm run build:dev)
    - Add step: deploy to Firebase Hosting (development project)
    - Use DEV_FIREBASE_SERVICE_ACCOUNT for authentication
    - Add notification on failure
    - _Requirements: 6.1, 6.4, 6.7, 6.9_

  - [ ] 9.2 Create GitHub Actions workflow for staging deployment
    - Create .github/workflows/deploy-staging.yml
    - Trigger on push to 'staging' branch
    - Add job: checkout code, setup Node.js, install dependencies
    - Add step: create .env file from STAGING_* secrets
    - Add step: run tests (npm test)
    - Add step: build frontend (npm run build:staging)
    - Add step: deploy to Firebase Hosting (staging project)
    - Use STAGING_FIREBASE_SERVICE_ACCOUNT for authentication
    - Add notification on failure
    - _Requirements: 6.2, 6.4, 6.5, 6.7, 6.9_

  - [ ] 9.3 Create GitHub Actions workflow for production deployment
    - Create .github/workflows/deploy-production.yml
    - Trigger on push to 'main' branch
    - Add job: checkout code, setup Node.js, install dependencies
    - Add step: create .env file from production secrets (no prefix)
    - Add step: run tests (npm test)
    - Add step: build frontend (npm run build)
    - Add step: deploy to Firebase Hosting (production project)
    - Use FIREBASE_SERVICE_ACCOUNT_NEM_CUSTOMER_FEEDBACK_8D3FB for authentication
    - Add notification on failure
    - Create git tag for production releases
    - _Requirements: 6.3, 6.4, 6.6, 6.7, 6.9, 14.6_

  - [ ] 9.4 Create GitHub Actions workflow for PR preview deployments
    - Create .github/workflows/preview-deploy.yml
    - Trigger on pull_request events
    - Add job: checkout code, setup Node.js, install dependencies
    - Add step: build frontend with appropriate environment
    - Add step: deploy to Firebase Hosting preview channel
    - Add comment to PR with preview URL
    - _Requirements: 6.8_

  - [ ]* 9.5 Write property test for CI/CD environment variable injection
    - **Property 21: CI/CD environment variable injection**
    - **Validates: Requirements 6.4**
    - Create test file: .github/workflows/__tests__/workflow-validation.test.js
    - Parse workflow YAML files
    - Verify correct secrets are referenced (DEV_*, STAGING_*, no prefix for prod)
    - Verify all required environment variables are injected
    - Use fast-check to test different secret name patterns
    - _Requirements: 6.4_

  - [ ]* 9.6 Write unit tests for workflow file syntax
    - Create .github/workflows/__tests__/workflow-syntax.test.js
    - Validate YAML syntax for all workflow files
    - Verify required fields are present (name, on, jobs)
    - Verify test step exists before deploy step
    - Verify correct Firebase project is targeted
    - _Requirements: 6.7, 6.9_


- [ ] 10. Git branch structure setup
  - [ ] 10.1 Create develop branch
    - Create 'develop' branch from current main: `git checkout -b develop`
    - Push to remote: `git push -u origin develop`
    - Set as default branch for development work in GitHub settings
    - _Requirements: 6.1_

  - [ ] 10.2 Create staging branch
    - Create 'staging' branch from main: `git checkout main && git checkout -b staging`
    - Push to remote: `git push -u origin staging`
    - Configure branch protection rules (require PR reviews)
    - _Requirements: 6.2_

  - [ ] 10.3 Configure branch protection rules
    - In GitHub repository settings, add branch protection for 'main'
    - Require pull request reviews before merging
    - Require status checks to pass (CI/CD tests)
    - In GitHub repository settings, add branch protection for 'staging'
    - Require pull request reviews before merging
    - Document branch workflow in README
    - _Requirements: 14.1, 14.2, 14.10_

  - [ ] 10.4 Document git workflow
    - Create docs/staging-environment/GIT_WORKFLOW.md
    - Document feature branch → develop → staging → main flow
    - Document how to create feature branches
    - Document how to merge to develop
    - Document how to promote from develop to staging
    - Document how to promote from staging to production
    - Include diagrams showing branch relationships
    - _Requirements: 10.1, 10.2, 14.1, 14.2_


- [ ] 11. Backend server environment validation
  - [ ] 11.1 Implement environment variable validation on startup
    - Create backend-package/server-utils/envValidator.cjs
    - Define list of required environment variables for each mode
    - Implement validateEnvironmentVariables() function
    - Check all required variables are present and non-empty
    - Validate format of critical variables (URLs, email addresses)
    - Log specific error for each missing variable
    - Exit with code 1 if validation fails
    - Call validation function at server startup (top of server.js)
    - _Requirements: 11.1, 11.2_

  - [ ]* 11.2 Write unit tests for environment validation
    - Create backend-package/server-utils/__tests__/envValidator.test.cjs
    - Test validation passes with all required variables
    - Test validation fails with missing variables
    - Test validation fails with invalid URL format
    - Test validation fails with invalid email format
    - Test error messages are specific and helpful
    - _Requirements: 11.1, 11.2_

  - [ ]* 11.3 Write property test for backend environment variable validation
    - **Property 13: Backend environment variable validation**
    - **Validates: Requirements 11.1, 11.2**
    - Create test file: backend-package/server-utils/__tests__/envValidator.property.test.cjs
    - Use fast-check to generate random environment variable sets
    - Verify server refuses to start with missing variables
    - Verify specific error messages for each missing variable
    - Test with 100+ combinations of missing/present variables
    - _Requirements: 11.1, 11.2_

  - [ ] 11.4 Add environment consistency validation
    - In envValidator.cjs, add checkEnvironmentConsistency() function
    - Verify development/staging have EMAIL_RECIPIENTS_MODE=sandbox
    - Verify development/staging have VERIFICATION_MODE=mock
    - Verify production has EMAIL_RECIPIENTS_MODE=production
    - Verify production has VERIFICATION_MODE=production
    - Log warnings for inconsistent configurations
    - _Requirements: 3.6, 3.7, 4.6, 4.7, 5.6, 5.7_

  - [ ]* 11.5 Write property test for environment-specific backend configuration
    - **Property 14: Environment-specific backend configuration**
    - **Validates: Requirements 3.6, 3.7, 4.6, 4.7, 5.6, 5.7**
    - Create test file: backend-package/server-utils/__tests__/envConsistency.property.test.cjs
    - Test all combinations of NODE_ENV, EMAIL_RECIPIENTS_MODE, VERIFICATION_MODE
    - Verify staging/dev always have sandbox and mock modes
    - Verify production always has production modes
    - Use fast-check to generate environment configurations
    - _Requirements: 3.6, 3.7, 4.6, 4.7, 5.6, 5.7_


- [ ] 12. Enhanced logging for staging environment
  - [ ] 12.1 Implement request logging middleware
    - Create backend-package/server-utils/requestLogger.cjs
    - Implement middleware that logs: method, path, user email, timestamp
    - Add request ID for tracing
    - Log request body for POST/PUT requests (sanitize sensitive fields)
    - Only enable verbose logging in development/staging
    - Export requestLogger middleware
    - _Requirements: 13.1_

  - [ ] 12.2 Implement error logging middleware
    - Create backend-package/server-utils/errorLogger.cjs
    - Implement error handler middleware
    - Log full error message and stack trace
    - Include request context (method, path, user)
    - Sanitize sensitive data from error logs in production
    - Export errorLogger middleware
    - _Requirements: 13.2_

  - [ ] 12.3 Integrate logging middleware into server
    - Import requestLogger in server.js
    - Add requestLogger middleware after authentication middleware
    - Import errorLogger in server.js
    - Add errorLogger as last middleware (error handler)
    - Test logging in development mode
    - _Requirements: 13.1, 13.2_

  - [ ] 12.4 Add production log sanitization
    - Create backend-package/server-utils/logSanitizer.cjs
    - Implement sanitizeLog() function
    - Remove API keys, passwords, private keys, encryption keys from logs
    - Mask email addresses (show first 2 chars + domain)
    - Mask phone numbers (show last 4 digits)
    - Export sanitizeLog function
    - Integrate into all logging functions when NODE_ENV=production
    - _Requirements: 8.10_

  - [ ]* 12.5 Write property test for production log sanitization
    - **Property 20: Production log sanitization**
    - **Validates: Requirements 8.10**
    - Create test file: backend-package/server-utils/__tests__/logSanitizer.property.test.cjs
    - Use fast-check to generate log messages with sensitive data
    - Verify API keys are removed from logs
    - Verify passwords are removed from logs
    - Verify email addresses are masked
    - Test with 100+ combinations of sensitive data patterns
    - _Requirements: 8.10_

  - [ ]* 12.6 Write unit tests for request and error logging
    - Create backend-package/server-utils/__tests__/requestLogger.test.cjs
    - Test request logging includes all required fields
    - Test sensitive fields are sanitized
    - Create backend-package/server-utils/__tests__/errorLogger.test.cjs
    - Test error logging includes stack trace
    - Test error context is captured
    - _Requirements: 13.1, 13.2_


- [ ] 13. CORS configuration updates
  - [ ] 13.1 Update CORS allowed origins for staging
    - In backend-package/server.js, locate CORS configuration
    - Add staging frontend URL to allowedOrigins array
    - Add staging backend URL to allowedOrigins array
    - Ensure ADDITIONAL_ALLOWED_ORIGINS environment variable is checked
    - _Requirements: 3.8, 9.10, 11.7_

  - [ ] 13.2 Verify CORS configuration for all environments
    - Test development: localhost:3000 can call localhost:3001
    - Test staging: staging frontend can call staging backend
    - Test production: production frontend can call production backend
    - Test cross-environment calls are blocked (staging frontend → production backend should fail)
    - _Requirements: 9.10_

  - [ ]* 13.3 Write property test for CORS origin validation
    - **Property 12: CORS origin validation**
    - **Validates: Requirements 9.10, 3.8**
    - Create test file: backend-package/__tests__/cors.property.test.cjs
    - Use fast-check to generate random origin URLs
    - Verify allowed origins are accepted
    - Verify disallowed origins are rejected with CORS error
    - Test with 100+ different origin combinations
    - _Requirements: 9.10, 3.8_

  - [ ]* 13.4 Write unit tests for CORS configuration
    - Create backend-package/__tests__/cors.test.cjs
    - Test each allowed origin is accepted
    - Test unknown origins are rejected
    - Test localhost is allowed in development
    - Test localhost is blocked in production
    - _Requirements: 3.8, 9.10_


- [ ] 14. Firebase Hosting configuration
  - [ ] 14.1 Update firebase.json for multi-environment hosting
    - Review firebase.json hosting configuration
    - Verify rewrites are configured for SPA (all routes → /index.html)
    - Verify security headers are configured (CSP, HSTS, X-Frame-Options)
    - Ensure configuration applies to all environments
    - _Requirements: 12.7, 12.8, 12.9_

  - [ ] 14.2 Deploy to development Firebase Hosting
    - Build frontend for development: `npm run build:dev`
    - Deploy to development project: `firebase deploy --only hosting --project development`
    - Verify deployment at nem-insurance-dev.web.app
    - Test that environment banner shows "DEVELOPMENT"
    - Test that API calls go to development backend
    - _Requirements: 12.1_

  - [ ] 14.3 Deploy to staging Firebase Hosting
    - Build frontend for staging: `npm run build:staging`
    - Deploy to staging project: `firebase deploy --only hosting --project staging`
    - Verify deployment at nem-insurance-staging.web.app
    - Test that environment banner shows "STAGING"
    - Test that API calls go to staging backend
    - _Requirements: 12.2_

  - [ ] 14.4 Configure custom domain for staging (optional)
    - In Firebase Console for staging project, go to Hosting
    - Add custom domain: staging.nemforms.com
    - Follow DNS configuration instructions
    - Wait for SSL certificate provisioning
    - Verify staging.nemforms.com loads correctly
    - _Requirements: 12.5_

  - [ ] 14.5 Verify production Firebase Hosting
    - Verify production deployment at nemforms.com
    - Verify no environment banner is shown
    - Verify API calls go to production backend
    - _Requirements: 12.3, 12.6_


- [ ] 15. Testing and validation
  - [ ] 15.1 Create integration test for staging environment
    - Create test file: tests/integration/staging-environment.test.ts
    - Test: Deploy test form submission to staging
    - Verify: Email is intercepted (check sandbox-emails collection)
    - Verify: Mock API responses are returned
    - Verify: Data is stored in staging Firestore
    - Verify: No data appears in production Firestore
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 15.2 Create integration test for environment isolation
    - Create test file: tests/integration/environment-isolation.test.ts
    - Test: User signs in to staging
    - Verify: Authentication uses staging Firebase project
    - Test: User signs in to production
    - Verify: Authentication uses production Firebase project
    - Verify: Staging user cannot access production data
    - _Requirements: 7.6, 7.7_

  - [ ]* 15.3 Write property test for frontend-backend environment matching
    - **Property 11: Frontend-backend environment matching**
    - **Validates: Requirements 9.8, 9.9**
    - Create test file: tests/property/environment-matching.property.test.ts
    - Use fast-check to generate API call scenarios
    - Verify staging frontend calls staging backend
    - Verify production frontend calls production backend
    - Verify cross-environment calls are blocked
    - _Requirements: 9.8, 9.9_

  - [ ]* 15.4 Write property test for configuration completeness
    - **Property 1: Environment configuration completeness**
    - **Validates: Requirements 2.4, 2.5, 2.6, 2.7, 11.3, 11.4, 11.5, 11.6**
    - Create test file: tests/property/config-completeness.property.test.ts
    - Parse .env.development, .env.staging, .env.production files
    - Verify all required Firebase variables are present
    - Verify backend API URL is present
    - Verify environment mode settings are present
    - Use fast-check to test different configuration scenarios
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 15.5 Write property test for placeholder values in .env.example
    - **Property 2: Placeholder values in example configuration**
    - **Validates: Requirements 2.3, 8.3**
    - Create test file: tests/property/env-example.property.test.ts
    - Parse .env.example files
    - Verify all values are placeholders (contain "your_", "example", etc.)
    - Verify no values match production credential patterns
    - Use fast-check to test credential pattern detection
    - _Requirements: 2.3, 8.3_

  - [ ] 15.6 Manual testing checklist
    - Test form submission in staging (verify email intercepted)
    - Test NIN verification in staging (verify mock response)
    - Test CAC verification in staging (verify mock response)
    - Test document OCR in staging (verify mock response)
    - Test user sign-in in staging
    - Test admin dashboard in staging
    - Test sandbox emails viewer in staging
    - Verify staging data doesn't appear in production
    - Verify production still works correctly
    - _Requirements: 10.4, 10.5_


- [ ] 16. Documentation
  - [ ] 16.1 Create staging environment setup guide
    - Create docs/staging-environment/SETUP_GUIDE.md
    - Document Firebase project creation steps
    - Document Render backend setup steps
    - Document GitHub Secrets configuration
    - Document environment file creation
    - Include screenshots and examples
    - _Requirements: 10.1, 10.8_

  - [ ] 16.2 Create staging testing workflow guide
    - Create docs/staging-environment/TESTING_WORKFLOW.md
    - Document how to deploy to staging
    - Document how to verify deployment success
    - Document how to test form submissions
    - Document how to view sandbox emails
    - Document how to verify mock API responses
    - Document how to add test users
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9, 10.10_

  - [ ] 16.3 Create environment promotion guide
    - Create docs/staging-environment/PROMOTION_GUIDE.md
    - Document develop → staging promotion process
    - Document staging → production promotion process
    - Document required testing before promotion
    - Document rollback procedures
    - Document version identification
    - Document deployment verification
    - _Requirements: 10.6, 10.7, 14.1, 14.2, 14.3, 14.4, 14.5, 14.7, 14.8_

  - [ ] 16.4 Create rollback procedures guide
    - Create docs/staging-environment/ROLLBACK_PROCEDURES.md
    - Document how to identify current deployed version
    - Document how to rollback Firebase Hosting deployment
    - Document how to rollback Render backend deployment
    - Document emergency hotfix procedures
    - Document who can authorize production deployments
    - _Requirements: 10.7, 14.4, 14.7, 14.9, 14.10_

  - [ ] 16.5 Create cost management guide
    - Create docs/staging-environment/COST_MANAGEMENT.md
    - Document Firebase plan selection (Spark for dev, Blaze for staging)
    - Document Render tier selection
    - Document spending limits configuration
    - Document billing alerts setup
    - Document monthly cost estimates
    - Document data cleanup procedures
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.6, 15.7, 15.8, 15.9, 15.10_

  - [ ] 16.6 Update main README with environment information
    - Add section: "Environments" describing dev, staging, production
    - Add section: "Development Workflow" with branch strategy
    - Add links to staging environment documentation
    - Add environment URLs (frontend and backend for each)
    - _Requirements: 10.1, 10.8_


- [ ] 17. Security credential rotation
  - [ ] 17.1 Rotate Firebase API keys
    - In Firebase Console for production project, regenerate Web API key
    - Update production secrets in GitHub with new API key
    - Update .env.production with new API key
    - Update Render production backend if it uses Firebase Web API
    - Test production deployment with new key
    - _Requirements: 8.6_

  - [ ] 17.2 Rotate Firebase service account credentials
    - In Firebase Console for production project, create new service account
    - Download new service account JSON
    - Update FIREBASE_SERVICE_ACCOUNT secret in GitHub
    - Update Render production backend environment variables
    - Delete old service account from Firebase Console
    - Test production backend can connect to Firebase
    - _Requirements: 8.7_

  - [ ] 17.3 Rotate SMTP passwords
    - Generate new app-specific password in Office 365
    - Update EMAIL_PASS in Render production backend
    - Update EMAIL_PASS in Render staging backend
    - Test email sending in production
    - Test email interception in staging
    - _Requirements: 8.8_

  - [ ] 17.4 Rotate third-party API keys (if exposed)
    - Contact Datapro to rotate DATAPRO_SERVICE_ID (if exposed)
    - Contact VerifyData to rotate VERIFYDATA_SECRET_KEY (if exposed)
    - Rotate GEMINI_API_KEY in Google Cloud Console (if exposed)
    - Update all environment variables in Render
    - Update GitHub Secrets
    - Test API integrations in production
    - _Requirements: 8.6_

  - [ ] 17.5 Generate new encryption keys for all environments
    - Generate new ENCRYPTION_KEY for development (64-char hex)
    - Generate new ENCRYPTION_KEY for staging (64-char hex)
    - Generate new ENCRYPTION_KEY for production (64-char hex)
    - Generate new EVENTS_IP_SALT for each environment
    - Generate new SERVER_API_KEY for each environment
    - Update all environment files and Render configurations
    - _Requirements: 11.6, 11.9_

  - [ ] 17.6 Document credential rotation procedures
    - Create docs/staging-environment/CREDENTIAL_ROTATION.md
    - Document how to rotate each type of credential
    - Document testing procedures after rotation
    - Document emergency rotation procedures
    - Document rotation schedule (quarterly recommended)
    - _Requirements: 8.9_


- [ ] 18. Monitoring and health checks
  - [ ] 18.1 Configure health monitoring for staging backend
    - Verify healthMonitor.cjs is initialized in staging backend
    - Configure health check endpoint: GET /health
    - Configure metrics endpoint: GET /health/metrics
    - Test health check returns 200 with status information
    - _Requirements: 3.9, 13.8_

  - [ ] 18.2 Set up Render health check monitoring
    - In Render dashboard for staging backend, configure health check path: /health
    - Set health check interval: 60 seconds
    - Set failure threshold: 3 consecutive failures
    - Configure email alerts for downtime
    - _Requirements: 13.9_

  - [ ] 18.3 Configure log retention in Render
    - In Render dashboard for staging backend, verify log retention settings
    - Ensure logs are retained for at least 7 days
    - Document how to access and download logs
    - _Requirements: 13.6, 13.7, 13.10_

  - [ ] 18.4 Set up Firebase usage monitoring
    - In Firebase Console for staging project, configure usage alerts
    - Set Firestore read/write alerts at 80% of free tier limits
    - Set Storage alerts at 80% of free tier limits
    - Set Authentication alerts at 80% of free tier limits
    - _Requirements: 15.6, 15.7_

  - [ ] 18.5 Create monitoring dashboard documentation
    - Create docs/staging-environment/MONITORING.md
    - Document how to access Render logs
    - Document how to access Firebase usage metrics
    - Document how to interpret health check responses
    - Document alert thresholds and response procedures
    - _Requirements: 13.6, 13.8, 13.9_


- [ ] 19. Final integration and deployment
  - [ ] 19.1 Merge initial setup to develop branch
    - Commit all configuration files (.env.example, .firebaserc, etc.)
    - Commit all new code (email sandbox, mock APIs, logging, validation)
    - Commit all documentation
    - Push to develop branch
    - Verify GitHub Actions workflow runs successfully
    - _Requirements: 6.1_

  - [ ] 19.2 Deploy and test development environment
    - Verify automatic deployment to development Firebase project
    - Access development frontend URL
    - Test form submission (verify email intercepted)
    - Test mock API responses
    - Verify environment banner shows "DEVELOPMENT"
    - _Requirements: 6.1, 9.1_

  - [ ] 19.3 Merge develop to staging branch
    - Create PR from develop to staging
    - Review changes
    - Merge PR
    - Verify GitHub Actions workflow runs successfully
    - _Requirements: 6.2_

  - [ ] 19.4 Deploy and test staging environment
    - Verify automatic deployment to staging Firebase project
    - Access staging frontend URL (nem-insurance-staging.web.app or staging.nemforms.com)
    - Test form submission (verify email intercepted)
    - Test mock API responses
    - Verify environment banner shows "STAGING"
    - Test admin sandbox emails viewer
    - Create test user accounts in staging Firebase Authentication
    - _Requirements: 6.2, 9.2, 10.10_

  - [ ] 19.5 Verify environment isolation
    - Sign in to staging with test account
    - Submit test form in staging
    - Verify data appears in staging Firestore
    - Sign in to production
    - Verify staging test data does NOT appear in production
    - Verify production data does NOT appear in staging
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 19.6 Checkpoint - Verify all systems operational
    - Development environment: frontend deployed, backend running, tests passing
    - Staging environment: frontend deployed, backend running, tests passing
    - Production environment: unchanged and still operational
    - All CI/CD pipelines: configured and working
    - All documentation: complete and accurate
    - All tests: passing
    - Ensure all tests pass, ask the user if questions arise.


- [ ] 20. Production deployment preparation
  - [ ] 20.1 Create production deployment checklist
    - Create docs/staging-environment/PRODUCTION_DEPLOYMENT_CHECKLIST.md
    - List all pre-deployment verification steps
    - List all post-deployment verification steps
    - Include rollback decision criteria
    - Include stakeholder notification procedures
    - _Requirements: 14.3, 14.8_

  - [ ] 20.2 Conduct staging acceptance testing
    - Complete all manual testing checklist items (task 15.6)
    - Verify all automated tests pass
    - Verify performance is acceptable
    - Verify no errors in staging logs
    - Document any issues found
    - Get stakeholder approval for production deployment
    - _Requirements: 10.3, 14.3_

  - [ ] 20.3 Prepare production deployment PR
    - Create PR from staging to main
    - Include detailed description of all changes
    - Include test results and verification evidence
    - Include rollback plan
    - Request reviews from team leads
    - _Requirements: 14.2, 14.3_

  - [ ] 20.4 Execute production deployment
    - Merge PR to main branch
    - Monitor GitHub Actions workflow execution
    - Verify production deployment completes successfully
    - Verify production frontend loads correctly
    - Verify production backend is healthy
    - Verify no environment banner is shown
    - _Requirements: 6.3, 9.3_

  - [ ] 20.5 Post-deployment verification
    - Test production form submission (real email should be sent)
    - Test production NIN verification (real API call)
    - Test production user sign-in
    - Monitor error rates for 24 hours
    - Verify no staging data leaked to production
    - Create git tag for production release
    - _Requirements: 14.6, 14.8_

  - [ ] 20.6 Final checkpoint - Production deployment complete
    - All three environments operational (development, staging, production)
    - CI/CD pipelines working for all branches
    - Email sandboxing working in staging
    - Mock APIs working in staging
    - Real emails and APIs working in production
    - All documentation complete
    - Team trained on new workflow
    - Ensure all tests pass, ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 19.6 and 20.6) ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases using vitest
- Integration tests verify cross-component behavior
- Manual testing checklist ensures real-world functionality

## Implementation Order

The tasks are ordered to minimize dependencies and enable incremental progress:

1. **Phase 1 (Tasks 1-3)**: Repository cleanup, Firebase projects, environment files
2. **Phase 2 (Tasks 4-7)**: Backend setup, email sandboxing, mock APIs, frontend config
3. **Phase 3 (Tasks 8-10)**: GitHub Secrets, CI/CD pipelines, git branches
4. **Phase 4 (Tasks 11-14)**: Backend validation, logging, CORS, Firebase Hosting
5. **Phase 5 (Tasks 15-18)**: Testing, documentation, security rotation, monitoring
6. **Phase 6 (Tasks 19-20)**: Integration, deployment, production rollout

## Testing Strategy

This implementation includes comprehensive testing at multiple levels:

- **Property-Based Tests**: Use fast-check to test universal properties across many input combinations
- **Unit Tests**: Test individual functions and components with specific examples
- **Integration Tests**: Test cross-component interactions and environment isolation
- **Manual Tests**: Verify real-world functionality and user experience

All tests should pass before promoting code between environments.

## Security Considerations

Critical security tasks that must not be skipped:

- Task 1.1: Remove sensitive files from git history
- Task 8.1-8.3: Configure GitHub Secrets properly
- Task 17.1-17.5: Rotate all exposed credentials
- Task 11.1: Implement environment variable validation
- Task 12.4: Implement production log sanitization

## Cost Optimization

To minimize staging costs:

- Use Firebase Spark (free) plan for development
- Use Firebase Blaze with spending limits for staging
- Use Render free tier for staging backend (can spin down when idle)
- Use mock APIs in staging to avoid third-party API charges
- Periodically clean up old staging data
- Monitor usage and set billing alerts

## Rollback Plan

If issues are discovered after production deployment:

1. Immediately revert the main branch to previous commit
2. Trigger production deployment workflow to deploy previous version
3. Verify production is stable
4. Investigate issues in staging environment
5. Fix issues and re-test in staging before attempting production deployment again

## Success Criteria

This implementation is complete when:

- ✅ Three separate Firebase projects are operational (dev, staging, prod)
- ✅ Separate backend servers are running (staging and production)
- ✅ Email sandboxing works in staging (no real emails sent)
- ✅ Mock APIs work in staging (no real API charges)
- ✅ CI/CD pipelines automatically deploy to correct environments
- ✅ All sensitive credentials are removed from git history
- ✅ All secrets are stored in GitHub Secrets or Render
- ✅ Complete data isolation between environments
- ✅ All automated tests pass
- ✅ All documentation is complete
- ✅ Production deployment is successful with no issues
