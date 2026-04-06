@echo off
REM Setup script for git hooks (Windows)

echo Setting up git hooks...

REM Check if .git directory exists
if not exist ".git" (
  echo Error: .git directory not found. Are you in the project root?
  exit /b 1
)

REM Create hooks directory if it doesn't exist
if not exist ".git\hooks" mkdir ".git\hooks"

REM Copy pre-commit hook
if exist ".git-hooks\pre-commit" (
  copy /Y ".git-hooks\pre-commit" ".git\hooks\pre-commit" >nul
  echo Pre-commit hook installed
) else (
  echo Error: .git-hooks\pre-commit not found
  exit /b 1
)

echo.
echo Git hooks setup complete!
echo.
echo The pre-commit hook will now scan for secrets before each commit.
echo To bypass (NOT RECOMMENDED): git commit --no-verify
