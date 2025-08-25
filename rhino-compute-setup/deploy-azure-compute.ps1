# Rhino Compute Azure Deployment Script (Based on McNeel Workshop)
# Adapted for Azure VM instead of AWS

Write-Host "=== Rhino Compute Azure Deployment Script ===" -ForegroundColor Green
Write-Host "Adapted from McNeel Workshop for Azure VM" -ForegroundColor Yellow

# Prerequisites check
Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "1. Azure CLI installed: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor White
Write-Host "2. Azure subscription with quota for Windows Server VMs" -ForegroundColor White
Write-Host "3. Rhino 7 license (for core hour billing)" -ForegroundColor White
Write-Host "" -ForegroundColor White

# Check Azure CLI
try {
    $azVersion = az --version | Select-Object -First 1
    Write-Host "✓ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Azure CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Login to Azure
Write-Host "Logging into Azure..." -ForegroundColor Yellow
az login

# Set subscription (if user has multiple)
$subscriptions = az account list --query "[].{Name:name, Id:id}" -o table
Write-Host "Available subscriptions:" -ForegroundColor Yellow
$subscriptions

$subscriptionId = Read-Host "Enter your subscription ID"
az account set --subscription $subscriptionId

# Configuration variables
$resourceGroup = Read-Host "Enter resource group name (will create if not exists)"
$location = Read-Host "Enter Azure region (e.g., eastus, westus2)"
$vmName = Read-Host "Enter VM name"
$adminUsername = Read-Host "Enter admin username"
$adminPassword = Read-Host "Enter admin password (must be 12+ chars, complex)" -AsSecureString
$adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword))

# Create resource group if it doesn't exist
Write-Host "Creating/checking resource group..." -ForegroundColor Yellow
az group create --name $resourceGroup --location $location

# Create virtual machine
Write-Host "Creating Windows Server 2019 VM..." -ForegroundColor Yellow
az vm create `
    --resource-group $resourceGroup `
    --name $vmName `
    --image Win2019Datacenter `
    --admin-username $adminUsername `
    --admin-password $adminPasswordPlain `
    --size Standard_D2s_v3 `
    --public-ip-address-allocation static `
    --public-ip-sku Standard

# Get public IP
$publicIp = az vm list-ip-addresses --resource-group $resourceGroup --name $vmName --query "[].virtualMachine.network.publicIpAddresses[0].ipAddress" -o tsv
Write-Host "VM Public IP: $publicIp" -ForegroundColor Green

# Open ports
Write-Host "Opening ports (8081 for Rhino Compute, 3389 for RDP)..." -ForegroundColor Yellow
az vm open-port --resource-group $resourceGroup --name $vmName --port 8081 --priority 1001
az vm open-port --resource-group $resourceGroup --name $vmName --port 3389 --priority 1002

# Create setup script for VM
Write-Host "Creating VM setup script..." -ForegroundColor Yellow
$setupScript = @"
# Rhino Compute Setup Script for Azure VM
Write-Host "=== Setting up Rhino Compute on Azure VM ===" -ForegroundColor Green

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force

# Install Chocolatey
Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install Git
Write-Host "Installing Git..." -ForegroundColor Yellow
choco install git -y

# Install .NET Framework 4.8 if needed
Write-Host "Checking .NET Framework..." -ForegroundColor Yellow
`$net48 = Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP' -Recurse | Get-ItemProperty -Name Version -ErrorAction SilentlyContinue | Where-Object { `$_.Version -like '4.8*' }

if (-not `$net48) {
    Write-Host "Installing .NET Framework 4.8..." -ForegroundColor Yellow
    choco install dotnetfx -y
}

# Download Rhino 7
Write-Host "Downloading Rhino 7..." -ForegroundColor Yellow
`$rhinoUrl = "https://www.rhino3d.com/download/rhino/7/wip/rc"
`$rhinoInstaller = "`$env:TEMP\rhino7.exe"
Invoke-WebRequest -Uri `$rhinoUrl -OutFile `$rhinoInstaller

Write-Host "Installing Rhino 7..." -ForegroundColor Yellow
Start-Process -FilePath `$rhinoInstaller -ArgumentList "/quiet", "/norestart" -Wait

# Create directory for Rhino Compute
New-Item -ItemType Directory -Path "C:\rhino-compute" -Force

# Download Rhino Compute
Write-Host "Downloading Rhino Compute..." -ForegroundColor Yellow
`$computeUrl = "https://ci.appveyor.com/api/buildjobs/2kwp2b2g4g2v4r7f/artifacts/rhino-8.x-Compute.Geometry.zip"
`$computeZip = "C:\rhino-compute\compute.zip"
Invoke-WebRequest -Uri `$computeUrl -OutFile `$computeZip

# Extract Rhino Compute
Write-Host "Extracting Rhino Compute..." -ForegroundColor Yellow
Expand-Archive -Path `$computeZip -DestinationPath "C:\rhino-compute\extracted" -Force

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_URL", "http://localhost:8081", "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_AUTH_TOKEN", "your-production-token-here", "Machine")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_API_KEY", "your-production-api-key-here", "Machine")

# Install IIS
Write-Host "Installing IIS..." -ForegroundColor Yellow
Install-WindowsFeature -Name Web-Server -IncludeAllSubFeature
Install-WindowsFeature -Name Web-Mgmt-Tools

# Configure Windows Firewall
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -Name "RhinoCompute" -DisplayName "Rhino Compute" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound

# Create Rhino Compute service
Write-Host "Creating Rhino Compute Windows service..." -ForegroundColor Yellow
`$serviceName = "RhinoCompute"
`$servicePath = "C:\rhino-compute\extracted\compute.geometry.exe"

# Create service account (optional, using LocalSystem for simplicity)
New-Service -Name `$serviceName -BinaryPathName `$servicePath -DisplayName "Rhino Compute" -StartupType Automatic -Description "Rhino Compute Geometry Server"

# Start the service
Write-Host "Starting Rhino Compute service..." -ForegroundColor Yellow
Start-Service -Name `$serviceName

# Test the installation
Write-Host "Testing Rhino Compute installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 10  # Wait for service to start

try {
    `$response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    Write-Host "✓ Rhino Compute is running!" -ForegroundColor Green
    Write-Host "Response: `$($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Rhino Compute test failed: `$($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "Rhino Compute should now be running on http://localhost:8081" -ForegroundColor Green
Write-Host "From external: http://$publicIp`:8081" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. RDP into the VM and verify Rhino Compute is running" -ForegroundColor White
Write-Host "2. Update your App Server environment variables with the Azure VM IP" -ForegroundColor White
Write-Host "3. Test connection from your App Server" -ForegroundColor White
Write-Host ""
Write-Host "To update Rhino Compute:" -ForegroundColor Yellow
Write-Host "1. Stop the service: Stop-Service -Name RhinoCompute" -ForegroundColor White
Write-Host "2. Download new version and replace files" -ForegroundColor White
Write-Host "3. Start the service: Start-Service -Name RhinoCompute" -ForegroundColor White
"@

# Save setup script locally
$setupScript | Out-File "$scriptPath\vm-setup.ps1" -Encoding UTF8

# Upload setup script to VM
Write-Host "Uploading setup script to VM..." -ForegroundColor Yellow
az vm run-command invoke `
    --resource-group $resourceGroup `
    --name $vmName `
    --command-id RunPowerShellScript `
    --scripts $setupScript

# Create deployment documentation
$deploymentDoc = @"
# Rhino Compute Azure Deployment Guide

## VM Details
- **Name**: $vmName
- **Resource Group**: $resourceGroup
- **Location**: $location
- **Public IP**: $publicIp
- **Admin Username**: $adminUsername

## Connection Information
- **RDP**: $publicIp`:3389
- **Rhino Compute**: http://$publicIp`:8081

## Environment Variables Set on VM
- `RHINO_COMPUTE_URL`: http://localhost:8081
- `RHINO_COMPUTE_AUTH_TOKEN`: your-production-token-here
- `RHINO_COMPUTE_API_KEY`: your-production-api-key-here

## Important Notes

### Licensing
- This VM will use **core hour billing** (not perpetual licenses)
- Cost: ~`$0.10 per core per hour during active usage
- Currently **FREE** during Rhino 7 beta period

### Security
- Change default RDP port (3389) for security
- Use strong admin password
- Consider setting up Azure Bastion for secure RDP access

### Maintenance
- Update Rhino Compute weekly (or when Rhino 7 updates)
- Monitor VM performance and scale as needed
- Set up Azure Monitor alerts for high CPU/memory usage

## Updating Rhino Compute

1. **RDP into VM**
2. **Stop service**:
   ```powershell
   Stop-Service -Name RhinoCompute
   ```
3. **Download latest** from AppVeyor
4. **Replace files** in C:\rhino-compute\extracted\
5. **Start service**:
   ```powershell
   Start-Service -Name RhinoCompute
   ```

## Scaling

### Vertical Scaling (More Power)
- Increase VM size: Standard_D4s_v3, Standard_D8s_v3, etc.
- More cores = more concurrent computations
- Higher memory for large geometry

### Horizontal Scaling (Multiple VMs)
- Create multiple VMs in a scale set
- Use Azure Load Balancer to distribute requests
- More complex but better for high traffic

## Monitoring

### Azure Monitor
- Set up VM insights
- Monitor CPU, memory, network usage
- Set up alerts for high usage

### Application Monitoring
- Check Rhino Compute logs in Event Viewer
- Monitor response times from your App Server
- Set up health checks

## Cost Optimization

- **Use B-series VMs** for burstable workloads
- **Set up auto-shutdown** during off-hours
- **Use reserved instances** for consistent usage
- **Monitor and optimize** VM size based on actual usage

## Backup and Recovery

- **Enable Azure Backup** for VM protection
- **Take VM snapshots** before major updates
- **Consider managed disks** for better reliability

## Troubleshooting

### Cannot Connect to Rhino Compute
1. Check if service is running: `Get-Service -Name RhinoCompute`
2. Verify firewall rules: `Get-NetFirewallRule -Name RhinoCompute`
3. Check VM's public IP is accessible
4. Verify environment variables are set correctly

### Performance Issues
1. Check VM CPU/memory usage in Azure Portal
2. Monitor network latency between App Server and VM
3. Consider upgrading VM size
4. Check Rhino Compute logs for errors

### Licensing Issues
1. Verify core hour billing is enabled in Rhino account
2. Check VM has internet access for license validation
3. Monitor core hour usage in Rhino account dashboard

For more detailed troubleshooting, see the McNeel workshop transcript.
"@

$deploymentDoc | Out-File "$scriptPath\AZURE-DEPLOYMENT-GUIDE.md" -Encoding UTF8

Write-Host ""
Write-Host "=== Azure Deployment Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "VM Details:" -ForegroundColor Yellow
Write-Host "  Name: $vmName" -ForegroundColor White
Write-Host "  Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "  Location: $location" -ForegroundColor White
Write-Host "  Public IP: $publicIp" -ForegroundColor White
Write-Host ""
Write-Host "Connection:" -ForegroundColor Yellow
Write-Host "  RDP: $publicIp`:3389" -ForegroundColor White
Write-Host "  Username: $adminUsername" -ForegroundColor White
Write-Host ""
Write-Host "Rhino Compute will be available at:" -ForegroundColor Yellow
Write-Host "  http://$publicIp`:8081" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. RDP into VM and verify setup" -ForegroundColor White
Write-Host "2. Update App Server with VM IP: $publicIp" -ForegroundColor White
Write-Host "3. Test connection from your App Server" -ForegroundColor White
Write-Host ""
Write-Host "See AZURE-DEPLOYMENT-GUIDE.md for complete documentation." -ForegroundColor Cyan
