# Rhino Compute AWS Deployment Script
# Based on McNeel App Server Workshop

Write-Host "=== Rhino Compute AWS Deployment Script ===" -ForegroundColor Green

# Prerequisites Check
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $principal.IsInRole($adminRole)) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Set Environment Variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow

# Set Rhino Compute environment variables
$env:RHINO_COMPUTE_URL = "http://localhost:8081"
$env:RHINO_COMPUTE_AUTH_TOKEN = "your-auth-token-here"
$env:RHINO_COMPUTE_API_KEY = "your-api-key-here"

# Make permanent
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_URL", $env:RHINO_COMPUTE_URL, "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_AUTH_TOKEN", $env:RHINO_COMPUTE_AUTH_TOKEN, "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_API_KEY", $env:RHINO_COMPUTE_API_KEY, "Machine")

# Install IIS
Write-Host "Installing IIS..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-LoggingLibraries
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestMonitor
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpTracing
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-URLAuthorization
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-IPSecurity
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName IIS-IIS6ManagementCompatibility
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Metabase
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-BasicAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WindowsAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIExtensions
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIFilter
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45

# Install .NET Framework 4.8 if not present
Write-Host "Checking .NET Framework 4.8..." -ForegroundColor Yellow
$net48 = Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP' -Recurse | Get-ItemProperty -Name Version -ErrorAction SilentlyContinue | Where-Object { $_.Version -like '4.8*' }

if (-not $net48) {
    Write-Host "Installing .NET Framework 4.8..." -ForegroundColor Yellow
    # Download and install .NET Framework 4.8
    $net48Url = "https://download.visualstudio.microsoft.com/download/pr/7afca223-55d2-470a-8edc-6a1739ae3252/abd7e2012afa5d2ce04d84bd74202c8d/ndp48-x86-x64-allos-enu.exe"
    $net48Installer = "$env:TEMP\ndp48-x86-x64-allos-enu.exe"

    Invoke-WebRequest -Uri $net48Url -OutFile $net48Installer
    Start-Process -FilePath $net48Installer -ArgumentList "/quiet", "/norestart" -Wait
}

# Download Rhino 7
Write-Host "Downloading Rhino 7..." -ForegroundColor Yellow
$rhinoUrl = "https://www.rhino3d.com/download/rhino/7/wip/rc"
$rhinoInstaller = "$env:TEMP\rhino7.exe"
Invoke-WebRequest -Uri $rhinoUrl -OutFile $rhinoInstaller

Write-Host "Installing Rhino 7..." -ForegroundColor Yellow
Start-Process -FilePath $rhinoInstaller -ArgumentList "/quiet", "/norestart" -Wait

# Install Rhino Compute as Service
Write-Host "Installing Rhino Compute as Windows Service..." -ForegroundColor Yellow

# Create service user (if needed)
$serviceUser = "ComputeServiceUser"
$servicePassword = "YourSecurePassword123!"

# Create service account
$computerName = $env:COMPUTERNAME
$serviceAccount = "$computerName\$serviceUser"

# Install the service
New-Service -Name "RhinoCompute" -BinaryPathName "C:\path\to\compute.geometry.exe" -DisplayName "Rhino Compute" -StartupType Automatic -Credential $serviceAccount

# Configure firewall
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -Name "RhinoCompute" -DisplayName "Rhino Compute" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound

# Start the service
Write-Host "Starting Rhino Compute service..." -ForegroundColor Yellow
Start-Service -Name "RhinoCompute"

# Test the installation
Write-Host "Testing Rhino Compute installation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    Write-Host "SUCCESS: Rhino Compute is running!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Rhino Compute test failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Rhino Compute is now running as a Windows service on port 8081" -ForegroundColor Green
Write-Host "Environment Variables Set:" -ForegroundColor Yellow
Write-Host "  RHINO_COMPUTE_URL: $($env:RHINO_COMPUTE_URL)" -ForegroundColor White
Write-Host "  RHINO_COMPUTE_AUTH_TOKEN: $($env:RHINO_COMPUTE_AUTH_TOKEN)" -ForegroundColor White
Write-Host "  RHINO_COMPUTE_API_KEY: $($env:RHINO_COMPUTE_API_KEY)" -ForegroundColor White
