# Uninstall SoftlyPlease Rhino Compute AppServer Windows Service
# Requires administrator privileges

param(
    [string]$ServiceName = "SoftlyPleaseAppServer"
)

Write-Host "Uninstalling SoftlyPlease AppServer Windows Service..." -ForegroundColor Green

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $principal.IsInRole($adminRole)) {
    Write-Error "This script must be run as Administrator. Please restart PowerShell as Administrator."
    exit 1
}

# Get NSSM path
$nssmPath = "$env:TEMP\nssm.exe"

# Check if NSSM exists
if (-not (Test-Path $nssmPath)) {
    Write-Host "NSSM not found. Downloading..." -ForegroundColor Yellow
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

# Check if service exists
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "Service '$ServiceName' does not exist." -ForegroundColor Yellow
    exit 0
}

# Stop and remove the service
Write-Host "Stopping service '$ServiceName'..." -ForegroundColor Yellow
& $nssmPath stop $ServiceName 2>$null

Write-Host "Removing service '$ServiceName'..." -ForegroundColor Yellow
& $nssmPath remove $ServiceName confirm 2>$null

# Verify service is removed
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "✅ Service '$ServiceName' successfully uninstalled!" -ForegroundColor Green
} else {
    Write-Error "❌ Failed to remove service '$ServiceName'"
}

Write-Host "Service uninstallation complete." -ForegroundColor Cyan
