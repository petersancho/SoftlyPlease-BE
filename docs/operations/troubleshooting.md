# Troubleshooting Guide

## 🔧 **Common Issues and Solutions**

This guide provides solutions for common problems with the Rhino Compute system.

## 📊 **Quick Diagnosis**

### **System Health Check**
Run this script to quickly diagnose issues:

```bash
# Check all components
curl -s https://softlyplease-appserver.herokuapp.com/health || echo "AppServer DOWN"
curl -s -H "RhinoComputeKey: softlyplease-secure-key-2024" http://4.248.252.92:6500/version || echo "Rhino Compute DOWN"
```

### **Component Status**
- ✅ **All Good**: Both endpoints respond
- ⚠️ **AppServer Issue**: Heroku app not responding
- ⚠️ **Rhino Compute Issue**: Azure VM or service not responding

## 🚨 **Critical Issues**

### **1. System Completely Down**

#### **Symptoms**
- All API calls fail
- Website shows errors
- No response from any endpoint

#### **Immediate Actions**
1. **Check Heroku Status**
   ```bash
   heroku ps --app softlyplease-appserver
   ```

2. **Check Azure VM**
   - Go to [Azure Portal](https://portal.azure.com)
   - Check VM status and resource usage

3. **Restart Services**
   ```bash
   # Restart Heroku app
   heroku restart --app softlyplease-appserver

   # If VM is running, restart compute services
   # (via RDP to VM)
   Restart-Service rhino.compute
   ```

#### **If Azure VM is Down**
1. **Start VM in Azure Portal**
2. **Wait for boot (5-10 minutes)**
3. **Verify services are running**
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*compute*"}
   ```

### **2. API Authentication Failing**

#### **Symptoms**
- 401 Unauthorized errors
- API key rejected

#### **Solutions**
1. **Check API Key**
   ```bash
   # Test with current key
   curl -H "RhinoComputeKey: softlyplease-secure-key-2024" \
        http://4.248.252.92:6500/version
   ```

2. **Update API Key in Heroku**
   ```bash
   heroku config:set RHINO_COMPUTE_KEY="correct-key" --app softlyplease-appserver
   heroku restart --app softlyplease-appserver
   ```

3. **Verify Key on Azure VM**
   - RDP to VM
   - Check environment variables
   ```powershell
   Get-ChildItem Env: | Where-Object {$_.Name -like "*RHINO*"}
   ```

### **3. Definition Solving Errors**

#### **Symptoms**
- 500 Internal Server Error
- "No compute server found"
- Definition not found

#### **Solutions**
1. **Check Definition Exists**
   ```bash
   # List available definitions
   curl https://softlyplease-appserver.herokuapp.com/
   ```

2. **Verify Definition File**
   ```bash
   # Check if file exists in repository
   ls compute.rhino3d.appserver/src/files/*.gh
   ```

3. **Redeploy After Changes**
   ```bash
   git add .
   git commit -m "Fix definition"
   git push heroku main
   ```

4. **Check Rhino Compute Logs**
   ```powershell
   # On Azure VM
   Get-Content "C:\inetpub\wwwroot\aspnet_client\system_web\4_0_30319\rhino.compute\logs\*.log" -Tail 50
   ```

## ⚠️ **Performance Issues**

### **1. Slow Response Times**

#### **Symptoms**
- API calls take >5 seconds
- Website feels sluggish

#### **Diagnosis**
1. **Check Response Times**
   ```bash
   time curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
     -H "Content-Type: application/json" \
     -d '{"definition": "dresser3", "inputs": {"RH_IN:height": 3.0}}'
   ```

2. **Check Azure VM Performance**
   - CPU usage >80%
   - Memory usage >90%

3. **Check Heroku Performance**
   ```bash
   heroku logs --app softlyplease-appserver --tail
   ```

#### **Solutions**
1. **Scale Heroku Dynos**
   ```bash
   heroku ps:scale web=2 --app softlyplease-appserver
   ```

2. **Scale Azure VM**
   - Increase VM size in Azure Portal
   - Add more cores/memory

3. **Enable Caching**
   ```bash
   heroku addons:create memcachier:dev --app softlyplease-appserver
   ```

### **2. High Memory Usage**

#### **Symptoms**
- Azure VM memory >90%
- Heroku dyno memory issues

#### **Solutions**
1. **Restart Services**
   ```bash
   # On Azure VM
   Restart-Service rhino.compute

   # On Heroku
   heroku restart --app softlyplease-appserver
   ```

2. **Clear Heroku Cache**
   ```bash
   heroku run node -e "const cache = require('memory-cache'); cache.clear();"
   ```

3. **Scale Up Resources**
   - Increase Azure VM memory
   - Scale Heroku dynos

## 🌐 **Network Issues**

### **1. Connection Refused**

#### **Symptoms**
- Cannot reach Azure VM
- Port 6500 not accessible

#### **Solutions**
1. **Check Azure Security Groups**
   - Go to Azure Portal
   - VM → Networking → Network security group
   - Ensure port 6500 is open

2. **Check VM Firewall**
   ```powershell
   # On Azure VM
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*6500*"}
   ```

3. **Verify Public IP**
   ```powershell
   # On Azure VM
   Invoke-WebRequest -Uri "http://ipinfo.io/ip"
   ```

### **2. Heroku Connection Issues**

#### **Symptoms**
- Cannot reach Heroku app
- DNS resolution fails

#### **Solutions**
1. **Check Heroku Status**
   ```bash
   heroku status
   ```

2. **Verify Domain**
   ```bash
   nslookup softlyplease-appserver.herokuapp.com
   ```

3. **Check Heroku Config**
   ```bash
   heroku config --app softlyplease-appserver
   ```

## 💾 **Data Issues**

### **1. Definition Files Missing**

#### **Symptoms**
- Definition not found errors
- Incomplete definition list

#### **Solutions**
1. **Check Repository**
   ```bash
   cd compute.rhino3d.appserver
   ls src/files/
   ```

2. **Restore from Backup**
   ```bash
   git checkout HEAD~1 -- src/files/
   ```

3. **Redeploy**
   ```bash
   git add .
   git commit -m "Restore definitions"
   git push heroku main
   ```

### **2. Cache Corruption**

#### **Symptoms**
- Inconsistent results
- Old data being returned

#### **Solutions**
1. **Clear Heroku Cache**
   ```bash
   heroku run node -e "const cache = require('memory-cache'); cache.clear();"
   ```

2. **Restart App**
   ```bash
   heroku restart --app softlyplease-appserver
   ```

3. **Clear MemCachier** (if using)
   ```bash
   heroku addons:open memcachier
   # Use web interface to flush cache
   ```

## 🔍 **Debug Tools**

### **1. Heroku Debugging**
```bash
# View logs
heroku logs --tail --app softlyplease-appserver

# Run console
heroku run bash --app softlyplease-appserver

# Check processes
heroku ps --app softlyplease-appserver
```

### **2. Azure Debugging**
```powershell
# Check services
Get-Service | Where-Object {$_.Name -like "*compute*"}

# Check processes
Get-Process | Where-Object {$_.ProcessName -like "*compute*"}

# Check logs
Get-ChildItem "C:\inetpub\wwwroot\aspnet_client\system_web\4_0_30319\rhino.compute\logs\" -Name
```

### **3. Network Debugging**
```bash
# Test connectivity
curl -v https://softlyplease-appserver.herokuapp.com/
curl -v -H "RhinoComputeKey: softlyplease-secure-key-2024" http://4.248.252.92:6500/version
```

## 🚨 **Emergency Procedures**

### **1. Complete System Failure**
1. **Document the issue**
2. **Contact support**:
   - Heroku: [help.heroku.com](https://help.heroku.com)
   - Azure: [portal.azure.com](https://portal.azure.com) → Help + Support
3. **Use backup recovery** procedures

### **2. Data Loss**
1. **Stop all writes** to the system
2. **Use backup restoration** procedures
3. **Verify data integrity**
4. **Resume operations**

## 📞 **Support Contacts**

- **Heroku Support**: [help.heroku.com](https://help.heroku.com)
- **Azure Support**: [portal.azure.com](https://portal.azure.com) → Help + Support
- **Rhino Support**: [discourse.mcneel.com](https://discourse.mcneel.com)

## 📊 **Monitoring Dashboard**

Create a simple monitoring script:

```bash
#!/bin/bash
# monitoring.sh - System health check

echo "=== System Health Check ==="
echo "Timestamp: $(date)"

# Check AppServer
if curl -s https://softlyplease-appserver.herokuapp.com/ > /dev/null; then
    echo "✅ AppServer: OK"
else
    echo "❌ AppServer: DOWN"
fi

# Check Rhino Compute
if curl -s -H "RhinoComputeKey: softlyplease-secure-key-2024" http://4.248.252.92:6500/version > /dev/null; then
    echo "✅ Rhino Compute: OK"
else
    echo "❌ Rhino Compute: DOWN"
fi

echo "=== End Health Check ==="
```

Run this periodically to monitor system health.

---

**Last Updated**: December 2024
**Document Version**: 1.0
