@echo off
echo Deploying CAC Production Fix...
echo.

echo Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
echo ✅ CAC Production Fix deployed successfully!
echo.
echo Next steps:
echo 1. Test the decryption endpoint using the test script in browser console
echo 2. Try previewing CAC documents in production
echo 3. Monitor browser console for any remaining errors
echo.
pause