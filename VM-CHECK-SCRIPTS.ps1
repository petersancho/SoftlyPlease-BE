Write-Host "=========================================" -ForegroundColor Green
Write-Host "Rhino Compute Configuration Checker" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`nChecking for Rhino Compute configuration files..." -ForegroundColor Yellow

# Check McNeel directory
Write-Host "`n1. Checking McNeel directory structure:" -ForegroundColor Cyan
if (Test-Path "C:\McNeel\") {
    Write-Host "Found McNeel directory" -ForegroundColor Green
    Get-ChildItem "C:\McNeel\" -Recurse -File | Where-Object { $_.Name -match "compute|config" } | Select-Object FullName
} else {
    Write-Host "McNeel directory not found" -ForegroundColor Red
}

# Check Program Files
Write-Host "`n2. Checking Program Files:" -ForegroundColor Cyan
Get-ChildItem "C:\Program Files\McNeel\" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "compute|config" } | Select-Object FullName

# Check compute folder
Write-Host "`n3. Checking compute folder:" -ForegroundColor Cyan
if (Test-Path "C:\compute\") {
    Write-Host "Found compute folder - contents:" -ForegroundColor Green
    Get-ChildItem "C:\compute\" -Recurse | Select-Object FullName, LastWriteTime
    
    # Check for appsettings.json
    if (Test-Path "C:\compute\appsettings.json") {
        Write-Host "`nFound appsettings.json content:" -ForegroundColor Green
        Get-Content "C:\compute\appsettings.json" | Write-Host
    } else {
        Write-Host "No appsettings.json found" -ForegroundColor Red
    }
} else {
    Write-Host "compute folder not found" -ForegroundColor Red
}

# Check all JSON files
Write-Host "`n4. Checking all JSON files related to compute:" -ForegroundColor Cyan
Get-ChildItem "C:\" -Recurse -File -Name "*.json" -ErrorAction SilentlyContinue | Where-Object { $_ -match "compute" }

# Check running services
Write-Host "`n5. Checking for running Rhino/Compute services:" -ForegroundColor Cyan
Get-Service | Where-Object { $_.Name -match "rhino|compute" -or $_.DisplayName -match "rhino|compute" }

# Check processes
Write-Host "`n6. Checking for running Rhino/Compute processes:" -ForegroundColor Cyan
Get-Process | Where-Object { $_.Name -match "rhino|compute" } | Select-Object Name, Id, StartTime

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "Configuration Check Complete" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "- If config files found, check their ApiKey settings"
Write-Host "- Look for running Rhino Compute services"
Write-Host "- Check the compute folder contents"
Write-Host "`nPress any key to continue..."
Read-Host
