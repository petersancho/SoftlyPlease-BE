@echo off
REM Quick test of softlyplease.com components
echo 🧪 Testing softlyplease.com components...
echo.

echo 1. Testing Rhino Compute Server...
curl -s http://4.248.252.92:6500/version
if %ERRORLEVEL% EQU 0 (
    echo ✅ Rhino Compute: WORKING
) else (
    echo ❌ Rhino Compute: NOT WORKING
)
echo.

echo 2. Testing Heroku AppServer...
curl -s https://softlyplease-appserver.herokuapp.com/version
if %ERRORLEVEL% EQU 0 (
    echo ✅ Heroku AppServer: WORKING
) else (
    echo ❌ Heroku AppServer: NOT WORKING
)
echo.

echo 3. Testing Frontend (Azure VM)...
curl -s https://softlyplease.com/version
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend: WORKING
) else (
    echo ❌ Frontend: NOT WORKING
)
echo.

echo 4. Testing JSON API...
curl -s "https://softlyplease-appserver.herokuapp.com/?format=json"
if %ERRORLEVEL% EQU 0 (
    echo ✅ JSON API: WORKING
) else (
    echo ❌ JSON API: NOT WORKING
)
echo.

echo 🎯 Test complete!
echo.
echo 💡 If Rhino Compute is working but others aren't:
echo    1. Check if Azure VM Node.js service is running
echo    2. Make sure softlyplease.com points to 4.248.252.92
echo    3. Verify Heroku app is deployed
echo.
pause
