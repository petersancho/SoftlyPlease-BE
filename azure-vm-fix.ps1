# Azure VM Windows Services Fix Script
Write-Host "🔧 Starting Azure VM services fix..." -ForegroundColor Green

# Check service status
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
Get-Service SoftlyPleaseAppServer -ErrorAction SilentlyContinue
Get-Service "Rhino.Compute" -ErrorAction SilentlyContinue

# Try to start services if they exist
Write-Host "🚀 Attempting to start services..." -ForegroundColor Green
try {
    Start-Service SoftlyPleaseAppServer -ErrorAction Stop
    Write-Host "✅ SoftlyPleaseAppServer started" -ForegroundColor Green
} catch {
    Write-Host "❌ SoftlyPleaseAppServer failed to start: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Start-Service "Rhino.Compute" -ErrorAction Stop
    Write-Host "✅ Rhino.Compute started" -ForegroundColor Green
} catch {
    Write-Host "❌ Rhino.Compute failed to start: $($_.Exception.Message)" -ForegroundColor Red
}

# Check firewall rules
Write-Host "🔥 Checking firewall rules..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Rhino*" -or $_.DisplayName -like "*HTTP*" -or $_.DisplayName -like "*80*" -or $_.DisplayName -like "*6500*" }
if ($firewallRules) {
    Write-Host "✅ Firewall rules found:" -ForegroundColor Green
    $firewallRules | Select-Object DisplayName, Direction, Action | Format-Table
} else {
    Write-Host "❌ No relevant firewall rules found. Adding..." -ForegroundColor Red
    New-NetFirewallRule -DisplayName "HTTP Port 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Rhino Compute Port 6500" -Direction Inbound -Protocol TCP -LocalPort 6500 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ Firewall rules added" -ForegroundColor Green
}

# Test local services
Write-Host "🧪 Testing local services..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:80/version -TimeoutSec 10
    Write-Host "✅ Local AppServer responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Local AppServer not responding: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri http://localhost:6500/version -TimeoutSec 10
    Write-Host "✅ Local Rhino Compute responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Local Rhino Compute not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test external access
Write-Host "🌐 Testing external access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://4.248.252.92:80/version -TimeoutSec 10
    Write-Host "✅ External AppServer responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ External AppServer not responding: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri http://4.248.252.92:6500/version -TimeoutSec 10
    Write-Host "✅ External Rhino Compute responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ External Rhino Compute not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# If services still not working, try manual start
Write-Host "🔧 If services failed, trying manual start..." -ForegroundColor Yellow
try {
    cd C:\compute-sp
    Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow -Wait
    Write-Host "✅ Manual start attempted" -ForegroundColor Green
} catch {
    Write-Host "❌ Manual start failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "✅ Azure VM services fix complete!" -ForegroundColor Green
