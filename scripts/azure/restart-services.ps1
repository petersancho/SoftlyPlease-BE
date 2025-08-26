# Azure VM Windows Services Restart Script
# Run as Administrator on Azure VM

Write-Host "🔧 SOFTLYPLEASE.COM - Azure VM Services Restart" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Function to test service endpoint
function Test-ServiceEndpoint {
    param([string]$url, [string]$serviceName)
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ $serviceName responding: $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $serviceName not responding: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Step 1: Check current service status
Write-Host "`n🔍 Step 1: Checking current service status..." -ForegroundColor Yellow
Get-Service SoftlyPleaseAppServer -ErrorAction SilentlyContinue | Format-Table Name, Status, StartType
Get-Service "Rhino.Compute" -ErrorAction SilentlyContinue | Format-Table Name, Status, StartType

# Step 2: Stop services safely (if running)
Write-Host "`n🛑 Step 2: Stopping services safely..." -ForegroundColor Yellow
try {
    Stop-Service SoftlyPleaseAppServer -Force -ErrorAction Stop
    Write-Host "✅ SoftlyPleaseAppServer stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️ SoftlyPleaseAppServer not running or failed to stop: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    Stop-Service "Rhino.Compute" -Force -ErrorAction Stop
    Write-Host "✅ Rhino.Compute stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Rhino.Compute not running or failed to stop: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 3: Start Rhino Compute first (port 6500)
Write-Host "`n🚀 Step 3: Starting Rhino.Compute service (port 6500)..." -ForegroundColor Yellow
try {
    Start-Service "Rhino.Compute" -ErrorAction Stop
    Write-Host "✅ Rhino.Compute started" -ForegroundColor Green

    # Wait for service to initialize
    Start-Sleep -Seconds 5

    # Test local Rhino Compute
    Test-ServiceEndpoint "http://localhost:6500/version" "Local Rhino Compute"

} catch {
    Write-Host "❌ Rhino.Compute failed to start: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Start Node.js AppServer (port 80)
Write-Host "`n🚀 Step 4: Starting SoftlyPleaseAppServer service (port 80)..." -ForegroundColor Yellow
try {
    Start-Service SoftlyPleaseAppServer -ErrorAction Stop
    Write-Host "✅ SoftlyPleaseAppServer started" -ForegroundColor Green

    # Wait for service to initialize
    Start-Sleep -Seconds 5

    # Test local AppServer
    Test-ServiceEndpoint "http://localhost:80/version" "Local AppServer"

} catch {
    Write-Host "❌ SoftlyPleaseAppServer failed to start: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Verify services are running
Write-Host "`n🔍 Step 5: Verifying services are running..." -ForegroundColor Yellow
Get-Service SoftlyPleaseAppServer, "Rhino.Compute" | Format-Table Name, Status, StartType

# Step 6: Test external access
Write-Host "`n🌐 Step 6: Testing external access..." -ForegroundColor Yellow
Test-ServiceEndpoint "http://4.248.252.92:80/version" "External AppServer"
Test-ServiceEndpoint "http://4.248.252.92:6500/version" "External Rhino Compute"

# Step 7: Test service communication
Write-Host "`n🔗 Step 7: Testing service communication..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/solve/BranchNodeRnd.gh?Radius=5&Count=10" -TimeoutSec 30 -ErrorAction Stop
    Write-Host "✅ Service communication working: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Service communication failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Final status report
Write-Host "`n📊 FINAL STATUS REPORT" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green

$localAppServer = Test-ServiceEndpoint "http://localhost:80/version" "Local AppServer" -asBool
$localRhino = Test-ServiceEndpoint "http://localhost:6500/version" "Local Rhino Compute" -asBool
$externalAppServer = Test-ServiceEndpoint "http://4.248.252.92:80/version" "External AppServer" -asBool
$externalRhino = Test-ServiceEndpoint "http://4.248.252.92:6500/version" "External Rhino Compute" -asBool

Write-Host "`n🎯 Azure VM Services Restart Complete!" -ForegroundColor Green
Write-Host "Next: Run the Heroku deployment script on your local machine." -ForegroundColor Yellow
