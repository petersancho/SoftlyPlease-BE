# SoftlyPlease Status Check Script
Write-Host "🔍 Checking SoftlyPlease System Status..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Check Rhino Compute (port 6500)
Write-Host "1. Checking Rhino Compute (Port 6500)..." -ForegroundColor Yellow
try {
    $rhinoResponse = Invoke-WebRequest -Uri "http://localhost:6500/version" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "   ✅ Rhino Compute is running" -ForegroundColor Green
    Write-Host "   📊 Version: $($rhinoResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Rhino Compute is not responding" -ForegroundColor Red
    Write-Host "   💡 Try: npm run start-rhino" -ForegroundColor Yellow
}

# Check Backend API (port 3000)
Write-Host "2. Checking Backend API (Port 3000)..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3000/version" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "   ✅ Backend API is running" -ForegroundColor Green
    Write-Host "   📊 Response: $($backendResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend API is not responding" -ForegroundColor Red
    Write-Host "   💡 Try: npm start" -ForegroundColor Yellow
}

# Check Network Ports
Write-Host "3. Checking Network Ports..." -ForegroundColor Yellow
$rhinoPort = netstat -ano | findstr :6500
$backendPort = netstat -ano | findstr :3000

if ($rhinoPort) {
    Write-Host "   ✅ Port 6500 (Rhino Compute) is listening" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port 6500 (Rhino Compute) is not listening" -ForegroundColor Red
}

if ($backendPort) {
    Write-Host "   ✅ Port 3000 (Backend API) is listening" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port 3000 (Backend API) is not listening" -ForegroundColor Red
}

# Check Environment Variables
Write-Host "4. Checking Environment Variables..." -ForegroundColor Yellow
$rhinoUrl = $env:RHINO_COMPUTE_URL
$rhinoKey = $env:RHINO_COMPUTE_KEY

if ($rhinoUrl) {
    Write-Host "   ✅ RHINO_COMPUTE_URL is set: $rhinoUrl" -ForegroundColor Green
} else {
    Write-Host "   ❌ RHINO_COMPUTE_URL is not set" -ForegroundColor Red
}

if ($rhinoKey) {
    Write-Host "   ✅ RHINO_COMPUTE_KEY is set" -ForegroundColor Green
} else {
    Write-Host "   ❌ RHINO_COMPUTE_KEY is not set" -ForegroundColor Red
}

# Check Grasshopper Definitions
Write-Host "5. Checking Grasshopper Definitions..." -ForegroundColor Yellow
$ghFiles = Get-ChildItem -Path "assets/gh-definitions" -Filter "*.gh" -ErrorAction SilentlyContinue
if ($ghFiles) {
    Write-Host "   ✅ Found $($ghFiles.Count) Grasshopper definition(s)" -ForegroundColor Green
    foreach ($file in $ghFiles) {
        Write-Host "      - $($file.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ No Grasshopper definitions found in assets/gh-definitions/" -ForegroundColor Red
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎯 Status check complete!" -ForegroundColor Green
Write-Host "   Use 'npm run restart' to restart all services" -ForegroundColor Yellow
