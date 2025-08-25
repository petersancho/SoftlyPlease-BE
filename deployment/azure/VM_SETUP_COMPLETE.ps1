# =============================================================================
# COMPLETE AZURE VM SETUP FOR SOFTLYPLEASE.COM RHINO COMPUTE + IIS/ARR
# Run this entire script as Administrator in PowerShell on your Azure VM
# =============================================================================

Write-Host "🚀 Starting Complete SoftlyPlease VM Setup..." -ForegroundColor Green
$startTime = Get-Date

# =============================================================================
# 1. CHECK ADMIN PRIVILEGES
# =============================================================================
Write-Host "Checking admin privileges..." -ForegroundColor Yellow
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Run as Administrator" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Admin privileges confirmed" -ForegroundColor Green

# =============================================================================
# 2. STOP AND DELETE EXISTING RHINO COMPUTE SERVICE
# =============================================================================
Write-Host "Stopping and deleting existing Rhino Compute service..." -ForegroundColor Yellow
Stop-Service -Name "RhinoCompute" -ErrorAction SilentlyContinue
sc.exe delete RhinoCompute 2>$null | Out-Null
Start-Sleep -Seconds 2
Write-Host "✓ Existing service removed" -ForegroundColor Green

# =============================================================================
# 3. FIND RHINO EXECUTABLE PATH
# =============================================================================
Write-Host "Finding Rhino executable..." -ForegroundColor Yellow
$rhinoPaths = @(
    "C:\Program Files\Rhino 8\System\Rhino.exe",
    "C:\Program Files\Rhino 8\Rhino.exe",
    "C:\Program Files\Rhino 7\System\Rhino.exe",
    "C:\Program Files\Rhino 7\Rhino.exe"
)

$rhinoPath = $null
foreach ($path in $rhinoPaths) {
    if (Test-Path $path) {
        $rhinoPath = $path
        break
    }
}

if (-not $rhinoPath) {
    Write-Host "ERROR: Rhino.exe not found. Please install Rhino 8 first." -ForegroundColor Red
    Write-Host "Looking for any Rhino installations..." -ForegroundColor Yellow
    Get-ChildItem "C:\Program Files" -Directory | Where-Object { $_.Name -like "*Rhino*" }
    exit 1
}

Write-Host "✓ Found Rhino at: $rhinoPath" -ForegroundColor Green

# =============================================================================
# 4. CREATE NEW RHINO COMPUTE SERVICE
# =============================================================================
Write-Host "Creating new Rhino Compute service..." -ForegroundColor Yellow

$serviceName = "RhinoCompute"
$computeArgs = "/nosplash /compute /port=8081"

# Create the service
New-Service -Name $serviceName -BinaryPathName "`"$rhinoPath`" $computeArgs" -DisplayName "Rhino Compute" -StartupType Automatic -Description "Rhino Compute headless service" -ErrorAction Stop

Write-Host "✓ Service created successfully" -ForegroundColor Green

# Start the service
Write-Host "Starting Rhino Compute service..." -ForegroundColor Yellow
Start-Service -Name $serviceName -ErrorAction Stop

# Wait and verify
Start-Sleep -Seconds 10
$service = Get-Service -Name $serviceName
Write-Host "Service status: $($service.Status)" -ForegroundColor Green

if ($service.Status -ne "Running") {
    Write-Host "ERROR: Service failed to start" -ForegroundColor Red
    exit 1
}

# =============================================================================
# 5. TEST RHINO COMPUTE SERVICE
# =============================================================================
Write-Host "Testing Rhino Compute service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/version" -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Rhino Compute service responding" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: Unexpected status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Rhino Compute not responding - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# =============================================================================
# 6. CONFIGURE WINDOWS FIREWALL
# =============================================================================
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow

# Remove existing rule if it exists
Remove-NetFirewallRule -Name "RhinoCompute-HTTP" -ErrorAction SilentlyContinue

# Create new rule
New-NetFirewallRule -Name "RhinoCompute-HTTP" -DisplayName "Rhino Compute HTTP" -Protocol TCP -LocalPort 8081 -Action Allow -Direction Inbound -ErrorAction Stop

Write-Host "✓ Firewall rule configured for port 8081" -ForegroundColor Green

# =============================================================================
# 7. INSTALL IIS WITH ALL FEATURES
# =============================================================================
Write-Host "Installing IIS with all required features..." -ForegroundColor Yellow

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
    Write-Host "  Installing $feature..." -ForegroundColor Gray
    Install-WindowsFeature -Name $feature -ErrorAction Stop | Out-Null
}

Write-Host "✓ IIS features installed" -ForegroundColor Green

# =============================================================================
# 8. DOWNLOAD AND INSTALL ARR + URL REWRITE
# =============================================================================
Write-Host "Downloading and installing ARR + URL Rewrite..." -ForegroundColor Yellow

# Create temp directory
$tempDir = "C:\Temp\SoftlyPleaseSetup"
if (!(Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir | Out-Null }

# Download ARR
Write-Host "  Downloading ARR..." -ForegroundColor Gray
$arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
$localArrPath = "$tempDir\requestRouter_amd64.msi"
Invoke-WebRequest -Uri $arrUrl -OutFile $localArrPath -UseBasicParsing

# Install ARR silently
Write-Host "  Installing ARR..." -ForegroundColor Gray
Start-Process msiexec.exe -ArgumentList "/i `"$localArrPath`" /quiet /norestart" -Wait -NoNewWindow

# Download URL Rewrite
Write-Host "  Downloading URL Rewrite..." -ForegroundColor Gray
$urlRewriteUrl = "https://download.microsoft.com/download/D/8/1/D81E5DD6-1ABB-46B0-B23B-1C0399784332/rewrite_amd64.msi"
$localRewritePath = "$tempDir\rewrite_amd64.msi"
Invoke-WebRequest -Uri $urlRewriteUrl -OutFile $localRewritePath -UseBasicParsing

# Install URL Rewrite silently
Write-Host "  Installing URL Rewrite..." -ForegroundColor Gray
Start-Process msiexec.exe -ArgumentList "/i `"$localRewritePath`" /quiet /norestart" -Wait -NoNewWindow

Write-Host "✓ ARR and URL Rewrite installed" -ForegroundColor Green

# =============================================================================
# 9. CONFIGURE IIS SITE AND REVERSE PROXY
# =============================================================================
Write-Host "Configuring IIS site and reverse proxy..." -ForegroundColor Yellow

Import-Module WebAdministration

# Create site directory
$sitePath = "C:\inetpub\wwwroot\compute"
if (!(Test-Path $sitePath)) {
    New-Item -ItemType Directory -Path $sitePath | Out-Null
}

# Remove existing site if it exists
Remove-Website -Name "ComputeSite" -ErrorAction SilentlyContinue

# Create new IIS site
Write-Host "  Creating IIS site..." -ForegroundColor Gray
New-Website -Name "ComputeSite" -PhysicalPath $sitePath -Port 80 -HostHeader "compute.softlyplease.com" -ApplicationPool "DefaultAppPool" -ErrorAction Stop

# Configure Application Request Routing
Write-Host "  Configuring Application Request Routing..." -ForegroundColor Gray

# Enable proxy in ARR
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" -value "true"

# Create server farm
Add-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/webFarms" -name "." -value @{name='RhinoFarm'}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/webFarms/webFarm[@name='RhinoFarm']/server" -name "." -value @{address='localhost'; port='8081'}

# Create URL Rewrite rule
Write-Host "  Creating URL Rewrite rule..." -ForegroundColor Gray
Add-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules" -name "." -value @{name='ReverseProxy'}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules/rule[@name='ReverseProxy']/match" -name "url" -value ".*"
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST/ComputeSite' -filter "system.webServer/rewrite/rules/rule[@name='ReverseProxy']/action" -name "." -value @{type='Rewrite'; url='http://localhost:8081/{R:1}'}

Write-Host "✓ IIS site and reverse proxy configured" -ForegroundColor Green

# =============================================================================
# 10. ADD HTTPS BINDING PLACEHOLDER
# =============================================================================
Write-Host "Adding HTTPS binding placeholder..." -ForegroundColor Yellow

# Add HTTPS binding (certificate will be installed separately)
try {
    New-WebBinding -Name "ComputeSite" -Protocol "https" -Port 443 -HostHeader "compute.softlyplease.com" -ErrorAction SilentlyContinue
    Write-Host "✓ HTTPS binding added (certificate needs to be installed)" -ForegroundColor Green
} catch {
    Write-Host "  HTTPS binding may already exist or certificate is required" -ForegroundColor Yellow
}

# =============================================================================
# 11. TEST IIS REVERSE PROXY
# =============================================================================
Write-Host "Testing IIS reverse proxy..." -ForegroundColor Yellow

Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://localhost/version" -Headers @{"Host"="compute.softlyplease.com"} -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ IIS reverse proxy test successful" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: Unexpected status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: IIS test failed - $($_.Exception.Message)" -ForegroundColor Red
}

# =============================================================================
# 12. TEST EXTERNAL ACCESS
# =============================================================================
Write-Host "Testing external access..." -ForegroundColor Yellow

# Get the public IP
$publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
Write-Host "Public IP: $publicIP" -ForegroundColor Gray

# Test external access
Write-Host "From external machine, test these URLs:" -ForegroundColor Cyan
Write-Host "curl -H 'X-API-Key: softlyplease-prod-key-2024' http://$publicIP:8081/version" -ForegroundColor White
Write-Host "curl -H 'X-API-Key: softlyplease-prod-key-2024' http://compute.softlyplease.com/version" -ForegroundColor White

# =============================================================================
# 13. CLEAN UP
# =============================================================================
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
if (Test-Path $localArrPath) { Remove-Item $localArrPath -Force }
if (Test-Path $localRewritePath) { Remove-Item $localRewritePath -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
Write-Host "✓ Cleanup complete" -ForegroundColor Green

# =============================================================================
# 14. FINAL STATUS
# =============================================================================
Write-Host "`n🎉 SETUP COMPLETE - Final Status:" -ForegroundColor Green
Write-Host "  • IIS Site: ComputeSite (compute.softlyplease.com)" -ForegroundColor White
Write-Host "  • Reverse Proxy: localhost:80 → localhost:8081" -ForegroundColor White
Write-Host "  • Rhino.Compute Service: $serviceName" -ForegroundColor White
Write-Host "  • Firewall: Port 8081 open" -ForegroundColor White

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "  • Service Status: Running" -ForegroundColor Green
} else {
    Write-Host "  • Service Status: Not running or not found" -ForegroundColor Red
}

$endTime = Get-Date
$duration = $endTime - $startTime
Write-Host "  • Setup completed in: $($duration.TotalMinutes.ToString("F1")) minutes" -ForegroundColor White

# =============================================================================
# 15. NEXT STEPS
# =============================================================================
Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Install SSL certificate for compute.softlyplease.com" -ForegroundColor White
Write-Host "2. Configure Cloud Zoo licensing in Rhino" -ForegroundColor White
Write-Host "3. Update DNS records for compute.softlyplease.com" -ForegroundColor White
Write-Host "4. Test from external: curl https://compute.softlyplease.com/version" -ForegroundColor White

Write-Host "`n🚀 Setup complete! Your Rhino Compute server is ready." -ForegroundColor Green
