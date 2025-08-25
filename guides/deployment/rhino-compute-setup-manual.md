# Manual Rhino.Compute Installation Guide for Azure VM

## VM Details
- **VM Name**: rhino-compute
- **Resource Group**: softlyplease-compute-rg
- **Location**: East US
- **Public IP**: 172.206.205.90
- **Admin Username**: azureuser
- **Admin Password**: SoftlyPlease2024!

## Step 1: Connect to VM
1. Use RDP to connect to `172.206.205.90`
2. Username: `azureuser`
3. Password: `SoftlyPlease2024!`

## Step 2: Install Prerequisites

Open PowerShell as Administrator and run:

```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force

# Install Chocolatey
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Install prerequisites
choco install -y dotnet4.8
choco install -y vcredist-all
choco install -y git
```

## Step 3: Install Rhino 8

```powershell
# Install Rhino 8
choco install -y rhino
```

## Step 4: Download and Install Rhino.Compute

```powershell
# Download Rhino.Compute
$computeZip = "$env:TEMP\rhino-compute.zip"
Invoke-WebRequest -Uri "https://www.rhino3d.com/download/rhino/8/wip/rc" -OutFile $computeZip

# Extract Rhino.Compute
$computeDir = "C:\Program Files\RhinoCompute"
Expand-Archive -Path $computeZip -DestinationPath $computeDir -Force

# Install as Windows Service
$serviceName = "RhinoCompute"
$servicePath = "$computeDir\RhinoCompute.exe"

# Stop existing service if it exists
Stop-Service -Name $serviceName -ErrorAction SilentlyContinue
sc.exe delete $serviceName

# Create new service (port 8081 for HTTPS)
New-Service -Name $serviceName -BinaryPathName "$servicePath --port=8081" -DisplayName "Rhino Compute" -Description "Rhino Compute headless service" -StartupType Automatic

# Start the service
Start-Service -Name $serviceName
```

## Step 5: Configure Windows Firewall

```powershell
# Configure Windows Firewall for port 8081
New-NetFirewallRule -Name "RhinoCompute-HTTPS" -DisplayName "Rhino Compute HTTPS" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound
```

## Step 6: Test the Service

```powershell
# Test locally
Start-Sleep -Seconds 10
Invoke-WebRequest -Uri "http://localhost:8081/version"

# Check service status
Get-Service -Name RhinoCompute
```

## Step 7: Set Up Cloud Zoo Licensing

1. Open Rhino on the VM
2. Go to Help → License → Cloud Zoo
3. Sign in with your Rhino account
4. Confirm core-hour billing entitlement

## Step 8: Configure SSL Certificate

**Option 1: Use Azure Application Gateway (Recommended)**
1. Create Azure Application Gateway in front of the VM
2. Configure SSL termination on the gateway
3. Point compute.softlyplease.com to the gateway

**Option 2: Self-Signed Certificate (Development)**
```powershell
# Generate self-signed certificate
New-SelfSignedCertificate -DnsName "compute.softlyplease.com" -CertStoreLocation "cert:\LocalMachine\My"

# Bind to port 443 (requires admin)
netsh http add sslcert ipport=0.0.0.0:443 certhash=YOUR_CERT_HASH appid="{YOUR_APP_ID}"
```

## Step 9: DNS Configuration

1. Go to your DNS provider (Namecheap)
2. Create A record for `compute.softlyplease.com`
3. Point it to `172.206.205.90`

## Step 10: Update Heroku Environment

Once Rhino.Compute is running on HTTPS:

```bash
# Update Heroku environment variables
heroku config:set COMPUTE_URL=https://compute.softlyplease.com --app softlyplease-appserver
```

## Verification

Test the complete setup:

```bash
# Test Compute directly
curl https://compute.softlyplease.com/version

# Test App Server integration
curl -H "Authorization: Bearer prod-token-456" https://softlyplease-appserver-5d5d5bc6198a.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definitionId":"f3997a3b7a68e0f2","inputs":{"height":500,"width":1000,"num":3}}'
```
