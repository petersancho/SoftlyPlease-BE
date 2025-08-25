# Rhino Compute Local Development Setup (Based on McNeel Workshop)
# This script sets up the complete local development environment

Write-Host "=== Rhino Compute Local Development Setup ===" -ForegroundColor Green

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$adminRole = [Security.Principal.WindowsBuiltInRole]::Administrator

if (-not $principal.IsInRole($adminRole)) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Set working directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Setting up local development environment..." -ForegroundColor Yellow

# 1. Download Rhino Compute compiled version
Write-Host "1. Downloading Rhino Compute..." -ForegroundColor Yellow
$computeUrl = "https://ci.appveyor.com/api/buildjobs/2kwp2b2g4g2v4r7f/artifacts/rhino-8.x-Compute.Geometry.zip"
$computeZip = "$scriptPath\compute.zip"

if (-not (Test-Path $computeZip)) {
    try {
        Invoke-WebRequest -Uri $computeUrl -OutFile $computeZip -ErrorAction Stop
        Write-Host "✓ Downloaded Rhino Compute" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Could not download pre-compiled version, will use source" -ForegroundColor Yellow
    }
}

# Extract if downloaded
if (Test-Path $computeZip) {
    Expand-Archive -Path $computeZip -DestinationPath "$scriptPath\compute-compiled" -Force
    Write-Host "✓ Extracted Rhino Compute" -ForegroundColor Green
}

# 2. Clone source code for debugging
Write-Host "2. Cloning Rhino Compute source code..." -ForegroundColor Yellow
if (-not (Test-Path "$scriptPath\compute-source")) {
    git clone https://github.com/mcneel/compute.rhino3d.git "$scriptPath\compute-source"
    Write-Host "✓ Cloned Rhino Compute source" -ForegroundColor Green
}

# 3. Set Environment Variables
Write-Host "3. Setting environment variables..." -ForegroundColor Yellow

# Rhino Compute settings
$env:RHINO_COMPUTE_URL = "http://localhost:8081"
$env:RHINO_COMPUTE_AUTH_TOKEN = "your-dev-token-here"
$env:RHINO_COMPUTE_API_KEY = "your-dev-api-key-here"

# Make permanent for current user
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_URL", $env:RHINO_COMPUTE_URL, "User")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_AUTH_TOKEN", $env:RHINO_COMPUTE_AUTH_TOKEN, "User")
[Environment]::SetEnvironmentVariable("RHINO_COMPUTE_API_KEY", $env:RHINO_COMPUTE_API_KEY, "User")

Write-Host "✓ Environment variables set" -ForegroundColor Green

# 4. Install .NET Framework 4.8 if needed
Write-Host "4. Checking .NET Framework..." -ForegroundColor Yellow
$net48 = Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP' -Recurse | Get-ItemProperty -Name Version -ErrorAction SilentlyContinue | Where-Object { $_.Version -like '4.8*' }

if (-not $net48) {
    Write-Host "Installing .NET Framework 4.8..." -ForegroundColor Yellow
    # Download and install .NET Framework 4.8
    $net48Url = "https://download.visualstudio.microsoft.com/download/pr/7afca223-55d2-470a-8edc-6a1739ae3252/abd7e2012afa5d2ce04d84bd74202c8d/ndp48-x86-x64-allos-enu.exe"
    $net48Installer = "$env:TEMP\ndp48-x86-x64-allos-enu.exe"

    Invoke-WebRequest -Uri $net48Url -OutFile $net48Installer
    Start-Process -FilePath $net48Installer -ArgumentList "/quiet", "/norestart" -Wait
    Write-Host "✓ .NET Framework 4.8 installed" -ForegroundColor Green
}

# 5. Create startup scripts
Write-Host "5. Creating startup scripts..." -ForegroundColor Yellow

# Rhino Compute startup script
$computeStartupScript = @"
# Start Rhino Compute (Compiled Version)
Write-Host "Starting Rhino Compute (Compiled)..." -ForegroundColor Green

if (Test-Path ".\compute-compiled\compute.geometry.exe") {
    .\compute-compiled\compute.geometry.exe
} else {
    Write-Host "ERROR: Compiled version not found. Please download manually." -ForegroundColor Red
    Write-Host "URL: $computeUrl" -ForegroundColor Yellow
}

# To debug with source code instead:
# cd compute-source
# Open compute.sln in Visual Studio
# Set breakpoints in resthopper-endpoints.cs
# Press F5 to debug
"@

$computeStartupScript | Out-File "$scriptPath\start-compute.ps1" -Encoding UTF8

# App Server startup script
$appServerStartupScript = @"
# Start App Server (from SoftlyPlease-Compute)
Write-Host "Starting App Server..." -ForegroundColor Green

# Navigate to main project
cd ..

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    npm install
}

# Set development environment variables
`$env:NODE_ENV = "development"
`$env:RHINO_COMPUTE_URL = "http://localhost:8081"
`$env:DEBUG = "softlyplease-compute:*"
`$env:PERFORMANCE_LOGGING = "true"

# Start development server
npm run start:dev
"@

$appServerStartupScript | Out-File "$scriptPath\start-app-server.ps1" -Encoding UTF8

Write-Host "✓ Startup scripts created" -ForegroundColor Green

# 6. Create development instructions
$readme = @"
# Rhino Compute Local Development Setup

## Quick Start

1. **Start Rhino Compute:**
   ```powershell
   .\start-compute.ps1
   ```

2. **Start App Server (in new terminal):**
   ```powershell
   .\start-app-server.ps1
   ```

3. **Test the setup:**
   - Health check: http://localhost:3000/health
   - List definitions: http://localhost:3000/
   - Get definition info: http://localhost:3000/YourDefinition.gh
   - Solve definition: POST to http://localhost:3000/solve

## Development Workflow

### Using Compiled Version (Recommended for testing)
- Use the pre-compiled executable for quick testing
- No need to build from source
- Faster startup time

### Using Source Code (For debugging)
1. Open `compute-source\compute.sln` in Visual Studio
2. Set breakpoint in `resthopper-endpoints.cs` line 62
3. Press F5 to start debugging
4. The source version will show detailed logs

## Environment Variables

- `RHINO_COMPUTE_URL`: http://localhost:8081
- `RHINO_COMPUTE_AUTH_TOKEN`: your-dev-token-here
- `RHINO_COMPUTE_API_KEY`: your-dev-api-key-here
- `NODE_ENV`: development
- `DEBUG`: softlyplease-compute:*
- `PERFORMANCE_LOGGING`: true

## Troubleshooting

### Rhino Compute Won't Start
1. Ensure you have Rhino 7 installed and licensed
2. Check that port 8081 is not in use
3. Verify environment variables are set
4. Check Windows Firewall settings

### App Server Won't Start
1. Ensure Node.js is installed (version 16+)
2. Check that port 3000 is not in use
3. Verify you're in the correct directory
4. Run `npm install` if dependencies are missing

### Connection Issues
1. Verify Rhino Compute is running on port 8081
2. Check that both are running on same machine (localhost)
3. Ensure no firewall blocking connections

## Adding New Definitions

1. Place your `.gh` files in the `assets/gh-definitions/` directory
2. Restart the App Server
3. Test with: `curl http://localhost:3000/YourDefinition.gh`

## Performance Monitoring

- Check logs with `heroku logs --tail` (when deployed)
- Monitor cache hit rates
- Use browser DevTools Network tab
- Check response headers for timing information

## Next Steps

Once local development is working:
1. Test with sample definitions
2. Add your own Grasshopper definitions
3. Deploy to Azure (see azure-deployment guide)
4. Set up production caching

For production deployment, see the Azure deployment guide.
"@

$readme | Out-File "$scriptPath\README-LOCAL-SETUP.md" -Encoding UTF8

Write-Host "✓ Development instructions created" -ForegroundColor Green

# 7. Test the setup
Write-Host "6. Testing local setup..." -ForegroundColor Yellow

# Check if Rhino 7 is installed
$rhinoPath = "${env:ProgramFiles}\Rhino 7\System\Rhino.exe"
if (Test-Path $rhinoPath) {
    Write-Host "✓ Rhino 7 is installed" -ForegroundColor Green
} else {
    Write-Host "WARNING: Rhino 7 not found. Please install Rhino 7." -ForegroundColor Yellow
    Write-Host "Download: https://www.rhino3d.com/download/rhino/7/wip/rc" -ForegroundColor Yellow
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Node.js not found. Please install Node.js 16+." -ForegroundColor Yellow
    Write-Host "Download: https://nodejs.org/" -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor White
Write-Host "=== Local Development Setup Complete! ===" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Rhino Compute: .\start-compute.ps1" -ForegroundColor White
Write-Host "2. Start App Server: .\start-app-server.ps1" -ForegroundColor White
Write-Host "3. Test: http://localhost:3000/health" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "See README-LOCAL-SETUP.md for detailed instructions." -ForegroundColor Cyan
