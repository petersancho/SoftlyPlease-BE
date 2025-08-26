# Install SoftlyPlease Rhino Compute AppServer as Windows Service
# Requires administrator privileges

param(
    [string]$ServiceName = "SoftlyPleaseAppServer",
    [string]$Port = "80"
)

Write-Host "Installing SoftlyPlease AppServer as Windows Service..." -ForegroundColor Green

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $principal.IsInRole($adminRole)) {
    Write-Error "This script must be run as Administrator. Please restart PowerShell as Administrator."
    exit 1
}

# Get current directory
$scriptDir = Split-Path -Parent $PSCommandPath
$appDir = Split-Path -Parent $scriptDir
$nssmPath = "$env:TEMP\nssm.exe"

# Download NSSM if not exists
if (-not (Test-Path $nssmPath)) {
    Write-Host "Downloading NSSM..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24-101-g897c7ad.zip" -OutFile "$env:TEMP\nssm.zip"
        Expand-Archive -Path "$env:TEMP\nssm.zip" -DestinationPath $env:TEMP -Force
        Copy-Item "$env:TEMP\nssm-2.24-101-g897c7ad\win64\nssm.exe" $nssmPath -Force
        Remove-Item "$env:TEMP\nssm.zip" -Force
        Remove-Item "$env:TEMP\nssm-2.24-101-g897c7ad" -Recurse -Force
    } catch {
        Write-Error "Failed to download NSSM: $_"
        exit 1
    }
}

# Install Node.js dependencies if needed
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location $appDir
npm install

# Remove existing service if it exists
Write-Host "Removing existing service (if any)..." -ForegroundColor Yellow
& $nssmPath stop $ServiceName 2>$null
& $nssmPath remove $ServiceName confirm 2>$null

# Install the service
Write-Host "Installing service '$ServiceName'..." -ForegroundColor Yellow
& $nssmPath install $ServiceName "$env:ProgramFiles\nodejs\node.exe" "$appDir\src\bin\www"

# Configure service parameters
Write-Host "Configuring service parameters..." -ForegroundColor Yellow
& $nssmPath set $ServiceName AppDirectory $appDir
& $nssmPath set $ServiceName AppParameters "src\bin\www"
& $nssmPath set $ServiceName AppEnvironmentExtra "NODE_ENV=production`nPORT=$Port`nRHINO_COMPUTE_URL=http://localhost:6500/"

# Set service properties
& $nssmPath set $ServiceName DisplayName "SoftlyPlease Rhino Compute AppServer"
& $nssmPath set $ServiceName Description "Node.js server for Rhino Compute Grasshopper examples"
& $nssmPath set $ServiceName Start SERVICE_AUTO_START
& $nssmPath set $ServiceName Type SERVICE_WIN32_OWN_PROCESS

# Set restart options
& $nssmPath set $ServiceName AppExit Default Restart
& $nssmPath set $ServiceName AppRestartDelay 5000

# Configure logging
& $nssmPath set $ServiceName AppStdout "$appDir\logs\service-out.log"
& $nssmPath set $ServiceName AppStderr "$appDir\logs\service-error.log"

# Create logs directory
if (-not (Test-Path "$appDir\logs")) {
    New-Item -ItemType Directory -Path "$appDir\logs" -Force
}

# Start the service
Write-Host "Starting service..." -ForegroundColor Yellow
& $nssmPath start $ServiceName

# Check if service is running
Start-Sleep -Seconds 5
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host "✅ Service '$ServiceName' installed and started successfully!" -ForegroundColor Green
    Write-Host "🌐 Your app should now be accessible at: http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "🌐 External access: http://your-domain.com (configure DNS/reverse proxy)" -ForegroundColor Cyan
} else {
    Write-Error "❌ Failed to start service '$ServiceName'"
    Write-Host "Check the logs in $appDir\logs\" -ForegroundColor Yellow
}

Write-Host "`nService Management:" -ForegroundColor Cyan
Write-Host "  Start:  nssm start $ServiceName" -ForegroundColor White
Write-Host "  Stop:   nssm stop $ServiceName" -ForegroundColor White
Write-Host "  Status: nssm status $ServiceName" -ForegroundColor White
Write-Host "  Remove: nssm remove $ServiceName" -ForegroundColor White
