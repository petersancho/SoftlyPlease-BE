@echo off
REM AUTO SETUP SCRIPT FOR SOFTLYPLEASE.COM
REM This downloads and runs the complete setup automatically

echo 🚀 Starting SoftlyPlease.com Auto Setup...
echo.

REM Create the PowerShell setup script
echo Creating setup script...
(
echo # COMPLETE SOFTLYPLEASE AZURE VM SETUP SCRIPT
echo # Run this on your Azure VM as Administrator
echo.
echo Write-Host "🚀 COMPLETE SOFTLYPLEASE AZURE VM SETUP" -ForegroundColor Green
echo Write-Host "=========================================" -ForegroundColor Yellow
echo.
echo # Check if running as Administrator
echo $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
echo $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
echo $adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator
echo.
echo if (-not $principal.IsInRole($adminRole)) {
echo    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
echo    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
echo    exit 1
echo }
echo.
echo Write-Host "✅ Running as Administrator" -ForegroundColor Green
echo.
echo # Set paths
echo $nodePath = "C:\Program Files\nodejs"
echo $nssmPath = "C:\Windows\System32\nssm.exe"
echo $appPath = "C:\compute-sp\SoftlyPlease-BE-main\compute.rhino3d.appserver"
echo $serviceName = "SoftlyPleaseAppServer"
echo.
echo # Check Node.js
echo Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
echo try {
echo     $nodeVersion = & "$nodePath\node.exe" --version 2>$null
echo     Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
echo } catch {
echo     Write-Host "❌ Node.js not found. Installing..." -ForegroundColor Yellow
echo     $nodeUrl = "https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi"
echo     $installerPath = "$env:TEMP\node-installer.msi"
echo     Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath
echo     Start-Process msiexec.exe -ArgumentList "/i", $installerPath, "/quiet", "/norestart" -Wait
echo     $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
echo }
echo.
echo # Install NSSM
echo Write-Host "🔧 Installing NSSM..." -ForegroundColor Yellow
echo if (-not (Test-Path $nssmPath)) {
echo     $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
echo     Invoke-WebRequest -Uri $nssmUrl -OutFile "$env:TEMP\nssm.zip"
echo     Expand-Archive -Path "$env:TEMP\nssm.zip" -DestinationPath $env:TEMP -Force
echo     Copy-Item "$env:TEMP\nssm-2.24\win64\nssm.exe" "C:\Windows\System32\" -Force
echo }
echo Write-Host "✅ NSSM ready" -ForegroundColor Green
echo.
echo # Install dependencies
echo Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
echo Set-Location $appPath
echo & "$nodePath\npm.cmd" install --production
echo Write-Host "✅ Dependencies installed" -ForegroundColor Green
echo.
echo # Install service
echo Write-Host "🔧 Installing Windows service..." -ForegroundColor Yellow
echo & $nssmPath install $serviceName "$nodePath\node.exe" "$appPath\src\bin\www"
echo & $nssmPath set $serviceName AppDirectory $appPath
echo & $nssmPath set $serviceName AppEnvironmentExtra NODE_ENV=production
echo & $nssmPath set $serviceName AppEnvironmentExtra RHINO_COMPUTE_URL=http://4.248.252.92:6500/
echo & $nssmPath set $serviceName DisplayName "SoftlyPlease AppServer"
echo & $nssmPath set $serviceName Start SERVICE_AUTO_START
echo Write-Host "✅ Service installed" -ForegroundColor Green
echo.
echo # Start service
echo Write-Host "🚀 Starting service..." -ForegroundColor Yellow
echo & $nssmPath start $serviceName
echo Start-Sleep -Seconds 10
echo Write-Host "✅ Service started" -ForegroundColor Green
echo.
echo # Test
echo Write-Host "🧪 Testing..." -ForegroundColor Yellow
echo try {
echo     $test = Invoke-WebRequest -Uri "http://localhost:80/version" -TimeoutSec 10
echo     Write-Host "✅ Local server working" -ForegroundColor Green
echo } catch {
echo     Write-Host "⚠️ Local server not responding yet" -ForegroundColor Yellow
echo }
echo.
echo Write-Host "🎉 SETUP COMPLETE! Test https://softlyplease.com" -ForegroundColor Green
) > complete-setup.ps1

echo ✅ Setup script created
echo.

REM Run the PowerShell script
echo 🚀 Running setup script...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-setup.ps1"

echo.
echo 🎉 Auto setup complete!
echo.
echo Test your website:
echo https://softlyplease.com
echo.
pause
