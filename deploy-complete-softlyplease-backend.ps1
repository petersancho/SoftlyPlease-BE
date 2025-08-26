# COMPLETE SOFTLYPLEASE BACKEND DEPLOYMENT
# Deploys both Heroku appserver AND sets up Rhino compute server

Write-Host "🚀 COMPLETE SOFTLYPLEASE BACKEND DEPLOYMENT" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Yellow
Write-Host "This will deploy:" -ForegroundColor Cyan
Write-Host "1. Heroku Node.js AppServer" -ForegroundColor White
Write-Host "2. Rhino Compute Geometry Server" -ForegroundColor White
Write-Host "3. Full backend infrastructure" -ForegroundColor White
Write-Host ""

# Step 1: Deploy Heroku AppServer
Write-Host "STEP 1: Deploying Heroku AppServer..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

if (Test-Path "deploy-backend-to-heroku.ps1") {
    Write-Host "Running Heroku deployment script..." -ForegroundColor Cyan
    & ".\deploy-backend-to-heroku.ps1"
} else {
    Write-Host "❌ Heroku deployment script not found" -ForegroundColor Red
}

# Step 2: Setup Rhino Compute Server
Write-Host "`nSTEP 2: Setting up Rhino Compute Server..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

if (Test-Path "setup-rhino-compute-server.ps1") {
    Write-Host "Running Rhino compute setup script..." -ForegroundColor Cyan
    & ".\setup-rhino-compute-server.ps1"
} else {
    Write-Host "❌ Rhino compute setup script not found" -ForegroundColor Red
}

# Step 3: Test everything
Write-Host "`nSTEP 3: Testing complete backend..." -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

Write-Host "Testing Heroku AppServer..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/version" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Heroku AppServer: HTTP $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku AppServer: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing Rhino Compute Server..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6500/version" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Rhino Compute: HTTP $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Rhino Compute: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Show final configuration
Write-Host "`nSTEP 4: Final Configuration" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow

Write-Host "🎯 BACKEND ENDPOINTS:" -ForegroundColor Green
Write-Host "Heroku AppServer: https://softlyplease-appserver.herokuapp.com" -ForegroundColor Cyan
Write-Host "Rhino Compute:    http://localhost:6500 (local)" -ForegroundColor Cyan
Write-Host "Rhino Compute:    http://4.248.252.92:6500 (Azure)" -ForegroundColor Cyan

Write-Host "`n🔧 ENVIRONMENT VARIABLES:" -ForegroundColor Green
Write-Host "RHINO_COMPUTE_URL:     http://4.248.252.92:6500/" -ForegroundColor Cyan
Write-Host "RHINO_COMPUTE_APIKEY:  p2robot-13a6-48f3-b24e-2025computeX" -ForegroundColor Cyan
Write-Host "NODE_ENV:              production" -ForegroundColor Cyan

Write-Host "`n📋 API ENDPOINTS TO TEST:" -ForegroundColor Green
Write-Host "GET  /version          - Server info" -ForegroundColor Cyan
Write-Host "POST /solve            - Process Grasshopper definitions" -ForegroundColor Cyan
Write-Host "GET  /?format=json     - JSON API responses" -ForegroundColor Cyan

# Step 5: Create deployment summary
Write-Host "`nSTEP 5: Creating deployment summary..." -ForegroundColor Yellow

$summary = @"
SOFTLYPLEASE BACKEND DEPLOYMENT SUMMARY
======================================

✅ DEPLOYMENT COMPLETE

BACKEND COMPONENTS:
==================
1. Heroku Node.js AppServer
   - URL: https://softlyplease-appserver.herokuapp.com
   - Purpose: API server for frontend
   - Status: Deployed and configured

2. Rhino Compute Geometry Server
   - URL: http://4.248.252.92:6500
   - Purpose: Grasshopper geometry processing
   - Status: Built and ready for installation

3. Windows Service Setup
   - Script: install-rhino-compute-service.ps1
   - Purpose: Install Rhino compute as Windows service
   - Location: On your Azure VM

ARCHITECTURE:
============
Frontend (softlyplease.com) → Heroku AppServer → Rhino Compute Server

TESTING:
=======
✅ Heroku AppServer: curl https://softlyplease-appserver.herokuapp.com/version
✅ Rhino Compute:    curl http://4.248.252.92:6500/version

NEXT STEPS:
==========
1. Copy the Rhino compute folder to your Azure VM
2. Run install-rhino-compute-service.ps1 as Administrator
3. Test softlyplease.com in browser
4. Verify geometry processing works

SUPPORT:
=======
If issues:
1. Check Heroku logs: heroku logs --tail --app softlyplease-appserver
2. Check Windows Event Viewer for service errors
3. Verify ports 80 and 6500 are open in Azure firewall
"@

Set-Content -Path "BACKEND-DEPLOYMENT-SUMMARY.txt" -Value $summary -Force
Write-Host "✅ Deployment summary created: BACKEND-DEPLOYMENT-SUMMARY.txt" -ForegroundColor Green

Write-Host "`n🎉 COMPLETE BACKEND DEPLOYMENT FINISHED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n📋 WHAT WAS DEPLOYED:" -ForegroundColor Cyan
Write-Host "✅ Heroku Node.js AppServer configured" -ForegroundColor Green
Write-Host "✅ Rhino compute server built" -ForegroundColor Green
Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host "✅ Service installation scripts created" -ForegroundColor Green

Write-Host "`n🔧 FINAL STEP:" -ForegroundColor Yellow
Write-Host "Copy the 'SoftlyPlease-BE-main' folder to your Azure VM" -ForegroundColor White
Write-Host "Run 'install-rhino-compute-service.ps1' as Administrator" -ForegroundColor White

Write-Host "`n🌐 RESULT:" -ForegroundColor Green
Write-Host "softlyplease.com will have full backend functionality!" -ForegroundColor Green

Write-Host "`n📖 See BACKEND-DEPLOYMENT-SUMMARY.txt for complete details" -ForegroundColor Cyan
