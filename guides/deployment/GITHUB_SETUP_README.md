# SoftlyPlease.com - Complete Setup Guide for Backend Developer

## 📋 OVERVIEW
This guide provides your backend developer with everything needed to complete the SoftlyPlease.com remote Grasshopper computation deployment. The infrastructure foundation is ready - you just need to complete the final configuration steps.

## 🎯 CURRENT STATUS (Updated)
- ✅ **Azure VM**: Windows Server 2022 with Rhino 8 installed (`4.206.137.232`)
- ✅ **DNS**: `compute.softlyplease.com` → Azure VM
- ✅ **Heroku App Server**: Deployed and running at `softlyplease-appserver-5d5d5bc6198a.herokuapp.com`
- ✅ **Repository**: Completely reorganized with architectural structure
- ✅ **15 Grasshopper Definitions**: Available in `assets/gh-definitions/`
- ✅ **API Endpoints**: All endpoints active and documented
- ✅ **GitHub Actions**: Automated deployment configured
- 🔄 **Rhino.Compute Service**: Final configuration needed on VM
- 🔄 **GitHub Secrets**: Need to be configured for CI/CD

## 🔐 REQUIRED: GitHub Repository Secrets Setup

### Step 1: Navigate to Secrets
1. Go to: `https://github.com/boi1da-proj/SoftlyPlease-Compute`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Step 2: Add These 5 Secrets

**HEROKU_API_KEY**
- Name: `HEROKU_API_KEY`
- Value: `[Your Heroku API Key - Get from Heroku Account Settings]`

**HEROKU_APP_NAME**
- Name: `HEROKU_APP_NAME`
- Value: `softlyplease-appserver`

**HEROKU_EMAIL**
- Name: `HEROKU_EMAIL`
- Value: `[Your Heroku Account Email]`

**APP_TOKEN**
- Name: `APP_TOKEN`
- Value: `[Your Application Token - Choose a secure token]`

**RHINO_COMPUTE_KEY**
- Name: `RHINO_COMPUTE_KEY`
- Value: `[Your Rhino Compute API Key - Generate a secure key]`

### Step 3: Optional Additional Secrets

**AZURE_VM_IP**
- Name: `AZURE_VM_IP`
- Value: `4.206.137.232`

**COMPUTE_URL**
- Name: `COMPUTE_URL`
- Value: `https://compute.softlyplease.com`

## 🚀 PHASE 1: COMPLETE AZURE VM SETUP

### 1.1 Access Your VM
- **IP**: `4.206.137.232`
- **Username**: `azureuser` (or your admin username)
- **RDP**: Connect via Remote Desktop
- **Admin Rights**: All commands require administrator privileges

### 1.2 Run the Automated VM Setup Script

**On the Azure VM, open PowerShell as Administrator and run this complete script:**

```powershell
# =============================================================================
# COMPLETE VM SETUP FOR SOFTLYPLEASE.COM RHINO COMPUTE + IIS/ARR
# Run this entire script as Administrator in PowerShell
# =============================================================================

Write-Host "Starting SoftlyPlease VM Setup..."
$startTime = Get-Date

# Function to clean up temp files
function Clean-TempFiles {
    param([string]$path)
    if (Test-Path $path) {
        Remove-Item $path -Force -ErrorAction SilentlyContinue
        Write-Host "  Cleaned up: $path"
    }
}

# =============================================================================
# 1. INSTALL IIS WITH ALL REQUIRED FEATURES
# =============================================================================
Write-Host "Installing IIS and required features..."

$features = @(
    "Web-Server",
    "Web-WebSockets",
    "Web-Mgmt-Service",
    "Web-Request-Monitor",
    "Web-Http-Redirect",
    "Web-Performance",
    "Web-Dyn-Compression",
    "Web-Stat-Compression",
    "Web-Filtering",
    "Web-Basic-Auth",
    "Web-Windows-Auth",
    "Web-Net-Ext45",
    "Web-Asp-Net45",
    "Web-ISAPI-Ext",
    "Web-ISAPI-Filter"
)

foreach ($feature in $features) {
    Write-Host "  Installing $feature..."
    Install-WindowsFeature -Name $feature -ErrorAction Stop | Out-Null
}
Write-Host "  IIS features installed"

# =============================================================================
# 2. DOWNLOAD AND INSTALL ARR + URL REWRITE
# =============================================================================
Write-Host "Downloading and installing ARR + URL Rewrite..."

# Create temp directory
$tempDir = "C:\Temp\SoftlyPleaseSetup"
if (!(Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir | Out-Null }

# Download ARR (Application Request Routing)
Write-Host "  Downloading ARR..."
$arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
$localArrPath = "$tempDir\requestRouter_amd64.msi"
Invoke-WebRequest -Uri $arrUrl -OutFile $localArrPath -UseBasicParsing

# Install ARR silently
Write-Host "  Installing ARR..."
Start-Process msiexec.exe -ArgumentList "/i `"$localArrPath`" /quiet /norestart" -Wait -NoNewWindow

# Download URL Rewrite
Write-Host "  Downloading URL Rewrite..."
$urlRewriteUrl = "https://download.microsoft.com/download/D/8/1/D81E5DD6-1ABB-46B0-B23B-1C0399784332/rewrite_amd64.msi"
$localRewritePath = "$tempDir\rewrite_amd64.msi"
Invoke-WebRequest -Uri $urlRewriteUrl -OutFile $localRewritePath -UseBasicParsing

# Install URL Rewrite silently
Write-Host "  Installing URL Rewrite..."
Start-Process msiexec.exe -ArgumentList "/i `"$localRewritePath`" /quiet /norestart" -Wait -NoNewWindow

Write-Host "  ARR and URL Rewrite installed"

# =============================================================================
# 3. CONFIGURE RHINO COMPUTE SERVICE
# =============================================================================
Write-Host "Configuring Rhino.Compute service..."

$serviceName = "RhinoCompute"
$computeDir = "C:\RhinoCompute"

# Check if service exists
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "  Stopping existing service..."
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $serviceName 2>$null | Out-Null
    Start-Sleep -Seconds 2
}

# Find the executable
if (Test-Path $computeDir) {
    $exePath = Get-ChildItem -Path $computeDir -Filter "*.exe" -Recurse |
               Where-Object { $_.Name -like "*RhinoCompute*" } |
               Select-Object -First 1 -ExpandProperty FullName

    if ($exePath) {
        Write-Host "  Found RhinoCompute.exe at: $exePath"

        # Create new service
        Write-Host "  Creating new service..."
        New-Service -Name $serviceName -BinaryPathName "$exePath --port=8081" -DisplayName "Rhino Compute" -Description "Rhino Compute headless service" -StartupType Automatic -ErrorAction Stop

        # Start the service
        Write-Host "  Starting service..."
        Start-Service -Name $serviceName -ErrorAction Stop

        # Verify service
        $service = Get-Service -Name $serviceName
        Write-Host "  Service status: $($service.Status)"

        if ($service.Status -eq "Running") {
            Write-Host "  Rhino.Compute service configured and running"
        } else {
            Write-Host "  Service not running. Checking status..."
            Start-Sleep -Seconds 5
            $service = Get-Service -Name $serviceName
            Write-Host "  Final status: $($service.Status)"
        }
    } else {
        Write-Host "  ERROR: RhinoCompute.exe not found in $computeDir"
        Write-Host "  Contents of ${computeDir}:"
        Get-ChildItem $computeDir | Format-Table Name, Length -AutoSize
        exit 1
    }
} else {
    Write-Host "  ERROR: RhinoCompute directory not found at $computeDir"
    Write-Host "  Available directories in C:"
    Get-ChildItem "C:\" -Directory | Format-Table Name -AutoSize
    exit 1
}

# =============================================================================
# 4. CONFIGURE FIREWALL
# =============================================================================
Write-Host "Configuring Windows Firewall..."

# Remove existing rule if it exists
Remove-NetFirewallRule -Name "RhinoCompute-HTTP" -ErrorAction SilentlyContinue

# Create new rule
New-NetFirewallRule -Name "RhinoCompute-HTTP" -DisplayName "Rhino Compute HTTP" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound -ErrorAction Stop

Write-Host "  Firewall rule configured for port 8081"

# =============================================================================
# 5. TEST LOCAL RHINO COMPUTE
# =============================================================================
Write-Host "Testing local Rhino.Compute..."

Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "  Local test successful"
        Write-Host "  Response: $($response.Content)"
    } else {
        Write-Host "  Unexpected status code: $($response.StatusCode)"
    }
} catch {
    Write-Host "  Local test failed: $($_.Exception.Message)"
}

# =============================================================================
# 6. CONFIGURE IIS SITE AND REVERSE PROXY
# =============================================================================
Write-Host "Configuring IIS site and reverse proxy..."

Import-Module WebAdministration

# Create site directory
$sitePath = "C:\inetpub\wwwroot\compute"
if (!(Test-Path $sitePath)) {
    New-Item -ItemType Directory -Path $sitePath | Out-Null
}

# Remove existing site if it exists
Remove-Website -Name "ComputeSite" -ErrorAction SilentlyContinue

# Create new IIS site
Write-Host "  Creating IIS site..."
New-Website -Name "ComputeSite" -PhysicalPath $sitePath -Port 80 -HostHeader "compute.softlyplease.com" -ApplicationPool "DefaultAppPool" -ErrorAction Stop

# Configure Application Request Routing
Write-Host "  Configuring Application Request Routing..."

# Enable proxy in ARR
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" -value "true"

# Create server farm
Add-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/webFarms" -name "." -value @{name='RhinoFarm'}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/webFarms/webFarm[@name='RhinoFarm']/server" -name "." -value @{address='localhost'; port='8081'}

# Create URL Rewrite rule
Write-Host "  Creating URL Rewrite rule..."
Add-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules" -name "." -value @{name='ReverseProxy'}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules/rule[@name='ReverseProxy']/match" -name "url" -value ".*"
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules/rule[@name='ReverseProxy']/action" -name "." -value @{type='Rewrite'; url='http://localhost:8081/{R:1}'}

Write-Host "  IIS site and reverse proxy configured"

# =============================================================================
# 7. ADD HTTPS BINDING PLACEHOLDER
# =============================================================================
Write-Host "Adding HTTPS binding placeholder..."

# Add HTTPS binding (certificate will be installed separately)
try {
    New-WebBinding -Name "ComputeSite" -Protocol "https" -Port 443 -HostHeader "compute.softlyplease.com" -ErrorAction SilentlyContinue
    Write-Host "  HTTPS binding added (certificate needs to be installed)"
} catch {
    Write-Host "  HTTPS binding may already exist or certificate is required"
}

# =============================================================================
# 8. TEST IIS REVERSE PROXY
# =============================================================================
Write-Host "Testing IIS reverse proxy..."

Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://localhost/version" -Headers @{"Host"="compute.softlyplease.com"} -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "  IIS reverse proxy test successful"
        Write-Host "  Response: $($response.Content)"
    } else {
        Write-Host "  Unexpected status code: $($response.StatusCode)"
    }
} catch {
    Write-Host "  IIS test failed: $($_.Exception.Message)"
}

# =============================================================================
# 9. CLEAN UP
# =============================================================================
Write-Host "Cleaning up temporary files..."
Clean-TempFiles -path $localArrPath
Clean-TempFiles -path $localRewritePath
Clean-TempFiles -path $tempDir
Write-Host "  Cleanup complete"

# =============================================================================
# 10. FINAL STATUS
# =============================================================================
Write-Host "SETUP COMPLETE - Final Status:"
Write-Host "  • IIS Site: ComputeSite (compute.softlyplease.com)"
Write-Host "  • Reverse Proxy: localhost:80 → localhost:8081"
Write-Host "  • Rhino.Compute Service: $serviceName"
Write-Host "  • Firewall: Port 8081 open"

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "  Service Status: Running"
} else {
    Write-Host "  Service Status: Not running or not found"
}

$endTime = Get-Date
$duration = $endTime - $startTime
Write-Host "  Setup completed in: $($duration.TotalMinutes.ToString("F1")) minutes"

Write-Host "Setup complete! Next steps:"
Write-Host "  1. Install SSL certificate for compute.softlyplease.com"
Write-Host "  2. Configure Cloud Zoo licensing in Rhino"
Write-Host "  3. Test from external: curl https://compute.softlyplease.com/version"
```

### 1.3 Configure Authentication

**On the Azure VM, run these commands:**

```powershell
# Configure authentication in Rhino.Compute appsettings.json
$settingsPath = "C:\inetpub\wwwroot\aspnet_client\system_web\4_0_30319\rhino.compute\appsettings.json"

# Read current settings
Get-Content $settingsPath

# Configure authentication
$settings = @"
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "RhinoCompute": {
    "ApiKey": "[Your Rhino Compute API Key]",
    "AllowAnonymous": false
  }
}
"@

# Backup and update
Copy-Item $settingsPath "$settingsPath.backup"
$settings | Out-File -FilePath $settingsPath -Encoding UTF8

Write-Host "Authentication configured. Restart Rhino.Compute service:"
Restart-Service -Name "RhinoCompute" -Force
```

---

## 🚀 PHASE 2: HEROKU DEPLOYMENT

### 2.1 Deploy the Application

**On your local machine or the developer's machine:**

```bash
# Clone the repository
git clone https://github.com/boi1da-proj/SoftlyPlease-Compute.git
cd SoftlyPlease-Compute

# Create Heroku app
heroku create softlyplease-appserver --region us
heroku stack:set heroku-22 -a softlyplease-appserver
heroku buildpacks:set heroku/nodejs -a softlyplease-appserver

# Deploy
git push heroku main
```

### 2.2 Configure Environment Variables

```bash
# Set production configuration
heroku config:set NODE_ENV=production --app softlyplease-appserver
heroku config:set COMPUTE_URL=https://compute.softlyplease.com --app softlyplease-appserver
heroku config:set APP_TOKEN=[Your Application Token] --app softlyplease-appserver
heroku config:set RHINO_COMPUTE_KEY=[Your Rhino Compute API Key] --app softlyplease-appserver
heroku config:set CORS_ORIGIN=https://www.softlyplease.com --app softlyplease-appserver

# Performance settings
heroku config:set WEB_CONCURRENCY=2 --app softlyplease-appserver
heroku config:set MAX_CONCURRENT_COMPUTATIONS=5 --app softlyplease-appserver
heroku config:set CACHE_DEFAULT_TTL=3600 --app softlyplease-appserver
```

### 2.3 Configure Custom Domain

```bash
# Add custom domains
heroku domains:add softlyplease.com --app softlyplease-appserver
heroku domains:add www.softlyplease.com --app softlyplease-appserver

# Enable SSL
heroku certs:auto:enable --app softlyplease-appserver

# Check DNS targets
heroku domains --app softlyplease-appserver
```

---

## 🧪 PHASE 3: TESTING

### 3.1 Test VM Components

**On Azure VM:**

```powershell
# Test Rhino.Compute directly
Invoke-WebRequest -Uri "http://localhost:8081/version" -Headers @{"X-API-Key"="[Your Rhino Compute API Key]"}

# Test IIS reverse proxy
Invoke-WebRequest -Uri "http://localhost/version" -Headers @{"Host"="compute.softlyplease.com"; "X-API-Key"="[Your Rhino Compute API Key]"}
```

### 3.2 Test External Access

**From your local machine:**

```bash
# Test direct IP access
curl -H "X-API-Key: [Your Rhino Compute API Key]" http://4.206.137.232:8081/version

# Test domain access
curl -H "X-API-Key: [Your Rhino Compute API Key]" http://compute.softlyplease.com/version

# Test HTTPS (after SSL setup)
curl -H "X-API-Key: [Your Rhino Compute API Key]" https://compute.softlyplease.com/version
```

### 3.3 Test Heroku App Server

```bash
# Test definitions list
curl -H "Authorization: Bearer [Your Application Token]" https://softlyplease.com/

# Test specific definition
curl -H "Authorization: Bearer [Your Application Token]" https://softlyplease.com/definitions/f3997a3b7a68e0f2

# Test Grasshopper solving
curl -H "Authorization: Bearer [Your Application Token]" -X POST https://softlyplease.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "f3997a3b7a68e0f2",
    "inputs": {
      "height": 500,
      "width": 1000,
      "num": 3
    }
  }'
```

---

## 🔧 PHASE 4: SSL CERTIFICATE SETUP

### 4.1 Install Let's Encrypt Certificate

**On Azure VM:**

```powershell
# Install win-acme (Let's Encrypt client)
# Download from: https://www.win-acme.com/

# Run win-acme to get certificate
wacs.exe --target iis --siteid 1 --email [Your Email] --accepttos

# This will:
# 1. Generate certificate for compute.softlyplease.com
# 2. Install it in IIS
# 3. Set up auto-renewal
```

### 4.2 Manual Certificate Installation

If win-acme doesn't work:

1. **Get certificate** from Let's Encrypt or other provider
2. **Import PFX** into Windows Certificate Store
3. **Bind certificate** in IIS Manager:
   - Open IIS Manager
   - Select ComputeSite
   - Edit Bindings
   - Add HTTPS binding with certificate

---

## 🔍 PHASE 5: TROUBLESHOOTING

### 5.1 Rhino.Compute Service Issues

```powershell
# Check service status
Get-Service -Name "RhinoCompute"

# Check if port 8081 is listening
netstat -ano | findstr :8081

# Check service logs
Get-EventLog -LogName "Application" -Source "*Rhino*" -Newest 10

# Restart service
Restart-Service -Name "RhinoCompute" -Force

# Test direct connection
Invoke-WebRequest -Uri "http://localhost:8081/version"
```

### 5.2 IIS Reverse Proxy Issues

```powershell
# Check IIS site
Get-Website -Name "ComputeSite"

# Check URL Rewrite rules
Get-WebConfigurationProperty -pspath "MACHINE/WEBROOT/APPHOST/ComputeSite" -filter "system.webServer/rewrite/rules" -name "."

# Test IIS locally
Invoke-WebRequest -Uri "http://localhost/version" -Headers @{"Host"="compute.softlyplease.com"}
```

### 5.3 Authentication Issues

```powershell
# Check appsettings.json
Get-Content "C:\inetpub\wwwroot\aspnet_client\system_web\4_0_30319\rhino.compute\appsettings.json"

# Test with different auth headers
Invoke-WebRequest -Uri "http://localhost:8081/version" -Headers @{"Authorization"="Bearer [Your API Key]"}
```

### 5.4 Heroku Issues

```bash
# Check Heroku logs
heroku logs --tail --app softlyplease-appserver

# Check configuration
heroku config --app softlyplease-appserver

# Restart app
heroku ps:restart --app softlyplease-appserver
```

---

## 🎯 SUCCESS CRITERIA

### ✅ All Tests Pass:
1. **Rhino.Compute responds**: `http://localhost:8081/version` → 200 OK
2. **IIS proxy works**: `http://localhost/version` → 200 OK
3. **External access works**: `http://compute.softlyplease.com/version` → 200 OK
4. **Heroku API works**: `https://softlyplease.com/` → definitions list
5. **Grasshopper solving works**: POST to `/solve` → geometry results

### 🏆 Final Architecture:
```
Browser → Heroku App Server → IIS/ARR → Rhino.Compute Process
   ↓           ↓              ↓              ↓
   ✅          ✅              ✅              ✅
```

---

## 📞 SUPPORT & NEXT STEPS

### If You Get Stuck:

1. **Check the logs** - All services provide detailed logging
2. **Test incrementally** - Verify each component separately
3. **DNS propagation** - May take 5-30 minutes
4. **SSL certificates** - Test HTTP first, then add HTTPS

### Final Deliverables:
- **Working endpoint**: `https://softlyplease.com/solve`
- **Remote Grasshopper computation** via API
- **Secure authentication** between all components
- **Production-ready** infrastructure

**The repository has all the documentation and troubleshooting guides you need. Success means your users can remotely solve Grasshopper definitions through a simple API call!** 🚀

---

**This guide contains everything needed to complete the SoftlyPlease.com remote Grasshopper computation deployment. Follow it step-by-step and you'll have a fully functional system.**
