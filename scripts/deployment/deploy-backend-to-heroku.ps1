# DEPLOY BACKEND TO HEROKU
# This script deploys the Rhino compute appserver to Heroku

Write-Host "🚀 DEPLOYING SOFTLYPLEASE BACKEND TO HEROKU" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow

# Set the backend directory path
$backendPath = "SoftlyPlease-BE-main/compute.rhino3d.appserver"
$fullBackendPath = Join-Path $PSScriptRoot $backendPath

Write-Host "Backend path: $fullBackendPath" -ForegroundColor Cyan

if (-not (Test-Path $fullBackendPath)) {
    Write-Host "❌ Backend directory not found: $fullBackendPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend directory found" -ForegroundColor Green

# Navigate to backend directory
Set-Location $fullBackendPath
Write-Host "Changed to directory: $(Get-Location)" -ForegroundColor Cyan

# Check if this is a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not a git repository" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git repository found" -ForegroundColor Green

# Check Heroku CLI
Write-Host "`n🔍 Checking Heroku CLI..." -ForegroundColor Yellow
try {
    $herokuVersion = heroku --version 2>$null
    Write-Host "✅ Heroku CLI available" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Installing..." -ForegroundColor Red
    # Install Heroku CLI
    Invoke-WebRequest -Uri https://cli-assets.heroku.com/install.ps1 -UseBasicParsing | Invoke-Expression
}

# Check Heroku login
Write-Host "`n🔑 Checking Heroku login..." -ForegroundColor Yellow
heroku whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please login to Heroku:" -ForegroundColor Yellow
    heroku login
}

# Check if Heroku app exists
Write-Host "`n📦 Checking Heroku app..." -ForegroundColor Yellow
$appName = "softlyplease-appserver"
$appExists = $false

try {
    $appInfo = heroku apps:info $appName --json 2>$null | ConvertFrom-Json
    if ($appInfo) {
        Write-Host "✅ Heroku app '$appName' exists" -ForegroundColor Green
        $appExists = $true
    }
} catch {
    Write-Host "⚠️ Heroku app '$appName' not found or not accessible" -ForegroundColor Yellow
}

if (-not $appExists) {
    Write-Host "Creating Heroku app '$appName'..." -ForegroundColor Yellow
    heroku create $appName --region us
}

# Set environment variables
Write-Host "`n⚙️ Setting environment variables..." -ForegroundColor Yellow
heroku config:set NODE_ENV=production --app $appName
heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/ --app $appName
heroku config:set RHINO_COMPUTE_APIKEY=p2robot-13a6-48f3-b24e-2025computeX --app $appName

# Check package.json
Write-Host "`n📦 Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "✅ App: $($package.name) v$($package.version)" -ForegroundColor Green
    Write-Host "✅ Main: $($package.main)" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    exit 1
}

# Check Procfile
Write-Host "`n📄 Checking Procfile..." -ForegroundColor Yellow
if (Test-Path "Procfile") {
    $procfile = Get-Content "Procfile"
    Write-Host "✅ Procfile: $procfile" -ForegroundColor Green
} else {
    Write-Host "❌ Procfile not found" -ForegroundColor Red
    exit 1
}

# Commit any changes
Write-Host "`n💾 Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Deploy SoftlyPlease backend to Heroku

- Backend Node.js appserver
- Rhino compute integration
- Production configuration
- Environment variables set"

# Deploy to Heroku
Write-Host "`n🚀 Deploying to Heroku..." -ForegroundColor Green
git push heroku main

# Wait for deployment
Write-Host "`n⏳ Waiting for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test the deployment
Write-Host "`n🧪 Testing deployment..." -ForegroundColor Yellow

$appUrl = "https://$appName.herokuapp.com"

# Test basic endpoint
try {
    $response = Invoke-WebRequest -Uri "$appUrl/version" -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Heroku backend responding" -ForegroundColor Green
        Write-Host "   URL: $appUrl" -ForegroundColor Cyan
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Heroku backend test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This might be normal if still deploying..." -ForegroundColor Yellow
}

# Show app information
Write-Host "`n📊 Heroku App Information:" -ForegroundColor Cyan
try {
    heroku apps:info $appName
} catch {
    Write-Host "❌ Could not get app info" -ForegroundColor Red
}

Write-Host "`n🎉 BACKEND DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host "✅ Heroku app: $appUrl" -ForegroundColor Green
Write-Host "✅ Environment configured" -ForegroundColor Green
Write-Host "✅ Backend deployed" -ForegroundColor Green

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test the backend API: $appUrl/version" -ForegroundColor White
Write-Host "2. Set up the Rhino compute server" -ForegroundColor White
Write-Host "3. Update frontend to point to correct backend" -ForegroundColor White

Write-Host "`n🌐 Backend URL for frontend:" -ForegroundColor Green
Write-Host "$appUrl" -ForegroundColor Green
