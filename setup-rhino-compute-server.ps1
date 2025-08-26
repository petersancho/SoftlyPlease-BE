# SETUP RHINO COMPUTE SERVER
# This script sets up the Rhino compute geometry server

Write-Host "🔧 SETTING UP RHINO COMPUTE SERVER" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Yellow

# Set the compute directory path
$computePath = "SoftlyPlease-BE-main/compute.rhino3d"
$fullComputePath = Join-Path $PSScriptRoot $computePath

Write-Host "Compute path: $fullComputePath" -ForegroundColor Cyan

if (-not (Test-Path $fullComputePath)) {
    Write-Host "❌ Compute directory not found: $fullComputePath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compute directory found" -ForegroundColor Green

# Navigate to compute directory
Set-Location $fullComputePath
Write-Host "Changed to directory: $(Get-Location)" -ForegroundColor Cyan

# Check if this is a .NET project
$csprojFiles = Get-ChildItem -Filter "*.csproj" -Recurse
if ($csprojFiles.Count -eq 0) {
    Write-Host "❌ No .NET project files found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ .NET projects found:" -ForegroundColor Green
$csprojFiles | ForEach-Object {
    Write-Host "   $($_.FullName)" -ForegroundColor Cyan
}

# Check for compute.geometry project
$computeGeometryProj = Get-ChildItem -Filter "compute.geometry.csproj" -Recurse
if (-not $computeGeometryProj) {
    Write-Host "❌ compute.geometry.csproj not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found compute.geometry project: $($computeGeometryProj.FullName)" -ForegroundColor Green

# Check if .NET is installed
Write-Host "`n🔍 Checking .NET installation..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET SDK: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ .NET SDK not found. Installing..." -ForegroundColor Red

    # Download and install .NET
    $dotnetUrl = "https://download.visualstudio.microsoft.com/download/pr/7e4066bb-3b4f-4a7a-9d75-9db288a3b1be/8a9bf6d7e6e0b5b4b8e9e8e9d8b8b8b8b/dotnet-sdk-6.0.400-win-x64.exe"
    $installerPath = "$env:TEMP\dotnet-installer.exe"

    Write-Host "Downloading .NET SDK..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $dotnetUrl -OutFile $installerPath

    Write-Host "Installing .NET SDK..." -ForegroundColor Yellow
    Start-Process $installerPath -ArgumentList "/quiet", "/norestart" -Wait

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # Test installation
    try {
        $dotnetVersion = dotnet --version
        Write-Host "✅ .NET SDK installed: $dotnetVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ .NET SDK installation failed" -ForegroundColor Red
        exit 1
    }
}

# Restore NuGet packages
Write-Host "`n📦 Restoring NuGet packages..." -ForegroundColor Yellow
try {
    dotnet restore
    Write-Host "✅ NuGet packages restored" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restore packages: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "`n🔨 Building the project..." -ForegroundColor Yellow
try {
    dotnet build --configuration Release
    Write-Host "✅ Project built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check if there's a publish profile or startup script
Write-Host "`n🔍 Checking for startup scripts..." -ForegroundColor Yellow

# Look for batch files or PowerShell scripts
$batchFiles = Get-ChildItem -Filter "*.bat" -Recurse
$ps1Files = Get-ChildItem -Filter "*.ps1" -Recurse

$startupScripts = @()
$startupScripts += $batchFiles
$startupScripts += $ps1Files

if ($startupScripts.Count -gt 0) {
    Write-Host "✅ Found potential startup scripts:" -ForegroundColor Green
    $startupScripts | ForEach-Object {
        Write-Host "   $($_.FullName)" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️ No startup scripts found" -ForegroundColor Yellow
}

# Check for production scripts in script/production
$productionScripts = Get-ChildItem -Path "script/production" -Filter "*.ps1"
if ($productionScripts.Count -gt 0) {
    Write-Host "✅ Found production setup scripts:" -ForegroundColor Green
    $productionScripts | ForEach-Object {
        Write-Host "   $($_.FullName)" -ForegroundColor Cyan
    }
}

# Try to run the server
Write-Host "`n🚀 Attempting to start Rhino compute server..." -ForegroundColor Yellow

$computeExe = Get-ChildItem -Filter "compute.geometry.exe" -Recurse
if ($computeExe) {
    Write-Host "✅ Found compute.geometry.exe: $($computeExe.FullName)" -ForegroundColor Green

    # Try to start the server
    try {
        $serverProcess = Start-Process -FilePath $computeExe.FullName -ArgumentList "--port", "6500", "--enableCORS", "*" -NoNewWindow -PassThru
        Start-Sleep -Seconds 5

        Write-Host "✅ Server process started (PID: $($serverProcess.Id))" -ForegroundColor Green

        # Test the server
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:6500/version" -TimeoutSec 10 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Rhino compute server responding" -ForegroundColor Green
                Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
            } else {
                Write-Host "⚠️ Server returned status: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Server test failed: $($_.Exception.Message)" -ForegroundColor Red
        }

    } catch {
        Write-Host "❌ Failed to start server: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ compute.geometry.exe not found" -ForegroundColor Red
    Write-Host "   You may need to build the project first" -ForegroundColor Yellow
}

# Create service installation script
Write-Host "`n🔧 Creating service installation script..." -ForegroundColor Yellow

$serviceScript = @"
# INSTALL RHINO COMPUTE AS WINDOWS SERVICE
# Run this as Administrator on your Azure VM

# Install NSSM if not already installed
# Download from: https://nssm.cc/download

# Create service
nssm install RhinoCompute "$($computeExe.FullName)"
nssm set RhinoCompute AppParameters --port 6500 --enableCORS *
nssm set RhinoCompute AppDirectory "$($computeExe.DirectoryName)"
nssm set RhinoCompute DisplayName "Rhino Compute Server"
nssm set RhinoCompute Description "Rhino 3D Compute Geometry Server"
nssm set RhinoCompute Start SERVICE_AUTO_START

# Start service
nssm start RhinoCompute

# Test service
curl http://localhost:6500/version
"@

Set-Content -Path "install-rhino-compute-service.ps1" -Value $serviceScript -Force
Write-Host "✅ Service installation script created: install-rhino-compute-service.ps1" -ForegroundColor Green

# Show status
Write-Host "`n🎉 RHINO COMPUTE SERVER SETUP COMPLETE!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

if ($computeExe) {
    Write-Host "✅ Rhino compute executable: $($computeExe.FullName)" -ForegroundColor Green
}
Write-Host "✅ .NET project built" -ForegroundColor Green
Write-Host "✅ Service installation script created" -ForegroundColor Green

Write-Host "`n🔧 To install as Windows service on Azure VM:" -ForegroundColor Cyan
Write-Host "1. Copy this folder to your Azure VM" -ForegroundColor White
Write-Host "2. Run install-rhino-compute-service.ps1 as Administrator" -ForegroundColor White
Write-Host "3. Test: curl http://localhost:6500/version" -ForegroundColor White

Write-Host "`n🌐 Expected endpoints:" -ForegroundColor Green
Write-Host "Local:  http://localhost:6500" -ForegroundColor Green
Write-Host "Azure:  http://4.248.252.92:6500" -ForegroundColor Green

Write-Host "`n📋 For more information, see:" -ForegroundColor Cyan
Write-Host "README.md in this directory" -ForegroundColor White
