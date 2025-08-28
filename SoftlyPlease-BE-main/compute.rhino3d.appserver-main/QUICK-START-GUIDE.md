# 🚀 QUICK START: Get Geometry Visible on softlyplease.com

## 🔥 IMMEDIATE ACTION REQUIRED

### Step 1: Start Rhino Compute on Azure VM
```bash
# SSH into your Azure VM
ssh your-username@4.248.252.92

# Then run these PowerShell commands as Administrator:
cd C:\compute-sp\SoftlyPlease-BE-main\compute.rhino3d-8.x\src\rhino.compute\bin\Debug\net6.0
$env:ASPNETCORE_URLS = "http://0.0.0.0:6001"
.\Rhino.Compute.exe
```

### Step 2: Verify Compute is Running
```bash
# From your local machine, test connectivity:
curl -sS http://4.248.252.92:6001/version
curl -sS http://4.248.252.92:6001/healthcheck
```

### Step 3: Test Geometry Visibility
```bash
# Navigate to the appserver directory
cd SoftlyPlease-BE-main/compute.rhino3d.appserver-main

# Make scripts executable and run geometry test
chmod +x test-geometry.sh
./test-geometry.sh
```

## 🎯 EXPECTED RESULTS

✅ **Compute Server**: Should show version info
✅ **Geometry Generation**: Should return JSON with geometry data
✅ **Examples Page**: Should list all available examples
✅ **3D Viewers**: Should display interactive geometry

## 🔍 IF GEOMETRY IS STILL NOT VISIBLE

### Check These in Order:

1. **Browser Console Errors**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check if `window.THREE` exists

2. **Network Tab**
   - Check if Three.js loaded successfully
   - Verify rhino3dm loaded
   - Look for failed API calls

3. **Heroku Logs**
   ```bash
   heroku logs --tail -a softlyplease-appserver
   ```

4. **Compute Server Logs**
   - Check the Rhino Compute console output on Azure VM
   - Look for connection errors or timeouts

## 🆘 EMERGENCY DEBUGGING

### Quick Test Commands:
```bash
# Test Compute server directly
curl -sS http://4.248.252.92:6001/version

# Test solve API
curl -sS -X POST https://www.softlyplease.com/solve/ \
  -H "Content-Type: application/json" \
  -d '{"definition":"BranchNodeRnd.gh","inputs":{"Count":5}}'

# Check examples page
curl -sSI https://www.softlyplease.com/mcneel-examples
```

### Common Issues:
- **Port 6001 blocked**: Check Azure NSG rules
- **Rhino not installed**: Verify Rhino 8 on Azure VM
- **Wrong path**: Check Rhino Compute executable location
- **Firewall**: Ensure Windows Firewall allows port 6001

## 🎉 SUCCESS INDICATORS

✅ **Examples page loads**: `https://www.softlyplease.com/mcneel-examples`
✅ **Geometry appears**: 3D models render in browser
✅ **Controls work**: Sliders and buttons affect geometry
✅ **No console errors**: Clean browser developer tools

---

**🚨 KEY POINT**: The geometry will ONLY appear after Rhino Compute is running on the Azure VM. The web interface is ready - you just need to start the computation engine!
