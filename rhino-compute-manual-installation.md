# Manual Rhino.Compute Installation Guide

## The Issue
The automated download failed because Rhino.Compute requires authentication. You need to download it manually from your local machine and then upload it to the Azure VM.

## Step 1: Download Rhino.Compute Locally

1. **Open your web browser** and go to: https://www.rhino3d.com/download/rhino/8/wip/rc
2. **Log in** with your Rhino account credentials
3. **Download** the Rhino.Compute package (it will be a ZIP file)
4. **Save** it to your local machine (e.g., `Downloads/rhino-compute.zip`)

## Step 2: Upload to Azure VM

### Option A: Use Azure Storage (Recommended)

1. **Create a storage account** in Azure Portal (or use existing one)
2. **Create a blob container** for file uploads
3. **Upload the ZIP file** to the blob container
4. **Generate a SAS token** for the blob with read access
5. **Download from VM** using the SAS URL:

```powershell
# On the Azure VM, run:
$blobUrl = "https://yourstorageaccount.blob.core.windows.net/container/rhino-compute.zip?sas_token_here"
$localZip = "C:\Temp\rhino-compute.zip"
Invoke-WebRequest -Uri $blobUrl -OutFile $localZip
```

### Option B: Use RDP File Transfer

1. **Connect to VM via RDP** (IP: 4.206.137.232)
2. **Use clipboard** to copy the file, or
3. **Use shared drives** if configured

## Step 3: Install on Azure VM

Once the ZIP file is on the VM, run these commands in PowerShell:

```powershell
# Extract the ZIP file
$computeZip = "C:\Temp\rhino-compute.zip"
$computeDir = "C:\RhinoCompute"

# Remove any existing directory
Remove-Item $computeDir -Recurse -Force -ErrorAction SilentlyContinue

# Extract
Expand-Archive -Path $computeZip -DestinationPath $computeDir -Force

# Verify extraction
Get-ChildItem $computeDir

# Look for the main executable (usually RhinoCompute.exe)
Get-ChildItem $computeDir -Filter "*.exe" -Recurse
```

## Step 4: Install as Windows Service

```powershell
# Configure the service
$serviceName = "RhinoCompute"
$exePath = "$computeDir\RhinoCompute.exe"

# Remove any existing service
Stop-Service -Name $serviceName -ErrorAction SilentlyContinue
sc.exe delete $serviceName 2>$null

# Create new service on port 8081
New-Service -Name $serviceName -BinaryPathName "$exePath --port=8081" -DisplayName "Rhino Compute" -Description "Rhino Compute headless service" -StartupType Automatic

# Start the service
Start-Service -Name $serviceName

# Verify service
Get-Service -Name $serviceName
```

## Step 5: Configure Firewall

```powershell
# Allow port 8081 through Windows Firewall
New-NetFirewallRule -Name "RhinoCompute-HTTP" -DisplayName "Rhino Compute HTTP" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound
```

## Step 6: Test Local Service

```powershell
# Test the service locally
Start-Sleep -Seconds 10
Invoke-WebRequest -Uri "http://localhost:8081/version"

# Check if port is listening
netstat -ano | findstr :8081
```

## Step 7: Test External Access

```bash
# From your local machine, test:
curl http://4.206.137.232:8081/version
```

## Step 8: Configure IIS HTTPS Reverse Proxy

### Install IIS Features
```powershell
# Install IIS and required components
Install-WindowsFeature -Name Web-Server,Web-Request-Monitor,Web-Http-Redirect,Web-Performance,Web-Dyn-Compression,Web-ARR

# Install URL Rewrite module from:
# https://www.iis.net/downloads/microsoft/url-rewrite
```

### Configure IIS Site
1. **Open IIS Manager**
2. **Create new site**:
   - Name: `compute.softlyplease.com`
   - Physical path: `C:\inetpub\wwwroot`
   - Binding: Port 80, Host name: `compute.softlyplease.com`

### Configure Reverse Proxy
1. **Open Application Request Routing** → **Server Proxy Settings**
2. **Enable proxy**: ✅
3. **Add URL Rewrite rule**:
   - Pattern: `(.*)`
   - Rewrite URL: `http://localhost:8081/{R:1}`

### Install SSL Certificate
```powershell
# Use Let's Encrypt (win-acme)
# Download from: https://www.win-acme.com/
wacs.exe --target iis --siteid 1 --email your-email@domain.com
```

### Update IIS Binding
- Add HTTPS binding (443) with SSL certificate
- Remove HTTP binding (optional, for security)

## Step 9: DNS Configuration

**In your DNS provider (Namecheap):**
- **Record Type**: A
- **Host**: `compute`
- **Value**: `4.206.137.232`
- **TTL**: 300 seconds

## Step 10: Test Complete Setup

```bash
# Test HTTPS endpoint
curl https://compute.softlyplease.com/version

# Test from App Server
curl -H "Authorization: Bearer prod-token-456" -X POST https://softlyplease.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definitionId":"f3997a3b7a68e0f2","inputs":{"height":500,"width":1000,"num":3}}'
```

## Troubleshooting

### Service Won't Start
```powershell
# Check service status
Get-Service -Name RhinoCompute

# Check event logs
Get-EventLog -LogName "Application" -Source "*Rhino*" -Newest 10

# Check if executable exists
Test-Path "C:\RhinoCompute\RhinoCompute.exe"

# Try running manually
& "C:\RhinoCompute\RhinoCompute.exe" --port=8081
```

### Port Already in Use
```powershell
# Find what's using port 8081
netstat -ano | findstr :8081

# Kill the process
Stop-Process -Id <PID> -Force
```

### IIS Reverse Proxy Issues
```powershell
# Check IIS site configuration
Get-Website -Name "compute.softlyplease.com"

# Check URL Rewrite rules
Get-WebConfiguration -Filter "/system.webServer/rewrite/rules/rule" -PSPath "IIS:\Sites\compute.softlyplease.com"
```

## File Locations Summary

- **Rhino.Compute ZIP**: Download from https://www.rhino3d.com/download/rhino/8/wip/rc
- **Extracted files**: `C:\RhinoCompute\`
- **Main executable**: `C:\RhinoCompute\RhinoCompute.exe`
- **Service name**: `RhinoCompute`
- **Port**: `8081`
- **Public IP**: `4.206.137.232`
- **Domain**: `compute.softlyplease.com`

## Next Steps

1. **Download** Rhino.Compute from your browser
2. **Upload** to Azure VM (use RDP or Azure Storage)
3. **Extract and install** following the steps above
4. **Configure IIS** reverse proxy
5. **Set up SSL** certificate
6. **Update DNS** to point to the VM
7. **Test integration** with Heroku App Server

**The infrastructure is ready - you just need to complete the software installation!** 🚀
