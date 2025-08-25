# Rhino.Compute Installation Script for Azure VM
# Execute on the Windows VM after RDP connection

Write-Host "Starting Rhino.Compute installation on Azure VM..." -ForegroundColor Green

# Step 1: Set execution policy and install Chocolatey
Write-Host "Step 1: Installing prerequisites..." -ForegroundColor Yellow

try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force

    # Install Chocolatey
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

    # Refresh environment
    $env:Path += ";$env:ALLUSERSPROFILE\chocolatey\bin"

    # Install .NET Framework 4.8
    choco install dotnet4.8 -y

    # Install Visual C++ Redistributables
    choco install vcredist-all -y

    # Install Git
    choco install git -y

    Write-Host "Prerequisites installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Prerequisites installation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Install Rhino 8
Write-Host "Step 2: Installing Rhino 8..." -ForegroundColor Yellow

try {
    choco install rhino -y
    Write-Host "Rhino 8 installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Rhino installation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Download and install Rhino.Compute
Write-Host "Step 3: Installing Rhino.Compute..." -ForegroundColor Yellow

$computeZip = "$env:TEMP\rhino-compute.zip"
$computeDir = "C:\RhinoCompute"

try {
    # Download Rhino.Compute
    $computeUrl = "https://www.rhino3d.com/download/rhino/8/wip/rc"
    Invoke-WebRequest -Uri $computeUrl -OutFile $computeZip -TimeoutSec 300

    # Extract
    if (Test-Path $computeDir) {
        Remove-Item $computeDir -Recurse -Force
    }
    Expand-Archive -Path $computeZip -DestinationPath $computeDir -Force

    Write-Host "Rhino.Compute downloaded and extracted" -ForegroundColor Green
} catch {
    Write-Host "Rhino.Compute download/extraction failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Configure Rhino.Compute service
Write-Host "Step 4: Configuring Rhino.Compute service..." -ForegroundColor Yellow

$serviceName = "RhinoCompute"
$exePath = "$computeDir\RhinoCompute.exe"

try {
    # Stop existing service if it exists
    Stop-Service -Name $serviceName -ErrorAction SilentlyContinue
    sc.exe delete $serviceName 2>$null

    # Create new service on port 8081
    New-Service -Name $serviceName -BinaryPathName "$exePath --port=8081" -DisplayName "Rhino Compute" -Description "Rhino Compute headless service" -StartupType Automatic

    # Start the service
    Start-Service -Name $serviceName

    Write-Host "Rhino.Compute service created and started" -ForegroundColor Green
} catch {
    Write-Host "Service configuration failed: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Configure Windows Firewall
Write-Host "Step 5: Configuring Windows Firewall..." -ForegroundColor Yellow

try {
    New-NetFirewallRule -Name "RhinoCompute-HTTP" -DisplayName "Rhino Compute HTTP" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound
    Write-Host "Firewall configured successfully" -ForegroundColor Green
} catch {
    Write-Host "Firewall configuration failed: $_" -ForegroundColor Red
}

# Step 6: Test local service
Write-Host "Step 6: Testing local Rhino.Compute service..." -ForegroundColor Yellow

Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    Write-Host "✅ SUCCESS: Rhino.Compute is running!" -ForegroundColor Green
    Write-Host "Version: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Local service test failed: $_" -ForegroundColor Red
    Write-Host "Service status:" -ForegroundColor Yellow
    Get-Service -Name $serviceName -ErrorAction SilentlyContinue
}

# Final status
Write-Host ""
Write-Host "=== INSTALLATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "VM Public IP: 4.206.137.232" -ForegroundColor White
Write-Host "Service: $serviceName" -ForegroundColor White
Write-Host "Port: 8081" -ForegroundColor White
Write-Host "Local endpoint: http://localhost:8081" -ForegroundColor White
Write-Host "Public endpoint: http://4.206.137.232:8081" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Install IIS and configure HTTPS reverse proxy" -ForegroundColor White
Write-Host "2. Set up SSL certificate for compute.softlyplease.com" -ForegroundColor White
Write-Host "3. Configure Cloud Zoo licensing" -ForegroundColor White
Write-Host "4. Update DNS: compute.softlyplease.com -> 4.206.137.232" -ForegroundColor White
Write-Host "5. Test HTTPS endpoint: https://compute.softlyplease.com/version" -ForegroundColor White
