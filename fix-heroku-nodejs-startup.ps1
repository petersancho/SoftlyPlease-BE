# HEROKU NODE.JS STARTUP FIX SCRIPT
# Fixes Heroku app serving static HTML instead of running Node.js server

Write-Host "🔧 SOFTLYPLEASE.COM - Heroku Node.js Startup Fix" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Step 1: Check Heroku CLI
Write-Host "`n🔍 Step 1: Checking Heroku CLI..." -ForegroundColor Yellow
try {
    $herokuVersion = heroku --version
    Write-Host "✅ Heroku CLI: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Installing..." -ForegroundColor Red
    # Install Heroku CLI
    Invoke-WebRequest -Uri https://cli-assets.heroku.com/install.ps1 -UseBasicParsing | Invoke-Expression
}

# Step 2: Login to Heroku
Write-Host "`n🔑 Step 2: Checking Heroku login..." -ForegroundColor Yellow
heroku whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please login to Heroku:" -ForegroundColor Yellow
    heroku login
}

# Step 3: Check app status
Write-Host "`n📊 Step 3: Checking app status..." -ForegroundColor Yellow
try {
    $appInfo = heroku apps:info softlyplease-appserver --json | ConvertFrom-Json
    Write-Host "✅ App Name: $($appInfo.name)" -ForegroundColor Green
    Write-Host "✅ App URL: $($appInfo.web_url)" -ForegroundColor Green
    Write-Host "✅ Stack: $($appInfo.stack.name)" -ForegroundColor Green
    Write-Host "✅ Region: $($appInfo.region.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not get app info: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Check current environment variables
Write-Host "`n⚙️ Step 4: Checking environment variables..." -ForegroundColor Yellow
try {
    heroku config --app softlyplease-appserver
} catch {
    Write-Host "❌ Could not check config" -ForegroundColor Red
}

# Step 5: Fix Procfile if needed
Write-Host "`n📄 Step 5: Checking Procfile..." -ForegroundColor Yellow
if (Test-Path "Procfile") {
    $procfileContent = Get-Content "Procfile"
    Write-Host "✅ Current Procfile: $procfileContent" -ForegroundColor Green

    if ($procfileContent -notmatch "web: node") {
        Write-Host "⚠️ Procfile seems incorrect. Fixing..." -ForegroundColor Yellow
        Set-Content -Path "Procfile" -Value "web: node ./src/bin/www"
        Write-Host "✅ Procfile fixed" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Procfile missing. Creating..." -ForegroundColor Red
    Set-Content -Path "Procfile" -Value "web: node ./src/bin/www"
    Write-Host "✅ Procfile created" -ForegroundColor Green
}

# Step 6: Fix package.json if needed
Write-Host "`n📦 Step 6: Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "✅ Main script: $($package.main)" -ForegroundColor Green
    Write-Host "✅ Start script: $($package.scripts.start)" -ForegroundColor Green

    # Ensure main script exists
    if (-not (Test-Path $package.main)) {
        Write-Host "❌ Main script missing: $($package.main)" -ForegroundColor Red
        Write-Host "🔍 Looking for alternative main script..." -ForegroundColor Yellow

        $possibleMains = @("src/bin/www", "bin/www", "server.js", "app.js", "index.js")
        foreach ($main in $possibleMains) {
            if (Test-Path $main) {
                Write-Host "✅ Found alternative main script: $main" -ForegroundColor Green
                $package.main = $main
                $package | ConvertTo-Json | Set-Content "package.json"
                break
            }
        }
    }
} else {
    Write-Host "❌ package.json missing" -ForegroundColor Red
}

# Step 7: Set required environment variables
Write-Host "`n🔧 Step 7: Setting environment variables..." -ForegroundColor Yellow
heroku config:set NODE_ENV=production --app softlyplease-appserver
heroku config:set PORT=$($env:PORT ?? "80") --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/ --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_APIKEY=softlyplease-secure-key-2024 --app softlyplease-appserver

# Step 8: Check for missing dependencies
Write-Host "`n📚 Step 8: Checking for missing dependencies..." -ForegroundColor Yellow
$requiredDeps = @("express", "compute-rhino3d", "hbs", "cors", "compression")
$package = Get-Content "package.json" | ConvertFrom-Json

foreach ($dep in $requiredDeps) {
    if (-not $package.dependencies.$dep) {
        Write-Host "❌ Missing dependency: $dep" -ForegroundColor Red
    } else {
        Write-Host "✅ Found dependency: $dep" -ForegroundColor Green
    }
}

# Step 9: Redeploy to Heroku
Write-Host "`n🚀 Step 9: Redeploying to Heroku..." -ForegroundColor Yellow
git add .
git commit -m "Fix Node.js startup issues on Heroku

- Fix Procfile configuration
- Ensure main script exists
- Set required environment variables
- Verify dependencies"
git push heroku main

# Step 10: Wait for deployment and test
Write-Host "`n⏳ Step 10: Waiting for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test the API endpoint
Write-Host "Testing Heroku API endpoint..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://softlyplease-appserver.herokuapp.com/version" -TimeoutSec 10
    $contentType = $response.Headers.'Content-Type'

    if ($contentType -and $contentType.Contains('application/json')) {
        Write-Host " ✅ SUCCESS - JSON API working!" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Cyan
    } else {
        Write-Host " ⚠️ Still serving HTML - checking logs..." -ForegroundColor Yellow
        heroku logs --tail --app softlyplease-appserver
    }
} catch {
    Write-Host " ❌ API still not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 11: Check recent logs
Write-Host "`n📋 Step 11: Recent Heroku logs..." -ForegroundColor Yellow
try {
    heroku logs --num 10 --app softlyplease-appserver
} catch {
    Write-Host "❌ Could not retrieve logs" -ForegroundColor Red
}

# Step 12: Create troubleshooting guide
Write-Host "`n🔧 Step 12: Creating troubleshooting guide..." -ForegroundColor Yellow

$troubleshooting = @"
HEROKU NODE.JS TROUBLESHOOTING GUIDE
====================================

If Heroku is still serving HTML instead of running Node.js:

1. CHECK LOGS FOR ERRORS:
   heroku logs --tail --app softlyplease-appserver

2. COMMON ISSUES TO LOOK FOR:
   - "Port already in use" errors
   - "Cannot find module" errors
   - "Process exited" messages
   - "Application error" messages

3. VERIFY MAIN SCRIPT:
   - Check if './src/bin/www' exists
   - Ensure package.json main field is correct
   - Verify Procfile is 'web: node ./src/bin/www'

4. CHECK DEPENDENCIES:
   - Run 'npm install' locally
   - Ensure all required dependencies are in package.json
   - Check for missing dev dependencies in production

5. ENVIRONMENT VARIABLES:
   - NODE_ENV=production (REQUIRED)
   - PORT (set by Heroku automatically)
   - RHINO_COMPUTE_URL (set to Azure VM)
   - RHINO_COMPUTE_APIKEY (set correctly)

6. FORCE REDEPLOYMENT:
   heroku ps:restart --app softlyplease-appserver
   git commit --allow-empty -m "Force redeploy"
   git push heroku main

7. CHECK BUILD STATUS:
   heroku builds --app softlyplease-appserver

8. MANUAL LOGS CHECK:
   heroku run bash --app softlyplease-appserver
   # Then check if files exist and run node manually

EXPECTED LOG OUTPUT WHEN WORKING:
=================================
2024-01-01T00:00:00Z app[web.1]: Server listening on port 12345
2024-01-01T00:00:00Z app[web.1]: Connected to Rhino Compute at http://4.248.252.92:6500/
2024-01-01T00:00:00Z app[web.1]: Environment: production

If you see different logs, the Node.js server is not starting correctly.
"@

Set-Content -Path "HEROKU-TROUBLESHOOTING.txt" -Value $troubleshooting -Force
Write-Host "✅ Troubleshooting guide created: HEROKU-TROUBLESHOOTING.txt" -ForegroundColor Green

Write-Host "`n🎉 Heroku Node.js Startup Fix Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check HEROKU-TROUBLESHOOTING.txt if still having issues" -ForegroundColor White
Write-Host "2. Run the Azure VM service restart script" -ForegroundColor White
Write-Host "3. Test softlyplease.com once both are working" -ForegroundColor White
