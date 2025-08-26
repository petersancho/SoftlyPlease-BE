# AZURE VM WINDOWS SERVICES QUICK FIX
# Run as Administrator on your Azure VM

Write-Host "🔧 SOFTLYPLEASE.COM - Azure VM Services Quick Fix" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow

# Step 1: Check current service status
Write-Host "`n🔍 Checking current service status..." -ForegroundColor Yellow
Get-Service SoftlyPleaseAppServer -ErrorAction SilentlyContinue
Get-Service "Rhino.Compute" -ErrorAction SilentlyContinue

# Step 2: Stop services safely (if running)
Write-Host "`n🛑 Stopping services safely..." -ForegroundColor Yellow
Stop-Service SoftlyPleaseAppServer -Force -ErrorAction SilentlyContinue
Stop-Service "Rhino.Compute" -Force -ErrorAction SilentlyContinue

# Step 3: Start Rhino Compute first (port 6500)
Write-Host "`n🚀 Starting Rhino.Compute service..." -ForegroundColor Green
Start-Service "Rhino.Compute" -ErrorAction Stop
Write-Host "✅ Rhino.Compute started" -ForegroundColor Green

# Step 4: Wait for Rhino to initialize
Write-Host "⏳ Waiting for Rhino Compute to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 5: Start Node.js AppServer (port 80)
Write-Host "`n🚀 Starting SoftlyPleaseAppServer service..." -ForegroundColor Green
Start-Service SoftlyPleaseAppServer -ErrorAction Stop
Write-Host "✅ SoftlyPleaseAppServer started" -ForegroundColor Green

# Step 6: Wait for AppServer to initialize
Write-Host "⏳ Waiting for AppServer to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 7: Verify services are running
Write-Host "`n🔍 Verifying services are running..." -ForegroundColor Yellow
Get-Service SoftlyPleaseAppServer, "Rhino.Compute" | Format-Table Name, Status, StartType

# Step 8: Test local services
Write-Host "`n🧪 Testing local services..." -ForegroundColor Yellow

Write-Host "Testing local AppServer (port 80)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/version" -TimeoutSec 10 -ErrorAction Stop
    Write-Host " ✅ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing local Rhino Compute (port 6500)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6500/version" -TimeoutSec 15 -ErrorAction Stop
    Write-Host " ✅ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

# Step 9: Test external access
Write-Host "`n🌐 Testing external access..." -ForegroundColor Yellow

Write-Host "Testing external AppServer (port 80)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://4.248.252.92:80/version" -TimeoutSec 10 -ErrorAction Stop
    Write-Host " ✅ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing external Rhino Compute (port 6500)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://4.248.252.92:6500/version" -TimeoutSec 15 -ErrorAction Stop
    Write-Host " ✅ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

# Step 10: Test service communication
Write-Host "`n🔗 Testing service communication..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/solve/BranchNodeRnd.gh?Radius=5&Count=10" -TimeoutSec 30 -ErrorAction Stop
    Write-Host "✅ Service communication working (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Service communication failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Azure VM Services Fix Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host "Next: Test softlyplease.com - it should be working now!" -ForegroundColor Yellow
