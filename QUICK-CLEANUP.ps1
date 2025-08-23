# Quick Azure VM Cleanup - One-liner version
# Run this as Administrator in PowerShell

Write-Host "🧹 Quick Azure VM Cleanup" -ForegroundColor Green

# Safe files to delete
$safeFiles = @("C:\win-acme.v2.2.9.1701.64.pluggable.zip", "C:\bootstrap_step-2_log.txt", "C:\bootstrap_step-1_log.txt", "C:\public_suffix_list.dat", "C:\settings_default.json", "C:\Web_Config.xml", "C:\version.txt")

# Safe folders to delete
$safeFolders = @("C:\MACOSX", "C:\emptyfolderforweb")

$deletedFiles = 0
$deletedFolders = 0

Write-Host "Deleting safe files..." -ForegroundColor Yellow
foreach ($file in $safeFiles) {
    if (Test-Path $file) { Remove-Item $file -Force; Write-Host "  ✓ $file" -ForegroundColor Green; $deletedFiles++ }
}

Write-Host "Deleting safe folders..." -ForegroundColor Yellow  
foreach ($folder in $safeFolders) {
    if (Test-Path $folder) { Remove-Item $folder -Recurse -Force; Write-Host "  ✓ $folder" -ForegroundColor Green; $deletedFolders++ }
}

Write-Host "Complete! Deleted $deletedFiles files and $deletedFolders folders" -ForegroundColor Green
