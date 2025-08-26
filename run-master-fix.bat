@echo off
REM Master softlyplease.com fix script runner
echo 🚀 Starting Master softlyplease.com Fix...
echo.

REM Run the PowerShell master script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0master-softlyplease-fix.ps1"

echo.
echo 🎉 Master fix script completed!
echo.
echo 📋 Check the output above for specific instructions
echo.
echo 📖 See COMPREHENSIVE-FIX-GUIDE.txt for detailed documentation
echo.
echo Press any key to continue...
pause > nul
