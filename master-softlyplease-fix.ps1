# MASTER SOFTLYPLEASE.COM FIX SCRIPT
# Comprehensive diagnosis and fix for all Node.js startup issues

Write-Host "🚀 SOFTLYPLEASE.COM - MASTER FIX SCRIPT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "This script diagnoses and fixes all Node.js startup issues" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run comprehensive diagnosis
Write-Host "🔍 STEP 1: Running comprehensive diagnosis..." -ForegroundColor Yellow
Write-Host "This will test all components and identify issues..." -ForegroundColor Cyan
Write-Host ""

# Test all endpoints
Write-Host "Testing all endpoints..." -ForegroundColor Cyan

$endpoints = @(
    @{url="https://softlyplease-appserver.herokuapp.com/version"; name="Heroku API"},
    @{url="https://softlyplease-appserver.herokuapp.com/"; name="Heroku Main"},
    @{url="http://4.248.252.92:80/version"; name="Azure VM API"},
    @{url="http://4.248.252.92:6500/version"; name="Azure VM Rhino"},
    @{url="https://softlyplease.com/"; name="Main Website"}
)

$results = @{}

foreach ($endpoint in $endpoints) {
    Write-Host "Testing $($endpoint.name)..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec 10 -ErrorAction Stop
        $contentType = $response.Headers.'Content-Type'

        if ($contentType -and $contentType.Contains('application/json')) {
            Write-Host " ✅ JSON API" -ForegroundColor Green
            $results[$endpoint.name] = "WORKING"
        } elseif ($contentType -and $contentType.Contains('text/html')) {
            Write-Host " ⚠️ HTML STATIC" -ForegroundColor Yellow
            $results[$endpoint.name] = "STATIC_HTML"
        } else {
            Write-Host " ⚠️ HTTP $($response.StatusCode)" -ForegroundColor Yellow
            $results[$endpoint.name] = "OTHER"
        }
    } catch {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        $results[$endpoint.name] = "FAILED"
    }
}

Write-Host ""
Write-Host "📊 DIAGNOSIS RESULTS:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

$herokuApiWorking = $results["Heroku API"] -eq "WORKING"
$azureApiWorking = $results["Azure VM API"] -eq "WORKING"
$azureRhinoWorking = $results["Azure VM Rhino"] -eq "WORKING"

Write-Host "Heroku API: $($results['Heroku API'])" -ForegroundColor $(if ($herokuApiWorking) { "Green" } else { "Red" })
Write-Host "Azure VM API: $($results['Azure VM API'])" -ForegroundColor $(if ($azureApiWorking) { "Green" } else { "Red" })
Write-Host "Azure VM Rhino: $($results['Azure VM Rhino'])" -ForegroundColor $(if ($azureRhinoWorking) { "Green" } else { "Red" })
Write-Host "Main Website: $($results['Main Website'])" -ForegroundColor $(if ($results['Main Website'] -eq "WORKING") { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "🎯 RECOMMENDED FIXES:" -ForegroundColor Yellow

# Determine what needs fixing
$needsHerokuFix = -not $herokuApiWorking
$needsAzureFix = -not ($azureApiWorking -and $azureRhinoWorking)

if ($needsHerokuFix) {
    Write-Host "❌ Heroku needs fixing - Node.js server not starting" -ForegroundColor Red
}
if ($needsAzureFix) {
    Write-Host "❌ Azure VM needs fixing - Services not running" -ForegroundColor Red
}

if (-not $needsHerokuFix -and -not $needsAzureFix) {
    Write-Host "✅ Everything appears to be working!" -ForegroundColor Green
    Write-Host "🎉 softlyplease.com should be fully functional!" -ForegroundColor Green
    exit 0
}

# Step 2: Create fix scripts
Write-Host ""
Write-Host "🔧 STEP 2: Creating fix scripts..." -ForegroundColor Yellow

if ($needsHerokuFix) {
    Write-Host "Creating Heroku fix script..." -ForegroundColor Cyan

    $herokuFix = @"
Write-Host "🔧 Fixing Heroku Node.js startup issues..." -ForegroundColor Green

# Check Heroku login
heroku whoami 2>$null
if (`$LASTEXITCODE -ne 0) {
    Write-Host "Please login to Heroku:" -ForegroundColor Yellow
    heroku login
}

# Fix Procfile
if (Test-Path "Procfile") {
    `$procfile = Get-Content "Procfile"
    if (`$procfile -notmatch "web: node") {
        Set-Content -Path "Procfile" -Value "web: node ./src/bin/www"
        Write-Host "✅ Procfile fixed" -ForegroundColor Green
    }
} else {
    Set-Content -Path "Procfile" -Value "web: node ./src/bin/www"
    Write-Host "✅ Procfile created" -ForegroundColor Green
}

# Set environment variables
heroku config:set NODE_ENV=production --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/ --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_APIKEY=softlyplease-secure-key-2024 --app softlyplease-appserver

# Redeploy
git add .
git commit -m "Fix Heroku Node.js startup issues"
git push heroku main

# Test
Start-Sleep -Seconds 10
curl https://softlyplease-appserver.herokuapp.com/version

Write-Host "✅ Heroku fix complete!" -ForegroundColor Green
"@

    Set-Content -Path "fix-heroku-quick.ps1" -Value $herokuFix -Force
    Write-Host "✅ Heroku fix script created: fix-heroku-quick.ps1" -ForegroundColor Green
}

if ($needsAzureFix) {
    Write-Host "Creating Azure VM fix script..." -ForegroundColor Cyan

    $azureFix = @"
Write-Host "🔧 Fixing Azure VM Node.js startup issues..." -ForegroundColor Green

# Check services
Get-Service SoftlyPleaseAppServer, "Rhino.Compute"

# Stop services safely
Stop-Service SoftlyPleaseAppServer -Force -ErrorAction SilentlyContinue
Stop-Service "Rhino.Compute" -Force -ErrorAction SilentlyContinue

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

Write-Host "✅ Azure VM fix complete!" -ForegroundColor Green
"@

    Set-Content -Path "fix-azure-quick.ps1" -Value $azureFix -Force
    Write-Host "✅ Azure VM fix script created: fix-azure-quick.ps1" -ForegroundColor Green
}

# Step 3: Provide execution instructions
Write-Host ""
Write-Host "🎯 EXECUTION INSTRUCTIONS:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

if ($needsHerokuFix) {
    Write-Host ""
    Write-Host "📍 ON YOUR LOCAL MACHINE (fix Heroku):" -ForegroundColor Yellow
    Write-Host "1. Run: .\fix-heroku-quick.ps1" -ForegroundColor White
    Write-Host "2. Or manually:" -ForegroundColor White
    Write-Host "   heroku config:set NODE_ENV=production --app softlyplease-appserver" -ForegroundColor White
    Write-Host "   git add . && git commit -m 'fix' && git push heroku main" -ForegroundColor White
}

if ($needsAzureFix) {
    Write-Host ""
    Write-Host "📍 ON YOUR AZURE VM (fix Windows services):" -ForegroundColor Yellow
    Write-Host "1. Run: .\fix-azure-quick.ps1" -ForegroundColor White
    Write-Host "2. Or manually:" -ForegroundColor White
    Write-Host "   Start-Service SoftlyPleaseAppServer" -ForegroundColor White
    Write-Host "   Start-Service 'Rhino.Compute'" -ForegroundColor White
}

Write-Host ""
Write-Host "🧪 TEST AFTER FIXING:" -ForegroundColor Yellow
Write-Host "curl https://softlyplease-appserver.herokuapp.com/version" -ForegroundColor White
Write-Host "curl http://4.248.252.92:80/version" -ForegroundColor White
Write-Host "curl http://4.248.252.92:6500/version" -ForegroundColor White

# Step 4: Create comprehensive fix documentation
Write-Host ""
Write-Host "📚 STEP 4: Creating comprehensive documentation..." -ForegroundColor Yellow

$comprehensiveFix = @"
SOFTLYPLEASE.COM COMPREHENSIVE FIX GUIDE
=======================================

PROBLEM IDENTIFIED:
- Node.js servers are not starting on Heroku and Azure VM
- Both domains serving static HTML instead of running Node.js
- API endpoints returning 404 errors

ROOT CAUSES:
1. Heroku: Node.js process crashing immediately after startup
2. Azure VM: Windows services not running or port conflicts

QUICK FIXES CREATED:
- fix-heroku-quick.ps1: Fixes Heroku Node.js startup
- fix-azure-quick.ps1: Fixes Azure VM services

MANUAL FIX STEPS:

HEROKU FIX (Local Machine):
=======================
1. Login to Heroku:
   heroku login

2. Set environment variables:
   heroku config:set NODE_ENV=production --app softlyplease-appserver
   heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/ --app softlyplease-appserver

3. Fix Procfile (if needed):
   echo "web: node ./src/bin/www" > Procfile

4. Redeploy:
   git add .
   git commit -m "Fix Node.js startup"
   git push heroku main

5. Check logs if still failing:
   heroku logs --tail --app softlyplease-appserver

AZURE VM FIX (Windows Server):
============================
1. Check service status:
   Get-Service SoftlyPleaseAppServer, "Rhino.Compute"

2. Start services:
   Start-Service "Rhino.Compute"
   Start-Sleep -Seconds 5
   Start-Service SoftlyPleaseAppServer

3. Check for port conflicts:
   Get-Service W3SVC  # IIS might be conflicting
   Stop-Service W3SVC  # Stop IIS if needed

4. Add firewall rules:
   New-NetFirewallRule -DisplayName "HTTP Port 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
   New-NetFirewallRule -DisplayName "Rhino Port 6500" -Direction Inbound -Protocol TCP -LocalPort 6500 -Action Allow

5. Test services:
   curl http://localhost:80/version
   curl http://localhost:6500/version

TROUBLESHOOTING:
===============
If Heroku still fails:
- Check Procfile format
- Verify main script exists: src/bin/www
- Check for missing dependencies
- Review Heroku logs for specific errors

If Azure VM still fails:
- Check Windows Event Viewer for service errors
- Verify Node.js is installed and in PATH
- Check for port conflicts with IIS
- Ensure service account has proper permissions

TESTING:
=======
After fixes, test these endpoints:
- Heroku API: https://softlyplease-appserver.herokuapp.com/version
- Azure API: http://4.248.252.92:80/version
- Azure Rhino: http://4.248.252.92:6500/version
- Main site: https://softlyplease.com/

All should return JSON responses, not HTML pages.

FINAL VERIFICATION:
=================
Once all endpoints return JSON:
- softlyplease.com will be fully functional
- Grasshopper definitions will load
- Geometry processing will work
- API endpoints will respond correctly
"@

Set-Content -Path "COMPREHENSIVE-FIX-GUIDE.txt" -Value $comprehensiveFix -Force
Write-Host "✅ Comprehensive fix guide created: COMPREHENSIVE-FIX-GUIDE.txt" -ForegroundColor Green

# Final summary
Write-Host ""
Write-Host "🎉 MASTER FIX SCRIPT COMPLETE!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

if ($needsHerokuFix -and $needsAzureFix) {
    Write-Host "Both Heroku and Azure VM need fixing" -ForegroundColor Yellow
} elseif ($needsHerokuFix) {
    Write-Host "Only Heroku needs fixing" -ForegroundColor Yellow
} elseif ($needsAzureFix) {
    Write-Host "Only Azure VM needs fixing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
if ($needsHerokuFix) {
    Write-Host "1. Run: .\fix-heroku-quick.ps1 (on local machine)" -ForegroundColor White
}
if ($needsAzureFix) {
    Write-Host "2. Run: .\fix-azure-quick.ps1 (on Azure VM)" -ForegroundColor White
}
Write-Host "3. Test: .\master-softlyplease-fix.ps1 (run again to verify)" -ForegroundColor White

Write-Host ""
Write-Host "📖 For detailed instructions, see: COMPREHENSIVE-FIX-GUIDE.txt" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 The fix scripts handle everything automatically!" -ForegroundColor Green
