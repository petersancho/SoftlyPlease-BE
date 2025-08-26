# COMPREHENSIVE NODE.JS SERVER DIAGNOSTIC SCRIPT
# Tests and fixes Node.js startup issues for softlyplease.com

Write-Host "🔍 SOFTLYPLEASE.COM - Node.js Server Diagnostics" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow

# Function to test endpoint
function Test-Endpoint {
    param([string]$url, [string]$description)
    Write-Host "Testing $description..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -ErrorAction Stop
        $statusCode = $response.StatusCode
        $contentType = $response.Headers.'Content-Type'

        if ($statusCode -eq 200) {
            if ($contentType -and $contentType.Contains('application/json')) {
                Write-Host " ✅ (JSON API - GOOD)" -ForegroundColor Green
                return $true
            } elseif ($contentType -and $contentType.Contains('text/html')) {
                Write-Host " ⚠️ (HTML - STATIC)" -ForegroundColor Yellow
                return $false
            } else {
                Write-Host " ⚠️ (HTTP $statusCode)" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host " ❌ (HTTP $statusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Step 1: Test all endpoints
Write-Host "`n🧪 Step 1: Testing all endpoints..." -ForegroundColor Yellow

$herokuApi = Test-Endpoint "https://softlyplease-appserver.herokuapp.com/version" "Heroku API"
$herokuMain = Test-Endpoint "https://softlyplease-appserver.herokuapp.com/" "Heroku Main"
$mainApi = Test-Endpoint "http://4.248.252.92:80/version" "Azure VM API"
$mainSite = Test-Endpoint "https://softlyplease.com/" "Main Website"
$rhinoApi = Test-Endpoint "http://4.248.252.92:6500/version" "Rhino Compute API"

# Step 2: Check Heroku app status
Write-Host "`n🔍 Step 2: Checking Heroku app status..." -ForegroundColor Yellow
try {
    heroku apps:info softlyplease-appserver --json | ConvertFrom-Json | Select-Object -Property name, web_url, stack, region, status
} catch {
    Write-Host "❌ Could not check Heroku app status" -ForegroundColor Red
}

# Step 3: Check Heroku logs
Write-Host "`n📋 Step 3: Checking Heroku logs..." -ForegroundColor Yellow
Write-Host "Recent Heroku logs:" -ForegroundColor Cyan
try {
    heroku logs --num 20 --app softlyplease-appserver
} catch {
    Write-Host "❌ Could not retrieve Heroku logs" -ForegroundColor Red
}

# Step 4: Local server test
Write-Host "`n🖥️ Step 4: Testing local Node.js server..." -ForegroundColor Yellow
Write-Host "Starting local server test..." -ForegroundColor Cyan
try {
    # Test if we can start the local server
    $process = Start-Process -FilePath "node" -ArgumentList "./src/bin/www" -NoNewWindow -PassThru
    Start-Sleep -Seconds 3

    # Test local endpoints
    try {
        $localResponse = Invoke-WebRequest -Uri "http://localhost:3000/version" -TimeoutSec 5
        Write-Host "✅ Local server responding (HTTP $($localResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Local server test failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Stop the test server
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Local server test completed" -ForegroundColor Green

} catch {
    Write-Host "❌ Could not start local server test: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Check package.json and dependencies
Write-Host "`n📦 Step 5: Checking package.json and dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "✅ package.json found" -ForegroundColor Green
    Write-Host "   Node.js engine: $($package.engines.node)" -ForegroundColor Cyan
    Write-Host "   Main script: $($package.main)" -ForegroundColor Cyan
    Write-Host "   Start script: $($package.scripts.start)" -ForegroundColor Cyan

    # Check if main script exists
    if (Test-Path $package.main) {
        Write-Host "✅ Main script exists: $($package.main)" -ForegroundColor Green
    } else {
        Write-Host "❌ Main script missing: $($package.main)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
}

# Step 6: Check Procfile
Write-Host "`n📄 Step 6: Checking Procfile..." -ForegroundColor Yellow
if (Test-Path "Procfile") {
    $procfile = Get-Content "Procfile"
    Write-Host "✅ Procfile found: $procfile" -ForegroundColor Green
} else {
    Write-Host "❌ Procfile missing" -ForegroundColor Red
}

# Step 7: Check environment variables needed
Write-Host "`n⚙️ Step 7: Checking environment variables..." -ForegroundColor Yellow
$envVars = @("RHINO_COMPUTE_URL", "RHINO_COMPUTE_APIKEY", "NODE_ENV", "PORT")
foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "✅ $var = $value" -ForegroundColor Green
    } else {
        Write-Host "❌ $var not set" -ForegroundColor Red
    }
}

# Step 8: Check Heroku environment variables
Write-Host "`n🌐 Step 8: Checking Heroku environment variables..." -ForegroundColor Yellow
try {
    heroku config --app softlyplease-appserver
} catch {
    Write-Host "❌ Could not check Heroku config" -ForegroundColor Red
}

# Step 9: Create fix recommendations
Write-Host "`n🎯 Step 9: Generating fix recommendations..." -ForegroundColor Yellow

$issues = @()

if (-not $herokuApi) {
    $issues += "Heroku API endpoint serving HTML instead of JSON - Node.js server not starting"
}
if (-not $mainApi) {
    $issues += "Azure VM API endpoint not responding - services not running or port conflict"
}
if (-not $rhinoApi) {
    $issues += "Rhino Compute not responding - service stopped"
}

Write-Host "`n🚨 ISSUES IDENTIFIED:" -ForegroundColor Red
foreach ($issue in $issues) {
    Write-Host "❌ $issue" -ForegroundColor Red
}

Write-Host "`n🛠️ RECOMMENDED FIXES:" -ForegroundColor Green

if (-not $herokuApi) {
    Write-Host "`n🔧 HEROKU FIXES:" -ForegroundColor Yellow
    Write-Host "1. Check Heroku logs for startup errors:" -ForegroundColor Cyan
    Write-Host "   heroku logs --tail --app softlyplease-appserver" -ForegroundColor White
    Write-Host "2. Check for dependency issues:" -ForegroundColor Cyan
    Write-Host "   heroku run bash --app softlyplease-appserver" -ForegroundColor White
    Write-Host "3. Verify Procfile is correct" -ForegroundColor Cyan
    Write-Host "4. Check environment variables" -ForegroundColor Cyan
}

if (-not $mainApi) {
    Write-Host "`n🔧 AZURE VM FIXES:" -ForegroundColor Yellow
    Write-Host "1. Check service status:" -ForegroundColor Cyan
    Write-Host "   Get-Service SoftlyPleaseAppServer, 'Rhino.Compute'" -ForegroundColor White
    Write-Host "2. Start services:" -ForegroundColor Cyan
    Write-Host "   Start-Service SoftlyPleaseAppServer" -ForegroundColor White
    Write-Host "   Start-Service 'Rhino.Compute'" -ForegroundColor White
    Write-Host "3. Check for port conflicts with IIS" -ForegroundColor Cyan
    Write-Host "4. Check service logs for errors" -ForegroundColor Cyan
}

Write-Host "`n🎉 Diagnosis complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
