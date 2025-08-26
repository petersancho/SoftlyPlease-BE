@echo off
REM Complete softlyplease.com fix and deployment script
REM Run this batch file to execute all local fixes

echo 🚀 Starting complete softlyplease.com fix...
echo.

REM Run the PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-fix-deploy.ps1"

echo.
echo 🎉 Complete fix script finished!
echo.
echo 📋 NEXT: Read AZURE-VM-FIX-README.txt for Azure VM restart instructions
echo.
echo Press any key to continue...
pause > nul
