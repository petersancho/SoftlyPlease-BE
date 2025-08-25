# Rhino.Compute Installation Script for Azure VM
# This script installs all prerequisites and Rhino.Compute as a Windows Service

param(
    [string]$RhinoComputeUrl = "https://www.rhino3d.com/download/rhino/8/wip/rc",
    [string]$ComputePort = "8081",
    [string]$AdminPassword = "SoftlyPlease2024!"
)

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force

# Install Chocolatey
Write-Host "Installing Chocolatey..."
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Install prerequisites
Write-Host "Installing prerequisites..."
choco install -y dotnet4.8
choco install -y vcredist-all
choco install -y git

# Install Rhino 8
Write-Host "Installing Rhino 8..."
choco install -y rhino

# Download Rhino.Compute
Write-Host "Downloading Rhino.Compute..."
$computeZip = "$env:TEMP\rhino-compute.zip"
Invoke-WebRequest -Uri $RhinoComputeUrl -OutFile $computeZip

# Extract Rhino.Compute
Write-Host "Extracting Rhino.Compute..."
$computeDir = "C:\Program Files\RhinoCompute"
Expand-Archive -Path $computeZip -DestinationPath $computeDir -Force

# Install Rhino.Compute as Windows Service
Write-Host "Installing Rhino.Compute as Windows Service..."
$serviceName = "RhinoCompute"
$servicePath = "$computeDir\RhinoCompute.exe"

# Stop existing service if it exists
Stop-Service -Name $serviceName -ErrorAction SilentlyContinue
sc.exe delete $serviceName

# Create new service
New-Service -Name $serviceName -BinaryPathName "$servicePath --port=$ComputePort" -DisplayName "Rhino Compute" -Description "Rhino Compute headless service" -StartupType Automatic

# Start the service
Start-Service -Name $serviceName

# Configure Windows Firewall
Write-Host "Configuring Windows Firewall..."
New-NetFirewallRule -Name "RhinoCompute-HTTPS" -DisplayName "Rhino Compute HTTPS" -Protocol TCP -LocalPort $ComputePort -Action Allow -Direction Inbound

# Test the service
Start-Sleep -Seconds 10
Write-Host "Testing Rhino.Compute service..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$ComputePort/version" -TimeoutSec 30
    Write-Host "Rhino.Compute is running! Version: $($response.Content)"
} catch {
    Write-Host "Rhino.Compute installation completed, but service may need manual verification."
}

# Output completion message
Write-Host "Rhino.Compute installation completed!"
Write-Host "Service: $serviceName"
Write-Host "Port: $ComputePort"
Write-Host "Endpoint: http://localhost:$ComputePort"
Write-Host "Public access: https://$((Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet).IPAddress):$ComputePort"

# Instructions for next steps
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure Cloud Zoo licensing"
Write-Host "2. Set up SSL certificate"
Write-Host "3. Configure DNS to point compute.softlyplease.com to this VM"
Write-Host "4. Update Heroku environment variables with the new Compute URL"
