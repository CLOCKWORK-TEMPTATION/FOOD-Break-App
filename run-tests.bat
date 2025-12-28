@echo off
echo ========================================
echo Running Tests with Coverage Report
echo ========================================
echo.

cd /d e:\breakapp

echo Installing dependencies...
call npm install --silent

echo.
echo Running tests...
echo.

call npm test -- --verbose --coverage --coverageReporters=text --coverageReporters=json-summary

echo.
echo ========================================
echo Coverage Report Generated
echo ========================================
echo.
echo Check coverage/index.html for detailed report
echo.

pause
