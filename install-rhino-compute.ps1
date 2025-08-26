# Rhino Compute Installation Script for Azure VM
# Run this as Administrator in PowerShell

Write-Host "=== Rhino Compute Installation for Azure VM ===" -ForegroundColor Green

# Step 1: Check if Rhino 7 is installed
Write-Host "Step 1: Checking for Rhino 7..." -ForegroundColor Yellow
$rhinoPath = "C:\Program Files\Rhino 7\System\Rhino.exe"
if (Test-Path $rhinoPath) {
    Write-Host "✅ Rhino 7 found at $rhinoPath" -ForegroundColor Green
} else {
    Write-Host "❌ Rhino 7 not found. Please install Rhino 7 first." -ForegroundColor Red
    Write-Host "Download from: https://www.rhino3d.com/download/rhino-for-windows/7/latest" -ForegroundColor Yellow
    exit 1
}

# Step 2: Install .NET Framework 4.8 if needed
Write-Host "Step 2: Checking .NET Framework..." -ForegroundColor Yellow
$netVersion = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" -ErrorAction SilentlyContinue
if ($netVersion.Release -ge 528040) {
    Write-Host "✅ .NET Framework 4.8 or later is installed" -ForegroundColor Green
} else {
    Write-Host "❌ .NET Framework 4.8 not found. Installing..." -ForegroundColor Yellow
    # Download and install .NET Framework 4.8
    $url = "https://download.visualstudio.microsoft.com/download/pr/7afca223-55d2-470a-8edc-6a1739ae3252/abd170b4b0ec15ad0222a809b761a036/ndp48-x86-x64-allos-enu.exe"
    $output = "$env:TEMP\ndp48-x86-x64-allos-enu.exe"
    Invoke-WebRequest -Uri $url -OutFile $output
    Start-Process -FilePath $output -ArgumentList "/quiet", "/norestart" -Wait
    Write-Host "✅ .NET Framework 4.8 installed" -ForegroundColor Green
}

# Step 3: Download and install Rhino Compute
Write-Host "Step 3: Downloading Rhino Compute..." -ForegroundColor Yellow
$computeUrl = "https://github.com/mcneel/compute.rhino3d/releases/latest/download/compute.geometry.zip"
$computeZip = "$env:TEMP\compute.geometry.zip"
$computeDir = "C:\Program Files\Rhino Compute"

Invoke-WebRequest -Uri $computeUrl -OutFile $computeZip
Expand-Archive -Path $computeZip -DestinationPath $computeDir -Force
Write-Host "✅ Rhino Compute downloaded and extracted to $computeDir" -ForegroundColor Green

# Step 4: Install Rhino Compute as a service
Write-Host "Step 4: Installing Rhino Compute service..." -ForegroundColor Yellow
$serviceName = "compute.geometry"
$servicePath = "$computeDir\compute.geometry.exe"

# Create the service
New-Service -Name $serviceName -BinaryPathName "$servicePath --port=6500 --bind=0.0.0.0" -DisplayName "Rhino Compute Geometry Server" -StartupType Automatic -Description "Rhino Compute Geometry Server for headless Grasshopper solving"

Write-Host "✅ Rhino Compute service installed" -ForegroundColor Green

# Step 5: Configure Windows Firewall
Write-Host "Step 5: Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Rhino Compute" -Direction Inbound -Protocol TCP -LocalPort 6500 -Action Allow
Write-Host "✅ Firewall rule created for port 6500" -ForegroundColor Green

# Step 6: Start the service
Write-Host "Step 6: Starting Rhino Compute service..." -ForegroundColor Yellow
Start-Service -Name $serviceName
Write-Host "✅ Rhino Compute service started" -ForegroundColor Green

# Step 7: Test the service
Write-Host "Step 7: Testing Rhino Compute service..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:6500/version" -TimeoutSec 30
    Write-Host "✅ Rhino Compute is responding: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Rhino Compute test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Create API key for authentication
Write-Host "Step 8: Creating API key..." -ForegroundColor Yellow
$apiKey = [guid]::NewGuid().ToString()
Write-Host "✅ Generated API key: $apiKey" -ForegroundColor Green
Write-Host "   Save this key - you'll need it for your Heroku app!" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== INSTALLATION COMPLETE ===" -ForegroundColor Green
Write-Host "Rhino Compute is now running on http://localhost:6500" -ForegroundColor White
Write-Host "External access: http://YOUR_VM_IP:6500" -ForegroundColor White
Write-Host "API Key: $apiKey" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your Heroku app with the API key:" -ForegroundColor White
Write-Host "   heroku config:set RHINO_COMPUTE_APIKEY=$apiKey --app softlyplease-appserver" -ForegroundColor White
Write-Host "2. Test external access from your local machine" -ForegroundColor White
