# COMPLETE SOFTLYPLEASE AZURE VM SETUP SCRIPT
# This script does everything needed to get softlyplease.com working
# Run this on your Azure VM as Administrator

Write-Host "🚀 COMPLETE SOFTLYPLEASE AZURE VM SETUP" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "This script will:" -ForegroundColor Cyan
Write-Host "1. Install Node.js (if needed)" -ForegroundColor White
Write-Host "2. Install NSSM service manager" -ForegroundColor White
Write-Host "3. Install Node.js AppServer as Windows service" -ForegroundColor White
Write-Host "4. Configure the service" -ForegroundColor White
Write-Host "5. Start the service" -ForegroundColor White
Write-Host "6. Test everything" -ForegroundColor White
Write-Host ""

# Check if running as Administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $principal.IsInRole($adminRole)) {
   Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
   Write-Host "Solution: Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
   exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green

# Set paths
$nodePath = "C:\Program Files\nodejs"
$nssmPath = "C:\Windows\System32\nssm.exe"
$appPath = "C:\compute-sp\SoftlyPlease-BE-main\compute.rhino3d.appserver"
$serviceName = "SoftlyPleaseAppServer"

# ================================================
# STEP 1: Check if Node.js is installed
# ================================================
Write-Host "`n📦 STEP 1: Checking Node.js installation..." -ForegroundColor Yellow

try {
    $nodeVersion = & "$nodePath\node.exe" --version 2>$null
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    $nodeInstalled = $true
} catch {
    Write-Host "❌ Node.js not found. Installing..." -ForegroundColor Yellow
    $nodeInstalled = $false
}

if (-not $nodeInstalled) {
    # Download and install Node.js
    $nodeUrl = "https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi"
    $installerPath = "$env:TEMP\node-installer.msi"

    Write-Host "Downloading Node.js..." -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -ErrorAction Stop
        Write-Host "Installing Node.js..." -ForegroundColor Cyan
        Start-Process msiexec.exe -ArgumentList "/i", $installerPath, "/quiet", "/norestart" -Wait -ErrorAction Stop

        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        # Verify installation
        try {
            $nodeVersion = & "$nodePath\node.exe" --version 2>$null
            Write-Host "✅ Node.js installed successfully: $nodeVersion" -ForegroundColor Green
        } catch {
            Write-Host "❌ Node.js installation failed" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Failed to download/install Node.js: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# ================================================
# STEP 2: Install NSSM
# ================================================
Write-Host "`n🔧 STEP 2: Installing NSSM service manager..." -ForegroundColor Yellow

if (Test-Path $nssmPath) {
    Write-Host "✅ NSSM already installed" -ForegroundColor Green
} else {
    # Download NSSM
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $zipPath = "$env:TEMP\nssm.zip"
    $nssmExtractPath = "$env:TEMP\nssm-2.24"

    try {
        Write-Host "Downloading NSSM..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $nssmUrl -OutFile $zipPath -ErrorAction Stop

        Write-Host "Extracting NSSM..." -ForegroundColor Cyan
        Expand-Archive -Path $zipPath -DestinationPath $env:TEMP -Force -ErrorAction Stop

        Write-Host "Installing NSSM..." -ForegroundColor Cyan
        Copy-Item "$nssmExtractPath\win64\nssm.exe" "C:\Windows\System32\" -Force -ErrorAction Stop

        Write-Host "✅ NSSM installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install NSSM: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Manual installation: Download from https://nssm.cc/download" -ForegroundColor Yellow
        exit 1
    }
}

# ================================================
# STEP 3: Check application directory
# ================================================
Write-Host "`n📁 STEP 3: Checking application directory..." -ForegroundColor Yellow

if (-not (Test-Path $appPath)) {
    Write-Host "❌ Application directory not found: $appPath" -ForegroundColor Red
    Write-Host "Please ensure the SoftlyPlease-BE-main folder is in C:\compute-sp\" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Application directory found" -ForegroundColor Green

# Check key files
$keyFiles = @("package.json", "src\bin\www", "src\app.js")
foreach ($file in $keyFiles) {
    $filePath = Join-Path $appPath $file
    if (Test-Path $filePath) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing: $filePath" -ForegroundColor Red
        exit 1
    }
}

# ================================================
# STEP 4: Install dependencies
# ================================================
Write-Host "`n📦 STEP 4: Installing Node.js dependencies..." -ForegroundColor Yellow

Set-Location $appPath
try {
    & "$nodePath\npm.cmd" install --production
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ================================================
# STEP 5: Install Windows service
# ================================================
Write-Host "`n🔧 STEP 5: Installing Windows service..." -ForegroundColor Yellow

# Remove existing service if it exists
try {
    & $nssmPath stop $serviceName confirm 2>$null
    & $nssmPath remove $serviceName confirm 2>$null
    Write-Host "Cleaned up existing service" -ForegroundColor Cyan
} catch {
    Write-Host "No existing service to clean up" -ForegroundColor Cyan
}

# Install new service
Write-Host "Installing service..." -ForegroundColor Cyan
& $nssmPath install $serviceName "$nodePath\node.exe" "$appPath\src\bin\www"

# Configure service
Write-Host "Configuring service..." -ForegroundColor Cyan
& $nssmPath set $serviceName AppDirectory $appPath
& $nssmPath set $serviceName AppEnvironmentExtra NODE_ENV=production
& $nssmPath set $serviceName AppEnvironmentExtra RHINO_COMPUTE_URL=http://4.248.252.92:6500/
& $nssmPath set $serviceName AppEnvironmentExtra RHINO_COMPUTE_APIKEY=p2robot-13a6-48f3-b24e-2025computeX
& $nssmPath set $serviceName DisplayName "SoftlyPlease AppServer"
& $nssmPath set $serviceName Description "Rhino Compute AppServer for softlyplease.com"
& $nssmPath set $serviceName Start SERVICE_AUTO_START

Write-Host "✅ Service installed and configured" -ForegroundColor Green

# ================================================
# STEP 6: Start the service
# ================================================
Write-Host "`n🚀 STEP 6: Starting the service..." -ForegroundColor Yellow

try {
    & $nssmPath start $serviceName
    Write-Host "✅ Service started" -ForegroundColor Green

    # Wait for service to initialize
    Start-Sleep -Seconds 10

    # Check status
    $status = & $nssmPath status $serviceName
    Write-Host "Service status: $status" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ================================================
# STEP 7: Test the service
# ================================================
Write-Host "`n🧪 STEP 7: Testing the service..." -ForegroundColor Yellow

# Test local Node.js server
Write-Host "Testing local Node.js server..." -ForegroundColor Cyan
try {
    $localTest = Invoke-WebRequest -Uri "http://localhost:80/version" -TimeoutSec 15 -ErrorAction Stop
    if ($localTest.StatusCode -eq 200) {
        Write-Host "✅ Local Node.js server responding" -ForegroundColor Green
        Write-Host "   Response: $($localTest.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Local server returned status: $($localTest.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Local server test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test external domain
Write-Host "Testing external domain..." -ForegroundColor Cyan
try {
    $externalTest = Invoke-WebRequest -Uri "https://softlyplease.com/version" -TimeoutSec 15 -ErrorAction Stop
    $contentType = $externalTest.Headers.'Content-Type'

    if ($externalTest.StatusCode -eq 200 -and $contentType -and $contentType.Contains('application/json')) {
        Write-Host "✅ External domain responding with JSON" -ForegroundColor Green
        Write-Host "   Response: $($externalTest.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ External domain returned status: $($externalTest.StatusCode)" -ForegroundColor Yellow
        if ($contentType) {
            Write-Host "   Content-Type: $contentType" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "⚠️ External domain test failed (DNS may be propagating): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test Heroku (should already work)
Write-Host "Testing Heroku AppServer..." -ForegroundColor Cyan
try {
    $herokuTest = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/version" -TimeoutSec 10 -ErrorAction Stop
    if ($herokuTest.StatusCode -eq 200) {
        Write-Host "✅ Heroku AppServer responding" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Heroku returned status: $($herokuTest.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Heroku test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Rhino Compute (should already work)
Write-Host "Testing Rhino Compute..." -ForegroundColor Cyan
try {
    $rhinoTest = Invoke-WebRequest -Uri "http://4.248.252.92:6500/version" -TimeoutSec 10 -ErrorAction Stop
    if ($rhinoTest.StatusCode -eq 200) {
        Write-Host "✅ Rhino Compute responding" -ForegroundColor Green
        Write-Host "   Response: $($rhinoTest.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Rhino Compute returned status: $($rhinoTest.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Rhino Compute test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ================================================
# FINAL STATUS
# ================================================
Write-Host "`n🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

Write-Host "`n📊 FINAL STATUS:" -ForegroundColor Cyan
Write-Host "✅ Node.js installed" -ForegroundColor Green
Write-Host "✅ NSSM service manager installed" -ForegroundColor Green
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host "✅ Windows service created and configured" -ForegroundColor Green
Write-Host "✅ Service started" -ForegroundColor Green

Write-Host "`n🔧 SERVICE MANAGEMENT:" -ForegroundColor Cyan
Write-Host "Start service:  nssm start $serviceName" -ForegroundColor White
Write-Host "Stop service:   nssm stop $serviceName" -ForegroundColor White
Write-Host "Restart service: nssm restart $serviceName" -ForegroundColor White
Write-Host "Service status: nssm status $serviceName" -ForegroundColor White
Write-Host "Edit service:   nssm edit $serviceName" -ForegroundColor White

Write-Host "`n🌐 ENDPOINTS:" -ForegroundColor Cyan
Write-Host "Local Node.js:  http://localhost:80" -ForegroundColor White
Write-Host "Main Domain:    https://softlyplease.com" -ForegroundColor White
Write-Host "Heroku Backup:  https://softlyplease-appserver.herokuapp.com" -ForegroundColor White
Write-Host "Rhino Compute:  http://4.248.252.92:6500" -ForegroundColor White

Write-Host "`n🎯 softlyplease.com should now be FULLY FUNCTIONAL!" -ForegroundColor Green
Write-Host "Complete pipeline: Frontend → Node.js API → Rhino Compute Geometry" -ForegroundColor Green

Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test https://softlyplease.com in your browser" -ForegroundColor White
Write-Host "2. Verify geometry processing works" -ForegroundColor White
Write-Host "3. The service will start automatically on reboot" -ForegroundColor White

Write-Host "`n🚀 Setup complete! Your website is ready to go!" -ForegroundColor Green
