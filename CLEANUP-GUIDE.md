# Azure VM Cleanup Guide

Based on your file list, here's what you can safely delete:

## 🗑️ **SAFE TO DELETE (No Risk)**

### Files:
- ✅ `win-acme.v2.2.9.1701.64.pluggable.zip` - Backup installer, delete if win-acme is installed
- ✅ `bootstrap_step-2_log.txt` - Installation log, safe to delete
- ✅ `bootstrap_step-1_log.txt` - Installation log, safe to delete
- ✅ `public_suffix_list.dat` - SSL data file, safe if not needed
- ✅ `settings_default.json` - Default settings, safe if not needed
- ✅ `Web_Config.xml` - Web config, safe if not needed
- ✅ `version.txt` - Version info, safe to delete

### Folders:
- ✅ `MACOSX` - Extracted ZIP artifacts, definitely safe to delete
- ✅ `emptyfolderforweb` - Empty folder, definitely safe to delete
- ✅ `logs` - Old log files, safe if not needed for troubleshooting

## ⚠️ **POTENTIALLY SAFE (With Caution)**

### Folders to Check First:
- ❓ `BE.TrainingData` - Check if your applications use this data
- ❓ `Rhino Compute Installation` - Check if installation is complete and working
- ❓ `shadow.compute` - Check if this is a running service
- ❓ `soft.geometry` - Check if this is a running application
- ❓ `soft-mock` - Check if this is a running application
- ❓ `SIC` - Unknown folder, check contents
- ❓ `lemp` - Might be Linux-related, check if needed
- ❓ `win-acme` - Check if SSL certificates are being used
- ❓ `Scripts` - Check if these scripts are being used

## 🚫 **DO NOT DELETE (Critical System Files)**

### Essential Windows Folders:
- ❌ `PerfLogs` - Performance logs, system critical
- ❌ `Program Files` - System applications, critical
- ❌ `Program Files (x86)` - 32-bit applications, critical  
- ❌ `Users` - User profiles, critical
- ❌ `Windows` - Windows system files, critical
- ❌ `WindowsAzure` - Azure VM system files, critical
- ❌ `inetpub` - IIS web server files, critical if using IIS

### Essential Application Folders:
- ❌ `McNeel` - Rhino application files, critical
- ❌ `compute` - Likely your Rhino Compute service, critical
- ❌ `Python313` - Python installation, critical if used
- ❌ `Packages` - System packages, likely critical

## 🧹 **Recommended Cleanup Script**

```batch
@echo off
echo Starting Azure VM cleanup...

echo.
echo Deleting safe files...
del "C:\win-acme.v2.2.9.1701.64.pluggable.zip" 2>nul
del "C:\bootstrap_step-2_log.txt" 2>nul
del "C:\bootstrap_step-1_log.txt" 2>nul
del "C:\public_suffix_list.dat" 2>nul
del "C:\settings_default.json" 2>nul
del "C:\Web_Config.xml" 2>nul
del "C:\version.txt" 2>nul

echo.
echo Deleting safe folders...
rd /s /q "C:\MACOSX" 2>nul
rd /s /q "C:\emptyfolderforweb" 2>nul

echo.
echo Cleanup complete!
echo.
echo Remember to check the potentially safe folders before deleting them.
pause
```

## 📋 **Quick Cleanup Commands**

### Safe Deletions:
```cmd
del "C:\win-acme.v2.2.9.1701.64.pluggable.zip"
del "C:\bootstrap_step-2_log.txt"
del "C:\bootstrap_step-1_log.txt"
rd /s /q "C:\MACOSX"
rd /s /q "C:\emptyfolderforweb"
```

### Check Before Deleting:
```cmd
dir "C:\Rhino Compute Installation"
dir "C:\shadow.compute"
dir "C:\soft.geometry"
```

## 💡 **Space Savings Estimate**

Safe to delete immediately: ~37MB
Potentially safe (after checking): Variable
Total potential savings: 100MB - 1GB (depending on what you keep)

## ⚠️ **Before Any Deletions:**
1. **Backup important data**
2. **Check if services are running** that depend on these folders
3. **Test your applications** after cleanup
4. **Keep installation logs** temporarily for troubleshooting

Start with the safe deletions, then check the potentially safe ones!
