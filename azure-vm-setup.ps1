# Complete Azure VM Setup for softlyplease.com
# Run this PowerShell script on your Azure VM as Administrator

Write-Host "=== Setting up Rhino Compute on Azure VM ===" -ForegroundColor Green

# Check if Rhino 7 is installed
Write-Host "Checking for Rhino 7..." -ForegroundColor Yellow
$rhinoPath = "C:\Program Files\Rhino 7\System\Rhino.exe"
if (-not (Test-Path $rhinoPath)) {
    Write-Host "❌ ERROR: Rhino 7 is not installed!" -ForegroundColor Red
    Write-Host "Please install Rhino 7 first from: https://www.rhino3d.com/download" -ForegroundColor Yellow
    Write-Host "After installing Rhino 7, run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Rhino 7 found" -ForegroundColor Green

# Download Rhino Compute
Write-Host "Downloading Rhino Compute..." -ForegroundColor Yellow
$computeUrl = "https://github.com/mcneel/compute.rhino3d/releases/latest/download/compute.geometry.zip"
$computeZip = "$env:TEMP\compute.geometry.zip"
$computeDir = "C:\Program Files\Rhino Compute"

Invoke-WebRequest -Uri $computeUrl -OutFile $computeZip
if (Test-Path $computeDir) {
    Remove-Item $computeDir -Recurse -Force
}
Expand-Archive -Path $computeZip -DestinationPath $computeDir -Force
Write-Host "✅ Rhino Compute downloaded to $computeDir" -ForegroundColor Green

# Install as Windows service
Write-Host "Installing Rhino Compute service..." -ForegroundColor Yellow
$serviceName = "RhinoCompute"
$servicePath = "$computeDir\compute.geometry.exe"

# Remove existing service if it exists
if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
    Stop-Service -Name $serviceName -Force
    sc.exe delete $serviceName
}

# Create new service
New-Service -Name $serviceName -BinaryPathName "`"$servicePath`" --port=6500 --bind=0.0.0.0" -DisplayName "Rhino Compute Geometry Server" -StartupType Automatic
Write-Host "✅ Service installed" -ForegroundColor Green

# Configure firewall
Write-Host "Configuring firewall..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "Rhino Compute" -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Rhino Compute" -Direction Inbound -Protocol TCP -LocalPort 6500 -Action Allow
Write-Host "✅ Firewall configured" -ForegroundColor Green

# Start service
Write-Host "Starting Rhino Compute service..." -ForegroundColor Yellow
Start-Service -Name $serviceName
Start-Sleep -Seconds 5
Write-Host "✅ Service started" -ForegroundColor Green

# Test service
Write-Host "Testing service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6500/version" -TimeoutSec 30
    Write-Host "✅ Service responding: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Service test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Generate API key
Write-Host "Generating API key..." -ForegroundColor Yellow
$apiKey = [guid]::NewGuid().ToString()
Write-Host "✅ API Key: $apiKey" -ForegroundColor Green
Write-Host "   Save this key for your Heroku configuration!" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host "Your Azure VM is now ready!" -ForegroundColor White
Write-Host ""
Write-Host "Next: Update your Heroku app with:" -ForegroundColor Yellow
Write-Host "heroku config:set RHINO_COMPUTE_APIKEY=$apiKey" -ForegroundColor White
Write-Host "heroku config:set RHINO_COMPUTE_URL=http://4.248.252.92:6500/" -ForegroundColor White
Write-Host ""
Write-Host "Then test: https://softlyplease.com/examples/spikyThing/" -ForegroundColor White
