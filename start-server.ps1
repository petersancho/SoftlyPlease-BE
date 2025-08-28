# Start Rhino Compute AppServer for softlyplease.com
Write-Host "Starting Rhino Compute AppServer for softlyplease.com..." -ForegroundColor Green
Write-Host ""

# Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:RHINO_COMPUTE_URL = "https://softlyplease.canadacentral.cloudapp.azure.com:8443/"
$env:RHINO_COMPUTE_KEY = "p2robot-13a6-48f3-b24e-2025computeX"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "NODE_ENV: $env:NODE_ENV"
Write-Host "PORT: $env:PORT"
Write-Host "RHINO_COMPUTE_URL: $env:RHINO_COMPUTE_URL"
Write-Host "RHINO_COMPUTE_KEY: $env:RHINO_COMPUTE_KEY"
Write-Host ""

# Change to the appserver directory
Set-Location "SoftlyPlease-BE-main\compute.rhino3d.appserver-main"

Write-Host "Starting server from: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm start

Read-Host "Press Enter to exit"
