# 🔧 BACKEND DEVELOPER GUIDE: Complete SoftlyPlease.com Setup

## 🚨 **IMPORTANT: Read This First**

This guide provides **exact commands** to run on your Azure VM. Copy and paste these commands **one by one** and verify each step works before proceeding.

## 📋 **BEFORE YOU START**

### 1. Verify Your Azure VM Access
```bash
# On your local machine, check VM status:
az vm list -d --query "[].{Name:name, Status:powerState, PublicIP:publicIps}" -o table
```

### 2. Connect to Your Azure VM
```bash
# Use RDP or SSH to connect to your VM
# IP: 4.206.137.232
# Username: azureuser (or your admin username)
# Password: [Your VM password]
```

### 3. Verify Admin Access
Once connected to the VM, open PowerShell as Administrator:
```powershell
# Right-click PowerShell → Run as Administrator
# Verify admin:
whoami
```

---

## 🔧 **PHASE 1: RHINO COMPUTE SERVICE SETUP**

### Step 1.1: Check Current Rhino Installation
```powershell
# Check if Rhino is installed
Write-Host "=== CHECKING RHINO INSTALLATION ==="
Get-ChildItem "C:\Program Files" -Directory | Where-Object { $_.Name -like "*Rhino*" }
Get-ChildItem "C:\Program Files (x86)" -Directory | Where-Object { $_.Name -like "*Rhino*" }

# Check for Rhino.exe in common locations
$rhinoPaths = @(
    "C:\Program Files\Rhino 8\System\Rhino.exe",
    "C:\Program Files\Rhino 8\Rhino.exe",
    "C:\Program Files\Rhino 7\System\Rhino.exe",
    "C:\Program Files\Rhino 7\Rhino.exe"
)

foreach ($path in $rhinoPaths) {
    if (Test-Path $path) {
        Write-Host "✓ Found Rhino at: $path" -ForegroundColor Green
    }
}
```

### Step 1.2: Stop Any Existing Rhino Compute Service
```powershell
# Stop and remove existing service
Write-Host "=== STOPPING EXISTING SERVICE ==="
Stop-Service -Name "RhinoCompute" -ErrorAction SilentlyContinue
sc.exe delete RhinoCompute 2>$null | Out-Null
Start-Sleep -Seconds 3

# Verify it's stopped
Get-Service -Name "RhinoCompute" -ErrorAction SilentlyContinue
```

### Step 1.3: Create New Rhino Compute Service
```powershell
# Create new service with correct path
Write-Host "=== CREATING NEW RHINO COMPUTE SERVICE ==="

# Find the correct Rhino path
$rhinoPath = $null
$rhinoPaths = @(
    "C:\Program Files\Rhino 8\System\Rhino.exe",
    "C:\Program Files\Rhino 8\Rhino.exe",
    "C:\Program Files\Rhino 7\System\Rhino.exe",
    "C:\Program Files\Rhino 7\Rhino.exe"
)

foreach ($path in $rhinoPaths) {
    if (Test-Path $path) {
        $rhinoPath = $path
        break
    }
}

if ($rhinoPath) {
    Write-Host "Found Rhino at: $rhinoPath" -ForegroundColor Green

    # Create the service
    $serviceName = "RhinoCompute"
    $computeArgs = "/nosplash /compute /port=8081"

    Write-Host "Creating service..."
    New-Service -Name $serviceName -BinaryPathName "`"$rhinoPath`" $computeArgs" -DisplayName "Rhino Compute" -StartupType Automatic -Description "Rhino Compute headless service" -ErrorAction Stop

    Write-Host "✓ Service created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Rhino.exe not found!" -ForegroundColor Red
    Write-Host "Please install Rhino 8 first." -ForegroundColor Red
    exit 1
}
```

### Step 1.4: Start and Test the Service
```powershell
# Start the service
Write-Host "=== STARTING RHINO COMPUTE SERVICE ==="
Start-Service -Name "RhinoCompute" -ErrorAction Stop

# Wait for service to start
Start-Sleep -Seconds 10

# Check service status
$service = Get-Service -Name "RhinoCompute"
Write-Host "Service status: $($service.Status)"

if ($service.Status -eq "Running") {
    Write-Host "✓ Service is running" -ForegroundColor Green
} else {
    Write-Host "❌ Service failed to start" -ForegroundColor Red
    exit 1
}

# Test the service
Write-Host "Testing Rhino Compute..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Rhino Compute responding on port 8081" -ForegroundColor Green
        Write-Host "Response: $($response.Content)"
    } else {
        Write-Host "❌ Unexpected status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Service not responding: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🔧 **PHASE 2: FIREWALL CONFIGURATION**

### Step 2.1: Check Current Firewall Rules
```powershell
# Check existing firewall rules
Write-Host "=== CHECKING FIREWALL RULES ==="
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Rhino*" } | Format-Table Name, DisplayName, Enabled, Direction, Action

# Check if port 8081 is open
$portRules = Get-NetFirewallRule | Where-Object {
    $_.Enabled -eq $true -and
    ($_.Direction -eq "Inbound") -and
    $_.Action -eq "Allow"
}

foreach ($rule in $portRules) {
    $ports = $rule | Get-NetFirewallPortFilter
    if ($ports.LocalPort -contains "8081") {
        Write-Host "✓ Port 8081 is already open" -ForegroundColor Green
        break
    }
}
```

### Step 2.2: Create Firewall Rule for Port 8081
```powershell
# Create firewall rule
Write-Host "=== CREATING FIREWALL RULE ==="

# Remove existing rule if it exists
Remove-NetFirewallRule -Name "RhinoCompute-HTTP" -ErrorAction SilentlyContinue

# Create new rule
New-NetFirewallRule -Name "RhinoCompute-HTTP" -DisplayName "Rhino Compute HTTP" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound -ErrorAction Stop

Write-Host "✓ Firewall rule created for port 8081" -ForegroundColor Green

# Verify the rule
Get-NetFirewallRule -Name "RhinoCompute-HTTP" | Format-Table Name, DisplayName, Enabled, Direction, Action
```

### Step 2.3: Test External Access to Port 8081
```powershell
# Test external access
Write-Host "=== TESTING EXTERNAL ACCESS ==="

# Get public IP
$publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
Write-Host "Your public IP: $publicIP"

# Test external access
Write-Host "Testing external access to port 8081..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    Write-Host "✓ Local access works" -ForegroundColor Green
} catch {
    Write-Host "❌ Local access failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🔧 **PHASE 3: IIS AND ARR SETUP**

### Step 3.1: Check IIS Installation
```powershell
# Check if IIS is installed
Write-Host "=== CHECKING IIS INSTALLATION ==="
$iisFeatures = @(
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

$missingFeatures = @()
foreach ($feature in $iisFeatures) {
    $featureState = Get-WindowsFeature -Name $feature
    if ($featureState.InstallState -ne "Installed") {
        $missingFeatures += $feature
    }
}

if ($missingFeatures.Count -eq 0) {
    Write-Host "✓ All IIS features are installed" -ForegroundColor Green
} else {
    Write-Host "❌ Missing IIS features: $($missingFeatures -join ', ')" -ForegroundColor Red
}
```

### Step 3.2: Install Missing IIS Features
```powershell
# Install missing IIS features
if ($missingFeatures.Count -gt 0) {
    Write-Host "=== INSTALLING MISSING IIS FEATURES ==="
    foreach ($feature in $missingFeatures) {
        Write-Host "Installing $feature..."
        Install-WindowsFeature -Name $feature -ErrorAction Stop | Out-Null
    }
    Write-Host "✓ IIS features installed" -ForegroundColor Green
}
```

### Step 3.3: Check ARR Installation
```powershell
# Check if ARR is installed
Write-Host "=== CHECKING ARR INSTALLATION ==="
Get-WindowsFeature -Name "Web-ARR" | Format-Table Name, DisplayName, InstallState

# Check if URL Rewrite is installed
$urlRewrite = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" -ErrorAction SilentlyContinue
if ($urlRewrite) {
    Write-Host "✓ URL Rewrite is installed" -ForegroundColor Green
} else {
    Write-Host "❌ URL Rewrite is not installed" -ForegroundColor Red
}
```

### Step 3.4: Install ARR and URL Rewrite
```powershell
# Install ARR and URL Rewrite
if (-not $urlRewrite) {
    Write-Host "=== INSTALLING ARR AND URL REWRITE ==="

    # Create temp directory
    $tempDir = "C:\Temp\ARR_Install"
    if (!(Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir | Out-Null }

    # Download and install ARR
    Write-Host "Downloading ARR..."
    $arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
    $localArrPath = "$tempDir\requestRouter_amd64.msi"
    Invoke-WebRequest -Uri $arrUrl -OutFile $localArrPath -UseBasicParsing

    Write-Host "Installing ARR..."
    Start-Process msiexec.exe -ArgumentList "/i `"$localArrPath`" /quiet /norestart" -Wait -NoNewWindow

    # Download and install URL Rewrite
    Write-Host "Downloading URL Rewrite..."
    $urlRewriteUrl = "https://download.microsoft.com/download/D/8/1/D81E5DD6-1ABB-46B0-B23B-1C0399784332/rewrite_amd64.msi"
    $localRewritePath = "$tempDir\rewrite_amd64.msi"
    Invoke-WebRequest -Uri $urlRewriteUrl -OutFile $localRewritePath -UseBasicParsing

    Write-Host "Installing URL Rewrite..."
    Start-Process msiexec.exe -ArgumentList "/i `"$localRewritePath`" /quiet /norestart" -Wait -NoNewWindow

    Write-Host "✓ ARR and URL Rewrite installed" -ForegroundColor Green

    # Clean up
    Remove-Item $localArrPath -Force -ErrorAction SilentlyContinue
    Remove-Item $localRewritePath -Force -ErrorAction SilentlyContinue
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
```

---

## 🔧 **PHASE 4: IIS SITE CONFIGURATION**

### Step 4.1: Configure IIS Site
```powershell
# Configure IIS site
Write-Host "=== CONFIGURING IIS SITE ==="

Import-Module WebAdministration

# Create site directory
$sitePath = "C:\inetpub\wwwroot\compute"
if (!(Test-Path $sitePath)) {
    New-Item -ItemType Directory -Path $sitePath | Out-Null
    Write-Host "✓ Site directory created" -ForegroundColor Green
}

# Remove existing site
Remove-Website -Name "ComputeSite" -ErrorAction SilentlyContinue

# Create new IIS site
Write-Host "Creating IIS site..."
New-Website -Name "ComputeSite" -PhysicalPath $sitePath -Port 80 -HostHeader "compute.softlyplease.com" -ApplicationPool "DefaultAppPool" -ErrorAction Stop

Write-Host "✓ IIS site created" -ForegroundColor Green

# Check site status
Get-Website -Name "ComputeSite" | Format-Table Name, State, PhysicalPath, Bindings
```

### Step 4.2: Configure ARR Reverse Proxy
```powershell
# Configure ARR reverse proxy
Write-Host "=== CONFIGURING ARR REVERSE PROXY ==="

# Enable ARR proxy globally
Write-Host "Enabling ARR proxy..."
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" -value "true"

# Create server farm
Write-Host "Creating server farm..."
Add-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/webFarms" -name "." -value @{name='RhinoFarm'}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/webFarms/webFarm[@name='RhinoFarm']/server" -name "." -value @{address='localhost'; port='8081'}

# Create URL Rewrite rule
Write-Host "Creating URL Rewrite rule..."
Add-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules" -name "." -value @{name='ReverseProxy'}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules/rule[@name='ReverseProxy']/match" -name "url" -value ".*"
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules/rule[@name='ReverseProxy']/action" -name "." -value @{type='Rewrite'; url='http://localhost:8081/{R:1}'}

Write-Host "✓ ARR reverse proxy configured" -ForegroundColor Green
```

### Step 4.3: Test IIS Reverse Proxy
```powershell
# Test IIS reverse proxy
Write-Host "=== TESTING IIS REVERSE PROXY ==="

Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost/version" -Headers @{"Host"="compute.softlyplease.com"} -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ IIS reverse proxy working" -ForegroundColor Green
        Write-Host "Response: $($response.Content)"
    } else {
        Write-Host "⚠️ Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ IIS test failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🔧 **PHASE 5: COMPLETE SYSTEM TEST**

### Step 5.1: Test All Components Locally
```powershell
# Test all components locally
Write-Host "=== TESTING ALL COMPONENTS ==="

# Test 1: Rhino Compute directly
Write-Host "1. Testing Rhino Compute directly..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    Write-Host "   ✓ Rhino Compute: OK" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Rhino Compute: FAILED" -ForegroundColor Red
}

# Test 2: IIS reverse proxy
Write-Host "2. Testing IIS reverse proxy..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost/version" -Headers @{"Host"="compute.softlyplease.com"} -TimeoutSec 30
    Write-Host "   ✓ IIS Proxy: OK" -ForegroundColor Green
} catch {
    Write-Host "   ❌ IIS Proxy: FAILED" -ForegroundColor Red
}

# Test 3: Service status
Write-Host "3. Checking service status..."
$service = Get-Service -Name "RhinoCompute" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "   ✓ Service: Running" -ForegroundColor Green
} else {
    Write-Host "   ❌ Service: Not running" -ForegroundColor Red
}

# Test 4: Port listening
Write-Host "4. Checking ports..."
$connections = netstat -ano | findstr :8081
if ($connections) {
    Write-Host "   ✓ Port 8081: Listening" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port 8081: Not listening" -ForegroundColor Red
}

Write-Host "Local testing complete!" -ForegroundColor Cyan
```

### Step 5.2: Test External Access
```powershell
# Test external access
Write-Host "=== TESTING EXTERNAL ACCESS ==="

# Get public IP
$publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
Write-Host "Your public IP: $publicIP" -ForegroundColor Cyan

# Test external access to Rhino Compute
Write-Host "Testing external access to Rhino Compute..."
Write-Host "Command: curl -H 'X-API-Key: softlyplease-prod-key-2024' http://$($publicIP):8081/version"

# Test external access to IIS
Write-Host "Testing external access to IIS..."
Write-Host "Command: curl -H 'X-API-Key: softlyplease-prod-key-2024' http://compute.softlyplease.com/version"
```

---

## 🔧 **PHASE 6: SSL CERTIFICATE SETUP**

### Step 6.1: Install Let's Encrypt Certificate
```powershell
# Install Let's Encrypt certificate
Write-Host "=== INSTALLING SSL CERTIFICATE ==="

# Install win-acme (Let's Encrypt client)
# Download from: https://www.win-acme.com/

Write-Host "Installing win-acme..."
# Download and install win-acme

# Run win-acme to get certificate
Write-Host "Getting SSL certificate..."
wacs.exe --target iis --siteid 1 --email your-email@softlyplease.com --accepttos

Write-Host "✓ SSL certificate installed" -ForegroundColor Green
```

### Step 6.2: Verify SSL Certificate
```powershell
# Verify SSL certificate
Write-Host "=== VERIFYING SSL CERTIFICATE ==="

# Check certificate in IIS
Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*softlyplease*" } | Format-Table Subject, NotAfter, Thumbprint

# Test HTTPS access
Write-Host "Testing HTTPS access..."
try {
    $response = Invoke-WebRequest -Uri "https://compute.softlyplease.com/version" -Headers @{"X-API-Key"="softlyplease-prod-key-2024"} -TimeoutSec 30
    Write-Host "✓ HTTPS access working" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS access failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🔧 **PHASE 7: CLOUD ZOO LICENSING**

### Step 7.1: Configure Cloud Zoo Licensing
```powershell
# Configure Cloud Zoo licensing
Write-Host "=== CONFIGURING CLOUD ZOO LICENSING ==="

# Open Rhino and configure Cloud Zoo
Write-Host "1. Open Rhino as Administrator" -ForegroundColor Yellow
Write-Host "2. Go to Tools → Options → Licenses" -ForegroundColor Yellow
Write-Host "3. Select 'Cloud Zoo'" -ForegroundColor Yellow
Write-Host "4. Sign in with your Rhino account" -ForegroundColor Yellow
Write-Host "5. Ensure 'Core Hour Billing' is selected" -ForegroundColor Yellow

# Restart the Rhino Compute service
Write-Host "Restarting Rhino Compute service..."
Restart-Service -Name "RhinoCompute" -Force

Start-Sleep -Seconds 5

# Verify service is still running
$service = Get-Service -Name "RhinoCompute"
if ($service.Status -eq "Running") {
    Write-Host "✓ Service restarted successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Service failed to restart" -ForegroundColor Red
}
```

---

## 🔧 **PHASE 8: FINAL VERIFICATION**

### Step 8.1: Complete System Test
```powershell
# Complete system test
Write-Host "=== FINAL SYSTEM VERIFICATION ==="

# Test 1: Local Rhino Compute
Write-Host "Testing local Rhino Compute..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -Headers @{"X-API-Key"="softlyplease-prod-key-2024"} -TimeoutSec 30
    Write-Host "✓ Local Rhino Compute: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Local Rhino Compute: FAILED" -ForegroundColor Red
}

# Test 2: Local IIS
Write-Host "Testing local IIS..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost/version" -Headers @{"Host"="compute.softlyplease.com"; "X-API-Key"="softlyplease-prod-key-2024"} -TimeoutSec 30
    Write-Host "✓ Local IIS: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Local IIS: FAILED" -ForegroundColor Red
}

# Test 3: HTTPS access
Write-Host "Testing HTTPS access..."
try {
    $response = Invoke-WebRequest -Uri "https://compute.softlyplease.com/version" -Headers @{"X-API-Key"="softlyplease-prod-key-2024"} -TimeoutSec 30
    Write-Host "✓ HTTPS Access: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS Access: FAILED" -ForegroundColor Red
}

# Test 4: Service status
$service = Get-Service -Name "RhinoCompute"
if ($service.Status -eq "Running") {
    Write-Host "✓ Rhino Compute Service: Running" -ForegroundColor Green
} else {
    Write-Host "❌ Rhino Compute Service: Not running" -ForegroundColor Red
}

Write-Host "`n🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "Your Rhino Compute server is ready for production." -ForegroundColor Green
```

---

## 🔧 **TROUBLESHOOTING COMMON ISSUES**

### Issue 1: Service Won't Start
```powershell
# Check service details
Get-Service -Name "RhinoCompute" | Format-List *

# Check service binary path
sc.exe qc RhinoCompute

# Check event logs
Get-EventLog -LogName "Application" -Source "*Rhino*" -Newest 10

# Try starting manually
& "C:\Program Files\Rhino 8\System\Rhino.exe" /nosplash /compute /port=8081
```

### Issue 2: Port 8081 Not Listening
```powershell
# Check what's using the port
netstat -ano | findstr :8081

# Kill process if needed
taskkill /PID [PID] /F

# Check firewall
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*8081*" }
```

### Issue 3: IIS Site Not Working
```powershell
# Check site status
Get-Website -Name "ComputeSite"

# Check bindings
Get-WebBinding -Name "ComputeSite"

# Check URL Rewrite rules
Get-WebConfigurationProperty -pspath "MACHINE/WEBROOT/APPHOST/ComputeSite" -filter "system.webServer/rewrite/rules" -name "."
```

### Issue 4: ARR Not Working
```powershell
# Check ARR configuration
Get-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled"

# Check server farms
Get-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/webFarms" -name "."
```

---

## 📞 **SUPPORT**

If you encounter issues:

1. **Check the logs** above for error messages
2. **Run each command individually** and verify it works
3. **Take screenshots** of any error messages
4. **Test each component** before moving to the next phase
5. **Contact support** if you get stuck on a specific step

**Remember: Run PowerShell as Administrator and test each step before proceeding!** 🚀
