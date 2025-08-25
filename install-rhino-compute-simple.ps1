# Simplified Rhino.Compute Installation Script
# Run this on the Azure VM after connecting via RDP

Write-Host "Starting Rhino.Compute installation..."

# Step 1: Install Chocolatey and prerequisites
Write-Host "Installing Chocolatey..."
try {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    $env:Path += ";$env:ALLUSERSPROFILE\chocolatey\bin"
} catch {
    Write-Host "Chocolatey installation failed: $_"
}

# Step 2: Install .NET Framework 4.8
Write-Host "Installing .NET Framework 4.8..."
try {
    choco install dotnet4.8 -y
} catch {
    Write-Host ".NET installation failed: $_"
}

# Step 3: Install Visual C++ Redistributables
Write-Host "Installing Visual C++ Redistributables..."
try {
    choco install vcredist-all -y
} catch {
    Write-Host "VC++ Redist installation failed: $_"
}

# Step 4: Install Git
Write-Host "Installing Git..."
try {
    choco install git -y
} catch {
    Write-Host "Git installation failed: $_"
}

# Step 5: Install Rhino 8
Write-Host "Installing Rhino 8..."
try {
    choco install rhino -y
} catch {
    Write-Host "Rhino installation failed: $_"
}

# Step 6: Download Rhino.Compute
Write-Host "Downloading Rhino.Compute..."
$computeUrl = "https://www.rhino3d.com/download/rhino/8/wip/rc"
$computeZip = "$env:TEMP\rhino-compute.zip"
$computeDir = "C:\RhinoCompute"

try {
    Invoke-WebRequest -Uri $computeUrl -OutFile $computeZip -TimeoutSec 300
    Write-Host "Download complete"
} catch {
    Write-Host "Download failed: $_"
    exit 1
}

# Step 7: Extract and install
Write-Host "Extracting Rhino.Compute..."
try {
    if (Test-Path $computeDir) {
        Remove-Item $computeDir -Recurse -Force
    }
    Expand-Archive -Path $computeZip -DestinationPath $computeDir -Force
} catch {
    Write-Host "Extraction failed: $_"
    exit 1
}

# Step 8: Install as Windows Service
Write-Host "Installing Windows Service..."
$serviceName = "RhinoCompute"
$exePath = "$computeDir\RhinoCompute.exe"

try {
    # Stop existing service
    Stop-Service -Name $serviceName -ErrorAction SilentlyContinue
    sc.exe delete $serviceName 2>$null

    # Create new service on port 8081
    New-Service -Name $serviceName -BinaryPathName "$exePath --port=8081" -DisplayName "Rhino Compute" -Description "Rhino Compute headless service" -StartupType Automatic

    # Start service
    Start-Service -Name $serviceName
    Write-Host "Service installed and started"
} catch {
    Write-Host "Service installation failed: $_"
}

# Step 9: Configure firewall
Write-Host "Configuring firewall..."
try {
    New-NetFirewallRule -Name "RhinoCompute-HTTP" -DisplayName "Rhino Compute HTTP" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound -ErrorAction SilentlyContinue
    Write-Host "Firewall configured"
} catch {
    Write-Host "Firewall configuration failed: $_"
}

# Step 10: Test service
Write-Host "Testing service..."
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    Write-Host "SUCCESS: Rhino.Compute is running!"
    Write-Host "Version: $($response.Content)"
} catch {
    Write-Host "Service test failed: $_"
    Write-Host "Service status:"
    Get-Service -Name $serviceName -ErrorAction SilentlyContinue
}

# Final instructions
Write-Host ""
Write-Host "=== INSTALLATION COMPLETE ==="
Write-Host "VM IP: 172.206.205.90"
Write-Host "Service: RhinoCompute"
Write-Host "Port: 8081"
Write-Host "Local endpoint: http://localhost:8081"
Write-Host "Public endpoint: http://172.206.205.90:8081"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure Cloud Zoo licensing in Rhino"
Write-Host "2. Set up SSL certificate for HTTPS"
Write-Host "3. Configure DNS: compute.softlyplease.com -> 172.206.205.90"
Write-Host "4. Update Heroku: COMPUTE_URL=https://compute.softlyplease.com"
