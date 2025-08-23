# Rhino Compute Configuration on Azure VM

## 🔍 **Current Status**
- Azure VM is accessible on port 6500
- Rhino Compute service is responding (Kestrel server)
- All API key authentication methods are being rejected

## 🛠️ **Check Rhino Compute Configuration**

### 1. Verify Rhino Compute Installation
On your Azure VM, check:
1. Open Rhino 8
2. Go to Tools → Options → Plugins
3. Look for "Rhino Compute" plugin
4. Ensure it's enabled and loaded

### 2. Check Rhino Compute Configuration File
Look for configuration files in:
- `%APPDATA%\McNeel\Rhinoceros\8.0\Compute\`
- Or wherever Rhino Compute is installed

Common config files:
- `appsettings.json`
- `rhino.compute.config`
- `config.json`

### 3. API Key Configuration
The API key should be configured in one of these ways:

**Option A: Environment Variable**
Set environment variable:
```
RHINO_COMPUTE_API_KEY=p2robot-13a6-48f3-b24e-2025computeX
```

**Option B: Configuration File**
In appsettings.json:
```json
{
  "ApiKey": "p2robot-13a6-48f3-b24e-2025computeX",
  "AllowedHosts": "*"
}
```

**Option C: Command Line**
When starting Rhino Compute:
```
rhino.compute.exe --api-key p2robot-13a6-48f3-b24e-2025computeX
```

### 4. Disable Authentication (Temporary)
If you want to test without authentication, configure:
```json
{
  "ApiKey": "",
  "RequireApiKey": false,
  "AllowedHosts": "*"
}
```

### 5. Check Service Startup
Verify how Rhino Compute is being started:
- Windows Services
- Startup folder
- Scheduled task
- Command line

## 🔧 **Alternative Testing**

### Test Without API Key
If you disable authentication temporarily:
```bash
curl http://4.206.116.20:6500/version
```

### Check Other Endpoints
```bash
curl http://4.206.116.20:6500/
curl http://4.206.116.20:6500/health
```

### Verify Service Logs
Check Rhino Compute logs for:
- API key validation errors
- Configuration loading issues
- Port binding problems

## �� **Quick Fix Steps**

1. **Remote Desktop to Azure VM**
2. **Open Rhino 8**
3. **Check Rhino Compute plugin status**
4. **Find configuration file**
5. **Verify API key is set correctly**
6. **Restart Rhino Compute service**

## 🚨 **If Still Not Working**

Possible issues:
- API key format is different (try removing special characters)
- Multiple API keys configured
- Service running on different port
- Windows firewall still blocking
- User permissions issue

Let me know the results of these checks, and we can proceed accordingly!
