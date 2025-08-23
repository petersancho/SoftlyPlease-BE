# Rhino Compute Configuration Locations on Azure VM

Based on your file list, here are the key locations to check for Rhino Compute configuration:

## 🔍 **Most Likely Configuration Locations**

### 1. McNeel Folder (Most Important)
**Location**: `C:\McNeel\`
- This is where Rhino typically stores configuration files
- Look for: `C:\McNeel\Rhinoceros\8.0\Compute\`
- Check for: `appsettings.json`, `rhino.compute.config`, `config.json`

### 2. Program Files Installation
**Location**: `C:\Program Files\McNeel\Rhinoceros 8\`
- Standard Rhino installation directory
- Look for compute-related subdirectories

### 3. Custom Compute Folder
**Location**: `C:\compute\`
- You have a `compute` folder that might contain the service files
- Check for: `appsettings.json`, `rhino.compute.exe.config`, `config.json`

### 4. Installation Folder
**Location**: `C:\Rhino Compute Installation\`
- This might be where you installed Rhino Compute
- Look for configuration files here

### 5. Shadow Compute Folder
**Location**: `C:\shadow.compute\`
- This might be a compute service directory
- Check for any configuration files

## 🛠️ **Specific Files to Look For**

### Configuration Files:
- `appsettings.json`
- `rhino.compute.config`
- `config.json`
- `web.config`
- `rhino.compute.exe.config`

### Service Files:
- `rhino.compute.exe`
- `RhinoCompute.exe`
- Service startup scripts or batch files

## 📋 **Quick Check Commands**

### Check McNeel Directory:
```cmd
dir "C:\McNeel\" /s /b | findstr -i compute
dir "C:\McNeel\Rhinoceros\" /s /b | findstr -i config
```

### Check Program Files:
```cmd
dir "C:\Program Files\McNeel\" /s /b | findstr -i compute
```

### Check Compute Folder:
```cmd
dir "C:\compute\" /s
type "C:\compute\appsettings.json" 2>nul || echo "No appsettings.json found"
```

### Find All JSON Files:
```cmd
dir C:\ /s /b *.json | findstr -i compute
```

## 🚀 **Immediate Actions**

1. **Navigate to**: `C:\McNeel\Rhinoceros\8.0\Compute\`
2. **Look for**: `appsettings.json` or similar config file
3. **If found**: Check the ApiKey setting
4. **If not found**: Check the `C:\compute\` folder

## 📞 **Let me know:**
- What you find in the McNeel folder
- If you can locate any configuration files
- The contents of any config files you find

This will help us get the API key authentication working!
