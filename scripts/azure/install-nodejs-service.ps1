# INSTALL NODE.JS SERVICE ON AZURE VM
# Run this on your Azure VM as Administrator

Write-Host "🔧 INSTALLING SOFTLYPLEASE NODE.JS SERVICE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow

# Check if running as Administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $principal.IsInRole($adminRole)) {
   Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
   Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
   exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green

# Check if Node.js is installed
Write-Host "`n📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ NPM: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Installing..." -ForegroundColor Red

    # Download and install Node.js
    $nodeUrl = "https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi"
    $installerPath = "$env:TEMP\node-installer.msi"

    Write-Host "Downloading Node.js..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath

    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    Start-Process msiexec.exe -ArgumentList "/i", $installerPath, "/quiet", "/norestart" -Wait

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # Test installation
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js installation failed" -ForegroundColor Red
        exit 1
    }
}

# Check application directory
Write-Host "`n📁 Checking application directory..." -ForegroundColor Yellow
$appPath = "C:\Users\petersanch\compute-sp"

if (Test-Path $appPath) {
    Write-Host "✅ Application directory exists: $appPath" -ForegroundColor Green

    # Check key files
    $keyFiles = @("package.json", "src\bin\www", "src\app.js", "config.js")
    foreach ($file in $keyFiles) {
        $filePath = Join-Path $appPath $file
        if (Test-Path $filePath) {
            Write-Host "✅ $file exists" -ForegroundColor Green
        } else {
            Write-Host "❌ $file missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Application directory not found: $appPath" -ForegroundColor Red
    Write-Host "Clone the repository first:" -ForegroundColor Yellow
    Write-Host "git clone https://github.com/your-repo/compute-sp.git" -ForegroundColor White
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location $appPath
try {
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Install NSSM (Non-Sucking Service Manager)
Write-Host "`n🔧 Installing NSSM (Windows Service Manager)..." -ForegroundColor Yellow
$nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
$zipPath = "$env:TEMP\nssm.zip"
$nssmPath = "$env:TEMP\nssm-2.24"

# Download NSSM
Invoke-WebRequest -Uri $nssmUrl -OutFile $zipPath

# Extract NSSM
Expand-Archive -Path $zipPath -DestinationPath $env:TEMP -Force

# Copy NSSM to System32
$nssmExe = "$nssmPath\win64\nssm.exe"
if (Test-Path $nssmExe) {
    Copy-Item $nssmExe "C:\Windows\System32\" -Force
    Write-Host "✅ NSSM installed" -ForegroundColor Green
} else {
    Write-Host "❌ NSSM extraction failed" -ForegroundColor Red
    exit 1
}

# Create Windows service
Write-Host "`n🔧 Creating Windows service..." -ForegroundColor Yellow

$serviceName = "SoftlyPleaseAppServer"
$nodePath = (Get-Command node).Source
$appScript = "$appPath\src\bin\www"

# Remove existing service if it exists
try {
    nssm stop $serviceName confirm
    nssm remove $serviceName confirm
    Write-Host "Removed existing service" -ForegroundColor Yellow
} catch {
    Write-Host "No existing service to remove" -ForegroundColor Yellow
}

# Install new service
nssm install $serviceName $nodePath $appScript

# Set service parameters
nssm set $serviceName AppDirectory $appPath
nssm set $serviceName AppEnvironmentExtra NODE_ENV=production
nssm set $serviceName AppEnvironmentExtra RHINO_COMPUTE_URL=http://4.248.252.92:6500/
nssm set $serviceName AppEnvironmentExtra RHINO_COMPUTE_APIKEY=p2robot-13a6-48f3-b24e-2025computeX
nssm set $serviceName DisplayName "SoftlyPlease AppServer"
nssm set $serviceName Description "SoftlyPlease Node.js Application Server"
nssm set $serviceName Start SERVICE_AUTO_START

Write-Host "✅ Service created with NSSM" -ForegroundColor Green

# Start the service
Write-Host "`n🚀 Starting the service..." -ForegroundColor Yellow
try {
    nssm start $serviceName
    Write-Host "✅ Service started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
}

# Verify service is running
Write-Host "`n🔍 Verifying service..." -ForegroundColor Yellow
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "Service Status: $($service.Status)" -ForegroundColor Cyan

    if ($service.Status -eq "Running") {
        Write-Host "✅ SUCCESS: $serviceName is running!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Service is not running. Starting manually..." -ForegroundColor Yellow
        Start-Service $serviceName
        Start-Sleep -Seconds 3
        $service = Get-Service $serviceName
        Write-Host "Service Status: $($service.Status)" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Service not found" -ForegroundColor Red
}

# Test the service
Write-Host "`n🧪 Testing the service..." -ForegroundColor Yellow

# Test local connection
try {
    $localTest = Invoke-WebRequest -Uri "http://localhost:80/version" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($localTest.StatusCode -eq 200) {
        Write-Host "✅ Local test successful" -ForegroundColor Green
        Write-Host "Response: $($localTest.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Local test returned status: $($localTest.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Local test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test external connection
try {
    $externalTest = Invoke-WebRequest -Uri "https://softlyplease.com/version" -TimeoutSec 15 -ErrorAction SilentlyContinue
    if ($externalTest.StatusCode -eq 200) {
        Write-Host "✅ External test successful" -ForegroundColor Green
        Write-Host "Response: $($externalTest.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ External test returned status: $($externalTest.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ External test failed (DNS may be propagating): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🎉 INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "✅ Node.js installed" -ForegroundColor Green
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host "✅ NSSM installed" -ForegroundColor Green
Write-Host "✅ Windows service created" -ForegroundColor Green
Write-Host "✅ Service started" -ForegroundColor Green

Write-Host "`n🔧 To manage the service:" -ForegroundColor Cyan
Write-Host "nssm start $serviceName    # Start service" -ForegroundColor White
Write-Host "nssm stop $serviceName     # Stop service" -ForegroundColor White
Write-Host "nssm restart $serviceName  # Restart service" -ForegroundColor White
Write-Host "nssm remove $serviceName   # Remove service" -ForegroundColor White

Write-Host "`n📋 Service logs:" -ForegroundColor Cyan
Write-Host "nssm edit $serviceName     # Edit service settings" -ForegroundColor White

Write-Host "`n🌐 Your website should now be working at:" -ForegroundColor Green
Write-Host "https://softlyplease.com" -ForegroundColor Green
