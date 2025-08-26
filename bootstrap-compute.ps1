# McNeel Rhino Compute AppServer Bootstrap Script for Windows
# Following the official McNeel compute.rhino3d.appserver guide

Write-Host "=== McNeel Rhino Compute AppServer Bootstrap ===" -ForegroundColor Green

# Bootstrap 1: Set environment variables, token, API key
$env:RHINO_COMPUTE_URL = if ($env:RHINO_COMPUTE_URL) { $env:RHINO_COMPUTE_URL } else { "http://localhost:6500/" }
$env:RHINO_COMPUTE_APIKEY = if ($env:RHINO_COMPUTE_APIKEY) { $env:RHINO_COMPUTE_APIKEY } else { "" }
$env:PORT = if ($env:PORT) { $env:PORT } else { "3000" }
$env:NODE_ENV = if ($env:NODE_ENV) { $env:NODE_ENV } else { "production" }
$env:HOST = if ($env:HOST) { $env:HOST } else { "0.0.0.0" }

# Set Rhino Compute URL which tells Rhino Compute that it's going to be running on http and listening on all interfaces
$env:COMPUTE_URL = if ($env:COMPUTE_URL) { $env:COMPUTE_URL } else { "http://0.0.0.0:80" }
$env:APPSERVER_URL = if ($env:APPSERVER_URL) { $env:APPSERVER_URL } else { "http://localhost:3000" }

Write-Host "Environment Configuration:" -ForegroundColor Yellow
Write-Host "RHINO_COMPUTE_URL: $env:RHINO_COMPUTE_URL"
Write-Host "PORT: $env:PORT"
Write-Host "NODE_ENV: $env:NODE_ENV"
Write-Host "HOST: $env:HOST"
Write-Host "COMPUTE_URL: $env:COMPUTE_URL"
Write-Host "APPSERVER_URL: $env:APPSERVER_URL"

# Check API key
if ([string]::IsNullOrEmpty($env:RHINO_COMPUTE_APIKEY)) {
    Write-Host "WARNING: RHINO_COMPUTE_APIKEY is not set!" -ForegroundColor Red
    Write-Host "Please set your API key for authentication:" -ForegroundColor Yellow
    Write-Host '$env:RHINO_COMPUTE_APIKEY = "your-api-key-here"' -ForegroundColor Cyan
}

# Bootstrap 2: Test connectivity to Rhino Compute server
Write-Host "Testing connection to Rhino Compute server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$env:RHINO_COMPUTE_URL/version" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✓ Rhino Compute server is accessible at $env:RHINO_COMPUTE_URL" -ForegroundColor Green
} catch {
    Write-Host "✗ Cannot connect to Rhino Compute server at $env:RHINO_COMPUTE_URL" -ForegroundColor Red
    Write-Host "Please ensure Rhino Compute is running and accessible" -ForegroundColor Yellow
}

# Bootstrap 3: Start the AppServer
Write-Host "Starting McNeel Rhino Compute AppServer..." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

# Run the AppServer
npm run start:prod
