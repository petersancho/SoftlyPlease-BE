@echo off
REM SoftlyPlease AppServer Deployment Script
echo ========================================
echo SoftlyPlease Rhino Compute AppServer
echo Production Deployment
echo ========================================

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator - OK
) else (
    echo ERROR: This script must be run as Administrator
    echo Right-click and "Run as Administrator"
    pause
    exit /b 1
)

echo.
echo Installing Windows Service...
echo This may take a few minutes...
echo.

REM Run the PowerShell service installation
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\install-service.ps1"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your app should now be accessible at:
echo   http://localhost:80
echo   http://your-server-ip:80
echo   https://www.softlyplease.com (after DNS setup)
echo.
echo Service Management:
echo   nssm start SoftlyPleaseAppServer
echo   nssm stop SoftlyPleaseAppServer
echo   nssm restart SoftlyPleaseAppServer
echo.
echo For troubleshooting, see DEPLOYMENT_README.md
echo.

pause
