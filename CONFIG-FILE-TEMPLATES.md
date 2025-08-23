# Rhino Compute Configuration File Templates

## 📋 **What to Look For**

When you find the configuration files, they should contain settings like these:

## 1. appsettings.json (Most Common)

**Current (with API key required):**
```json
{
  "ApiKey": "p2robot-13a6-48f3-b24e-2025computeX",
  "RequireApiKey": true,
  "AllowedHosts": "*",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  }
}
```

**To disable authentication temporarily:**
```json
{
  "ApiKey": "",
  "RequireApiKey": false,
  "AllowedHosts": "*",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  }
}
```

## 2. rhino.compute.config

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="ApiKey" value="p2robot-13a6-48f3-b24e-2025computeX" />
    <add key="RequireApiKey" value="true" />
    <add key="AllowedHosts" value="*" />
  </appSettings>
</configuration>
```

## 3. config.json

```json
{
  "apiKey": "p2robot-13a6-48f3-b24e-2025computeX",
  "requireApiKey": true,
  "port": 6500,
  "allowedHosts": "*"
}
```

## 🛠️ **Quick Fix Options**

### Option A: Disable Authentication (Fastest)
1. Find your `appsettings.json` file
2. Change `"RequireApiKey": true` to `"RequireApiKey": false`
3. Save the file
4. Restart the Rhino Compute service

### Option B: Fix API Key Format
If the API key format is wrong, try these variations:
- `p2robot-13a6-48f3-b24e-2025computeX` (current)
- `p2robot13a648f3b24e2025computeX` (no dashes)
- `P2ROBOT-13A6-48F3-B24E-2025COMPUTEX` (uppercase)

### Option C: Environment Variable
Set environment variable:
```
RHINO_COMPUTE_API_KEY=p2robot-13a6-48f3-b24e-2025computeX
```

## 🔄 **After Making Changes**

1. **Save the configuration file**
2. **Restart the Rhino Compute service**:
   - Windows Services → Restart "Rhino Compute"
   - Or restart the application if running directly
3. **Test the connection** from your Mac:
   ```bash
   curl http://4.206.116.20:6500/version
   ```

## 📞 **If Still Not Working**

Let me know:
- What configuration files you found
- Their current contents
- What changes you made
- Any error messages

We can troubleshoot from there!
