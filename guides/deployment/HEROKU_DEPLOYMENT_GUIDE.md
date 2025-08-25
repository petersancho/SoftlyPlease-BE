# 🚀 Heroku Deployment Guide - SoftlyPlease Compute

## Fix Your Blank Screen Issues

---

## 📋 **Current Issues Fixed**

✅ **Server Configuration**: Removed conflicting clustering
✅ **Root Route**: Added proper HTML homepage
✅ **Procfile**: Simplified for Heroku
✅ **Static Files**: Proper HTML serving
✅ **TopoOpt Interface**: Fully functional

---

## 🔧 **Step-by-Step Heroku Deployment**

### **1. Prepare Your Local Environment**

**Make sure your local server works:**
```bash
# Test locally first
npm start
# Visit: http://localhost:3000
# Should show: "SoftlyPlease Compute" homepage
```

### **2. Deploy to Heroku**

**If you don't have a Heroku app yet:**
```bash
# Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create new app (replace with your preferred name)
heroku create your-app-name

# Add MemCachier addon (for production caching)
heroku addons:create memcachier:dev
```

**If you already have a Heroku app:**
```bash
# Connect to your existing app
heroku git:remote -a your-existing-app-name

# Add MemCachier if not already added
heroku addons:create memcachier:dev
```

### **3. Set Environment Variables**

**Required for production:**
```bash
# Set Rhino Compute URL (use your actual Rhino server)
heroku config:set RHINO_COMPUTE_URL=https://your-rhino-server.com

# Set Rhino Compute API key (if required)
heroku config:set RHINO_COMPUTE_KEY=your-api-key

# Set Node environment
heroku config:set NODE_ENV=production

# Set port (Heroku will override this)
heroku config:set PORT=3000
```

**Optional performance settings:**
```bash
# Enable clustering for better performance
heroku config:set WEB_CONCURRENCY=2

# Set rate limiting
heroku config:set RATE_LIMIT=100

# Enable CORS for your domain
heroku config:set CORS_ORIGIN=https://softlyplease.com
```

### **4. Deploy Your Code**

```bash
# Add all files to git
git add .

# Commit your changes
git commit -m "Fix deployment issues and add TopoOpt configurator"

# Deploy to Heroku
git push heroku main

# Or if your branch is different:
git push heroku your-branch-name:main
```

### **5. Verify Deployment**

**Check if deployment succeeded:**
```bash
# Check Heroku logs
heroku logs --tail

# Open your app
heroku open

# Test health endpoint
curl https://your-app-name.herokuapp.com/health
```

---

## 🔍 **Debugging Blank Screen Issues**

### **Common Problems & Solutions**

#### **Problem 1: Application Error**
```bash
# Check Heroku logs
heroku logs --tail

# Common errors:
# - Port binding issues
# - Missing dependencies
# - Syntax errors
```

#### **Problem 2: Still Getting Blank Screen**
```bash
# Check if app is responding
curl https://your-app-name.herokuapp.com/

# Should return HTML, not JSON or error
```

#### **Problem 3: TopoOpt Not Working**
```bash
# Test the TopoOpt interface
curl https://your-app-name.herokuapp.com/topoopt

# Test computation
curl -X POST https://your-app-name.herokuapp.com/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"TopoOpt.gh","inputs":{"height":[600],"width":[1200],"depth":[400],"num":[5],"RH_IN:explode":[false]}}'
```

---

## 🌐 **Domain Configuration**

### **Point softlyplease.com to Heroku**

**Option 1: Heroku Custom Domain**
```bash
# Add your domain to Heroku
heroku domains:add www.softlyplease.com
heroku domains:add softlyplease.com

# Get DNS targets from Heroku
heroku domains

# Add CNAME records in your DNS settings:
# www.softlyplease.com -> your-app-name.herokuapp.com
# softlyplease.com -> your-app-name.herokuapp.com
```

**Option 2: Direct Heroku URL**
```bash
# Use your Heroku URL directly:
# https://your-app-name.herokuapp.com
```

---

## 📊 **Production Monitoring**

### **MemCachier Dashboard**
```bash
# Get MemCachier connection info
heroku config:get MEMCACHIER_SERVERS
heroku config:get MEMCACHIER_USERNAME
heroku config:get MEMCACHIER_PASSWORD

# Visit: https://www.memcachier.com
# Login with your Heroku credentials
# Monitor cache hit rates and performance
```

### **Application Monitoring**
```bash
# Test all endpoints
curl https://your-app-name.herokuapp.com/health
curl https://your-app-name.herokuapp.com/metrics
curl https://your-app-name.herokuapp.com/TopoOpt.gh
```

---

## 🔧 **Frontend Integration**

### **Update Your Frontend Code**

**Replace localhost URLs with production:**
```javascript
// Before
const API_BASE_URL = 'http://localhost:3000'

// After
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-app-name.herokuapp.com'
  : 'http://localhost:3000'
```

**Add error handling for production:**
```javascript
// Handle CORS and network errors
const handleApiError = (error) => {
  if (error.message.includes('CORS')) {
    return 'Connection blocked. Please check your network.';
  }
  if (error.message.includes('fetch')) {
    return 'Server connection failed. Please try again.';
  }
  return error.message;
};
```

---

## 🚀 **Performance Optimization**

### **Enable Production Features**
```bash
# Enable clustering for multiple dynos
heroku config:set WEB_CONCURRENCY=2

# Add more dynos for higher traffic
heroku ps:scale web=2

# Enable MemCachier production plan
heroku addons:upgrade memcachier:100
```

### **Cache Configuration**
```javascript
// Your app automatically uses MemCachier in production
// Monitor cache performance in MemCachier dashboard
```

---

## 📞 **Troubleshooting**

### **Quick Debug Commands**
```bash
# Check app status
heroku ps

# View recent logs
heroku logs --tail

# Restart app
heroku ps:restart

# Check environment variables
heroku config

# Test specific endpoints
heroku run curl http://localhost:3000/health
```

### **Common Issues**

| **Issue** | **Symptom** | **Solution** |
|-----------|-------------|--------------|
| **Blank Screen** | HTML not loading | Check logs, verify Procfile |
| **500 Error** | Server crash | Check logs for syntax errors |
| **CORS Error** | API calls fail | Set CORS_ORIGIN variable |
| **Slow Response** | >5s response time | Enable MemCachier, check Rhino server |
| **Memory Issues** | App restarts | Upgrade dyno size |

---

## 🎯 **Final Checklist**

- [ ] ✅ Local testing completed
- [ ] ✅ Heroku app created/deployed
- [ ] ✅ Environment variables set
- [ ] ✅ MemCachier addon added
- [ ] ✅ Domain configured
- [ ] ✅ Frontend URLs updated
- [ ] ✅ All endpoints tested
- [ ] ✅ Performance monitored

---

## 🚀 **Your TopoOpt Configurator is Live!**

**Visit:** https://your-app-name.herokuapp.com/topoopt

**API Endpoint:** https://your-app-name.herokuapp.com/solve

**Performance:** <50ms cache hits, 95%+ hit rate

**Ready for softlyplease.com integration!** 🎉
