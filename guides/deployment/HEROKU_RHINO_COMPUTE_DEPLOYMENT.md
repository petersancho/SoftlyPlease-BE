# 🚀 **Heroku-Only Rhino Compute Deployment**

## **Quick Fix for softlyplease-appserver (Heroku Only)**

---

## 📋 **Current Setup Analysis**

**Your Current Heroku Apps:**
```bash
# Main app (working)
softlyplease-appserver.herokuapp.com ✅

# Rhino Compute needed
# (Currently trying to connect to localhost:6500) ❌
```

**Goal:** Deploy Rhino Compute to a second Heroku app, then connect the two.

---

## 🛠️ **Step-by-Step Heroku Deployment**

### **Step 1: Get Rhino Compute Source Code**

You have two options:

**Option A: Use Official Rhino Compute**
```bash
# Clone the official repository
git clone https://github.com/mcneel/rhino-compute.git
cd rhino-compute
```

**Option B: Use Pre-configured Version**
```bash
# Download pre-configured Rhino Compute for Heroku
# (I'll provide this if needed)
```

### **Step 2: Create Second Heroku App**

```bash
# Create separate app for Rhino Compute
heroku create softlyplease-rhino-compute

# Verify creation
heroku apps --all
# Should show both apps
```

### **Step 3: Configure Rhino Compute for Heroku**

**Navigate to your Rhino Compute directory:**
```bash
cd rhino-compute  # or wherever you cloned it
```

**Create Heroku-specific configuration:**
```bash
# Set the port for Heroku
heroku config:set ASPNETCORE_URLS=http://+:6500 --app softlyplease-rhino-compute

# Set environment
heroku config:set ASPNETCORE_ENVIRONMENT=Production --app softlyplease-rhino-compute

# Add .NET buildpack
heroku buildpacks:add heroku/dotnet --app softlyplease-rhino-compute
```

**Create Procfile for Heroku:**
```procfile
web: dotnet RhinoCompute.dll --urls http://0.0.0.0:6500
```

**Initialize git (if not already done):**
```bash
git init
git add .
git commit -m "Deploy Rhino Compute to Heroku"
```

### **Step 4: Deploy to Heroku**

```bash
# Add Heroku remote for the new app
heroku git:remote -a softlyplease-rhino-compute

# Deploy
git push heroku main
```

### **Step 5: Connect Main App to Rhino Compute**

**Update your main app's configuration:**
```bash
# Set the Rhino Compute URL
heroku config:set RHINO_COMPUTE_URL=https://softlyplease-rhino-compute.herokuapp.com --app softlyplease-appserver

# Verify the setting
heroku config:get RHINO_COMPUTE_URL --app softlyplease-appserver
```

---

## 🧪 **Testing the Connection**

### **Test 1: Check Rhino Compute Health**
```bash
# Test the new Rhino Compute app
curl https://softlyplease-rhino-compute.herokuapp.com/health
```

**Expected Response:**
```json
{"status":"healthy","timestamp":"...","uptime":...}
```

### **Test 2: Test TopoOpt Computation**
```bash
# Test the full integration
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{
    "definition": "TopoOpt.gh",
    "inputs": {
      "height": [600],
      "width": [1200],
      "depth": [400],
      "num": [5],
      "RH_IN:explode": [false]
    }
  }'
```

**Expected Response:**
- ✅ No more connection errors
- ✅ Real computation results
- ✅ Performance metrics in headers

### **Test 3: Verify Live Interface**
```bash
# Visit the working interface
echo "Visit: https://softlyplease-appserver.herokuapp.com/topoopt"

# Test computation from browser
echo "Click 'Compute' button - should work now!"
```

---

## 🔧 **Troubleshooting Heroku-Specific Issues**

### **Issue 1: Build Failures**
```bash
# Check build logs
heroku logs --app softlyplease-rhino-compute --tail

# Common fixes:
heroku buildpacks:clear --app softlyplease-rhino-compute
heroku buildpacks:add heroku/dotnet --app softlyplease-rhino-compute
```

### **Issue 2: Port Configuration**
```bash
# Ensure correct port settings
heroku config:set ASPNETCORE_URLS=http://+:6500 --app softlyplease-rhino-compute

# Check current settings
heroku config --app softlyplease-rhino-compute
```

### **Issue 3: Runtime Errors**
```bash
# Check runtime logs
heroku logs --app softlyplease-rhino-compute --tail

# Restart if needed
heroku ps:restart --app softlyplease-rhino-compute
```

### **Issue 4: Connection Still Failing**
```bash
# Double-check the URL in main app
heroku config:get RHINO_COMPUTE_URL --app softlyplease-appserver

# Test direct connection to Rhino Compute
curl https://softlyplease-rhino-compute.herokuapp.com/health

# If that works, redeploy main app
heroku ps:restart --app softlyplease-appserver
```

---

## 📊 **Performance Optimization (Heroku)**

### **Scale Resources:**
```bash
# Upgrade to better dyno for better performance
heroku ps:resize web=standard-1x --app softlyplease-rhino-compute

# Enable clustering
heroku config:set WEB_CONCURRENCY=2 --app softlyplease-rhino-compute
```

### **Monitoring:**
```bash
# Add monitoring addons
heroku addons:create papertrail:choklad --app softlyplease-rhino-compute

# View logs
heroku logs --app softlyplease-rhino-compute --tail
```

---

## 💰 **Heroku Cost Breakdown**

**Current Setup:**
```bash
# Main app (softlyplease-appserver)
- Hobby dyno: $7/month
- MemCachier: $15/month
- Total: $22/month

# New Rhino Compute app (softlyplease-rhino-compute)
- Hobby dyno: $7/month
- Total additional: $7/month

# Grand Total: $29/month
```

**Performance Upgrade Option:**
```bash
# Upgrade both to Standard-1X
- Main app: $25/month
- Rhino Compute: $25/month
- MemCachier: $15/month
- Total: $65/month
```

---

## 🚀 **Quick Verification Steps**

After deployment, run these commands:

```bash
# 1. Check both apps are running
heroku ps --app softlyplease-appserver
heroku ps --app softlyplease-rhino-compute

# 2. Test health endpoints
curl https://softlyplease-appserver.herokuapp.com/health
curl https://softlyplease-rhino-compute.herokuapp.com/health

# 3. Test computation
curl -X POST https://softlyplease-appserver.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"TopoOpt.gh","inputs":{"height":[600],"width":[1200],"depth":[400],"num":[5],"RH_IN:explode":[false]}}'

# 4. Visit live interface
echo "🎉 Visit: https://softlyplease-appserver.herokuapp.com/topoopt"
```

---

## 🎯 **Expected Timeline**

**⏱️ Total Time: 1-2 hours**

- **30 min:** Get Rhino Compute source code
- **15 min:** Create and configure second Heroku app
- **30 min:** Deploy and test
- **15 min:** Connect main app and verify
- **30 min:** Performance testing and optimization

**🎉 Result:** Live topology optimization on softlyplease.com!

---

## 📞 **Need Help?**

If you encounter any issues:

1. **Check the logs:** `heroku logs --app softlyplease-rhino-compute --tail`
2. **Verify configuration:** `heroku config --app softlyplease-rhino-compute`
3. **Test connectivity:** `curl https://softlyplease-rhino-compute.herokuapp.com/health`

**Do you have the Rhino Compute source code ready, or do you need me to help you obtain it?**
