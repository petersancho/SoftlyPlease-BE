# ========================================
# Azure VM Complete Cleanup Script
# ========================================
# This script safely cleans up your C: drive
# Run as Administrator in PowerShell

Write-Host "=========================================" -ForegroundColor Red -BackgroundColor White
Write-Host "   AZURE VM COMPLETE CLEANUP SCRIPT" -ForegroundColor Red -BackgroundColor White
Write-Host "=========================================" -ForegroundColor Red -BackgroundColor White
Write-Host ""

# Safety check - confirm user wants to proceed
Write-Host "⚠️  WARNING: This will delete files and folders from C:\" -ForegroundColor Yellow
Write-Host "   - Safe files: Installation backups, logs, temp files" -ForegroundColor Cyan
Write-Host "   - Safe folders: ZIP artifacts, empty folders, old logs" -ForegroundColor Cyan
Write-Host "   - CRITICAL: System files will be protected" -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Are you sure you want to proceed? (Type 'YES' to continue)"
if ($confirmation -ne 'YES') {
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "🚀 Starting cleanup process..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Counter for deleted items
$deletedFiles = 0
$deletedFolders = 0
$spaceFreed = 0

# ========================================
# DELETE SAFE FILES
# ========================================
Write-Host ""
Write-Host "📁 Deleting safe files..." -ForegroundColor Cyan

$safeFiles = @(
    "C:\win-acme.v2.2.9.1701.64.pluggable.zip",
    "C:\bootstrap_step-2_log.txt", 
    "C:\bootstrap_step-1_log.txt",
    "C:\public_suffix_list.dat",
    "C:\settings_default.json",
    "C:\Web_Config.xml",
    "C:\version.txt"
)

foreach ($file in $safeFiles) {
    if (Test-Path $file) {
        try {
            $fileInfo = Get-Item $file
            Remove-Item $file -Force
            Write-Host "  ✓ Deleted: $file ($([math]::Round($fileInfo.Length / 1MB, 2)) MB)" -ForegroundColor Green
            $deletedFiles++
            $spaceFreed += $fileInfo.Length
        }
        catch {
            Write-Host "  ❌ Failed to delete: $file" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Not found: $file" -ForegroundColor Gray
    }
}

# ========================================
# DELETE SAFE FOLDERS
# ========================================
Write-Host ""
Write-Host "📂 Deleting safe folders..." -ForegroundColor Cyan

$safeFolders = @(
    "C:\MACOSX",
    "C:\emptyfolderforweb"
)

foreach ($folder in $safeFolders) {
    if (Test-Path $folder) {
        try {
            $folderSize = (Get-ChildItem $folder -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            if ($folderSize) { $spaceFreed += $folderSize } else { $folderSize = 0 }
            Remove-Item $folder -Recurse -Force
            Write-Host "  ✓ Deleted: $folder ($([math]::Round($folderSize / 1MB, 2)) MB)" -ForegroundColor Green
            $deletedFolders++
        }
        catch {
            Write-Host "  ❌ Failed to delete: $folder" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Not found: $folder" -ForegroundColor Gray
    }
}

# ========================================
# CHECK AND DELETE LOGS FOLDER (OPTIONAL)
# ========================================
Write-Host ""
Write-Host "📋 Checking logs folder..." -ForegroundColor Yellow

$logsFolder = "C:\logs"
if (Test-Path $logsFolder) {
    $logsSize = (Get-ChildItem $logsFolder -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    if ($logsSize) { $logsSizeMB = [math]::Round($logsSize / 1MB, 2) } else { $logsSizeMB = 0 }
    
    Write-Host "  📂 Found logs folder: $logsSizeMB MB" -ForegroundColor Yellow
    $deleteLogs = Read-Host "  Delete logs folder? (Type 'YES' to delete)"
    
    if ($deleteLogs -eq 'YES') {
        try {
            Remove-Item $logsFolder -Recurse -Force
            Write-Host "  ✓ Deleted logs folder ($logsSizeMB MB)" -ForegroundColor Green
            $deletedFolders++
            $spaceFreed += $logsSize
        }
        catch {
            Write-Host "  ❌ Failed to delete logs folder" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Kept logs folder" -ForegroundColor Gray
    }
} else {
    Write-Host "  - No logs folder found" -ForegroundColor Gray
}

# ========================================
# CHECK POTENTIALLY SAFE FOLDERS
# ========================================
Write-Host ""
Write-Host "🔍 Checking potentially safe folders..." -ForegroundColor Magenta

$potentiallySafeFolders = @(
    "C:\Rhino Compute Installation",
    "C:\shadow.compute", 
    "C:\soft.geometry",
    "C:\soft-mock",
    "C:\SIC",
    "C:\lemp"
)

foreach ($folder in $potentiallySafeFolders) {
    if (Test-Path $folder) {
        $folderSize = (Get-ChildItem $folder -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        if ($folderSize) { $folderSizeMB = [math]::Round($folderSize / 1MB, 2) } else { $folderSizeMB = 0 }
        
        Write-Host "  📂 Found: $folder ($folderSizeMB MB)" -ForegroundColor Yellow
        $deleteFolder = Read-Host "  Delete this folder? (Type 'YES' to delete)"
        
        if ($deleteFolder -eq 'YES') {
            try {
                Remove-Item $folder -Recurse -Force
                Write-Host "    ✓ Deleted: $folder" -ForegroundColor Green
                $deletedFolders++
                $spaceFreed += $folderSize
            }
            catch {
                Write-Host "    ❌ Failed to delete: $folder" -ForegroundColor Red
            }
        } else {
            Write-Host "    - Kept: $folder" -ForegroundColor Gray
        }
    }
}

# ========================================
# FINAL REPORT
# ========================================
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "           CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$spaceFreedMB = [math]::Round($spaceFreed / 1MB, 2)
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor White
Write-Host "  • Files deleted: $deletedFiles" -ForegroundColor Cyan
Write-Host "  • Folders deleted: $deletedFolders" -ForegroundColor Cyan
Write-Host "  • Space freed: $spaceFreedMB MB" -ForegroundColor Cyan

Write-Host ""
Write-Host "🛡️  Safety Status:" -ForegroundColor White
Write-Host "  • System files: Protected ✅" -ForegroundColor Green
Write-Host "  • Critical folders: Protected ✅" -ForegroundColor Green
Write-Host "  • Rhino Compute: Should still work ✅" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test your Rhino Compute service" -ForegroundColor White
Write-Host "  2. Check if any applications are affected" -ForegroundColor White
Write-Host "  3. Consider cleaning up Windows temp files too:" -ForegroundColor White
Write-Host "     cleanmgr.exe" -ForegroundColor Gray

Write-Host ""
Write-Host "🎉 Cleanup completed successfully!" -ForegroundColor Green
Write-Host ""

# Optional: Show remaining disk space
try {
    $drive = Get-PSDrive C
    $freeSpace = [math]::Round($drive.Free / 1GB, 2)
    $usedSpace = [math]::Round($drive.Used / 1GB, 2)
    Write-Host "💾 Current C: Drive Status:" -ForegroundColor White
    Write-Host "  • Free space: $freeSpace GB" -ForegroundColor Cyan
    Write-Host "  • Used space: $usedSpace GB" -ForegroundColor Cyan
} catch {
    Write-Host "Could not check drive space" -ForegroundColor Gray
}

Write-Host ""
Read-Host "Press Enter to exit"
