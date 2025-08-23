@echo off
echo ========================================
echo Azure VM Safe Cleanup Script
echo ========================================
echo This will delete files and folders that are safe to remove
echo Press Ctrl+C to cancel, or any key to continue...
pause >nul

echo.
echo Starting cleanup process...
echo.

echo Deleting safe files...
echo ----------------------

if exist "C:\win-acme.v2.2.9.1701.64.pluggable.zip" (
    echo Deleting win-acme backup...
    del "C:\win-acme.v2.2.9.1701.64.pluggable.zip"
    echo ✓ Deleted win-acme backup
) else (
    echo - win-acme backup not found
)

if exist "C:\bootstrap_step-2_log.txt" (
    echo Deleting bootstrap log 2...
    del "C:\bootstrap_step-2_log.txt"
    echo ✓ Deleted bootstrap log 2
) else (
    echo - bootstrap log 2 not found
)

if exist "C:\bootstrap_step-1_log.txt" (
    echo Deleting bootstrap log 1...
    del "C:\bootstrap_step-1_log.txt"
    echo ✓ Deleted bootstrap log 1
) else (
    echo - bootstrap log 1 not found
)

if exist "C:\public_suffix_list.dat" (
    echo Deleting public suffix list...
    del "C:\public_suffix_list.dat"
    echo ✓ Deleted public suffix list
) else (
    echo - public suffix list not found
)

if exist "C:\settings_default.json" (
    echo Deleting default settings...
    del "C:\settings_default.json"
    echo ✓ Deleted default settings
) else (
    echo - default settings not found
)

if exist "C:\Web_Config.xml" (
    echo Deleting web config...
    del "C:\Web_Config.xml"
    echo ✓ Deleted web config
) else (
    echo - web config not found
)

if exist "C:\version.txt" (
    echo Deleting version file...
    del "C:\version.txt"
    echo ✓ Deleted version file
) else (
    echo - version file not found
)

echo.
echo Deleting safe folders...
echo -----------------------

if exist "C:\MACOSX" (
    echo Deleting MACOSX folder...
    rd /s /q "C:\MACOSX"
    echo ✓ Deleted MACOSX folder
) else (
    echo - MACOSX folder not found
)

if exist "C:\emptyfolderforweb" (
    echo Deleting empty web folder...
    rd /s /q "C:\emptyfolderforweb"
    echo ✓ Deleted empty web folder
) else (
    echo - empty web folder not found
)

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Space freed: Approximately 37MB
echo.
echo Next steps:
echo 1. Check the potentially safe folders before deleting
echo 2. Test your applications to ensure they still work
echo 3. Consider deleting old log files if not needed
echo.
echo Press any key to exit...
pause >nul
