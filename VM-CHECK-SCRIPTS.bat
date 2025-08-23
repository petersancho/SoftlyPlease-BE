@echo off
echo ========================================
echo Rhino Compute Configuration Checker
echo ========================================

echo.
echo Checking for Rhino Compute configuration files...
echo.

echo 1. Checking McNeel directory structure:
echo ----------------------------------------
if exist "C:\McNeel\" (
    echo Found McNeel directory
    dir "C:\McNeel\" /s /b | findstr -i compute
    dir "C:\McNeel\" /s /b | findstr -i rhino
) else (
    echo McNeel directory not found
)

echo.
echo 2. Checking Program Files:
echo --------------------------
dir "C:\Program Files\McNeel\" /s /b 2>nul | findstr -i compute

echo.
echo 3. Checking compute folder:
echo ---------------------------
if exist "C:\compute\" (
    echo Found compute folder - contents:
    dir "C:\compute\" /s /b
    echo.
    echo Checking for config files:
    if exist "C:\compute\appsettings.json" (
        echo Found appsettings.json:
        type "C:\compute\appsettings.json"
    ) else (
        echo No appsettings.json found
    )
) else (
    echo compute folder not found
)

echo.
echo 4. Checking all JSON files:
echo ---------------------------
dir C:\ /s /b *.json 2>nul | findstr -i compute

echo.
echo 5. Checking for running services:
echo ---------------------------------
net start | findstr -i rhino
net start | findstr -i compute

echo.
echo 6. Checking process list:
echo -------------------------
tasklist | findstr -i rhino
tasklist | findstr -i compute

echo.
echo ========================================
echo Configuration Check Complete
echo ========================================
echo.
echo If you found config files, check their ApiKey settings
echo If no config files found, try the compute folder
echo.
pause
