@echo off
REM Test script for Gemini API endpoint (Windows)
REM Usage: test-gemini-endpoint.bat [server-url]
REM Example: test-gemini-endpoint.bat https://nem-server-rhdb.onrender.com

setlocal enabledelayedexpansion

if "%1"=="" (
    set SERVER_URL=http://localhost:3001
) else (
    set SERVER_URL=%1
)

set ENDPOINT=%SERVER_URL%/api/gemini/generate

echo =========================================
echo Gemini API Endpoint Test
echo =========================================
echo Server URL: %SERVER_URL%
echo Endpoint: %ENDPOINT%
echo.

REM Test 1: Check if endpoint is accessible
echo Test 1: Endpoint Accessibility
echo -------------------------------

curl -s -X POST "%ENDPOINT%" ^
  -H "Content-Type: application/json" ^
  -d "{\"contents\":[{\"parts\":[{\"text\":\"test\"}]}]}" ^
  -o response.json ^
  -w "HTTP Status Code: %%{http_code}\n"

echo Response Body:
type response.json
echo.

REM Check if response contains HTML DOCTYPE
findstr /C:"<!DOCTYPE" response.json >nul
if %errorlevel%==0 (
    echo [X] CRITICAL: Response contains HTML DOCTYPE
    echo     This indicates the endpoint is returning an HTML error page
    echo     instead of JSON. Check server logs and environment variables.
) else (
    echo [OK] Response does not contain HTML DOCTYPE
)

echo.

REM Test 2: Check for API key configuration
echo Test 2: API Key Configuration
echo ------------------------------

findstr /C:"Gemini API key not configured" response.json >nul
if %errorlevel%==0 (
    echo [X] API key is NOT configured
    echo     Action: Set GEMINI_API_KEY environment variable in production
    echo     Get key from: https://makersuite.google.com/app/apikey
) else (
    findstr /C:"Invalid API key" response.json >nul
    if %errorlevel%==0 (
        echo [X] API key is INVALID
        echo     Action: Generate a new key from https://makersuite.google.com/app/apikey
    ) else (
        echo [OK] API key appears to be configured correctly
    )
)

echo.
echo =========================================
echo Test Summary
echo =========================================

findstr /C:"<!DOCTYPE" response.json >nul
if %errorlevel%==0 (
    echo [X] CRITICAL ISSUE
    echo     Endpoint is returning HTML instead of JSON
    echo     Check server deployment and routing
) else (
    findstr /C:"Gemini API key not configured" response.json >nul
    if %errorlevel%==0 (
        echo [!] CONFIGURATION NEEDED
        echo     Set GEMINI_API_KEY environment variable
    ) else (
        echo [OK] Endpoint appears to be working
        echo     Check response.json for details
    )
)

echo.
echo For more help, see: GEMINI_DEPLOYMENT_GUIDE.md
echo =========================================

REM Cleanup
del response.json

endlocal
