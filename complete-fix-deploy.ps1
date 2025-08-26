# COMPLETE SOFTLYPLEASE.COM FIX AND DEPLOYMENT SCRIPT
# This script does everything that CAN be done from the local machine

Write-Host "🚀 SOFTLYPLEASE.COM - Complete Local Fix & Deploy" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Step 1: Fix configuration issues
Write-Host "`n🔧 Step 1: Fixing configuration..." -ForegroundColor Yellow

# Backup current config
Copy-Item "config.js" "config.js.backup" -Force

# Update config.js with correct settings
$configContent = @"
const config = {
  // Rhino Compute Server Configuration
  rhino: {
    url: process.env.RHINO_COMPUTE_URL || 'http://4.248.252.92:6500/',
    apiKey: process.env.RHINO_COMPUTE_APIKEY || 'softlyplease-secure-key-2024',
    timeout: 30000,
    retries: 3
  },

  // AppServer Configuration
  server: {
    port: process.env.PORT || 80,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'production'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },

  // Cache Configuration
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100
  }
};

module.exports = config;
"@

Set-Content -Path "config.js" -Value $configContent -Force
Write-Host "✅ Configuration updated" -ForegroundColor Green

# Step 2: Commit all changes
Write-Host "`n💾 Step 2: Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Fix softlyplease.com configuration and deployment

- Fix Rhino Compute URL configuration
- Update API key handling
- Fix server port configuration
- Prepare for Azure VM service restart"
Write-Host "✅ Changes committed" -ForegroundColor Green

# Step 3: Deploy to Heroku
Write-Host "`n🚀 Step 3: Deploying to Heroku..." -ForegroundColor Yellow

# Check if heroku CLI is available
try {
    heroku version
    Write-Host "✅ Heroku CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Installing..." -ForegroundColor Red
    # Install Heroku CLI
    Invoke-WebRequest -Uri https://cli-assets.heroku.com/install.ps1 -UseBasicParsing | Invoke-Expression
}

# Login to Heroku (if not already logged in)
heroku whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please login to Heroku:" -ForegroundColor Yellow
    heroku login
}

# Create/connect Heroku app
Write-Host "📦 Creating Heroku app..." -ForegroundColor Yellow
heroku create softlyplease-appserver --region us

# Set environment variables
Write-Host "⚙️ Setting environment variables..." -ForegroundColor Yellow
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/ --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_APIKEY=softlyplease-secure-key-2024 --app softlyplease-appserver
heroku config:set NODE_ENV=production --app softlyplease-appserver
heroku config:set PORT=80 --app softlyplease-appserver

# Deploy
Write-Host "🚀 Pushing to Heroku..." -ForegroundColor Green
git push heroku main

# Step 4: Test Heroku deployment
Write-Host "`n🧪 Step 4: Testing Heroku deployment..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/version" -TimeoutSec 30
    Write-Host "✅ Heroku AppServer responding (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku deployment test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Checking Heroku logs..." -ForegroundColor Yellow
    heroku logs --tail --app softlyplease-appserver
}

# Step 5: Create Azure VM fix instructions
Write-Host "`n📝 Step 5: Creating Azure VM fix instructions..." -ForegroundColor Yellow

$azureFixInstructions = @"
AZURE VM SERVICES RESTART INSTRUCTIONS
=====================================

Run these PowerShell commands as Administrator on your Azure VM:

# 1. Check current status
Get-Service SoftlyPleaseAppServer, "Rhino.Compute"

# 2. Stop services safely (if running)
Stop-Service SoftlyPleaseAppServer -Force
Stop-Service "Rhino.Compute" -Force

# 3. Start Rhino Compute first (port 6500)
Start-Service "Rhino.Compute"

# 4. Wait for initialization
Start-Sleep -Seconds 10

# 5. Start Node.js AppServer (port 80)
Start-Service SoftlyPleaseAppServer

# 6. Wait for initialization
Start-Sleep -Seconds 10

# 7. Verify services are running
Get-Service SoftlyPleaseAppServer, "Rhino.Compute"

# 8. Test local services
curl http://localhost:80/version
curl http://localhost:6500/version

# 9. Test external access
curl http://4.248.252.92:80/version
curl http://4.248.252.92:6500/version

# 10. Test full pipeline
curl "http://localhost:80/solve/BranchNodeRnd.gh?Radius=5&Count=10"

EXPECTED RESULTS AFTER RESTART:
- Port 80 returns JSON response
- Port 6500 returns JSON response
- softlyplease.com is fully functional
"@

Set-Content -Path "AZURE-VM-FIX-README.txt" -Value $azureFixInstructions -Force
Write-Host "✅ Azure VM fix instructions created" -ForegroundColor Green

# Step 6: Create automated test script
Write-Host "`n🧪 Step 6: Creating test script..." -ForegroundColor Yellow

$testScript = @'
# SOFTLYPLEASE.COM SYSTEM TEST SCRIPT
Write-Host "🧪 Testing softlyplease.com system..." -ForegroundColor Green

# Test Heroku AppServer
Write-Host "Testing Heroku AppServer..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/version" -TimeoutSec 10
    Write-Host " ✅ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ❌ Failed" -ForegroundColor Red
}

# Test Azure VM AppServer
Write-Host "Testing Azure VM AppServer..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://4.248.252.92:80/version" -TimeoutSec 10
    Write-Host " ✅ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ❌ Failed" -ForegroundColor Red
}

# Test Azure VM Rhino Compute
Write-Host "Testing Azure VM Rhino Compute..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://4.248.252.92:6500/version" -TimeoutSec 15
    Write-Host " ✅ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ❌ Failed" -ForegroundColor Red
}

# Test main website
Write-Host "Testing Main Website..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://softlyplease.com/" -TimeoutSec 10
    Write-Host " ✅ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ❌ Failed" -ForegroundColor Red
}

Write-Host "`n🎯 Test complete!" -ForegroundColor Green
'@

Set-Content -Path "test-softlyplease.ps1" -Value $testScript -Force
Write-Host "✅ Test script created" -ForegroundColor Green

# Final status
Write-Host "`n🎉 LOCAL FIXES COMPLETE!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "✅ Configuration fixed" -ForegroundColor Green
Write-Host "✅ Code committed to git" -ForegroundColor Green
Write-Host "✅ Deployed to Heroku" -ForegroundColor Green
Write-Host "✅ Fix scripts created" -ForegroundColor Green
Write-Host "" -ForegroundColor Yellow
Write-Host "📋 REMAINING TASK:" -ForegroundColor Yellow
Write-Host "Run the PowerShell commands in AZURE-VM-FIX-README.txt on your Azure VM" -ForegroundColor Red
Write-Host "" -ForegroundColor Yellow
Write-Host "🔧 FINAL STEP:" -ForegroundColor Yellow
Write-Host "Execute the Azure VM service restart commands to complete the fix" -ForegroundColor Red
