# IIS Configuration Script for SoftlyPlease
# This script sets up IIS with reverse proxy to Node.js and Rhino Compute

Write-Host "Setting up IIS for SoftlyPlease..." -ForegroundColor Green

# Import WebAdministration module
Import-Module WebAdministration

# Stop existing sites if they exist
try {
    Stop-IISSite "Default Web Site" -ErrorAction SilentlyContinue
    Stop-IISSite "Rhino.Compute" -ErrorAction SilentlyContinue
} catch {
    Write-Host "Some sites may not exist, continuing..." -ForegroundColor Yellow
}

# Create SoftlyPlease site
Write-Host "Creating SoftlyPlease site..." -ForegroundColor Yellow
if (!(Test-Path IIS:\Sites\SoftlyPlease)) {
    New-IISSite -Name "SoftlyPlease" -PhysicalPath "C:\inetpub\wwwroot\SoftlyPlease" -BindingInformation "*:80:"
}

# Add HTTPS binding (you'll need to configure SSL certificate later)
# New-IISSiteBinding -Name "SoftlyPlease" -Protocol "https" -Port 443 -SslFlags 1

# Create RhinoCompute application under SoftlyPlease site
Write-Host "Creating RhinoCompute application..." -ForegroundColor Yellow
if (!(Test-Path IIS:\Sites\SoftlyPlease\compute)) {
    New-WebApplication -Name "compute" -Site "SoftlyPlease" -PhysicalPath "C:\inetpub\wwwroot\RhinoCompute" -ApplicationPool "DefaultAppPool"
}

# Set application pool settings
Write-Host "Configuring application pools..." -ForegroundColor Yellow
Set-ItemProperty IIS:\AppPools\DefaultAppPool -Name processModel.idleTimeout -Value "00:00:00"
Set-ItemProperty IIS:\AppPools\DefaultAppPool -Name recycling.periodicRestart.time -Value "00:00:00"

# Start the sites
Write-Host "Starting IIS sites..." -ForegroundColor Yellow
Start-IISSite "SoftlyPlease"

# Enable Windows features for ARR and URL Rewrite if available
Write-Host "Checking for IIS extensions..." -ForegroundColor Yellow
$features = @(
    "IIS-ApplicationRequestRouting",
    "IIS-URLRewrite2"
)

foreach ($feature in $features) {
    $featureInfo = Get-WindowsOptionalFeature -Online | Where-Object { $_.FeatureName -eq $feature }
    if ($featureInfo -and $featureInfo.State -eq "Disabled") {
        Write-Host "Enabling $feature..." -ForegroundColor Yellow
        Enable-WindowsOptionalFeature -Online -FeatureName $feature -NoRestart
    }
}

Write-Host "IIS setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test locally: http://localhost/version (should proxy to Node app)" -ForegroundColor White
Write-Host "2. Test compute: http://localhost/compute/version (should proxy to Rhino Compute)" -ForegroundColor White
Write-Host "3. Configure SSL certificate for HTTPS" -ForegroundColor White
Write-Host "4. Update DNS to point to this server" -ForegroundColor White
