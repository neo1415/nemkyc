@echo off
REM Script to copy all backend files to backend-package folder
REM Run this from the root of your current repository

echo ========================================
echo NEM Insurance Backend Files Copy Script
echo ========================================
echo.

REM Create backend-package directory structure
echo Creating directory structure...
mkdir backend-package 2>nul
mkdir backend-package\server-services 2>nul
mkdir backend-package\server-services\__mocks__ 2>nul
mkdir backend-package\server-utils 2>nul
mkdir backend-package\server-utils\__tests__ 2>nul
mkdir backend-package\scripts 2>nul
mkdir backend-package\load-tests 2>nul
mkdir backend-package\docs 2>nul

echo.
echo Copying core server files...
copy server.js backend-package\server.js
copy package.json backend-package\package.json
copy .env.example backend-package\.env.example
copy .gitignore backend-package\.gitignore

echo.
echo Copying server-services...
copy server-services\dataproClient.cjs backend-package\server-services\dataproClient.cjs
copy server-services\__mocks__\dataproClient.cjs backend-package\server-services\__mocks__\dataproClient.cjs

echo.
echo Copying server-utils...
copy server-utils\encryption.cjs backend-package\server-utils\encryption.cjs
copy server-utils\auditLogger.cjs backend-package\server-utils\auditLogger.cjs
copy server-utils\rateLimiter.cjs backend-package\server-utils\rateLimiter.cjs
copy server-utils\apiUsageTracker.cjs backend-package\server-utils\apiUsageTracker.cjs
copy server-utils\verificationQueue.cjs backend-package\server-utils\verificationQueue.cjs
copy server-utils\healthMonitor.cjs backend-package\server-utils\healthMonitor.cjs
copy server-utils\securityMiddleware.cjs backend-package\server-utils\securityMiddleware.cjs
copy server-utils\__tests__\encryption.test.cjs backend-package\server-utils\__tests__\encryption.test.cjs
copy server-utils\__tests__\verificationQueue.test.cjs backend-package\server-utils\__tests__\verificationQueue.test.cjs

echo.
echo Copying scripts...
copy scripts\encrypt-existing-identity-data.js backend-package\scripts\encrypt-existing-identity-data.js
copy scripts\ENCRYPTION_MIGRATION_README.md backend-package\scripts\ENCRYPTION_MIGRATION_README.md

echo.
echo Copying load-tests...
copy load-tests\bulk-verification-test.js backend-package\load-tests\bulk-verification-test.js
copy load-tests\rate-limit-test.js backend-package\load-tests\rate-limit-test.js
copy load-tests\test-data-generator.js backend-package\load-tests\test-data-generator.js
copy load-tests\package.json backend-package\load-tests\package.json
copy load-tests\README.md backend-package\load-tests\README.md

echo.
echo Copying documentation...
copy docs\API_DOCUMENTATION.md backend-package\docs\API_DOCUMENTATION.md
copy docs\PRODUCTION_DEPLOYMENT_CHECKLIST.md backend-package\docs\PRODUCTION_DEPLOYMENT_CHECKLIST.md
copy docs\PRODUCTION_MONITORING_SETUP.md backend-package\docs\PRODUCTION_MONITORING_SETUP.md
copy docs\PRODUCTION_ROLLBACK_PLAN.md backend-package\docs\PRODUCTION_ROLLBACK_PLAN.md
copy docs\LOAD_TESTING_GUIDE.md backend-package\docs\LOAD_TESTING_GUIDE.md
copy docs\VERIFICATION_QUEUE_GUIDE.md backend-package\docs\VERIFICATION_QUEUE_GUIDE.md
copy docs\QUEUE_SYSTEM_DIAGRAM.md backend-package\docs\QUEUE_SYSTEM_DIAGRAM.md
copy docs\NDPR_ENCRYPTION_IMPLEMENTATION.md backend-package\docs\NDPR_ENCRYPTION_IMPLEMENTATION.md
copy docs\BROKER_TRAINING_GUIDE.md backend-package\docs\BROKER_TRAINING_GUIDE.md
copy docs\ADMIN_USER_GUIDE.md backend-package\docs\ADMIN_USER_GUIDE.md
copy .kiro\specs\identity-remediation\SECURITY_DOCUMENTATION.md backend-package\docs\SECURITY_DOCUMENTATION.md

echo.
echo Copying README and guides...
copy backend-package\README.md backend-package\README.md 2>nul
copy backend-package\BACKEND_FILES_GUIDE.md backend-package\BACKEND_FILES_GUIDE.md 2>nul

echo.
echo ========================================
echo ✅ All files copied successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Review files in backend-package folder
echo 2. Copy backend-package contents to your backend repo
echo 3. Run: npm install
echo 4. Configure .env file
echo 5. Generate encryption key
echo 6. Test server startup
echo.
echo See backend-package\BACKEND_FILES_GUIDE.md for detailed instructions
echo.
pause
