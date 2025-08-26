# AZURE VM NODE.JS STARTUP FIX SCRIPT
# Fixes Azure VM serving static HTML instead of running Node.js server

Write-Host "🔧 SOFTLYPLEASE.COM - Azure VM Node.js Startup Fix" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow

# Function to test endpoint
function Test-AzureEndpoint {
    param([string]$url, [string]$description)
    Write-Host "Testing $description..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -ErrorAction Stop
        $contentType = $response.Headers.'Content-Type'

        if ($contentType -and $contentType.Contains('application/json')) {
            Write-Host " ✅ (JSON API - GOOD)" -ForegroundColor Green
            return $true
        } elseif ($contentType -and $contentType.Contains('text/html')) {
            Write-Host " ⚠️ (HTML - STATIC)" -ForegroundColor Yellow
            return $false
        } else {
            Write-Host " ⚠️ (HTTP $($response.StatusCode))" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Step 1: Check Windows services status
Write-Host "`n🔍 Step 1: Checking Windows services..." -ForegroundColor Yellow
$services = @("SoftlyPleaseAppServer", "Rhino.Compute")
foreach ($service in $services) {
    try {
        $serviceInfo = Get-Service -Name $service -ErrorAction Stop
        Write-Host "Service '$service': $($serviceInfo.Status)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Service '$service' not found" -ForegroundColor Red
    }
}

# Step 2: Check IIS status and port conflicts
Write-Host "`n🌐 Step 2: Checking IIS and port conflicts..." -ForegroundColor Yellow
try {
    $iisService = Get-Service -Name "W3SVC" -ErrorAction SilentlyContinue
    if ($iisService) {
        Write-Host "IIS Service Status: $($iisService.Status)" -ForegroundColor Cyan
        if ($iisService.Status -eq "Running") {
            Write-Host "⚠️ IIS is running - this may conflict with Node.js on port 80" -ForegroundColor Yellow

            # Check IIS bindings
            Write-Host "Checking IIS bindings..." -ForegroundColor Cyan
            try {
                Import-Module WebAdministration -ErrorAction Stop
                $bindings = Get-WebBinding
                $port80Bindings = $bindings | Where-Object { $_.bindingInformation -like "*:80:*" }
                if ($port80Bindings) {
                    Write-Host "IIS bindings on port 80:" -ForegroundColor Yellow
                    $port80Bindings | ForEach-Object {
                        Write-Host "  Site: $($_.ItemXPath)" -ForegroundColor Yellow
                        Write-Host "  Binding: $($_.bindingInformation)" -ForegroundColor Yellow
                    }
                }
            } catch {
                Write-Host "Could not check IIS bindings: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✅ IIS service not found or not running" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not check IIS status: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Check if Node.js is installed
Write-Host "`n📦 Step 3: Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ NPM: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found in PATH" -ForegroundColor Red
    Write-Host "Looking for Node.js installation..." -ForegroundColor Yellow

    $possiblePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:APPDATA\npm\node.exe",
        "C:\Users\$env:USERNAME\AppData\Roaming\npm\node.exe"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            Write-Host "✅ Found Node.js at: $path" -ForegroundColor Green
            break
        }
    }
}

# Step 4: Check application directory and files
Write-Host "`n📁 Step 4: Checking application directory..." -ForegroundColor Yellow
$appPath = "C:\Users\$env:USERNAME\compute-sp"

if (Test-Path $appPath) {
    Write-Host "✅ Application directory exists: $appPath" -ForegroundColor Green

    # Check key files
    $keyFiles = @(
        "package.json",
        "src\bin\www",
        "src\app.js",
        "config.js",
        "Procfile"
    )

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
}

# Step 5: Test local Node.js server
Write-Host "`n🖥️ Step 5: Testing local Node.js server..." -ForegroundColor Yellow
if (Test-Path "src\bin\www") {
    Write-Host "Starting local server test..." -ForegroundColor Cyan
    try {
        $process = Start-Process -FilePath "node" -ArgumentList "src\bin\www" -NoNewWindow -PassThru -WorkingDirectory $appPath
        Start-Sleep -Seconds 5

        # Test local endpoints
        $localTest = Test-AzureEndpoint "http://localhost:3000/version" "Local Node.js server"
        $localMain = Test-AzureEndpoint "http://localhost:3000/" "Local main page"

        # Stop test server
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Local server test completed" -ForegroundColor Green

    } catch {
        Write-Host "❌ Could not start local server test: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Main script src\bin\www not found" -ForegroundColor Red
}

# Step 6: Check Windows Firewall
Write-Host "`n🔥 Step 6: Checking Windows Firewall..." -ForegroundColor Yellow
try {
    $firewallRules = Get-NetFirewallRule | Where-Object {
        $_.DisplayName -like "*node*" -or
        $_.DisplayName -like "*http*" -or
        $_.DisplayName -like "*port 80*" -or
        $_.DisplayName -like "*port 6500*"
    }

    if ($firewallRules) {
        Write-Host "Current relevant firewall rules:" -ForegroundColor Cyan
        $firewallRules | Select-Object DisplayName, Direction, Action, Enabled | Format-Table
    } else {
        Write-Host "⚠️ No relevant firewall rules found" -ForegroundColor Yellow
    }

    # Add necessary rules
    Write-Host "Adding firewall rules..." -ForegroundColor Cyan
    New-NetFirewallRule -DisplayName "Node.js HTTP Port 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Rhino Compute Port 6500" -Direction Inbound -Protocol TCP -LocalPort 6500 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ Firewall rules added" -ForegroundColor Green

} catch {
    Write-Host "❌ Could not check firewall: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Attempt to start services
Write-Host "`n🚀 Step 7: Attempting to start services..." -ForegroundColor Yellow

foreach ($service in $services) {
    Write-Host "Starting $service..." -NoNewline
    try {
        Start-Service -Name $service -ErrorAction Stop
        Write-Host " ✅ SUCCESS" -ForegroundColor Green

        # Wait for service to start
        Start-Sleep -Seconds 3

        # Check status
        $serviceStatus = Get-Service -Name $service
        Write-Host "  Status: $($serviceStatus.Status)" -ForegroundColor Cyan

    } catch {
        Write-Host " ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 8: Test external endpoints
Write-Host "`n🌐 Step 8: Testing external endpoints..." -ForegroundColor Yellow
$apiTest = Test-AzureEndpoint "http://4.248.252.92:80/version" "External API"
$rhinoTest = Test-AzureEndpoint "http://4.248.252.92:6500/version" "External Rhino Compute"
$mainTest = Test-AzureEndpoint "https://softlyplease.com/" "Main Website"

# Step 9: Check service logs
Write-Host "`n📋 Step 9: Checking service logs..." -ForegroundColor Yellow
$logPaths = @(
    "C:\Users\$env:USERNAME\compute-sp\logs\*.log",
    "C:\ProgramData\Microsoft\Event Logs\Application.evtx",
    "C:\Windows\System32\winevt\Logs\Application.evtx"
)

foreach ($logPath in $logPaths) {
    if (Test-Path $logPath) {
        Write-Host "Found log file: $logPath" -ForegroundColor Cyan
        # Try to read recent entries
        try {
            if ($logPath -like "*.log") {
                $recentLines = Get-Content $logPath -Tail 5 -ErrorAction SilentlyContinue
                if ($recentLines) {
                    Write-Host "Recent log entries:" -ForegroundColor Cyan
                    $recentLines | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
                }
            }
        } catch {
            Write-Host "Could not read log file: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Step 10: Create service restart script
Write-Host "`n📝 Step 10: Creating service restart script..." -ForegroundColor Yellow

$serviceScript = @"
# AZURE VM SERVICE RESTART SCRIPT
# Run this as Administrator to restart services

Write-Host "🔧 Restarting Azure VM Services..." -ForegroundColor Green

# Stop services
Stop-Service SoftlyPleaseAppServer -Force -ErrorAction SilentlyContinue
Stop-Service "Rhino.Compute" -Force -ErrorAction SilentlyContinue

# Wait
Start-Sleep -Seconds 2

# Start Rhino Compute first
Start-Service "Rhino.Compute"
Start-Sleep -Seconds 5

# Start Node.js AppServer
Start-Service SoftlyPleaseAppServer
Start-Sleep -Seconds 5

# Check status
Get-Service SoftlyPleaseAppServer, "Rhino.Compute"

# Test endpoints
curl http://localhost:80/version
curl http://localhost:6500/version
curl http://4.248.252.92:80/version
curl http://4.248.252.92:6500/version

Write-Host "✅ Service restart complete!" -ForegroundColor Green
"@

Set-Content -Path "C:\Users\$env:USERNAME\restart-services.ps1" -Value $serviceScript -Force
Write-Host "✅ Service restart script created: C:\Users\$env:USERNAME\restart-services.ps1" -ForegroundColor Green

# Step 11: Create troubleshooting guide
Write-Host "`n🔧 Step 11: Creating troubleshooting guide..." -ForegroundColor Yellow

$azureTroubleshooting = @"
AZURE VM NODE.JS TROUBLESHOOTING GUIDE
======================================

If Azure VM is still serving HTML instead of running Node.js:

1. CHECK SERVICE STATUS:
   Get-Service SoftlyPleaseAppServer, "Rhino.Compute"

2. START SERVICES MANUALLY:
   Start-Service SoftlyPleaseAppServer
   Start-Service "Rhino.Compute"

3. CHECK FOR PORT CONFLICTS:
   - IIS might be running on port 80
   - Check IIS bindings: Get-WebBinding
   - Stop IIS if conflicting: Stop-Service W3SVC

4. CHECK FIREWALL:
   - Ensure ports 80 and 6500 are open
   - Check rules: Get-NetFirewallRule | Where-Object { `$_.DisplayName -like "*80*" }

5. CHECK NODE.JS PATH:
   - Verify Node.js is in system PATH
   - Check: node --version
   - Check: npm --version

6. CHECK APPLICATION FILES:
   - Verify src\bin\www exists
   - Check package.json is valid
   - Ensure all dependencies are installed

7. CHECK SERVICE LOGS:
   - Look in Event Viewer (Application logs)
   - Check C:\Users\[username]\compute-sp\logs\

8. TEST LOCALLY:
   cd C:\Users\[username]\compute-sp
   node src\bin\www

9. CHECK ENVIRONMENT VARIABLES:
   - Verify RHINO_COMPUTE_URL is set
   - Check NODE_ENV=production
   - Ensure PORT=80

10. MANUAL SERVICE CONFIGURATION:
    - Check service properties in services.msc
    - Verify service is set to Automatic startup
    - Check service user account has permissions

EXPECTED WORKING STATE:
======================
- SoftlyPleaseAppServer: Running
- Rhino.Compute: Running
- http://localhost:80/version returns JSON
- http://4.248.252.92:80/version returns JSON
- https://softlyplease.com/ loads with full functionality

If services won't start, check the Application event logs for specific error messages.
"@

Set-Content -Path "AZURE-VM-TROUBLESHOOTING.txt" -Value $azureTroubleshooting -Force
Write-Host "✅ Troubleshooting guide created: AZURE-VM-TROUBLESHOOTING.txt" -ForegroundColor Green

# Final status
Write-Host "`n🎉 Azure VM Node.js Startup Fix Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check AZURE-VM-TROUBLESHOOTING.txt if still having issues" -ForegroundColor White
Write-Host "2. Run the service restart script if needed:" -ForegroundColor White
Write-Host "   C:\Users\$env:USERNAME\restart-services.ps1" -ForegroundColor White
Write-Host "3. Test softlyplease.com once services are running" -ForegroundColor White
Write-Host "" -ForegroundColor Yellow
Write-Host "🔧 QUICK TEST COMMANDS:" -ForegroundColor Yellow
Write-Host "curl http://4.248.252.92:80/version" -ForegroundColor White
Write-Host "curl http://4.248.252.92:6500/version" -ForegroundColor White
Write-Host "curl https://softlyplease-appserver.herokuapp.com/version" -ForegroundColor White
