# Rhino Compute Azure VM Setup Script
# This script automates the complete installation of Rhino Compute on Windows Server
# Run as Administrator on your Azure VM

param(
    [Parameter(Mandatory=$true)]
    [string]$RhinoAccountsToken,
    
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "80"
)

Write-Host "=== Rhino Compute Azure VM Setup ===" -ForegroundColor Green
Write-Host "Starting automated installation..." -ForegroundColor Yellow

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please restart PowerShell as Administrator and try again."
    exit 1
}

# Step 1: Install Chocolatey (Windows Package Manager)
Write-Host "Step 1: Installing Chocolatey..." -ForegroundColor Cyan
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Step 2: Install required software
Write-Host "Step 2: Installing required software..." -ForegroundColor Cyan
choco install -y curl
choco install -y git

# Step 3: Install .NET Framework 4.8 (required for Rhino 7)
Write-Host "Step 3: Installing .NET Framework 4.8..." -ForegroundColor Cyan
$dotnetUrl = "https://go.microsoft.com/fwlink/?LinkId=2085150"
$dotnetInstaller = "$env:TEMP\ndp48-web.exe"
Invoke-WebRequest -Uri $dotnetUrl -OutFile $dotnetInstaller
Start-Process -FilePath $dotnetInstaller -ArgumentList "/quiet /norestart" -Wait

# Step 4: Download and install Rhino 7
Write-Host "Step 4: Installing Rhino 7..." -ForegroundColor Cyan
$rhinoUrl = "https://www.rhino3d.com/download/rhino/7.0/latest"
$rhinoInstaller = "$env:TEMP\rhino7-installer.exe"
Invoke-WebRequest -Uri $rhinoUrl -OutFile $rhinoInstaller
Start-Process -FilePath $rhinoInstaller -ArgumentList "/S" -Wait

# Step 5: Download Rhino Compute
Write-Host "Step 5: Downloading Rhino Compute..." -ForegroundColor Cyan
$computeUrl = "https://github.com/mcneel/compute.rhino3d/releases/latest/download/compute.rhino3d.zip"
$computeZip = "$env:TEMP\compute.rhino3d.zip"
$computeDir = "C:\compute"

Invoke-WebRequest -Uri $computeUrl -OutFile $computeZip

# Create compute directory and extract
if (Test-Path $computeDir) {
    Remove-Item $computeDir -Recurse -Force
}
New-Item -ItemType Directory -Path $computeDir -Force
Expand-Archive -Path $computeZip -DestinationPath $computeDir -Force

# Step 6: Set environment variables
Write-Host "Step 6: Setting environment variables..." -ForegroundColor Cyan
$env:RHINO_COMPUTE_URLS = "http://0.0.0.0:$Port"
$env:RHINO_COMPUTE_APIKEY = $ApiKey
$env:RHINO_ACCOUNTS_TOKEN = $RhinoAccountsToken

# Set environment variables permanently
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_URLS", "http://0.0.0.0:$Port", "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_APIKEY", $ApiKey, "Machine")
[Environment]::SetEnvironmentVariable("RHINO_ACCOUNTS_TOKEN", $RhinoAccountsToken, "Machine")

# Step 7: Configure Windows Firewall
Write-Host "Step 7: Configuring Windows Firewall..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "Rhino Compute HTTP" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow
New-NetFirewallRule -DisplayName "Rhino Compute HTTP Outbound" -Direction Outbound -Protocol TCP -LocalPort $Port -Action Allow

# Step 8: Install Rhino Compute as Windows Service
Write-Host "Step 8: Installing Rhino Compute as Windows Service..." -ForegroundColor Cyan
Set-Location $computeDir

# Install TopShelf service
.\compute.geometry.exe install --start

# Step 9: Verify installation
Write-Host "Step 9: Verifying installation..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check if service is running
$service = Get-Service -Name "compute.geometry" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "✓ Rhino Compute service is running successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Service installation failed. Checking logs..." -ForegroundColor Red
    Get-Service -Name "compute.geometry" -ErrorAction SilentlyContinue
}

# Test local connection
Write-Host "Testing local connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/version" -UseBasicParsing
    Write-Host "✓ Local connection successful: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Local connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 10: Display configuration summary
Write-Host "`n=== Configuration Summary ===" -ForegroundColor Green
Write-Host "Rhino Compute URL: http://0.0.0.0:$Port" -ForegroundColor White
Write-Host "API Key: $ApiKey" -ForegroundColor White
Write-Host "Installation Directory: $computeDir" -ForegroundColor White
Write-Host "Service Name: compute.geometry" -ForegroundColor White

# Step 11: Create management scripts
Write-Host "`nStep 11: Creating management scripts..." -ForegroundColor Cyan
$scriptsDir = "C:\compute\scripts"
New-Item -ItemType Directory -Path $scriptsDir -Force

# Create start service script
$startScript = @"
# Start Rhino Compute Service
Write-Host "Starting Rhino Compute service..." -ForegroundColor Green
Start-Service -Name "compute.geometry"
Write-Host "Service status: $(Get-Service -Name 'compute.geometry').Status" -ForegroundColor Yellow
"@
$startScript | Out-File -FilePath "$scriptsDir\start-service.ps1" -Encoding UTF8

# Create stop service script
$stopScript = @"
# Stop Rhino Compute Service
Write-Host "Stopping Rhino Compute service..." -ForegroundColor Yellow
Stop-Service -Name "compute.geometry"
Write-Host "Service status: $(Get-Service -Name 'compute.geometry').Status" -ForegroundColor Yellow
"@
$stopScript | Out-File -FilePath "$scriptsDir\stop-service.ps1" -Encoding UTF8

# Create restart service script
$restartScript = @"
# Restart Rhino Compute Service
Write-Host "Restarting Rhino Compute service..." -ForegroundColor Cyan
Restart-Service -Name "compute.geometry"
Start-Sleep -Seconds 5
Write-Host "Service status: $(Get-Service -Name 'compute.geometry').Status" -ForegroundColor Yellow
"@
$restartScript | Out-File -FilePath "$scriptsDir\restart-service.ps1" -Encoding UTF8

# Create status check script
$statusScript = @"
# Check Rhino Compute Service Status
Write-Host "=== Rhino Compute Service Status ===" -ForegroundColor Green
$service = Get-Service -Name "compute.geometry" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Service Name: $($service.Name)" -ForegroundColor White
    Write-Host "Status: $($service.Status)" -ForegroundColor White
    Write-Host "Start Type: $($service.StartType)" -ForegroundColor White
} else {
    Write-Host "Service not found!" -ForegroundColor Red
}

Write-Host "`n=== Environment Variables ===" -ForegroundColor Green
Write-Host "RHINO_COMPUTE_URLS: $env:RHINO_COMPUTE_URLS" -ForegroundColor White
Write-Host "RHINO_COMPUTE_APIKEY: $env:RHINO_COMPUTE_APIKEY" -ForegroundColor White
Write-Host "RHINO_ACCOUNTS_TOKEN: [HIDDEN]" -ForegroundColor White

Write-Host "`n=== Testing Connection ===" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/version" -UseBasicParsing
    Write-Host "✓ Connection successful: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
}
"@
$statusScript | Out-File -FilePath "$scriptsDir\check-status.ps1" -Encoding UTF8

Write-Host "`n=== Management Scripts Created ===" -ForegroundColor Green
Write-Host "Start Service: $scriptsDir\start-service.ps1" -ForegroundColor White
Write-Host "Stop Service: $scriptsDir\stop-service.ps1" -ForegroundColor White
Write-Host "Restart Service: $scriptsDir\restart-service.ps1" -ForegroundColor White
Write-Host "Check Status: $scriptsDir\check-status.ps1" -ForegroundColor White

# Step 12: Final verification and instructions
Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Your Rhino Compute server should now be accessible at:" -ForegroundColor White
Write-Host "http://YOUR_VM_IP:$Port" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Test external connectivity from your local machine" -ForegroundColor White
Write-Host "2. Configure your AppServer to use this URL and API key" -ForegroundColor White
Write-Host "3. Use the management scripts in $scriptsDir for service control" -ForegroundColor White

Write-Host "`nTo test external connectivity, run this from your local machine:" -ForegroundColor Yellow
Write-Host "curl -H 'RhinoComputeKey: $ApiKey' 'http://YOUR_VM_IP:$Port/version'" -ForegroundColor Gray

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
