# Start Rhino Compute AppServer for softlyplease.com
Write-Host "Starting Rhino Compute AppServer for softlyplease.com..." -ForegroundColor Green
Write-Host ""

# Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:RHINO_COMPUTE_URL = "http://localhost:6001/"
$env:RHINO_COMPUTE_KEY = "p2robot-13a6-48f3-b24e-2025computeX"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "NODE_ENV: $env:NODE_ENV"
Write-Host "PORT: $env:PORT"
Write-Host "RHINO_COMPUTE_URL: $env:RHINO_COMPUTE_URL"
Write-Host "RHINO_COMPUTE_KEY: $env:RHINO_COMPUTE_KEY"
Write-Host ""

# Change to the appserver directory
Write-Host "Changing to compute.rhino3d.appserver directory..." -ForegroundColor Yellow
Set-Location "C:\compute-sp\compute.rhino3d.appserver"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Magenta
Write-Host ""

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
npm start

Read-Host "Press Enter to exit"